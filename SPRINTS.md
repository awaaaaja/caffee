# SPRINTS.md — Boulalulue (10 Sprint)

Setiap sprint punya: **Tujuan**, **Deliverables**, **Checkpoint kerja**, **Acceptance Criteria**. Agent wajib memenuhi Acceptance Criteria sebelum sprint dianggap selesai. Urutan sprint mengikuti fase di `PLAN.md`: Foundation → Public Site → Backend/Data → Public Site lanjutan → Admin → QA/Launch (disusun ulang agar backend tersedia lebih awal supaya frontend publik bisa langsung connect ke data asli, bukan dummy).

---

## Sprint 01 — Project Setup & Brand Foundation

**Tujuan:** Skeleton project siap, design token & komponen dasar terpasang sesuai `DESIGN.md`.

**Deliverables:**
- Repo Vue 3 + Vite + TypeScript + Tailwind terinisialisasi, struktur folder sesuai `PLAN.md` §5.
- `tailwind.config.ts` berisi semua color token (`espresso`, `deep-brown`, `terracotta`, `warm-clay`, `cream`, `ivory`, `gold`, `muted-gold`) + font family (serif & sans).
- `src/assets/styles/glass.css` berisi `.glass-panel` dan `.glass-nav` sesuai spesifikasi §4 `DESIGN.md`.
- Komponen dasar `ui/`: `BaseButton.vue` (primary/secondary/outline), `GlassPanel.vue`, `SectionHeading.vue`.
- Router dasar dengan semua route publik (kosong/placeholder) + route `/admin/login` placeholder.
- ESLint + Prettier terpasang, `npm run build` sukses tanpa error.

**Acceptance Criteria:**
- [ ] `npm run dev` jalan tanpa error.
- [ ] Semua token warna di `DESIGN.md` bisa dipakai lewat class Tailwind (`bg-cream`, `text-espresso`, dst).
- [ ] `BaseButton` punya 3 varian sesuai `DESIGN.md` §5.4.
- [ ] Glass panel diuji visual di atas foto placeholder — transparan terhadap gambar, bukan panel putih pekat.

---

## Sprint 02 — Database Schema & RLS

**Tujuan:** Seluruh schema di `PLAN.md` §4 hidup di Supabase project `boulalulue-dev`, RLS aktif dan diuji per role.

**Deliverables:**
- Migration SQL (`supabase/migrations/`) untuk semua tabel: `categories`, `menu_items`, `menu_variants`, `menu_addons`, `menu_item_addons`, `gallery`, `homepage_sections`, `homepage_signature_items`, `homepage_gallery_picks`, `locations`, `site_settings`, `reservations`, `reservation_status_logs`, `reviews`, `profiles`.
- RLS policy publik read + admin/super_admin write sesuai `PLAN.md` §7.
- RPC function `toggle_menu_availability(item_id uuid, available boolean)` untuk role staff.
- Storage bucket dibuat: `menu`, `gallery`, `hero`, `logo`, `branding` dengan policy upload terbatas role admin+.
- Seed kategori + addon minuman terverifikasi (`PLAN.md` §4.7).

**Acceptance Criteria:**
- [ ] Semua tabel punya RLS `ENABLE ROW LEVEL SECURITY`.
- [ ] Test manual: user `public` (anon) hanya bisa SELECT data yang `is_available/is_published = true`.
- [ ] Test manual: user role `staff` gagal UPDATE harga langsung via table policy, tapi berhasil lewat RPC availability.
- [ ] Test manual: user role `admin` berhasil CRUD menu & gallery, gagal akses tabel `profiles`/`site_settings` write.
- [ ] `supabase gen types typescript` berhasil menghasilkan `src/types/database.ts`.

---

## Sprint 03 — Menu Data Pipeline & Seed Verifikasi

**Tujuan:** Data menu lengkap (yang sudah diverifikasi) masuk ke database lewat pipeline yang bisa diulang, bukan insert manual sekali pakai.

**Deliverables:**
- `data/menu.seed.json` — hasil konsolidasi menu terverifikasi (format sesuai contoh di dokumen sumber project).
- Script `supabase/seed/generate-menu-sql.ts` yang membaca `menu.seed.json` → menghasilkan `menu_items.sql` (idempotent, pakai `on conflict (slug) do update`).
- Item yang datanya belum terverifikasi (viennoiserie detail, harga add-on makanan) ditandai `TODO_VERIFY: true` di JSON dan **tidak** ikut ke-generate ke SQL production sampai dikonfirmasi.
- Dokumentasi singkat cara re-run seed saat ada update menu dari tim Boulalulue.

**Acceptance Criteria:**
- [ ] Menjalankan script seed dua kali berturut-turut tidak menghasilkan duplikat data.
- [ ] Semua item di `menu.seed.json` yang berstatus terverifikasi berhasil masuk ke tabel `menu_items` dengan `category_id` yang benar.
- [ ] Item `TODO_VERIFY` **tidak muncul** di query publik.

---

## Sprint 04 — Navbar, Hero & Motion System

**Tujuan:** Homepage skeleton hidup dengan sistem animasi inti (Lenis + GSAP ScrollTrigger) yang akan dipakai di seluruh situs.

**Deliverables:**
- `useGsap.ts`, `useScrollReveal.ts`, `useReducedMotion.ts` composables.
- `Lenis` diinisialisasi global di `App.vue`, disinkron dengan `ScrollTrigger`.
- `Navbar.vue` dengan 3 state (transparent/glass/compact) sesuai `DESIGN.md` §5.1, responsive mobile (hamburger + overlay full-screen).
- `Hero.vue` dengan urutan reveal sesuai `DESIGN.md` §5.2, CTA `Explore Menu` + `Reserve a Table` menuju route terkait.
- Subtle floating particle effect di hero (opsional, sangat minim).

**Acceptance Criteria:**
- [ ] Scroll di homepage terasa smooth (Lenis aktif), tidak ada jank terlihat.
- [ ] Navbar berubah state sesuai posisi scroll (uji di 3 breakpoint).
- [ ] Hero reveal sequence sesuai urutan yang ditentukan, dapat direplay saat reload.
- [ ] `prefers-reduced-motion: reduce` di OS mematikan animasi non-esensial (test lewat DevTools emulation).

---

## Sprint 05 — Menu Page (Public)

**Tujuan:** Halaman `/menu` sepenuhnya connect ke Supabase, filter & detail berfungsi.

**Deliverables:**
- `useMenu.ts` composable: fetch categories + menu items (join), dengan cache sederhana per session.
- `MenuFilter.vue` — tab filter per `group_type`/kategori, animated switching (fade/stagger).
- `MenuCard.vue` sesuai spesifikasi glass card `DESIGN.md` §5.3, hover state lengkap.
- `MenuItemModal.vue` — detail item, variant (jika ada), add-on relevan.
- Loading skeleton & empty state (kategori tanpa item).

**Acceptance Criteria:**
- [ ] Data menu yang tampil 100% dari Supabase, tidak ada hardcode di komponen.
- [ ] Filter kategori berfungsi tanpa reload halaman.
- [ ] Item dengan `is_available = false` tidak tampil di publik.
- [ ] Modal detail bisa dibuka/tutup lewat klik & keyboard (`Esc`).
- [ ] Mobile: menu tampil sebagai horizontal swipe card sesuai `DESIGN.md` §7.

---

## Sprint 06 — Story, Viennoiserie, Kitchen Experience, Gallery

**Tujuan:** Melengkapi narasi brand di homepage & halaman terkait.

**Deliverables:**
- `BrandIntro.vue` (`/story` + section homepage) dengan statistik & reveal image.
- Section Viennoiserie (highlight kategori pastry) — data dari `menu_items` kategori pastry yang `TODO_VERIFY = false`.
- `KitchenExperience.vue` (`/experience`) — storytelling scroll-triggered 4 tahap.
- `GalleryGrid.vue` (masonry asymmetric) + `Lightbox.vue`, data dari tabel `gallery` (`is_published = true`), filter per kategori.

**Acceptance Criteria:**
- [ ] Semua teks/gambar section ini dapat diubah lewat `homepage_sections` (bukan hardcode — akan dites penuh di Sprint 09/10 saat admin CMS ada, tapi struktur data harus siap sekarang).
- [ ] Gallery filter kategori + lightbox berfungsi di desktop & mobile.
- [ ] Scroll-triggered animation di Kitchen Experience terasa terkontrol, tidak norak (uji subjektif terhadap `DESIGN.md` §1 "Dilarang").

---

## Sprint 07 — Location & Reservation

**Tujuan:** Pelanggan bisa melihat lokasi dan melakukan reservasi end-to-end.

**Deliverables:**
- `MapView.vue` (MapLibre + OSM), marker dari tabel `locations`, tombol `Get Directions`.
- Tampilan jam operasional dari `opening_hours` jsonb; jika `is_verified = false`, tampilkan indikator halus "jam dapat berubah, hubungi kami" alih-alih menyembunyikan data.
- `ReservationForm.vue`: validasi client (tanggal ≥ hari ini, guests > 0, phone format) + submit ke `reservations`.
- `ReservationConfirmation.vue`: tampil setelah submit sukses, ringkasan data + opsi tambahkan ke kalender.

**Acceptance Criteria:**
- [ ] Submit form sukses membuat row baru di `reservations` dengan `status = 'pending'`.
- [ ] Validasi client mencegah submit data tidak valid (tanggal lampau, guests 0).
- [ ] Double-submit (klik ganda) tidak menghasilkan 2 row (disable button saat pending request).
- [ ] Map menampilkan marker di koordinat yang benar dan bisa dibuka di Google Maps via `Get Directions`.

---

## Sprint 08 — Testimonials, Footer, SEO & Responsive Polish

**Tujuan:** Halaman publik selesai secara visual & teknis, siap diaudit.

**Deliverables:**
- `ReviewCarousel.vue` — data dari `reviews` (`is_published = true`).
- `Footer.vue` — Instagram, kontak, lokasi, jam, newsletter capture.
- Meta tag per halaman (title/description/OG image), favicon, `robots.txt`, `sitemap.xml` dasar.
- Review responsive penuh di semua breakpoint (`DESIGN.md` §7), termasuk perilaku khusus mobile per section.

**Acceptance Criteria:**
- [ ] Lighthouse Performance mobile ≥ 85 di Home & Menu.
- [ ] Tidak ada horizontal scroll tidak disengaja di breakpoint manapun.
- [ ] Semua gambar punya `alt` text.
- [ ] Meta title/description unik per halaman utama.

---

## Sprint 09 — Admin: Auth, Dashboard, Menu CMS, Gallery CMS

**Tujuan:** Tim Boulalulue bisa login dan mengelola menu + galeri sendiri.

**Deliverables:**
- `useAuth.ts` + `/admin/login` (Supabase Auth email/password) + route guard.
- `Dashboard.vue` — ringkasan reservasi hari ini, jumlah menu aktif, menu populer (query sederhana, bukan analytics eksternal di fase ini).
- `MenuManagement.vue` — CRUD categories, items (termasuk upload gambar ke bucket `menu`), variants, add-ons, toggle availability/featured/signature/homepage visibility.
- `GalleryCms.vue` — upload, kategori, drag & drop reorder (`sort_order`), set featured, publish/unpublish.

**Acceptance Criteria:**
- [ ] Login/logout berfungsi, session persist saat refresh.
- [ ] User role `staff` login dan hanya melihat kontrol availability, tidak bisa edit harga/nama (UI disable + RLS backstop).
- [ ] Upload gambar menu/gallery tersimpan di bucket yang benar dan langsung tampil di publik setelah publish.
- [ ] Reorder drag & drop di gallery ter-persist ke `sort_order` di database.

---

## Sprint 10 — Admin: Reservation, Homepage CMS, Location/Reviews/Users/Settings + QA & Launch

**Tujuan:** Admin panel lengkap, seluruh konten homepage benar-benar headless, situs siap production.

**Deliverables:**
- `ReservationManagement.vue` — list, confirm/reject/reschedule/cancel, log ke `reservation_status_logs`.
- `HomepageCms.vue` — edit Hero, Signature Menu (pilih dari `menu_items`), Brand Story, Gallery picks, Reservation CTA — semua nulis ke `homepage_sections`/`homepage_signature_items`/`homepage_gallery_picks`.
- `LocationSettings.vue`, `Reviews.vue` (CRUD testimonial), `Users.vue` (kelola role, hanya `super_admin`), `Settings.vue` (`site_settings`).
- Final QA: checklist manual desktop/tablet/mobile, cross-browser dasar (Chrome/Safari/Firefox), audit accessibility kontras teks di atas glass, audit RLS ulang dengan 4 role.
- Deployment production: Supabase `boulalulue-prod` + Vercel production domain.

**Acceptance Criteria:**
- [ ] Mengubah konten Hero/Signature Menu di admin langsung berubah di homepage publik tanpa deploy ulang kode.
- [ ] Semua modul admin di §6 `PRD.md` berfungsi sesuai role masing-masing.
- [ ] Checklist QA §12 `PLAN.md` selesai dan tercatat (screenshot/log).
- [ ] Data `TODO_VERIFY` (alamat, jam, harga add-on makanan, detail viennoiserie) sudah dikonfirmasi tim Boulalulue **atau** secara sadar tetap disembunyikan dari publik saat launch.
- [ ] Production URL live, RLS final diuji ulang di environment prod.
