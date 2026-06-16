// UX tests covering responsive navigation, theme + language toggles, and core
// dashboard flows. The "desktop" and "mobile" projects run every test in both
// viewports; layout-specific assertions branch on `isMobile`.

import { test, expect } from "@playwright/test";

test.describe("App shell & toggles", () => {
  test("home loads with hero and key stats", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#root")).toBeVisible();
    // Total goals stat (219) should render somewhere on the overview.
    await expect(page.getByText("219", { exact: false }).first()).toBeVisible();
  });

  test("responsive navigation: sidebar on desktop, drawer on mobile", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    const menuButton = page.getByTestId("menu-button");
    const drawer = page.getByTestId("mobile-drawer");

    if (isMobile) {
      // Hamburger visible; drawer hidden until opened.
      await expect(menuButton).toBeVisible();
      await expect(drawer).toHaveCount(0);
      await menuButton.click();
      await expect(drawer).toBeVisible();
      // Navigate from the drawer; it should close afterwards.
      await drawer.getByRole("link", { name: /Placar Geral|Leaderboard/ }).click();
      await expect(page).toHaveURL(/\/leaderboard$/);
      await expect(drawer).toHaveCount(0);
    } else {
      // Desktop: persistent sidebar links, no hamburger.
      await expect(menuButton).toBeHidden();
      await page.getByRole("link", { name: /Placar Geral|Leaderboard/ }).first().click();
      await expect(page).toHaveURL(/\/leaderboard$/);
    }
  });

  test("theme toggle switches dark/light", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/); // dark by default
    // Target the toggle that is actually visible in this viewport.
    await page.locator('[data-testid="theme-toggle"]:visible').click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test("language is locked to Portuguese (no toggle)", async ({ page, isMobile }) => {
    await page.goto("/");
    // The language toggle has been removed.
    await expect(page.getByTestId("lang-toggle")).toHaveCount(0);
    // Navigation labels are in Portuguese.
    if (isMobile) await page.getByTestId("menu-button").click();
    await expect(page.getByRole("link", { name: "Placar Geral" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Leaderboard" })).toHaveCount(0);
  });
});

test.describe("Dashboard flows", () => {
  test("leaderboard shows ranked players", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Junior").first()).toBeVisible();
  });

  test("player profile opens from players grid", async ({ page }) => {
    await page.goto("/players");
    await page.getByRole("link", { name: /Junior/ }).first().click();
    await expect(page).toHaveURL(/\/player\//);
    await expect(page.getByRole("heading", { name: "Junior" })).toBeVisible();
  });

  test("attendance grid renders all sessions", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("season trend chart renders", async ({ page }) => {
    await page.goto("/trend");
    // Recharts renders an <svg>; ensure the chart surface is present.
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible();
  });
});
