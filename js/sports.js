// Sport definitions and scoring rules.

export const SPORTS = {
  simple: {
    name: 'Basit Skor',
    kind: 'points',
  },
  tt: {
    name: 'Masa Tenisi',
    kind: 'sets',
    target: 11,
    winBy: 2,
    bestOf: 5,
    bestOfOptions: [3, 5, 7],
    serve: 'alternate', // 2 serves each, 1 each from 10–10
  },
  vb: {
    name: 'Voleybol',
    kind: 'sets',
    target: 25,
    decider: 15, // deciding set is played to 15
    winBy: 2,
    bestOf: 5,
    bestOfOptions: [3, 5],
    serve: 'rally', // the team that wins the rally serves next
  },
  bb: {
    name: 'Basketbol',
    kind: 'periods',
    periods: 4,
    periodName: 'Çeyrek',
    minutes: 10,
    minutesOptions: [5, 8, 10, 12],
    overtimeMinutes: 5,
    clock: 'down',
    increments: [1, 2, 3],
  },
  fb: {
    name: 'Futbol',
    kind: 'periods',
    periods: 2,
    periodName: 'Devre',
    minutes: 45,
    minutesOptions: [10, 15, 20, 25, 30, 35, 40, 45],
    clock: 'up',
  },
};

export const SPORT_ORDER = ['simple', 'tt', 'vb', 'bb', 'fb'];

export function setsToWin(state) {
  return Math.ceil(state.bestOf / 2);
}

function isDecidingSet(state) {
  return state.set === state.bestOf;
}

export function setTarget(state) {
  const sport = SPORTS[state.sport];
  return isDecidingSet(state) && sport.decider ? sport.decider : sport.target;
}

// Index of the team that has won the current set, or -1.
export function setWinner(state) {
  const sport = SPORTS[state.sport];
  if (sport.kind !== 'sets') return -1;
  const target = setTarget(state);
  const [a, b] = state.score;
  if (a >= target && a - b >= sport.winBy) return 0;
  if (b >= target && b - a >= sport.winBy) return 1;
  return -1;
}

// Team that serves first in the current set; alternates every set.
export function setFirstServer(state) {
  return (state.firstServer + state.set - 1) % 2;
}

// Who is serving now (sets sports only).
export function currentServer(state) {
  const sport = SPORTS[state.sport];
  if (sport.kind !== 'sets') return -1;
  if (sport.serve === 'rally') return state.server;
  // Table tennis: two serves each; one each once both reach target - 1 (10–10).
  const first = setFirstServer(state);
  const [a, b] = state.score;
  const pts = a + b;
  const deuce = setTarget(state) - 1;
  if (a >= deuce && b >= deuce) return (first + deuce + (pts - 2 * deuce)) % 2;
  return (first + Math.floor(pts / 2)) % 2;
}

export function periodLabel(state) {
  const sport = SPORTS[state.sport];
  if (state.period > sport.periods) {
    const ot = state.period - sport.periods;
    return ot > 1 ? `Uzatma ${ot}` : 'Uzatma';
  }
  return `${state.period}. ${sport.periodName}`;
}

export function periodMs(state) {
  const sport = SPORTS[state.sport];
  const min = state.period > sport.periods && sport.overtimeMinutes ? sport.overtimeMinutes : state.minutes;
  return min * 60 * 1000;
}
