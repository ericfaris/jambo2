// ============================================================================
// Background Music Player Hook
// Plays looping background music for the main menu.
// ============================================================================

import { useEffect, useRef } from 'react';

const BACKGROUND_MUSIC = [
  '/audio/River Paths, Village Hearts Voice.mp3'
];

export function useBackgroundMusic(): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackIndex = useRef(0);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

    // Set up looping and volume
    audio.loop = true;
    audio.volume = 0.15; // Set to 15% volume for background music

    // Function to play next track
    const playNextTrack = () => {
      if (currentTrackIndex.current >= BACKGROUND_MUSIC.length) {
        currentTrackIndex.current = 0; // Loop back to first track
      }

      audio.src = BACKGROUND_MUSIC[currentTrackIndex.current];
      audio.play().catch(() => {
        // Silently fail if audio files don't exist
      });

      currentTrackIndex.current++;
    };

    // Start playing the first track
    playNextTrack();

    // Set up event listener for when a track ends to play the next one
    const handleEnded = () => {
      playNextTrack();
    };

    audio.addEventListener('ended', handleEnded);

    // Cleanup function
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, []);
}