import { get, put } from '@vercel/blob';

const PATH = 'toeken/state.json';
export const DEFAULT_STATE = {
  ca: '', forceLive: false, live: false, liveAt: null, liveSource: null, chart: null,
  protector: true, deterrents: true, allowedHosts: [], clones: {}, updatedAt: null,
};

export async function readState() {
  try {
    const r = await get(PATH, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200) return { ...DEFAULT_STATE };
    const text = await new Response(r.stream).text();
    return { ...DEFAULT_STATE, ...JSON.parse(text) };
  } catch (e) {
    if (String(e?.message || e).match(/not found/i)) return { ...DEFAULT_STATE };
    throw e;
  }
}

export async function writeState(state) {
  state.updatedAt = Date.now();
  await put(PATH, JSON.stringify(state), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60,
  });
  return state;
}

export const isMint = v => typeof v === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v.trim());

/* is the coin live? dexscreener pair or a pump.fun coin page = live */
export async function checkLive(ca) {
  const t = AbortSignal.timeout(6000);
  try {
    const r = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(ca)}`, { signal: t, headers: { accept: 'application/json' } });
    if (r.ok) {
      const pairs = await r.json();
      if (Array.isArray(pairs) && pairs.length) return { live: true, source: 'dexscreener', chart: pairs[0].url || `https://dexscreener.com/solana/${ca}` };
    }
  } catch {}
  try {
    const r = await fetch(`https://frontend-api-v3.pump.fun/coins/${encodeURIComponent(ca)}`, {
      signal: AbortSignal.timeout(6000), headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' },
    });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j && (j.mint === ca || j.mint)) return { live: true, source: 'pump.fun', chart: `https://dexscreener.com/solana/${ca}` };
    }
  } catch {}
  return { live: false };
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 20000) break; chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}
