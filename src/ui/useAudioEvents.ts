// ============================================================================
// Cast Mode — Audio Event Player
// Plays sound effects based on AudioEvent from server messages.
// Silently fails if audio files don't exist.
// ============================================================================

import { useEffect, useRef } from 'react';
import type { AudioEvent } from '../multiplayer/types.ts';
import { getEffectiveVolume } from './audioSettings.ts';

const AUDIO_FILES: Record<AudioEvent, string> = {
  'coin': '/audio/sfx/coin.mp3',
  'card-play': '/audio/sfx/card-play.mp3',
  'card-draw': '/audio/sfx/card-draw.mp3',
  'turn-end': '/audio/sfx/turn-end.mp3',
  'attack': '/audio/sfx/attack.mp3',
  'guard': '/audio/sfx/guard.mp3',
};

const SFX_BASE_VOLUME = 0.5;

export function useAudioEvents(audioEvent: AudioEvent | null, clearAudioEvent: () => void): void {
  const lastPlayed = useRef<string | null>(null);

  useEffect(() => {
    if (!audioEvent) return;

    // Avoid replaying the same event
    const key = `${audioEvent}-${Date.now()}`;
    if (lastPlayed.current === key) return;
    lastPlayed.current = key;

    const file = AUDIO_FILES[audioEvent];
    if (file) {
      const audio = new Audio(file);
      audio.volume = getEffectiveVolume() * SFX_BASE_VOLUME;
      audio.play().catch(() => {
        // Silently fail — audio files may not exist yet
      });
    }

    clearAudioEvent();
  }, [audioEvent, clearAudioEvent]);
}
