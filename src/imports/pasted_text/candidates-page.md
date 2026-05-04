 Redesign the NOMZODLAR (Candidates) page to match the same dark-premium                                                                                                                                                      
  $100,000 enterprise aesthetic as the dashboard. This is the most important              
  and most-used page in the entire admin panel. It must feel powerful,                                                                                                                                                         
  fast, and professional — like a Bloomberg terminal for talent management.                                                                                                                                                    
                                                                                                                                                                                                                               
  ─────────────────────────────────────────                                                                                                                                                                                    
  PAGE LAYOUT OVERVIEW
  ─────────────────────────────────────────

  Same dark background: #0A0F1E
  Cards/panels: #111827 with 1px border #1F2937
  Full width layout. No wasted space.

  Three zones stacked vertically:
    Zone 1: Smart Filter Bar (collapsible, 56px collapsed / 160px expanded)
    Zone 2: Toolbar with stats strip
    Zone 3: Main candidates table (takes remaining height, scrollable)

  Right side: slide-in detail drawer (480px) when row is clicked —
  NO separate page navigation, drawer opens inline.

  ─────────────────────────────────────────
  ZONE 1: SMART FILTER BAR
  ─────────────────────────────────────────

  Background: #0F172A. Border-bottom: 1px #1E293B.
  Padding: 16px 24px.

  Top row (always visible):
    Left: 🔍 Search input (full-text)
          Placeholder: "Ism, telefon raqam yoki kasb..."
          Width: 380px. Dark bg, blue focus glow.

    Middle: Active filter chips (appear here as filters are set):
      [🟡 PENDING ✕]  [🇰🇷 Koreya ✕]  [Rus tili: B2+ ✕]  [Maosh: $800–$1500 ✕]
      Chips: small pills, colored border matching filter type.

    Right:
      [⚙ Filtrlar ▾]  toggle button (expands filter panel)
      [↺ Tozalash]    text button (gray, shows only when filters active)
      [↓ Export CSV]  outlined button

  Expanded filter panel (3 rows of dropdowns):

  Row 1:
    [Holat ▾]          [Viloyat ▾]         [Kasb kategoriyasi ▾]   [Kasb ▾]

  Row 2:
    [Tajriba ▾]        [Mavjudligi ▾]      [Maqsad mamlakat ▾]     [Agent ▾]

  Row 3:
    [Til ▾]            [Til darajasi ▾]    Maosh: [$____] — [$____] [Qidirish →]

  All dropdowns: dark background, white text, blue highlight on selection.
  Multi-select dropdowns where it makes sense (mamlakat, til).

  ─────────────────────────────────────────
  ZONE 2: TOOLBAR + STATS STRIP
  ─────────────────────────────────────────

  Two rows:

  Row A (stats strip) — dark bg #0D1117, 40px height, full width:
    Inline mini-stats separated by dividers:

    Jami: 10,847  |  ✅ Tasdiqlangan: 4,552  |  ⏳ Kutilmoqda: 3,798
    |  🔵 Ko'rib chiqilmoqda: 1,641  |  ❌ Rad etilgan: 856

    Each stat: label gray-400, number white bold, colored dot before count.
    Clicking a stat auto-applies that status filter (acts as quick filter).

  Row B (toolbar) — 52px, flex between:
    Left:
      "10,847 ta nomzod" — white, 16px bold
      (updates to "Filtr: 234 ta topildi" when filtered)

    Middle (bulk actions — appear only when rows selected, slide in):
      [3 ta tanlandi]  [Status ▾]  [Agent belgilash ▾]  [✕ Bekor]

    Right:
      [☰ Jadval]  [⊞ Karta]  toggle (table vs card view)
      [20 ▾] rows per page selector
      Page: "1 / 542"  [<] [>]

  ─────────────────────────────────────────
  ZONE 3A: TABLE VIEW (default)
  ─────────────────────────────────────────

  Table header: #161D2E background, sticky (stays on scroll).
  Header text: gray-400, 11px UPPERCASE, letter-spacing: 0.08em.
  Each column header has sort arrow (↕ inactive, ↑↓ active in blue).

  ROW HEIGHT: 64px (tall enough for 2 lines of info per cell).
  Row hover: #1A2235 background + blue left border 2px.
  Selected row: #0F2547 background + blue left border 3px.
  Alternating rows: very subtle, #111827 / #0F1729.

  COLUMNS (left to right):

  ┌────┐
  │ ☐  │  Checkbox (16px). Header checkbox = select all.
  └────┘

  ┌─────────────────────────────┐
  │ NOMZOD                      │  Width: 240px
  │ Avatar circle (32px) +      │
  │ Full name bold 14px white   │
  │ Phone number 12px gray mono │
  └─────────────────────────────┘
  Avatar: colored circle with initials (no photo).
  Color based on first letter hash — consistent per person.
  e.g.: "AN" → blue circle, "SM" → purple circle.

  ┌─────────────────┐
  │ JOYLASHUV       │  Width: 130px
  │ Toshkent        │
  │ shahri          │
  └─────────────────┘
  Region name, 13px gray-300.

  ┌─────────────────────────────┐
  │ KASB                        │  Width: 180px
  │ Oshpazchilik   (category)   │  11px gray-400
  │ Oshpaz         (profession) │  13px white
  └─────────────────────────────┘

  ┌────────────────┐
  │ TAJRIBA        │  Width: 100px
  │ 1 – 3 yil      │
  └────────────────┘
  Pill badge: dark border, gray text.
  3 styles:
    [1–3 yil] gray-outline
    [3–5 yil] blue-outline
    [5+ yil]  purple-outline

  ┌──────────────────────────┐
  │ TILLAR                   │  Width: 160px
  │ 🇷🇺 B2  🇬🇧 A1  🇰🇷 A2   │
  └──────────────────────────┘
  Each language: tiny flag emoji + level pill.
  Level pill colors:
    A1/A2 → gray
    B1/B2 → blue
    C1/C2 → green
  If more than 3 languages: "+2 ta" overflow badge.

  ┌─────────────────┐
  │ MAMLAKAT        │  Width: 120px
  │ 🇰🇷  🇩🇪  🇵🇱   │
  └─────────────────┘
  Target country flags in a row.
  Priority order (first flag = top priority, slightly larger).
  If more than 3: "+1" badge.

  ┌──────────────────────┐
  │ MAOSH KUTISHI        │  Width: 140px
  │ $800 – $1,200        │
  │ USD                  │
  └──────────────────────┘
  Min–Max bold, currency small gray below.

  ┌──────────────────────────────┐
  │ PROFIL BALL                  │  Width: 120px
  │ ████████░░  82%              │
  │ To'liqlik darajasi           │
  └──────────────────────────────┘
  Custom progress bar (thin, 4px height).
  Color:
    80-100% → #10B981 green glow
    50-79%  → #F59E0B amber
    0-49%   → #EF4444 red
  Percentage number: matching color, bold.
  Below bar: "To'liqlik" label gray-400 11px.

  ┌──────────────────┐
  │ HOLAT            │  Width: 140px
  │ 🟢 TASDIQLANGAN  │
  └──────────────────┘
  Status badge — premium pill design:
    PENDING:   amber bg #451A03, text #FCD34D, dot pulsing yellow
    REVIEWING: blue bg #1E3A8A, text #93C5FD, dot pulsing blue
    APPROVED:  green bg #064E3B, text #6EE7B7, static green dot
    REJECTED:  red bg #450A0A, text #FCA5A5, static red dot
  Pill: 6px border-radius, 8px horizontal padding.

  ┌────────────────────┐
  │ AGENT              │  Width: 120px
  │ Sardor A.          │
  │ (Belgilanmagan)    │
  └────────────────────┘
  Agent name or gray italic "(Belgilanmagan)".

  ┌─────────────┐
  │ SANA        │  Width: 100px
  │ 15.03.2025  │
  │ 09:14       │
  └─────────────┘
  Date bold, time gray below. Monospace.

  ┌─────────┐
  │ AMALLAR │  Width: 80px, sticky right column
  └─────────┘
  Three icon buttons on hover (hidden until row hovered):
    👁  View (opens right drawer)
    ✏  Status change (opens inline mini-dropdown)
    ⋯  More menu (assign agent, export profile)

  ─────────────────────────────────────────
  ZONE 3B: CARD VIEW (toggle alternative)
  ─────────────────────────────────────────

  Grid: 3 columns, 24px gap.
  Each card: 220px height, dark bg, hover glow.

  Card layout:
  ┌─────────────────────────────────────┐
  │ [AN] Alisher Nazarov    🟢 APPROVED │
  │ +998 90 123 45 67                   │
  │ ─────────────────────────────────── │
  │ 📍 Toshkent  |  🍽 Oshpaz           │
  │ 🇷🇺B2  🇬🇧A1  →  🇰🇷 🇩🇪            │
  │ $800–$1,200 USD  |  1–3 yil         │
  │ ─────────────────────────────────── │
  │ Ball: ████████░░ 82%                │
  │ Agent: Sardor A.    [Ko'rish →]     │
  └─────────────────────────────────────┘

  Card hover: lift shadow + blue border glow.

  ─────────────────────────────────────────
  RIGHT SIDE DRAWER — CANDIDATE DETAIL
  ─────────────────────────────────────────

  Opens when row/card is clicked. Slides in from right (480px wide).
  Main content dims slightly (20% dark overlay).
  Drawer bg: #111827. Top border: 2px #3B82F6.

  DRAWER HEADER (72px):
    Left: Avatar circle (48px) + Name 18px bold + Phone mono gray
    Right: [✕ Yopish]  [↗ To'liq sahifa]
    Status badge below name: colored pill (PENDING/APPROVED etc.)

  DRAWER ACTION BAR (48px, bg #0D1117):
    [Holat o'zgartirish ▾]  [Agent belgilash ▾]  [⋯ Boshqa]

  DRAWER CONTENT (scrollable tabs):

  Tab bar: [Asosiy] [Tillar] [Mamlakatlar] [Ta'lim] [Ko'nikmalar] [Hujjatlar]
  Active tab: blue underline 2px, white text.

  TAB: ASOSIY
    Profile completeness ring (circular, 80px diameter):
      Circle progress: 82% filled arc, green glow.
      Center: "82%" white bold.
      Below: "Profil to'liqligi"

    Info grid (2 columns):
    ┌──────────────────┬──────────────────┐
    │ Viloyat          │ Oilaviy holat    │
    │ Toshkent shahri  │ Bo'ydoq          │
    ├──────────────────┼──────────────────┤
    │ Ta'lim           │ Tajriba          │
    │ Oliy             │ 1-3 yil          │
    ├──────────────────┼──────────────────┤
    │ Mavjudligi       │ Ma'lumot roz.    │
    │ Hozir tayyor     │ ✅ Ha            │
    ├──────────────────┼──────────────────┤
    │ Kasb kategoriyasi│ Kasb             │
    │ Oshpazchilik     │ Oshpaz           │
    ├──────────────────┼──────────────────┤
    │ Maosh (min)      │ Maosh (max)      │
    │ $800             │ $1,200 USD       │
    └──────────────────┴──────────────────┘

    Each cell: label gray-400 11px, value white 14px.

  TAB: TILLAR
    Premium table:
    Flag + Til name | Daraja pill | Sertifikat badge
    🇷🇺 Rus tili  |  🔵 B2  |  ✅ Sertifikat bor
    🇬🇧 Ingliz    |  ⬜ A1  |  ❌ Yo'q

  TAB: MAMLAKATLAR
    Numbered priority list:
    1  🇰🇷  Koreya Respublikasi   (Birinchi tanlov)
    2  🇩🇪  Germaniya             (Ikkinchi tanlov)
    3  🇵🇱  Polsha
    Each item: flag large 24px, country name, priority tag.

  TAB: TA'LIM
    Education card:
    🎓 icon  |  Oliy ta'lim
               TDTU — Mexanika muhandisligi
               2019 yil  ·  O'zbekiston

  TAB: KO'NIKMALAR
    Tag cloud: white outlined pills on dark bg.
    [Haydovchilik] [Excel] [Payvandlash] [MS Word] [Forklift] ...

  TAB: HUJJATLAR
    Table with file icon, type, upload date, preview button.
    Greyed out "Hujjatlar yuklanmagan" state if empty.

  DRAWER FOOTER (sticky bottom, 60px):
    [← Oldingi nomzod]    [Keyingi nomzod →]
    Allows browsing through candidates without closing drawer.

  ─────────────────────────────────────────
  STATUS CHANGE INLINE EXPERIENCE
  ─────────────────────────────────────────

  When clicking status in toolbar or ✏ icon:
    Premium floating popover (not modal):
    ┌──────────────────────────────────┐
    │  Holat tanlang:                  │
    │  ○ 🟡  Kutilmoqda               │
    │  ○ 🔵  Ko'rib chiqilmoqda       │
    │  ● 🟢  Tasdiqlangan  ← current  │
    │  ○ 🔴  Rad etilgan              │
    │  ────────────────────────────    │
    │  [Bekor] [Saqlash]              │
    └──────────────────────────────────┘

    After save: row status badge animates (fade out → fade in new color).
    Toast appears top-right: "✅ Holat yangilandi"

  ─────────────────────────────────────────
  PAGINATION (bottom, sticky)
  ─────────────────────────────────────────

  Full-width bar, bg #0D1117, 48px, border-top #1F2937.

  Left:  "10,847 ta nomzoddan 1–20 ko'rsatilmoqda"
  Center: [← Oldingi]  [1] [2] [3] [⋯] [541] [542]  [Keyingi →]
          Active page: blue bg circle.
  Right:  [20 ▾] ta / sahifa

  ─────────────────────────────────────────
  EMPTY STATE (when no results)
  ─────────────────────────────────────────

  Centered in table area:
    Large icon: 🔍 (64px, gray-600)
    "Nomzod topilmadi" — white 18px
    "Filtr shartlarini o'zgartiring yoki tozalang" — gray 14px
    [Filtrlarni tozalash] — blue outlined button

  ─────────────────────────────────────────
  PREMIUM MICRO-DETAILS
  ─────────────────────────────────────────

  1. Table rows load with staggered fade-in animation
     (row 1 appears first, then 2,3... with 30ms delay each).

  2. Status badge pulsing animation:
     PENDING and REVIEWING dots pulse continuously (CSS keyframe).
     APPROVED and REJECTED dots are static.

  3. Score progress bars animate fill from 0% → actual value on load.

  4. Phone numbers: always monospace, selectable, hover shows
     "Nusxalash" tooltip. Click copies to clipboard with ✅ flash.

  5. Agent column: unassigned shows "— Belgilanmagan —" in red-400
     italic — visually urgent, needs action.

  6. Column headers have subtle sort indicators and are all clickable.
     Active sort: header text turns blue + arrow glows.

  7. Bulk selection: when >0 rows selected, a floating action bar
     appears at bottom of screen (like iOS share bar):
     "5 ta tanlandi  [Status ▾]  [Agent ▾]  [Export]  [✕]"
     Slide up from bottom with spring animation.

  8. Row right-click context menu:
     [👁 Ko'rish]  [✏ Status o'zgartirish]  [👤 Agent belgilash]
     [📋 Profil nusxasi]  [─]  [⚠ Bloklash]

  9. Filter chips in search bar are draggable to reorder.

  10. Scrolling the table: header stays sticky,
      status strip stays sticky below header.
      Ultra-smooth scroll with momentum.

