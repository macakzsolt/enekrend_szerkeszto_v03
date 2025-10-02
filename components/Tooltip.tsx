
import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
}

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

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 text-sm font-normal text-left text-white bg-gray-900 rounded-lg shadow-sm transition-opacity duration-300 left-1/2 -translate-x-1/2 bottom-full mb-2">
            <div className="whitespace-pre-wrap font-mono text-xs">{content}</div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
