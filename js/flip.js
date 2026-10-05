// Split-flap style number: the old value flips away like a page on a
// physical scoreboard. Increments flip downward, decrements flip upward.

const DURATION = 520; // both halves of the flip, in ms

function halves(top, bottom) {
  return `<div class="half top"><span>${top}</span></div><div class="half bottom"><span>${bottom}</span></div>`;
}

export function setFlip(el, value) {
  const next = String(value);
  const prev = el.dataset.v;
  el.dataset.len = next.length;
  if (prev === next) return;
  el.dataset.v = next;
  el.setAttribute('aria-label', next);
  clearTimeout(el._flipTimer);

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prev === undefined || reduce) {
    el.innerHTML = halves(next, next);
    return;
  }

  const up = Number(next) < Number(prev);
  el.innerHTML = up
    // Decrement: the bottom flap with the old number rises, then the new top settles.
    ? `${halves(prev, next)}
       <div class="half bottom flap flap-bottom-up"><span>${prev}</span></div>
       <div class="half top flap flap-top-down"><span>${next}</span></div>`
    // Increment: the top flap with the old number falls, revealing the new one.
    : `${halves(next, prev)}
       <div class="half top flap flap-top"><span>${prev}</span></div>
       <div class="half bottom flap flap-bottom"><span>${next}</span></div>`;

  el._flipTimer = setTimeout(() => {
    el.innerHTML = halves(next, next);
  }, DURATION + 40);
}
