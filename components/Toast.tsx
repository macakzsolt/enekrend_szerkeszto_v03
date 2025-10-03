import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const baseClasses = "fixed bottom-5 right-5 max-w-sm w-full p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 z-50";
  const typeClasses = {
    success: 'bg-green-500',
    info: 'bg-sky-500',
    error: 'bg-red-500',
  };

  const icons = {
    success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <div className="flex items-start">
         <div className="flex-shrink-0">
             <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {icons[type]}
             </svg>
         </div>
         <div className="ml-3 flex-1 whitespace-pre-wrap">{message}</div>
         <button onClick={onClose} className="ml-3 -mr-1 -mt-1 p-1 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Bezárás">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
