// main.js — Global JS for Viral Scale AI
// Requires: GSAP, ScrollTrigger, TextPlugin (loaded via CDN)

(function () {
  'use strict';

  if (typeof gsap === 'undefined') { console.warn('[main.js] GSAP not loaded'); return; }

  gsap.registerPlugin(ScrollTrigger, TextPlugin);

  // Shared ScrollTrigger defaults — animate in once, stay visible
  const ST = (trigger, extra = {}) => ({
    trigger,
    start: 'top 88%',
    once:  true,
    ...extra,
  });

  // ─── 1. NATIVE SCROLL ─────────────────────────────────────────────────────────
  let lenis = null;
  function initLenis() { /* native scroll */ }

  // ─── 2. SCROLL PROGRESS BAR ───────────────────────────────────────────────────
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    gsap.to(bar, {
      width: '100%', ease: 'none',
      scrollTrigger: { start: 'top top', end: 'bottom bottom', scrub: 0 },
    });
  }

  // ─── 3. CURSOR disabled ───────────────────────────────────────────────────────
  function initCursor() { /* cursor disabled */ }

  // ─── 4. NAVIGATION ────────────────────────────────────────────────────────────
  function initNavigation() {
    const nav = document.querySelector('.main-nav, nav');
    if (!nav) return;

    ScrollTrigger.create({
      start: 'top+=60 top',
      onEnter:     () => nav.classList.add('scrolled'),
      onLeaveBack: () => nav.classList.remove('scrolled'),
    });

    const links = nav.querySelectorAll('.nav-link');
    if (links.length) {
      gsap.fromTo(links,
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.3 }
      );
    }

    const hamburger = nav.querySelector('.nav-hamburger') || document.getElementById('navHamburger');
    const mobileMenu = nav.querySelector('.nav-mobile-menu') || document.getElementById('navMobileMenu');

    if (hamburger && mobileMenu) {
      let open = false;
      hamburger.addEventListener('click', () => {
        open = !open;
        hamburger.classList.toggle('open', open);
        mobileMenu.classList.toggle('open', open);
        if (open) {
          mobileMenu.style.visibility = 'visible';
          gsap.fromTo(mobileMenu, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
          gsap.fromTo(mobileMenu.querySelectorAll('a'), { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'power3.out', delay: 0.08 });
          document.body.style.overflow = 'hidden';
        } else {
          gsap.to(mobileMenu, { opacity: 0, y: -8, duration: 0.2, ease: 'power2.in', onComplete: () => { mobileMenu.style.visibility = 'hidden'; } });
          document.body.style.overflow = '';
        }
      });
      mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { if (open) hamburger.click(); }));
    }
  }

  // ─── 5. SCROLL REVEAL (in + out) ──────────────────────────────────────────────
  function initScrollReveal() {
    document.querySelectorAll('.reveal-up').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: ST(el) }
      );
    });
    document.querySelectorAll('.reveal-left').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: ST(el) }
      );
    });
    document.querySelectorAll('.reveal-right').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: ST(el) }
      );
    });

    // Stagger grids — each child in/out
    document.querySelectorAll('.stagger-grid').forEach(grid => {
      const kids = Array.from(grid.children);
      if (!kids.length) return;
      gsap.fromTo(kids,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.65, ease: 'power3.out',
          scrollTrigger: ST(grid) }
      );
    });
  }

  // ─── 6. COUNT-UP ──────────────────────────────────────────────────────────────
  function initCountUp() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const suffix = el.getAttribute('data-count-suffix') || '';
      const proxy  = { val: 0 };
      gsap.to(proxy, {
        val: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        onUpdate()   { el.textContent = (target >= 100 ? Math.round(proxy.val) : proxy.val.toFixed(target < 10 ? 1 : 0)) + suffix; },
        onComplete() { el.textContent = target + suffix; },
      });
    });
  }

  // ─── 7. MAGNETIC BUTTONS (disabled — CSS hover handles the effect smoothly) ──
  function initMagneticButtons() {}

  // ─── 8. CARD TILT (disabled — causes weird cursor/hover behaviour) ───────────
  function initCardTilt() {}

  // ─── 9. HERO ANIMATIONS (once only — above fold) ──────────────────────────────
  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    const badge = hero.querySelector('.hero-badge');
    if (badge) { gsap.set(badge, { opacity: 0, y: 20 }); tl.to(badge, { opacity: 1, y: 0, duration: 0.55 }); }

    const words = hero.querySelectorAll('.hero-title .word');
    const typedEl  = document.getElementById('heroTypedText');
    const cursorEl = document.getElementById('heroCursor');

    if (words.length) {
      gsap.set(words, { opacity: 0, y: 30 });
      tl.to(words, { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: 'power2.out' }, badge ? '-=0.25' : 0);
    } else {
      const h1 = hero.querySelector('h1');
      if (h1) { gsap.set(h1, { opacity: 0, y: 24 }); tl.to(h1, { opacity: 1, y: 0, duration: 0.7 }, badge ? '-=0.3' : 0); }
    }

    if (typedEl) {
      tl.to(typedEl, { duration: 1.6, text: { value: 'AI-Powered Content', delimiter: '' }, ease: 'none' }, '+=0.05');
      if (cursorEl) tl.to(cursorEl, { opacity: 0, duration: 0.3, delay: 0.6, onComplete: () => { cursorEl.style.display = 'none'; } });
    }

    const sub = hero.querySelector('.hero-sub, .hero-subtitle');
    if (sub) { gsap.set(sub, { opacity: 0, y: 16 }); tl.to(sub, { opacity: 1, y: 0, duration: 0.55 }, '-=0.3'); }

    const ctaRow = hero.querySelector('.hero-cta-row');
    if (ctaRow) { gsap.set(ctaRow, { opacity: 0, y: 14 }); tl.to(ctaRow, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3'); }

    const trust = hero.querySelector('.hero-trust');
    if (trust) { gsap.set(trust, { opacity: 0 }); tl.to(trust, { opacity: 1, duration: 0.4 }, '-=0.2'); }

    const statCards = hero.querySelectorAll('.stat-card');
    if (statCards.length) {
      gsap.set(statCards, { opacity: 0, scale: 0.85, y: 20 });
      tl.to(statCards, { opacity: 1, scale: 1, y: 0, stagger: 0.12, duration: 0.6, ease: 'back.out(1.5)' }, '-=0.3');
    }

    const chevron = hero.querySelector('.scroll-chevron, .scroll-indicator');
    if (chevron) gsap.to(chevron, { y: 8, yoyo: true, repeat: -1, duration: 0.75, ease: 'sine.inOut' });

    // 3D parallax disabled — caused weird cursor behaviour
  }

  // ─── 10. SECTION HEADING REVEAL (in + out) ────────────────────────────────────
  function initHeadingReveal() {
    document.querySelectorAll('section h2').forEach(h => {
      if (h.closest('.hero') || h.closest('.stagger-grid') || h.classList.contains('reveal-up') || h.dataset.clipDone) return;
      gsap.fromTo(h,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', scrollTrigger: ST(h) }
      );
    });
  }

  // ─── 11. PROCESS SECTION ──────────────────────────────────────────────────────
  function initProcessScroll() {
    const panels = document.querySelectorAll('.sticky-panel');
    const progressBar = document.getElementById('stickyProgressBar');
    if (!panels.length) return;

    gsap.fromTo(panels,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, stagger: 0.18, duration: 0.65, ease: 'power3.out',
        scrollTrigger: ST('#processSection', { start: 'top 80%' }) }
    );

    panels.forEach((panel, i) => {
      ScrollTrigger.create({
        trigger: panel,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter:     () => { panels.forEach(p => p.classList.remove('is-active')); panel.classList.add('is-active'); if (progressBar) progressBar.style.width = ((i + 1) / panels.length * 100) + '%'; },
        onEnterBack: () => { panels.forEach(p => p.classList.remove('is-active')); panel.classList.add('is-active'); if (progressBar) progressBar.style.width = ((i + 1) / panels.length * 100) + '%'; },
      });
    });
  }

  // ─── 12. GALLERY FILTER ───────────────────────────────────────────────────────
  function initGalleryFilter() {
    const tabs  = document.querySelectorAll('.filter-tab');
    const items = document.querySelectorAll('.gallery-item');
    if (!tabs.length || !items.length) return;
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter') || 'all';
        items.forEach(item => {
          const show = filter === 'all' || (item.getAttribute('data-category') || '') === filter;
          gsap.to(item, { opacity: show ? 1 : 0, scale: show ? 1 : 0.9, duration: 0.3 });
          item.style.pointerEvents = show ? 'auto' : 'none';
        });
      });
    });
  }

  // ─── 13. FAQ ACCORDION ────────────────────────────────────────────────────────
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const q = item.querySelector('.faq-question');
      const a = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-icon');
      if (!q || !a) return;
      gsap.set(a, { maxHeight: 0, overflow: 'hidden' });
      let open = false;
      q.addEventListener('click', () => {
        document.querySelectorAll('.faq-item.open').forEach(other => {
          if (other === item) return;
          gsap.to(other.querySelector('.faq-answer'), { maxHeight: 0, duration: 0.3 });
          const oi = other.querySelector('.faq-icon');
          if (oi) gsap.to(oi, { rotation: 0, duration: 0.25 });
          other.classList.remove('open');
        });
        open = !open;
        item.classList.toggle('open', open);
        gsap.to(a, { maxHeight: open ? a.scrollHeight + 40 : 0, duration: 0.38, ease: 'power2.inOut' });
        if (icon) gsap.to(icon, { rotation: open ? 45 : 0, duration: 0.3 });
      });
    });
  }

  // ─── 14. TESTIMONIALS (in + out) ──────────────────────────────────────────────
  function initTestimonials() {
    const cards = document.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    gsap.fromTo(cards,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.65, ease: 'power3.out',
        scrollTrigger: ST(cards[0].parentElement) }
    );
  }

  // ─── 15. SERVICE CARD HOVER ───────────────────────────────────────────────────
  function initServiceCards() {
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -6, duration: 0.3, ease: 'power2.out' });
        const icon = card.querySelector('.service-icon-box');
        if (icon) gsap.to(icon, { rotate: 6, scale: 1.08, duration: 0.3 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.4, ease: 'power3.out' });
        const icon = card.querySelector('.service-icon-box');
        if (icon) gsap.to(icon, { rotate: 0, scale: 1, duration: 0.4 });
      });
    });
  }

  // ─── 16. SECTION LABELS (in + out) ────────────────────────────────────────────
  function initSectionLabels() {
    document.querySelectorAll('.section-label').forEach(el => {
      if (el.closest('.hero') || el.closest('.cta-banner')) return;
      gsap.fromTo(el,
        { opacity: 0, scale: 0.7, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(2)',
          scrollTrigger: ST(el, { start: 'top 90%' }) }
      );
    });
  }

  // ─── 17. SECTION SUBTITLES (in + out) ─────────────────────────────────────────
  function initSectionSubtitles() {
    document.querySelectorAll('.section-sub').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out',
          scrollTrigger: ST(el) }
      );
    });
  }

  // ─── 18. STATS PILLS (in + out) ───────────────────────────────────────────────
  function initStatsPills() {
    const pills = document.querySelectorAll('.stat-pill');
    if (!pills.length) return;
    gsap.fromTo(pills,
      { opacity: 0, scale: 0.6, y: 30 },
      { opacity: 1, scale: 1, y: 0, stagger: 0.12, duration: 0.65, ease: 'back.out(1.8)',
        scrollTrigger: ST(pills[0].parentElement, { start: 'top 85%' }) }
    );
  }

  // ─── 19. CTA BANNER (in + out) ────────────────────────────────────────────────
  function initCTABanner() {
    const banner = document.querySelector('.cta-banner');
    if (!banner) return;
    const els = [
      banner.querySelector('.section-label'),
      banner.querySelector('h2'),
      banner.querySelector('p:not(.disclaimer)'),
      banner.querySelector('.btn-primary'),
      banner.querySelector('p.disclaimer, p + p'),
    ].filter(Boolean);
    gsap.fromTo(els,
      { opacity: 0, y: 36, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.14, duration: 0.65, ease: 'power3.out',
        scrollTrigger: ST(banner, { start: 'top 72%' }) }
    );
  }

  // ─── 20. FOOTER REVEAL (in + out) ─────────────────────────────────────────────
  function initFooterReveal() {
    const footer = document.querySelector('footer, .site-footer');
    if (!footer) return;
    const grid = footer.querySelector('.footer-grid');
    if (grid) {
      gsap.fromTo(Array.from(grid.children),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.65, ease: 'power3.out',
          scrollTrigger: ST(grid, { start: 'top 90%' }) }
      );
    }
    gsap.fromTo(footer.querySelectorAll('.footer-social-icon'),
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, stagger: 0.07, duration: 0.45, ease: 'back.out(2)',
        scrollTrigger: ST(footer, { start: 'top 88%' }) }
    );
  }

  // ─── 21. TESTIMONIAL STARS (in + out) ─────────────────────────────────────────
  function initTestimonialStars() {
    document.querySelectorAll('.testimonial-stars').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, scale: 0.4, rotation: -15 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2)',
          scrollTrigger: ST(el, { start: 'top 88%' }) }
      );
    });
  }

  // ─── 22. ICON BOXES (in + out) ────────────────────────────────────────────────
  function initIconBoxes() {
    document.querySelectorAll('.service-icon-box').forEach(icon => {
      gsap.fromTo(icon,
        { opacity: 0, scale: 0.3, rotation: -20 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2)',
          scrollTrigger: ST(icon.closest('.service-card') || icon, { start: 'top 88%' }) }
      );
    });
  }

  // ─── 23. QUOTE MARKS (in + out) ───────────────────────────────────────────────
  function initQuoteMarks() {
    document.querySelectorAll('.testimonial-quote').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, scale: 2.5, rotation: 25 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: ST(el, { start: 'top 88%' }) }
      );
    });
  }

  // ─── 24. BENTO CARD INTERNALS + HOVER ────────────────────────────────────────
  function initBentoCards() {
    document.querySelectorAll('.feature-bento-card').forEach((card, i) => {
      const icon  = card.querySelector('.feature-bento-icon');
      const label = card.querySelector('.feature-bento-label');
      const title = card.querySelector('.feature-bento-title');
      const desc  = card.querySelector('.feature-bento-desc');
      const stat  = card.querySelector('.feature-bento-stat');
      const statL = card.querySelector('.feature-bento-stat-label');
      const d  = i * 0.08;
      const st = ST(card, { start: 'top 86%' });

      if (icon)  gsap.fromTo(icon,  { opacity: 0, scale: 0.4, rotate: -22 }, { opacity: 1, scale: 1, rotate: 0,  duration: 0.55, ease: 'back.out(2.5)', delay: d,        scrollTrigger: st });
      if (label) gsap.fromTo(label, { opacity: 0, y: 14 },                   { opacity: 1, y: 0,                 duration: 0.45, ease: 'power2.out',    delay: d + 0.10, scrollTrigger: st });
      if (title) gsap.fromTo(title, { opacity: 0, y: 22 },                   { opacity: 1, y: 0,                 duration: 0.55, ease: 'power3.out',    delay: d + 0.18, scrollTrigger: st });
      if (desc)  gsap.fromTo(desc,  { opacity: 0, y: 16 },                   { opacity: 1, y: 0,                 duration: 0.48, ease: 'power2.out',    delay: d + 0.28, scrollTrigger: st });
      if (stat)  gsap.fromTo(stat,  { opacity: 0, scale: 0.4, y: 12 },       { opacity: 1, scale: 1, y: 0,       duration: 0.65, ease: 'back.out(2)',   delay: d + 0.32, scrollTrigger: st });
      if (statL) gsap.fromTo(statL, { opacity: 0 },                          { opacity: 1,                       duration: 0.4,                         delay: d + 0.48, scrollTrigger: st });

      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -8, scale: 1.015, duration: 0.32, ease: 'power2.out' });
        if (icon) gsap.to(icon.firstElementChild || icon, { rotate: 10, scale: 1.15, duration: 0.35, ease: 'back.out(1.8)' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, scale: 1, duration: 0.5, ease: 'power3.out' });
        if (icon) gsap.to(icon.firstElementChild || icon, { rotate: 0, scale: 1, duration: 0.45, ease: 'power2.out' });
      });
    });
  }

  // ─── 25. SECTION DIVIDERS (in + out) ──────────────────────────────────────────
  function initDividers() {
    document.querySelectorAll('.section-divider, hr:not(.hero hr)').forEach(el => {
      gsap.fromTo(el,
        { scaleX: 0, transformOrigin: 'left center', opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 1.0, ease: 'power3.out',
          scrollTrigger: ST(el, { start: 'top 94%', end: 'top 5%' }) }
      );
    });
  }

  // ─── 26. CLIP-PATH REVEAL for section headings ────────────────────────────────
  function initClipReveal() {
    document.querySelectorAll('.section-heading').forEach(h => {
      if (h.closest('.hero') || h.dataset.clipDone) return;
      h.dataset.clipDone = '1';
      gsap.fromTo(h,
        { clipPath: 'inset(0 0 110% 0)', y: 28, opacity: 0 },
        { clipPath: 'inset(0 0 0% 0)',   y: 0,  opacity: 1,
          duration: 0.82, ease: 'power4.out',
          scrollTrigger: ST(h, { start: 'top 88%' }) }
      );
    });
  }

  // ─── 27. PARALLAX ─────────────────────────────────────────────────────────────
  function initParallax() {
    if (window.innerWidth <= 768) return;
    document.querySelectorAll('.service-card-img img').forEach(img => {
      gsap.to(img, {
        yPercent: -12, ease: 'none',
        scrollTrigger: { trigger: img.closest('.service-card'), scrub: 1.2 }
      });
    });
    document.querySelectorAll('.section-glow').forEach(glow => {
      gsap.to(glow, {
        y: -60, ease: 'none',
        scrollTrigger: { trigger: glow.closest('section'), scrub: 1.8 }
      });
    });
  }

  // ─── 28. MOUSE SPOTLIGHT on glass cards ───────────────────────────────────────
  function initCardSpotlight() {
    document.querySelectorAll('.testimonial-card, .feature-bento-card, .stat-pill').forEach(card => {
      card.style.setProperty('--sx', '50%');
      card.style.setProperty('--sy', '50%');
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--sx', ((e.clientX - r.left) / r.width  * 100) + '%');
        card.style.setProperty('--sy', ((e.clientY - r.top)  / r.height * 100) + '%');
      });
      card.classList.add('spotlight-card');
    });
  }

  // ─── 29. CATCH-ALL — elements not otherwise animated (in + out) ───────────────
  function initAutoReveal() {
    const extra = [
      '.testimonial-author',
      '.service-card-body h3',
      '.service-card-body p',
      '.service-link',
      '.footer-bottom p',
    ];
    document.querySelectorAll(extra.join(',')).forEach(el => {
      if (el.closest('.hero') || el.closest('#servicesTrack') || el.dataset.gsap) return;
      el.dataset.gsap = '1';
      gsap.fromTo(el,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.52, ease: 'power2.out',
          scrollTrigger: ST(el, { start: 'top 93%', end: 'top 8%' }) }
      );
    });
  }

  // ─── 30. NAV LINK HOVER underline ─────────────────────────────────────────────
  function initNavHover() {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (!link.querySelector('.nav-underline')) {
        const span = document.createElement('span');
        span.className = 'nav-underline';
        span.style.cssText = 'position:absolute;bottom:-2px;left:0;width:0;height:2px;background:var(--teal-light);border-radius:2px;';
        link.style.position = 'relative';
        link.appendChild(span);
        link.addEventListener('mouseenter', () => gsap.to(span, { width: '100%', duration: 0.28, ease: 'power2.out' }));
        link.addEventListener('mouseleave', () => gsap.to(span, { width: '0%',   duration: 0.22, ease: 'power2.in'  }));
      }
    });
  }

  function initDropdown() {
    const wrapper = document.querySelector('.nav-dropdown-wrapper');
    if (!wrapper) return;
    const trigger = wrapper.querySelector('.nav-dropdown-trigger');
    const dropdown = wrapper.querySelector('.services-dropdown');
    if (!trigger || !dropdown) return;

    let closeTimer = null;

    const open = () => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      wrapper.classList.add('is-open');
    };
    const scheduledClose = () => {
      closeTimer = setTimeout(() => {
        wrapper.classList.remove('is-open');
        closeTimer = null;
      }, 200);
    };
    const toggle = (e) => { e.preventDefault(); wrapper.classList.toggle('is-open'); };

    // Desktop: hover with grace period so mouse can cross the gap
    wrapper.addEventListener('mouseenter', open);
    wrapper.addEventListener('mouseleave', scheduledClose);
    dropdown.addEventListener('mouseenter', open);
    dropdown.addEventListener('mouseleave', scheduledClose);

    // Touch / click: toggle on trigger click
    trigger.addEventListener('click', toggle);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) { clearTimeout(closeTimer); wrapper.classList.remove('is-open'); }
    });
  }

  // ─── 31. TESTIMONIAL PARALLAX depth ───────────────────────────────────────────
  function initTestimonialParallax() {
    if (window.innerWidth <= 768) return;
    document.querySelectorAll('.testimonial-card').forEach((card, i) => {
      const dir = i === 1 ? -18 : 18;
      gsap.to(card, {
        y: dir, ease: 'none',
        scrollTrigger: {
          trigger: card.closest('section'),
          start: 'top bottom', end: 'bottom top',
          scrub: 1.5,
        }
      });
    });
  }

  // ─── MOTION BACKGROUND (inject animated blobs on non-homepage pages) ────────
  function initMotionBackground() {
    if (document.querySelector('.bg-blobs, .motion-bg')) return; // already present
    var div = document.createElement('div');
    div.className = 'motion-bg';
    div.innerHTML = '<div class="motion-bg-blob motion-bg-blob-1"></div>' +
                    '<div class="motion-bg-blob motion-bg-blob-2"></div>' +
                    '<div class="motion-bg-blob motion-bg-blob-3"></div>';
    document.body.insertBefore(div, document.body.firstChild);
  }

  // ─── HERO STAT COUNT-UP (trigger numeric hero stats on page load) ─────────
  function initHeroCountUp() {
    // Count-up on hero stats that have data-count attributes
    document.querySelectorAll('.service-hero [data-count], .page-hero [data-count]').forEach(el => {
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const suffix = el.getAttribute('data-count-suffix') || '';
      const proxy  = { val: 0 };
      setTimeout(function() {
        gsap.to(proxy, {
          val: target, duration: 2, ease: 'power2.out',
          delay: 0.8,
          onUpdate() { el.textContent = (target >= 100 ? Math.round(proxy.val) : proxy.val.toFixed(target < 10 ? 1 : 0)) + suffix; },
          onComplete() { el.textContent = target + suffix; },
        });
      }, 100);
    });
  }

  // ─── BOOT ─────────────────────────────────────────────────────────────────────
  function init() {
    initMotionBackground();
    initLenis();
    initScrollProgress();
    initCursor();
    initNavigation();
    initHeroCountUp();
    initNavHover();
    initDropdown();
    initHero();
    initScrollReveal();
    initCountUp();
    initMagneticButtons();
    initCardTilt();
    initClipReveal();
    initHeadingReveal();
    initProcessScroll();
    initGalleryFilter();
    initFAQ();
    initTestimonials();
    initTestimonialParallax();
    initServiceCards();
    initSectionLabels();
    initSectionSubtitles();
    initStatsPills();
    initCTABanner();
    initFooterReveal();
    initTestimonialStars();
    initIconBoxes();
    initQuoteMarks();
    initBentoCards();
    initDividers();
    initParallax();
    initCardSpotlight();
    initAutoReveal();
    setTimeout(() => ScrollTrigger.refresh(), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
