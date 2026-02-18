# Jambo CAF Receiver Scaffold

This folder contains a minimal Google Cast CAF receiver scaffold for Phase 3 testing.

## Purpose

- Validate sender/receiver namespace contracts before full receiver UI integration.
- Acknowledge `SYNC_ROOM` messages from sender and expose room state in receiver UI.

## Files

- `index.html`: receiver entrypoint.
- `receiver-app.js`: namespace handlers and simple room status rendering.

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
4. Start cast session from sender and create a room; receiver should transition from "No room synced" to room details.
