/* ==========================================================================
   effects.js — scroll-driven 3D motion system
   Zero dependencies. Pure vanilla JS + CSS transforms.
   All motion respects prefers-reduced-motion.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Scroll progress bar ─────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-bar');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      bar.style.transform = 'scaleX(' + Math.min(pct, 1) + ')';
    }, { passive: true });
  }

  /* ── 2. Hero mouse parallax (3D tilt on mosaic panels) ─────────────── */
  function initHeroParallax() {
    const mosaic = document.querySelector('.hero-mosaic');
    const cells  = document.querySelectorAll('.mosaic-cell');
    if (!mosaic || reduced) return;

    const MAX = 8; // max tilt degrees

    document.addEventListener('mousemove', function (e) {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx; // -1 to 1
      const dy = (e.clientY - cy) / cy;

      cells.forEach(function (cell, i) {
        const depth  = [1, 0.6, 0.8][i % 3]; // each panel at different depth
        const rx     =  dy * MAX * depth;
        const ry     = -dx * MAX * depth;
        cell.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
    }, { passive: true });

    // Reset on mouse leave
    document.addEventListener('mouseleave', function () {
      cells.forEach(function (cell) {
        cell.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ── 3. Intersection observer — 3D scroll reveals ───────────────────── */
  function initScrollReveals() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(function () { el.classList.add('revealed'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ── 4. Staggered children ──────────────────────────────────────────── */
  function initStagger() {
    if (reduced) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const children = entry.target.querySelectorAll('[data-stagger]');
        children.forEach(function (child, i) {
          setTimeout(function () {
            child.classList.add('revealed');
          }, i * 90);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('[data-stagger-parent]').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ── 5. Count-up animation (stats) ─────────────────────────────────── */
  function countUp(el, target, duration, suffix) {
    if (reduced) { el.textContent = target + suffix; return; }
    const start = performance.now();
    function step(now) {
      const pct = Math.min((now - start) / duration, 1);
      // ease out cubic
      const ease = 1 - Math.pow(1 - pct, 3);
      el.textContent = Math.round(ease * target) + suffix;
      if (pct < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur    = parseInt(el.dataset.dur || 1400);
        countUp(el, target, dur, suffix);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ── 6. Scroll parallax on about photo ─────────────────────────────── */
  function initPhotoParallax() {
    if (reduced) return;
    const targets = document.querySelectorAll('[data-parallax]');
    if (!targets.length) return;
    window.addEventListener('scroll', function () {
      targets.forEach(function (el) {
        const rect  = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax || 0.3);
        const ofs   = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        el.style.transform = 'translateY(' + ofs + 'px) scale(1.06)';
      });
    }, { passive: true });
  }

  /* ── 7. Card 3D hover ───────────────────────────────────────────────── */
  function initCardHover() {
    if (reduced) return;
    document.querySelectorAll('[data-card3d]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const r   = card.getBoundingClientRect();
        const cx  = r.left + r.width  / 2;
        const cy  = r.top  + r.height / 2;
        const dx  = (e.clientX - cx) / (r.width  / 2);
        const dy  = (e.clientY - cy) / (r.height / 2);
        const max = parseFloat(card.dataset.card3d || 6);
        card.style.transform = (
          'perspective(800px) ' +
          'rotateX(' + (-dy * max) + 'deg) ' +
          'rotateY(' + ( dx * max) + 'deg) ' +
          'translateZ(10px)'
        );
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  /* ── 8. Hamburger ───────────────────────────────────────────────────── */
  function initHamburger() {
    var btn = document.getElementById('hbg');
    var nav = document.getElementById('mob-nav');
    if (!btn || !nav) return;
    function close() {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    function open() {
      nav.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      nav.classList.contains('open') ? close() : open();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ── 9. Smooth anchor scroll ────────────────────────────────────────── */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ── Init all ───────────────────────────────────────────────────────── */
  function init() {
    initScrollProgress();
    initHeroParallax();
    initScrollReveals();
    initStagger();
    initCounters();
    initPhotoParallax();
    initCardHover();
    initHamburger();
    initSmoothAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
