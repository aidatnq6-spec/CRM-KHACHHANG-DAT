import { test, expect } from "@playwright/test";

test("desktop: 30-day queue, customer CRUD, care and renewal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Khách sắp hết hạn trong 30 ngày",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "30 ngày", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0002");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0003");
  await expect(
    page.getByRole("heading", { name: "Không có khách hàng phù hợp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa tìm kiếm" }).click();
  await page.screenshot({
    path: "test-results/desktop-reminders.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Tên khách hàng/).fill("Khách kiểm thử NextJS");
  await dialog.getByLabel("Mã khách hàng", { exact: true }).fill("NEXTJS-TEST");
  await dialog
    .getByLabel("Điện thoại / Email", { exact: true })
    .fill("0998765432");
  await dialog.getByLabel("Gói dịch vụ", { exact: true }).fill("Gói 1 năm");
  await dialog.getByLabel("Giá tiền (VNĐ)").fill("1500000");
  // Date relative to the application's fixed Vietnamese calendar.
  const today = await page.evaluate(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );
  await dialog.getByLabel("Ngày hết hạn", { exact: true }).fill(today);
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("NEXTJS-TEST");
  await page
    .locator(".desktop-table")
    .getByRole("button", { name: "Khách kiểm thử NextJS", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Khách kiểm thử NextJS", exact: true }),
  ).toBeVisible();
  await dialog.getByLabel("Trạng thái", { exact: true }).selectOption("called");
  await dialog
    .getByLabel("Ghi nhận liên hệ", { exact: true })
    .fill("Khách hẹn gọi lại");
  await dialog
    .getByRole("button", { name: "Lưu chăm sóc", exact: true })
    .click();
  await expect(
    dialog.getByText("Khách hẹn gọi lại", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Gia hạn", exact: true }).click();
  await dialog
    .getByLabel("Ngày hết hạn mới", { exact: true })
    .fill("2030-10-22");
  await dialog
    .getByRole("button", { name: "Lưu gia hạn", exact: true })
    .click();
  await expect(dialog.getByText("22/10/2030", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Sửa", exact: true }).click();
  await dialog
    .getByLabel("Ghi chú", { exact: true })
    .fill("Đã kiểm tra cập nhật");
  await dialog
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(
    dialog.getByText("Đã kiểm tra cập nhật", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Xóa khách hàng", exact: true })
    .click();
  await dialog.getByLabel("Nhập XOA để xóa khách", { exact: true }).fill("XOA");
  await dialog
    .getByRole("button", { name: "Xóa vĩnh viễn", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile: navigation, filters, profile, reports and transfer tools", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Khách sắp hết hạn trong 30 ngày",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-reminders.png" });
  await page.getByRole("button", { name: "Bộ lọc" }).click();
  await page
    .getByLabel("Trạng thái chăm sóc", { exact: true })
    .selectOption("not_contacted");
  await expect(page.locator(".customer-card").first()).toBeVisible();
  await page
    .locator(".customer-card")
    .first()
    .getByRole("button", { name: "Hồ sơ", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-profile.png" });
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Điều hướng điện thoại" })
    .getByRole("button", { name: "Thêm mục", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Báo cáo & phân tích", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Hiệu quả chăm sóc 6 tháng",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Điều hướng điện thoại" })
    .getByRole("button", { name: "Thêm mục", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Quản lý dữ liệu", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nhập & xuất Excel", exact: true }),
  ).toBeVisible();
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "test.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        customers: [
          {
            id: "import-test",
            data: {
              name: "Khách từ JSON",
              expireDate: "2030-10-22",
              extra: "preserved",
            },
          },
        ],
      }),
    ),
  });
  await expect(
    page.getByRole("dialog", { name: "Xác nhận khôi phục JSON", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Nhập KHOI PHUC để xác nhận", { exact: true })
    .fill("KHOI PHUC");
  await page
    .getByRole("button", { name: "Khôi phục dữ liệu", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("Excel import preview and Zalo templates remain usable", async ({
  page,
}) => {
  await page.goto("/#data");
  await expect(
    page.getByRole("heading", { name: "Nhập & xuất Excel", exact: true }),
  ).toBeVisible();
  await page
    .locator('input[type=file][accept=".xlsx,.xls,.csv"]')
    .setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "Tên khách hàng,Số điện thoại,Ngày hết hạn,Giá tiền\nKhách CSV,0987654321,2030-10-22,1200000",
      ),
    });
  await expect(
    page.getByRole("dialog", { name: "Kiểm tra dữ liệu Excel", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Khách CSV", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xác nhận nhập 1 khách", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/#zalo");
  await page.getByRole("button", { name: "Quản lý mẫu", exact: true }).click();
  await page.getByLabel("Tên mẫu", { exact: true }).fill("Mẫu thử nghiệm");
  await page.getByRole("button", { name: "Lưu mẫu", exact: true }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("crm_cks_zalo_templates_v1"),
    ),
  ).toContain("Mẫu thử nghiệm");
});
