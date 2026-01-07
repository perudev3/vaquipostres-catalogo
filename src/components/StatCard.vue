<script setup>
defineProps({
  title: String,
  value: [String, Number],
  color: {
    type: String,
    default: 'default'
  }
})
</script>

<template>
  <div class="stat-card">
    <p class="title">{{ title }}</p>
    <p class="value" :class="color">{{ value }}</p>
  </div>
</template>

<style scoped>
.stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
}

.title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

/* VALOR BASE */
.value {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
}

/* COLORES */
.value.success {
  color: #16a34a; /* verde */
}

.value.danger {
  color: #dc2626; /* rojo */
}
</style>
