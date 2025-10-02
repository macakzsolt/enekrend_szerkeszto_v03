import { Verse } from './types';

const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const ALL_NOTES_MAP: { [key: string]: string } = {
  'B#': 'C', 'C': 'C', 'C#': 'C#',
  'Db': 'C#', 'D': 'D', 'D#': 'D#',
  'Eb': 'D#', 'E': 'E', 'Fb': 'E', 'E#': 'F',
  'F': 'F', 'F#': 'F#', 'Gb': 'F#', 'G': 'G', 'G#': 'G#',
  'Ab': 'G#', 'A': 'A', 'A#': 'A#',
  'Bb': 'A#', 'B': 'B', 'Cb': 'B'
};

const CHORD_REGEX = /([A-G][#b]?)/g;

const transposeNote = (note: string, amount: number): string => {
  const isFlat = note.includes('b') && note.length > 1;
  const scale = isFlat ? FLAT_SCALE : SHARP_SCALE;
  const normalizedNote = ALL_NOTES_MAP[note] || note;
  
  const index = scale.indexOf(normalizedNote);
  if (index === -1) {
    return note;
  }
  
  const newIndex = (index + amount + scale.length) % scale.length;
  return scale[newIndex];
};

const transposeChord = (chord: string, amount: number): string => {
  const parts = chord.split('/');
  const mainChord = parts[0];
  const bassNote = parts.length > 1 ? parts[1] : null;

  const transposedMain = mainChord.replace(CHORD_REGEX, (match) => transposeNote(match, amount));
  
  if (bassNote) {
    const transposedBass = bassNote.replace(CHORD_REGEX, (match) => transposeNote(match, amount));
    return `${transposedMain}/${transposedBass}`;
  }
  
  return transposedMain;
};

export const songService = {
  transpose(content: string, amount: number): string {
    return content.split('\n').map(line => {
      if (line.trim().startsWith('.')) {
        // We need to handle the dot prefix carefully during transposition
        const dotIndex = line.indexOf('.');
        const prefix = line.substring(0, dotIndex + 1);
        const chordsPart = line.substring(dotIndex + 1);

        const chords = chordsPart.split(/\s+/).filter(Boolean);
        const transposedChords = chords.map(chord => transposeChord(chord, amount));
        
        // This is a simplified reconstruction and might lose complex spacing.
        // A more robust solution would involve parsing and rebuilding the string with spacing.
        // For now, join with single spaces.
        return `${prefix}${transposedChords.join(' ')}`;
      }
      return line;
    }).join('\n');
  },

  normalizeBH(content: string): string {
    return content.replace(/Bb/g, '@@TEMP_B@@').replace(/B/g, 'H').replace(/@@TEMP_B@@/g, 'B');
  },

  parseToVerses(content: string): Verse[] {
    const verses: Verse[] = [];
    let currentVerse: Verse | null = null;
    
    const ensureVerse = () => {
      if (!currentVerse) {
        currentVerse = { marker: '', lines: [] };
      }
    };

    content.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        if (currentVerse) {
          verses.push(currentVerse);
        }
        currentVerse = { marker: trimmedLine, lines: [] };
      } else {
        ensureVerse();
        if (trimmedLine.startsWith('.')) {
          // Store the original line to preserve all whitespace and the dot
          currentVerse!.lines.push({ type: 'chord', text: line });
        } else {
          currentVerse!.lines.push({ type: 'lyric', text: line });
        }
      }
    });

    if (currentVerse) {
      verses.push(currentVerse);
    }

    return verses;
  },
  
  versesToContent(verses: Verse[]): string {
    return verses.map(verse => {
      const verseLines = verse.lines.map(line => line.text).join('\n');
      return verse.marker ? `${verse.marker}\n${verseLines}` : verseLines;
    }).join('\n');
  },

  copyChords(content: string, sourceVerseIndex: number, targetVerseIndices: number[]): string {
    const verses = this.parseToVerses(content);
    if (sourceVerseIndex >= verses.length) return content;

    const sourceChords = verses[sourceVerseIndex].lines.filter(l => l.type === 'chord');
    
    targetVerseIndices.forEach(targetIndex => {
      if (targetIndex < verses.length) {
        const targetVerse = verses[targetIndex];
        const targetLyrics = targetVerse.lines.filter(l => l.type === 'lyric');
        let chordIndex = 0;
        const newLines: Verse['lines'] = [];

        targetLyrics.forEach(lyricLine => {
          if (lyricLine.text.trim() !== '') {
            if (chordIndex < sourceChords.length) {
              newLines.push(sourceChords[chordIndex]);
              chordIndex++;
            }
          }
          newLines.push(lyricLine);
        });
        
        verses[targetIndex].lines = newLines;
      }
    });

    return this.versesToContent(verses);
  },
};