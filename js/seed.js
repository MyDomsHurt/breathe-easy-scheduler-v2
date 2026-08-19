/**
 * Seed data for Scheduler v2.
 * Primary source: real Schedule Master week 17–22 Aug 2026
 * (client identity anonymised; dates/teams/loads real).
 */

import { TEAM_META } from './config.js';
import { weekNumber } from './utils.js';

const DATA_URL = './data/week-2026-08-17-real.json';

let cached = null;

export async function loadSeedJobs() {
  if (cached) return cached;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to load seed data: ${res.status}`);
  const rows = await res.json();
  cached = rows.map((j) => ({
    ...j,
    week: j.week || weekNumber(j.date),
    team_members: j.team_members || TEAM_META[j.team_lead]?.members || j.team_lead,
    source: j.source || 'schedule-master-2026-08-17',
  }));
  return cached;
}

/** Sync fallback used only if async load has not completed (should not happen after boot). */
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
