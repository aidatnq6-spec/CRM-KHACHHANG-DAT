import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { serviceCatalog } from "../lib/services";
import { todayVN } from "../lib/domain";

test("legacy customer supports all nine services, exact filtering and compact profile disclosure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#customers");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0001");
  await page.locator(".desktop-table .customer-name").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".profile-services .service-chip")).toHaveText([
    "Chữ ký số",
  ]);
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  for (const service of serviceCatalog)
    await dialog
      .getByRole("checkbox", { name: service.label, exact: true })
      .check();
  await expect(
    dialog.getByLabel("Giá tiền (VNĐ)", { exact: true }),
  ).toHaveValue("1200000");
  await expect(dialog.getByLabel("Ngày hết hạn", { exact: true })).toHaveValue(
    todayVN(),
  );
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: "V\u1eabn l\u01b0u th\u00f4ng tin",
      exact: true,
    })
    .click();
  await expect(dialog.locator(".profile-services .service-chip")).toHaveText(
    serviceCatalog.map((service) => service.label),
  );
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByLabel("Dịch vụ", { exact: true }).selectOption("ai_training");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".desktop-table .service-chip").first()).toHaveText(
    "Đào tạo AI",
  );
  await page
    .getByRole("button", {
      name: "Xem toàn bộ 9 dịch vụ của Công ty Minh Anh",
      exact: true,
    })
    .filter({ visible: true })
    .click();
  await expect(dialog.locator(".profile-services .service-chip")).toHaveCount(
    9,
  );
});

test("service-only customer can be created and service filtering combines with care and resets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#customers");
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Tên khách hàng/).fill("Khách đào tạo nhiều dịch vụ");
  await dialog
    .getByRole("checkbox", { name: "Chữ ký số", exact: true })
    .uncheck();
  await dialog
    .getByRole("checkbox", { name: "Đào tạo AI", exact: true })
    .check();
  await dialog
    .getByRole("checkbox", { name: "Đào tạo đầu tư tài chính", exact: true })
    .check();
  await expect(
    dialog.getByLabel("Ngày hết hạn", { exact: true }),
  ).not.toBeVisible();
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByLabel("Dịch vụ", { exact: true })
    .selectOption("financial_training");
  await page
    .getByLabel("Trạng thái chăm sóc", { exact: true })
    .selectOption("not_contacted");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".desktop-table tbody tr")).toContainText(
    "Khách đào tạo nhiều dịch vụ",
  );
  await expect(page.locator(".desktop-table tbody tr")).toContainText(
    "Chưa có ngày hết hạn",
  );
  await page.getByLabel("Dịch vụ", { exact: true }).selectOption("e_invoice");
  await expect(
    page.getByRole("heading", {
      name: "Không có khách hàng phù hợp",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator(".list-caption")
    .getByRole("button", { name: "Xóa bộ lọc", exact: true })
    .click();
  await expect(page.getByLabel("Dịch vụ", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Trạng thái chăm sóc", { exact: true }),
  ).toHaveValue("");
});

test("deselecting and reselecting signature preserves its dates and price and controls expiry membership", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#customers");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0001");
  await page.locator(".desktop-table .customer-name").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  const issue = await dialog
    .getByLabel("Ngày cấp", { exact: true })
    .inputValue();
  await dialog
    .getByRole("checkbox", { name: "Chữ ký số", exact: true })
    .uncheck();
  await dialog
    .getByRole("checkbox", { name: "Bảo hiểm xã hội", exact: true })
    .check();
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: "V\u1eabn l\u01b0u th\u00f4ng tin",
      exact: true,
    })
    .click();
  await expect(
    dialog.getByRole("heading", {
      name: "Thông tin chữ ký số đã lưu",
      exact: true,
    }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.goto("/#reminders");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0001");
  await expect(
    page.getByRole("heading", {
      name: "Không có khách hàng phù hợp",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/#customers");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0001");
  await page.locator(".desktop-table .customer-name").click();
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  await dialog
    .getByRole("checkbox", { name: "Chữ ký số", exact: true })
    .check();
  await expect(dialog.getByLabel("Ngày cấp", { exact: true })).toHaveValue(
    issue,
  );
  await expect(dialog.getByLabel("Ngày hết hạn", { exact: true })).toHaveValue(
    todayVN(),
  );
  await expect(
    dialog.getByLabel("Giá tiền (VNĐ)", { exact: true }),
  ).toHaveValue("1200000");
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: "V\u1eabn l\u01b0u th\u00f4ng tin",
      exact: true,
    })
    .click();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.goto("/#reminders");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0001");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
});

test("mobile validates a service selection and supports all services without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#customers");
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel(/Tên khách hàng/)
    .fill("Khách dịch vụ trên điện thoại");
  await dialog
    .getByRole("checkbox", { name: "Chữ ký số", exact: true })
    .uncheck();
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(
    dialog.getByText("Chọn ít nhất một dịch vụ.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("checkbox", { name: "Chữ ký số", exact: true }),
  ).toBeFocused();
  for (const service of serviceCatalog)
    await dialog
      .getByRole("checkbox", { name: service.label, exact: true })
      .check();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
  await page
    .getByLabel("Dịch vụ", { exact: true })
    .selectOption("pit_withholding");
  await expect(page.locator(".customer-card")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page
    .locator(".customer-card")
    .getByRole("button", { name: "Hồ sơ", exact: true })
    .click();
  await expect(dialog.locator(".profile-services .service-chip")).toHaveCount(
    9,
  );
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
});

test("Excel imports service labels, previews them, and exports the selected services", async ({
  page,
}) => {
  await page.goto("/#data");
  const services = "Bảo hiểm xã hội; Phần mềm Khấu trừ thuế TNCN; Khác";
  await page
    .locator('input[type=file][accept=".xlsx,.xls,.csv"]')
    .setInputFiles({
      name: "services.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `Tên khách hàng,Số điện thoại,Dịch vụ\nKhách dịch vụ CSV,0999111222,${services}`,
      ),
    });
  const dialog = page.getByRole("dialog", {
    name: "Kiểm tra dữ liệu Excel",
    exact: true,
  });
  await expect(
    dialog.getByRole("cell", { name: services, exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Xác nhận nhập 1 khách", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/#customers");
  await page
    .getByLabel("Dịch vụ", { exact: true })
    .selectOption("pit_withholding");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".desktop-table tbody tr")).toContainText(
    "Khách dịch vụ CSV",
  );
  await page.goto("/#data");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const buffer = await readFile((await (await download).path())!);
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
    workbook.Sheets[workbook.SheetNames[0]],
  );
  expect(
    rows.find((row) => row["Tên khách hàng"] === "Khách dịch vụ CSV")?.[
      "Dịch vụ"
    ],
  ).toBe(services);
});
