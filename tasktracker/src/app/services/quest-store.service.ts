import { Injectable, computed, signal } from '@angular/core';
import { Quest, ColumnId, PlayerStats, RARITY_XP, AppSettings } from '../models/quest';
import { createPersistence, PersistShape } from './persistence';

export function xpForLevel(level: number): number {
  return 100 + level * 50;
}

const DEFAULT_SETTINGS: AppSettings = { autoArchiveDays: 7 };

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
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class QuestStore {
  private readonly _quests   = signal<Quest[]>([]);
  private readonly _stats    = signal<PlayerStats>({ level: 1, xp: 0, streak: 0, lastActiveDate: '' });
  private readonly _settings = signal<AppSettings>({ ...DEFAULT_SETTINGS });
  private readonly _loading  = signal(true);
  private readonly _focusToday   = signal(false);
  private readonly _showArchive  = signal(false);

  readonly quests      = this._quests.asReadonly();
  readonly stats       = this._stats.asReadonly();
  readonly settings    = this._settings.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly focusToday  = this._focusToday.asReadonly();
  readonly showArchive = this._showArchive.asReadonly();

  /** Live tasks visible on the board (not archived). */
  readonly liveQuests = computed(() => this._quests().filter(q => !q.archived));
  /** Archived tasks, newest first. */
  readonly archivedQuests = computed(() =>
    this._quests().filter(q => q.archived).sort((a, b) =>
      (b.archivedAt ?? '').localeCompare(a.archivedAt ?? '')
    )
  );

  toggleFocusToday()  { this._focusToday.update(v => !v); }
  toggleArchiveView() { this._showArchive.update(v => !v); }

  private readonly persistence = createPersistence();
  private saveChain: Promise<void> = Promise.resolve();

  constructor() {
    this.load();
    navigator.storage?.persist?.().catch(() => {});
  }

  /* ─── persistence ─── */

  private async load() {
    this._loading.set(true);
    try {
      const data = await this.persistence.load();
      if (data) {
        this._quests.set(data.quests ?? []);
        if (data.stats)    this._stats.set(data.stats);
        if (data.settings) this._settings.set({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch { /* start fresh */ }
    this._loading.set(false);
    this.runAutoArchive();
  }

  private persist() {
    const snapshot: PersistShape = {
      quests: this._quests(),
      stats: this._stats(),
      settings: this._settings(),
    };
    this.saveChain = this.saveChain
      .catch(() => {})
      .then(() => this.persistence.save(snapshot))
      .catch(() => {});
  }

  private awardXp(amount: number) {
    this._stats.update(s => {
      let { level, xp, streak } = s;
      const last = s.lastActiveDate;
      xp += amount;
      while (xp >= xpForLevel(level)) { xp -= xpForLevel(level); level++; }
      const today = todayStr();
      if (last) {
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        if (last === yesterday) streak++;
        else if (last < today)  streak = 1;
      } else { streak = 1; }
      return { level, xp, streak, lastActiveDate: today };
    });
  }

  /* ─── auto-archive ─── */

  private runAutoArchive() {
    const days = this._settings().autoArchiveDays;
    if (!days) return;
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    let changed = false;
    this._quests.update(list => list.map(q => {
      if (!q.archived && q.column === 'defeated' && q.completedAt && q.completedAt < cutoff) {
        changed = true;
        return { ...q, archived: true, archivedAt: new Date().toISOString() };
      }
      return q;
    }));
    if (changed) this.persist();
  }

  /* ─── settings ─── */

  updateSettings(patch: Partial<AppSettings>) {
    this._settings.update(s => ({ ...s, ...patch }));
    this.persist();
    this.runAutoArchive();
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
    const nowDefeated = to === 'defeated';
    this._quests.update(list =>
      list.map(q => q.id === id
        ? { ...q, column: to, completedAt: nowDefeated ? new Date().toISOString() : undefined }
        : q)
    );
    if (!quest.archived && quest.column !== 'defeated' && nowDefeated) this.awardXp(quest.xp);
    this.persist();
  }

  reorder(column: ColumnId, fromIndex: number, toIndex: number) {
    this._quests.update(list => {
      const col    = list.filter(q => q.column === column && !q.archived);
      const others = list.filter(q => q.column !== column || q.archived);
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
    this._quests.update(list => list.map(q => q.id === id ? { ...q, ...patch } : q));
    this.persist();
  }

  cloneLast() {
    const last = this.liveQuests()[0];
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

  /* ─── archive actions ─── */

  archiveTask(id: string) {
    this._quests.update(list =>
      list.map(q => q.id === id ? { ...q, archived: true, archivedAt: new Date().toISOString() } : q)
    );
    this.persist();
  }

  restoreTask(id: string) {
    this._quests.update(list =>
      list.map(q => q.id === id ? { ...q, archived: false, archivedAt: undefined, column: 'backlog' as ColumnId } : q)
    );
    this.persist();
  }

  deleteForever(id: string) {
    this._quests.update(list => list.filter(q => q.id !== id));
    this.persist();
  }

  clearArchive() {
    this._quests.update(list => list.filter(q => !q.archived));
    this.persist();
  }

  /* ─── backup / restore ─── */

  exportData(): string {
    return JSON.stringify({ quests: this._quests(), stats: this._stats(), settings: this._settings() }, null, 2);
  }

  importData(json: string): boolean {
    try {
      const data = JSON.parse(json) as PersistShape;
      if (!Array.isArray(data.quests)) return false;
      this._quests.set(data.quests);
      if (data.stats)    this._stats.set(data.stats);
      if (data.settings) this._settings.set({ ...DEFAULT_SETTINGS, ...data.settings });
      this.persist();
      return true;
    } catch { return false; }
  }
}
