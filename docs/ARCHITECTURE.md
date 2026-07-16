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

`src/features/draft/api/gameApi.ts` exposes create/fetch/pick/merge/end/admin-delete operations. The real implementation uses the shared HTTP client. With `VITE_USE_MOCK_API=true`, only this object is replaced by `mockGameApi`; account traffic is unaffected.

The in-memory game mock adds 350 ms latency, creates generated 15-pack games, permits picks and double picks, and uses shared SVG placeholder art. It is intentionally not backend-equivalent:

- State disappears on reload and is local to one browser runtime.
- Packs come from a small hardcoded card pool, not the requested cube.
- It does not model draft balance, remote opponent activity, or persistence.
- `triggerPackMergeAndSwap` reports the current state but never transitions an in-progress game to `GAME_MERGED`; the normal two-player completion flow therefore stalls after local packs are exhausted.
- It does not provide mock Google login, accounts, or saved decks.

Use it for draft setup, card-picking, filtering, and loading-state work, not end-to-end backend validation.

## Draft Flow

`useDraftGame` fetches `GameInfo`, locates players and packs, derives board state, submits picks, and updates local state after a successful response. `usePackMergePoller` immediately checks the merge endpoint and then polls every 10 seconds without overlapping requests. It announces `GAME_MERGED` once.

`DraftPage` composes these hooks with the card workspace. Its exported `WaitingStrategy` controls whether to poll, what to do after a merge, and what waiting UI to render. The default strategy refreshes game data; terminal games with exhausted packs navigate to the deck builder.

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
