/**
 * Seed data: Schedule Master week 17–22 Aug 2026.
 * Prefer one combined file so a missing day JSON cannot empty the board.
 */

import { TEAM_META } from './config.js';
import { weekNumber } from './utils.js';

const WEEK_URL = './data/week-2026-08-17.json';
const DAY_URLS = [
  './data/day-2026-08-17.json',
  './data/day-2026-08-18.json',
  './data/day-2026-08-19.json',
  './data/day-2026-08-20.json',
  './data/day-2026-08-21.json',
  './data/day-2026-08-22.json',
];

let cached = null;

function normalize(rows) {
  return (Array.isArray(rows) ? rows : []).map((j) => ({
    ...j,
    week: j.week || weekNumber(j.date),
    team_members: j.team_members || TEAM_META[j.team_lead]?.members || j.team_lead,
    is_return: j.is_return || j.job_type === 'return',
    source: j.source || 'schedule-master-2026-08-17',
  }));
}

export async function loadSeedJobs() {
  if (cached && cached.length) return cached;

  try {
    const res = await fetch(WEEK_URL);
    if (res.ok) {
      const rows = normalize(await res.json());
      if (rows.length) {
        cached = rows;
        return cached;
      }
    }
  } catch (err) {
    console.warn('week file failed', err);
  }

  const parts = await Promise.all(
    DAY_URLS.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    })
  );
  cached = normalize(parts.flat());
  return cached;
}

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
