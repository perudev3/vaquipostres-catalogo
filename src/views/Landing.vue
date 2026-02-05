<template>
  <div class="landing">

    <!-- NAVBAR -->
    <header class="navbar">
      <div class="brand">
        <img src="/logo-blanco.png" alt="Vaqui Postres" />
      </div>

      <nav :class="['nav', open ? 'open' : '']">
        <a href="tel:+51960173518">📞 Llamar</a>
        <a href="https://wa.me/51960173518" target="_blank">💬 WhatsApp</a>
        <a href="/PROFORMA.pdf" target="_blank" class="quote">📄 Cotización</a>
      </nav>

      <router-link to="/cart" class="cart">
        🛒
        <span v-if="cartCount">{{ cartCount }}</span>
      </router-link>

      <button class="menu" @click="open = !open">☰</button>
    </header>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-box">

        <!-- LOGO -->
        <img
          src="/logo-blanco.png"
          alt="Vaqui Postres"
          class="hero-logo"
        />

        <h1>Postres artesanales que enamoran 🤍</h1>
        <p>MaracuMango · MaracuLúcuma · Cheesecake premium</p>

        <button @click="scrollToProducts">Ver postres 🍰</button>

        <small>⏰ Lun–Sáb · 2pm a 10pm</small>
      </div>
    </section>


    
  <!-- BENEFICIOS + PROMO -->
  <section class="benefits">

   <!-- PROMO JUEVES 2x1 -->
      <div class="promo-banner" @click="applyPromo2x1">
        <img src="/Jueves_2x1.png" alt="Jueves 2x1 Maracumango">

        <button class="promo-btn">
          👉 Quiero la promoción
        </button>
      </div>


      <!-- BENEFICIOS -->
      <div>🍰 Artesanales</div>
      <div>🧡 Ingredientes frescos</div>
      <div>🚀 Pedido rápido</div>
      <div>✨ Presentación premium</div>

  </section>

    <!-- PRODUCTOS -->
    <section class="products" ref="productsRef">

      <div class="category">
        <h2>🥭🍮 Maraculúcuma</h2>
        <p>La combinación favorita de nuestros clientes</p>

        <div class="grid">
          <div
            v-for="p in products.filter(p => p.name.startsWith('MARACULUCUMA'))"
            :key="p.id"
            class="card"
          >
            <img :src="p.image" @click="openPreview(p)" />
            <h3>{{ p.name }}</h3>
            <strong>{{ currency(p.price) }}</strong>
            <button @click="addToCart(p)">Agregar 🛒</button>
          </div>
        </div>
      </div>

      <div class="category alt">
        <h2>🥭 Maracumango</h2>
        <p>Fresco, intenso y delicioso</p>

        <div class="grid">
          <div
            v-for="p in products.filter(p => p.name.startsWith('MARACUMANGO'))"
            :key="p.id"
            class="card"
          >
            <img :src="p.image" @click="openPreview(p)" />
            <h3>{{ p.name }}</h3>
            <strong>{{ currency(p.price) }}</strong>
            <button @click="addToCart(p)">Agregar 🛒</button>
          </div>
        </div>
      </div>

      <!-- PROMO MITAD MARACUMANGOS -->
      <div class="promo-banner" @click="applyComboRomantico">
        <img src="/combo_romantico.png" alt="Combo Romántico">
      </div>



      <div class="category">
        <h2>🍰 Cheesecake Maraculúcuma</h2>

        <div class="grid">
          <div
            v-for="p in products.filter(p => p.name.startsWith('CHEESECAKE - MARACULUCUMA'))"
            :key="p.id"
            class="card"
          >
            <img :src="p.image" @click="openPreview(p)" />
            <h3>{{ p.name }}</h3>
            <strong>{{ currency(p.price) }}</strong>
            <button @click="addToCart(p)">Agregar 🛒</button>
          </div>
        </div>
      </div>

      <div class="category alt">
        <h2>🍰 Cheesecake Maracumango</h2>

        <div class="grid">
          <div
            v-for="p in products.filter(p => p.name.startsWith('CHEESECAKE - MARACUMANGO'))"
            :key="p.id"
            class="card"
          >
            <img :src="p.image" @click="openPreview(p)" />
            <h3>{{ p.name }}</h3>
            <strong>{{ currency(p.price) }}</strong>
            <button @click="addToCart(p)">Agregar 🛒</button>
          </div>
        </div>
      </div>

    </section>

    <!-- PREVIEW -->
    <div v-if="previewProduct" class="preview-overlay" @click.self="previewProduct = null">
      <div class="preview-card">
        <img :src="previewProduct.image" />
        <h3>{{ previewProduct.name }}</h3>
        <strong>{{ currency(previewProduct.price) }}</strong>
        <button @click="addToCart(previewProduct)">Agregar 🛒</button>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
      <h3>¿Antojo de algo dulce? 🍮</h3>
      <a href="https://wa.me/51960173518" target="_blank">
        Escríbenos por WhatsApp 💬
      </a>
    </footer>

  </div>
</template>



<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import Swal from 'sweetalert2'

const open = ref(false)
const previewProduct = ref(null)
const productsRef = ref(null)
const isThursdayPromo = ref(false)


const openPreview = (product) => {
  previewProduct.value = product
}

const scrollToProducts = () => {
  productsRef.value?.scrollIntoView({
    behavior: 'smooth'
  })
}

// ===============================
// PRODUCTOS DESDE SUPABASE
// ===============================
const products = ref([])

const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error cargando productos:', error)
    return
  }

  // Normalizamos el producto para el carrito
  products.value = data.map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    image: p.image_url,
    max_toppings: p.max_toppings, // 👈 según carta
    category: p.category,

    // datos que se usarán luego en el carrito
    quantity: 1,
    toppings: [],
    extra_toppings: 0
  }))
}

// ===============================
// CARRITO (localStorage)
// ===============================
const cart = ref(JSON.parse(localStorage.getItem('cart')) || [])

const cartCount = computed(() => cart.value.length)

const saveCart = () => {
  localStorage.setItem('cart', JSON.stringify(cart.value))
}

const addToCart = (product) => {
  cart.value.push({
    ...product,
    toppings: [],
    extra_toppings: 0
  })

  saveCart()

  Swal.fire({
    icon: 'success',
    title: 'Producto agregado',
    text: `${product.name} se agregó al carrito 🛒`,
    showConfirmButton: false,
    timer: 1500
  })
}

const applyPromo2x1 = () => {
  const today = new Date().getDay() // 4 = jueves
  if (today !== 4) {
    Swal.fire(
      'Promo no disponible',
      'La promoción 2x1 solo aplica los jueves',
      'info'
    )
    return
  }

  const maracumango1050 = products.value.find(p =>
    p.name.toUpperCase().includes('MARACUMANGO') &&
    p.name.includes('12 ONZ') &&
    Math.abs(Number(p.price) - 10.5) < 0.01
  )

  if (!maracumango1050) {
    Swal.fire(
      'Error',
      'No se encontró el Maracumango de 12 ONZ',
      'warning'
    )
    return
  }

    addToCart({
      ...maracumango1050,
      promo: 'JUEVES_2X1'
    })

    addToCart({
      ...maracumango1050,
      promo: 'JUEVES_2X1'
    })

    localStorage.setItem('promo2x1', 'true')

  Swal.fire({
    icon: 'success',
    title: 'Promo aplicada 🎉',
    text: '2 Maracumangos de 12 ONZ por S/ 19.90',
    timer: 1500,
    showConfirmButton: false
  })

  setTimeout(() => {
    window.location.href = '/cart'
  }, 1200)
}


const isValentinePromoActive = () => {
  const today = new Date()

  const year = today.getFullYear()

  const start = new Date(year, 1, 12) // Febrero = 1
  start.setHours(0, 0, 0, 0)

  const end = new Date(year, 1, 14)
  end.setHours(23, 59, 59, 999)

  return today >= start && today <= end
}

const applyComboRomantico = () => {

  if (!isValentinePromoActive()) {
    Swal.fire(
      'Promo no disponible 💔',
      'El Combo Romántico solo está disponible del 12 al 14 de febrero',
      'info'
    )
    return
  }

  const maracumango850 = products.value.find(p =>
    p.name.toUpperCase().startsWith('MARACUMANGO') &&
    Math.abs(p.price - 8.5) < 0.01
  )

  const maraculucuma1050 = products.value.find(p =>
    p.name.toUpperCase().startsWith('MARACULUCUMA') &&
    Math.abs(p.price - 10.5) < 0.01
  )

  if (!maracumango850 || !maraculucuma1050) {
    Swal.fire(
      'Error',
      'No se encontraron los productos del Combo Romántico',
      'error'
    )
    return
  }

  addToCart({ ...maracumango850, promo: 'COMBO_ROMANTICO' })
  addToCart({ ...maracumango850, promo: 'COMBO_ROMANTICO' })
  addToCart({ ...maraculucuma1050, promo: 'COMBO_ROMANTICO' })

  localStorage.setItem('comboRomantico', 'true')

  Swal.fire({
    icon: 'success',
    title: '💕 Combo Romántico aplicado',
    text: '2 Maracumangos + 1 Maraculúcuma por S/ 25.00',
    timer: 1600,
    showConfirmButton: false
  })

  setTimeout(() => {
    window.location.href = '/cart'
  }, 1200)
}



const currency = (value) => `S/ ${Number(value).toFixed(2)}`

const applyPromoHalfMaracumango = () => {

  // 1. Filtrar solo maracumangos
  const maracumangos = products.value.filter(p =>
    p.name.toUpperCase().startsWith('MARACUMANGO')
  )

  if (maracumangos.length === 0) {
    Swal.fire('Error', 'No hay Maracumangos disponibles', 'warning')
    return
  }

  // 2. Ordenarlos por precio (más baratos primero)
  const sorted = [...maracumangos].sort((a, b) => a.price - b.price)

  // 3. Tomar solo la mitad
  const mitad = Math.ceil(sorted.length / 2)
  const promoList = sorted.slice(0, mitad)

  // 4. Elegimos uno (el más barato de la promo)
  const promoProduct = promoList[0]

  // 5. Agregar al carrito con marca de promo
  addToCart({
    ...promoProduct,
    promo: 'MITAD_MARACUMANGO'
  })

  localStorage.setItem('promo_half_maracumango', 'true')

  Swal.fire({
    icon: 'success',
    title: 'Promo aplicada 🥭',
    text: `Maracumango seleccionado en promoción`,
    timer: 1600,
    showConfirmButton: false
  })

  setTimeout(() => {
    window.location.href = '/cart'
  }, 1200)
}


onMounted(() => {
  getProducts()
})
</script>


<style scoped>
.landing {
  font-family: 'Poppins', sans-serif;
  background: #fff;
  color: #1f3f7b;
}

/* NAVBAR */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  background: #9adbe8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.5rem;
  z-index: 1000;
}

.brand img {
  height: 70px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}


.nav a {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  color: #1f3f7b;
  background: rgba(255,255,255,0.35);
  transition: all 0.25s ease;
  box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}


.nav a:hover {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.15);
}


.nav .quote {
  background: #1f3f7b;
  color: #ffffff;
  font-weight: 700;
}

.nav .quote:hover {
  background: #163166;
}


@media (max-width: 768px) {
  .nav {
    position: fixed;
    top: 100px;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    width: 220px;
    padding: 1rem;
    background: #9adbe8;
    border-radius: 20px 0 0 20px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: -6px 0 20px rgba(0,0,0,0.2);
    z-index: 999;
  }

  .nav.open {
    transform: translateX(0);
  }

  .nav a {
    justify-content: center;
    width: 100%;
  }
}


.menu {
  display: none;
}

/* HERO */
.hero {
  margin-top: 90px;
  height: 55vh;
  background: linear-gradient(
    rgba(255,255,255,0.8),
    rgba(255,255,255,0.9)
  ),
  url('/hero-postre.jpg') center/cover;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-logo {
  width: 140px;
  max-width: 70%;
  margin: 0 auto 1rem;
  display: block;
}


.hero-box {
  text-align: center;
  max-width: 500px;
}

.hero-box h1 {
  font-size: 1.6rem;
}

.hero-box button {
  margin: 1rem 0;
  padding: 0.8rem 2rem;
  border-radius: 999px;
  border: none;
  background: #25d366;
  color: white;
  font-weight: 700;
}

/* BENEFICIOS */
.benefits {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  text-align: center;
  background: #f9f9f9;
}

/* PRODUCTOS */
.products {
  padding: 4rem 1rem;
}

.category {
  margin-bottom: 4rem;
}

.category.alt {
  background: #fdf6f0;
  padding: 2.5rem 1rem;
  border-radius: 30px;
}

.category h2 {
  text-align: center;
  font-size: 1.8rem;
}

.category p {
  text-align: center;
  opacity: 0.8;
  font-size: 0.95rem;
}

/* 👇 AQUÍ ESTÁ LA CLAVE */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-top: 1.8rem;
}

/* TARJETA MÁS PEQUEÑA */
.card {
  background: white;
  border-radius: 16px;
  padding: 0.7rem;
  text-align: center;
  box-shadow: 0 6px 14px rgba(0,0,0,0.08);
}

/* IMAGEN MÁS BAJA */
.card img {
  width: 100%;
  height: 130px;
  object-fit: cover;
  border-radius: 12px;
}

/* TEXTO MÁS COMPACTO */
.card h3 {
  font-size: 0.85rem;
  margin: 0.4rem 0;
  line-height: 1.2;
  color: #2c2c2c;
}

.card strong {
  font-size: 0.9rem;
  color: #1f3f7b;
}

/* BOTÓN MÁS COMPACTO */
.card button {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.45rem;
  border-radius: 999px;
  border: none;
  background: #1fa855;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

/* FOOTER */
.footer {
  background: #1f3f7b;
  color: white;
  text-align: center;
  padding: 3rem 1rem;
}

.footer a {
  display: inline-block;
  margin-top: 1rem;
  background: #25d366;
  padding: 0.7rem 1.6rem;
  border-radius: 999px;
  color: white;
  text-decoration: none;
  font-weight: 700;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .nav {
    position: fixed;
    right: 0;
    top: 80px;
    flex-direction: column;
    background: #9adbe8;
    width: 200px;
    transform: translateX(100%);
  }

  .nav.open {
    transform: translateX(0);
  }

  .menu {
    display: block;
  }

  .benefits {
    grid-template-columns: 1fr 1fr;
  }

  /* MÁS PRODUCTOS EN CELULAR */
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.preview-card {
  background: white;
  border-radius: 20px;
  padding: 1.2rem;
  width: 320px;
  max-width: 90%;
  text-align: center;
}

.preview-card img{
  width: 100%;
}

.preview-card button{
  border-bottom: 1px solid black;
}
/* PROMO BANNER */
.promo-banner {
  position: relative; /* CLAVE para posicionar el botón */
  grid-column: 1 / -1;
  margin-bottom: 1.2rem;
  cursor: pointer;
}

.promo-banner img {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: block;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  transition: transform 0.25s ease;
}

/* BOTÓN OVERLAY */
.promo-btn {
  position: absolute;
  bottom: 18px;
  right: 18px;

  background: #ff4d6d;
  color: white;
  border: none;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;

  box-shadow: 0 6px 14px rgba(0,0,0,0.25);
  transition: all 0.25s ease;
}

.promo-btn:hover {
  transform: scale(1.05);
  background: #e63956;
}

.promo-banner img:hover {
  transform: scale(1.02);
}

</style>
