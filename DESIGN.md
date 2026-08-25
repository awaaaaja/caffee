# DESIGN.md — Design System Boulalulue

## 1. Brand DNA

**European Café × Viennoiserie × Contemporary Luxury × Warm Glass**

Dibaca dari logo: organic (garis melengkung, bukan geometris kaku), crafted (terasa dibuat tangan), interwoven (kesan simpul/anyaman/kontinuitas), heritage (bukan brand teknologi), elegant (garis tipis + gold = premium). Semua komponen UI harus mengikuti karakter ini.

### Dilarang
❌ Starbucks clone · ❌ template restaurant generik · ❌ glassmorphism biru/ungu ala SaaS · ❌ gradient berlebihan · ❌ animasi berlebihan · ❌ admin panel terlihat seperti template Bootstrap/AdminLTE

### Wajib
✅ warm · ✅ sophisticated · ✅ editorial · ✅ intimate · ✅ cinematic · ✅ premium · ✅ glassmorphism subtle · ✅ typography kuat · ✅ photography sebagai elemen utama

## 2. Color Tokens

| Token | Hex | Peran | Proporsi |
|---|---|---|---|
| `espresso` | `#24150F` | Emotional anchor, teks utama di atas cream | ~25% |
| `deep-brown` | `#3A2116` | Varian gelap sekunder | — |
| `terracotta` | `#963D20` | Karakter brand, accent selektif | ~10% |
| `warm-clay` | `#A94A28` | Varian terracotta | — |
| `cream` | `#F5EDE0` | Canvas utama | ~60% |
| `ivory` | `#FBF7F0` | Varian cream lebih terang (card/background sekunder) | — |
| `gold` | `#D7A83D` | Accent premium: border, icon, hover, divider, label kecil | ~5% |
| `muted-gold` | `#B88B35` | Varian gold lebih redup (hover state gold) | — |
| `glass-white` | `rgba(255,255,255,.10)` | Base glass panel | — |

**Aturan mutlak:** Gold tidak pernah jadi warna background luas atau warna dominan tombol utama. Gold hanya untuk logo, border tipis, ikon, garis pemisah, label uppercase kecil, dan efek hover.

## 3. Typography

| Peran | Font | Contoh pemakaian |
|---|---|---|
| Headline / storytelling | **Cormorant Garamond** atau **DM Serif Display** | "Baked with precision. Served with grace." |
| UI, navigasi, harga, label | **Manrope** atau **Plus Jakarta Sans** (alternatif: Inter) | `MENU`, `RESERVATION`, `42K` |

Aturan: Headline = Serif · Body = Sans · Navigasi = Sans · Harga = Sans · Label = Sans uppercase dengan letter-spacing lebar.

## 4. Glassmorphism Rule

### ❌ Jangan (glass ala dashboard SaaS)
```css
background: rgba(255,255,255,.5);
backdrop-filter: blur(30px);
border: 1px solid white;
box-shadow: 0 20px 50px blue;
```

### ✅ Gunakan (glass ala luxury café)
```css
.glass-panel {
  background: rgba(255, 248, 238, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 225, 180, 0.18);
  box-shadow: 0 12px 40px rgba(35, 18, 10, 0.18);
}

.glass-nav {
  background: rgba(36, 21, 15, 0.45);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(215, 168, 61, 0.15);
}
```

Prinsip: glass harus **transparan terhadap fotografi café** di baliknya — bukan panel putih pekat yang menutupi foto. Selalu uji glass panel di atas foto asli café, bukan di atas warna solid saja.

## 5. Layout Komponen Kunci

### 5.1 Navbar
- Desktop: floating glass, `position: fixed; top: 20px; left: 5%; right: 5%`.
- State: transparan di hero → glass (`.glass-nav`) setelah scroll ~100px → compact (tinggi berkurang, logo mengecil) setelah scroll ~500px.
- Mobile: navbar solid/glass penuh lebar dengan hamburger menu (`☰`), menu full-screen overlay saat dibuka.

### 5.2 Hero
- Full-bleed real photography (bukan gradient/ilustrasi).
- Overlay gradasi gelap tipis di bawah untuk keterbacaan teks jika perlu, jangan menutupi foto secara berlebihan.
- Urutan reveal saat load: Logo fade → Navbar slide → Headline reveal (clip-path) → Deskripsi reveal → CTA reveal → Hero image scale `1.08 → 1`.

### 5.3 Menu Card (glass menu card)
```
╭─────────────────────────╮
│                         │
│        FOOD IMAGE       │
│                         │
│   ┌─────────────────┐   │
│   │ CHICKEN KIEV    │   │  ← glass panel menumpuk di atas foto
│   │                 │   │
│   │ 42K         ↗   │   │
│   └─────────────────┘   │
│                         │
╰─────────────────────────╯
```
Hover: image scale `1.04`, card `translateY(-6px)` sampai `-8px`, border gold opacity naik, harga fade-in/reveal, arrow muncul.

### 5.4 Buttons
- Primary: solid `espresso` background, teks `cream`, hover → `terracotta`.
- Secondary/outline: border `gold` tipis (1px), teks `cream`/`espresso` tergantung konteks, background transparan/glass.
- Tidak ada tombol bergaya neon/gradient mencolok.

## 6. Spacing & Grid

- Base spacing unit: `4px` (Tailwind default scale, hindari nilai custom sembarangan).
- Section vertical padding besar: minimal `96px` desktop / `56px` mobile — white space adalah bagian dari desain, jangan dipadatkan.
- Grid gallery: asymmetric masonry, contoh pola:
```
┌─────────────┬───────┐
│             │       │
│   INTERIOR  │ FOOD  │
│             │       │
├───────┬─────┴───────┤
│ DRINK │   PEOPLE    │
│       │             │
└───────┴─────────────┘
```

## 7. Breakpoints

| Nama | Lebar | Catatan |
|---|---|---|
| `sm` | 375px+ | Mobile — pengalaman dirancang khusus, bukan desktop diperkecil |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop kecil |
| `xl` | 1440px | Desktop besar (target utama hero cinematic) |

Mobile: menu ditampilkan sebagai horizontal swipe card, gallery vertical editorial (satu kolom besar, bukan grid padat), reservation form full-width glass card, navbar solid/glass compact dengan hamburger.

## 8. Animation System

### Page load (Hero)
```
Page Load → Logo fade → Navbar slide → Headline reveal
→ Description reveal → CTA reveal → Hero image scale 1.08 → 1
```

### Scroll (GSAP ScrollTrigger)
```
Scroll → Image parallax → Text reveal (fade-up) → Card stagger
```

### Menu card hover
```
Hover → Image scale ~1.04 → Card translateY(-6~-8px) → Gold border opacity ↑
→ Price reveal → Arrow reveal
```

### Larangan animasi
❌ bouncing · ❌ spinning logo · ❌ excessive particle · ❌ neon glow · ❌ 3D object bertebaran

Floating coffee-bean particle **boleh** dipakai di hero, tapi harus sangat subtle (opacity rendah, gerakan pelan, jumlah sedikit) — bukan elemen utama.

Semua animasi non-esensial wajib menghormati `prefers-reduced-motion`.

## 9. Admin Panel — Desain Berbeda dari Publik

| | Public Website | Admin Panel |
|---|---|---|
| Mood | Emotional, cinematic | Operational, functional |
| Glass | Signature element | Sangat minim/subtle |
| Background | Foto & cream | Cream solid, card putih |
| Teks | Serif untuk headline | Sans-serif semua |
| Prioritas | Storytelling | Kecepatan kerja & kejelasan data |

Admin tetap pakai token warna yang sama (cream, espresso, gold accent) supaya terasa satu brand, tapi komposisinya jauh lebih flat/functional: cream background, teks coklat gelap, card putih bersih, gold hanya untuk aksen kecil (badge status, active tab), border tipis, whitespace besar antar section form.

## 10. Golden Rules (ringkas — versi lengkap ada di `AGENTS.md` §3)

Referensi cepat saat membangun komponen baru: logo dihormati · gold = accent saja · cream = canvas · brown = anchor · terracotta = karakter · glass = subtle · foto > dekorasi · serif = story, sans = interface · animasi memperkuat cerita · white space itu desain · card ≠ dashboard · mobile = pengalaman sendiri · menu ≤2 klik · reservasi selalu terlihat · admin powerful tapi sederhana · konten homepage full CMS · no hardcode data · terasa Boulalulue, bukan template.
