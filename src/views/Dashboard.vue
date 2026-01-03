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
            <tr v-for="sale in recentSales" :key="sale.id">
              <td>{{ sale.id }}</td>
              <td>{{ sale.customer }}</td>
              <td>{{ sale.total }}</td>
              <td>{{ sale.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
import { ref, onMounted } from 'vue';
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

// Función para cargar dashboard
const loadDashboard = async () => {
  try {
    // Últimas ventas
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

    // Ventas hoy
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesData.filter((s) => s.created_at.startsWith(today));
    const salesSum = todaySales.reduce((acc, s) => acc + s.total, 0);
    const profitSum = salesSum * 0.3;
    salesToday.value = salesSum.toFixed(2);
    profitToday.value = profitSum.toFixed(2);

    // Ganancia total
    const { data: allSales } = await supabase.from('sales').select('*');
    totalProfit.value = allSales
      .reduce((acc, s) => acc + s.total * 0.3, 0)
      .toFixed(2);

    // Productos bajos en stock
    const { data: products } = await supabase.from('products').select('*');
    lowStockProducts.value = products.filter((p) => p.stock <= 5);

    // Datos para gráficos últimos 7 días
    salesLast7Days.value = [];
    profitLast7Days.value = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];
      const daySales = allSales.filter((s) => s.created_at.startsWith(day));
      const totalSales = daySales.reduce((acc, s) => acc + s.total, 0);
      salesLast7Days.value.push(totalSales);
      profitLast7Days.value.push(totalSales * 0.3);
    }

    initCharts();
  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
};

// Inicializar gráficos
const initCharts = () => {
  const salesCtx = document.getElementById('salesChart').getContext('2d');
  new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
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

  const profitCtx = document.getElementById('profitChart').getContext('2d');
  new Chart(profitCtx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
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
  font-family: 'Segoe UI', sans-serif;
  color: #111827;
}
.dashboard-title {
  font-size: 28px;
  margin-bottom: 20px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.chart-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
}
.table-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}
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
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.responsive-table th {
  background: #f3f4f6;
}
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
