<template>
  <div class="app">
    <header class="top-nav">
      <div class="nav-container">
        <div class="logo">
          <h1>{{ t('nav.companyName') }}</h1>
          <span class="subtitle">{{ t('nav.subtitle') }}</span>
        </div>
        <nav class="nav-tabs">
          <router-link to="/" :class="{ active: $route.path === '/' }">
            {{ t('nav.overview') }}
          </router-link>
          <router-link to="/inventory" :class="{ active: $route.path === '/inventory' }">
            {{ t('nav.inventory') }}
          </router-link>
          <router-link to="/orders" :class="{ active: $route.path === '/orders' }">
            {{ t('nav.orders') }}
          </router-link>
          <router-link to="/spending" :class="{ active: $route.path === '/spending' }">
            {{ t('nav.finance') }}
          </router-link>
          <router-link to="/demand" :class="{ active: $route.path === '/demand' }">
            {{ t('nav.demandForecast') }}
          </router-link>
          <router-link to="/reports" :class="{ active: $route.path === '/reports' }">
            Reports
          </router-link>
          <router-link to="/restocking" :class="{ active: $route.path === '/restocking' }">
            Restocking
          </router-link>
          <router-link to="/backlog" :class="{ active: $route.path === '/backlog' }">
            Backlog
          </router-link>
        </nav>
        <LanguageSwitcher />
        <ThemeToggle />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </div>
    </header>
    <FilterBar />
    <main class="main-content">
      <router-view />
    </main>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher,
    ThemeToggle
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Theme tokens.
 * Light is the default; [data-theme="dark"] (set on <html> by useTheme.js)
 * overrides the same names. New components should consume these variables
 * rather than hardcoded hex values. */
:root {
  --bg-app: #f8fafc;
  --bg-elevated: #ffffff;
  --bg-muted: #f1f5f9;
  --ink-strong: #0f172a;
  --ink: #1e293b;
  --ink-soft: #64748b;
  --border: #e2e8f0;
  --border-soft: #f1f5f9;
  --accent: #2563eb;
  --accent-soft: #eff6ff;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.06);
  color-scheme: light;
}

:root[data-theme="dark"] {
  --bg-app: #0b1120;
  --bg-elevated: #111827;
  --bg-muted: #1f2937;
  --ink-strong: #f1f5f9;
  --ink: #e2e8f0;
  --ink-soft: #94a3b8;
  --border: #1f2937;
  --border-soft: #1e293b;
  --accent: #60a5fa;
  --accent-soft: #1e3a8a;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.5);
  color-scheme: dark;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-app);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-nav {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  height: 70px;
}

.nav-container > .nav-tabs {
  margin-left: auto;
  margin-right: 1rem;
}

.nav-container > .language-switcher {
  margin-right: 1rem;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.logo h1 {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.813rem;
  color: #64748b;
  font-weight: 400;
  padding-left: 0.75rem;
  border-left: 1px solid #e2e8f0;
}

.nav-tabs {
  display: flex;
  gap: 0.25rem;
}

.nav-tabs a {
  padding: 0.625rem 1.25rem;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.938rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-tabs a:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.nav-tabs a.active {
  color: #2563eb;
  background: #eff6ff;
}

.nav-tabs a.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #2563eb;
}

.main-content {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.375rem;
  letter-spacing: -0.025em;
}

.page-header p {
  color: #64748b;
  font-size: 0.938rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.625rem;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.stat-card.warning .stat-value {
  color: #ea580c;
}

.stat-card.success .stat-value {
  color: #059669;
}

.stat-card.danger .stat-value {
  color: #dc2626;
}

.stat-card.info .stat-value {
  color: #2563eb;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.875rem;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: #f8fafc;
}

.badge {
  display: inline-block;
  padding: 0.313rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.badge.warning {
  background: #fed7aa;
  color: #92400e;
}

.badge.danger {
  background: #fecaca;
  color: #991b1b;
}

.badge.info {
  background: #dbeafe;
  color: #1e40af;
}

.badge.increasing {
  background: #d1fae5;
  color: #065f46;
}

.badge.decreasing {
  background: #fecaca;
  color: #991b1b;
}

.badge.stable {
  background: #e0e7ff;
  color: #3730a3;
}

.badge.high {
  background: #fecaca;
  color: #991b1b;
}

.badge.medium {
  background: #fed7aa;
  color: #92400e;
}

.badge.low {
  background: #dbeafe;
  color: #1e40af;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 0.938rem;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.938rem;
}

/* ---------------------------------------------------------------
 * Dark mode overrides
 *
 * App.vue's <style> is intentionally non-scoped so these rules can
 * reach component classes (e.g. `.card`, `.stat-card`, `.badge`,
 * `.filters-bar`) without `:deep()` boilerplate per file. Per-component
 * scoped styles still apply on top — these rules only override what
 * needs to flip in dark mode.
 *
 * Coverage is intentionally limited to the high-traffic surfaces
 * (banner, filter bar, cards, tables, badges, page headers). Long-tail
 * surfaces remain on their original light palette in dark mode and are
 * tracked as a Phase-3 polish follow-on.
 * --------------------------------------------------------------- */
:root[data-theme="dark"] .top-nav {
  background: var(--bg-elevated);
  border-bottom-color: var(--border);
}

:root[data-theme="dark"] .logo h1,
:root[data-theme="dark"] .page-header h2,
:root[data-theme="dark"] .card-title,
:root[data-theme="dark"] .stat-value {
  color: var(--ink-strong);
}

:root[data-theme="dark"] .subtitle,
:root[data-theme="dark"] .page-header p,
:root[data-theme="dark"] .stat-label {
  color: var(--ink-soft);
}

:root[data-theme="dark"] .nav-tabs a {
  color: var(--ink-soft);
}

:root[data-theme="dark"] .nav-tabs a:hover {
  color: var(--ink-strong);
  background: var(--bg-muted);
}

:root[data-theme="dark"] .nav-tabs a.active {
  color: var(--accent);
  background: var(--accent-soft);
}

:root[data-theme="dark"] .stat-card,
:root[data-theme="dark"] .card {
  background: var(--bg-elevated);
  border-color: var(--border);
}

:root[data-theme="dark"] .stat-card:hover {
  border-color: var(--ink-soft);
  box-shadow: var(--shadow-hover);
}

:root[data-theme="dark"] .card-header {
  border-bottom-color: var(--border);
}

:root[data-theme="dark"] thead {
  background: var(--bg-muted);
  border-color: var(--border);
}

:root[data-theme="dark"] th {
  color: var(--ink-soft);
}

:root[data-theme="dark"] td {
  color: var(--ink);
  border-top-color: var(--border-soft);
}

:root[data-theme="dark"] tbody tr:hover {
  background: var(--bg-muted);
}

:root[data-theme="dark"] .filters-bar,
:root[data-theme="dark"] .filter-group select,
:root[data-theme="dark"] .filter-select {
  background: var(--bg-elevated);
  border-color: var(--border);
  color: var(--ink);
}

:root[data-theme="dark"] .filter-group label {
  color: var(--ink-soft);
}

:root[data-theme="dark"] input[type="text"],
:root[data-theme="dark"] input[type="number"],
:root[data-theme="dark"] input[type="search"] {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--ink);
}

:root[data-theme="dark"] input::placeholder {
  color: var(--ink-soft);
  opacity: 0.7;
}

/* ThemeToggle button picks up its own vars via the scoped fallback chain */
:root[data-theme="dark"] {
  --toggle-border: var(--border);
  --toggle-fg: var(--ink-soft);
  --toggle-bg-hover: var(--bg-muted);
  --toggle-fg-hover: var(--ink-strong);
}

/* ---------------------------------------------------------------
 * High-specificity overrides for surfaces that are styled in
 * component-scoped CSS. Vue scoped styles add a [data-v-xxx]
 * attribute to selectors; their specificity ties with our globals,
 * but they are loaded after App.vue and win on tie. We use
 * `!important` here deliberately — these rules only apply under
 * [data-theme="dark"], so the trade-off is bounded.
 * --------------------------------------------------------------- */
:root[data-theme="dark"] .kpi-card {
  background: var(--bg-elevated) !important;
  border-color: var(--border) !important;
  color: var(--ink) !important;
}

:root[data-theme="dark"] .filter-select,
:root[data-theme="dark"] select.filter-select {
  background: var(--bg-elevated) !important;
  border-color: var(--border) !important;
  color: var(--ink) !important;
}

:root[data-theme="dark"] .filter-select:hover,
:root[data-theme="dark"] .filter-select:focus {
  border-color: var(--ink-soft) !important;
}

:root[data-theme="dark"] .filters-bar {
  background: var(--bg-app) !important;
  border-color: var(--border) !important;
}

:root[data-theme="dark"] .clickable-row:hover {
  background: var(--bg-muted) !important;
}

:root[data-theme="dark"] .h-bar-container,
:root[data-theme="dark"] .task-item:hover {
  background: var(--bg-muted) !important;
}

/* Stat-card and kpi-card values often have hardcoded ink color in
 * scoped CSS — pull them onto the variable too. */
:root[data-theme="dark"] .stat-value,
:root[data-theme="dark"] .kpi-card .stat-value,
:root[data-theme="dark"] .kpi-value {
  color: var(--ink-strong) !important;
}

/* Generic card-like containers in views often re-declare bg: white. */
:root[data-theme="dark"] .stats-grid > .stat-card,
:root[data-theme="dark"] .stats-grid > .kpi-card {
  background: var(--bg-elevated) !important;
  border-color: var(--border) !important;
}

/* Banner control buttons — language switcher, profile menu, reset filters.
 * All three live in component-scoped CSS with `background: white;`. */
:root[data-theme="dark"] .language-button,
:root[data-theme="dark"] .profile-button,
:root[data-theme="dark"] .reset-filters-btn {
  background: var(--bg-elevated) !important;
  border-color: var(--border) !important;
  color: var(--ink) !important;
}

:root[data-theme="dark"] .language-button:hover,
:root[data-theme="dark"] .profile-button:hover,
:root[data-theme="dark"] .reset-filters-btn:hover:not(:disabled) {
  background: var(--bg-muted) !important;
  border-color: var(--ink-soft) !important;
}

/* Dropdowns hanging off those buttons (LanguageSwitcher dropdown menu,
 * ProfileMenu menu and items). */
:root[data-theme="dark"] .dropdown-menu,
:root[data-theme="dark"] .profile-menu,
:root[data-theme="dark"] .menu-item,
:root[data-theme="dark"] .dropdown-item {
  background: var(--bg-elevated) !important;
  border-color: var(--border) !important;
  color: var(--ink) !important;
}

:root[data-theme="dark"] .dropdown-item:hover,
:root[data-theme="dark"] .menu-item:hover {
  background: var(--bg-muted) !important;
  color: var(--ink-strong) !important;
}

:root[data-theme="dark"] .language-name,
:root[data-theme="dark"] .language-label {
  color: var(--ink) !important;
}

/* ProfileMenu dropdown internals: header banner, name/email, divider,
 * task badge, logout item. The .dropdown-menu is already darkened above;
 * these are the children that re-declare their own backgrounds/colors. */
:root[data-theme="dark"] .dropdown-header {
  background: var(--bg-muted) !important;
}

:root[data-theme="dark"] .user-name,
:root[data-theme="dark"] .profile-name {
  color: var(--ink-strong) !important;
}

:root[data-theme="dark"] .user-email {
  color: var(--ink-soft) !important;
}

:root[data-theme="dark"] .dropdown-divider {
  background: var(--border) !important;
}

:root[data-theme="dark"] .dropdown-item.logout {
  color: #f87171 !important;  /* keep destructive cue but lighten for dark bg */
}

:root[data-theme="dark"] .dropdown-item.logout:hover {
  background: rgba(248, 113, 113, 0.12) !important;
}

:root[data-theme="dark"] .task-badge {
  background: var(--accent) !important;
  color: var(--bg-app) !important;
}
</style>
