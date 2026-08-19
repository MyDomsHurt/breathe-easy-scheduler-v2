import { TEAM_META } from './config.js';
import { estimateAmount, formatSlotTime, parseAcs, weekNumber } from './utils.js';

/**
 * Prototype seed. Same job fields as the live viewer, plus job_type.
 * Clients are fictional stand-ins so we never copy the live dataset.
 */
export const CLIENTS = [
  { name: 'Laura Warren', mobile: '6010 0567', address: 'Hse A3, 9 Stanley Village Rd, Stanley', district: 'HKS' },
  { name: 'Christy Lai', mobile: '6622 3282', address: 'Flat C, 13/F, Alassio, 100 Caine Road, Mid-Levels', district: 'HKN' },
  { name: 'Daniel Ng', mobile: '9123 4401', address: '12A, Block 2, Residence Bel-Air, Pok Fu Lam', district: 'HKS' },
  { name: 'Sophie Chan', mobile: '6344 2188', address: 'Flat B, 27/F, The Summa, 23 Hing Hon Road', district: 'HKN' },
  { name: 'Marcus Ho', mobile: '9012 7765', address: 'House 8, 18 Deep Water Bay Road', district: 'HKS' },
  { name: 'Emily Tam', mobile: '6118 9034', address: '6C, Tregunter Tower 3, May Road', district: 'HKN' },
  { name: 'Priya Shah', mobile: '9881 2204', address: 'Flat 12, 5/F, 88 Queens Road East, Wan Chai', district: 'HKN' },
  { name: 'James Whitfield', mobile: '5220 1183', address: 'Villa 4, 30 Repulse Bay Road', district: 'HKS' },
  { name: 'Kelly Yip', mobile: '6704 3391', address: '19D, The Masterpiece, 18 Hanoi Road, TST', district: 'KLN' },
  { name: 'Ryan Cheung', mobile: '9188 4412', address: '8B, One Homantin, 1 Sheung Foo Street', district: 'KLN' },
  { name: 'Natalie Kwok', mobile: '6440 7721', address: 'Flat E, 21/F, Laguna Verde, Hung Hom', district: 'KLN' },
  { name: 'Omar Rahman', mobile: '5602 8834', address: 'House 11, 8 Kau To Shan Road, Shatin', district: 'N-T' },
  { name: 'Grace Liu', mobile: '9310 2287', address: '12C, The Wings IIIA, 11 Tong Yin Street', district: 'TKO' },
  { name: 'Ben Wong', mobile: '6091 5543', address: '3A, Park Central, 9 Tong Tak Street', district: 'TKO' },
  { name: 'Alicia Mendes', mobile: '9782 1106', address: 'Flat 9, 16/F, Lohas Park Le Prestige', district: 'TKO' },
  { name: 'Tom Brennan', mobile: '5419 6670', address: 'House 2, Hebe Haven, Sai Kung', district: 'S-K' },
  { name: 'Cindy Lau', mobile: '6233 8901', address: '18B, The Palazzo, 28 Lok King Street, Shatin', district: 'N-T' },
  { name: 'Victor Pang', mobile: '9104 3328', address: 'Villa 6, 22 Castle Peak Road, Tuen Mun', district: 'N-TW' },
  { name: 'Hannah Brooks', mobile: '6882 1475', address: 'Flat A, 32/F, The Long Beach, Olympic', district: 'L-M' },
  { name: 'Leo Mak', mobile: '5541 9902', address: '9C, Banyan Garden, Lai Chi Kok', district: 'L-M' },
  { name: 'Isabelle Fong', mobile: '9720 6634', address: 'House 15, Discovery Bay Valley', district: 'L-T' },
  { name: 'Chris Au', mobile: '6188 2045', address: 'Penthouse, 1 Austin Road West, Kowloon Station', district: 'KLN' },
  { name: 'Maya Patel', mobile: '9344 7710', address: '4B, Festival City, Tai Wai', district: 'N-T' },
  { name: 'Owen Sit', mobile: '5608 3319', address: '11A, Ocean Shores, 88 O King Road', district: 'TKO' },
  { name: 'Rachel Kim', mobile: '9017 2284', address: 'Flat 3, 8/F, 21 Elgin Street, Soho', district: 'HKN' },
  { name: 'David Cheng', mobile: '6472 1108', address: 'House 19, 7 South Bay Close, Repulse Bay', district: 'HKS' },
  { name: 'Fiona Tsang', mobile: '9880 4416', address: '16E, Cullinan West, Nam Cheong', district: 'L-M' },
  { name: 'Alex Rivera', mobile: '5229 7731', address: 'House 3, 14 Fei Ngo Shan Road', district: 'S-K' },
  { name: 'Yuki Mori', mobile: '6711 3058', address: '7D, The Pavilia Bay, Tsuen Wan', district: 'N-TW' },
  { name: 'Samir Khan', mobile: '9183 6620', address: '2A, The Austin, 8 Kwun Chung Street', district: 'KLN' },
  { name: 'Elena Rossi', mobile: '6094 2281', address: 'House 21, 88 Tai Tam Reservoir Road', district: 'HKS' },
  { name: 'Patrick Ip', mobile: '9330 7742', address: '5C, Double Cove, Wu Kai Sha', district: 'N-T' },
  { name: 'Nora Blake', mobile: '5548 9013', address: 'Flat B, 19/F, 8 Mosque Street, Mid-Levels', district: 'HKN' },
  { name: 'Jason Leung', mobile: '9726 1140', address: 'House 9, Fairview Park, Yuen Long', district: 'N-T' },
  { name: 'Amelia Cho', mobile: '6102 8857', address: '10F, Lohas Park The Capitol', district: 'TKO' },
  { name: 'Hugo Martin', mobile: '9884 2209', address: 'Villa 1, 2 Seabee Lane, Discovery Bay', district: 'L-T' },
];

/**
 * Curated 3-week board so availability reads at a glance.
 * [date, slot, team, clientIndex, acs, jobType, time?, notes?, payment?]
 */
const PLAN = [
  ['2026-08-10', 'morning', 'Josh', 4, '3S', 'cleaning', '09.00am => 10.30am', null, 'Payme'],
  ['2026-08-10', 'morning', 'Matthew', 7, '2S 1W', 'cleaning', '09.30am => 11.00am', null, 'FPS'],
  ['2026-08-10', 'late_morning', 'Josh', 1, '1S', 'cleaning', '11.00am => 12.00pm', null, 'Payme'],
  ['2026-08-10', 'afternoon', 'Tiago', 8, '3S', 'cleaning', '01.00pm => 02.30pm', null, 'Cash'],
  ['2026-08-10', 'afternoon', 'Alun', 11, '2B', 'cleaning', '01.30pm => 03.30pm', null, 'Visa'],
  ['2026-08-11', 'morning', 'Nick', 9, '2S', 'cleaning', '09.00am => 10.30am', null, 'FPS'],
  ['2026-08-11', 'late_morning', 'Iggi', 12, '2S', 'cleaning', '11.00am => 12.30pm', null, 'Payme'],
  ['2026-08-11', 'afternoon', 'Matthew', 0, '', 'return', '02.00pm => 02.45pm', 'Return — drain still slow after last clean', 'Unpaid'],
  ['2026-08-12', 'morning', 'Josh', 5, '4S', 'cleaning', '09.00am => 11.00am', null, 'Payme'],
  ['2026-08-12', 'afternoon', 'Tiago', 10, '1C', 'cleaning', '01.00pm => 02.30pm', null, 'FPS'],
  ['2026-08-13', 'morning', 'Alun', 16, '3S', 'cleaning', '09.30am => 11.00am', null, 'Payme'],
  ['2026-08-13', 'late_afternoon', 'Nick', 21, '2S', 'cleaning', '04.00pm => 05.30pm', null, 'Cash'],
  ['2026-08-14', 'morning', 'Iggi', 22, '2S 1W', 'cleaning', '09.00am => 10.45am', null, 'FPS'],
  ['2026-08-14', 'afternoon', 'Josh', 24, '1S', 'influencer', '02.00pm => 03.00pm', 'Influencer (Free) — content day, 1S + photos', null],
  ['2026-08-15', 'morning', 'Matthew', 25, '2B', 'cleaning', '09.00am => 11.00am', null, 'Visa'],
  ['2026-08-17', 'morning', 'Josh', 0, '5B', 'cleaning', '09.00am => 11.00am', '5 built-ins, parking at house', 'Payme'],
  ['2026-08-17', 'morning', 'Matthew', 2, '2S 1W', 'cleaning', '09.00am => 10.45am', null, 'FPS'],
  ['2026-08-17', 'morning', 'Tiago', 8, '3S', 'cleaning', '09.15am => 10.45am', null, 'Payme'],
  ['2026-08-17', 'morning', 'Nick', 9, '2S', 'cleaning', '09.00am => 10.30am', null, 'Cash'],
  ['2026-08-17', 'morning', 'Alun', 11, '2B', 'cleaning', '09.00am => 11.00am', 'Need 30 min setup', 'Visa'],
  ['2026-08-17', 'morning', 'Iggi', 12, '1S', 'cleaning', '09.30am => 10.15am', null, 'Payme'],
  ['2026-08-17', 'late_morning', 'Josh', 3, '2S', 'cleaning', '11.15am => 12.30pm', null, 'FPS'],
  ['2026-08-17', 'late_morning', 'Matthew', 5, '1C', 'cleaning', '11.00am => 12.30pm', null, 'Payme'],
  ['2026-08-17', 'late_morning', 'Tiago', 10, '2S', 'cleaning', '11.30am => 12.45pm', null, 'Unpaid'],
  ['2026-08-17', 'late_morning', 'Nick', 21, '', 'return', '11.00am => 11.40am', 'Return — indoor unit still noisy', 'Unpaid'],
  ['2026-08-17', 'late_morning', 'Alun', 16, '3S', 'cleaning', '11.15am => 12.45pm', null, 'FPS'],
  ['2026-08-17', 'late_morning', 'Iggi', 13, '2S', 'cleaning', '11.00am => 12.15pm', null, 'Payme'],
  ['2026-08-17', 'afternoon', 'Josh', 6, '3S', 'cleaning', '01.00pm => 02.45pm', null, 'Payme'],
  ['2026-08-17', 'afternoon', 'Matthew', 18, '2S', 'cleaning', '01.30pm => 03.00pm', null, 'FPS'],
  ['2026-08-17', 'afternoon', 'Tiago', 19, '1S 1W', 'cleaning', '01.00pm => 02.15pm', null, 'Cash'],
  ['2026-08-17', 'afternoon', 'Nick', 29, '4S', 'cleaning', '01.00pm => 03.15pm', 'Big split job — leave buffer', 'Unpaid'],
  ['2026-08-17', 'afternoon', 'Alun', 22, '2S', 'cleaning', '01.30pm => 03.00pm', null, 'Payme'],
  ['2026-08-17', 'late_afternoon', 'Josh', 32, '1S', 'cleaning', '04.00pm => 05.00pm', null, 'FPS'],
  ['2026-08-17', 'late_afternoon', 'Tiago', 8, '', 'return', '04.00pm => 04.40pm', 'Return — water mark on ceiling after last visit', 'Unpaid'],
  ['2026-08-17', 'late_afternoon', 'Nick', 9, '1S', 'cleaning', '03.45pm => 04.45pm', null, 'Payme'],
  ['2026-08-17', 'late_afternoon', 'Iggi', 23, '', 'return', '04.30pm => 05.15pm', 'Return — remote not pairing', 'Unpaid'],
  ['2026-08-18', 'morning', 'Josh', 24, '2S', 'cleaning', '09.00am => 10.30am', null, 'Payme'],
  ['2026-08-18', 'morning', 'Matthew', 25, '3B', 'cleaning', '09.00am => 11.00am', 'Access via side gate', 'Visa'],
  ['2026-08-18', 'morning', 'Tiago', 29, '2S', 'cleaning', '09.30am => 10.45am', null, 'FPS'],
  ['2026-08-18', 'morning', 'Alun', 31, '2S', 'cleaning', '09.00am => 10.30am', null, 'Payme'],
  ['2026-08-18', 'morning', 'Iggi', 14, '3S', 'cleaning', '09.15am => 10.50am', null, 'Cash'],
  ['2026-08-18', 'late_morning', 'Josh', 1, '1S', 'influencer', '11.30am => 12.30pm', 'Influencer (Free) // 1S strange noises and leaking', null],
  ['2026-08-18', 'late_morning', 'Matthew', 32, '2S', 'cleaning', '11.15am => 12.30pm', null, 'FPS'],
  ['2026-08-18', 'late_morning', 'Nick', 10, '2S 1W', 'cleaning', '11.00am => 12.40pm', null, 'Payme'],
  ['2026-08-18', 'late_morning', 'Alun', 17, '1C', 'cleaning', '11.00am => 12.30pm', null, 'Visa'],
  ['2026-08-18', 'afternoon', 'Josh', 4, '2S', 'cleaning', '01.30pm => 03.00pm', null, 'Payme'],
  ['2026-08-18', 'afternoon', 'Tiago', 21, '3S', 'cleaning', '01.00pm => 02.45pm', null, 'FPS'],
  ['2026-08-18', 'afternoon', 'Nick', 8, '2S', 'cleaning', '01.15pm => 02.30pm', null, 'Unpaid'],
  ['2026-08-18', 'afternoon', 'Iggi', 35, '2S', 'cleaning', '01.00pm => 02.20pm', 'DB ferry 12.20', 'Payme'],
  ['2026-08-18', 'late_afternoon', 'Matthew', 18, '1S', 'cleaning', '04.00pm => 05.00pm', null, 'FPS'],
  ['2026-08-18', 'late_afternoon', 'Tiago', 19, '1S', 'cleaning', '03.45pm => 04.40pm', null, 'Cash'],
  ['2026-08-19', 'morning', 'Josh', 6, '3S', 'cleaning', '09.00am => 10.45am', null, 'Payme'],
  ['2026-08-19', 'morning', 'Matthew', 3, '2S', 'cleaning', '09.15am => 10.30am', null, 'FPS'],
  ['2026-08-19', 'morning', 'Nick', 29, '2S', 'cleaning', '09.00am => 10.20am', null, 'Payme'],
  ['2026-08-19', 'morning', 'Alun', 11, '4S', 'cleaning', '09.00am => 11.00am', 'Four splits, two bedrooms occupied till 9.30', 'Unpaid'],
  ['2026-08-19', 'late_morning', 'Josh', 33, '2S', 'cleaning', '11.15am => 12.30pm', null, 'Payme'],
  ['2026-08-19', 'late_morning', 'Tiago', 9, '', 'return', '11.30am => 12.10pm', 'Return — leftover dust on fins', 'Unpaid'],
  ['2026-08-19', 'late_morning', 'Iggi', 12, '2S', 'cleaning', '11.00am => 12.15pm', null, 'FPS'],
  ['2026-08-19', 'afternoon', 'Matthew', 26, '1S', 'cleaning', '01.30pm => 02.15pm', null, 'Payme'],
  ['2026-08-20', 'morning', 'Josh', 30, '4B', 'cleaning', '09.00am => 11.00am', 'Tai Tam — allow travel', 'Visa'],
  ['2026-08-20', 'morning', 'Tiago', 10, '2S', 'cleaning', '09.30am => 10.45am', null, 'FPS'],
  ['2026-08-20', 'morning', 'Alun', 22, '2S', 'cleaning', '09.00am => 10.20am', null, 'Payme'],
  ['2026-08-20', 'late_morning', 'Matthew', 7, '2S', 'cleaning', '11.00am => 12.15pm', null, 'Payme'],
  ['2026-08-20', 'late_morning', 'Nick', 13, '3S', 'cleaning', '11.15am => 12.45pm', null, 'Cash'],
  ['2026-08-20', 'afternoon', 'Iggi', 14, '2S', 'cleaning', '01.00pm => 02.20pm', null, 'FPS'],
  ['2026-08-20', 'afternoon', 'Alun', 31, '1S', 'cleaning', '01.30pm => 02.15pm', null, 'Payme'],
  ['2026-08-21', 'morning', 'Josh', 32, '2S', 'cleaning', '09.00am => 10.20am', null, 'Unpaid'],
  ['2026-08-21', 'morning', 'Matthew', 2, '1S', 'cleaning', '09.30am => 10.15am', null, 'Payme'],
  ['2026-08-21', 'late_morning', 'Tiago', 21, '2S', 'cleaning', '11.00am => 12.15pm', null, 'FPS'],
  ['2026-08-22', 'morning', 'Josh', 25, '2S', 'cleaning', '09.00am => 10.30am', 'Sat AM only', 'Payme'],
  ['2026-08-22', 'morning', 'Tiago', 8, '3S', 'cleaning', '09.00am => 10.45am', null, 'Cash'],
  ['2026-08-22', 'morning', 'Alun', 16, '2S', 'cleaning', '09.15am => 10.30am', null, 'FPS'],
  ['2026-08-22', 'late_morning', 'Matthew', 5, '2S', 'cleaning', '11.00am => 12.15pm', null, 'Payme'],
  ['2026-08-22', 'late_morning', 'Nick', 34, '1S', 'cleaning', '11.30am => 12.15pm', null, 'Unpaid'],
  ['2026-08-24', 'morning', 'Josh', 4, '3S', 'cleaning', '09.00am => 10.40am', null, 'Unpaid'],
  ['2026-08-24', 'late_morning', 'Matthew', 0, '2S', 'cleaning', '11.00am => 12.20pm', null, 'Unpaid'],
  ['2026-08-24', 'afternoon', 'Tiago', 29, '2S', 'cleaning', '01.00pm => 02.20pm', null, 'Unpaid'],
  ['2026-08-25', 'morning', 'Alun', 11, '2B', 'cleaning', '09.00am => 11.00am', null, 'Unpaid'],
  ['2026-08-25', 'late_morning', 'Iggi', 12, '1S', 'influencer', '11.30am => 12.30pm', 'Influencer (Free) — Reels at Lohas', null],
  ['2026-08-25', 'afternoon', 'Nick', 9, '', 'return', '02.00pm => 02.40pm', 'Return — check indoor coil', 'Unpaid'],
  ['2026-08-26', 'morning', 'Josh', 24, '2S', 'cleaning', '09.00am => 10.20am', null, 'Unpaid'],
  ['2026-08-26', 'morning', 'Matthew', 7, '1S 1W', 'cleaning', '09.30am => 10.45am', null, 'Unpaid'],
  ['2026-08-27', 'late_morning', 'Tiago', 10, '3S', 'cleaning', '11.00am => 12.30pm', null, 'Unpaid'],
  ['2026-08-28', 'morning', 'Iggi', 14, '2S', 'cleaning', '09.00am => 10.20am', null, 'Unpaid'],
];

function invoiceFor(i, type) {
  if (type === 'influencer' || type === 'return') return null;
  return `Inv ${5400 + i}`;
}

export function buildSeedJobs() {
  const counters = {};
  return PLAN.map((row, i) => {
    const [date, slot, team, clientIdx, acs, jobType, time, notes, payment] = row;
    const client = CLIENTS[clientIdx];
    counters[date + team] = (counters[date + team] || 0) + 1;
    const n = counters[date + team];
    const type = jobType || 'cleaning';
    const counts = parseAcs(acs);
    const amount = estimateAmount(counts, type);
    const paid = payment && payment !== 'Unpaid';
    return {
      job_id: `${date}-${team.toLowerCase()}-${n}`,
      date,
      week: weekNumber(date),
      slot,
      team_lead: team,
      team_members: TEAM_META[team].members,
      client_name: client.name,
      time: time || formatSlotTime(slot),
      mobile: client.mobile,
      address: client.address,
      acs: acs || '',
      notes: notes || null,
      amount: amount || null,
      invoice: invoiceFor(i, type),
      receipt: paid ? invoiceFor(i, type) : null,
      payment: payment || null,
      is_return: type === 'return',
      district: client.district,
      job_type: type,
      source: 'seed',
    };
  });
}

export function uniqueClientsFrom(jobs) {
  const map = new Map();
  for (const c of CLIENTS) {
    map.set(c.mobile.replace(/\s+/g, ''), { ...c });
  }
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
