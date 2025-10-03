import React, { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
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
  
  useLayoutEffect(() => {
    if (isVisible && childRef.current && tooltipRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const PADDING = 8;

      let top = childRect.top - tooltipRect.height - PADDING;
      let left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);

      if (top < PADDING) {
        top = childRect.bottom + PADDING;
      }
      if (left < PADDING) {
        left = PADDING;
      }
      if (left + tooltipRect.width > window.innerWidth - PADDING) {
        left = window.innerWidth - tooltipRect.width - PADDING;
      }

      setPosition({ top, left });
      
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '1';
        }
      });
    }
  }, [isVisible, content]);

  const isStringContent = typeof content === 'string';
  const highlightedHtml = isStringContent ? highlightSongContent(content) : null;
  
  const tooltipElement = isVisible ? ReactDOM.createPortal(
    <div 
      ref={tooltipRef}
      className="fixed z-50 w-64 p-3 text-sm font-normal text-left text-white bg-gray-900 rounded-lg shadow-xl transition-opacity duration-200"
      style={{
        ...position,
        opacity: 0,
      }}
    >
        {isStringContent ? (
             <div className="whitespace-pre-wrap font-mono text-xs" dangerouslySetInnerHTML={{ __html: highlightedHtml! }} />
        ) : (
            <div className="whitespace-pre-wrap font-mono text-xs">{content}</div>
        )}
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={childRef}
      className="inline-block w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {tooltipElement}
    </div>
  );
};

export default Tooltip;