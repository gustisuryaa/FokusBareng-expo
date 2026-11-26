<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

// Sheet bawah di ponsel (Figma 133:284, 135:436), dialog tengah di desktop (95:468).
// Bentuknya diatur lewat CSS di breakpoint 1024 px.
const props = defineProps({
  open: { type: Boolean, default: false },
  // id elemen judul di dalam slot, wajib supaya pembaca layar tahu nama dialognya
  labelledby: { type: String, required: true },
  describedby: { type: String, default: undefined },
  // 'alertdialog' untuk konfirmasi penting (keluar Arena, Check-In)
  role: {
    type: String,
    default: 'dialog',
    validator: (value) => ['dialog', 'alertdialog'].includes(value),
  },
  // false: Esc dan klik latar tidak menutup (dipakai untuk Check-In)
  dismissible: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const panel = ref(null)
let returnFocusTo = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Elemen bertabindex -1 (misalnya opsi radio yang tidak terpilih) bukan bagian urutan Tab
function getFocusable() {
  if (!panel.value) return []
  return [...panel.value.querySelectorAll(FOCUSABLE)].filter((el) => el.tabIndex >= 0)
}

function requestClose() {
  if (props.dismissible) emit('close')
}

// Fokus terkunci di dalam panel selama terbuka
function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    requestClose()
    return
  }
  if (event.key !== 'Tab') return

  const items = getFocusable()
  if (items.length === 0) {
    event.preventDefault()
    panel.value?.focus()
    return
  }

  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function restoreFocus() {
  document.body.style.overflow = ''
  if (returnFocusTo && typeof returnFocusTo.focus === 'function') returnFocusTo.focus()
  returnFocusTo = null
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      returnFocusTo = document.activeElement
      document.body.style.overflow = 'hidden'
      await nextTick()
      // Elemen bertanda data-autofocus didahulukan, misalnya tombol "Tetap fokus"
      const marked = panel.value?.querySelector('[data-autofocus]')
      const markedTarget = marked?.matches(FOCUSABLE) ? marked : marked?.querySelector(FOCUSABLE)
      const target = markedTarget ?? getFocusable()[0] ?? panel.value
      target?.focus()
    } else {
      restoreFocus()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.open) restoreFocus()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-dialog">
      <div v-if="open" class="sheet-dialog" @keydown="onKeydown">
        <div class="sheet-dialog__scrim" aria-hidden="true" @click="requestClose" />
        <div
          ref="panel"
          class="sheet-dialog__panel"
          :role="role"
          aria-modal="true"
          :aria-labelledby="labelledby"
          :aria-describedby="describedby"
          tabindex="-1"
        >
          <div class="sheet-dialog__handle" aria-hidden="true" />
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-dialog {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-dialog__scrim {
  position: absolute;
  inset: 0;
  background-color: var(--overlay-scrim);
}

/* Ponsel dan tablet: sheet dari bawah, lebar maksimal wadah tablet */
.sheet-dialog__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  max-height: 90dvh;
  overflow-y: auto;
  padding: var(--space-12) var(--space-24) calc(var(--space-32) + env(safe-area-inset-bottom));
  background-color: var(--bg-surface);
  border-radius: var(--radius-28) var(--radius-28) 0 0;
  outline: none;
}

.sheet-dialog__handle {
  flex-shrink: 0;
  align-self: center;
  width: var(--space-40);
  height: var(--space-4);
  margin-bottom: var(--space-20);
  background-color: var(--line-subtle);
  border-radius: var(--radius-pill);
}

.sheet-dialog-enter-active,
.sheet-dialog-leave-active {
  transition: opacity var(--motion-base) var(--ease-out);
}

.sheet-dialog-enter-active .sheet-dialog__panel,
.sheet-dialog-leave-active .sheet-dialog__panel {
  transition: transform var(--motion-base) var(--ease-out);
}

.sheet-dialog-enter-from,
.sheet-dialog-leave-to {
  opacity: 0;
}

.sheet-dialog-enter-from .sheet-dialog__panel,
.sheet-dialog-leave-to .sheet-dialog__panel {
  transform: translateY(100%);
}

/* Desktop: dialog di tengah, dissolve 120 ms tanpa geser */
@media (min-width: 1024px) {
  .sheet-dialog {
    align-items: center;
    padding: var(--space-24);
  }

  .sheet-dialog__panel {
    max-width: var(--dialog-width);
    padding: var(--space-40);
    border-radius: var(--radius-28);
  }

  .sheet-dialog__handle {
    display: none;
  }

  .sheet-dialog-enter-active,
  .sheet-dialog-leave-active,
  .sheet-dialog-enter-active .sheet-dialog__panel,
  .sheet-dialog-leave-active .sheet-dialog__panel {
    transition-duration: var(--motion-fast);
  }

  .sheet-dialog-enter-from .sheet-dialog__panel,
  .sheet-dialog-leave-to .sheet-dialog__panel {
    transform: none;
  }
}
</style>
