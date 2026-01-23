<template>
  <div class="landing-page">
    <!-- NAVBAR -->
    <header class="navbar">
      <div class="logo">
        <img src="/logo-blanco.png" alt="Vaqui Postres Logo" />
      </div>

      <nav :class="['nav-links', open ? 'open' : '']">
        <a href="tel:+51960173518">📞 +51960173518</a>
        <a href="https://wa.me/51960173518" target="_blank">💬 WhatsApp</a>

        <!-- NUEVO: DESCARGA DE COTIZACIÓN -->
        <a
          href="/PROFORMA.pdf"
          class="cotizacion-link"
          target="_blank"
        >
          📄 Descargar cotización
        </a>

        <router-link to="/cart" class="cart-link">
          🛒 Carrito
          <span v-if="cartCount > 0" class="cart-badge">
            {{ cartCount }}
          </span>
        </router-link>

      </nav>

      <!-- Toggle menú móvil -->
      <button class="nav-toggle" @click="open = !open">☰</button>
    </header>

    <!-- HERO -->
    <section class="hero">
      <h1>Bienvenidos a Vaqui Postres </h1>
      <div class="logo">
        <img src="/logo-blanco.png" alt="Vaqui Postres Logo" />
      </div>
      <p>Mira nuestros productos y haz tu pedido por WhatsApp.</p>
    </section>

    <!-- LISTADO DE PRODUCTOS -->
    <section class="products">
  <h2>Nuestros Productos</h2>

  <!-- MARACULUCUMA -->
  <h3 class="category-title">🥭🍮 Maraculúcuma</h3>
  <div class="product-grid">
    <div
      v-for="product in products.filter(p =>
        p.name.startsWith('MARACULUCUMA')
      )"
      :key="product.id"
      class="product-card"
    >
      <img :src="product.image" :alt="product.name" />
      <h3>{{ product.name }}</h3>
      <p>{{ currency(product.price) }}</p>
      <button @click="addToCart(product)">🛒 Agregar al carrito</button>
    </div>
  </div>

  <!-- MARACUMANGO -->
  <h3 class="category-title">🥭 Maracumango</h3>
  <div class="product-grid">
    <div
      v-for="product in products.filter(p =>
        p.name.startsWith('MARACUMANGO')
      )"
      :key="product.id"
      class="product-card"
    >
      <img :src="product.image" :alt="product.name" />
      <h3>{{ product.name }}</h3>
      <p>{{ currency(product.price) }}</p>
      <button @click="addToCart(product)">🛒 Agregar al carrito</button>
    </div>
  </div>

  <!-- CHEESECAKE MARACULUCUMA -->
  <h3 class="category-title">🍰 Cheesecake de Maraculúcuma</h3>
  <div class="product-grid">
    <div
      v-for="product in products.filter(p =>
        p.name.startsWith('CHEESECAKE - MARACULUCUMA')
      )"
      :key="product.id"
      class="product-card"
    >
      <img :src="product.image" :alt="product.name" />
      <h3>{{ product.name }}</h3>
      <p>{{ currency(product.price) }}</p>
      <button @click="addToCart(product)">🛒 Agregar al carrito</button>
    </div>
  </div>

  <!-- CHEESECAKE MARACUMANGO -->
  <h3 class="category-title">🍰 Cheesecake de Maracumango</h3>
  <div class="product-grid">
    <div
      v-for="product in products.filter(p =>
        p.name.startsWith('CHEESECAKE - MARACUMANGO')
      )"
      :key="product.id"
      class="product-card"
    >
      <img :src="product.image" :alt="product.name" />
      <h3>{{ product.name }}</h3>
      <p>{{ currency(product.price) }}</p>
      <button @click="addToCart(product)">🛒 Agregar al carrito</button>
    </div>
  </div>

</section>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase' // ajusta si tu ruta es distinta
import Swal from 'sweetalert2'


const open = ref(false)

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

import { computed } from 'vue'
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


const currency = (value) => `S/ ${Number(value).toFixed(2)}`

onMounted(() => {
  getProducts()
})
</script>


<style scoped>
/* --- GLOBAL --- */
.landing-page {
  font-family: 'Poppins', sans-serif;
  color: #222;
  background: linear-gradient(to bottom, #fdf6f0, #f7e8d0);
  min-height: 100vh;
  overflow-x: hidden;
}

/* --- NAVBAR (AJUSTADO A BRANDING VAQUI) --- */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #9adbe8;
  color: #1f3f7b;
  position: fixed;   /* 👈 CLAVE */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.logo img {
  height: 100px;
  max-width: 180px;
}

.nav-links {
  display: flex;
  gap: 1.2rem;
  align-items: center;
}

.nav-links a,
.nav-links router-link {
  color: #1f3f7b;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-links a:hover,
.nav-links router-link:hover {
  color: #25d366;
}

/* LINK COTIZACIÓN */
.cotizacion-link {
  background: #ffffff;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-weight: 600;
}

.cotizacion-link:hover {
  background: #1f3f7b;
  color: #fff;
}

.nav-toggle {
  display: none;
  background: #1f3f7b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
}

/* --- HERO --- */
.hero {
  text-align: center;
  padding: 4rem 1rem;
  color: #1f3f7b;
  margin-top: 95px;
}

.hero h1 {
  font-size: 2.8rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

/* --- PRODUCTOS --- */
.products {
  padding: 3rem 1rem;
  text-align: center;
}

.products h2 {
  font-size: 2rem;
  color: #1f3f7b;
  margin-bottom: 2rem;
}

/* TÍTULOS DE CATEGORÍA */
.category-title {
  margin: 3.5rem 0 1.5rem;
  padding: 0.6rem 1.4rem;
  display: inline-block;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f3f7b;
  background: linear-gradient(135deg, #ffffff, #fcebd7);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: left;
}

.category-title::after {
  content: '';
  display: block;
  height: 3px;
  width: 60px;
  background: linear-gradient(to right, #25d366, #9adbe8);
  border-radius: 999px;
  margin-top: 6px;
}

/* GRID */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.8rem;
  margin-bottom: 2.5rem;
}

/* TARJETA DE PRODUCTO */
.product-card {
  background: linear-gradient(to bottom, #ffffff, #fff7ee);
  border-radius: 20px;
  padding: 1.2rem;
  box-shadow: 0 8px 18px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 14px 28px rgba(0,0,0,0.18);
}

/* IMAGEN */
.product-card img {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 0.8rem;
  transition: transform 0.4s ease;
}

.product-card:hover img {
  transform: scale(1.05);
}

/* NOMBRE */
.product-card h3 {
  margin: 0.6rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f3f7b;
  text-align: center;
}

/* PRECIO */
.product-card p {
  font-size: 1.05rem;
  font-weight: 700;
  color: #25a15a;
  margin-bottom: 0.8rem;
}

/* BOTÓN */
.product-card button {
  margin-top: auto;
  width: 100%;
  background: linear-gradient(135deg, #25d366, #1fa855);
  color: white;
  border: none;
  padding: 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 4px 10px rgba(37, 211, 102, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card button:hover {
  background: linear-gradient(135deg, #1fa855, #128c7e);
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(18, 140, 126, 0.5);
}

/* --- RESPONSIVE --- */
@media (max-width: 768px) {
  .nav-links {
    position: fixed;
    top: 108px;
    right: 0;
    flex-direction: column;
    background: #9adbe8;
    width: 220px;
    padding: 1rem;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    height: calc(100vh - 70px);
    overflow-y: auto;
  }

  .nav-links.open {
    transform: translateX(0);
  }

  .nav-toggle {
    display: block;
  }

  .category-title {
    text-align: center;
  }
}

/* CARRITO */
.cart-link {
  position: relative;
}

.cart-badge {
  background: #ff3b3b;
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 999px;
  padding: 2px 6px;
  position: absolute;
  top: -6px;
  right: -10px;
}
</style>
