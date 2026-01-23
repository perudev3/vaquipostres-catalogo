<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../lib/supabase';

const router = useRouter();
const route = useRoute();
const open = ref(false);
const role = ref('');

// Obtener el rol del usuario desde Supabase
const getUserRole = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.session.user.id)
      .maybeSingle();

    role.value = profile?.role || 'admin';
  } catch (err) {
    console.error(err);
  }
};

// Navegar usando nombre de ruta para evitar warnings
const go = (name) => {
  router.push({ name });
  open.value = false;
};

// Logout
const logout = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } finally {
    router.push({ name: 'login' });
    open.value = false;
  }
};

// Cerrar sidebar al hacer click fuera
const handleClickOutside = (event) => {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.toggle');
  if (
    sidebar &&
    !sidebar.contains(event.target) &&
    !toggleBtn.contains(event.target)
  ) {
    open.value = false;
  }
};

// Cerrar sidebar al cambiar de ruta
watch(route, () => {
  open.value = false;
});

// Ejecutar al montar
onMounted(() => {
  getUserRole();
  document.addEventListener('click', handleClickOutside);
});
</script>

<template>
  <!-- SIDEBAR -->
  <aside :class="['sidebar', open ? 'open' : 'closed']">
    <!-- HEADER (logo alineado al toggle) -->
    <div class="sidebar-header">
      <div class="brand-logo">
        <img src="/logo-blanco.png" alt="VAQUIPOSTRES Logo" />
      </div>
    </div>

    <nav class="nav-items">
      <button @click="go('dashboard')" class="btn">Dashboard</button>
      <button @click="go('sales')" class="btn">Ventas</button>
      <button @click="go('products')" class="btn">Productos</button>
      <button @click="go('pos')" class="btn">POS</button>
      <button v-if="role === 'admin'" @click="go('egresos')" class="btn">Egresos</button>
      <button v-if="role === 'admin'" @click="go('orders')" class="btn">Pedidos</button>
      <button class="btn logout" @click="logout">🔒 Cerrar sesión</button>
    </nav>
  </aside>

  <!-- BOTÓN TOGGLE -->
  <button class="toggle" @click="open = !open">☰</button>
</template>

<style scoped>
/* Mantengo exactamente tus estilos actuales */

/* SIDEBAR */
.sidebar {
  width: 240px;
  max-width: 80%;
  height: 100vh;
  background: linear-gradient(180deg, #0b3c5d, #1f5f8b);
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.25);
}

.sidebar.closed {
  transform: translateX(-100%);
}

/* HEADER */
.sidebar-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

/* LOGO */
.brand-logo {
  padding: 6px 10px;
  border-radius: 10px;
}

.brand-logo img {
  max-width: 90px;
  height: auto;
  object-fit: contain;
}

/* NAV */
.nav-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  border: none;
  color: #f8fafc;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateX(3px);
}

/* LOGOUT */
.logout {
  margin-top: auto;
  background: #ef4444;
  font-weight: 600;
}

.logout:hover {
  background: #dc2626;
}

/* TOGGLE */
.toggle {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 2001;
  background: #1fa2c1;
  color: #fff;
  border: none;
  padding: 12px 16px;
  font-size: 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.toggle:hover {
  background: #0ea5e9;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
    padding: 18px;
  }

  .brand-logo img {
    max-width: 80px;
    margin-top: 0px;
  }

  .btn {
    font-size: 14px;
    padding: 10px 14px;
  }
}
</style>
