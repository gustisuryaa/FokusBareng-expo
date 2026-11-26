# FokusBareng

Web app untuk **belajar bersama** dengan konsep **Adu Fokus 1v1 real-time**, dibuat untuk mahasiswa Informatika UII. Dua orang masuk ke satu room dan belajar dengan timer fokus yang sama. Selama sesi, Check-In acak memastikan keduanya tetap fokus di depan layar. Yang gagal menjawab, terputus terlalu lama, atau keluar duluan dinyatakan kalah dan menanggung tantangan yang ditulis pemenang di Notes.

Proyek kelompok **E-Duel** untuk mata kuliah Pengembangan Aplikasi Berbasis Web (SIF302) dan expo Manajemen Pengembangan Teknologi Informasi (MPTI), Informatika FTI UII, semester gasal 2026/2027.

> Masih dalam pengembangan.

## Permasalahan

- Mahasiswa sering menunda belajar karena mudah terdistraksi ponsel.
- Aplikasi pengingat waktu biasa kurang efektif, karena alarmnya bisa dimatikan kapan saja tanpa konsekuensi.
- Belajar sendirian membuat tidak ada yang mengawasi atau ikut menjaga komitmen.

## Solusi

FokusBareng memakai **tekanan sosial yang positif**. Belajar dijadikan tantangan 1v1: dua orang saling menjaga fokus, Check-In acak mencegah kecurangan, dan yang kalah menanggung konsekuensi kecil di dunia nyata. Untuk yang ingin belajar sendiri, tersedia mode Belajar Mandiri dengan teknik belajar pilihan.

## Fitur

- Daftar dan masuk dengan email
- Dasbor profil, poin, dan gelar
- Room 1v1 lewat tautan undangan, lengkap dengan Notes untuk yang kalah
- Arena dengan timer tersinkron dan Check-In acak
- Layar hasil: menang, kalah, atau seri
- Belajar Mandiri dengan teknik Pomodoro, Fokus panjang, atau Satu blok

## Stack

Vue 3, Vite, Vue Router, CSS biasa, Firebase Authentication, dan Realtime Database.

## Menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
git clone https://github.com/gustisuryaa/FokusBareng-expo.git
cd FokusBareng-expo
npm install
cp .env.example .env
npm run dev
```

Secara bawaan `.env` memakai `VITE_DATA_SOURCE=mock`, jadi aplikasi bisa dicoba tanpa akun Firebase.

```bash
npm run build   # build produksi
npm test        # tes
```

## Tim E-Duel

| Nama | Peran |
|---|---|
| Gusti Surya Aditama | Manajer Proyek, UI/UX, Front-End |
| Naufal Allaam Najib | Back-End |
| Dzaikra Naqa | Front-End, QA |
| Dimas Rangga Diza | Anggota |

Informatika, Fakultas Teknologi Industri, Universitas Islam Indonesia.
