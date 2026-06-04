export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ColumnId = 'backlog' | 'battle' | 'defeated';

export interface Quest {
  id: string;
  title: string;
  rarity: Rarity;
  column: ColumnId;
  tags: string[];
  dueDate?: string;       // ISO date or relative token ("fri", "mon", "3d")
  avatar?: string;        // emoji
  xp: number;
  createdAt: string;
  completedAt?: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
}

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
  legendary: 'skull',
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
  { id: 'defeated', title: 'Done',        icon: 'check-circle'  },
];
