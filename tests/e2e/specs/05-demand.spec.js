// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #5 — Demand forecast view rendering and trend display.
 *
 * Read-only surface that operations (Tanaka) checks before purchase decisions.
 * Demand data is not filterable server-side (the /api/demand endpoint takes
 * no parameters by design) — trend grouping is computed client-side.
 *
 * What this spec asserts:
 *  - The three trend cards (increasing / stable / decreasing) all render with
 *    a numeric items count.
 *  - The forecasts table has the seven expected columns and at least one row.
 *  - Each table row's trend cell is one of {increasing, stable, decreasing}.
 *  - The summed counts across the three trend cards equal the table row count
 *    (consistency between the summary cards and the underlying data).
 */

const trendCard = (page, label) =>
  page.locator('.trend-card', { hasText: label })

const forecastRows = (page) =>
  page.locator('.card', { hasText: /Demand Forecasts/i }).locator('tbody tr')

test.describe('Demand — forecasts and trend grouping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demand')
    await expect(forecastRows(page).first()).toBeVisible()
  })

  test('renders the three trend cards with numeric counts', async ({ page }) => {
    for (const label of [/Increasing Demand/i, /Stable Demand/i, /Decreasing Demand/i]) {
      const card = trendCard(page, label)
      await expect(card).toBeVisible()
      // The count is rendered as e.g. "5 items"; we just check at least one digit.
      await expect(card.locator('.trend-count')).toHaveText(/\d+/)
    }
  })

  test('forecasts table has the seven expected columns', async ({ page }) => {
    const tableCard = page.locator('.card', { hasText: /Demand Forecasts/i })
    const expected = ['SKU', 'Item Name', 'Current Demand', 'Forecasted Demand', 'Change', 'Trend', 'Period']
    for (const col of expected) {
      await expect(tableCard.getByRole('columnheader', { name: col })).toBeVisible()
    }
  })

  test('every row\'s trend value is one of the three known trends', async ({ page }) => {
    const trendCells = forecastRows(page).locator('td:nth-child(6)')
    const count = await trendCells.count()
    expect(count).toBeGreaterThan(0)

    const allowed = /^(increasing|stable|decreasing)$/i
    for (let i = 0; i < count; i++) {
      const text = (await trendCells.nth(i).textContent() || '').trim()
      expect(text, `row ${i} trend cell`).toMatch(allowed)
    }
  })

  test('summary card counts add up to the table row count', async ({ page }) => {
    // Pull the integer from each card's "N items" string.
    const readCount = async (label) => {
      const t = (await trendCard(page, label).locator('.trend-count').textContent()) || ''
      return parseInt(t.match(/\d+/)?.[0] || '0', 10)
    }

    const inc = await readCount(/Increasing Demand/i)
    const sta = await readCount(/Stable Demand/i)
    const dec = await readCount(/Decreasing Demand/i)
    const rows = await forecastRows(page).count()

    expect(inc + sta + dec).toBe(rows)
  })
})
