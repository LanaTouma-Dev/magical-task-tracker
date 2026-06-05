import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { BoardComponent } from './components/board/board.component';
import { SpellSheetComponent } from './components/spell-sheet/spell-sheet.component';
import { EditQuestComponent } from './components/edit-quest/edit-quest.component';
import { TemplatesComponent } from './components/templates/templates.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { Quest } from './models/quest';
import { QuestStore, xpForLevel } from './services/quest-store.service';
import { ParserService } from './services/parser.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BoardComponent, SpellSheetComponent, EditQuestComponent, TemplatesComponent, SearchBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private store  = inject(QuestStore);
  private parser = inject(ParserService);
  private notifs = inject(NotificationService);

  constructor() { this.notifs.init(); }

  readonly stats = this.store.stats;
  readonly focusToday = this.store.focusToday;
  readonly input = signal('');

  toggleFocus() { this.store.toggleFocusToday(); }

  exportTasks() {
    const blob = new Blob([this.store.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importTasks(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = this.store.importData(String(reader.result));
      if (!ok) alert('Could not import that file — it does not look like a tasks backup.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  readonly parsed = computed(() => this.parser.parse(this.input()));

  readonly xpNeeded = computed(() => xpForLevel(this.stats().level));
  readonly xpPct = computed(() => Math.round((this.stats().xp / this.xpNeeded()) * 100));

  readonly sparkles = ['✦','✧','✦','✧','⋆','✦','✧'];
  editingQuest = signal<Quest | null>(null);

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target && /INPUT|TEXTAREA/.test(target.tagName)) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('.summon-input')?.focus();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      this.store.cloneLast();
    }
  }

  onInputChange(v: string) {
    this.input.set(v);
  }

  cast() {
    const p = this.parsed();
    if (!p.title.trim()) return;
    this.store.add({
      title: p.title,
      rarity: p.rarity,
      tags: p.tags,
      dueDate: p.dueDate,
    });
    this.input.set('');
  }

  openEdit(quest: Quest) { this.editingQuest.set(quest); }
  closeEdit()            { this.editingQuest.set(null); }

  spawnFromTemplate(partial: Partial<Quest> & { title: string }) {
    // Open the editor prefilled with the template so it can be tweaked before posting.
    // An empty id marks this as a draft (new task) rather than an edit.
    this.editingQuest.set({
      id: '',
      title: partial.title,
      notes: partial.notes,
      rarity: partial.rarity ?? 'common',
      column: 'backlog',
      tags: partial.tags ?? [],
      dueDate: partial.dueDate,
      avatar: partial.avatar,
      xp: 0,
      createdAt: '',
    });
  }

  trackByIndex(i: number) { return i; }

  onSummonKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.cast();
    }
  }
}
