# Boris Tsang — portfolio

A static portfolio + CTF writeups site. No build step, no framework. Plain
HTML/CSS/JS you can host on anything (GitHub Pages, Netlify, an S3 bucket).

## Run it locally

The article page loads markdown with `fetch()`, which browsers block on
`file://`. So serve the folder over HTTP:

```bash
cd portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html            Home (scaffold — terminal game + full content land later)
writeups.html         Writeups index: filterable card grid
article.html          Renders one writeup from ?slug=<name>
assets/
  site.css            Shared design tokens, nav, footer
  theme.js            Light/dark toggle (persisted) + hide-on-scroll nav
  markdown.js         Tiny self-contained Markdown -> HTML renderer
writeups/
  posts.js            Manifest: metadata for the index + tag colors
  ret2libc.md         Example writeup (pwn)
  cookie-crumbs.md    Example writeup (web)
  gdb-unpack.md       Example writeup (rev)
```

## Add a writeup

1. Create `writeups/<slug>.md` with front-matter:

   ```markdown
   ---
   title: My new writeup
   tag: pwn        # pwn | web | rev | misc (drives the color)
   date: 2026-07-01
   ctf: SomeCTF 2026
   read: 5 min
   ---

   Body goes here. Supports headings, **bold**, *italic*, `code`,
   fenced ```code blocks```, > blockquotes, lists, links, images, and ---.
   ```

2. Add an entry to `writeups/posts.js` (newest first). The `slug` must match
   the `.md` filename without the extension:

   ```js
   { slug: 'my-new-writeup', date: '2026-07-01', tag: 'pwn',
     ctf: 'SomeCTF 2026', title: 'My new writeup', desc: 'One-line summary.' }
   ```

That's it — the index picks it up and `article.html?slug=my-new-writeup` renders it.

## Adding a new tag color

Add a key to `window.TAG_COLORS` in `writeups/posts.js`
(`lbg`/`lfg` = light bg/fg, `dbg`/`dfg` = dark bg/fg), then use that tag in a
post. To make it appear as a filter button, add it to the array in the
`renderFilters` loop in `writeups.html`.

## Design source

The visual design originates from the Claude Design project
`Writeups.dc.html`. These files are the runnable port of that design — same
fonts, palette, and layout, rewritten as standard static HTML.

## TODO

- [ ] Flesh out `index.html` (about, projects, journey)
- [ ] Terminal game on the home page
- [ ] `favicon.png` / `og-image.png` (referenced but not yet added)
