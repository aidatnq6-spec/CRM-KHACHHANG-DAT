import test from "node:test";
import assert from "node:assert/strict";
import {
  serviceCatalog,
  servicesOf,
  hasSignature,
  parseServices,
  servicesText,
} from "./services";
import { dataIssues, expiring, statusOf, todayTasks } from "./domain";
import { dashboardData } from "./dashboard";
import type { Customer } from "./types";
const customer: Customer = {
  id: "legacy",
  name: "Khách cũ",
  expireDate: "2026-10-24",
  pkg: "1",
  price: 100,
  phone: "0901234567",
};

test("legacy customers default to signature without mutating stored data", () => {
  assert.deepEqual(servicesOf(customer), ["digital_signature"]);
  assert.equal(hasSignature(customer), true);
  assert.equal(Object.hasOwn(customer, "services"), false);
  assert.equal(servicesText(customer), "Chữ ký số");
  assert.equal(serviceCatalog.length, 9);
});
test("multiple services normalize, preserve explicit selections and accept catalog labels or IDs", () => {
  assert.deepEqual(
    parseServices("Chữ ký số; Đào tạo AI; Hóa đơn điện tử; Đào tạo AI"),
    ["digital_signature", "e_invoice", "ai_training"],
  );
  assert.deepEqual(parseServices("Bao hiem xa hoi | pit_withholding"), [
    "social_insurance",
    "pit_withholding",
  ]);
  assert.deepEqual(
    servicesOf({ services: ["ai_training", "ai_training", "other"] }),
    ["ai_training", "other"],
  );
  assert.equal(hasSignature({ services: ["ai_training"] }), false);
  assert.deepEqual(parseServices("Chưa phân loại"), []);
  assert.throws(() => parseServices("Một dịch vụ chưa có"));
  assert.throws(() => parseServices([12]));
  for (const service of serviceCatalog)
    assert.deepEqual(parseServices(service.label), [service.id]);
});
test("service-only customers keep signature data but do not create signature expiry work or warnings", () => {
  const row: Customer = { ...customer, services: ["ai_training"] };
  assert.equal(row.expireDate, customer.expireDate);
  assert.deepEqual(expiring([row], 30, "2026-10-23"), []);
  assert.equal(statusOf(row, "2026-10-23"), "unknown");
  assert.equal(todayTasks([row], "2026-10-23").length, 0);
  assert.deepEqual(
    dataIssues({
      id: "ai",
      name: "AI",
      phone: "0901234567",
      services: ["ai_training"],
    }),
    [],
  );
  assert.equal(
    dashboardData([row], "2026-10-23").months.flatMap(
      (month) => month.customers,
    ).length,
    0,
  );
  assert.equal(
    todayTasks([{ ...row, followUpDate: "2026-10-23" }], "2026-10-23").length,
    1,
  );
});
