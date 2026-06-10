# 🌙 Lumina

A personal task board that stays out of your way.

![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=flat&logo=angular)
![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=flat&logo=tauri)
![License](https://img.shields.io/badge/license-MIT-C490D1?style=flat)

---

## Features

- **Quick-add bar** — type `fix login !high fri #work` and it parses priority, due date, and tags automatically
- **Kanban board** — drag tasks between To do → In progress → Done
- **Priority levels** — low / medium / high / critical with colour coding
- **Archive** — done tasks auto-archive after a threshold you set (1, 3, 7, 14, 30, 60 days, or never)
- **Templates** — save any task and summon it again in one click
- **Today view** — filter down to just what's due today
- **Search & filter** — by keyword, priority, tag, or urgency
- **Subtasks & notes** — break tasks down without leaving the board
- **Browser notifications** — overdue task alerts, checked every 30 min
- **Local-first** — everything lives on your device, no account needed

## Quick-add syntax

| Token | Effect |
|---|---|
| `!critical` | Critical priority |
| `!high` | High priority |
| `!med` | Medium priority |
| `!low` | Low priority |
| `today` `tomorrow` | Due that day |
| `mon` `tue` `fri` ... | Next occurrence of that weekday |
| `3d` `1w` `2w` | In N days / weeks |
| `#tag` | Attach one or more tags |

**Example:** `prep demo slides !high mon #work #design`
→ High priority, due Monday, tagged work + design

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 18, standalone components, signals |
| Desktop | Tauri 2 |
| Storage | SQLite (desktop) · localStorage (PWA) |
| Drag & drop | Angular CDK |
| Icons | Lucide Angular |
| Styling | SCSS, CSS custom properties |

---

## Running locally

```bash
cd tasktracker
npm install
npm start          # dev server → http://localhost:4200
npm run app:dev    # Tauri dev mode (desktop window)
npm run pwa        # production PWA build

MIT — see [LICENSE](LICENSE)
