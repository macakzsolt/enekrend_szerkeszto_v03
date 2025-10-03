
import React, { useState, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectorSettings, BroadcastMessage } from './types';

const channel = new BroadcastChannel('enekrend_projector');

const Projector: React.FC = () => {
  const [content, setContent] = useState({ html: '<div class="text-2xl text-slate-400">Várakozás a vezérlőre...</div>', text: 'Várakozás a vezérlőre...' });
  const [settings, setSettings] = useState<ProjectorSettings | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, payload } = event.data;
      if (type === 'content') {
        setContent(payload);
      } else if (type === 'settings') {
        setSettings(payload);
      } else if (type === 'close') {
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
    <div 
      className="h-full w-full flex items-center justify-center p-12 transition-colors duration-300"
      style={style}
    >
      <div 
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: content.html }} 
      />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Projector />
  </React.StrictMode>
);
