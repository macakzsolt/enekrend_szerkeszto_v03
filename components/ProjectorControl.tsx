
import React, { useState, useEffect } from 'react';
import { Song, Theme, SongOrderItem, Verse } from '../types';
import { songService } from '../services/songService';

interface ProjectorControlProps {
  order: SongOrderItem[];
  onSelectItem: (content: {html: string, text: string}) => void;
  onShowSettings: () => void;
  activeItemIndex: number | null;
  setActiveItemIndex: (index: number | null) => void;
}

const ProjectorControl: React.FC<ProjectorControlProps> = ({ order, onSelectItem, onShowSettings, activeItemIndex, setActiveItemIndex }) => {
  const [verses, setVerses] = useState<Verse[]>([]);
  
  const activeItem = activeItemIndex !== null ? order[activeItemIndex] : null;

  useEffect(() => {
    if (activeItem && 'content' in activeItem) {
      setVerses(songService.parseToVerses(activeItem.content));
    } else {
      setVerses([]);
    }
  }, [activeItem]);
  
  const handleProject = (htmlContent: string, textContent?: string) => {
    onSelectItem({ html: htmlContent, text: textContent || htmlContent });
  };
  
  const textToHtml = (text: string) => text.replace(/\n/g, '<br/>');

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">Vetítés Vezérlőpult</h2>
          <button
            onClick={onShowSettings}
            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 text-sm"
          >
            Beállítások
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
        <div className="flex flex-col">
          <h3 className="font-semibold mb-2 text-slate-600">Ének Sorrend</h3>
          <ul className="overflow-y-auto border rounded-md p-2 flex-grow">
            {order.map((item, index) => (
              <li key={item.instanceId}>
                <button
                  onClick={() => setActiveItemIndex(index)}
                  className={`w-full text-left p-2 rounded-md text-sm ${
                    activeItemIndex === index
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'hover:bg-sky-100'
                  }`}
                >
                  {index + 1}. {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-col">
           <h3 className="font-semibold mb-2 text-slate-600">Vezérlő</h3>
           <div className="overflow-y-auto border rounded-md p-2 flex-grow space-y-2">
              <button 
                onClick={() => handleProject('')}
                className="w-full p-2 rounded-md bg-black text-white hover:bg-slate-800 text-sm text-center"
              >
                Fekete Képernyő
              </button>

              {!activeItem && <p className="text-center text-slate-500 italic p-4">Válassz egy elemet a listából.</p>}
              
              {activeItem && (
                <>
                  <button 
                    onClick={() => handleProject(`<h1>${activeItem.title}</h1>`)}
                    className="w-full p-2 rounded-md bg-amber-200 hover:bg-amber-300 text-sm font-bold text-center"
                  >
                    Cím: {activeItem.title}
                  </button>

                  {'references' in activeItem && activeItem.references && activeItem.references.length > 0 && (
                     <button 
                        onClick={() => handleProject(`<h2>(${activeItem.references!.join(', ')})</h2>`)}
                        className="w-full p-2 rounded-md bg-amber-100 hover:bg-amber-200 text-xs italic text-center"
                     >
                       Ref: {activeItem.references.join(', ')}
                     </button>
                  )}
                  
                  {verses.map((verse, vIndex) => {
                    const verseText = songService.versesToContent([verse]);
                    return (
                        <button 
                            key={vIndex}
                            onClick={() => handleProject(textToHtml(verseText), verseText)}
                            className="w-full p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm text-left whitespace-pre-wrap"
                        >
                           <strong className="text-amber-700">{verse.marker}</strong>
                           <p className="truncate text-slate-600 text-xs">
                             {verse.lines.find(l => l.type === 'lyric')?.text || '...'}
                           </p>
                        </button>
                    );
                  })}
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectorControl;
