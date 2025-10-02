
import React, { useState } from 'react';
import { SongOrderItem } from '../types';
import Tooltip from './Tooltip';

interface SongOrderProps {
  order: SongOrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<SongOrderItem[]>>;
  onRemoveItem: (instanceId: string) => void;
}

const SongOrder: React.FC<SongOrderProps> = ({ order, setOrder, onRemoveItem }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...order];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setOrder(newOrder);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4 text-slate-700">Ének sorrend</h2>
      <ul className="overflow-y-auto flex-grow border-2 border-dashed border-slate-300 rounded-md p-2 bg-slate-50 min-h-[200px]">
        {order.length === 0 ? (
          <li className="text-center text-slate-500 italic p-4">Húzz ide énekeket vagy témákat a kezdéshez.</li>
        ) : (
          order.map((item, index) => (
            <li
              key={item.instanceId}
              onDoubleClick={() => onRemoveItem(item.instanceId)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-2 my-1 rounded-md flex justify-between items-center cursor-move transition-all ${
                'content' in item ? 'bg-sky-100' : 'bg-amber-100'
              } ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
            >
              <Tooltip content={'content' in item ? item.content : item.title}>
                  <div className="flex-grow truncate mr-2">
                    <p className="truncate font-medium text-sm">
                      {index + 1}. {item.title}
                    </p>
                    {'content' in item && (
                      <p className="truncate text-xs text-slate-500 pl-4">
                        {item.references && item.references.length > 0 ? item.references.join(', ') : item.id}
                      </p>
                    )}
                  </div>
              </Tooltip>
              <button
                onClick={() => onRemoveItem(item.instanceId)}
                className="text-red-500 hover:text-red-700 ml-2"
                aria-label={`Eltávolítás: ${item.title}`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default SongOrder;