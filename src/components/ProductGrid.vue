<script setup>
defineProps({ products: Array });
defineEmits(['add']);
</script>

<template>
  <div class="grid">
    <div
      v-for="p in products"
      :key="p.id"
      class="product"
      @click="$emit('add', p)"
    >
      <img v-if="p.image_url" :src="p.image_url" />
      <strong>{{ p.name }}</strong>
      <span>S/ {{ p.price }}</span>
      <small>Stock: {{ p.stock }}</small>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.product {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  cursor: pointer;
}
.product img {
  width: 100%;
  height: 90px;
  object-fit: cover;
}
</style>
