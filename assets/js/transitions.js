// transitions.js — Smooth page transitions with prefetch + early navigation
(function () {
  'use strict';

  const OVERLAY_ID   = 'page-transition';
  const LOGO_ID      = 'page-transition-logo';
  const SESSION_CX   = 'transition-cx';
  const SESSION_CY   = 'transition-cy';
  const SESSION_FLAG = 'transitioning';

  // ── Overlay creation ────────────────────────────────────────────────────────
  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position:       'fixed',
      top:            '0',
      left:           '0',
      width:          '100%',
      height:         '100%',
      background:     'linear-gradient(135deg, #0ABFBC 0%, #050D0D 100%)',
      clipPath:       'circle(0% at 50% 50%)',
      zIndex:         '9999',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      pointerEvents:  'none',
      willChange:     'clip-path',            // GPU hint
    });

    const logoWrapper = document.createElement('div');
    logoWrapper.id = LOGO_ID;
    Object.assign(logoWrapper.style, {
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      opacity:        '0',
      transform:      'scale(0.85)',
    });

    const existingLogo = document.querySelector('.nav-logo img, header img, .logo img');
    if (existingLogo) {
      const logoImg = existingLogo.cloneNode(true);
      Object.assign(logoImg.style, {
        width: 'auto', height: '48px', maxWidth: '200px',
        objectFit: 'contain', filter: 'brightness(0) invert(1)',
      });
      logoWrapper.appendChild(logoImg);
    } else {
      const t = document.createElement('span');
      t.textContent = 'Viral Scale AI';
      Object.assign(t.style, {
        fontFamily: 'inherit', fontSize: '1.5rem', fontWeight: '700',
        color: '#ffffff', letterSpacing: '0.05em',
      });
      logoWrapper.appendChild(t);
    }

    overlay.appendChild(logoWrapper);
    document.body.appendChild(overlay);
  }

  // ── Transition IN — collapse overlay on new page ────────────────────────────
  function transitionIn() {
    const overlay = document.getElementById(OVERLAY_ID);
    const logo    = document.getElementById(LOGO_ID);
    if (!overlay) return;

    const isTransitioning = sessionStorage.getItem(SESSION_FLAG) === '1';
    if (!isTransitioning) {
      gsap.set(overlay, { clipPath: 'circle(0% at 50% 50%)', pointerEvents: 'none' });
      return;
    }

    const cx = (sessionStorage.getItem(SESSION_CX) || '50') + 'px';
    const cy = (sessionStorage.getItem(SESSION_CY) || '50') + 'px';

    // Page already loaded — show overlay full-screen immediately, then collapse
    gsap.set(overlay, { clipPath: `circle(150% at ${cx} ${cy})`, pointerEvents: 'none' });
    if (logo) gsap.set(logo, { opacity: 0, scale: 0.85 });

    // Collapse — no delay, snappy reveal
    gsap.to(overlay, {
      clipPath:  'circle(0% at 50% 50%)',
      duration:  0.45,
      ease:      'power2.inOut',
      onComplete: () => {
        sessionStorage.removeItem(SESSION_FLAG);
        sessionStorage.removeItem(SESSION_CX);
        sessionStorage.removeItem(SESSION_CY);
      },
    });
  }

  // ── Prefetch helper ─────────────────────────────────────────────────────────
  function prefetch(href) {
    if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel  = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  // ── Intercept internal link clicks ─────────────────────────────────────────
  function interceptLinks() {
    document.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || href.startsWith('javascript:') ||
          isExternal(href) || el.getAttribute('target') === '_blank') return;

      // Prefetch page on hover so it's cached before the click
      el.addEventListener('mouseenter', () => prefetch(href), { once: true, passive: true });
      el.addEventListener('touchstart', () => prefetch(href), { once: true, passive: true });

      el.addEventListener('click', e => {
        e.preventDefault();

        const dest = el.getAttribute('href');
        const rect = el.getBoundingClientRect();
        const cx   = Math.round(rect.left + rect.width  / 2);
        const cy   = Math.round(rect.top  + rect.height / 2);

        sessionStorage.setItem(SESSION_CX,  cx);
        sessionStorage.setItem(SESSION_CY,  cy);
        sessionStorage.setItem(SESSION_FLAG, '1');

        const overlay = document.getElementById(OVERLAY_ID);
        if (!overlay) { window.location.href = dest; return; }

        let navigated = false;
        function go() {
          if (!navigated) { navigated = true; window.location.href = dest; }
        }

        overlay.style.pointerEvents = 'none';

        // Expand overlay — navigate as soon as the circle covers the viewport
        // (around 55% progress), so page load happens in parallel with animation
        gsap.fromTo(overlay,
          { clipPath: `circle(0% at ${cx}px ${cy}px)` },
          {
            clipPath:  `circle(150% at ${cx}px ${cy}px)`,
            duration:  0.4,
            ease:      'power2.in',
            onUpdate:  function () {
              if (this.progress() >= 0.55) go();
            },
            onComplete: go,   // safety fallback
          }
        );
      });
    });
  }

  function isExternal(href) {
    try { return new URL(href, window.location.href).hostname !== window.location.hostname; }
    catch (_) { return false; }
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  function init() {
    if (typeof gsap === 'undefined') return;
    createOverlay();
    transitionIn();
    interceptLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
