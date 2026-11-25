-- Data awal lalu lima perintah yang HARUS gagal (jalankan satu per satu)
USE fokusbareng;
INSERT INTO tier (nama_tier, poin_minimum) VALUES
  ('Teralihkan', 0), ('Terjaga', 90), ('Teguh', 240), ('Tajam', 480), ('Jawara', 900);
INSERT INTO pengguna (uid, nama, email) VALUES
  ('uidGusti0000000000000000001', 'Gusti', 'gusti@students.uii.ac.id'),
  ('uidNaufal000000000000000002', 'Naufal', 'naufal@students.uii.ac.id');
INSERT INTO room (id_room, kode_undangan, uid_pembuat, durasi_menit)
  VALUES ('-NxRoomA000000000001', 'AB12CD', 'uidGusti0000000000000000001', 25);
INSERT INTO peserta_room (id_room, uid, notes) VALUES
  ('-NxRoomA000000000001', 'uidGusti0000000000000000001', 'Traktir es teh di kantin FTI.');

-- a. UNIQUE: email sudah dipakai Gusti
INSERT INTO pengguna (uid, nama, email)
  VALUES ('uidDimas0000000000000000003', 'Dimas', 'gusti@students.uii.ac.id');
-- b. CHECK: durasi 30 menit tidak tersedia
INSERT INTO room (id_room, kode_undangan, uid_pembuat, durasi_menit)
  VALUES ('-NxRoomB000000000002', 'ZX98YU', 'uidGusti0000000000000000001', 30);
-- c. NOT NULL: room tanpa pembuat
INSERT INTO room (id_room, kode_undangan, uid_pembuat)
  VALUES ('-NxRoomC000000000003', 'QW34ER', NULL);
-- d. FOREIGN KEY: peserta dengan uid yang tidak terdaftar
INSERT INTO peserta_room (id_room, uid)
  VALUES ('-NxRoomA000000000001', 'uidTidakAda000000000000009');
-- e. PK gabungan: Gusti bergabung dua kali ke room yang sama
INSERT INTO peserta_room (id_room, uid)
  VALUES ('-NxRoomA000000000001', 'uidGusti0000000000000000001');
