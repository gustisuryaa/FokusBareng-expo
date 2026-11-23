<script setup>
// Figma: Tautan undangan (M02 96:179 dengan Bagikan + Salin ikon, D02 96:1060 dengan tombol "Salin")
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { showToast } from '@/composables/useToast'

const props = defineProps({
  roomId: { type: String, required: true },
})

const url = computed(() => `${window.location.origin}/room/${props.roomId}`)
const displayUrl = computed(() => `${window.location.host}/room/${props.roomId}`)
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
    showToast('Tautan disalin')
  } catch {
    showToast('Tautan gagal disalin. Salin manual dari kolom tautan.')
  }
}

async function share() {
  try {
    await navigator.share({ title: 'FokusBareng', text: 'Ayo adu fokus di FokusBareng.', url: url.value })
  } catch {
    // Pengguna menutup menu bagikan: tidak perlu pesan
  }
}
</script>

<template>
  <div class="invite-link">
    <span class="label-14-regular invite-link__url">{{ displayUrl }}</span>
    <button v-if="canShare" type="button" class="invite-link__icon only-mobile" aria-label="Bagikan tautan" @click="share">
      <AppIcon name="share" />
    </button>
    <button type="button" class="invite-link__copy" aria-label="Salin tautan" @click="copy">
      <AppIcon name="copy" />
      <span class="body-16-bold only-desktop">Salin</span>
    </button>
  </div>
</template>

<style scoped>
.invite-link {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  min-height: var(--control-md);
  padding: var(--space-8) var(--space-8) var(--space-8) var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
}

.invite-link__url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-link__icon,
.invite-link__copy {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  min-width: var(--tap-min);
  height: var(--tap-min);
  border: 0;
  border-radius: var(--radius-pill);
}

.invite-link__icon {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
}

.invite-link__copy {
  background-color: var(--accent-amber);
  color: var(--text-on-accent);
}

@media (hover: hover) {
  .invite-link__copy:hover {
    background-color: var(--accent-amber-hover);
  }
}

@media (min-width: 1024px) {
  .invite-link {
    padding-left: var(--space-24);
    background-color: var(--bg-elevated);
  }

  .invite-link__copy {
    height: var(--control-sm);
    padding-inline: var(--space-20);
  }
}
</style>
