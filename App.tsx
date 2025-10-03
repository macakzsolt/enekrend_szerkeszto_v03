import React, { useState, useEffect, useCallback, useRef } from 'react';
import AvailableSongs from './components/AvailableSongs';
import SongOrder from './components/SongOrder';
import Themes from './components/Themes';
import SongEditorModal from './components/SongEditorModal';
import PrintModal from './components/PrintModal';
import ConfirmationModal from './components/ConfirmationModal';
import ExportDocxModal from './components/ExportDocxModal';
import Toast from './components/Toast';
import { Song, Theme, SongOrderItem } from './types';
import { THEMES, DEFAULT_SONGS, BOOKS } from './constants';
import { storageService } from './services/storageService';

type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
};

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [order, setOrder] = useState<SongOrderItem[]>([]);
  const [isSongEditorOpen, setSongEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isClearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadedSongs = storageService.loadSongs();
    if (loadedSongs) {
      setSongs(loadedSongs);
    } else {
      setSongs(DEFAULT_SONGS);
    }

    const loadedOrder = storageService.loadOrder();
    if (loadedOrder) {
      setOrder(loadedOrder);
    }
  }, []);

  useEffect(() => {
    storageService.saveSongs(songs);
  }, [songs]);

  useEffect(() => {
    storageService.saveOrder(order);
  }, [order]);
  
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration: number = 5000) => {
    if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
    }
    setToast({ id: Date.now(), message, type });
    toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
    }, duration);
  }, []);

  const handleAddSongToOrder = useCallback((song: Song) => {
    const newOrderItem: SongOrderItem = { ...song, instanceId: `song_${song.id}_${Date.now()}` };
    setOrder(prev => [...prev, newOrderItem]);
  }, []);

  const handleAddThemeToOrder = useCallback((theme: Theme) => {
    const newOrderItem: SongOrderItem = { ...theme, instanceId: `theme_${theme.id}_${Date.now()}` };
    setOrder(prev => [...prev, newOrderItem]);
  }, []);

  const handleRemoveItemFromOrder = useCallback((instanceId: string) => {
    setOrder(prev => prev.filter(item => item.instanceId !== instanceId));
  }, []);
  
  const handleShowNewSongModal = () => {
    setEditingSong(null);
    setSongEditorOpen(true);
  };
  
  const handleShowEditSongModal = (song: Song) => {
    setEditingSong(song);
    setSongEditorOpen(true);
  };

  const handleSaveSong = (songToSave: Song) => {
    setSongs(prevSongs => {
      const existingIndex = prevSongs.findIndex(s => s.id === songToSave.id);
      if (existingIndex > -1) {
        const newSongs = [...prevSongs];
        newSongs[existingIndex] = songToSave;
        return newSongs;
      } else {
        return [...prevSongs, songToSave];
      }
    });
    // also update in order if it exists
    setOrder(prevOrder => prevOrder.map(item => {
      if ('content' in item && item.id === songToSave.id) {
        return { ...item, ...songToSave };
      }
      return item;
    }));
  };

  const handleDeleteSongRequest = (song: Song) => {
    setSongToDelete(song);
  };

  const handleConfirmDelete = () => {
    if (!songToDelete) return;
    
    // Remove from songs list
    setSongs(prevSongs => prevSongs.filter(s => s.id !== songToDelete.id));
    
    // Remove from order list
    setOrder(prevOrder => prevOrder.filter(item => item.id !== songToDelete.id));

    setSongToDelete(null); // Close modal
  };

  const handleCancelDelete = () => {
    setSongToDelete(null);
  };
  
  const handleClearOrder = () => {
    setOrder([]);
    setClearConfirmOpen(false);
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTxt = () => {
    const content = order.map((item, index) => {
      let line = `${index + 1}. ${item.title}`;
      if ('content' in item && item.references && item.references.length > 0) {
        line += ` (${item.references.join(', ')})`;
      }
      return line;
    }).join('\n');
    
    downloadFile(content, 'enekrend.txt', 'text/plain;charset=utf-8');
  };

  const handleExportJson = () => {
    const content = JSON.stringify({ order, songs: songs.filter(s => order.some(o => o.id === s.id)) }, null, 2);
    downloadFile(content, 'enekrend.json', 'application/json');
  };
  
  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = event.target;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result as string;
            if (!result) throw new Error("File could not be read.");
            
            const data = JSON.parse(result);
            if (data.order && Array.isArray(data.order)) {
                setOrder(data.order);
            }
            if (data.songs && Array.isArray(data.songs)) {
                setSongs(prevSongs => {
                    const songMap = new Map(prevSongs.map(s => [s.id, s]));
                    data.songs.forEach((newSong: Song) => {
                        // Basic validation
                        if (newSong.id && typeof newSong.title === 'string' && typeof newSong.content === 'string') {
                            songMap.set(newSong.id, newSong);
                        }
                    });
                    return Array.from(songMap.values());
                });
            }
            showToast('JSON adatok sikeresen importálva.', 'success');
        } catch (error) {
            console.error("Failed to parse JSON:", error);
            showToast('Hiba a JSON fájl beolvasása közben. Ellenőrizd a fájl formátumát.', 'error');
        } finally {
            if (target) target.value = '';
        }
    };
    reader.onerror = () => {
        showToast('Hiba a fájl olvasása közben.', 'error');
        if (target) target.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportXml = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const target = event.target;
    if (!files || files.length === 0) return;

    const readFileAsText = (file: File): Promise<{ file: File; content: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ file, content: reader.result as string });
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    try {
        const fileContents = await Promise.all(Array.from(files).map(readFileAsText));
        
        const existingIds = new Set(songs.map(s => s.id));
        const newSongs: Song[] = [];
        const skippedFiles: string[] = [];
        let failedCount = 0;

        const bookNameToPrefix: { [key: string]: string } = {};
        Object.entries(BOOKS).forEach(([prefix, name]) => {
          bookNameToPrefix[name] = prefix;
        });
        
        const bookPrefixes = Object.keys(BOOKS).join('|');
        const referenceRegex = new RegExp(`(${bookPrefixes})\\d+`, 'gi');

        fileContents.forEach(({ file, content }) => {
            if (existingIds.has(file.name)) {
                skippedFiles.push(file.name);
                return;
            }

            let cleanContent = content;
            if (cleanContent.charCodeAt(0) === 0xFEFF) {
                cleanContent = cleanContent.substring(1);
            }
            cleanContent = cleanContent.trim();

            if (cleanContent === '') {
                console.warn(`Skipping empty or whitespace-only file: ${file.name}`);
                failedCount++;
                return;
            }

            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(cleanContent, "application/xml");
                
                const parserError = xmlDoc.querySelector("parsererror");
                if (parserError) {
                    console.error(`Error parsing XML file ${file.name}:`, parserError.textContent);
                    failedCount++;
                    return;
                }
                
                const querySelectorText = (selectors: string[]): string | null => {
                    for (const selector of selectors) {
                        const node = xmlDoc.querySelector(selector);
                        if (node && node.textContent) return node.textContent.trim();
                    }
                    return null;
                };

                const title = querySelectorText(["properties > titles > title", "title"]) || file.name.replace(/\.xml$/i, '').replace(/_/g, ' ');
                const author = querySelectorText(["properties > authors > author", "author"]) || '';
                const lyrics = querySelectorText(["lyrics"]);

                if (!lyrics) {
                    console.warn(`Could not extract <lyrics> from ${file.name}`);
                    failedCount++;
                    return;
                }
                
                const referencesFromXml: string[] = [];
                const songbookNodes = xmlDoc.querySelectorAll("properties > songbooks > songbook");
                songbookNodes.forEach(node => {
                    const name = node.getAttribute('name');
                    const entry = node.getAttribute('entry');
                    if (name && entry) {
                        const prefix = bookNameToPrefix[name];
                        if (prefix) {
                            referencesFromXml.push(`${prefix}${entry}`);
                        }
                    }
                });

                const referencesFromFile = file.name.match(referenceRegex) || [];
                
                const allReferences = Array.from(new Set([...referencesFromXml, ...referencesFromFile.map(ref => ref.toUpperCase())]));


                newSongs.push({
                    id: file.name,
                    title,
                    author,
                    content: lyrics,
                    references: allReferences,
                });
            } catch (e) {
                console.error(`Failed to process XML file ${file.name}`, e);
                failedCount++;
            }
        });

        if (newSongs.length > 0) {
            setSongs(prev => [...prev, ...newSongs]);
        }
        
        const summaryMessages: string[] = [];
        if (newSongs.length > 0) {
            summaryMessages.push(`${newSongs.length} ének sikeresen importálva.`);
        }
        if (skippedFiles.length > 0) {
            summaryMessages.push(`${skippedFiles.length} ének kihagyva (már létezett):\n- ${skippedFiles.join('\n- ')}`);
        }
        if (failedCount > 0) {
            summaryMessages.push(`${failedCount} ének importálása sikertelen (hibás formátum).`);
        }
        
        if (summaryMessages.length > 0) {
            const message = summaryMessages.join('\n\n');
            const type: ToastMessage['type'] = failedCount > 0 && newSongs.length === 0 ? 'error' : (skippedFiles.length > 0 ? 'info' : 'success');
            showToast(message, type, 10000);
        } else if (files.length > 0) {
            showToast('A kiválasztott fájlok nem tartalmaztak importálható énekeket, vagy már léteztek.', 'info');
        }

    } catch (error) {
        console.error("Error reading XML files:", error);
        showToast("Hiba történt egy vagy több fájl beolvasása közben.", 'error');
    } finally {
        if (target) target.value = '';
    }
  };

  return (
    <div className="h-full w-full p-4 flex flex-col font-sans">
      <header className="mb-4 flex justify-between items-center flex-shrink-0">
        <h1 className="text-3xl font-bold text-slate-800">Énekrend Szerkesztő</h1>
      </header>
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <AvailableSongs 
          songs={songs} 
          onAddSong={handleAddSongToOrder} 
          onShowNewSongModal={handleShowNewSongModal}
          onShowEditSongModal={handleShowEditSongModal}
          onDeleteSong={handleDeleteSongRequest}
        />
        <SongOrder 
          order={order} 
          setOrder={setOrder} 
          onRemoveItem={handleRemoveItemFromOrder} 
          onAddSong={handleAddSongToOrder}
          onAddTheme={handleAddThemeToOrder}
        />
        <Themes themes={THEMES} onAddTheme={handleAddThemeToOrder} />
      </main>
      
      <footer className="mt-4 p-4 bg-white rounded-lg shadow-md flex flex-wrap items-center justify-center gap-4 flex-shrink-0">
        <button onClick={() => setClearConfirmOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Összes Törlése</button>
        <div className="h-6 w-px bg-slate-300"></div>
        <button onClick={handleExportTxt} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Sorrend megosztáshoz (txt)</button>
        <button onClick={() => setExportModalOpen(true)} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Exportálás (Szerkeszthető)</button>
        <button onClick={handleExportJson} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Exportálás (JSON)</button>
        <label className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 cursor-pointer">
          Importálás (JSON)
          <input type="file" accept=".json" onChange={handleImportJson} className="hidden"/>
        </label>
        <label className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 cursor-pointer">
          XML Fájlok Importálása
          <input type="file" accept=".xml" onChange={handleImportXml} multiple className="hidden"/>
        </label>
        <div className="h-6 w-px bg-slate-300"></div>
        <button onClick={() => setPrintModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Miserend Nyomtatáshoz</button>
      </footer>

      <SongEditorModal 
        isOpen={isSongEditorOpen} 
        song={editingSong}
        onClose={() => setSongEditorOpen(false)} 
        onSave={handleSaveSong}
        existingFilenames={songs.map(s => s.id)}
      />
      
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        order={order}
      />
      
      <ExportDocxModal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        order={order}
      />

      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        title="Sorrend törlése"
        message="Biztosan törölni szeretnéd a teljes ének sorrendet? Ez a művelet nem vonható vissza."
        onConfirm={handleClearOrder}
        onCancel={() => setClearConfirmOpen(false)}
      />

      <ConfirmationModal
        isOpen={!!songToDelete}
        title="Ének törlése"
        message={`Biztosan törölni szeretnéd a(z) "${songToDelete?.title}" című éneket? Ez a művelet eltávolítja az éneket a sorrendből is.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
