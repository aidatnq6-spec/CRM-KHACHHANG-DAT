import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { additionalDatedServices as allAdditionalServices } from "../lib/services";
import { dateAfter, fmtDate, todayVN } from "../lib/domain";

const additionalDatedServices = allAdditionalServices.slice(0, 4);

test("remaining services support all four fields and participate in reminders and today's grouped work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#customers");
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const customerName = "Khách đào tạo đầu tư và dịch vụ khác";
  await dialog.getByLabel(/Tên khách hàng/).fill(customerName);
  await dialog
    .getByRole("checkbox", { name: "Chữ ký số", exact: true })
    .uncheck();
  for (const [i, service] of allAdditionalServices.slice(4).entries()) {
    await dialog
      .getByRole("checkbox", { name: service.label, exact: true })
      .check();
    await dialog
      .getByLabel(`Gói dịch vụ · ${service.label}`, { exact: true })
      .fill(`Gói ${i + 1}`);
    await dialog
      .getByLabel(`Giá tiền (VNĐ) · ${service.label}`, { exact: true })
      .fill(String(i * 100000));
    await dialog
      .getByLabel(`Ngày bắt đầu · ${service.label}`, { exact: true })
      .fill(dateAfter(-30));
    await dialog
      .getByLabel(`Ngày hết hạn · ${service.label}`, { exact: true })
      .fill(dateAfter(i - 1));
  }
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/#reminders");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(customerName);
  await expect(page.locator(".customer-card")).toHaveCount(1);
  await expect(page.locator(".customer-card .service-deadline")).toHaveCount(3);
  await page
    .locator(".customer-card")
    .getByRole("button", { name: "Hồ sơ", exact: true })
    .click();
  await expect(dialog.locator(".service-period-detail")).toHaveCount(4);
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  for (const [i, service] of allAdditionalServices.slice(4).entries()) {
    await expect(
      dialog.getByLabel(`Gói dịch vụ · ${service.label}`, { exact: true }),
    ).toHaveValue(`Gói ${i + 1}`);
    await expect(
      dialog.getByLabel(`Giá tiền (VNĐ) · ${service.label}`, { exact: true }),
    ).toHaveValue(String(i * 100000));
    await expect(
      dialog.getByLabel(`Ngày hết hạn · ${service.label}`, { exact: true }),
    ).toHaveValue(dateAfter(i - 1));
  }
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.goto("/#today");
  const card = page.locator(".work-card").filter({
    has: page.getByRole("button", { name: customerName, exact: true }),
  });
  await expect(card).toHaveCount(1);
  for (const service of allAdditionalServices.slice(4))
    await expect(card.locator(".work-reasons")).toContainText(service.label);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

const name = "Khách kỳ hạn độc lập";
const offsets = [0, 7, 31, -1];
async function createCustomer(page: Page) {
  await page.goto("/#customers");
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Tên khách hàng/).fill(name);
  await dialog
    .getByLabel("Điện thoại / Email", { exact: true })
    .fill("0999876123");
  await dialog.getByLabel("Ngày hết hạn", { exact: true }).fill(dateAfter(180));
  for (const [index, service] of additionalDatedServices.entries()) {
    await dialog
      .getByRole("checkbox", { name: service.label, exact: true })
      .check();
    await dialog
      .getByLabel(`Ngày bắt đầu · ${service.label}`, { exact: true })
      .fill(dateAfter(-100));
    await dialog
      .getByLabel(`Ngày hết hạn · ${service.label}`, { exact: true })
      .fill(dateAfter(offsets[index]));
  }
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}
async function openCustomer(page: Page) {
  await page.goto("/#customers");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(name);
  await page.locator(".desktop-table .customer-name").click();
}

test("four independent periods persist and reminders filter the matching service and range", async ({
  page,
}) => {
  await createCustomer(page);
  await openCustomer(page);
  const dialog = page.getByRole("dialog");
  for (const [index, service] of additionalDatedServices.entries()) {
    const section = dialog.locator(".service-period-detail").filter({
      has: page.getByRole("heading", { name: service.label, exact: true }),
    });
    await expect(section).toContainText(fmtDate(dateAfter(offsets[index])));
    await expect(section).toContainText(fmtDate(dateAfter(-100)));
  }
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.goto("/#reminders");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(name);
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".desktop-table .service-deadline")).toHaveCount(2);
  await expect(page.locator(".desktop-table .service-deadlines")).toContainText(
    "Bảo hiểm xã hội",
  );
  await expect(
    page.locator(".desktop-table .service-deadlines"),
  ).not.toContainText("Phần mềm Khấu trừ thuế TNCN");
  await page
    .getByLabel("Dịch vụ", { exact: true })
    .selectOption("pit_withholding");
  await expect(
    page.getByRole("heading", {
      name: "Không có khách hàng phù hợp",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "90 ngày", exact: true }).click();
  await page
    .getByLabel("Dịch vụ", { exact: true })
    .selectOption("pit_withholding");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(name);
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".desktop-table .service-deadline")).toHaveCount(1);
  await expect(page.locator(".desktop-table .service-deadlines")).toContainText(
    fmtDate(dateAfter(31)),
  );
  await page
    .getByRole("group", { name: "Khoảng nhắc hạn", exact: true })
    .getByRole("button", { name: "Đã hết hạn", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(name);
  await expect(page.locator(".desktop-table .service-deadlines")).toContainText(
    "Căn hộ cho thuê",
  );
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
});

test("date validation focuses the field; deselecting and reselecting preserves saved periods", async ({
  page,
}) => {
  await createCustomer(page);
  await openCustomer(page);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  const end = dialog.getByLabel("Ngày hết hạn · Bảo hiểm xã hội", {
    exact: true,
  });
  await end.fill(dateAfter(-101));
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(end).toBeFocused();
  await expect(
    dialog.getByText("Ngày hết hạn phải từ ngày bắt đầu trở đi.", {
      exact: true,
    }),
  ).toBeVisible();
  await end.fill(todayVN());
  await dialog
    .getByRole("checkbox", { name: "Bảo hiểm xã hội", exact: true })
    .uncheck();
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog.locator(".service-period-detail")).toHaveCount(3);
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  await dialog
    .getByRole("checkbox", { name: "Bảo hiểm xã hội", exact: true })
    .check();
  await expect(end).toHaveValue(todayVN());
  await expect(
    dialog.getByLabel("Ngày bắt đầu · Bảo hiểm xã hội", { exact: true }),
  ).toHaveValue(dateAfter(-100));
  await expect(
    dialog.getByLabel("Ngày hết hạn · Hóa đơn điện tử", { exact: true }),
  ).toHaveValue(dateAfter(7));
  await expect(dialog.getByLabel("Ngày hết hạn", { exact: true })).toHaveValue(
    dateAfter(180),
  );
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog.locator(".service-period-detail")).toHaveCount(4);
});

test("mobile today groups service deadlines on one card and records care once", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await createCustomer(page);
  await page.goto("/#today");
  const card = page
    .locator(".work-card")
    .filter({ has: page.getByRole("button", { name, exact: true }) });
  await expect(card).toHaveCount(1);
  await expect(card.locator(".work-reasons")).toContainText("Bảo hiểm xã hội");
  await expect(card.locator(".work-reasons")).toContainText("Căn hộ cho thuê");
  await expect(card.locator(".work-reasons")).toContainText("Hóa đơn điện tử");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await card.screenshot({
    path: "test-results/service-periods-mobile-today.png",
  });
  await card.getByRole("button", { name: "Đã gọi", exact: true }).click();
  await expect(card).toHaveCount(0);
  await page
    .getByRole("group", { name: "L\u1ecdc c\u00f4ng vi\u1ec7c", exact: true })
    .getByRole("button", { name: /^Sắp đến hẹn/ })
    .click();
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(fmtDate(dateAfter(3)));
});

test("Excel previews, imports and exports independent service dates", async ({
  page,
}) => {
  await page.goto("/#data");
  const headers = [
    "Tên khách hàng",
    "Số điện thoại",
    "Dịch vụ",
    ...additionalDatedServices.flatMap((service) => [
      `Ngày bắt đầu ${service.label}`,
      `Ngày hết hạn ${service.label}`,
    ]),
  ];
  const row = [
    name,
    "0999876123",
    additionalDatedServices.map((service) => service.label).join("; "),
    ...additionalDatedServices.flatMap((_, index) => [
      dateAfter(-100),
      dateAfter(offsets[index]),
    ]),
  ];
  await page
    .locator('input[type=file][accept=".xlsx,.xls,.csv"]')
    .setInputFiles({
      name: "service-periods.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(`${headers.join(",")}\n${row.join(",")}`),
    });
  const dialog = page.getByRole("dialog", {
    name: "Kiểm tra dữ liệu Excel",
    exact: true,
  });
  await expect(dialog).toContainText(
    `Bảo hiểm xã hội: ${fmtDate(dateAfter(-100))} → ${fmtDate(todayVN())}`,
  );
  await dialog
    .getByRole("button", { name: "Xác nhận nhập 1 khách", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const buffer = await readFile((await (await download).path())!);
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
    workbook.Sheets[workbook.SheetNames[0]],
  );
  const exported = rows.find((row) => row["Tên khách hàng"] === name)!;
  for (const [index, service] of additionalDatedServices.entries()) {
    expect(exported[`Ngày bắt đầu ${service.label}`]).toBe(dateAfter(-100));
    expect(exported[`Ngày hết hạn ${service.label}`]).toBe(
      dateAfter(offsets[index]),
    );
  }
  await openCustomer(page);
  await expect(
    page.getByRole("dialog").locator(".service-period-detail"),
  ).toHaveCount(4);
});
