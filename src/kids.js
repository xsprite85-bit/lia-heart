// ================= kids: profiles, language, parents, new games =================
function toast(e, txt) { $('#toast').firstChild.nodeValue = e || '⭐'; $('#toastText').textContent = txt ? tr(txt) : ''; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 1600); }

// ---------- translate the static page ----------
const DYN = '#verBanner,#titleTxt,#bubble,#toast,#ecgCap,#rideStage,#missionList,#quizQ,#quizOpts,#profRow,#pList,#animalGrid,#goodE,#goodT,#goodProg,#gateQ,#gateErr,#rankTxt,#mineBeats,#mineLit,#mineCmp,#mineNote,#anTitle,#anEmo,#anBpm,#anSize,#pfAgeV,#pfLvl,#pfSug,#pfEmo,#privText,#pEcoNow,#starCount,#bpmVal,#bpmEmo,#bpSys,#bpDia,#bpNow,#volMin,#volHour,#volNow,#ecgBpm,#drumN,#rideDot,#exitbtn,#flowToggle,#slowBtn,#loadMsg,#langBtn,#profH,#pfDel';
const ORIG = new WeakMap();
function applyI18n() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const p = n.parentElement; if (!p || p.closest('script,style,svg') || p.closest(DYN)) continue;
    if (!ORIG.has(n)) { if (!/[א-ת]/.test(n.nodeValue)) continue; ORIG.set(n, n.nodeValue); }
    const o = ORIG.get(n), core = o.trim(); if (!core) continue;
    n.nodeValue = o.replace(core, tr(core));
  }
  document.querySelectorAll('[title]').forEach(el => { if (el.dataset.t0 == null) el.dataset.t0 = el.title; el.title = tr(el.dataset.t0); el.setAttribute('aria-label', el.title); });
  $('#titleTxt').textContent = document.title = P ? tr('הלב של ליה') : tr('הלב שלי');
  $('#langBtn').textContent = lang === 'en' ? '🌐 עברית' : '🌐 English';
  $('#flowToggle').textContent = tr(S.flow ? 'להסתיר' : 'להציג');
  $('#slowBtn').textContent = tr(S.slow ? '🐌 הילוך איטי — פועל' : '🐌 הילוך איטי');
  $('#bpmEmo').textContent = bpmEmoji(S.bpm);
  $('#privText').innerHTML = PRIVACY[lang] + (location.hostname.endsWith('github.io') ? `<p><a href="privacy.html" target="_blank" rel="noopener">${lang === 'en' ? 'Full privacy policy' : 'מדיניות הפרטיות המלאה'}</a></p>` : '');
  $('#exitbtn').textContent = tr(S.alv ? '⬅️ חזרה ללב' : '⬅️ לצאת מהלב');
  renderProfRow(); updStars(); if (S.mine) updMineBox(true);
}
function setLang(l) { lang = l; store.set('lang', l); applyI18n(); renderParent(); }
$('#langBtn').onclick = () => { audio(); setLang(lang === 'en' ? 'he' : 'en'); };

// ---------- profiles ----------
function selectProfile(id) {
  P = profiles.find(p => p.id === id) || null; store.set('cur', P ? P.id : 0);
  done = new Set(store.pget('done', [])); roomsSeen = new Set(store.pget('rooms', [])); animalsSeen = new Set(store.pget('animals', []));
  if (S.mine) setMine(false);
  applyI18n();
}
function renderProfRow() {
  const R = $('#profRow'); R.innerHTML = '';
  for (const p of profiles) { const b = document.createElement('button'); b.className = 'pf' + (P && p.id === P.id ? ' on' : '');
    b.innerHTML = `<span class="e">${p.emo}</span>`; b.append(lang === 'en' ? (p.nameEn || p.name) : p.name);
    b.onclick = () => { audio(); selectProfile(p.id); }; R.appendChild(b); }
  const a = document.createElement('button'); a.className = 'pf add'; a.innerHTML = '<span class="e">➕</span>'; a.append(tr(profiles.length ? 'עוד ילד' : 'מי משחק?'));
  a.onclick = () => { audio(); openGate(() => openProf(null)); }; R.appendChild(a);
  $('#startH').style.visibility = P ? '' : 'hidden';
}
const NAMES = I18N.names;   // [hebrew, english] — names that have a recorded voice clip
const EMOS = ['👧', '👦', '🧒', '👶', '🦸‍♀️', '🦸‍♂️', '🧚‍♀️', '🐱', '🐶', '🦄', '🦖', '🐼', '🐸', '🚀'];
let edit = null;
function openProf(p) {
  edit = p ? { ...p } : { id: 0, name: '', nameEn: '', g: 'f', age: 5, emo: '👧', birth: '' };
  $('#profH').textContent = tr(p ? 'עריכה' : 'ילד או ילדה חדשים');
  $('#pfName').value = lang === 'en' ? (edit.nameEn || edit.name) : edit.name;
  const sug = $('#pfSug'); sug.innerHTML = '';
  for (const [he, en] of NAMES) { const b = document.createElement('button'); b.textContent = lang === 'en' ? en : he;
    b.onclick = () => { edit.name = he; edit.nameEn = en; $('#pfName').value = b.textContent; }; sug.appendChild(b); }
  $('#pfDel').style.display = p ? '' : 'none'; $('#pfDel').textContent = tr('מחיקה'); $('#pfDel').dataset.sure = '';
  $('#pfBirth').value = edit.birth || ''; $('#pfBirth').max = new Date().toISOString().slice(0, 10);
  syncProf(); openPop('#profPop');
}
function syncProf() {
  document.querySelectorAll('#pfG button').forEach(b => b.classList.toggle('on', b.dataset.v === edit.g));
  $('#pfAge').value = edit.age; $('#pfAgeV').textContent = edit.age;
  const L = edit.age <= 6 ? 1 : edit.age <= 10 ? 2 : 3;
  $('#pfLvl').textContent = tr(['', 'הסברים פשוטים ומשחקיים', 'הסברים עם קצת יותר מדע', 'הסברים מדעיים, עם המונחים האמיתיים'][L]);
  const E = $('#pfEmo'); E.innerHTML = '';
  for (const e of EMOS) { const b = document.createElement('button'); b.textContent = e; b.classList.toggle('on', e === edit.emo); b.onclick = () => { edit.emo = e; syncProf(); }; E.appendChild(b); }
}
$('#pfName').oninput = e => { const v = e.target.value.trim(); const k = NAMES.find(n => n[0] === v || n[1].toLowerCase() === v.toLowerCase());
  if (k) { edit.name = k[0]; edit.nameEn = k[1]; } else { edit.name = v; edit.nameEn = v; } };
document.querySelectorAll('#pfG button').forEach(b => b.onclick = () => { edit.g = b.dataset.v;
  if (edit.emo === '👧' || edit.emo === '👦') edit.emo = edit.g === 'm' ? '👦' : '👧'; syncProf(); });
$('#pfAge').oninput = e => { edit.age = +e.target.value; syncProf(); };
$('#pfBirth').onchange = e => { const v = e.target.value; const d = new Date(v);
  if (!v || isNaN(d) || d > new Date()) { edit.birth = ''; e.target.value = ''; return; }
  edit.birth = v; edit.age = Math.max(3, Math.min(14, Math.floor((Date.now() - d) / 3.15576e10))); syncProf(); };
$('#pfSave').onclick = () => {
  if (!edit.name) { $('#pfName').focus(); return; }
  if (!edit.id) { edit.id = Math.max(0, ...profiles.map(p => p.id)) + 1; profiles.push(edit); }
  else profiles[profiles.findIndex(p => p.id === edit.id)] = edit;
  store.set('profiles', profiles); closePops(); selectProfile(edit.id); renderParent();
};
$('#pfDel').onclick = () => {
  const b = $('#pfDel'); if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = tr('בטוחים? ללחוץ שוב'); return; }
  profiles = profiles.filter(p => p.id !== edit.id); store.set('profiles', profiles);
  try { Object.keys(localStorage).filter(k => k.startsWith('lia-heart-p' + edit.id + '-')).forEach(k => localStorage.removeItem(k)); } catch {}
  closePops(); selectProfile(profiles[0]?.id ?? 0); renderParent();
};
$('#titleBtn').onclick = () => { audio(); stopVoice(); closePops(); renderProfRow(); $('#start').classList.remove('hide'); };

// ---------- parents: gate + corner ----------
let gateCb = null, gateAns = 0;
function openGate(cb) {
  gateCb = cb; const a = 12 + Math.floor(Math.random() * 27), b = 11 + Math.floor(Math.random() * 19); gateAns = a + b;
  $('#gateQ').textContent = `${a} + ${b} = ?`; $('#gateA').value = ''; $('#gateErr').textContent = '';
  openPop('#gatePop'); setTimeout(() => $('#gateA').focus(), 300);
}
$('#gateGo').onclick = () => { if (+$('#gateA').value === gateAns) { const cb = gateCb; gateCb = null; closePops(); cb && cb(); }
  else { $('#gateErr').textContent = tr('לא נכון — נסו שוב'); openGate(gateCb); $('#gateErr').textContent = tr('לא נכון — נסו שוב'); } };
$('#gateA').onkeydown = e => { if (e.key === 'Enter') $('#gateGo').click(); };
$('#parentBtn').onclick = () => { audio(); openGate(() => { renderParent(); openPop('#parentPop'); }); };
function renderParent() {
  const L = $('#pList'); L.innerHTML = '';
  for (const p of profiles) { const d = document.createElement('div'); d.className = 'pi';
    d.innerHTML = `<span class="e">${p.emo}</span><span class="n"></span><button>✏️</button>`;
    d.querySelector('.n').textContent = (lang === 'en' ? (p.nameEn || p.name) : p.name) + ' · ' + p.age;
    d.querySelector('button').onclick = () => openProf(p); L.appendChild(d); }
  document.querySelectorAll('#pLang button').forEach(b => b.classList.toggle('on', b.dataset.v === lang));
  document.querySelectorAll('#pEco button').forEach(b => b.classList.toggle('on', b.dataset.v === ecoPref));
  $('#pEcoNow').textContent = tr(eco ? 'כרגע: מצב חסכוני (פחות תאי דם, תמונה פשוטה יותר)' : 'כרגע: איכות מלאה');
}
$('#pAdd').onclick = () => openProf(null);
document.querySelectorAll('#pLang button').forEach(b => b.onclick = () => setLang(b.dataset.v));
document.querySelectorAll('#pEco button').forEach(b => b.onclick = () => { ecoPref = b.dataset.v; store.set('eco', ecoPref); setEco(ecoPref === 'on' || (ecoPref === 'auto' && ecoAuto)); renderParent(); });

const PRIVACY = {
  he: `<p><b>בקצרה: האפליקציה לא אוספת שום מידע.</b> אין הרשמה, אין חשבונות, אין פרסומות, אין כלי מעקב או סטטיסטיקה, ואין רכישות.</p>
<p><b>מה נשמר, ואיפה:</b> השם, הגיל, בן או בת, הדמות, תאריך הלידה (אם הוזן), הכוכבים וההגדרות נשמרים רק בזיכרון של הדפדפן בטלפון הזה. הם לא נשלחים לשום שרת, ואף אחד — גם לא היוצר — לא יכול לראות אותם.</p>
<p><b>חיבור לאינטרנט:</b> האפליקציה נטענת מ־GitHub Pages, שמקבל כמו כל אתר את כתובת ה־IP לצורך הצגת הדף. אחרי הטעינה הראשונה היא עובדת גם בלי אינטרנט. אין בה קישורים החוצה לילדים — הקישור היחיד נמצא כאן, בפינת ההורים.</p>
<p><b>מצלמה, מיקרופון ומיקום:</b> לא בשימוש.</p>
<p><b>מחיקה:</b> אפשר למחוק ילד בלחיצה על ✏️ ואז "מחיקה", או למחוק את כל הנתונים דרך הגדרות הדפדפן ← נתוני אתרים.</p>
<p><b>ילדים:</b> האפליקציה נבנתה לילדים, לשימוש יחד עם הורה, ועומדת בעקרונות COPPA ו־GDPR לילדים — כי פשוט אין בה איסוף מידע.</p>
<p><b>יצירת קשר:</b> Tinker Doodle · <span dir="ltr">tinkerdoodle.games@gmail.com</span> · עודכן: נובמבר 2026</p>`,
  en: `<p><b>In short: this app collects no information.</b> No sign-up, no accounts, no ads, no tracking or analytics, no purchases.</p>
<p><b>What is stored, and where:</b> the name, age, boy/girl, character, birth date (if entered), stars and settings are kept only in this phone's browser storage. They are never sent to any server, and no one — not even the developer — can see them.</p>
<p><b>Internet:</b> the app is loaded from GitHub Pages, which, like any website, receives your IP address to deliver the page. After the first load it works offline. There are no outside links for children — the only link is here, in the parents' corner.</p>
<p><b>Camera, microphone, location:</b> not used.</p>
<p><b>Deleting:</b> tap ✏️ next to a child and then "Delete", or clear everything in your browser settings → site data.</p>
<p><b>Children:</b> made for children, to be used with a parent, and in line with COPPA and GDPR-K principles — simply because nothing is collected.</p>
<p><b>Contact:</b> Tinker Doodle · tinkerdoodle.games@gmail.com · Updated: November 2026</p>`
};

// ---------- ranks & certificate ----------
const RANKS = [
  { n: 0, e: '🔍', t: 'חוקרת מתחילה' },
  { n: 6, e: '🩺', t: 'חוקרת לב', say: 'עכשיו את חוקרת לב אמיתית! המשיכי לאסוף כוכבים.' },
  { n: 15, e: '❤️', t: 'מומחית ללב', say: 'וואו! את כבר מומחית ללב. את יודעת איך הדם זורם ולמה הלב פועם.' },
  { n: 25, e: '⚕️', t: 'רופאת לב צעירה', say: 'את רופאת לב צעירה! עוד קצת — ותאספי את כל הכוכבים.' },
  { n: 999, e: '🏆', t: 'אלופת הלב' },
];
const rankIdx = () => done.size >= MISSIONS.length ? RANKS.length - 1 : RANKS.reduce((a, r, i) => done.size >= r.n ? i : a, 0);
let rankUp = null;
function checkRank() { const r = rankIdx(); if (r > store.pget('rank', 0)) { store.pset('rank', r); if (RANKS[r].say) rankUp = r; } }
function rankLabel() { const r = RANKS[rankIdx()]; return r.e + ' ' + tr(r.t); }
$('#certBtn').onclick = async () => { audio(); await makeCert(); openPop('#certPop'); mission('cert');
  say('📜 התעודה שלך', 'הנה התעודה שלך! אפשר לשמור אותה ולהראות לכל המשפחה.'); };
async function makeCert() {
  try { await document.fonts.ready; } catch {}
  const W = 1600, H = 1130, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fff5f9'); g.addColorStop(1, '#efe6ff'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#ff5d8f'; x.lineWidth = 16; x.strokeRect(36, 36, W - 72, H - 72); x.strokeStyle = '#ffd43b'; x.lineWidth = 6; x.strokeRect(66, 66, W - 132, H - 132);
  const logo = new Image(); logo.src = $('#start img').src; await logo.decode().catch(() => {});
  try { x.drawImage(logo, W / 2 - 110, 110, 220, 220); } catch {}
  x.direction = lang === 'en' ? 'ltr' : 'rtl'; x.textAlign = 'center'; x.fillStyle = '#2b1340';
  x.font = '900 92px Rubik'; x.fillText(tr('תעודת חוקרת לב'), W / 2, 440);
  x.font = '500 44px Rubik'; x.fillText(tr('התעודה מוענקת ל'), W / 2, 530);
  x.font = '900 120px Rubik'; x.fillStyle = '#c9184a'; x.fillText(pname(), W / 2, 670);
  x.font = '700 58px Rubik'; x.fillStyle = '#2b1340'; x.fillText(rankLabel(), W / 2, 780);
  x.font = '500 42px Rubik'; x.fillText(tr('על חקירת הלב, הדם והריאות') + `   ⭐ ${done.size}/${MISSIONS.length}`, W / 2, 870);
  x.font = '500 34px Rubik'; x.fillStyle = '#6b5a80'; x.fillText(new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'he-IL') + '  ·  ❤️ ' + tr('הלב של ליה'), W / 2, 980);
  const url = c.toDataURL('image/png'); $('#certImg').src = url; $('#certSave').href = url; certBlob = await new Promise(r => c.toBlob(r));
}
let certBlob = null;
$('#certShare').style.display = navigator.canShare ? '' : 'none';
$('#certShare').onclick = async () => { try { const f = new File([certBlob], 'heart-certificate.png', { type: 'image/png' }); if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: tr('תעודת חוקרת לב') }); } catch {} };

// ---------- my heart since I was born ----------
const hrAt = a => a < 1 ? 130 : a < 2 ? 115 : a < 4 ? 105 : a < 6 ? 95 : a < 10 ? 88 : a < 14 ? 82 : 76;   // average over a whole day
const svAt = a => Math.min(70, 6 + 4.5 * a) / 1000;                                                    // litres per beat, roughly
let mine = null;
function mineStart() {
  const now = Date.now(), b = P && P.birth ? new Date(P.birth).getTime() : now - ((P ? P.age : 5) + 0.5) * 3.15576e10;
  let beats = 0, lit = 0; const days = Math.max(0, (now - b) / 864e5);
  for (let d = 0; d < days; d++) { const a = d / 365.25, f = Math.min(1, days - d), n = hrAt(a) * 1440 * f; beats += n; lit += n * svAt(a); }
  return { beats, lit, age: days / 365.25, exact: !!(P && P.birth) };
}
function setMine(on) {
  S.mine = on; $('#mineBox').classList.toggle('show', on); document.querySelector('.tool[data-t="mine"]').classList.toggle('on', on);
  if (!on) { mine = null; return; }
  if (S.bp) setBP(false); if (S.vol) setVol(false); if (S.animal) endAnimal();
  mine = mineStart(); updMineBox(true); mission('mine'); openTray(null);
  say('🎂 הלב שלי מאז שנולדתי', 'מאז שנולדת, הלב שלך לא עצר אפילו פעם אחת! תראי כמה פעמים הוא כבר פעם — והמספר ממשיך לגדול עם כל פעימה.');
}
function updMineBox(full) {
  if (!mine) return;
  const loc = lang === 'en' ? 'en-US' : 'he-IL';
  $('#mineBeats').textContent = Math.floor(mine.beats).toLocaleString(loc);
  if (!full) return;
  $('#mineLit').textContent = Math.round(mine.lit).toLocaleString(loc);
  const pools = mine.lit / 2.5e6;
  $('#mineCmp').textContent = pools >= 1 ? tr('🏊 כמו {n} בריכות שחייה אולימפיות!').replace('{n}', pools.toFixed(1)) : tr('🛁 כמו {n} אמבטיות מלאות!').replace('{n}', Math.round(mine.lit / 150).toLocaleString(loc));
  $('#mineNote').textContent = tr(mine.exact ? 'לפי תאריך הלידה, בקירוב' : 'בקירוב, לפי הגיל. אפשר להוסיף תאריך לידה בפינת ההורים.');
}
let mineT = 0;
function updateMine(dt) { if (!mine) return; mine.beats += dt * S.bpm / 60; mine.lit += dt * S.bpm / 60 * svAt(mine.age); if ((mineT += dt) > 0.12) { mineT = 0; updMineBox(false); } }
const MINE_TALK = {
  how: ['איך סופרים?', 'לוקחים את הגיל שלך, וסופרים כמה פעמים הלב פועם בכל דקה, בכל שעה ובכל יום — גם בלילה. אצל תינוקות הלב פועם מהר יותר, אז גם את זה חישבנו. זה מספר בקירוב.'],
  day: ['ובכל יום?', 'בכל יום הלב שלך פועם יותר ממאה אלף פעמים! ובכל שנה — יותר מארבעים מיליון. והוא אף פעם לא לוקח חופש.'],
};
document.querySelectorAll('[data-mine]').forEach(b => b.onclick = () => { audio(); say(...MINE_TALK[b.dataset.mine]); });
$('#mineClose').onclick = () => setMine(false);

// ---------- animal hearts ----------
const ANIMALS = [
  { id: 'mouse', e: '🐭', n: 'עכבר', bpm: 500, size: 'הלב שלו קטן כמו גרגר אורז', t: 'הלב של העכבר קטנטן — אבל הוא פועם מהר־מהר: בערך חמש מאות פעמים בדקה! שמעת כמה מהר?' },
  { id: 'humm', e: '🐦', n: 'יונק הדבש', bpm: 1000, size: 'הלב שלו קטן יותר מאפונה', t: 'יונק הדבש היא ציפור קטנטנה, והלב שלה הכי מהיר: יותר מאלף פעמים בדקה! כל כך מהר, שאי אפשר לספור.' },
  { id: 'cat', e: '🐱', n: 'חתול', bpm: 150, size: 'הלב שלו בגודל של אגוז מלך', t: 'הלב של החתול פועם מהר יותר משלך — בערך מאה וחמישים פעמים בדקה. חיות קטנות — לב מהיר!' },
  { id: 'dog', e: '🐶', n: 'כלב', bpm: 100, size: 'הלב שלו בגודל של תפוח', t: 'הלב של כלב פועם בערך מאה פעמים בדקה. כשהוא רץ ומשחק, הוא פועם הרבה יותר מהר!' },
  { id: 'giraffe', e: '🦒', n: 'ג׳ירפה', bpm: 60, size: 'הלב שלה שוקל כמו תינוק — בערך עשרה קילו', t: 'לג׳ירפה יש צוואר ארוך־ארוך, אז הלב שלה צריך לדחוף את הדם חזק במיוחד כדי שיגיע עד הראש. לחץ הדם שלה כפול משלנו!' },
  { id: 'elephant', e: '🐘', n: 'פיל', bpm: 30, size: 'הלב שלו שוקל בערך עשרים קילו', t: 'לפיל יש לב גדול וכבד, והוא פועם לאט: רק בערך שלושים פעמים בדקה. ככל שהחיה גדולה יותר — הלב שלה פועם לאט יותר.' },
  { id: 'whale', e: '🐋', n: 'לווייתן כחול', bpm: 8, size: 'הלב שלו בגודל של מכונית קטנה!', t: 'ללווייתן הכחול יש הלב הכי גדול בעולם — בגודל של מכונית קטנה! כשהוא צולל עמוק, הלב שלו פועם רק כמה פעמים בדקה. בום... ואז הרבה שקט.' },
  { id: 'fish', e: '🐟', n: 'דג', bpm: 40, size: 'יש לו רק שני חדרים', t: 'לדג יש לב עם שני חדרים בלבד, ולא ארבעה כמו לנו. הדם עובר מהלב לזימים — שם הוא לוקח חמצן מהמים — ומשם לכל הגוף.' },
  { id: 'octopus', e: '🐙', n: 'תמנון', bpm: 40, size: 'יש לו שלושה לבבות 💙💙💙', t: 'לתמנון יש שלושה לבבות! שניים שולחים דם לזימים, ואחד לכל הגוף. והדם שלו בכלל כחול!' },
];
let animalsSeen = new Set(store.pget('animals', [])), bpmBefore = 85;
function openAnimals() {
  const G = $('#animalGrid'); G.innerHTML = '';
  for (const a of ANIMALS) { const b = document.createElement('button'); b.innerHTML = `<span class="e">${a.e}</span>`; b.append(tr(a.n));
    const s = document.createElement('small'); s.textContent = '💓 ' + a.bpm; b.appendChild(s); b.onclick = () => { audio(); pickAnimal(a); }; G.appendChild(b); }
  openPop('#animalsPop'); speak('הלב של מי נשמע? לחצי על חיה — והלב יפעם בקצב שלה!');
}
function pickAnimal(a) {
  closePops(); if (S.mine) setMine(false); if (S.bp) setBP(false); if (S.vol) setVol(false);
  if (!S.animal) bpmBefore = S.bpm; S.animal = a.id; openTray(null);
  setBpm(Math.min(a.bpm, 600), false);
  $('#anTitle').textContent = a.e + ' ' + tr(a.n); $('#anEmo').textContent = a.e; $('#anBpm').textContent = a.bpm; $('#anSize').textContent = tr(a.size);
  $('#animalBox').classList.add('show'); say(a.e + ' ' + a.n, a.t);
  animalsSeen.add(a.id); store.pset('animals', [...animalsSeen]); if (animalsSeen.size >= 3) mission('animals');
}
function endAnimal(talk) {
  if (!S.animal) return; S.animal = null; $('#animalBox').classList.remove('show'); setBpm(bpmBefore, false);
  if (talk) say('❤️ הלב שלך', 'חזרנו ללב שלך! הוא פועם בערך שמונים וחמש פעמים בדקה — בין העכבר המהיר לבין הפיל האיטי.');
}
$('#anBack').onclick = () => { audio(); endAnimal(true); };
$('#anClose').onclick = () => endAnimal(false);

// ---------- what is good for the heart ----------
const GOOD = [
  { e: '⚽', t: 'לרוץ ולשחק בחוץ', good: true, why: 'נכון! כשרצים ומשחקים, הלב מתאמן ונהיה חזק יותר — כמו כל שריר.' },
  { e: '🍎', t: 'לאכול פירות וירקות', good: true, why: 'נכון! פירות וירקות צבעוניים נותנים לגוף ולכלי הדם את מה שהם צריכים.' },
  { e: '📺', t: 'לשבת מול מסך כל היום', good: false, why: 'נכון, זה פחות טוב. מסך זה כיף, אבל הלב אוהב שזזים! כדאי גם לקום, לקפוץ ולשחק.' },
  { e: '💧', t: 'לשתות מים', good: true, why: 'נכון! מים עוזרים לדם לזרום בקלות בכל הגוף.' },
  { e: '😴', t: 'לישון טוב בלילה', good: true, why: 'נכון! בשינה הלב נח ופועם לאט, והגוף מתחזק.' },
  { e: '🍬', t: 'הרבה ממתקים ומשקאות מתוקים', good: false, why: 'נכון, זה פחות טוב. קצת ממתק זה בסדר, אבל הרבה סוכר לא טוב ללב ולשיניים.' },
  { e: '🤗', t: 'לצחוק ולהתחבק עם מי שאוהבים', good: true, why: 'נכון! כשאנחנו שמחים ורגועים, גם הלב מרגיש טוב.' },
  { e: '🚭', t: 'להיות ליד עשן של סיגריות', good: false, why: 'נכון, זה לא טוב. העשן מזיק לריאות וללב, אז עדיף להתרחק ממנו.' },
];
let goodI = 0, goodOrder = [], goodLock = false;
function startGood() {
  goodOrder = GOOD.map((_, i) => i).sort(() => Math.random() - 0.5); goodI = 0; openPop('#goodPop'); showGood(true);
}
function showGood(first) {
  const it = GOOD[goodOrder[goodI]]; goodLock = false;
  $('#goodE').textContent = it.e; $('#goodT').textContent = tr(it.t);
  $('#goodProg').textContent = '💚'.repeat(goodI) + '○'.repeat(GOOD.length - goodI);
  speak(first ? ['טוב ללב, או פחות טוב?', it.t] : [it.t]);
}
function answerGood(yes) {
  if (goodLock) return; const it = GOOD[goodOrder[goodI]];
  if (yes !== it.good) { speak('הממ... חשבי שוב!'); const b = yes ? $('#goodYes') : $('#goodNo'); b.style.animation = 'shake .4s'; setTimeout(() => b.style.animation = '', 450); return; }
  goodLock = true; chime(); if (it.good) { S.amp = 2; setTimeout(() => S.amp = +$('#amp').value, 2500); }
  say(it.e, it.why, { ms: 6000 });
  const next = () => { goodI++; if (goodI >= GOOD.length) { closePops(); confetti();
      say('💚 הלב אומר תודה!', 'כל הכבוד! עכשיו את יודעת מה הלב שלך אוהב: לזוז, לאכול טוב, לשתות מים, לישון ולשמוח.'); mission('good'); }
    else showGood(false); };
  const wait = () => speaking() ? setTimeout(wait, 300) : setTimeout(next, 500); setTimeout(wait, 800);
}
$('#goodYes').onclick = () => { audio(); answerGood(true); };
$('#goodNo').onclick = () => { audio(); answerGood(false); };

// ---------- performance (eco mode) ----------
let ecoPref = store.get('eco', 'auto'), eco = false;
let ecoAuto = (navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || false;
const MAT0 = new Map();
function setEco(on) {
  eco = on; document.body.classList.toggle('eco', on);
  renderer.setPixelRatio(on ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 2)); resize();
  for (const m of Object.values(M)) { if (!MAT0.has(m)) MAT0.set(m, { cc: m.clearcoat, sh: m.sheen });
    const o = MAT0.get(m); if (o.cc !== undefined) { m.clearcoat = on ? 0 : o.cc; m.sheen = on ? 0 : o.sh; m.needsUpdate = true; } }
  if (typeof cells !== 'undefined' && cells) { $('#fcount').max = on ? 200 : 600; if (on && cells.count > 160) { cells.count = 160; $('#fcount').value = 160; } }
}
let ecoProbe = { t0: 0, n: 0, done: false };
function ecoTick() {   // in auto mode: measure a few seconds after start (after the fly-in), switch to eco if the phone struggles
  if (ecoProbe.done || ecoPref !== 'auto' || !$('#start').classList.contains('hide') || flight) return;
  const now = performance.now(); if (!ecoProbe.t0) { ecoProbe.t0 = now; return; } ecoProbe.n++;
  const t = (now - ecoProbe.t0) / 1000;
  if (t > 4) { ecoProbe.done = true; const fps = ecoProbe.n / t; if (fps < 38 && !eco) { ecoAuto = true; setEco(true); } }
}
setEco(ecoPref === 'on' || (ecoPref === 'auto' && ecoAuto));
applyI18n();
