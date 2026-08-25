# PROMPTS.md — Prompt Siap Pakai untuk OpenCode (per Sprint)

Cara pakai: tempel satu blok prompt per sesi agent, jangan gabung beberapa sprint dalam satu prompt. Agent wajib baca `AGENTS.md`, `PRD.md`, `PLAN.md`, `DESIGN.md` sebelum eksekusi apa pun.

---

### Prompt Sprint 01 — Project Setup & Brand Foundation

```
Baca AGENTS.md, PLAN.md §5, dan DESIGN.md secara penuh sebelum mulai.

Kerjakan Sprint 01 dari SPRINTS.md:
1. Inisialisasi project Vue 3 + Vite + TypeScript + Tailwind CSS sesuai struktur folder di PLAN.md §5.
2. Definisikan semua color token dan font family di tailwind.config.ts persis sesuai DESIGN.md §2 dan §3.
3. Buat src/assets/styles/glass.css berisi .glass-panel dan .glass-nav sesuai DESIGN.md §4 — JANGAN pakai pola glass ala dashboard SaaS yang dilarang di dokumen tsb.
4. Buat komponen ui/BaseButton.vue (3 varian: primary, secondary, outline), ui/GlassPanel.vue, ui/SectionHeading.vue.
5. Setup router dengan semua route publik di PLAN.md §2 sebagai placeholder page kosong, plus /admin/login placeholder.
6. Setup ESLint + Prettier.

Jangan install library animasi/state selain yang ada di AGENTS.md §2 (stack terkunci).
Setelah selesai, jalankan npm run build dan laporkan hasilnya. Cek ulang terhadap Acceptance Criteria Sprint 01 di SPRINTS.md sebelum melapor selesai.
```

---

### Prompt Sprint 02 — Database Schema & RLS

```
Baca PLAN.md §4 dan §7 secara penuh sebelum mulai.

Kerjakan Sprint 02 dari SPRINTS.md:
1. Buat migration SQL Supabase untuk semua tabel di PLAN.md §4.1–4.6, persis sesuai skema (nama kolom, tipe, constraint, default).
2. Aktifkan RLS di semua tabel. Implementasikan policy publik read + admin/super_admin write sesuai PLAN.md §7.
3. Buat RPC function toggle_menu_availability(item_id uuid, available boolean) dengan security definer, validasi role staff di dalam function.
4. Buat 5 storage bucket: menu, gallery, hero, logo, branding, dengan policy upload terbatas role admin ke atas.
5. Seed data categories dan menu_addons sesuai PLAN.md §4.7 (HANYA data yang sudah ditandai terverifikasi — jangan tambah data lain).
6. Generate src/types/database.ts lewat supabase gen types typescript.

Setelah migration jalan, buat 4 user test (public/staff/admin/super_admin) dan uji manual sesuai Acceptance Criteria Sprint 02 di SPRINTS.md. Laporkan hasil uji per role secara eksplisit.
```

---

### Prompt Sprint 03 — Menu Data Pipeline & Seed Verifikasi

```
Baca PRD.md §8 (Open Data Questions) dan PLAN.md §4.7 sebelum mulai — ini krusial, jangan diabaikan.

Kerjakan Sprint 03 dari SPRINTS.md:
1. Susun data/menu.seed.json berisi seluruh item menu yang statusnya SUDAH terverifikasi dari data project (kategori Main Course, Croissant Savoury, Pasta, Salad, Sourdough, Sides, Sandwich Sourdough, Sandwich, Pizza, Snack & Share, Dessert, Coffee Based, Milk Based, Refreshing, Tea, Frappe).
2. Item yang BELUM terverifikasi (detail & harga viennoiserie/pastry di luar yang ada di JSON sumber, harga add-on makanan seperti Sambal Matah/Rica-Rica/Blackpepper/dressing/Rice/Kerupuk Emping) beri flag "TODO_VERIFY": true dan JANGAN masukkan ke SQL yang akan di-generate untuk production.
3. Tulis script supabase/seed/generate-menu-sql.ts yang membaca menu.seed.json dan menghasilkan supabase/seed/menu_items.sql idempotent (pakai ON CONFLICT (slug) DO UPDATE).
4. Jalankan seed dua kali berturut-turut untuk membuktikan tidak ada duplikat.
5. Tulis dokumentasi singkat (di README seed) cara re-run seed saat tim Boulalulue update menu.

Jangan mengarang harga atau nama item yang tidak ada di sumber data project. Jika ragu suatu item terverifikasi atau tidak, tandai TODO_VERIFY dan laporkan ke saya, jangan tebak sendiri.
```

---

### Prompt Sprint 04 — Navbar, Hero & Motion System

```
Baca DESIGN.md §5.1, §5.2, §8 dan PLAN.md §9 sebelum mulai.

Kerjakan Sprint 04 dari SPRINTS.md:
1. Buat composable useGsap.ts, useScrollReveal.ts, useReducedMotion.ts.
2. Inisialisasi Lenis secara global di App.vue, sinkronkan dengan ScrollTrigger.update via requestAnimationFrame.
3. Bangun Navbar.vue dengan 3 state (transparent → glass → compact) persis sesuai DESIGN.md §5.1, termasuk versi mobile (hamburger + overlay full-screen).
4. Bangun Hero.vue dengan urutan reveal: Logo fade → Navbar slide → Headline reveal (clip-path) → Description reveal → CTA reveal → Hero image scale 1.08 → 1. CTA "Explore Menu" mengarah ke /menu, "Reserve a Table" mengarah ke /reservation.
5. Tambahkan efek floating particle sangat subtle di hero (opacity rendah, jumlah sedikit) — jangan sampai jadi elemen utama.

Semua animasi non-esensial wajib mengecek useReducedMotion dan fallback ke transisi sederhana jika prefers-reduced-motion aktif. Uji dan laporkan hasil di 3 breakpoint (mobile/tablet/desktop) sesuai Acceptance Criteria Sprint 04.
```

---

### Prompt Sprint 05 — Menu Page (Public)

```
Baca PRD.md §5.4, DESIGN.md §5.3, dan PLAN.md §4.1 sebelum mulai.

Kerjakan Sprint 05 dari SPRINTS.md:
1. Buat composable useMenu.ts yang fetch categories + menu_items (join, filter is_available = true) dari Supabase, dengan cache sederhana per session.
2. Buat MenuFilter.vue — tab filter per group_type/kategori dengan animasi switching (fade/stagger), tanpa reload halaman.
3. Buat MenuCard.vue persis sesuai spesifikasi glass card di DESIGN.md §5.3 (layout, hover state: image scale 1.04, translateY(-6~-8px), border gold opacity naik, price reveal, arrow reveal).
4. Buat MenuItemModal.vue — detail item, variants (jika ada), add-on relevan (join lewat menu_item_addons), dapat dibuka/tutup via klik dan tombol Esc.
5. Tambahkan loading skeleton dan empty state untuk kategori tanpa item.
6. Pastikan mobile menampilkan menu sebagai horizontal swipe card sesuai DESIGN.md §7.

JANGAN hardcode data menu apa pun di komponen — semua wajib dari Supabase. Verifikasi ulang terhadap Acceptance Criteria Sprint 05 sebelum melapor selesai.
```

---

### Prompt Sprint 06 — Story, Viennoiserie, Kitchen Experience, Gallery

```
Baca PRD.md §5.2, §5.5, §5.6, §5.7 dan DESIGN.md §6 sebelum mulai.

Kerjakan Sprint 06 dari SPRINTS.md:
1. Bangun BrandIntro.vue untuk section homepage dan halaman /story, dengan statistik dan reveal image (data teks sementara dari homepage_sections dengan section_key terkait, siapkan struktur agar nanti bisa diedit dari admin CMS).
2. Bangun section Viennoiserie yang menampilkan menu_items berkategori pastry dengan TODO_VERIFY = false saja.
3. Bangun KitchenExperience.vue (/experience) — storytelling scroll-triggered 4 tahap (Prepare/Cook/Plate/Serve atau Beans/Roasting/Brewing/Served), pakai useScrollReveal dari Sprint 04.
4. Bangun GalleryGrid.vue dengan layout asymmetric masonry sesuai DESIGN.md §6, plus Lightbox.vue, data dari tabel gallery (is_published = true), dengan filter kategori (interior/food/coffee/pastry/people/exterior).

Pastikan tidak ada animasi yang masuk kategori "dilarang" di DESIGN.md §1 dan §8. Uji gallery + lightbox di desktop dan mobile sebelum melapor selesai.
```

---

### Prompt Sprint 07 — Location & Reservation

```
Baca PRD.md §5.8, §5.9, PLAN.md §10 sebelum mulai.

Kerjakan Sprint 07 dari SPRINTS.md:
1. Bangun MapView.vue menggunakan MapLibre GL JS + tile OpenStreetMap, marker dari tabel locations, tombol "Get Directions" membuka google_maps_url di tab baru.
2. Tampilkan jam operasional dari opening_hours (jsonb). Jika locations.is_verified = false, tampilkan indikator halus semacam "Jam dapat berubah, hubungi kami untuk konfirmasi" — JANGAN tampilkan data seolah pasti final.
3. Bangun ReservationForm.vue: field nama, telepon, tanggal, jam, jumlah tamu, catatan. Validasi client: tanggal ≥ hari ini, guests > 0, format telepon valid. Disable tombol submit saat request sedang berjalan untuk mencegah double-submit.
4. Bangun ReservationConfirmation.vue yang tampil setelah submit sukses, berisi ringkasan data reservasi dan opsi "Add to Calendar".

Uji: submit sukses membuat row baru di reservations dengan status pending, submit ganda cepat tidak menghasilkan duplikat, dan validasi menolak input tidak valid. Laporkan hasil uji ini secara eksplisit.
```

---

### Prompt Sprint 08 — Testimonials, Footer, SEO & Responsive Polish

```
Baca PRD.md §5.10, §5.11, §9 sebelum mulai.

Kerjakan Sprint 08 dari SPRINTS.md:
1. Bangun ReviewCarousel.vue dari tabel reviews (is_published = true), animated carousel, tampilkan rating dan review text.
2. Bangun Footer.vue: link Instagram, kontak, lokasi, jam operasional, newsletter email capture sederhana.
3. Tambahkan meta title/description unik + Open Graph image per halaman utama, favicon, robots.txt, sitemap.xml dasar.
4. Review dan perbaiki responsive di semua breakpoint (DESIGN.md §7) untuk seluruh halaman yang sudah dibangun sampai Sprint 07 — pastikan tidak ada horizontal scroll tidak disengaja.
5. Pastikan semua gambar punya alt text yang deskriptif.

Setelah selesai, jalankan audit Lighthouse (mobile) di halaman Home dan Menu, target skor Performance ≥ 85. Laporkan hasil skor dan perbaikan yang dilakukan jika belum tercapai.
```

---

### Prompt Sprint 09 — Admin: Auth, Dashboard, Menu CMS, Gallery CMS

```
Baca PRD.md §6, §7, PLAN.md §6 dan §7 sebelum mulai.

Kerjakan Sprint 09 dari SPRINTS.md:
1. Buat useAuth.ts (Supabase Auth email/password) dan halaman /admin/login, plus route guard yang mengecek sesi + role dari tabel profiles.
2. Buat Dashboard.vue: ringkasan reservasi hari ini, jumlah menu aktif, menu terpopuler (query langsung, tanpa layanan analytics eksternal untuk fase ini).
3. Buat MenuManagement.vue: CRUD categories, menu items (termasuk upload gambar ke bucket "menu"), variants, add-ons; toggle availability/featured/signature/homepage visibility.
4. Buat GalleryCms.vue: upload gambar ke bucket "gallery" per kategori, drag & drop reorder yang menyimpan ke kolom sort_order, set featured, publish/unpublish.
5. Terapkan UI-level restriction untuk role staff (hanya kontrol availability terlihat) sebagai lapisan tambahan di atas RLS — bukan pengganti RLS.

Uji dengan akun role berbeda (staff vs admin) sesuai Acceptance Criteria Sprint 09 di SPRINTS.md, dan pastikan setiap perubahan di admin langsung terlihat di data yang dikonsumsi halaman publik (tanpa perlu deploy ulang).
```

---

### Prompt Sprint 10 — Admin Lanjutan, QA & Launch

```
Baca PRD.md §6, §8, PLAN.md §11 dan §12 sebelum mulai. Ini sprint terakhir — kerjakan dengan disiplin checklist tinggi.

Kerjakan Sprint 10 dari SPRINTS.md:
1. Buat ReservationManagement.vue: list reservasi, aksi confirm/reject/reschedule/cancel, tiap perubahan status dicatat ke reservation_status_logs.
2. Buat HomepageCms.vue yang menulis ke homepage_sections, homepage_signature_items, homepage_gallery_picks — pastikan field Hero (title, subtitle, background image, CTA), Signature Menu (pilih dari menu_items existing), Brand Story, Gallery picks, dan Reservation CTA semuanya benar-benar mengubah tampilan homepage publik secara real-time (tanpa deploy ulang kode).
3. Buat LocationSettings.vue, Reviews.vue (CRUD testimonial), Users.vue (khusus super_admin, kelola role), Settings.vue (site_settings).
4. Jalankan checklist QA manual: desktop/tablet/mobile, Chrome/Safari/Firefox dasar, kontras teks di atas glass panel (WCAG AA), dan uji ulang RLS dengan 4 role di environment yang mendekati production.
5. Siapkan deployment ke Supabase project boulalulue-prod dan Vercel production. Migration lewat Supabase CLI, TIDAK ADA perubahan schema manual langsung di dashboard production.
6. Sebelum go-live, konfirmasi ulang ke saya (Haikal) status semua data TODO_VERIFY dari PRD.md §8 — jangan publish data yang belum saya konfirmasi sebagai fakta final.

Laporkan hasil checklist QA secara eksplisit item per item sebelum menyatakan sprint ini selesai.
```
