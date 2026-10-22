import test from "node:test";
import assert from "node:assert/strict";
import {
  daysLeft,
  expiring,
  todayVN,
  normalizeDate,
  statusOf,
  nextFollowUp,
  duplicateOf,
  lifetimeValue,
  dataIssues,
} from "./domain";
import type { Customer } from "./types";
const customer = (
  expireDate: string,
  other: Partial<Customer> = {},
): Customer => ({ id: "a", name: "Khách A", expireDate, ...other });
test("30 ngày bao gồm hôm nay và ngày thứ 30, loại quá hạn/ngày sai/inactive", () => {
  const rows = [
    customer("2026-10-22"),
    customer("2026-11-21"),
    customer("2026-11-22"),
    customer("2026-10-21"),
    customer("2026-02-30"),
    customer(""),
    customer("2026-10-23", { status: "inactive" }),
  ];
  assert.deepEqual(
    expiring(rows, 30, "2026-10-22").map((x) => x.expireDate),
    ["2026-10-22", "2026-11-21"],
  );
  assert.equal(daysLeft("2026-11-21", "2026-10-22"), 30);
  assert.equal(statusOf(rows[4], "2026-10-22"), "unknown");
});
test("ngày Việt Nam độc lập múi giờ host và không nhận ngày vô hiệu", () => {
  assert.equal(todayVN(new Date("2026-10-21T18:00:00Z")), "2026-10-22");
  assert.equal(normalizeDate("31/02/2026"), "");
  assert.equal(normalizeDate("22/10/26"), "2026-10-22");
  assert.equal(normalizeDate(46317), "2026-10-22");
});
test("tự hẹn theo nghiệp vụ nguồn", () => {
  assert.equal(
    nextFollowUp("zalo_sent", "2026-10-22")?.followUpDate,
    "2026-10-24",
  );
  assert.equal(
    nextFollowUp("called", "2026-10-22")?.followUpDate,
    "2026-10-25",
  );
  assert.equal(
    nextFollowUp("waiting", "2026-10-22")?.followUpDate,
    "2026-10-23",
  );
  assert.equal(nextFollowUp("renewed")?.followUpDate, "");
});
test("trùng điện thoại +84, mã và tên không dấu; không coi MST đơn độc là khóa mới", () => {
  const rows = [customer("", { phone: "0901234567", customId: "KH01" })];
  assert.equal(
    duplicateOf({ phone: "+84 901 234 567" }, rows)?.strength,
    "strong",
  );
  assert.equal(duplicateOf({ customId: "kh01" }, rows)?.customer.id, "a");
  assert.equal(duplicateOf({ phone: "0901234567" }, rows, "a"), undefined);
});
test("LTV không đếm lại giao dịch hiện tại khi history đã có", () => {
  const k = customer("2027-10-22", {
    issueDate: "2026-10-22",
    price: 100,
    pkg: "1",
    history: [
      { date: "2026-10-22", expire: "2027-10-22", price: 100, pkg: "1" },
      { date: "2025-10-22", expire: "2026-10-22", price: 80 },
    ],
  });
  assert.equal(lifetimeValue(k), 180);
  assert.ok(dataIssues(customer("wrong")).includes("Ngày hết hạn sai"));
});
