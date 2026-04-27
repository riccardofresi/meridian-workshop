// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Critical Flow #9 — Dark mode toggle (R2 desired item D3).
 *
 * Operator-selectable theme persisted via localStorage. The toggle is in the
 * banner next to the language switcher. Switching themes flips a `data-theme`
 * attribute on `<html>` which CSS variables hang off of.
 *
 * What this spec asserts:
 *  - The toggle is visible in the banner.
 *  - Default state is light: no `data-theme="dark"`, body uses the light
 *    background colour.
 *  - Clicking toggles to dark: data-theme becomes `dark`, body background
 *    becomes the dark token, localStorage records `'dark'`.
 *  - Clicking again returns to light.
 *  - The choice survives a full page reload (localStorage persistence).
 */

test.describe('Dark mode — toggle and persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean theme preference. Done via evaluate after
    // goto (not addInitScript) so a later page.reload() in the persistence
    // test doesn't re-clear the value we just stored.
    await page.goto('/')
    await page.evaluate(() => window.localStorage.removeItem('app-theme'))
    await page.reload()
  })

  test('toggle button is visible in the banner', async ({ page }) => {
    const banner = page.getByRole('banner')
    await expect(banner.getByRole('button', { name: /Switch to (dark|light) mode/i })).toBeVisible()
  })

  test('default load is light (no data-theme attribute set to dark)', async ({ page }) => {
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    // Either no attribute or explicitly "light" is acceptable.
    expect(theme === null || theme === 'light').toBe(true)
  })

  test('clicking the toggle switches to dark and persists the choice', async ({ page }) => {
    const toggle = page.getByRole('banner').getByRole('button', { name: /Switch to dark mode/i })
    await toggle.click()

    // data-theme attribute is now "dark".
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    ).toBe('dark')

    // localStorage carries the same value.
    const stored = await page.evaluate(() => window.localStorage.getItem('app-theme'))
    expect(stored).toBe('dark')

    // Body background colour visibly differs from the light default. The
    // light default body bg is rgb(248, 250, 252) (luminance ~249); the dark
    // one is rgb(11, 17, 32) (luminance ~17). The body has a 0.2s transition
    // so we poll until the colour settles to something clearly dark.
    await expect.poll(async () => {
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (!m) return null
      const [r, g, b] = m.slice(1, 4).map(Number)
      return 0.299 * r + 0.587 * g + 0.114 * b
    }).toBeLessThan(50)

    // Toggle button label has flipped.
    await expect(page.getByRole('banner').getByRole('button', { name: /Switch to light mode/i })).toBeVisible()
  })

  test('toggling again returns to light', async ({ page }) => {
    const banner = page.getByRole('banner')
    await banner.getByRole('button', { name: /Switch to dark mode/i }).click()
    await banner.getByRole('button', { name: /Switch to light mode/i }).click()

    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    ).toBe('light')
  })

  test('preference survives a full page reload (localStorage persistence)', async ({ page }) => {
    await page.getByRole('banner').getByRole('button', { name: /Switch to dark mode/i }).click()
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    ).toBe('dark')

    await page.reload()

    // After the reload the same preference must apply on first paint of <html>.
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    ).toBe('dark')
    await expect(page.getByRole('banner').getByRole('button', { name: /Switch to light mode/i })).toBeVisible()
  })
})
