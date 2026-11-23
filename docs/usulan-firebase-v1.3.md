# Usulan untuk struktur-data v1.3 (perlu keputusan Naufal)

23 November 2026. Ditulis saat cicilan pertama `src/services/firebase/`. Services saat ini mengikuti **v1.2 persis**; tidak ada yang di bawah ini sudah dikodekan.

## 1. Notes rahasia butuh penanda publik

Masalah: `notes/{uid}` di bawah `rooms/{id}` ikut terbaca karena `.read` RTDB berjenjang.

Memindahkan Notes ke path rahasia (opsi A `roomNotes/{roomId}/{uid}` atau opsi B `.read` per anak) belum cukup. Lobi menampilkan "Notes 1/2" dan `requestStart` butuh Notes 2/2, jadi klien harus tahu Notes lawan **sudah terisi** tanpa bisa membaca isinya.

Usulan:

```
roomNotes/{roomId}/{uid}: string     1 sampai 140, baca: pemilik, atau lawan bila result.winnerUid = uid
rooms/{roomId}/notesSet/{uid}: true  terbaca kedua peserta, hanya boleh true bila roomNotes/{roomId}/{uid} ada
```

- `setNotes` menulis keduanya dalam satu multi-path update.
- `countNotes` di `referee.js` membaca `notesSet`, bukan `notes`.
- `listenRoom` menambah listener ke Notes pemenang setelah `result` ada, lalu menggabungkannya ke `room.notes` supaya layar Hasil tidak berubah.
- Mock ikut diubah ke bentuk yang sama di hari yang sama.

## 2. Batal menghapus `ready` kedua pemain

Mock dan services Firebase menulis `ready: null` saat Batal, jadi status siap **kedua** pemain hilang. Rules v1.1 butir 3 menyebut "`ready` boleh dihapus pemiliknya". Kalau hanya `ready/{uid}` sendiri yang boleh dihapus, status siap lawan tertinggal `true`, dan battle bisa mulai tanpa lawan menekan "Aku siap" lagi.

Usulan rules: peserta boleh menghapus seluruh `ready` di update yang sama dengan `startRequested: false`.

## 3. Mode demo di Firebase

Services Firebase saat ini **mengabaikan** `?mode=demo` dan membuat room normal (Check-In pertama paling cepat menit ke-4). Untuk demo expo yang pendek, pilih salah satu:

- Rules mengizinkan `meta.mode = "demo"` dengan batas Check-In dan poin sendiri.
- Demo expo memakai mock di satu perangkat dengan panel lawan tiruan.

## 4. Belajar Mandiri (masuk lingkup, sesi dicatat)

Belum bisa dikodekan karena aturannya belum ada di dokumen resmi maupun `keputusan-aturan.md`. Yang perlu ditetapkan:

1. Daftar teknik di layar Pemilihan Teknik beserta durasi fokus dan istirahatnya (misalnya Pomodoro 25/5).
2. Sesi dihitung tercatat kapan: setelah satu putaran fokus selesai, atau juga bila dihentikan di tengah?
3. Apakah sesi mandiri memberi poin dan memengaruhi gelar, atau hanya menambah total waktu fokus?
4. Bentuk data, usulan awal: `users/{uid}/solo/{sessionId}: { technique, focusMin, startedAt, endedAt }`. Rules: hanya pemilik, `focusMin` tidak boleh melebihi `(endedAt - startedAt) / 60000`.
5. Catatan Perubahan di `docs/resmi/` yang memasukkan fitur ini ke lingkup, karena Charter dan CLAUDE.md aturan 11 masih menyebutnya "hanya didesain".

## 5. Cara menguji services

`npm run test:emulator` menjalankan `tests/firebase.integration.test.js` (alur daftar, room, Notes, siap, battle, keluar Arena, poin) di Emulator dengan rules terbuka `tests/emulator/open.rules.json`. Rules terbuka ini **hanya untuk Emulator**; `firebase.emulator.json` sengaja terpisah dari `firebase.json` supaya tidak pernah ter-deploy.
