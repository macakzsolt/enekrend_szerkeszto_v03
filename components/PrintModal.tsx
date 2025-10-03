import React, { useState, useRef } from 'react';
import { SongOrderItem, Song } from '../types';
import { songService } from '../services/songService';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SongOrderItem[];
}

const FONT_SIZE_MAP: { [key: string]: string } = {
  sm: '12px',
  base: '14px',
  lg: '16px',
};

const FONT_OPTIONS = [
  { name: 'Roboto (Sans-Serif)', value: "'Roboto', sans-serif" },
  { name: 'Georgia (Serif)', value: "'Georgia', serif" },
  { name: 'Times New Roman (Serif)', value: "'Times New Roman', Times, serif" },
  { name: 'Roboto Mono (Monospace)', value: "'Roboto Mono', monospace" },
  { name: 'Courier New (Monospace)', value: "'Courier New', Courier, monospace" },
];

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, order }) => {
  const [headerTitle, setHeaderTitle] = useState('Énekrend');
  const [headerDate, setHeaderDate] = useState(new Date().toLocaleDateString('hu-HU'));
  const [layout, setLayout] = useState<'one-column' | 'two-column'>('two-column');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [margins, setMargins] = useState({ top: '10', right: '10', bottom: '10', left: '10' });
  const [columnGap, setColumnGap] = useState('5');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [showChords, setShowChords] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleMarginChange = (side: keyof typeof margins, value: string) => {
    setMargins(prev => ({ ...prev, [side]: value }));
  };

  const renderSongContent = (song: Song, showChords: boolean): string => {
    const verses = songService.parseToVerses(song.content);
    return verses.map(verse => {
      const verseMarker = verse.marker ? `<h4 style="font-weight: bold; margin-top: 0.5em; margin-bottom: 0.2em;">${verse.marker}</h4>` : '';
      const lines = verse.lines.map(line => {
        if (line.type === 'lyric') {
          return `<div class="lyric-line" style="min-height: 1.2em;">${line.text || '&nbsp;'}</div>`;
        }
        if (line.type === 'chord' && showChords) {
          const chordText = line.text.replace(/ /g, '&nbsp;').replace('.', '<span style="opacity: 0;">.</span>') || '&nbsp;';
          return `<div class="chord-line" style="font-weight: bold; color: #111; font-family: 'Roboto Mono', 'Courier New', monospace;">${chordText}</div>`;
        }
        return '';
      }).join('');
      return `<div class="song-verse">${verseMarker}${lines}</div>`;
    }).join('');
  };

  const generatePrintContent = () => {
    const content = order.map((item, index) => {
      const isSong = 'content' in item;
      const title = `<h3 style="font-weight: bold; margin-bottom: 0.5em; ${isSong ? 'margin-top: 1.5em;' : 'margin-top: 0;'}">${index + 1}. ${item.title}</h3>`;
      
      if (isSong) {
        const references = item.references && item.references.length > 0
          ? `<p style="font-style: italic; font-size: 0.9em; margin-top: 0; color: #555;">(${item.references.join(', ')})</p>`
          : '';
        const songBody = renderSongContent(item as Song, showChords);
        return `<div class="song-item">${title}${references}${songBody}</div>`;
      } else {
        return `<div class="theme-item" style="text-align: center;">${title}</div>`;
      }
    }).join('\n');

    const columnStyle = layout === 'two-column' 
      ? `body { column-count: 2; column-gap: ${columnGap || 5}mm; }` 
      : '';
    
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Georgia&family=Times+New+Roman&family=Roboto+Mono:wght@400;700&display=swap`;

    return `
      <!DOCTYPE html>
      <html lang="hu">
        <head>
          <title>Nyomtatás - ${headerTitle}</title>
          <meta charset="UTF-8">
          <style>
            @import url('${googleFontsUrl}');
            @page {
              size: A4;
              margin: ${margins.top || 10}mm ${margins.right || 10}mm ${margins.bottom || 10}mm ${margins.left || 10}mm;
            }
            body { 
              font-family: ${fontFamily};
              font-size: ${FONT_SIZE_MAP[fontSize]};
              line-height: 1.6;
              color: #111;
            }
            ${columnStyle}
            .song-item, .theme-item, .song-verse {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            h1, h2, h3, h4, p { margin: 0; padding: 0; font-weight: normal; }
            .print-header { text-align: center; margin-bottom: 2em; page-break-after: avoid; }
            .page-number { position: fixed; bottom: calc(${margins.bottom || 10}mm - 8mm); right: 0; font-size: 0.8em; }
            .song-item { margin-bottom: 1em; }
            .theme-item { font-weight: bold; padding: 0.5em 0; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; margin: 1.5em 0; }
            @media print {
              body {
                counter-reset: page;
              }
              .page-number::after {
                counter-increment: page;
                content: counter(page);
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${headerTitle}</h1>
            <p>${headerDate}</p>
          </div>
          ${content}
          ${showPageNumbers ? `<div class="page-number"></div>` : ''}
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  if (!isOpen) return null;

  const printContent = generatePrintContent();
  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100";
  const smallInputClass = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500";
  const checkboxClass = "h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40" onClick={onClose}>
      <div className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-row" onClick={e => e.stopPropagation()}>
        <div className="w-80 p-4 border-r border-slate-200 flex-shrink-0 flex flex-col">
          <h3 className="text-xl font-bold mb-6">Nyomtatási kép</h3>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fejléc címe</label>
              <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)} className={inputClass}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dátum</label>
              <input type="text" value={headerDate} onChange={e => setHeaderDate(e.target.value)} className={inputClass}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Margók (mm)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input type="number" placeholder="Felső" value={margins.top} onChange={e => handleMarginChange('top', e.target.value)} className={smallInputClass} />
                <input type="number" placeholder="Jobb" value={margins.right} onChange={e => handleMarginChange('right', e.target.value)} className={smallInputClass} />
                <input type="number" placeholder="Alsó" value={margins.bottom} onChange={e => handleMarginChange('bottom', e.target.value)} className={smallInputClass} />
                <input type="number" placeholder="Bal" value={margins.left} onChange={e => handleMarginChange('left', e.target.value)} className={smallInputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Elrendezés</label>
              <select value={layout} onChange={e => setLayout(e.target.value as any)} className={inputClass}>
                <option value="one-column">Egy hasáb</option>
                <option value="two-column">Két hasáb</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Hasábköz (mm)</label>
              <input type="number" value={columnGap} onChange={e => setColumnGap(e.target.value)} className={inputClass} disabled={layout === 'one-column'}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Betűtípus</label>
               <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className={inputClass}>
                {FONT_OPTIONS.map(font => (
                  <option key={font.name} value={font.value}>{font.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Betűméret</label>
              <select value={fontSize} onChange={e => setFontSize(e.target.value as any)} className={inputClass}>
                <option value="sm">Kicsi (12px)</option>
                <option value="base">Normál (14px)</option>
                <option value="lg">Nagy (16px)</option>
              </select>
            </div>
            <div className="flex items-center mt-2">
              <input id="showChords" type="checkbox" checked={showChords} onChange={e => setShowChords(e.target.checked)} className={checkboxClass}/>
              <label htmlFor="showChords" className="ml-2 text-sm text-gray-700">Akkordok mutatása</label>
            </div>
            <div className="flex items-center">
              <input id="showPageNumbers" type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} className={checkboxClass}/>
              <label htmlFor="showPageNumbers" className="ml-2 text-sm text-gray-700">Oldalszámok</label>
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
            <button onClick={handlePrint} className="w-full px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Nyomtatás</button>
            <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Bezárás</button>
          </div>
        </div>
        <div className="flex-grow p-4 bg-gray-300">
          <iframe 
            ref={iframeRef} 
            className="w-full h-full bg-white shadow-lg border border-gray-400" 
            title="Print Preview"
            srcDoc={printContent}
          />
        </div>
      </div>
    </div>
  );
};

export default PrintModal;