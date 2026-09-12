# Chromecast Architecture

## Overview

The system uses Google's **Cast Application Framework (CAF)** with a custom message namespace. The key architectural insight is a **3-party model**:

```
Sender (browser/player) ←→ Google Cast ←→ Receiver (TV)
         ↕                                      ↕
    Backend API (WebSocket)              Backend API (HTTP poll/SSE)
```

The receiver **never receives game actions** — it only reads a public state snapshot from the backend. This keeps it truly read-only.

---

## File Structure

| Layer | File | Role |
|-------|------|------|
| Contracts | `src/cast/contracts.ts` | Message types, interfaces, namespace |
| Web Sender | `src/cast/webSender.ts` | Google Cast SDK wrapper |
| Factory | `src/cast/factory.ts` | Singleton + feature gating |
| Type defs | `src/cast/google-cast.d.ts` | TypeScript `window.cast` types |
| Sync hook | `src/cast/useCastRoomSync.ts` | React hook: sender→receiver sync |
| CAF Receiver | `receiver/caf/receiver-app.js` | Vanilla JS TV app |
| React Receiver | `receiver/react/useCastReceiver.ts` | React TV app hook |
| TV Display | `src/ui/TVScreen.tsx` | Dashboard rendered on TV |
| Cast UI | `src/ui/CastLobby.tsx` | Room setup screen |
| Router | `src/ui/Router.tsx` | Initiates cast session |

---

## Core Abstraction

```typescript
// contracts.ts
interface CastSessionController {
  requestSession(): void      // Show device picker
  endSession(): void
  sendMessage(msg: SenderToReceiverMessage): void
  onMessage(cb: (msg: ReceiverToSenderMessage) => void): () => void
  onSessionChanged(cb: (state: CastConnectionState) => void): () => void
}
```

Two implementations: `WebCastSessionController` (real) and `NoopCastSessionController` (no-op for unsupported browsers). Selected via `getCastSessionController()` factory singleton — feature-gated by `VITE_CAST_APP_ID`.

---

## Custom Message Protocol

**Namespace:** `urn:x-cast:com.jambo.game.v1`

**Sender → Receiver:**
- `SYNC_ROOM` — tells receiver which room to watch: `{ roomCode, roomMode, senderPlayerSlot, apiBaseUrl, castAccessToken }`
- `TOGGLE_DEBUG` — toggle debug overlay on TV

**Receiver → Sender:**
- `RECEIVER_ROOM_SYNCED` — confirmation
- `RECEIVER_ERROR` — `INVALID_PAYLOAD | ROOM_NOT_FOUND | INTERNAL`
- `RECEIVER_DEBUG_TOGGLED`

---

## Data Flow

1. **Session start**: Sender calls `requestSession()` → Google device picker → Cast session established
2. **Room sync**: Sender sends `SYNC_ROOM` with room code + auth token via Cast channel
3. **Receiver authenticates**: Uses `castAccessToken` to call `GET /api/cast/public-room?code=X&token=Y`
4. **Live updates**: Receiver tries SSE (`/api/cast/stream-room`) first, falls back to 1.5s polling
5. **Game actions**: Flow sender → backend WebSocket (never through Cast channel)
6. **TV renders**: Receiver displays public state as a dashboard (no private player info)

---

## Receiver State Strategy

The receiver is **purely a display** — it has no-op stubs for all write operations (`sendAction`, `createRoom`, etc.). It only gets a `publicState` object and renders it reactively as it polls/streams updates from the backend.

Two receiver implementations exist:
- **`receiver/caf/`** — Vanilla JS, lighter, directly manipulates DOM
- **`receiver/react/`** — React-based, uses same `useCastReceiver` hook pattern, renders a real `TVScreen` component

---

## Backend Requirements

Two endpoints needed:

```
GET /api/cast/public-room?code=XXXX&token=TOKEN    → CastPublicRoomPayload (polling)
GET /api/cast/stream-room?code=XXXX&token=TOKEN    → SSE stream of same payload
GET /api/config                                     → { castAppId: "..." }
```

The room payload includes only **public** state — no private player info (e.g. no hand cards).

---

## Replicating This in Another Project

To replicate this architecture for a generic dashboard-on-TV use case:

1. **Register** a Cast Receiver App at [cast.google.com/publish](https://cast.google.com/publish) → get an App ID
2. **Copy** `src/cast/contracts.ts` — replace message types with your domain's sync message (e.g. `SYNC_SESSION` with your equivalent of `roomCode`/`token`)
3. **Copy** `src/cast/webSender.ts` and `src/cast/factory.ts` — swap in your App ID
4. **Create** a receiver app (use the React receiver pattern from `receiver/react/`) — it fetches your backend's public state and renders a dashboard
5. **Backend**: Add two endpoints: one polling, one SSE, returning public state gated by a session token
6. **Sender**: Use a `useCastRoomSync`-style hook to send `SYNC_SESSION` once the Cast session connects; re-send on reconnect
7. **Dashboard screens**: The TV shows whatever your public state contains — the screen can change by updating what the public state payload describes (e.g. a `currentScreen: 'overview' | 'detail' | 'leaderboard'` field)

### Screen Switching on TV

Screen switching is built into the state — the receiver renders whatever `publicState.currentScreen` says. The sender controls this by updating the backend state, which the receiver picks up on the next poll/SSE event. No direct Cast message is needed for screen changes.

```
Sender updates backend state (currentScreen = 'leaderboard')
  ↓
Backend SSE pushes updated publicState to receiver
  ↓
Receiver re-renders with new screen
```
