#!/usr/bin/env node
/**
 * run-tests.js
 * CLI test suite for Anthony Bollas Portfolio — no external dependencies.
 * Run from the portfolio root: node tests/run-tests.js
 *
 * Test categories:
 *  1. File Existence    — all required files are present
 *  2. HTML Structure    — all sections, nav items, and key elements exist
 *  3. Content           — expected text / values appear in the page
 *  4. Links & Hrefs     — contact and social links point to the right URLs
 *  5. Assets            — referenced image files exist
 *  6. CSS Integrity     — required CSS variables and rules are defined
 *  7. JavaScript        — required functions and logic are present in source
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Resolve root relative to this file ──────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');

// ── Terminal colors ──────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  white:  '\x1b[97m',
};

// ── Test state ───────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) {
  currentSuite = name;
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

// ── File helpers ─────────────────────────────────────────────────────────────
function read(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function contains(content, pattern, flags = 'i') {
  if (content === null) return false;
  return new RegExp(pattern, flags).test(content);
}

function countMatches(content, pattern, flags = 'g') {
  if (!content) return 0;
  return (content.match(new RegExp(pattern, flags)) || []).length;
}

// ── Load source files ────────────────────────────────────────────────────────
const html = read('index.html');
const css  = read('css/styles.css');
const appJs = read('js/app.js');
const bgJs  = read('js/circuit-bg.js');

// ════════════════════════════════════════════════════════════════════════════
// 1. FILE EXISTENCE
// ════════════════════════════════════════════════════════════════════════════
suite('1 · File Existence');

const requiredFiles = [
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/circuit-bg.js',
  'assets/images/headshot.jpg',
  'assets/images/trips',
  '.claude/launch.json',
];

for (const f of requiredFiles) {
  assert(exists(f), f, 'file/directory not found');
}

// ════════════════════════════════════════════════════════════════════════════
// 2. HTML STRUCTURE
// ════════════════════════════════════════════════════════════════════════════
suite('2 · HTML Structure');

// Doctype & meta
assert(contains(html, '<!DOCTYPE html>'),        'has <!DOCTYPE html>');
assert(contains(html, 'charset="UTF-8"'),         'has charset UTF-8 meta');
assert(contains(html, 'name="viewport"'),         'has viewport meta');
assert(contains(html, '<title>'),                 'has <title>');

// Required sections (all 6)
const sectionIds = ['about', 'experience', 'projects', 'skills', 'education', 'contact'];
for (const id of sectionIds) {
  assert(contains(html, `id="${id}"`), `section #${id} exists`);
}

// Nav items (all 6 data-section values)
for (const id of sectionIds) {
  assert(contains(html, `data-section="${id}"`), `nav item data-section="${id}" exists`);
}

// Key structural elements
assert(contains(html, 'id="circuit-canvas"'),  'circuit canvas element exists');
assert(contains(html, 'id="trace-svg"'),       'trace SVG element exists');
assert(contains(html, 'id="circuit-nav"'),     'circuit nav element exists');
assert(contains(html, 'class="sidebar"'),      'sidebar element exists');
assert(contains(html, 'class="content-area"'), 'content-area element exists');
assert(contains(html, 'class="layout"'),       'layout grid element exists');

// Profile
assert(contains(html, 'assets/images/headshot.jpg'), 'headshot image src present');
assert(contains(html, 'Anthony Bollas'),              'name "Anthony Bollas" in HTML');
assert(contains(html, 'Union, NJ'),                   'location "Union, NJ" present');

// Scripts
assert(contains(html, 'js/circuit-bg.js'), 'circuit-bg.js script tag exists');
assert(contains(html, 'js/app.js'),        'app.js script tag exists');
assert(contains(html, 'css/styles.css'),   'styles.css link tag exists');

// Timeline items (experience) — expect 3
const timelineCount = countMatches(html, 'class="timeline-item"');
assert(timelineCount >= 3, `at least 3 timeline-item elements (found ${timelineCount})`);

// Project cards — expect 3
const projectCount = countMatches(html, 'class="project-card"');
assert(projectCount >= 3, `at least 3 project-card elements (found ${projectCount})`);

// Skill groups — expect 5
const skillGroupCount = countMatches(html, 'class="skill-group"');
assert(skillGroupCount >= 5, `at least 5 skill-group elements (found ${skillGroupCount})`);

// Education cards — expect 3 (one has class="edu-card cert-card" so match on edu-card anywhere)
const eduCount = countMatches(html, 'class="edu-card');
assert(eduCount >= 3, `at least 3 edu-card elements (found ${eduCount})`);

// Contact cards — expect 4
const contactCount = countMatches(html, 'class="contact-card"');
assert(contactCount >= 4, `at least 4 contact-card elements (found ${contactCount})`);

// Trips section — grid + real photos
assert(contains(html, 'id="trips-grid"'),          'trips grid element exists');
assert(contains(html, 'assets/images/trips/'),     'trip photo path present');
assert(contains(html, 'trip-photo-card'),          'trip-photo-card elements exist');
// Count real photo cards by src references
const tripPhotoCount = countMatches(html, 'assets/images/trips/[\\w]+\\.jpeg');
assert(tripPhotoCount >= 15, `at least 15 real trip photos (found ${tripPhotoCount})`);
// Spot-check key destinations
assert(contains(html, 'el_yunque_hike.jpeg'),   'El Yunque hike photo present');
assert(contains(html, 'DR_2024.jpeg'),          'Dominican Republic photo present');
assert(contains(html, 'chichinitza.jpeg'),      'Chichen Itza photo present');
assert(contains(html, 'brasil_2024.jpeg'),      'Brazil photo present');
assert(contains(html, 'bermuda.jpeg'),          'Bermuda photo present');
assert(contains(html, 'ocean_city_md.jpeg'),    'Ocean City photo present');

// ════════════════════════════════════════════════════════════════════════════
// 3. CONTENT
// ════════════════════════════════════════════════════════════════════════════
suite('3 · Content');

// About
assert(html.includes('5+ years'),              'mentions 5+ years experience');
assert(contains(html, 'CompTIA Network+'),     'mentions CompTIA Network+');
assert(contains(html, 'Hiking'),               'hobby: Hiking present');
assert(contains(html, 'Taking Trips'),         'hobby: Taking Trips present');
assert(contains(html, 'Self Care'),            'hobby: Self Care present');
assert(contains(html, 'Always Learning'),      'hobby: Always Learning present');

// Experience
assert(contains(html, 'Apple Specialist'),            'job: Apple Specialist present');
assert(contains(html, 'Software Developer Apprentice'), 'job: Software Developer Apprentice present');
assert(contains(html, 'Advanced Repair Agent'),       'job: Advanced Repair Agent present');
assert(contains(html, 'Geek Squad'),                  'employer: Geek Squad present');
assert(contains(html, 'Jan 2025'),                    'date Jan 2025 present');

// Projects
assert(contains(html, 'Prosumer Network Lab'),     'project: Prosumer Network Lab present');
assert(contains(html, 'Home DNS Server'),          'project: Home DNS Server present');
assert(contains(html, 'Active Directory Home Lab'), 'project: Active Directory Home Lab present');
assert(contains(html, 'Pi-hole'),                  'tech: Pi-hole mentioned');
assert(contains(html, 'Proxmox VE'),               'tech: Proxmox VE mentioned');
assert(contains(html, 'TP-Link Omada'),            'tech: TP-Link Omada mentioned');

// Skills
assert(contains(html, 'Windows Server 2025'),  'skill: Windows Server 2025');
assert(contains(html, 'Active Directory'),     'skill: Active Directory');
assert(contains(html, 'PostgreSQL'),           'skill: PostgreSQL');
assert(contains(html, 'TypeScript'),           'skill: TypeScript');
assert(contains(html, 'Angular'),              'skill: Angular');
assert(contains(html, 'Raspberry Pi'),         'skill: Raspberry Pi');

// Education
assert(contains(html, 'Kean University'),          'school: Kean University');
assert(contains(html, 'Union County College'),     'school: Union County College');
assert(contains(html, 'Bachelor of Science'),      'degree: Bachelor of Science');
assert(contains(html, 'Associate of Science'),     'degree: Associate of Science');
assert(contains(html, 'In Progress'),              'cert status: In Progress');

// Add-project template comment
assert(contains(html, 'ADD YOUR NEXT PROJECT HERE'), 'add-project template comment present');

// ════════════════════════════════════════════════════════════════════════════
// 4. LINKS & HREFS
// ════════════════════════════════════════════════════════════════════════════
suite('4 · Links & Hrefs');

assert(contains(html, 'href="mailto:anthonybollas@proton.me"'), 'ProtonMail mailto link');
assert(contains(html, 'href="mailto:bollascareer@gmail.com"'), 'Gmail mailto link');
assert(contains(html, 'https://linkedin.com/in/realtone'),     'LinkedIn URL');
assert(contains(html, 'https://github.com/abollas99'),         'GitHub URL');

// Phone number must NOT appear
assert(!contains(html, '973'),                'phone area code 973 not in HTML');
assert(!contains(html, '873-4304'),           'phone number not in HTML');

// target="_blank" on external links
const blankLinks = countMatches(html, 'target="_blank"');
assert(blankLinks >= 2, `at least 2 external links have target="_blank" (found ${blankLinks})`);

// ════════════════════════════════════════════════════════════════════════════
// 5. ASSETS
// ════════════════════════════════════════════════════════════════════════════
suite('5 · Assets');

const headshot = path.join(ROOT, 'assets/images/headshot.jpg');
assert(exists('assets/images/headshot.jpg'), 'headshot.jpg file exists');

if (exists('assets/images/headshot.jpg')) {
  const stat = fs.statSync(headshot);
  assert(stat.size > 10000, `headshot.jpg has reasonable size (${(stat.size/1024).toFixed(1)} KB)`);
}

assert(exists('assets/images/trips'), 'trips directory exists');

// ════════════════════════════════════════════════════════════════════════════
// 6. CSS INTEGRITY
// ════════════════════════════════════════════════════════════════════════════
suite('6 · CSS Integrity');

// CSS variables
const cssVars = ['--bg', '--cyan', '--green', '--text', '--sidebar-w', '--connector-w',
                 '--border', '--transition', '--radius'];
for (const v of cssVars) {
  assert(contains(css, v), `CSS variable ${v} defined`);
}

// Key selectors
const cssSelectors = [
  '#circuit-canvas',
  '.layout',
  '.sidebar',
  '.content-area',
  '.content-box',
  '.circuit-connector',
  '#trace-svg',
  '.nav-item',
  '.node',
  '.avatar-ring',
  '.timeline-item',
  '.project-card',
  '.skill-group',
  '.edu-card',
  '.contact-card',
  '.trips-grid',
  '.placeholder-card',
];
for (const sel of cssSelectors) {
  // Escape special chars for regex
  const escaped = sel.replace(/[#.\-]/g, c => '\\' + c);
  assert(contains(css, escaped), `CSS selector ${sel} defined`);
}

// Animations
const animations = ['ring-pulse', 'dot-blink', 'badge-pulse', 'fade-up'];
for (const anim of animations) {
  assert(contains(css, `@keyframes ${anim}`), `@keyframes ${anim} defined`);
}

// ════════════════════════════════════════════════════════════════════════════
// 7. JAVASCRIPT
// ════════════════════════════════════════════════════════════════════════════
suite('7 · JavaScript — app.js');

assert(appJs !== null,                          'app.js is readable');
assert(contains(appJs, 'buildTraces'),          'buildTraces function exists');
assert(contains(appJs, 'animateTrace'),         'animateTrace function exists');
assert(contains(appJs, 'switchSection'),        'switchSection function exists');
assert(contains(appJs, 'startCharge'),          'startCharge function exists');
assert(contains(appJs, 'stopCharge'),           'stopCharge function exists');
assert(contains(appJs, 'dataset.section'),      'reads data-section via dataset.section');
assert(contains(appJs, 'strokeDashoffset'),     'uses strokeDashoffset animation');
assert(contains(appJs, 'requestAnimationFrame'), 'uses requestAnimationFrame');
assert(contains(appJs, 'classList.add'),        'uses classList.add');
assert(contains(appJs, 'classList.remove'),     'uses classList.remove');
assert(contains(appJs, 'addEventListener'),     'attaches event listeners');
assert(contains(appJs, "'use strict'"),          'uses strict mode');
assert(contains(appJs, 'resize'),                'handles window resize');

suite('7 · JavaScript — circuit-bg.js');

assert(bgJs !== null,                           'circuit-bg.js is readable');
assert(contains(bgJs, 'getContext'),            'gets canvas context');
assert(contains(bgJs, 'requestAnimationFrame'), 'uses requestAnimationFrame');
assert(contains(bgJs, 'makeNodes'),             'makeNodes function exists');
assert(contains(bgJs, 'makeEdges'),             'makeEdges function exists');
assert(contains(bgJs, 'spawnPulse'),            'spawnPulse function exists');
assert(contains(bgJs, 'drawPulse'),             'drawPulse function exists');
assert(contains(bgJs, 'window.innerWidth'),     'reads window dimensions');
assert(contains(bgJs, 'resize'),                'handles window resize');

// Both JS files are wrapped in IIFEs (no global pollution)
assert(appJs.includes('(function'),  'app.js wrapped in IIFE');
assert(bgJs.includes('(function'),   'circuit-bg.js wrapped in IIFE');

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
  console.log(`\n${C.green}${C.bold}✔ All ${total} tests passed.${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${C.red}${C.bold}✘ ${failed} test(s) failed.${C.reset}\n`);
  process.exit(1);
}
