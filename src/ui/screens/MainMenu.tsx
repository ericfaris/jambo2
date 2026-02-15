import './MainMenu.css';

interface MainMenuProps {
  onSelectOption: (option: 'login' | 'solo' | 'multiplayer' | 'settings') => void;
}

export function MainMenu({ onSelectOption }: MainMenuProps) {

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className="image-container">
        <img
          src="/assets/menu/main_menu.png"
          alt="Jambo Main Menu"
        />
        <div className="overlay-text">
          <button onClick={() => onSelectOption('login')}>Login</button>
          <button onClick={() => onSelectOption('solo')}>Solo</button>
          <button onClick={() => onSelectOption('multiplayer')}>Multiplayer</button>
          <button onClick={() => onSelectOption('settings')}>Settings</button>
        </div>
      </div>
    </div>
  );
}