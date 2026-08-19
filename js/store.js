import { STORAGE_KEY, TEAM_META } from './config.js';
import { loadSeedJobs, buildSeedJobs } from './seed.js';
import { acsLabel, estimateAmount, jobTypeOf, uid, weekNumber } from './utils.js';

const listeners = new Set();

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { extras: [], removed: [] };
    const data = JSON.parse(raw);
    return {
      extras: Array.isArray(data.extras) ? data.extras : [],
      removed: Array.isArray(data.removed) ? data.removed : [],
    };
  } catch {
    return { extras: [], removed: [] };
  }
}

function savePersisted(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ extras: state.extras, removed: state.removed })
  );
}

function createState(seed) {
  const persisted = loadPersisted();
  return {
    seed: seed || [],
    extras: persisted.extras,
    removed: new Set(persisted.removed),
  };
}

let state = createState([]);
let ready = false;
let readyPromise = null;

export function whenReady() {
  return readyPromise || Promise.resolve();
}

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
  const seed = state.seed.filter((j) => !state.removed.has(j.job_id));
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
  const jobs = allJobs();
  listeners.forEach((fn) => fn(jobs));
}

export function addJob(input) {
  const type = input.job_type || (input.is_return ? 'return' : 'cleaning');
  const acs = input.acs || acsLabel(input.units || {}) || '';
  const job = {
    job_id: input.job_id || uid(`${input.date}-${(input.team_lead || 'team').toLowerCase()}`),
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
    invoice: input.invoice || null,
    receipt: input.receipt || null,
    payment: input.payment || 'Unpaid',
    is_return: type === 'return',
    district: input.district || '',
    job_type: type,
    source: 'local',
  };
  state.extras = [...state.extras, job];
  persist();
  emit();
  return job;
}

export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  const seed = state.seed.length ? state.seed : buildSeedJobs();
  state = createState(seed);
  emit();
}

function persist() {
  savePersisted({
    extras: state.extras,
    removed: [...state.removed],
  });
}

export { jobTypeOf };
