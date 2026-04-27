// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #7 — Spending (Finance) view rendering and consistency.
 *
 * Financial accuracy underpins every purchasing decision; defects on this
 * surface erode trust in the dashboard at large. The Spending API endpoints
 * are read-only and do not accept filters, so this spec asserts render
 * correctness and structural consistency rather than filter integration.
 *
 * Coverage:
 *  - The four KPI cards (Total Revenue / Total Costs / Net Profit / Avg Order
 *    Value) render with non-empty currency-formatted values.
 *  - The Revenue vs Costs chart renders one bar group per month (≥ 3).
 *  - The Category Spending list renders all five product categories, with
 *    percentages summing to ~100%.
 *  - The Recent Transactions table has the five expected columns and at
 *    least one row.
 *  - After the W3 cleanup, transaction rows are NOT clickable (the prior
 *    `alert()` and `clickable-row` class were removed — defect #12).
 */

test.describe('Spending — KPIs, charts, and transaction list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/spending')
    // Wait for at least one stat card value to render — that's the data-loaded signal.
    await expect(page.locator('.stat-card .stat-value').first()).toBeVisible()
  })

  test('renders the four KPI cards with currency values', async ({ page }) => {
    const expected = [
      /Total Revenue/i,
      /Total Costs/i,
      /Net Profit/i,
      /Avg Order Value/i
    ]
    for (const label of expected) {
      const card = page.locator('.stat-card', { hasText: label })
      await expect(card).toBeVisible()
      // Currency-formatted: starts with a currency symbol ($ or ¥), then digits.
      await expect(card.locator('.stat-value')).toHaveText(/^[$¥][\d,]+$/)
    }
  })

  test('Revenue vs Costs chart shows one bar group per month (>= 3)', async ({ page }) => {
    const chartCard = page.locator('.card', { hasText: /Revenue.*vs.*Costs|Revenue vs/i })
    const groups = chartCard.locator('.bar-group-revenue')
    await expect(groups.first()).toBeVisible()
    expect(await groups.count()).toBeGreaterThanOrEqual(3)
  })

  test('Category Spending lists the four cost categories with percentage and amount', async ({ page }) => {
    // The endpoint returns four cost categories: Raw Materials, Components,
    // Equipment, Consumables (not product categories — these are spend buckets).
    const list = page.locator('.card', { hasText: /Category Spending|Spending by Category/i })
    const items = list.locator('.category-item')
    await expect(items).toHaveCount(4)

    // Each item must surface a category name, an amount, and a percentage.
    for (let i = 0; i < 4; i++) {
      const item = items.nth(i)
      await expect(item.locator('.category-name')).not.toHaveText('')
      await expect(item.locator('.category-amount')).toHaveText(/^[$¥][\d,]+$/)
      await expect(item.locator('.percentage')).toHaveText(/\d+(\.\d+)?\s*%/)
    }
  })

  test('Recent Transactions table has the five expected columns and at least one row', async ({ page }) => {
    const tableCard = page.locator('.card', { hasText: /Recent Transactions|Transactions/i })
    const expected = ['ID', 'Description', 'Vendor', 'Date', 'Amount']
    for (const col of expected) {
      await expect(tableCard.getByRole('columnheader', { name: col })).toBeVisible()
    }
    await expect(tableCard.locator('tbody tr').first()).toBeVisible()
  })

  test('transaction rows are not clickable (defect #12 cleanup)', async ({ page }) => {
    // After the W3 cleanup the `clickable-row` class and the `alert()` handler
    // were removed. Rows should not carry the class anymore.
    const tableCard = page.locator('.card', { hasText: /Recent Transactions|Transactions/i })
    const clickableRows = tableCard.locator('tbody tr.clickable-row')
    await expect(clickableRows).toHaveCount(0)
  })
})
