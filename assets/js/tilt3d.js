// tilt3d.js — Smooth 3D tilt + depth effect for cards, buttons, and hero
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  var LERP = 0.09;

  // ── Core tilt factory ────────────────────────────────────────────────────────
  function attachTilt(el, opts) {
    var maxRot     = opts.maxRot  !== undefined ? opts.maxRot  : 12;
    var depth      = opts.depth   !== undefined ? opts.depth   : 8;
    var glare      = opts.glare   !== false;
    var innerItems = opts.inner   || [];   // [{sel, z}]
    var shadow     = opts.shadow  !== false;

    el.style.transformStyle = 'preserve-3d';
    el.style.willChange     = 'transform';

    // Glare overlay
    var glareEl = null;
    if (glare) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      glareEl = document.createElement('div');
      Object.assign(glareEl.style, {
        position: 'absolute', inset: '0',
        borderRadius: 'inherit',
        background: 'linear-gradient(125deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 45%, transparent 100%)',
        opacity: '0', pointerEvents: 'none', zIndex: '20',
        transition: 'opacity 0.35s',
      });
      el.appendChild(glareEl);
    }

    // Depth-pop inner elements (translateZ on children)
    innerItems.forEach(function (item) {
      el.querySelectorAll(item.sel).forEach(function (child) {
        child.style.transformStyle = 'preserve-3d';
        child.style.transform      = 'translateZ(' + item.z + 'px)';
      });
    });

    var tx = 0, ty = 0, cx = 0, cy = 0;
    var active = false, rafId = null;

    function tick() {
      cx += (tx - cx) * LERP;
      cy += (ty - cy) * LERP;

      var sz = (active || Math.abs(cx) > 0.05 || Math.abs(cy) > 0.05) ? depth : 0;
      el.style.transform = 'perspective(900px) rotateX(' + cy.toFixed(3) + 'deg) rotateY(' + cx.toFixed(3) + 'deg) translateZ(' + sz + 'px)';

      if (glareEl) {
        var norm = Math.hypot(cx, cy) / maxRot;
        glareEl.style.opacity = (Math.min(norm, 1) * 0.32).toFixed(3);
      }

      if (!active && Math.abs(cx) < 0.05 && Math.abs(cy) < 0.05) {
        el.style.transform = '';
        if (glareEl) glareEl.style.opacity = '0';
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    el.addEventListener('mouseenter', function () {
      active = true;
      if (shadow) {
        el.style.transition  = 'box-shadow 0.3s';
        el.style.boxShadow   = '0 28px 60px rgba(10,191,188,0.22), 0 8px 24px rgba(0,0,0,0.28)';
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    el.addEventListener('mousemove', function (e) {
      var r  = el.getBoundingClientRect();
      var mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      var my = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      tx = mx * maxRot;
      ty = -my * maxRot;
    });

    el.addEventListener('mouseleave', function () {
      active = false;
      tx = 0; ty = 0;
      if (shadow) {
        el.style.transition = 'box-shadow 0.5s';
        el.style.boxShadow  = '';
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
  }

  // ── Hero section mouse parallax ──────────────────────────────────────────────
  function initHeroParallax() {
    var hero = document.querySelector('.hero-content') ||
               document.querySelector('.hero-inner')   ||
               document.querySelector('.hero > .container > div') ||
               document.querySelector('.hero .container');
    if (!hero) return;

    hero.style.transformStyle = 'preserve-3d';
    hero.style.willChange     = 'transform';
    hero.style.transition     = 'transform 0.05s linear';

    var hx = 0, hy = 0, hcx = 0, hcy = 0, hraf = null;

    function heroTick() {
      hcx += (hx - hcx) * 0.05;
      hcy += (hy - hcy) * 0.05;
      hero.style.transform = 'perspective(1400px) rotateX(' + hcy.toFixed(3) + 'deg) rotateY(' + hcx.toFixed(3) + 'deg)';
      hraf = requestAnimationFrame(heroTick);
    }

    window.addEventListener('mousemove', function (e) {
      hx = ((e.clientX / window.innerWidth)  - 0.5) *  4;
      hy = ((e.clientY / window.innerHeight) - 0.5) * -3;
    }, { passive: true });

    hraf = requestAnimationFrame(heroTick);
  }

  // ── Button 3D press ──────────────────────────────────────────────────────────
  function initButtons() {
    document.querySelectorAll('.btn-primary, .btn-ghost, .btn-magnetic').forEach(function (btn) {
      btn.addEventListener('mouseenter', function () {
        btn.style.transform  = 'translateY(-3px) scale(1.02)';
        btn.style.boxShadow  = '0 10px 28px rgba(10,191,188,0.38)';
      });
      btn.addEventListener('mousedown', function () {
        btn.style.transform  = 'translateY(1px) scale(0.98)';
        btn.style.boxShadow  = '0 3px 10px rgba(10,191,188,0.22)';
      });
      btn.addEventListener('mouseup', function () {
        btn.style.transform  = 'translateY(-3px) scale(1.02)';
        btn.style.boxShadow  = '0 10px 28px rgba(10,191,188,0.38)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform  = '';
        btn.style.boxShadow  = '';
      });
    });
  }

  // ── Section label float ──────────────────────────────────────────────────────
  function injectFloatCSS() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes float3d {',
      '  0%,100% { transform: translateY(0px) translateZ(0px); }',
      '  50%      { transform: translateY(-6px) translateZ(6px); }',
      '}',
      '.section-label { animation: float3d 4s ease-in-out infinite; display: inline-block; }',
      '.section-label:hover { animation-play-state: paused; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    injectFloatCSS();

    // Service photo cards (service sub-pages)
    document.querySelectorAll('.svc-photo-card').forEach(function (el) {
      attachTilt(el, {
        maxRot: 10, depth: 14, glare: true,
        inner: [
          { sel: '.svc-card-icon', z: 32 },
          { sel: '.svc-card-body h3', z: 22 },
          { sel: '.svc-card-body p',  z: 14 },
        ]
      });
    });

    // Homepage service cards
    document.querySelectorAll('.service-card').forEach(function (el) {
      attachTilt(el, {
        maxRot: 9, depth: 12, glare: true,
        inner: [
          { sel: '.service-card-body h3', z: 20 },
          { sel: '.service-card-body p',  z: 12 },
          { sel: '.badge',                z: 26 },
        ]
      });
    });

    // Process steps
    document.querySelectorAll('.process-step').forEach(function (el) {
      attachTilt(el, {
        maxRot: 8, depth: 8, glare: false, shadow: true,
        inner: [
          { sel: '.process-number', z: 24 },
          { sel: 'h3',             z: 16 },
          { sel: 'p',              z: 8  },
        ]
      });
    });

    // Generic glass cards (feature cards, about cards, etc.)
    document.querySelectorAll('.glass').forEach(function (el) {
      if (el.closest('.svc-photo-card') || el.closest('.service-card')) return;
      attachTilt(el, { maxRot: 7, depth: 6, glare: true });
    });

    // Glass-teal panels (CTA sections, etc.) — very subtle
    document.querySelectorAll('.glass-teal').forEach(function (el) {
      if (el.closest('.nav-dropdown') || el.closest('nav')) return;
      attachTilt(el, { maxRot: 4, depth: 6, glare: true });
    });

    // Hero parallax
    initHeroParallax();

    // Buttons
    initButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
