import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
}

const highlightSongContent = (text: string) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .split('\n')
      .map(line => {
        const escapedLine = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        
        if (line.trim().startsWith('.')) {
          return `<span class="text-sky-400 font-semibold">${escapedLine || '&nbsp;'}</span>`;
        }
        if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
            return `<span class="text-amber-400 font-semibold">${escapedLine || '&nbsp;'}</span>`;
        }
        return `<span>${escapedLine || '&nbsp;'}</span>`;
      })
      .join('\n');
};


const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  const isStringContent = typeof content === 'string';
  const highlightedHtml = isStringContent ? highlightSongContent(content) : null;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 text-sm font-normal text-left text-white bg-gray-900 rounded-lg shadow-sm transition-opacity duration-300 left-1/2 -translate-x-1/2 bottom-full mb-2">
            {isStringContent ? (
                 <div className="whitespace-pre-wrap font-mono text-xs" dangerouslySetInnerHTML={{ __html: highlightedHtml! }} />
            ) : (
                <div className="whitespace-pre-wrap font-mono text-xs">{content}</div>
            )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;