import React, { useState } from 'react';
import { PrintOptions, SongOrderItem } from '../types';
import { songService } from '../services/songService';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SongOrderItem[];
}

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, order }) => {
  const [options, setOptions] = useState<PrintOptions>({
    headerTitle: 'Szentmise énekrend',
    headerDate: new Date().toLocaleDateString('hu-HU'),
    layout: 'two-column',
    fontSize: 'base',
    showChords: true,
    showPageNumbers: true,
  });

  const handleChange = <K extends keyof PrintOptions,>(key: K, value: PrintOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    const content = generatePrintHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      setTimeout(() => {
          printWindow.print();
      }, 500); // Wait for styles and fonts to apply
    }
  };

  const generatePrintHTML = () => {
    const escapeHtml = (unsafe: string | undefined) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const isTwoCol = options.layout === 'two-column';

    const songsHtml = order.map(item => {
      if (!('content' in item)) { // It's a Theme
        return `<h2 class="theme-title">${escapeHtml(item.title)}</h2>`;
      }

      // It's a Song
      let songContentHtml = '';
      const verses = songService.parseToVerses(item.content);

      verses.forEach(verse => {
        if (verse.lines.some(l => l.text.trim() !== '')) {
            songContentHtml += `<div class="verse">`;

            if (verse.marker && verse.marker.trim() !== '' && verse.marker.trim() !== '[]') {
                songContentHtml += `<pre class="verse-marker">${escapeHtml(verse.marker)}</pre>`;
            }

            let i = 0;
            const lines = verse.lines;
            while (i < lines.length) {
                const currentLine = lines[i];

                if (currentLine.text.trim() === '') {
                    songContentHtml += `<div class="line-pair"><pre class="lyrics">&nbsp;</pre></div>`;
                    i++;
                    continue;
                }
                
                if (currentLine.type === 'chord' && options.showChords) {
                    const nextLine = (i + 1 < lines.length) ? lines[i + 1] : null;
                    // Replace the first dot with a space to preserve alignment, then escape.
                    const chordText = escapeHtml(currentLine.text.replace('.', ' '));

                    if (nextLine && nextLine.type === 'lyric') {
                        songContentHtml += `<div class="line-pair">
                            <pre class="chords">${chordText}</pre>
                            <pre class="lyrics">${escapeHtml(nextLine.text)}</pre>
                        </div>`;
                        i += 2;
                    } else {
                        songContentHtml += `<div class="line-pair"><pre class="chords">${chordText}</pre></div>`;
                        i++;
                    }
                } else if (currentLine.type === 'lyric') {
                    songContentHtml += `<div class="line-pair"><pre class="lyrics">${escapeHtml(currentLine.text)}</pre></div>`;
                    i++;
                } else {
                    i++; 
                }
            }
            songContentHtml += `</div>`;
        }
      });

      return `
        <div class="song">
          <h3 class="song-title">${escapeHtml(item.title)}</h3>
          ${item.author ? `<p class="song-author">${escapeHtml(item.author)}</p>` : ''}
          <div class="song-content-wrapper">
            ${songContentHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="hu">
      <head>
        <title>Nyomtatás - ${escapeHtml(options.headerTitle)}</title>
        <link rel="preconnect" href="https://rsms.me/">
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
        <style>
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page-counter::after {
              counter-increment: page;
              content: counter(page);
            }
          }
          @page { 
            size: A4; 
            margin: 1.5cm; 
          }
          body {
            font-family: Georgia, 'Times New Roman', Times, serif;
            font-size: ${options.fontSize === 'sm' ? '10pt' : options.fontSize === 'lg' ? '13pt' : '11pt'};
            line-height: 1.5;
            counter-reset: page;
          }
          header { 
            text-align: center; 
            margin-bottom: 2rem; 
            border-bottom: 1px solid #ccc;
            padding-bottom: 1rem;
          }
          h1 { 
            font-size: 1.8em; 
            font-weight: 600; 
            font-family: 'Inter', sans-serif; 
            margin: 0;
          }
          .header-date { 
            font-size: 1.2em; 
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            color: #666;
            margin: 0;
            margin-top: 0.25rem;
          }
          main {
             column-count: ${isTwoCol ? 2 : 1};
             column-gap: 2rem;
             ${isTwoCol ? 'column-rule: 1px solid #eee;' : ''}
             widows: 3;
             orphans: 3;
          }
          .song, .theme-title { 
            break-inside: avoid;
            margin-bottom: 1.8rem;
            padding-top: 0.5rem;
          }
          .theme-title {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 2px solid #333;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 1.3em;
            color: #333;
          }
          .song-title {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 1.2em;
            margin-bottom: 0.1em;
          }
          .song-author {
            font-family: 'Inter', sans-serif;
            font-style: italic;
            font-size: 0.9em;
            margin-bottom: 0.8em;
            color: #555;
          }
          .verse {
            margin-bottom: 1rem;
            break-inside: avoid;
          }
          .line-pair {
            break-inside: avoid;
          }
          .song-content-wrapper pre {
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 0;
            font-size: 1em;
            line-height: 1.4;
            white-space: pre-wrap;
            word-break: normal;
          }
          pre.verse-marker {
            font-style: italic;
            font-weight: bold;
            margin-bottom: 0.4rem;
            font-family: 'Inter', sans-serif;
            color: #666;
            font-size: 0.95em;
          }
          pre.chords {
            font-weight: bold;
            color: #1d4ed8; /* blue-700 */
          }
          pre.lyrics {
            color: #1c1917; /* stone-900 */
          }
          .page-footer { 
            display: none; 
          }
          @media print {
            .page-footer {
              display: block;
              position: fixed; 
              bottom: 0.5cm; 
              right: 1.5cm; 
              text-align: right; 
              font-size: 9pt; 
              font-family: 'Inter', sans-serif;
              color: #888;
            }
          }
        </style> 
      </head>
      <body>
        <header>
          <h1>${escapeHtml(options.headerTitle)}</h1>
          <h2 class="header-date">${escapeHtml(options.headerDate)}</h2>
        </header>
        <main>
          ${songsHtml}
        </main>
        ${options.showPageNumbers ? `<footer class="page-footer"><span class="page-counter"></span></footer>` : ''}
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40" onClick={onClose}>
      <div className="bg-slate-50 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6">Miserend Nyomtatáshoz</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fejléc címe</label>
              <input type="text" value={options.headerTitle} onChange={e => handleChange('headerTitle', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dátum</label>
              <input type="text" value={options.headerDate} onChange={e => handleChange('headerDate', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Elrendezés</label>
              <select value={options.layout} onChange={e => handleChange('layout', e.target.value as 'one-column')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                <option value="one-column">Egy hasáb</option>
                <option value="two-column">Két hasáb</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Betűméret</label>
              <select value={options.fontSize} onChange={e => handleChange('fontSize', e.target.value as 'base')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                <option value="sm">Kicsi</option>
                <option value="base">Normál</option>
                <option value="lg">Nagy</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 pt-2">
            <div className="flex items-center">
              <input id="showChords" type="checkbox" checked={options.showChords} onChange={e => handleChange('showChords', e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"/>
              <label htmlFor="showChords" className="ml-2 block text-sm text-gray-900">Akkordok megjelenítése</label>
            </div>
            <div className="flex items-center">
              <input id="showPageNumbers" type="checkbox" checked={options.showPageNumbers} onChange={e => handleChange('showPageNumbers', e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"/>
              <label htmlFor="showPageNumbers" className="ml-2 block text-sm text-gray-900">Oldalszámok megjelenítése</label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Mégse</button>
          <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Nyomtatás</button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;