<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../lib/supabase';

const router = useRouter();
const route = useRoute();
const open = ref(false);
const role = ref(''); // rol del usuario

// Obtener rol al cargar el sidebar
const getUserRole = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener rol:', error);
      return;
    }

    role.value = profile?.role || 'admin';
  } catch (err) {
    console.error(err);
  }
};

// Navegar a ruta y cerrar sidebar automáticamente
const go = (path) => {
  router.push(path);
  open.value = false;
};

// Cerrar sesión
const logout = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    console.warn('Sesión ya cerrada');
  } finally {
    router.push('/login');
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

onMounted(() => {
  getUserRole();
  document.addEventListener('click', handleClickOutside);
});
</script>

<template>
  <!-- SIDEBAR -->
  <aside :class="['sidebar', open ? 'open' : 'closed']">
    <h2 class="brand">POS System</h2>

    <nav class="nav-items">
      <button v-if="role === 'admin'" @click="go('/')" class="btn">
        Dashboard
      </button>

      <button @click="go('/sales')" class="btn">Ventas</button>
      <button @click="go('/products')" class="btn">Productos</button>
      <button @click="go('/pos')" class="btn">POS</button>

      <button v-if="role === 'admin'" @click="go('/users')" class="btn">
        Usuarios
      </button>
      <!-- <button v-if="role === 'admin'" @click="go('/settings')" class="btn">
        Config
      </button> -->

      <button class="btn logout" @click="logout">🔒 Cerrar sesión</button>
    </nav>
  </aside>

  <!-- BOTÓN TOGGLE -->
  <button class="toggle" @click="open = !open">☰</button>
</template>

<style scoped>
/* SIDEBAR */
.sidebar {
  width: 240px;
  max-width: 80%;
  height: 100vh;
  background: linear-gradient(180deg, #1e293b, #334155);
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
}

.sidebar.closed {
  transform: translateX(-100%);
}

/* BRAND */
.brand {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 30px;
  text-align: center;
  letter-spacing: 1px;
}

/* NAV ITEMS */
.nav-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: none;
  color: #f1f5f9;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.15);
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
  transform: translateX(3px);
}

/* BOTÓN TOGGLE */
.toggle {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 2001;
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 12px 16px;
  font-size: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.toggle:hover {
  background: #2563eb;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
    padding: 18px;
  }

  .btn {
    font-size: 14px;
    padding: 10px 14px;
  }
}
</style>
