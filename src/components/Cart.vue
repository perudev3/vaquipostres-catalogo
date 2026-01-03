<script setup>
defineProps({
  cart: Array,
  total: Number,
});
defineEmits(['remove', 'pay', 'update-quantity']);
</script>

<template>
  <div class="cart">
    <h3>Carrito</h3>
    <div class="cart-items">
      <div v-for="p in cart" :key="p.id" class="item">
        <div class="info">
          <span>{{ p.name }}</span>
          <input
            type="number"
            step="0.1"
            min="0"
            :max="p.stock"
            v-model.number="p.quantity"
            @input="$emit('update-quantity', p.id, p.quantity)"
          />
        </div>
        <span>S/ {{ (p.price * p.quantity).toFixed(2) }}</span>
        <button @click="$emit('remove', p.id)">✖</button>
      </div>
    </div>

    <hr />
    <strong>Total: S/ {{ total.toFixed(2) }}</strong>

    <button class="pay" :disabled="cart.length === 0" @click="$emit('pay')">
      COBRAR
    </button>
  </div>
</template>

<style scoped>
.cart {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
}
.cart-items {
  overflow-y: auto;
  flex-grow: 1;
  margin-bottom: 12px;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 6px;
}
.item .info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.item input {
  width: 60px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}
.pay {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.pay:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
