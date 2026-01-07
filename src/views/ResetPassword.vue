<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const loading = ref(false)

const updatePassword = async () => {
  if (password.value.length < 6) {
    Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error')
    return
  }

  loading.value = true

  const { error } = await supabase.auth.updateUser({
    password: password.value,
  })

  loading.value = false

  if (error) {
    Swal.fire('Error', error.message, 'error')
    return
  }

  Swal.fire(
    'Contraseña actualizada',
    'Ahora puedes iniciar sesión',
    'success'
  )

  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="reset-page">
    <div class="card">
      <h2>Nueva contraseña</h2>

      <input
        type="password"
        v-model="password"
        placeholder="Nueva contraseña"
      />

      <button @click="updatePassword" :disabled="loading">
        {{ loading ? 'Actualizando...' : 'Guardar contraseña' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f6fb;
}

.card {
  background: white;
  padding: 24px;
  border-radius: 14px;
  width: 320px;
  display: grid;
  gap: 12px;
}

input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #c7d2fe;
}

button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
}
</style>
