import { Injectable, computed, inject, signal } from '@angular/core';
import { Quest, ColumnId, PlayerStats, RARITY_XP } from '../models/quest';
import { QuestApiService, ApiPlayerStats } from './quest-api.service';

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

function toClientQuest(raw: any): Quest {
  return {
    id: String(raw.id),
    title: raw.title,
    rarity: raw.rarity,
    column: raw.column,
    tags: raw.tags ?? [],
    dueDate: raw.due_date || undefined,
    avatar: raw.avatar || undefined,
    xp: raw.xp,
    createdAt: raw.created_at,
    completedAt: raw.completed_at ?? undefined,
  };
}

function toApiQuest(q: Partial<Quest> & { title: string }): Record<string, any> {
  return {
    title: q.title,
    rarity: q.rarity ?? 'common',
    column: q.column ?? 'backlog',
    tags: q.tags ?? [],
    due_date: q.dueDate ?? '',
    avatar: q.avatar ?? pickAvatar(q.rarity ?? 'common', q.tags ?? []),
    xp: RARITY_XP[q.rarity ?? 'common'],
  };
}

@Injectable({ providedIn: 'root' })
export class QuestStore {
  private api = inject(QuestApiService);

  private readonly _quests = signal<Quest[]>([]);
  private readonly _stats  = signal<PlayerStats>({ level: 1, xp: 0, streak: 0, lastActiveDate: '' });
  private readonly _loading = signal(true);

  readonly quests  = this._quests.asReadonly();
  readonly stats   = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.loadAll();
  }

  private loadAll() {
    this._loading.set(true);
    this.api.getQuests().subscribe({
      next: (raw: any[]) => {
        this._quests.set(raw.map(toClientQuest));
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
    this.api.getStats().subscribe({
      next: (s: ApiPlayerStats) => this._stats.set({
        level: s.level,
        xp: s.xp,
        streak: s.streak,
        lastActiveDate: s.last_active_date ?? '',
      }),
    });
  }

  /* ─── mutations ─── */

  add(partial: Partial<Quest> & { title: string }) {
    this.api.createQuest(toApiQuest(partial) as any).subscribe((raw: any) => {
      this._quests.update(list => [toClientQuest(raw), ...list]);
    });
  }

  move(id: string, to: ColumnId) {
    const quest = this._quests().find(q => q.id === id);
    if (!quest) return;
    // optimistic update
    this._quests.update(list =>
      list.map(q => q.id === id
        ? { ...q, column: to, completedAt: to === 'defeated' ? new Date().toISOString() : undefined }
        : q)
    );
    this.api.updateQuest(id, { column: to } as any).subscribe({
      next: (raw: any) => {
        // if XP was awarded server-side, refresh stats
        if (to === 'defeated') this.refreshStats();
        this._quests.update(list =>
          list.map(q => q.id === id ? toClientQuest(raw) : q)
        );
      },
      error: () => this.loadAll(), // rollback on error
    });
  }

  reorder(column: ColumnId, fromIndex: number, toIndex: number) {
    // optimistic local reorder
    this._quests.update(list => {
      const col    = list.filter(q => q.column === column);
      const others = list.filter(q => q.column !== column);
      const [moved] = col.splice(fromIndex, 1);
      col.splice(toIndex, 0, moved);
      return [...others, ...col];
    });
    const ids = this._quests().filter(q => q.column === column).map(q => q.id);
    this.api.reorderColumn(column, ids).subscribe();
  }

  remove(id: string) {
    this._quests.update(list => list.filter(q => q.id !== id));
    this.api.deleteQuest(id).subscribe({
      error: () => this.loadAll(),
    });
  }

  update(id: string, changes: Partial<Quest>) {
    const apiChanges: Record<string, any> = {};
    if (changes.title   !== undefined) apiChanges['title']    = changes.title;
    if (changes.rarity  !== undefined) { apiChanges['rarity'] = changes.rarity; apiChanges['xp'] = RARITY_XP[changes.rarity]; }
    if (changes.tags    !== undefined) apiChanges['tags']     = changes.tags;
    if (changes.dueDate !== undefined) apiChanges['due_date'] = changes.dueDate ?? '';

    this._quests.update(list =>
      list.map(q => q.id === id ? { ...q, ...changes } : q)
    );
    this.api.updateQuest(id, apiChanges as any).subscribe({
      next: (raw: any) => this._quests.update(list => list.map(q => q.id === id ? toClientQuest(raw) : q)),
      error: () => this.loadAll(),
    });
  }

  cloneLast() {
    const last = this._quests()[0];
    if (!last) return;
    this.api.cloneQuest(last.id).subscribe((raw: any) => {
      this._quests.update(list => [toClientQuest(raw), ...list]);
    });
  }

  private refreshStats() {
    this.api.getStats().subscribe((s: ApiPlayerStats) =>
      this._stats.set({
        level: s.level,
        xp: s.xp,
        streak: s.streak,
        lastActiveDate: s.last_active_date ?? '',
      })
    );
  }
}
