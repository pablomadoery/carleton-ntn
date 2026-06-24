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
├── js/chat.js             # "Ask the Lab" chatbot widget (front-end)
├── api/chat.js            # serverless chatbot endpoint (owns the API key)
├── api/knowledge.js       # AUTO-GENERATED grounding text (the bot's only source)
├── scripts/build-knowledge.mjs  # compiles ../*.md into api/knowledge.js
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

## Chatbot — "Ask the Lab"

A cheap, grounded Q&A bot in the bottom-right corner. It answers **only** from
this website's content and refuses to invent anything, with a hard limit of
**10 questions per session**.

**How it works** — same skeleton as the `roxy-judge` endpoint: a Vercel
serverless function (`api/chat.js`) holds the Anthropic key server-side, so the
browser never sees it. The function sends the visitor's question plus the lab's
content (`api/knowledge.js`) to Claude (`claude-haiku-4-5`, `temperature: 0`)
with strict "answer only from CONTEXT, otherwise say you don't have it" rules.
No npm dependencies (native `fetch` + `node:crypto`) and no database — the
per-session limit is a signed, `HttpOnly` cookie.

### One-time setup on Vercel (project `carleton-ntn`)

Add two Environment Variables in **Project → Settings → Environment Variables**,
then redeploy:

| Variable | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | a **new** Anthropic key (e.g. named `ntn-chatbot`) so its spend is tracked apart from `roxy-judge`. Same Anthropic balance you already top up. |
| `CHAT_SESSION_SECRET` | any long random string (signs the session cookie). Generate with `openssl rand -base64 32`. |

**Cost control:** set a **monthly usage limit** on the `ntn-chatbot` key in the
Anthropic console. That is the real hard backstop — the cookie limit stops
ordinary visitors at 10, but a session resets if someone clears cookies, so the
key's spend cap is what guarantees the bill can never run away. With prompt
caching on the ~21K-token knowledge block, expect roughly a few cents per
10-question session.

### Updating the bot's knowledge

The bot reads `api/knowledge.js`, which is **generated** from the source
markdown. After editing any `../01-profile.md … ../14-linkedin.md`, regenerate
and redeploy:

```bash
cd website
node scripts/build-knowledge.mjs   # rewrites api/knowledge.js
```

Tune how much content (and therefore cost) goes in by editing the per-file
character budgets at the top of `scripts/build-knowledge.mjs`.

> Note: `api/knowledge.js` is built from files in the **parent** directory, which
> are outside this `website/` git repo. The generated file is committed and
> deployed, so the build script only needs to run locally — never on Vercel.

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

The pages are static, but the chatbot adds a serverless function (`api/chat.js`),
so deploy to a host that runs Node functions — this project is on **Vercel**
(project `carleton-ntn`). Zero-config: Vercel serves the static files and turns
`api/*.js` into functions automatically (no `package.json` or build step needed).
The site still renders fine on a pure static host; only the "Ask the Lab" widget
needs the function and the env vars above.
