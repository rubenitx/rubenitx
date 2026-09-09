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
/* The same three hues pulled down to the value the map dots already sit at, so the
   drift reads as a change of tone and never as a change of brightness. */
const DRIFT = { blue: '#1D4E7A', purple: '#4C2E7E', green: '#17614C' };

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
 * A slow colour drift across the map, as one user-space gradient rather than an
 * animation per dot. Every dot is filled with url(#drift), so each takes the
 * colour at its own position and the wave travels as a single coherent front —
 * one animation covering ~700 dots instead of 700 competing ones.
 *
 * spreadMethod="repeat" tiles the ramp, and translating by exactly the gradient
 * vector advances it precisely one period, so the loop has no seam. The ramp
 * starts and ends on the same green and passes back through blue between purple
 * and green: that keeps every transition inside the palette instead of
 * interpolating through the muddy midpoint RGB gives for purple->green.
 */
const PERIOD = [430, 155];      // gradient vector, and the exact translate distance
const driftGradient = ({ id = 'drift', stops, vec = PERIOD, dur = 34 }) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" spreadMethod="repeat" ` +
  `x1="0" y1="0" x2="${vec[0]}" y2="${vec[1]}">` +
  stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('') +
  `<animateTransform attributeName="gradientTransform" type="translate" ` +
  `values="0 0;${vec[0]} ${vec[1]}" dur="${dur}s" repeatCount="indefinite"/>` +
  `</linearGradient>`;

/* Ramp shared by the map and the dividers: it starts and ends on the same green
   and returns through blue between purple and green, so no transition crosses
   the muddy midpoint RGB interpolation gives that pair. */
const ramp = (c) => [[0, c.green], [0.26, c.blue], [0.55, c.purple], [0.78, c.blue], [1, c.green]];

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
    ? `<g fill="#fff" opacity="${r2(max * ((i + 0.62) / LEVELS))}">${b.join('')}</g>` : '').join('')
    .replace(/<circle /g, '<circle r="1.35" ');
  return {
    defs: `<mask id="mapMask" maskContentUnits="userSpaceOnUse">${groups}</mask>`,
    body: `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#drift)" mask="url(#mapMask)"/>${bcn}`,
  };
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

const map = worldMap({ x: 468, y: 30, w: 504, h: 182 });
const name = nameCycle({ x: PAD, y: 132, lead: "Hi, I'm ", a: 'rubén.', b: 'rubenitx.', size: 40 });

const header = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Rubén Martínez Bernabe — Software Engineer, Barcelona, Spain. Available for opportunities.">
  <defs>${driftGradient({ stops: ramp(DRIFT) })}${map.defs}</defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${T.bg}" stroke="${T.edge}"/>
  ${map.body}
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

/* ── dividers ──────────────────────────────────────────────────────────────
 * Seven rules, one per section break, and deliberately seven files rather than
 * one placed seven times.
 *
 * The single shared file was the whole problem: seven <img> instances start
 * their SMIL clock together, so the marker that crossed each line sat at the
 * same x on all of them at once — a column of dots marching in step, which
 * reads as a progress bar. Variety is the actual fix, so each rule now differs
 * by construction and no two can ever line up.
 *
 * The difference follows one idea instead of seven decorations. A node travels
 * through the document: it advances left to right as you descend, and it loses
 * an edge at every step, so it starts as a triangle at the top and has resolved
 * into a circle by the contact section. Each spins at its own rate and its own
 * direction, which means the seven never return to a common phase.
 *
 * The node is filled with the same drifting gradient as the line, so its colour
 * is always whatever the wave is carrying at its position — the node and the
 * rule can never disagree.
 */
const BRIGHT = { blue: '#0A84FF', purple: '#B14AED', green: '#00D492' };
const DW = 1000, DH = 22, DVEC = [780, 0];
const CY = DH / 2;

/**
 * Regular n-gon, point-up, built at absolute coordinates. n = 0 draws a circle.
 *
 * The points are absolute on purpose. userSpaceOnUse gradient coordinates travel
 * with any transform on the filled element, so a node wrapped in translate()
 * samples url(#${gid}Drift) at its own local origin — which is the same point for all
 * seven, and they all come out one flat colour. Placed absolutely and spun about
 * their own centre, each node instead reads the wave where it actually stands.
 */
function nodeShape(n, r, cx, cy) {
  if (n === -1) return `<circle cx="${cx}" cy="${cy}" r="${r2(r * 0.82)}" fill="none" stroke-width="2.2"/>`;
  if (!n) return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  // A triangle inscribed in r covers 41% of the area a circle does, so few-sided
  // shapes read lighter than many-sided ones at the same radius. Nudge the small
  // ones up so the seven nodes carry equal optical weight down the page.
  r *= 1 + Math.max(0, 6 - n) * 0.075;
  const pts = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n - Math.PI / 2;
    return `${r2(cx + Math.cos(a) * r)},${r2(cy + Math.sin(a) * r)}`;
  });
  return `<polygon points="${pts.join(' ')}"/>`;
}

const SIDES = [3, 4, 5, 6, 8, -1, 0];   // angular, then it opens to a ring and settles solid
const SPINS = [19, 23, 17, 27, 21, 29, 25];

function makeDivider(i, total) {
  // Each divider is its own document as an <img>, so ids cannot clash there. Suffix
  // them anyway: inlined side by side (a preview page, a docs site) a shared
  // id="${gid}Mask" would let the first divider's gap punch every other line.
  const gid = `d${i}`;
  const t = total === 1 ? 0.5 : i / (total - 1);
  const x = r2(DW * (0.13 + t * 0.74));
  const r = 4.6, dir = i % 2 ? -1 : 1, spin = SPINS[i % SPINS.length];
  const shape = nodeShape(SIDES[i % SIDES.length], r, x, CY);
  const sides = SIDES[i % SIDES.length];
  const spinner = sides > 0
    ? `<animateTransform attributeName="transform" type="rotate" ` +
      `values="0 ${x} ${CY};${360 * dir} ${x} ${CY}" dur="${spin}s" repeatCount="indefinite"/>`
    : `<animate attributeName="r" values="${r2(sides === -1 ? r * 0.82 : r)};${r2((sides === -1 ? r * 0.82 : r) * 0.76)};${r2(sides === -1 ? r * 0.82 : r)}" dur="${r2(spin / 3)}s" repeatCount="indefinite"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DW} ${DH}" width="${DW}" height="${DH}" role="img" aria-label="">
  <defs>
    ${driftGradient({ id: `${gid}Drift`, stops: ramp(BRIGHT), vec: DVEC, dur: 30 })}
    <linearGradient id="${gid}Fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.2" stop-color="#fff" stop-opacity="0.72"/>
      <stop offset="0.8" stop-color="#fff" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${gid}Mask">
      <rect width="${DW}" height="${DH}" fill="url(#${gid}Fade)"/>
      <circle cx="${x}" cy="${CY}" r="${r + 2.8}" fill="#000"/>
    </mask>
  </defs>
  <rect x="0" y="${CY - 0.75}" width="${DW}" height="1.5" fill="url(#${gid}Drift)" mask="url(#${gid}Mask)"/>
  <circle cx="${x}" cy="${CY}" r="9" fill="url(#${gid}Drift)" opacity="0.14"/>
  <g fill="url(#${gid}Drift)" stroke="url(#${gid}Drift)">${shape.replace('/>', '>')}${spinner}</${sides > 0 ? 'polygon' : 'circle'}></g>
</svg>
`;
}

const N_DIV = 7;
for (let i = 0; i < N_DIV; i++) {
  const svg = makeDivider(i, N_DIV);
  writeFileSync(`assets/chrome/divider-${i}.svg`, svg);
  console.log(`  divider-${i}.svg  ${SIDES[i] || 'circle'} sides  x=${r2(DW * (0.13 + (i / (N_DIV - 1)) * 0.74))}  ${Buffer.byteLength(svg)} B`);
}
