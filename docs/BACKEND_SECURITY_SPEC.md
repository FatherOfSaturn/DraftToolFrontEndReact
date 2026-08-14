# Backend Security Spec

This document specifies the backend (Quarkus) changes required to close the security
issues found in the frontend security review. It is written against the API contracts
the React frontend currently calls. Every section is independent, so fixes can be
shipped in the order of their priority.

Status key: **P0** = must fix before public use · **P1** = should fix soon · **P2** = hardening.

---

## 1. Priority Summary

| # | Issue | Severity | Where |
|---|-------|----------|-------|
| 1 | No real session: any caller who knows an `accountID` is treated as that user | **P0 — IDOR** | All `/account/*`, `/admin/*`, `/game/*/{accountID}/*` |
| 2 | Admin endpoints callable by anyone | **P0** | `DELETE /game/end/admin/delete/*` |
| 3 | `GET /support/` returns all users' tickets + contact emails to anonymous callers | **P0** | `GET /support/` |
| 4 | `playerToken` sent as a URL query parameter (logged by proxies/browsers) | **P1** | `GET /lobby/{code}` |
| 5 | No server-side input limits on user-supplied fields | **P1** | All write endpoints |
| 6 | No rate limiting on login / lobby / support / poll endpoints | **P1** | N/A |
| 7 | Enum drift / invalid enum values in request bodies | **P1** | `draftType`, `gameState`, `status`, `type`, `priority` |
| 8 | Session tokens, ID tokens, and PII could reach server logs | **P2** | Global |
| 9 | Exposed Google OAuth Client ID committed in git history | **P2** | Rotation + secrets management |

---

## 2. Authentication & Session Management (P0)

### Current behavior

`POST /account/login` receives a Google ID token and returns an `Account`.
The frontend then stores `accountID` in `sessionStorage` and sends it in the **URL path**
of every subsequent call (`GET /account/{accountID}`, `PATCH /account/{accountID}`, …).
There is no bearer token, cookie, or server-side session. Any caller who can supply a
known `accountID` can read and mutate that user's data (Insecure Direct Object Reference).

### Required change

1. **Issue a session token at login.** `POST /account/login` must:
   - Verify the Google ID token (signature + `aud` + `iss` + `exp`).
   - Create a server-side session (random 256-bit opaque token stored in Redis/DB with
     expiry), or issue a signed JWT (short-lived, e.g. 1h, with refresh).
   - Return the session token to the client. Do **not** return it in a URL.

2. **Require the token on every authenticated call.** The client sends
   `Authorization: Bearer <token>`. A Quarkus `ContainerRequestFilter` (or MicroProfile
   JWT) resolves the principal and injects it into the request context. Any endpoint that
   needs the current user reads it from the authenticated principal, **never** from a
   request path/query parameter.

3. **Reject unauthenticated calls** with `401` when no valid token is present.

4. **`GET /account` and `PATCH /account` no longer take `accountID` from the path.**
   The identity comes from the session. The frontend `accountApi` will be updated in
   lockstep to drop `accountID` from these URLs.

   Backwards-compatible intermediate step (acceptable short-term): keep the current
   paths but **validate** that the path `accountID` equals the authenticated principal's
   `accountID`; return `403` on mismatch. Do not rely on this forever — path-embedded
   identity is an IDOR magnet.

### Session details

- Token lives server-side with TTL; logout must invalidate it server-side (not just
  client-side).
- Rotate/reissue on privilege-relevant changes (e.g. becoming admin).
- Never log tokens (see §8).

---

## 3. Authorization Matrix (P0)

Enforce roles at the **endpoint** level. The frontend only hides buttons; it must never
be the enforcement point.

| Role | Grant |
|------|-------|
| `USER` (authenticated) | Own account, own decks, own game history, join/leave own lobby, draft in own games, submit support requests |
| `ADMIN` | Everything, plus: admin endpoints, game admin-delete, all support tickets (read/update/delete), account lookup |

### Endpoints that must become `ADMIN`-only

| Endpoint | Why |
|----------|-----|
| `DELETE /game/end/admin/delete/{gameID}` | Deletes any game |
| `DELETE /game/end/admin/delete/random/{gameState}` | Bulk-deletes games |
| `GET /admin/check/{accountID}` | Exposes admin status (allow for any authenticated user — needed to render the nav) |
| `GET /admin/{accountID}/stats/donations` | Financial data |
| `GET /admin/{accountID}/stats/drafts/{draftType}` | Cross-user analytics |
| `GET /support/` | Returns all tickets + PII (see §4) |
| `PATCH /support/{id}/status` | Changes any ticket |
| `DELETE /support/{id}` | Deletes any ticket |

Use a Quarkus security annotation (`@RolesAllowed("ADMIN")`) or an interceptor on the
resource methods. Return `403` for authenticated non-admins and `401` for anonymous.

> The admin check must be computed server-side from a trusted source (DB column /
> claim). Never accept `isAdmin` from the client.

---

## 4. `GET /support/` Data Exposure (P0)

The public **Support / Feature Requests** page calls `GET /support/` and renders the
title, description, type, and status of every submitted request. The same endpoint is
used by the admin dashboard and returns `contactEmail` and `accountID`.

Anyone, logged in or not, can currently enumerate all users' support tickets and
contact emails.

### Required change

Split the endpoint (or add a query flag):

- `GET /support/` → **admin-only**, returns full records including `contactEmail` /
  `accountID`. Replace all admin-dashboard callers with this.
- `GET /support/public` (new) → anonymous, returns **only** records that are
  safe to share publicly (e.g. `status == completed`), and **excludes**
  `contactEmail`, `accountID`, and any admin-only notes.

Update the frontend so the public backlog calls `/support/public` and the admin
dashboard calls `/support/`.

---

## 5. Lobby Player Token Transport (P1)

`GET /lobby/{lobbyCode}` accepts `playerToken` as a query parameter. Query strings
appear in proxy and access logs, browser history, and referrer chains.

### Required change

- Move the player token out of the query string into a header, e.g.
  `X-Lobby-Token: <token>`.
- Backend reads the token from the header only.
- Coordinate with the frontend: `lobbyApi.pollLobby` sends the header instead of
  `?playerToken=`.
- If a cookie is used instead, mark it `HttpOnly; Secure; SameSite=Strict`.

---

## 6. Server-Side Input Validation (P1)

The frontend now enforces these limits; the backend must enforce them **independently**
(anyone can call the API directly). Use Bean Validation (`@Size`, `@NotBlank`, `@Email`,
`@Pattern`) on request DTOs and reject with `400`.

### Limits (must match or be stricter than the frontend)

| Field | Max length | Extra rules |
|-------|-----------|-------------|
| Support `title` | 200 | non-blank |
| Support `description` | 5000 | non-blank |
| Support `contactEmail` | 254 | must match email format |
| Support `priority` | enum | `low`, `medium`, `high`, `critical` |
| Support `type` | enum | `new_feature`, `bug_fix`, `misc_support` |
| Deck `name` | 100 | non-blank |
| Deck `description` | 1000 | optional |
| Deck `cardIds` | ≤ 500 | array; each ID length ≤ 128 |
| Account `displayName` | 50 | non-blank |
| Player/lobby display name | 50 | non-blank |
| Cube ID | 100 | allow `[a-z0-9-]` |
| Game ID / Lobby code | 64 | allow `[A-Z0-9-]` |
| Scryfall batch `names` | ≤ 200 | array; each name length ≤ 200 |

### Body size & structural limits

- Set a global max request body size in `application.properties`:
  `quarkus.http.limits.max-body-size` (e.g. `1M`).
- Reject malformed JSON with `400` (do not default missing enums to a value).
- Never trust array lengths: enforce the caps above before iterating.

### Decklist batch endpoint

`POST /scryfall/cards/batch/cubecobra` receives arbitrary card names. Validate:
- ≤ 200 names per request.
- Each name ≤ 200 chars.
- Downstream Scryfall call must be a server-to-server call with an allow-list; do not
  forward user-controlled URLs anywhere.

---

## 7. Enum Validation (P1)

Request bodies carry string enums: `draftType`, `gameState`, `status`, `type`,
`priority`. Unknown values must be rejected (`400`), never coerced to `null` or a
default. Ensure Jackson is not configured with `ALLOW_COERCION_OF_SCALARS` or a lenient
enum handling that silently maps unknown strings. Add explicit `@JsonCreator`/`fromString`
that throws on unknown values if the default is not strict.

The `normalizeSupportRequest` / `normalizeLobbyInfo` lowercasing in the frontend is a
presentation concern; the backend should still accept the documented values and reject
anything else.

---

## 8. Rate Limiting (P1)

Apply per-IP (and per-account where available) rate limits. Fail with `429`.

| Endpoint | Limit (suggested) |
|----------|-------------------|
| `POST /account/login` | 10 / min / IP |
| `POST /lobby`, `POST /lobby/{code}/join` | 10 / min / IP |
| `GET /lobby/{code}` (poll) | 30 / min / IP |
| `GET /game/merge/{id}`, `GET /classic-game/.../draftCheck` | 30 / min / IP |
| `POST /support/` | 5 / hour / IP |
| `POST /scryfall/cards/batch/cubecobra` | 30 / min / IP |

Quarkus notes: a small `ContainerRequestFilter` + Redis (or the Elytron/JWT throttling
extensions) is sufficient. Do not implement in the frontend.

---

## 9. Logging & Secrets (P2)

### Do not log

- Google ID tokens (`POST /account/login` body)
- Session tokens / `Authorization` headers
- `playerToken`
- Full support-ticket descriptions or contact emails in access logs (sanitize at the
  boundary if required by debugging, e.g. store a truncated hash).

Configure Quarkus to not log request bodies:
`quarkus.http.log.enable = false` (or a dedicated sanitizing filter if needed).

### Secrets

- Rotate the Google OAuth Client ID (`346763937043-…apps.googleusercontent.com`); it is
  present in the frontend repo's git history (commit `b68be85`). A client ID is not a
  password, but rotation removes the stale copy from active use.
- All secrets (Google client ID/secret, session-store credentials, admin emails) must be
  injected via environment variables / a secrets manager — never hardcoded and never
  baked into images.
- The Google client **secret** (if the backend calls Google APIs server-side) must exist
  only in the backend environment, never the frontend build.

---

## 10. Transport & Headers (P2 — mostly done)

- TLS is terminated by Caddy (`pyramiddraft.xyz`); the backend and nginx should refuse
  plain HTTP in production or rely on `X-Forwarded-Proto` from the trusted proxy.
- HSTS, CSP, `X-Content-Type-Options`, and `X-Frame-Options` are already emitted by the
  frontend's nginx layer — do not duplicate conflicting headers at the backend.
- Ensure the backend trusts `X-Forwarded-For` only from the proxy, so spoofed headers
  cannot bypass any IP-based rate limits.

---

## 11. Frontend Coordination (contract changes)

These backend changes change API contracts. The React frontend must be updated in the
same release, in lockstep:

1. `httpClient` attaches `Authorization: Bearer <token>` (token stored in a session
   store, not `localStorage`).
2. `AuthContext.login` stores the session token; `logout` calls the backend logout to
   invalidate it server-side.
3. `accountApi` drops `accountID` from `GET/PATCH /account` and uses the session.
4. `lobbyApi.pollLobby` sends `X-Lobby-Token` instead of `?playerToken=`.
5. `FeatureBacklog` calls `/support/public`; the admin dashboard calls `/support/`.

## 12. Acceptance Checklist

- [ ] `POST /account/login` returns a session token; unauthenticated calls return `401`.
- [ ] Calling `GET /account/{otherUserID}` as a different user returns `403` (and the
      target path form is eventually removed).
- [ ] `DELETE /game/end/admin/delete/{gameID}` returns `403` for non-admins.
- [ ] Anonymous `GET /support/` returns `401`/`403`; public backlog uses `/support/public`
      without PII.
- [ ] `playerToken` never appears in URLs.
- [ ] All §6 limits return `400` when exceeded (verified with oversized request bodies).
- [ ] Rate limits return `429` (verified from a single IP/account).
- [ ] No request body logging; tokens absent from access logs.
- [ ] Google Client ID rotated; no secrets in image layers or git.

---

## 13. Open Contract Questions (blocking the frontend rework)

Verified against the frontend source: the backend changes in §2, §5 and the kick change
are all **breaking** for the current frontend. The frontend rework is blocked on these
answers — please confirm each before the API work is considered done:

| # | Question | Why it blocks | Frontend dependency |
|---|----------|---------------|---------------------|
| Q1 | Do `GET /account` / `PATCH /account` still accept `accountID` in the path (bearer-gated), or is identity principal-only now? | Session restore calls `GET /account/{accountID}` on mount; if the path form is dropped, the frontend must stop embedding `accountID`. | `AuthContext.tsx` restore, `accountApi.ts` |
| Q2 | Does `GET /admin/check/{accountID}` keep the path `accountID` or become `/admin/check` (identity from JWT)? | The nav admin-badge calls it with `accountID` in the path. | `adminApi.ts` |
| Q3 | Does `GET /support/public` exist yet? | The public backlog must switch from `/support/`; until then it will 401/403. | `FeatureBacklog.tsx` (line 33) |
| Q4 | Did lobby polling also move the token out of the query string (`?playerToken=` → `X-Lobby-Token`)? The note only covered draft endpoints. | Spec §5 is not done until this is confirmed. | `lobbyApi.pollLobby` (line 61) |
| Q5 | For `X-Player-Token` on draft endpoints: what is the exact header name, and where does the frontend obtain the per-game player token? | Draft calls currently key identity on `playerName`/`accountID` in the URL path; the frontend only holds the **lobby** `playerToken` in sessionStorage. | `gameApi.ts`, `classicGameApi.ts` |
| Q6 | Kick (blocker): which option is chosen — (a) backend returns a kick token for each target player in the host's lobby response, or (b) `kick` accepts the target's `slotIndex`/`accountID` plus host identity and resolves authorization server-side? | `@JsonIgnore` on `LobbyPlayer.playerToken` makes the current kick flow impossible (target token is `undefined`). | `lobbyTypes.ts`, `LobbyView.tsx`, `DraftSetupPage.tsx` |
| Q7 | Is the login response shape exactly `{account, jwt, expiresIn}` (field names)? | `accountApi.login` currently returns the raw `Account`; it must unwrap the wrapper. | `accountApi.login` |

Once Q1–Q7 are answered, the frontend changes are: `httpClient` adds
`Authorization: Bearer`; `accountApi` unwraps the login response and stores the JWT in
sessionStorage; `gameApi`/`classicGameApi` send the player token as a header instead of
path identity; `FeatureBacklog` uses `/support/public`; `lobbyApi` moves the poll token
to a header; and the kick flow is reworked per Q6.
