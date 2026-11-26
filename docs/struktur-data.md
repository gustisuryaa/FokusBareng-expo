# Struktur Data FokusBareng

Versi 1.3, 25 November 2026. Kontrak antara front-end (Gusti) dan back-end (Naufal).

Perubahan v1.3 (disetujui Naufal 25 Nov): **Notes rahasia** pindah ke `roomNotes/{roomId}/{uid}`, room hanya memegang penanda `notesSet/{uid}`. **Mode demo** berlaku juga di Firebase: `meta.mode = "demo"`, durasi 3 menit, Check-In pertama paling cepat detik ke-30, tanpa poin. `createRoom` menerima `mode`.

Perubahan v1.2 (Tahap 3 front-end): kontrak services ditambah `setPresence`, `getProfile` mengembalikan statistik turunan lengkap, rumus `focusMin` dibatasi sampai akhir timer, `meta.mode` khusus mock (bagian 1).

Perubahan dari v1: durasi bisa diubah di Lobi, field `startRequested`, Notes wajib maksimal 140 karakter, `history` ditambah `outcome`, `focusMin`, `opponentName`, `at`. Semua ini sudah ada di `database.rules.json` (bagian 6).

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
    history/                (tidak ada untuk room demo)
      {roomId}/
        delta: number       30 | 15 | 5, harus cocok dengan rooms/{roomId}/result
        outcome: "win" | "draw" | "loss"   harus cocok dengan result
        focusMin: number    floor((min(result.at, startedAt + durationMin*60000) - battle.startedAt) / 60000)
        opponentName: string  1 sampai 60 karakter, hanya untuk tampilan
        at: number          ServerValue.TIMESTAMP

rooms/
  {roomId}/
    meta/
      hostUid: string
      durationMin: number   15 | 25 | 45 | 60, bawaan 25, boleh diubah host sebelum battle; demo: 3
      createdAt: number     ServerValue.TIMESTAMP
      expiresAt: number     maksimal createdAt + 30 menit
      mode: "demo"          hanya di room demo (?mode=demo); tidak ada di room normal
    guestUid: string        ditulis sekali oleh tamu
    startRequested: boolean host menekan "Mulai Adu Fokus"; false bila ada yang menekan Batal
    ready/
      {uid}: boolean        "Aku siap" di Konfirmasi Kefokusan
    notesSet/
      {uid}: true           penanda Notes sudah diisi; hanya boleh bila roomNotes/{roomId}/{uid} ada
    battle/                 ditulis sekali oleh host
      startedAt: number     ServerValue.TIMESTAMP
      checkIns/
        {i}/                i = "0", "1", ...
          offsetMs: number  >= 240000 (demo: >= 30000) dan < durationMin * 60000
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

roomNotes/
  {roomId}/
    {uid}: string           1 sampai 140 karakter, wajib. Rahasia: terpisah dari rooms/ karena
                            izin baca rooms/{roomId} berlaku untuk semua anaknya
```

## 2. Siapa menulis apa, dan kapan

| Path | Penulis | Kapan | Batasan rules |
|---|---|---|---|
| `users/{uid}/profile` | pemilik | saat Daftar | hanya pemilik |
| `users/{uid}/history/{roomId}` | pemilik | setelah `result` ada | sekali, `delta` dan `outcome` cocok dengan hasil, `focusMin` cocok dengan waktu battle, bukan room demo |
| `rooms/{id}/meta` | host | saat Buat Room | sekali, durasi valid, `expiresAt` maksimal +30 menit, `mode` hanya `"demo"` dan tidak bisa diubah |
| `rooms/{id}/meta/durationMin` | host | di Lobi | 15/25/45/60 (demo: 3), sebelum `battle` ada dan room belum kedaluwarsa |
| `rooms/{id}/guestUid` | tamu | saat membuka tautan | sekali, bukan host, room belum kedaluwarsa |
| `rooms/{id}/startRequested` | host (true), peserta mana pun (false) | Mulai / Batal | true hanya bila ada tamu dan Notes 2/2, sebelum `battle` ada |
| `rooms/{id}/ready/{uid}` | pemilik | di Konfirmasi Kefokusan | hanya peserta, hanya saat `startRequested = true`, sebelum `battle` ada |
| `roomNotes/{id}/{uid}` dan `rooms/{id}/notesSet/{uid}` | pemilik | di Lobi, satu multi-path update | hanya peserta, sebelum `battle` ada, room belum kedaluwarsa, 1 sampai 140 karakter, tidak bisa dihapus |
| `rooms/{id}/battle` | host | kedua `ready` true | sekali, `startedAt = now`, minimal satu Check-In |
| `rooms/{id}/responses/{uid}/{i}` | pemilik | saat Check-In | sekali, nilainya `now`, di dalam jendela 20 detik, sebelum `result` ada |
| `rooms/{id}/presence/{uid}` | pemilik | terus-menerus + `onDisconnect` | `lastSeen = now` |
| `rooms/{id}/result` | salah satu peserta | saat kondisi akhir terpenuhi | sekali, bukti harus cocok (lihat `keputusan-aturan.md` bagian 4) |

Hak baca:
- `meta` dan `guestUid` terbaca semua pengguna yang sudah masuk (dibutuhkan untuk cek "room penuh" dan "tautan tidak berlaku").
- Bagian room lainnya hanya terbaca host dan tamu.
- `roomNotes/{roomId}/{uid}` terbaca pemiliknya, atau lawan **hanya bila** `result.outcome = "win"` dan `result.winnerUid = uid`. `notesSet` terbaca kedua peserta seperti bagian room lainnya.

## 3. Nilai turunan (tidak disimpan, dihitung di klien)

| Nilai | Cara menghitung |
|---|---|
| Status room | `menunggu`: belum ada `guestUid`. `siap`: ada tamu, belum ada `battle`. `berjalan`: ada `battle`, belum ada `result`. `selesai`: ada `result`. `kedaluwarsa`: `now > expiresAt` dan belum ada `battle`. |
| Total poin | jumlah `delta` di `users/{uid}/history` |
| Gelar | ambang tertinggi yang terlewati (tabel di `keputusan-aturan.md` bagian 9) |
| Menang / seri / kalah | jumlah `outcome` di `history` |
| Total waktu fokus | jumlah `focusMin` di `history` |
| "Terakhir: menang lawan X" | entri `history` dengan `at` terbesar |
| Penanda room `#XXXX` | 4 karakter terakhir `roomId`, huruf kapital. Hanya tampilan |
| Notes 1/2, 2/2 | jumlah `notesSet/{uid}` yang bernilai true |
| Sisa waktu Arena | `startedAt + durationMin * 60000 - serverNow` |
| Check-In aktif | indeks `i` dengan `T <= serverNow <= T + 20 detik` |

`opponentName` tidak bisa diverifikasi rules. Ini aman karena hanya memengaruhi tampilan Dasbor milik pemiliknya sendiri.

## 4. Kontrak services (dipakai mock dan Firebase)

Semua fungsi `async`, kecuali `listen*` yang mengembalikan fungsi `unsubscribe`.

```js
// auth
signUp({ name, email, password })      // -> { uid, name }
signIn({ email, password })            // -> { uid, name }
signOut()
onAuthChange(callback)                 // -> unsubscribe

// profil
getProfile(uid)                        // -> { name, createdAt, points, tier, nextTier, wins, draws, losses,
                                       //      totalFocusMin, lastMatch } (dihitung src/domain/profile.js)

// room
createRoom({ durationMin = 25, mode }) // -> roomId; mode "demo" memaksa durasi demo dan menulis meta.mode
openRoom(roomId)                       // -> 'host_lobby' | 'guest_lobby' | 'arena' | 'result' | 'full' | 'invalid'
                                       //    (tabel di keputusan-aturan.md bagian 7; tamu baru ikut dicatat)
setDuration(roomId, durationMin)       // host saja, sebelum battle
setNotes(roomId, text)                 // roomNotes + notesSet dalam satu update
requestStart(roomId)                   // host: "Mulai Adu Fokus"
cancelStart(roomId)                    // siapa pun: "Batal" di Konfirmasi
confirmReady(roomId)                   // "Aku siap"
startBattle(roomId)                    // host saja, dipanggil otomatis saat kedua ready true
setPresence(roomId, online)            // presence/{uid}; Firebase juga memasang onDisconnect di sini
answerCheckIn(roomId, index)
forfeit(roomId)                        // keluar sengaja = kalah
claimResult(roomId, result)            // dipanggil saat referee.js menyatakan battle selesai
applyPoints(roomId)                    // menulis history milik sendiri
listenRoom(roomId, callback)           // -> unsubscribe, callback menerima isi room ditambah room.notes
                                       //    berisi Notes yang boleh dibaca (referee.mergeReadableNotes).
                                       //    Bukan peserta hanya menerima meta dan guestUid.
getServerOffset()                      // -> ms, selisih jam server dan perangkat

// Belajar Mandiri [USULAN], lihat docs/usulan-firebase-v1.3.md bagian 4
saveSoloSession(entry)                 // users/{uid}/solo/{id} = { technique, focusMin, startedAt, endedAt, completed } -> id
listSoloSessions()                     // -> { [id]: entry } milik pengguna yang masuk
```

Galat memakai `ServiceError` dengan `code` yang sama untuk mock dan Firebase (`src/services/errors.js`).

Mock juga menyediakan panel dev untuk mensimulasikan lawan: bergabung, siap, terputus, kembali, melewatkan Check-In, dan keluar.

## 5. Pemetaan ke skema MySQL

Skema MySQL versi 2 (`docs/erd/v2/skema.md`, 26 Nov 2026) sudah disamakan dengan struktur ini. Pemetaan lengkapnya ada di skema.md bagian 5.

| ERD | Realtime Database | Catatan |
|---|---|---|
| `pengguna(uid, nama, email, dibuat_pada)` | `users/{uid}/profile` | Email hanya disimpan di Firebase Auth |
| `tier(id_tier, nama_tier, poin_minimum)` | `src/config/gameRules.js` | Konstanta, bukan data |
| `room(id_room, uid_pembuat, mode, durasi_menit, dibuat_pada, ...)` | `rooms/{roomId}/meta` | Tanpa kode undangan (lihat di bawah) |
| `room.status` | dihitung (bagian 3) | Tidak disimpan supaya tidak bisa tidak sinkron |
| `room.waktu_mulai` | `battle/startedAt` | |
| `room.waktu_selesai`, `alasan_hasil` | `result/at`, `result/reason` | |
| `peserta_room(id_room, uid, notes, siap)` | `meta.hostUid`, `guestUid`, `roomNotes/{roomId}/{uid}`, `ready/{uid}` | Notes dipisah supaya rahasia |
| `peserta_room.hasil`, `poin_didapat` | `result` + `users/{uid}/history/{roomId}` | |
| `check_in(id_room, urutan, waktu_jadwal)` | `battle/checkIns/{i}/offsetMs` | `waktu_jadwal = startedAt + offsetMs` |
| `respons_check_in(id_room, urutan, uid, waktu_respons)` | `responses/{uid}/{i}` | |
| `sesi_mandiri(id_sesi, uid, teknik, menit_fokus, ...)` | `users/{uid}/solo/{id}` | |
| (tidak ada) | `presence/{uid}`, `startRequested` | Status sementara, sengaja tidak dimodelkan |

**Kode undangan:** dihapus dari skema MySQL versi 2. Keputusannya adalah memakai `roomId` dari push key Firebase (20 karakter) langsung di tautan, tanpa kode 6 karakter. Alasannya, kode 6 karakter bisa ditebak, sehingga orang asing bisa masuk ke room orang lain. Push key praktis tidak bisa ditebak. Konsekuensinya, room hanya bisa dimasuki lewat tautan, tidak dengan mengetik kode.

## 6. Status rules

Butir 1 sampai 7 di bawah (kebutuhan v1.1) sudah diterapkan di `database.rules.json` dan diuji `tests/rules.test.js`. Tambahan 25 Nov (audit back-end, `docs/audit-backend.md`):

- Room kedaluwarsa (`now > meta/expiresAt`) mengunci `meta/durationMin`, `notes`, `startRequested: true`, `ready`, dan `battle`, sama dengan status `kedaluwarsa` di bagian 3. Batal (`startRequested: false`) tetap boleh.
- `result` hanya menerima field di bagian 1; field lain ditolak.

Tambahan v1.3: `roomNotes` dan `notesSet` (skenario 11), cabang demo di `meta.mode`, `durationMin`, dan `offsetMs`, serta `history` ditolak untuk room demo.

Kebutuhan v1.1:

1. `meta/durationMin` boleh ditulis ulang oleh host selama `battle` belum ada.
2. Node `startRequested`: host boleh menulis true (bila `guestUid` ada dan kedua Notes terisi), peserta mana pun boleh menulis false, sebelum `battle` ada.
3. `ready/{uid}` hanya boleh true saat `startRequested = true`. Saat Batal, `ready` boleh dihapus pemiliknya.
4. `notes/{uid}`: panjang 1 sampai 140 (sekarang maksimal 280 dan boleh kosong).
5. `battle` hanya boleh ditulis bila kedua `notes` terisi dan kedua `ready` true.
6. `history/{roomId}`: validasi `outcome` dan `focusMin` terhadap `result` dan `battle/startedAt`, `opponentName` string 1 sampai 60, `at = now`.
7. Tes Emulator untuk skenario 15 dan 16 di `keputusan-aturan.md`.

## 7. Berkas terkait

- `database.rules.json`: rules yang memeriksa semua batasan di bagian 2.
- `tests/rules.test.js`: tes Emulator. Cara menjalankan: `npm i -D firebase-tools @firebase/rules-unit-testing firebase vitest`, lalu `npx firebase emulators:exec --only database "npx vitest run"` (butuh Java).
- `src/domain/referee.js`: logika wasit murni dengan aturan yang sama.
