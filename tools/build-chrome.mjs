#!/usr/bin/env node
/**
 * Generates the profile header and footer.
 *
 *   node tools/build-chrome.mjs
 *
 * Design brief: mirror the rubenitx.me hero rather than decorate around it.
 * That hero is deliberately quiet — flat ground, one blue accent, a sans-serif
 * greeting whose name retypes itself, and a dot matrix as the single graphic.
 * The restraint is the style, so this file spends its budget on typography and
 * space and keeps effects to the three that carry meaning: the caret, the name
 * cycle, and the availability dot.
 */
import { writeFileSync } from 'node:fs';

const T = {
  bg:     '#030712',
  edge:   '#131C2E',
  chip:   '#0B1120',
  chipEd: '#1E293B',
  text:   '#E6EDF3',
  role:   '#94A3B8',
  desc:   '#64748B',
  accent: '#0A84FF',
  live:   '#00D9FF',
  dot:    '#1D4E7A',
};
// The three project accents, kept only as a hairline so the header still
// belongs to the same system as the covers, tags and dividers.
const SPECTRUM = ['#0A84FF', '#B14AED', '#00D492'];

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const r2 = (n) => Math.round(n * 100) / 100;

/* ── deterministic noise, so regenerating never reshuffles the dots ─────── */
let _s = 20260908;
const rnd = () => ((_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296);

/**
 * The hero graphic is a dot-matrix world map, echoing the one on rubenitx.me.
 * Land is approximated as a union of ellipses and boxes in lon/lat, sampled onto
 * an equirectangular grid — accurate enough to read as a map at this opacity,
 * and it gives Barcelona somewhere real to sit.
 */
const LAND = [
  // [kind, lon, lat, rx/lon2, ry/lat2] — 'e' ellipse, 'b' box(lon0,lon1,lat0,lat1)
  ['e', -100,  46, 33, 19], ['b', -128, -68,  52,  71], ['e', -150, 63, 12,  7],
  ['b',  -92, -77,   8,  18], ['e',  -42, 73, 15,  9],
  ['e',  -62,  -6, 18, 19], ['b',  -72, -62, -38, -10], ['e', -70, -44, 5, 9],
  ['b',  -10,  32,  36,  56], ['b',    4,  30,  54,  70], ['b', -6, 2, 50, 58],
  ['e',   14,  18, 20, 14], ['b',  -17,  50,  12,  30],
  ['e',   22, -12, 15, 21], ['b',   12,  40, -34,  -8],
  ['e',   90,  54, 50, 18], ['b',   45, 130,  38,  68],
  ['e',   79,  21,  9, 12], ['e',  104, 14, 10, 10], ['b', 96, 142, -9, 6],
  ['e',  134, -25, 21, 13], ['e',  140, 38, 4, 7], ['e', 174, -41, 5, 6],
];
function isLand(lon, lat) {
  for (const [k, a, b, c, d] of LAND) {
    if (k === 'e') { const dx = (lon - a) / c, dy = (lat - b) / d; if (dx * dx + dy * dy <= 1) return true; }
    else if (lon >= a && lon <= b && lat >= c && lat <= d) return true;
  }
  return false;
}

/**
 * Sample the landmask onto a dot grid, dissolving westward so it clears the
 * text column. Dots are bucketed into a few opacity levels and emitted as
 * groups: same picture, roughly half the bytes of per-dot opacity.
 */
function worldMap({ x, y, w, h, cols = 60, max = 0.55 }) {
  const rows = Math.round(cols * (h / w) * 1.85);
  const cw = w / cols, ch = h / rows;
  const LEVELS = 4;
  const buckets = Array.from({ length: LEVELS }, () => []);
  let bcn = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lon = -180 + (c + 0.5) * (360 / cols);
      const lat = 84 - (r + 0.5) * (152 / rows);
      if (!isLand(lon, lat)) continue;
      const px = Math.round(x + c * cw + cw / 2), py = Math.round(y + r * ch + ch / 2);
      const fade = Math.min(1, Math.max(0, (c / cols - 0.03) / 0.26));
      const o = max * fade * (0.66 + rnd() * 0.34);
      if (o < 0.06) continue;
      buckets[Math.min(LEVELS - 1, Math.floor((o / max) * LEVELS))].push(`<circle cx="${px}" cy="${py}"/>`);
      if (!bcn && Math.abs(lon - 2.17) < 180 / cols && Math.abs(lat - 41.39) < 76 / rows) {
        bcn = `<circle cx="${px}" cy="${py}" r="2.7" fill="${T.live}" opacity="0.92">` +
              `<animate attributeName="opacity" values="0.92;0.3;0.92" dur="3.4s" repeatCount="indefinite"/></circle>`;
      }
    }
  }
  const groups = buckets.map((b, i) => b.length
    ? `<g fill="${T.dot}" opacity="${r2(max * ((i + 0.62) / LEVELS))}">${b.join('')}</g>` : '').join('');
  return `<g>${groups.replace(/<circle /g, '<circle r="1.35" ')}${bcn}</g>`;
}

/* ── name cycle ────────────────────────────────────────────────────────────
 * The site retypes the name between two spellings, so this does too. Each
 * typing state is its own <text>, all anchored at the same x, switched with a
 * discrete opacity track. The caret is a <tspan> inside each line rather than a
 * positioned rect, which means it always lands right after the last glyph
 * without this script needing to know the viewer's font metrics.
 */
function nameCycle({ x, y, lead, a, b, size }) {
  let common = 0;
  while (common < a.length && common < b.length && a[common] === b[common]) common++;
  const stem = a.slice(0, common);

  const grow = (from, to) => Array.from({ length: to.length - from.length }, (_, i) => to.slice(0, from.length + i + 1));
  const shrink = (from, to) => Array.from({ length: from.length - to.length }, (_, i) => from.slice(0, from.length - i - 1));

  const seq = [
    [a, 3.2],
    ...shrink(a, stem).map((s) => [s, 0.055]),
    ...grow(stem, b).map((s) => [s, 0.085]),
    [b, 3.2],
    ...shrink(b, stem).map((s) => [s, 0.055]),
    ...grow(stem, a).map((s) => [s, 0.085]),
  ];
  const total = r2(seq.reduce((n, [, d]) => n + d, 0));

  // one discrete opacity track per distinct state
  const states = [...new Set(seq.map(([s]) => s))];
  const bounds = [];
  let acc = 0;
  for (const [, d] of seq) { bounds.push(acc / total); acc += d; }
  const keyTimes = [...bounds.map((v) => r2(v)), 1].join(';');

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lines = states.map((s) => {
    const values = [...seq.map(([st]) => (st === s ? 1 : 0)), seq[seq.length - 1][0] === s ? 1 : 0].join(';');
    return `    <text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="700" ` +
      `fill="${T.text}" opacity="0" letter-spacing="-0.6">` +
      `<animate attributeName="opacity" calcMode="discrete" dur="${total}s" repeatCount="indefinite" ` +
      `keyTimes="${keyTimes}" values="${values}"/>` +
      `${esc(lead)}<tspan fill="${T.accent}">${esc(s)}</tspan>` +
      `<tspan fill="${T.accent}" font-size="${r2(size * 0.86)}">▏` +
      `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.42;0.5;0.92;1" dur="1.1s" repeatCount="indefinite"/>` +
      `</tspan></text>`;
  });
  return { svg: lines.join('\n'), total, states: states.length };
}

/* ── header ────────────────────────────────────────────────────────────── */
const W = 1000, H = 240, PAD = 68;

const pill = (x, y, label) => {
  const w = 24 + label.length * (9.5 * 0.6 + 1.9) + 16;
  return `    <rect x="${x}" y="${y}" width="${r2(w)}" height="26" rx="13" fill="${T.chip}" stroke="${T.chipEd}"/>
    <circle cx="${x + 15}" cy="${y + 13}" r="3.2" fill="${T.live}">
      <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite"/>
    </circle>
    <text x="${x + 27}" y="${y + 17.3}" font-family="${MONO}" font-size="9.5" letter-spacing="1.9" fill="${T.role}">${label}</text>`;
};

const spectrum = (y, w, from, to) =>
  `  <defs><linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${SPECTRUM[0]}" stop-opacity="0"/>
      <stop offset="0.3" stop-color="${SPECTRUM[0]}" stop-opacity="0.55"/>
      <stop offset="0.62" stop-color="${SPECTRUM[1]}" stop-opacity="0.5"/>
      <stop offset="0.88" stop-color="${SPECTRUM[2]}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${SPECTRUM[2]}" stop-opacity="0"/>
    </linearGradient></defs>
  <rect x="${from}" y="${y}" width="${to - from}" height="1" fill="url(#spec)"/>`;

const name = nameCycle({ x: PAD, y: 132, lead: "Hi, I'm ", a: 'rubén.', b: 'rubenitx.', size: 40 });

const header = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Rubén Martínez Bernabe — Software Engineer, Barcelona, Spain. Available for opportunities.">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${T.bg}" stroke="${T.edge}"/>
  <g>${worldMap({ x: 468, y: 30, w: 504, h: 182 })}</g>
${pill(PAD, 44, 'AVAILABLE FOR OPPORTUNITIES')}
${name.svg}
    <text x="${PAD}" y="168" font-family="${SANS}" font-size="16.5" fill="${T.role}">Software Engineer — Barcelona, Spain</text>
    <text x="${PAD}" y="195" font-family="${SANS}" font-size="13.5" fill="${T.desc}">I build APIs, connect services and turn manual workflows into web tools.</text>
${spectrum(H - 1, W, PAD, W - PAD)}
</svg>
`;
writeFileSync('assets/chrome/header.svg', header);
console.log(`  header.svg  ${W}x${H}  ${Buffer.byteLength(header)} B  · name cycle ${name.total}s over ${name.states} states`);

/* ── footer ────────────────────────────────────────────────────────────────
 * A closing note, not a second hero. It reuses exactly one device from the
 * header — the spectrum hairline, moved to the top edge — so the two panels
 * bookend the page. No map: mirroring one would render a flipped Earth, and an
 * unmirrored one would just compete with the header for the same idea.
 */
const FH = 92;
const foot = 'BARCELONA // SPAIN · SYSTEMS WITH INTENT';

const footer = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${FH}" width="${W}" height="${FH}" role="img" aria-label="Barcelona, Spain — systems with intent">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${FH - 1}" rx="16" fill="${T.bg}" stroke="${T.edge}"/>
${spectrum(1, W, PAD, W - PAD)}
  <text x="${W / 2}" y="${FH / 2 + 4}" text-anchor="middle" font-family="${MONO}" font-size="10.5" letter-spacing="3.4" fill="${T.desc}">${foot}</text>
</svg>
`;
writeFileSync('assets/chrome/footer.svg', footer);
console.log(`  footer.svg  ${W}x${FH}  ${Buffer.byteLength(footer)} B`);
