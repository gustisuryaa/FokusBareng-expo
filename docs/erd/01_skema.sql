-- FokusBareng (kelompok E-Duel): skema relasional dari ERD P19 (Worksheet PABW P20)
-- Jalankan dari basis data kosong. Urutan: induk dulu, lalu anak.

CREATE DATABASE IF NOT EXISTS fokusbareng DEFAULT CHARACTER SET utf8mb4;
USE fokusbareng;

-- 1 (tabel acuan, tidak berelasi; gelar dihitung dari total poin)
CREATE TABLE tier (
  id_tier      INT NOT NULL AUTO_INCREMENT,
  nama_tier    VARCHAR(20) NOT NULL,
  poin_minimum INT NOT NULL,
  PRIMARY KEY (id_tier),
  UNIQUE (nama_tier),
  UNIQUE (poin_minimum),
  CHECK (poin_minimum >= 0)
) ENGINE = InnoDB;

-- 2
CREATE TABLE pengguna (
  uid         VARCHAR(28)  NOT NULL,   -- UID Firebase Auth
  nama        VARCHAR(60)  NOT NULL,
  email       VARCHAR(100) NOT NULL,
  dibuat_pada DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uid),
  UNIQUE (email)
) ENGINE = InnoDB;

-- 3 (pengguna membuat room, 1:N, aturan 4)
CREATE TABLE room (
  id_room        VARCHAR(20) NOT NULL,  -- push key
  kode_undangan  CHAR(6)     NOT NULL,
  uid_pembuat    VARCHAR(28) NOT NULL,
  durasi_menit   INT         NOT NULL DEFAULT 25,
  status         ENUM('menunggu', 'berjalan', 'selesai') NOT NULL DEFAULT 'menunggu',
  waktu_mulai    DATETIME    NULL,
  waktu_selesai  DATETIME    NULL,
  PRIMARY KEY (id_room),
  UNIQUE (kode_undangan),
  CHECK (durasi_menit IN (15, 25, 45, 60)),
  CHECK (waktu_selesai IS NULL OR waktu_selesai >= waktu_mulai),
  CONSTRAINT fk_room_pembuat
    FOREIGN KEY (uid_pembuat) REFERENCES pengguna(uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 4 (room menjadwalkan check_in, 1:N, aturan 4)
CREATE TABLE check_in (
  id_check_in  INT NOT NULL AUTO_INCREMENT,
  id_room      VARCHAR(20) NOT NULL,
  urutan       INT         NOT NULL,
  waktu_jadwal DATETIME    NOT NULL,
  PRIMARY KEY (id_check_in),
  UNIQUE (id_room, urutan),
  CHECK (urutan >= 1),
  CONSTRAINT fk_checkin_room
    FOREIGN KEY (id_room) REFERENCES room(id_room)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 5 (pengguna mengikuti room, M:N dengan atribut relasi, aturan 5)
CREATE TABLE peserta_room (
  id_room      VARCHAR(20) NOT NULL,
  uid          VARCHAR(28) NOT NULL,
  notes        VARCHAR(140) NULL,
  siap         BOOLEAN     NOT NULL DEFAULT FALSE,
  hasil        ENUM('menang', 'kalah', 'seri') NULL,
  poin_didapat INT         NULL,
  PRIMARY KEY (id_room, uid),
  CHECK (notes IS NULL OR CHAR_LENGTH(notes) BETWEEN 1 AND 140),
  CHECK (poin_didapat IS NULL OR poin_didapat >= 0),
  CONSTRAINT fk_peserta_room
    FOREIGN KEY (id_room) REFERENCES room(id_room)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_peserta_pengguna
    FOREIGN KEY (uid) REFERENCES pengguna(uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 6 (pengguna merespons check_in, M:N dengan atribut relasi, aturan 5)
CREATE TABLE respons_check_in (
  id_check_in   INT         NOT NULL,
  uid           VARCHAR(28) NOT NULL,
  waktu_respons DATETIME    NOT NULL,
  PRIMARY KEY (id_check_in, uid),
  CONSTRAINT fk_respons_checkin
    FOREIGN KEY (id_check_in) REFERENCES check_in(id_check_in)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_respons_pengguna
    FOREIGN KEY (uid) REFERENCES pengguna(uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
