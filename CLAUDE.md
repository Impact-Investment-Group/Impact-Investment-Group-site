# Impact Investment Platform — Website Project Brief

This file is the handover from a Claude Cowork session. Read it before doing any work
on this project. It contains the brand system, the client's meeting notes, an audit of
the current site, and the register of what is done, pending and blocked.

**Owner:** Callum Saxon (callum.saxon@impactig.co.uk)
**Manager / stakeholder:** Israel — the amendment requests below are his.
**Scope right now:** the homepage / landing page ONLY. Do not touch other pages.

---

## 1. What this project is

A marketing website for **Impact Investment Platform** — a UK supported-housing platform
connecting local authorities, housing associations, care and support providers, investors,
landlords and developers, with an AI-driven demand-matching layer.

Current build lives in Lovable and is published at
`https://impact-property-connect.lovable.app`.

There is a separate, much larger production codebase (`Impact-Investment-Platform`)
containing the existing site at `iip-frontend/iip-web/`. **That is not this project.**
Do not confuse the two.

---

## 2. Brand system — authoritative

First derived by sampling pixels from two approved mock-ups. Since wave 443 the values are
the platform's Brand Kit v4 (`iip-frontend/iip-web/src/index.css`), and since wave 777 they
carry its lifted navy and teal. The `:root` block of `src/styles.css` holds them and
`scripts/wave443-contrast.mjs` pins each one to the platform's value: the site follows the
platform, never the reverse. Nothing in the codebase should use a hard-coded colour.

> **THE SITE IS LIGHT. Updated 19 September 2026, wave 412, revised by the
> 412b fix pass the same day.**
>
> Callum, relaying his director: *"the site is much too dark (the navy everywhere
> makes it too dark throughout) and needs to instead be much lighter, and brighter
> ... and more friendly/user friendly throughout."*
>
> So the ground moved. **White is the page, cream is the alternating band, and navy
> is INK and STRUCTURE**: headings, body text, rules, the logo's neutral parts,
> rather than the surface everything sits on. Everything below this line in section
> 2 is written for that site. The fonts, the icon system, the logo rules, the
> imagery rules and the data table are unchanged and still hold.
>
> Measured before and after by `scripts/wave412-screenshots.py`, which photographs
> every route at 1280 and 390 and asserts what it finds. The share of dark pixels
> on the home page went from **63.55% to 23.46%** at 1280, and the share of the
> page's own ground, with photographs and the map field masked out, from
> **48.48% to 9.07%**. `/register/investor` went from 60.55% to 4.46%.
>
> Those three are copied from the FINAL RUN of the 412b pass, which is the gate
> table in section 3 of `docs/WAVE412_REPORT.md`. They are not typed by hand and
> they are not to be. Wave 412 shipped 23.43%, 8.77% and 4.44% here against
> 23.55%, 9.22% and 4.47% in its own report, which is how the rel412 re-checker
> knew this file had been written against an earlier build. The home page's two
> figures move by about a tenth of a point between runs of the same build,
> because the page has running animations in it; the gate's ceiling for it is
> set at the highest reading and the script says so.

### Colour tokens

**The design system already exists** in `src/styles.css` under `@theme`. Do NOT invent new
token names — edit the existing ones. Components must never hard-code a hex.

**Ask for a colour by its JOB, not by its shade.** These are the names a component
should be reaching for, and a component that reaches for one of them is correct on the
light ground without knowing which navy or slate sits behind it:

```
--color-page       #FDFDFB   THE PAGE GROUND (--bg-canvas)
--color-page-alt   #F9F9F4   the alternating band (--bg-tint, same value as --color-mist-bg)
--color-header     the page at 92%   the sticky bar, blurred
--color-ink        #14366A   the navy as type: headings and body on white (--brand-ink)
--color-ink-muted  #4e5a6e   body copy on the band and the cream card (--color-slate-ink)
--color-ink-soft   #647289   small caps, captions, body on a white card (--brand-slate)
--color-rule       slate at 20%   the hairline that rules the whole site
--color-tint-orange  orange-500 at 12%   the plate behind a HUMAN icon glyph
--color-tint-teal    teal-600 at 12%     the plate behind a DATA icon glyph
--secondary        #EBF6F6   the teal bed under teal TEXT (--brand-teal-soft)
```

Tailwind emits `bg-page`, `bg-page-alt`, `text-ink`, `text-ink-muted`, `text-ink-soft`,
`border-rule`, `bg-tint-orange`, `bg-tint-teal` and `bg-secondary` from these. Teal text
never sits on `bg-tint-teal`: there it is 4.39:1 over white and 3.92:1 over the cream card.
It sits on `bg-secondary`, where it is 4.66:1 over any ground because the bed is opaque.

The navy scale is one value: every `navy-*` name is `--brand-ink`. It is the INK and the
two islands, not the ground:

```
--color-navy-950 / 900 / 800 / 700 / 600: var(--brand-ink)   #14366A since wave 777
```

**One orange, three steps of it, and the step is decided by the JOB not by taste.**
The wave 295 ruling holds: where a pairing fails, THE SURFACE MOVES, never the orange.

```
--color-orange-500: #E15E31   (--brand-primary) fills, rules, chip borders, icon
                              glyphs, and a headline word at 26px and above
--color-orange-600: #CC4A22   (--brand-primary-fill) the fill of any text-bearing
                              control. White on it is 4.60:1 and `text-page` 4.51:1,
                              so a label passes at any size
--color-orange-700: #BB441B   (--brand-primary-ink) every orange WORD on a light
                              ground. 5.31:1 on white, 4.72:1 on the cream card
--color-teal-400:   #70CECC   (--brand-teal-on-ink) ON NAVY ONLY. 1.84:1 on white
--color-teal-500:   #258D8A   (--brand-teal) graphics only: 4.00:1 on white
--color-teal-600:   #267977   (--brand-teal-ink) the teal of the light site: eyebrows,
                              figures, icon glyphs, the focus ring, the secondary button
--color-teal-700/800: #267977 the same teal-ink, named so neither falls back to
                              Tailwind's default teal
--color-cream-card: #F2F2EC   (--bg-cream) a card that has to separate from the band
```

⚠️ **THERE IS STILL ONE ORANGE AND IT IS `#E15E31`.** 600 and 700 are the platform's
fill and ink steps of it (R541-1), not new oranges. Do not add a lighter one for text;
that is the exact thing wave 295 existed to end.

### Working on the light grounds: read before building anything

Four light grounds: white, the page (`--bg-canvas`), the band (`--bg-tint`) and the cream
card (`--bg-cream`), which is the binding one because it is the darkest. Every figure
below is copied from `node scripts/wave443-contrast.mjs` at wave 777, the band and cream card columns at wave 882, not carried forward;
a figure in an `info` row of that output is measured but not asserted.

| Colour | white `#FFFFFF` | page `#FDFDFB` | band `#F9F9F4` | cream card `#F2F2EC` | Verdict |
|---|---|---|---|---|---|
| `ink` `#14366A` | 11.89:1 | 11.68:1 | 11.26:1 | 10.58:1 | **PASS**: the default for headings and for body on white |
| `ink-muted` `#4e5a6e` | 6.97:1 | 6.85:1 | 6.60:1 | 6.21:1 | **PASS**: the default for body on the band and the cream card |
| `ink-soft` `#647289` | 4.87:1 | 4.78:1 | 4.61:1 (info) | 4.34:1 (info) | White cards, rules and small caps. **FAILS on the cream card for body copy** |
| `teal-600` `#267977` | 5.14:1 | 5.05:1 | 4.87:1 | 4.58:1 | **PASS**: eyebrows, figures, icon glyphs, the focus ring |
| `teal-500` `#258D8A` | 4.00:1 | 3.92:1 | 3.78:1 | 3.56:1 | Graphics only (3:1). **FAIL** for text everywhere |
| `teal-400` `#70CECC` | 1.84:1 (info) | 1.81:1 (info) | 1.75:1 (info) | 1.64:1 (info) | **FAIL.** It is the on-navy teal and belongs inside an island |
| `orange-700` `#BB441B` | 5.31:1 | 5.21:1 | 5.03:1 | 4.72:1 | **PASS**: the one orange that carries a word |
| `orange-600` `#CC4A22` | 4.60:1 (info) | 4.51:1 (info) | 4.35:1 (info) | 4.09:1 (info) | Fills under a white label. Never orange text: that is `orange-700` |
| `orange-500` `#E15E31` | 3.59:1 | 3.53:1 | 3.40:1 | 3.20:1 | **NEVER small text.** Rules, chips, glyphs, and a headline at 26px and above |
| `destructive` `#c92a2a` | 5.46:1 | 5.36:1 | 5.17:1 | 4.86:1 | **PASS**: validation errors on every ground |

So on any light ground: headings are `ink`, body is `ink` on white and `ink-muted` on
the band, eyebrows and figures are `teal-600`, an orange word is `orange-700`, and
`orange-500` survives as a rule, a chip border, an icon glyph and a large headline word.
Icon plates are a 12% tint of the glyph's own colour with no ring. Cards are white on the
cream, or white with a rule and `--shadow-card` on white. **The logo uses its `on-cream`
variant everywhere on the site**, including in the header.

`--primary` in the `:root` shadcn layer is `#CC4A22` (`--brand-primary-fill`) and follows
`orange-600`, with white `--primary-foreground`, so the library components and the brand
button agree.

### What each colour is for

Each colour has exactly one job. This is what stops the page drifting section to section,
which is the specific complaint Israel raised.

- **White**: the page. The default ground for every section on every route.
- **Cream**: rhythm. The alternating band, so a long page is not one flat sheet.
- **Navy**: INK and STRUCTURE. Headings, body text, rules, the logo's neutral parts.
  It is a ground in exactly two places on the site, and both are named below.
- **Orange** — human and action. People, care, hearts, CTAs, the single most important
  phrase in a headline.
- **Teal** — data and AI. All AI language, statistics, map network lines, data icons,
  charts. The technology voice.

**Colour proportion target on any screen: white and cream 75 to 80% · navy 10 to 15%,
as ink and islands · teal 5% · orange 3%.**

#### Navy islands

A **navy island** is a rounded plate that keeps its darkness inside a light section. It
is allowed only where darkness does a job, and there are two on the site:

1. **The demand map's plate.** Its dot field and orange hotspot halos are light ADDED to
   darkness; on white the dots wash out and the halos disappear.
2. **The crisis card**, in the footer and on `/contact`. It has to be the one block a
   person in trouble cannot miss, and on a cream footer nothing else would separate.

The rules: **at most ONE inside `<main>` per route**, never in the first viewport, never
the header, never a whole section's ground, always a rounded plate inside a light
section rather than a full-bleed band. Mark it `.section-dark` and write its markup in
the DARK classes, because that is what the plate is. `scripts/wave412-screenshots.py`
counts them on every page at both widths and fails at two.

### Hard accessibility rules (measured, not guessed)

Re-measured in wave 777 by `scripts/wave443-contrast.mjs` against the grounds the site
actually has; the plates are composited over each ground from the stylesheet's own mix.

| Combination | Ratio | Rule |
|---|---|---|
| ink on white | 11.89:1 | Default heading and body text |
| ink on the band | 11.26:1 | Default heading text on the band |
| ink-muted on the band | 6.60:1 | Default body text on the band (6.21:1 on the cream card) |
| ink-soft on white | 4.87:1 | Body on a white card. **Not on the cream card**, where it is 4.34:1 |
| teal-600 on white | 5.14:1 | Eyebrows, figures, icon glyphs, the focus ring |
| teal-600 on the band | 4.87:1 | The same, on the band (4.58:1 on the cream card) |
| teal-600 on the teal bed (`--secondary`) | 4.66:1 | Teal text on a teal surface: the success panels, the active rail pill, the secondary button's hover |
| orange-700 on the band | 5.03:1 | Every orange word, at any size (4.72:1 on the cream card) |
| orange-500 on white | 3.59:1 | **Large text and graphics only.** 3:1 floor, not 4.5:1 |
| White on orange-600 | 4.60:1 | Button labels, at any size |
| `text-page` on orange-600 | 4.51:1 | Type on a filled orange tile |
| White on teal-600 | 5.14:1 | A label on a filled teal plate |
| White on orange-500 | 3.59:1 | **NEVER small.** This is why buttons fill with 600 |
| orange-600 glyph on the 12% orange tint | 3.99:1 white / 3.78:1 band / 3.58:1 cream card | Human icon plates (18% on hover: 3.71 / 3.53 / 3.34) |
| teal-600 glyph on the 12% teal tint | 4.39:1 white / 4.18:1 band / 3.92:1 cream card | Data icon plates (18% on hover: 4.04 / 3.85 / 3.63) |
| White on navy-950 (inside an island) | 11.89:1 | Body text on an island |
| orange-500 on navy-950 (inside an island) | 3.31:1 | **Large text and graphics only** on an island |
| teal-400 on navy-950 (inside an island) | 6.45:1 | The focus ring and data type on an island |

**The focus ring is `teal-600` everywhere on the light site** and `teal-400` inside an
island. WCAG 2.2 wants 3:1 of a focus indicator (SC 1.4.11 and 2.4.11); teal-400 is
1.84:1 on white, so it cannot be the site ring.

⚠ **THE TABLE ABOVE IS THE FLAT CREAM AND THE FLAT WHITE, AND SOME BANDS ARE NEITHER.**
Wave 412b found two failures that every row above would have called a pass, because the
ground under the text was not the ground the class named: `/about`'s sourced-figure
ledger sat on a band carrying a photograph at 10%, where the cream renders
rgb(225, 221, 212) and teal-600 (then `#17796f`) was **3.87:1**, not the 4.67:1 the flat
cream of that day gave it; and the register routes
carried a 14% teal bloom over the cream, where the pre-release badge read **4.09:1**.
If text sits on a photograph, a tint, a gradient or anything translucent, the pair is
**measured off the rendered pixels**, and the surface moves until it passes. The gate
does this now for every node axe returns as INCOMPLETE.

**Every page is run through axe-core on every build**, at 1280 and 390, and the gate
fails on a single serious or critical colour-contrast violation. **It also measures every
node axe returns as INCOMPLETE off the screenshot's own pixels and fails on any one of
them under its floor**, which is the check wave 412b added and the reason the two
failures above were found. Before wave 412 `origin/main` carried between 5 and 15
violations per page; at wave 777 it carries none, and 274 incomplete nodes across the 28
shots, 273 measured above their floors and one that the wave 777 environment could not
read off its pixels (`docs/WAVE777_REPORT.md`).

### Section rhythm

Alternate **white → cream → white → cream** down the page. The hero is white. The demand
map's SECTION is cream and the map itself sits on a navy island inside it, because the
glow needs darkness and the section around it does not.

The boundary between a white band and a cream one is **always a hard edge**: no
gradients, no fades.

Section padding is identical everywhere: **96px desktop / 56px mobile.** No exceptions.
Content max-width 1200px, 24px gutters. Body copy runs at **1.65 line height**, set once
on `body` so that every explicit `leading-*` on a headline or a caption still wins.

### Typography — use the fonts already installed

The project already loads Anton, Barlow, Inter Variable and JetBrains Mono, mapped to
`--font-display`, `--font-heading`, `--font-sans` and `--font-mono`. Use these. Do not
introduce a new typeface.

- `--font-heading` (**Barlow**) — all section headlines and the hero. This is what matches
  the mock-ups.
- `--font-sans` (**Inter**) — body copy, labels, UI.
- `--font-display` (**Anton**) — reserve for the very largest display moments only. Do not
  use it for ordinary section headings; it is too condensed and breaks the mock-up look.

```
Display   52px / 800 / letter-spacing -0.02em / line-height 1.1   (Barlow)
H1        36px / 700 / -0.01em                                    (Barlow)
H2        26px / 700                                              (Barlow)
H3        19px / 600                                              (Barlow)
Lede      17px / 400 / line-height 1.6                            (Inter)
Body      15px / 400 / line-height 1.65                           (Inter)
Eyebrow   12px / 600 / +0.14em tracking / UPPERCASE / teal         (Inter)
```

Headline emphasis = colouring one phrase orange. Never a second typeface, never underlines.
Body never below 15px. Line length capped at 68 characters.

**The colour proportion target documented in `styles.css` is correct, keep it:**
white and cream 75 to 80% · navy 10 to 15%, as ink and islands · teal 5% · orange 3%.
Orange marks the one action a page exists to get. Teal marks data, verification and
secondary actions.

### Icon system

**Lucide icons only. No emoji anywhere on this site, ever. No AI-generated icon images.**

Spec: 24px icon centred in a 60px circle. Stroke 1.6px, rounded caps and joins. Ring is
1.5px at `rgba(255,255,255,0.28)` on navy, the navy (`--brand-ink`) at 18% on cream. Icon stroke is
white on navy / navy-800 on cream, with **exactly one** detail element in the accent colour
— orange for human icons, teal for data icons. Never two accents. Never filled shapes.

Role icons: Investor `HandCoins` · Landlord `House` · Developer `Crane` · Housing Association
`House`+`Users` · Local Authority `Landmark` · Care Provider `HandHeart` · Support Provider
`UsersRound` · Social Worker `UserRound`+`Heart` · Broker `Handshake` · Resident `UserRound`

Conversational icons — Israel explicitly asked for these, paired with copy so statements and
questions feel human rather than flat:

| Moment | Icon | Accent |
|---|---|---|
| Asking a question / thinking | `MessageCircleQuestion` / `Lightbulb` | teal |
| Making a statement | `MessageSquareQuote` / `Megaphone` | orange |
| People in a meeting | `Users` / `Presentation` | orange |
| Care, purpose, affirmation | `Heart` / `HandHeart` | orange |
| AI / intelligence | `BrainCircuit` / `Sparkles` | teal |
| Data network | `Network` / `Share2` | teal |
| Trusted data source | `ShieldCheck` | teal |
| Working 24/7 | `Clock` | teal |
| National demand | `MapPin` / `Map` | orange |
| Live property database | `Database` | teal |
| Families | `Users` | orange |
| Children | `Baby` | orange |
| Hospital discharge | `Hospital` | orange |
| Waiting list | `ClipboardList` | orange |

**Replace every tick, checkmark and plain bullet on the site with an icon from this set.**

### Logo usage

The official mark is reproduced as a coded SVG in `src/components/logo.tsx`. It is a faithful
reconstruction of the approved artwork and should be used everywhere — never a raster image,
never a retyped wordmark. Reference crops of the official artwork are committed at
`public/images/logo-reference-mockup1.png` and `logo-reference-mockup2.png` for comparison.

**Anatomy** — a split ring (orange upper arc, neutral lower arc) enclosing an outlined house
with a chimney, containing two figures: a taller neutral adult on the left and a shorter
orange child on the right. Beside it, the stacked wordmark: "Impact" in neutral, "Investment"
in `orange-500`, and "Platform" beneath in wide-tracked caps flanked by two orange rules.

**Rules**

- **On navy** — neutral elements render white, orange unchanged. This is the default.
- **On cream** — neutral elements must render `navy-900`, orange unchanged. White-on-cream is
  invisible. The component needs a variant prop for this; do not place the navy-ground logo
  on a light section without it.
- The orange is never substituted, tinted or gradient-filled.
- The ring-and-house mark may be used alone as a favicon, avatar or compact header mark.
  **The wordmark is never used without the mark.**
- Minimum sizes: 32px for the mark alone, 140px wide for the full lockup.
- Clear space on all sides equals the height of the "I" in "Impact".
- Never stretch, rotate, skew, outline, add shadows, or apply effects.
- Never place the logo over a busy photograph without a scrim behind it.
- The logo is always the link to the homepage — there is no Home nav item.

### Imagery

Photoreal UK residential settings: Victorian terraces, brick, sash windows. Bright, soft
daylight with neutral white balance, natural skin tones and readable shadow detail, per
Israel's 3 November 2026 direction. Avoid golden-hour grading, amber washes and dark interiors.
Candid everyday moments with relaxed expressions, rumpled fabrics, flyaway hair and real
skin texture. Use ordinary camera softness, not polished stock-photo sharpness or artificial
bokeh. Preserve team headshots, logos, diagrams and AI characters. 12px corner radius, 1px
subtle border. Images in the same row are always identical dimensions.

Never: generic corporate stock, cold blue-grey lighting, cut-out people on flat backgrounds,
duotones, colour overlays, visible AI artefacts.

### Components

- **Primary button** — orange-600 fill, white 16px semibold, fully rounded pill, 13px/26px
  padding, optional right arrow.
- **Secondary button**: transparent, 1px teal-600 border, teal-600 label, filling to the
  teal bed (`bg-secondary`, 4.66:1) on hover. Only beside a primary.
- **Data button**: teal-600 fill with a white label. Platform, demo and map actions only.
- **Card on white**: white fill, 1px `border-rule`, `--shadow-card`, 16px radius,
  20 to 24px padding. The `panel` utility is exactly this.
- **Card on cream**: the same card. Where one needs to separate from the cream instead,
  `panel-deep` makes it cream on white.
- **Icon plate**: a 24px glyph on a soft 12% disc of its own colour, no ring. Orange for
  human icons, teal for data icons. **One accent per glyph, never two.**
- **Stat figure**: 44px/800, teal-600 on a light ground or teal-400 inside an island,
  13px uppercase label at +0.12em tracking.
- **Header**: the page colour (`--color-page`) at 92% with `backdrop-filter: blur`, a permanent 1px `border-rule`
  underneath, navy nav labels, the active route in orange-700 over an orange-500
  underline, and the register pill in orange-600.
- **Hover**: 200ms ease-out. Cards lift 2px and the shadow deepens to
  `--shadow-card-hover`. **A card that lifts on hover lifts on focus too**; a tile that
  only answers to a mouse answers to half its visitors.
- **Photography**: 12 to 16px radius, a 1px `border-rule`, and **no scrim on a light
  ground**.

---

## 3. Navigation — confirmed, not yet implemented

```
Logo (links to homepage) · About Us · Our Services · The Problem ·
The Solution · Contact Us · [Register Here] · Login
```

- **No Homepage tab** — the logo is the home link.
- Nav links 15px/500, white on navy, orange underline on hover, orange when active.
- **Register Here** is a primary pill button (orange-600).
- **Login** is a plain text link, far right, lighter weight.
- **"Book a Demo" must be removed from the entire site** — every instance, every section,
  every footer. It currently appears in the nav, the Live UK Demand section and the final CTA.

---

## 4. Agreed homepage structure

| # | Section | State |
|---|---|---|
| 1 | **Hero** — identical to Mock-up 1 | Built, needs brand pass |
| 2 | **Our Purpose \| The Problem** — ONE section, purpose left, problem right | Not merged yet |
| 3 | **Our Solution** | Needs AI content |
| 4 | **The Accountable Chain Behind It** | Keep as-is |
| 5 | **Live UK Demand** — the map | Needs restyle to Mock-up 2 |
| 6 | **Who We Connect** — condensed band | Done |
| 7 | **Join the UK's Housing, Care and Support Ecosystem** | Keep |
| 8 | **Footer** | Needs scrolling local authorities |

**Deleted and staying deleted:** the process strip · How the Ecosystem Works · the
"Providing homes / three AI images" band · Success Stories.

**Deleted TEMPORARILY — must come back:** the **AI Platform** section
("Intelligence That Supports Better Decisions") and its Matches / Demand / Placements
demo panel. Removed only because the copy is pending from Israel. Reinstate once it lands.

---

## 5. Israel's meeting notes — the source requirements

### Global
- Remove "Book a Demo" everywhere.
- Mock-up 1 is the approved direction — implement it.
- Consistency of colours and branding. Cream is a core colour.
- Create a brand kit file. (Done — this document plus the brand kit HTML.)
- Vibrancy matters: teal, cream, white alongside the navy and orange.
- **Every section must be a mini-breakdown of Mock-up 1** — same colour treatment, same
  branding, same imagery quality. Not "similar". Identical.
- Consistent font sizing, imagery and icon style throughout.
- Icons not emoji. Match the icon to the tone: thinking-person for questions,
  speaking/meeting for statements. Visual, interactive, affirming — like human conversation.
- Introduce people-based icons alongside sentences, paragraphs, statements and questions.

### Our Purpose | The Problem (one section)
Purpose: **to ensure that every person has a home to live in.** Support it with data,
presented in boxes:
- Homes needed to alleviate UK homelessness
- Homes needed for hospital discharge
- Homes needed for local authority waiting lists
- Homes needed for children (children's homes)
- Homes to be built over 5 years
- Capital required to deliver (£ figure)

Plus a statement that the platform is building a national AI-driven [wording pending].
Imagery: the de-anchored hero image from the old iip-web site, as a full-width band.

### Our Solution
- Icons instead of ticks for bullet points.
- Bring AI to the front. Keywords: **demand-led · AI-driven intelligence · qualified,
  intelligent AI data.**
- Say what the platform actually is and does: demand-led, AI-driven intelligence data
  connects all organisations, saves time and money, connects people, gets solutions to
  market far faster than conventional means.
- Headline statement: *"Our platform works 24/7 to create seamless, intelligent matching,
  ensuring all partners have the resources, solutions and opportunities to deliver
  individual and national impact."*
- Three boxes with icons drawing on: AI data · national demand · trusted data sources ·
  Zoopla partnership · access to 1 million homes · national database of live available
  property · live AI API · partners Zoopla and HomeSource.
- Footer: scrolling local authority names/logos — interactive element at the bottom.

### Live UK Demand
- **The map must match Mock-up 2** — the glowing particle/network UK map on deep navy with
  orange hotspot nodes and connecting arcs. Keep the existing interactivity, restyle the
  visuals.
- Use the space to the LEFT of the map for **3–4 icon bullet points** with short statements:
  AI-driven data, demand-led from local authorities, connecting partners to demand — how it
  works, how it benefits the user, how it benefits the world.
- Demand categories need icon consistency with the rest of the site.
- **Add categories:** local authority waiting list, children. (Families already exists.)
- Region & Local Authority dropdown: add a note that this is illustrative for demonstration
  purposes; the real platform performs detailed data analysis and connections. Frame it as a
  taster with a near-perfect demo available.
- A carousel is wanted within this section.

### Landing page structure
The landing page should be a **summary/snapshot of each of the six nav pages**, each linking
through to its full page. **This has not been built or specified yet.**

---

## 6. Data already on the site (verified, cited)

Do not invent numbers. These are already present and sourced:

| Figure | What | Source |
|---|---|---|
| 176,130 | Children in temporary accommodation in England | gov.uk, at 31 Dec 2025 |
| 330,410 | Households owed a homelessness duty, 2024–25 | gov.uk, full year 2024–25 |
| 677,202 | Supported homes England needs by 2040 | National Housing Federation, Apr 2024 |
| £102m/yr | NHS cost of people waiting in hospital for supported housing | Inside Housing, Apr 2026 |
| 430% | Rise in council B&B emergency accommodation spend, 2010/11–2019/20 | LGA, Jul 2021 |

---

## 7. Blocked — needed from Israel before these can be finished

1. Exact AI / data-driven platform wording
2. Local authority waiting list figure
3. Children's homes figure
4. Homes to build in 5 years target
5. Capital required / fundraising figure
6. The three ChatGPT links containing the full site content
7. Confirmation of the teal shade

Render every missing figure as literal bracketed placeholder text — e.g. `[FIGURE TBC]` —
so it is obvious it is pending. **Never invent a number on this project.**

---

## 8. Working rules

- **The site is light.** White page, cream bands, navy as ink. At most one navy island
  inside `<main>` per route, and never in the first viewport.
- **Every colour pair is measured, not assumed**, and the ratio goes in the wave report.
  `scripts/wave412-screenshots.py` is the gate: it shoots every route at 1280 and 390 and
  asserts no horizontal overflow, a light body and header, at most one island, a dark
  pixel share under 15%, no serious axe colour-contrast violation, that every node axe
  returns as INCOMPLETE measures at or above its floor off the screenshot's own pixels,
  that no above-the-fold `Reveal` is painted and then un-painted at hydration, and that
  the page has words on it.
- **The 15% is a flat ceiling everywhere except the home page**, whose three approved
  hero photographs and brand orange fills cannot reach it, and which is therefore listed
  in the gate's `RAW_CEILING` at the highest figure measured on it (23.56% at 1280,
  22.19% at 390, and it varies by about a tenth of a point between runs because the page
  animates): a RATCHET a later wave may lower and may not raise without saying why in
  the script, while its page-ground figure still answers to the flat 15%.
- **No hex in a component.** Every colour comes from `src/styles.css` by name. If a
  pairing fails, the SURFACE moves, never the orange.
- **No class that lies.** A component that says `bg-navy-800` renders navy. The light
  remap that used to translate the dark palette on the fly was deleted in wave 412; do
  not bring it back, and fix the component instead.
- **No content is ever invisible without JavaScript.** The `Reveal` utility's resting
  state is visible and the JS adds the hidden-then-rise state for one frame; anything
  still pending 900ms after mount reveals anyway.
- **And nothing the server already painted is animated.** An element on screen at mount
  takes `data-revealed="static"` and no animation at all, because `rise-in` is declared
  with `both` and its backwards fill starts at opacity 0: putting it on prerendered
  content blinks away what the visitor is already reading. Only `"pending"` may become
  `"true"`. The gate probes for this on `/about` and `/partner-with-investor`.
- No emoji anywhere in the product.
- No fabricated data, statistics or citations.
- When a section is finished, state which of the owner's notes it satisfies and which
  remain open.
