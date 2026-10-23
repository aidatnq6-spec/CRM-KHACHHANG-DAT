import { test, expect } from "@playwright/test";

test("readable workspace at mobile, tablet and desktop widths", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of [
      "reminders",
      "customers",
      "today",
      "dashboard",
      "reports",
      "zalo",
      "data",
    ]) {
      await page.goto(`/#${route}`);
      await expect(page.locator(".main-content h1")).toBeVisible();
      await expect(page.locator(".loading")).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow, `${route} must not overflow at ${width}px`).toBe(false);
      const table = page.locator(".desktop-table");
      if (await table.isVisible()) {
        expect(
          await table.evaluate((node) => node.scrollWidth <= node.clientWidth),
          `Table must fit at ${width}px`,
        ).toBe(true);
      }
      if (route === "reminders" || route === "reports") {
        await page.screenshot({
          path: `test-results/interface-${route}-${width}.png`,
        });
      }
      if (route === "reports" && width === 1440) {
        await page.emulateMedia({ media: "print" });
        await expect(page.locator(".report-print-heading h2")).toBeVisible();
        await expect(page.locator(".sidebar")).not.toBeVisible();
        await page.emulateMedia({ media: "screen" });
      }
    }
  }
  expect(errors).toEqual([]);
});
