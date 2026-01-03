<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabase';

import SalesTable from '../components/SalesTable.vue';
import SaleDetailModal from '../components/SaleDetailModal.vue';

const sales = ref([]);
const selectedSale = ref(null);

const fromDate = ref('');
const toDate = ref('');
const user = ref(null);
const loading = ref(false);

/* =========================
   CARGAR VENTAS
========================= */
const loadSales = async () => {
  loading.value = true;

  const { data: auth } = await supabase.auth.getUser();
  user.value = auth.user;

  let query = supabase
    .from('sales')
    .select('*')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false });

  if (fromDate.value) query = query.gte('created_at', fromDate.value);

  if (toDate.value) query = query.lte('created_at', toDate.value + 'T23:59:59');

  const { data } = await query;
  sales.value = data || [];

  loading.value = false;
};

onMounted(loadSales);

/* =========================
   TOTALES
========================= */
const totalSales = computed(() => sales.value.length);

const totalAmount = computed(() =>
  sales.value.reduce((sum, s) => sum + Number(s.total), 0)
);
</script>

<template>
  <div class="reports">
    <h1>📊 Reporte de Ventas</h1>

    <!-- FILTROS -->
    <div class="filters">
      <input type="date" v-model="fromDate" />
      <input type="date" v-model="toDate" />
      <button @click="loadSales">Filtrar</button>
    </div>

    <!-- RESUMEN -->
    <div class="summary">
      <div>
        Ventas: <strong>{{ totalSales }}</strong>
      </div>
      <div>
        Total: <strong>S/ {{ totalAmount.toFixed(2) }}</strong>
      </div>
    </div>

    <!-- TABLA -->
    <SalesTable
      :sales="sales"
      :loading="loading"
      @view="selectedSale = $event"
    />

    <!-- MODAL DETALLE -->
    <SaleDetailModal
      v-if="selectedSale"
      :sale="selectedSale"
      @close="selectedSale = null"
    />
  </div>
</template>

<style scoped>
/* Contenedor general */
.reports {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
}

/* Título */
.reports h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* FILTROS */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.filters input[type='date'] {
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  font-size: 16px;
  outline: none;
  transition: all 0.2s ease-in-out;
  flex: 1 1 180px; /* más ancho para que se vean mejor */
}

.filters input[type='date']:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
}

.filters button {
  background-color: #4f46e5;
  color: white;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease-in-out;
  flex: 0 0 auto;
}

.filters button:hover {
  background-color: #4338ca;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

/* RESUMEN */
/* RESUMEN - compacto y elegante */
.summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: flex-start; /* se alinean al inicio */
}

.summary div {
  background: #f9fafb;
  padding: 10px 16px; /* menos padding para que ocupe menos espacio */
  border-radius: 10px;
  font-size: 14px; /* más compacto */
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.15s, box-shadow 0.15s;
  min-width: 120px; /* ancho mínimo para que no se vea muy comprimido */
}

.summary div:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .summary {
    flex-direction: column;
    gap: 12px;
  }
  .summary div {
    width: 100%;
    font-size: 14px;
    padding: 10px 12px;
  }
}

/* TABLA */
.sales-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sales-table th,
.sales-table td {
  padding: 14px 16px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.sales-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.sales-table tr:hover {
  background-color: #f1f5f9;
}

/* MODAL DETALLE */
.modal {
  border-radius: 12px;
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  .summary {
    flex-direction: column;
  }
  .filters input[type='date'] {
    flex: 1 1 100%;
  }
  .filters button {
    width: 100%;
  }
}
</style>
