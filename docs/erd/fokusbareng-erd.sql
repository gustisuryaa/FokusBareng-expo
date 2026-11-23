-- ERD FokusBareng (kelompok E-Duel) - skema relasional hasil turunan ERD P19
-- Catatan: implementasi MVP memakai Firebase Realtime Database; skema ini adalah model konseptual/logisnya.
CREATE TABLE pengguna (
  uid VARCHAR(28) PRIMARY KEY,
  nama VARCHAR(60) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tier (
  id_tier INT PRIMARY KEY,
  nama_tier VARCHAR(20) NOT NULL UNIQUE,
  poin_minimum INT NOT NULL UNIQUE
);
CREATE TABLE room (
  id_room VARCHAR(20) PRIMARY KEY,
  kode_undangan CHAR(6) NOT NULL UNIQUE,
  uid_pembuat VARCHAR(28) NOT NULL,
  durasi_menit INT NOT NULL CHECK (durasi_menit IN (15,25,45,60)),
  status ENUM('menunggu','berjalan','selesai') NOT NULL DEFAULT 'menunggu',
  waktu_mulai DATETIME NULL,
  waktu_selesai DATETIME NULL,
  FOREIGN KEY (uid_pembuat) REFERENCES pengguna(uid)
);
CREATE TABLE peserta_room (
  id_room VARCHAR(20),
  uid VARCHAR(28),
  notes TEXT,
  siap BOOLEAN NOT NULL DEFAULT FALSE,
  hasil ENUM('menang','kalah','seri') NULL,
  poin_didapat INT NULL,
  PRIMARY KEY (id_room, uid),
  FOREIGN KEY (id_room) REFERENCES room(id_room),
  FOREIGN KEY (uid) REFERENCES pengguna(uid)
);
CREATE TABLE check_in (
  id_check_in INT AUTO_INCREMENT PRIMARY KEY,
  id_room VARCHAR(20) NOT NULL,
  urutan INT NOT NULL,
  waktu_jadwal DATETIME NOT NULL,
  UNIQUE (id_room, urutan),
  FOREIGN KEY (id_room) REFERENCES room(id_room)
);
CREATE TABLE respons_check_in (
  id_check_in INT,
  uid VARCHAR(28),
  waktu_respons DATETIME NULL,
  PRIMARY KEY (id_check_in, uid),
  FOREIGN KEY (id_check_in) REFERENCES check_in(id_check_in),
  FOREIGN KEY (uid) REFERENCES pengguna(uid)
);
