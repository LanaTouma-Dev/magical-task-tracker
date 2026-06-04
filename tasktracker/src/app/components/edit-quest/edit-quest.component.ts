import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Quest, Rarity, Subtask } from '../../models/quest';
import { QuestStore } from '../../services/quest-store.service';

@Component({
  selector: 'qj-edit-quest',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-quest.component.html',
  styleUrl: './edit-quest.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditQuestComponent implements OnChanges {
  @Input() quest: Quest | null = null;
  @Output() closed = new EventEmitter<void>();

  private store = inject(QuestStore);

  title   = '';
  notes   = '';
  rarity: Rarity = 'common';
  dueDate = '';
  tagsRaw = '';
  subtasks: Subtask[] = [];
  newSubtask = '';
  private avatar: string | undefined;

  readonly rarities: { value: Rarity; label: string; icon: string }[] = [
    { value: 'common',    label: 'Low',      icon: '★' },
    { value: 'rare',      label: 'Medium',   icon: '★★' },
    { value: 'epic',      label: 'High',     icon: '★★★' },
    { value: 'legendary', label: 'Critical', icon: '★★★★' },
  ];

  /** A quest without an id is a draft (e.g. from a template) not yet saved. */
  get isNew() { return !this.quest?.id; }

  ngOnChanges() {
    if (this.quest) {
      this.title   = this.quest.title;
      this.notes   = this.quest.notes ?? '';
      this.rarity  = this.quest.rarity;
      this.dueDate = this.quest.dueDate ?? '';
      this.avatar  = this.quest.avatar;
      this.subtasks = (this.quest.subtasks ?? []).map(s => ({ ...s }));
      this.newSubtask = '';
      this.tagsRaw = this.quest.tags.join(' #').replace(/^/, this.quest.tags.length ? '#' : '');
    }
  }

  addSubtask() {
    const title = this.newSubtask.trim();
    if (!title) return;
    this.subtasks = [...this.subtasks, { id: Math.random().toString(36).slice(2), title, done: false }];
    this.newSubtask = '';
  }

  toggleSubtask(id: string) {
    this.subtasks = this.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
  }

  removeSubtask(id: string) {
    this.subtasks = this.subtasks.filter(s => s.id !== id);
  }

  save() {
    if (!this.quest || !this.title.trim()) return;
    const tags = this.tagsRaw
      .split(/[\s,]+/)
      .filter(t => t.startsWith('#'))
      .map(t => t.slice(1).toLowerCase())
      .filter(Boolean);

    const changes = {
      title:   this.title.trim(),
      notes:   this.notes.trim() || undefined,
      rarity:  this.rarity,
      dueDate: this.dueDate.trim() || undefined,
      tags,
      subtasks: this.subtasks,
    };

    if (this.isNew) {
      this.store.add({ ...changes, avatar: this.avatar });
    } else {
      this.store.update(this.quest.id, changes);
    }
    this.closed.emit();
  }

  discard() { this.closed.emit(); }

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.closed.emit();
  }
}
