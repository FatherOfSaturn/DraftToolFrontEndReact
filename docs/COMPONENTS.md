# Component And Module Guide

This is a feature-oriented map of `src`. Public props remain documented by TypeScript interfaces beside each component; this guide focuses on ownership and behavior.

## App And Config

| Path | Responsibility |
|---|---|
| `app/App.tsx` | Google/auth/router providers, route table, account guard, and navigation adapters. |
| `config/env.ts` | Typed environment values exposed as `env`. |
| `main.tsx` | React root and global stylesheet import. |
| `vite-env.d.ts` | `ImportMetaEnv` declarations for all supported variables. |

## Auth

| Module | Responsibility |
|---|---|
| `features/auth/AuthContext.tsx` | Login, logout, account restoration, refresh, and local account-ID persistence. |
| `features/auth/RequireAuth.tsx` | Loading screen or `/login` redirect for protected content. |
| `features/auth/pages/LoginPage.tsx` | Routed login page; passes the Google ID token to `AuthContext` and navigates to `/account`. |
| `features/auth/components/AuthPage.tsx` | Google login UI and errors. Username/password controls are intentionally disabled. |
| `features/auth/components/SupportPane.tsx` | Decorative/support content beside login. |

## Account

| Module | Responsibility |
|---|---|
| `features/account/pages/AccountPage.tsx` | Composes profile, mock past-draft filtering/export, and backend saved decks. |
| `features/account/api/accountApi.ts` | Login, account, display-name, and deck CRUD endpoint contracts. |
| `features/account/hooks/useAccountDecks.ts` | Loads real decks for an account and deletes them after confirmation. |
| `features/account/model/accountTypes.ts` | Backend `Account` and `Deck` DTOs. |
| `features/account/data/mockPastDrafts.ts` | Static `PastRitual` rows only; it does not export saved decks. |
| `features/account/components/AccountProfile.tsx` | Account identity and backend display-name editing. |
| `features/account/components/SavedDecksSection.tsx` | Backend deck table and delete/create-navigation controls. |
| `features/account/components/PastDraftsSection.tsx` | Mock history table and JSON export. |
| `features/account/components/PastDraftFilters.tsx` | Partner/date controls applied by `AccountPage`. |

The account API has create/update deck methods, but no current component invokes them. "Create New Deck" navigates to the standalone deck builder.

## Card Workspace

Shared by `DraftPage`, `ClassicDraftPage`, and `DeckBuilderPage`.

| Module | Responsibility |
|---|---|
| `features/card-workspace/components/CardGrid.tsx` | Card tiles, staging/action clicks, flip images, and optional empty slots. |
| `features/card-workspace/components/FilterPanel.tsx` | Search, color, mana value, and type controls. |
| `features/card-workspace/components/PoolSidebar.tsx` | List, sideboard, analytics, import, land, export, and confirm-pick modes. Optional props enable each mode. |
| `features/card-workspace/components/PoolList.tsx` | Compact card list and move actions. |
| `features/card-workspace/components/PoolAnalytics.tsx` | Live mana-curve and color summaries. |
| `features/card-workspace/components/ImportDecklistTab.tsx` | Pasted-list import UI. |
| `features/card-workspace/hooks/useCardFilters.ts` | React filter state and `FilterPanel` props. |
| `features/card-workspace/model/cardFilters.ts` | Pure filtering, color/CMC derivation, constants, and filter types. |
| `features/card-workspace/utils/importDecklist.ts` | Converts parsed names into placeholder `Card` objects. |

## Draft

| Module | Responsibility |
|---|---|
| `features/draft/pages/DraftSelectionPage.tsx` | Visual format picker; classic continues to Classic Draft setup, others to Pyramid setup. |
| `features/draft/pages/DraftSetupPage.tsx` | Creates a game or validates an existing game/player before navigation. |
| `features/draft/pages/DraftRouteWrapper.tsx` | Reads and validates pyramid draft route parameters. |
| `features/draft/pages/DraftPage.tsx` | Pyramid board composition: wires `useDraftGame` + merge poller into `DraftBoardView`. |
| `features/draft/pages/ClassicDraftSetupPage.tsx` | Lobby-based classic setup (players, packs, cards-per-pack) and game join. |
| `features/draft/pages/ClassicDraftRouteWrapper.tsx` | Reads and validates classic draft route parameters. |
| `features/draft/pages/ClassicDraftPage.tsx` | Classic board composition: wires `useClassicDraftGame` + draftCheck poller into `DraftBoardView`, then navigates to the deck builder on completion. |
| `features/draft/components/DraftBoardView.tsx` | Shared board layout for all draft types: header, stats bar, pool sidebar, filter bar, grid, staging/confirm, and extra-pick FAB. |
| `features/draft/hooks/useDraftGame.ts` | Game fetch, derived player/pack state, pick submission, and local response updates. |
| `features/draft/hooks/useClassicDraftGame.ts` | Classic `draftData` fetch, derived pack/cards-left state, pick submission, and post-pick refresh. |
| `features/draft/hooks/usePackMergePoller.ts` | Non-overlapping merge polling with one-time completion notification. |
| `features/draft/hooks/useClassicDraftPoller.ts` | Non-overlapping `draftCheck` polling for the next classic pack. |
| `features/draft/api/gameApi.ts` | Selects the real or mock implementation of the pyramid game endpoint contract. |
| `features/draft/api/mockGameApi.ts` | Memory-only generated games and picks; not a complete game engine. |
| `features/draft/api/classicGameApi.ts` | Selects the real or mock implementation of the `/classic-game` endpoint contract. |
| `features/draft/api/mockClassicGameApi.ts` | Memory-only classic lifecycle (passing, direction flips, auto-complete). |
| `features/draft/model/gameTypes.ts` | Backend game, player, pack, creation, and status DTOs. |
| `features/draft/model/classicGameTypes.ts` | Backend classic game, player, draftData/check, creation, and summary DTOs. |
| `features/draft/model/classicStats.ts` | Pure cards-left-to-draft calculation for classic players. |
| `features/draft/components/StatsBar.tsx` | Player, opponent, pack or cards-left, extra-pick, and game status; optional props support both draft types. |
| `features/draft/components/ExtraPickFab.tsx` | Arms or disarms the next double pick (pyramid only). |

## Deck Builder

`features/deck-builder/pages/DeckBuilderPage.tsx` loads drafted cards when route parameters are present or starts with an import tab otherwise. It manages mainboard/sideboard moves, basic lands, filtering, and clipboard export. It does not currently persist through `accountApi`.

## Mulligan Simulator

| Module | Responsibility |
|---|---|
| `features/mulligan-simulator/pages/MulliganSimulatorPage.tsx` | Deck input, hand controls, simulation UI, and insights composition. |
| `features/mulligan-simulator/hooks/useMulliganSimulator.ts` | Parsed deck, hand, mulligan, and draw state. |
| `features/mulligan-simulator/model/mulliganUtils.ts` | Quantity expansion, local category lookup, and non-mutating shuffle. |
| `features/mulligan-simulator/components/DecklistPane.tsx` | Decklist input and summary. |
| `features/mulligan-simulator/components/MulliganZone.tsx` | Opening-hand and mulligan interactions. |
| `features/mulligan-simulator/components/InsightsPane.tsx` | Probability output plus currently placeholder advanced insights. |

## Home And Shared

| Module | Responsibility |
|---|---|
| `features/home/pages/HomePage.tsx` | Landing page. |
| `shared/components/layout/Header.tsx` | Shared navigation, route highlighting, sign-in navigation, and optional search. |
| `shared/components/layout/Footer.tsx` | Shared footer. |
| `shared/components/StatusScreen.tsx` | Full-page loading and error state. |
| `shared/api/httpClient.ts` | Base URL, status errors, JSON, and empty-response handling. |
| `shared/model/cardTypes.ts` | Backend-compatible `Card` and `CardDetail` DTOs. |
| `shared/lib/basicLands.ts` | Basic-land metadata. |
| `shared/lib/cardCategory.ts` | Type-line category mapping. |
| `shared/lib/cardTypeLookup.ts` | Limited local card type lookup pending Scryfall integration. |
| `shared/lib/errors.ts` | Unknown-error normalization. |
| `shared/lib/hypergeometric.ts` | Probability mass and at-least calculations. |
| `shared/lib/parseDecklist.ts` | Common decklist parser and count helper. |
| `shared/lib/placeholderArt.ts` | Deterministic SVG card placeholders. |

## Tests

Tests are colocated with their modules:

| Test | Coverage |
|---|---|
| `shared/lib/parseDecklist.test.ts` | Common list formats, comments/headings, totals. |
| `shared/lib/hypergeometric.test.ts` | Boundaries and valid probability ranges. |
| `features/card-workspace/model/cardFilters.test.ts` | Color/CMC derivation and combined filters. |
| `features/mulligan-simulator/model/mulliganUtils.test.ts` | Quantity/category expansion and non-mutating shuffle. |
| `features/draft/hooks/usePackMergePoller.test.ts` | Slow-request exclusion and one-time merge callback. |
| `features/account/hooks/useAccountDecks.test.ts` | No-account idle behavior and backend deletion state. |
