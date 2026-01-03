<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({ sale: Object })
const emit = defineEmits(['close'])

const items = ref([])

/* =========================
   CARGAR ITEMS
========================= */
onMounted(async () => {
  const { data } = await supabase
    .from('sale_items')
    .select(`
      quantity,
      price,
      subtotal,
      products ( name )
    `)
    .eq('sale_id', props.sale.id)

  items.value = data || []
})
</script>

<template>
  <div class="backdrop">
    <div class="modal">
      <h3>Detalle de venta</h3>

      <p><strong>Fecha:</strong> {{ new Date(sale.created_at).toLocaleString() }}</p>
      <p><strong>Método:</strong> {{ sale.payment_method }}</p>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Sub</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in items" :key="i.product_id">
            <td>{{ i.products.name }}</td>
            <td>{{ i.quantity }}</td>
            <td>S/ {{ i.price }}</td>
            <td>S/ {{ i.subtotal }}</td>
          </tr>
        </tbody>
      </table>

      <h4>Total: S/ {{ sale.total }}</h4>

      <button @click="emit('close')">Cerrar</button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: white;
  padding: 16px;
  width: 90%;
  max-width: 400px;
  border-radius: 10px;
}
table {
  width: 100%;
  margin-top: 10px;
}
td, th {
  padding: 6px;
}
</style>
