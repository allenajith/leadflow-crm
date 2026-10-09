# leadflow frontend

A React single-page app for the LeadFlow CRM, styled after `old.reddit.com`.

It talks to the Express + Prisma API in `../server`. This file explains every
file in the project and why it exists — written for someone new to frontend work.

---

## Running it

Two terminals.

```powershell
# terminal 1 — the API
cd ..\server
npm install
npx prisma generate
npm run dev          # http://localhost:5000
```

```powershell
# terminal 2 — this app
npm run dev          # http://localhost:5173
```

The server needs `server/.env` (gitignored, so a fresh clone won't have it):

```
DATABASE_URL="postgresql://user:password@localhost:5432/leadflow"
JWT_SECRET="any-long-random-string"
```

---

## The stack, and why

| Tool | Job |
| --- | --- |
| **Vite** | Dev server + bundler. Serves the app while you work, compiles it to static files for production. |
| **React** | The UI library. You write functions that return markup; React keeps the screen in sync with your data. |
| **TypeScript** | JavaScript with type annotations. Catches `lead.compamy` before you run it. |
| **Tailwind CSS** | Styling via utility classes in the markup (`px-2 text-meta`) instead of a separate stylesheet. |
| **shadcn/ui** | Accessible components (Dialog, Select) **copied into your repo** as source you own and can edit — not an installed package. |
| **React Router** | Maps URLs to components, so `/leads/3` renders the detail page. |

---

## How it's layered

Each layer only talks to the one below it. That's the single most important
idea in the codebase:

```
pages/           what a screen looks like
  ↓
components/      reusable pieces of screen
  ↓
lib/auth.tsx     who is logged in
  ↓
lib/api.ts       the only file that knows HTTP exists
  ↓
the Express server
```

Nothing above `api.ts` knows about `fetch`, tokens or status codes. Change how
auth headers work and you edit one function, not twelve call sites.

---

# Layer 1 — Configuration

### `vite.config.ts`

Three things are configured here.

**Plugins.** `react()` teaches Vite to understand JSX. `tailwindcss()` processes
the utility classes.

**The `@` alias.** Maps `@` to `src/`, so you write `@/lib/api` from anywhere
instead of counting dots (`../../lib/api`). The tsconfig files need the same
mapping separately — Vite resolves it at runtime, TypeScript needs telling or
your editor shows errors that aren't real.

**The dev proxy.** The important one:

```ts
server: { proxy: { '/api': 'http://localhost:5000' } }
```

This app runs on port 5173, the API on 5000. Browsers block requests across
different ports — the *same-origin policy*, which is what CORS exists to work
around. The proxy avoids the problem entirely: the app asks its own server for
`/api/leads`, and Vite quietly forwards it to `:5000`. As far as the browser is
concerned it's all one origin.

That's why `api.ts` has no base URL and no environment variable.

### `tsconfig.json` and `tsconfig.app.json`

TypeScript's settings. Both got the `@/*` → `./src/*` mapping. There are two
files because Vite separates app code from build-tool code; the root one is what
shadcn's CLI reads, the app one is what actually type-checks your code.

### `index.html`

The only real HTML page. Everything you see is React injected into
`<div id="root">`.

### `components.json`

shadcn's config — which style, where to put generated components, which import
aliases to use. Read by the CLI when you run `npx shadcn@latest add <thing>`.

---

# Layer 2 — Styling

### `src/index.css`

The only stylesheet in the project. Four parts:

**`@theme inline`** declares design tokens — named values that Tailwind turns
into utility classes. Declaring `--color-reddit-orange: #ff4500` generates
`text-reddit-orange`, `bg-reddit-orange`, `border-reddit-orange`. The old.reddit
palette lives here:

| Token | Value | Where it came from |
| --- | --- | --- |
| `--color-reddit-orange` | `#ff4500` | the logo and upvote colour |
| `--color-header-blue` | `#cee3f8` | the tab bar |
| `--color-header-edge` | `#5f99cf` | the 1px borders on boxes |
| `--color-link` | `#0000ff` | unvisited post titles |
| `--color-link-visited` | `#551a8b` | visited ones |
| `--color-meta` | `#888888` | taglines and action links |
| `--color-row-alt` | `#f7f7f8` | alternating row stripes |

Every `--radius-*` is set to `0px`. 2008 had no rounded corners, and shadcn
defaults to rounding everything — this one change does a surprising share of the
aesthetic work.

**`:root`** overrides shadcn's *semantic* variables. shadcn components reference
`--primary`, `--border`, `--muted` rather than literal colours, so redefining
those here re-skins every component at once without editing a single component
file. `--primary: #ff4500` is why the buttons are orange.

**`@layer base`** sets global defaults: Verdana, `font-size: 12px` (old.reddit
used `x-small`), blue links that underline on hover.

**`@layer components`** holds the handful of reusable classes — `.rdt-tabbar`,
`.rdt-side-box`, `.rdt-tagline`, `.rdt-actions` — named after old.reddit's own
class names.

---

# Layer 3 — Data

### `src/lib/types.ts`

TypeScript descriptions of the data, mirroring `../server/prisma/schema.prisma`.
`Lead`, `User`, `LeadStatus`.

These are **compile-time only** — they disappear entirely in the browser. Their
whole job is catching mistakes in your editor.

It also holds `LEAD_STAGES` (the pipeline order), the label and colour maps, and
`nextStage()` / `prevStage()` — pure functions answering "what comes after
CONTACTED?". Keeping them in one place means the arrows, the badges and the
sidebar counts can't disagree.

### `src/lib/format.ts`

Two display helpers. `timeAgo()` turns a timestamp into `"3 hours ago"`,
old.reddit's tagline style. `fullDate()` gives the long form for the detail page.

Separate from the components because formatting is logic, not layout, and logic
in its own file is easy to test.

### `src/lib/api.ts`

**The only file that talks to the backend.**

A private `request()` function does the repetitive work once: prefixes `/api`,
sets JSON headers, reads the token from `localStorage`, attaches
`Authorization: Bearer <token>`, and checks the response.

It checks **both** `res.ok` and `body.success`, because the server sometimes
returns HTTP 200 with `success: false` — checking only the status code would let
failures through silently.

`ApiError` carries the status code alongside the message, so callers can tell a
401 from a 500.

Then `api` is a plain object with one method per endpoint:

| Method | Calls |
| --- | --- |
| `api.register()` | `POST /api/auth/register` |
| `api.login()` | `POST /api/auth/login` |
| `api.listLeads()` | `GET /api/leads` |
| `api.getLead(id)` | `GET /api/leads/:id` |
| `api.createLead()` | `POST /api/leads` |
| `api.updateLead(id)` | `PUT /api/leads/:id` |
| `api.deleteLead(id)` | `DELETE /api/leads/:id` |

### `src/lib/auth.tsx`

"Who is logged in", answered once for the whole app, using React **Context**.

The problem it solves: the header needs the username, the leads page needs the
token, the login page needs to set it. Threading that through every component by
hand — *prop drilling* — is miserable. Context is a value any descendant can
reach directly.

- `AuthProvider` wraps the app and holds the user in state. It seeds from
  `localStorage` on first render, which is why refreshing doesn't log you out.
- `login()` calls the API, saves the token and user, updates state.
- `register()` registers **then logs in automatically**, because the server's
  `/auth/register` returns a user but no token.
- `useAuth()` is the hook components call to read any of this.
- `RequireAuth` is the route guard: no user, redirect to `/login`, remembering
  where you were headed so you land there afterwards.

It's `.tsx` rather than `.ts` because it contains JSX.

### `src/lib/utils.ts`

Generated by shadcn. One line, re-exporting `cn()` — a helper that merges CSS
class strings and resolves Tailwind conflicts. Every shadcn component uses it.

---

# Layer 4 — Components

The mental model: **a component is a function that returns markup.** Lowercase
tags (`<div>`) are HTML. Capitalised tags (`<LeadRow>`) are your components.

- **Props** are the arguments passed into a component.
- **State** (`useState`) is memory that survives re-renders. Change it, and
  React redraws that part of the screen.

### `src/components/layout/Chrome.tsx`

The page frame every screen sits inside: the thin grey user strip (name, email,
logout), the blue tab bar with the orange `leadflow` wordmark, and the tabs.

The tabs use `?view=closed` rather than `/leads/closed`. The latter was the first
attempt, but it collides with `/leads/:id` — the router can't tell the path
segment `"closed"` from a lead id.

Also exports `SideBox`, the bordered right-hand box with the blue title bar,
reused on every page.

### `src/components/leads/LeadRow.tsx`

One lead in the listing — old.reddit's `.thing` — and the heart of the design.

**Reddit's vote arrows become pipeline controls.** Up advances a lead a stage
(`NEW → CONTACTED → QUALIFIED → CLOSED`), down walks it back, and the score slot
shows the current stage in its colour. At either end of the pipeline the relevant
arrow disables itself.

The arrows are drawn as pure CSS triangles — a zero-size box with thick
transparent side borders — which is how reddit itself did it.

The rest maps across directly: the lead name as a blue title link, the company in
parentheses where reddit showed the domain, a 10px grey tagline reading
`added 2 days ago · email · phone`, and a bold grey action strip where
`comments share save` used to be.

### `src/components/leads/LeadFormDialog.tsx`

One modal form doing double duty — **create** when given no `lead` prop, **edit**
when given one.

That's why `onSubmit` is a prop: this component collects input and doesn't care
whether the parent will POST or PUT. The parent decides.

A `useEffect` refills the fields whenever the dialog opens, so a cancelled edit
doesn't leave stale values behind the next time you open it.

The inputs are hand-rolled rather than using shadcn's `form` component — five
fields don't justify pulling in `react-hook-form` and `zod`.

### `src/components/ui/*.tsx`

Eleven files generated by shadcn: `button`, `input`, `label`, `card`, `table`,
`dialog`, `alert-dialog`, `select`, `dropdown-menu`, `sonner`, `badge`.

**You own these.** shadcn copies source into your repo rather than installing a
package, so you can edit them directly. They're built on Radix primitives, which
handle the fiddly accessibility work — focus trapping, keyboard navigation,
screen-reader announcements.

---

# Layer 5 — Pages

### `src/pages/Login.tsx` and `Register.tsx`

Near-identical forms inside a `SideBox`. Each keeps its fields in state, calls
`login()` or `register()` from the auth context, shows an error box on failure,
and navigates to `/leads` on success. Login returns you to whatever page
`RequireAuth` intercepted.

### `src/pages/Leads.tsx`

The main screen, and the most involved file.

It fetches leads on mount, filters by the `?view` param (closed vs. everything
else), counts leads per stage for the sidebar, and renders the rows.

The part worth studying is **optimistic updating** in `handleStage`:

```
1. change local state immediately        ← screen updates instantly
2. send the PUT request
3. if it fails, restore the saved state and show a toast
```

Without this, clicking an arrow would freeze for a network round trip. Reddit's
arrows felt instant, so these should too.

Delete goes through an `AlertDialog` confirmation, because the server's
`deleteLead` is a hard `prisma.lead.delete` with no undo.

### `src/pages/LeadDetail.tsx`

One lead in full — stage badge, contact details, timestamps, and edit/delete in
the sidebar.

Edit state lives in the URL (`?edit=1`), which means the edit dialog is
linkable and the browser back button closes it.

---

# Layer 6 — Wiring

### `src/main.tsx`

The entry point — the first code that runs. It finds `<div id="root">` and mounts
React into it.

The nesting order matters, outermost first:

```
BrowserRouter      routing must exist before anything reads the URL
  AuthProvider     auth must exist before routes can guard on it
    App            the route table
    Toaster        where popup notifications render
```

### `src/App.tsx`

The route table — URL patterns mapped to components:

| Path | Renders | Guarded |
| --- | --- | --- |
| `/` | redirect to `/leads` | — |
| `/login` | `Login` | no |
| `/register` | `Register` | no |
| `/leads` | `Leads` | yes |
| `/leads/:id` | `LeadDetail` | yes |
| `*` | not-found message | — |

The whole table sits inside `Chrome`, so the header renders once and persists
across navigation instead of being rebuilt on every page.

---

## Known loose ends

- `src/App.css` is orphaned — nothing imports it since `App.tsx` was rewritten.
  Safe to delete.
- The listing is ordered by **recency**, which is what `GET /api/leads` already
  returns. Ranking by pipeline stage instead would be a change in `Leads.tsx`.
- `Lead.email` is `@unique` globally in the Prisma schema rather than per user,
  so two users can't both have a lead with the same email address. Probably
  wants to be `@@unique([email, userId])`.
