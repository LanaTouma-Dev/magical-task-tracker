# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Quest Journal** — a personal task tracker with an RPG/magical girl aesthetic. Tasks are "quests" with rarity tiers (Common/Rare/Epic/Legendary), XP rewards, and a leveling/streak system.

**Stack:** Angular 18 (frontend, `tasktracker/`) + Django 5 REST API (backend, `tasktrackerbackend/`)

---

## Commands

### Frontend (`cd tasktracker`)
```bash
npm install          # install deps
npm start            # dev server → http://localhost:4200 (alias: ng serve)
npm run build        # production build → dist/tasktracker/
npm test             # Karma + Jasmine tests
```

### Backend (`cd tasktrackerbackend`)
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver       # → http://localhost:8000
python manage.py createsuperuser # for /admin
```

---

## Architecture

### Frontend (Angular 18, standalone components + signals)

**Persistence: local-first.** `quest-store.service.ts` persists all state to the browser (`localStorage`, key `quest-journal.data.v1`) and owns the XP/level/streak logic client-side. The app ships as an installable PWA (`npm run pwa`) and runs fully offline with no server. Backup via the Export/Import buttons. **The Django backend is parked, not wired up** — see "Backend" below.

**State management** lives entirely in `tasktracker/src/app/services/quest-store.service.ts`. It uses Angular `signal()` / `computed()` primitives (no RxJS subjects).

**Key services:**
- `quest-store.service.ts` — central state: `quests`, `stats`, `loading`, `focusToday` signals; methods `add()`, `move()`, `reorder()`, `update()`, `remove()`, `cloneLast()`, `exportData()`, `importData()`
- `quest-api.service.ts` — **PARKED** thin HttpClient wrapper (base URL `http://localhost:8000/api`). Currently unused/tree-shaken; retained so the backend can be re-enabled for sync later.
- `parser.service.ts` — natural language parser (input: `"fix login !high fri #work"` → `{ title, rarity, tags, dueDate }`)
- `notification.service.ts` — browser Notification API, polls overdue quests every 30 min

**Parser token syntax:**
- `!low` / `!med` / `!high` / `!boss` → rarity (common/rare/epic/legendary)
- `today`, `tomorrow`, `mon`–`sun`, `3d`, `1w` → due dates
- `#tag` → tags (multiple allowed)
- All other words → quest title

**Component tree:** `AppComponent` (root shell, summon bar, stats topbar) → `BoardComponent` (CDK drag-drop kanban) → `QuestCardComponent`. Modals: `EditQuestComponent`, `SpellSheetComponent`, `TemplatesComponent`. No Angular Router — single page with modal overlays.

### Backend (Django 5 + DRF) — PARKED

> The frontend no longer calls this backend (it went local-first / PWA). The Django code is kept intact and runnable for a future sync feature; keep models in sync with `quest.ts`. To re-enable, point `QuestStore` back at `quest-api.service.ts`.

**Models** (`quests/models.py`):
- `Quest` — `title`, `rarity`, `column` (backlog/battle/defeated), `tags` (JSONField), `due_date`, `avatar` (emoji), `xp`, `order` (int, for drag-drop persistence), `created_at`, `completed_at`
- `PlayerStats` — singleton (pk=1): `level`, `xp`, `streak`, `last_active_date`

**XP logic** (`quests/views.py`): awarding XP on quest defeat, leveling formula `xp_for_level(level) = 100 + level * 50`, streak logic (incremented when defeating on consecutive days).

**API endpoints:**
```
GET/POST   /api/quests/
GET/PATCH/DELETE /api/quests/{id}/
POST       /api/quests/reorder/      # batch order update for a column
POST       /api/quests/{id}/clone/   # duplicate quest to backlog
GET        /api/stats/me/            # get/create singleton PlayerStats
```

CORS is configured to allow `http://localhost:4200` only.

### Frontend ↔ Backend Contract

The XP leveling formula (`100 + level * 50`) is duplicated in both `quest-store.service.ts` and `quests/views.py` — keep them in sync. The `rarity` and `column` enum strings must match exactly between `tasktracker/src/app/models/quest.ts` and `quests/models.py`.
