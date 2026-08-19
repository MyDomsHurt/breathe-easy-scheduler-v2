import { TEAM_META } from './config.js';
import { jobsForTeamDay, teamMembersOnDay } from './capacity.js';
import { firstName, formatDay, formatMoney, isToday, isWeekend, jobTypeOf } from './utils.js';

function teamColor(name) {
  return TEAM_META[name]?.color || '#64748b';
}

function displayTime(job) {
  return job.time && String(job.time).trim() ? job.time : '—';
}

function chipHtml(job) {
  const type = jobTypeOf(job);
  const extra = type !== 'cleaning' ? type : '';
  const tag = extra ? `<span class="tag ${extra}">${extra === 'return' ? 'RET' : 'INF'}</span>` : '';
  const acs = extra === 'return' ? '' : `<span class="acs">${job.acs || ''}</span>`;
  return `<button class="job-chip ${extra}" data-job="${job.job_id}" style="--team:${teamColor(job.team_lead)}" title="${job.client_name} · ${displayTime(job)}">
    <span class="when">${displayTime(job)}</span>
    ${tag}<span class="who">${firstName(job.client_name)}</span>${acs}
  </button>`;
}

function cardHtml(job) {
  const type = jobTypeOf(job);
  const extra = type !== 'cleaning' ? type : '';
  const tag = extra ? `<span class="tag ${extra}">${extra === 'return' ? 'RETURN' : 'INFLUENCER'}</span>` : '';
  const money = type === 'cleaning' && job.amount != null
    ? `<span class="acs">${formatMoney(job.amount)}</span>` : '';
  const notes = job.notes
    ? `<p class="card-notes">${String(job.notes).slice(0, 90)}</p>` : '';
  return `<button class="job-card ${extra}" data-job="${job.job_id}" style="--team:${teamColor(job.team_lead)}">
    <div class="card-top">
      <strong class="when">${displayTime(job)}</strong>
      ${tag}${money}
    </div>
    <div class="who">${job.client_name}</div>
    <div class="card-meta">${job.acs || (extra === 'return' ? 'Return' : '—')} · ${job.district || ''}</div>
    <div class="card-meta">${job.address || ''}</div>
    ${notes}
  </button>`;
}

function cellHtml(allJobs, displayJobs, date, team, mode) {
  const list = jobsForTeamDay(allJobs, date, team);
  const shown = jobsForTeamDay(displayJobs, date, team);
  const members = teamMembersOnDay(allJobs, date, team);
  const empty = list.length === 0;
  const body = mode === 'day'
    ? shown.map(cardHtml).join('')
    : shown.map(chipHtml).join('');
  return `<div class="roster-cell ${empty ? 'empty' : 'has-jobs'} ${mode === 'day' ? 'day-cell' : ''}" data-date="${date}" data-team="${team}">
    <div class="cell-top">
      <span class="cell-status">${empty ? 'Open' : list.length + ' job' + (list.length === 1 ? '' : 's')}</span>
      ${mode === 'week' ? `<span class="cell-members">${members}</span>` : ''}
    </div>
    <div class="job-chips">${body}</div>
    <button class="book-here" data-book-date="${date}" data-book-team="${team}" type="button">+ Add</button>
  </div>`;
}

export function renderWeekBoard(el, { jobs, chipJobs, days, teams }) {
  const shown = chipJobs || jobs;
  const heads = days.map((d) => {
    const cls = [isToday(d) ? 'today' : '', isWeekend(d) ? 'weekend' : ''].join(' ');
    return `<button class="day-col-head ${cls}" data-open-day="${d}" type="button">
      <div class="dow">${formatDay(d, { weekday: 'short', month: 'short' }).split(' ')[0]}</div>
      <div class="dom">${Number(d.slice(8))}</div>
    </button>`;
  }).join('');

  const rows = teams.map((team) => {
    const cells = days.map((date) => cellHtml(jobs, shown, date, team, 'week')).join('');
    return `<div class="team-row-label" style="--team:${teamColor(team)}">
      <span class="team-dot" style="background:${teamColor(team)}"></span>
      <strong>${team}</strong>
      <div class="team-home">${(TEAM_META[team]?.home || []).join(' · ')}</div>
    </div>${cells}`;
  }).join('');

  el.innerHTML = `<div class="board-wrap"><div class="roster" style="--days:${days.length}">
    <div class="board-head">Team</div>${heads}
    ${rows}
  </div></div>`;
}

export function renderDayBoard(el, { jobs, chipJobs, date, teams }) {
  const shown = chipJobs || jobs;
  const cols = teams.map((team) => {
    const members = teamMembersOnDay(jobs, date, team);
    return `<div class="day-col">
      <div class="day-col-team" style="--team:${teamColor(team)}">
        <span class="team-dot" style="background:${teamColor(team)}"></span>
        <div>
          <strong>${team}</strong>
          <div class="cell-members">${members}</div>
        </div>
      </div>
      ${cellHtml(jobs, shown, date, team, 'day')}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="board-wrap">
    <div class="day-roster-head">${formatDay(date, { weekday: 'long' })}</div>
    <div class="day-roster" style="--cols:${teams.length}">${cols}</div>
  </div>`;
}

