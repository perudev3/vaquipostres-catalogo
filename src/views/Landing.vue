<template>
  <div class="landing-page">
    <h1>Bienvenidos a Vaqui Postres 🍰</h1>
    <p>Mira nuestros productos y haz tu pedido por WhatsApp.</p>
    <router-link to="/login" class="btn-login">Iniciar sesión</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.landing-page {
  text-align: center;
  padding: 2rem;
}
.btn-login {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #25d366;
  color: white;
  border-radius: 8px;
  text-decoration: none;
}
</style>
