import { test, expect } from "@playwright/test";
import { dateAfter, fmtDate } from "../lib/domain";

test("all four Dashboard KPIs open their matching customer groups", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#dashboard");
  await page
    .locator(".dashboard-kpis")
    .getByRole("button", { name: /^Khách quá hẹn/ })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Lọc công việc" })
      .getByRole("button", { name: /^Quá hẹn/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".work-card")).toHaveCount(1);
  await expect(page.locator(".work-card")).toContainText("Công ty Minh Anh 9");
  await page.goto("/#dashboard");
  await page
    .locator(".dashboard-kpis")
    .getByRole("button", { name: /^CKS hết hạn trong 7 ngày/ })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Khoảng nhắc hạn" })
      .getByRole("button", { name: "7 ngày", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(5);
  await page.goto("/#dashboard");
  await page
    .locator(".dashboard-kpis")
    .getByRole("button", { name: /^Chưa liên hệ/ })
    .click();
  await expect(
    page.getByLabel("Trạng thái chăm sóc", { exact: true }),
  ).toHaveValue("not_contacted");
  await expect(page.locator(".desktop-table tbody tr")).toHaveCount(4);
  await page.goto("/#dashboard");
  await page
    .locator(".dashboard-kpis")
    .getByRole("button", { name: /^Giá trị dự kiến 30 ngày/ })
    .click();
  await expect(
    page.getByLabel("Trạng thái chăm sóc", { exact: true }),
  ).toHaveValue("");
  await expect(
    page
      .getByRole("group", { name: "Khoảng nhắc hạn" })
      .getByRole("button", { name: "30 ngày", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".list-caption")).toContainText("22 khách hàng");
});

test("calendar selects the exact day and preserves selection across customer profiles", async ({
  page,
}) => {
  await page.goto("/#dashboard");
  const calendar = page.getByRole("region", {
    name: "Lịch hẹn 7 ngày",
    exact: true,
  });
  const days = calendar.getByRole("group", { name: "Chọn ngày hẹn" });
  await expect(days.getByRole("button")).toHaveCount(7);
  await days
    .getByRole("button", {
      name: `${fmtDate(dateAfter(1))}: 1 khách hẹn`,
      exact: true,
    })
    .click();
  await expect(calendar.locator(".dashboard-customer-row")).toHaveCount(1);
  await calendar.locator(".dashboard-customer-row").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".appointment")).toContainText(
    fmtDate(dateAfter(1)),
  );
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(
    days.getByRole("button", {
      name: `${fmtDate(dateAfter(1))}: 1 khách hẹn`,
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await days
    .getByRole("button", {
      name: `${fmtDate(dateAfter(2))}: 0 khách hẹn`,
      exact: true,
    })
    .click();
  await expect(
    calendar.getByText("Không có lịch hẹn trong ngày này.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mở công việc hôm nay", exact: true })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Lọc công việc" })
      .getByRole("button", { name: /^Cần làm/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("expiry chart supports keyboard selection, zero months and paginated matching customers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#dashboard");
  const chart = page.getByRole("region", {
    name: "Kỳ hạn 6 tháng",
    exact: true,
  });
  const months = chart
    .getByRole("group", { name: "Chọn tháng hết hạn" })
    .getByRole("button");
  await expect(months).toHaveCount(6);
  // Fixture expiries in the current month are deterministic relative to today.
  const firstCount = Number(
    (await months.nth(0).getAttribute("aria-label"))!.match(/: (\d+)/)![1],
  );
  await expect(chart.locator(".dashboard-customer-row")).toHaveCount(
    Math.min(5, firstCount),
  );
  if (firstCount > 5) {
    await chart
      .getByRole("button", { name: /^Khách tiếp theo trong CKS hết hạn tháng/ })
      .click();
    await expect(chart.locator(".dashboard-pagination")).toContainText(
      `6–${Math.min(10, firstCount)}`,
    );
  }
  const labels = await months.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-label") || ""),
  );
  const selectedIndex = labels.findIndex(
    (label, index) => index > 0 && /: [1-9]\d* khách/.test(label),
  );
  expect(selectedIndex).toBeGreaterThan(0);
  await months.nth(selectedIndex).focus();
  await page.keyboard.press("Enter");
  await expect(months.nth(selectedIndex)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const names = await chart
    .locator(".dashboard-customer-row small")
    .allTextContents();
  const suffix = labels[selectedIndex].match(/^Tháng (\d{2}\/\d{4})/)![1];
  expect(names.length).toBeGreaterThan(0);
  expect(names.every((name) => name.endsWith(suffix))).toBe(true);
  await months.nth(5).click();
  await expect(
    chart.getByText("Không có CKS hết hạn trong khoảng này.", { exact: true }),
  ).toBeVisible();
  await expect(months.nth(5).locator(".dashboard-bar-track > span")).toHaveCSS(
    "height",
    "0px",
  );
});

test("care results change period and outcome independently, with full customer access", async ({
  page,
}) => {
  await page.goto("/#dashboard");
  const results = page.getByRole("region", {
    name: "Kết quả chăm sóc",
    exact: true,
  });
  const groups = results.getByRole("group", { name: "Chọn kết quả chăm sóc" });
  await groups.getByRole("button", { name: /^Khách đã gia hạn/ }).click();
  await expect(results.locator(".dashboard-selection h4")).toContainText(
    "8 khách",
  );
  await expect(results.locator(".dashboard-customer-row")).toHaveCount(5);
  await results
    .getByRole("button", {
      name: "Khách tiếp theo trong Khách đã gia hạn",
      exact: true,
    })
    .click();
  await expect(results.locator(".dashboard-customer-row")).toHaveCount(3);
  await results
    .getByLabel("Kỳ kết quả chăm sóc", { exact: true })
    .selectOption("7");
  await expect(results.locator(".dashboard-selection h4")).toContainText(
    "0 khách",
  );
  await expect(
    results.getByText("Chưa có khách được ghi nhận trong kỳ này.", {
      exact: true,
    }),
  ).toBeVisible();
  await groups.getByRole("button", { name: /^Khách đã liên hệ/ }).click();
  await expect(results.locator(".dashboard-customer-row")).toHaveCount(2);
  await results
    .getByLabel("Kỳ kết quả chăm sóc", { exact: true })
    .selectOption("90");
  await groups.getByRole("button", { name: /^Khách đã gia hạn/ }).click();
  await expect(results.locator(".dashboard-selection h4")).toContainText(
    "8 khách",
  );
});

test("mobile Dashboard has usable day/month controls and opens the detailed report", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#dashboard");
  await page.locator(".dashboard-months button").first().waitFor();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(
    await page
      .locator(".dashboard-month-label")
      .evaluateAll((labels) =>
        labels.every((label) => label.scrollWidth <= label.clientWidth),
      ),
  ).toBe(true);
  const day = page
    .getByRole("group", { name: "Chọn ngày hẹn" })
    .getByRole("button")
    .nth(6);
  await day.click();
  await expect(day).toHaveAttribute("aria-pressed", "true");
  const chart = page.getByRole("group", { name: "Chọn tháng hết hạn" });
  await chart.getByRole("button").nth(1).click();
  await expect(chart.getByRole("button").nth(1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Báo cáo chi tiết", exact: true })
    .click();
  await expect(
    page.getByLabel("Kỳ xem lịch sử", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Hiệu quả chăm sóc 6 tháng",
      exact: true,
    }),
  ).toBeVisible();
});
