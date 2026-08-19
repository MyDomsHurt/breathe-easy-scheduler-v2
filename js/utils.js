import { SLOTS, TODAY, UNIT_TYPES } from './config.js';

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function mondayOf(iso) {
  const d = parseISO(iso);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return toISO(d);
}

export function weekDays(mondayIso) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayIso, i));
}

export function formatDay(iso, opts = {}) {
  const d = parseISO(iso);
  return d.toLocaleDateString('en-HK', {
    weekday: opts.weekday || 'short',
    day: 'numeric',
    month: opts.month || 'short',
  });
}

export function formatWeekLabel(mondayIso) {
  const end = addDays(mondayIso, 6);
  const a = parseISO(mondayIso);
  const b = parseISO(end);
  const sameMonth = a.getMonth() === b.getMonth();
  const left = a.toLocaleDateString('en-HK', { day: 'numeric', month: 'short' });
  const right = b.toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' });
  return sameMonth
    ? `${a.getDate()}–${right}`
    : `${left} – ${right}`;
}

export function isToday(iso) {
  return iso === TODAY;
}

export function isWeekend(iso) {
  const day = parseISO(iso).getDay();
  return day === 0 || day === 6;
}

export function timeToMinutes(t) {
  if (!t) return 9999;
  const s = String(t).toLowerCase().replace(/\s+/g, '');
  const m = s.match(/(\d{1,2})(?:[.:](\d{2}))?(am|pm)?/);
  if (!m) return 9999;
  let h = parseInt(m[1], 10);
  const min = m[2] != null ? parseInt(m[2], 10) : 0;
  const ap = m[3] || '';
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (!ap && h >= 1 && h <= 6) h += 12;
  return h * 60 + min;
}

export function slotForTime(time) {
  const mins = timeToMinutes(time);
  if (mins === 9999) return SLOTS[0].id;
  const found = SLOTS.find((s) => mins >= s.startMin && mins < s.endMin);
  return found ? found.id : mins < SLOTS[0].startMin ? SLOTS[0].id : SLOTS[SLOTS.length - 1].id;
}

export function slotById(id) {
  return SLOTS.find((s) => s.id === id) || SLOTS[0];
}

export function formatSlotTime(slotId, explicit) {
  if (explicit) return explicit;
  const slot = slotById(slotId);
  const fmt = (mins) => {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const ap = h >= 12 ? 'pm' : 'am';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${pad(h)}.${pad(m)}${ap}`;
  };
  return `${fmt(slot.startMin)} => ${fmt(slot.startMin + 90)}`;
}

export function parseAcs(acs) {
  const counts = { S: 0, W: 0, B: 0, C: 0 };
  if (!acs) return counts;
  const re = /(\d+)\s*([A-Za-z]+)/g;
  let m;
  while ((m = re.exec(String(acs))) !== null) {
    let t = m[2].toUpperCase();
    if (t === 'BEP') continue;
    if (t === 'SWG' || t === 'SW') continue;
    if (t in counts) counts[t] += parseInt(m[1], 10);
  }
  return counts;
}

export function acsLabel(counts) {
  return UNIT_TYPES.map((u) => (counts[u.id] ? `${counts[u.id]}${u.id}` : null))
    .filter(Boolean)
    .join(' ');
}

export function acsTotal(countsOrString) {
  const counts = typeof countsOrString === 'string' || countsOrString == null
    ? parseAcs(countsOrString)
    : countsOrString;
  return UNIT_TYPES.reduce((n, u) => n + (counts[u.id] || 0), 0);
}

export function estimateAmount(counts, jobType) {
  if (jobType === 'influencer' || jobType === 'return') return 0;
  return UNIT_TYPES.reduce((n, u) => n + (counts[u.id] || 0) * u.price, 0);
}

export function jobTypeOf(job) {
  if (job.job_type) return job.job_type;
  if (job.is_return) return 'return';
  const notes = String(job.notes || '').toLowerCase();
  if (notes.includes('influencer')) return 'influencer';
  return 'cleaning';
}

export function formatMoney(n) {
  if (n == null || n === '') return '—';
  return '$' + Math.round(Number(n)).toLocaleString('en-HK');
}

export function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function firstName(name) {
  if (!name) return 'Job';
  return String(name).trim().split(/\s+/)[0];
}

export function digits(mobile) {
  return String(mobile || '').replace(/[^\d+]/g, '');
}

export function weekNumber(iso) {
  const d = parseISO(iso);
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
}

export function uid(prefix = 'job') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
