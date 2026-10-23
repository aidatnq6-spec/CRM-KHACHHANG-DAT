import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { additionalDatedServices } from "../lib/services";
import { dateAfter, money } from "../lib/domain";

const name = "Khách gói giá đa dịch vụ";
const packages = [
  "BHXH 12 tháng",
  "500 số hóa đơn",
  "100 chứng từ",
  "Thuê 6 tháng",
  "AI cơ bản",
  "Khóa đầu tư 6 buổi",
  "Tư vấn 12 tháng",
  "Gói tùy chọn",
];
const prices = [250000, 500000, 0, 15000000, 2000000, 3000000, 1500000, 0];
async function createCustomer(page: Page) {
  await page.goto("/#customers");
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Tên khách hàng/).fill(name);
  await dialog.getByLabel("Giá tiền (VNĐ)", { exact: true }).fill("1200000");
  for (const [index, service] of additionalDatedServices.entries()) {
    await dialog
      .getByRole("checkbox", { name: service.label, exact: true })
      .check();
    await dialog
      .getByLabel(`Gói dịch vụ · ${service.label}`, { exact: true })
      .fill(packages[index]);
    await dialog
      .getByLabel(`Giá tiền (VNĐ) · ${service.label}`, { exact: true })
      .fill(String(prices[index]));
    await dialog
      .getByLabel(`Ngày bắt đầu · ${service.label}`, { exact: true })
      .fill(dateAfter(-30));
    await dialog
      .getByLabel(`Ngày hết hạn · ${service.label}`, { exact: true })
      .fill(dateAfter(30));
  }
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}

test("independent packages/prices persist in profiles and package filtering follows the selected service", async ({
  page,
}) => {
  await createCustomer(page);
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(name);
  await page.locator(".desktop-table .customer-name").click();
  const dialog = page.getByRole("dialog");
  for (const [index, service] of additionalDatedServices.entries()) {
    const section = dialog.locator(".service-period-detail").filter({
      has: page.getByRole("heading", { name: service.label, exact: true }),
    });
    await expect(section).toContainText(packages[index]);
    await expect(section).toContainText(money(prices[index]));
  }
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  await expect(
    dialog.getByLabel("Giá tiền (VNĐ)", { exact: true }),
  ).toHaveValue("1200000");
  for (const [index, service] of additionalDatedServices.entries()) {
    await expect(
      dialog.getByLabel(`Gói dịch vụ · ${service.label}`, { exact: true }),
    ).toHaveValue(packages[index]);
    await expect(
      dialog.getByLabel(`Giá tiền (VNĐ) · ${service.label}`, { exact: true }),
    ).toHaveValue(String(prices[index]));
  }
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByLabel("Dịch vụ", { exact: true })
    .selectOption("social_insurance");
  await page
    .getByLabel("Gói dịch vụ", { exact: true })
    .selectOption(packages[0]);
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await page.getByLabel("Dịch vụ", { exact: true }).selectOption("e_invoice");
  await expect(page.getByLabel("Gói dịch vụ", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Gói dịch vụ", { exact: true }).locator("option"),
  ).toHaveText(["Tất cả gói", packages[1]]);
});

test("mobile validates service prices and preserves saved package, price and dates when deselected", async ({
  page,
}) => {
  await createCustomer(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(name);
  await page
    .locator(".customer-card")
    .getByRole("button", { name: "Hồ sơ", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  const price = dialog.getByLabel("Giá tiền (VNĐ) · Bảo hiểm xã hội", {
    exact: true,
  });
  for (const invalid of ["-1", "1.5"]) {
    await price.fill(invalid);
    await dialog
      .getByRole("button", { name: "Lưu khách hàng", exact: true })
      .click();
    await expect(price).toBeFocused();
    await expect(
      dialog.getByText("Nhập giá tiền là số nguyên không âm.", { exact: true }),
    ).toBeVisible();
  }
  await price.fill(String(prices[0]));
  await price.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/service-prices-mobile-form.png",
  });
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await dialog
    .getByRole("checkbox", { name: "Bảo hiểm xã hội", exact: true })
    .uncheck();
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  await dialog
    .getByRole("checkbox", { name: "Bảo hiểm xã hội", exact: true })
    .check();
  await expect(price).toHaveValue(String(prices[0]));
  await expect(
    dialog.getByLabel("Gói dịch vụ · Bảo hiểm xã hội", { exact: true }),
  ).toHaveValue(packages[0]);
  await expect(
    dialog.getByLabel("Ngày hết hạn · Bảo hiểm xã hội", { exact: true }),
  ).toHaveValue(dateAfter(30));
  await price.fill("0");
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog.locator(".service-period-detail").first()).toContainText(
    money(0),
  );
});

test("Excel imports and exports all eight packages and prices including zero", async ({
  page,
}) => {
  await page.goto("/#data");
  const headers = [
    "Tên khách hàng",
    "Dịch vụ",
    ...additionalDatedServices.flatMap((service) => [
      `Gói dịch vụ ${service.label}`,
      `Giá tiền (VNĐ) ${service.label}`,
    ]),
  ];
  const row = [
    name,
    additionalDatedServices.map((service) => service.label).join("; "),
    ...additionalDatedServices.flatMap((_, i) => [
      packages[i],
      String(prices[i]),
    ]),
  ];
  await page
    .locator('input[type=file][accept=".xlsx,.xls,.csv"]')
    .setInputFiles({
      name: "prices.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(`${headers.join(",")}\n${row.join(",")}`),
    });
  const dialog = page.getByRole("dialog", {
    name: "Kiểm tra dữ liệu Excel",
    exact: true,
  });
  await expect(dialog).toContainText(packages[0]);
  await expect(dialog).toContainText(money(prices[0]));
  await dialog
    .getByRole("button", { name: "Xác nhận nhập 1 khách", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const buffer = await readFile((await (await download).path())!);
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
    workbook.Sheets[workbook.SheetNames[0]],
  );
  const exported = rows.find((row) => row["Tên khách hàng"] === name)!;
  for (const [index, service] of additionalDatedServices.entries()) {
    expect(exported[`Gói dịch vụ ${service.label}`]).toBe(packages[index]);
    expect(exported[`Giá tiền (VNĐ) ${service.label}`]).toBe(prices[index]);
  }
});
