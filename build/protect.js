/* ---------------- site protection (built in by build/build.py) ---------------- */
var __TOE_OFFICIAL__ = '%%OFFICIAL%%';
var __TOE_WM__ = '%%WM%%';
var __TOE_HOSTS__ = %%HOSTS%%;
var __TOE_EXTRA__ = [];
var __TOE_ON__ = true, __TOE_DET__ = true, __TOE_TRIPPED__ = false;
function __TOE_HOSTOK__(h) {
  if (location.protocol === 'file:' || !h) return true;
  h = String(h).toLowerCase().replace(/\.$/, '');
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(h) || /\.localhost$/.test(h)) return true;
  var list = __TOE_HOSTS__.concat(__TOE_EXTRA__);
  for (var i = 0; i < list.length; i++) {
    var a = String(list[i]).toLowerCase().trim(); if (!a) continue;
    if (a.indexOf('*') >= 0) { var re = new RegExp('^' + a.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]*') + '$'); if (re.test(h)) return true; }
    else if (a === h || 'www.' + a === h) return true;
  }
  return false;
}
function __TOE_GUARD__() {
  if (__TOE_TRIPPED__) return false;
  if (!__TOE_ON__ || __TOE_HOSTOK__(location.hostname)) return true;
  __TOE_TRIP__(); return false;
}
function __TOE_TRIP__() {
  if (__TOE_TRIPPED__) return; __TOE_TRIPPED__ = true;
  var real = __TOE_OFFICIAL__, host = location.hostname;
  try { navigator.sendBeacon(real + '/api/clone-ping', JSON.stringify({ host: host, url: location.href.slice(0, 500), t: Date.now(), wm: __TOE_WM__ })); } catch (e) {}
  try { document.querySelectorAll('audio,video').forEach(function (m) { m.pause(); }); } catch (e) {}
  var d = document, shown = real.replace(/^https?:\/\//, '');
  d.title = 'copy of $toe';
  d.body.innerHTML = '<div style="position:fixed;inset:0;z-index:2147483647;background:#050e20;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font:600 16px/1.5 Helvetica,Arial,sans-serif;text-align:center">'
    + '<div style="max-width:560px"><div style="font-weight:800;font-size:28px;margin-bottom:.6em">This is a copy.</div>'
    + '<div>The official site is <a style="color:#fff" href="' + real + '">' + shown + '</a>.</div>'
    + '<div id="__toeRealCa" style="margin-top:1.2em;font:600 13px/1.4 ui-monospace,Menlo,monospace;opacity:.8;word-break:break-all"></div>'
    + '<div style="margin-top:1.4em;opacity:.6;font-size:13px">taking you there in a few seconds…</div></div></div>';
  fetch(real + '/api/state', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
    var el = d.getElementById('__toeRealCa'); if (el) el.textContent = j && j.ca ? 'real ca: ' + j.ca : 'real ca: coming soon';
  }).catch(function () {});
  setTimeout(function () { location.replace(real); }, 6000);
}
function __TOE_SETTINGS__(j) {
  __TOE_ON__ = j.protector !== false;
  __TOE_DET__ = j.deterrents !== false;
  __TOE_EXTRA__ = Array.isArray(j.allowedHosts) ? j.allowedHosts.slice(0, 50) : [];
  document.documentElement.classList.toggle('toe-nosel', __TOE_DET__);
  __TOE_GUARD__();
}
document.documentElement.style.setProperty('--toe-wm', '"' + __TOE_WM__ + '"');
document.documentElement.classList.add('toe-nosel');
document.addEventListener('contextmenu', function (e) {
  if (!__TOE_DET__) return;
  if (e.target.closest && e.target.closest('a, input, textarea, [contenteditable]')) return;
  e.preventDefault();
});
document.addEventListener('keydown', function (e) {
  if (!__TOE_DET__) return;
  var k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === 'f12' || (mod && (k === 'u' || k === 's')) || (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) || (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u'))) e.preventDefault();
}, true);
__TOE_GUARD__();
setInterval(__TOE_GUARD__, 4000);
