import { onBeforeUnmount, ref } from 'vue'

// true bila media query cocok, ikut berubah saat jendela diubah ukurannya
export function useMediaQuery(query) {
  const matches = ref(false)
  if (typeof window === 'undefined' || !window.matchMedia) return matches

  const media = window.matchMedia(query)
  matches.value = media.matches
  const update = (event) => (matches.value = event.matches)
  media.addEventListener('change', update)
  onBeforeUnmount(() => media.removeEventListener('change', update))
  return matches
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}
