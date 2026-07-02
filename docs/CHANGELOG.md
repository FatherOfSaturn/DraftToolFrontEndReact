# Changelog

## Optimization pass (this session)

A senior-level pass over the whole codebase: eliminate duplication,
improve reusability, fix a couple of real anti-patterns, and document
everything properly. **No user-visible functionality, copy, or styling
was intentionally changed** — every change below either produces
identical output through shared code, or is a pure internal
reorganization (types, comments, file layout). The two navigation fixes
are the only behavioral changes, and both are strictly improvements
(same destination, better mechanism) with no visible difference.
Verified after every step with `tsc --noEmit` and a full `vite build`.

### Deduplication

- **`lib/errors.ts` (new)** — `getErrorMessage(err: unknown)` replaces
  six copies of the inline `err instanceof Error ? err.message :
  String(err)` pattern across `useDraftGame.ts`, `DraftSetupPage.tsx`,
  and `DeckBuilderPage.tsx`.
- **`lib/basicLands.ts` (new)** — `BASIC_LANDS` and `BASIC_LAND_FRAME`
  replace two separately-maintained lists of the same five basic lands
  (one in `PoolSidebar.tsx` for the Quick Add buttons, one in
  `DeckBuilderPage.tsx` for building a basic land `Card`).
- **`mockGameApi.ts`** — removed a byte-for-byte duplicate of
  `placeholderArt`/`FRAME_COLORS`; now imports the one implementation
  from `lib/placeholderArt.ts` (previously used only by the deck
  builder's decklist importer).
- **`hooks/useCardFilters.ts` (new)** + **`filterCards` added to
  `cardHelpers.ts`** — `DraftPage.tsx` and `DeckBuilderPage.tsx` each
  had their own copy of the same search/color/CMC/type filter state and
  filtering predicate. Both now use one shared hook; the actual
  filtering predicate is a pure, independently-testable function.
- **`components/common/StatusScreen.tsx` (new)** — `DraftPage.tsx` had a
  local `FullScreenMessage` component; `DeckBuilderPage.tsx` had the same
  markup inlined twice (loading + error). Both now use one shared
  component.
- **`components/login/AuthPage.tsx` (new)** — the biggest duplication in
  the codebase: `components/login/LoginPage.tsx` and
  `pages/LoginPortalPage.tsx` were ~250-line files with near-identical
  form markup, validation, "Support the Archives" panel, and avatar/
  oracle-card sub-components — differing only in copy (headings, field
  labels, button text) and one spacing value. Both are now thin,
  ~35-line wrappers that configure one shared `AuthPage` component via
  props. Every string each page previously rendered is preserved exactly
  (including the pre-existing copy inconsistency where both pages'
  validation error says "Arcane Identity and Secret Cipher" even on the
  page that labels the fields "Username"/"Password" — kept as-is, not
  "fixed", since it's existing copy).
- **`DraftSetupPage.tsx`** — the five near-identical label+input blocks
  across the Create/Find forms now render through one local
  `LabeledTextField` component instead of each repeating the same
  ~10-line block.
- **`PoolSidebar.tsx`** — removed an unused `buildCard` import left over
  from before (not something this pass introduced; caught while
  reviewing the file for the `BASIC_LANDS` change above).

### Anti-pattern fixes

- **`Header.tsx`**: the "Deck Building" nav link was a plain `<a
  href="/deckbuilder">`, and "Sign In" used `window.location.href =
  '/login'` — both caused a full page reload instead of client-side
  navigation (the app is a single-page app everywhere else). Changed to
  `<Link to="/deckbuilder">` and `navigate('/login')` respectively. Same
  destination, no full-page reload.

### Documentation

- Every page/component that was missing a top-of-file summary comment
  now has one (`AccountPage`, `MulliganSimulatorPage`,
  `DraftSelectionPage`, `App.tsx`'s route table).
- **`README.md`** rewritten to reflect the actual current codebase (the
  previous version referenced a `docs/README.md` and several
  `preview-*/index.html` standalone preview files that aren't present in
  this project snapshot — see "Stale references" below).
- **`docs/ARCHITECTURE.md`** (new) — system architecture, data flow, and
  the two designed-in extension points (`WaitingStrategy`,
  `useCardFilters`).
- **`docs/COMPONENTS.md`** (new) — full inventory of every page,
  component, hook, and lib module with props and purpose.
- This file.

### Project hygiene

- **`.gitignore`** (new) — was missing entirely; added the standard
  Vite/React/TS template's ignore list (`node_modules`, `dist`,
  `*.local`, editor/OS junk).
- **`.env.example`** (new) — the existing `.env` file's own header
  comment says "copy this file to `.env`", implying it was meant to
  double as the example template, but no `.env.example` actually
  existed. Added one with the same content; `.env` itself is untouched
  and still works out of the box.

### Stale references from the previous README (not restored)

The previous `README.md` referenced two things not present in this
project export:

- **`docs/README.md`** — referenced as the architecture doc; didn't
  exist in this snapshot. Replaced by `docs/ARCHITECTURE.md` and
  `docs/COMPONENTS.md`.
- **`preview-*/index.html` standalone previews** (zero-build-step
  React+Babel-via-CDN versions of several pages) — referenced as
  existing under project root; not present in this snapshot. If you
  still have these elsewhere, note that per the old README they predate
  the shared `Header`/`Footer` reorganization and were never updated to
  match.

If either of these exist outside this particular export and you'd like
them folded back in, they weren't deleted by this pass — they just
weren't part of the uploaded project.

---

## Carried forward from the pre-rebuild-review README

This project's `README.md` used to include a long "wiring notes" section
recording assumptions, mock-data callouts, and bugs found/fixed during
the original Angular → React rebuild. That section was condensed out of
the new top-level `README.md` to keep it scannable, but the substance is
preserved here so it isn't lost:

**Backend contract assumptions (worth confirming against the real
Quarkus backend if you haven't already):**
- `DraftSetupPage` generates a UUID via `crypto.randomUUID()` for each
  player's `playerID` client-side before calling `POST /game`.
- `GameCreationInfo.gameID` is sent client-generated on creation, on the
  assumption the backend assigns/returns the authoritative ID in the
  `GameInfo` response.

**Known mock/placeholder data (by design, not bugs):**
- `AccountPage`'s "Past Rituals" and "Saved Manifestations" are entirely
  static mock data (`data/mockAccountData.ts`) — search and the
  Partner/Date filters genuinely filter that array client-side, but
  there's no real account/history backend. "Export Draft List" produces
  a real small JSON file from the mock row's data; "Edit", "View All",
  pagination, and "Create New Manifestation" are inert.
- `MulliganSimulatorPage`'s card types come from a small ~30-card
  hardcoded lookup table (`lib/cardTypeLookup.ts`), not a real card
  database — this is the intended seam for a future Scryfall (or
  similar) API integration; everything downstream already consumes
  `type_line` strings the same shape Scryfall returns, so only that one
  file would need to change.
- The "Goldfish Win" / "Combo Stability" stat cards on the mulligan
  simulator are still placeholder text — computing those for real would
  need a full turn-by-turn simulation. The actual draw-probability math
  elsewhere on that page is real (hypergeometric, verified against known
  textbook values).
- No real card/portrait images exist for this project — placeholder art
  (`lib/placeholderArt.ts`, generated SVG initials) is used throughout.
  Swap in real images by pointing `image_small`/`image_normal` at a real
  backend's card images.
- `AccountPage`'s background parallax-on-mousemove and staggered card
  fade-in from the original mockup were vanilla DOM scripts that don't
  translate directly into React's declarative model, and were not
  reimplemented.

**Design decisions made during the rebuild (still true today):**
- Brand name is "Pyramid Draft" everywhere (Header, Footer, page titles,
  body copy) — the mockups' original "Aetheric Grimoire" branding was
  replaced per product direction.
- The active nav link in `Header` reflects the real current route via
  `useLocation()`, not a hardcoded per-page value — "Draft" stays
  highlighted across the whole Draft Selection → Draft Setup → Draft
  board flow, since those three routes are conceptually one flow.
- Clicking a card in `CardGrid` stages it directly (click again to
  unstage); the actual `draftCard` API call only fires on "Confirm Pick"
  in `PoolSidebar`. If "Extra Pick" is armed at that moment, the pick
  confirms as a double-pick and stays on the same pack; otherwise it's a
  normal pick and advances to the next pack.
- The floating "Extra Pick" button is the Super Pick / double-draft
  mechanic (the original mockup labeled it "Arcane Suggest").
- `PoolSidebar`'s Analytics tab is a mana-curve bar chart + color
  breakdown computed live from the player's drafted cards — the mockup
  didn't specify real content here.
- `CardGrid` pads itself to `minSlots` (default 10) tiles with dashed
  empty placeholders when a pack/list has fewer cards than that.
