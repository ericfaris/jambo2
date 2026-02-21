import { useEffect, useState } from 'react';
import { Router } from './ui/Router.tsx';
import { useBackgroundMusic } from './ui/useBackgroundMusic.ts';
import { getCoreImageManifest, preloadImages } from './ui/imageCache.ts';
import { getCastSessionController, isCastSdkEnabled } from './cast/factory.ts';

function App() {
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    if (!isCastSdkEnabled()) {
      setIsCasting(false);
      return;
    }

    const controller = getCastSessionController();
    setIsCasting(controller.getSession() !== null);
    return controller.onSessionChanged((session) => {
      setIsCasting(session !== null);
    });
  }, []);

  // Sender should be silent while Chromecast session is active.
  useBackgroundMusic(!isCasting);

  useEffect(() => {
    const warmupTimer = window.setTimeout(() => {
      void preloadImages(getCoreImageManifest());
    }, 50);

    return () => window.clearTimeout(warmupTimer);
  }, []);

  return <Router />;
}

export default App;
