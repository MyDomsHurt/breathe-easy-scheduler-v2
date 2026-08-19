import { SLOTS, TEAM_META } from './config.js';
import { cellSummary, jobsInCell, opennessLabel } from './capacity.js';
import { firstName, formatDay, isToday, isWeekend, jobTypeOf } from './utils.js';

function teamColor(name) {
  return TEAM_META[name]?.color || '#64748b';
}

function chipHtml(job) {
  const type = jobTypeOf(job);
  const extra = type !== 'cleaning' ? type : '';
  const tag = extra ? `<span class="tag ${extra}">${extra === 'return' ? 'RET' : 'INF'}</span>` : '';
  const acs = extra === 'return' ? '' : `<span class="acs">${job.acs || ''}</span>`;
  return `<button class="job-chip ${extra}" data-job="${job.job_id}" style="--team:${teamColor(job.team_lead)}" title="${job.client_name} · ${job.team_lead}">
    ${tag}<span class="who">${firstName(job.client_name)}</span>${acs}
  </button>`;
}

function metersHtml(summary, teams) {
  return `<div class="meters">${teams.map((team) => {
    const t = summary.byTeam[team];
    const pct = Math.min(100, Math.round((t.used / 6) * 100));
    return `<div class="meter ${t.used === 0 ? 'empty' : ''}" style="--team:${teamColor(team)}" title="${team}: ${t.used}/6 ACs">
      <i style="width:${pct}%"></i>
    </div>`;
  }).join('')}</div>`;
}

function cellHtml(summary, teams, mode, displayJobs) {
  const chips = displayJobs || summary.jobs;
  const visibleJobs = chips.slice(0, mode === 'day' ? 6 : 4);
  const more = chips.length - visibleJobs.length;
  const bookLabel = summary.openness === 'full' ? 'Full · override' : 'Book here';
  return `<div class="slot-cell ${summary.openness} ${mode === 'day' ? 'day-cell' : ''}" data-date="${summary.date}" data-slot="${summary.slotId}">
    <div class="cell-top">
      <span class="cell-status">${opennessLabel(summary)}</span>
      <span style="font-size:10px;color:#64748b;font-weight:700">${summary.bestRemaining} left</span>
    </div>
    ${metersHtml(summary, teams)}
    <div class="job-chips">
      ${visibleJobs.map(chipHtml).join('')}
      ${more > 0 ? `<div style="font-size:10px;color:#64748b;font-weight:700">+${more} more</div>` : ''}
    </div>
    <div class="book-here">${bookLabel}</div>
  </div>`;
}

export function renderWeekBoard(el, { jobs, chipJobs, monday, days, teams }) {
  const shown = chipJobs || jobs;
  const heads = days.map((d) => {
    const cls = [isToday(d) ? 'today' : '', isWeekend(d) ? 'weekend' : ''].join(' ');
    return `<button class="day-col-head ${cls}" data-open-day="${d}">
      <div class="dow">${formatDay(d, { weekday: 'short', month: 'short' }).split(' ')[0]}</div>
      <div class="dom">${Number(d.slice(8))}</div>
    </button>`;
  }).join('');

  const rows = SLOTS.map((slot) => {
    const cells = days.map((date) => {
      const summary = cellSummary(jobs, date, slot.id, teams);
      return cellHtml(summary, teams, 'week', jobsInCell(shown, date, slot.id, teams));
    }).join('');
    return `<div class="slot-label"><strong>${slot.label}</strong><span>${slot.hint}</span></div>${cells}`;
  }).join('');

  el.innerHTML = `<div class="board-wrap"><div class="board">
    <div class="board-head"></div>${heads}
    ${rows}
  </div></div>`;
}

export function renderDayBoard(el, { jobs, chipJobs, date, teams }) {
  const shown = chipJobs || jobs;
  const heads = SLOTS.map((s) => `<div class="day-col-head"><div class="dow">${s.short}</div><div class="dom" style="font-size:13px">${s.hint}</div></div>`).join('');
  const rows = teams.map((team) => {
    const cells = SLOTS.map((slot) => {
      const summary = cellSummary(jobs, date, slot.id, [team]);
      return cellHtml(summary, [team], 'day', jobsInCell(shown, date, slot.id, [team]));
    }).join('');
    return `<div class="team-row-label">
      <span class="team-dot" style="background:${teamColor(team)}"></span>
      <strong>${team}</strong>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${TEAM_META[team].members}</div>
    </div>${cells}`;
  }).join('');

  el.innerHTML = `<div class="board-wrap"><div class="day-grid">
    <div class="board-head">${formatDay(date, { weekday: 'long' })}</div>${heads}
    ${rows}
  </div></div>`;
}

export function weekStats(jobs, days, teams) {
  const set = new Set(days);
  const teamSet = new Set(teams);
  const weekJobs = jobs.filter((j) => set.has(j.date) && teamSet.has(j.team_lead));
  const cleans = weekJobs.filter((j) => jobTypeOf(j) === 'cleaning');
  const returns = weekJobs.filter((j) => jobTypeOf(j) === 'return');
  const influencers = weekJobs.filter((j) => jobTypeOf(j) === 'influencer');
  const revenue = cleans.reduce((n, j) => n + (j.amount || 0), 0);
  let openCells = 0;
  for (const date of days) {
    for (const slot of SLOTS) {
      if (cellSummary(weekJobs, date, slot.id, teams).openness === 'open') openCells += 1;
    }
  }
  return { total: weekJobs.length, cleans: cleans.length, returns: returns.length, influencers: influencers.length, revenue, openCells };
}
