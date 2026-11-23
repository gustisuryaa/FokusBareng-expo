<script setup>
import { onMounted, ref } from 'vue'

// Nama token Figma. Nilainya dibaca dari tokens.css, bukan ditulis ulang di sini.
const colorTokens = [
  'bg/base', 'bg/surface', 'bg/elevated', 'bg/pressed',
  'line/subtle', 'line/input',
  'text/primary', 'text/secondary', 'text/disabled', 'text/on-accent',
  'accent/amber', 'accent/amber-hover', 'accent/amber-pressed', 'accent/amber-tint', 'accent/jawara',
  'status/success', 'status/success-tint', 'status/danger', 'status/danger-line',
  'overlay/scrim',
]

const spaceTokens = [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64]
const radiusTokens = ['16', '20', '24', '28', '32', 'pill']

const textStyles = [
  'Angka/Timer L', 'Angka/Timer M', 'Angka/Hero L', 'Angka/Hero M', 'Angka/Hero S', 'Angka/Stat',
  'Avatar/S', 'Avatar/M', 'Avatar/L',
  'Display/56', 'Heading/48', 'Heading/40', 'Heading/28', 'Heading/24', 'Title/20',
  'Body/16 Bold', 'Body/16 SemiBold', 'Body/16 Regular', 'Body/14 SemiBold', 'Body/14 Regular',
  'Caption/13 SemiBold', 'Caption/13 Regular', 'Caption/12 SemiBold', 'Caption/12 Regular',
  'Label/12', 'Label/14', 'Label/14 Regular', 'Label/VS S', 'Label/VS L',
]

function cssVar(figmaName) {
  return '--' + figmaName.replace('/', '-')
}

function className(styleName) {
  return styleName.toLowerCase().replace(/[/ ]/g, '-')
}

function sampleText(styleName) {
  if (styleName.startsWith('Angka/Timer')) return '24:59'
  if (styleName.startsWith('Angka')) return '+30'
  if (styleName.startsWith('Avatar')) return 'GS'
  if (styleName.startsWith('Label/VS')) return 'VS'
  if (styleName.startsWith('Label')) return 'CHECK-IN KE-2'
  return 'Adu Fokus 1v1 0123456789'
}

const colorValues = ref({})
const styleMeta = ref({})
const sampleRefs = {}

function setSampleRef(name, el) {
  if (el) sampleRefs[name] = el
}

onMounted(() => {
  const root = getComputedStyle(document.documentElement)
  const values = {}
  for (const token of colorTokens) {
    values[token] = root.getPropertyValue(cssVar(token)).trim().toUpperCase()
  }
  colorValues.value = values

  // Nilai hasil render, untuk dibandingkan dengan panel Typography di Figma
  const meta = {}
  for (const name of textStyles) {
    const el = sampleRefs[name]
    if (!el) continue
    const s = getComputedStyle(el)
    meta[name] = `${s.fontFamily.split(',')[0].replace(/['"]/g, '')} ${s.fontWeight} · ${s.fontSize} · lh ${s.lineHeight} · ls ${s.letterSpacing}`
  }
  styleMeta.value = meta
})
</script>

<template>
  <main class="guide">
    <header class="guide-header">
      <p class="label-12">DEV</p>
      <h1 class="heading-28">Token dan text style</h1>
      <p class="body-14-regular muted">
        Pembanding untuk koleksi Variables "FokusBareng" dan text style di Figma Redesign v2.
      </p>
    </header>

    <section class="block" aria-labelledby="colors-title">
      <h2 id="colors-title" class="title-20">Warna</h2>
      <ul class="grid">
        <li v-for="token in colorTokens" :key="token" class="item">
          <span class="swatch" :style="{ background: `var(${cssVar(token)})` }" aria-hidden="true" />
          <span class="body-14-semibold">{{ token }}</span>
          <code class="label-14-regular muted">{{ cssVar(token) }}</code>
          <code class="label-14-regular muted">{{ colorValues[token] }}</code>
        </li>
      </ul>
    </section>

    <section class="block" aria-labelledby="space-title">
      <h2 id="space-title" class="title-20">Spacing</h2>
      <ul class="stack">
        <li v-for="size in spaceTokens" :key="size" class="space-row">
          <code class="label-14-regular muted space-name">--space-{{ size }}</code>
          <span class="space-bar" :style="{ width: `var(--space-${size})` }" aria-hidden="true" />
        </li>
      </ul>
    </section>

    <section class="block" aria-labelledby="radius-title">
      <h2 id="radius-title" class="title-20">Radius</h2>
      <ul class="grid">
        <li v-for="r in radiusTokens" :key="r" class="item">
          <span class="radius-box" :style="{ borderRadius: `var(--radius-${r})` }" aria-hidden="true" />
          <code class="label-14-regular muted">--radius-{{ r }}</code>
        </li>
      </ul>
    </section>

    <section class="block" aria-labelledby="type-title">
      <h2 id="type-title" class="title-20">Text style</h2>
      <ul class="stack">
        <li v-for="name in textStyles" :key="name" class="type-row">
          <div class="type-info">
            <span class="body-14-semibold">{{ name }}</span>
            <code class="label-14-regular muted">.{{ className(name) }}</code>
            <span class="caption-12-regular muted">{{ styleMeta[name] }}</span>
          </div>
          <p :ref="(el) => setSampleRef(name, el)" :class="className(name)" class="type-sample">
            {{ sampleText(name) }}
          </p>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.guide {
  display: grid;
  gap: var(--space-40);
  padding: var(--space-24) var(--space-16) var(--space-64);
  max-width: var(--container-tablet);
  margin-inline: auto;
}

.guide-header {
  display: grid;
  gap: var(--space-8);
}

.muted {
  color: var(--text-secondary);
}

.block {
  display: grid;
  gap: var(--space-16);
}

.grid,
.stack {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--space-12);
}

.grid {
  grid-template-columns: 1fr;
}

.item {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-16);
  background: var(--bg-surface);
  border-radius: var(--radius-16);
}

.swatch {
  height: var(--space-64);
  border-radius: var(--radius-16);
  outline: var(--line-width) solid var(--line-subtle);
  margin-bottom: var(--space-8);
}

.space-row {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

.space-name {
  min-width: calc(var(--space-64) + var(--space-48));
}

.space-bar {
  height: var(--space-16);
  background: var(--accent-amber);
  border-radius: var(--space-4);
}

.radius-box {
  height: var(--space-64);
  background: var(--bg-elevated);
  outline: var(--line-width) solid var(--line-input);
  margin-bottom: var(--space-8);
}

.type-row {
  display: grid;
  gap: var(--space-12);
  padding: var(--space-16);
  background: var(--bg-surface);
  border-radius: var(--radius-16);
  overflow: hidden;
}

.type-info {
  display: grid;
  gap: var(--space-4);
}

.type-sample {
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .guide {
    max-width: none;
    padding: var(--space-48) var(--space-64) var(--space-64);
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .type-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: center;
  }
}
</style>
