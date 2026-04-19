import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Quest, Rarity } from '../../models/quest';

export interface QuestTemplate {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  tags: string[];
  dueDate?: string;
  avatar?: string;
  preset: boolean;
}

const PRESETS: QuestTemplate[] = [
  { id: 'standup',  name: 'Daily Standup',    title: 'Daily standup',            rarity: 'common',    tags: ['meeting'],                   dueDate: 'today', avatar: '☕', preset: true },
  { id: 'pr',       name: 'PR Review',        title: 'Review pull request: ',    rarity: 'rare',      tags: ['review','work'],                               avatar: '📝', preset: true },
  { id: 'bug',      name: 'Bug Fix',          title: 'Fix bug: ',                rarity: 'epic',      tags: ['bug','work'],                                  avatar: '🛠️', preset: true },
  { id: 'planning', name: 'Sprint Planning',  title: 'Sprint planning session',  rarity: 'rare',      tags: ['meeting','work'],                              avatar: '🗓️', preset: true },
  { id: 'docs',     name: 'Write Docs',       title: 'Write docs for: ',         rarity: 'common',    tags: ['docs'],                                        avatar: '📖', preset: true },
  { id: 'deploy',   name: 'Deploy',           title: 'Deploy to production',     rarity: 'legendary', tags: ['work','devops'],                               avatar: '🚀', preset: true },
  { id: 'retro',    name: 'Retrospective',    title: 'Sprint retrospective',     rarity: 'rare',      tags: ['meeting'],                                     avatar: '🔍', preset: true },
  { id: 'email',    name: 'Clear Inbox',      title: 'Clear inbox to zero',      rarity: 'common',    tags: ['admin'],                                       avatar: '📮', preset: true },
  { id: 'fe-feat',  name: 'Frontend Feature', title: 'Build frontend feature: ', rarity: 'epic',      tags: ['frontend','work'],                             avatar: '🎨', preset: true },
  { id: 'fe-fix',   name: 'Frontend Fix',     title: 'Fix frontend issue: ',     rarity: 'rare',      tags: ['frontend','bug'],                              avatar: '🖌️', preset: true },
  { id: 'fe-style', name: 'UI Styling',       title: 'Style component: ',        rarity: 'common',    tags: ['frontend','design'],                           avatar: '✨', preset: true },
  { id: 'be-feat',  name: 'Backend Feature',  title: 'Build backend feature: ',  rarity: 'epic',      tags: ['backend','work'],                              avatar: '⚙️', preset: true },
  { id: 'be-api',   name: 'API Endpoint',     title: 'Build API endpoint: ',     rarity: 'rare',      tags: ['backend','api'],                               avatar: '🔌', preset: true },
  { id: 'be-db',    name: 'DB Migration',     title: 'Write migration for: ',    rarity: 'epic',      tags: ['backend','database'],                          avatar: '🗄️', preset: true },
];

const STORAGE_KEY = 'qj.templates.v1';

@Component({
  selector: 'qj-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesComponent {
  @Output() spawn = new EventEmitter<Partial<Quest> & { title: string }>();
  @Output() closed = new EventEmitter<void>();

  open = signal(false);
  customTemplates = signal<QuestTemplate[]>(this.loadCustom());

  get generalTemplates()  { return PRESETS.filter(t => !t.tags.includes('frontend') && !t.tags.includes('backend')); }
  get frontendTemplates() { return PRESETS.filter(t => t.tags.includes('frontend')); }
  get backendTemplates()  { return PRESETS.filter(t => t.tags.includes('backend')); }

  toggle() { this.open.update(v => !v); }
  close()  { this.open.set(false); this.closed.emit(); }

  use(t: QuestTemplate) {
    this.spawn.emit({ title: t.title, rarity: t.rarity, tags: t.tags, dueDate: t.dueDate, avatar: t.avatar });
    this.close();
  }

  deleteCustom(id: string) {
    this.customTemplates.update(list => list.filter(t => t.id !== id));
    this.saveCustom();
  }

  saveFromQuest(quest: Quest) {
    const t: QuestTemplate = {
      id: Math.random().toString(36).slice(2),
      name: quest.title.slice(0, 30),
      title: quest.title,
      rarity: quest.rarity,
      tags: quest.tags,
      dueDate: quest.dueDate,
      avatar: quest.avatar,
      preset: false,
    };
    this.customTemplates.update(list => [t, ...list]);
    this.saveCustom();
  }

  private loadCustom(): QuestTemplate[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
  }
  private saveCustom() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customTemplates()));
  }
}
