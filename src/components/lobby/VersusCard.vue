<script setup>
// Figma: Versus di Lobi (M02 96:163, D02 96:1038). Kartu kiri host, kanan tamu.
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  hostName: { type: String, required: true },
  hostOnline: { type: Boolean, default: true },
  // null bila tamu belum masuk
  guestName: { type: String, default: null },
  guestOnline: { type: Boolean, default: true },
})

const initial = (name) => name?.trim().charAt(0).toUpperCase() || '?'
</script>

<template>
  <div class="versus-card">
    <div class="versus-card__player">
      <span class="versus-card__avatar versus-card__avatar--host avatar-m d-avatar-l" aria-hidden="true">{{ initial(hostName) }}</span>
      <span class="body-16-bold d-heading-24">{{ hostName }}</span>
      <span class="label-12 versus-card__status" :class="hostOnline ? 'is-online' : 'is-offline'">
        <span class="versus-card__dot" aria-hidden="true" />
        HOST · {{ hostOnline ? 'ONLINE' : 'TERPUTUS' }}
      </span>
    </div>

    <span class="label-vs-s d-label-vs-l versus-card__vs" aria-hidden="true">VS</span>

    <div class="versus-card__player">
      <template v-if="guestName !== null">
        <span class="versus-card__avatar avatar-m d-avatar-l" aria-hidden="true">{{ initial(guestName) }}</span>
        <span class="body-16-bold d-heading-24">{{ guestName }}</span>
        <span class="label-12 versus-card__status" :class="guestOnline ? 'is-online' : 'is-offline'">
          {{ guestOnline ? 'ONLINE' : 'TERPUTUS' }}
        </span>
      </template>
      <template v-else>
        <span class="versus-card__avatar versus-card__avatar--empty" aria-hidden="true"><AppIcon name="user" /></span>
        <span class="body-16-bold d-heading-24 versus-card__muted">Menunggu</span>
        <span class="label-12 versus-card__muted">BELUM MASUK</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.versus-card {
  display: flex;
  align-items: center;
  width: 100%;
}

.versus-card__player {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  min-width: 0;
  color: var(--text-primary);
  text-align: center;
}

.versus-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--avatar-versus-m);
  height: var(--avatar-versus-m);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-pill);
}

.versus-card__avatar--host {
  border: var(--focus-ring-width) solid var(--accent-amber);
}

.versus-card__avatar--empty {
  background: transparent;
  border: var(--line-width-strong) dashed var(--line-input);
  color: var(--text-secondary);
}

.versus-card__vs,
.versus-card__muted {
  color: var(--text-secondary);
}

.versus-card__vs {
  padding-inline: var(--space-4);
}

.versus-card__status {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.versus-card__status.is-online {
  color: var(--status-success);
}

.versus-card__status.is-offline {
  color: var(--accent-amber);
}

.versus-card__dot {
  width: var(--dot-presence);
  height: var(--dot-presence);
  background-color: currentColor;
  border-radius: var(--radius-pill);
}

@media (min-width: 1024px) {
  .versus-card__player {
    gap: var(--space-12);
  }

  .versus-card__avatar {
    width: var(--avatar-versus-d);
    height: var(--avatar-versus-d);
  }

  .versus-card__avatar--empty :deep(svg) {
    width: var(--space-48);
    height: var(--space-48);
  }
}
</style>
