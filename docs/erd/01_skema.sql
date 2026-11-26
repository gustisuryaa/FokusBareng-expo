-- FokusBareng (kelompok E-Duel): skema relasional MySQL 8 untuk PABW P20 sampai P22.
-- Versi 2 (26 Nov 2026): disamakan dengan aplikasi. Lihat skema.md bagian 0 untuk daftar perubahan.
-- Jalankan dari basis data kosong. Urutan: induk dulu, lalu anak.

DROP DATABASE IF EXISTS fokusbareng;
CREATE DATABASE fokusbareng DEFAULT CHARACTER SET utf8mb4;
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
-- Room dibuka lewat tautan berisi id_room, jadi tidak ada kode undangan.
CREATE TABLE room (
  id_room       VARCHAR(20) NOT NULL,  -- push key Firebase
  uid_pembuat   VARCHAR(28) NOT NULL,
  mode          ENUM('normal', 'demo') NOT NULL DEFAULT 'normal',
  durasi_menit  INT         NOT NULL DEFAULT 25,
  status        ENUM('menunggu', 'berjalan', 'selesai') NOT NULL DEFAULT 'menunggu',
  dibuat_pada   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waktu_mulai   DATETIME    NULL,
  waktu_selesai DATETIME    NULL,
  alasan_hasil  ENUM('keluar', 'check_in_terlewat', 'terputus', 'waktu_habis') NULL,
  PRIMARY KEY (id_room),
  CONSTRAINT chk_room_durasi CHECK (
    (mode = 'normal' AND durasi_menit IN (15, 25, 45, 60)) OR (mode = 'demo' AND durasi_menit = 3)
  ),
  CONSTRAINT chk_room_waktu CHECK (waktu_selesai IS NULL OR waktu_selesai >= waktu_mulai),
  -- Room selesai wajib punya alasan, room yang belum selesai tidak boleh punya alasan
  CONSTRAINT chk_room_alasan CHECK ((status = 'selesai') = (alasan_hasil IS NOT NULL)),
  CONSTRAINT chk_room_mulai CHECK (status = 'menunggu' OR waktu_mulai IS NOT NULL),
  CONSTRAINT fk_room_pembuat
    FOREIGN KEY (uid_pembuat) REFERENCES pengguna(uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 4 (pengguna mengikuti room, M:N dengan atribut relasi, aturan 5)
CREATE TABLE peserta_room (
  id_room      VARCHAR(20)  NOT NULL,
  uid          VARCHAR(28)  NOT NULL,
  notes        VARCHAR(140) NULL,
  siap         BOOLEAN      NOT NULL DEFAULT FALSE,
  hasil        ENUM('menang', 'kalah', 'seri') NULL,
  poin_didapat INT          NULL,
  PRIMARY KEY (id_room, uid),
  CONSTRAINT chk_peserta_notes CHECK (notes IS NULL OR CHAR_LENGTH(notes) BETWEEN 1 AND 140),
  CONSTRAINT chk_peserta_poin CHECK (poin_didapat IS NULL OR poin_didapat >= 0),
  CONSTRAINT fk_peserta_room
    FOREIGN KEY (id_room) REFERENCES room(id_room)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_peserta_pengguna
    FOREIGN KEY (uid) REFERENCES pengguna(uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 5 (room menjadwalkan check_in, 1:N, entitas lemah: diidentifikasi room + urutan)
CREATE TABLE check_in (
  id_room      VARCHAR(20) NOT NULL,
  urutan       INT         NOT NULL,
  waktu_jadwal DATETIME    NOT NULL,
  PRIMARY KEY (id_room, urutan),
  CONSTRAINT chk_checkin_urutan CHECK (urutan >= 1),
  CONSTRAINT fk_checkin_room
    FOREIGN KEY (id_room) REFERENCES room(id_room)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 6 (peserta merespons check_in, M:N dengan atribut relasi, aturan 5)
-- FK komposit ke peserta_room: hanya peserta room itu yang bisa merespons Check-In room itu.
CREATE TABLE respons_check_in (
  id_room       VARCHAR(20) NOT NULL,
  urutan        INT         NOT NULL,
  uid           VARCHAR(28) NOT NULL,
  waktu_respons DATETIME    NOT NULL,
  PRIMARY KEY (id_room, urutan, uid),
  CONSTRAINT fk_respons_checkin
    FOREIGN KEY (id_room, urutan) REFERENCES check_in(id_room, urutan)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_respons_peserta
    FOREIGN KEY (id_room, uid) REFERENCES peserta_room(id_room, uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 7 (pengguna menjalankan sesi_mandiri, 1:N, aturan 4)
CREATE TABLE sesi_mandiri (
  id_sesi       VARCHAR(20) NOT NULL,  -- push key Firebase
  uid           VARCHAR(28) NOT NULL,
  teknik        ENUM('pomodoro', 'fokus_panjang', 'satu_blok') NOT NULL,
  menit_fokus   INT         NOT NULL,
  waktu_mulai   DATETIME    NOT NULL,
  waktu_selesai DATETIME    NOT NULL,
  selesai_penuh BOOLEAN     NOT NULL,  -- FALSE bila diakhiri lebih awal atau Check-In terlewat
  PRIMARY KEY (id_sesi),
  CONSTRAINT chk_sesi_menit CHECK (menit_fokus >= 1),
  CONSTRAINT chk_sesi_waktu CHECK (waktu_selesai >= waktu_mulai),
  -- Menit fokus tidak boleh melebihi lama sesi
  CONSTRAINT chk_sesi_lama CHECK (menit_fokus * 60 <= TIMESTAMPDIFF(SECOND, waktu_mulai, waktu_selesai)),
  CONSTRAINT fk_sesi_pengguna
    FOREIGN KEY (uid) REFERENCES pengguna(uid)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Batas dua peserta per room tidak bisa ditulis sebagai CHECK, jadi dijaga trigger
DELIMITER //
CREATE TRIGGER trg_peserta_maks_dua
BEFORE INSERT ON peserta_room
FOR EACH ROW
BEGIN
  IF (SELECT COUNT(*) FROM peserta_room WHERE id_room = NEW.id_room) >= 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room sudah berisi dua peserta';
  END IF;
END//
DELIMITER ;
