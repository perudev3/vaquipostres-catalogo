<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import Swal from 'sweetalert2'

import Cart from '../components/Cart.vue'
import PaymentModal from '../components/PaymentModal.vue'

const products = ref([])
const cart = ref([])
const showPayment = ref(false)
const showProductsModal = ref(false)
const paymentMethod = ref('cash')
const user = ref(null)
const loading = ref(false)
const filterName = ref('')
const showProducts = ref(false)

const loadProducts = async () => {
  const { data: auth } = await supabase.auth.getUser()
  user.value = auth.user

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.value.id)
    .gt('stock', 0)

  products.value = data || []
}

onMounted(loadProducts)

const filteredProducts = computed(() =>
  products.value.filter(p =>
    p.name.toLowerCase().includes(filterName.value.toLowerCase())
  )
)

const addToCart = (product) => {
  const item = cart.value.find(p => p.id === product.id)

  if (item) {
    if (item.quantity < product.stock) item.quantity += 1
  } else {
    cart.value.push({ ...product, quantity: 1 })
  }

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `${product.name} añadido`,
    showConfirmButton: false,
    timer: 900
  })
}

const removeFromCart = (id) => {
  cart.value = cart.value.filter(p => p.id !== id)
}

const updateQuantity = (id, value) => {
  const item = cart.value.find(p => p.id === id)
  if (item) {
    const qty = Number(value)
    if (!isNaN(qty) && qty >= 0 && qty <= item.stock) {
      item.quantity = qty
    }
  }
}

const total = computed(() =>
  cart.value.reduce((sum, p) => sum + p.price * p.quantity, 0)
)

const saveSale = async () => {
  if (!cart.value.length) {
    return Swal.fire('Carrito vacío', 'Agrega productos', 'warning')
  }

  loading.value = true

  try {
    const { data: sale } = await supabase
      .from('sales')
      .insert({
        user_id: user.value.id,
        total: total.value,
        payment_method: paymentMethod.value
      })
      .select()
      .single()

    const items = cart.value.map(p => ({
      sale_id: sale.id,
      product_id: p.id,
      quantity: p.quantity,
      price: p.price,
      subtotal: p.price * p.quantity
    }))

    await supabase.from('sale_items').insert(items)

    for (const p of cart.value) {
      await supabase
        .from('products')
        .update({ stock: p.stock - p.quantity })
        .eq('id', p.id)
    }

    cart.value = []
    showPayment.value = false
    loadProducts()

    Swal.fire('Venta registrada', '', 'success')
  } catch {
    Swal.fire('Error', 'No se pudo guardar la venta', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pos-layout">

    <div class="cart-wrapper">

      <!-- HEADER POS -->
      <div class="pos-header">
        <div>
          <h2>Punto de Venta</h2>
          <p class="subtitle">
            Registra ventas y cobra a tus clientes rápidamente
          </p>
        </div>

        <button class="btn-primary" @click="showProducts = true">
          ➕ Agregar productos
        </button>
      </div>

      <!-- CARRITO -->
      <Cart
        :cart="cart"
        :total="total"
        @remove="removeFromCart"
        @update-quantity="updateQuantity"
        @pay="showPayment = true"
      />

    </div>

    <!-- MODAL PRODUCTOS -->
    <div v-if="showProducts" class="modal-backdrop">
      <div class="modal large">
        <div class="modal-header">
          <h3>Seleccionar productos</h3>
          <button @click="showProducts = false">✕</button>
        </div>

        <input
          v-model="filterName"
          class="filter-input"
          placeholder="Buscar producto por nombre..."
        />

        <div class="product-grid">
          <div v-for="p in filteredProducts" :key="p.id" class="product-card">
            <div class="img-container">
              <img v-if="p.image_url" :src="p.image_url" />
              <span v-else>Sin imagen</span>
            </div>

            <p class="name">{{ p.name }}</p>
            <p class="price">S/ {{ p.price }}</p>
            <p class="stock">Stock: {{ p.stock }}</p>

            <button class="btn-add" @click="addToCart(p)">
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>

    <PaymentModal
      v-if="showPayment"
      :total="total"
      v-model:method="paymentMethod"
      :loading="loading"
      @confirm="saveSale"
      @close="showPayment = false"
    />
  </div>
</template>


<style scoped>
.pos-layout {
  min-height: 100vh;
  background: #f4f6f8;
  padding: 24px;
  font-family: 'Inter', system-ui, sans-serif;
}

/* CONTENEDOR PRINCIPAL */
.cart-wrapper {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  max-width: 1100px;
  margin: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,.06);
}

/* HEADER */
.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.pos-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a; /* MÁS CONTRASTE */
  letter-spacing: -0.3px;
}

/* SUBTÍTULO */
.subtitle {
  font-size: 15px;
  color: #334155; /* ANTES MUY CLARO */
  margin-top: 6px;
  font-weight: 500;
}


/* BOTÓN PRINCIPAL */
.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
}

.btn-primary:hover {
  background: #1e40af;
  transform: translateY(-1px);
}

/* MODAL BACKDROP */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

/* MODAL */
.modal.large {
  background: #ffffff;
  width: 92%;
  max-width: 980px;
  border-radius: 22px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 30px 60px rgba(0,0,0,.25);
}

/* MODAL HEADER */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.modal-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.modal-header button {
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #6b7280;
}

/* BUSCADOR */
.filter-input {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  font-size: 15px;
  margin-bottom: 16px;
}

.filter-input:focus {
  outline: none;
  border-color: #2563eb;
}

/* GRID PRODUCTOS */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 18px;
  overflow-y: auto;
  padding-bottom: 8px;
}

/* CARD PRODUCTO */
.product-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px;
  text-align: center;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-2px);
}

/* IMAGEN */
.img-container {
  height: 120px;
  border-radius: 14px;
  background: #f1f5f9;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}

/* TEXTOS */
.name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.price {
  font-size: 15px;
  font-weight: 700;
  color: #2563eb;
}

.stock {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;
}

/* BOTÓN AÑADIR */
.btn-add {
  margin-top: auto;
  background: #16a34a;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-add:hover {
  background: #15803d;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}


</style>
