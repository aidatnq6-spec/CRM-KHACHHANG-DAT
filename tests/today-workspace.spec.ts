import { test, expect } from "@playwright/test";
import { dateAfter, fmtDate, todayVN } from "../lib/domain";

test("inline call records a note, schedules three days and advances within the same filter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#today");
  const filters = page.getByRole("group", {
    name: "Lọc công việc",
    exact: true,
  });
  await filters.getByRole("button", { name: /^Hẹn hôm nay/ }).click();
  const cards = page.locator(".work-card");
  const id = await cards.nth(0).getAttribute("data-customer-id");
  const nextId = await cards.nth(1).getAttribute("data-customer-id");
  const row = page.locator(`[data-customer-id="${id}"]`);
  await row.locator(".work-note summary").click();
  await row
    .getByLabel("Phản hồi của khách", { exact: true })
    .fill("Khách cần báo giá gói 2 năm");
  await row.getByRole("button", { name: "Đã gọi", exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect(
    filters.getByRole("button", { name: /^Hẹn hôm nay/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(`[data-customer-id="${nextId}"] .customer-name`),
  ).toBeFocused();
  await expect(page.locator(".today-result")).toContainText(
    fmtDate(dateAfter(3)),
  );
  await filters.getByRole("button", { name: /^Sắp đến hẹn/ }).click();
  await expect(row.locator(".care-called")).toBeVisible();
  await expect(row.locator(".work-context")).toContainText(
    "Khách cần báo giá gói 2 năm",
  );
  await expect(row.locator(".work-context")).toContainText(
    fmtDate(dateAfter(3)),
  );
  await row.getByRole("button", { name: "Hồ sơ", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .locator(".timeline")
      .getByText("Khách cần báo giá gói 2 năm", { exact: true }),
  ).toHaveCount(1);
});

test("waiting advances the scroll anchor instead of returning to the top", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#today");
  const filters = page.getByRole("group", { name: "Lọc công việc" });
  await filters.getByRole("button", { name: /^Chờ phản hồi/ }).click();
  const cards = page.locator(".work-card");
  const id = await cards.nth(2).getAttribute("data-customer-id");
  const nextId = await cards.nth(3).getAttribute("data-customer-id");
  const row = page.locator(`[data-customer-id="${id}"]`);
  await row.evaluate((element) =>
    window.scrollBy({
      top: element.getBoundingClientRect().top - 100,
      behavior: "instant",
    }),
  );
  const top = (await row.boundingBox())!.y;
  await row.getByRole("button", { name: "Chờ phản hồi", exact: true }).click();
  const next = page.locator(`[data-customer-id="${nextId}"]`);
  await expect(next.locator(".customer-name")).toBeFocused();
  await expect(row).toHaveCount(0);
  expect(Math.abs((await next.boundingBox())!.y - top)).toBeLessThan(4);
  await expect(
    filters.getByRole("button", { name: /^Chờ phản hồi/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".today-result")).toContainText(
    fmtDate(dateAfter(1)),
  );
});

test("rescheduling validates input, preserves care and last contact, and handles the final customer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#today");
  const filters = page.getByRole("group", { name: "Lọc công việc" });
  await filters.getByRole("button", { name: /^Quá hẹn/ }).click();
  const row = page.locator('[data-customer-id="fixture-8"]');
  await expect(page.locator(".work-card")).toHaveCount(1);
  await expect(row.locator(".appointment-overdue")).toHaveText(
    "Quá hẹn 2 ngày",
  );
  const contact = await row
    .locator(".work-context time")
    .getAttribute("datetime");
  await row.getByRole("button", { name: "Hẹn lại", exact: true }).click();
  const form = row.getByRole("form");
  await form.getByLabel("Ngày hẹn", { exact: true }).fill(todayVN());
  await form
    .getByLabel("Nội dung hẹn", { exact: true })
    .fill("Gửi báo giá trước cuộc gọi tiếp theo");
  await form.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("từ ngày mai");
  await expect(form.getByLabel("Ngày hẹn", { exact: true })).toBeFocused();
  await expect(form.getByLabel("Nội dung hẹn", { exact: true })).toHaveValue(
    "Gửi báo giá trước cuộc gọi tiếp theo",
  );
  await form.getByLabel("Ngày hẹn", { exact: true }).fill(dateAfter(5));
  await form.getByLabel("Nội dung hẹn", { exact: true }).fill("   ");
  await form.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Nhập nội dung");
  await expect(form.getByLabel("Nội dung hẹn", { exact: true })).toBeFocused();
  await form
    .getByLabel("Nội dung hẹn", { exact: true })
    .fill("Gửi báo giá trước cuộc gọi tiếp theo");
  await form.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(page.locator(".work-card")).toHaveCount(0);
  await expect(page.locator(".today-list-heading h2")).toBeFocused();
  await expect(
    filters.getByRole("button", { name: /^Quá hẹn/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await filters.getByRole("button", { name: /^Sắp đến hẹn/ }).click();
  await expect(row.locator(".care-waiting")).toBeVisible();
  await expect(row.locator(".work-context time")).toHaveAttribute(
    "datetime",
    contact!,
  );
  await expect(row.locator(".work-context")).toContainText(
    "Gửi báo giá trước cuộc gọi tiếp theo",
  );
  await row.getByRole("button", { name: "Hồ sơ", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .locator(".timeline")
      .getByText(
        `Hẹn lại ${fmtDate(dateAfter(5))}: Gửi báo giá trước cuộc gọi tiếp theo`,
        { exact: true },
      ),
  ).toHaveCount(1);
});

test("mobile keeps drafts and filters across profile, and supports rescheduling beyond the next week", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#today");
  const filters = page.getByRole("group", { name: "Lọc công việc" });
  await filters.getByRole("button", { name: /^Hẹn hôm nay/ }).click();
  const id = await page
    .locator(".work-card")
    .first()
    .getAttribute("data-customer-id");
  const row = page.locator(`[data-customer-id="${id}"]`);
  const customerName = await row.locator(".customer-name").innerText();
  await row.locator(".work-note summary").click();
  await row
    .getByLabel("Phản hồi của khách", { exact: true })
    .fill("Giữ ghi chú khi mở hồ sơ");
  await row.getByRole("button", { name: "Hồ sơ", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  await expect(
    row.getByLabel("Phản hồi của khách", { exact: true }),
  ).toHaveValue("Giữ ghi chú khi mở hồ sơ");
  await expect(
    filters.getByRole("button", { name: /^Hẹn hôm nay/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await row.getByRole("button", { name: "Hẹn lại", exact: true }).click();
  const form = row.getByRole("form");
  await form.getByLabel("Ngày hẹn", { exact: true }).fill(dateAfter(10));
  await form
    .getByLabel("Nội dung hẹn", { exact: true })
    .fill("Khách đi công tác, gọi sau 10 ngày");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await form.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(row).toHaveCount(0);
  await filters.getByRole("button", { name: /^Sắp đến hẹn/ }).click();
  await expect(row).toHaveCount(0);
  await page.goto("/#customers");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill(customerName);
  await page
    .locator(".mobile-cards")
    .getByRole("button", { name: customerName, exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".appointment")).toContainText(
    fmtDate(dateAfter(10)),
  );
  await expect(page.getByRole("dialog").locator(".appointment")).toContainText(
    "Khách đi công tác, gọi sau 10 ngày",
  );
});

test("returning from a confirmed Zalo send advances after the dialog closes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#today");
  const filters = page.getByRole("group", { name: "Lọc công việc" });
  await filters.getByRole("button", { name: /^Hẹn hôm nay/ }).click();
  const id = await page
    .locator(".work-card")
    .nth(0)
    .getAttribute("data-customer-id");
  const nextId = await page
    .locator(".work-card")
    .nth(1)
    .getAttribute("data-customer-id");
  await page
    .locator(`[data-customer-id="${id}"]`)
    .getByRole("button", { name: "Soạn Zalo", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Tôi đã gửi", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("sau 2 ngày");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(
    page.locator(`[data-customer-id="${nextId}"] .customer-name`),
  ).toBeFocused();
  await expect(
    filters.getByRole("button", { name: /^Hẹn hôm nay/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`[data-customer-id="${id}"]`)).toHaveCount(0);
});
