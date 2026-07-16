# Changelog

## 2026-07-11 - Documentation Cleanup

- Replaced the flat-layout documentation with the current `app`, `config`, `shared`, and feature-folder structure.
- Documented typed Vite configuration and the shared HTTP client.
- Updated auth behavior to describe Google ID-token login, account restoration, logout, the `/account` guard, and development-only `VITE_SKIP_AUTH`.
- Corrected account data boundaries: saved decks use the backend, while past drafts remain mock data.
- Clarified that deck create/update API methods exist but are not yet connected to the deck-builder UI.
- Corrected `VITE_USE_MOCK_API` scope and documented the game mock's persistence, card-pool, opponent, and merge limitations.
- Added current scripts, Vitest setup, and colocated test coverage.
- Removed stale paths, simulated-login descriptions, flat component inventories, and mock saved-deck exports.

## Earlier Rebuild Work

- Consolidated card filtering and card-workspace UI for the draft board and deck builder.
- Extracted shared error, basic-land, placeholder-art, decklist, and probability helpers.
- Added reusable loading/error screens and client-side navigation.
- Added the draft waiting strategy and non-overlapping merge poller.
- Preserved the Pyramid Draft branding and the roadmap for Scryfall, additional formats, mobile support, bots, donations, and creator content.
