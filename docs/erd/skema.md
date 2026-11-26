# Skema Relasional FokusBareng (Kelompok E-Duel)

Model relasional MySQL 8 untuk PABW P19 sampai P22. Aplikasinya sendiri memakai Firebase Realtime Database (sesuai Project Charter). Skema ini menggambarkan data yang sama dalam bentuk tabel, supaya bisa dinormalisasi, dibangun dengan DDL, dan ditanyai dengan query.

| Berkas | Isi |
|---|---|
| `erd-fokusbareng.png`, `fokusbareng-erd.sql` | ERD P19 (riwayat, belum mengikuti versi 2) |
| `01_skema.sql` | DDL versi 2, bisa dijalankan ulang dari nol |
| `02_uji_kendala.sql` | Bukti kendala: data awal lalu 10 perintah yang harus gagal |
| `03_isi_data.sql` | Data contoh untuk P21 (6 pengguna, 12 room, 51 Check-In, 52 respons, 9 sesi mandiri) |

Menjalankan di MySQL 8 (Docker):

```bash
docker run -d --name fokusbareng-mysql -e MYSQL_ROOT_PASSWORD=lokal123 -p 3306:3306 mysql:8.4
docker exec -i fokusbareng-mysql mysql -uroot -plokal123 < docs/erd/01_skema.sql
docker exec -i fokusbareng-mysql mysql -uroot -plokal123 < docs/erd/03_isi_data.sql
```

Untuk bukti kendala, jalankan `01_skema.sql` lagi (mengosongkan basis data), lalu `02_uji_kendala.sql` dengan `mysql --force` supaya tetap lanjut setelah galat.

## 0. Perubahan versi 2 (26 Nov 2026)

Versi 1 (P20) masih memuat hal yang sudah tidak ada di aplikasi. Perubahan ini menjawab catatan 1 sampai 4 versi 1.

1. **`kode_undangan` dihapus.** Room dibuka lewat tautan berisi `id_room`, karena kode 6 karakter mudah ditebak.
2. **`check_in` menjadi entitas lemah** dengan PK `(id_room, urutan)`, sama seperti `battle/checkIns/{i}` di Firebase. `id_check_in` AUTO_INCREMENT dihapus.
3. **`respons_check_in` menunjuk `peserta_room`** lewat FK komposit `(id_room, uid)`, jadi hanya peserta room itu yang bisa merespons Check-In room itu.
4. **Batas dua peserta** dijaga trigger `trg_peserta_maks_dua`.
5. **Tabel baru `sesi_mandiri`** untuk Belajar Mandiri, yang sekarang sudah dikodekan.
6. **Kolom baru di `room`:** `mode` (normal atau demo), `dibuat_pada`, dan `alasan_hasil` (keluar, Check-In terlewat, terputus, waktu habis).

ERD P19 (`erd-fokusbareng.png`) perlu digambar ulang supaya sesuai dengan versi ini.

## 1. Pemetaan relasi (aturan 1 sampai 7)

| Bagian ERD | Aturan | Hasil pada skema |
|---|---|---|
| Entitas tier, pengguna, room, sesi_mandiri | 1 | Masing-masing jadi tabel dengan PK sendiri |
| check_in | 1 (entitas lemah) | PK gabungan `(id_room, urutan)`; urutan hanya bermakna di dalam satu room |
| pengguna membuat room (1:N) | 4 | FK `uid_pembuat` di room, NOT NULL |
| room menjadwalkan check_in (1:N) | 4 | FK `id_room` di check_in, bagian dari PK |
| pengguna menjalankan sesi_mandiri (1:N) | 4 | FK `uid` di sesi_mandiri, NOT NULL |
| pengguna mengikuti room (M:N) | 5 | Tabel `peserta_room`, PK `(id_room, uid)`, atribut relasi notes, siap, hasil, poin_didapat |
| peserta merespons check_in (M:N) | 5 | Tabel `respons_check_in`, PK `(id_room, urutan, uid)`, atribut relasi waktu_respons |
| tier | 1 | Tabel acuan berdiri sendiri. Gelar dihitung dari total `poin_didapat` dibandingkan `poin_minimum`, jadi tidak perlu FK |

## 2. Skema

```
tier(id_tier, nama_tier, poin_minimum)

pengguna(uid, nama, email, dibuat_pada)

room(id_room, *uid_pembuat, mode, durasi_menit, status, dibuat_pada, waktu_mulai, waktu_selesai, alasan_hasil)
  FK uid_pembuat → pengguna(uid)

peserta_room(*id_room, *uid, notes, siap, hasil, poin_didapat)
  FK id_room → room(id_room), uid → pengguna(uid)

check_in(*id_room, urutan, waktu_jadwal)
  FK id_room → room(id_room)

respons_check_in(*id_room, *urutan, *uid, waktu_respons)
  FK (id_room, urutan) → check_in(id_room, urutan)
  FK (id_room, uid) → peserta_room(id_room, uid)

sesi_mandiri(id_sesi, *uid, teknik, menit_fokus, waktu_mulai, waktu_selesai, selesai_penuh)
  FK uid → pengguna(uid)
```

Urutan buat: tier, pengguna, room, peserta_room, check_in, respons_check_in, sesi_mandiri. Urutan hapus kebalikannya.

## 3. Cek normalisasi

**Dependensi fungsional:**

- `uid → nama, email, dibuat_pada`; `email → uid` (candidate key)
- `id_room → uid_pembuat, mode, durasi_menit, status, dibuat_pada, waktu_mulai, waktu_selesai, alasan_hasil`
- `(id_room, uid) → notes, siap, hasil, poin_didapat`
- `(id_room, urutan) → waktu_jadwal`
- `(id_room, urutan, uid) → waktu_respons`
- `id_sesi → uid, teknik, menit_fokus, waktu_mulai, waktu_selesai, selesai_penuh`
- `nama_tier → id_tier, poin_minimum` dan `poin_minimum → id_tier, nama_tier` (keduanya candidate key)

**1NF.** Semua nilai atomik. Peserta, Check-In, dan respons dijadikan baris, bukan kolom berulang seperti `peserta1, peserta2` atau `respons1, respons2`.

**2NF.** Tabel dengan PK gabungan tidak punya ketergantungan sebagian:

- Di `peserta_room`, notes dan hasil butuh pasangan room dan pengguna.
- Di `check_in`, `waktu_jadwal` butuh room dan urutan.
- Di `respons_check_in`, `waktu_respons` butuh ketiga kolom kunci.

**3NF.** Tidak ada kolom non-kunci yang menentukan kolom non-kunci lain. Nama pengguna tidak disalin ke `peserta_room`, dan nama tier tidak disimpan di pengguna.

**Denormalisasi terkontrol:**

- **`poin_didapat`** bisa diturunkan dari `hasil`. Kolom ini tetap disimpan karena ketentuan poin masih [USULAN] dan poin yang sudah diterima tidak boleh ikut berubah. Room demo menyimpan NULL.
- **`status`** bisa diturunkan dari `waktu_mulai` dan `waktu_selesai`. Kolom ini disimpan supaya query sederhana, dan konsistensinya dijaga CHECK `chk_room_alasan` dan `chk_room_mulai`.
- **`menit_fokus`** di `sesi_mandiri` tidak sama dengan lama sesi, karena waktu istirahat Pomodoro tidak dihitung. Kolom ini disimpan, dan `chk_sesi_lama` memastikan nilainya tidak melebihi lama sesi.

## 4. Kendala tambahan di DDL

| Kendala | Aturan bisnis |
|---|---|
| `chk_room_durasi` | Normal 15, 25, 45, atau 60 menit; demo selalu 3 menit |
| `chk_room_alasan` | Room selesai wajib punya alasan hasil, room yang belum selesai tidak boleh |
| `chk_room_mulai` | Room yang sudah berjalan atau selesai wajib punya waktu mulai |
| `chk_room_waktu`, `chk_sesi_waktu` | Waktu selesai tidak boleh sebelum waktu mulai |
| `chk_peserta_notes` | Notes 1 sampai 140 karakter |
| `chk_checkin_urutan` | Urutan Check-In mulai dari 1 |
| `chk_sesi_menit`, `chk_sesi_lama` | Sesi mandiri tercatat minimal 1 menit dan tidak melebihi lama sesi |
| `trg_peserta_maks_dua` | Satu room maksimal dua peserta |
| `fk_respons_peserta` | Hanya peserta room yang bisa merespons Check-In room itu |

Yang sengaja **tidak** ditegakkan di MySQL, karena dijaga aplikasi dan rules Firebase:

- Jarak antar Check-In (4 sampai 8 menit).
- Jendela respons 20 detik.
- Kecocokan `hasil` kedua peserta, misalnya satu menang dan satu kalah.

## 5. Pemetaan ke Firebase

| MySQL | Firebase (`docs/struktur-data.md`) |
|---|---|
| `pengguna` | `users/{uid}/profile` |
| `room.uid_pembuat`, `durasi_menit`, `mode`, `dibuat_pada` | `rooms/{id}/meta` |
| `peserta_room` (tamu) | `rooms/{id}/guestUid` |
| `peserta_room.notes` | `roomNotes/{roomId}/{uid}` |
| `peserta_room.siap` | `rooms/{id}/ready/{uid}` |
| `room.waktu_mulai`, `check_in` | `rooms/{id}/battle` (`startedAt`, `checkIns/{i}/offsetMs`) |
| `respons_check_in` | `rooms/{id}/responses/{uid}/{i}` |
| `room.waktu_selesai`, `alasan_hasil` | `rooms/{id}/result` (`at`, `reason`) |
| `peserta_room.hasil`, `poin_didapat` | `users/{uid}/history/{roomId}` (`outcome`, `delta`) |
| `sesi_mandiri` | `users/{uid}/solo/{id}` |

Nilai enum diterjemahkan:

- `reason`: forfeit menjadi keluar, missed_checkin menjadi check_in_terlewat, disconnect menjadi terputus, timeup menjadi waktu_habis.
- `technique`: pomodoro tetap pomodoro, long menjadi fokus_panjang, block menjadi satu_blok.

`presence` dan `startRequested` tidak dimodelkan, karena keduanya status sementara selama room berjalan, bukan data yang perlu disimpan.

## 6. Bukti kendala (MySQL 8.0.46, hasil `02_uji_kendala.sql`)

| Perintah | Galat | Kendala |
|---|---|---|
| a. Daftar dengan email yang sudah dipakai | ERROR 1062: Duplicate entry 'gusti@students.uii.ac.id' for key 'pengguna.email' | UNIQUE email |
| b. Room durasi 30 menit | ERROR 3819: Check constraint 'chk_room_durasi' is violated | chk_room_durasi |
| c. Room demo 25 menit | ERROR 3819: Check constraint 'chk_room_durasi' is violated | chk_room_durasi |
| d. Room tanpa pembuat | ERROR 1048: Column 'uid_pembuat' cannot be null | NOT NULL |
| e. Room selesai tanpa alasan hasil | ERROR 3819: Check constraint 'chk_room_alasan' is violated | chk_room_alasan |
| f. Peserta dengan uid tidak terdaftar | ERROR 1452: ... CONSTRAINT `fk_peserta_pengguna` ... | FK ke pengguna |
| g. Bergabung dua kali ke room yang sama | ERROR 1062: Duplicate entry ... for key 'peserta_room.PRIMARY' | PK gabungan |
| h. Orang ketiga masuk room berisi dua peserta | ERROR 1644 (45000): Room sudah berisi dua peserta | trg_peserta_maks_dua |
| i. Bukan peserta merespons Check-In | ERROR 1452: ... CONSTRAINT `fk_respons_peserta` ... | FK komposit |
| j. Menit fokus lebih lama dari sesinya | ERROR 3819: Check constraint 'chk_sesi_lama' is violated | chk_sesi_lama |
