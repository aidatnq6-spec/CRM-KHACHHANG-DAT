import test from "node:test";
import assert from "node:assert/strict";
import { additionalDatedServices } from "./services";
import {
  backupPayload,
  customerExcelRow,
  excelHeaders,
  parseBackup,
  parseGrid,
  planExcelImport,
} from "./transfer";
import type { Customer } from "./types";

const customer: Customer = {
  id: "prices",
  name: "Gói giá",
  phone: "0999876000",
  pkg: "1",
  price: 1200000,
  services: [
    "digital_signature",
    ...additionalDatedServices.map((service) => service.id),
  ],
  servicePeriods: Object.fromEntries(
    additionalDatedServices.map((service, i) => [
      service.id,
      {
        pkg: `Gói riêng ${i}`,
        price: i * 100000,
        startDate: "2026-01-01",
        endDate: "2027-01-01",
      },
    ]),
  ),
};

test("four independent packages/prices including zero round-trip Excel and JSON", () => {
  const row = parseGrid([
    Object.values(excelHeaders),
    customerExcelRow(customer),
  ])[0];
  assert.deepEqual(row.errors, []);
  assert.deepEqual(row.data.servicePeriods, customer.servicePeriods);
  assert.equal(row.data.price, customer.price);
  assert.deepEqual(
    parseBackup(backupPayload([customer], "test", "test"))[0].data
      ?.servicePeriods,
    customer.servicePeriods,
  );
});

test("partial Excel package/price updates preserve dates, sibling services and omitted prices", () => {
  const rows = parseGrid([
    [
      "Tên khách hàng",
      "Số điện thoại",
      "Gói dịch vụ Bảo hiểm xã hội",
      "Giá tiền (VNĐ) Bảo hiểm xã hội",
      "Giá tiền (VNĐ) Hóa đơn điện tử",
    ],
    [customer.name, customer.phone, "Gói mới", "250.000 đ", ""],
  ]);
  const updated = planExcelImport(rows, [customer], "update").operations[0]
    .data!;
  assert.deepEqual(updated.servicePeriods?.social_insurance, {
    ...customer.servicePeriods?.social_insurance,
    pkg: "Gói mới",
    price: 250000,
  });
  assert.deepEqual(
    updated.servicePeriods?.e_invoice,
    customer.servicePeriods?.e_invoice,
  );
  assert.equal(updated.price, undefined, "signature price must not be patched");
});

test("invalid service prices/packages are rejected before import", () => {
  for (const price of [-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    const rows = parseGrid([
      ["Tên khách hàng", "Giá tiền (VNĐ) Bảo hiểm xã hội"],
      [customer.name, price],
    ]);
    assert.equal(rows[0].errors.length, 1);
    assert.equal(planExcelImport(rows, [], "update").operations.length, 0);
    assert.throws(() =>
      parseBackup([
        { ...customer, servicePeriods: { social_insurance: { price } } },
      ]),
    );
  }
  assert.throws(() =>
    parseBackup([
      { ...customer, servicePeriods: { social_insurance: { pkg: 123 } } },
    ]),
  );
  assert.throws(() =>
    parseBackup([
      {
        ...customer,
        servicePeriods: { social_insurance: { price: "100000" } },
      },
    ]),
  );
});
