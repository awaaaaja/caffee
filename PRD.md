# PRD.md — Boulalulue Digital Café Experience

## 1. Ringkasan

Boulalulue adalah café & restaurant (viennoiserie, coffee, food) yang saat ini belum punya website resmi yang merepresentasikan brand-nya dengan baik. Project ini membangun **website publik cinematic + admin CMS** agar tim Boulalulue bisa mengelola menu, galeri, konten homepage, dan reservasi tanpa bergantung pada developer untuk setiap perubahan konten.

## 2. Tujuan (Goals)

1. Menghadirkan pengalaman digital yang setara dengan positioning brand: *warm, premium, editorial, cinematic* — bukan "website coffee shop template".
2. Menu lengkap (food + beverage + viennoiserie) tersaji rapi, mudah difilter, dan **selalu sinkron dengan data di Supabase** (tidak ada harga yang basi karena hardcode).
3. Memudahkan pelanggan reservasi meja secara online dengan alur yang jelas dan konfirmasi otomatis.
4. Memberikan tim Boulalulue admin panel yang powerful tapi sederhana untuk mengelola menu, galeri, homepage, dan reservasi sendiri.
5. Performa dan SEO baik agar mudah ditemukan calon pelanggan di Padang.

## 3. Non-Goals (Out of Scope untuk versi ini)

- Online payment / e-commerce checkout (reservasi ≠ pemesanan online berbayar di fase ini).
- Sistem loyalty/membership.
- Aplikasi mobile native.
- Integrasi POS internal Boulalulue.
- Multi-bahasa (ID hanya di fase 1; EN bisa fase berikutnya).

## 4. Target Pengguna

| Persona | Kebutuhan |
|---|---|
| Calon pelanggan (browsing) | Lihat menu & harga, suasana café, lokasi, jam buka, cara reservasi |
| Pelanggan yang mau reservasi | Form reservasi cepat, konfirmasi jelas |
| Tim Boulalulue (admin/staff) | Update menu & harga sendiri, kelola galeri, kelola reservasi harian, atur konten homepage tanpa minta bantuan developer |
| Super admin (owner/manajer) | Full control atas semua data, user, dan pengaturan situs |

## 5. Fitur — Website Publik

### 5.1 Hero
Full-screen visual café, headline (`BOULALULUE — Baked with precision. Served with grace.`), CTA `Explore Menu` + `Reserve a Table`, navbar transparan → solid saat scroll, subtle floating/steam animation.

### 5.2 Brand Story / About
Cerita singkat brand, statistik (mis. `Since <tahun>`, jumlah menu, rating), foto interior dengan reveal animation.

### 5.3 Signature Menu (homepage)
6 item pilihan (3 food + 3 beverage) — dikelola dari admin, bukan hardcode.

### 5.4 Menu Experience (`/menu`)
- Filter interaktif: Food / Coffee / Milk Based / Refreshing / Tea / Frappe / Viennoiserie.
- Card menu dengan foto, nama, deskripsi singkat, harga.
- Detail modal per item (deskripsi lengkap, varian jika ada, add-on relevan).
- Semua data dari tabel `menu_items` + `categories` + `menu_variants` + `menu_addons` via Supabase.

### 5.5 Viennoiserie Section
Highlight kategori pastry/croissant sebagai identitas brand (bukan coffee-only).

### 5.6 Coffee/Kitchen Experience (storytelling)
Section scroll-triggered: `Beans → Roasting → Brewing → Served` atau `Prepare → Cook → Plate → Serve`. Konten visual, dikelola sebagian dari `homepage_sections`.

### 5.7 Gallery
Masonry/asymmetric grid, kategori (Interior, Food, Drink, Pastry, People, Exterior), lightbox, dikelola penuh dari admin (upload, reorder, featured, publish).

### 5.8 Location
Peta interaktif (MapLibre + OpenStreetMap), alamat, jam operasional, tombol `Get Directions`. **Catatan sumber data: lihat §8.**

### 5.9 Reservation
Form: nama, telepon, tanggal, jam, jumlah tamu, catatan khusus → tersimpan ke `reservations`, status default `pending`. Konfirmasi UI setelah submit. (Order online / pembayaran di luar scope fase ini.)

### 5.10 Testimonials
Carousel review pelanggan (rating + review card). Sumber data: tabel `reviews`, diinput manual oleh admin di fase awal (belum ada integrasi Google Reviews API otomatis — dicatat sebagai future enhancement).

### 5.11 Footer
Instagram link, kontak, lokasi, jam operasional, newsletter (opsional, minimal: email capture ke tabel `newsletter_subscribers` atau layanan pihak ketiga — diputuskan saat sprint terkait).

## 6. Fitur — Admin CMS

| Modul | Kemampuan |
|---|---|
| Dashboard | Ringkasan visitor (jika analytics terpasang), jumlah reservasi hari ini, jumlah menu aktif, menu terpopuler |
| Menu Management | CRUD categories, menu items, harga, variants, add-ons, availability, featured/signature, homepage visibility, sort order |
| Reservations | Lihat, confirm/reject/reschedule/cancel, riwayat status (`reservation_status_logs`) |
| Gallery | Upload, kategori, drag & drop reorder, set featured, publish/unpublish |
| Homepage CMS | Edit Hero (title, subtitle, background image, CTA), Signature Menu (pilih dari menu items), Brand Story, Gallery pilihan homepage, Reservation CTA copy |
| Location | Edit alamat, koordinat, jam operasional, link Google Maps |
| Reviews | CRUD testimonial manual |
| Users & Roles | Kelola akun staff/admin, assign role |
| Settings | Site-wide settings (`site_settings`): nama brand, social links, SEO default, dsb |

## 7. Role & Permission (ringkas — detail RLS di `PLAN.md`)

- **super_admin**: akses penuh semua modul termasuk Users & Settings.
- **admin**: Menu, Gallery, Reservation, Homepage, Location, Reviews (tanpa Users/Settings).
- **staff**: Reservation (confirm/reject) + Menu availability toggle saja.
- **public**: read-only ke data yang dipublish (`is_available=true`, `published=true`).

## 8. Open Data Questions — WAJIB diverifikasi sebelum production

Beberapa data di sumber dokumen belum sepenuhnya bisa dijadikan source of truth:

1. **Alamat & koordinat pasti serta jam operasional resmi** — indikasi awal: Jl. Jaksa Agung R. Soeprapto No. 29, Padang, konsep tiga lantai, namun ini harus dikonfirmasi langsung ke pihak Boulalulue sebelum ditampilkan sebagai fakta final di `/location`.
2. **Harga add-on makanan** (Sambal Matah, Rica-Rica, Blackpepper, dressing, Rice, Kerupuk Emping) — hasil ekstraksi PDF tidak sepenuhnya aman untuk diasumsikan pasangan harganya. Hanya add-on minuman (Oatmilk 8K, Extra Shot 13K, Mineral Water 5K, Cheese Foam 6K) yang aman di-seed.
3. **Daftar lengkap viennoiserie/pastry** (Butter Croissant, Almond Croissant, Pain Suisse, Ribbon Croissant, Pain au Choco, dll) dan harganya — perlu diverifikasi terhadap menu resmi terbaru, karena disebut sebagai kategori brand namun belum ada di JSON seed detail.
4. **Foto & aset visual resmi** — belum ada aset final dari Boulalulue; gallery awal akan pakai placeholder yang ditandai jelas.

Selama data ini belum terverifikasi, tampilkan sebagai draft/placeholder di admin (bukan langsung live di publik) sesuai `AGENTS.md` §4.

## 9. Non-Functional Requirements

- **Performance**: Lighthouse Performance ≥ 85 (mobile), LCP < 2.5s untuk hero image (gunakan lazy-load + responsive image + preconnect Supabase Storage).
- **SEO**: Meta title/description per halaman, Open Graph image, structured data `Restaurant`/`LocalBusiness` (schema.org) begitu data lokasi terverifikasi.
- **Accessibility**: kontras warna sesuai WCAG AA (perlu dicek khusus untuk teks di atas glass panel), `alt` text semua gambar menu/gallery, keyboard-navigable modal & form.
- **Responsive**: mobile-first, breakpoint detail di `DESIGN.md`.
- **Security**: RLS aktif di semua tabel, validasi form ganda (client + DB constraint).

## 10. Metrik Sukses (indikatif)

- Waktu untuk menemukan menu dari homepage ≤ 2 klik/tap.
- Reservasi berhasil submit tanpa error di ≥ 95% percobaan (uji manual + form validation).
- Admin bisa mengubah 1 item menu (harga/foto) tanpa bantuan developer dalam < 2 menit.
- Skor Lighthouse mobile ≥ 85 di halaman Home dan Menu.
