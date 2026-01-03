<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2'; // <-- Import SweetAlert2

import Cart from '../components/Cart.vue';
import PaymentModal from '../components/PaymentModal.vue';

const products = ref([]);
const cart = ref([]);
const showPayment = ref(false);
const paymentMethod = ref('cash');
const user = ref(null);
const loading = ref(false);
const filterName = ref('');

/* =========================
   CARGAR PRODUCTOS
========================= */
const loadProducts = async () => {
  const { data: auth } = await supabase.auth.getUser();
  user.value = auth.user;

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.value.id)
    .gt('stock', 0);

  products.value = data || [];
};

onMounted(loadProducts);

/* =========================
   FILTRO PRODUCTOS
========================= */
const filteredProducts = computed(() =>
  products.value.filter((p) =>
    p.name.toLowerCase().includes(filterName.value.toLowerCase())
  )
);

/* =========================
   CARRITO
========================= */
const addToCart = (product) => {
  const item = cart.value.find((p) => p.id === product.id);
  if (item) {
    if (item.quantity < product.stock) item.quantity += 1;
  } else {
    cart.value.push({ ...product, quantity: 1 });
  }
  // Toast opcional al añadir producto
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `${product.name} añadido al carrito`,
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
  });
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter((p) => p.id !== id);
};

const updateQuantity = (id, value) => {
  const item = cart.value.find((p) => p.id === id);
  if (item) {
    const qty = parseFloat(value);
    if (!isNaN(qty) && qty >= 0 && qty <= item.stock) item.quantity = qty;
  }
};

const total = computed(() =>
  cart.value.reduce((sum, p) => sum + p.price * p.quantity, 0)
);

/* =========================
   GUARDAR VENTA
========================= */
const saveSale = async () => {
  if (cart.value.length === 0) {
    return Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos antes de cobrar',
    });
  }
  loading.value = true;

  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        user_id: user.value.id,
        total: total.value,
        payment_method: paymentMethod.value,
      })
      .select()
      .single();

    if (error) throw error;

    const items = cart.value.map((p) => ({
      sale_id: sale.id,
      product_id: p.id,
      quantity: p.quantity,
      price: p.price,
      subtotal: p.price * p.quantity,
    }));

    await supabase.from('sale_items').insert(items);

    for (const p of cart.value) {
      await supabase
        .from('products')
        .update({ stock: p.stock - p.quantity })
        .eq('id', p.id);
    }

    cart.value = [];
    showPayment.value = false;
    loadProducts();

    Swal.fire({
      icon: 'success',
      title: 'Venta registrada',
      text: 'La venta se ha guardado correctamente',
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar la venta',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="pos-layout">
    <!-- PRODUCTOS + FILTRO -->
    <div class="products-section">
      <input
        type="text"
        v-model="filterName"
        placeholder="Buscar producto..."
        class="filter-input"
      />
      <div class="product-grid">
        <div v-for="p in filteredProducts" :key="p.id" class="product-card">
          <div class="img-container">
            <img v-if="p.image_url" :src="p.image_url" alt="producto" />
            <div v-else class="placeholder">Sin imagen</div>
          </div>
          <div class="info">
            <strong>{{ p.name }}</strong>
            <span>S/ {{ p.price }}</span>
            <small>Stock: {{ p.stock }}</small>
          </div>
          <button class="btn-add" @click="addToCart(p)">➕ Añadir</button>
        </div>
      </div>
    </div>

    <!-- CARRITO -->
    <Cart
      :cart="cart"
      :total="total"
      @remove="removeFromCart"
      @update-quantity="updateQuantity"
      @pay="showPayment = true"
      class="cart-section"
    />

    <!-- MODAL DE PAGO -->
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
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  gap: 16px;
  padding: 16px;
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Segoe UI', sans-serif;
  color: #111827;
}

/* FILTRO PRODUCTOS */
.filter-input {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 14px;
}
.filter-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* PRODUCTOS */
.products-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
}
.product-card {
  background: white;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.img-container {
  width: 100%;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-container .placeholder {
  color: #6b7280;
  font-size: 12px;
}

/* INFO PRODUCTO */
.info strong {
  font-size: 14px;
  color: #111827;
}
.info span {
  font-size: 13px;
  color: #374151;
}
.info small {
  font-size: 11px;
  color: #6b7280;
}

/* BOTON AÑADIR */
.btn-add {
  margin-top: auto;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 6px 0;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-add:hover {
  background: #4338ca;
}

/* CARRITO */
.cart-section {
  background: white;
  padding: 12px;
  border-radius: 10px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.cart-section .cart-items {
  overflow-y: auto;
  max-height: calc(80vh - 100px);
  margin-bottom: 10px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
