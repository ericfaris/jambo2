import { useEffect } from 'react';
import { Router } from './ui/Router.tsx';
import { useBackgroundMusic } from './ui/useBackgroundMusic.ts';
import { getCoreImageManifest, preloadImages } from './ui/imageCache.ts';

function App() {
  // Start background music when the app loads
  useBackgroundMusic();

  useEffect(() => {
    const warmupTimer = window.setTimeout(() => {
      void preloadImages(getCoreImageManifest());
    }, 50);

    return () => window.clearTimeout(warmupTimer);
  }, []);

  return <Router />;
}

export default App;
