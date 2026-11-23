# Keputusan Aturan FokusBareng

Versi 2, 23 November 2026. Menggantikan versi 19 November.

Penanda: **[USULAN]** dipakai sekarang, tapi nilainya hanya disimpan di `src/config/gameRules.js` karena belum masuk Charter/WBS. **[TERBUKA]** belum diputuskan, jangan dikodekan sebagai final.

Bila isi dokumen ini bertentangan dengan Charter, WBS, atau Catatan Perubahan, dokumen resmi yang menang.

## 1. Platform dan lingkup

- Responsif, mobile-first. **Desktop masuk lingkup resmi** (keputusan 23 Nov, dicatat di Catatan Perubahan).
- Tata letak desktop: Dasbor 2 kolom, Lobi dengan Set Timer (WBS 2.3.1) dan Notes (WBS 2.3.2) sebagai **panel di halaman**, bukan popup. Arena memakai layout versus. Hasil 2 kolom.
- Tablet memakai tata letak ponsel dengan wadah maksimal 720 px. **[TERBUKA]** belum dikonfirmasi tim.
- Dikodekan: Auth, Dasbor Profil dan Gelar, Lobi Room via tautan undangan, Arena Timer dengan wasit otomatis, Layar Hasil.
- Hanya didesain: Belajar Mandiri, Pemilihan Teknik Belajar, Pencarian Teman, Add Friend.
- Di luar proyek: aplikasi native, obrolan, pencarian lawan acak, leaderboard.

## 2. Alur satu battle

1. Host membuat room dan memilih durasi 15, 25, 45, atau 60 menit. Room berlaku 30 menit sejak dibuat.
2. Host membagikan tautan `/room/{roomId}`. Tamu membuka tautan. Kalau belum masuk, tamu diarahkan ke Auth dulu, lalu kembali ke room yang sama.
3. Satu room maksimal 2 orang. Orang ketiga melihat layar "room penuh". Tautan kedaluwarsa atau salah menampilkan "tautan tidak berlaku".
4. Kedua pemain mengisi Notes (maksimal 280 karakter, boleh kosong), lalu menekan Siap.
5. Konfirmasi Kefokusan (WBS 2.3.4) muncul sebelum Arena.
6. Setelah keduanya siap, host menulis data battle: waktu mulai dari server dan jadwal Check-In. Sejak itu Notes terkunci.
7. Arena berjalan. Check-In muncul **bersamaan** untuk kedua pemain.
8. Battle berakhir dengan satu hasil: menang/kalah atau seri.
9. Layar Hasil. Yang kalah melihat popup Notes pemenang. Kalau seri, Notes tidak ditampilkan ke siapa pun.
10. Tombol "Buat room baru" kembali ke Dasbor dan membuka pembuatan room dengan durasi sebelumnya sudah terisi.

## 3. Angka aturan main [USULAN]

| Hal | Nilai |
|---|---|
| Durasi | 15, 25, 45, 60 menit |
| Batas respons Check-In | 20 detik |
| Interval Check-In | acak 4 sampai 8 menit |
| Check-In pertama | paling cepat menit ke-4 |
| Tanpa Check-In di | 60 detik terakhir |
| Toleransi putus sinyal atau tab tidak aktif | 10 detik |
| Selisih timer antar perangkat | maksimal 3 detik |
| Poin | menang +30, seri +15, kalah +5 |

## 4. Aturan kalah dan seri

Semua waktu memakai waktu server.

Istilah:
- `T`: waktu Check-In ke-i keluar = `startedAt + offsetMs`.
- `D = T + 20 detik`: batas respons.
- `tol = 10 detik`.
- `lostAt(p)`: waktu terakhir presence pemain p hilang (koneksi putus atau tab tidak aktif). Kosong bila p online.

Pemain p **kalah** bila salah satu terpenuhi:

- **Keluar sengaja** (`reason: forfeit`). p menekan Keluar di Arena dan mengonfirmasi dialognya. Kalah langsung (keputusan 23 Nov).
- **Putus terlalu lama** (`reason: disconnect`). p offline atau meninggalkan tab terus-menerus, dan `now > lostAt(p) + tol`.
- **Check-In terlewat** (`reason: missed_checkin`). p tidak punya respons untuk Check-In ke-i dan `now > E(p)`:
  - `E(p) = D` bila presence p tidak hilang antara `T` dan `D`.
  - `E(p) = max(D, lostAt(p) + tol)` bila presence p hilang dalam rentang itu.

Contoh: Check-In keluar di `T`, sinyal p putus di `T+15`.
- Kembali di `T+22` (offline 7 detik): `E = T+25`, p masih bisa menjawab.
- Kembali di `T+27` (offline 12 detik): aturan putus terlalu lama terpenuhi di `T+25`, p kalah.

**Seri:**
- Timer habis tanpa ada yang kalah (`reason: timeup`).
- Kedua pemain melewatkan Check-In yang sama.
- Kedua pemain sama-sama melewati toleransi putus.

Lain-lain:
- Menutup tab atau menekan back di Arena dihitung putus dan mengikuti toleransi 10 detik. Pasang konfirmasi `beforeunload`.
- Room `berjalan` yang tidak pernah dibuka lagi oleh siapa pun dibiarkan, tanpa poin.

## 5. Wasit tanpa Cloud Functions

Prinsip: **klien mengklaim hasil, rules memeriksa bukti.**

- Jadwal Check-In ditulis **sekali** oleh host saat battle mulai. Waktu mulai memakai `ServerValue.TIMESTAMP`.
- Respons Check-In memakai `ServerValue.TIMESTAMP`. Rules menolak respons di luar jendela.
- Presence memakai `onDisconnect`, Page Visibility API, dan Screen Wake Lock (dengan peringatan bila tidak didukung).
- Klien yang melihat kondisi kalah terpenuhi (biasanya klien lawan) menulis `result`. `result` hanya bisa ditulis sekali. Kalau dua klien menulis bersamaan, yang pertama diterima dan galat yang kedua diabaikan.
- Klien yang memuat room `berjalan` mengevaluasi kondisi saat dimuat dan setiap kali presence atau respons berubah. Ini menutup kasus kedua pemain putus bersamaan.
- Poin: setiap klien menulis `history` miliknya sendiri **setelah** `result` ada, sekali per room. Rules memastikan nilainya cocok dengan hasil.
- Notes lawan hanya terbaca bila `result` menyatakan lawan itu pemenang.
- Logika wasit yang sama ditulis sebagai fungsi murni di `src/domain/referee.js`, dipakai oleh mock dan klien Firebase. Rules dan `referee.js` harus selalu menghasilkan keputusan yang sama.

**Celah yang tidak bisa ditutup rules [TERBUKA]:** jadwal Check-In terbaca klien sejak battle mulai (bisa dilihat lewat DevTools).
- **Opsi A:** terima sebagai batasan MVP. Klaimnya menjadi "mencegah curang kasual". *Rekomendasi untuk expo.*
- **Opsi B:** Check-In dipicu klien lawan secara live. Struktur `battle/checkIns` berubah, perlu Catatan Perubahan.
- **Opsi C:** Cloud Functions. Butuh paket Blaze, di luar anggaran.

Jarak 4 sampai 8 menit antar Check-In juga tidak divalidasi rules, hanya batas minimal menit ke-4.

## 6. Skenario uji wasit

Berlaku untuk `tests/referee.test.js` (fungsi murni) dan `tests/rules.test.js` (Firebase Emulator).

1. Kedua pemain menjawab Check-In, battle berlanjut.
2. Satu pemain tidak menjawab: pemain itu kalah.
3. Kedua pemain tidak menjawab Check-In yang sama: seri.
4. Jawaban di detik ke-19,9 diterima.
5. Jawaban setelah batas ditolak.
6. Putus 8 detik lalu kembali: tidak kalah.
7. Putus 11 detik: kalah.
8. Putus di tengah jendela Check-In, kembali sebelum `E(p)` lalu menjawab: tidak kalah.
9. Vonis kalah yang ditulis sebelum batas waktu ditolak.
10. Dua klien menulis vonis bersamaan: hanya yang pertama tersimpan.
11. Lawan tidak bisa membaca Notes sebelum ada hasil, dan tetap tidak bisa bila hasilnya seri.
12. Keluar sengaja: pemain itu kalah dengan `reason: forfeit`.
13. Poin satu room tidak bisa diklaim dua kali, dan nilainya harus cocok dengan hasil.
14. Orang ketiga tidak bisa masuk room yang sudah berisi 2 orang.

## 7. Alur pendukung

- **Undangan saat belum masuk:** route guard menyimpan tujuan, arahkan ke Auth (dengan banner undangan), setelah masuk kembali ke `/room/:id`.
- **Refresh di Arena:** saat dimuat, ambil data room, hitung sisa waktu dari waktu server, pulihkan state yang sesuai.
- **Keluar akun:** lewat menu profil di Dasbor (WBS 3.2.3). Penting untuk expo supaya pengunjung berikutnya bisa masuk di perangkat yang sama.

## 8. Mode demo expo [USULAN]

Pengunjung expo tidak akan duduk 15 menit.

| Hal | Normal | Demo |
|---|---|---|
| Durasi | 15, 25, 45, 60 menit | 3 menit |
| Check-In pertama | menit ke-4 | detik ke-30 |
| Interval | acak 4 sampai 8 menit | acak 40 sampai 60 detik |
| Tanpa Check-In di | 60 detik terakhir | 30 detik terakhir |
| Batas respons | 20 detik | 20 detik |
| Poin | +30 / +15 / +5 | tidak ada poin |

Dipilih lewat `?mode=demo`. **[TERBUKA]** `database.rules.json` sekarang mewajibkan `offsetMs >= 240000` dan durasi 15/25/45/60, jadi mode demo ditolak rules. Pilihannya: rules mengizinkan `meta.mode = "demo"` dengan batas terpisah, atau mode demo hanya berjalan di mock.

## 9. Poin dan gelar [USULAN]

| Gelar | Ambang poin | Bila hanya menang | Bila hanya seri |
|---|---|---|---|
| Teralihkan | 0 | 0 | 0 |
| Terjaga | 90 | 3 | 6 |
| Teguh | 240 | 8 | 16 |
| Tajam | 480 | 16 | 32 |
| Jawara | 900 | 30 | 60 |

Menang hanya terjadi bila tepat satu pemain gagal, jadi sebagian besar battle kemungkinan berakhir seri. Tinjau ulang setelah uji dua perangkat (WBS 4.1.2).

Akun baru: 0 poin, gelar Teralihkan.

## 10. Dokumen yang perlu disamakan

- [ ] Catatan Perubahan: desktop masuk lingkup. Tempel ke dokumen kelompok, lalu perbarui Charter dan WBS paling lambat 25 Nov.
- [ ] Catatan Perubahan: milestone modul kode inti (20 Nov) dan jalur kritis Back-End sudah lewat.
- [ ] Charter/WBS: masukkan angka di bagian 3 dan 9 setelah tim memutuskan.
- [ ] Putuskan opsi celah Check-In (bagian 5) dan mode demo (bagian 8) sebelum back-end dikunci.
- [ ] Belajar Mandiri tercatat sebagai usulan desain (perlu Catatan Perubahan bila dipertahankan).
