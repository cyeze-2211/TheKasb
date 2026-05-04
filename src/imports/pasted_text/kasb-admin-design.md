---             
  Design a premium, enterprise-grade Admin Panel for "KASB" — a labor migration platform from Uzbekistan.
  The product connects job candidates seeking overseas employment with agencies and employers.
  Users of this admin panel are: Super Admin, Admin, and Agent roles.

  ─────────────────────────────────────────
  DESIGN SYSTEM
  ─────────────────────────────────────────

  Style: Modern SaaS, clean, data-dense but breathable. Inspired by Linear, Vercel, and Retool.

  Color Palette:
    Primary:      #2563EB  (blue-600)
    Primary Dark: #1D4ED8  (blue-700)
    Success:      #16A34A  (green-600)
    Warning:      #D97706  (amber-600)
    Danger:       #DC2626  (red-600)
    Background:   #F8FAFC  (slate-50)
    Surface:      #FFFFFF
    Border:       #E2E8F0  (slate-200)
    Text Primary: #0F172A  (slate-900)
    Text Muted:   #64748B  (slate-500)
    Sidebar bg:   #0F172A  (slate-900)
    Sidebar text: #CBD5E1  (slate-300)
    Sidebar active: #2563EB

  Typography:
    Font: Inter
    Heading 1: 24px / 700
    Heading 2: 18px / 600
    Body:      14px / 400
    Small:     12px / 400
    Mono:      JetBrains Mono 13px (for IDs, phone numbers, tokens)

  Spacing: 4px base grid. Cards: 24px padding. Table rows: 12px vertical.

  Border radius: 8px (cards), 6px (inputs/buttons), 4px (badges/tags).

  Shadows:
    Card: 0 1px 3px rgba(0,0,0,0.08)
    Modal: 0 20px 60px rgba(0,0,0,0.15)

  ─────────────────────────────────────────
  LAYOUT — SHELL
  ─────────────────────────────────────────

  Fixed sidebar (240px wide, dark #0F172A) + main content area.
  Top header bar (64px, white, border-bottom) inside main area.

  SIDEBAR structure:
    ┌──────────────────────┐
    │  🏢 KASB Admin       │  ← logo + name
    │  ──────────────────  │
    │  📊 Dashboard        │
    │  👥 Foydalanuvchilar │
    │  🎯 Nomzodlar        │  ← active, highlighted blue
    │  📋 Vakansiyalar     │
    │  🔧 Kasblar          │
    │  ⚙️  Sozlamalar      │
    │  ──────────────────  │
    │  [Avatar] Admin User │
    │  admin@kasb.uz       │
    │  [Chiqish]           │
    └──────────────────────┘

  Each sidebar item: 40px tall, 12px horizontal padding, 16px icon, 14px label.
  Active state: blue left border (3px), blue background (#1E3A8A 20% opacity), white text.
  Hover state: slightly lighter background.

  TOP HEADER (inside main content area):
    Left: Breadcrumb (e.g., "Nomzodlar / Ko'rish")
    Right: [🔔 Notification badge] [Search] [Admin avatar dropdown]

  ─────────────────────────────────────────
  PAGE 1: DASHBOARD
  ─────────────────────────────────────────

  URL: /admin/dashboard

  Layout: 4 KPI cards top row, then 2-column charts, then recent activity table.

  KPI CARDS (4 cards, equal width):
    Card 1 — Jami Nomzodlar
      Value: 10,847
      Subtitle: +234 bu hafta
      Icon: 👥 (blue background circle)
      Trend: ▲ 12% green

    Card 2 — Faol Vakansiyalar
      Value: 103
      Subtitle: 18 ta shoshilinch
      Icon: 📋 (amber background)
      Trend: ▲ 5% green

    Card 3 — Kutilayotgan profillar
      Value: 847
      Subtitle: Ko'rib chiqish kerak
      Icon: ⏳ (orange background)
      Trend: Badge: "Shoshilinch"

    Card 4 — Bugun tizimga kirganlar
      Value: 312
      Subtitle: OTP orqali
      Icon: 📱 (green background)
      Trend: ▲ 8% green

  CHARTS ROW (2 columns):
    Left (60% width):
      "Nomzodlar holati" — Donut chart
      Segments: PENDING (yellow), REVIEWING (blue), APPROVED (green), REJECTED (red)
      Legend below with counts and percentages.

    Right (40% width):
      "Haftalik ro'yxatdan o'tish" — Area chart
      7-day sparkline, blue fill, showing registrations per day.

  RECENT CANDIDATES TABLE (bottom):
    Title: "Oxirgi ro'yxatdan o'tganlar"
    Columns: Ism, Telefon, Viloyat, Holat, Sana
    10 rows, compact, with colored status badges.
    Footer: "Barchasini ko'rish →" link.

  ─────────────────────────────────────────
  PAGE 2: FOYDALANUVCHILAR (Users)
  ─────────────────────────────────────────

  URL: /admin/users

  FILTER BAR (horizontal, full width, white card):
    [Rol ▾] [Aktiv? ▾] [Tasdiqlangan? ▾]   [──────────────] [Yangilash]
    Dropdowns for: Rol = ALL / CANDIDATE / ADMIN / SUPER_ADMIN / AGENT
                   Aktiv = Barchasi / Ha / Yo'q
                   Tasdiqlangan = Barchasi / Ha / Yo'q

  TABLE (white card, full width):
    Title: "Foydalanuvchilar" + count badge
    [Export CSV button] top right

    COLUMNS:
    ┌──────┬──────────────┬──────────────┬────────────────┬──────────┬──────────────┬──────────────────┬──────────┐
    │  #   │ Telefon      │ Ism Familiya │ Rol            │ Aktiv    │ Tasdiqlangan │ Oxirgi kirish    │ Amallar  │
    ├──────┼──────────────┼──────────────┼────────────────┼──────────┼──────────────┼──────────────────┼──────────┤
    │  1   │ +998901234567│ Alisher N.   │ 🔵 CANDIDATE   │ ✅ Ha    │ ✅ Ha        │ 2 soat oldin     │ [Bloklash]│
    │  2   │ +998772000001│ —            │ 🔵 CANDIDATE   │ ✅ Ha    │ ❌ Yo'q      │ Hech qachon      │ [Bloklash]│
    │  3   │ +998901111222│ Sardor M.    │ 🔴 ADMIN       │ ✅ Ha    │ ✅ Ha        │ Bugun 09:14      │ [Bloklash]│
    └──────┴──────────────┴──────────────┴────────────────┴──────────┴──────────────┴──────────────────┴──────────┘

    ROL BADGES:
      CANDIDATE  → blue pill
      ADMIN      → purple pill
      SUPER_ADMIN→ gold pill with ⭐
      AGENT      → teal pill

    AKTIV column: green checkmark / red X
    TASDIQLANGAN column: green checkmark / gray dash

    [Bloklash] button: small red outlined button → opens confirm modal

  PAGINATION: "1-20 / 1,247 ta" + Prev/Next page buttons, page size selector (20/50/100).

  ─────────────────────────────────────────
  PAGE 3: NOMZODLAR (Candidates) — MAIN PAGE
  ─────────────────────────────────────────

  URL: /admin/candidates

  This is the most complex and important page. Show it as the default active page.

  FILTER PANEL (collapsible, above table):
    Row 1: [Holat ▾] [Viloyat ▾] [Kasb kategoriyasi ▾] [Kasb ▾] [Agent ▾]
    Row 2: [Tajriba ▾] [Mavjudligi ▾] [Maqsad mamlakat ▾] [Til ▾] [Til darajasi ▾]
    Row 3: Maosh min [____] — max [____] [Qidirish] [Tozalash]

    Filter chips appear below when active, e.g.:
    [Holat: PENDING ✕] [Viloyat: Toshkent ✕] [Maosh: $500–$1500 ✕]

    Dropdown values:
      Holat (ProfileStatus): Barchasi / PENDING / REVIEWING / APPROVED / REJECTED
      Viloyat: 1-Toshkent shahri / 2-Toshkent vil. / 3-Farg'ona / 4-Andijon / 5-Namangan / 6-Samarqand / 7-Buxoro / 8-Navoiy / 9-Qashqadaryo / 10-Surxondaryo / 11-Jizzax / 12-Sirdaryo / 13-Xorazm / 14-QQR
      Tajriba: YEAR_1_3 (1-3 yil) / YEAR_3_5 (3-5 yil) / YEAR_5_PLUS (5+ yil)
      Mavjudligi: READY_NOW / WITHIN_1_MONTH / WITHIN_3_MONTHS
      Til: RUSSIAN / ENGLISH / GERMAN / KOREAN / TURKISH / POLISH / OTHER
      Til darajasi: A1 / A2 / B1 / B2 / C1 / C2

  TOOLBAR (above table):
    Left: "Nomzodlar" heading + "10,847 ta topildi" count
    Right: [📤 Export] [🔄 Yangilash] [Jadval ▾ / Karta ko'rinishi]

  CANDIDATES TABLE:
    COLUMNS:
    ┌─────┬────────────────┬──────────────┬───────────┬───────────────┬───────────────┬──────────────┬─────────────────┬────────────┬───────────────┬──────────┐
    │  ☐  │ Ism / Telefon  │ Viloyat      │ Kasb      │ Tajriba       │ Tillar        │ Mamlakat     │ Maosh kutishi   │ Ball       │ Holat         │ Amallar  │
    ├─────┼────────────────┼──────────────┼───────────┼───────────────┼───────────────┼──────────────┼─────────────────┼────────────┼───────────────┼──────────┤
    │  ☑  │ Alisher N.     │ Toshkent     │ Oshpaz    │ 1-3 yil       │ 🇷🇺 B2, 🇬🇧 A1 │ 🇰🇷 🇩🇪       │ $800–$1,200     │ ●●●●○ 82%  │ ✅ APPROVED   │ [👁][✏]  │
    │     │ +998901234567  │ shahri       │           │               │               │              │ USD             │            │               │          │
    ├─────┼────────────────┼──────────────┼───────────┼───────────────┼───────────────┼──────────────┼─────────────────┼────────────┼───────────────┼──────────┤
    │  ☐  │ Sardor M.      │ Farg'ona     │ Elektrik  │ 3-5 yil       │ 🇷🇺 C1        │ 🇵🇱           │ €1,000–€1,500   │ ●●●●● 96%  │ ⏳ PENDING    │ [👁][✏]  │
    │     │ +998772000044  │ viloyati     │           │               │               │              │ EUR             │            │               │          │
    └─────┴────────────────┴──────────────┴───────────┴───────────────┴───────────────┴──────────────┴─────────────────┴────────────┴───────────────┴──────────┘

    STATUS BADGES:
      PENDING   → 🟡 yellow pill "Kutilmoqda"
      REVIEWING → 🔵 blue pill "Ko'rib chiqilmoqda"
      APPROVED  → 🟢 green pill "Tasdiqlangan"
      REJECTED  → 🔴 red pill "Rad etilgan"

    BALL (Score) column: 5-dot progress indicator + percentage. Color: green if >80%, yellow if 50-79%, red if <50%.

    LANGUAGES: small flag emoji + level badge for each language known.

    AMALLAR column: eye icon (view detail), pencil icon (quick status change).

    Bulk actions bar (appears when rows selected):
    [3 ta tanlangan] [Status o'zgartirish ▾] [Agent belgilash ▾] [Tozalash]

  ─────────────────────────────────────────
  PAGE 4: NOMZOD PROFILI (Candidate Detail)
  ─────────────────────────────────────────

  URL: /admin/candidates/{id}

  Full-width layout with LEFT SIDEBAR (profile card) + RIGHT MAIN CONTENT (tabbed sections).

  LEFT SIDEBAR (320px, sticky):
    ┌────────────────────────────┐
    │   [Avatar placeholder]     │
    │   Alisher Nazarov          │
    │   +998 90 123 45 67        │
    │   📍 Toshkent shahri       │
    │                            │
    │   Holat: [🟢 APPROVED ▾]  │  ← dropdown to change
    │   Ball:  ████████░░ 82%    │
    │                            │
    │   Agent: [Sardor A. ▾]     │  ← assign agent dropdown
    │                            │
    │   ─────────────────────    │
    │   📅 Ro'yxatdan: 15.03.2025│
    │   🕐 Oxirgi kirish: 2s ago │
    │   ✅ Tasdiqlangan          │
    │   ✅ Aktiv                 │
    │                            │
    │   [Profil holatini saqlash]│
    └────────────────────────────┘

  RIGHT MAIN CONTENT (tabs):
    Tab 1: ASOSIY MA'LUMOTLAR
      Two-column info grid:
      Left column:
        Oilaviy holat: Bo'ydoq
        Ta'lim darajasi: Oliy
        Tajriba: 1-3 yil
        Mavjudligi: Hozir tayyor
      Right column:
        Kasb kategoriyasi: Oshpazchilik
        Kasb: Oshpaz
        Maosh kutishi: $800 – $1,200 (USD)
        Ma'lumot roziligi: ✅ Ha

    Tab 2: TILLAR
      Table:
      ┌─────────────────┬──────────┬──────────────┐
      │ Til             │ Daraja   │ Sertifikat   │
      ├─────────────────┼──────────┼──────────────┤
      │ 🇷🇺 Rus tili    │ 🔵 B2    │ ✅ Bor       │
      │ 🇬🇧 Ingliz tili │ 🟡 A1   │ ❌ Yo'q      │
      └─────────────────┴──────────┴──────────────┘

    Tab 3: MAQSAD MAMLAKATLAR
      Ordered list with priority numbers:
      1. 🇰🇷 Koreya Respublikasi
      2. 🇩🇪 Germaniya
      3. 🇵🇱 Polsha

    Tab 4: TA'LIM
      Cards:
      ┌──────────────────────────────────────────┐
      │ 🎓 Oliy ta'lim                           │
      │ Toshkent Davlat Texnika Universiteti     │
      │ Ixtisosi: Mexanika muhandisligi          │
      │ Bitirgan: 2019 yil · O'zbekiston         │
      └──────────────────────────────────────────┘

    Tab 5: KO'NIKMALAR
      Chip cloud:
      [Haydovchilik] [Excel] [Payvandlash] [Rus tili] [MS Word]

    Tab 6: HUJJATLAR
      Placeholder table:
      ┌───────────────┬──────────┬────────────┐
      │ Hujjat turi   │ Fayl     │ Yuklangan  │
      ├───────────────┼──────────┼────────────┤
      │ Pasport       │ 📄 .pdf  │ 12.03.2025 │
      └───────────────┴──────────┴────────────┘

  ─────────────────────────────────────────
  PAGE 5: VAKANSIYALAR (Vacancies)
  ─────────────────────────────────────────

  URL: /admin/vacancies

  TOP ACTION: [+ Yangi vakansiya] button (primary blue, top right)

  FILTER BAR:
    [Status ▾] [Mamlakat ▾] [Kategoriya ▾] [Kasb ▾] [Shoshilinch ▾] [Yaratuvchi ▾]

    Status values: DRAFT (Qoralama) / ACTIVE (Faol) / CLOSED (Yopiq) / ARCHIVED (Arxiv)

  VACANCIES TABLE:
    COLUMNS:
    ┌──────────────────────────────────┬──────────┬─────────────────┬────────────┬───────────┬──────────────┬──────────────┬──────────┐
    │ Sarlavha                         │ Mamlakat │ Kasb / Kategoriya│ Tajriba   │ Shoshilinch│ Status      │ Yaratuvchi   │ Amallar  │
    ├──────────────────────────────────┼──────────┼─────────────────┼────────────┼───────────┼──────────────┼──────────────┼──────────┤
    │ Oshpaz — Seul, Koreya            │ 🇰🇷 KOR  │ Oshpazchilik    │ 1-3 yil   │ 🔴 HA     │ 🟢 ACTIVE   │ Sardor A.    │ [👁][✏][🗑]│
    │ Elektrik — Varshava              │ 🇵🇱 POL  │ Qurilish        │ 3-5 yil   │ —         │ 🟡 DRAFT    │ Admin        │ [👁][✏][🗑]│
    │ Hamshira — Frankfurt             │ 🇩🇪 DEU  │ Tibbiyot        │ 5+ yil    │ —         │ 🔴 CLOSED   │ Sardor A.    │ [👁][✏][🗑]│
    └──────────────────────────────────┴──────────┴─────────────────┴────────────┴───────────┴──────────────┴──────────────┴──────────┘

    SARLAVHA column: bold title + subtitle (city, country)
    STATUS BADGES:
      DRAFT    → gray "Qoralama"
      ACTIVE   → green "Faol"
      CLOSED   → red "Yopiq"
      ARCHIVED → dark gray "Arxiv"

    AMALLAR: View (eye), Edit (pencil), Delete (trash — red hover), Status change (dropdown on click)

  ─────────────────────────────────────────
  PAGE 6: VAKANSIYA DETAIL / YARATISH
  ─────────────────────────────────────────

  URL: /admin/vacancies/create  or  /admin/vacancies/{id}/edit

  Two-column form layout:

  LEFT COLUMN (main fields):
    Section "Asosiy ma'lumotlar":
      Sarlavha*          [_________________________________]
      Tavsif            [_________________________________]
                         (multiline textarea, 4 rows)
      Mamlakat kodi*     [KOR ▾]  (e.g. Korea, Poland, Germany)
      Ish grafigi        [TO'LIQ KUNLIK ▾]
                         Options: FULL_TIME / PART_TIME / SHIFT / CONTRACT / SEASONAL
      Tajriba talab      [1-3 YIL ▾]
      Shoshilinchmi?     [☐ Ha, bu vakansiya shoshilinch]

    Section "Maosh":
      [Min ______] — [Max ______]  [Valyuta: USD ▾]
      Maosh yashirin?  [☐]

    Section "Qo'shimcha":
      Minimal yosh   [__] — Maksimal yosh [__]
      Jins talabi    [Farq qilmaydi ▾]  (MALE/FEMALE/ANY)
      Joylar soni    [__]

  RIGHT COLUMN (relations):
    Section "Kasblar" (kasb qo'shish):
      [+ Kasb qo'shish] button
      Each entry card:
      ┌──────────────────────────────────┐
      │ Kategoriya: [Oshpazchilik ▾]     │
      │ Kasb: [Oshpaz ▾]                │
      │ Joy soni: [5]                    │
      │                           [✕]   │
      └──────────────────────────────────┘

    Section "Til talablari":
      [+ Til qo'shish] button
      Each entry:
      ┌────────────────────┬─────────┬──────┐
      │ Til: [Rus ▾]       │ Min: B1 │ [✕]  │
      └────────────────────┴─────────┴──────┘

  FOOTER ACTIONS:
    [Qoralama saqla]  [Nashr qilish (ACTIVE)]  [Bekor qilish]

  ─────────────────────────────────────────
  PAGE 7: MAXSUS KASBLAR (Custom Professions)
  ─────────────────────────────────────────

  URL: /admin/custom-professions

  EXPLANATION BANNER (yellow info box):
    ⚠️ Nomzodlar o'zlari yozgan, rasmiy ro'yxatda yo'q kasblar.
    Ko'rib chiqib, rasmiy kasb sifatida qabul qiling yoki rad eting.

  FILTER: [Ko'rib chiqilgan: Barchasi ▾ / Ha / Yo'q]

  TABLE:
    COLUMNS:
    ┌────────────────────────────────┬──────────────┬──────────────────┬──────────┐
    │ Kasb nomi                      │ Ishlatilish  │ Ko'rib chiqilgan │ Amallar  │
    ├────────────────────────────────┼──────────────┼──────────────────┼──────────┤
    │ "Yuk mashinasi haydovchisi"    │ 247 marta    │ ❌ Yo'q          │ [Tasdiqlash]│
    │ "Qo'riqchi"                    │ 183 marta    │ ❌ Yo'q          │ [Tasdiqlash]│
    │ "Sartarosh"                    │ 91 marta     │ ✅ Ha            │ —        │
    └────────────────────────────────┴──────────────┴──────────────────┴──────────┘

    [Tasdiqlash] button → opens MODAL:
    ┌────────────────────────────────────────────────┐
    │  "Yuk mashinasi haydovchisi"ni tasdiqlash      │
    │  ────────────────────────────────────────────  │
    │  Kategoriyaga bog'lash:                        │
    │  [Transport va logistika ▾]                    │
    │                                                │
    │  Rasmiy kasb nomi (ixtiyoriy):                 │
    │  [Yuk avtomobili haydovchisi        ]          │
    │                                                │
    │  [Bekor qilish]  [Tasdiqlash va qo'shish]      │
    └────────────────────────────────────────────────┘

  ─────────────────────────────────────────
  PAGE 8: KASBLAR (Professions Reference)
  ─────────────────────────────────────────

  URL: /admin/professions

  Two-panel layout:

  LEFT PANEL (Kategoriyalar — 280px):
    List of profession categories:
    ┌─────────────────────────────────┐
    │ 🍽️Oshpazchilik           (12) │  ← active, blue highlight
    │ 🏗️Qurilish               (18) │
    │ 🏥 Tibbiyot               (8)  │
    │ 🌾 Qishloq xo'jaligi      (6)  │
    │ 🚚 Transport              (11) │
    │ 🧹 Uy va tozalik          (9)  │
    │ 🏭 Sanoat                 (14) │
    │ 💇 Go'zallik              (7)  │
    └─────────────────────────────────┘

  RIGHT PANEL (selected category's professions):
    Title: "Oshpazchilik — 12 ta kasb"
    Grid of profession pills:
    [Oshpaz] [Sous-shef] [Konditer] [Sushi master] [Lavash tayyorlovchi]
    [Pishiriqchi] [Muzqaymoq ustasi] [Choy ustasi] [Grill oshpazi] [...]

  ─────────────────────────────────────────
  MODALS & MICRO-INTERACTIONS
  ─────────────────────────────────────────

  STATUS CHANGE MODAL (on candidate status patch):
    ┌─────────────────────────────────────┐
    │  Holat o'zgartirish                 │
    │  Alisher Nazarov                    │
    │  ──────────────────────────────     │
    │  Yangi holat:                       │
    │  ○ 🟡 PENDING — Kutilmoqda          │
    │  ○ 🔵 REVIEWING — Ko'rib chiqilmoqda│
    │  ● 🟢 APPROVED — Tasdiqlangan       │
    │  ○ 🔴 REJECTED — Rad etilgan        │
    │                                     │
    │  [Bekor qilish]  [Saqlash]          │
    └─────────────────────────────────────┘

  DEACTIVATE USER CONFIRM MODAL:
    ┌─────────────────────────────────────┐
    │  ⚠️  Foydalanuvchini bloklash       │
    │  Bu foydalanuvchi tizimga kira      │
    │  olmay qoladi. Ishonchingiz komilmi?│
    │                                     │
    │  [Yo'q, bekor qiling]  [Ha, bloklash]│
    └─────────────────────────────────────┘

  TOAST NOTIFICATIONS (top-right, slide in):
    ✅ Success: green left border, white bg, "Saqlandi!"
    ❌ Error:   red left border, "Xatolik yuz berdi"
    ⚠️ Warning: yellow left border, "Diqqat!"

  Empty state (when no results):
    Centered icon + "Ma'lumot topilmadi" + description + [Filtrlarni tozalash] button.

  Loading skeleton: animated gray shimmer bars replacing table rows (not spinner).

  ─────────────────────────────────────────
  ROLE-BASED ACCESS VISUAL INDICATORS
  ─────────────────────────────────────────

  Show role badge in top header near user avatar:
    SUPER_ADMIN → gold badge "⭐ Super Admin"
    ADMIN       → purple badge "🛡 Admin"
    AGENT       → teal badge "👤 Agent"

  Agent role limitations (shown as disabled/grayed):
    - "Foydalanuvchilar" sidebar item: visible but shows 🔒 lock icon
    - Custom Professions: not visible in sidebar
    - Candidate status patch: disabled for AGENT role

  ─────────────────────────────────────────
  RESPONSIVE / ADDITIONAL NOTES
  ─────────────────────────────────────────

  - Design for 1440px desktop width, but ensure 1280px still works.
  - Table columns can horizontally scroll on smaller widths.
  - All date/times: "15.03.2025 09:14" format (Uzbekistan locale).
  - Phone numbers: always monospace font, "+998 XX XXX XX XX" format.
  - Currency display: "1 200 USD" or "€1,500" (space thousand separator).
  - All text labels in Uzbek language (Latin script).
  - Pagination: "< Oldingi  1  2  3 ... 48  Keyingi >" style.
  - Row hover: #F1F5F9 background highlight.
  - Selected rows: #EFF6FF (very light blue).

  Design this as 8 separate frames/screens in Figma, all connected with realistic prototype flows.
  Make it look like a $50,000 enterprise SaaS product — pixel-perfect, consistent, professional.

  ---
  Ishlatish: Yuqoridagi hamma textni to'liq Figma Make chatiga paste qiling. Agar Figma Make prompt uzunligini chegaralasa, sahifalarni bo'lib yuboring (masalan, avval Design System + Shell + Dashboard, keyin qolgan
  sahifalar).

  Eng muhim sahifalar: Dashboard → Nomzodlar ro'yxati → Nomzod detail → Vakansiyalar — shu to'rttasini priority qiling.
