// ============================================================================
// Background Music Player Hook
// Plays looping background music. Guards against multiple instances.
// ============================================================================

import { useEffect, useRef } from 'react';
import { getEffectiveVolume } from './audioSettings.ts';

const BACKGROUND_MUSIC = [
  '/audio/African_Village_Afternoon_Soundscape.mp3',
  '/audio/Market_Morning_Mosaic.mp3',
  '/audio/River_Paths_Village_Hearts_Voice.mp3',
  '/audio/Sun_In_Our_Hands.mp3',
  '/audio/Sun_on_the_Courtyard.mp3',
];

const MUSIC_BASE_VOLUME = 0.15;
const AUTOPLAY_RETRY_MS = 3000;
const MAX_RETRIES = 10;

// Module-level singleton guard - only one music player at a time
let activeInstance: HTMLAudioElement | null = null;

function isCastReceiverContext(): boolean {
  try {
    return !!(window as { cast?: { framework?: { CastReceiverContext?: unknown } } }).cast?.framework?.CastReceiverContext;
  } catch {
    return false;
  }
}

export function useBackgroundMusic(): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<string[]>([]);
  const currentTrackIndex = useRef(0);

  useEffect(() => {
    const verbose = isCastReceiverContext();

    if (activeInstance !== null) {
      console.log('[Music] Already playing in another instance, skipping');
      return;
    }

    const shuffled = [...BACKGROUND_MUSIC];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playlistRef.current = shuffled;
    currentTrackIndex.current = 0;

    const audio = document.createElement('audio');
    audio.style.display = 'none';
    document.body.appendChild(audio);
    audioRef.current = audio;
    activeInstance = audio;
    audio.loop = false;
    audio.volume = getEffectiveVolume() * MUSIC_BASE_VOLUME;

    let retryTimer: number | null = null;
    let retryCount = 0;
    let started = false;
    let cleaned = false;

    const logAudioState = (prefix: string) => {
      if (!verbose) return;
      const errorCode = audio.error?.code ?? 'none';
      const errorMessage = audio.error?.message ?? 'none';
      console.log(
        `${prefix} src=${audio.currentSrc || '(none)'} paused=${audio.paused} readyState=${audio.readyState} networkState=${audio.networkState} muted=${audio.muted} volume=${audio.volume.toFixed(3)} error=${errorCode}:${errorMessage}`,
      );
    };

    const attemptPlay = () => {
      if (cleaned) return;

      logAudioState('[Music] attemptPlay before');

      audio.play().then(() => {
        console.log(`[Music] Playing: ${audio.src}`);
        started = true;
        retryCount = 0;
        logAudioState('[Music] attemptPlay success');
      }).catch((err: unknown) => {
        const errorName = err instanceof Error ? err.name : 'UnknownError';
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`[Music] Play blocked: ${errorName}: ${errorMessage}`);
        logAudioState('[Music] attemptPlay failure');

        if (!started && retryCount < MAX_RETRIES && !cleaned) {
          retryCount += 1;
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
      currentTrackIndex.current += 1;
      audio.src = trackUrl;
      console.log(`[Music] Loading: ${trackUrl}`);
      logAudioState('[Music] after src set');
      attemptPlay();
    };

    if (verbose) {
      console.log(`[Music] Cast receiver context detected. userAgent=${navigator.userAgent}`);
    }

    playNextTrack();

    const resumeOnInteraction = () => {
      if (started || cleaned) return;
      console.log('[Music] User interaction - attempting play');
      attemptPlay();
    };
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeOnInteraction, { once: true });

    const handleEnded = () => {
      console.log('[Music] Track ended; advancing playlist');
      playNextTrack();
    };
    audio.addEventListener('ended', handleEnded);

    const handleError = () => {
      const e = audio.error;
      console.error(`[Music] Audio error: code=${e?.code} message=${e?.message ?? 'unknown'}`);
      logAudioState('[Music] error event');
    };
    audio.addEventListener('error', handleError);

    const handleLoadStart = () => logAudioState('[Music] loadstart');
    const handleLoadedMetadata = () => logAudioState('[Music] loadedmetadata');
    const handleLoadedData = () => logAudioState('[Music] loadeddata');
    const handleCanPlay = () => logAudioState('[Music] canplay');
    const handleCanPlayThrough = () => logAudioState('[Music] canplaythrough');
    const handlePlaying = () => logAudioState('[Music] playing');
    const handleWaiting = () => logAudioState('[Music] waiting');
    const handleStalled = () => logAudioState('[Music] stalled');
    const handleSuspend = () => logAudioState('[Music] suspend');

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);

    const handleVolumeChange = () => {
      audio.volume = getEffectiveVolume() * MUSIC_BASE_VOLUME;
      logAudioState('[Music] volume updated');
    };
    window.addEventListener('jambo-volume-change', handleVolumeChange);

    return () => {
      cleaned = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }

      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);

      window.removeEventListener('jambo-volume-change', handleVolumeChange);
      document.removeEventListener('click', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);

      audio.pause();
      audio.src = '';
      audio.remove();

      if (activeInstance === audio) {
        activeInstance = null;
      }

      if (verbose) {
        console.log('[Music] Cleanup complete');
      }
    };
  }, []);
}
