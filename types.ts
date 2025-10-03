export interface Song {
  id: string; // filename, e.g., 'dal_01.xml'
  title: string;
  author?: string;
  content: string; // The raw text with chords and verse markers
  references?: string[]; // e.g., ['K33', 'D17']
}

export interface Theme {
  id: string;
  title: string;
}

export type SongOrderItem = (Song | Theme) & { instanceId: string };

export interface ExportOptions {
  headerTitle: string;
  headerDate: string;
  layout: 'one-column' | 'two-column';
  fontSize: 'sm' | 'base' | 'lg';
  showChords: boolean;
  showPageNumbers: boolean;
}

export interface Verse {
  marker: string;
  lines: {
    type: 'lyric' | 'chord';
    text: string;
  }[];
}

export interface ProjectorSettings {
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  textAlign: 'left' | 'center' | 'right';
  showChords: boolean;
}

export type BroadcastMessage = 
  | { type: 'content'; payload: { html: string; text: string } }
  | { type: 'settings'; payload: ProjectorSettings }
  | { type: 'close' };
