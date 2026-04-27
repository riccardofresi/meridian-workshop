// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #2 — Inventory filtering across warehouses and categories.
 *
 * Operations' most-used daily surface. The defect-log audit confirms the
 * Inventory view consumes useFilters correctly (unlike the pre-rewrite
 * Reports module), so this spec is a pure regression contract: it asserts
 * the wiring stays correct as the codebase evolves.
 *
 * What we verify:
 *  - Page renders with the full SKU set on initial load.
 *  - Selecting a Category filter narrows the table; the request includes
 *    `category=` and the visible rows all match the chosen category.
 *  - Selecting a Location (warehouse) filter narrows the table; the request
 *    includes `warehouse=`.
 *  - Combining Category + Location narrows further (intersection).
 *  - The Reset button returns the table to the unfiltered set.
 */

const filterSelect = (page, labelText) =>
  page.locator('.filter-group').filter({ hasText: labelText }).getByRole('combobox')

const inventoryRows = (page) =>
  page.locator('.card', { hasText: 'Stock Levels' }).locator('tbody tr')

const categoryCells = (page) =>
  page.locator('.card', { hasText: 'Stock Levels' }).locator('tbody tr td:nth-child(3)')

test.describe('Inventory — filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory')
    // Wait for the data to land — the table has at least one row.
    await expect(inventoryRows(page).first()).toBeVisible()
  })

  test('renders the full SKU set on initial load', async ({ page }) => {
    // The card title surfaces the count, e.g. "Stock Levels (32 SKUs)".
    await expect(page.getByRole('heading', { name: /Stock Levels \(\d+ SKUs?\)/i })).toBeVisible()
    // And the body has at least 10 rows (sanity check; exact count is data-dependent).
    expect(await inventoryRows(page).count()).toBeGreaterThan(10)
  })

  test('selecting a Category narrows the table to that category only', async ({ page }) => {
    const totalBefore = await inventoryRows(page).count()

    const requestPromise = page.waitForRequest(req =>
      req.url().includes('/api/inventory') && req.url().includes('category=')
    )
    await filterSelect(page, 'Category').selectOption('sensors')
    await requestPromise

    // Strictly fewer rows after filtering.
    await expect.poll(async () => inventoryRows(page).count()).toBeLessThan(totalBefore)
    // And every visible row is in the Sensors category.
    const categories = await categoryCells(page).allTextContents()
    expect(categories.length).toBeGreaterThan(0)
    for (const c of categories) {
      expect(c.trim()).toBe('Sensors')
    }
  })

  test('selecting a Location (warehouse) issues a warehouse= request', async ({ page }) => {
    const totalBefore = await inventoryRows(page).count()

    const requestPromise = page.waitForRequest(req =>
      req.url().includes('/api/inventory') && req.url().includes('warehouse=')
    )
    await filterSelect(page, 'Location').selectOption('London')
    await requestPromise

    // Strictly fewer rows after filtering by a single warehouse.
    await expect.poll(async () => inventoryRows(page).count()).toBeLessThan(totalBefore)
    // The table must still render at least one row (London has stock).
    await expect(inventoryRows(page).first()).toBeVisible()
  })

  test('combining Category and Location narrows to the intersection', async ({ page }) => {
    const totalBefore = await inventoryRows(page).count()

    const categoryRequest = page.waitForRequest(req =>
      req.url().includes('/api/inventory') && req.url().includes('category=actuators')
    )
    await filterSelect(page, 'Category').selectOption('actuators')
    await categoryRequest

    await expect.poll(async () => inventoryRows(page).count()).toBeLessThan(totalBefore)
    const afterCategory = await inventoryRows(page).count()

    const intersectionRequest = page.waitForRequest(req =>
      req.url().includes('/api/inventory') &&
      req.url().includes('category=actuators') &&
      /warehouse=San(\+|%20)Francisco/.test(req.url())
    )
    await filterSelect(page, 'Location').selectOption('San Francisco')
    await intersectionRequest

    // Intersection is at most as large as either single filter, and typically smaller.
    await expect.poll(async () => inventoryRows(page).count()).toBeLessThanOrEqual(afterCategory)
  })

  test('Reset all filters returns to the unfiltered set', async ({ page }) => {
    const totalBefore = await inventoryRows(page).count()

    const filterRequest = page.waitForRequest(req =>
      req.url().includes('/api/inventory') && req.url().includes('category=')
    )
    await filterSelect(page, 'Category').selectOption('sensors')
    await filterRequest

    await expect.poll(async () => inventoryRows(page).count()).toBeLessThan(totalBefore)
    const afterFilter = await inventoryRows(page).count()
    expect(afterFilter).toBeLessThan(totalBefore)

    // The button enables once at least one filter is non-default.
    const resetBtn = page.getByRole('button', { name: /Reset all filters/i })
    await expect(resetBtn).toBeEnabled()
    await resetBtn.click()

    // Row count is restored.
    await expect.poll(async () => inventoryRows(page).count()).toBe(totalBefore)
  })
})
