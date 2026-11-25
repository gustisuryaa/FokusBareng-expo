# Skema Relasional FokusBareng (Kelompok E-Duel)

Turunan dari ERD P19 (`erd-fokusbareng.png`, `fokusbareng-erd.sql`). DDL-nya ada di `01_skema.sql`, dan uji kendalanya di `02_uji_kendala.sql`.

`01_skema.sql` adalah versi P20 dari `fokusbareng-erd.sql`. File P19 tetap disimpan sebagai riwayat. Bedanya: `01_skema.sql` bisa dijalankan dari basis data kosong (ada CREATE DATABASE, urutan induk dulu, ENGINE InnoDB), semua FK memakai CONSTRAINT bernama dengan ON DELETE RESTRICT dan ON UPDATE CASCADE, CHECK-nya lebih lengkap, `notes` dibatasi VARCHAR(140) mengikuti aturan Notes 1–140 karakter (di P19 masih TEXT), dan `waktu_respons` dibuat NOT NULL (lihat 5.2).
Notasi: **tebal** = PK (garis bawahi di dokumen), `*` = FK (cetak miring di dokumen).

## 1. Pemetaan relasi (aturan 1–7)

| Bagian ERD | Aturan | Hasil pada skema |
|---|---|---|
| Entitas tier, pengguna, room, check_in | 1 | Masing-masing jadi tabel, PK sesuai ERD |
| pengguna membuat room (1:N) | 4 | FK uid_pembuat di room, NOT NULL (setiap room wajib punya pembuat) |
| room menjadwalkan check_in (1:N) | 4 | FK id_room di check_in, NOT NULL |
| pengguna mengikuti room (M:N, lewat peserta_room) | 5 | Tabel peserta_room, PK gabungan (id_room, uid), atribut relasi notes, siap, hasil, poin_didapat |
| pengguna merespons check_in (M:N, lewat respons_check_in) | 5 | Tabel respons_check_in, PK gabungan (id_check_in, uid), atribut relasi waktu_respons |
| tier | 1 | Tabel acuan berdiri sendiri. Gelar dihitung dari total poin_didapat dibandingkan poin_minimum, jadi tidak perlu FK |

## 2. Skema

```
tier(id_tier, nama_tier, poin_minimum)
FK: tidak ada

pengguna(uid, nama, email, dibuat_pada)
FK: tidak ada

room(id_room, kode_undangan, *uid_pembuat, durasi_menit, status, waktu_mulai, waktu_selesai)
FK: uid_pembuat → pengguna(uid)

check_in(id_check_in, *id_room, urutan, waktu_jadwal)
FK: id_room → room(id_room)

peserta_room(*id_room, *uid, notes, siap, hasil, poin_didapat)
FK: id_room → room(id_room), uid → pengguna(uid)

respons_check_in(*id_check_in, *uid, waktu_respons)
FK: id_check_in → check_in(id_check_in), uid → pengguna(uid)
```

PK: tier.id_tier, pengguna.uid, room.id_room, check_in.id_check_in, peserta_room.(id_room, uid), respons_check_in.(id_check_in, uid).

Urutan buat: tier, pengguna, room, check_in, peserta_room, respons_check_in. Urutan hapus kebalikannya.

## 3. Cek normalisasi

- Tidak ada kolom berisi daftar nilai. Peserta dan respons sudah jadi tabel sendiri, bukan kolom seperti `peserta1, peserta2`.
- Tidak ada ketergantungan parsial. Di peserta_room, notes/siap/hasil/poin bergantung pada pasangan (id_room, uid), dan waktu_respons bergantung pada pasangan (id_check_in, uid).
- Tidak ada ketergantungan transitif. kode_undangan adalah candidate key (UNIQUE), jadi `kode_undangan → kolom lain` tidak melanggar 3NF.
- poin_didapat sebetulnya bisa diturunkan dari hasil. Kolom ini sengaja disimpan (denormalisasi terkontrol) karena ketentuan poin masih bisa berubah, dan poin yang sudah diterima pemain tidak boleh ikut berubah.

## 4. Kendala tambahan di DDL (tidak tertulis di ERD)

- `durasi_menit IN (15, 25, 45, 60)`, default 25
- `waktu_selesai >= waktu_mulai`
- `UNIQUE (id_room, urutan)` di check_in, supaya tidak ada dua Check-In ke-1 di satu room
- `CHAR_LENGTH(notes) BETWEEN 1 AND 140` (Notes 1–140 karakter)
- `poin_didapat >= 0`, `poin_minimum >= 0` dan UNIQUE
- `respons_check_in.waktu_respons` dibuat NOT NULL (lihat catatan 5.2)

## 5. Catatan untuk kelompok (perlu disepakati)

1. **kode_undangan CHAR(6)** masih ada di ERD, padahal keputusan v2.1 menghapus kode 6 karakter karena mudah ditebak; room dibuka lewat tautan berisi id_room. Pilih salah satu: hapus kolomnya dari ERD dan DDL, atau pertahankan lalu catat di Catatan Perubahan.
2. **Relasi "direspons" ditulis |< (satu atau banyak, wajib).** Padahal satu Check-In bisa tidak dijawab siapa pun (keduanya melewatkan, hasilnya seri). Seharusnya o< (nol atau banyak). Karena baris respons hanya dibuat saat pemain menjawab, waktu_respons di DDL dibuat NOT NULL, bukan NULL seperti di ERD.
3. **Batas dua peserta per room** tidak bisa ditegakkan dengan CHECK biasa. Perlu trigger BEFORE INSERT di peserta_room, atau cukup dicek di aplikasi.
4. **Yang merespons harus peserta room itu.** respons_check_in menunjuk ke pengguna, bukan ke peserta_room. Akibatnya pengguna yang bukan peserta secara skema tetap bisa merespons. Ada dua cara menutupnya: tambahkan id_room ke respons_check_in lalu buat FK komposit (id_room, uid) → peserta_room, atau terima sebagai validasi di aplikasi.
5. Implementasi aplikasinya memakai Firebase Realtime Database, bukan MySQL. Skema ini adalah model relasional untuk tugas PABW. Nama kolomnya (misal id_room, hasil) tidak sama persis dengan path di `docs/struktur-data.md`.

## 6. Bukti kendala (MySQL 8.0, hasil `02_uji_kendala.sql`)

| Perintah | Galat | Kendala |
|---|---|---|
| a. Daftar dengan email yang sudah dipakai | ERROR 1062 (23000): Duplicate entry 'gusti@students.uii.ac.id' for key 'pengguna.email' | UNIQUE pengguna.email |
| b. Room durasi 30 menit | ERROR 3819 (HY000): Check constraint 'room_chk_1' is violated. | CHECK durasi_menit IN (15, 25, 45, 60) |
| c. Room tanpa pembuat | ERROR 1048 (23000): Column 'uid_pembuat' cannot be null | NOT NULL room.uid_pembuat |
| d. Peserta dengan uid tidak terdaftar | ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails (... `fk_peserta_pengguna` ...) | FOREIGN KEY fk_peserta_pengguna |
| e. Bergabung dua kali ke room yang sama | ERROR 1062 (23000): Duplicate entry '-NxRoomA000000000001-uidGusti0000000000000000001' for key 'peserta_room.PRIMARY' | PK gabungan peserta_room |
