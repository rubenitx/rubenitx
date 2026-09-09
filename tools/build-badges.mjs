#!/usr/bin/env node
/**
 * Generates every badge/pill SVG used by the profile README.
 *
 * Why this exists: the README used to pull 48 separate badges from img.shields.io.
 * Each one is a cold round-trip through GitHub's camo proxy before the page settles.
 * Grouping the non-interactive ones into a single SVG per row takes that to 16 local
 * files, which camo caches alongside the rest of the repo assets.
 *
 *   node tools/build-badges.mjs
 *
 * Brand glyphs and their official colours come from simple-icons (dev dependency,
 * inlined at build time so the README itself has no runtime dependency on it).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import * as si from 'simple-icons';

const OUT = 'assets/badges';
mkdirSync(OUT, { recursive: true });

/* ── design tokens · mirrors rubenitx.me ─────────────────────────────── */
const T = {
  surface: '#0B1120',
  border:  '#1E293B',
  text:    '#CBD5E1',
  muted:   '#94A3B8',
  label:   '#7E8EA6',   // row labels: 6.0:1 on the page ground, clears WCAG AA
  accent:  '#00D9FF',
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/* Monospace advance width is a reliable 0.6em across the whole fallback stack,
   so pill geometry can be computed without measuring a real font. */
const adv = (s, size, tracking = 0) => s.length * (size * 0.6 + tracking);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Look up a simple-icons entry, allowing a colour/title override. */
function icon(slug, override = {}) {
  const key = 'si' + slug[0].toUpperCase() + slug.slice(1);
  const e = si[key];
  if (!e) throw new Error(`simple-icons: unknown slug "${slug}" (tried ${key})`);
  return { path: e.path, hex: '#' + e.hex, title: e.title, ...override };
}
/**
 * A tech with no simple-icons entry. Rather than leave a gap in the rhythm of the
 * row, stand in a neutral geometric mark in the brand's colour so every pill keeps
 * the same icon-plus-label shape.
 */
const MARK = 'M12 2.6 21.4 12 12 21.4 2.6 12 12 2.6Zm0 4.9L7.5 12l4.5 4.5 4.5-4.5L12 7.5Z';
const glyphless = (title, hex) => ({ path: MARK, hex, title });

/* ── pill row ────────────────────────────────────────────────────────
   One SVG per stack row. Brand glyph in its official colour, label in
   token text colour, stroke tinted toward the brand so each chip keeps
   its identity without turning the row into a rainbow.                */
const H = 26, R = 13, PAD_L = 11, ICON = 12, GAP_ICON = 7, PAD_R = 13, GAP = 7, FS = 10.5, TRACK = 0.2;

function pill(item, x) {
  const label = item.label ?? item.title;
  const hasIcon = item.path !== null;
  const w = PAD_L + (hasIcon ? ICON + GAP_ICON : 0) + adv(label, FS, TRACK) + PAD_R;
  const iconX = x + PAD_L, textX = x + PAD_L + (hasIcon ? ICON + GAP_ICON : 0);
  const parts = [
    `<rect x="${r2(x)}" y="1" width="${r2(w)}" height="${H - 2}" rx="${R - 1}" fill="${T.surface}" stroke="${item.hex}" stroke-opacity="0.34"/>`,
  ];
  if (hasIcon) {
    parts.push(
      `<g transform="translate(${r2(iconX)} ${(H - ICON) / 2}) scale(${r2(ICON / 24)})">` +
      `<path d="${item.path}" fill="${item.hex}"/></g>`
    );
  }
  parts.push(
    `<text x="${r2(textX)}" y="${H / 2 + 3.7}" font-family="${MONO}" font-size="${FS}" ` +
    `letter-spacing="${TRACK}" fill="${T.text}">${esc(label)}</text>`
  );
  return { svg: parts.join(''), w };
}

const r2 = (n) => Math.round(n * 100) / 100;

/** Lay out one labelled row of pills; returns its SVG fragment and natural width. */
function rowFragment(items, y) {
  let x = 0;
  const body = items.map((it) => {
    const { svg, w } = pill(it, x);
    x += w + GAP;
    return svg;
  }).join('');
  return { svg: `<g transform="translate(0 ${y})">${body}</g>`, width: r2(x - GAP) };
}

/** A standalone row SVG sized to its own content (used for the per-project tech strips). */
function row(name, items, aria) {
  const { svg, width } = rowFragment(items, 0);
  const out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${H}" width="${width}" height="${H}" ` +
    `role="img" aria-label="${esc(aria)}">${svg}</svg>\n`;
  writeFileSync(`${OUT}/${name}.svg`, out);
  return { name, bytes: Buffer.byteLength(out), count: items.length, width };
}

/**
 * The whole stack section as ONE file.
 *
 * Four separate row images would each scale by a different factor once the browser
 * applies max-width, so their labels would end up at four different sizes. Baking the
 * rows into a single canvas makes the scale uniform by construction and takes the
 * section from 25 requests to 1.
 */
const LABEL_W = 84, ROW_GAP = 14, LABEL_FS = 9.5, LABEL_TRACK = 1.5;

function stackSheet(name, groups) {
  const laid = groups.map((g, i) => ({ ...g, ...rowFragment(g.items, i * (H + ROW_GAP)) }));
  const content = Math.max(...laid.map((l) => l.width));
  const W = r2(LABEL_W + content);
  const HT = laid.length * H + (laid.length - 1) * ROW_GAP;
  const body = laid.map((l, i) => {
    const y = i * (H + ROW_GAP);
    return `  <text x="0" y="${y + H / 2 + 3.4}" font-family="${MONO}" font-size="${LABEL_FS}" ` +
           `letter-spacing="${LABEL_TRACK}" fill="${T.label}">${l.label.toUpperCase()}</text>\n` +
           `  <g transform="translate(${LABEL_W} 0)">${l.svg.replace(`translate(0 ${y})`, `translate(0 ${y})`)}</g>`;
  }).join('\n');
  const aria = groups.map((g) => `${g.label}: ${g.items.map((i) => i.label ?? i.title).join(', ')}`).join('. ');
  const out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}" width="${W}" height="${HT}" ` +
    `role="img" aria-label="${esc(aria)}">\n${body}\n</svg>\n`;
  writeFileSync(`${OUT}/${name}.svg`, out);
  return { name, bytes: Buffer.byteLength(out), count: groups.reduce((n, g) => n + g.items.length, 0), width: W };
}

/* ── linked button ───────────────────────────────────────────────────
   Header and contact badges each wrap their own <a>, so they stay one
   file per link. Larger, uppercase and tracked out, to read as an
   action rather than a label.                                         */
const BH = 36, BR = 18, BPAD = 16, BICON = 15, BGAP = 9, BFS = 11, BTRACK = 1.4;

function button(name, item) {
  const label = (item.label ?? item.title).toUpperCase();
  const w = BPAD + BICON + BGAP + adv(label, BFS, BTRACK) + BPAD;
  const id = `g-${name}`;
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${BH}" width="${r2(w)}" height="${BH}" role="img" aria-label="${esc(item.label ?? item.title)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0F172A"/>
      <stop offset="1" stop-color="${T.surface}"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="${r2(w - 2)}" height="${BH - 2}" rx="${BR - 1}" fill="url(#${id})" stroke="${item.hex}" stroke-opacity="0.45"/>
  <g transform="translate(${BPAD} ${(BH - BICON) / 2}) scale(${r2(BICON / 24)})"><path d="${item.path}" fill="${item.hex}"/></g>
  <text x="${r2(BPAD + BICON + BGAP)}" y="${BH / 2 + 4}" font-family="${MONO}" font-size="${BFS}" letter-spacing="${BTRACK}" fill="${T.text}">${esc(label)}</text>
</svg>
`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
  return { name, bytes: Buffer.byteLength(svg), count: 1, width: r2(w) };
}

/* ── content ─────────────────────────────────────────────────────── */
/* The portfolio button points at rubenitx.me, not at the framework it happens to be
   built with, so it gets a site mark rather than the Astro rocket. */
const SITE = {
  path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.3 6h-2.95a15.7 15.7 0 0 0-1.4-3.4A8.03 8.03 0 0 1 19.3 8ZM12 4.05c.66.96 1.2 2.06 1.56 3.95h-3.12C10.8 6.11 11.34 5.01 12 4.05ZM4.26 14A8.05 8.05 0 0 1 4 12c0-.69.1-1.36.26-2h3.4a16.6 16.6 0 0 0 0 4h-3.4Zm.44 2h2.95c.33 1.25.8 2.4 1.4 3.4A8.03 8.03 0 0 1 4.7 16Zm2.95-8H4.7a8.03 8.03 0 0 1 4.35-3.4A15.7 15.7 0 0 0 7.65 8ZM12 19.95c-.66-.96-1.2-2.06-1.56-3.95h3.12c-.36 1.89-.9 2.99-1.56 3.95ZM14.02 14H9.98a14.8 14.8 0 0 1 0-4h4.04a14.8 14.8 0 0 1 0 4Zm.93 5.4c.6-1 1.07-2.15 1.4-3.4h2.95a8.03 8.03 0 0 1-4.35 3.4ZM16.34 14a16.6 16.6 0 0 0 0-4h3.4c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.4Z',
  hex: '#00D9FF', title: 'Portfolio',
};

const LINKEDIN = { // not carried by simple-icons; official mark, hand-traced
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  hex: '#0A66C2', title: 'LinkedIn',
};

const stack = stackSheet('stack', [
  { label: 'Backend', items: [
    icon('openjdk', { label: 'Java', hex: '#F89820' }),
    icon('springboot', { label: 'Spring Boot' }),
    icon('spring', { label: 'Spring Batch' }),
    icon('swagger', { label: 'REST APIs' }),
    glyphless('Liferay', '#1B7ACF'),
    icon('python', { hex: '#4B8BBE' }),
    icon('php', { hex: '#8892BF' }),
  ] },
  { label: 'Frontend', items: [
    icon('react'), icon('typescript'), icon('javascript'),
    icon('astro', { hex: '#BC52EE' }), icon('tailwindcss', { label: 'Tailwind CSS' }),
    icon('vite', { hex: '#646CFF' }), icon('d3', { label: 'D3.js' }),
  ] },
  { label: 'Data', items: [
    icon('mysql', { hex: '#4479A1' }), icon('postgresql', { label: 'PostgreSQL' }), icon('mongodb'),
  ] },
  { label: 'Ops', items: [
    icon('docker'), icon('kubernetes'), icon('jenkins'), icon('terraform'),
    icon('githubactions', { label: 'GitHub Actions' }), icon('nginx', { label: 'NGINX' }),
    icon('grafana'), icon('linux'),
  ] },
]);

const rows = [stack,
  row('tech-transcriber', [
    icon('openjdk', { label: 'Java 21', hex: '#F89820' }), icon('springboot', { label: 'Spring Boot' }),
    icon('astro', { hex: '#BC52EE' }), icon('react'),
  ], 'Built with Java 21, Spring Boot, Astro, React'),

  row('tech-financecore', [
    icon('react'), icon('typescript'), icon('fastapi'), icon('postgresql', { label: 'PostgreSQL' }),
  ], 'Built with React, TypeScript, FastAPI, PostgreSQL'),

  row('tech-sars', [
    icon('typescript'), icon('php', { hex: '#8892BF' }), icon('python', { hex: '#4B8BBE' }), icon('d3', { label: 'D3.js' }),
  ], 'Built with TypeScript, PHP, Python, D3.js'),

  row('tech-portfolio', [
    icon('astro', { hex: '#BC52EE' }), icon('tailwindcss', { label: 'Tailwind CSS' }), icon('typescript'),
  ], 'Built with Astro, Tailwind CSS, TypeScript'),
];

const buttons = [
  button('link-portfolio', SITE),
  button('link-linkedin',  { ...LINKEDIN, label: 'LinkedIn' }),
  button('link-email',     icon('gmail', { label: 'Email' })),
  button('link-orcid',     icon('orcid', { label: 'ORCID' })),
  button('cta-email',      icon('gmail', { label: 'Write to me' })),
  button('cta-linkedin',   { ...LINKEDIN, label: "Let's connect" }),
  button('cta-cv',         icon('readdotcv', { label: 'Read my CV', hex: '#00D9FF' })),
  button('cta-research',   icon('orcid', { label: 'Research' })),
];

const all = [...rows, ...buttons];
const badges = all.reduce((n, r) => n + r.count, 0);
const bytes = all.reduce((n, r) => n + r.bytes, 0);
for (const r of all) console.log(`  ${r.name.padEnd(20)} ${String(r.width).padStart(6)}px  ${String(r.bytes).padStart(5)} B  (${r.count} badge${r.count > 1 ? 's' : ''})`);
console.log(`\n  ${all.length} files · ${badges} badges · ${(bytes / 1024).toFixed(1)} KB total`);
console.log(`  replaces ${badges} img.shields.io requests with ${all.length} local ones`);
