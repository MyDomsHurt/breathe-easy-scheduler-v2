import { SLOT_CAPACITY, SLOTS, TEAM_META, TEAMS } from './config.js';
import { acsTotal, jobTypeOf, slotForTime } from './utils.js';

export function jobSlot(job) {
  return job.slot || slotForTime(job.time);
}

export function jobLoad(job) {
  const type = jobTypeOf(job);
  if (type === 'return' || type === 'influencer') return 0;
  return acsTotal(job.acs);
}

export function jobsInCell(jobs, date, slotId, teams = TEAMS) {
  const teamSet = new Set(teams);
  return jobs.filter((j) => j.date === date && jobSlot(j) === slotId && teamSet.has(j.team_lead));
}

export function teamLoadInCell(jobs, date, slotId, team) {
  return jobsInCell(jobs, date, slotId, [team]).reduce((n, j) => n + jobLoad(j), 0);
}

export function remainingForTeam(jobs, date, slotId, team) {
  return Math.max(0, SLOT_CAPACITY - teamLoadInCell(jobs, date, slotId, team));
}

export function cellSummary(jobs, date, slotId, teams = TEAMS) {
  const cellJobs = jobsInCell(jobs, date, slotId, teams);
  const byTeam = {};
  for (const team of teams) {
    const tJobs = cellJobs.filter((j) => j.team_lead === team);
    const used = tJobs.reduce((n, j) => n + jobLoad(j), 0);
    const remaining = Math.max(0, SLOT_CAPACITY - used);
    byTeam[team] = {
      team,
      used,
      remaining,
      ratio: used / SLOT_CAPACITY,
      jobs: tJobs,
      cleans: tJobs.filter((j) => jobTypeOf(j) === 'cleaning'),
      returns: tJobs.filter((j) => jobTypeOf(j) === 'return'),
      influencers: tJobs.filter((j) => jobTypeOf(j) === 'influencer'),
    };
  }
  const remainings = teams.map((t) => byTeam[t].remaining);
  const bestRemaining = remainings.length ? Math.max(...remainings) : 0;
  const openTeams = teams.filter((t) => byTeam[t].remaining >= 2);
  const tightOnly = !openTeams.length && teams.some((t) => byTeam[t].remaining > 0);
  let openness = 'full';
  if (bestRemaining >= 3) openness = 'open';
  else if (bestRemaining >= 1) openness = 'tight';
  return {
    date,
    slotId,
    jobs: cellJobs,
    byTeam,
    bestRemaining,
    openTeams,
    tightOnly,
    openness,
    cleanCount: cellJobs.filter((j) => jobTypeOf(j) === 'cleaning').length,
    specialCount: cellJobs.filter((j) => jobTypeOf(j) !== 'cleaning').length,
  };
}

export function districtsForTeamOnDay(jobs, date, team) {
  const set = new Set(
    jobs.filter((j) => j.date === date && j.team_lead === team && j.district).map((j) => j.district)
  );
  return [...set];
}

/**
 * Suggest a team for a booking: remaining capacity first, then same-day
 * district clustering, then the team's home areas.
 */
export function suggestTeams(jobs, { date, slotId, district, acsNeeded = 2, teams = TEAMS }) {
  const need = Math.max(1, acsNeeded);
  return teams
    .map((team) => {
      const remaining = remainingForTeam(jobs, date, slotId, team);
      const dayDistricts = districtsForTeamOnDay(jobs, date, team);
      const home = TEAM_META[team].home || [];
      let score = remaining * 4;
      if (remaining >= need) score += 20;
      else score -= 40;
      if (district && dayDistricts.includes(district)) score += 16;
      if (district && home.includes(district)) score += 8;
      if (dayDistricts.length === 0) score += 3;
      score -= teamLoadInCell(jobs, date, slotId, team);
      return {
        team,
        remaining,
        fits: remaining >= need,
        dayDistricts,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function opennessLabel(summary) {
  if (summary.openness === 'open') {
    const n = summary.openTeams.length;
    return n ? `${n} team${n === 1 ? '' : 's'} open` : 'Open';
  }
  if (summary.openness === 'tight') return 'Tight';
  return 'Full';
}

export { SLOT_CAPACITY, SLOTS };
