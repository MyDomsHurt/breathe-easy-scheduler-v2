import { DISTRICTS, JOB_TYPES, PAYMENTS, TEAM_META, UNIT_TYPES } from './config.js';
import { nextStackOrder, overlapWarning, suggestTeams, teamMembersOnDay } from './capacity.js';
import { addJob, allJobs, removeJob, updateJob } from './store.js';
import { uniqueClientsFrom } from './seed.js';
import { acsLabel, acsTotal, districtChipsHtml, emptyUnits, formatDay, parseAcs } from './utils.js';

let form = {
  job_id: '',
  client_name: '',
  mobile: '',
  address: '',
  district: '',
  units: emptyUnits(),
  date: '',
  time: '',
  team_lead: 'Josh',
  job_type: 'cleaning',
  amount: '',
  payment: 'Unpaid',
  notes: '',
};

function $(sel) {
  return document.querySelector(sel);
}

export function openBooking(prefill = {}) {
  const jobs = allJobs();
  const editing = Boolean(prefill.job_id);
  const units = {
    ...emptyUnits(),
    ...(prefill.units || (prefill.acs != null || editing ? parseAcs(prefill.acs) : {})),
  };
  form = {
    job_id: prefill.job_id || '',
    client_name: prefill.client_name || '',
    mobile: prefill.mobile || '',
    address: prefill.address || '',
    district: prefill.district || '',
    units,
    date: prefill.date || '',
    time: prefill.time || '',
    team_lead: prefill.team_lead || '',
    job_type: prefill.job_type || (prefill.is_return ? 'return' : 'cleaning'),
    amount: prefill.amount != null && prefill.amount !== '' ? prefill.amount : '',
    payment: prefill.payment || 'Unpaid',
    notes: prefill.notes || '',
    invoice: prefill.invoice,
    receipt: prefill.receipt,
    source: prefill.source,
  };
  if (!form.date) form.date = new Date().toISOString().slice(0, 10);
  if (form.job_type !== 'cleaning') form.units = emptyUnits();
  if (!form.team_lead) {
    const ranked = suggestTeams(jobs, { date: form.date, district: form.district });
    form.team_lead = ranked[0]?.team || 'Josh';
  }
  renderForm();
  const root = $('#bookingRoot');
  root.classList.add('open');
  root.setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#clientSearch')?.focus(), 30);
}

export function closeBooking() {
  const root = $('#bookingRoot');
  root.classList.remove('open');
  root.setAttribute('aria-hidden', 'true');
}

function others() {
  return allJobs().filter((j) => j.job_id !== form.job_id);
}

function renderForm() {
  const jobs = others();
  const ranked = suggestTeams(jobs, { date: form.date, district: form.district });
  if (form.team_lead && !ranked.find((r) => r.team === form.team_lead)) {
    form.team_lead = ranked[0]?.team || form.team_lead;
  }
  const best = ranked[0];
  const warn = overlapWarning(jobs, { date: form.date, team: form.team_lead, time: form.time });
  const selectedJobs = ranked.find((r) => r.team === form.team_lead)?.jobCount || 0;
  const editing = Boolean(form.job_id);

  $('#bookingRoot').innerHTML = `
    <div class="drawer-bg" data-close="1"></div>
    <aside class="drawer" role="dialog" aria-label="${editing ? 'Edit booking' : 'New booking'}">
      <div class="drawer-head">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <h2>${editing ? 'Edit booking' : 'New booking'}</h2>
            <p>${form.date ? formatDay(form.date, { weekday: 'long' }) : 'Pick a date'} · ${form.team_lead || 'choose team'}${form.time ? ' · ' + form.time : ''}</p>
          </div>
          <button class="icon-btn" data-close="1" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="drawer-body">
        <div class="field">
          <label>Client</label>
          <div class="typeahead">
            <input id="clientSearch" type="search" placeholder="Search name or mobile, or type a new name" value="${escapeAttr(form.client_name)}" autocomplete="off" />
            <div id="clientHits" class="typeahead-list" hidden></div>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Mobile</label>
            <input id="mobileInput" value="${escapeAttr(form.mobile)}" placeholder="6123 4567" />
          </div>
          <div class="field">
            <label>District</label>
            <select id="districtInput">
              <option value="">Select</option>
              ${Object.entries(DISTRICTS).map(([k, v]) => `<option value="${k}" ${form.district === k ? 'selected' : ''}>${v.short} · ${v.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Address</label>
          <input id="addressInput" value="${escapeAttr(form.address)}" placeholder="Building, floor, street" />
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Date</label>
            <input id="dateInput" type="date" value="${form.date}" />
          </div>
          <div class="field">
            <label>Time</label>
            <input id="timeInput" value="${escapeAttr(form.time)}" placeholder="09.00am or 02.15pm" />
            <div style="font-size:11px;color:#64748b;margin-top:4px">Free text — same style as the spreadsheet</div>
          </div>
        </div>

        <div class="field">
          <label>ACs</label>
          <div class="stepper-row">
            ${UNIT_TYPES.map((u) => `
              <div class="stepper">
                <span class="stepper-name">${u.id}</span>
                <div class="stepper-ctrl">
                  <button type="button" data-unit="${u.id}" data-delta="-1">−</button>
                  <strong>${form.units[u.id] || 0}</strong>
                  <button type="button" data-unit="${u.id}" data-delta="1">+</button>
                </div>
              </div>`).join('')}
          </div>
          <div style="margin-top:8px;font-size:12px;color:#64748b;font-weight:600">
            ${form.job_type === 'cleaning' ? (acsLabel(form.units) || 'No units yet') : 'Units not required for this job type'}
          </div>
        </div>

        <div class="field">
          <label>Notes</label>
          <input id="notesInput" value="${escapeAttr(form.notes)}" placeholder="Access, parking, language…" />
        </div>

        <div class="field">
          <label>Team</label>
          ${warn ? `<div class="capacity-live" style="margin-bottom:8px"><strong style="color:#c2410c">Heads up</strong> · ${warn}. You can still book.</div>` : ''}
          <div class="team-picks">
            ${ranked.map((r, i) => `
              <button type="button" class="team-card ${form.team_lead === r.team ? 'on' : ''}" data-team="${r.team}" style="--team:${TEAM_META[r.team].color}">
                <span class="bar"></span>
                <span>
                  <strong>${r.team}</strong>
                  ${r.dayDistricts.length ? `<div class="meta">${districtChipsHtml(r.dayDistricts)}</div>` : ''}
                </span>
                <span>
                  ${i === 0 ? '<span class="badge">Best</span>' : ''}
                  <span class="badge">${r.jobCount} job${r.jobCount === 1 ? '' : 's'}</span>
                </span>
              </button>`).join('')}
          </div>
          <div class="capacity-live" style="margin-top:8px">${form.team_lead} · ${selectedJobs} job${selectedJobs === 1 ? '' : 's'} this day${best && best.team !== form.team_lead ? ' · Suggested: <b>' + best.team + '</b>' : ''}</div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Job type</label>
            <select id="typeInput">
              ${JOB_TYPES.map((t) => `<option value="${t.id}" ${form.job_type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Payment</label>
            <select id="payInput">
              ${PAYMENTS.map((p) => `<option ${form.payment === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Amount (HKD)</label>
          <input id="amountInput" type="number" min="0" step="10" value="${form.amount === '' || form.amount == null ? '' : form.amount}" placeholder="Enter amount" />
        </div>
      </div>
      <div class="drawer-foot">
        ${editing ? '<button class="ghost-btn" id="deleteBooking" style="margin-right:auto;color:#b91c1c;border-color:#fecaca">Cancel job</button>' : ''}
        <button class="ghost-btn" data-close="1">Close</button>
        <button class="primary-btn" id="saveBooking">${editing ? 'Save changes' : 'Save booking'}</button>
      </div>
    </aside>
  `;
  bindForm();
}

function bindForm() {
  const root = $('#bookingRoot');
  root.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', closeBooking);
  });
  $('#clientSearch').addEventListener('input', (e) => {
    form.client_name = e.target.value;
    renderHits(e.target.value);
  });
  $('#clientSearch').addEventListener('focus', (e) => renderHits(e.target.value));
  $('#mobileInput').addEventListener('input', (e) => { form.mobile = e.target.value; });
  $('#addressInput').addEventListener('input', (e) => { form.address = e.target.value; });
  $('#districtInput').addEventListener('change', (e) => { form.district = e.target.value; renderForm(); });
  $('#dateInput').addEventListener('change', (e) => { form.date = e.target.value; renderForm(); });
  $('#timeInput').addEventListener('input', (e) => { form.time = e.target.value; });
  $('#timeInput').addEventListener('change', (e) => { form.time = e.target.value; renderForm(); });
  $('#typeInput').addEventListener('change', (e) => { form.job_type = e.target.value; renderForm(); });
  $('#payInput').addEventListener('change', (e) => { form.payment = e.target.value; });
  $('#amountInput').addEventListener('input', (e) => {
    form.amount = e.target.value === '' ? '' : Number(e.target.value);
  });
  $('#notesInput').addEventListener('input', (e) => { form.notes = e.target.value; });
  root.querySelectorAll('[data-unit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.unit;
      const delta = Number(btn.dataset.delta);
      form.units[id] = Math.max(0, (form.units[id] || 0) + delta);
      renderForm();
    });
  });
  root.querySelectorAll('[data-team]').forEach((btn) => {
    btn.addEventListener('click', () => { form.team_lead = btn.dataset.team; renderForm(); });
  });
  $('#saveBooking').addEventListener('click', save);
  const del = $('#deleteBooking');
  if (del) del.addEventListener('click', cancelJob);
}

function renderHits(q) {
  const box = $('#clientHits');
  const s = String(q || '').trim().toLowerCase();
  if (s.length < 2) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const clients = uniqueClientsFrom(allJobs());
  const hits = clients.filter((c) => (
    `${c.name} ${c.mobile} ${c.address}`.toLowerCase().includes(s)
  )).slice(0, 7);
  if (!hits.length) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  box.innerHTML = hits.map((c) => `
    <button type="button" data-pick-mobile="${escapeAttr(c.mobile)}">
      <strong>${c.name}</strong>
      <span class="sub">${c.mobile || ''} · ${c.district || ''} · ${c.address || ''}</span>
    </button>
  `).join('');
  box.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const client = clients.find((c) => c.mobile === btn.dataset.pickMobile);
      if (!client) return;
      form.client_name = client.name;
      form.mobile = client.mobile;
      form.address = client.address;
      form.district = client.district;
      renderForm();
    });
  });
}

function save() {
  if (!form.client_name.trim()) {
    toast('Add a client name first');
    $('#clientSearch')?.focus();
    return;
  }
  if (!form.date || !form.team_lead) {
    toast('Date and team are required');
    return;
  }
  if (form.job_type === 'cleaning' && acsTotal(form.units) === 0) {
    toast('Add at least one AC, or switch job type');
    return;
  }
  const notes = form.job_type === 'influencer' && !/influencer/i.test(form.notes || '')
    ? `Influencer (Free)${form.notes ? ' — ' + form.notes : ''}`
    : form.notes;
  const jobs = allJobs();
  const prev = form.job_id ? jobs.find((j) => j.job_id === form.job_id) : null;
  const keepOrder = prev
    && prev.date === form.date
    && prev.team_lead === form.team_lead
    && prev.stack_order != null
    && prev.stack_order !== '';
  const payload = {
    ...form,
    acs: form.job_type === 'cleaning' ? acsLabel(form.units) : '',
    units: form.units,
    notes,
    time: String(form.time || '').trim(),
    team_members: teamMembersOnDay(jobs, form.date, form.team_lead),
    amount: form.job_type === 'cleaning'
      ? (form.amount === '' || form.amount == null ? null : Number(form.amount))
      : null,
    stack_order: keepOrder ? prev.stack_order : nextStackOrder(jobs, form.date, form.team_lead, form.job_id),
  };
  const job = form.job_id ? updateJob(form.job_id, payload) : addJob(payload);
  closeBooking();
  window.dispatchEvent(new CustomEvent('be:booked', { detail: job }));
}

function cancelJob() {
  if (!form.job_id) return;
  if (!confirm('Remove this job from the roster?')) return;
  const name = form.client_name;
  removeJob(form.job_id);
  closeBooking();
  window.dispatchEvent(new CustomEvent('be:toast', { detail: `Cancelled ${name || 'job'}` }));
  window.dispatchEvent(new CustomEvent('be:changed'));
}

function toast(msg) {
  window.dispatchEvent(new CustomEvent('be:toast', { detail: msg }));
}

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}


