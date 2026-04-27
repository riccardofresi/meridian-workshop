import { ref, watch } from 'vue'

const STORAGE_KEY = 'app-theme'
const VALID_THEMES = ['light', 'dark']

const initial = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (VALID_THEMES.includes(saved)) return saved
  } catch (_e) { /* ignore — we still have a default */ }
  return 'light'
})()

const currentTheme = ref(initial)

const apply = (theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

apply(currentTheme.value)

watch(currentTheme, (theme) => {
  apply(theme)
  try { localStorage.setItem(STORAGE_KEY, theme) } catch (_e) { /* ignore */ }
})

export function useTheme() {
  const isDark = () => currentTheme.value === 'dark'

  const setTheme = (theme) => {
    if (VALID_THEMES.includes(theme)) currentTheme.value = theme
  }

  const toggleTheme = () => {
    currentTheme.value = isDark() ? 'light' : 'dark'
  }

  return {
    currentTheme,
    isDark,
    setTheme,
    toggleTheme
  }
}
