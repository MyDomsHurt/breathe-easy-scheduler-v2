/**
 * Seed data for Scheduler v2.
 * Primary source: real Schedule Master week 17–22 Aug 2026
 * (client identity anonymised; dates/teams/loads real).
 * Loaded as per-day JSON under data/.
 */

import { TEAM_META } from './config.js';
import { weekNumber } from './utils.js';

const DAY_URLS = [
  './data/day-2026-08-17.json',
  './data/day-2026-08-18.json',
  './data/day-2026-08-19.json',
  './data/day-2026-08-20.json',
  './data/day-2026-08-21.json',
  './data/day-2026-08-22.json',
];

let cached = null;

export async function loadSeedJobs() {
  if (cached) return cached;
  const parts = await Promise.all(
    DAY_URLS.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      return res.json();
    })
  );
  const rows = parts.flat();
  cached = rows.map((j) => ({
    ...j,
    week: j.week || weekNumber(j.date),
    team_members: j.team_members || TEAM_META[j.team_lead]?.members || j.team_lead,
    is_return: j.is_return || j.job_type === 'return',
    source: j.source || 'schedule-master-2026-08-17',
  }));
  return cached;
}

/** Sync fallback used only if async load has not completed. */
export function buildSeedJobs() {
  return cached || [];
}

export function uniqueClientsFrom(jobs) {
  const map = new Map();
  for (const j of jobs) {
    const key = String(j.mobile || j.client_name).replace(/\s+/g, '');
    if (!map.has(key)) {
      map.set(key, {
        name: j.client_name,
        mobile: j.mobile,
        address: j.address,
        district: j.district,
      });
    }
  }
  return [...map.values()];
}
