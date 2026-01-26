<template>
  <div class="cart">

    <div class="cart-header">
        <router-link to="/" class="back-link">
            ← Seguir comprando
        </router-link>
    </div>

    <h1>🛒 Tu carrito</h1>

    <div v-if="cart.length === 0">
      <p>No tienes productos aún</p>
    </div>

    <div v-if="step === 1">

    <div v-for="(item, index) in cart" :key="index" class="cart-item">
      <h3>{{ item.name }}</h3>
      <p>Precio base: {{ currency(item.price) }}</p>
      <p>Toppings permitidos: {{ item.max_toppings }}</p>

      <!-- JARABE -->
      <h4>🍯 Jarabe</h4>
      <select v-model="item.syrup" @change="saveCart">
        <option disabled value="">Selecciona jarabe</option>
        <option v-for="s in syrups" :key="s" :value="s">{{ s }}</option>
      </select>

      <!-- FRUTA -->
      <h4>🍓 Fruta</h4>
      <select v-model="item.fruit" @change="saveCart">
        <option disabled value="">Selecciona fruta</option>
        <option v-for="f in fruits" :key="f" :value="f">{{ f }}</option>
      </select>


      <!-- TOPPINGS -->
      <div class="toppings">
        <label
          v-for="t in toppings"
          :key="t"
        >
          <input
            type="checkbox"
            :value="t"
            :checked="item.toppings.includes(t)"
            @change="toggleTopping(item, t)"
          />
          {{ t }}
        </label>
      </div>

      <p>
        Toppings seleccionados:
        {{ item.toppings.length }}
      </p>

      <p v-if="extraToppings(item) > 0">
        Toppings extra: {{ extraToppings(item) }}
        → S/ {{ extraCost(item) }}
      </p>

      <button @click="removeItem(index)">❌ Quitar</button>
      <hr />
    </div>

    <h2>Total: {{ currency(total) }}</h2>

    <!-- BOTÓN WIZARD -->
    <div class="wizard-next">
      <button class="next-step" @click="goToStep2">
      👉 Continuar con mis datos
      </button>
    </div>

    </div>

    <div v-if="step === 2" class="checkout">

      <h3>Datos del cliente</h3>

      <input v-model="customer.name" placeholder="Nombre completo" />
      <input v-model="customer.phone" placeholder="Celular" />

      <h3>Método de pago</h3>
      <select v-model="customer.payment">
        <option disabled value="">Selecciona</option>
        <option value="efectivo">Efectivo</option>
        <option value="yape">Yape</option>
        <option value="plin">Plin</option>
      </select>

      <h3>Entrega</h3>
      <select v-model="customer.delivery">
        <option disabled value="">Selecciona</option>
        <option value="delivery">Delivery</option>
        <option value="recojo">Recojo en tienda</option>
      </select>

      <!-- MAPA -->
      <div v-if="customer.delivery === 'delivery'">
        <h3>📍 Ubicación de entrega</h3>
        <button @click="getLocation">Usar mi ubicación</button>
        <div id="map"></div>
        <p v-if="customer.address">Dirección detectada: {{ customer.address }}</p>
        <p>*Costo de delivery a tratar por WhatsApp</p>
      </div>

      <h3>Tipo de pedido</h3>
      <select v-model="customer.order_type">
        <option disabled value="">Selecciona</option>
        <option value="inmediato">Inmediato</option>
        <option value="programado">Programado</option>
      </select>

      <div v-if="customer.order_type === 'programado'">
        <h3>Fecha del pedido</h3>
        <input type="date" v-model="customer.order_date" />
      </div>

      <button class="back-step" @click="goToStep1">
        ← Volver a toppings
      </button>

      <button class="confirm" @click="confirmOrder">
        ✅ Confirmar pedido
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { supabase } from '@/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Swal from 'sweetalert2'

const cart = ref(JSON.parse(localStorage.getItem('cart')) || [])

const step = ref(1)


const goToStep2 = async () => {
  step.value = 2
  await nextTick()
  document.querySelector('.checkout')?.scrollIntoView({ behavior: 'smooth' })
}

const goToStep1 = async () => {
  step.value = 1
  await nextTick()
  document.querySelector('.cart-item')?.scrollIntoView({ behavior: 'smooth' })
}



const toppings = [
  'Chin chin', 'Gomitas', 'Oreo', 'Barquillo',
  'Coco', 'Maní', 'Wafer', 'Mashmelo',
  'Doña pepa', 'Chispas chocolate',
  'Chispas chocolate blanco',
  'Burbujas de colores', 'Grajeas'
]

const syrups = ['Chocolate','Dulce de leche','Maplle','Leche condensada']
const fruits = ['Fresa', 'Durazno', 'Mango']


const customer = ref({
  name: '',
  phone: '',
  payment: '',
  delivery: '',
  order_type: '',
  order_date: '',
  latitude: null,
  longitude: null,
  address: ''
})

let map, marker

onMounted(() => {
  // Mapa inicial solo si existe el div
  if (document.getElementById('map')) {
    map = L.map('map').setView([-12.0464, -77.0428], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  }
})

const getLocation = () => {
  navigator.geolocation.getCurrentPosition(async pos => {
    customer.value.latitude = pos.coords.latitude
    customer.value.longitude = pos.coords.longitude

    if (!map) {
      map = L.map('map').setView([pos.coords.latitude, pos.coords.longitude], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    }

    if (marker) marker.remove()
    marker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map)
    map.setView([pos.coords.latitude, pos.coords.longitude], 16)

    // Obtener dirección usando reverse geocoding de OpenStreetMap Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
      )
      const data = await res.json()
      customer.value.address = data.display_name || ''
    } catch (e) {
      console.error('Error obteniendo dirección:', e)
      customer.value.address = ''
    }
  }, err => {
    console.error(err)
    Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener ubicación',
      timer: 1500,
      showConfirmButton: false
    })
  })
}


const confirmOrder = async () => {
  if (
    !customer.value.name ||
    !customer.value.phone ||
    !customer.value.payment ||
    !customer.value.delivery ||
    !customer.value.order_type ||
    (customer.value.order_type === 'programado' && !customer.value.order_date)
  ) {
    Swal.fire({
      icon: 'error',
      title: 'Completa todos los datos del pedido',
      showConfirmButton: false,
      timer: 1500
    })
    return
  }

  const order = {
    customer_name: customer.value.name,
    customer_phone: customer.value.phone,
    payment_method: customer.value.payment,
    delivery_type: customer.value.delivery,
    order_type: customer.value.order_type,
    order_date:
      customer.value.order_type === 'programado'
        ? customer.value.order_date
        : null,
    syrup: cart.value[0]?.syrup || null,
    latitude: customer.value.latitude,
    longitude: customer.value.longitude,
    address: customer.value.address,
    items: cart.value.map(i => ({
      name: i.name,
      price: i.price,
      toppings: i.toppings,
      extra_cost: extraCost(i),
      syrup: i.syrup || null,
      fruit: i.fruit || null
    })),
    total: total.value
  }

  const { error } = await supabase.from('orders').insert(order)

  if (error) {
    console.error(error)
    Swal.fire({
      icon: 'error',
      title: 'Error al guardar el pedido',
      showConfirmButton: false,
      timer: 1500
    })
    return
  }

  // ============================
  // BOLETA PARA WHATSAPP
  // ============================
  let receipt = `🧾 *NUEVO PEDIDO*%0A%0A`
  receipt += `👤 Cliente: ${customer.value.name}%0A`
  receipt += `📞 Celular: ${customer.value.phone}%0A`
  receipt += `💳 Pago: ${customer.value.payment}%0A`
  receipt += `🚚 Entrega: ${customer.value.delivery}%0A`
  receipt += `⏱ Tipo: ${customer.value.order_type}%0A`
  if (customer.value.order_type === 'programado') {
    receipt += `📅 Fecha: ${customer.value.order_date}%0A`
  }
  if (customer.value.delivery === 'delivery' && customer.value.address) {
    receipt += `📍 Dirección: ${customer.value.address}%0A`
  }
  receipt += `%0A🛍 *Productos*%0A`
  cart.value.forEach(i => {
    receipt += `• ${i.name}%0A`
    if (i.toppings.length) {
      receipt += `  Toppings: ${i.toppings.join(', ')}%0A`
    }
    if (i.syrup) {
      receipt += `  Jarabe: ${i.syrup}%0A`
    }
    if (i.fruit) {
      receipt += `  Fruta: ${i.fruit}%0A`
    }
    receipt += `  Subtotal: ${currency(itemTotal(i))}%0A`
  })
  receipt += `%0A💰 *Total: ${currency(total.value)}*`

  if (customer.value.order_type === 'inmediato') {
    window.open(
      `https://wa.me/51960173518?text=${receipt}`,
      '_blank'
    )
  }

  cart.value = []
  localStorage.removeItem('cart')

  Swal.fire({
    icon: 'success',
    title: 'Pedido guardado correctamente',
    showConfirmButton: false,
    timer: 1500
  })
  location.reload()
}

const saveCart = () => {
  const plainCart = cart.value.map(i => ({
    ...i,
    toppings: i.toppings || [],
    syrup: i.syrup || null,
    fruit: i.fruit || null
  }))
  localStorage.setItem('cart', JSON.stringify(plainCart))
}


const toggleTopping = (item, topping) => {
  if (item.toppings.includes(topping)) {
    item.toppings = item.toppings.filter(t => t !== topping)
  } else {
    item.toppings.push(topping)
  }
  saveCart()
}


const getMaxToppingsByName = (item) => {
  const name = item.name.toUpperCase()

  // CHEESECAKE
  if (name.includes('CHEESECAKE')) {
    if (name.includes('PEQUE')) return 1
    if (name.includes('MEDIAN')) return 2
    if (name.includes('GRANDE')) return 3
  }

  // VASOS
  if (name.includes('10 ONZ')) return 2
  if (name.includes('12 ONZ')) return 3
  if (name.includes('14 ONZ')) return 4
  if (name.includes('MEDIO LITRO')) return 5

  return 0
}


const extraToppings = (item) => {
  const max = getMaxToppingsByName(item)
  const selected = item.toppings?.length || 0
  return Math.max(0, selected - max)
}


const extraCost = (item) => {
  return Math.ceil(extraToppings(item) / 2) * 1
}

const itemTotal = (item) => {
  return Number(item.price || 0) + Number(extraCost(item) || 0)
}

const total = computed(() =>
  cart.value.reduce((sum, item) => {
    return sum + Number(itemTotal(item) || 0)
  }, 0)
)

const removeItem = (index) => {
  cart.value.splice(index, 1)
  saveCart()
}

const currency = (v) => `S/ ${Number(v).toFixed(2)}`

</script>

<style scoped>
/* =======================
   CONTENEDOR GENERAL
======================= */
.cart {
  max-width: 900px;
  margin: auto;
  padding: 1.5rem;
  color: #1f3f7b;
}

/* =======================
   HEADER
======================= */
.cart-header {
  margin-bottom: 1rem;
}

.back-link {
  text-decoration: none;
  color: #1f3f7b;
  font-weight: 600;
  font-size: 0.95rem;
}

.back-link:hover {
  text-decoration: underline;
}

/* =======================
   TÍTULOS
======================= */
.cart h1 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.cart h2 {
  margin-top: 2rem;
  text-align: center;
}

.cart h3 {
  color: #1f3f7b;
  margin-top: 1.2rem;
}

/* =======================
   PASO 1: PRODUCTOS
======================= */
.cart-item {
  background: #ffffff;
  padding: 1.4rem;
  border-radius: 16px;
  margin-bottom: 1.8rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  position: relative;
  border-left: 6px solid #9adbe8;
}

.cart-item::before {
  content: "Paso 1";
  position: absolute;
  top: -12px;
  left: 16px;
  background: #9adbe8;
  color: #1f3f7b;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 6px;
}

.cart p {
  color: #333;
  margin: 0.4rem 0;
}

/* =======================
   TOPPINGS
======================= */
.toppings {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.5rem 1rem;
  margin: 0.8rem 0;
}

.toppings label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  background: #f6f8fc;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;
}

.toppings label:hover {
  background: #e9f4fb;
}

.toppings input {
  cursor: pointer;
}

/* =======================
   BOTÓN QUITAR
======================= */
.cart-item button {
  background: #ff6b6b;
  color: #fff;
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 0.8rem;
}

.cart-item button:hover {
  background: #e64949;
}

/* =======================
   PASO 2: DATOS DEL CLIENTE
======================= */
.checkout {
  background: #ffffff;
  padding: 1.8rem;
  border-radius: 18px;
  margin-top: 2.5rem;
  box-shadow: 0 12px 30px rgba(0,0,0,0.1);
  border-left: 6px solid #ffd166;
  position: relative;
}

.checkout::before {
  content: "Paso 2";
  position: absolute;
  top: -12px;
  left: 16px;
  background: #ffd166;
  color: #1f3f7b;
  padding: 0.25rem 0.7rem;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 6px;
}

.checkout h3 {
  margin-top: 1.4rem;
}

/* =======================
   INPUTS
======================= */
.checkout input,
.checkout select {
  width: 100%;
  padding: 0.65rem;
  margin-top: 0.4rem;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
}

.checkout input:focus,
.checkout select:focus {
  outline: none;
  border-color: #1f3f7b;
}

/* =======================
   MAPA
======================= */
#map {
  height: 220px;
  border-radius: 12px;
  margin-top: 0.6rem;
  overflow: hidden;
}

/* =======================
   PASO 3: CONFIRMAR
======================= */
.confirm {
  margin-top: 2rem;
  width: 100%;
  background: linear-gradient(135deg, #1f3f7b, #3f6fd1);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 14px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(31,63,123,0.35);
}

.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(31,63,123,0.45);
}

/* =======================
   MOBILE
======================= */
@media (max-width: 600px) {
  .cart {
    padding: 1rem;
  }

  .cart-item,
  .checkout {
    padding: 1.2rem;
  }
}


/* =======================
   WIZARD FLOW
======================= */

.wizard-next {
  text-align: center;
  margin: 2rem 0;
}

.next-step {
  background: linear-gradient(135deg, #00b4d8, #0077b6);
  color: white;
  border: none;
  padding: 0.9rem 1.6rem;
  border-radius: 14px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.next-step:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(0,0,0,0.2);
}

/* =======================
   PASO VISUAL
======================= */

.cart-item {
  border-left: 6px solid #4cc9f0;
}

.cart-item::before {
  content: "Paso 1 · Personaliza tu producto";
  position: absolute;
  top: -12px;
  left: 16px;
  background: #4cc9f0;
  color: #003049;
  padding: 0.25rem 0.7rem;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 6px;
}

/* =======================
   PASO 2
======================= */

.wizard-step {
  border-left: 6px solid #ffd166;
}

.wizard-step::before {
  content: "Paso 2 · Tus datos y entrega";
  position: absolute;
  top: -12px;
  left: 16px;
  background: #ffd166;
  color: #5a3e00;
  padding: 0.25rem 0.7rem;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 6px;
}

/* =======================
   UX FLOW
======================= */

.checkout {
  scroll-margin-top: 30px;
}

.back-step {
  width: 100%;
  background: #eee;
  border: none;
  padding: 0.7rem;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 1rem;
  font-weight: 600;
  margin-top: 30px;
}

</style>
