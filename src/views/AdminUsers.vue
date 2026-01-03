<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2'; // <-- Import SweetAlert2

const email = ref('');
const password = ref('');
const name = ref('');
const users = ref([]);
const search = ref(''); // Filtro de búsqueda

// Modal edición
const showEditModal = ref(false);
const editUserData = ref({ id: '', email: '', name: '' });

// Cargar usuarios
const loadUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'kiosk')
      .order('created_at', { ascending: false });
    if (error) throw error;
    users.value = data || [];
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error cargando usuarios, revisa la consola',
    });
  }
};

// Crear usuario
const createUser = async () => {
  if (!email.value || !password.value) {
    return Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Email y contraseña son obligatorios',
    });
  }

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });
    if (signUpError)
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: signUpError.message,
      });

    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        email: email.value,
        name: name.value,
        role: 'kiosk',
        active: true,
      },
    ]);
    if (profileError)
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: profileError.message,
      });

    email.value = '';
    password.value = '';
    name.value = '';
    loadUsers();

    Swal.fire({
      icon: 'success',
      title: 'Usuario creado',
      text: 'El usuario se creó correctamente',
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error('Error creando usuario:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error creando usuario, revisa la consola',
    });
  }
};

// Activar / desactivar usuario
const toggleActive = async (id, value) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ active: value })
      .eq('id', id);
    if (error) throw error;
    loadUsers();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Usuario ${value ? 'activado' : 'desactivado'}`,
      showConfirmButton: false,
      timer: 1200,
      timerProgressBar: true,
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error actualizando estado del usuario',
    });
  }
};

// Abrir modal para editar
const openEditModal = (u) => {
  editUserData.value = { ...u };
  showEditModal.value = true;
};

// Guardar cambios del modal
const saveEditUser = async () => {
  if (!editUserData.value.email)
    return Swal.fire({
      icon: 'warning',
      title: 'Campo requerido',
      text: 'El email es obligatorio',
    });

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        email: editUserData.value.email,
        name: editUserData.value.name,
      })
      .eq('id', editUserData.value.id);
    if (error) throw error;

    showEditModal.value = false;
    loadUsers();

    Swal.fire({
      icon: 'success',
      title: 'Usuario editado',
      text: 'Los cambios se guardaron correctamente',
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al editar usuario',
    });
  }
};

// Eliminar usuario
const deleteUser = async (id) => {
  const result = await Swal.fire({
    title: 'Eliminar usuario',
    text: '¿Estás seguro?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  });

  if (!result.isConfirmed) return;

  try {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    loadUsers();

    Swal.fire({
      icon: 'success',
      title: 'Usuario eliminado',
      text: 'El usuario fue eliminado correctamente',
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error eliminando usuario',
    });
  }
};

// Filtrar usuarios por nombre o email
const filteredUsers = computed(() =>
  users.value.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.value.toLowerCase())
  )
);

onMounted(loadUsers);
</script>

<template>
  <div class="users-page">
    <h1>Usuarios Kiosko (Admin)</h1>

    <!-- FORMULARIO CREAR USUARIO -->
    <div class="card">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Contraseña" />
      <input v-model="name" placeholder="Nombre" />
      <button class="btn-create" @click="createUser">➕ Crear usuario</button>
    </div>

    <!-- FILTRO DE BÚSQUEDA -->
    <input
      v-model="search"
      placeholder="Buscar por nombre o email..."
      class="search-input"
    />

    <!-- LISTA DE USUARIOS -->
    <div class="users-list">
      <div v-for="u in filteredUsers" :key="u.id" class="user-card">
        <div class="user-info">
          <strong>{{ u.name || u.email }}</strong>
          <span :class="u.active ? 'active' : 'inactive'">
            {{ u.active ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
        <div class="user-actions">
          <button class="btn toggle" @click="toggleActive(u.id, !u.active)">
            {{ u.active ? 'Desactivar' : 'Activar' }}
          </button>
          <button class="btn edit" @click="openEditModal(u)">Editar</button>
          <button class="btn delete" @click="deleteUser(u.id)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR USUARIO -->
    <div v-if="showEditModal" class="backdrop">
      <div class="modal">
        <h3>Editar Usuario</h3>
        <input v-model="editUserData.email" placeholder="Email" />
        <input v-model="editUserData.name" placeholder="Nombre" />
        <div class="modal-actions">
          <button @click="saveEditUser">Guardar</button>
          <button @click="showEditModal = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-page {
  max-width: 900px;
  margin: auto;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #111827;
}

/* FORMULARIO CREAR USUARIO */
.card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 14px;
}
.card input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
.btn-create {
  background: #4f46e5;
  color: white;
  padding: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-create:hover {
  background: #4338ca;
}

/* FILTRO */
.search-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
}
.search-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* LISTA DE USUARIOS */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}
.user-card {
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.user-info span.active {
  color: #16a34a;
  font-weight: 600;
}
.user-info span.inactive {
  color: #dc2626;
  font-weight: 600;
}
.user-actions button {
  margin-left: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.user-actions .toggle {
  background: #f0f0f0;
}
.user-actions .toggle:hover {
  background: #e5e5e5;
}
.user-actions .edit {
  background: #bfdbfe;
}
.user-actions .edit:hover {
  background: #93c5fd;
}
.user-actions .delete {
  background: #fecaca;
}
.user-actions .delete:hover {
  background: #fca5a5;
}

/* MODAL */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}
.modal {
  background: white;
  padding: 20px;
  width: 300px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}
.modal-actions {
  display: flex;
  justify-content: space-between;
}
.modal-actions button {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.modal-actions button:first-child {
  background: #4f46e5;
  color: white;
}
.modal-actions button:first-child:hover {
  background: #4338ca;
}
.modal-actions button:last-child {
  background: #f0f0f0;
}
.modal-actions button:last-child:hover {
  background: #d9d9d9;
}

/* SCROLL ESTILO */
.users-list::-webkit-scrollbar {
  width: 6px;
}
.users-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.users-list::-webkit-scrollbar-track {
  background: transparent;
}
</style>
