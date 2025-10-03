
import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';

interface ThemesProps {
  themes: Theme[];
  setThemes: (themes: Theme[]) => void;
  onAddThemeToOrder: (theme: Theme) => void;
  onUpdateTheme: (theme: Theme) => void;
  onDeleteTheme: (theme: Theme) => void;
}

const Themes: React.FC<ThemesProps> = ({ themes, setThemes, onAddThemeToOrder, onUpdateTheme, onDeleteTheme }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newThemeTitle, setNewThemeTitle] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  useEffect(() => {
    if (editingThemeId) editInputRef.current?.focus();
  }, [editingThemeId]);

  const handleDragStartReorder = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-theme-reorder', String(index));
  };
  
  const handleDragStartToOrder = (e: React.DragEvent<HTMLDivElement>, theme: Theme) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/theme+json', JSON.stringify(theme));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !e.dataTransfer.types.includes('application/x-theme-reorder')) return;

    const newThemes = [...themes];
    const [draggedItem] = newThemes.splice(draggedIndex, 1);
    newThemes.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setThemes(newThemes);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const handleAddNewTheme = () => {
    if (newThemeTitle.trim()) {
      const newTheme: Theme = {
        id: `theme_custom_${Date.now()}`,
        title: newThemeTitle.trim(),
      };
      setThemes([...themes, newTheme]);
    }
    setNewThemeTitle('');
    setIsAdding(false);
  };
  
  const handleStartEditing = (theme: Theme) => {
    setEditingThemeId(theme.id);
    setEditingTitle(theme.title);
  };

  const handleSaveEditing = () => {
    if (editingThemeId && editingTitle.trim()) {
      onUpdateTheme({ id: editingThemeId, title: editingTitle.trim() });
    }
    setEditingThemeId(null);
    setEditingTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4 text-slate-700 flex-shrink-0">Témák, elválasztók</h2>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ul className="pr-2">
          {themes.map((theme, index) => (
            <li
              key={theme.id}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-1 rounded-md hover:bg-amber-100 group flex items-center justify-between transition-all ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {editingThemeId === theme.id ? (
                <div className="flex-grow flex items-center gap-2">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEditing();
                      if (e.key === 'Escape') {
                        setEditingThemeId(null);
                        setEditingTitle('');
                      }
                    }}
                    onBlur={handleSaveEditing}
                    className="w-full px-2 py-1 border border-sky-500 rounded-md text-sm"
                  />
                </div>
              ) : (
                <>
                  <div 
                    draggable 
                    onDragStart={(e) => handleDragStartReorder(e, index)} 
                    className="cursor-move p-1 text-slate-400 group-hover:text-slate-600"
                    aria-label="Téma átrendezése"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div 
                    className="flex-grow cursor-grab"
                    draggable
                    onDragStart={(e) => handleDragStartToOrder(e, theme)}
                    onDoubleClick={() => onAddThemeToOrder(theme)}
                  >
                    <span className="truncate group-hover:text-amber-800 ml-2 text-sm font-medium">{theme.title}</span>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleStartEditing(theme)} className="p-1 text-slate-500 hover:text-sky-700" aria-label={`Szerkesztés: ${theme.title}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => onDeleteTheme(theme)} className="p-1 text-slate-500 hover:text-red-700" aria-label={`Törlés: ${theme.title}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-shrink-0 pt-4 border-t border-slate-200">
        {isAdding ? (
           <div className="flex items-center gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={newThemeTitle}
              onChange={(e) => setNewThemeTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNewTheme();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="Új téma címe..."
              className="w-full px-2 py-1 border border-sky-500 rounded-md text-sm"
            />
            <button onClick={handleAddNewTheme} className="p-1 text-green-600 hover:text-green-800 flex-shrink-0" aria-label="Mentés">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={() => setIsAdding(false)} className="p-1 text-red-600 hover:text-red-800 flex-shrink-0" aria-label="Mégse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)} 
            className="w-full px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 disabled:opacity-50"
            disabled={isAdding || !!editingThemeId}
          >
            + Új téma
          </button>
        )}
      </div>
    </div>
  );
};

export default Themes;
