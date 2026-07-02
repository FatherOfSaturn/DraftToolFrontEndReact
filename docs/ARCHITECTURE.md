# Architecture

This document explains how Pyramid Draft's frontend is put together: the
folder structure, how data flows from the backend (or mock backend) to
the screen, and the extension points that were designed in on purpose.

For a per-component reference (props, purpose, "who uses this"), see
[COMPONENTS.md](./COMPONENTS.md). For the running list of what changed
in the most recent optimization pass, see [CHANGELOG.md](./CHANGELOG.md).

## High-level shape

```
main.tsx
  └─ App.tsx                 React Router route table
       ├─ pages/*.tsx         one component per route, own data fetching
       │    └─ components/**  reusable UI, grouped by feature area
       │         └─ hooks/**  stateful logic shared across pages
       │              └─ api/gameApi.ts   real fetch() calls OR
       │                 api/mockGameApi.ts  in-memory fake, same interface
       └─ lib/**              pure, dependency-free helper functions
```

The rule of thumb throughout: **pages own data fetching and top-level
state; components are presentational and reusable; hooks hold stateful
logic that's shared by more than one page; lib/ holds pure functions
with no React and no side effects.** This isn't dogma enforced by
tooling — it's just the shape that fell out of keeping each layer
focused, and it's why e.g. `filterCards` (lib) is trivially unit
testable while `useCardFilters` (hooks) just wires it up to React state.

## Routing

All routes are registered in `App.tsx`:

| Path | Component | Notes |
|---|---|---|
| `/` | `HomePage` | Marketing/landing page |
| `/draft-selection` | `DraftSelectionPage` | Pick a draft mode (only navigation is wired up — see its doc comment) |
| `/draft-setup` | `DraftSetupPage` | Create or join a game |
| `/draft/:gameID/:playerName` | `DraftPage` (via `DraftRouteWrapper`) | The live draft board |
| `/deckbuilder/:gameID?/:playerName?` | `DeckBuilderPage` | Params optional — see below |
| `/account` | `AccountPage` | Mock draft history + saved decks |
| `/mulligan-simulator` | `MulliganSimulatorPage` | Standalone, no router params |
| `/login` | `LoginPortalPage` | See [Login pages](#login-pages-authpage) below |
| `*` | redirects to `/` | |

Two small `*Route` wrapper functions live in `App.tsx` next to the route
table (`DraftSelectionRoute`, `DraftSetupRoute`). They exist purely so
the pages they wrap can take a plain callback prop
(`onSelectRitual`, `onEnterDraft`) instead of importing
`react-router-dom` themselves — this keeps those page components easier
to reuse or unit test outside of a `<BrowserRouter>`. `DraftRouteWrapper`
does the same job for `DraftPage`: it reads `useParams()` and passes
plain `gameID`/`playerName` strings down, so `DraftPage` itself has zero
router dependency.

## Data layer: `gameApi` vs `mockGameApi`

`src/api/gameApi.ts` exports a single `gameApi` object implementing:

```ts
fetchGameData(gameID): Promise<GameInfo>
createAndStartGame(payload): Promise<GameInfo>
draftCard(gameID, playerID, packNumber, cardID, doublePick): Promise<Card>
```

At import time, `gameApi.ts` checks `import.meta.env.VITE_USE_MOCK_API`:

- `"true"` → every method delegates to `mockGameApi.ts`, an in-memory
  fake with simulated network latency (`MOCK_DELAY_MS`). No backend
  process required at all — useful for frontend-only work or demos.
- anything else (including unset) → real `fetch()` calls against
  `VITE_API_BASE_URL` (defaults to `http://localhost:8080`), matching
  the Quarkus backend's REST contract.

Every page/hook that needs game data imports `gameApi` and never touches
`mockGameApi` directly, so the mock/real split is invisible above the
`api/` layer. `mockGameApi.ts`'s placeholder card art comes from
`lib/placeholderArt.ts` — the same function the deck builder's decklist
importer uses, so there's one SVG-placeholder implementation for the
whole app rather than two copies that could drift.

## The draft board: `useDraftGame` + `usePackMergePoller`

`DraftPage` is the most stateful screen, so its logic is split into two
hooks it composes:

- **`useDraftGame(gameID, playerName)`** — fetches the game once on
  mount, derives everything the board needs from it (`player`,
  `partner`, `currentPack`, `canDoublePick`, `packsExhausted`,
  `readyForDeckBuilder`, etc.), and exposes `draftCard()`, which
  optimistically updates local state after a successful pick so the UI
  advances to the next pack immediately without waiting for a re-fetch.
- **`usePackMergePoller({ gameID, active, onMerged })`** — when
  `active` is true, polls the backend's merge endpoint on an interval
  and calls `onMerged()` once the game transitions to `GAME_MERGED`.
  `DraftPage` only turns this on while the local player is
  `packsExhausted` (i.e. actually waiting on their opponent).

### The `WaitingStrategy` extension point

Pyramid Draft's specific "poll until merged, then swap packs" behavior
is *not* hardcoded into `DraftPage`. It's expressed as a `WaitingStrategy`
object (`pyramidMergeStrategy`, exported from `DraftPage.tsx`) with three
hooks:

```ts
interface WaitingStrategy {
  enablePolling: (packsExhausted: boolean) => boolean;
  onMerged: (helpers: { gameID, playerName, refreshGameInfo, navigate }) => void;
  renderWaiting: () => ReactNode;
}
```

`DraftPage` accepts `waitingStrategy` as an optional prop and defaults to
`pyramidMergeStrategy`. To support a future draft format with different
waiting/merge semantics, write a new object satisfying this interface
and pass it in — `DraftPage` itself doesn't need to change. This is the
main "designed-in" extension point in the codebase; everything else is
just component composition.

## Filtering: `useCardFilters`

Both the draft board (filtering the current pack) and the deck builder
(filtering the decklist) need the same search/color/CMC/type filter UI
and logic. That logic lives in one place:

- `components/draft-board/cardHelpers.ts` exports a pure `filterCards(cards, filterState)`
  function — no React, trivially testable.
- `hooks/useCardFilters.ts` wraps it in `useState`/`useMemo` and returns
  both the raw pieces (`search`, `toggleColor`, etc.) and a
  `filterPanelProps` object shaped to spread directly onto
  `<FilterPanel {...filterPanelProps} />`.

Any future screen that needs "a filterable list of cards next to a
`<FilterPanel/>`" should reach for this hook rather than re-deriving the
same state.

## Login pages: `AuthPage`

There are two login screens with different copy — a "Portal" variant
(routed at `/login` via `LoginPortalPage`) and a "Grimoire" variant
(`components/login/LoginPage.tsx`, exported but not currently routed
anywhere). Both render the exact same form, validation, and "Support the
Archives" side panel; only the copy (headings, field labels, button
text) and one spacing value differ. Rather than two independently
maintained ~250-line files, both are now thin wrappers around a single
`components/login/AuthPage.tsx`, configured via props (see
`AuthPageCopy` in that file). If a third copy variant is ever needed,
follow the same pattern: a new thin wrapper passing new copy strings
into `AuthPage`.

## Deck builder: two entry modes

`DeckBuilderPage` (`/deckbuilder/:gameID?/:playerName?` — both params
optional) supports two flows from one component:

- **From a draft**: `/deckbuilder/:gameID/:playerName` fetches that
  player's `cardsDrafted` from `gameApi.fetchGameData` and seeds the
  decklist with it.
- **Standalone**: `/deckbuilder` with no params starts with an empty
  decklist; the user builds it via the Import tab
  (`components/draft-board/importDecklist.ts` parses pasted decklist
  text into `Card[]`, reusing `lib/parseDecklist.ts`'s text parser and
  `lib/cardTypeLookup.ts`'s small built-in type-line lookup table).

It reuses `FilterPanel`, `CardGrid`, and `PoolSidebar` from the draft
board wholesale — the interaction model differs (clicking a card moves
it to the sideboard instead of staging a pick), but the visual pieces
and their props are identical, which is why those three components live
in `components/draft-board/` rather than being duplicated per screen.

## Mulligan simulator

Fully standalone (`components/mulligan-simulator/MulliganSimulatorPage.tsx`,
routed at `/mulligan-simulator`, no router params, no API calls). Paste
a decklist, draw simulated opening hands, and see hypergeometric
probabilities for drawing into a category by a given turn. All the
actual math/parsing lives in `lib/`:

- `parseDecklist.ts` — turns pasted text into `{ name, quantity }[]`
- `cardTypeLookup.ts` — a small built-in name → type-line table (see the
  `TODO(scryfall)` comment — this is a placeholder until a real
  card-lookup API exists)
- `cardCategory.ts` — buckets a type line into `Land` / `Creature` /
  `Instant` / etc.
- `hypergeometric.ts` — `probabilityOfAtLeast(...)`, the actual stats

## Known placeholders / not-yet-wired seams

These are intentional, documented gaps — not bugs to silently "fix":

- **Auth**: both login pages simulate a network round trip and call
  `onLoginSuccess` if both fields are non-empty. There's no real auth
  backend to call yet.
- **Draft mode selection**: `DraftSelectionPage` shows four draft
  formats, but only navigation to `/draft-setup` is wired — the chosen
  format isn't carried forward yet (see that component's doc comment).
- **Account data**: `AccountPage`'s draft history and saved decks are
  static mock arrays (`data/mockAccountData.ts`), not a real account
  API.
- **Card type lookup**: `lib/cardTypeLookup.ts` is a small hardcoded
  table standing in for a real Scryfall (or similar) lookup — see the
  `TODO(scryfall)` comments in that file and in
  `components/draft-board/importDecklist.ts`.
