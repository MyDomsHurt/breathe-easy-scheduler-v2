import { DISTRICTS, JOB_TYPES, PAYMENTS, SLOTS, TEAM_META, TEAMS, UNIT_TYPES } from './config.js';
import { remainingForTeam, suggestTeams } from './capacity.js';
import { addJob, allJobs } from './store.js';
import { uniqueClientsFrom } from './seed.js';
import { acsLabel, acsTotal, estimateAmount, formatDay, formatSlotTime } from './utils.js';

let form = {
  client_name: '',
  mobile: '',
  address: '',
  district: '',
  units: { S: 0, W: 0, B: 0, C: 0 },
  date: '',
  slot: 'morning',
  team_lead: 'Josh',
  job_type: 'cleaning',
  amount: '',
  payment: 'Unpaid',
  notes: '',
  clientLocked: false,
};

let lastSuggested = [];

function $(sel) {
  return document.querySelector(sel);
}

export function openBooking(prefill = {}) {
  const jobs = allJobs();
  form = {
    client_name: prefill.client_name || '',
    mobile: prefill.mobile || '',
    address: prefill.address || '',
    district: prefill.district || '',
    units: prefill.units || { S: 2, W: 0, B: 0, C: 0 },
    date: prefill.date || '',
    slot: prefill.slot || 'morning',
    team_lead: prefill.team_lead || '',
    job_type: prefill.job_type || 'cleaning',
    amount: prefill.amount || '',
    payment: prefill.payment || 'Unpaid',
    notes: prefill.notes || '',
    clientLocked: false,
  };
  if (!form.date) {
    form.date = new Date().toISOString().slice(0, 10);
  }
  if (form.job_type !== 'cleaning') form.units = { S: 0, W: 0, B: 0, C: 0 };
  if (!form.team_lead) {
    const ranked = suggestTeams(jobs, {
      date: form.date,
      slotId: form.slot,
      district: form.district,
      acsNeeded: neededAcs(),
    });
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

function neededAcs() {
  if (form.job_type !== 'cleaning') return 1;
  return Math.max(1, acsTotal(form.units));
}

function syncAmount() {
  if (form.job_type !== 'cleaning') {
    form.amount = 0;
    return;
  }
  form.amount = estimateAmount(form.units, form.job_type);
}

function renderForm() {
  const jobs = allJobs();
  syncAmount();
  const ranked = suggestTeams(jobs, {
    date: form.date,
    slotId: form.slot,
    district: form.district,
    acsNeeded: neededAcs(),
  });
  lastSuggested = ranked;
  if (form.team_lead && !ranked.find((r) => r.team === form.team_lead)) {
    form.team_lead = ranked[0]?.team || form.team_lead;
  }
  const best = ranked[0];
  const remaining = remainingForTeam(jobs, form.date, form.slot, form.team_lead);
  const fits = remaining >= neededAcs() || form.job_type !== 'cleaning';
  const slot = SLOTS.find((s) => s.id === form.slot);

  $('#bookingRoot').innerHTML = `
    <div class="drawer-bg" data-close="1"></div>
    <aside class="drawer" role="dialog" aria-label="New booking">
      <div class="drawer-head">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <h2>New booking</h2>
            <p>${form.date ? formatDay(form.date, { weekday: 'long' }) : 'Pick a date'} · ${slot?.label || ''} · ${form.team_lead || 'choose team'}</p>
          </div>
          <button class="icon-btn" data-close="1" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="drawer-body">
        <div class="field">
          <label>1. Client</label>
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
          <label>2. Address</label>
          <input id="addressInput" value="${escapeAttr(form.address)}" placeholder="Building, floor, street" />
        </div>

        <div class="field">
          <label>3. ACs</label>
          <div class="stepper-row">
            ${UNIT_TYPES.map((u) => `
              <div class="stepper">
                <span>${u.label} <small style="color:#64748b">${u.id}</small></span>
                <div style="display:flex;gap:6px;align-items:center">
                  <button data-unit="${u.id}" data-delta="-1">−</button>
                  <strong>${form.units[u.id] || 0}</strong>
                  <button data-unit="${u.id}" data-delta="1">+</button>
                </div>
              </div>`).join('')}
          </div>
          <div style="margin-top:8px;font-size:12px;color:#64748b;font-weight:600">
            ${form.job_type === 'cleaning' ? (acsLabel(form.units) || 'No units yet') + ' · est. ' + money(form.amount) : 'Units not required for this job type'}
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>4. Date</label>
            <input id="dateInput" type="date" value="${form.date}" />
          </div>
          <div class="field">
            <label>Time block</label>
            <div class="slot-picks" id="slotPicks">
              ${SLOTS.map((s) => {
                const open = TEAMS.filter((t) => remainingForTeam(jobs, form.date, s.id, t) >= neededAcs()).length;
                return `<button class="pick ${form.slot === s.id ? 'on' : ''}" data-slot="${s.id}">
                  <strong>${s.short}</strong>
                  <div class="meta" style="font-size:11px;color:#64748b">${s.hint}</div>
                  <div style="font-size:11px;font-weight:700;color:${open ? '#047857' : '#b45309'}">${open} teams fit</div>
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="field">
          <label>5. Team · live capacity</label>
          <div class="capacity-live" style="margin-bottom:8px">
            ${fits
              ? `<strong style="color:#047857">${form.team_lead} can take this</strong> · ${remaining} AC units still free in ${slot?.label || 'this slot'}`
              : `<strong style="color:#c2410c">${form.team_lead} is tight</strong> · only ${remaining} free, this job needs ${neededAcs()}. Pick another team or slot.`}
            ${best && best.team !== form.team_lead ? ` · Suggested: <b>${best.team}</b>` : ''}
          </div>
          <div class="team-picks">
            ${ranked.map((r, i) => `
              <button class="team-card ${form.team_lead === r.team ? 'on' : ''}" data-team="${r.team}" style="--team:${TEAM_META[r.team].color}">
                <span class="bar"></span>
                <span>
                  <strong>${r.team}</strong>
                  <div class="meta">${TEAM_META[r.team].members}${r.dayDistricts.length ? ' · already in ' + r.dayDistricts.join(', ') : ''}</div>
                </span>
                <span>
                  ${i === 0 ? '<span class="badge">Best</span>' : ''}
                  <span class="badge ${r.fits ? '' : r.remaining > 0 ? 'warn' : 'bad'}">${r.remaining} left</span>
                </span>
              </button>`).join('')}
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>6. Job type</label>
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
        <div class="grid-2">
          <div class="field">
            <label>Amount (HKD)</label>
            <input id="amountInput" type="number" min="0" step="10" value="${form.amount || 0}" />
          </div>
          <div class="field">
            <label>Notes</label>
            <input id="notesInput" value="${escapeAttr(form.notes)}" placeholder="Access, parking, language…" />
          </div>
        </div>
      </div>
      <div class="drawer-foot">
        <button class="ghost-btn" data-close="1">Cancel</button>
        <button class="primary-btn" id="saveBooking">Save booking</button>
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
  $('#typeInput').addEventListener('change', (e) => { form.job_type = e.target.value; renderForm(); });
  $('#payInput').addEventListener('change', (e) => { form.payment = e.target.value; });
  $('#amountInput').addEventListener('input', (e) => { form.amount = Number(e.target.value || 0); });
  $('#notesInput').addEventListener('input', (e) => { form.notes = e.target.value; });
  root.querySelectorAll('[data-unit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.unit;
      const delta = Number(btn.dataset.delta);
      form.units[id] = Math.max(0, (form.units[id] || 0) + delta);
      renderForm();
    });
  });
  root.querySelectorAll('[data-slot]').forEach((btn) => {
    btn.addEventListener('click', () => { form.slot = btn.dataset.slot; renderForm(); });
  });
  root.querySelectorAll('[data-team]').forEach((btn) => {
    btn.addEventListener('click', () => { form.team_lead = btn.dataset.team; renderForm(); });
  });
  $('#saveBooking').addEventListener('click', save);
}

function renderHits(q) {
  const box = $('#clientHits');
  const clients = uniqueClientsFrom(allJobs());
  const s = String(q || '').trim().toLowerCase();
  const hits = clients.filter((c) => {
    if (!s) return true;
    return `${c.name} ${c.mobile} ${c.address}`.toLowerCase().includes(s);
  }).slice(0, 7);
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
  if (!form.date || !form.slot || !form.team_lead) {
    toast('Date, time and team are required');
    return;
  }
  if (form.job_type === 'cleaning' && acsTotal(form.units) === 0) {
    toast('Add at least one AC, or switch job type');
    return;
  }
  const notes = form.job_type === 'influencer' && !/influencer/i.test(form.notes || '')
    ? `Influencer (Free)${form.notes ? ' — ' + form.notes : ''}`
    : form.notes;
  const job = addJob({
    ...form,
    acs: form.job_type === 'cleaning' ? acsLabel(form.units) : '',
    units: form.units,
    notes,
    time: formatSlotTime(form.slot),
    amount: form.job_type === 'cleaning' ? Number(form.amount || 0) : null,
  });
  closeBooking();
  window.dispatchEvent(new CustomEvent('be:booked', { detail: job }));
}

function toast(msg) {
  window.dispatchEvent(new CustomEvent('be:toast', { detail: msg }));
}

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/</g, '<');
}

function money(n) {
  return '$' + Math.round(Number(n || 0)).toLocaleString('en-HK');
}

export { lastSuggested };
