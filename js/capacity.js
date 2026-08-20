import { TEAM_META, TEAMS } from './config.js';
import { timeToMinutes } from './utils.js';

export function sortByTime(jobs) {
  return jobs.slice().sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export function jobsForTeamDay(jobs, date, team) {
  return sortByTime(jobs.filter((j) => j.date === date && j.team_lead === team));
}

export function teamMembersOnDay(jobs, date, team) {
  const hit = jobs.find((j) => j.date === date && j.team_lead === team && j.team_members);
  return hit?.team_members || TEAM_META[team]?.members || team;
}

export function districtsForTeamOnDay(jobs, date, team) {
  return [...new Set(
    jobs.filter((j) => j.date === date && j.team_lead === team && j.district).map((j) => j.district)
  )];
}

/**
 * Suggest a team for a date: lighter day first, then same-day district
 * clustering, then home areas. Never a hard quota.
 */
export function suggestTeams(jobs, { date, district, teams = TEAMS } = {}) {
  return teams
    .map((team) => {
      const dayJobs = jobsForTeamDay(jobs, date, team);
      const dayDistricts = districtsForTeamOnDay(jobs, date, team);
      const home = TEAM_META[team]?.home || [];
      let score = 40 - dayJobs.length * 6;
      if (district && dayDistricts.includes(district)) score += 16;
      if (district && home.includes(district)) score += 8;
      if (dayJobs.length === 0) score += 8;
      return {
        team,
        jobCount: dayJobs.length,
        dayDistricts,
        members: teamMembersOnDay(jobs, date, team),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function overlapWarning(jobs, { date, team, time }) {
  const mins = timeToMinutes(time);
  if (!time || mins === 9999) return null;
  const near = jobsForTeamDay(jobs, date, team).find((j) => {
    const other = timeToMinutes(j.time);
    if (other === 9999) return false;
    return Math.abs(other - mins) < 45;
  });
  if (!near) return null;
  return `${near.time || 'Another job'} already on ${team} that day`;
}
