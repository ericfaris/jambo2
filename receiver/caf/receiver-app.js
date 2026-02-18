(function () {
  var NAMESPACE = 'urn:x-cast:com.jambo.game.v1';
  var RECEIVER_VERSION = '0.1.0-scaffold';

  var roomState = {
    roomCode: null,
    roomMode: null,
    senderPlayerSlot: null,
    apiBaseUrl: null,
    castAccessToken: null,
    updatedAtMs: null,
  };
  var pollTimer = null;
  var streamSource = null;
  var streamRetryTimer = null;
  var publicRoomSnapshot = null;

  var connectionEl = document.getElementById('connection');
  var roomEl = document.getElementById('room');
  var detailEl = document.getElementById('detail');

  function setConnection(text, isWarning) {
    connectionEl.textContent = text;
    connectionEl.className = isWarning ? 'warn' : 'ok';
  }

  function renderRoom() {
    if (!roomState.roomCode) {
      roomEl.textContent = 'No room synced yet.';
      detailEl.textContent = '';
      return;
    }

    roomEl.textContent = 'Room ' + roomState.roomCode + ' (' + roomState.roomMode + ')';
    var senderRole = roomState.senderPlayerSlot === null
      ? 'tv'
      : 'player-' + String(roomState.senderPlayerSlot + 1);
    if (!publicRoomSnapshot || !publicRoomSnapshot.publicState) {
      detailEl.textContent = 'Last sender role: ' + senderRole + ' at ' + new Date(roomState.updatedAtMs).toLocaleTimeString() + ' | waiting for room state...';
      return;
    }

    var state = publicRoomSnapshot.publicState;
    var p1Gold = state.players && state.players[0] ? state.players[0].gold : '?';
    var p2Gold = state.players && state.players[1] ? state.players[1].gold : '?';
    detailEl.textContent =
      'Last sender role: ' + senderRole +
      ' | phase ' + state.phase +
      ' | turn ' + state.turn +
      ' | current P' + String(state.currentPlayer + 1) +
      ' | actions ' + state.actionsLeft +
      ' | deck ' + state.deckCount +
      ' | discard ' + (state.discardPile ? state.discardPile.length : 0) +
      ' | gold P1/P2 ' + p1Gold + '/' + p2Gold;
  }

  function clearPollTimer() {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function pollPublicRoomState() {
    if (!roomState.roomCode || !roomState.apiBaseUrl) {
      return;
    }

    var endpoint = roomState.apiBaseUrl.replace(/\/+$/, '') +
      '/api/cast/public-room?code=' + encodeURIComponent(roomState.roomCode) +
      '&token=' + encodeURIComponent(roomState.castAccessToken);
    try {
      var response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        setConnection('Receiver state: polling failed (' + String(response.status) + ')', true);
        return;
      }
      publicRoomSnapshot = await response.json();
      setConnection('Receiver state: ready', false);
      renderRoom();
    } catch (_err) {
      setConnection('Receiver state: polling failed', true);
    }
  }

  function restartPolling() {
    clearPollTimer();
    publicRoomSnapshot = null;
    if (!roomState.roomCode || !roomState.apiBaseUrl || !roomState.castAccessToken) {
      renderRoom();
      return;
    }
    void pollPublicRoomState();
    pollTimer = setInterval(function () {
      void pollPublicRoomState();
    }, 1500);
  }

  function closeStreamSource() {
    if (streamSource !== null) {
      streamSource.close();
      streamSource = null;
    }
  }

  function clearStreamRetryTimer() {
    if (streamRetryTimer !== null) {
      clearTimeout(streamRetryTimer);
      streamRetryTimer = null;
    }
  }

  function restartStream() {
    closeStreamSource();
    clearStreamRetryTimer();
    if (!roomState.roomCode || !roomState.apiBaseUrl || !roomState.castAccessToken) {
      return;
    }

    var endpoint = roomState.apiBaseUrl.replace(/\/+$/, '') +
      '/api/cast/stream-room?code=' + encodeURIComponent(roomState.roomCode) +
      '&token=' + encodeURIComponent(roomState.castAccessToken);

    try {
      setConnection('Receiver state: connecting stream...', false);
      streamSource = new EventSource(endpoint);
      streamSource.addEventListener('room', function (event) {
        try {
          publicRoomSnapshot = JSON.parse(event.data);
          setConnection('Receiver state: ready (stream)', false);
          renderRoom();
        } catch (_err) {
          setConnection('Receiver state: stream payload parse failed', true);
        }
      });
      streamSource.addEventListener('room_deleted', function () {
        publicRoomSnapshot = null;
        renderRoom();
        setConnection('Receiver state: room deleted', true);
      });
      streamSource.onerror = function () {
        closeStreamSource();
        setConnection('Receiver state: stream disconnected; using polling fallback', true);
        restartPolling();
        clearStreamRetryTimer();
        streamRetryTimer = setTimeout(function () {
          clearPollTimer();
          restartStream();
        }, 4000);
      };
    } catch (_err) {
      setConnection('Receiver state: stream unavailable; using polling fallback', true);
      restartPolling();
    }
  }

  function restartRealtimeSync() {
    clearPollTimer();
    closeStreamSource();
    clearStreamRetryTimer();
    publicRoomSnapshot = null;
    if (!roomState.roomCode || !roomState.apiBaseUrl || !roomState.castAccessToken) {
      renderRoom();
      return;
    }
    if (typeof EventSource === 'function') {
      restartStream();
      return;
    }
    restartPolling();
  }

  function sendToSender(senderId, payload) {
    var context = cast.framework.CastReceiverContext.getInstance();
    context.sendCustomMessage(NAMESPACE, senderId, JSON.stringify(payload));
  }

  function sendReady(senderId) {
    sendToSender(senderId, {
      type: 'RECEIVER_READY',
      receiverVersion: RECEIVER_VERSION,
      timestampMs: Date.now(),
    });
  }

  function sendSynced(senderId, roomCode) {
    sendToSender(senderId, {
      type: 'RECEIVER_ROOM_SYNCED',
      roomCode: roomCode,
      timestampMs: Date.now(),
    });
  }

  function sendError(senderId, code, message) {
    sendToSender(senderId, {
      type: 'RECEIVER_ERROR',
      code: code,
      message: message,
    });
  }

  function handleCustomMessage(event) {
    var senderId = event.senderId;
    var payloadText = event.data;
    var payload;

    try {
      payload = JSON.parse(payloadText);
    } catch (_err) {
      sendError(senderId, 'INVALID_PAYLOAD', 'Payload is not valid JSON.');
      return;
    }

    if (!payload || typeof payload !== 'object' || typeof payload.type !== 'string') {
      sendError(senderId, 'INVALID_PAYLOAD', 'Payload shape is invalid.');
      return;
    }

    if (payload.type === 'SESSION_PING') {
      sendReady(senderId);
      return;
    }

    if (payload.type !== 'SYNC_ROOM') {
      sendError(senderId, 'INVALID_PAYLOAD', 'Unknown message type: ' + String(payload.type));
      return;
    }

    if (typeof payload.roomCode !== 'string' || payload.roomCode.length === 0) {
      sendError(senderId, 'INVALID_PAYLOAD', 'Missing or invalid roomCode.');
      return;
    }
    if (payload.roomMode !== 'ai' && payload.roomMode !== 'pvp') {
      sendError(senderId, 'INVALID_PAYLOAD', 'roomMode must be ai or pvp.');
      return;
    }
    if (!(payload.senderPlayerSlot === null || payload.senderPlayerSlot === 0 || payload.senderPlayerSlot === 1)) {
      sendError(senderId, 'INVALID_PAYLOAD', 'senderPlayerSlot must be null, 0, or 1.');
      return;
    }
    if (payload.apiBaseUrl !== undefined && typeof payload.apiBaseUrl !== 'string') {
      sendError(senderId, 'INVALID_PAYLOAD', 'apiBaseUrl must be a string when provided.');
      return;
    }
    if (typeof payload.castAccessToken !== 'string' || payload.castAccessToken.length < 8) {
      sendError(senderId, 'INVALID_PAYLOAD', 'Missing or invalid castAccessToken.');
      return;
    }

    roomState.roomCode = payload.roomCode;
    roomState.roomMode = payload.roomMode;
    roomState.senderPlayerSlot = payload.senderPlayerSlot;
    roomState.apiBaseUrl = payload.apiBaseUrl || null;
    roomState.castAccessToken = payload.castAccessToken;
    roomState.updatedAtMs = Date.now();
    restartRealtimeSync();
    renderRoom();
    sendSynced(senderId, payload.roomCode);
  }

  function main() {
    var context = cast.framework.CastReceiverContext.getInstance();
    var playerManager = context.getPlayerManager();
    playerManager.setMessageInterceptor(
      cast.framework.messages.MessageType.LOAD,
      function (loadRequestData) {
        return loadRequestData;
      }
    );
    context.addCustomMessageListener(NAMESPACE, handleCustomMessage);
    context.start();
    setConnection('Receiver state: ready', false);
    renderRoom();
  }

  main();
})();
