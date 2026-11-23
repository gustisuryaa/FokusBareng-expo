# Design FokusBareng

Versi 1.4, 23 November 2026. Menggantikan v1.3.

Sejak v1.4, **sumber tampilan adalah page Figma "Redesign v2"** (file `RQqGaXQwvy338yjrnRGBvd`). Dokumen ini hanya berisi token, aturan, dan pola yang dibutuhkan saat koding. Setiap layar dibaca langsung dari Figma lewat MCP. Nilai di bagian 2 dan 3 diambil dari Variables dan text style Figma pada 23 Nov 2026.

## 1. Arah visual

- Dark minimalis, aksen amber. Satu instrumen utama per layar (timer di Arena, angka hasil di Hasil, gelar di Dasbor).
- Label kecil memakai JetBrains Mono kapital. Semua angka, termasuk timer, memakai **Plus Jakarta Sans** (bukan mono).
- Tombol berbentuk pil.
- Pemisah antarbagian lewat perbedaan warna latar (`bg/base`, `bg/surface`, `bg/elevated`), bukan garis.
- Ring sisa waktu boleh dipakai di Arena.
- `accent/jawara` (biru) **hanya** untuk lencana Jawara.

## 2. Token warna

Nama variabel CSS = nama Figma dengan `/` diganti `-`, diawali `--`. Contoh: `bg/base` menjadi `--bg-base`.

| Token | Nilai | Pemakaian |
|---|---|---|
| `bg/base` | `#0B0B0C` | Latar halaman |
| `bg/surface` | `#161618` | Kartu, panel |
| `bg/elevated` | `#1F1F23` | Sheet, dialog, input |
| `bg/pressed` | `#26262B` | Latar saat ditekan |
| `line/subtle` | `#3A3A40` | Garis halus (jarang dipakai) |
| `line/input` | `#707078` | Garis input |
| `text/primary` | `#F5F5F4` | Teks utama |
| `text/secondary` | `#A1A1A6` | Teks pendukung |
| `text/disabled` | `#5C5C63` | Teks nonaktif |
| `text/on-accent` | `#0B0B0C` | Teks di atas amber |
| `accent/amber` | `#F5B700` | Aksen dan tombol primer |
| `accent/amber-hover` | `#FFC933` | Hover tombol primer |
| `accent/amber-pressed` | `#D9A200` | Tombol primer ditekan |
| `accent/amber-tint` | `#2A2208` | Latar lembut beraksen amber |
| `accent/jawara` | `#6CB6FF` | Lencana Jawara saja |
| `status/success` | `#3DD68C` | Menang, tersambung |
| `status/success-tint` | `#0F2A1E` | Latar lembut sukses |
| `status/danger` | `#FF6369` | Kalah, galat (teks dan ikon) |
| `status/danger-line` | `#E5484D` | Garis input galat |
| `overlay/scrim` | `#000000` 64% | Latar di belakang sheet dan dialog |

## 3. Tipografi

Kelas CSS = nama style dengan `/` dan spasi diganti `-`, huruf kecil. Contoh: `Body/16 SemiBold` menjadi `.body-16-semibold`. Teks minimum 12 px.

| Style | Font | Ukuran | Line height | Letter spacing |
|---|---|---|---|---|
| Angka/Timer L | Plus Jakarta Sans SemiBold | 120 | 100% | -2% |
| Angka/Timer M | Plus Jakarta Sans SemiBold | 72 | 100% | -2% |
| Angka/Hero L | Plus Jakarta Sans Bold | 120 | 100% | -2% |
| Angka/Hero M | Plus Jakarta Sans Bold | 96 | 100% | -2% |
| Angka/Hero S | Plus Jakarta Sans Bold | 64 | 100% | -2% |
| Angka/Stat | Plus Jakarta Sans Bold | 32 | auto | -1% |
| Avatar/S | Plus Jakarta Sans Bold | 14 | auto | 0 |
| Avatar/M | Plus Jakarta Sans Bold | 28 | auto | 0 |
| Avatar/L | Plus Jakarta Sans Bold | 48 | auto | 0 |
| Display/56 | Plus Jakarta Sans Bold | 56 | 110% | -1.5 px |
| Heading/48 | Plus Jakarta Sans Bold | 48 | 115% | -0.8 px |
| Heading/40 | Plus Jakarta Sans Bold | 40 | 120% | -0.6 px |
| Heading/28 | Plus Jakarta Sans Bold | 28 | 125% | -0.4 px |
| Heading/24 | Plus Jakarta Sans Bold | 24 | 125% | 0 |
| Title/20 | Plus Jakarta Sans Bold | 20 | 130% | 0 |
| Body/16 Bold | Plus Jakarta Sans Bold | 16 | auto | 0 |
| Body/16 SemiBold | Plus Jakarta Sans SemiBold | 16 | auto | 0 |
| Body/16 Regular | Plus Jakarta Sans Regular | 16 | auto | 0 |
| Body/14 SemiBold | Plus Jakarta Sans SemiBold | 14 | auto | 0 |
| Body/14 Regular | Plus Jakarta Sans Regular | 14 | auto | 0 |
| Caption/13 SemiBold | Plus Jakarta Sans SemiBold | 13 | auto | 0 |
| Caption/13 Regular | Plus Jakarta Sans Regular | 13 | auto | 0 |
| Caption/12 SemiBold | Plus Jakarta Sans SemiBold | 12 | auto | 0 |
| Caption/12 Regular | Plus Jakarta Sans Regular | 12 | auto | 0 |
| Label/12 | JetBrains Mono Medium | 12 | auto | 1.4 px |
| Label/14 | JetBrains Mono Medium | 14 | auto | 0 |
| Label/14 Regular | JetBrains Mono Regular | 14 | auto | 0 |
| Label/VS S | JetBrains Mono Bold | 14 | auto | 0 |
| Label/VS L | JetBrains Mono Bold | 24 | auto | 0 |

- Angka yang berubah (timer, hitung mundur) memakai `font-variant-numeric: tabular-nums` supaya lebarnya tidak bergoyang.
- Font di-host lokal, bukan dari CDN.
- Line height "auto" di Figma diterjemahkan ke `normal`. Kalau hasilnya berbeda jauh dari Figma, pakai 1.4 untuk Body dan Caption.

## 4. Layout

- Frame acuan: mobile 390x844, desktop 1440x900.
- Breakpoint: `min-width: 640px` dan `min-width: 1024px`.
- Spacing: skala 4 (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
- Tablet memakai tata letak ponsel dengan wadah maksimal 720 px **[TERBUKA]**.
- Arena memenuhi satu layar (`100dvh`) tanpa scroll.
- Tap target minimal 44 px di mobile.

## 5. Komponen dan pola

Komponen dasar ada di section "Komponen v2" di Figma:
- **Button:** Primer dan Sekunder, state Default, Hover, Pressed, Focus, Disabled.
- **Input/Teks** dan **Input/Kata sandi** (tombol tampilkan/sembunyikan), dengan state galat.
- **RadioGroup** untuk Durasi (15/25/45/60) dan Teknik.

Pola lain di layar:
- **Sheet** dari bawah (mobile) dan **Dialog** (desktop), latar `overlay/scrim`.
- **Lencana gelar:** Teralihkan lingkaran putus-putus, Terjaga cincin amber dengan titik, Teguh segi enam, Tajam belah ketupat bergaris dalam, Jawara perisai bertingkat (`accent/jawara`).
- **Tangga gelar:** sheet di mobile (M01g), dibuka dengan mengetuk area gelar di Dasbor.
- **Jejak Check-In:** penanda Check-In yang sudah lewat di Arena. Kartu Arena menampilkan jumlah Check-In, bukan nama gelar.
- **Menu profil:** berisi Keluar (WBS 3.2.3).
- **Banner undangan:** di layar Masuk bila pengguna datang dari tautan room.
- **Status koneksi:** chip dengan ikon dan teks untuk "terputus", "menyambung lagi", dan "tersambung".

## 6. Gerak

- Pindah halaman: dissolve 200 ms ease-out.
- Perubahan state (tab, sheet, menu, Check-In mobile): 200 ms ease-out.
- Dialog desktop: dissolve 120 ms.
- Hormati `prefers-reduced-motion`: transisi menjadi instan.

## 7. Anti vibe-coded

Jangan:
- Gradien ungu-biru, glassmorphism, glow, atau bayangan berlapis.
- Emoji di judul atau tombol.
- Kartu bertumpuk di dalam kartu.
- Ikon dekoratif di setiap judul.
- Garis pemisah di mana-mana. Pakai perbedaan latar.
- Teks pemasaran kosong ("Tingkatkan produktivitasmu!", "Mulai perjalananmu").
- Animasi masuk untuk setiap elemen.
- Status yang hanya ditandai warna.
- Tombol atau tautan yang tidak mengarah ke mana pun.
- Angka contoh palsu. Akun baru: 0 poin, gelar Teralihkan.

Lakukan:
- Satu aksi utama per layar.
- Teks persis seperti di Figma.
- Semua state dibuat: kosong, memuat, galat, sukses.

## 8. Perubahan dari v1.3

- Sumber tampilan pindah ke Figma "Redesign v2". Spesifikasi per layar di v1.3 tidak dipakai lagi.
- Angka memakai Plus Jakarta Sans, bukan JetBrains Mono.
- 53 text style lama diganti 29 style berbasis peran. Teks minimum 12 px.
- Token baru: `bg/pressed`, `line/input`, `accent/amber-tint`, `status/success-tint`, `status/danger-line`, `overlay/scrim` 64%.
- Keluar dari Arena tersedia lewat tombol dan dialog, dan dihitung kalah.
- "Main Lagi" diganti "Buat room baru".
- Nama gelar tidak lagi tampil di kartu Arena.
