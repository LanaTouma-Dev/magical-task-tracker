import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { QuestStore } from '../../services/quest-store.service';
import { COLUMNS, ColumnId, Quest, Subtask } from '../../models/quest';
import { QuestCardComponent } from '../quest-card/quest-card.component';
import { getUrgency } from '../../utils/due-date.util';

@Component({
  selector: 'qj-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, QuestCardComponent, LucideAngularModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private store = inject(QuestStore);
  readonly columns = COLUMNS;

  @Output() editQuest = new EventEmitter<Quest>();

  readonly questsByColumn = computed(() => {
    const focus = this.store.focusToday();
    const map = new Map<ColumnId, Quest[]>();
    for (const col of this.columns) map.set(col.id, []);
    for (const q of this.store.liveQuests()) {
      if (focus) {
        const u = getUrgency(q.dueDate, q.column === 'defeated');
        if (u !== 'urgent' && u !== 'overdue') continue;
      }
      map.get(q.column)?.push(q);
    }
    return map;
  });

  questsIn(col: ColumnId): Quest[] {
    return this.questsByColumn().get(col) ?? [];
  }

  readonly focusToday = this.store.focusToday;
  readonly focusEmpty = computed(() => {
    if (!this.store.focusToday()) return false;
    const map = this.questsByColumn();
    return [...map.values()].every(list => list.length === 0);
  });

  readonly connectedIds = COLUMNS.map(c => 'col-' + c.id);

  drop(event: CdkDragDrop<Quest[]>, targetCol: ColumnId) {
    const quest: Quest = event.item.data;
    if (event.previousContainer === event.container) {
      this.store.reorder(targetCol, event.previousIndex, event.currentIndex);
    } else {
      this.store.move(quest.id, targetCol);
    }
  }

  trackCol(_i: number, col: { id: ColumnId }) { return col.id; }
  trackQuest(_i: number, q: Quest) { return q.id; }

  onDelete(id: string)   { this.store.remove(id); }
  onEdit(quest: Quest)   { this.editQuest.emit(quest); }
  onComplete(id: string) { this.store.move(id, 'defeated'); }
  onReopen(id: string)   { this.store.move(id, 'backlog'); }

  onToggleSubtask(e: { questId: string; subtaskId: string }) {
    const q = this.store.quests().find(x => x.id === e.questId);
    if (!q?.subtasks) return;
    const subtasks: Subtask[] = q.subtasks.map(s =>
      s.id === e.subtaskId ? { ...s, done: !s.done } : s
    );
    this.store.update(e.questId, { subtasks });
  }
}
