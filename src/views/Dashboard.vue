<template>
  <div class="dashboard-page">
    <h1 class="dashboard-title">Dashboard</h1>

    <!-- Tarjetas estadísticas -->
    <div class="dashboard-grid">
      <StatCard title="Ventas hoy (S/)" :value="salesToday" />
      <StatCard title="Ganancia hoy (S/)" :value="profitToday" />
      <StatCard title="Ganancia total (S/)" :value="totalProfit" />
      <StatCard
        title="Productos bajos en stock"
        :value="lowStockProducts.length"
      />
    </div>

    <!-- Gráficos -->
    <div class="charts-grid">
      <div class="chart-card">
        <h2>Ventas últimos 7 días</h2>
        <canvas id="salesChart"></canvas>
      </div>
      <div class="chart-card">
        <h2>Ganancias últimos 7 días</h2>
        <canvas id="profitChart"></canvas>
      </div>
    </div>

    <!-- Últimas ventas -->
    <div class="table-card">
      <h2>Últimas ventas</h2>

      <div class="table-wrapper">
        <table class="responsive-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total (S/)</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in paginatedSales" :key="sale.id">
              <td>{{ sale.id }}</td>
              <td>{{ sale.customer }}</td>
              <td>{{ sale.total }}</td>
              <td>{{ sale.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="pagination" v-if="recentSales.length">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          ⏮
        </button>

        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          ⏭
        </button>
      </div>

      <p v-else class="empty-msg">No hay ventas registradas</p>
    </div>

    <!-- Productos bajos en stock -->
    <div class="table-card" v-if="lowStockProducts.length">
      <h2>Productos a renovar stock</h2>
      <div class="table-wrapper">
        <table class="responsive-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in lowStockProducts" :key="p.id">
              <td>{{ p.name }}</td>
              <td>{{ p.stock }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import StatCard from '../components/StatCard.vue';
import { supabase } from '../lib/supabase';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Estados
const salesToday = ref(0);
const profitToday = ref(0);
const totalProfit = ref(0);
const recentSales = ref([]);
const lowStockProducts = ref([]);
const salesLast7Days = ref([]);
const profitLast7Days = ref([]);

// Paginación
const currentPage = ref(1);
const perPage = 5;

const totalPages = computed(() =>
  Math.max(1, Math.ceil(recentSales.value.length / perPage))
);

const paginatedSales = computed(() => {
  if (!recentSales.value.length) return [];
  const start = (currentPage.value - 1) * perPage;
  return recentSales.value.slice(start, start + perPage);
});

watch(recentSales, () => {
  currentPage.value = 1;
});

// Función para cargar dashboard
const loadDashboard = async () => {
  try {
    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    recentSales.value = salesData.map((s) => ({
      id: s.id,
      customer: s.user_id,
      total: s.total.toFixed(2),
      date: new Date(s.created_at).toISOString().split('T')[0],
    }));

    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesData.filter((s) =>
      s.created_at.startsWith(today)
    );
    const salesSum = todaySales.reduce((acc, s) => acc + s.total, 0);
    const profitSum = salesSum * 0.3;
    salesToday.value = salesSum.toFixed(2);
    profitToday.value = profitSum.toFixed(2);

    const { data: allSales } = await supabase.from('sales').select('*');
    totalProfit.value = allSales
      .reduce((acc, s) => acc + s.total * 0.3, 0)
      .toFixed(2);

    const { data: products } = await supabase.from('products').select('*');
    lowStockProducts.value = products.filter((p) => p.stock <= 5);

    salesLast7Days.value = [];
    profitLast7Days.value = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];
      const daySales = allSales.filter((s) =>
        s.created_at.startsWith(day)
      );
      const totalSales = daySales.reduce((acc, s) => acc + s.total, 0);
      salesLast7Days.value.push(totalSales);
      profitLast7Days.value.push(totalSales * 0.3);
    }

    initCharts();
  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
};

const initCharts = () => {
  new Chart(document.getElementById('salesChart'), {
    type: 'line',
    data: {
      labels: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      }),
      datasets: [
        {
          label: 'Ventas S/',
          data: salesLast7Days.value,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,0.2)',
          tension: 0.3,
        },
      ],
    },
  });

  new Chart(document.getElementById('profitChart'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      }),
      datasets: [
        {
          label: 'Ganancias S/',
          data: profitLast7Days.value,
          backgroundColor: '#16a34a',
        },
      ],
    },
  });
};

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
  color: #111827;
}

.dashboard-title {
  font-size: 28px;
  margin-bottom: 20px;
  color: #4f46e5;
}

/* =========================
   GRID PRINCIPAL
========================= */
.dashboard-grid,
.charts-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.dashboard-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.charts-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* =========================
   ESTILO TIPO SUMMARY (APLICADO A StatCard)
========================= */
.dashboard-grid > * {
  background: #f9fafb;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border-left: 4px solid #4f46e5;
}

.dashboard-grid > *:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.15);
}

/* =========================
   TARJETAS Y TABLAS
========================= */
.chart-card,
.table-card {
  background: #ffffff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.chart-card h2,
.table-card h2 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #4338ca;
}

/* =========================
   TABLAS
========================= */
.table-wrapper {
  overflow-x: auto;
}

.responsive-table {
  width: 100%;
  border-collapse: collapse;
}

.responsive-table th,
.responsive-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.responsive-table th {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
}

/* =========================
   PAGINACIÓN
========================= */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.page-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.page-btn:hover {
  background: #4338ca;
}

.page-btn:disabled {
  background: #c7d2fe;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #374151;
}

.empty-msg {
  text-align: center;
  margin-top: 12px;
  color: #6b7280;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 768px) {
  .dashboard-grid,
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

