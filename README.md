# eSalex ai website (production build)

A standalone static site: plain HTML, CSS and a little JavaScript. No framework, no build step, no dependencies. It is the approved Design-canvas version, converted so it can be hosted anywhere.

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | The whole page, with SEO tags and structured data (JSON-LD) in the head |
| `styles.css` | All styling (brand colors, DM Sans and JetBrains Mono, animations, responsive rules) |
| `app.js` | Activity feed, rolling numbers, lazy video, off-screen animation pausing and the draggable 3D Earth |
| `assets/` | Product photos, Earth map and posters, two short videos, brand pattern tile, share image |
| `favicon.svg` | The eSalex ai mark as a tab icon |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Search and AI-assistant files (copied from `../seo/`) |
| `_headers` | Caching and security headers (works on Cloudflare Pages and Netlify) |

## Run it on your computer

The 3D globe needs the site to be served over http, so don't just double-click `index.html`. (If you do, everything works except the draggable globe, which falls back to a looping Earth video.)

Pick one:

- VS Code: install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".
- Node: run `npx serve .` inside this folder.
- Python: run `python -m http.server 8080` inside this folder, then open http://localhost:8080.

## Put it online

The easiest options are free for a site this size:

1. **Cloudflare Pages or Netlify:** create a project and drag this whole `site` folder onto the upload area. Then connect your domain in their settings.
2. **GitHub Pages:** put the contents of this folder in a repository and turn on Pages.

Whichever you pick, `index.html` must be at the top level of what you upload.

## Before you launch: fill these in

1. **Domain.** Search all files for `YOURDOMAIN.com` and replace it with the real domain: `index.html` (canonical, og tags and the JSON-LD block), `sitemap.xml`, `robots.txt`, `llms.txt`.
2. **Booking link or email.** The "Book a free audit" and "See our Upwork profile" buttons point to the Upwork agency page (`https://www.upwork.com/agencies/1002230983337877504/`) or to `#contact`. Search `index.html` for `upwork.com/agencies` and `#contact` and swap in a booking link or `mailto:` address.
3. **Share image.** `assets/og-card.jpg` is a crop of the Earth render, used when the link is shared. Replace it with a designed 1200 x 630 card when you have one.
4. **Proof.** The three "work" cards describe real work without client names. Add names, screenshots and reviews only with each client's permission.
5. **Claims.** Check every statement is something you can back up (founded 2018, seven platforms, human review of all output).
6. **More pages.** The sitemap lists four service pages (`/services/...`), `/work`, `/about` and `/contact` that do not exist yet. Either build them (see `../seo/SEO-PLAYBOOK.md`) or delete those lines from `sitemap.xml` and `llms.txt`.

## How it behaves

- **Fast by default:** the heavy video loads only when you scroll near it. Sections that are off screen pause their animations. The globe stops drawing when it is not visible.
- **Reduced motion:** if a visitor's device asks for less motion, auto-spinning and autoplay stop and the globe is still draggable.
- **No JavaScript:** the text, links, FAQ and menu all still work. The rolling numbers show their final values.
- **Browsers:** built for current Chrome, Edge, Safari and Firefox. The scroll-linked fade-ins need a recent Chromium browser; others show the content straight away.

## Brand reference

Ink Black `#0C0D10`, Signal Orange `#F26B21`, Paper `#F4F4F2`, Graphite `#8A8B8F`. Fonts: DM Sans (text and headlines, SemiBold with tight spacing, no bold 700) and JetBrains Mono (small uppercase labels). The accent color is one CSS variable, `--accent`, at the top of `styles.css`.

## Credits

Earth night-lights map: NASA Earth Observatory image by Joshua Stevens, using Suomi NPP VIIRS data (public domain). The credit is shown in the footer. Product photos, the Earth video and the call-to-action video were generated with Higgsfield.

## Optional improvements

- Self-host the two fonts (download from Google Fonts, add `@font-face`) to remove the third-party request.
- Convert the product photos to WebP or AVIF.
- Connect a real booking tool or contact form.
