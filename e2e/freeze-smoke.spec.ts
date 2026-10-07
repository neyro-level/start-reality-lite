import { expect, test } from "@playwright/test";
import { buildHref } from "../src/platform/grammar";
import { features } from "../src/project/features.config";
import { grammar } from "../src/project/grammar.config";
import { uiText } from "../src/project/ui-text.config";

test.describe("I6 Freeze smoke", () => {
  test.describe.configure({ mode: "serial" });

  test("home renders primary shell", async ({ page }) => {
    const href = buildHref(grammar, features, "home") ?? "/";
    await page.goto(href, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("catalog entry shows grid", async ({ page }) => {
    const href =
      buildHref(grammar, features, "catNovostroyki") ??
      "/primersk/novostroyki/";
    await page.goto(href, { waitUntil: "networkidle" });
    await expect(page.getByTestId("catalog-grid")).toBeVisible();
  });

  test("property detail from catalog", async ({ page }) => {
    const catalogPath =
      buildHref(grammar, features, "catKvartiry") ?? "/primersk/kvartiry/";
    await page.goto(catalogPath, { waitUntil: "networkidle" });
    await page.getByTestId("catalog-grid").getByRole("link").first().click();
    await expect(page.getByTestId("entity-detail")).toBeVisible();
  });

  test("development detail from catalog", async ({ page }) => {
    const catalogPath =
      buildHref(grammar, features, "catNovostroyki") ??
      "/primersk/novostroyki/";
    await page.goto(catalogPath, { waitUntil: "networkidle" });
    await page.getByTestId("catalog-grid").getByRole("link").first().click();
    await expect(page.getByTestId("entity-detail")).toBeVisible();
  });

  test("contacts lead form", async ({ page }) => {
    const contactsPath =
      buildHref(grammar, features, "contacts") ?? "/kontakty/";
    await page.goto(contactsPath, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("textbox", { name: uiText.form.phoneLabel }),
    ).toBeVisible();
  });

  test("404 starter shell", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-freeze/", {
      waitUntil: "networkidle",
    });
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("not-found-content")).toBeVisible();
  });

  test("legacy 410 fixture", async ({ request }) => {
    const response = await request.get("/blog/archive-post/");
    expect(response.status()).toBe(410);
  });

  test("legacy 308 redirect fixture", async ({ request }) => {
    const response = await request.get("/novostroyki-city/", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    const target = buildHref(grammar, features, "catNovostroyki");
    expect(response.headers().location).toBe(target);
  });

  test("robots.txt served", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
    expect(body).toMatch(/User-agent|Disallow|Allow/i);
  });

  test("sitemap.xml served", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("urlset");
  });

  test("lead accepts and returns leadId (spool path)", async ({ request }) => {
    const suffix = String(Date.now()).slice(-6);
    const response = await request.post("/api/public/leads/", {
      data: {
        name: "Freeze Smoke",
        phone: `+7988${suffix}0000`,
        consent: true,
        pageKey: "contacts",
        website: "",
      },
    });
    expect(response.ok()).toBeTruthy();
    const json = (await response.json()) as {
      ok?: boolean;
      captured?: boolean;
      leadId?: string;
    };
    expect(json.ok).toBe(true);
    expect(json.captured).toBe(true);
    expect(json.leadId?.length).toBeGreaterThan(0);
  });
});
