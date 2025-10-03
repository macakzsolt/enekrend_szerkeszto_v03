
import { Song, SongOrderItem, Theme, ProjectorSettings } from "../types";

const SONGS_KEY = 'enekrend_songs';
const ORDER_KEY = 'enekrend_order';
const THEMES_KEY = 'enekrend_themes';
const PROJECTOR_SETTINGS_KEY = 'enekrend_projector_settings';


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
  },

  saveThemes: (themes: Theme[]): void => {
    try {
      localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
    } catch (error) {
      console.error("Failed to save themes to localStorage", error);
    }
  },

  loadThemes: (): Theme[] | null => {
    try {
      const themesJson = localStorage.getItem(THEMES_KEY);
      return themesJson ? JSON.parse(themesJson) : null;
    } catch (error) {
      console.error("Failed to load themes from localStorage", error);
      return null;
    }
  },

  saveProjectorSettings: (settings: ProjectorSettings): void => {
    try {
      localStorage.setItem(PROJECTOR_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save projector settings to localStorage", error);
    }
  },

  loadProjectorSettings: (): ProjectorSettings | null => {
    try {
      const settingsJson = localStorage.getItem(PROJECTOR_SETTINGS_KEY);
      return settingsJson ? JSON.parse(settingsJson) : null;
    } catch (error) {
      console.error("Failed to load projector settings from localStorage", error);
      return null;
    }
  }
};