// v-reveal: menambah kelas .is-visible sekali, saat elemen pertama kali masuk layar.
// Kelas .reveal (yang menyembunyikan isi) hanya dipasang lewat JS, jadi tanpa JS atau dengan "kurangi gerakan" isi tetap tampil.
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const vReveal = {
  mounted(el) {
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) return

    el.classList.add('reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        el.classList.add('is-visible')
        observer.disconnect()
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    el._revealObserver = observer
  },
  unmounted(el) {
    el._revealObserver?.disconnect()
  },
}
