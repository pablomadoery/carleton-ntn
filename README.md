# Carleton-NTN Lab — Website

A self-contained, dependency-free website for the **Carleton Non-Terrestrial
Networks (Carleton-NTN) Lab**, directed by Chancellor's Professor
**Halim Yanikomeroglu** at Carleton University, Ottawa.

> **Look & feel.** Light, bright, and aligned with the official Carleton
> University visual identity: **Carleton Red `#E91C24`**, **Carleton Black
> `#231F20`**, white, Helvetica/Arial typography with a Georgia serif accent. The
> hero is a live, hand-coded daytime "ground to orbit" scene (cellular towers →
> drones → HAPS → LEO/GEO satellites) with data packets climbing from Earth to
> orbit. The user-supplied `satellite.svg` and `haps.svg` sprites are mixed into
> the animation alongside the code-drawn elements.

## Run it

No build step, no framework, no install. Serve the folder and open it:

```bash
cd website
python3 -m http.server 8000   # → http://localhost:8000
```

(A local server is recommended so SVG sprites and logos load under a normal
origin. Opening `index.html` directly also works in most browsers.)

## Files

```
website/
├── index.html            # all content + structure (works without JS)
├── css/styles.css         # Carleton-brand light design system
├── js/scene.js            # hero "ground to orbit" canvas animation (no deps)
├── js/main.js             # nav, scroll-spy, counters, reveal, filters, layer tabs
├── assets/
│   ├── carleton_university.png   # institutional logo (top-left, links home)
│   ├── carleton_ntn_logo.jpeg    # lab logo (links to LinkedIn)
│   ├── satellite.svg, haps.svg   # sprites used in the hero animation
│   └── logos/                    # partner logo wall
└── README.md
```

## Sections

Hero · 01 Vision · 02 Research (interactive altitude layers) · 03 Publications
(topic filters) · 04 People · 05 Impact (patents, NTN-CAN, partner logos) ·
06 News · 07 Recognition · Contact.

## Notable details

- **Two logos at the top.** The Carleton University logo links to the home anchor;
  the circular Carleton-NTN lab logo links to the lab's LinkedIn page.
- **Afsoon Alidadi Shamsabadi** and **Gunes Karabulut Kurt** are featured as
  secondary leads under the director (Afsoon as Lab Manager, Gunes as Principal
  Collaborator).
- **Publication cards** open Halim Yanikomeroglu's Google Scholar profile.
- **Partner logo wall** uses the supplied logos (MDA, NRC, DRDC, DND, Honeywell)
  plus Qualcomm, Telesat, Huawei, Canadian Space Agency, NSERC, Mitacs, and CRC.
  Logos for partners without a supplied file are clean monochrome wordmarks; drop a
  real logo into `assets/logos/` (same filename) to replace one.
- **Accessibility / performance.** Semantic landmarks, keyboard-navigable, works
  without JavaScript, and the canvas honours `prefers-reduced-motion` (single
  static frame), caps device-pixel-ratio, and pauses off-screen.

## Content provenance

Every figure, name, quote, and link is drawn from the source material in the
parent directory (`../01-profile.md` … `../14-linkedin.md`, `../sources/`,
including the IEEE Ottawa Outstanding Engineer Award nomination package). The
impact facts (UAV base stations → 3GPP R17, wireless relaying → Apple patent, the
LEO patent acquired by MDA Space) come from that nomination.

## Links to verify

External links were status-checked. Note: the department host
`www.sce.carleton.ca` (the **Faculty page** link) was unreachable from the build
sandbox while `carleton.ca` resolved — it is the canonical URL from the source and
should work normally, but please confirm it in a browser. ResearchGate, LinkedIn
profiles, and polymtl.ca return bot-protection codes to scripts but work in a
browser.

## Deploy

Static site — host anywhere (GitHub Pages, Netlify, Vercel, Cloudflare Pages, or
any static file server) pointed at this `website/` folder.
