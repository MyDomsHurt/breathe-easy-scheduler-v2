import { DISTRICTS, JOB_TYPES, TEAMS, TODAY } from './config.js';
import { addDays, formatMoney, formatWeekLabel, jobTypeOf, mondayOf, weekDays } from './utils.js';
import { allJobs, getJob, resetDemo, subscribe } from './store.js';
import { cellSummary, suggestTeams } from './capacity.js';
import { renderDayBoard, renderWeekBoard, weekStats } from './board.js';
import { closeBooking, openBooking } from './booking.js';
import { renderJobModal, renderJobsList } from './jobs.js';

const state = {
  view: 'board',
  mode: 'week',
  monday: mondayOf(TODAY),
  day: TODAY,
  teams: [...TEAMS],
  districts: [],
  types: [],
  query: '',
};

function $(id) {
  return document.getElementById(id);
}

function teamJobs() {
  return allJobs().filter((j) => !state.teams.length || state.teams.includes(j.team_lead));
}

function filteredJobs() {
  return teamJobs().filter((j) => {
    if (state.districts.length && !state.districts.includes(j.district)) return false;
    if (state.types.length && !state.types.includes(jobTypeOf(j))) return false;
    return true;
  });
}

function paint() {
  const jobs = filteredJobs();
  const days = weekDays(state.monday);
  $('weekLabel').textContent = formatWeekLabel(state.monday);
  $('viewBoard').hidden = state.view !== 'board';
  $('viewJobs').hidden = state.view !== 'jobs';
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.classList.toggle('on', el.dataset.nav === state.view);
  });
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.classList.toggle('on', el.dataset.mode === state.mode);
  });

  if (state.view === 'board') {
    const capacityJobs = teamJobs();
    const stats = weekStats(capacityJobs, state.mode === 'week' ? days : [state.day], state.teams);
    $('statsStrip').innerHTML = `
      <div class="stat"><b>${stats.openCells}</b><span>open slots</span></div>
      <div class="stat"><b>${stats.cleans}</b><span>cleans</span></div>
      <div class="stat"><b>${stats.returns}</b><span>returns</span></div>
      <div class="stat"><b>${stats.influencers}</b><span>influencer</span></div>
      <div class="stat"><b>${formatMoney(stats.revenue)}</b><span>booked revenue</span></div>
    `;
    if (state.mode === 'week') {
      renderWeekBoard($('boardMount'), { jobs: capacityJobs, chipJobs: jobs, monday: state.monday, days, teams: state.teams });
    } else {
      renderDayBoard($('boardMount'), { jobs: capacityJobs, chipJobs: jobs, date: state.day, teams: state.teams });
    }
  } else {
    renderJobsList($('jobsMount'), jobs, state.query);
  }
}

function bindBoardClicks() {
  $('boardMount').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-job]');
    if (chip) {
      renderJobModal($('modalRoot'), getJob(chip.dataset.job));
      return;
    }
    const dayHead = e.target.closest('[data-open-day]');
    if (dayHead) {
      state.mode = 'day';
      state.day = dayHead.dataset.openDay;
      paint();
      return;
    }
    const cell = e.target.closest('[data-date][data-slot]');
    if (!cell) return;
    const date = cell.dataset.date;
    const slot = cell.dataset.slot;
    const jobs = teamJobs();
    const summary = cellSummary(jobs, date, slot, state.teams);
    const ranked = suggestTeams(jobs, {
      date,
      slotId: slot,
      district: state.districts[0] || '',
      acsNeeded: 2,
      teams: state.teams,
    });
    openBooking({
      date,
      slot,
      team_lead: ranked[0]?.team || summary.openTeams[0] || state.teams[0],
    });
  });
}

function bindFilters() {
  const teamBox = $('teamFilters');
  teamBox.innerHTML = TEAMS.map((t) => `<button class="chip on" data-team="${t}" style="--team:var(--team-${t.toLowerCase()})">${t}</button>`).join('');
  teamBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-team]');
    if (!btn) return;
    const t = btn.dataset.team;
    if (state.teams.includes(t)) {
      if (state.teams.length === 1) return;
      state.teams = state.teams.filter((x) => x !== t);
    } else {
      state.teams = [...state.teams, t];
    }
    [...teamBox.children].forEach((el) => el.classList.toggle('on', state.teams.includes(el.dataset.team)));
    paint();
  });

  const distBox = $('districtFilters');
  distBox.innerHTML = Object.keys(DISTRICTS).map((d) => `<button class="chip district" data-district="${d}">${d}</button>`).join('');
  distBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-district]');
    if (!btn) return;
    const d = btn.dataset.district;
    state.districts = state.districts.includes(d) ? state.districts.filter((x) => x !== d) : [...state.districts, d];
    [...distBox.children].forEach((el) => el.classList.toggle('on', state.districts.includes(el.dataset.district)));
    paint();
  });

  const typeBox = $('typeFilters');
  typeBox.innerHTML = JOB_TYPES.map((t) => `<button class="chip type-${t.id}" data-type="${t.id}">${t.label}</button>`).join('');
  typeBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const t = btn.dataset.type;
    state.types = state.types.includes(t) ? state.types.filter((x) => x !== t) : [...state.types, t];
    [...typeBox.children].forEach((el) => el.classList.toggle('on', state.types.includes(el.dataset.type)));
    paint();
  });
}

function bindChrome() {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      state.view = el.dataset.nav;
      if (state.view === 'jobs') $('jobSearch')?.focus();
      paint();
    });
  });
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.addEventListener('click', () => {
      state.mode = el.dataset.mode;
      if (state.mode === 'day') state.day = TODAY >= state.monday && TODAY <= addDays(state.monday, 6) ? TODAY : state.monday;
      paint();
    });
  });
  $('prevWeek').addEventListener('click', () => {
    state.monday = addDays(state.monday, -7);
    state.day = state.monday;
    paint();
  });
  $('nextWeek').addEventListener('click', () => {
    state.monday = addDays(state.monday, 7);
    state.day = state.monday;
    paint();
  });
  $('thisWeek').addEventListener('click', () => {
    state.monday = mondayOf(TODAY);
    state.day = TODAY;
    paint();
  });
  $('newBooking').addEventListener('click', () => {
    openBooking({ date: state.mode === 'day' ? state.day : TODAY });
  });
  $('jobSearch').addEventListener('input', (e) => {
    state.query = e.target.value;
    paint();
  });
  $('resetDemo').addEventListener('click', () => {
    if (confirm('Reset prototype bookings back to the seed schedule?')) {
      resetDemo();
      paint();
      toast('Demo data reset');
    }
  });
  $('modalRoot').addEventListener('click', (e) => {
    if (e.target.closest('[data-close-modal]')) renderJobModal($('modalRoot'), null);
  });
  $('jobsMount').addEventListener('click', (e) => {
    const row = e.target.closest('[data-job]');
    if (row) renderJobModal($('modalRoot'), getJob(row.dataset.job));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBooking();
      renderJobModal($('modalRoot'), null);
    }
  });
  window.addEventListener('be:booked', (e) => {
    const job = e.detail;
    state.monday = mondayOf(job.date);
    state.day = job.date;
    state.view = 'board';
    paint();
    toast(`Booked ${job.client_name} · ${job.team_lead} · ${job.date}`);
  });
  window.addEventListener('be:toast', (e) => toast(e.detail));
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

bindFilters();
bindChrome();
bindBoardClicks();
subscribe(paint);
paint();
