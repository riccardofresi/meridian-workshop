// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #8 — Restocking recommendations end-to-end (R2 deliverable).
 *
 * The Restocking view is the new capability built in Phase 2. Recommendations
 * come from an (s, S)-style policy on the backend; operators can override
 * quantities, and the in-budget/out-of-budget split updates from a greedy
 * allocation against the budget ceiling.
 *
 * What this spec asserts:
 *  - Page renders, auto-loads recommendations on mount.
 *  - Summary cards (Candidates / In budget / Out / Total cost / Remaining) all
 *    populate with consistent values.
 *  - Table renders with 11 columns and at least one recommendation.
 *  - Recommendations are sorted by criticality (estimated cost descending is
 *    a strong proxy when forecasts ≈ shortfalls).
 *  - Lowering the budget triggers a new request and pushes some rows
 *    out of budget.
 *  - Operator override: editing the qty input changes the est. cost cell.
 */

const summaryCard = (page, label) =>
  page.locator('.stat-card', { hasText: label })

const recommendationRows = (page) =>
  page.locator('.restocking-table tbody tr')

test.describe('Restocking — recommendations and operator overrides', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/restocking')
    // The view auto-loads on mount — wait for at least one row.
    await expect(recommendationRows(page).first()).toBeVisible()
  })

  test('renders the operator controls and the auto-loaded recommendations', async ({ page }) => {
    // Header
    await expect(page.getByRole('heading', { level: 2, name: /Restocking Recommendations/i })).toBeVisible()

    // Operator inputs
    await expect(page.getByLabel('Budget ceiling')).toBeVisible()
    await expect(page.getByLabel('Service level')).toBeVisible()
    await expect(page.getByRole('button', { name: /Generate recommendations/i })).toBeVisible()

    // Summary cards
    for (const label of [/Candidates/i, /In budget/i, /Out of budget/i, /Total selected cost/i, /Budget remaining/i]) {
      await expect(summaryCard(page, label)).toBeVisible()
    }
  })

  test('table has the eleven expected columns', async ({ page }) => {
    const expected = [
      'SKU', 'Item Name', 'Category', 'Warehouse',
      'On Hand', 'Reorder Point', 'Forecast', 'Recommended Qty',
      'Unit Cost', 'Est. Cost', 'Status'
    ]
    for (const col of expected) {
      await expect(page.locator('.restocking-table').getByRole('columnheader', { name: col })).toBeVisible()
    }
  })

  test('summary counts match the table contents', async ({ page }) => {
    const candidatesText = await summaryCard(page, /Candidates/i).locator('.stat-value').textContent()
    const candidates = parseInt((candidatesText || '0').trim(), 10)

    const inBudgetText = await summaryCard(page, /In budget/i).locator('.stat-value').textContent()
    const inBudget = parseInt((inBudgetText || '0').trim(), 10)

    const outOfBudgetText = await summaryCard(page, /Out of budget/i).locator('.stat-value').textContent()
    const outOfBudget = parseInt((outOfBudgetText || '0').trim(), 10)

    const rowCount = await recommendationRows(page).count()

    expect(candidates).toBe(rowCount)
    expect(inBudget + outOfBudget).toBe(candidates)
  })

  test('recommendations are sorted by estimated cost descending', async ({ page }) => {
    // Pull the Est. Cost column (10th, 1-indexed) and parse as numbers.
    const cells = await recommendationRows(page).locator('td:nth-child(10)').allTextContents()
    expect(cells.length).toBeGreaterThan(1)

    const numbers = cells.map((t) => parseFloat((t || '').replace(/[^\d.-]/g, '')))
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBeLessThanOrEqual(numbers[i - 1])
    }
  })

  test('lowering the budget marks some rows as out of budget', async ({ page }) => {
    const rowCount = await recommendationRows(page).count()
    expect(rowCount).toBeGreaterThan(1) // need at least 2 rows to demote one

    // Apply a deliberately tight budget and trigger generation.
    const requestPromise = page.waitForRequest(req =>
      req.url().includes('/api/restocking/recommendations') && req.url().includes('budget=10000')
    )
    await page.getByLabel('Budget ceiling').fill('10000')
    await page.getByRole('button', { name: /Generate recommendations/i }).click()
    await requestPromise

    // After the generation, at least one row must show "Out of budget".
    await expect.poll(async () =>
      page.locator('.restocking-table tbody tr.out-of-budget').count()
    ).toBeGreaterThan(0)

    // And the Out of budget summary card must be > 0.
    await expect(summaryCard(page, /Out of budget/i).locator('.stat-value')).not.toHaveText('0')
  })

  test('operator override: editing the qty input updates the est. cost cell', async ({ page }) => {
    const firstRow = recommendationRows(page).first()
    const qtyInput = firstRow.locator('td:nth-child(8) input')
    const estCostCell = firstRow.locator('td:nth-child(10)')

    const costBefore = (await estCostCell.textContent()) || ''

    // Set a deliberately small override quantity.
    await qtyInput.fill('1')

    // The est. cost cell must update — it can't be the same as before.
    await expect.poll(async () => (await estCostCell.textContent()) || '').not.toBe(costBefore)
  })
})
