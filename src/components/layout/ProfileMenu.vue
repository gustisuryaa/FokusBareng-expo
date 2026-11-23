<script setup>
// Figma: Button/Profil + Menu/Profil (M01b 38:341, D01b 38:465). Isinya Keluar (WBS 3.2.3).
import { nextTick, onBeforeUnmount, ref, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  name: { type: String, required: true },
  email: { type: String, default: '' },
})
const emit = defineEmits(['sign-out'])

const open = ref(false)
const root = ref(null)
const trigger = ref(null)
const firstItem = ref(null)
const menuId = useId()

const initial = () => props.name.trim().charAt(0).toUpperCase() || '?'

function onDocumentPointer(event) {
  if (!root.value?.contains(event.target)) close(false)
}

async function openMenu() {
  open.value = true
  document.addEventListener('pointerdown', onDocumentPointer)
  await nextTick()
  firstItem.value?.focus()
}

function close(returnFocus = true) {
  open.value = false
  document.removeEventListener('pointerdown', onDocumentPointer)
  if (returnFocus) trigger.value?.focus()
}

function toggle() {
  if (open.value) close()
  else openMenu()
}

function onKeydown(event) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    close()
  }
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer))
</script>

<template>
  <div ref="root" class="profile-menu" @keydown="onKeydown">
    <button
      ref="trigger"
      type="button"
      class="profile-menu__trigger"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="menuId"
      @click="toggle"
    >
      <span class="profile-menu__avatar avatar-s" aria-hidden="true">{{ initial() }}</span>
      <span class="body-16-semibold profile-menu__name">{{ name }}</span>
      <AppIcon name="chevd" class="profile-menu__chev" />
    </button>

    <div v-if="open" :id="menuId" class="profile-menu__panel" role="menu" :aria-label="`Menu ${name}`">
      <div class="profile-menu__identity">
        <span class="profile-menu__avatar profile-menu__avatar--large avatar-s" aria-hidden="true">{{ initial() }}</span>
        <span class="profile-menu__identity-text">
          <span class="body-16-bold">{{ name }}</span>
          <span v-if="email" class="caption-12-regular profile-menu__email">{{ email }}</span>
        </span>
      </div>
      <button ref="firstItem" type="button" role="menuitem" class="profile-menu__item body-16-semibold" @click="emit('sign-out')">
        <AppIcon name="out" />
        Keluar
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-menu {
  position: relative;
}

.profile-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  min-height: var(--tap-min);
  max-width: 100%;
  padding: 0 var(--space-16) 0 var(--space-8);
  background-color: var(--bg-surface);
  border: 0;
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

@media (hover: hover) {
  .profile-menu__trigger:hover {
    background-color: var(--bg-elevated);
  }
}

.profile-menu__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu__chev {
  color: var(--text-secondary);
}

.profile-menu__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--space-32);
  height: var(--space-32);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-pill);
}

.profile-menu__avatar--large {
  width: var(--space-40);
  height: var(--space-40);
}

.profile-menu__panel {
  position: absolute;
  top: calc(100% + var(--space-8));
  left: 0;
  z-index: var(--z-menu);
  display: flex;
  flex-direction: column;
  width: var(--menu-width);
  padding: var(--space-8);
  background-color: var(--bg-elevated);
  border: var(--line-width) solid var(--line-subtle);
  border-radius: var(--radius-20);
  box-shadow: var(--shadow-menu);
}

.profile-menu__identity {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12);
  border-bottom: var(--line-width) solid var(--line-subtle);
  color: var(--text-primary);
}

.profile-menu__identity-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.profile-menu__email {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-secondary);
}

.profile-menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  min-height: var(--control-sm);
  padding: 0 var(--space-12);
  background: transparent;
  border: 0;
  border-radius: var(--radius-12);
  color: var(--text-primary);
  text-align: left;
}

@media (hover: hover) {
  .profile-menu__item:hover {
    background-color: var(--bg-pressed);
  }
}

/* Desktop: menu rata kanan di header */
@media (min-width: 1024px) {
  .profile-menu__panel {
    right: 0;
    left: auto;
  }
}
</style>
