import { Quest, PlayerStats, AppSettings } from '../models/quest';

export interface PersistShape {
  quests: Quest[];
  stats: PlayerStats;
  settings?: AppSettings;
}

export interface TaskPersistence {
  readonly kind: 'sqlite' | 'localstorage';
  load(): Promise<PersistShape | null>;
  save(data: PersistShape): Promise<void>;
}

const LS_KEY = 'quest-journal.data.v1';

/** Browser fallback — used when NOT running inside the Tauri desktop shell. */
class LocalStoragePersistence implements TaskPersistence {
  readonly kind = 'localstorage' as const;

  async load(): Promise<PersistShape | null> {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as PersistShape) : null;
    } catch {
      return null;
    }
  }

  async save(data: PersistShape): Promise<void> {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* storage full / unavailable */
    }
  }
}

/** Desktop: a real on-disk SQLite database via the Tauri SQL plugin. */
class SqlitePersistence implements TaskPersistence {
  readonly kind = 'sqlite' as const;
  private dbPromise: Promise<any> | null = null;

  private async db(): Promise<any> {
    if (!this.dbPromise) {
      // Loaded lazily so the browser bundle never touches Tauri APIs.
      this.dbPromise = import('@tauri-apps/plugin-sql').then(m => m.default.load('sqlite:tasks.db'));
    }
    return this.dbPromise;
  }

  async load(): Promise<PersistShape | null> {
    const db = await this.db();
    const rows: any[] = await db.select(
      'SELECT * FROM quests ORDER BY sort_order ASC, created_at ASC'
    );
    const quests: Quest[] = rows.map(r => ({
      id: r.id,
      title: r.title,
      notes: r.notes ?? undefined,
      rarity: r.rarity,
      column: r.col,
      tags: safeJson(r.tags, []),
      dueDate: r.due_date ?? undefined,
      avatar: r.avatar ?? undefined,
      subtasks: safeJson(r.subtasks, []),
      xp: r.xp,
      createdAt: r.created_at,
      completedAt: r.completed_at ?? undefined,
    }));

    const statRows: any[] = await db.select('SELECT * FROM player_stats WHERE id = 1');
    const s = statRows[0];
    const stats: PlayerStats | undefined = s
      ? { level: s.level, xp: s.xp, streak: s.streak, lastActiveDate: s.last_active_date ?? '' }
      : undefined;

    return { quests, stats: stats ?? { level: 1, xp: 0, streak: 0, lastActiveDate: '' } };
  }

  async save(data: PersistShape): Promise<void> {
    const db = await this.db();
    // Wholesale rewrite — data is small (a personal task list) and this keeps
    // ordering trivially correct (sort_order = position in the list).
    await db.execute('DELETE FROM quests');
    for (let i = 0; i < data.quests.length; i++) {
      const q = data.quests[i];
      await db.execute(
        `INSERT INTO quests
          (id, title, notes, rarity, col, tags, due_date, avatar, subtasks, xp, created_at, completed_at, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          q.id,
          q.title,
          q.notes ?? null,
          q.rarity,
          q.column,
          JSON.stringify(q.tags ?? []),
          q.dueDate ?? null,
          q.avatar ?? null,
          JSON.stringify(q.subtasks ?? []),
          q.xp,
          q.createdAt,
          q.completedAt ?? null,
          i,
        ]
      );
    }
    const s = data.stats;
    await db.execute(
      'UPDATE player_stats SET level = $1, xp = $2, streak = $3, last_active_date = $4 WHERE id = 1',
      [s.level, s.xp, s.streak, s.lastActiveDate ?? '']
    );
  }
}

function safeJson<T>(value: any, fallback: T): T {
  if (Array.isArray(value)) return value as T;
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Pick SQLite inside Tauri, localStorage in a plain browser. */
export function createPersistence(): TaskPersistence {
  const inTauri = !!(globalThis as any).__TAURI_INTERNALS__;
  return inTauri ? new SqlitePersistence() : new LocalStoragePersistence();
}
