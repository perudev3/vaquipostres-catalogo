<script setup>

const user = ref(null)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user
  loadOrders()
})



import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import Swal from 'sweetalert2'

const orders = ref([])
const loading = ref(false)
const search = ref('')


const viewOrderDetails = (order) => {
  const itemsHtml = order.items
    .map(
      i => `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between">
            <strong>${i.name} x ${i.quantity || 1}</strong>
            <strong>S/ ${(i.price * (i.quantity || 1)).toFixed(2)}</strong>
          </div>

          <div style="font-size:13px;color:#555;margin-left:8px">
            ${i.fruit ? `<div>🍓 Fruta: ${i.fruit}</div>` : ''}
            ${i.syrup ? `<div>🍫 Jarabe: ${i.syrup}</div>` : ''}

            ${
              Array.isArray(i.toppings) && i.toppings.length
                ? `<div>➕ Toppings: ${i.toppings.join(', ')}</div>`
                : ''
            }

            ${
              i.extra_cost && i.extra_cost > 0
                ? `<div>💰 Extra: S/ ${Number(i.extra_cost).toFixed(2)}</div>`
                : ''
            }
          </div>
        </div>
      `
    )
    .join('')

  // 🔹 Info extra: tipo de pedido y entrega
  let extraInfo = `<p><strong>Tipo de pedido:</strong> ${order.order_type || 'Inmediato'}</p>`

  if (order.order_type === 'programado') {
    extraInfo += `<p><strong>Fecha programada:</strong> ${order.order_date || '-'}</p>`
  }

  if (order.delivery === 'delivery') {
    extraInfo += `<p><strong>Entrega:</strong> Delivery</p>`
    extraInfo += `<p><strong>Dirección:</strong> ${order.address || '-'}</p>`
  } else {
    extraInfo += `<p><strong>Entrega:</strong> Recojo en tienda</p>`
  }

  Swal.fire({
    title: '🧾 Detalle del pedido',
    html: `
      <div style="text-align:left">
        <p><strong>Cliente:</strong> ${order.customer_name}</p>
        <p><strong>Teléfono:</strong> ${order.customer_phone || '-'}</p>
        <p><strong>Método de pago:</strong> ${order.payment_method || 'No definido'}</p>
        ${extraInfo}
        <hr />
        ${itemsHtml}
        <hr />
        <p style="text-align:right;font-size:16px">
          <strong>Total: S/ ${Number(order.total).toFixed(2)}</strong>
        </p>
      </div>
    `,
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#4f46e5'
  })
}

const loadOrders = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) orders.value = data || []
  loading.value = false
}


/* 🔎 FILTRO POR CLIENTE */
const filteredOrders = computed(() => {
  if (!search.value) return orders.value

  return orders.value.filter(o =>
    o.customer_name
      ?.toLowerCase()
      .includes(search.value.toLowerCase())
  )
})

const confirmOrder = async (order) => {
  const result = await Swal.fire({
    title: 'Confirmar venta',
    text: '¿Registrar esta orden como venta?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    confirmButtonText: 'Sí, confirmar'
  })

  if (!result.isConfirmed) return

  // Registrar venta
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      user_id: user.value.id,
      total: order.total,
      payment_method: order.payment_method
    })
    .select()
    .single()

  if (saleError) {
    Swal.fire('Error', 'No se pudo registrar la venta', 'error')
    return
  }

  // Traer todos los productos de la base de datos para buscar su ID
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('id, name')

  if (productsError) throw productsError

  const itemsToInsert = []

  for (const i of order.items) {
    // Buscar producto en la tabla 'products' por nombre
    const product = productsData.find(p => p.name === i.name)
    if (!product) {
      console.warn('Producto no encontrado en DB:', i.name)
      continue
    }

    itemsToInsert.push({
      sale_id: sale.id,
      product_id: product.id,
      quantity: i.quantity || 1,
      price: i.price,
      subtotal: (i.price + (i.extra_cost || 0)) * (i.quantity || 1)
    })
  }

  if (itemsToInsert.length === 0) {
    Swal.fire('Error', 'No se pudo generar ningún item para la venta.', 'error')
    return
  }

  // 🔹 Inserta los items correctos
  await supabase.from('sale_items').insert(itemsToInsert)

  // Actualizar estado de la orden
  await supabase
    .from('orders')
    .update({ status: 'confirmado' })
    .eq('id', order.id)

  Swal.fire('Venta confirmada', 'La orden fue registrada', 'success')
  loadOrders()
}

</script>

<template>
  <div class="orders-page">
    <div class="orders-header">
  <h1 class="page-title">📋 Gestión de Órdenes</h1>
  <p class="page-subtitle">
    Revisa, busca y confirma pedidos de tus clientes
  </p>

  <div class="search-box">
    <input
      v-model="search"
      placeholder="🔍 Buscar por nombre del cliente..."
    />
  </div>
</div>


    <div v-if="loading" class="loading">Cargando órdenes...</div>

    <div v-else-if="filteredOrders.length === 0" class="empty">
      No se encontraron órdenes
    </div>

    <!-- 🧾 TABLA MODERNA -->
    <div class="table-container">
        <div class="table">
        <div class="table-header">
            <span>Cliente</span>
            <span>Pedido</span>
            <span>Total</span>
            <span>Estado</span>
            <span>Acción</span>
        </div>

        <div
            v-for="o in filteredOrders"
            :key="o.id"
            class="table-row"
        >
            <div class="cliente">
            <strong>{{ o.customer_name }}</strong>
            <small>{{ o.customer_phone }}</small>
            </div>

            <ul class="items">
            <li v-for="(i, idx) in o.items" :key="idx">
                {{ i.name }}
            </li>
            </ul>

            <div class="total">
            S/ {{ Number(o.total).toFixed(2) }}
            </div>

            <div>
            <span
                :class="[
                'status',
                o.status === 'confirmado' ? 'ok' : 'pending'
                ]"
            >
                {{ o.status || 'pendiente' }}
            </span>
            </div>

            <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button
                    class="btn-secondary"
                    @click="viewOrderDetails(o)"
                >
                    Ver
                </button>

                <button
                    v-if="o.status !== 'confirmado'"
                    @click="confirmOrder(o)"
                >
                    Confirmar
                </button>

                <span v-else class="done">✔</span>
            </div>

        </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  padding: 20px;
  max-width: 1100px;
  margin: auto;
  font-family: 'Segoe UI', sans-serif;
}

/* 🔍 BUSCADOR */
.search-box {
  margin-bottom: 14px;
}

.search-box input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 14px;
}

/* 🧾 TABLA */
.table {
  background: #f3f4f6;
  border-radius: 14px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 12px 16px;
  align-items: center;
}

.table-header {
  background: #e5e7eb;
  font-weight: 700;
  color: #374151;
}

.table-row {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.table-row:last-child {
  border-bottom: none;
}

.cliente small {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.items {
  padding-left: 16px;
  font-size: 13px;
  color: #374151;
}

.total {
  font-weight: 700;
  color: #16a34a;
}

/* ESTADOS */
.status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.ok {
  background: #dcfce7;
  color: #166534;
}

/* BOTONES */
button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background: #4338ca;
}

.done {
  color: #16a34a;
  font-weight: 700;
  font-size: 18px;
}

.empty,
.loading {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}

/* 📱 RESPONSIVE */
@media (max-width: 768px) {
  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .items {
    padding-left: 0;
  }
}

/* HEADER FIJO */
.orders-header {
  position: sticky;
  top: 0;
  padding-bottom: 12px;
  margin-bottom: 12px;
  z-index: 10;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #4f46e5;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 10px;
}

/* SCROLL SOLO LISTA */
.table-container {
  max-height: 65vh;
  overflow-y: auto;
  border-radius: 14px;
}

/* MEJOR SCROLL */
.table-container::-webkit-scrollbar {
  width: 6px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c7d2fe;
  border-radius: 10px;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background: #d1d5db;
}

</style>
