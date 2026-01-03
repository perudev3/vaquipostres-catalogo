<script setup>
defineProps({
  title: String,
  value: String,
});
</script>

<template>
  <div class="stat-card">
    <p class="title">{{ title }}</p>
    <p class="value">{{ value }}</p>
  </div>
</template>
