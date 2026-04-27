// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #1 — Smoke test: login & navigation across all routed views.
 *
 * Asserts that:
 *  - The application boots and the main shell renders.
 *  - Each registered route in client/src/main.js loads without crashing.
 *  - Each view renders its own H2/H1 heading (proxy for "the view itself, not a 404").
 *
 * If this test breaks, nothing else matters — investigate before any other failure.
 */

const ROUTES = [
  { path: '/',          label: 'Overview',        heading: /Overview/i },
  { path: '/inventory', label: 'Inventory',       heading: /Inventory/i },
  { path: '/orders',    label: 'Orders',          heading: /Orders/i },
  { path: '/spending',  label: 'Finance',         heading: /Spending|Finance/i },
  { path: '/demand',    label: 'Demand Forecast', heading: /Demand/i },
  { path: '/reports',   label: 'Reports',         heading: /Reports/i }
]

test.describe('Smoke — application shell and navigation', () => {
  test('application shell renders on initial load', async ({ page }) => {
    await page.goto('/')

    // Header brand is visible
    await expect(page.getByRole('banner')).toBeVisible()

    // Filter bar is rendered (four canonical filters) — scope to <label> elements
    // to avoid matching headings, table column headers, or body copy.
    const filterLabel = (text) => page.locator('label').filter({ hasText: text })
    await expect(filterLabel('Time Period')).toBeVisible()
    await expect(filterLabel('Location')).toBeVisible()
    await expect(filterLabel('Category')).toBeVisible()
    await expect(filterLabel('Order Status')).toBeVisible()

    // Top-level nav has all six expected links
    const nav = page.getByRole('navigation')
    for (const route of ROUTES) {
      await expect(nav.getByRole('link', { name: route.label })).toBeVisible()
    }
  })

  for (const route of ROUTES) {
    test(`navigates to ${route.path} (${route.label}) and renders the view`, async ({ page }) => {
      await page.goto(route.path)

      // URL settles on the expected route
      await expect(page).toHaveURL(new RegExp(route.path === '/' ? '/$' : `${route.path}$`))

      // Some heading from the view is visible — proxy for "the view rendered, not a blank shell"
      await expect(page.getByRole('heading', { level: 2, name: route.heading })).toBeVisible()
    })
  }

  test('navigation by clicking links updates the URL and the view', async ({ page }) => {
    await page.goto('/')

    for (const route of ROUTES.filter(r => r.path !== '/')) {
      await page.getByRole('navigation').getByRole('link', { name: route.label }).click()
      await expect(page).toHaveURL(new RegExp(`${route.path}$`))
      await expect(page.getByRole('heading', { level: 2, name: route.heading })).toBeVisible()
    }
  })
})
