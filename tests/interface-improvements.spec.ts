import { test, expect } from "@playwright/test";

test("customer form: inline errors, visible save action and supplementary data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const save = dialog.getByRole("button", {
    name: "Lưu khách hàng",
    exact: true,
  });
  await expect(save).toBeInViewport();
  expect(
    await save.evaluate((button) => {
      const bounds = button.getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight;
    }),
  ).toBe(true);
  await dialog.locator('[name="name"]').fill("   ");
  await dialog.locator('[name="price"]').fill("-1");
  await dialog.locator('[name="issueDate"]').fill("2030-01-02");
  await dialog.locator('[name="expireDate"]').fill("2030-01-01");
  await save.click();
  await expect(dialog.locator('[name="name"]')).toBeFocused();
  await expect(dialog.locator('[name="name"]')).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    dialog.getByText("Nhập giá tiền là số nguyên không âm."),
  ).toBeVisible();
  await expect(
    dialog.getByText("Ngày hết hạn phải từ ngày cấp trở đi."),
  ).toBeVisible();
  await dialog.locator('[name="name"]').fill("Khách giao diện mới");
  await dialog.locator('[name="price"]').fill("1500000");
  await dialog.locator('[name="expireDate"]').fill("2031-01-02");
  await dialog.locator(".form-supplement summary").click();
  await dialog
    .getByLabel("Ghi chú", { exact: true })
    .fill("Giữ ghi chú khi thu gọn");
  await dialog.locator(".form-supplement summary").click();
  await save.click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/#customers");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("Khách giao diện mới");
  await page
    .locator(".customer-card")
    .getByRole("button", { name: "Hồ sơ", exact: true })
    .click();
  await expect(
    dialog
      .locator(".note-block")
      .getByText("Giữ ghi chú khi thu gọn", { exact: true }),
  ).toBeVisible();
});

test("quick filters combine, clear independently, and the summary opens uncontacted customers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await page
    .locator(".stats-grid")
    .getByRole("button", { name: /Chưa liên hệ/ })
    .click();
  await expect(
    page.getByLabel("Trạng thái chăm sóc", { exact: true }),
  ).toHaveValue("not_contacted");
  const quick = page.getByRole("group", { name: "Lọc nhanh khách hàng" });
  await quick
    .getByRole("button", { name: "Hết hạn hôm nay", exact: true })
    .click();
  await quick
    .getByRole("button", { name: "Lịch hẹn đến hạn", exact: true })
    .click();
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".desktop-table tbody tr")).toContainText(
    "Công ty Minh Anh",
  );
  await page
    .getByRole("button", { name: "Bỏ lọc Chưa liên hệ", exact: true })
    .click();
  await expect(
    page.getByLabel("Trạng thái chăm sóc", { exact: true }),
  ).toHaveValue("");
  await expect(
    quick.getByRole("button", { name: "Hết hạn hôm nay", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.getByLabel("Bộ lọc đang áp dụng")).toHaveCount(0);
  await page.goto("/#customers");
  await expect(
    page.getByText("Tên khách hàng A–Z", { exact: true }),
  ).toBeVisible();
});

test("Zalo copying does not confirm sending; explicit confirmation schedules one follow-up", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("KH0002");
  await page.locator(".desktop-table .customer-name").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Soạn Zalo", exact: true }).click();
  await dialog.getByRole("button", { name: "Sao chép", exact: true }).click();
  await expect(
    page.getByText("Đã sao chép nội dung; chưa gửi tin nhắn.", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog.locator(".profile-badges")).toContainText("Đã gọi");
  await expect(dialog.locator(".appointment")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Soạn Zalo", exact: true }).click();
  await dialog.getByRole("button", { name: "Tôi đã gửi", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "hẹn liên hệ lại sau 2 ngày",
  );
  await expect(
    dialog.getByRole("button", { name: "Tôi đã gửi", exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog.locator(".profile-badges")).toContainText("Đã nhắn Zalo");
  const expectedDate = await page.evaluate(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const date = new Date(today + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + 2);
    return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
  });
  await expect(dialog.locator(".appointment")).toContainText(expectedDate);
  await expect(
    dialog
      .locator(".timeline")
      .getByText("Đã xác nhận gửi tin nhắn Zalo", { exact: true }),
  ).toHaveCount(1);
});

test("mobile summary disclosure and report history scope", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /Thống kê nhắc hạn/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#reminder-summary")).not.toBeVisible();
  await expect(
    page
      .locator(".customer-card")
      .first()
      .getByRole("button", { name: "Công ty Minh Anh", exact: true }),
  ).toBeInViewport();
  await toggle.click();
  await expect(page.locator("#reminder-summary")).toBeVisible();
  await toggle.click();
  await expect(page.locator("#reminder-summary")).not.toBeVisible();
  await page.goto("/#reports");
  await page.getByLabel("Kỳ xem lịch sử", { exact: true }).selectOption("3");
  await expect(
    page.getByRole("heading", {
      name: "Hiệu quả chăm sóc 3 tháng",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".table-scroll tbody tr")).toHaveCount(3);
  await expect(page.locator(".monthly-chart > div")).toHaveCount(3);
  await expect(
    page.getByRole("heading", {
      name: "Phân bố trạng thái chăm sóc",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Kỳ xem lịch sử", { exact: true }).selectOption("6");
  await expect(page.locator(".table-scroll tbody tr")).toHaveCount(6);
  await page.goto("/#dashboard");
  await expect(
    page.getByRole("heading", { name: "Ưu tiên hôm nay", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Kỳ xem lịch sử", { exact: true })).toHaveCount(
    0,
  );
});
