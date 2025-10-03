import React, { useState } from 'react';
import { SongOrderItem, Song } from '../types';
import { songService } from '../services/songService';

interface ExportDocxModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SongOrderItem[];
}

const FONT_SIZE_MAP: { [key: string]: string } = {
  sm: '12pt',
  base: '14pt',
  lg: '16pt',
};

const FONT_OPTIONS = [
  { name: 'Arial', value: 'Arial' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Courier New', value: 'Courier New' },
];

const ExportDocxModal: React.FC<ExportDocxModalProps> = ({ isOpen, onClose, order }) => {
  const [headerTitle, setHeaderTitle] = useState('Énekrend');
  const [headerDate, setHeaderDate] = useState(new Date().toLocaleDateString('hu-HU'));
  const [layout, setLayout] = useState<'one-column' | 'two-column'>('two-column');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [margins, setMargins] = useState({ top: '10', right: '10', bottom: '10', left: '10' });
  const [columnGap, setColumnGap] = useState('5');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [showChords, setShowChords] = useState(true);

  const handleMarginChange = (side: keyof typeof margins, value: string) => {
    setMargins(prev => ({ ...prev, [side]: value }));
  };

  const renderSongContent = (song: Song, showChords: boolean): string => {
    const verses = songService.parseToVerses(song.content);
    return verses.map(verse => {
      let verseHtml = '';
      if (verse.marker) {
        verseHtml += `<p style="margin-top: 0.5em; margin-bottom: 0.2em;"><b>${verse.marker}</b></p>`;
      }
      const linesHtml = verse.lines.map(line => {
        if (line.type === 'lyric') {
          return `<p style="margin: 0; min-height: 1.2em;">${line.text || '&nbsp;'}</p>`;
        }
        if (line.type === 'chord' && showChords) {
          const chordText = line.text.substring(1).replace(/ /g, '&nbsp;') || '&nbsp;';
          return `<p style="margin: 0; color: #000000;"><font face="Courier New, Courier, monospace"><b>${chordText}</b></font></p>`;
        }
        return '';
      }).join('');
      return verseHtml + linesHtml;
    }).join('');
  };

  const generateDocContent = () => {
    const itemsHtml = order.map((item, index) => {
        const isSong = 'content' in item;
        const title = `<h3 style="font-weight: bold; margin-bottom: 0.5em; ${isSong ? 'margin-top: 1.5em;' : 'margin: 1.5em 0; text-align: center; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 0.5em 0;'}">${index + 1}. ${item.title}</h3>`;
  
        if (isSong) {
          const references = item.references && item.references.length > 0
            ? `<p style="font-style: italic; font-size: 0.9em; margin-top: 0; color: #555;">(${item.references.join(', ')})</p>`
            : '';
          const songBody = renderSongContent(item as Song, showChords);
          return `<div class="song-item" style="break-inside: avoid;">${title}${references}${songBody}</div>`;
        } else {
          return title;
        }
    });

    let bodyContent;

    if (layout === 'two-column') {
        const midpoint = Math.ceil(itemsHtml.length / 2);
        const column1Html = itemsHtml.slice(0, midpoint).join('\n');
        const column2Html = itemsHtml.slice(midpoint).join('\n');
        const gap = parseFloat(columnGap || '5') / 2;

        bodyContent = `
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    <tr>
                        <td style="width: 50%; vertical-align: top; padding-right: ${gap}mm;">
                            ${column1Html}
                        </td>
                        <td style="width: 50%; vertical-align: top; padding-left: ${gap}mm;">
                            ${column2Html}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    } else {
        bodyContent = itemsHtml.join('\n');
    }

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${headerTitle}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4;
              mso-page-orientation: portrait;
              margin: ${margins.top || 10}mm ${margins.right || 10}mm ${margins.bottom || 10}mm ${margins.left || 10}mm;
            }
            body { 
              font-family: '${fontFamily}', sans-serif;
              font-size: ${FONT_SIZE_MAP[fontSize]};
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 2em;">
            <h1>${headerTitle}</h1>
            <p>${headerDate}</p>
          </div>
          ${bodyContent}
        </body>
      </html>
    `;
  };

  const handleExport = () => {
    const content = generateDocContent();
    const blob = new Blob([content], { type: 'application/msword' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${headerTitle.replace(/\s+/g, '_') || 'enekrend'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    onClose();
  };

  if (!isOpen) return null;
  
  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100";
  const smallInputClass = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500";
  const checkboxClass = "h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500";

  return (
     <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40" onClick={onClose}>
      <div className="bg-slate-50 rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6">Exportálás Word (.doc) formátumba</h3>
        <div className="flex flex-col gap-4">
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
              <option value="sm">Kicsi (12pt)</option>
              <option value="base">Normál (14pt)</option>
              <option value="lg">Nagy (16pt)</option>
            </select>
          </div>
          <div className="flex items-center mt-2">
            <input id="exportShowChords" type="checkbox" checked={showChords} onChange={e => setShowChords(e.target.checked)} className={checkboxClass}/>
            <label htmlFor="exportShowChords" className="ml-2 text-sm text-gray-700">Akkordok exportálása</label>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Mégse</button>
          <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Exportálás</button>
        </div>
      </div>
    </div>
  );
};

export default ExportDocxModal;