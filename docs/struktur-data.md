# Struktur Data FokusBareng

Versi 1, 23 November 2026. Kontrak antara front-end (Gusti) dan back-end (Naufal).

- Implementasi mock di front-end **wajib** memakai bentuk yang sama persis, supaya pergantian ke Firebase cukup lewat `VITE_DATA_SOURCE`.
- Kalau ada perubahan, ubah file ini dulu, lalu `database.rules.json`, `src/domain/referee.js`, dan implementasi mock pada hari yang sama.
- Model konseptualnya ada di `docs/erd/` (ERD P19). Pemetaannya ada di bagian 5.

## 1. Pohon data Realtime Database

```
users/
  {uid}/
    profile/
      name: string          1 sampai 60 karakter
      createdAt: number     ServerValue.TIMESTAMP
    history/
      {roomId}/
        delta: number       30 | 15 | 5, harus cocok dengan rooms/{roomId}/result

rooms/
  {roomId}/
    meta/
      hostUid: string
      durationMin: number   15 | 25 | 45 | 60
      createdAt: number     ServerValue.TIMESTAMP
      expiresAt: number     maksimal createdAt + 30 menit
    guestUid: string        ditulis sekali oleh tamu
    ready/
      {uid}: boolean
    notes/
      {uid}: string         maksimal 280 karakter
    battle/                 ditulis sekali oleh host
      startedAt: number     ServerValue.TIMESTAMP
      checkIns/
        {i}/                i = "0", "1", ...
          offsetMs: number  >= 240000 dan < durationMin * 60000
    responses/
      {uid}/
        {i}: number         ServerValue.TIMESTAMP
    presence/
      {uid}/
        online: boolean
        lastSeen: number    ServerValue.TIMESTAMP
    result/                 ditulis sekali
      outcome: "win" | "draw"
      reason: "forfeit" | "missed_checkin" | "disconnect" | "timeup"
      winnerUid: string     hanya bila outcome = "win"
      loserUid: string      hanya bila outcome = "win"
      checkInIndex: number  hanya bila reason = "missed_checkin"
      at: number            ServerValue.TIMESTAMP
```

## 2. Siapa menulis apa, dan kapan

| Path | Penulis | Kapan | Batasan rules |
|---|---|---|---|
| `users/{uid}/profile` | pemilik | saat Daftar | hanya pemilik |
| `users/{uid}/history/{roomId}` | pemilik | setelah `result` ada | sekali, `delta` cocok dengan hasil |
| `rooms/{id}/meta` | host | saat Buat Room | sekali, durasi valid, `expiresAt` maksimal +30 menit |
| `rooms/{id}/guestUid` | tamu | saat membuka tautan | sekali, bukan host, room belum kedaluwarsa |
| `rooms/{id}/ready/{uid}` | pemilik | di Lobi | hanya peserta, sebelum `battle` ada |
| `rooms/{id}/notes/{uid}` | pemilik | di Lobi | hanya peserta, sebelum `battle` ada, maksimal 280 karakter |
| `rooms/{id}/battle` | host | keduanya siap | sekali, `startedAt = now`, minimal satu Check-In |
| `rooms/{id}/responses/{uid}/{i}` | pemilik | saat Check-In | sekali, nilainya `now`, di dalam jendela 20 detik, sebelum `result` ada |
| `rooms/{id}/presence/{uid}` | pemilik | terus-menerus + `onDisconnect` | `lastSeen = now` |
| `rooms/{id}/result` | salah satu peserta | saat kondisi akhir terpenuhi | sekali, bukti harus cocok (lihat `keputusan-aturan.md` bagian 4) |

Hak baca:
- `meta` dan `guestUid` terbaca semua pengguna yang sudah masuk (dibutuhkan untuk cek "room penuh" dan "tautan tidak berlaku").
- Bagian room lainnya hanya terbaca host dan tamu.
- `notes/{uid}` terbaca pemiliknya, atau lawan **hanya bila** `result.outcome = "win"` dan `result.winnerUid = uid`.

## 3. Nilai turunan (tidak disimpan, dihitung di klien)

| Nilai | Cara menghitung |
|---|---|
| Status room | `menunggu`: belum ada `guestUid`. `siap`: ada tamu, belum ada `battle`. `berjalan`: ada `battle`, belum ada `result`. `selesai`: ada `result`. `kedaluwarsa`: `now > expiresAt` dan belum ada `battle`. |
| Total poin | jumlah `delta` di `users/{uid}/history` |
| Gelar | ambang tertinggi yang terlewati (tabel di `keputusan-aturan.md` bagian 9) |
| Menang / seri / kalah | dari `delta`: 30 menang, 15 seri, 5 kalah |
| Sisa waktu Arena | `startedAt + durationMin * 60000 - serverNow` |
| Check-In aktif | indeks `i` dengan `T <= serverNow <= T + 20 detik` |

**[TERBUKA]** Dasbor di Figma menampilkan angka statistik seperti rekor dan total menit fokus. Data ini **tidak bisa dihitung** dari `history` yang sekarang hanya berisi `delta`. Usulan: tambah `outcome` dan `focusMin` ke `history/{roomId}`, lalu rules memeriksa keduanya terhadap `result` dan `meta.durationMin`. Kalau tidak disetujui, angka itu dihapus dari Dasbor.

## 4. Kontrak services (dipakai mock dan Firebase)

Semua fungsi `async`, kecuali `listen*` yang mengembalikan fungsi `unsubscribe`.

```js
// auth
signUp({ name, email, password })      // -> { uid, name }
signIn({ email, password })            // -> { uid, name }
signOut()
onAuthChange(callback)                 // -> unsubscribe

// profil
getProfile(uid)                        // -> { name, createdAt, points, tier, wins, draws, losses }

// room
createRoom({ durationMin })            // -> roomId
joinRoom(roomId)                       // -> 'joined' | 'full' | 'expired' | 'not_found' | 'own_room'
setNotes(roomId, text)
setReady(roomId, isReady)
startBattle(roomId)                    // host saja, membuat jadwal Check-In
answerCheckIn(roomId, index)
forfeit(roomId)                        // keluar sengaja = kalah
claimResult(roomId, result)            // dipanggil saat referee.js menyatakan battle selesai
applyPoints(roomId)                    // menulis history milik sendiri
listenRoom(roomId, callback)           // -> unsubscribe, callback menerima seluruh isi room
getServerOffset()                      // -> ms, selisih jam server dan perangkat
```

Mock juga menyediakan panel dev untuk mensimulasikan lawan: bergabung, siap, terputus, kembali, melewatkan Check-In, dan keluar.

## 5. Pemetaan ke ERD P19

| ERD | Realtime Database | Catatan |
|---|---|---|
| `pengguna(uid, nama, email, dibuat_pada)` | `users/{uid}/profile` | Email hanya disimpan di Firebase Auth |
| `tier(id_tier, nama_tier, poin_minimum)` | `src/config/gameRules.js` | Konstanta, bukan data |
| `room(id_room, kode_undangan, ...)` | `rooms/{roomId}/meta` | `kode_undangan` = `roomId` (lihat di bawah) |
| `room.status` | dihitung (bagian 3) | Tidak disimpan supaya tidak bisa tidak sinkron |
| `room.waktu_mulai` | `battle/startedAt` | |
| `room.waktu_selesai` | `result/at` | |
| `peserta_room(id_room, uid, notes, siap)` | `meta.hostUid`, `guestUid`, `notes/{uid}`, `ready/{uid}` | |
| `peserta_room.hasil`, `poin_didapat` | `result` + `users/{uid}/history/{roomId}` | |
| `check_in(id_room, urutan, waktu_jadwal)` | `battle/checkIns/{i}/offsetMs` | `waktu_jadwal = startedAt + offsetMs` |
| `respons_check_in(id_check_in, uid, waktu_respons)` | `responses/{uid}/{i}` | |
| (tidak ada) | `presence/{uid}` | Perlu ditambahkan ke ERD |
| (tidak ada) | `result.reason` | Perlu ditambahkan ke ERD |

**Kode undangan:** ERD memakai `kode_undangan CHAR(6)`. Usulan di sini adalah memakai `roomId` dari push key Firebase (20 karakter) langsung di tautan, tanpa kode 6 karakter. Alasannya, kode 6 karakter bisa ditebak, sehingga orang asing bisa masuk ke room orang lain. Push key praktis tidak bisa ditebak. Konsekuensinya, room hanya bisa dimasuki lewat tautan, tidak dengan mengetik kode. **[TERBUKA]** Kalau tim tetap ingin kode yang bisa diketik, perlu node tambahan `inviteCodes/{kode}: roomId` dan rules-nya.

## 6. Berkas terkait

- `database.rules.json`: rules yang memeriksa semua batasan di bagian 2.
- `tests/rules.test.js`: tes Emulator. Cara menjalankan: `npm i -D firebase-tools @firebase/rules-unit-testing firebase vitest`, lalu `npx firebase emulators:exec --only database "npx vitest run"` (butuh Java).
- `src/domain/referee.js`: logika wasit murni dengan aturan yang sama.
