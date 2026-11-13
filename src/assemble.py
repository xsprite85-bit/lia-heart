import base64, json, sys, re
base = sys.argv[1]; out = sys.argv[2]
t = open('template.html', encoding='utf-8').read()
d = json.load(open('heartdata.json')); d.pop('chambers', None)
mods = open('fist.js', encoding='utf-8').read() + '\n' + open('alveoli.js', encoding='utf-8').read()
# --- narration lines for the Gemini voice pack ---
js = t[t.index('<script type="module">'):]
EMO = re.compile('[\U0001F300-\U0001FAFF☀-➿️‍]')
def clean(x): return re.sub(r'\s+', ' ', EMO.sub('', x)).strip()
def vkey(x):
    h = 0x811c9dc5
    for unit in clean(x).encode('utf-16-le').hex() and [int.from_bytes(clean(x).encode('utf-16-le')[i:i+2], 'little') for i in range(0, len(clean(x).encode('utf-16-le')), 2)]:
        h ^= unit; h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')
lines, seen = [], set()
for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", js):
    s_ = m.group(1)
    if not re.search('[֐-׿]', s_): continue
    c = clean(s_)
    if len(c) < 2 or '${' in s_ or '<' in s_ or re.match(r'^[A-Z]+ —', c): continue
    k = vkey(c)
    if k in seen: continue
    seen.add(k); lines.append({'k': k, 't': c})
vl = '<script id="voice-lines" type="application/json">' + json.dumps(lines, ensure_ascii=False) + '</script>\n'
t = t.replace('<script type="importmap">', vl + '<script type="importmap">', 1)
t = t.replace('/*__MODULES__*/', mods)
t = t.replace('__FAVICON__', base64.b64encode(open('icons/favicon-48.png','rb').read()).decode())
t = t.replace('__APPLEICON__', base64.b64encode(open('icons/apple-touch-icon.png','rb').read()).decode())
t = t.replace('__LOGO_SVG__', base64.b64encode(open('logo.svg','rb').read()).decode())
t = t.replace('__THREE__', base).replace('__DATA__', json.dumps(d, separators=(',', ':'))).replace('__GLB__', base64.b64encode(open('heart_mo.glb', 'rb').read()).decode())
open(out, 'w', encoding='utf-8').write(t)
print(out, len(t)//1024, 'KB', len(lines), 'voice lines')
