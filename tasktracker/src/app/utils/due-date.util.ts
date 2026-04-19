const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_NAMES_FULL = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export type Urgency = 'ok' | 'soon' | 'urgent' | 'overdue';

export function parseDueDate(token: string | undefined): Date | null {
  if (!token) return null;
  const t = token.toLowerCase().trim();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (t === 'today') return today;

  if (t === 'tomorrow' || t === 'tmr') {
    const d = new Date(today); d.setDate(d.getDate() + 1); return d;
  }

  // Nd = N days
  const daysMatch = t.match(/^(\d+)d$/);
  if (daysMatch) {
    const d = new Date(today); d.setDate(d.getDate() + parseInt(daysMatch[1])); return d;
  }

  // Nw = N weeks
  const weeksMatch = t.match(/^(\d+)w$/);
  if (weeksMatch) {
    const d = new Date(today); d.setDate(d.getDate() + parseInt(weeksMatch[1]) * 7); return d;
  }

  // weekday name — next occurrence
  let dayIdx = DAY_NAMES.indexOf(t);
  if (dayIdx === -1) dayIdx = DAY_NAMES_FULL.indexOf(t);
  if (dayIdx !== -1) {
    const d = new Date(today);
    const diff = (dayIdx - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // "next week"
  if (t === 'next week') {
    const d = new Date(today); d.setDate(d.getDate() + 7); return d;
  }

  return null;
}

export function getUrgency(token: string | undefined, isDone: boolean): Urgency {
  if (isDone || !token) return 'ok';
  const due = parseDueDate(token);
  if (!due) return 'ok';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400_000);

  if (diffDays < 0)  return 'overdue';
  if (diffDays === 0) return 'urgent';
  if (diffDays <= 2) return 'soon';
  return 'ok';
}

export function formatDueLabel(token: string | undefined, isDone: boolean, completedAt: string | undefined): string {
  if (isDone && completedAt) {
    const delta = Date.now() - new Date(completedAt).getTime();
    const mins = Math.floor(delta / 60000);
    if (mins < 60) return `slain · ${mins || 1}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `slain · ${hrs}h ago`;
    return `slain · ${Math.floor(hrs / 24)}d ago`;
  }
  if (!token) return '—';

  const due = parseDueDate(token);
  if (!due) return `⏳ ${token}`;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400_000);

  if (diffDays < 0)   return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'due today';
  if (diffDays === 1) return 'due tomorrow';
  return token;
}
