# Jambo CAF Receiver TV UI

This folder contains the Google Cast CAF receiver implementation used for the TV board view.

## Purpose

- Render a TV-style board layout from cast public room state.
- Acknowledge `SYNC_ROOM` messages from sender and keep receiver state in sync.

## Files

- `index.html`: receiver entrypoint.
- `receiver-app.js`: namespace handlers and TV board rendering from public room state.

## Namespace

- `urn:x-cast:com.jambo.game.v1`

## Message contracts implemented

- Sender -> Receiver:
  - `SYNC_ROOM`
  - `SESSION_PING`
- Receiver -> Sender:
  - `RECEIVER_READY`
  - `RECEIVER_ROOM_SYNCED`
  - `RECEIVER_ERROR`

## Backend requirement

- Receiver streams sender backend endpoint (preferred):
  - `GET /api/cast/stream-room?code=<4-digit-room-code>&token=<cast-access-token>`
- Receiver polling fallback remains available:
  - `GET /api/cast/public-room?code=<4-digit-room-code>&token=<cast-access-token>`
- The sender now includes `apiBaseUrl` and `castAccessToken` in `SYNC_ROOM` to direct authenticated receiver polling.

## Local usage notes

1. Host this folder on HTTPS.
2. Register the receiver URL under your Cast App ID in Google Cast Console.
3. Set `VITE_CAST_SDK_ENABLED=true` and `VITE_CAST_APP_ID=<app-id>` in sender app.
4. Start cast session from sender and create a room; receiver should transition from the waiting view to the live TV board layout.

## Audio filename safety

- Do not use spaces in audio file names under `public/audio/`.
- Prefer underscore-separated names (example: `Sun_In_Our_Hands.mp3`).
- Failure signature when this breaks on Chromecast:
  - `NotSupportedError: The element has no supported sources`
  - `DEMUXER_ERROR_COULD_NOT_OPEN`
