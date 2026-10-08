#!/usr/bin/env node
/**
 * Generates the profile header: the inner solar system with each planet at its
 * real heliocentric longitude on 8 October 2026, beside the name and role.
 *
 *   node tools/build-orbits.mjs
 *
 * Longitudes come from the J2000 mean elements (L0 + rate x days). The orbits are
 * drawn as tilted circles with a compressed radius (76 * sqrt(a)) so Jupiter fits;
 * distances are not to scale. Each planet then moves along its orbit at a speed
 * proportional to its real one, starting from that date. The name retypes itself
 * between the two spellings, as on rubenitx.me.
 */
import { writeFileSync } from 'node:fs';
const T = { bg:'#030712', edge:'#131C2E', text:'#E6EDF3', role:'#94A3B8', desc:'#64748B', accent:'#0A84FF', live:'#00D9FF', grid:'#1A2539', line:'#3B82F6', star:'#E6EDF3' };
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const r2 = (n) => Math.round(n * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
const W = 1000, H = 250, PAD = 64;
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


/* ── shared text column (identical in every variant) ───────────────────── */
const name = nameCycle({ x: PAD, y: 122, lead: "Hi, I'm ", a: 'rubén.', b: 'rubenitx.', size: 40 });
const textCol = (eyebrow) => `
  <g font-family="${MONO}" font-size="10" letter-spacing="1.8" fill="${T.desc}">
    <circle cx="${PAD + 3}" cy="66" r="3" fill="${T.live}"/>
    <text x="${PAD + 14}" y="69.5">${eyebrow}</text>
  </g>
${name.svg}
  <text x="${PAD}" y="156" font-family="${SANS}" font-size="17" fill="${T.role}">Full-stack developer · Java, Spring Boot, React</text>
  <text x="${PAD}" y="184" font-family="${SANS}" font-size="13.5" fill="${T.desc}">APIs, service integrations and internal web tools.</text>`;

const frame = (inner, defs, aria, legend) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${aria}">
  <defs>
    <clipPath id="frame"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15"/></clipPath>
    <linearGradient id="fade" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0.42" stop-color="#fff" stop-opacity="0"/><stop offset="0.64" stop-color="#fff" stop-opacity="1"/>
    </linearGradient>
    <mask id="side" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${T.accent}" stop-opacity="0"/><stop offset="0.5" stop-color="${T.accent}" stop-opacity="0.5"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/>
    </linearGradient>
    ${defs}
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${T.bg}" stroke="${T.edge}"/>
  <g clip-path="url(#frame)">${inner}</g>
  <text x="${W - 26}" y="${H - 20}" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="1.6" fill="${T.desc}">${legend}</text>
  <rect x="${PAD}" y="${H - 1}" width="${W - PAD * 2}" height="1" fill="url(#rule)"/>
</svg>
`;

/* ── A · inner solar system, real heliocentric longitudes on 8 Oct 2026 ── */
{
  const SUN = { x: 790, y: 124 }, TILT = 0.42;
  const D = (Date.UTC(2026, 9, 8, 12) - Date.UTC(2000, 0, 1, 12)) / 864e5;   // days since J2000
  const P = [ // name, a (AU), L0 (deg, J2000), rate (deg/day), radius, colour
    ['MERCURY', 0.387, 252.25, 4.09233, 2.2, '#94A3B8'],
    ['VENUS',   0.723, 181.98, 1.60213, 3.0, '#E6EDF3'],
    ['EARTH',   1.000, 100.46, 0.98561, 3.4, T.live],
    ['MARS',    1.524, 355.45, 0.52403, 2.7, '#F0997B'],
    ['JUPITER', 5.203,  34.40, 0.08309, 4.6, '#E6EDF3'],
  ];
  const rOf = (a) => 76 * Math.sqrt(a);                 // compress the outer orbit so Jupiter fits
  const EARTH_DUR = 140;                                  // seconds per Earth orbit in the animation
  let rings = '', bodies = '', labels = '';
  for (const [n, a, L0, rate, pr, col] of P) {
    const rx = r2(rOf(a)), ry = r2(rOf(a) * TILT);
    rings += `<ellipse cx="${SUN.x}" cy="${SUN.y}" rx="${rx}" ry="${ry}"/>`;
    const L = ((L0 + rate * D) % 360 + 360) % 360;
    // the path starts at longitude 0 and runs counter-clockwise (as seen from the north)
    const path = `M ${SUN.x + rx} ${SUN.y} A ${rx} ${ry} 0 1 0 ${SUN.x - rx} ${SUN.y} A ${rx} ${ry} 0 1 0 ${SUN.x + rx} ${SUN.y}`;
    const dur = r2(EARTH_DUR * (0.98561 / rate));
    const begin = r2(-(L / 360) * dur);
    bodies += `<circle r="${pr}" fill="${col}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;
    if (n === 'EARTH') {
      bodies += `<circle r="9" fill="none" stroke="${T.live}" stroke-opacity="0.35"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;
    }
    const lx = SUN.x + rx * Math.cos(rad(-62)), ly = SUN.y - ry * Math.sin(rad(-62));
  }
  /* Star field across the whole banner, so the text column and the chart read as
     one sky. Stars under the text are dimmer to keep the name legible, and a few
     brighter ones twinkle out of phase. */
  let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  // keep stars off the text lines themselves, where a dot would read as punctuation
  const TEXT = [[58, 60, 310, 76], [58, 86, 380, 132], [58, 140, 470, 163], [58, 171, 410, 191]];
  const onText = (x, y) => TEXT.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1);
  const pick = () => { let x, y; do { x = rnd() * W; y = rnd() * H; } while (onText(x, y)); return [x, y]; };
  const stars = Array.from({ length: 260 }, () => {
    const [x, y] = pick();
    const dim = x < 470 ? 0.5 : 1;
    return `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(0.45 + rnd() * 0.75)}" opacity="${r2((0.14 + rnd() * 0.42) * dim)}"/>`;
  }).join('');
  const twinkle = Array.from({ length: 9 }, (_, i) => {
    const [px, py] = pick(), x = r2(px), y = r2(py), d = r2(3 + rnd() * 4), b = r2(-rnd() * d);
    const peak = x < 470 ? 0.55 : 0.9;
    return `<circle cx="${x}" cy="${y}" r="1.15"><animate attributeName="opacity" values="0.15;${peak};0.15" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  const inner = `
  <g fill="${T.star}">${stars}${twinkle}</g>
  <g mask="url(#side)">
    <g fill="none" stroke="${T.line}" stroke-opacity="0.32">${rings}</g>
    <circle cx="${SUN.x}" cy="${SUN.y}" r="26" fill="url(#sun)"/>
    <circle cx="${SUN.x}" cy="${SUN.y}" r="5.5" fill="#FDE68A"/>
    ${bodies}
    <g font-family="${MONO}" font-size="7.5" letter-spacing="1.1" fill="${T.desc}">${labels}</g>
  </g>${textCol('41°23′N  2°10′E · BARCELONA')}`;
  const defs = `<radialGradient id="sun"><stop offset="0" stop-color="#FDE68A" stop-opacity="0.45"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient>`;
  // one line, sized to stay legible once GitHub scales the banner down
  const legend = 'PLANET POSITIONS · 8 OCT 2026';
  writeFileSync('assets/chrome/header.svg', frame(inner, defs, "Rubén Martínez Bernabe, full-stack developer in Barcelona. The inner solar system with each planet at its position on 8 October 2026.", legend));
}

console.log('  header.svg written');
