# Seed Menu Boulalulue

Pipeline seed menu: `data/menu.seed.json` → `menu_items.sql` → database.

## Prasyarat

- `SUPABASE_ACCESS_TOKEN` dan kredensial DB tersedia (lihat `.env.local`).
- Podman/Docker untuk psql, atau psql lokal.

## Cara re-run seed saat tim Boulalulue update menu

1. Edit `data/menu.seed.json` — ubah harga/nama/deskripsi, atau tambah item baru.
   - Item yang belum dikonfirmasi ke Haikal: set `"TODO_VERIFY": true` + alasan di `TODO_VERIFY_REASON` — item ini **tidak** ikut ke SQL production.
2. Generate ulang SQL (idempotent, `ON CONFLICT (slug) DO UPDATE`):
   ```bash
   npm run seed:menu
   ```
3. Apply ke database:
   ```bash
   podman run --rm -i -e PGPASSWORD='boulalulue123!' \
     public.ecr.aws/supabase/postgres:17.6.1.155 \
     psql -h aws-0-ap-northeast-1.pooler.supabase.com -p 5432 \
     -U postgres.ztuewupsjzwwnxbtzdec -d postgres -v ON_ERROR_STOP=1 \
     -f - < supabase/seed/menu_items.sql
   ```
4. Aman dijalankan berkali-kali — tidak menghasilkan duplikat (teruji 2× run).

## Catatan verifikasi data (PRD.md §8)

- Add-on **minuman** (Oatmilk 8K, Extra Shot 13K, Mineral Water 5K, Cheese Foam 6K) sudah ter-seed ke tabel `menu_addons` via migration `20260825000004_seed_verified.sql`.
- Add-on **makanan** (dressing, Sambal Matah, Rica-Rica, Blackpepper, Rice, Kerupuk Emping) berstatus `TODO_VERIFY` di `menu.seed.json` — belum masuk production.
- Viennoiserie/pastry (Butter Croissant, Almond Croissant, dll) **tidak ada** di PDF menu ("listed on the display at the bar") — belum di-seed sama sekali, menunggu daftar resmi.
- Vision mengonfirmasi kategori `Nusantara` dan 8 itemnya di PDF. Item tetap berstatus `TODO_VERIFY` hanya karena slug `nusantara` belum ada di schema categories `PLAN.md` §4.7 — jangan mapping ke `main-course` tanpa keputusan Haikal.
- Vision mengonfirmasi nama `Espresso (Arabica)` 24K; item ini sudah berstatus terverifikasi di JSON dan akan masuk SQL generated.
- Harga disimpan integer rupiah (60K = 60000).
