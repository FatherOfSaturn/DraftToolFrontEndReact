# Component & Module Inventory

A reference for every page, reusable component, hook, and library module
in `src/`. For how these pieces fit together, see
[ARCHITECTURE.md](./ARCHITECTURE.md).

## Pages (`src/pages/`, plus two routed from `components/`)

One component per route. These own data fetching and top-level state;
they compose the reusable components below rather than reimplementing
UI.

| Component | Route | Props | Purpose |
|---|---|---|---|
| `HomePage` | `/` | — | Marketing/landing page. |
| `DraftSelectionPage` (`components/draft-selection/`) | `/draft-selection` | `onSelectRitual?`, `onCreateNewRitual?` | Draft-mode picker. Only navigation to Draft Setup is wired (see doc comment). |
| `DraftSetupPage` | `/draft-setup` | `onEnterDraft(gameID, playerName)` | Create-a-game / join-a-game forms. |
| `DraftRouteWrapper` | `/draft/:gameID/:playerName` | — | Reads `useParams()`, renders `DraftPage` with plain string props. |
| `DraftPage` | (rendered by the wrapper above) | `gameID`, `playerName`, `waitingStrategy?` | The live draft board. See [ARCHITECTURE.md](./ARCHITECTURE.md#the-draft-board-usedraftgame--usepackmergepoller). |
| `DeckBuilderPage` | `/deckbuilder/:gameID?/:playerName?` | — (reads optional route params) | Build a deck from a finished draft, or from scratch via Import. |
| `AccountPage` | `/account` | — | Mock draft history + saved decklists, client-side search/filter. |
| `MulliganSimulatorPage` (`components/mulligan-simulator/`) | `/mulligan-simulator` | — | Standalone opening-hand simulator. |
| `LoginPortalPage` | `/login` | `onLoginSuccess?`, `supportAvatars?`, `oracleCardImageSrc?` | The routed login screen ("Portal" copy). Thin wrapper around `AuthPage`. |
| `LoginPage` (`components/login/`) | *not routed* | `onLoginSuccess?` | The "Grimoire" copy variant. Thin wrapper around `AuthPage`. Exported for future use. |

## Layout (`src/components/layout/`)

| Component | Props | Purpose |
|---|---|---|
| `Header` | `search?: { value, onChange, placeholder? }` | The one shared top nav, used on every page. Active link is derived from the real route via `useLocation()`. Pass `search` to show a search box (used by `AccountPage`). |
| `Footer` | — | The one shared footer, used on every page. |

## Draft board (`src/components/draft-board/`)

Reusable across the draft board **and** the deck builder — that's why
they live in a feature folder rather than under `pages/`.

| Component | Props | Purpose |
|---|---|---|
| `FilterPanel` | `search`, `onSearchChange`, `activeColors`, `onToggleColor`, `activeCmc`, `onToggleCmc`, `activeType`, `onToggleType` | Search/color/CMC/type filter bar. Pair with `useCardFilters` (see below) — its `filterPanelProps` is shaped to spread directly onto this component. |
| `CardGrid` | `cards`, `stagedCardID`, `onStage`, `disabled`, `minSlots?` (default 10) | Responsive grid of cards. Click to stage/unstage; corner button flips double-faced cards. |
| `PoolSidebar` | `cards`, `total`, `tab`, `onTabChange`, `onImportCards?`, `showImportTab?`, `confirmAction?`, `topOffsetPx?`, `sideboardCards?`, `onMoveToSideboard?`, `onMoveToList?`, `onAddLand?`, `onExport?` | The fixed "My Pool" sidebar (List/Sideboard/Analytics/Import tabs). Every optional prop is a feature toggle — see the JSDoc on each in `PoolSidebar.tsx` for exactly what omitting it does. |
| `StatsBar` | `playerName`, `partnerName`, `doublePicksRemaining`, `packsLeft`, `packsTotal`, `gameID` | The bar under the header on the draft board showing pack/pick progress. |
| `ExtraPickFab` | `armed`, `disabled`, `onClick` | Floating action button for arming a "double pick". |

Plus two non-component modules used by the above and by `DeckBuilderPage`:

- **`cardHelpers.ts`** — `cardColors(card)`, `cmcBucketFor(cmc)`,
  `filterCards(cards, filterState)` (pure predicate, see
  [ARCHITECTURE.md](./ARCHITECTURE.md#filtering-usecardfilters)),
  plus display constants (`CARD_COLOR_BADGE`, `COLOR_PIP_STYLES`,
  `TYPE_FILTERS`) and the `ManaColor`/`CmcBucket`/`CardFilterState` types.
- **`importDecklist.ts`** — `buildCard(name, typeLine, frameKey)` and
  `importDecklist(text)`, used by the deck builder's Import tab and
  Quick Add Land buttons.

## Common (`src/components/common/`)

| Component | Props | Purpose |
|---|---|---|
| `StatusScreen` | `children`, `tone?: 'normal' \| 'error'` | Centered full-viewport loading/error message. Shared by `DraftPage` and `DeckBuilderPage`. |

## Login (`src/components/login/`)

| Component | Props | Purpose |
|---|---|---|
| `AuthPage` | `AuthPageCopy` fields (`heading`, `subheading`, `identityLabel`, `identityPlaceholder`, `secretLabel`, `rememberMeLabel`, `forgotLabel`, `submitLabel`, `oauthLabel`, `mainTopPaddingClassName?`) plus `onLoginSuccess?`, `supportAvatars?`, `oracleCardImageSrc?` | The actual login form + "Support the Archives" panel implementation. Configured per-variant by `LoginPortalPage` and `LoginPage` — see [ARCHITECTURE.md](./ARCHITECTURE.md#login-pages-authpage). |

## Hooks (`src/hooks/`)

| Hook | Signature | Purpose |
|---|---|---|
| `useDraftGame` | `(gameID, playerName) => { loading, error, player, partner, currentPack, canDoublePick, packsExhausted, readyForDeckBuilder, draftCard, drafting, refreshGameInfo, ... }` | All draft-board data fetching + derived state + the `draftCard` mutation. |
| `usePackMergePoller` | `({ gameID, active, onMerged }) => void` | Polls the merge endpoint on an interval while `active`; calls `onMerged()` on `GAME_MERGED`. |
| `useCardFilters` | `(cards: Card[]) => { search, setSearch, activeColors, toggleColor, activeCmc, toggleCmc, activeType, toggleType, filteredCards, filterPanelProps }` | Shared filter state for any screen pairing a card list with `<FilterPanel/>`. |

## Library (`src/lib/`)

Pure, dependency-free functions — no React, no side effects (aside from
the intentionally side-effecting `placeholderArt`, which is pure in the
sense of always returning the same output for the same input).

| Module | Exports | Purpose |
|---|---|---|
| `errors.ts` | `getErrorMessage(err: unknown): string` | Normalizes a `catch` value into a display string. |
| `basicLands.ts` | `BASIC_LANDS`, `BASIC_LAND_FRAME` | Canonical WUBRG basic-land metadata, shared by `PoolSidebar`'s Quick Add buttons and `DeckBuilderPage`'s `addLand`. |
| `placeholderArt.ts` | `placeholderArt(name, frameKey)`, `ArtFrameKey` | Generates a data-URI SVG "card art" placeholder. Used by `mockGameApi.ts` and `importDecklist.ts`. |
| `parseDecklist.ts` | `parseDecklist(text)`, `totalCardCount(entries)`, `DecklistEntry` | Parses pasted decklist text (`"4 Lightning Bolt"` style lines) into structured entries. |
| `cardTypeLookup.ts` | `lookupTypeLine(name)` | Small built-in name → type-line table. Placeholder until a real card-lookup API exists (see `TODO(scryfall)`). |
| `cardCategory.ts` | `categorizeTypeLine(typeLine)`, `CardCategory` | Buckets a type line into Land/Creature/Instant/etc. |
| `hypergeometric.ts` | `probabilityOfAtLeast(...)` | Hypergeometric probability calculation for the mulligan simulator. |

## API (`src/api/`)

| Module | Exports | Purpose |
|---|---|---|
| `gameApi.ts` | `gameApi` (`fetchGameData`, `createAndStartGame`, `draftCard`) | The one interface every page/hook uses. Delegates to `mockGameApi` or real `fetch()` based on `VITE_USE_MOCK_API`. |
| `mockGameApi.ts` | (internal, used via `gameApi`) | In-memory fake backend for frontend-only development. |

## Data (`src/data/`)

| Module | Exports | Purpose |
|---|---|---|
| `mockAccountData.ts` | `MOCK_PAST_RITUALS`, `MOCK_SAVED_MANIFESTATIONS`, `PastRitual`, `SavedManifestation` | Static mock data backing `AccountPage` until a real account API exists. |

## Types (`src/types/index.ts`)

Mirrors the backend's DTOs (Angular interfaces / Java classes) exactly —
field names must stay in sync with `org.magic.draft.api` on the backend.
Exports: `Card`, `CardDetail`, `CardPack`, `Player`, `PlayerStart`,
`GameInfo`, `GameCreationInfo`, `GameState`, `GameStatusMessage`.
