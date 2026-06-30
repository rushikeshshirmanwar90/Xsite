---
name: xsite-page-header-cards
description: Xsite RN/Expo page-header "hero card" pattern — icon + eyebrow + title, per-page accent colors
metadata:
  type: project
---

Xsite (React Native / Expo) detail-style pages use a header "hero card" at the top of the ScrollView to communicate page purpose visually (no paragraph descriptions). Established 2026-06.

**Anatomy:** row card, `alignItems: 'center'`, gap 16, radius 18, paddingV 20 / paddingH 18, light accent bg + 1px accent-tint border. Left: white `iconWrap` 64x64, radius 16, soft shadow (offset y2, opacity 0.07, radius 6), Ionicon size 38 in accent color. Right (`textWrap`, flex 1): `eyebrow` (12px / 700 / uppercase / letterSpacing 0.6 / accent color / 3-5 words max) above `title` (21px / 800 / `#1E293B` / letterSpacing -0.3).

**Per-page accent / bg / border + eyebrow + icon:**
- Material Available (details.tsx, lockedTab 'imported'): `#7C3AED` / `#FAF5FF` / `#E9D5FF` — "Track imported stock" — icon `cube`
- Material Used (details.tsx, lockedTab 'used'): `#D97706` / `#FFFBEB` / `#FDE68A` — "Monitor consumption" — icon `construct`
- Equipment (equipment.tsx): `#2563EB` / `#EAF0FE` / `#C4D8FC` — "Machinery & tools" — icon `hardware-chip`
- Other Cost (other-cost.tsx): `#E11D48` / `#FFF1F2` / `#FECDD3` — "Extra expenses" — icon `receipt`

Style objects: `pageBannerStyles` in details.tsx; `bannerStyle` in equipment.tsx and other-cost.tsx. details.tsx uses two variants (bannerAvailable/bannerUsed) sharing iconWrap/textWrap/bannerEyebrow/bannerTitle; eyebrow + icon color passed inline since they switch on lockedTab.

Rule: do NOT use long description paragraphs in these banners — purpose is conveyed via color + icon + short eyebrow only.
