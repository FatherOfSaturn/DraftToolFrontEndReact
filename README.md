# Pyramid Draft

React and TypeScript frontend for a Magic: The Gathering cube draft. It supports game setup and drafting (two-player Pyramid Draft and 4–12 player Classic Draft), deck construction, Google-backed accounts, saved-deck management, and a standalone opening-hand simulator.

## Quick Start

```bash
npm install
npm run dev
```

The default API base URL is `http://localhost:8080`. Copy `.env.example` to `.env.local` and configure Google OAuth before using account login.

```bash
npm run typecheck   # TypeScript without emitting files
npm test            # Vitest suite, once
npm run test:watch  # Vitest watch mode
npm run build       # typecheck, then Vite production build
npm run preview     # serve the production build locally
```

There is no lint script currently.

## Structure

```text
src/
  main.tsx                 React entry point and global styles
  app/App.tsx              providers and route table
  config/env.ts            normalized, typed runtime configuration
  shared/
    api/httpClient.ts      API URL, JSON, void, and error handling
    components/            shared layout and status UI
    lib/                   parsing, probability, card, and error helpers
    model/cardTypes.ts     shared backend card DTOs
  features/
    auth/                  Google login, session restoration, route guard
    account/               account profile, real saved decks, mock draft history
    card-workspace/        reusable card grid, filters, pool, and import UI
    deck-builder/          standalone and post-draft deck construction
    draft/                 setup, selection, live draft, game APIs, polling
    home/                  landing page
    mulligan-simulator/    opening hands and probability analysis
  styles/                  global Stitch/Tailwind styles
  test/setup.ts            Vitest DOM matchers
  vite-env.d.ts            typed Vite environment variables
```

Feature folders own their pages, components, hooks, API adapters, and models. `shared` contains only cross-feature code; `config` centralizes environment access. See [Architecture](./docs/ARCHITECTURE.md) and [Components](./docs/COMPONENTS.md).

## Routes

| Path | Behavior |
|---|---|
| `/` | Home |
| `/draft-selection` | Format picker; classic format continues to Classic Draft setup |
| `/draft-setup` | Create or find a Pyramid Draft game |
| `/draft-setup/classic` | Create or find a Classic Draft game (lobby-based) |
| `/draft/:gameID/:playerName` | Live Pyramid Draft board |
| `/classic-draft/:gameID/:playerName` | Live Classic Draft board |
| `/deckbuilder/:gameID?/:playerName?` | Imported deck or drafted-card workspace |
| `/account` | Protected account profile, saved decks, and mock past drafts |
| `/mulligan-simulator` | Standalone opening-hand simulator |
| `/login` | Google Sign-In |

Only `/account` is auth-guarded. Other routes can still call game endpoints without an account.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL used by the shared HTTP client for game and account requests. |
| `VITE_GOOGLE_CLIENT_ID` | empty | Google OAuth web client ID. Without it, the login page reports that Google Sign-In is unavailable. |
| `VITE_USE_MOCK_API` | `false` | Replaces the draft `gameApi` and `classicGameApi` with in-memory implementations. Account APIs remain real. |
| `VITE_SKIP_AUTH` | `false` | In development only, bypasses the `/account` route guard. It does not create an account or mock account data and has no effect in production builds. |

The game mocks support generated games, picks, and loading states without the game backend. They are memory-only, use placeholder cards, and do not model real cube contents or balance. The classic mock implements the full seat-to-seat pass and completion lifecycle; the pyramid mock does not complete the merge-and-swap lifecycle. They are not a replacement for the account backend.

## Current Data Boundaries

- Google returns an ID token; `POST /account/login` exchanges it for the app's `Account` DTO. The account ID is stored locally and used to restore the account with `GET /account/{accountID}`.
- Display-name updates and saved-deck listing/deletion call the real account API. Create/update deck client methods exist, but the deck-builder UI currently exports to the clipboard rather than saving.
- Past drafts are still read from `features/account/data/mockPastDrafts.ts`; their filters and JSON export are client-side.
- Imported card typing and mulligan categories use a small local lookup, not Scryfall. The probability calculations are real, but advanced simulator insight cards remain placeholders.

## Tests

Vitest runs in `jsdom` with Testing Library and `jest-dom`. Current tests cover decklist parsing, hypergeometric helpers, card filtering, mulligan utilities, classic stats, merge- and draftCheck-poller concurrency, and account-deck loading/deletion.

---
*Last updated: 2026-08-05*

# Roadmap

## Favorite Cubes
- [ ] Data model and storage for favoriting cubes
- [ ] Favorite/unfavorite UI
- [ ] Favorites view and filtering

## Scryfall Integration
- [ ] Fetch canonical card data from Scryfall
- [ ] Cache card lookups
- [ ] Replace local import and mulligan type lookup

## Accounts And Saving
- [x] Google Sign-In and backend account login
- [x] Account restoration and display-name editing
- [ ] Add account-aware header and logout controls
- [x] Real saved-deck listing and deletion
- [ ] Wire deck creation and editing into the deck builder
- [ ] Associate draft history with accounts
- [ ] Reuse the account display name through draft flows

## Mulligan Simulator
- [ ] Use canonical Scryfall card data
- [ ] Replace placeholder advanced insights with real simulation

## Donations
- [ ] Donation page or integration

## More Draft Formats
- [x] Classic Cube (board + setup, classic `/classic-game` backend required)
- [ ] Winston Draft

## Mobile Support
- [ ] Choose a responsive web or native-wrapper strategy
- [ ] Audit breakpoints and touch interactions

## Draft Bot
- [ ] Finalize weighted card scoring
- [ ] Add pool-state and pick-number awareness
- [ ] Add `PickRecord` diagnostics
- [ ] Integrate the bot into live drafts

## Creator And Dev Log
- [ ] Meet the creator page
- [ ] Development log

---
*Last updated: 2026-07-11*
