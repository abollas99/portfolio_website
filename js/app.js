/**
 * app.js
 * Handles:
 *  1. Section switching (About / Experience / Projects / Skills / Education / Contact)
 *  2. Circuit trace animation in the connector SVG — traces draw from the
 *     active nav node to the content box, lighting up progressively.
 *  3. A traveling "charge" dot that rides the active trace on repeat.
 */

(function () {
  'use strict';

  // ── DOM refs ─────────────────────────────────────────────
  const navItems    = document.querySelectorAll('.nav-item');
  const sections    = document.querySelectorAll('.content-box');
  const svg         = document.getElementById('trace-svg');
  const connector   = document.querySelector('.circuit-connector');

  // ── State ────────────────────────────────────────────────
  let currentSection = 'about';
  let traceAnimId    = null;
  let chargeAnimId   = null;

  // SVG path elements (bg + active layer)
  const bgPaths     = {};   // always-visible dark traces
  const activePaths = {};   // glowing active traces (animated)
  const chargeDots  = {};   // traveling dots

  // ── Color constants ──────────────────────────────────────
  const C_INACTIVE = '#0f1e30';
  const C_ACTIVE   = '#00d4ff';

  // ── Mobile helpers ───────────────────────────────────────
  function isMobile() { return window.innerWidth < 768; }

  // Scroll the active nav tab into center view (mobile horizontal nav)
  function scrollNavIntoView(item) {
    if (!isMobile()) return;
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // ── Build SVG traces once layout is ready ───────────────
  function buildTraces() {
    if (isMobile()) return;  // no connector on mobile
    const svgW = connector.offsetWidth  || 90;
    const svgH = connector.offsetHeight || window.innerHeight;

    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('width',  svgW);
    svg.setAttribute('height', svgH);

    // Clear any old paths
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    navItems.forEach((item) => {
      const sectionId = item.dataset.section;

      // Get the Y center of this nav node relative to the connector SVG
      const nodeWrap = item.querySelector('.node-wrap');
      const nodeRect = nodeWrap.getBoundingClientRect();
      const connRect = connector.getBoundingClientRect();

      const nodeY = nodeRect.top + nodeRect.height / 2 - connRect.top;

      // Build an L-shaped PCB trace:
      //   Start at left edge of connector (x=0, y=nodeY)
      //   go 60% across, then jog ±10px, then continue to right edge
      const midX  = svgW * 0.55;
      const jogY  = nodeY + (Math.random() > 0.5 ? 8 : -8);
      const pathD = `M 0,${nodeY.toFixed(1)} H ${midX.toFixed(1)} V ${jogY.toFixed(1)} H ${svgW}`;

      // ── Background (always-visible dark grey) ────────────
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bg.setAttribute('d', pathD);
      bg.setAttribute('stroke', C_INACTIVE);
      bg.setAttribute('stroke-width', '1.5');
      bg.setAttribute('fill', 'none');
      bg.setAttribute('stroke-linecap', 'round');
      svg.appendChild(bg);
      bgPaths[sectionId] = bg;

      // ── Active glow trace (starts hidden) ────────────────
      const act = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      act.setAttribute('d', pathD);
      act.setAttribute('stroke', C_ACTIVE);
      act.setAttribute('stroke-width', '2');
      act.setAttribute('fill', 'none');
      act.setAttribute('stroke-linecap', 'round');
      act.style.filter = 'drop-shadow(0 0 4px #00d4ff) drop-shadow(0 0 10px rgba(0,212,255,0.4))';
      svg.appendChild(act);
      activePaths[sectionId] = act;

      // ── Charge dot ───────────────────────────────────────
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#ffffff');
      dot.style.filter = 'drop-shadow(0 0 5px #00d4ff) drop-shadow(0 0 12px #00d4ff)';
      svg.appendChild(dot);
      chargeDots[sectionId] = { el: dot, path: act, len: 0, t: 0 };

      // Hide active + dot by default
      hideTrace(sectionId);
    });
  }

  // ── Show / hide helpers ──────────────────────────────────
  function hideTrace(id) {
    const act = activePaths[id];
    const info = chargeDots[id];
    if (!act) return;
    act.style.strokeDasharray  = '';
    act.style.strokeDashoffset = '';
    act.style.opacity = '0';
    if (info) info.el.style.display = 'none';
  }

  function getPathLength(el) {
    try { return el.getTotalLength(); } catch (e) { return 120; }
  }

  // ── Animate trace drawing (progressive left → right) ────
  function animateTrace(sectionId, onComplete) {
    const act  = activePaths[sectionId];
    if (!act) { if (onComplete) onComplete(); return; }

    const len  = getPathLength(act);
    const dur  = 420;   // ms for trace to fully draw
    const start = performance.now();

    act.style.opacity          = '1';
    act.style.strokeDasharray  = `${len}`;
    act.style.strokeDashoffset = `${len}`;

    if (traceAnimId) cancelAnimationFrame(traceAnimId);

    function step(ts) {
      const elapsed  = ts - start;
      const progress = Math.min(elapsed / dur, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      act.style.strokeDashoffset = `${len * (1 - eased)}`;

      if (progress < 1) {
        traceAnimId = requestAnimationFrame(step);
      } else {
        act.style.strokeDasharray  = '';
        act.style.strokeDashoffset = '';
        if (onComplete) onComplete();
      }
    }

    traceAnimId = requestAnimationFrame(step);
  }

  // ── Charge dot — loops along the active trace ─────────────
  function startCharge(sectionId) {
    const info = chargeDots[sectionId];
    if (!info) return;

    info.len = getPathLength(info.path);
    info.t   = 0;
    info.el.style.display = '';

    if (chargeAnimId) cancelAnimationFrame(chargeAnimId);

    const speed = 0.9; // px per frame

    function loop() {
      info.t += speed;
      if (info.t > info.len) info.t = 0;

      try {
        const pt = info.path.getPointAtLength(info.t);
        info.el.setAttribute('cx', pt.x);
        info.el.setAttribute('cy', pt.y);
      } catch (e) { /* path not ready */ }

      chargeAnimId = requestAnimationFrame(loop);
    }

    chargeAnimId = requestAnimationFrame(loop);
  }

  function stopCharge() {
    if (chargeAnimId) {
      cancelAnimationFrame(chargeAnimId);
      chargeAnimId = null;
    }
    // Hide all dots
    Object.values(chargeDots).forEach(info => {
      if (info && info.el) info.el.style.display = 'none';
    });
  }

  // ── Switch section ────────────────────────────────────────
  function switchSection(newId) {
    if (newId === currentSection) return;

    // Hide old trace + charge
    stopCharge();
    hideTrace(currentSection);

    // Deactivate old nav item
    navItems.forEach(item => {
      if (item.dataset.section === currentSection) item.classList.remove('active');
    });

    // Deactivate old section
    sections.forEach(sec => {
      if (sec.id === currentSection) sec.classList.remove('active');
    });

    currentSection = newId;

    // Activate new nav node + scroll it into view on mobile
    navItems.forEach(item => {
      if (item.dataset.section === newId) {
        item.classList.add('active');
        scrollNavIntoView(item);
      }
    });

    // On mobile: show section immediately (no trace animation)
    if (isMobile()) {
      sections.forEach(sec => {
        if (sec.id === newId) sec.classList.add('active');
      });
      return;
    }

    // Desktop: animate trace → then reveal section → then start charge dot
    animateTrace(newId, () => {
      sections.forEach(sec => {
        if (sec.id === newId) sec.classList.add('active');
      });
      startCharge(newId);
    });
  }

  // ── Nav click listeners ───────────────────────────────────
  navItems.forEach(item => {
    item.addEventListener('click', () => switchSection(item.dataset.section));
  });

  // ── Init ──────────────────────────────────────────────────
  function init() {
    // Wait one frame for layout to settle, then build traces
    requestAnimationFrame(() => {
      setTimeout(() => {
        buildTraces();
        // Draw the default "about" trace immediately (full, no animation)
        const act = activePaths['about'];
        if (act) {
          act.style.opacity = '1';
          act.style.strokeDasharray  = '';
          act.style.strokeDashoffset = '';
        }
        startCharge('about');
      }, 80);
    });
  }

  // Rebuild traces on resize (desktop only)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isMobile()) { stopCharge(); return; }
      stopCharge();
      buildTraces();
      // Restore active trace
      const act = activePaths[currentSection];
      if (act) {
        act.style.opacity = '1';
        act.style.strokeDasharray  = '';
        act.style.strokeDashoffset = '';
      }
      startCharge(currentSection);
    }, 200);
  });

  // ── Lightbox ────────────────────────────────────────────────────────────
  (function initLightbox() {
    const overlay  = document.getElementById('lightbox');
    const lbImg    = document.getElementById('lb-img');
    const lbCap    = document.getElementById('lb-caption');
    const btnClose = document.getElementById('lb-close');
    const btnPrev  = document.getElementById('lb-prev');
    const btnNext  = document.getElementById('lb-next');

    let photos = [];   // [{src, caption}]
    let current = 0;

    function buildPhotoList() {
      photos = Array.from(
        document.querySelectorAll('.trip-photo-card:not(.placeholder-card) img')
      ).map(img => ({
        src:     img.src,
        caption: img.closest('.trip-photo-card').querySelector('.trip-caption')?.textContent || ''
      }));
    }

    function open(index) {
      if (!photos.length) buildPhotoList();
      current = ((index % photos.length) + photos.length) % photos.length;
      lbImg.src        = photos[current].src;
      lbImg.alt        = photos[current].caption;
      lbCap.textContent = photos[current].caption;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    }

    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    // Wire clicks on photo cards
    document.addEventListener('click', function(e) {
      const card = e.target.closest('.trip-photo-card:not(.placeholder-card)');
      if (card) {
        buildPhotoList();
        const img = card.querySelector('img');
        const idx = photos.findIndex(p => p.src === img.src);
        open(idx >= 0 ? idx : 0);
      }
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function() { open(current - 1); });
    btnNext.addEventListener('click', function() { open(current + 1); });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function(e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   open(current - 1);
      if (e.key === 'ArrowRight')  open(current + 1);
    });
  }());

  // ── Theme Toggle ──────────────────────────────────────────────────────────
  (function initTheme() {
    // Apply saved theme before paint to avoid flash
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-mode');
    }

    function syncButtons() {
      // Keep both toggles (desktop + mobile) in sync
      const isLight = document.body.classList.contains('light-mode');
      document.querySelectorAll('.theme-toggle').forEach(function(btn) {
        btn.setAttribute('aria-pressed', String(isLight));
      });
    }

    function toggle() {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      syncButtons();
    }

    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.addEventListener('click', toggle);
    });

    syncButtons();
  }());

  // Kick off after DOM fully painted
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})();
