import { test, expect } from "@playwright/test";

/**
 * E2E Auth Flow Tests
 *
 * These tests verify the critical authentication user journeys.
 * They require the dev server running: npm run dev
 */

test.describe("Authentication Flows", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("h1")).toContainText("Connexion");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
  });

  test("should display registration page with role selection", async ({
    page,
  }) => {
    await page.goto("/inscription");
    await expect(page.locator("h1")).toContainText("Créer un compte");
    // Role selection buttons should be visible
    await expect(page.getByText("Locataire")).toBeVisible();
    await expect(page.getByText("Propriétaire")).toBeVisible();
  });

  test("should show validation errors on empty login form", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.click('button[type="submit"]');
    // Validation errors should appear
    await expect(page.getByText("L'email est requis")).toBeVisible();
  });

  test("should show validation errors on empty registration form", async ({
    page,
  }) => {
    await page.goto("/inscription");
    await page.click('button[type="submit"]');
    await expect(
      page.getByText("Le nom doit contenir au moins 2 caractères")
    ).toBeVisible();
  });

  test("should redirect unauthenticated users from dashboard to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Should be redirected to login
    await expect(page).toHaveURL(/connexion/);
  });

  test("should navigate from login to registration page", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.click('a[href="/inscription"]');
    await expect(page).toHaveURL(/inscription/);
  });

  test("should display landing page with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Ma Maison")
    ).toBeVisible();
  });

  test("should navigate to search page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/recherche"]');
    await expect(page).toHaveURL(/recherche/);
    await expect(page.locator("h1")).toContainText("Rechercher un logement");
  });
});
