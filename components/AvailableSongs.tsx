import React, { useState } from 'react';
import { Song } from '../types';
import Tooltip from './Tooltip';

interface AvailableSongsProps {
  songs: Song[];
  onAddSong: (song: Song) => void;
  onShowNewSongModal: () => void;
  onShowEditSongModal: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
}

const AvailableSongs: React.FC<AvailableSongsProps> = ({ songs, onAddSong, onShowNewSongModal, onShowEditSongModal, onDeleteSong }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.author && song.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    song.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSongs = [...filteredSongs].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4 min-h-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-700">Elérhető énekek</h2>
        <button
          onClick={onShowNewSongModal}
          className="flex-shrink-0 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          + Új ének
        </button>
      </div>
       <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                placeholder="Keresés az énekek között..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      <ul className="overflow-y-auto flex-grow pr-2">
        {sortedSongs.map(song => (
          <li
            key={song.id}
            onDoubleClick={() => onAddSong(song)}
            className="flex justify-between items-center p-2 rounded-md hover:bg-sky-100 cursor-pointer group"
          >
            <Tooltip content={song.content}>
               <div className="flex-grow truncate mr-2">
                  <p className="truncate group-hover:text-sky-800 font-medium text-sm">{song.title}</p>
                  <p className="truncate text-xs text-slate-500">{song.id}</p>
                </div>
            </Tooltip>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                onClick={() => onShowEditSongModal(song)}
                className="text-slate-500 hover:text-sky-700 p-1"
                aria-label={`Szerkesztés: ${song.title}`}
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                </button>
                 <button
                onClick={() => onDeleteSong(song)}
                className="text-slate-500 hover:text-red-700 p-1"
                aria-label={`Törlés: ${song.title}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AvailableSongs;