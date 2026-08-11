# Architecture

Pyramid Draft uses feature folders for product behavior and `shared` for code used across features.

```text
main.tsx
  app/App.tsx                 providers and routes
    features/*/pages         route-level composition and state
      features/*/hooks       feature behavior
      features/*/api         backend adapters
      features/*/components  feature UI
    shared/api               transport shared by backend adapters
    shared/components        cross-feature UI
    shared/lib and model     pure helpers and common DTOs
  config/env.ts              environment normalization
```

## Application Shell And Routing

`src/app/App.tsx` installs `GoogleOAuthProvider`, `AuthProvider`, and `BrowserRouter`. It owns the route table and small callback-to-navigation adapters for draft selection and setup. `DraftRouteWrapper` converts route parameters to `DraftPage` props.

`/account` is wrapped in `RequireAuth` unless the development-only `env.skipAuth` flag is true. The other routes are public. Unknown routes redirect to `/`.

## Configuration And HTTP

`src/vite-env.d.ts` declares all accepted `VITE_*` variables. `src/config/env.ts` is the only normalization layer: it removes trailing slashes from the API URL, applies defaults, converts string flags to booleans, and ensures auth skipping can only activate under `import.meta.env.DEV`.

`src/shared/api/httpClient.ts` provides:

- `apiUrl` for paths relative to `VITE_API_BASE_URL`.
- `request` for headers, status checking, and `ApiError` details.
- `requestJson<T>` and `requestVoid` for response handling.

The client sets JSON content type when a body is present. It does not attach bearer tokens or cookies explicitly. The feature APIs encode path segments and define their own endpoint contracts.

## Authentication And Accounts

Google Identity Services supplies an ID token through `@react-oauth/google`. `AuthContext.login` sends that token to `POST /account/login`, receives an `Account`, and stores only its `accountID` under `drafttool_account_id`. On startup, the provider restores the account through `GET /account/{accountID}`; a failed restore removes the saved ID. Logout clears local state and calls `googleLogout`.

`VITE_GOOGLE_CLIENT_ID` is required to render Google Sign-In. The username/password fields are disabled presentation elements, not a second login mechanism.

The account feature uses the real API for account retrieval, display-name updates, and saved-deck list/create/update/delete contracts. The current UI lists and deletes backend decks and edits the display name. Although create/update methods exist in `accountApi`, `DeckBuilderPage` does not call them yet. Past-draft rows come from `mockPastDrafts.ts` and are unrelated to the saved-deck API.

`VITE_SKIP_AUTH=true` bypasses only the `/account` guard during Vite development. It does not synthesize an account: without a logged-in account, deck fetching is idle and the profile asks the user to log in. It is ignored in production.

## Game API Boundary

`src/features/draft/api/gameApi.ts` exposes create/fetch/pick/merge/end/admin-delete operations for **Pyramid Draft** (prefix `/game`). `src/features/draft/api/classicGameApi.ts` exposes the separate **Classic Draft** backend (prefix `/classic-game`): create, pick, draftCheck, draftData, fetchGameData (409 until complete), end, and history. The real implementations use the shared HTTP client. With `VITE_USE_MOCK_API=true`, only these objects are replaced by `mockGameApi` / `mockClassicGameApi`; account traffic is unaffected.

The in-memory game mocks add 350 ms latency, create generated games, permit picks (and, for pyramid, double picks), and use shared SVG placeholder art. They are intentionally not backend-equivalent:

- State disappears on reload and is local to one browser runtime.
- Packs come from a small hardcoded card pool, not the requested cube.
- It does not model draft balance, remote opponent activity, or persistence.
- Pyramid: `triggerPackMergeAndSwap` reports the current state but never transitions an in-progress game to `GAME_MERGED`; the normal two-player completion flow therefore stalls after local packs are exhausted.
- Classic: `mockClassicGameApi` does implement the full seat-to-seat pass, direction flip, and auto-completion lifecycle, so a single-browser solo playthrough (a few tabs) exercises the whole flow.
- It does not provide mock Google login, accounts, or saved decks.

Use it for draft setup, card-picking, filtering, and loading-state work, not end-to-end backend validation.

## Draft Flow

`useDraftGame` fetches pyramid `GameInfo`, locates players and packs, derives board state, submits picks, and updates local state after a successful response. `usePackMergePoller` immediately checks the merge endpoint and then polls every 10 seconds without overlapping requests. It announces `GAME_MERGED` once.

`useClassicDraftGame` drives the classic board from `draftData` (the live, per-player view) rather than full game data: it derives the pickable pack from `activeCardPacks[0]`, computes cards-left-to-draft from `dealtCardPacks`, and re-fetches `draftData` after every pick. `useClassicDraftPoller` polls `draftCheck` every 3 seconds (immediately on start, no overlapping requests) while the player is waiting for a pack — `canDraft` triggers a `draftData` refresh and `GAME_COMPLETE` sends the player to the deck builder.

Both boards render through the shared `DraftBoardView` (header, stats bar, pool sidebar, filter panel, grid, staging/confirm/double-click interaction). `DraftPage` composes it with the pyramid hook, merge poller, partner/extra-picks stats, and the extra-pick FAB; its exported `WaitingStrategy` controls whether to poll, what to do after a merge, and what waiting UI to render. `ClassicDraftPage` composes the same view with the classic hook, the draftCheck poller, and cards-left-to-draft stats (no partner, no FAB).

The classic board lives at `/classic-draft/:gameID/:playerName`. Classic is routed separately (rather than detected at runtime) because `draftData`/`draftCheck` do not carry a game type. On completion, `ClassicDraftPage` navigates to the deck builder with `location.state.gameType = 'classic'`, which makes `DeckBuilderPage` fetch via `classicGameApi.fetchGameData` (only valid once the game is complete). `FindGameSection` in classic mode probes `draftData` first and falls back to the pyramid lookup on a 404.

The format picker is currently cosmetic: every option navigates to the same `/draft-setup` flow, and the selected format is not passed forward.

## Card Workspace And Deck Builder

`features/card-workspace` owns the reusable grid, filter panel, pool sidebar, analytics, decklist import, and filtering model used by both drafting and deck construction. `useCardFilters` wraps the pure `filterCards` model and supplies props for `FilterPanel`.

`DeckBuilderPage` has two entry modes:

- `/deckbuilder/:gameID/:playerName` fetches the game and starts from that player's drafted cards.
- `/deckbuilder` starts empty and accepts pasted decklists.

Cards can move between main list and sideboard, basic lands can be added, and export copies grouped text to the clipboard. There is currently no save/edit integration with `accountApi`.

## Mulligan Simulator

The simulator has no backend calls. It parses a pasted list, expands card quantities, shuffles opening hands, and uses real hypergeometric helpers for category probabilities. Card categories depend on `shared/lib/cardTypeLookup.ts`, a limited local name-to-type table; unknown cards are not resolved through Scryfall. Advanced "Goldfish Win" and "Combo Stability" displays are placeholders rather than turn-by-turn simulations.

## Testing

Vitest is configured in `vite.config.ts` with `jsdom`, `src/test/setup.ts`, cleared mocks, Testing Library, and `jest-dom`. Tests live beside their modules. `npm test` runs once, `npm run test:watch` watches, `npm run typecheck` runs strict TypeScript checks, and `npm run build` requires typecheck success before Vite builds.
