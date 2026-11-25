# Audit Back-End FokusBareng

25 November 2026. Cakupan: `src/services/firebase/`, `database.rules.json`, `src/domain/referee.js`, `src/composables/useServerClock.js` dan `usePresence.js`, alur Lobi, Arena, Hasil, serta tes.

## Ringkasan

Fondasinya sudah kuat: kontrak services lengkap dan sama dengan mock, wasit murni dipakai mock, klien, dan cermin rules, penulisan sekali (`battle`, `result`, `history`, `guestUid`) memakai transaksi, dan angka rules dijaga `rulesConfig.test.js`. Yang kurang bukan "fitur back-end", tapi empat hal yang menentukan apakah demo expo dengan dua perangkat sungguhan bisa jalan dan adil.

Status tes saat audit:

- `npm test`: 65 lolos, 26 dilewati (tes Emulator), 1 todo (skenario 11).
- `npm run test:rules` dan `npm run test:emulator` **belum dijalankan ulang** di audit ini (VM tidak punya Java 21 dan unduhan jar Emulator diblokir). Perlu dijalankan di Mac.

## P0: menghalangi demo expo

| No | Temuan | Dampak | Usulan |
|---|---|---|---|
| 1 | Notes terbaca lawan sejak Lobi. `.read` di `rooms/{id}` berjenjang ke `notes/`. Skenario 11 masih `todo`. | Inti permainan bocor: lawan bisa membuka DevTools dan melihat konsekuensi sebelum battle. | Terapkan usulan v1.3 bagian 1 (`roomNotes/{roomId}/{uid}` + `rooms/{id}/notesSet/{uid}`). Butuh persetujuan Naufal karena mengubah struktur data. |
| 2 | Mode demo ditolak rules (`offsetMs >= 240000`, durasi 15/25/45/60, `meta.mode` ditolak). | Demo dua perangkat di expo butuh minimal 15 menit dan Check-In pertama menit ke-4. | Pilihan A: rules menerima `meta.mode = "demo"` dengan durasi 3 menit, Check-In mulai detik ke-30, dan `history` ditolak untuk room demo. Pilihan B: demo expo memakai mock di satu perangkat. Rekomendasi: A, karena expo justru ingin memamerkan 1v1 real-time. |
| 3 | Belum ada konfigurasi deploy: tidak ada `.firebaserc`, tidak ada `hosting` di `firebase.json`, project Firebase asli belum tercatat. | Ponsel pengunjung tidak punya URL untuk dibuka. | Tambah `hosting` (folder `dist`, rewrite SPA ke `index.html`) dan `.firebaserc`. Butuh project ID dari Naufal, lalu domain hosting dimasukkan ke Authorized domains di Firebase Auth. |
| 4 | Services tidak pernah diuji bersama rules asli. `test:emulator` dan `dev:emulator` memakai `tests/emulator/open.rules.json`. | Kombinasi transaksi, multi-path update, dan `serverTimestamp` bisa ditolak rules di produksi tanpa ketahuan. Contoh yang paling rawan: `startBattle` (transaksi + jadwal Check-In), `cancelStart` (update dua path), `applyPoints` (rumus `focusMin`). | Jalankan `firebase.integration.test.js` dengan `database.rules.json`. Open rules cukup dipertahankan untuk eksperimen lokal. |

## P1: logika dan keamanan

| No | Temuan | Dampak | Usulan |
|---|---|---|---|
| 5 | Rules `battle`, `startRequested: true`, `ready`, dan `notes` tidak memeriksa `meta/expiresAt`. Klien (`getRoomStatus`) menganggap room kedaluwarsa. | Rules dan `referee.js` memutus berbeda, melanggar prinsip bagian 5 `keputusan-aturan.md`. | Tambah `now <= meta/expiresAt` di keempat path itu, plus tes. |
| 6 | `result` tidak membatasi field tambahan. | Data sampah bisa ikut tersimpan di hasil. | Tambah validasi per field dan `$other: false`, seperti node lain. |
| 7 | `useServerClock` membaca selisih jam server sekali saat komponen dipasang. Nilai awal `.info/serverTimeOffset` bisa 0 sebelum koneksi siap. | Timer dan jendela Check-In meleset sebesar selisih jam perangkat. Batas sinkron di aturan hanya 3 detik (aturan keras 5). | Perbarui offset secara berkala (atau dengarkan terus) selama komponen hidup. |
| 8 | `signUp` tidak atomik: akun Auth sudah dibuat sebelum profil tersimpan. | Kalau penulisan profil gagal (sinyal expo jelek), `getProfile` melempar `not-found` dan Dasbor tidak bisa dimuat untuk akun itu selamanya. | Bila profil tidak ada tapi `displayName` ada, tulis ulang profil saat masuk. |
| 9 | Rules tidak bisa mengulang data, jadi klaim `disconnect` atau `timeup` bisa diterima walau pemain sudah melewatkan Check-In lebih awal, asal tidak ada klien online yang mengklaim lebih dulu. | Hanya terjadi bila kedua klien tidak aktif di saat yang tepat. | Terima sebagai batasan MVP (sejalan dengan opsi A Check-In) dan tulis di dokumen. Tidak perlu kode. |

## P2: rapikan

| No | Temuan | Usulan |
|---|---|---|
| 10 | Room tidak pernah dihapus (Spark tanpa Cloud Functions). | Biarkan untuk expo. Catat sebagai batasan. |
| 11 | Layar room penuh (M27) di Firebase: `listenRoom` oleh non-peserta selalu ditolak, jadi nama pemain tidak tampil dan listener sia-sia. | Baca `meta/hostUid`, `guestUid`, lalu nama dari `users/{uid}/profile` (keduanya boleh dibaca). |
| 12 | Poin Belajar Mandiri masih [TERBUKA]. | Tunggu angka kelompok. Rules `solo` sudah siap. |

## Pertentangan dokumen (aturan keras 12)

- `keputusan-aturan.md` bagian 1 dan 7 masih menulis Belajar Mandiri "hanya didesain" dan tombolnya "tidak dirender". CLAUDE.md aturan 11 dan keputusan kelompok 24 Nov menyatakan sudah dikodekan. Dokumen resmi (Catatan Perubahan) belum menyusul.
- `struktur-data.md` bagian 6 menulis rules "masih mengikuti v1". Rules sudah memuat semua butir 1 sampai 6; bagian ini perlu diganti status terbaru.

## Yang sudah dicek dan aman

- Penulisan sekali untuk `guestUid`, `battle`, `result`, `history` memakai transaksi dan dijaga rules.
- Respons Check-In memakai `serverTimestamp` dan rules menolak di luar jendela 20 detik.
- `forfeit` hanya bisa diklaim oleh pemain yang keluar.
- Poin: nilai `delta`, `outcome`, dan `focusMin` diverifikasi rules terhadap `result` dan `battle`.
- Presence: hanya pemilik yang menulis, `onDisconnect` dipasang tiap kali online.
- `users` dan `rooms` tidak bisa didaftar (tidak ada `.read` di akar), jadi room tidak bisa ditemukan tanpa tautan.

## Rencana perbaikan

- **Fase 1 (dikerjakan 25 Nov):** butir 4, 5, 6, 7, 8, 11, ditambah tes rules, tes mock, dan tes integrasi baru, lalu dokumen yang basi diperbarui. `npm test` dan `npm run build` lolos. **`npm run test:rules` dan `npm run test:emulator` belum dijalankan**; jalankan di Mac sebelum commit.
- **Fase 2 (dikerjakan 25 Nov, disetujui Naufal):** butir 1 (Notes rahasia: `roomNotes` + `notesSet`) dan butir 2 (mode demo pilihan A), termasuk mock, `referee.js`, services, tes skenario 11, dan `struktur-data.md` v1.3. `npm test` dan `npm run build` lolos; tes Emulator perlu dijalankan di Mac.
- **Fase 3 (butuh project ID):** butir 3, lalu uji dua perangkat (WBS 4.1.2).
