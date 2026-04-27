/**
 * Tiny pluralization helper.
 *
 * Returns "<n> <singular|plural>" depending on the value of n.
 * Designed for English, where 1 takes the singular form and everything else
 * (including 0) takes the plural. For locales without grammatical number
 * (e.g. Japanese) the i18n layer should resolve to a single string and this
 * helper is unnecessary.
 *
 *   pluralize(1, 'day', 'days')   // "1 day"
 *   pluralize(0, 'day', 'days')   // "0 days"
 *   pluralize(3, 'item', 'items') // "3 items"
 */
export function pluralize(count, singular, plural) {
  const n = Number(count) || 0
  return `${n} ${n === 1 ? singular : plural}`
}
