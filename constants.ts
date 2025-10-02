
import { Song, Theme } from './types';

export const THEMES: Theme[] = [
  { id: 'theme_bevonulas', title: 'Bevonulási ének' },
  { id: 'theme_kyrie', title: 'Kyrie' },
  { id: 'theme_gloria', title: 'Gloria' },
  { id: 'theme_valaszos_zsoltar', title: 'Válaszos zsoltár' },
  { id: 'theme_alleluja', title: 'Alleluja' },
  { id: 'theme_felajanlas', title: 'Felajánlási ének' },
  { id: 'theme_sanctus', title: 'Sanctus' },
  { id: 'theme_ Pater_noster', title: 'Pater noster' },
  { id: 'theme_agnus_dei', title: 'Agnus Dei' },
  { id: 'theme_aldozas', title: 'Áldozási ének' },
  { id: 'theme_kivonulas', title: 'Kivonulási ének' },
  { id: 'theme_egyeb', title: 'Egyéb' },
];

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'amint_vagyok.xml',
    title: 'Amint vagyok',
    author: 'Ismeretlen',
    content: `[V1]
Amint vagyok, csak úgy, mint egy semmire méltó,
.C          G              Am           F
De mert szavadra hittel jövök hozzád, bűnös lelkemet
.C              G              C               F
Te, Isten Báránya, fogadj el!
.   C      G        C`
  },
  {
    id: 'jezus_eletem.xml',
    title: 'Jézus életem',
    author: 'Ismeretlen',
    content: `[C]
Jézus életem, erőm, békém,
.G    D      Em   C
Jézus társam, örömöm.
.G    D      Em   C
Benned bízom, Te vagy az Úr,
.G          D        Em
Már nem éhezemszomjazom.
.C            D
Te vagy az én egyetlen kincsem,
.G            D          Em
Nincs más rajtad kívül,
.C            D
Kitől annyi jót kapnék.
.G        D        Em  C
Te vagy a legdrágább barát!
.G            D       G`
  },
  {
    id: 'szent_vagy_mindorokke.xml',
    title: 'Szent vagy mindörökké',
    author: 'Ismeretlen',
    content: `[V1]
Szent vagy, szent vagy, szent vagy, mindenség Ura, Istene!
.C         G         Am        F         C        G       C
Dicsőséged betölti a mennyet és a földet.
.F        C      Dm          G         C
Hozsanna a magasságban!
.F        G          C
[V2]
Áldott, aki jön az Úr nevében.
.F     C     Dm   G      C
Hozsanna a magasságban!
.F        G          C`
  }
];

export const COMMON_CHORDS = ['C', 'G', 'D', 'A', 'E', 'H', 'F#', 'F', 'B', 'Em', 'Am', 'Dm'];
export const VERSE_MARKERS = ['[V1]', '[V2]', '[V3]', '[V4]', '[C]', '[B]', '[I]', '[O]', '[P]'];
