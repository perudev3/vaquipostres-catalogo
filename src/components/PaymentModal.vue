<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  total: Number,
  loading: Boolean,
  method: String,
});
const emit = defineEmits(['update:method', 'confirm', 'close']);

// Ref local para poder usar v-model
const localMethod = ref(props.method);

// Sincronizar si la prop cambia desde afuera
watch(
  () => props.method,
  (val) => {
    localMethod.value = val;
  }
);
</script>

<template>
  <div class="backdrop">
    <div class="modal">
      <h3 style="color: black;">Total a pagar</h3>
      <h2>S/ {{ total.toFixed(2) }}</h2>

      <select
        v-model="localMethod"
        @change="emit('update:method', localMethod)"
      >
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="yape">Yape</option>
        <option value="plin">Plin</option>
      </select>

      <div class="buttons">
        <button :disabled="loading" class="confirm" @click="emit('confirm')">
          Confirmar
        </button>
        <button class="cancel" @click="emit('close')">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  padding: 20px;
  width: 320px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal h2 {
  font-size: 24px;
  color: #111827;
}
select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  width: 100%;
}
.buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
button.confirm {
  flex: 1;
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
}
button.confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
button.cancel {
  flex: 1;
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
