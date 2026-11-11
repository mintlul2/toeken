"""Builds index.html and admin.html from src/.
Run:  python3 -I build/build.py <path-to-javascript-obfuscator-bin>
Edit the readable site in src/index.src.html, the admin in src/admin.src.html,
the protector in build/protect.js, and the domain list in build/config.json."""
import json, os, re, subprocess, sys, tempfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(root, 'build', 'config.json')))
obf = sys.argv[1]
wm = cfg['watermark']
site = open(os.path.join(root, 'src', 'index.src.html')).read()
prot = open(os.path.join(root, 'build', 'protect.js')).read()
prot = prot.replace('%%OFFICIAL%%', cfg['official']).replace('%%WM%%', wm).replace('%%HOSTS%%', json.dumps(cfg['allowedHosts']))
assert site.count('/*__TOE_PROTECT__*/') == 1
site = site.replace('/*__TOE_PROTECT__*/', prot)
# obfuscate the core site module (the one holding the TOE config); the intro module is left as is
m = [x for x in re.finditer(r'<script type="module">(.*?)</script>', site, re.S) if 'const TOE = {' in x.group(1)]
assert len(m) == 1
src = m[0].group(1)
with tempfile.TemporaryDirectory() as d:
    a, b = os.path.join(d, 'in.js'), os.path.join(d, 'out.js')
    open(a, 'w').write(src)
    subprocess.run([obf, a, '--output', b, '--compact', 'true',
                    '--string-array', 'true', '--string-array-threshold', '0.75', '--string-array-encoding', 'base64',
                    '--identifier-names-generator', 'hexadecimal', '--rename-globals', 'false',
                    '--self-defending', 'false', '--control-flow-flattening', 'false', '--dead-code-injection', 'false'], check=True)
    out = open(b).read()
site = site[:m[0].start(1)] + out + site[m[0].end(1):]
site = site.replace('<head>', f'<head>\n<!-- toeken · build {wm} · © toeken. all rights reserved. -->', 1)
site = site.replace('</head>', f'<meta name="toe-build" content="{wm}">\n</head>', 1)
open(os.path.join(root, 'index.html'), 'w').write(site)
adm = open(os.path.join(root, 'src', 'admin.src.html')).read().replace('%%WM%%', wm).replace('%%OFFICIAL%%', cfg['official'])
open(os.path.join(root, 'admin.html'), 'w').write(adm)
print('built', len(site), 'bytes; watermark', wm)
