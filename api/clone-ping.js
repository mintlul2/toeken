import { readState, writeState, readBody } from '../lib/store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const b = await readBody(req);
    const host = String(b.host || '').toLowerCase().replace(/[^a-z0-9.\-:\[\]]/g, '').slice(0, 120);
    if (!host) return res.status(204).end();
    const s = await readState();
    const now = Date.now();
    const c = s.clones[host] || { first: now, last: now, hits: 0, urls: [], wm: null };
    c.last = now; c.hits += 1; c.wm = String(b.wm || '').slice(0, 40) || c.wm;
    const url = String(b.url || '').slice(0, 500);
    if (url && !c.urls.includes(url)) c.urls = [url, ...c.urls].slice(0, 5);
    s.clones[host] = c;
    const keys = Object.keys(s.clones);
    if (keys.length > 200) { keys.sort((a, z) => s.clones[a].last - s.clones[z].last).slice(0, keys.length - 200).forEach(k => delete s.clones[k]); }
    await writeState(s);
  } catch {}
  res.status(204).end();
}
