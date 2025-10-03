import React, { useState, useEffect } from 'react';
import { ProjectorSettings, BroadcastMessage } from './types';

const channel = new BroadcastChannel('enekrend_projector');

const ProjectorView: React.FC = () => {
  const [content, setContent] = useState({ html: '<div class="text-2xl text-slate-400">Várakozás a vezérlőre...</div>', text: 'Várakozás a vezérlőre...' });
  const [settings, setSettings] = useState<ProjectorSettings | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data;
      if (message.type === 'content') {
        setContent(message.payload);
      } else if (message.type === 'settings') {
        setSettings(message.payload);
      } else if (message.type === 'close') {
        window.close();
      }
    };

    channel.addEventListener('message', handleMessage);

    // Notify the main window when this window is closed by the user
    window.addEventListener('beforeunload', () => {
        channel.postMessage({ type: 'closed' });
    });

    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, []);

  const style: React.CSSProperties = settings ? {
    backgroundColor: settings.backgroundColor,
    color: settings.textColor,
    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}pt`,
    fontWeight: settings.isBold ? 'bold' : 'normal',
    textAlign: settings.textAlign,
  } : {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    textAlign: 'center',
  };

  return (
    <>
      <style>{`
        .verse-content-wrapper {
          display: inline-block;
          text-align: left;
        }
        .chord-line {
          font-family: 'Roboto Mono', 'Courier New', monospace;
        }
        .verse-marker {
          font-weight: bold;
          margin-top: 0.75em;
          margin-bottom: 0.25em;
        }
      `}</style>
      <div 
        className="h-full w-full flex items-center justify-center p-12 transition-colors duration-300"
        style={style}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: content.html }} 
        />
      </div>
    </>
  );
};

export default ProjectorView;