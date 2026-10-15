# eSalex ai website (production build)

A standalone static site: plain HTML, CSS and a little JavaScript. No framework, no build step, no dependencies. It is the approved Design-canvas version, converted so it can be hosted anywhere.

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | The home page, with SEO tags and structured data (JSON-LD) in the head |
| `services/<name>/index.html` | The four service pages (listings, product images, ads and PPC, Shopify and workflows). Generated, see "Service pages" below |
| `audit.css`, `audit.js` | The "Book a free audit" pop-up form (styles and behaviour). Loaded on every page |
| `service.css` | Extra styling used only by the service pages (loads after `styles.css`) |
| `styles.css` | All styling (brand colors, DM Sans and JetBrains Mono, animations, responsive rules) |
| `app.js` | Activity feed, rolling numbers, lazy video, off-screen animation pausing and the draggable 3D Earth |
| `assets/` | Product photos, Earth map and posters, short videos, brand pattern tile, share image. `assets/hero-*.mp4/jpg` are the service-page hero loops, `assets/work/` holds portfolio images |
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
6. **More pages.** The four service pages are built and listed in the sitemap. `/work`, `/about` and `/contact` are not built yet (work lives in a home-page section and on each service page), so they are not in the sitemap. Add them when you have the content.
7. **Service-page placeholders.** `YOURDOMAIN.com` is also in every `services/*/index.html` (canonical, og: tags, JSON-LD). Replace it there too. Easiest: set `$Domain` at the top of `../build/lib.ps1` and run the build again (see below).

## Service pages

Each service has its own page: hero loop video, what you get, an animated four-step explainer, a work section, an Upwork track-record block, FAQ and related services. The motion graphics are built in code in the brand style (CSS only, 16 second loop, 4 seconds per step). The hero loops were made with Higgsfield (Seedance 2.5).

The pages are generated from templates in `../build/` so the four stay consistent:

| File | Edit it to change |
|---|---|
| `build/pages.ps1` | Page titles, descriptions, at-a-glance facts, the six feature cards, FAQ answers, which work cards appear, headings in the track-record and call-to-action blocks |
| `build/pages/*.html` | The hero copy, the four steps and the animated scenes on each page |
| `build/lib.ps1` | The domain, the portfolio items (title, image, link, description) and the pixel icons |
| `build/shell.html` | The head, navigation and footer shared by all four pages |

After any edit, run this from the `build` folder:

```
powershell -ExecutionPolicy Bypass -File build.ps1
```

**Replacing a demo project with a real one:** put the image in `site/assets/work/`, add an entry to `$WorkItems` in `lib.ps1`, then swap the `DemoCard ...` line for `WorkCard 'your-id'` in the page's `work` block in `pages.ps1`. Demo cards are always labelled "Demo project" on the page.

**What is real and what is a demo:** Behance projects, the two Shopify stores and the Upwork numbers and review quote are real and public. The Upwork numbers (Top Rated Plus, 99% Job Success, 5.0 from 46 reviews, 11K+ hours) come from the lead designer's public profile, and the page says so. Everything labelled "Demo project" is a sample made to show the process, not client work. The ads and workflow pages rely on demos for now because there are no live AI-automation case studies yet.

## The "Book a free audit" pop-up

Every link or button that says "Book a free audit" opens a pop-up form instead of leaving the page (home page, service pages, menu, footer). It asks for name, email, phone, store or website link, social links (optional), a short business description and what they want to automate (optional). A progress bar, a three-step rail and the button itself fill up as the visitor completes fields, and the button starts pulsing when everything is ready. Name, email, phone, store link and description are required. The link `yoursite/#audit` also opens it.

**It does not send anywhere until you connect it.** Open `audit.js` and set ONE value in `CONFIG` near the top:

| Setting | What happens |
|---|---|
| `endpoint: 'https://formspree.io/f/xxxxxxx'` | The answers are sent as JSON to a form service (Formspree works as is; sign up yourself and paste the form URL). Netlify, Getform and similar services also work if they accept a JSON POST. |
| `email: 'you@yourdomain.com'` | The visitor's email app opens with the answers filled in, addressed to you. No service needed, but the visitor must press send. |
| neither (current state) | Test mode. Nothing is sent, and the thank-you screen says "Test mode: this form is not connected yet". |

Unsent forms are not saved anywhere. Whatever a visitor types is kept only in their own browser tab (so closing the pop-up by accident does not lose it) and is cleared after sending.

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
