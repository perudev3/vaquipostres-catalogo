<template>
  <div class="supplies-admin">
    <h1>Gestión de insumos</h1>

    <!-- BOTÓN AGREGAR -->
    <button class="btn-add" @click="showModal = true">
      ➕ Agregar insumo
    </button>

    <!-- TABLA -->
    <div class="table-wrapper">
        <table>
        <thead>
            <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Acción</th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="s in supplies" :key="s.id">
            <td>{{ s.name }}</td>
            <td>{{ s.type }}</td>
            <td>
                <span :class="s.active ? 'on' : 'off'">
                {{ s.active ? 'Disponible' : 'No disponible' }}
                </span>
            </td>
            <td>
                <button
                @click="toggleSupply(s)"
                :class="s.active ? 'btn-off' : 'btn-on'"
                >
                {{ s.active ? 'Desactivar' : 'Activar' }}
                </button>
            </td>
            </tr>
        </tbody>
        </table>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h2>Nuevo insumo</h2>

        <input
          v-model="form.name"
          placeholder="Nombre del insumo"
        />

        <select v-model="form.type">
          <option disabled value="">Selecciona tipo</option>
          <option value="jarabe">Jarabe</option>
          <option value="fruta">Fruta</option>
          <option value="topping">Topping</option>
        </select>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">
            Cancelar
          </button>
          <button class="btn-save" @click="saveSupply">
            Guardar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'

const supplies = ref([])
const showModal = ref(false)

const form = ref({
  name: '',
  type: ''
})

const loadSupplies = async () => {
  const { data } = await supabase
    .from('supplies')
    .select('*')
    .order('name')

  supplies.value = data || []
}

const toggleSupply = async (s) => {
  await supabase
    .from('supplies')
    .update({ active: !s.active })
    .eq('id', s.id)

  s.active = !s.active
}

const saveSupply = async () => {
  if (!form.value.name || !form.value.type) return

  const { data } = await supabase
    .from('supplies')
    .insert({
      name: form.value.name,
      type: form.value.type,
      active: true
    })
    .select()
    .single()

  supplies.value.push(data)
  closeModal()
}

const closeModal = () => {
  showModal.value = false
  form.value = { name: '', type: '' }
}

onMounted(loadSupplies)
</script>

<style scoped>
.supplies-admin {
  padding: 2rem;
  font-family: Poppins, sans-serif;
  color: #1f3f7b;
}

/* BOTÓN AGREGAR */
.btn-add {
  margin-bottom: 1rem;
  padding: 0.6rem 1.2rem;
  background: #25d366;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

/* TABLA */
table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th, td {
  padding: 0.8rem;
  border-bottom: 1px solid #ddd;
}

th {
  background: #9adbe8;
}

.on {
  color: green;
  font-weight: bold;
}

.off {
  color: red;
  font-weight: bold;
}

/* BOTONES */
button {
  cursor: pointer;
}

.btn-off {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
}

.btn-on {
  background: #25d366;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.modal h2 {
  margin-bottom: 1rem;
}

.modal input,
.modal select {
  width: 100%;
  padding: 0.6rem;
  margin-bottom: 0.8rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn-cancel {
  background: #ccc;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.btn-save {
  background: #1f3f7b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

/* TABLA RESPONSIVA */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 10px;
}

table {
  min-width: 600px; /* evita que se aplaste */
}

@media (max-width: 768px) {
  table {
    min-width: 100%;
  }
}

</style>
