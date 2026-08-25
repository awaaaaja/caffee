# PLAN.md — Technical Architecture Boulalulue

## 1. Overview Arsitektur

```
                 BOULALULUE
                     │
              Vue 3 + Vite (SPA)
                     │
        ┌────────────┼────────────┐
        │            │            │
    UI / Tailwind   GSAP        Lenis
        │        (ScrollTrigger)  │
        └────────────┼────────────┘
                     │
                 Supabase
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
    PostgreSQL     Storage       Auth        RLS
        │
   ┌────┴──────┬───────────┬──────────┐
   │           │           │          │
 Menu       Gallery    Homepage   Reservation
                        (CMS)
```

- **Public site** dan **Admin panel** adalah dua route-group di aplikasi Vue yang sama (atau dua app terpisah di monorepo — diputuskan di Sprint 01, default: satu app, admin di bawah `/admin` dengan guard auth).
- Semua konten dinamis (menu, harga, gallery, homepage sections) dibaca lewat Supabase client, tidak ada data statis hardcode di production build kecuali fallback UI (skeleton/error state).

## 2. Sitemap Publik

```
/
├── /                      Homepage
├── /menu                  Menu interaktif (filter: Food/Coffee/Milk/Refreshing/Tea/Frappe/Viennoiserie)
├── /menu/:categorySlug    Deep link filter kategori (opsional, untuk SEO)
├── /story                 Brand story
├── /experience             Kitchen/coffee experience storytelling
├── /gallery                Gallery masonry + lightbox
├── /location               Peta, alamat, jam buka
└── /reservation             Form reservasi
```

`/menu` didesain sebagai satu halaman interaktif dengan filter tab, bukan satu halaman fisik per kategori — sesuai catatan UX di brief awal.

## 3. Sitemap Admin

```
/admin
├── /admin/login
├── /admin                 Dashboard
├── /admin/menu
│   ├── /admin/menu/categories
│   ├── /admin/menu/items
│   ├── /admin/menu/items/:id
│   ├── /admin/menu/variants
│   └── /admin/menu/addons
├── /admin/reservations
├── /admin/gallery
├── /admin/homepage
│   ├── hero
│   ├── signature
│   ├── story
│   ├── gallery-picks
│   └── reservation-cta
├── /admin/location
├── /admin/reviews
├── /admin/users
└── /admin/settings
```

## 4. Database Schema (PostgreSQL / Supabase)

### 4.1 Tabel inti — menu

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  group_type text not null check (group_type in ('food','beverage','pastry')),
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  price integer not null,
  image_url text,
  is_available boolean default true,
  is_signature boolean default false,
  is_featured boolean default false,
  show_on_homepage boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table menu_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  name text not null,
  price integer,
  created_at timestamptz default now()
);

create table menu_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null,
  created_at timestamptz default now()
);

-- relasi many-to-many: addon mana yang relevan untuk item mana
create table menu_item_addons (
  menu_item_id uuid references menu_items(id) on delete cascade,
  addon_id uuid references menu_addons(id) on delete cascade,
  primary key (menu_item_id, addon_id)
);
```

### 4.2 Gallery

```sql
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  category text not null check (category in ('interior','food','coffee','pastry','people','exterior')),
  caption text,
  is_featured boolean default false,
  is_published boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);
```

### 4.3 Homepage CMS

```sql
create table homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null, -- 'hero' | 'story' | 'reservation_cta' | dst
  title text,
  subtitle text,
  description text,
  image_url text,
  cta_label text,
  cta_url text,
  extra jsonb default '{}'::jsonb, -- fleksibel untuk field khusus tiap section
  updated_at timestamptz default now()
);

-- pilihan signature menu di homepage, terpisah dari is_signature agar admin
-- bisa kurasi urutan tampil tanpa mengubah flag signature global
create table homepage_signature_items (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  sort_order integer default 0
);

-- galeri pilihan yang tampil di homepage, terpisah dari gallery publish penuh
create table homepage_gallery_picks (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references gallery(id) on delete cascade,
  sort_order integer default 0
);
```

### 4.4 Lokasi & pengaturan

```sql
create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude numeric,
  longitude numeric,
  google_maps_url text,
  opening_hours jsonb, -- { "mon": "10:00-22:00", ... }
  is_verified boolean default false, -- lihat PRD §8: false sampai dikonfirmasi
  created_at timestamptz default now()
);

create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
```

### 4.5 Reservasi

```sql
create table reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests integer not null check (guests > 0),
  notes text,
  status text default 'pending' check (status in ('pending','confirmed','rejected','rescheduled','cancelled')),
  created_at timestamptz default now()
);

create table reservation_status_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  old_status text,
  new_status text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);
```

### 4.6 Review & user

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  is_published boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('super_admin','admin','staff')),
  created_at timestamptz default now()
);
```

### 4.7 Seed data awal

Seed **hanya** untuk data yang sudah terverifikasi dari menu asli (lihat `PRD.md` §8):

```sql
insert into categories (name, slug, group_type, sort_order) values
('Main Course', 'main-course', 'food', 1),
('Croissant Savoury', 'croissant-savoury', 'food', 2),
('Pasta Series', 'pasta', 'food', 3),
('Salad', 'salad', 'food', 4),
('Sourdough', 'sourdough', 'food', 5),
('Sides', 'sides', 'food', 6),
('Sandwich Sourdough', 'sourdough-sandwich', 'food', 7),
('Sandwich', 'sandwich', 'food', 8),
('Pizza Series', 'pizza', 'food', 9),
('Snack & Share', 'snack-share', 'food', 10),
('Dessert', 'dessert', 'food', 11),
('Coffee Based', 'coffee-based', 'beverage', 12),
('Milk Based', 'milk-based', 'beverage', 13),
('Refreshing', 'refreshing', 'beverage', 14),
('Tea Series', 'tea', 'beverage', 15),
('Frappe', 'frappe', 'beverage', 16);

insert into menu_addons (name, price) values
('Oatmilk', 8000),
('Extra Shot', 13000),
('Mineral Water', 5000),
('Cheese Foam', 6000);
```

Item menu penuh (Chicken Kiev, Spanish Latte, dst) di-seed lewat script terpisah `supabase/seed/menu_items.sql` yang di-generate dari `data/menu.seed.json` — lihat Sprint 03.

## 5. Struktur Folder Frontend

```
src/
├── assets/
│   ├── images/
│   ├── fonts/
│   └── styles/
│       ├── glass.css
│       └── tokens.css
├── components/
│   ├── layout/
│   │   ├── Navbar.vue
│   │   └── Footer.vue
│   ├── home/
│   │   ├── Hero.vue
│   │   ├── BrandIntro.vue
│   │   ├── SignatureMenu.vue
│   │   ├── KitchenExperience.vue
│   │   └── ReservationCta.vue
│   ├── menu/
│   │   ├── MenuFilter.vue
│   │   ├── MenuCard.vue
│   │   └── MenuItemModal.vue
│   ├── gallery/
│   │   ├── GalleryGrid.vue
│   │   └── Lightbox.vue
│   ├── location/
│   │   └── MapView.vue
│   ├── reservation/
│   │   ├── ReservationForm.vue
│   │   └── ReservationConfirmation.vue
│   ├── testimonials/
│   │   └── ReviewCarousel.vue
│   └── ui/                # button, glass panel, badge, dsb (design-system primitives)
├── views/
│   ├── Home.vue
│   ├── Menu.vue
│   ├── Story.vue
│   ├── Experience.vue
│   ├── Gallery.vue
│   ├── Location.vue
│   ├── Reservation.vue
│   └── admin/
│       ├── Dashboard.vue
│       ├── MenuManagement.vue
│       ├── ReservationManagement.vue
│       ├── GalleryCms.vue
│       ├── HomepageCms.vue
│       ├── LocationSettings.vue
│       ├── Reviews.vue
│       ├── Users.vue
│       └── Settings.vue
├── composables/
│   ├── useMenu.ts
│   ├── useGallery.ts
│   ├── useReservation.ts
│   ├── useHomepageContent.ts
│   ├── useAuth.ts
│   ├── useGsap.ts
│   └── useScrollReveal.ts
├── lib/
│   ├── supabase.ts
│   └── maplibre.ts
├── stores/                # Pinia (auth, cart-free session state, dst)
├── types/
│   └── database.ts        # generated dari `supabase gen types typescript`
├── data/
│   └── menu.seed.json     # dev-only reference, bukan source of truth production
├── router/
│   └── index.ts            # termasuk route guard admin
└── App.vue
```

## 6. Routing & Auth Guard

- Public routes: bebas akses.
- `/admin/*` (kecuali `/admin/login`): guard cek sesi Supabase Auth aktif + role di tabel `profiles`. Redirect ke `/admin/login` jika tidak ada sesi.
- Per-fitur guard tambahan: `Users` & `Settings` hanya untuk `role = super_admin`.

## 7. Role & RLS Policy (ringkasan implementasi)

Prinsip: **public read** untuk data yang dipublish, **admin/staff write** sesuai role, **super_admin** full access.

Contoh pola policy (diterapkan konsisten ke semua tabel terkait):

```sql
-- READ publik: hanya data yang sudah "aktif/publish"
create policy "public_read_menu_items"
on menu_items for select
using (is_available = true);

create policy "public_read_gallery"
on gallery for select
using (is_published = true);

-- WRITE: admin & super_admin
create policy "admin_write_menu_items"
on menu_items for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin','super_admin')
  )
);

-- STAFF: hanya boleh update kolom availability, dilakukan lewat RPC function
-- `toggle_menu_availability(item_id uuid, available boolean)` dengan
-- `security definer` yang memvalidasi role staff, bukan direct table policy,
-- supaya staff tidak bisa mengubah harga/nama lewat client langsung.
```

Tabel `users`/`profiles`, `site_settings` hanya writable oleh `super_admin`.

## 8. Storage Bucket

```
Supabase Storage
├── menu/        -- foto menu item
├── gallery/     -- foto gallery (per kategori sebagai prefix path: gallery/interior/xxx.jpg)
├── hero/        -- background hero & section image homepage
├── logo/
└── branding/
```

Semua upload lewat admin panel melalui composable `useStorageUpload.ts`, validasi tipe file (jpg/png/webp) dan ukuran maksimum di client sebelum upload.

## 9. Animasi & Interaksi (implementasi teknis)

- `useScrollReveal.ts`: wrapper GSAP ScrollTrigger untuk fade-up/mask-reveal, dipakai lewat directive `v-reveal` atau composable manual per komponen.
- `Lenis` diinisialisasi sekali di `App.vue`, disinkronkan dengan `ScrollTrigger.update` di `requestAnimationFrame` loop.
- Magnetic button & cursor interaction: komponen `ui/MagneticButton.vue`, aktif hanya di viewport desktop (dimatikan di touch device demi performa).
- Hormati `prefers-reduced-motion: reduce` — cek lewat `useReducedMotion.ts`, jika true maka semua timeline diganti `duration: 0` atau CSS transition sederhana.

## 10. Peta / GIS

- MapLibre GL JS + tile OpenStreetMap (gratis, tanpa API key berbayar Google Maps).
- Marker lokasi dari `locations` table.
- Tombol `Get Directions` membuka `google_maps_url` (link eksternal), bukan routing engine sendiri — cukup untuk fase ini.

## 11. Deployment Pipeline

```
GitHub (main branch protected)
   ↓ push / PR
Vercel (preview deploy per PR)
   ↓ merge ke main
Vercel Production → boulalulue.com (atau domain final)

Supabase project terpisah: `boulalulue-dev` dan `boulalulue-prod`.
Migration lewat Supabase CLI (`supabase/migrations/*.sql`), tidak ada perubahan
schema manual langsung di dashboard production.
```

## 12. Testing Minimum

- Manual QA checklist per sprint (lihat `SPRINTS.md`).
- Form reservasi: test submit sukses, validasi gagal (tanggal lampau, guests 0), race condition dobel klik submit.
- RLS: test read/write dengan 4 role (public/staff/admin/super_admin) sebelum sprint backend dianggap selesai.
- Lighthouse audit di Home & Menu sebelum go-live.
