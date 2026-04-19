import { Injectable } from '@angular/core';
import { Quest, Rarity } from '../models/quest';

export interface ParsedQuest {
  title: string;
  rarity: Rarity;
  tags: string[];
  dueDate?: string;
  chips: { kind: 'prio' | 'date' | 'tag'; label: string }[];
}

const PRIORITY_MAP: Record<string, Rarity> = {
  low:       'common',
  common:    'common',
  med:       'rare',
  medium:    'rare',
  rare:      'rare',
  high:      'epic',
  epic:      'epic',
  boss:      'legendary',
  legendary: 'legendary',
};

const DATE_WORDS = new Set([
  'today','tomorrow','tmr',
  'mon','tue','wed','thu','fri','sat','sun',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
]);

const RELATIVE_RE = /^\d+(d|w)$/i;

@Injectable({ providedIn: 'root' })
export class ParserService {
  parse(raw: string): ParsedQuest {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    const titleParts: string[] = [];
    const tags: string[] = [];
    const chips: ParsedQuest['chips'] = [];
    let rarity: Rarity = 'common';
    let dueDate: string | undefined;

    for (const tok of tokens) {
      if (tok.startsWith('!')) {
        const key = tok.slice(1).toLowerCase();
        const mapped = PRIORITY_MAP[key];
        if (mapped) {
          rarity = mapped;
          chips.push({ kind: 'prio', label: tok });
          continue;
        }
      }
      if (tok.startsWith('#') && tok.length > 1) {
        const tag = tok.slice(1).toLowerCase();
        tags.push(tag);
        chips.push({ kind: 'tag', label: tok });
        continue;
      }
      const low = tok.toLowerCase();
      if (DATE_WORDS.has(low) || RELATIVE_RE.test(low)) {
        dueDate = low;
        chips.push({ kind: 'date', label: low });
        continue;
      }
      titleParts.push(tok);
    }

    const title = titleParts.join(' ');
    return { title, rarity, tags, dueDate, chips };
  }
}
