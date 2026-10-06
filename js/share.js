// Score image, e-mail text, .eml draft and Web Share for a saved match.
import { SPORTS } from './sports.js';

const longDate = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });

function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111' : '#fff';
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * amount));
  return `rgb(${ch.join(',')})`;
}

export function winnerOf(e) {
  if (e.score[0] === e.score[1]) return -1;
  return e.score[0] > e.score[1] ? 0 : 1;
}

export function setsText(e) {
  return (e.setScores || []).map((s) => `${s[0]}-${s[1]}`).join(' · ');
}

export function subjectFor(e) {
  return `${SPORTS[e.sport]?.name || 'Maç'}: ${e.teams[0]} ${e.score[0]} – ${e.score[1]} ${e.teams[1]} · ${shortDate.format(new Date(e.date))}`;
}

export function bodyFor(e, photoCount) {
  const w = winnerOf(e);
  const lines = [
    `${SPORTS[e.sport]?.name || 'Maç'} · ${longDate.format(new Date(e.date))}`,
    '',
    `${e.teams[0]} ${e.score[0]} – ${e.score[1]} ${e.teams[1]}`,
    w >= 0 ? `Kazanan: ${e.teams[w]}` : 'Sonuç: Berabere',
  ];
  if (e.setScores?.length) lines.push(`Setler: ${setsText(e).replaceAll(' · ', ', ')}`);
  if (e.note) lines.push('', `Not: ${e.note}`);
  lines.push('', `Ekler: skor görseli${photoCount ? ` ve ${photoCount} fotoğraf` : ''}.`);
  lines.push('', 'Puantaj ile kaydedildi · https://puantaj.mifarosa.com');
  return lines.join('\n');
}

function fitText(ctx, text, maxWidth, size, weight = 800) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 12);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws a scoreboard-style card (1200×675) and returns it as a PNG blob.
export function scoreImage(e) {
  const W = 1200;
  const H = 675;
  const BAR = 84;
  const MID = 70;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const half = (W - MID) / 2;
  const w = winnerOf(e);

  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(0, 0, W, H);

  [0, 1].forEach((i) => {
    const x = i === 0 ? 0 : half + MID;
    const color = e.colors[i];
    const ink = inkFor(color);
    ctx.fillStyle = color;
    ctx.fillRect(x, BAR, half, H - BAR * 2);

    // Team name
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fitText(ctx, e.teams[i], half - 60, 46);
    ctx.fillText(e.teams[i], x + half / 2, BAR + 64);

    // Split-flap card with the score
    const cw = 330;
    const ch = 300;
    const cx = x + (half - cw) / 2;
    const cy = BAR + 98;
    ctx.fillStyle = shade(color, 0.55);
    roundRect(ctx, cx, cy, cw, ch, 22);
    ctx.fill();
    ctx.fillStyle = shade(color, 0.45);
    ctx.fillRect(cx, cy + ch / 2, cw, ch / 2 - 22);
    roundRect(ctx, cx, cy + ch / 2, cw, ch / 2, 22);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    fitText(ctx, String(e.score[i]), cw - 30, 250);
    ctx.fillText(String(e.score[i]), cx + cw / 2, cy + ch / 2 + 10);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(cx, cy + ch / 2 - 2, cw, 4);

    // Winner tag
    if (w === i) {
      ctx.textBaseline = 'middle';
      ctx.font = '800 26px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
      const label = 'KAZANAN';
      const tw = ctx.measureText(label).width + 36;
      ctx.fillStyle = ink;
      roundRect(ctx, x + (half - tw) / 2, cy + ch + 22, tw, 44, 22);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(label, x + half / 2, cy + ch + 45);
    }
  });

  // Top bar: app, sport and date
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '800 30px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('PUANTAJ', 36, BAR / 2);
  ctx.textAlign = 'right';
  ctx.font = '600 26px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${SPORTS[e.sport]?.name || ''} · ${longDate.format(new Date(e.date))}`, W - 36, BAR / 2);

  // Bottom bar: set scores, or the result
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f1f5f9';
  const bottom = e.setScores?.length ? `Setler  ${setsText(e)}` : (w < 0 ? 'Berabere' : `${e.teams[w]} kazandı`);
  fitText(ctx, bottom, W - 80, 30, 700);
  ctx.fillText(bottom, W / 2, H - BAR / 2);

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

/* ---------- .eml draft ---------- */

function utf8Base64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function blobBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

const wrap76 = (s) => s.replace(/.{1,76}/g, '$&\r\n').trimEnd();
const encodeWord = (s) => `=?UTF-8?B?${utf8Base64(s)}?=`;

// Builds an RFC 5322 message. X-Unsent makes Outlook open it as an editable draft.
export async function buildEml({ to = '', subject, text, files }) {
  const boundary = `----puantaj-${Math.random().toString(36).slice(2)}`;
  const parts = [
    'X-Unsent: 1',
    `To: ${to}`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(utf8Base64(text)),
  ];
  for (const f of files) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${f.type}; name="${f.name}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${f.name}"`,
      '',
      wrap76(await blobBase64(f.blob)),
    );
  }
  parts.push(`--${boundary}--`, '');
  return new Blob([parts.join('\r\n')], { type: 'message/rfc822' });
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function slug(e) {
  const d = new Date(e.date);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `puantaj-${e.sport}-${stamp}`;
}
