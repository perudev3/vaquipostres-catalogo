<script setup>
import { ref, onMounted } from 'vue';

const online = ref(navigator.onLine);

onMounted(() => {
  window.addEventListener('online', () => (online.value = true));
  window.addEventListener('offline', () => (online.value = false));
});
</script>

<template>
  <div class="text-sm">
    <span v-if="online" class="text-green-600">🟢 Online</span>
    <span v-else class="text-red-600">🔴 Offline</span>
  </div>
</template>
