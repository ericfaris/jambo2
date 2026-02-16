// ============================================================================
// Background Music Player Hook
// Plays looping background music for the main menu.
// ============================================================================

import { useEffect, useRef } from 'react';

const BACKGROUND_MUSIC = [
  '/audio/African Village Afternoon Soundscape.mp3',
  '/audio/Market Morning Mosaic.mp3',
  '/audio/River Paths, Village Hearts Voice.mp3',
  '/audio/Sun In Our Hands.mp3',
  '/audio/Sun on the Courtyard.mp3'
];

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
    audio.volume = 0.15;

    // Function to play next track
    const playNextTrack = () => {
      if (playlistRef.current.length === 0) return;
      if (currentTrackIndex.current >= playlistRef.current.length) {
        currentTrackIndex.current = 0; // Loop back to first track
      }
      audio.src = playlistRef.current[currentTrackIndex.current];
      audio.play().catch(() => {});
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