# Pyramid Draft

A React + TypeScript frontend for a two-player Magic: The Gathering
"Pyramid Draft" cube-drafting app: create or join a draft, pick from
packs in real time, build a deck from what you drafted, and (separately)
simulate opening hands for probability practice. Talks to an existing
Java/Quarkus backend — or, with one env var, an in-memory mock backend
so the whole app runs with no backend at all.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL — you'll land on the Home page. By default
the app expects a backend at `http://localhost:8080`.

**No backend handy?** Copy `.env.example` to `.env` and set
`VITE_USE_MOCK_API=true`. Every screen (Home → Draft Setup → create/join
a game → the live draft board → deck builder) works identically against
an in-memory fake backend (`src/api/mockGameApi.ts`) with simulated
network latency — nothing else in the app needs to change, since every
page only ever calls the `gameApi` object, never `fetch` directly.

```bash
npm run build      # tsc --noEmit && vite build
npm run preview    # serve the production build locally
```

## Documentation

| Doc | What's in it |
|---|---|
| **This file** | Quick start, tech stack, project layout, route table |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | How the pieces fit together: data flow, the mock/real API switch, the `WaitingStrategy` and `useCardFilters` extension points |
| [docs/COMPONENTS.md](./docs/COMPONENTS.md) | Every page, component, hook, and lib module — props and purpose |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | What changed in the most recent optimization/reorganization pass, plus historical wiring notes and known-mock-data callouts carried forward from before |

## Tech stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** for dev server/build
- **React Router v6** for client-side routing
- **Tailwind CSS** — design tokens (`tailwind.config.js`) and a handful
  of custom classes (`src/styles/stitch.css`) extracted from the
  original Google Stitch HTML mockups this UI was converted from

No test runner, linter, or state-management library is currently
configured. If you add one, `lib/` is written to be trivially unit
testable (pure functions, no React) — that'd be the natural place to
start.

## Project structure

```
src/
  main.tsx              React root, global styles
  App.tsx                Route table (see below)
  types/index.ts          Card, CardPack, Player, GameInfo, etc — mirrors
                          the backend's DTOs field-for-field
  vite-env.d.ts           Typed import.meta.env

  api/
    gameApi.ts             The one interface every page/hook calls
    mockGameApi.ts          In-memory fake backend (VITE_USE_MOCK_API=true)

  hooks/
    useDraftGame.ts          Draft-board data fetching + derived state
    usePackMergePoller.ts    Polls the merge endpoint while waiting
    useCardFilters.ts        Shared search/color/CMC/type filter state

  lib/                     Pure, dependency-free helpers (see COMPONENTS.md)
    errors.ts  basicLands.ts  placeholderArt.ts  parseDecklist.ts
    cardTypeLookup.ts  cardCategory.ts  hypergeometric.ts

  data/
    mockAccountData.ts      Mock draft history / saved decks (Account page)

  components/
    layout/                 Header, Footer — shared on every page
    draft-board/             FilterPanel, CardGrid, PoolSidebar, StatsBar,
                             ExtraPickFab — shared by the draft board AND
                             the deck builder
    common/                 StatusScreen — shared loading/error screen
    login/                  AuthPage (shared form) + LoginPage (a copy variant)
    draft-selection/         DraftSelectionPage
    mulligan-simulator/      MulliganSimulatorPage

  pages/
    HomePage.tsx  DraftSetupPage.tsx  DraftRouteWrapper.tsx  DraftPage.tsx
    DeckBuilderPage.tsx  AccountPage.tsx  LoginPortalPage.tsx
```

## Routes

| Path | Screen |
|---|---|
| `/` | Home |
| `/draft-selection` | Choose a draft mode |
| `/draft-setup` | Create or join a game |
| `/draft/:gameID/:playerName` | The live draft board |
| `/deckbuilder/:gameID?/:playerName?` | Deck builder (from a draft, or standalone via Import) |
| `/account` | Draft history + saved decks (mock data) |
| `/mulligan-simulator` | Opening-hand probability simulator |
| `/login` | Login |

Full detail on each screen — what's real, what's mock, and what's
intentionally not wired up yet — is in
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#known-placeholders--not-yet-wired-seams).

## Environment variables

Set in `.env` (copy from `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Where the Quarkus backend is running. Ignored when `VITE_USE_MOCK_API=true`. |
| `VITE_USE_MOCK_API` | `false` | Set `true` to run entirely against the in-memory mock backend — no Java server required. |
