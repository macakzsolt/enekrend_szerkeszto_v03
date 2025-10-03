import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import AvailableSongs from './components/AvailableSongs';
import SongOrder from './components/SongOrder';
import Themes from './components/Themes';
import SongEditorModal from './components/SongEditorModal';
import PrintModal from './components/PrintModal';
import ConfirmationModal from './components/ConfirmationModal';
import ExportDocxModal from './components/ExportDocxModal';
import Toast from './components/Toast';
import ProjectorControl from './components/ProjectorControl';
import ProjectorSettingsModal from './components/ProjectorSettingsModal';
import ProjectorView from './projector';
import { Song, Theme, SongOrderItem, ProjectorSettings, BroadcastMessage } from './types';
import { DEFAULT_THEMES, DEFAULT_SONGS, BOOKS } from './constants';
import { storageService } from './services/storageService';
import { songService } from './services/songService';

type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
};

const DEFAULT_PROJECTOR_SETTINGS: ProjectorSettings = {
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  fontFamily: 'Arial',
  fontSize: 48,
  isBold: false,
  textAlign: 'center',
  showChords: true,
};

const channel = new BroadcastChannel('enekrend_projector');

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [order, setOrder] = useState<SongOrderItem[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isSongEditorOpen, setSongEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isClearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Projector state
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [projectorSettings, setProjectorSettings] = useState<ProjectorSettings>(DEFAULT_PROJECTOR_SETTINGS);
  const [isProjectorSettingsModalOpen, setIsProjectorSettingsModalOpen] = useState(false);
  const [activeProjectionItemIndex, setActiveProjectionItemIndex] = useState<number | null>(null);
  const projectorWindowRef = useRef<Window | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  // --- Initial Loading ---
  useEffect(() => {
    setSongs(storageService.loadSongs() || DEFAULT_SONGS);
    setOrder(storageService.loadOrder() || []);
    setThemes(storageService.loadThemes() || DEFAULT_THEMES);
    setProjectorSettings(storageService.loadProjectorSettings() || DEFAULT_PROJECTOR_SETTINGS);

    const handleChannelMessage = (event: MessageEvent) => {
        if (event.data.type === 'closed') {
            setIsProjectorOpen(false);
            projectorWindowRef.current = null;
        }
    };
    channel.addEventListener('message', handleChannelMessage);

    return () => {
        channel.removeEventListener('message', handleChannelMessage);
    };
  }, []);

  // --- Data Persistence ---
  useEffect(() => { storageService.saveSongs(songs); }, [songs]);
  useEffect(() => { storageService.saveOrder(order); }, [order]);
  useEffect(() => { storageService.saveThemes(themes); }, [themes]);
  useEffect(() => { storageService.saveProjectorSettings(projectorSettings); }, [projectorSettings]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration: number = 5000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, type });
    toastTimerRef.current = window.setTimeout(() => setToast(null), duration);
  }, []);
  
  // --- Projector Logic ---
  const sendToProjector = useCallback((message: BroadcastMessage) => {
    if (isProjectorOpen) {
      channel.postMessage(message);
    }
  }, [isProjectorOpen]);

 const openProjector = () => {
    if (isProjectorOpen && projectorWindowRef.current && !projectorWindowRef.current.closed) {
        projectorWindowRef.current.focus();
        return;
    }
    
    const pWindow = window.open('', 'ÉnekrendVetítő', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
    
    if (pWindow) {
        projectorWindowRef.current = pWindow;

        const projectorHTML = `
            <!DOCTYPE html>
            <html lang="hu" class="h-full">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Énekrend Vetítő</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                  tailwind.config = {
                    theme: {
                      extend: {
                        fontFamily: {
                          sans: ['Inter', 'sans-serif'],
                          serif: ['Georgia', 'serif'],
                          mono: ['Roboto Mono', 'monospace'],
                        }
                      }
                    }
                  }
                </script>
                <link rel="preconnect" href="https://rsms.me/">
                <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet">
                <style> body { margin: 0; } </style>
            </head>
            <body class="h-full bg-black">
                <div id="root" class="h-full"></div>
            </body>
            </html>
        `;
        pWindow.document.write(projectorHTML);
        pWindow.document.close();

        const rootEl = pWindow.document.getElementById('root');
        if (rootEl) {
            const root = ReactDOM.createRoot(rootEl);
            root.render(
                <React.StrictMode>
                    <ProjectorView />
                </React.StrictMode>
            );
            
            setIsProjectorOpen(true);
            // Give it a moment to load, then send initial settings
            setTimeout(() => {
                sendToProjector({ type: 'settings', payload: projectorSettings });
                sendToProjector({ type: 'content', payload: {html: '<h1>Vetítés elindítva</h1><p>Válassz egy elemet a vezérlőn.</p>', text: ''} });
            }, 500);

        } else {
             showToast('A vetítő ablakot nem sikerült inicializálni.', 'error');
        }

    } else {
        showToast('A vetítő ablak megnyitását letiltotta a böngésző. Kérjük, engedélyezze a felugró ablakokat ezen az oldalon.', 'error', 8000);
    }
  };

  const closeProjector = () => {
    sendToProjector({ type: 'close' });
    if (projectorWindowRef.current) {
      projectorWindowRef.current.close();
    }
    projectorWindowRef.current = null;
    setIsProjectorOpen(false);
    setActiveProjectionItemIndex(null);
  };
  
  const handleProjectorSettingsChange = (newSettings: ProjectorSettings) => {
    setProjectorSettings(newSettings);
    sendToProjector({ type: 'settings', payload: newSettings });
  };
  
  const handleProjectionItemSelect = useCallback((content: { html: string; text: string }) => {
    const finalHtml = songService.generateProjectorHtml(content.text, projectorSettings.showChords);
    sendToProjector({ type: 'content', payload: { html: finalHtml, text: content.text } });
  }, [sendToProjector, projectorSettings.showChords]);


  // --- Core App Logic ---
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
    setOrder(prevOrder => prevOrder.map(item => ('content' in item && item.id === songToSave.id) ? { ...item, ...songToSave } : item));
  };

  const handleDeleteSongRequest = (song: Song) => setSongToDelete(song);

  const handleConfirmDeleteSong = () => {
    if (!songToDelete) return;
    setSongs(prevSongs => prevSongs.filter(s => s.id !== songToDelete.id));
    setOrder(prevOrder => prevOrder.filter(item => item.id !== songToDelete.id));
    setSongToDelete(null);
  };

  const handleUpdateTheme = (updatedTheme: Theme) => {
    setThemes(prev => prev.map(t => t.id === updatedTheme.id ? updatedTheme : t));
    setOrder(prev => prev.map(item => item.id === updatedTheme.id ? {...item, ...updatedTheme} : item));
  };
  
  const handleDeleteThemeRequest = (theme: Theme) => setThemeToDelete(theme);
  
  const handleConfirmDeleteTheme = () => {
    if (!themeToDelete) return;
    setThemes(prev => prev.filter(t => t.id !== themeToDelete.id));
    setOrder(prev => prev.filter(item => item.id !== themeToDelete.id));
    setThemeToDelete(null);
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
    const content = JSON.stringify({ 
        order, 
        songs: songs.filter(s => order.some(o => o.id === s.id && 'content' in o)),
        themes 
    }, null, 2);
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
            if (data.order && Array.isArray(data.order)) setOrder(data.order);
            if (data.songs && Array.isArray(data.songs)) {
                setSongs(prevSongs => {
                    const songMap = new Map(prevSongs.map(s => [s.id, s]));
                    data.songs.forEach((newSong: Song) => {
                        if (newSong.id && typeof newSong.title === 'string' && typeof newSong.content === 'string') {
                            songMap.set(newSong.id, newSong);
                        }
                    });
                    return Array.from(songMap.values());
                });
            }
            if (data.themes && Array.isArray(data.themes)) setThemes(data.themes);
            showToast('JSON adatok sikeresen importálva.', 'success');
        } catch (error) {
            console.error("Failed to parse JSON:", error);
            showToast('Hiba a JSON fájl beolvasása közben.', 'error');
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
            // Standard BOM check for UTF-8
            if (cleanContent.charCodeAt(0) === 0xFEFF) {
                cleanContent = cleanContent.substring(1);
            }

            // Aggressively strip any non-XML content from the beginning of the file.
            const firstTagIndex = cleanContent.indexOf('<');
            if (firstTagIndex > 0) {
                cleanContent = cleanContent.substring(firstTagIndex);
            }

            // If there's no XML tag, or the file is effectively empty, skip it.
            if (firstTagIndex === -1 || cleanContent.trim() === '') {
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
                        if (prefix) referencesFromXml.push(`${prefix}${entry}`);
                    }
                });
                const referencesFromFile = file.name.match(referenceRegex) || [];
                const allReferences = Array.from(new Set([...referencesFromXml, ...referencesFromFile.map(ref => ref.toUpperCase())]));

                newSongs.push({ id: file.name, title, author, content: lyrics, references: allReferences });
            } catch (e) {
                console.error(`Failed to process XML file ${file.name}`, e);
                failedCount++;
            }
        });

        if (newSongs.length > 0) setSongs(prev => [...prev, ...newSongs]);
        
        const summaryMessages: string[] = [];
        if (newSongs.length > 0) summaryMessages.push(`${newSongs.length} ének sikeresen importálva.`);
        if (skippedFiles.length > 0) summaryMessages.push(`${skippedFiles.length} ének kihagyva (már létezett):\n- ${skippedFiles.join('\n- ')}`);
        if (failedCount > 0) summaryMessages.push(`${failedCount} ének importálása sikertelen (hibás formátum).`);
        
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
        {isProjectorOpen ? (
            <ProjectorControl 
                order={order}
                onSelectItem={handleProjectionItemSelect}
                onShowSettings={() => setIsProjectorSettingsModalOpen(true)}
                activeItemIndex={activeProjectionItemIndex}
                setActiveItemIndex={setActiveProjectionItemIndex}
            />
        ) : (
            <SongOrder 
              order={order} 
              setOrder={setOrder} 
              onRemoveItem={handleRemoveItemFromOrder} 
              onAddSong={handleAddSongToOrder}
              onAddTheme={handleAddThemeToOrder}
            />
        )}
        <Themes 
          themes={themes} 
          setThemes={setThemes}
          onAddThemeToOrder={handleAddThemeToOrder}
          onUpdateTheme={handleUpdateTheme}
          onDeleteTheme={handleDeleteThemeRequest}
        />
      </main>
      
      <footer className="mt-4 p-4 bg-white rounded-lg shadow-md flex flex-wrap items-center justify-center gap-4 flex-shrink-0">
        <button onClick={() => setClearConfirmOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Összes Törlése</button>
        <div className="h-6 w-px bg-slate-300"></div>
        <button onClick={handleExportTxt} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Sorrend (txt)</button>
        <button onClick={() => setExportModalOpen(true)} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Export (Word)</button>
        <button onClick={handleExportJson} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Export (JSON)</button>
        <label className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 cursor-pointer">
          Import (JSON)
          <input type="file" accept=".json" onChange={handleImportJson} className="hidden"/>
        </label>
        <label className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 cursor-pointer">
          Import (XML)
          <input type="file" accept=".xml" onChange={handleImportXml} multiple className="hidden"/>
        </label>
        <div className="h-6 w-px bg-slate-300"></div>
        <button onClick={() => setPrintModalOpen(true)} className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Nyomtatás</button>
        {isProjectorOpen ? (
          <button onClick={closeProjector} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Vetítés Leállítása</button>
        ) : (
          <button onClick={openProjector} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Vetítés Indítása</button>
        )}
      </footer>

      <SongEditorModal 
        isOpen={isSongEditorOpen} 
        song={editingSong}
        onClose={() => setSongEditorOpen(false)} 
        onSave={handleSaveSong}
        existingFilenames={songs.map(s => s.id)}
      />
      <PrintModal isOpen={isPrintModalOpen} onClose={() => setPrintModalOpen(false)} order={order}/>
      <ExportDocxModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} order={order}/>
      <ProjectorSettingsModal 
        isOpen={isProjectorSettingsModalOpen}
        onClose={() => setIsProjectorSettingsModalOpen(false)}
        settings={projectorSettings}
        onSettingsChange={handleProjectorSettingsChange}
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
        onConfirm={handleConfirmDeleteSong}
        onCancel={() => setSongToDelete(null)}
      />
      <ConfirmationModal
        isOpen={!!themeToDelete}
        title="Téma törlése"
        message={`Biztosan törölni szeretnéd a(z) "${themeToDelete?.title}" témát? Ez a művelet eltávolítja a témát a sorrendből is.`}
        onConfirm={handleConfirmDeleteTheme}
        onCancel={() => setThemeToDelete(null)}
      />

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;