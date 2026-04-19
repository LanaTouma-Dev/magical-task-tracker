# 🌙 Quest Journal

A personal task tracker with a magical girl / RPG aesthetic. Tasks are **quests** with rarity tiers, XP, levels, and streaks. Built to replace the tedium of task trackers with something that actually sparks joy.

![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=flat&logo=angular)
![Django](https://img.shields.io/badge/Django-5-092E20?style=flat&logo=django)
![License](https://img.shields.io/badge/license-MIT-C490D1?style=flat)

---

## Features

- **Smart summon bar** — type `fix login !high fri #work` and it auto-parses rarity, due date, and tags
- **Kanban board** — drag quests between Backlog → In Battle → Defeated
- **Rarity system** — Common / Rare / Epic / Legendary with XP rewards (5 / 20 / 50 / 100 XP)
- **Due date urgency** — visual + animated alerts for overdue and urgent quests
- **Browser notifications** — alerts for overdue quests, re-checked every 30 min
- **Templates** — one-click quest summoning for recurring tasks (standup, PR review, deployments...)
- **Spell Sheet** — in-app reference for all parser shortcuts
- **Search & filter** — by keyword, rarity, or urgency
- **XP + leveling** — defeat quests to earn XP and level up your adventurer

## Spell syntax

| Token | Effect |
|---|---|
| `!boss` | Legendary (★★★★) · 100 XP |
| `!high` | Epic (★★★) · 50 XP |
| `!med` | Rare (★★) · 20 XP |
| `!low` | Common (★) · 5 XP |
| `today` `tomorrow` | Due that day |
| `mon` `tue` `fri` ... | Next occurrence of that weekday |
| `3d` `1w` `2w` | In N days / weeks |
| `#tag` | Attach one or more tags |

**Example:** `prep demo slides !boss mon #work #design`
→ Legendary quest, due Monday, tagged work + design

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 18, standalone components, signals |
| Backend | Django 5, Django REST Framework |
| Drag & drop | Angular CDK |
| Icons | Lucide Angular |
| Styling | SCSS, CSS custom properties, glassmorphism |

---

## Running locally

### Frontend

```bash
cd tasktracker
npm install
ng serve
# → http://localhost:4200
```

### Backend

```bash
cd tasktrackerbackend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# → http://localhost:8000
```

---

## License

MIT — see [LICENSE](LICENSE)
