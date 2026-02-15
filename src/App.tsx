import { Router } from './ui/Router.tsx';
import { useBackgroundMusic } from './ui/useBackgroundMusic.ts';

function App() {
  // Start background music when the app loads
  useBackgroundMusic();

  return <Router />;
}

export default App;
