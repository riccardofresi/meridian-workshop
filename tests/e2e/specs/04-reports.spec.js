// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #4 — Reports module.
 *
 * **Strategic role.** This spec is the *non-regression contract* for the R1 Reports
 * rewrite (defect log #01–#11, #04 ADR-002). The current implementation has known
 * defects — the assertions below describe what the rewrite must continue to deliver,
 * NOT the buggy behaviour.
 *
 * Tests are organised in two groups:
 *  - **Existing behaviour**: things that work today and must not break in the rewrite.
 *  - **Regression contract for R1**: behaviour the rewrite is expected to introduce
 *    (filters affecting the displayed data). Marked `test.fixme` until the rewrite
 *    lands; flipping them to `test` is part of the R1 acceptance gate.
 */

test.describe('Reports — existing behaviour (must not regress)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
  })

  test('renders all four section headers', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: /Reports/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Quarterly Performance/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Monthly Revenue Trend/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Month-over-Month/i })).toBeVisible()
  })

  test('quarterly performance table has the five expected columns', async ({ page }) => {
    const tableCard = page.locator('.card', { hasText: 'Quarterly Performance' })
    const expectedColumns = ['Quarter', 'Total Orders', 'Total Revenue', 'Avg Order Value', 'Fulfillment Rate']
    for (const col of expectedColumns) {
      await expect(tableCard.getByRole('columnheader', { name: col })).toBeVisible()
    }
  })

  test('quarterly performance table renders at least one data row', async ({ page }) => {
    const tableCard = page.locator('.card', { hasText: 'Quarterly Performance' })
    // tbody rows — exclude the header row
    const rows = tableCard.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('monthly revenue trend chart renders bars for at least three months', async ({ page }) => {
    const chartCard = page.locator('.card', { hasText: 'Monthly Revenue Trend' })
    const bars = chartCard.locator('.bar-wrapper')
    // Wait for the chart to populate (Reports does two sequential fetches at mount).
    await expect(bars.first()).toBeVisible()
    expect(await bars.count()).toBeGreaterThanOrEqual(3)
  })

  test('summary stats card shows four KPIs with non-empty values', async ({ page }) => {
    const expectedLabels = [
      /Total Revenue/i,
      /Avg Monthly Revenue/i,
      /Total Orders/i,
      /Best Performing Quarter/i
    ]
    for (const label of expectedLabels) {
      const card = page.locator('.stat-card', { hasText: label })
      await expect(card).toBeVisible()
      const value = card.locator('.stat-value')
      await expect(value).toBeVisible()
      await expect(value).not.toHaveText('')
    }
  })

  test('page loads without runtime errors specific to Reports', async ({ page }) => {
    // Collect console errors fresh on this page. We ignore three documented App-level
    // defects that are not in scope of the R1 Reports rewrite:
    //   - defect #02: /api/tasks 404 → "Failed to load tasks: AxiosError"
    //   - defect #14: PurchaseOrderModal Vue warning
    //   - the bare "Failed to load resource: ... 404 (Not Found)" Chrome emits for
    //     the same /api/tasks request (and for /api/purchase-orders, defect #03)
    const reportsErrors = []
    page.on('console', msg => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (/Failed to load tasks/i.test(text)) return                          // defect #02
      if (/PurchaseOrderModal/i.test(text)) return                            // defect #14
      if (/Failed to load resource.*404/i.test(text)) return                  // defects #02 + #03
      reportsErrors.push(text)
    })

    await page.reload()
    await expect(page.getByRole('heading', { name: /Quarterly Performance/i })).toBeVisible()
    expect(reportsErrors, 'unexpected console errors on Reports page').toEqual([])
  })
})

test.describe('Reports — R1 regression contract', () => {
  // These tests gate the R1 rewrite (defect #01 filter integration, defect #07 i18n).
  // All green => the rewrite delivered the required behaviour.

  // Helper: locate the <select> inside the .filter-group whose label contains the given text.
  // The FilterBar uses sibling <label>+<select>, not associated, so getByLabel doesn't apply.
  const filterSelect = (page, labelText) =>
    page.locator('.filter-group').filter({ hasText: labelText }).getByRole('combobox')

  test('changing the Time Period filter reloads quarterly data (defect #01)', async ({ page }) => {
    await page.goto('/reports')

    const tableCard = page.locator('.card', { hasText: 'Quarterly Performance' })
    await expect(tableCard.locator('tbody tr').first()).toBeVisible()
    const totalRowsBefore = await tableCard.locator('tbody tr').count()

    // Apply a Time Period filter — the request must include month= query param.
    const requestPromise = page.waitForRequest(req =>
      req.url().includes('/api/reports/quarterly') && req.url().includes('month=')
    )
    await filterSelect(page, 'Time Period').selectOption('2025-03')
    await requestPromise

    // Selecting a single month leaves at most one quarter (Q1-2025) — strictly fewer
    // rows than the unfiltered four-quarter view.
    await expect.poll(async () =>
      tableCard.locator('tbody tr').count()
    ).toBeLessThan(totalRowsBefore)
  })

  test('changing the Location filter reloads monthly trends (defect #01)', async ({ page }) => {
    await page.goto('/reports')

    const requestPromise = page.waitForRequest(req =>
      req.url().includes('/api/reports/monthly-trends') && req.url().includes('warehouse=')
    )
    await filterSelect(page, 'Location').selectOption('London')
    await requestPromise

    // The chart should still render (no crash) and at least one bar should be present.
    const chartCard = page.locator('.card', { hasText: 'Monthly Revenue Trend' })
    await expect(chartCard.locator('.bar-wrapper').first()).toBeVisible()
  })

  test('reports page strings translate when locale switches to Japanese (defect #07)', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: 'Performance Reports' })).toBeVisible()

    // Open the language dropdown (header button labelled "English") and pick Japanese.
    // The dropdown items are <button> elements with the language name as accessible name.
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: '日本語' }).click()

    // The English title must be gone and the Japanese title present.
    await expect(page.getByRole('heading', { name: 'Performance Reports' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'パフォーマンスレポート' })).toBeVisible()
  })
})
