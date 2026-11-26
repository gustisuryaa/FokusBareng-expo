<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
// Figma: Landing page v2 (section 165:236) > L01 desktop 1440, L02 mobile 390.
// Halaman pertama untuk tamu. Pemain yang sudah masuk langsung diarahkan ke Dasbor oleh router.
// Semua angka aturan dibaca dari gameRules.js supaya halaman ini ikut berubah bila angka [USULAN] diganti.
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import ArenaPreview from '@/components/landing/ArenaPreview.vue'
import TierBadge from '@/components/profile/TierBadge.vue'
import RhythmBar from '@/components/solo/RhythmBar.vue'
import { useIsDesktop } from '@/composables/useMediaQuery'
import { NORMAL_RULES, SOLO_RULES, TIERS } from '@/config/gameRules'
import { vReveal } from '@/directives/reveal'

const rules = NORMAL_RULES
const isDesktop = useIsDesktop()
const responseSec = rules.checkIn.responseWindowMs / 1000
const toleranceSec = rules.disconnectToleranceMs / 1000

const durationText = computed(() => {
  const list = rules.durationsMin
  return `${list.slice(0, -1).join(', ')}, atau ${list.at(-1)} menit`
})

const steps = [
  { title: 'Buat room', body: `Pilih durasi ${durationText.value}, lalu kirim tautan undangan ke satu teman.` },
  { title: 'Tulis Notes', body: `Masing-masing menulis taruhan, maksimal ${rules.notes.maxLength} karakter. Notes terkunci begitu battle mulai.` },
  { title: 'Jaga fokus', body: `Layar harus tetap menyala. Check-In muncul acak dan wajib dijawab dalam ${responseSec} detik.` },
  { title: 'Lihat hasil', body: 'Yang melewatkan Check-In atau keluar dari Arena kalah, lalu membaca Notes pemenang.' },
]

const refereeRules = [
  { text: `Tidak menjawab Check-In dalam ${responseSec} detik`, outcome: 'KALAH' },
  { text: 'Keluar dari Arena sebelum timer habis', outcome: 'KALAH' },
  { text: `Terputus lebih dari ${toleranceSec} detik`, outcome: 'KALAH' },
  { text: 'Dua pemain melewatkan Check-In yang sama', outcome: 'SERI' },
  { text: 'Timer habis dan dua-duanya bertahan', outcome: 'SERI' },
]

const pointsText = `Menang +${rules.points.win} · Seri +${rules.points.draw} · Kalah +${rules.points.lose}`

const MINUTE = 60_000
function rhythmOf(technique) {
  const focusMin = technique.focusMin ?? SOLO_RULES.defaultBlockMin
  const items = []
  for (let round = 0; round < technique.rounds; round += 1) {
    items.push({ kind: 'focus', ms: focusMin * MINUTE })
    if (technique.breakMin > 0) items.push({ kind: 'break', ms: technique.breakMin * MINUTE })
  }
  return items
}

function techniqueCaption(technique) {
  if (technique.breakMin === 0) return 'TANPA JEDA'
  return `${technique.focusMin}/${technique.breakMin} × ${technique.rounds}`
}

const techniques = SOLO_RULES.techniques.map((technique) => ({
  id: technique.id,
  name: technique.name,
  caption: techniqueCaption(technique),
  items: rhythmOf(technique),
}))
</script>

<template>
  <div class="landing">
    <header class="landing__nav">
      <BrandLogo class="title-20 d-heading-24" />
      <nav class="landing__nav-actions" aria-label="Navigasi utama">
        <ul class="landing__links only-desktop">
          <li><a href="#cara-main" class="body-14-semibold">Cara main</a></li>
          <li><a href="#aturan" class="body-14-semibold">Aturan</a></li>
          <li><a href="#gelar" class="body-14-semibold">Gelar</a></li>
        </ul>
        <RouterLink :to="{ name: 'login' }" class="landing__pill landing__pill--secondary body-14-semibold">Masuk</RouterLink>
        <RouterLink :to="{ name: 'register' }" class="landing__pill landing__pill--primary body-14-semibold">Daftar</RouterLink>
      </nav>
    </header>

    <main>
      <section class="landing__hero landing__wrap" aria-labelledby="hero-title">
        <div class="landing__hero-text">
          <h1 id="hero-title" class="heading-40 d-display-56">Fokus bareng teman. Yang lengah duluan, kalah.</h1>
          <p class="body-16-regular landing__muted landing__lead">
            Buat room, kirim tautan, lalu jaga layar tetap menyala sampai timer habis. Check-In muncul acak supaya
            kalian benar-benar belajar. Yang kalah menjalankan Notes pemenang, misalnya traktir es teh di kantin FTI.
          </p>
          <div class="landing__cta">
            <AppButton :to="{ name: 'register' }">Buat room</AppButton>
            <AppButton variant="secondary" :to="{ hash: '#cara-main' }">Lihat cara main</AppButton>
          </div>
          <p class="caption-13-regular landing__muted">
            Untuk mahasiswa Informatika UII. Jalan di peramban ponsel dan laptop, tanpa instal.
          </p>
        </div>
        <ArenaPreview class="landing__visual" />
      </section>

      <section id="cara-main" class="landing__band landing__band--surface" aria-labelledby="steps-title">
        <div v-reveal class="landing__wrap landing__stack">
          <div class="landing__heading reveal-item">
            <p class="label-12 landing__muted">CARA MAIN</p>
            <h2 id="steps-title" class="heading-28 d-heading-40">Empat langkah, satu timer.</h2>
          </div>
          <ol class="landing__steps">
            <li v-for="(step, index) in steps" :key="step.title" class="landing__step" :style="{ '--i': index }">
              <span class="label-12 d-label-vs-l landing__amber">{{ String(index + 1).padStart(2, '0') }}</span>
              <h3 class="title-20">{{ step.title }}</h3>
              <p class="body-14-regular landing__muted">{{ step.body }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="aturan" class="landing__band" aria-labelledby="rules-title">
        <div v-reveal class="landing__wrap landing__split">
          <div class="landing__heading landing__side reveal-item">
            <p class="label-12 landing__muted">ATURAN WASIT</p>
            <h2 id="rules-title" class="heading-28 d-heading-40">Wasitnya otomatis, jadi tidak ada debat.</h2>
            <p class="body-14-regular d-body-16-regular landing__muted">
              Setiap jawaban Check-In dicatat dengan waktu server. Hasil battle ditentukan dari catatan itu, bukan dari
              pengakuan pemain.
            </p>
          </div>
          <ul class="landing__rules">
            <li
              v-for="(rule, index) in refereeRules"
              :key="rule.text"
              class="landing__rule reveal-item"
              :style="{ '--i': index + 1 }"
            >
              <span class="body-16-semibold">{{ rule.text }}</span>
              <span class="label-12" :class="rule.outcome === 'KALAH' ? 'landing__danger' : 'landing__muted'">
                {{ rule.outcome }}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section id="gelar" class="landing__band landing__band--surface" aria-labelledby="tiers-title">
        <div v-reveal class="landing__wrap landing__stack">
          <div class="landing__tiers-head reveal-item">
            <div class="landing__heading">
              <p class="label-12 landing__muted">TANGGA GELAR</p>
              <h2 id="tiers-title" class="heading-28 d-heading-40">
                Poin terkumpul tiap battle. <br class="only-desktop" />Gelar naik sendiri.
              </h2>
            </div>
            <p class="caption-13-regular landing__muted">{{ pointsText }}</p>
          </div>
          <ul class="landing__tiers">
            <li v-for="(tier, index) in TIERS" :key="tier.id" class="landing__tier reveal-item" :style="{ '--i': index + 1 }">
              <TierBadge :tier="tier.id" :size="isDesktop ? 40 : 28" />
              <span class="landing__tier-text">
                <span class="body-16-semibold d-title-20" :class="{ 'landing__jawara': tier.id === 'jawara' }">{{ tier.name }}</span>
                <span class="caption-13-regular landing__muted">{{ tier.minPoints }} poin</span>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section class="landing__band" aria-labelledby="solo-title">
        <div v-reveal class="landing__wrap landing__split landing__split--center">
          <div class="landing__heading landing__side reveal-item">
            <p class="label-12 landing__muted">BELAJAR MANDIRI</p>
            <h2 id="solo-title" class="heading-28 d-heading-40">Belum ada lawan? Fokus sendiri dulu.</h2>
            <p class="body-14-regular d-body-16-regular landing__muted">
              Pilih ritme belajar, nyalakan timer, dan Check-In acak tetap jalan supaya kamu jujur ke diri sendiri.
            </p>
            <div class="landing__solo-cta only-desktop">
              <AppButton variant="secondary" :to="{ name: 'register', query: { redirect: '/mandiri' } }">
                Coba belajar mandiri
              </AppButton>
            </div>
          </div>
          <div class="landing__rhythms">
            <div
              v-for="(technique, index) in techniques"
              :key="technique.id"
              class="landing__rhythm"
              :style="{ '--i': index + 1 }"
            >
              <div class="landing__rhythm-head">
                <span class="body-16-semibold">{{ technique.name }}</span>
                <span class="label-12 landing__muted">{{ technique.caption }}</span>
              </div>
              <div class="landing__rhythm-fill">
                <RhythmBar :items="technique.items" highlight />
              </div>
            </div>
            <div class="landing__legend caption-12-regular landing__muted" aria-hidden="true">
              <span><i class="landing__swatch landing__swatch--focus" />Fokus</span>
              <span><i class="landing__swatch" />Istirahat</span>
            </div>
            <div class="only-mobile">
              <AppButton variant="secondary" block :to="{ name: 'register', query: { redirect: '/mandiri' } }">
                Coba belajar mandiri
              </AppButton>
            </div>
          </div>
        </div>
      </section>

      <section class="landing__band landing__band--surface landing__final" aria-labelledby="final-title">
        <div v-reveal class="landing__wrap landing__final-inner">
          <h2 id="final-title" class="heading-28 d-heading-48 reveal-item">Siapa yang lengah duluan?</h2>
          <p class="body-14-regular d-body-16-regular landing__muted reveal-item" style="--i: 1">
            Buat room sekarang dan kirim tautannya ke teman sekelas.
          </p>
          <div class="landing__final-cta reveal-item" style="--i: 2">
            <AppButton :to="{ name: 'register' }">Buat room</AppButton>
          </div>
        </div>
      </section>
    </main>

    <footer class="landing__footer">
      <div class="landing__footer-left">
        <BrandLogo class="title-20 d-heading-24" />
        <p class="caption-12-regular d-caption-13-regular landing__muted">Proyek MPTI dan PABW · Informatika UII · 2026</p>
      </div>
      <p class="caption-12-regular d-caption-13-regular landing__muted">Kelompok 6 · E-Duel</p>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  --landing-gutter: var(--space-20);
  --landing-band: 72px;
  --landing-content: 1200px;

  min-height: 100dvh;
  background-color: var(--bg-base);
  color: var(--text-primary);
}

.landing__wrap {
  width: 100%;
  max-width: calc(var(--landing-content) + 2 * var(--landing-gutter));
  margin-inline: auto;
  padding-inline: var(--landing-gutter);
}

.landing__muted {
  color: var(--text-secondary);
}

.landing__amber {
  color: var(--accent-amber);
}

.landing__danger {
  color: var(--status-danger);
}

.landing__jawara {
  color: var(--accent-jawara);
}

/* Nav */
.landing__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-16) var(--landing-gutter);
}

.landing__nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.landing__links {
  display: flex;
  gap: var(--space-32);
  margin: 0;
  padding: 0 var(--space-20) 0 0;
  list-style: none;
}

.landing__links a {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--ease-out);
}

.landing__links a:hover {
  color: var(--text-primary);
}

.landing__links a:focus-visible,
.landing__pill:focus-visible {
  outline: var(--focus-ring-width) solid var(--text-primary);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--radius-pill);
}

.landing__pill {
  display: inline-flex;
  align-items: center;
  height: var(--tap-min);
  padding-inline: var(--space-16);
  border: var(--line-width) solid transparent;
  border-radius: var(--radius-pill);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--motion-fast) var(--ease-out);
}

.landing__pill--primary {
  background-color: var(--accent-amber);
  color: var(--text-on-accent);
}

.landing__pill--secondary {
  border-color: var(--line-subtle);
  color: var(--text-primary);
}

@media (hover: hover) {
  .landing__pill--primary:hover {
    background-color: var(--accent-amber-hover);
  }

  .landing__pill--secondary:hover {
    background-color: var(--bg-elevated);
  }
}

/* Hero */
.landing__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
  padding-top: var(--space-32);
  padding-bottom: var(--landing-band);
}

.landing__hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.landing__hero-text h1,
.landing__heading h2,
.landing__step h3 {
  margin: 0;
}

.landing__hero-text p,
.landing__heading p,
.landing__step p,
.landing__final p {
  margin: 0;
}

.landing__cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.landing__visual {
  margin-top: var(--space-16);
}

/* Bagian */
.landing__band {
  padding-block: var(--landing-band);
  scroll-margin-top: var(--space-16);
}

.landing__band--surface {
  background-color: var(--bg-surface);
}

.landing__stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-32);
}

.landing__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.landing__split {
  display: flex;
  flex-direction: column;
  gap: var(--space-32);
}

/* Cara main: rel vertikal di ponsel, garis horizontal di desktop */
.landing__steps {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.landing__step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: 0 0 var(--space-28) var(--space-28);
}

.landing__step::before {
  content: '';
  position: absolute;
  top: var(--space-4);
  left: 0;
  width: var(--space-12);
  height: var(--space-12);
  background-color: var(--accent-amber);
  border-radius: var(--radius-pill);
}

.landing__step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: var(--space-16);
  bottom: 0;
  left: 5px;
  width: 2px;
  background-color: var(--bg-pressed);
}

.landing__step:last-child {
  padding-bottom: 0;
}

/* Aturan */
.landing__rules {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.landing__rule {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-20);
  background-color: var(--bg-surface);
  border-radius: var(--radius-16);
}

/* Gelar */
.landing__tiers-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.landing__tiers {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.landing__tier {
  display: flex;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-16) var(--space-20);
  background-color: var(--bg-elevated);
  border-radius: var(--radius-16);
}

.landing__tier-text {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

/* Belajar mandiri */
.landing__rhythms {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.landing__rhythm {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.landing__rhythm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landing__legend {
  display: flex;
  gap: var(--space-20);
}

.landing__legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
}

.landing__swatch {
  width: var(--space-8);
  height: var(--space-8);
  background-color: var(--bg-pressed);
  border-radius: var(--radius-pill);
}

.landing__swatch--focus {
  background-color: var(--accent-amber);
}

/* Penutup */
.landing__final {
  padding-block: 80px;
}

.landing__final-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.landing__final-inner h2 {
  margin: 0;
}

.landing__final-cta {
  display: flex;
  flex-direction: column;
  padding-top: var(--space-8);
}

.landing__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-32) var(--landing-gutter);
}

.landing__footer p,
.landing__footer-left p {
  margin: 0;
}

.landing__footer-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* Animasi masuk (v-reveal). Kelas .reveal hanya dipasang oleh JS, jadi tanpa JS semuanya tampil. */
.reveal .reveal-item {
  opacity: 0;
  transform: translateY(var(--space-16));
  transition:
    opacity 480ms var(--ease-out),
    transform 480ms var(--ease-out);
  transition-delay: calc(var(--i, 0) * 70ms);
}

.reveal.is-visible .reveal-item {
  opacity: 1;
  transform: none;
}

/* Cara main: titik muncul berurutan, garis menyambung ke langkah berikutnya */
.reveal .landing__step > * {
  opacity: 0;
  transition: opacity 400ms var(--ease-out);
  transition-delay: calc(var(--i) * 220ms + 200ms);
}

.reveal .landing__step::before {
  transform: scale(0);
  transition: transform 260ms var(--ease-out);
  transition-delay: calc(var(--i) * 220ms + 120ms);
}

.reveal .landing__step:not(:last-child)::after {
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 260ms var(--ease-out);
  transition-delay: calc(var(--i) * 220ms + 260ms);
}

.reveal.is-visible .landing__step > * {
  opacity: 1;
}

.reveal.is-visible .landing__step::before {
  transform: none;
}

.reveal.is-visible .landing__step:not(:last-child)::after {
  transform: none;
}

/* Belajar mandiri: bar ritme terisi dari kiri, seperti waktu berjalan */
.reveal .landing__rhythm-fill {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 900ms var(--ease-out);
  transition-delay: calc(var(--i) * 160ms + 150ms);
}

.reveal.is-visible .landing__rhythm-fill {
  clip-path: inset(0 0 0 0);
}

/* Tablet: isi tetap satu kolom, tombol tidak lagi selebar layar */
@media (min-width: 640px) {
  .landing {
    --landing-gutter: var(--space-40);
  }

  .landing__cta,
  .landing__final-cta {
    flex-direction: row;
  }

  .landing__visual {
    max-width: 560px;
  }
}

/* Desktop: L01 */
@media (min-width: 1024px) {
  .landing {
    /* 120 px di 1440 seperti Figma, menyempit di laptop kecil supaya mockup tidak ikut mengecil */
    --landing-gutter: clamp(var(--space-40), 8.3vw, 120px);
    --landing-band: 120px;
  }

  /* 40 px di 1440 seperti L01, lalu ikut menengah di layar lebih lebar supaya sejajar dengan isi */
  .landing__nav,
  .landing__footer {
    padding-inline: max(var(--space-40), calc((100% - 1360px) / 2));
  }

  .landing__nav {
    height: var(--header-height-d);
  }

  /* Rasio kolom 480 : 664 dari L01, dipakai di semua lebar desktop */
  .landing__hero {
    display: grid;
    grid-template-columns: minmax(0, 480fr) minmax(0, 664fr);
    align-items: center;
    gap: var(--space-56);
    padding-top: var(--space-64);
  }

  .landing__hero-text {
    gap: var(--space-20);
  }

  .landing__hero-text h1 {
    font-size: clamp(44px, 3.9vw, 56px);
  }

  .landing__lead {
    max-width: 460px;
  }

  .landing__cta {
    margin-top: var(--space-12);
    margin-bottom: var(--space-12);
  }

  .landing__visual {
    max-width: none;
    margin-top: 0;
  }

  .landing__stack {
    gap: var(--space-56);
  }

  .landing__heading {
    gap: var(--space-16);
  }

  .landing__split {
    flex-direction: row;
    align-items: flex-start;
    gap: 80px;
  }

  .landing__split--center {
    align-items: center;
  }

  .landing__side {
    flex: 0 0 440px;
  }

  .landing__split > :last-child {
    flex: 1;
  }

  .landing__steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-32);
    padding-top: var(--space-48);
  }

  .landing__step {
    gap: var(--space-12);
    padding: 0;
  }

  .landing__step::before {
    top: calc(-1 * var(--space-48));
  }

  .landing__step:not(:last-child)::after {
    transform-origin: left;
    top: calc(-1 * var(--space-48) + 5px);
    right: calc(-1 * var(--space-32));
    bottom: auto;
    left: var(--space-12);
    width: auto;
    height: 2px;
  }

  .reveal .landing__step:not(:last-child)::after {
    transform: scaleX(0);
  }

  .landing__rule {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-20) var(--space-24);
  }

  .landing__tiers-head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .landing__tiers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-16);
  }

  .landing__tier {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-20);
    padding: var(--space-28) var(--space-24);
    border-radius: var(--radius-20);
  }

  .landing__tier-text {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .landing__solo-cta {
    padding-top: var(--space-16);
  }

  .landing__rhythms {
    gap: var(--space-32);
  }

  .landing__final {
    padding-block: 140px;
  }

  .landing__final-inner {
    align-items: center;
    gap: var(--space-20);
    text-align: center;
  }

  .landing__final-cta {
    padding-top: var(--space-12);
  }

  .landing__footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-block: var(--space-32);
  }

  .landing__footer-left {
    flex-direction: row;
    align-items: center;
    gap: var(--space-20);
  }
}
</style>
