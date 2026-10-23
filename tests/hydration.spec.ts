import { test, expect } from "@playwright/test";

test("body attributes injected before hydration do not trigger an error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text()))
      errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const injectAttribute = () => {
      if (!document.body) return false;
      document.body.setAttribute("cz-shortcut-listen", "true");
      return true;
    };
    if (!injectAttribute()) {
      const observer = new MutationObserver(() => {
        if (injectAttribute()) observer.disconnect();
      });
      observer.observe(document, { childList: true, subtree: true });
    }
  });
  await page.goto("/#customers");
  await expect(page.locator(".main-content h1")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute(
    "cz-shortcut-listen",
    "true",
  );
  await page
    .getByRole("button", { name: "Thêm khách hàng", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
