// three-hero.js — Optimised Three.js particle canvas for hero section
// Loaded only on index.html. Performance-first version.

(function () {
  'use strict';

  // Mobile: skip WebGL entirely, use CSS gradient fallback
  if (window.innerWidth < 768) return;
  if (typeof THREE === 'undefined') return;

  const PARTICLE_COUNT  = 600;   // was 3000 — massive reduction
  const SPHERE_RADIUS   = 3.2;
  const MAX_CONNECTIONS = 80;    // was 200
  const CONNECTION_DIST = 1.0;
  const MOUSE_RADIUS    = 1.2;
  const MOUSE_STRENGTH  = 0.18;
  const LERP_SPEED      = 0.05;
  const ROT_Y           = 0.0008;
  const ROT_X           = 0.0003;

  const wrapper = document.querySelector('.hero-canvas');
  if (!wrapper) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap at 1.5x
  renderer.setSize(wrapper.offsetWidth || window.innerWidth, wrapper.offsetHeight || window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  wrapper.appendChild(renderer.domElement);

  Object.assign(renderer.domElement.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%', pointerEvents: 'none',
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    (wrapper.offsetWidth || window.innerWidth) / (wrapper.offsetHeight || window.innerHeight),
    0.1, 100
  );
  camera.position.z = 5;

  // Particle geometry
  const positions     = new Float32Array(PARTICLE_COUNT * 3);
  const colors        = new Float32Array(PARTICLE_COUNT * 3);
  const origPos       = new Float32Array(PARTICLE_COUNT * 3);

  const palette = [
    new THREE.Color('#0ABFBC'),
    new THREE.Color('#00E5E5'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#47d4d1'),
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = SPHERE_RADIUS * Math.cbrt(Math.random());

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i*3] = origPos[i*3] = x;
    positions[i*3+1] = origPos[i*3+1] = y;
    positions[i*3+2] = origPos[i*3+2] = z;

    const c = palette[i % palette.length];
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  // Build a soft circular sprite so particles render as round dots, not squares
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 64;
  const sCtx = spriteCanvas.getContext('2d');
  const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0,   'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1,   'rgba(255,255,255,0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 64, 64);
  const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

  const mat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
    map: spriteTexture,
    alphaTest: 0.02,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Lines removed — particles only

  // Mouse
  const mouse3D = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();
  const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  function updateMouseFrom(clientX, clientY) {
    mouseNDC.x =  (clientX / window.innerWidth)  * 2 - 1;
    mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(mousePlane, mouse3D);
  }

  window.addEventListener('mousemove', e => updateMouseFrom(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) updateMouseFrom(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ── 2D ripple canvas overlay ────────────────────────── */
  const rCanvas = document.createElement('canvas');
  rCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  wrapper.appendChild(rCanvas);
  const rCtx = rCanvas.getContext('2d');
  let rW = 0, rH = 0;
  function resizeRipple() {
    rW = rCanvas.width  = wrapper.offsetWidth  || window.innerWidth;
    rH = rCanvas.height = wrapper.offsetHeight || window.innerHeight;
  }
  resizeRipple();

  const ripples2D   = [];   // visual ring animations
  const clickForces = [];   // 3D particle wave forces

  function spawnRipple(clientX, clientY) {
    // 2D rings in canvas pixels
    const rect = wrapper.getBoundingClientRect();
    const scX = rW / rect.width;
    const scY = rH / rect.height;
    ripples2D.push({ x: (clientX - rect.left) * scX, y: (clientY - rect.top) * scY, r: 0, alpha: 0.9 });

    // 3D particle force
    const ndcX = (clientX / window.innerWidth)  * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const cp = new THREE.Vector3();
    raycaster.ray.intersectPlane(mousePlane, cp);
    clickForces.push({ pos: cp, born: 0 });
  }

  wrapper.addEventListener('click',      e => spawnRipple(e.clientX, e.clientY), { passive: true });
  wrapper.addEventListener('touchstart', e => {
    if (e.changedTouches[0]) spawnRipple(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });

  // Scroll disperse
  let scrollProgress = 0;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: wrapper,
      start: 'top top',
      end: 'bottom top',
      onUpdate: self => { scrollProgress = self.progress; },
    });
  } else {
    window.addEventListener('scroll', () => {
      const r = wrapper.getBoundingClientRect();
      scrollProgress = Math.max(0, Math.min(1, -r.top / r.height));
    }, { passive: true });
  }

  // Animation
  let paused = false;
  let animId = null;
  let lastTime = 0;
  const FRAME_MS = 1000 / 60;

  function animate(ts) {
    animId = requestAnimationFrame(animate);
    if (paused) return;

    const delta = ts - lastTime;
    if (delta < FRAME_MS) return;
    lastTime = ts;

    particles.rotation.y += ROT_Y;
    particles.rotation.x += ROT_X;

    const pos = geo.attributes.position.array;
    const spread = 1 + scrollProgress * 2.5;

    // Advance click force ages
    clickForces.forEach(cf => { cf.born += delta; });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const ox = origPos[i3] * spread;
      const oy = origPos[i3+1] * spread;
      const oz = origPos[i3+2] * spread;

      // Mouse repulsion
      const dx = mouse3D.x - pos[i3];
      const dy = mouse3D.y - pos[i3+1];
      const d = Math.sqrt(dx*dx + dy*dy);
      let px = 0, py = 0;
      if (d < MOUSE_RADIUS && d > 0.001) {
        const f = (1 - d / MOUSE_RADIUS) * MOUSE_STRENGTH;
        px = -(dx / d) * f;
        py = -(dy / d) * f;
      }

      // Click/touch wave forces — expanding ring pushes particles outward
      for (let ci = clickForces.length - 1; ci >= 0; ci--) {
        const cf = clickForces[ci];
        const age = cf.born;
        if (age > 1200) { clickForces.splice(ci, 1); continue; }
        const waveRadius = (age / 1200) * 3.5;           // expands 0 → 3.5 units
        const decay      = 1 - age / 1200;               // fades to 0
        const cdx = pos[i3]   - cf.pos.x;
        const cdy = pos[i3+1] - cf.pos.y;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 0.001;
        const waveDiff = Math.abs(cdist - waveRadius);
        if (waveDiff < 0.55) {
          const force = ((0.55 - waveDiff) / 0.55) * decay * 0.9;
          px += (cdx / cdist) * force;
          py += (cdy / cdist) * force;
        }
      }

      pos[i3]   += (ox + px - pos[i3])   * LERP_SPEED;
      pos[i3+1] += (oy + py - pos[i3+1]) * LERP_SPEED;
      pos[i3+2] += (oz - pos[i3+2])      * LERP_SPEED;
    }

    geo.attributes.position.needsUpdate = true;

    // Global opacity pulse (cheap — single value)
    mat.opacity = 0.65 + 0.2 * Math.sin(ts * 0.001);

    renderer.render(scene, camera);

    /* ── 2D ripple rings ──────────────────────────────── */
    rCtx.clearRect(0, 0, rW, rH);
    for (let ri = ripples2D.length - 1; ri >= 0; ri--) {
      const rip = ripples2D[ri];
      rip.r     += 5;
      rip.alpha *= 0.958;

      for (let k = 0; k < 4; k++) {
        const kr = rip.r - k * 26;
        if (kr <= 0) continue;
        const ka = rip.alpha * Math.pow(0.65, k);
        if (ka < 0.008) continue;

        // Outer stroke ring
        rCtx.beginPath();
        rCtx.arc(rip.x, rip.y, kr, 0, Math.PI * 2);
        rCtx.strokeStyle = `rgba(10,191,188,${ka * 0.6})`;
        rCtx.lineWidth   = 2.2 - k * 0.45;
        rCtx.stroke();

        // Soft glow fill between rings
        if (k === 0 && kr > 10) {
          const g = rCtx.createRadialGradient(rip.x, rip.y, kr * 0.72, rip.x, rip.y, kr);
          g.addColorStop(0, 'rgba(10,191,188,0)');
          g.addColorStop(1, `rgba(10,191,188,${ka * 0.09})`);
          rCtx.beginPath();
          rCtx.arc(rip.x, rip.y, kr, 0, Math.PI * 2);
          rCtx.fillStyle = g;
          rCtx.fill();
        }
      }

      if (rip.alpha < 0.01) ripples2D.splice(ri, 1);
    }
  }

  // Pause when off-screen
  const observer = new IntersectionObserver(entries => {
    paused = !entries[0].isIntersecting;
  }, { threshold: 0 });
  observer.observe(wrapper);

  // Resize
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) { paused = true; return; }
    const w = wrapper.offsetWidth || window.innerWidth;
    const h = wrapper.offsetHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    resizeRipple();
  });

  animate(0);
})();
