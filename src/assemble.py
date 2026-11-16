"""assemble.py <three base URL or path> <out.html>
Builds the page: inlines the model, data, fonts, kids.js, translations and the list of narration lines
(every language / gender version) that heart_voice.py records."""
import base64, json, sys, re, subprocess
base = sys.argv[1]; out = sys.argv[2]
subprocess.run([sys.executable, 'i18n_src.py'], check=True, stdout=subprocess.DEVNULL)
I = json.load(open('i18n.json', encoding='utf-8'))
t = open('template.html', encoding='utf-8').read()
t = t.replace('/*__KIDS__*/', open('kids.js', encoding='utf-8').read())
d = json.load(open('heartdata.json')); d.pop('chambers', None)
mods = open('fist.js', encoding='utf-8').read() + '\n' + open('alveoli.js', encoding='utf-8').read()

# ---- fonts (inlined: no request to Google or any other server) ----
RANGES = {'hebrew': 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F',
          'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'}
fonts = ''
for sub, rng in RANGES.items():
    for w in (500, 700, 900):
        b64 = base64.b64encode(open(f'fonts/rubik-{sub}-{w}-normal.woff2', 'rb').read()).decode()
        fonts += f"@font-face{{font-family:'Rubik';font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b64}) format('woff2');unicode-range:{rng};}}\n"
t = t.replace('/*__FONTS__*/', fonts)

# ---- narration lines (must match speak() in the page) ----
EMO = re.compile('[\U0001F300-\U0001FAFF☀-➿️‍]')
EDGE = re.compile(r'^([\U0001F000-\U0001FAFF←-⇿⌀-⏿⬀-⯿☀-➿️‍⃣\s]*)([\s\S]*?)([\U0001F000-\U0001FAFF←-⇿⌀-⏿⬀-⯿☀-➿️‍⃣\s]*)$')
def clean(x): return re.sub(r'\s+', ' ', EMO.sub('', x)).strip()
def vkey(x):
    b = clean(x).encode('utf-16-le'); h = 0x811c9dc5
    for i in range(0, len(b), 2): h ^= int.from_bytes(b[i:i + 2], 'little'); h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')
def look(D, s):
    if s in D: return D[s]
    m = EDGE.match(s)
    if m and m.group(2) != s and m.group(2) in D: return m.group(1) + D[m.group(2)] + m.group(3)
NAME = re.compile(r'ליה|\bLia\b')
def strip_name(v):
    r = re.sub(r'[,،]?\s*(ליה|\bLia\b)\s*[,،]?', ' ', v); r = re.sub(r'\s+([!?.,…])', r'\1', r); r = re.sub(r'\s+', ' ', r).strip()
    r = re.sub(r'^[,!.\s]+', '', r); return r[:1].upper() + r[1:] if r[:1].islower() else r
def spoken(v): return clean(strip_name(v) if NAME.search(v) else v)

js = t[t.index('<script type="module">'):]
src = []
for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", js):
    s_ = m.group(1)
    if not re.search('[֐-׿]', s_) or '${' in s_ or '<' in s_ or '{' in s_ or re.match(r'^[A-Z]+ —', clean(s_)): continue
    if s_ in I['display']: continue
    src.append(s_)
for a in I['adv'].values(): src += list(a.values())
lines, seen = [], set()
def add(text, l):
    c = clean(text)
    if len(c) < 2: return
    k = vkey(c)
    if k in seen: return
    seen.add(k); lines.append({'k': k, 't': c, 'l': l})
for s_ in src:
    add(spoken(s_), 'he')
    m_ = look(I['m'], s_);  m_ and add(spoken(m_), 'he')
    e_ = look(I['en'], s_); e_ and add(spoken(e_), 'en')
for he, en in I['names']: add(he + '!', 'he'); add(en + '!', 'en')

vl = '<script id="voice-lines" type="application/json">' + json.dumps(lines, ensure_ascii=False) + '</script>\n'
t = t.replace('<script type="importmap">', vl + '<script type="importmap">', 1)
I.pop('display', None)
t = t.replace('__I18N__', json.dumps(I, ensure_ascii=False, separators=(',', ':')))
t = t.replace('/*__MODULES__*/', mods)
t = t.replace('__FAVICON__', base64.b64encode(open('icons/favicon-48.png','rb').read()).decode())
if base.startswith('./lib'):   # GitHub site: iOS uses a real file for the home-screen icon
    t = t.replace('data:image/png;base64,__APPLEICON__', 'icons/apple-touch-icon.png')
t = t.replace('__APPLEICON__', base64.b64encode(open('icons/apple-touch-icon.png','rb').read()).decode())
import datetime
t = t.replace('__VERSION__', datetime.datetime.now().strftime('%Y%m%d%H%M'))
t = t.replace('__LOGO_SVG__', base64.b64encode(open('logo.svg','rb').read()).decode())
t = t.replace('__THREE__', base).replace('__DATA__', json.dumps(d, separators=(',', ':'))).replace('__GLB__', base64.b64encode(open('heart_mo.glb', 'rb').read()).decode())
open(out, 'w', encoding='utf-8').write(t)
print(out, len(t)//1024, 'KB', len(lines), 'voice lines', sum(1 for x in lines if x['l'] == 'en'), 'en')
