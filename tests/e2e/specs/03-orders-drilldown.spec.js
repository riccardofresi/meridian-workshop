// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #3 — Order drill-down with filter combinations.
 *
 * Orders is a high-traffic page with complex filter state — the surface most
 * likely to surface a regression when the filter wiring changes. This spec
 * locks down four invariants:
 *
 *  1. The four status cards (Delivered / Shipped / Processing / Backordered)
 *     render with non-empty counts.
 *  2. The "All Orders (N)" header reflects the table row count.
 *  3. Clicking an order's <details> summary expands the per-item list.
 *  4. Combining a Status filter + a Time Period filter narrows the table to
 *     the intersection (request includes both params).
 */

const filterSelect = (page, labelText) =>
  page.locator('.filter-group').filter({ hasText: labelText }).getByRole('combobox')

const orderRows = (page) =>
  page.locator('.card', { hasText: /All Orders/i }).locator('tbody tr')

test.describe('Orders — drill-down and filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders')
    await expect(orderRows(page).first()).toBeVisible()
  })

  test('renders the four status stat cards with numeric counts', async ({ page }) => {
    for (const label of [/Delivered/i, /Shipped/i, /Processing/i, /Backordered/i]) {
      const card = page.locator('.stat-card', { hasText: label })
      await expect(card).toBeVisible()
      const value = card.locator('.stat-value')
      await expect(value).toHaveText(/^\d+$/)
    }
  })

  test('"All Orders (N)" header matches the table row count', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /All Orders \(\d+\)/i })
    await expect(heading).toBeVisible()
    const text = await heading.textContent()
    const declared = parseInt((text || '').match(/\((\d+)\)/)?.[1] || '0', 10)
    expect(declared).toBeGreaterThan(0)

    const rows = await orderRows(page).count()
    expect(rows).toBe(declared)
  })

  test('clicking a row\'s items summary expands the per-item drill-down', async ({ page }) => {
    const firstRow = orderRows(page).first()
    const details = firstRow.locator('details')
    const summary = details.locator('summary')

    // Closed by default — items dropdown is not visible.
    await expect(details.locator('.items-dropdown')).toBeHidden()

    await summary.click()

    // After click, the dropdown shows at least one item.
    await expect(details.locator('.items-dropdown')).toBeVisible()
    await expect(details.locator('.item-entry').first()).toBeVisible()
  })

  test('combining Status + Time Period narrows to the intersection', async ({ page }) => {
    const totalBefore = await orderRows(page).count()
    expect(totalBefore).toBeGreaterThan(0)

    // Apply Status = Delivered.
    const statusRequest = page.waitForRequest(req =>
      req.url().includes('/api/orders') && req.url().includes('status=delivered')
    )
    await filterSelect(page, 'Order Status').selectOption('delivered')
    await statusRequest

    await expect.poll(async () => orderRows(page).count()).toBeLessThan(totalBefore)
    const afterStatus = await orderRows(page).count()
    expect(afterStatus).toBeGreaterThan(0)

    // Apply Time Period = March 2025; URL must contain BOTH filters.
    const intersectionRequest = page.waitForRequest(req =>
      req.url().includes('/api/orders') &&
      req.url().includes('status=delivered') &&
      req.url().includes('month=2025-03')
    )
    await filterSelect(page, 'Time Period').selectOption('2025-03')
    await intersectionRequest

    await expect.poll(async () => orderRows(page).count()).toBeLessThanOrEqual(afterStatus)
  })
})
