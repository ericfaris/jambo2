// ============================================================================
// Background Music Player Hook
// Plays looping background music. Retries on autoplay rejection.
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

    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;
    audio.loop = false; // We'll handle looping manually
    audio.volume = getEffectiveVolume() * MUSIC_BASE_VOLUME;

    let retryTimer: number | null = null;
    let retryCount = 0;
    let started = false;

    // Function to play next track
    const playNextTrack = () => {
      if (playlistRef.current.length === 0) return;
      if (currentTrackIndex.current >= playlistRef.current.length) {
        currentTrackIndex.current = 0; // Loop back to first track
      }
      const trackUrl = playlistRef.current[currentTrackIndex.current];
      audio.src = trackUrl;
      console.log(`[Music] Loading track: ${trackUrl}`);
      audio.play().then(() => {
        console.log(`[Music] Playing: ${trackUrl}`);
        started = true;
        retryCount = 0;
      }).catch((err: unknown) => {
        console.warn(`[Music] Play failed:`, (err as Error).message ?? err);
        // Retry if autoplay was blocked
        if (!started && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`[Music] Will retry in ${AUTOPLAY_RETRY_MS}ms (attempt ${retryCount}/${MAX_RETRIES})`);
          retryTimer = window.setTimeout(() => {
            audio.play().then(() => {
              console.log(`[Music] Retry succeeded`);
              started = true;
              retryCount = 0;
            }).catch(() => {
              // Still blocked — try again
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                retryTimer = window.setTimeout(() => {
                  playNextTrack();
                }, AUTOPLAY_RETRY_MS);
              }
            });
          }, AUTOPLAY_RETRY_MS);
        }
      });
      currentTrackIndex.current++;
    };

    // Start playing the first track
    playNextTrack();

    // Also try to start on any user interaction (helps with autoplay policies)
    const resumeOnInteraction = () => {
      if (started) return;
      console.log('[Music] User interaction detected, attempting play');
      audio.play().then(() => {
        console.log('[Music] Started after user interaction');
        started = true;
      }).catch(() => {});
    };
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeOnInteraction, { once: true });

    // Set up event listener for when a track ends to play the next one
    const handleEnded = () => {
      playNextTrack();
    };
    audio.addEventListener('ended', handleEnded);

    // Log errors on the audio element itself
    const handleError = () => {
      const e = audio.error;
      console.error(`[Music] Audio element error: code=${e?.code} message=${e?.message}`);
    };
    audio.addEventListener('error', handleError);

    // Listen for volume changes from the settings UI
    const handleVolumeChange = () => {
      audio.volume = getEffectiveVolume() * MUSIC_BASE_VOLUME;
    };
    window.addEventListener('jambo-volume-change', handleVolumeChange);

    // Cleanup function
    return () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('jambo-volume-change', handleVolumeChange);
      document.removeEventListener('click', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);
      audio.pause();
      audio.src = '';
    };
  }, []);
}
