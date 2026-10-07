import { expect, test } from "@playwright/test";
import { buildHref } from "../src/platform/grammar";
import { features } from "../src/project/features.config";
import { grammar } from "../src/project/grammar.config";

test.describe("H4 entity detail shells", () => {
  test.describe.configure({ mode: "serial" });

  test("property page renders entity detail block", async ({ page }) => {
    const catalogPath =
      buildHref(grammar, features, "catKvartiry") ?? "/primersk/kvartiry/";
    await page.goto(catalogPath, { waitUntil: "networkidle" });
    const cardLink = page.getByTestId("catalog-grid").getByRole("link").first();
    await cardLink.click();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByTestId("entity-detail")).toBeVisible();
  });

  test("development page renders entity detail block", async ({ page }) => {
    const catalogPath =
      buildHref(grammar, features, "catNovostroyki") ??
      "/primersk/novostroyki/";
    await page.goto(catalogPath, { waitUntil: "networkidle" });
    await page.getByTestId("catalog-grid").getByRole("link").first().click();
    await expect(page.getByTestId("entity-detail")).toBeVisible();
  });

  test("developer page renders entity detail block", async ({ page }) => {
    const catalogPath =
      buildHref(grammar, features, "developers") ?? "/zastroyshchiki/";
    await page.goto(catalogPath, { waitUntil: "networkidle" });
    await page.locator("article").first().getByRole("link").click();
    await expect(page.getByTestId("entity-detail")).toBeVisible();
  });

  test("team route resolves when team feature is enabled", async () => {
    const teamPath = buildHref(grammar, features, "team");
    expect(teamPath).toBe("/komanda/");
  });
});
