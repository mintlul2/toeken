import { readState, writeState, checkLive, countHolders } from '../lib/store.js';

let lastCheck = 0;
const holders = { ca: '', n: null, at: 0, busy: null };
async function holderCount(ca) {
  if (holders.ca !== ca) Object.assign(holders, { ca, n: null, at: 0 });
  if (Date.now() - holders.at > 60000 && !holders.busy) {
    holders.busy = countHolders(ca).then(n => { holders.n = n; }).catch(() => {}).finally(() => { holders.at = Date.now(); holders.busy = null; });
  }
  if (holders.n == null && holders.busy) await Promise.race([holders.busy, new Promise(r => setTimeout(r, 4000))]);
  return holders.n;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const s = await readState();
    // the CA stays hidden until the coin is detected live (or shown manually from admin)
    if (s.ca && !s.live && Date.now() - lastCheck > 15000) {
      lastCheck = Date.now();
      const r = await checkLive(s.ca);
      if (r.live) { s.live = true; s.liveAt = Date.now(); s.liveSource = r.source; s.chart = r.chart || null; await writeState(s); }
    }
    const show = !!s.ca && (s.live || s.forceLive);
    const holderN = show && s.live ? await holderCount(s.ca) : null;
    res.status(200).json({
      app: 'toeken', ca: show ? s.ca : '', live: !!s.live, chart: show ? s.chart : null, holders: holderN,
      protector: s.protector !== false, deterrents: s.deterrents !== false, allowedHosts: s.allowedHosts || [],
    });
  } catch (e) {
    res.status(200).json({ app: 'toeken', ca: '', live: false, chart: null, protector: true, deterrents: true, allowedHosts: [], error: 'state unavailable' });
  }
}
