<template>
  <div class="restocking">
    <div class="page-header">
      <h2>{{ t('restocking.title') }}</h2>
      <p>{{ t('restocking.subtitle') }}</p>
    </div>

    <!-- Operator controls -->
    <div class="card controls-card">
      <div class="controls">
        <div class="control-group">
          <label for="budget-input">{{ t('restocking.budgetLabel') }}</label>
          <div class="budget-input">
            <span class="prefix">{{ currencySymbol }}</span>
            <input
              id="budget-input"
              type="number"
              v-model.number="budgetInput"
              min="0"
              step="1000"
              @keyup.enter="generate"
            />
          </div>
        </div>

        <div class="control-group">
          <label for="service-level">{{ t('restocking.serviceLevelLabel') }}</label>
          <div class="service-level">
            <input
              id="service-level"
              type="range"
              v-model.number="serviceLevel"
              min="0.80"
              max="0.99"
              step="0.01"
            />
            <span class="value">{{ Math.round(serviceLevel * 100) }}%</span>
          </div>
        </div>

        <button class="generate-btn" @click="generate" :disabled="loading">
          {{ loading ? t('restocking.loading') : t('restocking.generate') }}
        </button>
      </div>
      <p class="note">{{ t('restocking.note') }}</p>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <!-- Summary cards -->
    <div v-if="summary" class="summary-grid">
      <div class="stat-card">
        <div class="stat-label">{{ t('restocking.summary.candidates') }}</div>
        <div class="stat-value">{{ summary.total_candidates }}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">{{ t('restocking.summary.inBudget') }}</div>
        <div class="stat-value">{{ summary.items_in_budget }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">{{ t('restocking.summary.outOfBudget') }}</div>
        <div class="stat-value">{{ summary.items_out_of_budget }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">{{ t('restocking.summary.totalCost') }}</div>
        <div class="stat-value">{{ formatCurrency(selectedTotalCost, currentCurrency) }}</div>
      </div>
      <div class="stat-card" :class="{ danger: budgetRemaining < 0 }">
        <div class="stat-label">{{ t('restocking.summary.remaining') }}</div>
        <div class="stat-value">{{ formatCurrency(budgetRemaining, currentCurrency) }}</div>
      </div>
    </div>

    <!-- Recommendations table -->
    <div v-if="recommendations.length > 0" class="card">
      <div class="table-container">
        <table class="restocking-table">
          <thead>
            <tr>
              <th>{{ t('restocking.table.sku') }}</th>
              <th>{{ t('restocking.table.itemName') }}</th>
              <th>{{ t('restocking.table.category') }}</th>
              <th>{{ t('restocking.table.warehouse') }}</th>
              <th class="num">{{ t('restocking.table.onHand') }}</th>
              <th class="num">{{ t('restocking.table.reorderPoint') }}</th>
              <th class="num">{{ t('restocking.table.forecast') }}</th>
              <th class="num">{{ t('restocking.table.recommendedQty') }}</th>
              <th class="num">{{ t('restocking.table.unitCost') }}</th>
              <th class="num">{{ t('restocking.table.estCost') }}</th>
              <th>{{ t('restocking.table.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in recommendationsWithOverride"
              :key="row.sku"
              :class="{ 'out-of-budget': !row.in_budget }"
            >
              <td><strong>{{ row.sku }}</strong></td>
              <td>{{ row.name }}</td>
              <td>{{ row.category }}</td>
              <td>{{ row.warehouse }}</td>
              <td class="num">{{ row.on_hand }}</td>
              <td class="num">{{ row.reorder_point }}</td>
              <td class="num">{{ row.forecasted_demand }}</td>
              <td class="num">
                <input
                  type="number"
                  class="qty-input"
                  v-model.number="overrides[row.sku]"
                  :placeholder="row.recommended_qty"
                  min="0"
                />
              </td>
              <td class="num">{{ formatCurrency(row.unit_cost, currentCurrency) }}</td>
              <td class="num"><strong>{{ formatCurrency(row.estimated_cost, currentCurrency) }}</strong></td>
              <td>
                <span :class="['badge', row.in_budget ? 'success' : 'warning']">
                  {{ row.in_budget ? t('restocking.status.inBudget') : t('restocking.status.outOfBudget') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="summary && recommendations.length === 0" class="empty-state">
      {{ t('restocking.noResults') }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'
import { useI18n } from '../composables/useI18n'
import { formatCurrency } from '../utils/currency'

export default {
  name: 'Restocking',
  setup() {
    const { t, currentCurrency } = useI18n()

    const currencySymbol = computed(() => (currentCurrency.value === 'JPY' ? '¥' : '$'))

    const budgetInput = ref(100000)
    const serviceLevel = ref(0.95)
    const loading = ref(false)
    const error = ref(null)
    const recommendations = ref([])
    const summary = ref(null)
    const overrides = ref({})

    const recommendationsWithOverride = computed(() =>
      recommendations.value.map((r) => {
        const overrideQty = overrides.value[r.sku]
        const qty = overrideQty != null && overrideQty !== '' ? Number(overrideQty) : r.recommended_qty
        const cost = Math.round(qty * r.unit_cost * 100) / 100
        return { ...r, recommended_qty: qty, estimated_cost: cost }
      })
    )

    const selectedTotalCost = computed(() =>
      recommendationsWithOverride.value
        .filter((r) => r.in_budget)
        .reduce((sum, r) => sum + r.estimated_cost, 0)
    )

    const budgetRemaining = computed(() => budgetInput.value - selectedTotalCost.value)

    const generate = async () => {
      try {
        loading.value = true
        error.value = null
        const data = await api.getRestockingRecommendations({
          budget: budgetInput.value,
          service_level: serviceLevel.value
        })
        recommendations.value = data.recommendations
        summary.value = data.summary
        overrides.value = {}
      } catch (err) {
        error.value = t('restocking.loadError')
        console.error('Restocking load error:', err)
      } finally {
        loading.value = false
      }
    }

    onMounted(generate)

    return {
      t,
      currentCurrency,
      currencySymbol,
      formatCurrency,
      budgetInput,
      serviceLevel,
      loading,
      error,
      recommendations,
      recommendationsWithOverride,
      summary,
      overrides,
      selectedTotalCost,
      budgetRemaining,
      generate,
      Math
    }
  }
}
</script>

<style scoped>
.restocking {
  padding: 0;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.6rem;
  margin: 0 0 0.25rem;
  color: #0f172a;
}

.page-header p {
  margin: 0;
  color: #64748b;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.controls-card {
  border-left: 4px solid #0d9488;
}

.controls {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 200px;
}

.control-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.budget-input {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 0.6rem;
}

.budget-input .prefix {
  color: #475569;
  font-weight: 600;
  margin-right: 0.3rem;
}

.budget-input input {
  border: none;
  background: transparent;
  padding: 0.55rem 0;
  font-size: 1rem;
  width: 100%;
  outline: none;
  font-variant-numeric: tabular-nums;
}

.service-level {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.service-level input[type='range'] {
  flex: 1;
}

.service-level .value {
  min-width: 3.2rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
}

.generate-btn {
  background: #0d9488;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.generate-btn:hover:not(:disabled) {
  background: #0f766e;
}

.generate-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.note {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #64748b;
  font-style: italic;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #94a3b8;
}

.stat-card.success {
  border-left-color: #16a34a;
}

.stat-card.warning {
  border-left-color: #d97706;
}

.stat-card.danger {
  border-left-color: #dc2626;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.table-container {
  overflow-x: auto;
}

.restocking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.restocking-table th {
  background: #f8fafc;
  padding: 0.7rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.restocking-table th.num,
.restocking-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.restocking-table td {
  padding: 0.7rem;
  border-bottom: 1px solid #e2e8f0;
}

.restocking-table tr.out-of-budget {
  background: #fffbeb;
}

.qty-input {
  width: 5rem;
  padding: 0.3rem 0.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge.success {
  background: #dcfce7;
  color: #166534;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.error {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.empty-state {
  background: #f8fafc;
  border-radius: 10px;
  padding: 3rem;
  text-align: center;
  color: #64748b;
  font-size: 1rem;
}
</style>
