# Usulan untuk struktur-data v1.3

> **Status 25 November 2026:** bagian 1 (Notes rahasia), 2 (Batal), dan 3 (mode demo, pilihan rules) disetujui Naufal dan sudah diterapkan di `struktur-data.md` v1.3, rules, services, dan mock. Bagian 4 butir 1 (poin Belajar Mandiri) masih [TERBUKA].

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

## 4. Belajar Mandiri (dikodekan 24 November 2026; poin [TERBUKA])

Sudah dikodekan dengan nilai **[USULAN]** di `SOLO_RULES` (`src/config/gameRules.js`) dan logika di `src/domain/solo.js`:

- Teknik dari Figma M11: Pomodoro 25/5 x 4, Fokus panjang 50/10 x 2, Satu blok 15/25/45/60 tanpa istirahat.
- Sesi berjalan disimpan per tab (`sessionStorage`), baru ditulis ke database saat berakhir.
- Tercatat saat: semua putaran selesai (`completed: true`), Akhiri sesi atau meninggalkan halaman (`completed: false`), atau Check-In terlewat (`completed: false`, menit dihitung sampai Check-In dibuka). Sesi di bawah 1 menit tidak dicatat.
- Data: `users/{uid}/solo/{sessionId}: { technique, focusMin, startedAt, endedAt, completed }`.

Yang masih perlu diputuskan:

1. **Poin [TERBUKA].** Diputuskan kelompok 24 Nov: Belajar Mandiri **memberi poin**, besarnya belum diputuskan (usulan Naufal: 1 jam = 1 poin, duel dua kali lipat). Kode saat ini masih tanpa poin dan Figma masih menulis "TANPA POIN" dan "Tidak ada poin dan gelar". Setelah angkanya ada: ubah `SOLO_RULES.awardsPoints`, teks chip dan subjudul M10/D07, serta cara `getProfile` menjumlahkan poin.
2. **Rules** untuk `users/{uid}/solo`: hanya pemilik; `technique` salah satu dari tiga; `focusMin` bilangan bulat dan tidak melebihi `(endedAt - startedAt) / 60000`; `endedAt <= now`. Mock sudah memeriksa hal yang sama.
3. Catatan Perubahan resmi di `docs/resmi/` (Charter dan WBS 2.2.2 masih menyebut "hanya didesain").

## 5. Draf database.rules.json (24 November 2026)

`database.rules.json` sudah ditulis dari struktur-data v1.2 dan diuji `tests/rules.test.js` (`npm run test:rules`). Mohon Naufal tinjau sebelum deploy. Catatan:

- **Notes masih terbaca lawan** karena `.read` room berjenjang. Skenario 11 ditandai `todo` sampai bagian 1 di atas diputuskan.
- Batal menghapus seluruh `ready` (bagian 2 di atas sudah diterapkan di rules).
- `meta.mode` ditolak, jadi mode demo hanya di mock (bagian 3).
- Wasit di rules: klaim `missed_checkin` menang hanya diterima bila pemenang sudah menjawab Check-In itu, dan vonis untuk pemain yang terputus di jendela Check-In ditunda sampai toleransinya habis. Urutan beberapa Check-In tidak bisa dicek rules (rules tidak bisa mengulang data).
- Angka aturan ditulis ulang di rules; `tests/rulesConfig.test.js` gagal bila berbeda dengan `gameRules.js`.
- `presence.lastSeen` dibatasi `<= now`, bukan `=== now`, supaya `onDisconnect` tetap lolos.

## 6. Cara menguji services

`npm run test:emulator` menjalankan `tests/firebase.integration.test.js` (alur daftar, room, Notes, siap, battle, keluar Arena, poin) di Emulator dengan `database.rules.json` (sejak 25 Nov; sebelumnya rules terbuka `tests/emulator/open.rules.json`, kini tidak dipakai). `firebase.emulator.json` tetap terpisah dari `firebase.json` karena berisi pengaturan Emulator.
