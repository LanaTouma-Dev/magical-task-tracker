import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { QuestStore } from '../../services/quest-store.service';
import { COLUMNS, ColumnId, Quest } from '../../models/quest';
import { QuestCardComponent } from '../quest-card/quest-card.component';

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
    const map = new Map<ColumnId, Quest[]>();
    for (const col of this.columns) map.set(col.id, []);
    for (const q of this.store.quests()) map.get(q.column)?.push(q);
    return map;
  });

  questsIn(col: ColumnId): Quest[] {
    return this.questsByColumn().get(col) ?? [];
  }

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

  onDelete(id: string) { this.store.remove(id); }
  onEdit(quest: Quest)  { this.editQuest.emit(quest); }
}
