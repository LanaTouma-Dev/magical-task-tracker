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
  @Output() delete = new EventEmitter<string>();
  @Output() edit   = new EventEmitter<Quest>();

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

  onDelete(ev: Event) { ev.stopPropagation(); this.delete.emit(this.quest.id); }
  onEdit(ev: Event)   { ev.stopPropagation(); this.edit.emit(this.quest); }
}
