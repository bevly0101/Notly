import { test, expect } from "@playwright/test";

test.describe("NOTLY MVP flow", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back to notly/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("local workspace flow: create workspace and page", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("notly_local_mode", "true"));
    await page.goto("/workspaces");

    await expect(page.getByTestId("workspaces-page")).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole("heading", { name: /workspaces/i })).toBeVisible();

    await expect(page.getByText("Local Workspace")).toBeVisible({ timeout: 60000 });
    await page.getByText("Local Workspace").click();

    await expect(page).toHaveURL(/\/w\//, { timeout: 30000 });

    await page.getByRole("button", { name: /new page/i }).first().click();
    await expect(page).toHaveURL(/\/p\//, { timeout: 30000 });

    await expect(page.getByPlaceholder("Untitled")).toBeVisible();
  });

  test("workspaces tab filtering", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("notly_local_mode", "true"));
    await page.goto("/workspaces");
    await expect(page.getByTestId("workspaces-page")).toBeVisible({ timeout: 60000 });

    await expect(page.getByText("Local Workspace")).toBeVisible({ timeout: 60000 });
    await page.getByRole("button", { name: /^local$/i }).click();
    await expect(page.getByText("Local Workspace")).toBeVisible();
  });
});
