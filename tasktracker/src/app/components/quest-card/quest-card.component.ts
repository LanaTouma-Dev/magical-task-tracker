import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Quest, RARITY_LABEL, RARITY_ICON } from '../../models/quest';
import { getUrgency, formatDueLabel, Urgency } from '../../utils/due-date.util';

@Component({
  selector: 'qj-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './quest-card.component.html',
  styleUrl: './quest-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestCardComponent {
  @Input({ required: true }) quest!: Quest;
  @Output() delete   = new EventEmitter<string>();
  @Output() edit     = new EventEmitter<Quest>();
  @Output() complete = new EventEmitter<string>();
  @Output() reopen   = new EventEmitter<string>();
  @Output() toggleSubtask = new EventEmitter<{ questId: string; subtaskId: string }>();

  readonly rarityLabels = RARITY_LABEL;
  readonly rarityIcons  = RARITY_ICON;

  get rarityClass() { return this.quest.rarity; }
  get isDone()      { return this.quest.column === 'defeated'; }
  get isBattling()  { return this.quest.column === 'battle'; }

  get urgency(): Urgency {
    return getUrgency(this.quest.dueDate, this.isDone);
  }

  get dueLabel(): string {
    return formatDueLabel(this.quest.dueDate, this.isDone, this.quest.completedAt);
  }

  onDelete(ev: Event)   { ev.stopPropagation(); this.delete.emit(this.quest.id); }
  onEdit(ev: Event)     { ev.stopPropagation(); this.edit.emit(this.quest); }
  onComplete(ev: Event) { ev.stopPropagation(); this.complete.emit(this.quest.id); }
  onReopen(ev: Event)   { ev.stopPropagation(); this.reopen.emit(this.quest.id); }

  @Input() projectColor: string | undefined;

  get subtasks()      { return this.quest.subtasks ?? []; }
  get subtaskDone()   { return this.subtasks.filter(s => s.done).length; }
  get subtaskTotal()  { return this.subtasks.length; }
  get subtaskPct()    { return this.subtaskTotal ? Math.round((this.subtaskDone / this.subtaskTotal) * 100) : 0; }

  onToggleSubtask(ev: Event, subtaskId: string) {
    ev.stopPropagation();
    this.toggleSubtask.emit({ questId: this.quest.id, subtaskId });
  }

  trackSub(_i: number, s: { id: string }) { return s.id; }
}
