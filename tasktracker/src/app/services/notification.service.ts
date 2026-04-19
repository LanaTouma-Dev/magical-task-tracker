import { Injectable, inject } from '@angular/core';
import { QuestStore } from './quest-store.service';
import { parseDueDate } from '../utils/due-date.util';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private store = inject(QuestStore);
  private granted = false;
  private notified = new Set<string>(); // track which quests already notified this session

  async init() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      this.granted = true;
    } else if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      this.granted = result === 'granted';
    }

    if (this.granted) {
      this.check();
      // check every 30 minutes
      setInterval(() => this.check(), 30 * 60 * 1000);
      // also check when window regains focus
      window.addEventListener('focus', () => this.check());
    }
  }

  private check() {
    const active = this.store.quests().filter(q => q.column !== 'defeated');
    const today  = new Date(); today.setHours(0, 0, 0, 0);

    for (const quest of active) {
      if (!quest.dueDate || this.notified.has(quest.id)) continue;

      const due = parseDueDate(quest.dueDate);
      if (!due) continue;

      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400_000);

      if (diffDays < 0) {
        this.notify(
          `💀 Overdue Quest`,
          `"${quest.title}" was due ${Math.abs(diffDays)}d ago — time to slay it!`,
          quest.id
        );
      } else if (diffDays === 0) {
        this.notify(
          `🔥 Due Today`,
          `"${quest.title}" must be defeated today!`,
          quest.id
        );
      } else if (diffDays === 1) {
        this.notify(
          `⚡ Due Tomorrow`,
          `"${quest.title}" is due tomorrow — gear up!`,
          quest.id
        );
      }
    }
  }

  private notify(title: string, body: string, questId: string) {
    this.notified.add(questId);
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: questId, // prevents duplicate system notifications
    });
  }
}
