import test from "node:test";
import assert from "node:assert/strict";
import { Timestamp } from "firebase/firestore";
import {
  backupPayload,
  excelSafe,
  parseBackup,
  parseGrid,
  planExcelImport,
  customerExcelRow,
  excelHeaders,
} from "./transfer";
import type { Customer } from "./types";
test("JSON nguồn giữ ID, trường bổ sung, history, careLogs và phục hồi timestamp", () => {
  const row: Customer = {
    id: "old-id",
    name: "Khách",
    extra: { arbitrary: 1 },
    history: [{ price: 200 }],
    careLogs: [{ title: "Gọi" }],
    createdAt: new Timestamp(100, 12),
  };
  const raw = JSON.parse(
    JSON.stringify(backupPayload([row], "test@example.test", "uid")),
  );
  const parsed = parseBackup(raw)[0];
  assert.equal(parsed.id, "old-id");
  assert.deepEqual(parsed.data?.extra, { arbitrary: 1 });
  assert.ok(parsed.data?.createdAt instanceof Timestamp);
  assert.equal(parsed.data?.history?.[0].price, 200);
});

test("services round-trip through Excel and JSON; invalid names are reported", () => {
  const customer: Customer = {
    id: "multi",
    name: "Khách nhiều dịch vụ",
    services: ["digital_signature", "e_invoice", "ai_training"],
    phone: "0901234567",
  };
  const parsed = parseGrid([
    Object.values(excelHeaders),
    customerExcelRow(customer),
  ]);
  assert.deepEqual(parsed[0].data.services, customer.services);
  assert.equal(parsed[0].errors.length, 0);
  const restored = parseBackup(
    JSON.parse(
      JSON.stringify(backupPayload([customer], "test@example.test", "uid")),
    ),
  )[0];
  assert.deepEqual(restored.data?.services, customer.services);
  assert.throws(() =>
    parseBackup({
      customers: [{ id: "a", data: { name: "Khách", services: ["unknown"] } }],
    }),
  );
  assert.equal(
    parseGrid([
      ["Tên khách hàng", "Dịch vụ"],
      ["Sai dịch vụ", "Không có trong danh mục"],
    ])[0].errors.length,
    1,
  );
});

test("old/blank Excel service columns preserve existing classifications when updating", () => {
  const entries = parseGrid([
    ["Tên khách hàng", "Số điện thoại", "Dịch vụ"],
    ["Khách", "0901234567", ""],
  ]);
  const existing: Customer[] = [
    { id: "ai", name: "Khách", phone: "0901234567", services: ["ai_training"] },
  ];
  const plan = planExcelImport(entries, existing, "update");
  assert.equal(plan.operations[0].data?.services, undefined);
  const exported = customerExcelRow({ id: "legacy", name: "Cũ" });
  assert.equal(
    exported[Object.keys(excelHeaders).indexOf("services")],
    "Chữ ký số",
  );
});
test("JSON chặn ID đường dẫn và ID trùng trước khi ghi", () => {
  assert.throws(() =>
    parseBackup({ customers: [{ id: "a/b", data: { name: "X" } }] }),
  );
  assert.throws(() =>
    parseBackup({
      customers: [
        { id: "a", name: "X" },
        { id: "a", name: "Y" },
      ],
    }),
  );
});
test("Excel giữ số điện thoại, ngày serial, VNĐ và báo dòng sai", () => {
  const rows = parseGrid([
    ["Tên khách hàng", "Số điện thoại", "Ngày hết hạn", "Giá tiền"],
    ["An", "0901234567", 46317, "1.200.000"],
    ["Bình", "", "31/02/2026", -2],
  ]);
  assert.equal(rows[0].data.phone, "0901234567");
  assert.equal(rows[0].data.expireDate, "2026-10-22");
  assert.equal(rows[0].data.price, 1200000);
  assert.equal(rows[1].errors.length, 2);
});
test("Excel xử lý trùng cả trong file, cập nhật chỉ trường có trong file", () => {
  const entries = parseGrid([
    ["Tên khách hàng", "Số điện thoại"],
    ["Khách A", "0901234567"],
    ["Khách B", "+84901234567"],
  ]);
  const plan = planExcelImport(entries, [], "skip");
  assert.equal(plan.added, 1);
  assert.equal(plan.skipped, 1);
  const update = planExcelImport(
    entries,
    [{ id: "a", name: "Cũ", phone: "0901234567", note: "giữ" }],
    "update",
  );
  assert.equal(update.operations.length, 1);
  assert.equal(update.operations[0].data?.name, "Khách B");
  assert.equal(update.operations[0].data?.note, undefined);
  assert.equal(excelSafe("=HYPERLINK(...)"), "'=HYPERLINK(...)");
});
