// hero-particles.js — Canvas particles + water ripple on click/touch
// No dependencies. Targets any .hero-canvas-bg element.
(function () {
  'use strict';

  var PALETTE = [
    [10, 191, 188],
    [0, 229, 229],
    [255, 255, 255],
    [71, 212, 209],
  ];
  var N    = 80;
  var CONN = 110;
  var FPS  = 1000 / 30;
  var IS_DESKTOP = window.innerWidth >= 768;

  document.querySelectorAll('.hero-canvas-bg').forEach(function (wrapper) {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    wrapper.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    var pts = [];
    var ripples = [];

    function resize() {
      W = canvas.width  = wrapper.offsetWidth  || window.innerWidth;
      H = canvas.height = wrapper.offsetHeight || 500;
    }

    function mkPt() {
      var c  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      var bvx = (Math.random() - 0.5) * 0.3;
      var bvy = (Math.random() - 0.5) * 0.3;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.4,
        vx: bvx, vy: bvy,
        bvx: bvx, bvy: bvy,   // base velocity to return to
        c: c,
        phase: Math.random() * Math.PI * 2,
      };
    }

    resize();
    if (IS_DESKTOP) pts = Array.from({ length: N }, mkPt);

    /* ── Ripple spawn ──────────────────────────────────── */
    function spawnRipple(cx, cy) {
      ripples.push({ x: cx, y: cy, r: 0, alpha: 0.9 });

      // Push particles outward with a jelly kick
      if (!IS_DESKTOP) return;
      pts.forEach(function (p) {
        var dx   = p.x - cx;
        var dy   = p.y - cy;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 220) {
          var force = ((220 - dist) / 220) * 3.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      });
    }

    /* ── Pointer events on hero section (not canvas) ──── */
    var heroSection = wrapper.closest('section') || wrapper.parentElement;
    function onPointer(e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = W / rect.width;
      var scaleY = H / rect.height;
      var src = e.changedTouches ? e.changedTouches[0] : e;
      spawnRipple((src.clientX - rect.left) * scaleX,
                  (src.clientY - rect.top)  * scaleY);
    }
    if (heroSection) {
      heroSection.addEventListener('click',      onPointer, { passive: true });
      heroSection.addEventListener('touchstart', onPointer, { passive: true });
    }

    /* ── Render loop ───────────────────────────────────── */
    var lastTs = 0;
    function tick(ts) {
      requestAnimationFrame(tick);
      if (ts - lastTs < FPS) return;
      lastTs = ts;

      ctx.clearRect(0, 0, W, H);

      /* Particles (desktop only) */
      if (IS_DESKTOP) {
        pts.forEach(function (p) {
          // Ease back to base velocity (jelly return)
          p.vx += (p.bvx - p.vx) * 0.04;
          p.vy += (p.bvy - p.vy) * 0.04;
          p.phase += 0.016;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0)  p.x = W;
          if (p.x > W)  p.x = 0;
          if (p.y < 0)  p.y = H;
          if (p.y > H)  p.y = 0;
        });

        // Connections
        for (var i = 0; i < N; i++) {
          for (var j = i + 1; j < N; j++) {
            var dx = pts[i].x - pts[j].x;
            var dy = pts[i].y - pts[j].y;
            var d  = Math.sqrt(dx * dx + dy * dy);
            if (d < CONN) {
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.strokeStyle = 'rgba(10,191,188,' + ((1 - d / CONN) * 0.14) + ')';
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        // Dots
        pts.forEach(function (p) {
          var alpha = 0.35 + 0.3 * Math.sin(p.phase);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + alpha + ')';
          ctx.fill();
        });
      }

      /* Ripple rings */
      for (var ri = ripples.length - 1; ri >= 0; ri--) {
        var rip = ripples[ri];
        rip.r     += 5;
        rip.alpha *= 0.955;

        // Draw 3 concentric rings (staggered) for the water-drop look
        for (var k = 0; k < 3; k++) {
          var kr = rip.r - k * 28;
          if (kr <= 0) continue;
          var ka = rip.alpha * (1 - k * 0.28);
          if (ka < 0.005) continue;

          ctx.beginPath();
          ctx.arc(rip.x, rip.y, kr, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(10,191,188,' + (ka * 0.55) + ')';
          ctx.lineWidth   = 2.5 - k * 0.7;
          ctx.stroke();

          // Inner glow fill for first ring only
          if (k === 0) {
            var grad = ctx.createRadialGradient(rip.x, rip.y, kr * 0.7, rip.x, rip.y, kr);
            grad.addColorStop(0, 'rgba(10,191,188,0)');
            grad.addColorStop(1, 'rgba(10,191,188,' + (ka * 0.08) + ')');
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, kr, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
          }
        }

        if (rip.alpha < 0.01) ripples.splice(ri, 1);
      }
    }

    tick(0);

    window.addEventListener('resize', function () {
      IS_DESKTOP = window.innerWidth >= 768;
      resize();
      if (IS_DESKTOP && pts.length === 0) pts = Array.from({ length: N }, mkPt);
    }, { passive: true });
  });
}());
