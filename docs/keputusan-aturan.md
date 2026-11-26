# Keputusan Aturan FokusBareng

Versi 2.2, 23 November 2026. Menjawab pertanyaan hasil Tahap 0 pengembangan (lihat bagian 11).

Penanda: **[USULAN]** dipakai sekarang, tapi nilainya hanya disimpan di `src/config/gameRules.js` karena belum masuk Charter/WBS. **[TERBUKA]** belum diputuskan, jangan dikodekan sebagai final.

Bila isi dokumen ini bertentangan dengan Charter, WBS, atau Catatan Perubahan, dokumen resmi yang menang.

## 1. Platform dan lingkup

- Responsif, mobile-first. **Desktop masuk lingkup resmi** (keputusan 23 Nov, dicatat di Catatan Perubahan).
- Tata letak desktop: Dasbor 2 kolom, Lobi dengan Set Timer (WBS 2.3.1) dan Notes (WBS 2.3.2) sebagai **panel di halaman**, bukan popup. Arena memakai layout versus. Hasil 2 kolom.
- Tablet memakai tata letak ponsel dengan wadah maksimal 720 px. Dipakai sekarang. Nilainya satu variabel CSS, jadi mudah diubah kalau tim memutuskan lain.
- Dikodekan: Auth, Dasbor Profil dan Gelar, Lobi Room via tautan undangan, Arena Timer dengan wasit otomatis, Layar Hasil.
- Hanya didesain: Belajar Mandiri, Pemilihan Teknik Belajar, Pencarian Teman, Add Friend.
- Di luar proyek: aplikasi native, obrolan, pencarian lawan acak, leaderboard.

## 2. Alur satu battle

Mengikuti Figma (page User Flow).

1. Host menekan Buat Room di Dasbor. Room langsung dibuat dengan durasi bawaan 25 menit dan host masuk ke Lobi (M02 · D02). Room berlaku 30 menit sejak dibuat.
2. **Durasi dipilih di Lobi** (sheet M02d di mobile, panel di desktop). Host boleh mengubahnya selama battle belum mulai.
3. Host membagikan tautan `/room/{roomId}`. Tamu membuka tautan. Kalau belum masuk, tamu diarahkan ke Masuk atau Daftar (keduanya dengan banner undangan), lalu kembali ke room yang sama.
4. Satu room maksimal 2 orang. Orang ketiga melihat "room penuh" (M27). Tautan kedaluwarsa atau salah: "tautan tidak berlaku" (M26).
5. **Notes wajib diisi kedua pemain**, 1 sampai 140 karakter (mengikuti Figma). Notes adalah konsekuensi yang ditanggung yang kalah, jadi battle tanpa Notes kehilangan intinya. Lobi menampilkan "Notes 1/2" atau "2/2".
6. Setelah tamu ada dan Notes 2/2, host menekan **"Mulai Adu Fokus"**. Ini menulis `startRequested = true`.
7. Kedua pemain melihat **Konfirmasi Kefokusan** (WBS 2.3.4; M20 host, M20g tamu). Masing-masing menekan **"Aku siap"**, yang menulis `ready/{uid} = true`.
8. **Batal** di Konfirmasi oleh siapa pun: `startRequested = false` dan kedua `ready` dihapus. Keduanya kembali ke Lobi.
9. Setelah kedua `ready` bernilai true, host menulis data battle: waktu mulai dari server dan jadwal Check-In. Sejak itu durasi dan Notes terkunci.
10. Arena berjalan. Check-In muncul **bersamaan** untuk kedua pemain.
11. Battle berakhir dengan satu hasil: menang/kalah atau seri.
12. Layar Hasil. Yang kalah melihat popup Notes pemenang. Kalau seri, Notes tidak ditampilkan ke siapa pun.
13. **"Buat room baru"** langsung membuat room baru dengan durasi yang sama seperti room sebelumnya, lalu membuka Lobi host. Tautan baru harus dibagikan lagi.

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
| Ambang "Menjelang akhir" (M03b) | 60 detik terakhir (demo: 30 detik) |
| Panjang Notes | 1 sampai 140 karakter, wajib |
| Durasi bawaan saat room dibuat | 25 menit |
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
- Kembali di `T+18` lalu menjawab di `T+19`: jawaban sah, p tidak kalah.
- Masih terputus di `T+20`: vonis ditunda sampai `E = T+25`. Bila sampai saat itu p belum kembali, p kalah dengan `reason: disconnect`.
- Kembali di `T+22`: jawaban **tidak bisa** diterima lagi, karena rules menolak respons di luar jendela 20 detik dan rules tidak bisa melihat riwayat presence. p kalah karena Check-In terlewat.

(v2.2: contoh lama menyebut p masih bisa menjawab di `T+22`. Itu bertentangan dengan rules di bagian 5, jadi diganti. `E(p)` hanya menunda vonis dan menentukan alasannya, tidak memperpanjang jendela jawaban.)

Bila satu pemain sudah melewatkan Check-In ke-i dan lawannya belum menjawab Check-In yang sama tapi masih dalam toleransi putus, vonis ditunda sampai toleransi lawan habis, karena hasilnya bisa seri.

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
- Notes lawan hanya terbaca bila `result` menyatakan lawan itu pemenang. Isinya disimpan di `roomNotes/{roomId}/{uid}`, terpisah dari room (struktur-data v1.3).
- Logika wasit yang sama ditulis sebagai fungsi murni di `src/domain/referee.js`, dipakai oleh mock dan klien Firebase. Rules dan `referee.js` harus selalu menghasilkan keputusan yang sama.

**Celah yang tidak bisa ditutup rules (diputuskan: opsi A, Gusti 23 Nov; kabarkan ke Naufal):** jadwal Check-In terbaca klien sejak battle mulai (bisa dilihat lewat DevTools). `referee.js` membaca jadwal hanya lewat `getCheckInWindows()`, jadi pindah ke opsi B cukup mengganti fungsi itu.
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
15. Battle tidak bisa dimulai kalau Notes belum 2/2 atau salah satu `ready` belum true.
16. Durasi dan Notes tidak bisa diubah setelah battle dimulai. Notes kosong atau lebih dari 140 karakter ditolak.

## 7. Alur pendukung

- **Undangan saat belum masuk:** route guard menyimpan tujuan, arahkan ke Auth (dengan banner undangan), setelah masuk kembali ke `/room/:id`.
- **Refresh di Arena:** saat dimuat, ambil data room, hitung sisa waktu dari waktu server, pulihkan state yang sesuai.
- **Keluar akun:** lewat menu profil di Dasbor (WBS 3.2.3). Penting untuk expo supaya pengunjung berikutnya bisa masuk di perangkat yang sama.
- **Membuka tautan room**, ditentukan dari siapa yang membuka dan status room:

| Yang membuka | Status room | Diarahkan ke |
|---|---|---|
| Host | menunggu / siap | Lobi host |
| Tamu yang sudah tercatat | menunggu / siap | Lobi tamu |
| Host atau tamu | berjalan | Arena (dipulihkan dari waktu server) |
| Host atau tamu | selesai | Hasil |
| Orang lain | sudah ada tamu | M27 room penuh |
| Siapa pun | kedaluwarsa, tidak ada, atau salah | M26 tautan tidak berlaku |

- **Room kedaluwarsa saat host menunggu:** Lobi host berganti ke M26, dengan tombol "Buat room baru".
- **Lawan meninggalkan Lobi sebelum mulai:** `guestUid` tidak bisa dihapus. Lobi menampilkan chip presence lawan "Terputus". Host bisa menunggu atau membuat room baru. Tidak ada fitur mengeluarkan tamu.
- **Wake Lock tidak didukung:** tampilkan Toast sekali di awal Arena, lalu battle tetap jalan. Teksnya di bagian 10.
- **Tombol "Teman" dan "Belajar mandiri" di Dasbor tidak dirender di kode.** Kedua fitur itu hanya didesain (bagian 1), dan tombol yang tidak mengarah ke mana pun dilarang. Saat expo, keduanya ditunjukkan lewat prototype Figma.

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

Dipilih lewat `?mode=demo`. Berlaku di mock dan Firebase (diputuskan 25 Nov, disetujui Naufal): room demo menyimpan `meta.mode = "demo"`, dan rules memakai batas terpisah (durasi 3 menit, Check-In pertama paling cepat detik ke-30) serta menolak `history` untuk room demo, jadi tidak ada poin. Jarak 40 sampai 60 detik antar Check-In, seperti di mode normal, tidak divalidasi rules.

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

**Poin Belajar Mandiri [TERBUKA].** Kelompok memutuskan (24 Nov 2026) Belajar Mandiri **memberi poin**, tapi besarnya belum diputuskan (usulan Naufal: 1 jam = 1 poin, duel dua kali lipat). Jangan dikodekan sampai angkanya ada. Figma M10/D07 masih menulis "Tidak ada poin dan gelar" dan perlu diubah.

## 10. Teks yang belum ada di Figma [USULAN]

Draf usulan. Gusti boleh mengganti kalimatnya, tapi strukturnya dipertahankan: judul hasil tetap memakai pola layar yang sudah ada (M16 · D11 untuk seri, M09 · D06 untuk menang), hanya baris penjelasnya yang berbeda.

| Kasus | Layar dasar | Baris penjelas |
|---|---|---|
| Seri, timer habis | M16 · D11 | (teks Figma yang sudah ada) |
| Seri, keduanya melewatkan Check-In | M16 · D11 | Kalian berdua melewatkan Check-In ke-{n}. |
| Seri, keduanya terputus | M16 · D11 | Kalian berdua terputus lebih dari 10 detik. |
| Menang, lawan keluar | M09 · D06 | {Lawan} keluar dari Arena. |
| Wake Lock tidak didukung (Toast) | Arena | Layar bisa mati sendiri di perangkat ini. Matikan kunci layar otomatis selama battle. |

Istilah koneksi diseragamkan menjadi **"Terputus"** (bukan "Putus") di semua layar.

## 11. Jawaban atas pertanyaan Tahap 0

| No | Pertanyaan | Jawaban |
|---|---|---|
| 1 | Dokumen resmi | Gusti menaruh Charter, WBS v4, dan Catatan Perubahan di `docs/resmi/`. Sampai saat itu, lingkup mengikuti bagian 1 dokumen ini. |
| 2 | Notes | 140 karakter, wajib (bagian 2 langkah 5). |
| 3 | Durasi dan "Buat room baru" | Durasi dipilih di Lobi. "Buat room baru" memakai durasi room sebelumnya (bagian 2). |
| 4 | Siap, Mulai, Batal | `startRequested` = host menekan Mulai. `ready/{uid}` = "Aku siap" di Konfirmasi. Batal mengosongkan keduanya (bagian 2 langkah 6 sampai 8). |
| 5 | `#XXXX` | 4 karakter terakhir `roomId` dalam huruf kapital, hanya sebagai penanda visual supaya kedua pemain yakin berada di room yang sama. Tidak bisa dipakai untuk bergabung. |
| 6 | Statistik Dasbor | Dipertahankan. `history` ditambah `outcome`, `focusMin`, `opponentName`, `at` (lihat `struktur-data.md`). |
| 7 | Teks hasil yang belum ada | Bagian 10. |
| 8 | Tombol Teman dan Belajar mandiri | Tidak dirender di kode (bagian 7). |
| 9 | Kasus tautan room | Tabel di bagian 7. |
| 10 | Ambang Menjelang akhir | 60 detik, demo 30 detik (bagian 3). |
| 11 | Mock dengan mode demo | Boleh (bagian 8). |
| 12 | Wadah tablet | 720 px, dipakai sekarang (bagian 1). |

Kesalahan kecil di Figma (header M01w "0 poin", "Putus" di M22, label prototype "8 dtk") **tidak menghalangi koding**. Kode mengikuti dokumen ini. Figma dirapikan terpisah.

## 12. Dokumen yang perlu disamakan

- [ ] Catatan Perubahan: desktop masuk lingkup. Tempel ke dokumen kelompok, lalu perbarui Charter dan WBS paling lambat 25 Nov.
- [ ] Catatan Perubahan: milestone modul kode inti (20 Nov) dan jalur kritis Back-End sudah lewat.
- [ ] Charter/WBS: masukkan angka di bagian 3 dan 9 setelah tim memutuskan.
- [x] Opsi celah Check-In: A (bagian 5).
- [x] Mode demo di Firebase: rules mengizinkan `meta.mode = "demo"` (bagian 8).
- [ ] Catatan Perubahan: Belajar Mandiri dan Pemilihan Teknik dikodekan (keputusan 24 Nov), tambah item WBS 3.2.5, ubah Charter ("hanya didesain" jadi dikodekan).
- [ ] Tentukan besar poin Belajar Mandiri (bagian 9, [TERBUKA]), lalu ubah Figma M10/D07 dan kode.
- [ ] Catatan Perubahan: leaderboard di luar lingkup (belum tertulis di Charter).
