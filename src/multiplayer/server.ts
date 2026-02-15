// ============================================================================
// Cast Mode — WebSocket Server
// Runs the authoritative game engine; clients send actions, receive split state.
// Usage: npm run server (tsx src/multiplayer/server.ts)
// ============================================================================

import { WebSocketServer, WebSocket } from 'ws';
import { createInitialState } from '../engine/GameState.ts';
import { processAction } from '../engine/GameEngine.ts';
import { getRandomAiAction } from '../ai/RandomAI.ts';
import { getAiActionDescription } from '../ai/aiActionDescriptions.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { extractPublicState, extractPrivateState } from './stateSplitter.ts';
import type { GameState, GameAction } from '../engine/types.ts';
import { CONSTANTS } from '../engine/types.ts';
import type {
  ClientMessage,
  ServerMessage,
  RoomMode,
  ConnectionRole,
  PlayerSlot,
  AudioEvent,
} from './types.ts';

// --- Room ---

interface Connection {
  ws: WebSocket;
  role: ConnectionRole;
  playerSlot: PlayerSlot | null;
}

interface Room {
  code: string;
  mode: RoomMode;
  state: GameState | null;
  connections: Connection[];
  lastActivity: number;
}

const rooms = new Map<string, Room>();

// --- Helpers ---

function generateRoomCode(): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function findConnection(room: Room, ws: WebSocket): Connection | undefined {
  return room.connections.find(c => c.ws === ws);
}

function findRoom(ws: WebSocket): Room | undefined {
  for (const room of rooms.values()) {
    if (room.connections.some(c => c.ws === ws)) return room;
  }
  return undefined;
}

function getPlayerConnections(room: Room, slot: PlayerSlot): Connection[] {
  return room.connections.filter(c => c.playerSlot === slot);
}

function getTvConnections(room: Room): Connection[] {
  return room.connections.filter(c => c.role === 'tv');
}

function getPlayerCount(room: Room): number {
  const slots = new Set<PlayerSlot>();
  for (const c of room.connections) {
    if (c.playerSlot !== null) slots.add(c.playerSlot);
  }
  return slots.size;
}

// --- Audio Event Detection ---

function detectAudioEvent(action: GameAction): AudioEvent | null {
  switch (action.type) {
    case 'DRAW_CARD':
    case 'KEEP_CARD':
    case 'DRAW_ACTION':
      return 'card-draw';
    case 'PLAY_CARD': {
      if (action.wareMode) return 'coin';
      const card = getCard(action.cardId);
      if (card.type === 'animal') return 'attack';
      return 'card-play';
    }
    case 'END_TURN':
      return 'turn-end';
    case 'GUARD_REACTION':
      return action.play ? 'guard' : null;
    default:
      return null;
  }
}

// --- Broadcast ---

function broadcastState(room: Room, audioEvent: AudioEvent | null, aiMessage: string | null = null): void {
  if (!room.state) return;

  const publicState = extractPublicState(room.state);

  // Send to TV connections (public only)
  for (const conn of getTvConnections(room)) {
    const msg: ServerMessage = {
      type: 'GAME_STATE',
      public: publicState,
      private: null,
      audioEvent,
      aiMessage,
    };
    send(conn.ws, msg);
  }

  // Send to player connections (public + their private)
  for (const slot of [0, 1] as PlayerSlot[]) {
    const privateState = extractPrivateState(room.state, slot);
    for (const conn of getPlayerConnections(room, slot)) {
      const msg: ServerMessage = {
        type: 'GAME_STATE',
        public: publicState,
        private: privateState,
        audioEvent,
        aiMessage,
      };
      send(conn.ws, msg);
    }
  }
}

// --- AI Loop ---

function scheduleAiTurn(room: Room): void {
  if (!room.state || room.mode !== 'ai') return;
  if (room.state.phase === 'GAME_OVER') return;

  // AI is player 1
  const aiSlot: PlayerSlot = 1;
  const needsAi = isWaitingForPlayer(room.state, aiSlot);
  if (!needsAi) return;

  setTimeout(() => {
    if (!room.state) return;
    // Re-check — state may have changed
    if (!isWaitingForPlayer(room.state, aiSlot)) return;

    const action = getRandomAiAction(room.state);
    if (!action) return;

    try {
      room.state = processAction(room.state, action);
      room.lastActivity = Date.now();
      const audioEvent = detectAudioEvent(action);
      const aiMessage = getAiActionDescription(action, room.state);
      broadcastState(room, audioEvent, aiMessage);

      // Check game over
      if (room.state.phase === 'GAME_OVER') {
        broadcastGameOver(room);
        return;
      }

      // Continue AI loop
      scheduleAiTurn(room);
    } catch (e) {
      console.error('[AI] Action failed:', (e as Error).message);
      // Retry once more after a delay
      setTimeout(() => scheduleAiTurn(room), CONSTANTS.AI_ACTION_DELAY_MS);
    }
  }, CONSTANTS.AI_ACTION_DELAY_MS);
}

function isWaitingForPlayer(state: GameState, slot: PlayerSlot): boolean {
  if (state.phase === 'GAME_OVER') return false;

  // Guard reaction
  if (state.pendingGuardReaction) {
    return state.pendingGuardReaction.targetPlayer === slot;
  }

  // Ware card reaction
  if (state.pendingWareCardReaction) {
    return state.pendingWareCardReaction.targetPlayer === slot;
  }

  // Resolution
  const pr = state.pendingResolution;
  if (pr) {
    switch (pr.type) {
      case 'OPPONENT_DISCARD':
        return pr.targetPlayer === slot;
      case 'OPPONENT_CHOICE':
        return state.currentPlayer !== slot;
      case 'AUCTION':
        return pr.nextBidder === slot;
      case 'DRAFT':
        return pr.currentPicker === slot;
      case 'UTILITY_KEEP':
        return (pr.step === 'ACTIVE_CHOOSE' && state.currentPlayer === slot) ||
               (pr.step === 'OPPONENT_CHOOSE' && state.currentPlayer !== slot);
      case 'CARRIER_WARE_SELECT':
        return pr.targetPlayer === slot;
      default:
        return state.currentPlayer === slot;
    }
  }

  // Normal turn
  return state.currentPlayer === slot;
}

function broadcastGameOver(room: Room): void {
  if (!room.state) return;
  const publicState = extractPublicState(room.state);
  for (const conn of room.connections) {
    send(conn.ws, { type: 'GAME_OVER', public: publicState });
  }
}

// --- Game Start ---

function tryStartGame(room: Room): void {
  if (room.state) return; // already started

  const hasTv = getTvConnections(room).length > 0;
  const playerCount = getPlayerCount(room);

  if (room.mode === 'ai' && playerCount >= 1 && hasTv) {
    room.state = createInitialState();
    broadcastState(room, null);
    // AI is player 1 — if it's their turn first, start AI loop
    scheduleAiTurn(room);
  } else if (room.mode === 'pvp' && playerCount >= 2 && hasTv) {
    room.state = createInitialState();
    broadcastState(room, null);
  }
}

// --- Message Handlers ---

function handleCreateRoom(ws: WebSocket, mode: RoomMode): void {
  const code = generateRoomCode();
  const room: Room = {
    code,
    mode,
    state: null,
    connections: [{ ws, role: 'tv', playerSlot: null }],
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  send(ws, { type: 'ROOM_CREATED', code });
  send(ws, { type: 'JOINED', playerSlot: null, mode });
  console.log(`[Room ${code}] Created (${mode} mode), TV auto-joined`);
}

function handleJoinRoom(ws: WebSocket, code: string, role: ConnectionRole): void {
  const room = rooms.get(code);
  if (!room) {
    send(ws, { type: 'ERROR', message: 'Room not found' });
    return;
  }

  // Skip if this connection is already in the room
  if (room.connections.some(c => c.ws === ws)) {
    return;
  }

  let playerSlot: PlayerSlot | null = null;

  if (role === 'player') {
    // Assign player slot
    const hasP0 = room.connections.some(c => c.playerSlot === 0);
    const hasP1 = room.connections.some(c => c.playerSlot === 1);

    if (room.mode === 'ai') {
      // AI mode: only slot 0 available for human
      if (hasP0) {
        send(ws, { type: 'ERROR', message: 'Room is full' });
        return;
      }
      playerSlot = 0;
    } else {
      // PvP: assign first available slot
      if (!hasP0) playerSlot = 0;
      else if (!hasP1) playerSlot = 1;
      else {
        send(ws, { type: 'ERROR', message: 'Room is full' });
        return;
      }
    }
  }

  const conn: Connection = { ws, role, playerSlot };
  room.connections.push(conn);
  room.lastActivity = Date.now();

  send(ws, { type: 'JOINED', playerSlot, mode: room.mode });
  console.log(`[Room ${code}] ${role} joined${playerSlot !== null ? ` as player ${playerSlot}` : ''}`);

  // Notify others about new player
  if (playerSlot !== null) {
    for (const other of room.connections) {
      if (other.ws !== ws) {
        send(other.ws, { type: 'PLAYER_JOINED', playerSlot });
      }
    }
  }

  // Try to start the game
  tryStartGame(room);

  // If game already started (reconnection), send current state
  if (room.state) {
    const publicState = extractPublicState(room.state);
    if (playerSlot !== null) {
      const privateState = extractPrivateState(room.state, playerSlot);
      send(ws, { type: 'GAME_STATE', public: publicState, private: privateState, audioEvent: null, aiMessage: null });
    } else {
      send(ws, { type: 'GAME_STATE', public: publicState, private: null, audioEvent: null, aiMessage: null });
    }
  }
}

function handleGameAction(ws: WebSocket, action: GameAction): void {
  const room = findRoom(ws);
  if (!room || !room.state) {
    send(ws, { type: 'ERROR', message: 'Not in an active game' });
    return;
  }

  const conn = findConnection(room, ws);
  if (!conn || conn.playerSlot === null) {
    send(ws, { type: 'ERROR', message: 'Only players can send actions' });
    return;
  }

  // Verify it's this player's turn to act
  if (!isWaitingForPlayer(room.state, conn.playerSlot)) {
    send(ws, { type: 'ERROR', message: 'Not your turn' });
    return;
  }

  try {
    room.state = processAction(room.state, action);
    room.lastActivity = Date.now();

    const audioEvent = detectAudioEvent(action);
    broadcastState(room, audioEvent, null);

    // Check game over
    if (room.state.phase === 'GAME_OVER') {
      broadcastGameOver(room);
      return;
    }

    // After human action, check if AI needs to go
    if (room.mode === 'ai') {
      scheduleAiTurn(room);
    }
  } catch (e) {
    send(ws, { type: 'ERROR', message: (e as Error).message });
  }
}

// --- Connection Handling ---

function handleDisconnect(ws: WebSocket): void {
  const room = findRoom(ws);
  if (!room) return;

  const conn = findConnection(room, ws);
  if (!conn) return;

  room.connections = room.connections.filter(c => c.ws !== ws);

  if (conn.playerSlot !== null) {
    console.log(`[Room ${room.code}] Player ${conn.playerSlot} disconnected`);
    for (const other of room.connections) {
      send(other.ws, { type: 'PLAYER_DISCONNECTED', playerSlot: conn.playerSlot });
    }
  }

  // Clean up empty rooms
  if (room.connections.length === 0) {
    rooms.delete(room.code);
    console.log(`[Room ${room.code}] Deleted (empty)`);
  }
}

// --- Room Cleanup (1 hour inactivity) ---

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > 60 * 60 * 1000) {
      for (const conn of room.connections) {
        send(conn.ws, { type: 'ERROR', message: 'Room expired due to inactivity' });
        conn.ws.close();
      }
      rooms.delete(code);
      console.log(`[Room ${code}] Expired (1h inactivity)`);
    }
  }
}, 60 * 1000);

// --- Start Server ---

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString()) as ClientMessage;
      switch (msg.type) {
        case 'CREATE_ROOM':
          handleCreateRoom(ws, msg.mode);
          break;
        case 'JOIN_ROOM':
          handleJoinRoom(ws, msg.code, msg.role);
          break;
        case 'GAME_ACTION':
          handleGameAction(ws, msg.action);
          break;
      }
    } catch (e) {
      send(ws, { type: 'ERROR', message: 'Invalid message' });
      console.error('[WS] Parse error:', (e as Error).message);
    }
  });

  ws.on('close', () => handleDisconnect(ws));
});

console.log(`Jambo Cast Server running on ws://localhost:${PORT}`);
