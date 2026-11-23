<script setup>
// Figma: kartu pemain di Arena, frame "Pemain A" / "Pemain B" (contoh M22t 135:383).
// Isi baris kedua (detail) diisi pemanggil: jumlah Check-In saat tersambung,
// atau "Terputus · 6 dtk" saat terputus. Saat terputus kata "Terputus" wajib ada di detail,
// karena kartu tidak boleh membedakan status hanya lewat warna.
defineProps({
  initial: { type: String, required: true },
  name: { type: String, required: true },
  detail: { type: String, default: '' },
  connection: {
    type: String,
    default: 'connected',
    validator: (value) => ['connected', 'disconnected'].includes(value),
  },
})
</script>

<template>
  <div class="presence-chip" :class="{ 'presence-chip--disconnected': connection === 'disconnected' }">
    <span class="presence-chip__avatar avatar-s" aria-hidden="true">{{ initial }}</span>
    <span class="presence-chip__text">
      <span class="presence-chip__name body-14-semibold">{{ name }}</span>
      <span v-if="detail" class="presence-chip__detail caption-12-regular">{{ detail }}</span>
    </span>
    <span class="presence-chip__dot" aria-hidden="true" />
    <span v-if="connection === 'connected'" class="visually-hidden">tersambung</span>
  </div>
</template>

<style scoped>
.presence-chip {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-8);
  min-width: 0;
  height: var(--control-row);
  padding: 0 var(--space-16) 0 var(--space-8);
  background-color: var(--bg-surface);
  border: var(--line-width-strong) solid transparent;
  border-radius: var(--radius-pill);
  transition: border-color var(--motion-base) var(--ease-out);
}

.presence-chip__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--space-40);
  height: var(--space-40);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.presence-chip__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.presence-chip__name,
.presence-chip__detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presence-chip__name {
  color: var(--text-primary);
}

.presence-chip__detail {
  color: var(--text-secondary);
}

.presence-chip__dot {
  flex-shrink: 0;
  width: var(--space-8);
  height: var(--space-8);
  background-color: var(--status-success);
  border-radius: var(--radius-pill);
}

.presence-chip--disconnected {
  border-color: var(--accent-amber);
}

.presence-chip--disconnected .presence-chip__name,
.presence-chip--disconnected .presence-chip__detail {
  color: var(--accent-amber);
}

.presence-chip--disconnected .presence-chip__dot {
  background-color: var(--accent-amber);
}
</style>
