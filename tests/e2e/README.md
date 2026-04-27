# End-to-End Browser Tests

This is the **R3 deliverable** of the Meridian engagement (RFP MC-2026-0417):
automated end-to-end browser coverage of the inventory dashboard's critical user flows,
runnable by Meridian IT in CI without any external dependencies on the engagement team.

## Stack

- **[Playwright](https://playwright.dev)** test runner — Chromium, headless by default
- Tests authored against `http://localhost:3000` (Vite dev server)
- Independent of the rest of the project: lives in `tests/e2e/` with its own `package.json`

## Prerequisites

- Node.js 18+ and npm
- Backend (`http://localhost:8001`) and frontend (`http://localhost:3000`) running.
  Use the project's `/start` slash command, the `scripts/start.sh` helper, or start each
  manually:
  ```sh
  # Backend
  cd server && uv run python main.py

  # Frontend (separate terminal)
  cd client && npm run dev
  ```

## First-time setup

From the repository root:

```sh
cd tests/e2e
npm install
npx playwright install chromium
```

The first command pulls `@playwright/test`. The second downloads the Chromium browser
binary that Playwright drives.

## Running the suite

```sh
# from tests/e2e/
npm test                 # headless, list reporter + HTML report
npm run test:headed      # show the browser while tests run (debugging)
npm run test:ui          # Playwright UI mode (interactive runner)
npm run report           # open the last HTML report in the browser
```

The HTML report is written to `tests/e2e/playwright-report/`.
Failed tests retain a trace, screenshot, and short video for inspection
(see `tests/e2e/test-results/` after a failure).

## Configuration

`playwright.config.js` sets:

- `baseURL` — defaults to `http://localhost:3000`. Override with the `E2E_BASE_URL`
  environment variable to point at a staging deployment:
  ```sh
  E2E_BASE_URL=https://staging.meridian.example npm test
  ```
- `retries: 2` in CI, `0` locally
- `trace: retain-on-failure` — full Playwright trace kept only on red, viewable with
  `npx playwright show-trace test-results/<...>/trace.zip`
- `screenshot: only-on-failure`, `video: retain-on-failure`
- One `projects` entry — Desktop Chrome. Adding Firefox or WebKit is a one-line change.

## Critical-flow inventory

The full critical-flow plan from the proposal (`proposal/02-technical-approach.md` §R3)
is below. Tests are added incrementally; this README is the source of truth for status.

| # | Flow | Spec file | Status |
|---|------|-----------|--------|
| 1 | Login &amp; navigation across all views | `specs/01-smoke-navigation.spec.js` | ✅ shipped |
| 2 | Inventory filtering across warehouses and categories | `specs/02-inventory-filters.spec.js` | ✅ shipped |
| 3 | Order drill-down with filter combinations | `specs/03-orders-drilldown.spec.js` | ✅ shipped |
| 4 | Reports — quarterly view with all filters applied | `specs/04-reports.spec.js` | ✅ existing-behaviour shipped · 🚧 regression contract `fixme`, flips on R1 rewrite |
| 5 | Demand forecast view rendering and trend display | `specs/05-demand.spec.js` | ✅ shipped |
| 6 | Backlog view with PO status tracking | `specs/06-backlog.spec.js` | ✅ shipped (W7 — route added, #DEBT-05 closed) |
| 7 | Spending — summary, monthly, and category views with filter consistency | `specs/07-spending.spec.js` | ✅ shipped |
| 8 | Restocking flow end-to-end (added in Phase 2) | `specs/08-restocking.spec.js` | ✅ shipped (R2 W6) |

## Authoring conventions

- **Locators by role and accessible name** (`getByRole('link', { name: 'Inventory' })`)
  rather than CSS selectors. Survives refactors of class names and DOM structure.
- **No `page.waitForTimeout`**. Wait on observable state (`expect(...).toBeVisible()`)
  or on network idle. Sleep-and-hope is grounds for a PR comment.
- **One concept per test.** A failing test should name exactly what is broken.
- **Page objects** when a flow uses 3+ pages. Not earlier — small spec files are easier
  to read than premature abstraction.

## Running in CI

A minimal GitHub Actions workflow is sufficient:

```yaml
# .github/workflows/e2e.yml
name: E2E
on: [pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install uv
      - run: cd server && uv sync
      - run: cd client && npm install
      - run: cd tests/e2e && npm install && npx playwright install --with-deps chromium
      - name: Start servers
        run: |
          (cd server && uv run python main.py &)
          (cd client && npm run dev &)
          npx wait-on http://localhost:3000 http://localhost:8001/api/dashboard/summary
      - run: cd tests/e2e && npm test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: tests/e2e/playwright-report
```

Adapt to Meridian's CI of choice. The shape is the same on Jenkins, GitLab, or Azure DevOps.

## Troubleshooting

- **`Error: page.goto: net::ERR_CONNECTION_REFUSED`** — the dev servers are not running.
  Start them first.
- **`Browser was not installed`** — run `npx playwright install chromium`.
- **Flaky test** — open the trace with `npx playwright show-trace`. If the test waits on
  a sleep instead of an observable condition, refactor it. We do not retry to mask flakes.

## Maintained by

The engagement team during Phases 1–3. Operational ownership transfers to Meridian IT
at M3 (week 10). All conventions in this document are written so the suite remains
maintainable without us.
