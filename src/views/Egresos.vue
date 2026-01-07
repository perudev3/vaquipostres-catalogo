<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

/* =========================
   ESTADO
========================= */
const egresos = ref([])
const ventas = ref([])

const descripcion = ref('')
const monto = ref('')
const categoria = ref('')

const loading = ref(false)
const user = ref(null)

/* =========================
   CARGAR DATOS
========================= */
const loadData = async () => {
  loading.value = true

  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth?.user) {
    loading.value = false
    return
  }

  user.value = auth.user

  /* ---- VENTAS ---- */
  const { data: ventasData, error: ventasError } = await supabase
    .from('sales')
    .select('total')
    .eq('user_id', user.value.id)

  if (!ventasError) {
    ventas.value = ventasData || []
  }

  /* ---- EGRESOS ---- */
  const { data: egresosData, error: egresosError } = await supabase
    .from('egresos')
    .select('*')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })

  if (!egresosError) {
    egresos.value = egresosData || []
  }

  loading.value = false
}

onMounted(loadData)

/* =========================
   CÁLCULOS
========================= */
const totalVentas = computed(() =>
  ventas.value.reduce((sum, v) => sum + Number(v.total || 0), 0)
)

const totalEgresos = computed(() =>
  egresos.value.reduce((sum, e) => sum + Number(e.monto || 0), 0)
)

const capitalDisponible = computed(() =>
  totalVentas.value - totalEgresos.value
)

/* =========================
   REGISTRAR EGRESO
========================= */
const saveEgreso = async () => {
  if (!descripcion.value || !monto.value) {
    alert('Descripción y monto son obligatorios')
    return
  }

  const montoNum = Number(monto.value)

  if (montoNum <= 0) {
    alert('El monto debe ser mayor a cero')
    return
  }

  if (montoNum > capitalDisponible.value) {
    alert('No puedes registrar un egreso mayor al capital disponible')
    return
  }

  const { error } = await supabase.from('egresos').insert({
    user_id: user.value.id,
    descripcion: descripcion.value,
    monto: montoNum,
    categoria: categoria.value || null
  })

  if (error) {
    alert('Error al guardar el egreso')
    return
  }

  descripcion.value = ''
  monto.value = ''
  categoria.value = ''

  loadData()
}
</script>

<template>
  <div class="egresos-page">
    <h1>💸 Egresos del Capital</h1>

    <!-- RESUMEN -->
    <div class="summary">
      <div>
        Ventas
        <strong>S/ {{ totalVentas.toFixed(2) }}</strong>
      </div>

      <div class="egreso">
        Egresos
        <strong>- S/ {{ totalEgresos.toFixed(2) }}</strong>
      </div>

      <div class="capital">
        Capital disponible
        <strong>S/ {{ capitalDisponible.toFixed(2) }}</strong>
      </div>
    </div>

    <!-- FORMULARIO -->
    <div class="card">
      <input
        v-model="descripcion"
        placeholder="Descripción del gasto"
      />
      <input
        v-model="monto"
        type="number"
        min="0"
        step="0.01"
        placeholder="Monto"
      />
      <input
        v-model="categoria"
        placeholder="Categoría (opcional)"
      />
      <button @click="saveEgreso">
        ➖ Registrar egreso
      </button>
    </div>

    <!-- LISTA -->
    <div class="list-container">
      <div v-if="egresos.length === 0" class="empty">
        No hay egresos registrados
      </div>

      <div
        v-for="e in egresos"
        :key="e.id"
        class="egreso-item"
      >
        <div>
          <strong>{{ e.descripcion }}</strong>
          <small>{{ e.categoria || 'Sin categoría' }}</small>
        </div>
        <span class="monto">
          - S/ {{ Number(e.monto).toFixed(2) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.egresos-page {
  padding: 20px;
  max-width: 900px;
  margin: auto;
  font-family: 'Segoe UI', sans-serif;
  color: #111827;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #4f46e5;
}

.summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary div {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 10px;
  min-width: 180px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.summary strong {
  display: block;
  font-size: 18px;
  margin-top: 4px;
}

.summary .egreso strong {
  color: #dc2626;
}

.summary .capital strong {
  color: #16a34a;
}

.card {
  background: #ffffff;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

.card input {
  flex: 1 1 200px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.card button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.card button:hover {
  background: #4338ca;
}

.list-container {
  max-height: 55vh;
  overflow-y: auto;
}

.egreso-item {
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.egreso-item small {
  display: block;
  color: #6b7280;
  font-size: 12px;
}

.monto {
  font-weight: 700;
  color: #dc2626;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}
</style>
