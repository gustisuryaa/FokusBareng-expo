# Laporan Tahap 5: Cek Front-end Sebelum Integrasi

23 November 2026. Front-end berjalan penuh dengan `VITE_DATA_SOURCE=mock`.

## 1. Hasil pemeriksaan

| Cek | Hasil |
|---|---|
| `npm test` | 41 tes lolos (wasit 27, mock 11, gameRules 3) |
| `npm run build` | Lolos. Kode lawan tiruan dan panel dev tidak ikut ke build produksi |
| Alur lengkap (mock + `?mode=demo`) | Seri timer habis, menang karena lawan melewatkan Check-In, kalah karena kamu melewatkan Check-In, seri karena berdua melewatkan, menang karena lawan terputus > 10 dtk, keluar Arena (kedua sisi). Semua sesuai `keputusan-aturan.md` bagian 4 |
| Lebar 360, 390, 768, 1024, 1440 | Tanpa scroll horizontal. Arena muat satu layar di 360×700. Dua masalah di 1024 (Dasbor, Arena) sudah diperbaiki |
| Keyboard saja (desktop) | Semua kontrol tercapai, fokus selalu terlihat, Esc dan Enter sesuai Figma, fokus kembali ke pemicu |
| Nilai visual langsung | Tidak ada hex, rgb, atau font-size di luar `tokens.css` dan `type.css`. Angka aturan main hanya di `gameRules.js` |

## 2. Berbeda dari Figma (disengaja)

- Kartu lawan mobile saat terputus: angka hitung mundur di dalam avatar, baris status "Terputus". Format "Terputus · 9 dtk" terpotong di 360 dan 390.
- Tombol Teman dan Belajar mandiri tidak dirender (keputusan-aturan.md bagian 7).
- Tinggi tombol desktop 56 px (Figma 60, tidak ada di skala token).
- Penghitung Notes desktop di bawah kolom, bukan sejajar label.
- Nama gelar lawan di kartu Arena desktop belum ditampilkan.
- Dasbor dan Arena di 1024: kolom membagi lebar secara proporsional, nama gelar di tangga bisa turun dua baris.
- Teks usulan Claude (belum ada di Figma): "Sedang mendaftar", "Gelar tertinggi sudah kamu raih", "Room gagal dibuat. Coba lagi.", "Profil gagal dimuat.", "Menunggu lawan siap", "Tulis Notes kamu, lalu mulai saat Notes 2/2.", "Notes tersimpan", "Membuka room…", "Memuat Arena…", "Memuat hasil…", "Mode demo, poin tidak dicatat.".

## 3. Batasan mock

- Putusnya koneksi **diri sendiri** hanya terlihat di tampilan (teks dan hitung mundur). Wasit tidak menghukum karena "database" mock ada di perangkat yang sama. Di Firebase ini ditangani `onDisconnect`.
- Waktu server = jam perangkat (`getServerOffset` selalu 0).
- Mock mengembalikan seluruh isi room termasuk Notes lawan. Tampilan tetap memakai `canReadNotes`, tapi kerahasiaan sesungguhnya hanya dijamin rules.

## 4. Yang perlu disiapkan untuk mengganti mock ke Firebase

**Penting, perlu diputuskan dulu (Naufal):**

1. **Notes tidak bisa dirahasiakan bila berada di bawah `rooms/{id}` yang terbaca utuh.** Di Realtime Database, izin `.read` menurun ke semua anak dan tidak bisa dicabut di level anak. Pilihan:
   - A. Pindahkan Notes ke path terpisah, misalnya `roomNotes/{roomId}/{uid}`, dengan rules baca sendiri. `listenRoom` menggabungkannya.
   - B. Jangan beri `.read` di `rooms/{id}`; beri per anak (`meta`, `guestUid`, `battle`, `responses`, `presence`, `result`, `ready`, `startRequested`), dan `listenRoom` memasang listener per anak.
   Keduanya mengubah `struktur-data.md`. Saran: A, lebih sederhana.
2. **Aturan vonis ditunda** (satu pemain melewatkan Check-In, lawan masih terputus dalam toleransi, hasil bisa seri) ada di `referee.js` tapi sulit ditulis di rules. Rules minimal harus menolak klaim sebelum batas `E(p)` lawan. Perlu dicek bersama saat menulis rules.
3. Mode demo di Firebase masih [TERBUKA] (rules mewajibkan `offsetMs >= 240000`). Saran: izinkan `meta.mode = "demo"` dengan batas terpisah, atau demo expo memakai mock.

**Implementasi `src/services/firebase/index.js`** (20 fungsi, kontrak di `struktur-data.md` bagian 4):

- `onAuthChange` harus mengembalikan `{ uid, name, email }` dan baru memanggil callback setelah status auth pertama diketahui (router menunggu `waitForAuth`).
- `getServerOffset` dari `.info/serverTimeOffset`.
- `startedAt`, `responses`, `presence.lastSeen`, `result.at`, `history.at` memakai `ServerValue.TIMESTAMP`.
- `setPresence` memasang `onDisconnect().set({ online: false, lastSeen: TIMESTAMP })`.
- `claimResult` dan `applyPoints` menangkap galat "sudah ada" sebagai `ERROR_CODES.ALREADY_EXISTS` (front-end bergantung pada kode ini).
- `openRoom` mencatat tamu dengan transaksi atau tulis-sekali supaya dua orang tidak masuk bersamaan.
- `getProfile(uid)` dipakai juga untuk nama lawan, jadi `users/{uid}/profile/name` harus terbaca pengguna lain yang sudah masuk.
- Semua galat Firebase dipetakan ke `ServiceError` dengan kode di `src/services/errors.js`.

**Rules** (`database.rules.json`, di luar repo): 6 perubahan di `struktur-data.md` bagian 6, ditambah rumus `focusMin` v1.2 (dibatasi sampai akhir timer) dan poin 1 di atas.

**Konfigurasi:** `.env.local` berisi `VITE_DATA_SOURCE=firebase` dan `VITE_FIREBASE_*`. Jangan di-commit.

**Uji:** jalankan ulang 16 skenario `keputusan-aturan.md` bagian 6 dengan Emulator, lalu uji dua perangkat (WBS 4.1.2).
