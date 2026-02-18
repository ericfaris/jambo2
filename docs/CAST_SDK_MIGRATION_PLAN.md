# Chromecast SDK Migration Plan

Last reviewed: 2026-02-17

## Goal

Replace the current web-only "cast mode" transport with a native Google Cast SDK architecture while preserving the existing authoritative backend game model.

## Current Implementation (Baseline)

- TV and player roles are hash routes (`/#/tv/*`, `/#/play`) in a web app.
- Pairing is room-code based via WebSocket lobby.
- Server is authoritative and already splits game state:
  - Public state -> TV
  - Public + private state -> each player
- Reconnect and role management are custom logic in multiplayer server/client.

## Target Architecture

- Sender apps:
  - Android: Google Cast SDK
  - iOS: Google Cast SDK
  - Web: Cast Web Sender SDK
- Receiver app:
  - CAF Web Receiver hosted over HTTPS and registered under a Cast App ID.
- Jambo backend remains authoritative for game rules and persistence.
- Receiver never receives private player state.

## Core Design Decisions

- Keep gameplay actions flowing sender -> backend, not sender -> receiver -> backend.
- Use Cast channel for session/room metadata and receiver UI orchestration.
- Keep existing room and slot concepts (`ai` / `pvp`, player 0/1).
- Preserve non-Cast fallback path for unsupported environments.

## Transport Model

1. Sender starts Cast session and launches Jambo receiver app.
2. Sender requests room creation/join from backend.
3. Sender sends a metadata envelope to receiver:
   - room code
   - mode
   - sender role hint
4. Receiver subscribes to backend public room state stream.
5. Player senders interact with backend using authenticated action APIs.
6. Receiver renders public board; private state remains sender-only.

## Solo and Multiplayer Flows

### Solo (AI)

1. Player taps Cast button.
2. Sender starts Cast session and requests room creation (`mode=ai`).
3. Backend assigns player slot 0 to sender; AI remains slot 1.
4. Receiver displays public board state.
5. Sender receives private hand/resolution state and sends actions.

### Multiplayer (PVP)

1. Host sender starts Cast session and creates room (`mode=pvp`).
2. Receiver shows join affordance (QR + short code fallback).
3. Guest sender joins via deep link/room entry.
4. Backend assigns slot 0/1.
5. Receiver shows public board; both senders keep private views.

## UX Changes

- Add native Cast button in main menu and in-game header.
- Replace "Cast" screen-mode toggle with "Cast to device" flow.
- Receiver lobby shows:
  - connected device/session state
  - room status
  - join QR/deep link for additional players
- Sender shows persistent cast status chip:
  - connected device
  - reconnecting/ended state
  - stop casting action

## Security and Privacy

- Receiver payload schema must exclude private fields by type contract.
- Backend must authorize player actions by room + slot + auth identity.
- Do not trust receiver-side role assertions.
- Log and reject slot-mismatch or stale-session action attempts.
- Receiver public-room reads must require room-scoped access token validation.

## Testing Strategy

- Unit:
  - Cast message envelope validation
  - session-state reducer behavior
- Integration:
  - sender session connect/disconnect/resume
  - backend room lifecycle with cast metadata
- E2E:
  - real Chromecast/Google TV on shared LAN
  - reconnect during gameplay
  - dual-sender pvp join/resume
- Regression guard:
  - explicit test asserting receiver cannot access `PrivateGameState` fields

## Observability

- Correlate logs by `castSessionId + roomCode + playerId`.
- Emit structured events:
  - session_started
  - session_resumed
  - receiver_connected
  - sender_joined
  - sender_disconnected
  - action_rejected
- Track cast-specific failure reasons separately from core gameplay failures.

## Phased Execution

1. Phase 1 (done in this document): architecture + contracts.
2. Phase 2: web sender Cast session scaffolding and feature flag.
3. Phase 3: CAF receiver MVP rendering lobby + public board.
4. Phase 4: backend cast-session binding and metadata APIs.
5. Phase 5: multiplayer hardening (reconnect, ownership conflicts).
6. Phase 6: Android/iOS sender parity.
7. Phase 7: staged rollout with non-Cast fallback retained.

## Phase 2 Scaffold Status

- `src/cast/contracts.ts` defines Cast session and message contracts.
- `src/cast/webSender.ts` provides a web sender implementation of `CastSessionController`.
- `src/cast/factory.ts` gates Cast usage behind env flags and falls back safely.
- `src/ui/screens/MainMenu.tsx` includes a beta Cast connect/disconnect control when enabled.

### Required environment flags

- `VITE_CAST_SDK_ENABLED=true`
- `VITE_CAST_APP_ID=<your registered Cast app id>`

If either is missing/disabled, the app uses a no-op Cast controller and normal gameplay remains unchanged.

## Phase 3 Scaffold Status

- Sender now pushes `SYNC_ROOM` with backend `apiBaseUrl`.
- Backend exposes receiver-readable public state endpoints:
  - `GET /api/cast/stream-room?code=<roomCode>&token=<castAccessToken>` (SSE push, preferred)
  - `GET /api/cast/public-room?code=<roomCode>&token=<castAccessToken>`
- CAF receiver streams public room updates (with polling fallback) and renders live metadata (phase, turn, actions, deck/discard, player gold).

## Exit Criteria Before Rollout

- Stable reconnect across sender background/foreground.
- No private-state leakage to receiver in logs or payload capture.
- PVP join success >= target SLO in beta.
- Cast session recovery tested on at least two hardware receiver types.
