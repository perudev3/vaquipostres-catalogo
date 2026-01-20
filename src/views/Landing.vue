<template>
  <div class="landing-page">
    <!-- NAVBAR -->
    <header class="navbar">
      <div class="logo">
        <img src="/logo-blanco.png" alt="Vaqui Postres Logo" />
      </div>

      <nav :class="['nav-links', open ? 'open' : '']">
        <a href="tel:+1234567890">📞 +1 234 567 890</a>
        <a href="https://wa.me/1234567890" target="_blank">💬 WhatsApp</a>
        <router-link to="/cart">🛒 Carrito</router-link>
      </nav>

      <!-- Toggle menú móvil -->
      <button class="nav-toggle" @click="open = !open">☰</button>
    </header>

    <!-- HERO -->
    <section class="hero">
      <h1>Bienvenidos a Vaqui Postres 🍰</h1>
      <p>Mira nuestros productos y haz tu pedido por WhatsApp.</p>
    </section>

    <!-- LISTADO DE PRODUCTOS -->
    <section class="products">
      <h2>Nuestros Productos</h2>
      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-card">
          <img :src="product.image" :alt="product.name" />
          <h3>{{ product.name }}</h3>
          <p>{{ product.price | currency }}</p>
          <button @click="addToCart(product)">🛒 Agregar al carrito</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const open = ref(false);

const products = ref([
  { id: 1, name: 'Pastel de Chocolate', price: 15, image: '/products/pastel-choco.jpg' },
  { id: 2, name: 'Cheesecake', price: 12, image: '/products/cheesecake.jpg' },
  { id: 3, name: 'Cupcake Vainilla', price: 5, image: '/products/cupcake-vainilla.jpg' },
]);

const addToCart = (product) => {
  alert(`${product.name} agregado al carrito 🛒`);
};

const currency = (value) => `$${value.toFixed(2)}`;
</script>

<style scoped>
/* --- GLOBAL --- */
.landing-page {
  font-family: 'Poppins', sans-serif;
  color: #222;
  background: linear-gradient(to bottom, #fdf6f0, #f7e8d0);
  min-height: 100vh;
  overflow-x: hidden; /* evita scroll horizontal */
}

/* --- NAVBAR --- */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1f3f7b;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.logo img {
  height: 70px; /* logo más visible */
  max-width: 180px;
}

.nav-links {
  display: flex;
  gap: 1.2rem;
  align-items: center;
}

.nav-links a,
.nav-links router-link {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-links a:hover,
.nav-links router-link:hover {
  color: #25d366;
}

.nav-toggle {
  display: none;
  background: #25d366;
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

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: #fff;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.product-card img {
  max-width: 100%;
  border-radius: 12px;
  margin-bottom: 0.8rem;
}

.product-card h3 {
  margin: 0.5rem 0;
  font-size: 1.2rem;
  color: #1f3f7b;
}

.product-card p {
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.product-card button {
  background: #25d366;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
}

.product-card button:hover {
  background: #128c7e;
}

/* --- RESPONSIVE --- */
@media (max-width: 768px) {
  .nav-links {
    position: fixed;
    top: 70px;
    right: 0;
    flex-direction: column;
    background: #1f3f7b;
    width: 220px;
    padding: 1rem;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    height: calc(100vh - 70px);
    overflow-y: auto; /* scroll interno del menú si hay muchos links */
  }

  .nav-links.open {
    transform: translateX(0);
  }

  .nav-toggle {
    display: block;
  }
}
</style>
