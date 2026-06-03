# 🎨 JepangKu LMS — Design Guidelines (AI Agents)

Dokumen ini adalah **single source of truth untuk UI/UX visual**. Setiap AI Agent wajib membaca dan mematuhi `DESIGN.md` **sebelum** membuat atau mengubah komponen, halaman, atau styling — agar hasil antar sesi/prompt tetap konsisten.

**Dokumen terkait (jangan duplikasi aturan desain di sana):**

| Dokumen | Fokus |
| :--- | :--- |
| [AGENTS.md](./AGENTS.md) | Arsitektur kode, folder, data fetching, progress tracker |
| [app/globals.css](./app/globals.css) | Implementasi token warna & tema (satu-satunya tempat ubah palet) |
| [app/page.tsx](./app/page.tsx) | **Referensi visual** landing (header, hero, card, footer) |
| [sitemap.md](./sitemap.md) | Struktur halaman & area routing |

---

## 1. Prinsip desain

1. **Merek JepangKu jelas** — Merah Jepang sebagai aksi utama; Navy sebagai struktur; Orange untuk sorotan; Kuning untuk XP/hadiah.
2. **Bersih & edukatif** — Layout rapi, hierarki teks jelas, minim distraksi (penting untuk LMS & mode kuis fokus).
3. **Shadcn-first** — Gunakan primitif `components/ui/*`; jangan mencampur library UI lain.
4. **Semantic tokens** — Warna lewat variabel tema (`primary`, `muted-foreground`, `brand-red`), bukan hex acak di JSX.
5. **Mobile-aware** — Pola `container`, padding responsif, nav yang collapse di mobile (ikuti landing).

---

## 2. Stack visual

| Lapisan | Aturan |
| :--- | :--- |
| **Tailwind CSS v4** | Konfigurasi via CSS (`@theme inline` di `globals.css`). **Jangan** buat `tailwind.config.js`. |
| **Shadcn UI** | Komponen dasar di `components/ui/`. Tambah via CLI Shadcn proyek, bukan copy random. |
| **Font** | `Inter` + `Geist` (lihat `app/layout.tsx`). Body: `font-sans`, antialiased. |
| **Ikon** | `lucide-react` (sudah di dependensi). Ukuran konsisten dengan tombol Shadcn. |
| **Utility** | `cn()` dari `@/lib/utils` untuk menggabungkan class. |

Import CSS global (jangan ubah urutan tanpa alasan):

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

---

## 3. Palet warna & token

### 3.1 Warna merek (hanya definisi di `globals.css`)

| Nama | Hex | Token Tailwind | Peran |
| :--- | :--- | :--- | :--- |
| **Red Japanese** | `#EC1D24` | `brand-red`, `--primary` | CTA utama, aksi primér, sidebar active accent |
| **Navy** | `#1E1B57` | `brand-navy`, `--secondary`, `--sidebar` | Header teks gelap, sidebar, struktur |
| **Orange** | `#FF4B2B` | `brand-orange`, `--accent`, `--ring` | Hover CTA, promo, focus ring |
| **Yellow** | `#F8E71C` | `brand-yellow`, `--chart-4` | XP, badge emas, reward highlight |

### 3.2 Token semantic Shadcn (prioritas pemakaian)

Gunakan **urutan prioritas** ini saat memilih class:

1. **Semantic Shadcn** — `bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`, `bg-muted`, dll.
2. **Brand utility** — `bg-brand-red`, `text-brand-navy`, `border-brand-yellow/20` (dengan opacity Tailwind).
3. **Jangan** — `text-[#EC1D24]`, `bg-[#1E1B57]`, atau warna RGB/hex inline di komponen.

### 3.3 Kapan memakai warna apa

| Konteks | Class yang disarankan |
| :--- | :--- |
| Tombol aksi utama (Daftar, Submit kuis) | `<Button>` variant `default` → `bg-primary`, atau eksplisit `bg-brand-red hover:bg-brand-orange` pada hero marketing |
| Tombol sekunder / outline | `variant="outline"` + `border-brand-navy/20` (light) atau border putih transparan (dark) |
| Teks judul halaman marketing | `text-brand-navy dark:text-white` |
| Teks pendukung | `text-muted-foreground` |
| Link nav hover | `hover:text-brand-red` |
| Badge XP / level / streak | `bg-brand-yellow/10`, `text-brand-yellow` atau `text-yellow-600` (light), border `border-brand-yellow/20` |
| Progress bar XP | Gradient `from-brand-red via-brand-orange to-brand-yellow` |
| Alert info gamifikasi | `bg-brand-yellow/5 border-brand-yellow/20` |
| Alert promo / perhatian | `bg-brand-orange/5 border-brand-orange/20 text-brand-orange` |
| Sidebar dashboard (siswa/admin) | Background mengikuti `--sidebar` (Navy); item aktif `--sidebar-primary` |
| Destructive (hapus, batalkan permanen) | `variant="destructive"` pada Button |
| Chart / statistik admin | `--chart-1` … `--chart-5` (sudah map ke palet merek) |

### 3.4 Dark mode

* Variabel tema di blok `.dark` dalam `globals.css` — **jangan** hardcode warna dark di komponen.
* Pola umum: `text-brand-navy dark:text-white`, `dark:border-white/20`, logo `dark:hidden` / `hidden dark:block` (lihat landing).
* Aktifkan dark via class `.dark` pada ancestor (sesuai setup Shadcn); jangan asumsikan `prefers-color-scheme` saja tanpa class.

---

## 4. Tipografi

| Level | Class tipikal | Catatan |
| :--- | :--- | :--- |
| **H1 hero** | `text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-none` | Satu H1 per halaman |
| **H1 halaman app** | `text-3xl font-bold` | Dashboard, CMS |
| **H2 section** | `text-3xl font-bold` atau `text-2xl font-bold` | |
| **H3 / label section** | `text-sm font-bold uppercase tracking-wider text-muted-foreground` | Label blok (mis. "Badge Pencapaian") |
| **Body** | `text-base` atau `text-lg` + `leading-relaxed` untuk paragraf marketing | |
| **Small / meta** | `text-xs`, `text-sm` + `text-muted-foreground` | |
| **Aksen gradien headline** | `bg-gradient-to-r from-brand-red via-brand-orange to-brand-red bg-clip-text text-transparent` | Hanya untuk sorotan kata kunci di hero |

**Bahasa UI:** Indonesia untuk copy produk (sesuai konten existing). Hindari campuran EN/ID dalam satu layar kecuali istilah JLPT (N5, N4, …).

---

## 5. Spacing, layout & radius

| Pola | Nilai standar |
| :--- | :--- |
| **Container halaman** | `container mx-auto px-4 md:px-8` |
| **Padding section marketing** | `py-20 lg:py-32` (hero), `py-16` (section sekunder) |
| **Padding halaman app** | `p-6` minimum; dashboard bisa `p-6 max-w-7xl mx-auto` |
| **Gap flex/grid** | `gap-4`, `gap-6`, `gap-12` (hero columns) |
| **Radius kartu** | `rounded-xl`, `rounded-2xl` (hero card premium) |
| **Radius tombol marketing** | `rounded-xl` pada CTA besar (`size="lg"`) |
| **Radius default Shadcn** | Mengikuti `--radius` (0.625rem) → utilitas `rounded-lg`, `rounded-4xl` pada Button |
| **Header sticky** | `sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur` |

**Grid landing:** `grid lg:grid-cols-12` dengan konten utama `lg:col-span-7` dan showcase `lg:col-span-5`.

---

## 6. Komponen UI

### 6.1 Yang wajib dipakai

| Kebutuhan | Sumber |
| :--- | :--- |
| Button | `@/components/ui/button` |
| Input, Label, Form | `components/ui/*` (tambah saat dibutuhkan via Shadcn) |
| Card | `Card`, `CardHeader`, `CardContent`, … dari Shadcn |
| Dialog, Sheet, Tabs | Shadcn di `components/ui/` |

**Varian Button (default Shadcn project):**

| Variant | Pemakaian |
| :--- | :--- |
| `default` | Aksi primér (map ke Red Japanese) |
| `secondary` | Aksi struktural Navy |
| `outline` | Sekunder, cancel ringan |
| `ghost` | Toolbar, icon actions |
| `destructive` | Hapus / aksi berbahaya |
| `link` | Tautan inline |

**Ukuran:** `sm` / `default` di form & tabel; `lg` untuk CTA hero.

### 6.2 Larangan

* Material UI, Chakra, Ant Design, atau kit UI lain tanpa koordinasi tim.
* Tombol `<button>` raw dengan styling one-off jika bisa pakai `<Button>`.
* Kartu `div` custom penuh shadow/warna baru — gunakan `bg-card border border-border shadow-sm` atau pola di landing.

### 6.3 Menambah komponen Shadcn baru

```bash
bunx shadcn@latest add card input label
```

Setelah ditambah, sesuaikan hanya jika perlu — **jangan** override warna inti di file komponen; ubah token di `globals.css`.

---

## 7. Pola per area produk

Rujuk [sitemap.md](./sitemap.md) untuk daftar route lengkap.

### 7.1 Public & marketing (`/`, `/kursus`, `/tryout`, statis)

* Layout **tanpa sidebar**; header horizontal seperti [app/page.tsx](./app/page.tsx).
* Logo: `/brand/logo.png` (light), `/brand/logo-white.png` (dark).
* Dekorasi latar: blob blur `bg-brand-red/5`, `bg-brand-orange/5` — **subtle**, `pointer-events-none`.
* CTA utama → sign-up atau WhatsApp (hubungi).

### 7.2 Student dashboard (`app/(dashboard)/*`)

* **Sidebar kiri** (Navy / token sidebar) + area konten `bg-background`.
* Kartu ringkasan XP: pola progress + badge dari landing hero card.
* "Continue learning" → kartu dengan `border-border bg-card`.

### 7.3 Focus mode kuis (`/kuis/[lessonSlug]`)

* **Tanpa** sidebar dashboard utama (fokus penuh).
* Header minimal: judul lesson, progres soal, timer (jika ada).
* Satu soal per viewport; navigasi prev/next jelas; warna aksen Orange untuk "pertanyaan aktif" jika perlu.
* Jangan tambahkan nav marketing.

### 7.4 Admin CMS (`/admin/*`)

* Sidebar admin (bisa sama komponen layout, bedakan label menu).
* Tabel data: Shadcn Table + `muted` zebra/header `bg-muted/50`.
* Form CMS: `Label` + `Input` + `Button default` untuk simpan; `outline` untuk batal.

### 7.5 Gamifikasi (XP, badge, leaderboard)

| Elemen | Gaya |
| :--- | :--- |
| XP bar | Gradient merah→oranye→kuning; teks angka `font-bold text-brand-red` |
| Badge unlocked | `border-border bg-muted/30` + emoji/ikon |
| Badge featured / baru | `border-brand-yellow/30 bg-brand-yellow/5` |
| Peringkat user sendiri | Highlight bar `bg-primary/10` atau border `border-primary` |
| Leaderboard top 3 | Medali visual: gold → `brand-yellow`, silver/bronze → `muted` |

---

## 8. Motion & interaksi

| Pola | Class |
| :--- | :--- |
| Hover link/nav | `transition-colors` |
| Hover CTA | `transition-all hover:scale-102` (subtle; jangan berlebihan di form) |
| Pulse status live | `animate-pulse` pada dot kecil saja (badge "platform aktif") |
| Focus keyboard | Andalkan `ring-ring` / `focus-visible:ring-*` dari Shadcn (Orange ring) |

Hindari animasi berlebihan di halaman kuis (ganggu fokus belajar).

---

## 9. Checklist Agent (sebelum selesai)

Centang mental ini sebelum mengakhiri tugas UI:

- [ ] Tidak ada hex hardcoded baru di `.tsx`
- [ ] Tombol/link utama memakai `Button` / token semantic
- [ ] Teks body memakai `text-foreground` / `text-muted-foreground`
- [ ] Kartu memakai `bg-card border-border`
- [ ] Sidebar/dashboard memakai token `sidebar-*` bila di area terproteksi
- [ ] XP/badge memakai `brand-yellow` (bukan warna emas random)
- [ ] Layout responsif (`px-4 md:px-8`, grid collapse di mobile)
- [ ] Halaman kuis tidak menyertakan sidebar marketing
- [ ] UI kompleks di `features/*/components/`, bukan bloated di `app/**/page.tsx`
- [ ] Perubahan palet global hanya di `app/globals.css`

---

## 10. Perubahan desain & versi

* **Ubah warna global** → edit `app/globals.css` saja, lalu verifikasi light + dark di landing.
* **Ubah pola komponen** → update section yang relevan di `DESIGN.md` + contoh di `app/page.tsx` bila memengaruhi marketing.
* **Fitur UI baru** yang belum tercakup → tambahkan sub-bab di §7, jangan mengandalkan prompt ad hoc.

| Versi dokumen | Tanggal | Catatan |
| :--- | :--- | :--- |
| 1.0 | 2026-06-03 | Baseline dari AGENTS.md, globals.css, landing page |
