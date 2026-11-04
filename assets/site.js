/* The Quest Studio — small progressive enhancements. The page works without it. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // Footer year.
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Header gets a background once the page scrolls.
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Give every tile its thickness: stacked slices behind the face.
  document.querySelectorAll('.tile-body').forEach((body) => {
    const depth = Math.min(24, Math.max(1, Number(body.dataset.depth) || 14));
    const slices = document.createDocumentFragment();
    for (let i = depth; i >= 1; i -= 1) {
      const slice = document.createElement('span');
      slice.className = 'slice';
      slice.style.setProperty('--i', String(i));
      slices.appendChild(slice);
    }
    body.prepend(slices);
  });

  // Reveal sections as they scroll into view.
  const revealables = document.querySelectorAll('[data-reveal]');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach((el) => observer.observe(el));
  }

  /**
   * Tilts `scene` towards the pointer while it moves over `area`, easing back
   * to the resting angle when it leaves. Animation frames run only while the
   * angle is still changing, so an idle page costs nothing.
   */
  function addTilt(area, scene, { restX, restY, rangeX, rangeY }) {
    let targetX = restX;
    let targetY = restY;
    let x = restX;
    let y = restY;
    let glareX = 28;
    let glareY = 18;
    let frame = 0;

    const step = () => {
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;
      scene.style.setProperty('--rx', `${x.toFixed(2)}deg`);
      scene.style.setProperty('--ry', `${y.toFixed(2)}deg`);
      scene.style.setProperty('--gx', `${glareX.toFixed(1)}%`);
      scene.style.setProperty('--gy', `${glareY.toFixed(1)}%`);
      frame = Math.abs(targetX - x) > 0.02 || Math.abs(targetY - y) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(step); };

    area.addEventListener('pointermove', (event) => {
      const box = area.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
      const py = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
      targetY = restY + (px - 0.5) * 2 * rangeY;
      targetX = restX - (py - 0.5) * 2 * rangeX;
      glareX = 10 + px * 70;
      glareY = 5 + py * 50;
      start();
    });
    area.addEventListener('pointerleave', () => {
      targetX = restX;
      targetY = restY;
      glareX = 28;
      glareY = 18;
      start();
    });
  }

  if (finePointer.matches && !reduceMotion.matches) {
    const hero = document.querySelector('.hero');
    const heroScene = document.querySelector('.hero .scene');
    if (hero && heroScene) addTilt(hero, heroScene, { restX: 10, restY: -16, rangeX: 9, rangeY: 18 });

    document.querySelectorAll('.app').forEach((card) => {
      const scene = card.querySelector('.mini-scene');
      if (scene) addTilt(card, scene, { restX: 12, restY: -26, rangeX: 14, rangeY: 26 });
    });
  }

  // Copy the email address, with a spoken confirmation for screen readers.
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.querySelector('.copy-label');
    const status = button.closest('.contact-actions')?.querySelector('.copy-status');
    const original = label ? label.textContent : '';
    let timer = 0;

    button.addEventListener('click', async () => {
      let message = 'Copied to clipboard.';
      try {
        await navigator.clipboard.writeText(button.dataset.copy || '');
        if (label) label.textContent = 'Copied';
        button.classList.add('is-done');
      } catch {
        message = 'Could not copy. Select the address above instead.';
      }
      if (status) status.textContent = message;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = original;
        button.classList.remove('is-done');
        if (status) status.textContent = '';
      }, 2200);
    });
  });
})();
