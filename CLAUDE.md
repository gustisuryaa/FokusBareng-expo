# FokusBareng

Web app Adu Fokus 1v1 real-time untuk mahasiswa Informatika UII. Proyek kelompok E-Duel (PABW SIF302) dan proyek expo MPTI. Target: MVP yang bisa didemokan di expo, jalan di ponsel dan desktop.

## Acuan

Baca sesuai kebutuhan tugas, jangan seluruh folder sekaligus.

| Dokumen | Isi | Dipakai untuk |
|---|---|---|
| `docs/resmi/` (Charter, WBS, Catatan Perubahan) | Dokumen resmi kelompok | Lingkup: fitur mana yang dikodekan |
| `docs/keputusan-aturan.md` | Aturan main, rumus kalah, wasit, skenario uji | Logika permainan |
| `docs/struktur-data.md` | Bentuk data Realtime Database, kontrak dengan back-end | Services, store, rules |
| `docs/design_terbaru.md` | Token, tipografi, aturan visual | Gaya |
| Figma `RQqGaXQwvy338yjrnRGBvd` | Desain akhir | Tampilan setiap layar |

Urutan bila bertentangan:
1. Soal **lingkup**: dokumen resmi menang atas semua file lain.
2. Soal **tampilan**: page Figma "Redesign v2" menang atas `design_terbaru.md`.
3. Soal **data**: `struktur-data.md` menang atas tebakan. Kalau ada yang belum diatur, tanyakan.

Figma (dibaca lewat Figma MCP):
- "Redesign v2": desain utama. Kode frame `M..` mobile 390x844, `D..` desktop 1440x900, akhiran `t` untuk sisi tamu.
- "User Flow": urutan layar dan kode frame yang bisa diklik.
- "Desin Awal": desain lama, **jangan dipakai**.

Penanda status di dokumen: **[USULAN]** boleh dipakai tapi nilainya disimpan di config, **[TERBUKA]** jangan dikodekan sebagai final.

## Stack (tetap)

- Vue 3 + Vite, JavaScript ES Modules, tanpa TypeScript.
- Vue Router. Store berbasis `reactive()`, tanpa Pinia atau Vuex.
- CSS biasa dengan custom properties. Tanpa Tailwind, tanpa UI library.
- Firebase Authentication (email dan kata sandi) dan Realtime Database, paket Spark. Tanpa Cloud Functions.
- Sumber data dipilih lewat `VITE_DATA_SOURCE=mock|firebase`. Selama back-end belum siap, front-end memakai `mock`.
- Dependensi baru harus disetujui dulu. Dev-only yang diizinkan: `vitest`, `firebase-tools`, `@firebase/rules-unit-testing`.
- Config Firebase dibaca dari `import.meta.env.VITE_*`. Jangan menyentuh atau meng-commit `.env`.

## Aturan keras

1. Nilai visual hanya dari `src/styles/tokens.css` dan `src/styles/type.css`. Tidak ada hex, rgb, atau ukuran font yang ditulis langsung di komponen. Spacing mengikuti skala 4.
2. Angka aturan main (batas Check-In, interval, toleransi, poin, ambang tier, durasi) hanya ada di `src/config/gameRules.js`. Tidak ada angka aturan di komponen.
3. Mobile-first: gaya dasar untuk ponsel, lalu `@media (min-width: 640px)` dan `(min-width: 1024px)`. Pakai `100dvh`. Arena tidak boleh butuh scroll.
4. Satu komponen untuk semua ukuran layar. Perbedaan mobile dan desktop diatur lewat CSS, bukan komponen terpisah. Pengecualian: Sheet (mobile) dan Dialog (desktop) boleh berbagi satu komponen pembungkus.
5. Logika waktu memakai waktu server Firebase (offset server), bukan `Date.now()` mentah.
6. Bentuk data mengikuti `docs/struktur-data.md` persis, termasuk di implementasi mock.
7. Setiap status (menang, kalah, seri, koneksi) memakai ikon dan teks, tidak hanya warna.
8. Teks UI diambil persis dari Figma. Bahasa Indonesia, menyapa "kamu", tanpa emoji di judul, tanpa em dash.
9. Identifier kode berbahasa Inggris. Komentar singkat berbahasa Indonesia, hanya untuk bagian yang tidak jelas dengan sendirinya.
10. Ikuti daftar anti vibe-coded di `docs/design_terbaru.md` bagian 7.
11. Lingkup kode hanya lima fitur wajib: Auth, Dasbor Profil dan Gelar, Lobi Room via tautan undangan, Arena Timer dengan wasit otomatis, Layar Hasil. Belajar Mandiri, Pemilihan Teknik, Pencarian Teman, dan Add Friend **hanya didesain, tidak dikodekan**. Tidak ada aplikasi native, obrolan, leaderboard, atau pencarian lawan acak. Jangan menambah fitur.
12. Kalau sebuah file `docs/` bertentangan dengan dokumen resmi, ikuti dokumen resmi dan laporkan pertentangannya.
13. Aksesibilitas: tap target minimal 44 px di mobile, fokus keyboard selalu terlihat, kontras minimal WCAG AA, teks minimal 12 px.

## Cara kerja

- Tugas besar: mulai di plan mode, tunggu persetujuan sebelum menulis kode.
- Satu layar atau satu modul per sesi. Commit kecil dengan pesan jelas.
- Sebelum menyatakan selesai: `npm run build` lolos, tes lolos, tampilan dicek di lebar 390 dan 1440 dan dibandingkan dengan screenshot Figma.
- Setiap tugas selesai, beri ringkasan 3 sampai 5 kalimat dalam Bahasa Indonesia: file apa yang berubah dan kenapa. Anggota kelompok harus bisa menjelaskan kode ini saat expo.
- Tulis kode sederhana mengikuti pola materi PABW (`ref`, `reactive`, props, emits, composable sederhana). Hindari abstraksi berlebihan.
- Hal yang belum diputuskan: tanyakan. Jangan menebak aturan main.

## Struktur berkas

```
src/
  components/ui/       AppButton, TextField, PasswordField, RadioGroup, SheetDialog, Toast
  components/arena/    TimerDisplay, PresenceChip, CheckInPrompt, CheckInTrail
  components/profile/  TierBadge, StatCard, TierLadder
  components/layout/   AppHeader, ProfileMenu, PageContainer
  views/               AuthView, DashboardView, LobbyView, ArenaView, ResultView
  router/index.js
  stores/              authStore.js, roomStore.js, battleStore.js
  services/            index.js (memilih mock/firebase), errors.js, mock/ (store, ops, dev = lawan tiruan), firebase/, timerSync.js
  domain/              referee.js (logika wasit murni, dipakai mock dan klien), profile.js (statistik turunan)
  composables/         useToast.js
  components/dev/      DevOpponentPanel (hanya npm run dev + mock)
  config/gameRules.js
  styles/              tokens.css, type.css, base.css
database.rules.json
firebase.json
tests/                 referee.test.js, rules.test.js
docs/
```

## Selesai berarti

Sesuai acuan, tidak melanggar aturan keras, build dan tes lolos, semua state yang ada di Figma untuk layar itu bisa dilihat, dan ringkasan perubahan sudah diberikan.
