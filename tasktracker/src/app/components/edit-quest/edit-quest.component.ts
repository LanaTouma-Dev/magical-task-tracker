import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Quest, Rarity } from '../../models/quest';
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
  rarity: Rarity = 'common';
  dueDate = '';
  tagsRaw = '';

  readonly rarities: { value: Rarity; label: string; icon: string }[] = [
    { value: 'common',    label: 'Common',    icon: '★' },
    { value: 'rare',      label: 'Rare',      icon: '★★' },
    { value: 'epic',      label: 'Epic',      icon: '★★★' },
    { value: 'legendary', label: 'Legendary', icon: '★★★★' },
  ];

  ngOnChanges() {
    if (this.quest) {
      this.title   = this.quest.title;
      this.rarity  = this.quest.rarity;
      this.dueDate = this.quest.dueDate ?? '';
      this.tagsRaw = this.quest.tags.join(' #').replace(/^/, this.quest.tags.length ? '#' : '');
    }
  }

  save() {
    if (!this.quest || !this.title.trim()) return;
    const tags = this.tagsRaw
      .split(/[\s,]+/)
      .filter(t => t.startsWith('#'))
      .map(t => t.slice(1).toLowerCase())
      .filter(Boolean);

    this.store.update(this.quest.id, {
      title:   this.title.trim(),
      rarity:  this.rarity,
      dueDate: this.dueDate.trim() || undefined,
      tags,
    });
    this.closed.emit();
  }

  discard() { this.closed.emit(); }

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.closed.emit();
  }
}
