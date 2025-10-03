import React, { useState, useEffect } from 'react';
import { ProjectorSettings } from '../types';

interface ProjectorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectorSettings;
  onSettingsChange: (newSettings: ProjectorSettings) => void;
}

const FONT_OPTIONS = [
  { group: 'Sans-Serif', fonts: ['Inter', 'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS'] },
  { group: 'Serif', fonts: ['Georgia', 'Times New Roman', 'Garamond'] },
  { group: 'Monospace', fonts: ['Roboto Mono', 'Courier New', 'Lucida Console'] }
];

const ProjectorSettingsModal: React.FC<ProjectorSettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [currentSettings, setCurrentSettings] = useState(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof ProjectorSettings, value: any) => {
    const newSettings = { ...currentSettings, [field]: value };
    setCurrentSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  if (!isOpen) return null;

  const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500";
  const labelClass = "block text-sm font-medium text-gray-700";
  const colorInputClass = "p-1 h-10 w-full block bg-white border border-gray-300 rounded-md cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40" onClick={onClose}>
      <div className="bg-slate-50 rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6">Vetítés Beállításai</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bgColor" className={labelClass}>Háttérszín</label>
                <input id="bgColor" type="color" value={currentSettings.backgroundColor} onChange={e => handleChange('backgroundColor', e.target.value)} className={colorInputClass}/>
              </div>
              <div>
                <label htmlFor="textColor" className={labelClass}>Szövegszín</label>
                <input id="textColor" type="color" value={currentSettings.textColor} onChange={e => handleChange('textColor', e.target.value)} className={colorInputClass}/>
              </div>
            </div>
            <div>
              <label htmlFor="fontFamily" className={labelClass}>Betűtípus</label>
              <select id="fontFamily" value={currentSettings.fontFamily} onChange={e => handleChange('fontFamily', e.target.value)} className={inputClass}>
                {FONT_OPTIONS.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.fonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fontSize" className={labelClass}>Betűméret</label>
              <div className="flex items-center gap-4 mt-1">
                <input
                  id="fontSize"
                  type="range"
                  min="14"
                  max="80"
                  value={currentSettings.fontSize}
                  onChange={e => handleChange('fontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="relative flex-shrink-0">
                  <input
                    type="number"
                    value={currentSettings.fontSize}
                    onChange={e => handleChange('fontSize', parseInt(e.target.value) || 14)}
                    className="w-24 text-sm px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    min="1"
                    aria-label="Pontos betűméret"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 text-sm">
                    pt
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Igazítás</label>
              <div className="flex gap-2 mt-1">
                {(['left', 'center', 'right'] as const).map(align => (
                  <button key={align} onClick={() => handleChange('textAlign', align)} className={`px-4 py-2 text-sm rounded-md flex-1 ${currentSettings.textAlign === align ? 'bg-sky-600 text-white' : 'bg-white border'}`}>
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
                 <div className="flex items-center">
                    <input id="isBold" type="checkbox" checked={currentSettings.isBold} onChange={e => handleChange('isBold', e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded"/>
                    <label htmlFor="isBold" className="ml-2 text-sm text-gray-700">Félkövér</label>
                </div>
                 <div className="flex items-center">
                    <input id="showChords" type="checkbox" checked={currentSettings.showChords} onChange={e => handleChange('showChords', e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded"/>
                    <label htmlFor="showChords" className="ml-2 text-sm text-gray-700">Akkordok mutatása</label>
                </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col">
            <label className={labelClass}>Előnézet</label>
            <div 
              className="mt-1 flex-grow rounded-md p-4 flex items-center justify-center transition-all duration-200 border border-slate-300"
              style={{
                backgroundColor: currentSettings.backgroundColor,
                color: currentSettings.textColor,
                fontFamily: currentSettings.fontFamily,
                fontSize: `${currentSettings.fontSize * 0.5}pt`, // Scale down for preview
                lineHeight: 1.4,
                fontWeight: currentSettings.isBold ? 'bold' : 'normal',
                textAlign: currentSettings.textAlign,
              }}
            >
              <div className="whitespace-pre-wrap">
                  [V1]<br/>
                  Ez egy példa szöveg,<br/>
                  hogy lásd a beállításokat.
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Bezárás</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectorSettingsModal;