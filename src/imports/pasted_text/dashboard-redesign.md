 ---
  Redesign ONLY the Dashboard/Statistics page to look like a $100,000                                                                                                                                                          
  enterprise platform. Think Bloomberg Terminal meets Stripe Dashboard
  meets Linear Analytics. This should make anyone who opens it feel like                                                                                                                                                       
  they're looking at a serious, powerful platform.

  ─────────────────────────────────────────
  OVERALL DASHBOARD VIBE
  ─────────────────────────────────────────

  Dark-premium aesthetic. Main background: #0A0F1E (near black, deep navy).
  Content cards: #111827 (gray-900) with subtle border #1F2937.
  Accent glow: Electric blue #3B82F6 with box-shadow glow effects.
  Data positive: #10B981 (emerald). Data negative: #EF4444.
  Warning: #F59E0B.

  The dashboard should feel ALIVE — animated counters, gradient fills
  on charts, pulsing indicators for real-time elements.

  ─────────────────────────────────────────
  TOP HEADER STRIP (full width, 72px tall)
  ─────────────────────────────────────────

  Left:
    "KASB Platform" wordmark in white, bold.
    Subtitle: "Admin Control Center" in gray-400, 12px.

  Center:
    Live clock: "Monday, 04 May 2026  |  14:32:07"
    Monospace font, gray-400. Seconds ticking feel.

  Right:
    🟢 "Tizim ishlayapti" — green pulsing dot + text.
    [🔔 3 xabar] [Sardor A. ▾ (SUPER ADMIN gold badge)]

  ─────────────────────────────────────────
  SECTION 1: HERO KPI STRIP (5 cards, full width)
  ─────────────────────────────────────────

  Five equal cards in a row. Each card: dark bg #111827,
  1px border with subtle blue glow on hover, 20px padding.

  Card 1 — JAMI NOMZODLAR
    Giant number: 10,847  (animated count-up on load)
    Sub: +234 bu hafta ↑
    Trend sparkline: tiny 12-point green area chart in top-right corner
    Bottom label: "Ro'yxatdagi nomzodlar"
    Left accent bar: 3px solid #3B82F6 (blue)

  Card 2 — FAOL VAKANSIYALAR
    Giant number: 103
    Sub: 18 ta 🔴 SHOSHILINCH
    Sparkline: amber area chart
    Bottom: "Ochiq ish o'rinlari"
    Left accent: #F59E0B (amber)

  Card 3 — BUGUN ARIZALAR
    Giant number: 47
    Sub: ↑ 23% kechagidan
    Sparkline: green
    Bottom: "Yangi murojaatlar"
    Left accent: #10B981 (green)

  Card 4 — TASDIQLASH KUTMOQDA
    Giant number: 847
    Sub: ⚠ 23 ta kechikkan (3+ kun)
    Sparkline: red area chart
    Bottom: "Ko'rib chiqish kerak"
    Left accent: #EF4444 (red)
    Card has very subtle red glow border — needs attention.

  Card 5 — OTP / FAOLLIK
    Giant number: 312
    Sub: Bugungi kirish
    Sparkline: purple
    Bottom: "Aktiv foydalanuvchilar"
    Left accent: #8B5CF6 (purple)

  ─────────────────────────────────────────
  SECTION 2: MAIN CHARTS ROW (3 columns)
  ─────────────────────────────────────────

  Left card (50% width) — "Nomzodlar oqimi — 30 kun"
    Large area chart, full card width.
    Two overlapping lines:
      Line 1 (blue): Yangi ro'yxatdan o'tganlar
      Line 2 (green): Tasdiqlangan profillar
    Gradient fill under each line (blue/green with 20% opacity).
    X-axis: dates (Apr 5 → May 4).
    Y-axis: 0 to 400.
    Hover tooltip: dark card showing exact values.
    Top-right corner: [7 kun] [30 kun] [3 oy] toggle buttons (pill style).

  Middle card (25% width) — "Holat taqsimoti"
    Premium donut chart, thick ring (16px stroke).
    Center of donut:
      Total number large: 10,847
      Small text: "Jami nomzod"
    Segments (clockwise):
      APPROVED  42% → #10B981 green
      PENDING   35% → #F59E0B amber
      REVIEWING 15% → #3B82F6 blue
      REJECTED   8% → #EF4444 red
    Legend below: each status with colored dot, label, count, percentage.
    On hover: segment lifts slightly with glow.

  Right card (25% width) — "Top 5 Maqsad Mamlakatlar"
    Horizontal bar chart.
    Each bar has country flag emoji + name + count + % fill.
    1. 🇰🇷 Koreya      3,241  ████████████░░  38%
    2. 🇵🇱 Polsha      2,108  ████████░░░░░░  24%
    3. 🇩🇪 Germaniya   1,876  ███████░░░░░░░  22%
    4. 🇮🇱 Isroil        834  ███░░░░░░░░░░░  10%
    5. 🇨🇿 Chexiya       412  ██░░░░░░░░░░░░   5%
    Bars: gradient fill blue → purple.

  ─────────────────────────────────────────
  SECTION 3: MIDDLE ANALYTICS ROW (3 cards)
  ─────────────────────────────────────────

  Card A (33%) — "Viloyatlar xaritasi"
    Simple Uzbekistan schematic (rectangle blocks for 14 regions).
    Color intensity shows candidate density:
      Dark blue = many candidates (Toshkent, Farg'ona)
      Light blue = few (Navoiy, Sirdaryo)
    Each region block: hover shows region name + count tooltip.
    Title: "Geografik taqsimot"

  Card B (33%) — "Tillar bo'yicha"
    Bubble/Treemap style visualization.
    Each language = a colored bubble, sized by count:
      🇷🇺 Rus tili      6,240  → largest bubble, blue
      🇬🇧 Ingliz tili   3,180  → medium, green
      🇩🇪 Nemis tili    1,420  → smaller, purple
      🇰🇷 Koreya tili     891  → red
      🇹🇷 Turk tili       640  → amber
      🇵🇱 Polyak tili     312  → teal
    Title: "Til bilimlari"

  Card C (33%) — "Kasblar reytingi"
    Ranked list, 8 items:
    Each row: rank number, profession name, count, mini bar, trend arrow.
    #1 Oshpaz         2,341  █████  ↑ 12%
    #2 Qurilishchi    1,876  ████   ↑ 8%
    #3 Haydovchi      1,543  ████   ↑ 3%
    #4 Hamshira         987  ███    ↓ 2%
    #5 Elektrik         834  ██     ↑ 15%
    Title: "Eng ko'p so'ralgan kasblar"

  ─────────────────────────────────────────
  SECTION 4: BOTTOM ROW (2 panels)
  ─────────────────────────────────────────

  Left panel (65%) — "Oxirgi faoliyat" (Recent Activity Feed)
    Real-time activity log feel. Each row is an event:

    [🟢] 14:31  Alisher N. profili tasdiqlandi          ADMIN tomonidan
    [🔵] 14:28  Yangi vakansiya: "Oshpaz — Seul"        Sardor A. tomonidan
    [🟡] 14:25  +998901234567 ro'yxatdan o'tdi           OTP orqali
    [🔴] 14:20  Bobur T. profili rad etildi              ADMIN tomonidan
    [🟢] 14:18  Dilnoza K. profili tasdiqlandi           —
    [🔵] 14:15  Vakansiya yopildi: "Elektrik — Varsh."  —
    [🟡] 14:12  +998772004521 ro'yxatdan o'tdi           OTP orqali
    [🔵] 14:09  Yangi vakansiya: "Haydovchi — Berlin"   —

    Each row: colored dot, time (monospace), event text, actor.
    Alternating row bg (very slight).
    "Ko'proq ko'rish" button at bottom.
    Top-right: [🔴 JONLI] pulsing live indicator.

  Right panel (35%) — "Tezkor harakatlar" (Quick Actions)
    Title: "Tezkor harakatlar"

    Action cards (vertical stack):
    ┌─────────────────────────────────────┐
    │ ⚡ 847 ta profil kutmoqda           │
    │ Ko'rib chiqishni boshlash →         │
    │ [Nomzodlarga o'tish]                │
    └─────────────────────────────────────┘
    ┌─────────────────────────────────────┐
    │ 🔧 23 ta yangi maxsus kasb          │
    │ Rasmiylashtirish kerak              │
    │ [Ko'rib chiqish]                    │
    └─────────────────────────────────────┘
    ┌─────────────────────────────────────┐
    │ 📋 + Yangi vakansiya yaratish       │
    │ [Yaratish]                          │
    └─────────────────────────────────────┘

    Below quick actions — mini "Bugungi maqsad" progress:
    Tasdiqlash rejtasi: 47/100  ████████░░░░  47%
    "Bugun 47 ta profil tasdiqlandi"

  ─────────────────────────────────────────
  MICRO-DETAILS THAT MAKE IT PREMIUM
  ─────────────────────────────────────────

  1. All numbers animate count-up on page load (0 → final value, 1.2s ease-out).
  2. The live activity feed auto-scrolls every 8 seconds, adding a new row at top.
  3. KPI card sparklines are animated — line draws itself left to right.
  4. Donut chart segments animate in clockwise on load.
  5. Horizontal bars in country chart fill from left on load.
  6. All cards have hover state: border shifts to #3B82F6 with subtle glow:
     box-shadow: 0 0 20px rgba(59,130,246,0.15)
  7. Top-right of each chart card: small [⋯] icon for options (export, fullscreen).
  8. Numbers use tabular-nums CSS for stable width during count animation.
  9. Negative trends show red ↓, positive show green ↑ with arrow icon.
  10. Overall page has very subtle grid pattern overlay on background:
      repeating lines at 24px, 3% opacity — gives depth.
