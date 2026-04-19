import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { QuestStore } from '../../services/quest-store.service';
import { Quest, Rarity } from '../../models/quest';
import { getUrgency } from '../../utils/due-date.util';

type RarityFilter = Rarity | 'all';
type UrgencyFilter = 'all' | 'overdue' | 'urgent' | 'soon';

@Component({
  selector: 'qj-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private store = inject(QuestStore);

  query       = signal('');
  rarity      = signal<RarityFilter>('all');
  urgency     = signal<UrgencyFilter>('all');
  showFilters = signal(false);

  readonly rarityOptions: { value: RarityFilter; label: string }[] = [
    { value: 'all',       label: 'All'       },
    { value: 'common',    label: '★ Common'   },
    { value: 'rare',      label: '★★ Rare'    },
    { value: 'epic',      label: '★★★ Epic'   },
    { value: 'legendary', label: '★★★★ Boss'  },
  ];

  readonly urgencyOptions: { value: UrgencyFilter; label: string }[] = [
    { value: 'all',     label: 'Any date'  },
    { value: 'overdue', label: '💀 Overdue' },
    { value: 'urgent',  label: '🔥 Today'   },
    { value: 'soon',    label: '⚡ Soon'    },
  ];

  readonly results = computed<Quest[]>(() => {
    const q  = this.query().toLowerCase().trim();
    const r  = this.rarity();
    const u  = this.urgency();
    if (!q && r === 'all' && u === 'all') return [];

    return this.store.quests().filter(quest => {
      const matchQ = !q || quest.title.toLowerCase().includes(q)
        || quest.tags.some(t => t.includes(q));
      const matchR = r === 'all' || quest.rarity === r;
      const matchU = u === 'all' || getUrgency(quest.dueDate, quest.column === 'defeated') === u;
      return matchQ && matchR && matchU;
    });
  });

  readonly isActive = computed(() =>
    this.query().trim() !== '' || this.rarity() !== 'all' || this.urgency() !== 'all'
  );

  readonly resultCount = computed(() => this.results().length);

  toggleFilters() { this.showFilters.update(v => !v); }

  clear() {
    this.query.set('');
    this.rarity.set('all');
    this.urgency.set('all');
  }

  columnIcon(col: string) {
    return col === 'backlog' ? 'scroll' : col === 'battle' ? 'sword' : 'trophy';
  }
}
