import test from "node:test";
import assert from "node:assert/strict";
import {
  dateAfter,
  deadlineStatus,
  expiring,
  matchingDeadlines,
  serviceDeadlines,
  serviceReminderCustomers,
  todayTasks,
  todayVN,
} from "./domain";
import { additionalDatedServices } from "./services";
import { workQueue } from "./work-queue";
import {
  backupPayload,
  customerExcelRow,
  excelHeaders,
  parseBackup,
  parseGrid,
  planExcelImport,
} from "./transfer";
import { buildScript, defaultTemplates } from "./templates";
import type { Customer } from "./types";

const today = "2026-10-23";
const customer: Customer = {
  id: "multi",
  name: "Nhiều kỳ hạn",
  phone: "0901234567",
  services: [
    "digital_signature",
    ...additionalDatedServices.map((service) => service.id),
  ],
  expireDate: "2027-01-01",
  issueDate: "2026-01-01",
  price: 1200000,
  servicePeriods: {
    social_insurance: { startDate: "2026-01-01", endDate: today },
    e_invoice: { startDate: "2026-01-02", endDate: "2026-11-22" },
    pit_withholding: { endDate: "2026-11-23" },
    apartment_rental: { endDate: "2026-10-22" },
  },
};

test("service deadlines have independent dates and exact 0/7/30/90 day ranges", () => {
  assert.equal(serviceDeadlines(customer, today).length, 5);
  assert.equal(serviceReminderCustomers([customer], 30, today).length, 1);
  assert.deepEqual(
    matchingDeadlines(customer, today, 30).map((period) => period.serviceId),
    ["social_insurance", "e_invoice"],
  );
  assert.equal(
    matchingDeadlines(customer, today, 30, "pit_withholding").length,
    0,
  );
  assert.equal(
    matchingDeadlines(customer, today, "expired")[0].serviceId,
    "apartment_rental",
  );
  for (const days of [0, 7, 30, 90]) {
    const row: Customer = {
      ...customer,
      services: ["social_insurance"],
      servicePeriods: { social_insurance: { endDate: dateAfter(days, today) } },
    };
    assert.equal(serviceReminderCustomers([row], days, today).length, 1);
    assert.equal(serviceReminderCustomers([row], days - 1, today).length, 0);
  }
  assert.equal(
    expiring([customer], 30, today).length,
    0,
    "signature forecasts stay signature-only",
  );
  assert.equal(deadlineStatus(customer, today, "social_insurance"), "expiring");
  assert.equal(
    serviceReminderCustomers([{ ...customer, status: "inactive" }], 90, today)
      .length,
    0,
  );
});

test("unselected, missing and invalid periods are excluded; legacy signature fields remain intact", () => {
  const row: Customer = {
    ...customer,
    services: ["e_invoice", "ai_training"],
    servicePeriods: {
      ...customer.servicePeriods,
      e_invoice: { endDate: "2026-02-30" },
    },
  };
  assert.deepEqual(serviceDeadlines(row, today), []);
  assert.equal(row.expireDate, customer.expireDate);
  assert.equal(
    serviceDeadlines({ id: "old", name: "Old", expireDate: today }, today)[0]
      .serviceId,
    "digital_signature",
  );
});

test("today groups several service reasons on one customer and respects follow-up dates", () => {
  const tasks = todayTasks([customer], today);
  assert.equal(tasks.length, 2);
  assert.match(tasks[0].title, /Căn hộ cho thuê/);
  assert.match(tasks[1].title, /Bảo hiểm xã hội/);
  assert.equal(workQueue([customer], today).length, 1);
  assert.equal(workQueue([customer], today)[0].reasons.length, 2);
  assert.equal(
    workQueue([{ ...customer, followUpDate: "2026-11-01" }], today).length,
    0,
  );
});

test("Excel and JSON preserve each period, reject invalid dates and merge partial imports", () => {
  const entry = parseGrid([
    Object.values(excelHeaders),
    customerExcelRow(customer),
  ])[0];
  assert.deepEqual(entry.errors, []);
  assert.deepEqual(entry.data.servicePeriods, customer.servicePeriods);
  assert.deepEqual(
    parseBackup(backupPayload([customer], "test", "test"))[0].data
      ?.servicePeriods,
    customer.servicePeriods,
  );
  const updates = parseGrid([
    ["Tên khách hàng", "Số điện thoại", "Ngày hết hạn Bảo hiểm xã hội"],
    [customer.name, customer.phone, "2027-01-23"],
  ]);
  const plan = planExcelImport(updates, [customer], "update");
  assert.equal(
    plan.operations[0].data?.servicePeriods?.social_insurance?.startDate,
    "2026-01-01",
  );
  assert.deepEqual(
    plan.operations[0].data?.servicePeriods?.e_invoice,
    customer.servicePeriods?.e_invoice,
  );
  const bad = parseGrid([
    ["Tên khách hàng", "Số điện thoại", "Ngày hết hạn Bảo hiểm xã hội"],
    [customer.name, customer.phone, "2025-01-23"],
  ]);
  const rejected = planExcelImport(bad, [customer], "update");
  assert.equal(rejected.operations.length, 0);
  assert.equal(rejected.periodErrors.length, 1);
  assert.throws(() =>
    parseBackup([
      {
        ...customer,
        servicePeriods: { e_invoice: { startDate: "2026-02-30" } },
      },
    ]),
  );
  assert.throws(() =>
    parseBackup([
      {
        ...customer,
        servicePeriods: {
          e_invoice: { startDate: "2026-10-24", endDate: today },
        },
      },
    ]),
  );
});

test("automatic Zalo reminders name the additional service instead of stale signature dates", () => {
  const row: Customer = {
    ...customer,
    services: ["social_insurance"],
    servicePeriods: { social_insurance: { endDate: todayVN() } },
  };
  const script = buildScript(row, defaultTemplates);
  assert.match(script, /Bảo hiểm xã hội/);
  assert.match(script, /hôm nay/);
  assert.doesNotMatch(script, /Chữ ký số|01\/01\/2027/);
});

test("spreadsheet serial dates support the 1900 and 1904 epochs and raw CSV numbers", () => {
  const serial = Date.parse(today + "T00:00:00Z") / 86400000 + 25569;
  const headers = [
    "Tên khách hàng",
    "Ngày hết hạn",
    "Ngày hết hạn Bảo hiểm xã hội",
  ];
  for (const date1904 of [false, true]) {
    const value = serial - (date1904 ? 1462 : 0);
    const row = parseGrid(
      [headers, ["Serial", value, String(value)]],
      date1904,
    )[0];
    assert.deepEqual(row.errors, []);
    assert.equal(row.data.expireDate, today);
    assert.equal(row.data.servicePeriods?.social_insurance?.endDate, today);
  }
});
