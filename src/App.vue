<script setup>
import { defineAsyncComponent } from 'vue'
import AppToast from '@/components/ui/AppToast.vue'
import { DATA_SOURCE } from '@/services'

// Panel lawan tiruan hanya ada di `npm run dev` dengan data mock, tidak ikut ke build produksi
const showDevPanel = import.meta.env.DEV && DATA_SOURCE === 'mock'
const DevOpponentPanel = showDevPanel
  ? defineAsyncComponent(() => import('@/components/dev/DevOpponentPanel.vue'))
  : null
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <AppToast />
  <DevOpponentPanel v-if="showDevPanel" />
</template>
