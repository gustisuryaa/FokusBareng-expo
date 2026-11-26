# Audit Front-End vs Figma, User Flow, WBS & Charter

Tanggal: 23 Nov 2026 · Sumber data: mock (`VITE_DATA_SOURCE=mock`)

## 1. Tampilan vs Figma (Redesign v2)

Metode: 15 keadaan direproduksi di 390×844 dan 1440×900 (Playwright), teks di layar dicocokkan dengan teks 30 frame Figma.

- Teks Figma tercakup: 438/446 setelah salah positif dibuang (nama "Lawan Uji" vs "Pemain B", tes tanpa login di M26/D26, Figma menulis 28/140 untuk kalimat 29 karakter).
- Sengaja tidak dibuat (di luar scope Charter): tombol **Teman** dan **Belajar mandiri** (M01, D01, M01w, D01w).
- Gap nyata:
  - D21: tamu di desktop hanya melihat "25 menit"; Figma menampilkan 4 pilihan durasi dalam keadaan nonaktif.
  - Header mobile dasbor tidak punya chip "0 poin".
  - Lobi tamu desktop tidak menampilkan tier di bawah host; kartu Arena desktop tidak menampilkan nama tier.
  - Penghitung Notes desktop posisinya beda; tinggi tombol 56 vs 60 di Figma.
  - Pill "Terputus" mobile didesain ulang (countdown di dalam avatar) karena teks terpotong di 360/390.
  - Header lobi desktop menampilkan nama, bukan "Info/Profil".

## 2. Flow vs User Flow

Semua transisi kritis jalan: Masuk/Daftar → Dasbor → Buat room → Lobi (host/tamu) → Notes 2/2 → Konfirmasi → Arena → Check-In → Hasil (menang/kalah/seri) → Dasbor; undangan tanpa login → Masuk → langsung lobi; room penuh; tautan tidak berlaku; keluar Arena = kalah; terputus 10 dtk.
Beda yang disengaja: label "8 dtk tanpa jawaban" di User Flow salah, kode memakai 20 dtk sesuai keputusan-aturan.md.

## 3. WBS & Charter

Selesai: 2.2.x/2.3.x desain sudah diimplementasikan; 3.2.1 Dasbor & Lobi, 3.2.2 Arena, 3.2.3 Auth (mock); logika wasit 3.3.x di `domain/referee.js` + 41 unit test.
Belum: 3.1/3.3 backend Firebase (Auth, RTDB, rules), 3.2.4 integrasi FE-BE, 4.1.1/4.1.2 pengujian di Firebase (10 skenario wasit, sinkron timer ≤3 dtk), 4.2 UAT, 5.x deploy domain publik. Survei 1.4/1.6 tidak bisa dicek dari repo.
Konflik dengan Charter:
- Charter menyebut peramban ponsel; versi desktop ditambahkan tanpa Catatan Perubahan.
- Milestone koding inti 20 Nov sudah lewat (hari ini 23 Nov), UAT 2 Des tinggal 9 hari.
- Charter menargetkan 10 skenario wasit, dokumen aturan punya 16; perlu ditetapkan 10 mana yang diuji.
- Notes di `rooms/{id}` bocor karena `.read` RTDB berjenjang; usul pindah ke `roomNotes/{roomId}/{uid}`.
