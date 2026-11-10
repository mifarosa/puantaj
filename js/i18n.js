// Minimal i18n: Turkish and English dictionaries, language kept in localStorage.

const LANG_KEY = 'puantaj.lang';

export const LANGS = { tr: 'Türkçe', en: 'English' };

const DICT = {
  tr: {
    'meta.description': 'Masa tenisi, voleybol, basketbol, futbol ve basit A–B maçları için skor tabelası.',
    'team.a': 'A Takımı',
    'team.b': 'B Takımı',
    'aria.teamA': 'A takımı',
    'aria.teamB': 'B takımı',
    'aria.serve': 'Servis',
    'aria.controls': 'Kontroller',
    'aria.settings': 'Ayarlar',
    'aria.undo': 'Geri al',
    'aria.swap': 'Taraf değiştir',
    'aria.close': 'Kapat',
    'aria.addPoints': '{n} sayı ekle',
    'aria.removePoint': '1 sayı çıkar',
    'aria.toggleClock': 'Saati başlat veya durdur',
    'aria.teamName': '{team} takımının adı',
    'aria.color': 'Renk {c}',
    'sport.simple': 'Basit Skor',
    'sport.tt': 'Masa Tenisi',
    'sport.vb': 'Voleybol',
    'sport.bb': 'Basketbol',
    'sport.fb': 'Futbol',
    'period.bb': 'Çeyrek',
    'period.fb': 'Devre',
    'period.label': '{n}. {name}',
    'period.ot': 'Uzatma',
    'period.otN': 'Uzatma {n}',
    'info.set': '{n}. Set',
    'info.app': 'Puantaj',
    'confirm.period': '{label} başlasın mı? Saat sıfırlanır.',
    'confirm.sport': 'Spor değişince bu maç sıfırlanır. Devam edilsin mi?',
    'confirm.reset': 'Skor sıfırlansın mı?',
    'confirm.clearHistory': 'Tüm maç geçmişi silinsin mi?',
    'ov.setDone': '{n}. set bitti',
    'ov.wins': '{name} kazandı',
    'ov.winsMatch': '{name} kazandı!',
    'ov.sets': 'Setler: {a} – {b}',
    'ov.nextSet': 'Sonraki set',
    'ov.matchDone': 'Maç bitti',
    'ov.draw': 'Berabere',
    'ov.saveNew': 'Kaydet ve yeni maç',
    'history.empty': 'Henüz kayıtlı maç yok.',
    'history.clear': 'Geçmişi temizle',
    'rules.title': 'Kurallar',
    'rules.match': 'Maç',
    'rules.bestOf': '{n} set ({w} alan kazanır)',
    'rules.firstServer': 'İlk servis',
    'rules.periodLen': '{name} süresi',
    'rules.min': '{n} dk',
    'rules.setsInfo': '{target} sayı, 2 fark.',
    'rules.decider': ' Son set {n} sayı.',
    'rules.serveAlt': ' Servis 2 sayıda bir, 10–10’dan sonra her sayıda değişir.',
    'rules.serveRally': ' Sayıyı alan servis atar.',
    'rules.periodsInfo': '{n} {name}. Saate dokun: başlat / durdur. {Name} adına dokun: sonrakine geç.',
    'rules.none': 'Kural yok: üst yarı +1, alt yarı −1.',
    'sheet.title': 'Ayarlar',
    'sheet.sport': 'Spor',
    'sheet.teams': 'Takımlar',
    'sheet.match': 'Maç',
    'sheet.end': 'Maçı bitir',
    'sheet.reset': 'Skoru sıfırla',
    'sheet.fullscreen': 'Tam ekran',
    'sheet.vibrate': 'Titreşim',
    'sheet.language': 'Dil',
    'sheet.recent': 'Son maçlar',
    'coffee.free': 'Puantaj ücretsiz ve reklamsız.',
    'coffee.cta': 'Bana bir kahve ısmarla',
  },
  en: {
    'meta.description': 'Scoreboard for table tennis, volleyball, basketball, football and simple A–B matches.',
    'team.a': 'Team A',
    'team.b': 'Team B',
    'aria.teamA': 'Team A',
    'aria.teamB': 'Team B',
    'aria.serve': 'Serve',
    'aria.controls': 'Controls',
    'aria.settings': 'Settings',
    'aria.undo': 'Undo',
    'aria.swap': 'Swap sides',
    'aria.close': 'Close',
    'aria.addPoints': 'Add {n} point(s)',
    'aria.removePoint': 'Remove 1 point',
    'aria.toggleClock': 'Start or stop the clock',
    'aria.teamName': 'Name of team {team}',
    'aria.color': 'Color {c}',
    'sport.simple': 'Simple Score',
    'sport.tt': 'Table Tennis',
    'sport.vb': 'Volleyball',
    'sport.bb': 'Basketball',
    'sport.fb': 'Football',
    'period.bb': 'Quarter',
    'period.fb': 'Half',
    'period.label': '{name} {n}',
    'period.ot': 'Overtime',
    'period.otN': 'Overtime {n}',
    'info.set': 'Set {n}',
    'info.app': 'Puantaj',
    'confirm.period': 'Start {label}? The clock will reset.',
    'confirm.sport': 'Changing the sport resets this match. Continue?',
    'confirm.reset': 'Reset the score?',
    'confirm.clearHistory': 'Delete the whole match history?',
    'ov.setDone': 'Set {n} finished',
    'ov.wins': '{name} wins',
    'ov.winsMatch': '{name} wins!',
    'ov.sets': 'Sets: {a} – {b}',
    'ov.nextSet': 'Next set',
    'ov.matchDone': 'Match finished',
    'ov.draw': 'Draw',
    'ov.saveNew': 'Save and new match',
    'history.empty': 'No saved matches yet.',
    'history.clear': 'Clear history',
    'rules.title': 'Rules',
    'rules.match': 'Match',
    'rules.bestOf': '{n} sets (first to {w})',
    'rules.firstServer': 'First serve',
    'rules.periodLen': '{name} length',
    'rules.min': '{n} min',
    'rules.setsInfo': '{target} points, win by 2.',
    'rules.decider': ' Deciding set to {n}.',
    'rules.serveAlt': ' Serve changes every 2 points, and every point after 10–10.',
    'rules.serveRally': ' The team that wins the point serves.',
    'rules.periodsInfo': '{n} × {name}. Tap the clock: start / stop. Tap the {name} label: go to the next one.',
    'rules.none': 'No rules: upper half +1, lower half −1.',
    'sheet.title': 'Settings',
    'sheet.sport': 'Sport',
    'sheet.teams': 'Teams',
    'sheet.match': 'Match',
    'sheet.end': 'End match',
    'sheet.reset': 'Reset score',
    'sheet.fullscreen': 'Fullscreen',
    'sheet.vibrate': 'Vibration',
    'sheet.language': 'Language',
    'sheet.recent': 'Recent matches',
    'coffee.free': 'Puantaj is free and ad-free.',
    'coffee.cta': 'Buy me a coffee',
  },
};

function detect() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch { /* storage unavailable */ }
  if (saved && DICT[saved]) return saved;
  const nav = (navigator.languages?.[0] || navigator.language || 'tr').slice(0, 2).toLowerCase();
  return DICT[nav] ? nav : 'en';
}

let lang = detect();

export const getLang = () => lang;
export const locale = () => (lang === 'tr' ? 'tr-TR' : 'en-GB');

export function setLang(next) {
  if (!DICT[next]) return;
  lang = next;
  try { localStorage.setItem(LANG_KEY, next); } catch { /* storage unavailable */ }
  applyStatic();
}

export function t(key, params = {}) {
  const str = DICT[lang][key] ?? DICT.tr[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
}

// True when a stored team name is just the default name in any language.
export function isDefaultName(name, i) {
  const key = i ? 'team.b' : 'team.a';
  return Object.values(DICT).some((d) => d[key] === name);
}

// Translates the static markup in index.html.
export function applyStatic() {
  document.documentElement.lang = lang;
  $$attr('data-i18n', (el, v) => { el.textContent = t(v); });
  $$attr('data-i18n-aria', (el, v) => el.setAttribute('aria-label', t(v)));
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.content = t('meta.description');
}

function $$attr(attr, fn) {
  document.querySelectorAll(`[${attr}]`).forEach((el) => fn(el, el.getAttribute(attr)));
}
