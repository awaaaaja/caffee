# AGENTS.md — Boulalulue Website & Admin CMS

Dokumen ini adalah kontrak kerja untuk AI coding agent (OpenCode) yang mengerjakan project **Boulalulue — Digital Café Experience**. Baca dokumen ini dulu sebelum menyentuh kode apa pun. Urutan baca proyek: `AGENTS.md` → `PRD.md` → `PLAN.md` → `DESIGN.md` → `SPRINTS.md` → `PROMPTS.md`.

---

## 1. Identitas Project

- **Nama:** Boulalulue — Digital Café Experience
- **Jenis:** Website publik (café & restaurant, viennoiserie + coffee + dining) + Admin CMS
- **Posisi brand:** *European Café × Viennoiserie × Contemporary Luxury × Warm Glass*
- **Bukan:** Starbucks clone, template restaurant generik, glassmorphism biru/ungu ala SaaS

## 2. Stack Terkunci (JANGAN DIUBAH)

| Layer | Teknologi |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Animasi | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| Icon | Lucide Vue |
| Map/GIS | MapLibre GL JS + OpenStreetMap |
| Backend | Supabase (PostgreSQL, Storage, Auth) |
| Deployment | Vercel (frontend), GitHub (source of truth) |

Agent **tidak boleh** mengganti library di atas dengan alternatif lain (misalnya Framer Motion, Mapbox berbayar, Firebase, dst) tanpa instruksi eksplisit dari Haikal.

## 3. Aturan Emas (Design Constitution — wajib dipatuhi semua agent)

1. Logo selalu dihormati — jangan distorsi rasio/warna logo.
2. Gold (`#D7A83D`) hanya accent, tidak pernah jadi warna dominan.
3. Cream/Ivory adalah canvas utama (~60% komposisi warna).
4. Brown/Espresso adalah emotional anchor (~25%).
5. Terracotta dipakai selektif, mengikuti karakter brand (~10%).
6. Glassmorphism harus subtle — lihat `DESIGN.md` §4, dilarang meniru glass ala dashboard SaaS (blur besar + border putih tebal + shadow biru).
7. Photography > dekorasi. Jangan pakai stock illustration/gradient sebagai hero.
8. Serif (Cormorant Garamond / DM Serif Display) untuk storytelling & headline.
9. Sans-serif (Manrope / Plus Jakarta Sans / Inter) untuk UI, nav, harga, label.
10. Animasi harus memperkuat storytelling, bukan pamer.
11. Dilarang: bouncing, spinning logo, particle berlebihan, neon glow, objek 3D bertebaran.
12. White space adalah bagian dari desain, jangan takut kosong.
13. Card tidak boleh terasa seperti dashboard admin generik.
14. Mobile dirancang sebagai pengalaman sendiri, bukan versi kecil desktop.
15. Menu harus bisa ditemukan dalam ≤2 interaksi dari mana pun di situs.
16. CTA Reservation harus selalu terlihat/mudah dijangkau.
17. Admin harus powerful tapi sederhana — operational, bukan emosional.
18. Semua konten homepage (hero, signature menu, story, gallery, CTA) harus bisa dikelola dari admin — **no hard-coded content**.
19. Harga dan data menu **tidak boleh** di-hardcode di komponen. Semua dari Supabase.
20. Website harus terasa seperti Boulalulue, bukan template café generik.

## 4. Disiplin Data — SANGAT PENTING

- Semua data menu (nama, harga, deskripsi, kategori) yang dipakai untuk seed **harus** berasal dari `data/menu.seed.json` yang sudah diverifikasi terhadap PDF/menu asli. Agent dilarang mengarang item menu atau harga baru.
- Data yang statusnya **belum terverifikasi** (lihat `PRD.md` §8 "Open Data Questions" — alamat pasti, jam operasional resmi, harga add-on makanan) **tidak boleh** di-hardcode sebagai fakta. Tampilkan sebagai placeholder yang jelas ditandai `TODO_VERIFY` di kode dan Notion/issue tracker, bukan angka pasti yang terlihat final.
- Jangan mengambil/generate foto orang asli atau logo brand pihak ketiga sebagai isi gallery. Gunakan foto milik Boulalulue (upload admin) atau placeholder bertanda jelas selama development.

## 5. Konvensi Kode

### Struktur folder (locked — lihat `PLAN.md` §5 untuk detail penuh)
```
src/
├── assets/        # images, fonts
├── components/    # Vue SFC, PascalCase, satu komponen satu tanggung jawab
├── views/         # route-level pages
├── composables/   # useMenu.ts, useReservation.ts, useGsap.ts, dst — logic reusable
├── lib/           # supabase.ts, maplibre.ts, dll — klien pihak ketiga
├── data/          # menu.seed.json (dev seed only, bukan source of truth production)
├── router/
├── stores/        # Pinia jika state global diperlukan
└── App.vue
```

### Naming
- Komponen: `PascalCase.vue` (`MenuCard.vue`, `SignatureMenu.vue`)
- Composable: `useX.ts`, camelCase function `useMenu()`
- Tabel Supabase: `snake_case`, plural (`menu_items`, `reservation_status_logs`)
- Slug: `kebab-case`, di-generate dari nama, unik per tabel

### TypeScript
- Semua props Vue wajib bertipe eksplisit (tidak `any`).
- Tipe entity Supabase disimpan di `src/types/database.ts`, idealnya di-generate dari `supabase gen types typescript`.

### Styling
- Tailwind utility-first. Token warna & font didefinisikan di `tailwind.config.ts` sesuai `DESIGN.md`, jangan pakai hex literal langsung di template kecuali kasus sangat spesifik.
- Komponen glass pakai utility class terpusat (`.glass-panel`, `.glass-nav`) yang didefinisikan sekali di `src/assets/styles/glass.css`, bukan diulang manual di tiap komponen.

### Animasi
- Semua GSAP timeline didaftarkan lewat composable `useGsap.ts` / `useScrollReveal.ts`, jangan taruh `gsap.to()` mentah bertebaran di banyak komponen tanpa cleanup.
- Wajib `ScrollTrigger.kill()` / cleanup di `onUnmounted` untuk mencegah memory leak saat navigasi SPA.
- Hormati `prefers-reduced-motion` — animasi non-esensial harus fallback ke transisi sederhana.

### Supabase & Keamanan
- Semua tabel wajib RLS **ON**. Jangan pernah menonaktifkan RLS "untuk sementara".
- Role: `super_admin`, `admin`, `staff`, `public` (read-only). Policy detail di `PLAN.md` §7.
- Jangan expose service role key ke frontend. Hanya anon key di client.
- Form publik (reservation) harus divalidasi di client **dan** constraint/trigger di database (misalnya guests > 0, tanggal ≥ hari ini).

## 6. Alur Kerja Agent per Sprint

1. Baca sprint terkait di `SPRINTS.md` dan prompt terkait di `PROMPTS.md`.
2. Sebelum menulis kode: konfirmasi asumsi data/desain yang tidak jelas ke Haikal — jangan menebak diam-diam untuk hal yang mempengaruhi struktur data atau brand identity.
3. Kerjakan checkpoint per checkpoint sesuai definisi di sprint. Jangan lompat ke sprint berikutnya sebelum acceptance criteria sprint berjalan terpenuhi.
4. Setiap selesai satu unit kerja: jalankan build (`npm run build`) dan lint sebelum melapor selesai.
5. Commit message format: `[sprint-XX] deskripsi singkat` (contoh: `[sprint-03] implement MenuCard glass hover state`).
6. Jangan menghapus/menimpa file dokumentasi (`AGENTS.md`, `PRD.md`, `PLAN.md`, `DESIGN.md`, `SPRINTS.md`, `PROMPTS.md`) kecuali diminta eksplisit.

## 7. Larangan Eksplisit

- Jangan mengganti stack.
- Jangan hardcode harga/menu/alamat/jam buka.
- Jangan membuat admin panel terlihat seperti template Bootstrap/AdminLTE generik.
- Jangan menambahkan dependency baru tanpa mencatat alasannya di commit message.
- Jangan menonaktifkan RLS.
- Jangan reproduksi konten Instagram (caption, foto) Boulalulue secara verbatim tanpa izin — gunakan hanya sebagai referensi visual/mood, bukan sumber aset final.
