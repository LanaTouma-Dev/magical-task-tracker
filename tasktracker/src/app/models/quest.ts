export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ColumnId = 'backlog' | 'battle' | 'defeated';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Quest {
  id: string;
  title: string;
  notes?: string;
  projectId?: string;
  rarity: Rarity;
  column: ColumnId;
  tags: string[];
  dueDate?: string;
  avatar?: string;
  subtasks?: Subtask[];
  xp: number;
  createdAt: string;
  completedAt?: string;
  archived?: boolean;
  archivedAt?: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
}

export interface Project {
  id: string;
  name: string;
  color: string; // hex
}

export interface AppSettings {
  autoArchiveDays: number; // 0 = disabled
  projects: Project[];
}

export const PROJECT_PALETTE = [
  '#B8336A', '#7B61FF', '#3D9BE9', '#36B37E',
  '#FF8B00', '#E05C97', '#00B8D9', '#6B3D82',
  '#C47A00', '#2D7A4F',
];

export const RARITY_XP: Record<Rarity, number> = {
  common: 5,
  rare: 20,
  epic: 50,
  legendary: 100,
};

export const RARITY_ICON: Record<Rarity, string> = {
  common:    'star',
  rare:      'shield-check',
  epic:      'zap',
  legendary: 'crown',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common:    'low',
  rare:      'medium',
  epic:      'high',
  legendary: 'critical',
};

export const COLUMNS: { id: ColumnId; title: string; icon: string }[] = [
  { id: 'backlog',  title: 'To do',       icon: 'circle-dashed' },
  { id: 'battle',   title: 'In progress', icon: 'loader'        },
  { id: 'defeated', title: 'Done',        icon: 'circle-check'  },
];
