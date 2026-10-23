import test from "node:test";
import assert from "node:assert/strict";
import { careResults, dashboardData } from "./dashboard";
import type { Customer } from "./types";
const today = "2026-10-23";
const customer = (id: string, patch: Partial<Customer> = {}): Customer => ({
  id,
  name: id,
  status: "active",
  price: 100,
  ...patch,
});

test("dashboard KPIs match queues, expiry boundaries and the existing forecast", () => {
  const data = dashboardData(
    [
      customer("late", { followUpDate: "2026-10-22", expireDate: today }),
      customer("seven", { expireDate: "2026-10-30", careStatus: "called" }),
      customer("thirty", { expireDate: "2026-11-22", price: 0 }),
      customer("past", { expireDate: "2026-10-22" }),
      customer("inactive", {
        status: "inactive",
        expireDate: today,
        followUpDate: "2026-10-21",
      }),
    ],
    today,
  );
  assert.deepEqual(
    data.overdue.map((item) => item.customer.id),
    ["late"],
  );
  assert.deepEqual(
    data.soon7.map((row) => row.id),
    ["late", "seven"],
  );
  assert.deepEqual(
    data.uncontacted.map((row) => row.id),
    ["late", "thirty"],
  );
  assert.equal(data.forecast, 280);
  assert.equal(data.missingPrice, 1);
});

test("calendar is today plus six days and excludes closed/inactive appointments", () => {
  const data = dashboardData(
    [
      customer("today", { followUpDate: today }),
      customer("six", { followUpDate: "2026-10-29" }),
      customer("seven", { followUpDate: "2026-10-30" }),
      customer("closed", { followUpDate: today, careStatus: "renewed" }),
      customer("inactive", { followUpDate: today, status: "inactive" }),
    ],
    today,
  );
  assert.equal(data.calendar.length, 7);
  assert.deepEqual(
    data.calendar[0].customers.map((row) => row.id),
    ["today"],
  );
  assert.deepEqual(
    data.calendar[6].customers.map((row) => row.id),
    ["six"],
  );
});

test("expiry chart rolls across year/leap boundaries and excludes past/invalid/inactive dates", () => {
  const data = dashboardData(
    [
      customer("today", { expireDate: "2027-12-31" }),
      customer("leap", { expireDate: "2028-02-29" }),
      customer("past", { expireDate: "2027-12-30" }),
      customer("invalid", { expireDate: "2028-02-30" }),
      customer("inactive", { expireDate: "2028-02-29", status: "inactive" }),
      customer("outside", { expireDate: "2028-06-01" }),
    ],
    "2027-12-31",
  );
  assert.deepEqual(
    data.months.map((month) => month.key),
    ["2027-12", "2028-01", "2028-02", "2028-03", "2028-04", "2028-05"],
  );
  assert.equal(data.months[2].end, "2028-02-29");
  assert.deepEqual(
    data.months.flatMap((month) => month.customers.map((row) => row.id)),
    ["today", "leap"],
  );
});

test("care results deduplicate, use Vietnamese dates, ignore copy/schedule and keep outcome groups independent", () => {
  const rows = [
    customer("contact", {
      careLogs: [
        { type: "care", status: "called", createdAt: "2026-10-16T17:00:00Z" },
        { type: "care", status: "waiting", createdAt: "2026-10-23T02:00:00Z" },
      ],
    }),
    customer("copy", {
      careLogs: [
        { type: "zalo", status: "called", script: "copy", createdAt: today },
      ],
    }),
    customer("scheduled", {
      careLogs: [{ type: "appointment", status: "called", createdAt: today }],
    }),
    customer("renewed", { history: [{ date: today }, { date: today }] }),
    customer("current", { history: [{ date: today, _isCurrent: true }] }),
    customer("future", {
      careLogs: [{ status: "called", createdAt: "2026-10-23T17:00:00Z" }],
    }),
    customer("old", {
      careLogs: [{ status: "called", createdAt: "2026-10-16T16:59:59Z" }],
    }),
    customer("invalid", {
      careLogs: [{ status: "called", createdAt: "2026-09-31T05:00:00Z" }],
    }),
    customer("no-zone", {
      careLogs: [{ status: "called", createdAt: "2026-10-23T05:00:00" }],
    }),
  ];
  const data = careResults(rows, 7, today);
  assert.equal(data.from, "2026-10-17");
  assert.deepEqual(
    data.contacted.map((row) => row.id),
    ["contact"],
  );
  assert.deepEqual(
    data.renewed.map((row) => row.id),
    ["renewed"],
  );
  assert.equal(careResults(rows, 30, today).contacted.length, 2);
  assert.equal(careResults([], 90, today).renewed.length, 0);
});

test("empty dashboard keeps seven days, six zero months and a zero estimate", () => {
  const data = dashboardData([], today);
  assert.equal(data.calendar.length, 7);
  assert.equal(data.months.length, 6);
  assert.equal(
    data.months.reduce((sum, month) => sum + month.customers.length, 0),
    0,
  );
  assert.equal(data.forecast, 0);
  assert.equal(data.priority.length, 0);
  assert.equal(data.overdue.length, 0);
});
