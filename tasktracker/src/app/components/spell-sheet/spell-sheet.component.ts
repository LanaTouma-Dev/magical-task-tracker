import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'qj-spell-sheet',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './spell-sheet.component.html',
  styleUrl: './spell-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellSheetComponent {
  open = signal(false);
  toggle() { this.open.update(v => !v); }
  close() { this.open.set(false); }
}
