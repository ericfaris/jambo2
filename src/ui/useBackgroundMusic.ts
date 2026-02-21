// ============================================================================
// Background Music Player Hook
// Plays looping background music. Handles Chromecast autoplay.
// ============================================================================

import { useEffect, useRef } from 'react';
import { getEffectiveVolume } from './audioSettings.ts';

const BACKGROUND_MUSIC = [
  '/audio/African Village Afternoon Soundscape.mp3',
  '/audio/Market Morning Mosaic.mp3',
  '/audio/River Paths, Village Hearts Voice.mp3',
  '/audio/Sun In Our Hands.mp3',
  '/audio/Sun on the Courtyard.mp3'
];

const MUSIC_BASE_VOLUME = 0.15;
const AUTOPLAY_RETRY_MS = 3000;
const MAX_RETRIES = 10;

export function useBackgroundMusic(): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<string[]>([]);
  const currentTrackIndex = useRef(0);

  useEffect(() => {
    // Shuffle playlist on app load
    const shuffled = [...BACKGROUND_MUSIC];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playlistRef.current = shuffled;
    currentTrackIndex.current = 0;

    // Use a DOM-attached audio element (required for Chromecast)
    const audio = document.createElement('audio');
    audio.style.display = 'none';
    document.body.appendChild(audio);
    audioRef.current = audio;
    audio.loop = false;
    audio.volume = getEffectiveVolume() * MUSIC_BASE_VOLUME;

    let retryTimer: number | null = null;
    let retryCount = 0;
    let started = false;
    let cleaned = false;

    const attemptPlay = () => {
      if (cleaned) return;
      audio.play().then(() => {
        console.log(`[Music] Playing: ${audio.src}`);
        started = true;
        retryCount = 0;
      }).catch((err: unknown) => {
        console.warn(`[Music] Play blocked:`, (err as Error).message ?? err);
        if (!started && retryCount < MAX_RETRIES && !cleaned) {
          retryCount++;
          console.log(`[Music] Retry ${retryCount}/${MAX_RETRIES} in ${AUTOPLAY_RETRY_MS}ms`);
          retryTimer = window.setTimeout(attemptPlay, AUTOPLAY_RETRY_MS);
        }
      });
    };

    const playNextTrack = () => {
      if (cleaned) return;
      if (playlistRef.current.length === 0) return;
      if (currentTrackIndex.current >= playlistRef.current.length) {
        currentTrackIndex.current = 0;
      }
      const trackUrl = playlistRef.current[currentTrackIndex.current];
      console.log(`[Music] Loading: ${trackUrl}`);
      audio.src = trackUrl;
      currentTrackIndex.current++;
      attemptPlay();
    };

    // Start first track
    playNextTrack();

    // Resume on user interaction (helps with autoplay policies)
    const resumeOnInteraction = () => {
      if (started || cleaned) return;
      console.log('[Music] User interaction — attempting play');
      attemptPlay();
    };
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeOnInteraction, { once: true });

    const handleEnded = () => playNextTrack();
    audio.addEventListener('ended', handleEnded);

    const handleError = () => {
      const e = audio.error;
      console.error(`[Music] Audio error: code=${e?.code} message=${e?.message}`);
    };
    audio.addEventListener('error', handleError);

    const handleVolumeChange = () => {
      audio.volume = getEffectiveVolume() * MUSIC_BASE_VOLUME;
    };
    window.addEventListener('jambo-volume-change', handleVolumeChange);

    return () => {
      cleaned = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('jambo-volume-change', handleVolumeChange);
      document.removeEventListener('click', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);
      audio.pause();
      audio.src = '';
      audio.remove();
    };
  }, []);
}
