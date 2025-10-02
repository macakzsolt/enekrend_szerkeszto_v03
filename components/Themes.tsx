import React from 'react';
import { Theme } from '../types';

interface ThemesProps {
  themes: Theme[];
  onAddTheme: (theme: Theme) => void;
}

const Themes: React.FC<ThemesProps> = ({ themes, onAddTheme }) => {
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, theme: Theme) => {
    e.dataTransfer.setData('application/theme+json', JSON.stringify(theme));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4 text-slate-700">Témák, elválasztók</h2>
      <ul className="overflow-y-auto flex-grow pr-2">
        {themes.map(theme => (
          <li
            key={theme.id}
            draggable
            onDragStart={(e) => handleDragStart(e, theme)}
            onDoubleClick={() => onAddTheme(theme)}
            className="p-2 rounded-md hover:bg-amber-100 cursor-grab group"
          >
            <span className="truncate group-hover:text-amber-800">{theme.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Themes;