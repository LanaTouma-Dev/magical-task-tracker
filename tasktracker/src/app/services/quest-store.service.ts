import { Injectable, signal } from '@angular/core';
import { Quest, ColumnId, PlayerStats, RARITY_XP } from '../models/quest';
import { createPersistence, PersistShape } from './persistence';

export function xpForLevel(level: number): number {
  return 100 + level * 50;
}

function pickAvatar(rarity: string, tags: string[]): string {
  if (tags.includes('bug'))      return '🛠️';
  if (tags.includes('meeting'))  return '☕';
  if (tags.includes('design'))   return '✨';
  if (tags.includes('review'))   return '📝';
  if (tags.includes('learning')) return '📖';
  if (tags.includes('admin'))    return '📮';
  if (rarity === 'legendary')    return '👑';
  if (rarity === 'epic')         return '⚔️';
  if (rarity === 'rare')         return '🔮';
  return '🌸';
}

function newId(): string {
  return (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

@Injectable({ providedIn: 'root' })
export class QuestStore {
  private readonly _quests = signal<Quest[]>([]);
  private readonly _stats  = signal<PlayerStats>({ level: 1, xp: 0, streak: 0, lastActiveDate: '' });
  private readonly _loading = signal(true);

  private readonly _focusToday = signal(false);

  readonly quests     = this._quests.asReadonly();
  readonly stats      = this._stats.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly focusToday = this._focusToday.asReadonly();

  toggleFocusToday() { this._focusToday.update(v => !v); }

  private readonly persistence = createPersistence();
  /** Serializes writes so overlapping saves can't race each other. */
  private saveChain: Promise<void> = Promise.resolve();

  constructor() {
    this.load();
    // In the browser PWA, ask to keep data safe from eviction. (No-op in Tauri,
    // where SQLite lives on disk and isn't subject to browser storage clearing.)
    navigator.storage?.persist?.().catch(() => {});
  }

  /* ─── persistence ─── */

  private async load() {
    this._loading.set(true);
    try {
      const data = await this.persistence.load();
      if (data) {
        this._quests.set(data.quests ?? []);
        if (data.stats) this._stats.set(data.stats);
      }
    } catch {
      /* unreadable store — start fresh rather than crash */
    }
    this._loading.set(false);
  }

  private persist() {
    const snapshot = { quests: this._quests(), stats: this._stats() };
    this.saveChain = this.saveChain
      .catch(() => {})
      .then(() => this.persistence.save(snapshot))
      .catch(() => { /* keep running in-memory if a write fails */ });
  }

  /** Award XP, handle level-ups and the daily streak. Mirrors the old backend logic. */
  private awardXp(amount: number) {
    this._stats.update(s => {
      let { level, xp, streak } = s;
      const last = s.lastActiveDate;
      xp += amount;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
      }
      const today = todayStr();
      if (last) {
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        if (last === yesterday) streak += 1;
        else if (last < today)  streak = 1; // gap of 2+ days (or any past day that isn't yesterday)
        // last === today → unchanged
      } else {
        streak = 1;
      }
      return { level, xp, streak, lastActiveDate: today };
    });
  }

  /* ─── mutations ─── */

  add(partial: Partial<Quest> & { title: string }) {
    const quest: Quest = {
      id: newId(),
      title: partial.title,
      notes: partial.notes || undefined,
      rarity: partial.rarity ?? 'common',
      column: partial.column ?? 'backlog',
      tags: partial.tags ?? [],
      dueDate: partial.dueDate || undefined,
      avatar: partial.avatar ?? pickAvatar(partial.rarity ?? 'common', partial.tags ?? []),
      subtasks: partial.subtasks ?? [],
      xp: RARITY_XP[partial.rarity ?? 'common'],
      createdAt: new Date().toISOString(),
    };
    this._quests.update(list => [quest, ...list]);
    this.persist();
  }

  move(id: string, to: ColumnId) {
    const quest = this._quests().find(q => q.id === id);
    if (!quest) return;
    const wasDefeated = quest.column === 'defeated';
    const nowDefeated = to === 'defeated';

    this._quests.update(list =>
      list.map(q => q.id === id
        ? { ...q, column: to, completedAt: nowDefeated ? new Date().toISOString() : undefined }
        : q)
    );

    if (!wasDefeated && nowDefeated) this.awardXp(quest.xp);
    this.persist();
  }

  reorder(column: ColumnId, fromIndex: number, toIndex: number) {
    this._quests.update(list => {
      const col    = list.filter(q => q.column === column);
      const others = list.filter(q => q.column !== column);
      const [moved] = col.splice(fromIndex, 1);
      col.splice(toIndex, 0, moved);
      return [...others, ...col];
    });
    this.persist();
  }

  remove(id: string) {
    this._quests.update(list => list.filter(q => q.id !== id));
    this.persist();
  }

  update(id: string, changes: Partial<Quest>) {
    const patch: Partial<Quest> = { ...changes };
    if (changes.rarity !== undefined) patch.xp = RARITY_XP[changes.rarity];
    this._quests.update(list =>
      list.map(q => q.id === id ? { ...q, ...patch } : q)
    );
    this.persist();
  }

  cloneLast() {
    const last = this._quests()[0];
    if (!last) return;
    this.add({
      title: last.title + ' (clone)',
      notes: last.notes,
      rarity: last.rarity,
      tags: [...last.tags],
      dueDate: last.dueDate,
      avatar: last.avatar,
      subtasks: (last.subtasks ?? []).map(s => ({ ...s, done: false })),
    });
  }

  /* ─── backup / restore ─── */

  exportData(): string {
    return JSON.stringify({ quests: this._quests(), stats: this._stats() }, null, 2);
  }

  importData(json: string): boolean {
    try {
      const data = JSON.parse(json) as PersistShape;
      if (!Array.isArray(data.quests)) return false;
      this._quests.set(data.quests);
      if (data.stats) this._stats.set(data.stats);
      this.persist();
      return true;
    } catch {
      return false;
    }
  }
}
