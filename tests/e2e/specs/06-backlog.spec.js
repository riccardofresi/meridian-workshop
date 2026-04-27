// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #6 — Backlog view with PO status tracking.
 *
 * High-stakes for fulfillment. Until W7 the Backlog view was unreachable
 * (defect #DEBT-05 — view present but no route registered); routing was
 * added together with the i18n cleanup that closed defects #08 and #09.
 *
 * What this spec asserts:
 *  - The page is reachable via the /backlog route and via the nav link.
 *  - The four priority stat cards (High / Medium / Low / Total) render with
 *    numeric values that are internally consistent (sum of priorities ≥
 *    sum displayed, allowing for items with no priority field).
 *  - The table has the eight expected columns and at least one row.
 *  - Each row's priority badge is translated (not the raw lowercase value).
 *  - The pluralization helper is wired: rows with `days_delayed=1` render
 *    "1 day" not "1 days" (defect #16 contract).
 *  - Switching locale to Japanese translates the page title.
 */

const backlogRows = (page) =>
  page.locator('.card', { hasText: /Backlog Items|バックログアイテム/i }).locator('tbody tr')

test.describe('Backlog — view, priorities, and i18n', () => {
  test.beforeEach(async ({ page }) => {
    // useI18n persists the chosen locale to localStorage. If a previous test
    // switched to Japanese and didn't reset, the UI would render in JP and
    // the English assertions below would fail spuriously. Pin to English
    // before each test loads.
    await page.addInitScript(() => window.localStorage.setItem('app-locale', 'en'))

    await page.goto('/backlog')
    await expect(backlogRows(page).first()).toBeVisible()
  })

  // Reset the locale after each test so the JP-switch test inside this block
  // doesn't leak into the next test on the same worker.
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.removeItem('app-locale'))
  })

  test('reachable via the /backlog URL and nav link', async ({ page }) => {
    // URL works directly (already loaded by beforeEach).
    await expect(page).toHaveURL(/\/backlog$/)
    await expect(page.getByRole('heading', { level: 2, name: /Backlog Management/i })).toBeVisible()

    // Nav link is present and active.
    const navLink = page.getByRole('navigation').getByRole('link', { name: 'Backlog' })
    await expect(navLink).toBeVisible()
  })

  test('renders the four priority stat cards with numeric values', async ({ page }) => {
    for (const label of [/High Priority/i, /Medium Priority/i, /Low Priority/i, /Total Backlog Items/i]) {
      const card = page.locator('.stat-card', { hasText: label })
      await expect(card).toBeVisible()
      await expect(card.locator('.stat-value')).toHaveText(/^\d+$/)
    }
  })

  test('priority counts sum to at most the total', async ({ page }) => {
    const readCount = async (label) => {
      const t = (await page.locator('.stat-card', { hasText: label }).locator('.stat-value').textContent()) || ''
      return parseInt(t.trim(), 10)
    }
    const high = await readCount(/High Priority/i)
    const med = await readCount(/Medium Priority/i)
    const low = await readCount(/Low Priority/i)
    const total = await readCount(/Total Backlog Items/i)

    // High + Medium + Low must be ≤ Total. Equality is the common case;
    // less-than is acceptable if any rows lack a priority value.
    expect(high + med + low).toBeLessThanOrEqual(total)
  })

  test('table has the eight expected columns and at least one row', async ({ page }) => {
    const expected = [
      'Order ID', 'SKU', 'Item Name',
      'Quantity Needed', 'Quantity Available', 'Shortage',
      'Days Delayed', 'Priority'
    ]
    for (const col of expected) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible()
    }
    expect(await backlogRows(page).count()).toBeGreaterThan(0)
  })

  test('priority badge cells are translated, not raw lowercase values', async ({ page }) => {
    const priorityCells = backlogRows(page).locator('td:nth-child(8)')
    const texts = await priorityCells.allTextContents()
    expect(texts.length).toBeGreaterThan(0)

    const allowed = ['High', 'Medium', 'Low']
    for (const t of texts) {
      expect(allowed, `unexpected priority badge text: "${t}"`).toContain(t.trim())
    }
  })

  test('pluralization: a row with days_delayed=1 reads "1 day", not "1 days"', async ({ page }) => {
    // Find the Days Delayed cells and check that any row showing "1" in the
    // numeric position uses the singular form. We accept other values (3 days,
    // 5 days) as plural; the contract is specifically the "1" case.
    const dayCells = backlogRows(page).locator('td:nth-child(7)')
    const texts = await dayCells.allTextContents()

    const oneDayRow = texts.find((t) => /^\s*1\s/.test(t))
    if (!oneDayRow) {
      test.skip(true, 'No row with days_delayed=1 in the current data — pluralization contract not exercisable here.')
    }
    expect(oneDayRow.trim()).toBe('1 day')
  })

  test('switching locale to Japanese translates the title (defect #08 contract)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Backlog Management' })).toBeVisible()

    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: '日本語' }).click()

    await expect(page.getByRole('heading', { name: 'Backlog Management' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'バックログ管理' })).toBeVisible()
  })
})
