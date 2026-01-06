<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import Swal from 'sweetalert2'

import Cart from '../components/Cart.vue'
import PaymentModal from '../components/PaymentModal.vue'

const products = ref([])
const cart = ref([])
const showPayment = ref(false)
const paymentMethod = ref('cash')
const user = ref(null)
const loading = ref(false)
const filterName = ref('')

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
    timer: 1200
  })
}

const removeFromCart = (id) => {
  cart.value = cart.value.filter(p => p.id !== id)
}

const updateQuantity = (id, value) => {
  const item = cart.value.find(p => p.id === id)
  if (item) {
    const qty = parseFloat(value)
    if (!isNaN(qty) && qty >= 0 && qty <= item.stock) item.quantity = qty
  }
}

const total = computed(() =>
  cart.value.reduce((sum, p) => sum + p.price * p.quantity, 0)
)

const saveSale = async () => {
  if (cart.value.length === 0) {
    return Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos antes de cobrar'
    })
  }

  loading.value = true

  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        user_id: user.value.id,
        total: total.value,
        payment_method: paymentMethod.value
      })
      .select()
      .single()

    if (error) throw error

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

    Swal.fire({
      icon: 'success',
      title: 'Venta registrada',
      timer: 1800,
      showConfirmButton: false
    })
  } catch (e) {
    Swal.fire('Error', 'No se pudo guardar la venta', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pos-layout">
    <!-- PRODUCTOS -->
    <div class="products-section">
      <input
        v-model="filterName"
        class="filter-input"
        placeholder="Buscar producto..."
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

          <button class="btn-add" @click="addToCart(p)">➕ Añadir</button>
        </div>
      </div>
    </div>

    <!-- CARRITO -->
    <Cart
      class="cart-section"
      :cart="cart"
      :total="total"
      @remove="removeFromCart"
      @update-quantity="updateQuantity"
      @pay="showPayment = true"
    />

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
/* ===== BASE ===== */
.pos-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  padding: 16px;
  min-height: 100vh;
  background: #f3f4f6;
  color: #111827;
  font-family: 'Segoe UI', sans-serif;
}

/* ===== PRODUCTOS ===== */
.products-section {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
}

.filter-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  margin-bottom: 12px;
  font-size: 14px;
  color: #111827;
}

.product-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.product-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  text-align: center;
  box-shadow: 0 3px 8px rgba(0,0,0,.08);
}

.img-container {
  height: 90px;
  background: #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  font-size: 12px;
}

.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-weight: 600;
  color: #111827;
  margin-top: 6px;
}

.price {
  color: #4f46e5;
  font-weight: 600;
}

.stock {
  font-size: 12px;
  color: #374151;
}

.btn-add {
  margin-top: auto;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
}

.btn-add:hover {
  background: #4338ca;
}

/* ===== CARRITO ===== */
.cart-section {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px;
  max-height: 85vh;
  overflow: hidden;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }

  .product-grid {
    max-height: 55vh;
  }
}
</style>
