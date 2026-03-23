/**
 * circuit-bg.js
 * Draws an animated PCB circuit board on the background canvas.
 * Nodes, traces, and traveling charge pulses.
 */

(function () {
  const canvas = document.getElementById('circuit-canvas');
  const ctx = canvas.getContext('2d');

  // ── Colors ──────────────────────────────────────────────
  const COLOR_NODE    = 'rgba(15, 35, 58, 0.9)';
  const COLOR_TRACE   = 'rgba(15, 35, 58, 0.85)';
  const COLOR_PULSE   = 'rgba(0, 212, 255, 0.7)';
  const COLOR_GLOW    = 'rgba(0, 212, 255, 0.12)';

  // ── Grid settings ───────────────────────────────────────
  const CELL        = 48;     // grid cell size in px
  const CONNECT_P   = 0.38;   // probability any two adjacent nodes connect
  const NODE_RADIUS = 2.5;
  const PULSE_SPEED = 1.8;    // px per frame
  const MAX_PULSES  = 6;

  let W, H, cols, rows, nodes, edges, pulses;
  let animFrame;

  // ── Node ────────────────────────────────────────────────
  function makeNodes() {
    nodes = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        // slight jitter for organic feel
        const jx = (Math.random() - 0.5) * CELL * 0.18;
        const jy = (Math.random() - 0.5) * CELL * 0.18;
        nodes.push({ x: c * CELL + jx, y: r * CELL + jy, col: c, row: r });
      }
    }
  }

  // ── Edges ───────────────────────────────────────────────
  function makeEdges() {
    edges = [];
    const w = cols + 1;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const idx = r * w + c;
        // right neighbor
        if (c < cols && Math.random() < CONNECT_P) {
          edges.push({ a: nodes[idx], b: nodes[idx + 1] });
        }
        // down neighbor
        if (r < rows && Math.random() < CONNECT_P) {
          edges.push({ a: nodes[idx], b: nodes[idx + w] });
        }
        // diagonal (sparse)
        if (c < cols && r < rows && Math.random() < CONNECT_P * 0.15) {
          edges.push({ a: nodes[idx], b: nodes[idx + w + 1] });
        }
      }
    }
  }

  // ── Pulse (traveling charge dot) ────────────────────────
  function spawnPulse() {
    if (edges.length === 0) return;
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const forward = Math.random() < 0.5;
    pulses.push({
      edge,
      t: 0,      // 0→1 progress along edge
      forward,
      alpha: 0,
      fadingOut: false,
    });
  }

  function updatePulse(p, dt) {
    const { a, b } = p.edge;
    const dx   = b.x - a.x;
    const dy   = b.y - a.y;
    const len  = Math.sqrt(dx * dx + dy * dy);
    const step = (PULSE_SPEED * dt) / len;

    if (p.forward) p.t += step; else p.t -= step;

    // Fade in/out
    if (p.t < 0.12) p.alpha = p.t / 0.12;
    else if (p.t > 0.88) p.alpha = (1 - p.t) / 0.12;
    else p.alpha = 1;

    return p.t < 0 || p.t > 1;   // true = dead
  }

  function drawPulse(p) {
    const { a, b } = p.edge;
    const px = a.x + (b.x - a.x) * p.t;
    const py = a.y + (b.y - a.y) * p.t;

    // Outer glow
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 14);
    grad.addColorStop(0,   `rgba(0,212,255,${0.25 * p.alpha})`);
    grad.addColorStop(1,   'rgba(0,212,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Draw frame ──────────────────────────────────────────
  let last = 0;
  function draw(ts) {
    const dt = Math.min((ts - last) / 16.67, 3);   // delta in frames (~60 fps base)
    last = ts;

    ctx.clearRect(0, 0, W, H);

    // Background already set by CSS; add a very faint vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Traces
    ctx.strokeStyle = COLOR_TRACE;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (const e of edges) {
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }

    // Nodes
    for (const n of nodes) {
      ctx.fillStyle = COLOR_NODE;
      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spawn pulses
    if (pulses.length < MAX_PULSES && Math.random() < 0.025 * dt) {
      spawnPulse();
    }

    // Update + draw pulses
    pulses = pulses.filter(p => {
      const dead = updatePulse(p, dt);
      if (!dead) drawPulse(p);
      return !dead;
    });

    animFrame = requestAnimationFrame(draw);
  }

  // ── Init / Resize ────────────────────────────────────────
  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    pulses = [];
    makeNodes();
    makeEdges();
  }

  function start() {
    init();
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(draw);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 180);
  });

  start();
})();
