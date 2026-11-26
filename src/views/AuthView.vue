<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
// Figma: Masuk M05·D04 (state f, l, v, x, j), Daftar M06·D05 (state f, v), Daftar gagal M07,
// Masuk via undangan M08·D16. Satu view untuk Masuk dan Daftar, dipilih lewat prop mode.
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InviteBanner from '@/components/auth/InviteBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import TextField from '@/components/ui/TextField.vue'
import { NORMAL_RULES } from '@/config/gameRules'
import { roomIdFromPath } from '@/lib/roomLabel'
import { NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH, isEmailValid, isNameValid, isPasswordValid } from '@/lib/validation'
import { safeRedirect } from '@/router'
import { ERROR_CODES, signIn, signUp } from '@/services'

const props = defineProps({
  mode: { type: String, required: true, validator: (value) => ['login', 'register'].includes(value) },
})

const route = useRoute()
const router = useRouter()

const isRegister = computed(() => props.mode === 'register')
const inviteRoomId = computed(() => roomIdFromPath(route.query.redirect))
const responseWindowSec = NORMAL_RULES.checkIn.responseWindowMs / 1000

const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })
const formError = ref('')
const submitting = ref(false)

const nameField = ref(null)
const emailField = ref(null)
const passwordField = ref(null)

// Pindah tab Masuk/Daftar membawa query (tujuan undangan) dan membersihkan galat
const tabQuery = computed(() => ({ ...route.query }))
watch(
  () => props.mode,
  () => {
    Object.assign(errors, { name: '', email: '', password: '' })
    formError.value = ''
  },
)

const MESSAGES = {
  nameRequired: 'Nama tampilan wajib diisi.',
  nameTooLong: `Nama tampilan maksimal ${NAME_MAX_LENGTH} karakter.`,
  email: 'Format email belum benar. Contoh: nama@students.uii.ac.id',
  password: `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`,
  wrongCredential: 'Email atau kata sandi salah. Coba lagi.',
  emailTaken: 'Email ini sudah terdaftar. Masuk saja, atau pakai email lain.',
  network: 'Tidak bisa terhubung ke server. Cek koneksi internet, lalu coba lagi.',
}

function validate() {
  errors.name = ''
  if (isRegister.value && !isNameValid(form.name)) {
    errors.name = form.name.trim().length === 0 ? MESSAGES.nameRequired : MESSAGES.nameTooLong
  }
  errors.email = isEmailValid(form.email) ? '' : MESSAGES.email
  errors.password = isPasswordValid(form.password) ? '' : MESSAGES.password

  // Fokus ke field pertama yang salah supaya pengguna keyboard langsung tahu
  const firstInvalid = [
    [errors.name, nameField],
    [errors.email, emailField],
    [errors.password, passwordField],
  ].find(([message]) => message)
  if (firstInvalid) nextTick(() => firstInvalid[1].value?.focus())
  return !firstInvalid
}

async function submit() {
  formError.value = ''
  if (submitting.value || !validate()) return

  submitting.value = true
  try {
    if (isRegister.value) {
      await signUp({ name: form.name.trim(), email: form.email, password: form.password })
    } else {
      await signIn({ email: form.email, password: form.password })
    }
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    if (error.code === ERROR_CODES.EMAIL_TAKEN) {
      errors.email = MESSAGES.emailTaken
      nextTick(() => emailField.value?.focus())
    } else if (error.code === ERROR_CODES.INVALID_CREDENTIAL) {
      formError.value = MESSAGES.wrongCredential
    } else {
      formError.value = MESSAGES.network
    }
  } finally {
    submitting.value = false
  }
}

const submitLabel = computed(() => {
  if (submitting.value) return isRegister.value ? 'Sedang mendaftar' : 'Sedang masuk'
  return isRegister.value ? 'Daftar' : 'Masuk'
})
</script>

<template>
  <div class="auth">
    <!-- Panel identitas, hanya desktop (D04 · D05 · D16) -->
    <aside class="auth__identity only-desktop" aria-hidden="true">
      <BrandLogo class="heading-24" />
      <div class="auth__identity-hero">
        <div class="versus versus--large">
          <span class="versus__self avatar-m">A</span>
          <span class="label-vs-l versus__vs">VS</span>
          <span class="versus__other"><AppIcon name="user" :size="37" /></span>
        </div>
        <p class="display-56">Adu fokus 1 lawan 1.<br />Yang lengah kalah.</p>
      </div>
      <ol class="auth__steps">
        <li><span class="caption-13-semibold">01</span><span class="body-16-regular">Buat room, kirim tautan ke lawan</span></li>
        <li>
          <span class="caption-13-semibold">02</span>
          <span class="body-16-regular">Check-In muncul acak, jawab dalam {{ responseWindowSec }} detik</span>
        </li>
        <li>
          <span class="caption-13-semibold">03</span>
          <span class="body-16-regular">Yang gagal menjawab kalah dan menjalankan Notes lawan</span>
        </li>
      </ol>
    </aside>

    <main class="auth__main">
      <form class="auth__form" novalidate @submit.prevent="submit">
        <BrandLogo class="title-20 only-mobile" />

        <InviteBanner v-if="inviteRoomId" :room-id="inviteRoomId" class="auth__banner" />
        <div v-else class="versus only-mobile" aria-hidden="true">
          <span class="versus__self avatar-s">A</span>
          <span class="label-vs-s versus__vs">VS</span>
          <span class="versus__other"><AppIcon name="user" :size="20" /></span>
        </div>

        <div class="auth__heading">
          <h1 class="heading-28 d-heading-40">{{ isRegister ? 'Buat akun' : 'Masuk dulu' }}</h1>
          <p v-if="isRegister" class="body-16-regular auth__muted">Satu akun untuk menyimpan poin dan gelarmu.</p>
          <template v-else>
            <p class="body-16-regular auth__muted only-mobile">Adu fokus 1 lawan 1. Yang lengah kalah.</p>
            <p class="body-16-regular auth__muted only-desktop">
              {{ inviteRoomId ? 'Setelah masuk, kamu langsung ke lobi room.' : 'Lanjutkan ke dasbor dan room-mu.' }}
            </p>
          </template>
        </div>

        <div class="auth__fields">
          <nav class="auth__tabs" aria-label="Masuk atau Daftar">
            <RouterLink
              :to="{ name: 'login', query: tabQuery }"
              class="auth__tab"
              :class="isRegister ? 'body-16-semibold' : 'body-16-bold'"
              :aria-current="isRegister ? undefined : 'page'"
            >
              Masuk
            </RouterLink>
            <RouterLink
              :to="{ name: 'register', query: tabQuery }"
              class="auth__tab"
              :class="isRegister ? 'body-16-bold' : 'body-16-semibold'"
              :aria-current="isRegister ? 'page' : undefined"
            >
              Daftar
            </RouterLink>
          </nav>

          <TextField
            v-if="isRegister"
            ref="nameField"
            v-model="form.name"
            label="Nama tampilan"
            placeholder="Contoh: Gusti"
            hint="Nama ini yang dilihat lawan di room."
            autocomplete="nickname"
            :maxlength="NAME_MAX_LENGTH"
            :error="errors.name"
            :disabled="submitting"
          />
          <TextField
            ref="emailField"
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="kamu@email.com"
            autocomplete="email"
            inputmode="email"
            :error="errors.email"
            :disabled="submitting"
          />
          <PasswordField
            ref="passwordField"
            v-model="form.password"
            label="Kata sandi"
            placeholder="Kata sandi"
            :hint="isRegister ? `Minimal ${PASSWORD_MIN_LENGTH} karakter.` : ''"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            :error="errors.password"
            :disabled="submitting"
          />

          <p v-if="formError" class="auth__alert caption-13-regular" role="alert">
            <AppIcon name="alert" />
            <span>{{ formError }}</span>
          </p>
        </div>

        <div class="auth__spacer" />

        <AppButton type="submit" block class="auth__submit" :class="{ 'auth__submit--busy': submitting }" :aria-busy="submitting">
          {{ submitLabel }}
        </AppButton>
      </form>
    </main>
  </div>
</template>

<style scoped>
/* Ponsel dan tablet: satu kolom, tombol di bawah */
.auth {
  min-height: 100dvh;
}

.auth__main {
  display: flex;
  justify-content: center;
  min-height: 100dvh;
}

.auth__form {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--container-tablet);
  padding: var(--space-56) var(--space-20) var(--space-28);
}

.auth__banner,
.versus {
  margin-top: var(--space-32);
}

.auth__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-20);
}

.auth__muted {
  color: var(--text-secondary);
}

.auth__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  margin-top: var(--space-24);
}

.auth__spacer {
  flex: 1;
  min-height: var(--space-24);
}

/* Motif versus: kamu (A) melawan lawan yang belum ada */
.versus {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.versus__self,
.versus__other {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-48);
  height: var(--space-48);
  border-radius: var(--radius-pill);
}

.versus__self {
  background-color: var(--bg-elevated);
  border: var(--focus-ring-width) solid var(--accent-amber);
  color: var(--text-primary);
}

.versus__other {
  border: var(--line-width-strong) dashed var(--line-input);
  color: var(--text-secondary);
}

.versus__vs {
  color: var(--text-secondary);
}

/* Tab Masuk/Daftar: tautan antarhalaman berbentuk segmented pil */
.auth__tabs {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-8);
  background-color: var(--bg-surface);
  border-radius: var(--radius-pill);
}

.auth__tab {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: var(--tap-min);
  border: var(--line-width) solid transparent;
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  text-decoration: none;
  transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
}

.auth__tab[aria-current='page'] {
  background-color: var(--bg-elevated);
  border-color: var(--line-input);
  color: var(--text-primary);
}

@media (hover: hover) {
  .auth__tab:not([aria-current='page']):hover {
    color: var(--text-primary);
  }
}

.auth__alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  color: var(--status-danger);
}

/* Memuat: tombol meredup (Figma M05l, opacity 60%) */
.auth__submit--busy {
  opacity: 0.6;
  pointer-events: none;
}

/* Desktop: panel identitas kiri, form di tengah area kanan */
@media (min-width: 1024px) {
  .auth {
    display: grid;
    grid-template-columns: minmax(0, var(--side-panel-width)) minmax(var(--form-width), 1fr);
    gap: var(--space-24);
    height: 100dvh;
    padding: var(--space-24);
  }

  .auth__identity {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 0;
    padding: var(--space-56);
    background-color: var(--bg-surface);
    border-radius: var(--radius-32);
    color: var(--text-primary);
    overflow: hidden;
  }

  .auth__identity-hero {
    display: flex;
    flex-direction: column;
    gap: var(--space-32);
  }

  .versus--large .versus__self,
  .versus--large .versus__other {
    width: var(--avatar-hero);
    height: var(--avatar-hero);
  }

  .auth__steps {
    display: flex;
    flex-direction: column;
    padding: 0;
    list-style: none;
  }

  .auth__steps li {
    display: flex;
    align-items: center;
    gap: var(--space-20);
    padding-block: var(--space-16);
  }

  .auth__steps li + li {
    border-top: var(--line-width) solid var(--bg-pressed);
  }

  .auth__steps .caption-13-semibold {
    color: var(--accent-amber);
  }

  .auth__main {
    align-items: center;
    min-height: 0;
    overflow-y: auto;
  }

  .auth__form {
    max-width: var(--form-width);
    padding: 0;
  }

  .auth__banner {
    margin-top: 0;
    margin-bottom: var(--space-12);
  }

  .auth__heading {
    margin-top: 0;
  }

  .auth__spacer {
    flex: 0;
    min-height: var(--space-24);
  }
}
</style>
