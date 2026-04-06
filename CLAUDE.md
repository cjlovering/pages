# CLAUDE.md

Personal portfolio / blog — static site for research write-ups, expositions, and technical notes.

## Stack

- **SvelteKit 2** (Svelte 5 with runes) + Vite, static adapter → pre-rendered HTML
- **Tailwind CSS v4** (inline `@theme` in `layout.css`, no separate config file)
- **D3** for interactive charts (fenway, find articles)
- **Highlight.js** (solarized-light) for code blocks
- Deployed to **GitHub Pages** via Actions (pushes to `master`)

## Commands

```
just dev      # HMR dev server (runs inside site/)
just build    # npm ci + vite build → site/build/
just serve    # build then serve with npx serve
```

## Directory layout

```
site/
  src/
    routes/
      +layout.svelte        # Root layout (header, footer, global head tags)
      +page.svelte           # Landing page (bio, article index, canvas viz)
      layout.css             # Tailwind theme tokens + global CSS
      [slug]/+page.svelte    # Each article is a standalone Svelte page
    lib/
      posts/index.js         # Article metadata (slug, title, subtitle, date, section, tags)
      components/            # Shared components (Sidenote, Figure, CodeBlock, Toc, …)
      charts/                # D3 chart components + unified theme.js
  static/                    # Images, data files, favicons
  build/                     # Static output (gitignored)
```

## Adding an article

1. Create `site/src/routes/[slug]/+page.svelte`
2. Register in `site/src/lib/posts/index.js` (slug, title, subtitle, date, section, tags)
3. Use components: `Sidenote`, `Figure`, `FigureGrid`, `CodeBlock`, `Toc`, `ExampleCard`

## Post metadata shape

```js
{ slug, title, subtitle, date: '2025', section: 'research'|'exposition'|'notes', tags: [] }
```

## Style conventions

- **Fonts**: serif (body), sans (UI/nav), display/Chakra Petch (headings), mono (code)
- **Colors**: warm ink palette (`ink` → `ink-5`), paper-white surfaces, red accent `#AD2111`
- **Articles**: wrapped in `<article class="relative max-w-prose mx-auto">`
- **Links**: `text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60`
- **Figures**: auto-numbered via CSS counters
- **Sidenotes**: Tufte-style margin notes, collapse inline on mobile

## Svelte 5 patterns

- Props: `let { x } = $props()`
- State: `$state()`, `$derived()`
- Snippets: `{#snippet name()}…{/snippet}` + `{@render name()}`
- No TypeScript — plain JS with JSDoc where needed
