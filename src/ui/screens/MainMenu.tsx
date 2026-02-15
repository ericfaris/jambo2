import './MainMenu.css';
import type { AIDifficulty } from '../../ai/difficulties/index.ts';

interface MainMenuProps {
  onSelectOption: (option: 'login' | 'solo' | 'multiplayer' | 'settings', aiDifficulty: AIDifficulty) => void;
  aiDifficulty: AIDifficulty;
  onChangeAiDifficulty: (difficulty: AIDifficulty) => void;
}

export function MainMenu({ onSelectOption, aiDifficulty, onChangeAiDifficulty }: MainMenuProps) {

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className="image-container">
        <img
          src="/assets/menu/main_menu.png"
          alt="Jambo Main Menu"
        />
        <div className="overlay-text">
          <button onClick={() => onSelectOption('login', aiDifficulty)}>Login</button>
          <button onClick={() => onSelectOption('solo', aiDifficulty)}>Solo</button>
          <button onClick={() => onSelectOption('multiplayer', aiDifficulty)}>Multiplayer</button>
          <button onClick={() => onSelectOption('settings', aiDifficulty)}>Settings</button>
          <label style={{ marginTop: 8, color: '#f4e7c3', fontSize: 14 }}>
            AI Difficulty
            <select
              value={aiDifficulty}
              onChange={(event) => onChangeAiDifficulty(event.target.value as AIDifficulty)}
              style={{ marginLeft: 8 }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}