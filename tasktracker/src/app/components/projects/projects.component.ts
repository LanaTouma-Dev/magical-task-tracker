import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { QuestStore } from '../../services/quest-store.service';
import { Project, PROJECT_PALETTE } from '../../models/quest';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  readonly store = inject(QuestStore);
  readonly palette = PROJECT_PALETTE;

  managing = signal(false);
  newName  = signal('');
  newColor = signal(PROJECT_PALETTE[0]);
  editingId = signal<string | null>(null);
  editName  = signal('');
  editColor = signal('');

  get projects() { return this.store.projects(); }
  get active()   { return this.store.activeProject(); }

  selectProject(id: string | null) {
    this.store.setActiveProject(this.active === id ? null : id);
  }

  startAdd() {
    // pick next unused palette color
    const used = this.projects.map(p => p.color);
    const next = this.palette.find(c => !used.includes(c)) ?? this.palette[0];
    this.newColor.set(next);
    this.newName.set('');
    this.managing.set(true);
  }

  confirmAdd() {
    const name = this.newName().trim();
    if (!name) return;
    const proj = this.store.addProject(name, this.newColor());
    this.store.setActiveProject(proj.id);
    this.managing.set(false);
  }

  startEdit(p: Project) {
    this.editingId.set(p.id);
    this.editName.set(p.name);
    this.editColor.set(p.color);
  }

  confirmEdit() {
    const id = this.editingId();
    if (!id) return;
    this.store.updateProject(id, { name: this.editName().trim(), color: this.editColor() });
    this.editingId.set(null);
  }

  deleteProject(id: string) {
    if (confirm('Delete this project? Tasks will remain but lose their project label.'))
      this.store.deleteProject(id);
  }

  taskCount(projectId: string) {
    return this.store.allLiveQuests().filter(q => q.projectId === projectId).length;
  }
}
