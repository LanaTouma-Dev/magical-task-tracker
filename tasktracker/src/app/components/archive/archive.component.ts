import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { QuestStore } from '../../services/quest-store.service';
import { RARITY_LABEL } from '../../models/quest';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="archive-backdrop" (click)="onBackdrop($event)">
  <div class="archive-panel">

    <div class="archive-header">
      <div class="archive-title">
        <lucide-angular name="archive" [size]="20" [strokeWidth]="1.75"></lucide-angular>
        Archive
        <span class="archive-count" *ngIf="store.archivedQuests().length">{{ store.archivedQuests().length }}</span>
      </div>
      <div class="archive-header-right">
        <button class="clear-btn" *ngIf="store.archivedQuests().length"
                (click)="confirmClear()" title="Permanently delete all archived tasks">
          <lucide-angular name="trash-2" [size]="13" [strokeWidth]="2"></lucide-angular>
          Clear all
        </button>
        <button class="close-btn" (click)="store.toggleArchiveView()">
          <lucide-angular name="x" [size]="16" [strokeWidth]="2"></lucide-angular>
        </button>
      </div>
    </div>

    <!-- Settings row -->
    <div class="archive-settings">
      <lucide-angular name="settings" [size]="13" [strokeWidth]="1.75"></lucide-angular>
      <span>Auto-archive Done tasks after</span>
      <select class="days-select" [ngModel]="store.settings().autoArchiveDays"
              (ngModelChange)="store.updateSettings({ autoArchiveDays: +$event })">
        <option [value]="0">Never</option>
        <option [value]="1">1 day</option>
        <option [value]="3">3 days</option>
        <option [value]="7">7 days</option>
        <option [value]="14">14 days</option>
        <option [value]="30">30 days</option>
        <option [value]="60">60 days</option>
      </select>
    </div>

    <!-- Empty state -->
    <div class="archive-empty" *ngIf="!store.archivedQuests().length">
      <lucide-angular name="inbox" [size]="32" [strokeWidth]="1.25"></lucide-angular>
      <p>Nothing archived yet.</p>
      <p class="archive-empty-sub">Completed tasks will appear here automatically after the configured number of days.</p>
    </div>

    <!-- List -->
    <ul class="archive-list" *ngIf="store.archivedQuests().length">
      <li class="archive-item" *ngFor="let q of store.archivedQuests()">
        <div class="archive-item-left">
          <span class="archive-rarity" [class]="q.rarity">{{ rarityLabel[q.rarity] }}</span>
          <span class="archive-item-title">{{ q.title }}</span>
          <span class="archive-tags" *ngIf="q.tags.length">
            <span class="tag" *ngFor="let t of q.tags">#{{ t }}</span>
          </span>
        </div>
        <div class="archive-item-right">
          <span class="archive-date">{{ formatDate(q.archivedAt) }}</span>
          <button class="restore-btn" (click)="store.restoreTask(q.id)" title="Restore to To do">
            <lucide-angular name="rotate-ccw" [size]="13" [strokeWidth]="2"></lucide-angular>
            Restore
          </button>
          <button class="del-btn" (click)="store.deleteForever(q.id)" title="Delete forever">
            <lucide-angular name="x" [size]="13" [strokeWidth]="2.5"></lucide-angular>
          </button>
        </div>
      </li>
    </ul>

  </div>
</div>
  `,
  styleUrl: './archive.component.scss',
})
export class ArchiveComponent {
  readonly store = inject(QuestStore);
  readonly rarityLabel = RARITY_LABEL;

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('archive-backdrop'))
      this.store.toggleArchiveView();
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  confirmClear() {
    if (confirm(`Permanently delete all ${this.store.archivedQuests().length} archived tasks? This cannot be undone.`))
      this.store.clearArchive();
  }
}
