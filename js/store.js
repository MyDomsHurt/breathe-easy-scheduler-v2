import { STORAGE_KEY, TEAM_META } from './config.js';
import { loadSeedJobs, buildSeedJobs } from './seed.js';
import { acsLabel, estimateAmount, jobTypeOf, uid, weekNumber } from './utils.js';

const listeners = new Set();

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { extras: [], removed: [], overrides: {} };
    const data = JSON.parse(raw);
    return {
      extras: Array.isArray(data.extras) ? data.extras : [],
      removed: Array.isArray(data.removed) ? data.removed : [],
      overrides: data.overrides && typeof data.overrides === 'object' ? data.overrides : {},
    };
  } catch {
    return { extras: [], removed: [], overrides: {} };
  }
}

function savePersisted(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      extras: state.extras,
      removed: [...state.removed],
      overrides: state.overrides,
    })
  );
}

function createState(seed) {
  const persisted = loadPersisted();
  return {
    seed: seed || [],
    extras: persisted.extras,
    overrides: persisted.overrides,
    removed: new Set(persisted.removed),
  };
}

function buildJob(input, prev) {
  const type = input.job_type || (input.is_return ? 'return' : 'cleaning');
  const acs = input.acs || acsLabel(input.units || {}) || '';
  const base = prev || {};
  return {
    ...base,
    job_id: input.job_id || base.job_id || uid(`${input.date}-${(input.team_lead || 'team').toLowerCase()}`),
    date: input.date,
    week: weekNumber(input.date),
    team_lead: input.team_lead,
    team_members: input.team_members || TEAM_META[input.team_lead]?.members || input.team_lead,
    client_name: input.client_name,
    time: input.time || '',
    mobile: input.mobile || '',
    address: input.address || '',
    acs: type === 'return' ? '' : acs,
    notes: input.notes || null,
    amount: type === 'cleaning' ? (input.amount ?? estimateAmount(input.units || {}, type)) : null,
    invoice: input.invoice !== undefined ? input.invoice : (base.invoice || null),
    receipt: input.receipt !== undefined ? input.receipt : (base.receipt || null),
    payment: input.payment || 'Unpaid',
    is_return: type === 'return',
    district: input.district || '',
    job_type: type,
    source: base.source || input.source || 'local',
  };
}

let state = createState([]);
let ready = false;
let readyPromise = null;

export async function initStore() {
  if (ready) return allJobs();
  readyPromise = (async () => {
    const seed = await loadSeedJobs();
    state = createState(seed);
    ready = true;
    emit();
    return allJobs();
  })();
  return readyPromise;
}

export function allJobs() {
  const extras = state.extras.filter((j) => !state.removed.has(j.job_id));
  const seed = state.seed
    .filter((j) => !state.removed.has(j.job_id))
    .map((j) => state.overrides[j.job_id] || j);
  return [...seed, ...extras].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return String(a.time || '').localeCompare(String(b.time || ''));
  });
}

export function getJob(id) {
  return allJobs().find((j) => j.job_id === id) || null;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn(allJobs()));
}

export function addJob(input) {
  const job = buildJob(input);
  state.extras = [...state.extras, job];
  persist();
  emit();
  return job;
}

export function updateJob(id, input) {
  const prev = getJob(id);
  if (!prev) return null;
  const job = buildJob({ ...input, job_id: id }, prev);
  const extraIdx = state.extras.findIndex((j) => j.job_id === id);
  if (extraIdx >= 0) {
    const next = state.extras.slice();
    next[extraIdx] = job;
    state.extras = next;
  } else {
    state.overrides = { ...state.overrides, [id]: job };
  }
  persist();
  emit();
  return job;
}

export function removeJob(id) {
  state.extras = state.extras.filter((j) => j.job_id !== id);
  const next = { ...state.overrides };
  delete next[id];
  state.overrides = next;
  state.removed.add(id);
  persist();
  emit();
}

export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  const seed = state.seed.length ? state.seed : buildSeedJobs();
  state = createState(seed);
  emit();
}

function persist() {
  savePersisted(state);
}

export { jobTypeOf };
