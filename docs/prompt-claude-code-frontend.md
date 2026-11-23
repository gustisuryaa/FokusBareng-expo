# Prompt Claude Code: Front-end FokusBareng

Versi 2, 23 November 2026. Menyesuaikan `struktur-data.md`, `keputusan-aturan.md` v2, dan `design_terbaru.md` v1.4.

Cara pakai:
- Jalankan di VS Code (extension Claude Code), di folder `fokusbareng-web`.
- Satu tahap = satu sesi baru. Commit git setiap tahap yang sudah dicek di browser.
- Tahap 1 dan 3 dimulai dengan `/plan`.

---

## Tahap 0 · Orientasi (tanpa menulis kode)

```
/plan Baca saja, jangan menulis atau mengubah file apa pun.

1. Baca CLAUDE.md, lalu docs/keputusan-aturan.md, docs/struktur-data.md, dan docs/design_terbaru.md.
2. Lihat dokumen resmi di docs/resmi/ hanya untuk memastikan lingkup lima fitur wajib.
3. Lewat Figma MCP, buka page "User Flow" di file RQqGaXQwvy338yjrnRGBvd dan susun daftar kode frame
   (mobile dan desktop) untuk alur: Masuk/Daftar, Dasbor, Lobi host dan tamu, Konfirmasi Kefokusan,
   Arena + Check-In, putus sinyal, Hasil menang/kalah/seri, lobi gagal.

Hasilkan: daftar layar beserta kode framenya, pertentangan antardokumen yang kamu temukan,
dan pertanyaan yang harus dijawab sebelum koding.
```

---

## Tahap 1 · Fondasi

```
/plan Siapkan fondasi front-end sesuai stack dan struktur berkas di CLAUDE.md.

1. Scaffold Vite + Vue 3 + Vue Router di folder ini tanpa menimpa file di docs/, database.rules.json,
   firebase.json, dan tests/.
2. src/styles/tokens.css dari docs/design_terbaru.md bagian 2. Cocokkan nilainya dengan koleksi Variables
   "FokusBareng" di Figma lewat MCP. Kalau ada yang beda, Figma yang benar.
3. src/styles/type.css: satu kelas per text style di bagian 3.
4. src/styles/base.css: reset, font lokal (Plus Jakarta Sans, JetBrains Mono), fokus keyboard,
   prefers-reduced-motion.
5. src/config/gameRules.js: angka dari docs/keputusan-aturan.md bagian 3, 8, dan 9, dengan profil
   normal dan demo.
6. Router dengan rute /masuk, /daftar, /, /room/:id, /room/:id/arena, /room/:id/hasil dan guard:
   belum masuk diarahkan ke /masuk dengan tujuan disimpan.
7. Halaman /dev/gaya (hanya mode dev) yang memajang semua token dan text style.

Selesai bila: npm run dev jalan, /dev/gaya bisa aku bandingkan dengan Figma, console bersih.
```

---

## Tahap 2 · Komponen dasar

```
Buat komponen dari section "Komponen v2" di page Redesign v2 (lewat Figma MCP) dan pola di
docs/design_terbaru.md bagian 5:
AppButton, TextField, PasswordField, RadioGroup, SheetDialog (sheet di mobile, dialog di desktop),
TierBadge (lima bentuk lencana), PresenceChip, Toast.

- Semua state dari Figma (Default, Hover, Pressed, Focus, Disabled, galat).
- RadioGroup memakai role="radiogroup" dan bisa dipindah dengan tombol panah.
- SheetDialog: fokus terkunci di dalam, Esc menutup, fokus kembali ke pemicu.
- Hanya memakai variabel dari tokens.css dan kelas dari type.css.

Tambahkan halaman /dev/komponen yang memajang semua varian.
```

---

## Tahap 3 · Wasit murni dan data tiruan

```
/plan Back-end Firebase dikerjakan Naufal secara paralel. Front-end harus jalan penuh tanpa Firebase.

1. src/domain/referee.js: fungsi murni yang menerima isi room + waktu server dan mengembalikan
   status battle (berjalan, atau hasil dengan outcome dan reason). Aturannya dari
   docs/keputusan-aturan.md bagian 4. Angka dari gameRules.js.
2. tests/referee.test.js: 14 skenario di keputusan-aturan.md bagian 6 yang bisa diuji tanpa
   Firebase. Tulis tesnya dulu, tunjukkan gagal, baru isi referee.js sampai lulus.
3. src/services/: kontrak persis seperti docs/struktur-data.md bagian 4.
   - services/mock/: data di memori + localStorage, bentuk data sama persis dengan bagian 1.
   - services/firebase/: file dengan fungsi yang sama, isinya melempar "belum diimplementasikan".
   - services/index.js memilih lewat VITE_DATA_SOURCE.
4. Panel dev untuk mensimulasikan lawan: bergabung, siap, terputus, kembali, melewatkan Check-In, keluar.
5. Mode demo lewat ?mode=demo sesuai keputusan-aturan.md bagian 8, supaya Arena bisa dites dalam 3 menit.
```

---

## Tahap 4 · Layar alur kritis

Ulangi untuk setiap layar. Ganti `[KODE]` dengan kode frame dari Tahap 0.

```
Implementasikan layar [KODE] (mobile) dan pasangan desktopnya dari page Redesign v2 lewat Figma MCP.

- Pakai komponen dan kelas tipografi yang sudah ada. Jangan membuat style baru bila sudah ada yang cocok.
- Teks persis seperti di Figma.
- Buat semua state layar ini yang ada di Figma (memuat, galat, kosong, versi tamu berakhiran t).
- Sambungkan ke services (mock), store, dan router sesuai page User Flow.
- Setelah selesai, bandingkan dengan screenshot Figma di lebar 390 dan 1440, lalu sebutkan
  perbedaan yang tersisa.
```

Urutan:
1. Masuk dan Daftar (dengan validasi, galat, banner undangan)
2. Dasbor, menu profil (Keluar), sheet Tangga gelar
3. Lobi host (Notes, Durasi, siap mulai) dan lobi tamu
4. Konfirmasi Kefokusan
5. Arena, Check-In, menjelang akhir, dialog keluar Arena
6. Putus sinyal: kamu atau lawan terputus, tersambung lagi, lewat 10 detik
7. Hasil menang, kalah + popup Notes pemenang, seri
8. Lobi gagal: tautan tidak berlaku, room penuh

Belajar Mandiri, Pemilihan Teknik, Pencarian Teman, dan Add Friend tidak dikodekan.

---

## Tahap 5 · Cek sebelum integrasi

```
Periksa seluruh front-end tanpa menambah fitur:
1. Jalankan alur lengkap di mode mock + ?mode=demo: daftar, buat room, tamu gabung, Notes, siap,
   Arena, Check-In, lalu setiap hasil (menang, kalah, seri, keluar, putus sinyal).
2. Cek lebar 360, 390, 768, 1024, 1440: tidak ada teks terpotong atau scroll horizontal.
3. Navigasi dengan keyboard saja di desktop: semua kontrol bisa dicapai dan fokusnya terlihat.
4. Cari warna atau ukuran font yang ditulis langsung di luar tokens.css dan type.css.
5. npm run build dan npm test lolos.
Laporkan: yang sudah sesuai Figma, yang berbeda, dan yang perlu disiapkan untuk mengganti mock
ke Firebase.
```
