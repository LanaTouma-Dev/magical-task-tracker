/**
 * Django REST backend client — PARKED, not currently wired up.
 *
 * As of the local-storage switch, QuestStore persists everything to the
 * browser (localStorage) and this service is intentionally unused. It is kept
 * intact so the Django backend (tasktrackerbackend/) can be re-enabled later
 * (e.g. for multi-device sync) by pointing QuestStore back at it.
 *
 * Nothing imports this service today, so it is tree-shaken out of the bundle.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quest } from '../models/quest';

export interface ApiPlayerStats {
  id: number;
  level: number;
  xp: number;
  streak: number;
  last_active_date: string | null;
  xp_needed: number;
}

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class QuestApiService {
  private http = inject(HttpClient);

  getQuests(): Observable<Quest[]> {
    return this.http.get<Quest[]>(`${API}/quests/`);
  }

  createQuest(data: Partial<Quest>): Observable<Quest> {
    return this.http.post<Quest>(`${API}/quests/`, data);
  }

  updateQuest(id: string, data: Partial<Quest>): Observable<Quest> {
    return this.http.patch<Quest>(`${API}/quests/${id}/`, data);
  }

  deleteQuest(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/quests/${id}/`);
  }

  cloneQuest(id: string): Observable<Quest> {
    return this.http.post<Quest>(`${API}/quests/${id}/clone/`, {});
  }

  reorderColumn(column: string, ids: string[]): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API}/quests/reorder/`, { column, ids });
  }

  getStats(): Observable<ApiPlayerStats> {
    return this.http.get<ApiPlayerStats>(`${API}/stats/me/`);
  }
}
