
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Song, Verse } from '../types';
import { songService } from '../services/songService';
import { COMMON_CHORDS, VERSE_MARKERS } from '../constants';

interface SongEditorModalProps {
  isOpen: boolean;
  song: Song | null;
  onClose: () => void;
  onSave: (song: Song) => void;
  existingFilenames: string[];
}

interface HistoryEntry {
  content: string;
  cursorPosition: number;
}

const SongEditorModal: React.FC<SongEditorModalProps> = ({ isOpen, song, onClose, onSave, existingFilenames }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [filenameError, setFilenameError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isCopyChordsModalOpen, setCopyChordsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(song?.title || '');
      setAuthor(song?.author || '');
      setFilename(song?.id || '');
      setContent(song?.content || '');
      setHistory([{ content: song?.content || '', cursorPosition: 0 }]);
      setHistoryIndex(0);
    } else {
      setFilenameError(null);
    }
  }, [isOpen, song]);

  const updateContent = useCallback((newContent: string, newCursorPosition?: number) => {
    setContent(newContent);
    const cursor = newCursorPosition ?? textareaRef.current?.selectionStart ?? 0;
    
    // Push to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ content: newContent, cursorPosition: cursor });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setContent(history[newIndex].content);
      setHistoryIndex(newIndex);
      setTimeout(() => {
         textareaRef.current?.setSelectionRange(history[newIndex].cursorPosition, history[newIndex].cursorPosition);
      }, 0);
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setContent(history[newIndex].content);
      setHistoryIndex(newIndex);
      setTimeout(() => {
         textareaRef.current?.setSelectionRange(history[newIndex].cursorPosition, history[newIndex].cursorPosition);
      }, 0);
    }
  };


  const handleSave = () => {
    let error = null;
    if (!filename.endsWith('.xml')) {
      error = 'A fájlnévnek .xml-re kell végződnie.';
    } else if (existingFilenames.includes(filename) && (!song || song.id !== filename)) {
      error = 'Ez a fájlnév már létezik.';
    }
    
    setFilenameError(error);

    if (!error && title && filename) {
      onSave({
        id: filename,
        title,
        author,
        content
      });
      onClose();
    }
  };
  
  const handleTranspose = (amount: number) => {
    const newContent = songService.transpose(content, amount);
    updateContent(newContent);
  };

  const handleNormalize = () => {
    const newContent = songService.normalizeBH(content);
    updateContent(newContent);
  };
  
  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    
    updateContent(newContent, start + text.length);
    setTimeout(() => textarea.focus(), 0);
  };
  
  if (!isOpen) return null;

  const verses = songService.parseToVerses(content);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40" onClick={onClose}>
        <div className="bg-slate-50 rounded-lg shadow-2xl p-6 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <h3 className="text-2xl font-bold mb-4">{song ? 'Ének szerkesztése' : 'Új ének hozzáadása'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Ének címe</label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">Szerző (opcionális)</label>
              <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div>
              <label htmlFor="filename" className="block text-sm font-medium text-gray-700">Fájlnév</label>
              <input type="text" id="filename" value={filename} onChange={e => setFilename(e.target.value)} required className={`mt-1 block w-full px-3 py-2 border ${filenameError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500`}/>
              {filenameError && <p className="text-red-500 text-xs mt-1">{filenameError}</p>}
            </div>
          </div>
          
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex flex-wrap gap-2 items-center p-2 bg-slate-200 rounded-t-md border-b border-slate-300">
                <button onClick={undo} disabled={historyIndex <= 0} className="px-2 py-1 text-xs bg-white rounded border border-slate-300 disabled:opacity-50">Visszavonás</button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-2 py-1 text-xs bg-white rounded border border-slate-300 disabled:opacity-50">Mégis</button>
                <div className="h-4 w-px bg-slate-300"></div>
                <button onClick={() => handleTranspose(-2)} className="px-2 py-1 text-xs bg-white rounded border border-slate-300">-2</button>
                <button onClick={() => handleTranspose(-1)} className="px-2 py-1 text-xs bg-white rounded border border-slate-300">-1</button>
                <button onClick={() => handleTranspose(1)} className="px-2 py-1 text-xs bg-white rounded border border-slate-300">+1</button>
                <button onClick={() => handleTranspose(2)} className="px-2 py-1 text-xs bg-white rounded border border-slate-300">+2</button>
                <button onClick={handleNormalize} className="px-2 py-1 text-xs bg-white rounded border border-slate-300">B-&gt;H</button>
                <div className="h-4 w-px bg-slate-300"></div>
                <button onClick={() => setCopyChordsModalOpen(true)} className="px-2 py-1 text-xs bg-white rounded border border-slate-300">Akkordok másolása</button>
            </div>
            <div className="flex flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-300">
                {COMMON_CHORDS.map(c => <button key={c} onClick={() => insertText(c + ' ')} className="font-mono text-xs px-2 py-0.5 bg-white rounded border border-slate-300">{c}</button>)}
            </div>
             <div className="flex flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-300">
                {VERSE_MARKERS.map(v => <button key={v} onClick={() => insertText(`\\n${v}\\n`)} className="font-mono text-xs px-2 py-0.5 bg-white rounded border border-slate-300">{v}</button>)}
            </div>
            
            <textarea 
              ref={textareaRef}
              value={content} 
              onChange={e => updateContent(e.target.value, e.target.selectionStart)}
              placeholder="Ének szövege...&#10;Akkord sorokat '.'-tal kezdj.&#10;Vesszakokat '[V1]' jelölj."
              className="w-full h-full p-2 border border-gray-300 rounded-b-md shadow-inner focus:outline-none focus:ring-sky-500 focus:border-sky-500 font-mono text-sm resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Mégse</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Mentés</button>
          </div>
        </div>
      </div>
      {isCopyChordsModalOpen && (
          <CopyChordsModal
            verses={verses}
            onClose={() => setCopyChordsModalOpen(false)}
            onApply={(sourceIndex, targetIndices) => {
              const newContent = songService.copyChords(content, sourceIndex, targetIndices);
              updateContent(newContent);
            }}
          />
        )}
    </>
  );
};

interface CopyChordsModalProps {
    verses: Verse[];
    onClose: () => void;
    onApply: (sourceVerseIndex: number, targetVerseIndices: number[]) => void;
}

const CopyChordsModal: React.FC<CopyChordsModalProps> = ({ verses, onClose, onApply }) => {
    const [sourceIndex, setSourceIndex] = useState<number | null>(null);
    const [targetIndices, setTargetIndices] = useState<number[]>([]);

    const handleApply = () => {
        if (sourceIndex !== null && targetIndices.length > 0) {
            onApply(sourceIndex, targetIndices);
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold">Akkordok másolása versszakok között</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2">Forrás (honnan másolsz?)</h4>
                        <div className="max-h-60 overflow-y-auto border p-2 rounded">
                            {verses.map((v, i) => (
                                <div key={i}>
                                    <input type="radio" name="source" id={`src-${i}`} checked={sourceIndex === i} onChange={() => setSourceIndex(i)} />
                                    <label htmlFor={`src-${i}`} className="ml-2">{v.marker}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Cél(ok) (hova illeszted be?)</h4>
                        <div className="max-h-60 overflow-y-auto border p-2 rounded">
                             {verses.map((v, i) => (
                                <div key={i}>
                                    <input type="checkbox" id={`tgt-${i}`} checked={targetIndices.includes(i)} onChange={(e) => {
                                        if (e.target.checked) {
                                            setTargetIndices([...targetIndices, i]);
                                        } else {
                                            setTargetIndices(targetIndices.filter(ti => ti !== i));
                                        }
                                    }}/>
                                    <label htmlFor={`tgt-${i}`} className="ml-2">{v.marker}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Mégse</button>
                    <button onClick={handleApply} disabled={sourceIndex === null || targetIndices.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-300">Alkalmaz</button>
                </div>
            </div>
        </div>
    );
}

export default SongEditorModal;
