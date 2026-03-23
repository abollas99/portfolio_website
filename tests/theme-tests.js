#!/usr/bin/env node
/**
 * theme-tests.js
 * Targeted tests for:
 *   1. Light Mode CSS — all hardcoded dark values have light-mode overrides
 *   2. Theme Toggle — button present in HTML and JS wired correctly
 *   3. Terminal Proof Blocks — present on DNS Server and AD Lab cards
 *   4. Mobile Light Mode — mobile-specific elements have correct overrides
 *
 * Run: node tests/theme-tests.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Terminal colors ──────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  white:  '\x1b[97m',
};

let passed = 0;
let failed = 0;

function suite(name) {
  console.log(`\n${C.cyan}${C.bold}▸ ${name}${C.reset}`);
}

function pass(label) {
  passed++;
  console.log(`  ${C.green}✔${C.reset} ${C.dim}${label}${C.reset}`);
}

function fail(label, reason = '') {
  failed++;
  const extra = reason ? ` ${C.dim}(${reason})${C.reset}` : '';
  console.log(`  ${C.red}✘${C.reset} ${C.white}${label}${C.reset}${extra}`);
}

function assert(condition, label, reason = '') {
  if (condition) pass(label);
  else           fail(label, reason);
}

function read(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function has(content, pattern, flags = 'i') {
  if (!content) return false;
  return new RegExp(pattern, flags).test(content);
}

const html  = read('index.html');
const css   = read('css/styles.css');
const appJs = read('js/app.js');

// ════════════════════════════════════════════════════════════════════════════
// 1. LIGHT MODE — CSS VARIABLES
// ════════════════════════════════════════════════════════════════════════════
suite('1 · Light Mode — CSS Variables');

assert(has(css, 'body\\.light-mode'),              'body.light-mode selector defined');
assert(has(css, '--bg.*eef4fc|--bg.*f0f6|--bg.*eff'),
                                                   'light mode --bg is a light color');
assert(has(css, '--cyan.*1a6fc4|--cyan.*2563|--cyan.*0066'),
                                                   'light mode --cyan is a blue (not cyan)');
assert(has(css, '--text.*0d1e30|--text.*0f1|--text.*1a2'),
                                                   'light mode --text is a dark color');
assert(has(css, '--surface.*ffffff|--surface.*fff'),
                                                   'light mode --surface is white/near-white');

// ════════════════════════════════════════════════════════════════════════════
// 2. LIGHT MODE — HARDCODED BACKGROUND OVERRIDES
// ════════════════════════════════════════════════════════════════════════════
suite('2 · Light Mode — Hardcoded Background Overrides');

// The content-area is the most critical (whole right panel)
assert(has(css, 'light-mode.*\\.content-area|content-area.*light-mode', 's'),
  'body.light-mode .content-area background overridden');

assert(has(css, 'light-mode.*\\.sidebar|sidebar.*light-mode', 's'),
  'body.light-mode .sidebar background overridden');

assert(has(css, 'light-mode.*\\.circuit-connector|circuit-connector.*light-mode', 's'),
  'body.light-mode .circuit-connector overridden');

const cardOverrides = ['hobby-card', 'trip-photo-card', 'timeline-item',
                       'project-card', 'skill-group', 'edu-card', 'contact-card'];
for (const cls of cardOverrides) {
  assert(has(css, `light-mode[^}]*\\.${cls}|${cls}[^}]*light-mode`, 's'),
    `body.light-mode .${cls} background overridden`);
}

// ════════════════════════════════════════════════════════════════════════════
// 3. LIGHT MODE — HARDCODED WHITE TEXT OVERRIDES
// ════════════════════════════════════════════════════════════════════════════
suite('3 · Light Mode — White Text Overrides');

// These elements use color:#fff which would be invisible on a light background
const whiteTextEls = [
  'profile-name',
  'section-header h2',
  'job-title',
  'project-title',
  'edu-details h3',
  'contact-card-body h3',
];
for (const sel of whiteTextEls) {
  // Either the selector appears inside a light-mode block, or it uses var(--text)
  const escaped = sel.replace(/[.\s]/g, '[.\\s]?');
  assert(
    has(css, `light-mode[^}]*${sel.replace(/ /g, '[^}]*')}|${sel.replace(/ /g, '[^}]*')}[^}]*light-mode`, 's'),
    `body.light-mode ${sel} color overridden`
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. LIGHT MODE — SVG TRACE RECOLORING
// ════════════════════════════════════════════════════════════════════════════
suite('4 · Light Mode — SVG Trace Recoloring');

assert(has(css, 'light-mode.*trace-svg.*stroke-width.*1\\.5|trace-svg.*stroke-width.*1\\.5.*light-mode', 's'),
  'bg trace paths recolored in light mode');
assert(has(css, 'light-mode.*trace-svg.*stroke-width.*2[^.]|trace-svg.*stroke-width.*2[^.].*light-mode', 's'),
  'active trace paths recolored in light mode');
assert(has(css, 'light-mode.*trace-svg.*circle|trace-svg.*circle.*light-mode', 's'),
  'charge dot circle recolored in light mode');
assert(has(css, 'light-mode.*circuit-canvas'),
  'canvas opacity reduced in light mode');

// ════════════════════════════════════════════════════════════════════════════
// 5. THEME TOGGLE — HTML
// ════════════════════════════════════════════════════════════════════════════
suite('5 · Theme Toggle — HTML');

assert(has(html, 'class="theme-toggle"'),          'theme-toggle button exists in HTML');
assert(has(html, 'theme-toggle-mobile'),            'mobile theme-toggle button exists');
assert(has(html, 'icon-sun'),                       'sun icon SVG present');
assert(has(html, 'icon-moon'),                      'moon icon SVG present');
assert(has(html, 'aria-label="Toggle light'),       'toggle has aria-label');

// Icons switch correctly in CSS
assert(has(css, '\\.icon-moon.*display.*none'),     '.icon-moon hidden by default (dark mode)');
assert(has(css, 'light-mode.*icon-sun.*display.*none|light-mode.*\\.icon-sun.*display.*none', 's'),
  '.icon-sun hidden in light mode');
assert(has(css, 'light-mode.*icon-moon.*display.*block|light-mode.*\\.icon-moon.*display.*block', 's'),
  '.icon-moon shown in light mode');

// ════════════════════════════════════════════════════════════════════════════
// 6. THEME TOGGLE — JAVASCRIPT
// ════════════════════════════════════════════════════════════════════════════
suite('6 · Theme Toggle — JavaScript');

assert(has(appJs, 'light-mode'),                   'light-mode class toggled in JS');
assert(has(appJs, 'localStorage'),                 'theme preference saved to localStorage');
assert(has(appJs, 'theme-toggle'),                 'JS queries theme-toggle buttons');
assert(has(appJs, 'querySelectorAll.*theme-toggle|theme-toggle.*querySelectorAll', 's'),
  'querySelectorAll used for all theme toggles (desktop + mobile)');
assert(has(appJs, "classList.toggle\\('light-mode'\\)"),
  'classList.toggle used for theme switching');
assert(has(appJs, "localStorage.setItem.*theme"),  'theme saved to localStorage on toggle');
assert(has(appJs, "localStorage.getItem.*theme"),  'theme read from localStorage on load');
assert(has(appJs, 'aria-pressed'),                 'aria-pressed updated on toggle');

// ════════════════════════════════════════════════════════════════════════════
// 7. TERMINAL PROOF BLOCKS — HTML
// ════════════════════════════════════════════════════════════════════════════
suite('7 · Terminal Proof Blocks');

assert(has(html, 'terminal-block'),                'terminal-block elements exist in HTML');
assert(has(html, 'terminal-bar'),                  'terminal-bar (title bar) exists');
assert(has(html, 'terminal-body'),                 'terminal-body exists');
assert(has(html, 't-dot t-red'),                   'terminal traffic-light dots present');
assert(has(html, 'pi@pihole'),                     'Pi-hole terminal content present');
assert(has(html, 'Windows PowerShell'),            'PowerShell terminal content present');
assert(has(html, 'Get-ADUser'),                    'AD Get-ADUser command present');
assert(has(html, 'Get-GPO'),                       'AD Get-GPO command present');
assert(has(html, 'pihole status'),                 'Pi-hole status command present');
assert(has(html, 'dns_queries_today'),             'Pi-hole query stats present');

// ════════════════════════════════════════════════════════════════════════════
// 8. TERMINAL PROOF BLOCKS — CSS
// ════════════════════════════════════════════════════════════════════════════
suite('8 · Terminal Proof Block CSS');

assert(has(css, '\\.terminal-block'),              '.terminal-block selector defined');
assert(has(css, '\\.terminal-bar'),                '.terminal-bar selector defined');
assert(has(css, '\\.terminal-body'),               '.terminal-body selector defined');
assert(has(css, '\\.t-dot'),                       '.t-dot selector defined');
assert(has(css, '\\.t-prompt'),                    '.t-prompt (bash prompt) styled');
assert(has(css, '\\.t-ps'),                        '.t-ps (PowerShell prompt) styled');
assert(has(css, '\\.t-success'),                   '.t-success color defined');

// ════════════════════════════════════════════════════════════════════════════
// 9. MOBILE — LIGHT MODE OVERRIDES PRESENT
// ════════════════════════════════════════════════════════════════════════════
suite('9 · Mobile Light Mode Coverage');

// On mobile content-area has no hardcoded bg, so body.light-mode
// provides --bg via CSS variable — verify the variable IS overridden
assert(has(css, 'body\\.light-mode[^}]*--bg'),     'body.light-mode overrides --bg variable');
assert(has(css, 'body\\.light-mode[^}]*--text[^-]'), 'body.light-mode overrides --text variable');
assert(has(css, 'body\\.light-mode[^}]*--border[^-]'), 'body.light-mode overrides --border variable');
assert(has(css, 'body\\.light-mode[^}]*--cyan[^-]'), 'body.light-mode overrides --cyan variable');

// Mobile sidebar uses the same sidebar override as desktop (no media-query scoping needed)
assert(has(css, 'light-mode.*sidebar', 's'),       'sidebar light override applies to mobile too');

// Mobile resume download button is shown
assert(has(css, 'resume-download-btn.*display.*flex|resume-download-btn.*flex.*display', 's'),
  'resume-download-btn is shown on mobile (not display:none)');

// ════════════════════════════════════════════════════════════════════════════
// RESULTS
// ════════════════════════════════════════════════════════════════════════════
const total = passed + failed;
const pct   = total ? Math.round((passed / total) * 100) : 0;
const bar   = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));

console.log('\n' + '─'.repeat(52));
console.log(`${C.bold}Results${C.reset}   ${bar}  ${pct}%`);
console.log(`  ${C.green}${C.bold}Passed${C.reset}  ${passed}`);
if (failed > 0) {
  console.log(`  ${C.red}${C.bold}Failed${C.reset}  ${failed}`);
} else {
  console.log(`  ${C.dim}Failed  0${C.reset}`);
}
console.log('─'.repeat(52));

if (failed === 0) {
  console.log(`\n${C.green}${C.bold}✔ All ${total} theme tests passed.${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${C.red}${C.bold}✘ ${failed} theme test(s) failed.${C.reset}\n`);
  process.exit(1);
}
