# Logo FokusBareng — "Siapa Lengah"

Dua layar ponsel yang saling condong. Layar kiri (amber) masih melek dan melirik lawan,
layar kanan (abu) terpejam. Yang lengah kalah. Di wordmark, huruf **o** jadi mata amber
yang melirik ke depan.

## Isi folder
| File | Pakai untuk |
|---|---|
| `fokusbareng-horizontal-*.svg` | Header web, slide, poster (lockup utama) |
| `fokusbareng-stacked-*.svg` | Ruang sempit/persegi: banner expo, sampul |
| `fokusbareng-symbol-*.svg` | Simbol saja, ≥ 48 px |
| `fokusbareng-symbol-small-*.svg` | Simbol < 48 px (lubang lebih besar, kemiringan lebih kecil) |
| `fokusbareng-wordmark-*.svg` | Nama saja, jika simbol sudah tampil di dekatnya |
| `fokusbareng-app-icon.svg`, `fokusbareng-favicon.svg` | Ikon aplikasi dan tab peramban |
| `png/` | PNG transparan 1024/1200 px untuk slide dan dokumen |
| `web/` | favicon.ico, favicon.svg, apple-touch-icon, icon-192/512, maskable, site.webmanifest, head-snippet.html |

Akhiran: `dark` = untuk latar gelap (bawaan), `light` = latar terang,
`black`/`white` = satu warna (cetak, stempel, di atas amber pakai `black`).

## Warna
- Amber `#F5B700` (layar melek, huruf o) dan latar `#0B0B0C` = token Figma Redesign v2.
- Lengah: `#4A4A52` di latar gelap, `#A8A49D` di latar terang, `#7C7C86` khusus favicon/ikon
  (lebih terang supaya tetap terbaca di 16 px). Ketiganya warna baru.
- Teks wordmark: `#F4F2EE` di latar gelap, `#0B0B0C` di latar terang.

## Aturan singkat
- Ruang kosong di sekeliling logo minimal setengah lebar satu layar.
- Lockup horizontal minimal 120 px lebar; favicon memakai versi small.
- Jangan menukar warna kedua layar, membuka mata layar kanan, mengubah kemiringan,
  menambah bayangan/gradasi, atau mengganti o bermata dengan o biasa.

## Pasang di repo (Vite)
1. Salin isi `web/` ke `public/`.
2. Ganti tag favicon lama di `index.html` dengan isi `head-snippet.html`.
3. Logo di header: impor `fokusbareng-horizontal-dark.svg` dari `src/assets/brand/`.

## Catatan
- Huruf dibuat dari Plus Jakarta Sans ExtraBold (OFL, boleh untuk logo) dan sudah jadi path,
  jadi tidak perlu font terpasang.
- Belum ada pengecekan merek dagang; untuk proyek kuliah ini aman, untuk komersial perlu dicek.
- Kemiripan bentuk dua kotak membulat dengan logo Nintendo Switch sudah dikurangi lewat
  kemiringan dan mata terpejam, tapi tetap minta pendapat tim.
