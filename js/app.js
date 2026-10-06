import {
  SPORTS, SPORT_ORDER, setsToWin, setWinner, setFirstServer, currentServer, periodLabel, periodMs,
} from './sports.js';
import { setFlip } from './flip.js';
import {
  loadMatch, saveMatch, loadHistory, addHistory, clearHistory, loadPrefs, savePrefs,
} from './store.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (str) => String(str).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const COLORS = ['#e63946', '#2563eb', '#16a34a', '#f97316', '#7c3aed', '#eab308', '#0891b2', '#db2777', '#1f2937', '#f1f5f9'];

/* ---------- State ---------- */

const prefs = { sport: 'simple', teams: [{ name: 'A Takımı', color: COLORS[0] }, { name: 'B Takımı', color: COLORS[1] }], ...loadPrefs() };

function newMatch(sport = prefs.sport) {
  const def = SPORTS[sport];
  return {
    v: 1,
    sport,
    teams: prefs.teams.map((t) => ({ ...t })),
    bestOf: prefs[`bestOf_${sport}`] || def.bestOf || 0,
    minutes: prefs[`minutes_${sport}`] || def.minutes || 0,
    score: [0, 0],
    sets: [0, 0],
    setScores: [], // finished sets, e.g. [[11, 8], [9, 11]]
    set: 1,
    period: 1,
    firstServer: 0,
    server: 0,
    swapped: false,
    overlay: null, // { type: 'set' | 'match', winner }
    startedAt: new Date().toISOString(),
    clock: { base: 0, since: null }, // not part of undo
  };
}

let m = loadMatch() || newMatch();
if (!SPORTS[m.sport]) m = newMatch('simple');
let undoStack = [];

function save() {
  saveMatch(m);
}

// Snapshot before every change so any mistake can be undone; the clock keeps running.
function snapshot() {
  const { clock, ...rest } = m;
  undoStack.push(JSON.stringify(rest));
  if (undoStack.length > 300) undoStack.shift();
}

function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  m = { ...JSON.parse(prev), clock: m.clock };
  save();
  render();
}

/* ---------- Scoring ---------- */

function addPoints(team, n) {
  if (m.overlay) return;
  const sport = SPORTS[m.sport];
  if (n < 0 && m.score[team] === 0) return;
  snapshot();
  m.score[team] = Math.max(0, m.score[team] + n);
  if (n > 0 && sport.serve === 'rally') m.server = team;
  if (n > 0) {
    const w = setWinner(m);
    if (w >= 0) {
      m.overlay = { type: m.sets[w] + 1 >= setsToWin(m) ? 'match' : 'set', winner: w };
      buzz([60, 40, 160]);
    } else buzz(25);
  } else buzz([15, 30, 15]);
  save();
  render();
}

function nextSet() {
  snapshot();
  const w = m.overlay.winner;
  m.setScores.push([...m.score]);
  m.sets[w]++;
  m.score = [0, 0];
  m.set++;
  m.server = setFirstServer(m);
  m.overlay = null;
  save();
  render();
}

function nextPeriod() {
  snapshot();
  m.period++;
  m.clock = { base: 0, since: null };
  save();
  render();
}

function resultEntry() {
  const sport = SPORTS[m.sport];
  const sets = sport.kind === 'sets';
  const setScores = sets && m.overlay?.type === 'match' ? [...m.setScores, [...m.score]] : m.setScores;
  const finalSets = sets && m.overlay?.type === 'match'
    ? m.sets.map((s, i) => s + (i === m.overlay.winner ? 1 : 0))
    : m.sets;
  return {
    id: Date.now().toString(36),
    sport: m.sport,
    date: m.startedAt,
    teams: m.teams.map((t) => t.name),
    colors: m.teams.map((t) => t.color),
    score: sets ? finalSets : [...m.score],
    setScores,
  };
}

function finishAndSave() {
  const e = resultEntry();
  const hasPlay = e.score.some((s) => s > 0) || e.setScores.length;
  if (hasPlay) addHistory(e);
  startNew(m.sport, true);
}

function startNew(sport, keepSides = false) {
  const swapped = keepSides ? m.swapped : false;
  m = newMatch(sport);
  m.swapped = swapped;
  undoStack = [];
  stopClockTimer();
  save();
  buildZones();
  render();
}

// Ends a timed or simple match and shows the result.
function endMatch() {
  snapshot();
  const [a, b] = m.score;
  m.overlay = { type: 'match', winner: a === b ? -1 : a > b ? 0 : 1 };
  pauseClock();
  save();
  render();
}

/* ---------- Clock (basketball / football) ---------- */

let clockTimer = null;

function clockElapsed() {
  return m.clock.base + (m.clock.since ? Date.now() - m.clock.since : 0);
}

function toggleClock() {
  if (m.clock.since) pauseClock();
  else {
    if (SPORTS[m.sport].clock === 'down' && clockElapsed() >= periodMs(m)) return;
    m.clock.since = Date.now();
    startClockTimer();
  }
  save();
  tickClock();
}

function pauseClock() {
  if (!m.clock.since) return;
  m.clock.base = clockElapsed();
  m.clock.since = null;
  stopClockTimer();
  save();
}

function startClockTimer() {
  stopClockTimer();
  clockTimer = setInterval(() => {
    const sport = SPORTS[m.sport];
    if (sport.clock === 'down' && clockElapsed() >= periodMs(m)) {
      m.clock.base = periodMs(m);
      m.clock.since = null;
      stopClockTimer();
      save();
      buzz([300, 120, 300, 120, 500]);
      beep();
    }
    tickClock();
  }, 250);
}

function stopClockTimer() {
  clearInterval(clockTimer);
  clockTimer = null;
}

function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function clockText() {
  const sport = SPORTS[m.sport];
  const el = clockElapsed();
  const len = periodMs(m);
  if (sport.clock === 'down') {
    const left = len - el;
    // Show tenths in the last minute, like an arena clock.
    if (left < 60000 && left > 0) return `${Math.floor(left / 1000)}.${Math.floor((left % 1000) / 100)}`;
    return mmss(left);
  }
  // Football: match time counts on from the previous halves; stoppage shown as 45+2.
  const offset = (Math.min(m.period, sport.periods) - 1) * len;
  if (el <= len) return mmss(offset + el);
  return `${Math.round((offset + len) / 60000)}+${Math.floor((el - len) / 60000) + 1}'`;
}

/* ---------- Feedback ---------- */

function buzz(pattern) {
  if (prefs.vibrate !== false) navigator.vibrate?.(pattern);
}

let audioCtx = null;
function beep() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 1.3);
  } catch { /* no audio */ }
}

/* ---------- Rendering ---------- */

function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111' : '#fff';
}

// Tap zones: the upper half adds, the lower half subtracts.
function buildZones() {
  const sport = SPORTS[m.sport];
  const inc = sport.increments || [1];
  $$('.team').forEach((el) => {
    const t = +el.dataset.team;
    const plus = inc.map((n) => `
      <button type="button" class="zone plus" data-team="${t}" data-n="${n}" aria-label="${n} sayı ekle">
        <span>+${n}</span>
      </button>`).join('');
    $('.zones', el).innerHTML = `
      <div class="zone-row">${plus}</div>
      <button type="button" class="zone minus" data-team="${t}" data-n="-1" aria-label="1 sayı çıkar"><span>−1</span></button>`;
  });
  $$('.zone').forEach((z) => z.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    z.classList.remove('hit');
    void z.offsetWidth;
    z.classList.add('hit');
    addPoints(+z.dataset.team, +z.dataset.n);
  }));
}

// Updates only the clock text so the buttons are not rebuilt mid-tap.
function tickClock() {
  const btn = $('#btn-clock');
  if (!btn) return;
  const sport = SPORTS[m.sport];
  btn.textContent = clockText();
  btn.classList.toggle('running', !!m.clock.since);
  btn.classList.toggle('ended', sport.clock === 'down' && clockElapsed() >= periodMs(m));
}

function renderInfo() {
  const sport = SPORTS[m.sport];
  const info = $('#info');
  const order = m.swapped ? [1, 0] : [0, 1];
  if (sport.kind === 'sets') {
    info.innerHTML = `
      <span class="info-label">${m.set}. Set</span>
      <span class="info-main">${m.sets[order[0]]}<i>–</i>${m.sets[order[1]]}</span>`;
  } else if (sport.kind === 'periods') {
    const ended = sport.clock === 'down' && clockElapsed() >= periodMs(m);
    info.innerHTML = `
      <button type="button" class="info-label period" id="btn-period">${periodLabel(m)}</button>
      <button type="button" class="info-main clock ${m.clock.since ? 'running' : ''} ${ended ? 'ended' : ''}" id="btn-clock"
        aria-label="Saati başlat veya durdur">${clockText()}</button>`;
    $('#btn-clock').addEventListener('click', toggleClock);
    $('#btn-period').addEventListener('click', () => {
      const next = { ...m, period: m.period + 1 };
      if (confirm(`${periodLabel(next)} başlasın mı? Saat sıfırlanır.`)) nextPeriod();
    });
  } else {
    info.innerHTML = '<span class="info-label">Puantaj</span>';
  }
}

function renderOverlay() {
  const ov = $('#overlay');
  if (!m.overlay) {
    ov.hidden = true;
    return;
  }
  const { type, winner } = m.overlay;
  const sport = SPORTS[m.sport];
  const name = winner >= 0 ? m.teams[winner].name : '';
  ov.hidden = false;
  ov.style.setProperty('--win', winner >= 0 ? m.teams[winner].color : '#475569');
  if (type === 'set') {
    $('#ov-kicker').textContent = `${m.set}. set bitti`;
    $('#ov-title').textContent = `${name} kazandı`;
    $('#ov-score').textContent = `${m.score[0]} – ${m.score[1]}`;
    $('#ov-sets').textContent = `Setler: ${m.sets[0] + (winner === 0 ? 1 : 0)} – ${m.sets[1] + (winner === 1 ? 1 : 0)}`;
    $('#ov-next').textContent = 'Sonraki set';
  } else {
    const e = resultEntry();
    $('#ov-kicker').textContent = 'Maç bitti';
    $('#ov-title').textContent = winner >= 0 ? `${name} kazandı!` : 'Berabere';
    $('#ov-score').textContent = `${e.score[0]} – ${e.score[1]}`;
    $('#ov-sets').textContent = sport.kind === 'sets' ? e.setScores.map((s) => `${s[0]}-${s[1]}`).join('  ·  ') : '';
    $('#ov-next').textContent = 'Kaydet ve yeni maç';
  }
}

function render() {
  const sport = SPORTS[m.sport];
  const server = currentServer(m);
  const board = $('#board');
  board.classList.toggle('swapped', m.swapped);
  board.dataset.sport = m.sport;

  m.teams.forEach((team, i) => {
    const el = $(`#team-${i}`);
    el.style.setProperty('--c', team.color);
    el.style.setProperty('--ink', inkFor(team.color));
    $('.team-name', el).textContent = team.name;
    $('.serve', el).hidden = server !== i;
    $('.set-dots', el).innerHTML = sport.kind === 'sets'
      ? Array.from({ length: setsToWin(m) }, (_, k) => `<i class="${k < m.sets[i] ? 'on' : ''}"></i>`).join('')
      : '';
    setFlip($(`#flip-${i}`), m.score[i]);
  });

  $('#btn-undo').disabled = !undoStack.length;
  renderInfo();
  renderOverlay();
}

/* ---------- Settings sheet ---------- */

const sheet = $('#settings');
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function optionChips(name, values, current, fmt = (v) => v) {
  return `<div class="chips" data-opt="${name}">${values.map((v) => `
    <button type="button" class="chip ${v === current ? 'active' : ''}" data-v="${v}">${fmt(v)}</button>`).join('')}</div>`;
}

function historyHTML() {
  const list = loadHistory();
  if (!list.length) return '<p class="muted">Henüz kayıtlı maç yok.</p>';
  return `<ul class="history">${list.map((e) => `
    <li>
      <div class="h-top"><b>${esc(SPORTS[e.sport]?.name || '')}</b><span class="muted">${dateFmt.format(new Date(e.date))}</span></div>
      <div class="h-score">
        <span class="h-team"><i style="background:${e.colors[0]}"></i>${esc(e.teams[0])}</span>
        <b>${e.score[0]} – ${e.score[1]}</b>
        <span class="h-team right">${esc(e.teams[1])}<i style="background:${e.colors[1]}"></i></span>
      </div>
      ${e.setScores?.length ? `<div class="muted h-sets">${e.setScores.map((s) => `${s[0]}-${s[1]}`).join(' · ')}</div>` : ''}
    </li>`).join('')}</ul>
    <button type="button" class="btn ghost danger" data-act="clear-history">Geçmişi temizle</button>`;
}

function rulesHTML() {
  const sport = SPORTS[m.sport];
  if (sport.kind === 'sets') {
    return `
      <h3>Kurallar</h3>
      <label class="row-label">Maç</label>
      ${optionChips('bestOf', sport.bestOfOptions, m.bestOf, (v) => `${v} set (${Math.ceil(v / 2)} alan kazanır)`)}
      <label class="row-label">İlk servis</label>
      ${optionChips('firstServer', [0, 1], m.firstServer, (v) => esc(m.teams[v].name))}
      <p class="muted">${sport.target} sayı, 2 fark.${sport.decider ? ` Son set ${sport.decider} sayı.` : ''}
      ${sport.serve === 'alternate' ? ' Servis 2 sayıda bir, 10–10’dan sonra her sayıda değişir.' : ' Sayıyı alan servis atar.'}</p>`;
  }
  if (sport.kind === 'periods') {
    return `
      <h3>Kurallar</h3>
      <label class="row-label">${sport.periodName} süresi</label>
      ${optionChips('minutes', sport.minutesOptions, m.minutes, (v) => `${v} dk`)}
      <p class="muted">${sport.periods} ${sport.periodName.toLowerCase()}. Saate dokun: başlat / durdur. ${sport.periodName} adına dokun: sonrakine geç.</p>`;
  }
  return '<p class="muted">Kural yok: üst yarı +1, alt yarı −1.</p>';
}

function teamEditorHTML(i) {
  const t = m.teams[i];
  return `
    <div class="team-edit" data-i="${i}">
      <input type="text" maxlength="20" value="${esc(t.name)}" aria-label="${i ? 'B' : 'A'} takımının adı">
      <div class="swatches">${COLORS.map((c) => `
        <button type="button" class="swatch ${c === t.color ? 'active' : ''}" data-color="${c}" style="background:${c}" aria-label="Renk ${c}"></button>`).join('')}
      </div>
    </div>`;
}

function renderSheet() {
  const sport = SPORTS[m.sport];
  sheet.innerHTML = `
    <form method="dialog" class="sheet-inner">
      <div class="sheet-head">
        <h2>Ayarlar</h2>
        <button class="icon-btn" value="close" aria-label="Kapat">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <h3>Spor</h3>
      <div class="chips sports">${SPORT_ORDER.map((id) => `
        <button type="button" class="chip ${id === m.sport ? 'active' : ''}" data-sport="${id}">${SPORTS[id].name}</button>`).join('')}
      </div>

      <h3>Takımlar</h3>
      ${teamEditorHTML(0)}
      ${teamEditorHTML(1)}

      ${rulesHTML()}

      <h3>Maç</h3>
      <div class="actions">
        ${sport.kind !== 'sets' ? '<button type="button" class="btn primary" data-act="end">Maçı bitir</button>' : ''}
        <button type="button" class="btn ghost" data-act="new">Skoru sıfırla</button>
        <button type="button" class="btn ghost" data-act="fullscreen">Tam ekran</button>
      </div>
      <label class="toggle"><input type="checkbox" data-act="vibrate" ${prefs.vibrate !== false ? 'checked' : ''}> Titreşim</label>

      <h3>Son maçlar</h3>
      ${historyHTML()}

      <div class="coffee">
        <p>Puantaj ücretsiz ve reklamsız.</p>
        <a class="coffee-pill" href="https://buymeacoffee.com/mifarosa" target="_blank" rel="noopener">
          <span aria-hidden="true">☕</span> Bana bir kahve ısmarla
        </a>
      </div>
    </form>`;
  bindSheet();
}

function rememberTeams() {
  prefs.teams = m.teams.map((t) => ({ ...t }));
  savePrefs(prefs);
}

function bindSheet() {
  $$('[data-sport]', sheet).forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.sport;
    if (id === m.sport) return;
    const playing = m.score.some((s) => s) || m.setScores.length;
    if (playing && !confirm('Spor değişince bu maç sıfırlanır. Devam edilsin mi?')) return;
    prefs.sport = id;
    savePrefs(prefs);
    startNew(id);
    renderSheet();
  }));

  $$('.team-edit', sheet).forEach((row) => {
    const i = +row.dataset.i;
    $('input', row).addEventListener('input', (e) => {
      m.teams[i].name = e.target.value.trim() || (i ? 'B Takımı' : 'A Takımı');
      rememberTeams();
      save();
      render();
    });
    $$('.swatch', row).forEach((s) => s.addEventListener('click', () => {
      m.teams[i].color = s.dataset.color;
      rememberTeams();
      save();
      render();
      $$('.swatch', row).forEach((x) => x.classList.toggle('active', x === s));
    }));
  });

  $$('[data-opt]', sheet).forEach((group) => $$('.chip', group).forEach((c) => c.addEventListener('click', () => {
    const key = group.dataset.opt;
    const v = +c.dataset.v;
    snapshot();
    m[key] = v;
    if (key === 'firstServer' && m.score[0] + m.score[1] === 0) m.server = setFirstServer(m);
    if (key === 'bestOf' || key === 'minutes') {
      prefs[`${key}_${m.sport}`] = v;
      savePrefs(prefs);
    }
    save();
    render();
    renderSheet();
  })));

  $('[data-act="new"]', sheet)?.addEventListener('click', () => {
    if (!confirm('Skor sıfırlansın mı?')) return;
    startNew(m.sport, true);
    sheet.close();
  });
  $('[data-act="end"]', sheet)?.addEventListener('click', () => {
    sheet.close();
    endMatch();
  });
  $('[data-act="fullscreen"]', sheet)?.addEventListener('click', () => {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen?.();
    else d.documentElement.requestFullscreen?.().catch(() => {});
    sheet.close();
  });
  $('[data-act="vibrate"]', sheet)?.addEventListener('change', (e) => {
    prefs.vibrate = e.target.checked;
    savePrefs(prefs);
  });
  $('[data-act="clear-history"]', sheet)?.addEventListener('click', () => {
    if (!confirm('Tüm maç geçmişi silinsin mi?')) return;
    clearHistory();
    renderSheet();
  });
}

sheet.addEventListener('click', (e) => {
  if (e.target === sheet) sheet.close();
});

/* ---------- Wiring ---------- */

$('#btn-settings').addEventListener('click', () => {
  renderSheet();
  sheet.showModal();
});
$('#btn-undo').addEventListener('click', undo);
$('#btn-swap').addEventListener('click', () => {
  m.swapped = !m.swapped;
  save();
  render();
});
$('#ov-undo').addEventListener('click', undo);
$('#ov-next').addEventListener('click', () => {
  if (m.overlay?.type === 'set') nextSet();
  else finishAndSave();
});

// Keep the screen on while the scoreboard is open.
let wakeLock = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch { /* not allowed */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    keepAwake();
    if (m.clock.since) startClockTimer();
    tickClock();
  } else {
    stopClockTimer();
  }
});
document.addEventListener('pointerdown', () => { if (!wakeLock) keepAwake(); }, { once: true });

/* ---------- Boot ---------- */

buildZones();
render();
keepAwake();
if (m.clock.since) startClockTimer();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
