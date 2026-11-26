-- Uji kendala skema v2. Jalankan setelah 01_skema.sql.
-- Bagian data awal harus berhasil; perintah a sampai j harus GAGAL satu per satu.
-- Dengan klien mysql: mysql --force -uroot -p < 02_uji_kendala.sql (supaya lanjut setelah galat)
USE fokusbareng;

INSERT INTO tier (nama_tier, poin_minimum) VALUES
  ('Teralihkan', 0), ('Terjaga', 90), ('Teguh', 240), ('Tajam', 480), ('Jawara', 900);
INSERT INTO pengguna (uid, nama, email) VALUES
  ('uidGusti0000000000000000001', 'Gusti', 'gusti@students.uii.ac.id'),
  ('uidNaufal000000000000000002', 'Naufal', 'naufal@students.uii.ac.id'),
  ('uidNaqa00000000000000000003', 'Naqa', 'naqa@students.uii.ac.id');
INSERT INTO room (id_room, uid_pembuat, durasi_menit, status, waktu_mulai)
  VALUES ('-NxRoomA000000000001', 'uidGusti0000000000000000001', 25, 'berjalan', '2026-11-26 19:00:00');
INSERT INTO peserta_room (id_room, uid, notes) VALUES
  ('-NxRoomA000000000001', 'uidGusti0000000000000000001', 'Traktir es teh di kantin FTI.'),
  ('-NxRoomA000000000001', 'uidNaufal000000000000000002', 'Bersihkan meja lab setelah praktikum.');
-- Room kedua masih menunggu tamu (satu peserta), dipakai untuk uji f dan g
INSERT INTO room (id_room, uid_pembuat) VALUES ('-NxRoomE000000000005', 'uidNaqa00000000000000000003');
INSERT INTO peserta_room (id_room, uid) VALUES ('-NxRoomE000000000005', 'uidNaqa00000000000000000003');
INSERT INTO check_in (id_room, urutan, waktu_jadwal)
  VALUES ('-NxRoomA000000000001', 1, '2026-11-26 19:05:12');

-- a. email sudah dipakai Gusti
INSERT INTO pengguna (uid, nama, email)
  VALUES ('uidDimas0000000000000000004', 'Dimas', 'gusti@students.uii.ac.id');
-- b. durasi 30 menit tidak tersedia
INSERT INTO room (id_room, uid_pembuat, durasi_menit)
  VALUES ('-NxRoomB000000000002', 'uidGusti0000000000000000001', 30);
-- c. room demo harus 3 menit
INSERT INTO room (id_room, uid_pembuat, mode, durasi_menit)
  VALUES ('-NxRoomC000000000003', 'uidGusti0000000000000000001', 'demo', 25);
-- d. room tanpa pembuat
INSERT INTO room (id_room, uid_pembuat) VALUES ('-NxRoomD000000000004', NULL);
-- e. room selesai tanpa alasan hasil
UPDATE room SET status = 'selesai', waktu_selesai = '2026-11-26 19:25:00'
  WHERE id_room = '-NxRoomA000000000001';
-- f. uid peserta tidak terdaftar
INSERT INTO peserta_room (id_room, uid) VALUES ('-NxRoomE000000000005', 'uidTidakAda000000000000009');
-- g. Naqa bergabung dua kali ke room yang sama
INSERT INTO peserta_room (id_room, uid) VALUES ('-NxRoomE000000000005', 'uidNaqa00000000000000000003');
-- h. orang ketiga masuk room yang sudah berisi dua peserta
INSERT INTO peserta_room (id_room, uid) VALUES ('-NxRoomA000000000001', 'uidNaqa00000000000000000003');
-- i. bukan peserta merespons Check-In room ini
INSERT INTO respons_check_in (id_room, urutan, uid, waktu_respons)
  VALUES ('-NxRoomA000000000001', 1, 'uidNaqa00000000000000000003', '2026-11-26 19:05:20');
-- j. sesi mandiri dengan menit fokus lebih lama dari sesinya
INSERT INTO sesi_mandiri (id_sesi, uid, teknik, menit_fokus, waktu_mulai, waktu_selesai, selesai_penuh)
  VALUES ('-NxSolo000000000001', 'uidGusti0000000000000000001', 'satu_blok', 25,
          '2026-11-26 20:00:00', '2026-11-26 20:10:00', FALSE);
