import { timingSafeEqual, createHash } from 'node:crypto';
import { readState, writeState, readBody, isMint, checkLive } from '../lib/store.js';

const hash = v => createHash('sha256').update(String(v || '')).digest();
const authed = req => !!process.env.ADMIN_PASSWORD && timingSafeEqual(hash(req.headers['x-admin-key']), hash(process.env.ADMIN_PASSWORD));
const view = s => ({ ...s, showing: !!s.ca && (s.live || s.forceLive) });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!authed(req)) { await new Promise(r => setTimeout(r, 600)); return res.status(401).json({ error: 'wrong password' }); }
  const b = await readBody(req);
  try {
    let s = await readState();
    switch (b.action) {
      case 'get': break;
      case 'setCa': {
        const ca = String(b.ca || '').trim();
        if (ca && !isMint(ca)) return res.status(400).json({ error: "that doesn't look like a solana token address" });
        if (ca !== s.ca) Object.assign(s, { ca, live: false, liveAt: null, liveSource: null, chart: null, forceLive: false });
        if (ca) { const r = await checkLive(ca); if (r.live) Object.assign(s, { live: true, liveAt: Date.now(), liveSource: r.source, chart: r.chart || null }); }
        s = await writeState(s); break;
      }
      case 'check': {
        if (!s.ca) return res.status(400).json({ error: 'add the ca first' });
        const r = await checkLive(s.ca);
        if (r.live && !s.live) { Object.assign(s, { live: true, liveAt: Date.now(), liveSource: r.source, chart: r.chart || null }); s = await writeState(s); }
        return res.status(200).json({ state: view(s), found: r.live });
      }
      case 'forceLive': s.forceLive = !!b.value; s = await writeState(s); break;
      case 'resetLive': Object.assign(s, { live: false, liveAt: null, liveSource: null, chart: null, forceLive: false }); s = await writeState(s); break;
      case 'settings': {
        if (typeof b.protector === 'boolean') s.protector = b.protector;
        if (typeof b.deterrents === 'boolean') s.deterrents = b.deterrents;
        if (Array.isArray(b.allowedHosts)) s.allowedHosts = b.allowedHosts.map(h => String(h).toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(h => /^[a-z0-9*.\-]+$/.test(h)).slice(0, 50);
        s = await writeState(s); break;
      }
      case 'forgetClone': delete s.clones[String(b.host || '')]; s = await writeState(s); break;
      default: return res.status(400).json({ error: 'unknown action' });
    }
    res.status(200).json({ state: view(s) });
  } catch (e) {
    res.status(500).json({ error: 'storage error: ' + (e?.message || e) });
  }
}
