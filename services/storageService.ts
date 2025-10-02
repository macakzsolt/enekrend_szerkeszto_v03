
import { Song, SongOrderItem } from "./types";

const SONGS_KEY = 'enekrend_songs';
const ORDER_KEY = 'enekrend_order';

export const storageService = {
  saveSongs: (songs: Song[]): void => {
    try {
      localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
    } catch (error) {
      console.error("Failed to save songs to localStorage", error);
    }
  },

  loadSongs: (): Song[] | null => {
    try {
      const songsJson = localStorage.getItem(SONGS_KEY);
      return songsJson ? JSON.parse(songsJson) : null;
    } catch (error) {
      console.error("Failed to load songs from localStorage", error);
      return null;
    }
  },

  saveOrder: (order: SongOrderItem[]): void => {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch (error) {
      console.error("Failed to save order to localStorage", error);
    }
  },

  loadOrder: (): SongOrderItem[] | null => {
    try {
      const orderJson = localStorage.getItem(ORDER_KEY);
      return orderJson ? JSON.parse(orderJson) : null;
    } catch (error) {
      console.error("Failed to load order from localStorage", error);
      return null;
    }
  }
};
