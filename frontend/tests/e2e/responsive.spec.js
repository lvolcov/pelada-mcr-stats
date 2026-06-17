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

  test("match history opens a match detail page", async ({ page }) => {
    await page.goto("/matches");
    // Open the first match card.
    await page.locator('a[href*="/match/"]').first().click();
    await expect(page).toHaveURL(/\/match\/\d{4}-\d{2}-\d{2}$/);
    // Detail page shows the goals/assists breakdown.
    await expect(page.getByText(/Vencedores|Winners|Times mistos|Mixed/).first()).toBeVisible();
  });

  test("matches table view sorts by column", async ({ page }) => {
    await page.goto("/matches");
    await page.getByRole("button", { name: /Tabela|Table/ }).click();
    await expect(page.getByRole("table")).toBeVisible();
    // Sorting by goals should not throw and keeps the table present.
    await page.getByRole("button", { name: /Gols|Goals/ }).first().click();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("leaderboard column header sorts", async ({ page }) => {
    await page.goto("/leaderboard");
    const assistsHeader = page.getByRole("button", { name: /Assist/ }).first();
    await assistsHeader.click();
    // After sorting by assists desc, Douglas B (24 assists) should lead.
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByText(/Douglas B/)).toBeVisible();
  });

  test("recent form sort can be reset to default", async ({ page }) => {
    await page.goto("/form");
    await expect(page.getByRole("heading", { name: /Forma Recente|Recent Form/ })).toBeVisible();
    // Apply a sort, then reset via the Padrão/Default chip.
    await page.getByRole("button", { name: /Nome|Name/ }).first().click();
    const resetChip = page.getByRole("button", { name: /Padrão|Default/ });
    await resetChip.click();
    await expect(resetChip).toBeVisible();
  });

  test("app manifest and icon are linked", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });

  test("recent form shows absences and a legend", async ({ page }) => {
    await page.goto("/form");
    await expect(page.getByRole("heading", { name: /Forma Recente|Recent Form/ })).toBeVisible();
    // Legend explains the absent marker; at least one ✕ pill is shown.
    await expect(page.getByText(/Não compareceu|Did not attend/).first()).toBeVisible();
    await expect(page.getByText("✕").first()).toBeVisible();
  });

  test("attendance table has a rank column", async ({ page }) => {
    await page.goto("/attendance");
    const firstHeader = page.getByRole("table").locator("thead th").first();
    await expect(firstHeader).toHaveText("#");
  });

  test("attendance squares link to a match", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByRole("table")).toBeVisible();
    // Present squares are links to /match/<date>.
    await page.locator('a[href*="/match/"]').first().click();
    await expect(page).toHaveURL(/\/match\/\d{4}-\d{2}-\d{2}$/);
  });

  test("MVP per-session entries link to matches", async ({ page }) => {
    await page.goto("/mvp");
    await expect(page.getByText(/Ranking de MVPs|MVP Ranking/).first()).toBeVisible();
    await page.locator('a[href*="/match/"]').first().click();
    await expect(page).toHaveURL(/\/match\/\d{4}-\d{2}-\d{2}$/);
  });

  test("MVP page renders and pluralizes correctly", async ({ page }) => {
    await page.goto("/mvp");
    await expect(page.getByText(/Ranking de MVPs|MVP Ranking/).first()).toBeVisible();
    const body = await page.locator("body").innerText();
    // Singular must be "1× vez", never "1× vezes".
    expect(body).not.toContain("1× vezes");
    expect(body).toContain("1× vez");
  });

  test("players page sort control works", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByRole("link", { name: /Junior/ }).first()).toBeVisible();
    // Sorting by goals should not crash the grid.
    await page.getByRole("button", { name: /Gols|Goals/ }).first().click();
    await expect(page.getByRole("link", { name: /Junior/ }).first()).toBeVisible();
  });

  test("mensalista calendar icon appears for season members", async ({ page }) => {
    // Junior is a mensalista; his profile heading should carry the 📅 badge.
    await page.goto("/player/junior");
    const heading = page.getByRole("heading", { name: /Junior/ });
    await expect(heading).toBeVisible();
    await expect(heading.getByText("📅")).toBeVisible();
  });

  test("player profile shows attendance x/y", async ({ page }) => {
    await page.goto("/player/lucas%20volcov");
    await expect(page.getByRole("heading", { name: /Lucas Volcov/ })).toBeVisible();
    // Attendance ratio (14/18) appears on the profile.
    await expect(page.getByText("14/18").first()).toBeVisible();
  });
});
