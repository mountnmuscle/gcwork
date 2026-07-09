/* effects.js — Freedom Group Construction immersive motion engine
   Zero dependencies · prefers-reduced-motion respected throughout
   ================================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Film grain ────────────────────────────────────────────────── */
  (function () {
    var c = document.getElementById('grain');
    if (!c) return;
    var ctx = c.getContext('2d'), W, H, f = 0;
    function rs() { W = c.width = innerWidth; H = c.height = innerHeight; }
    rs(); addEventListener('resize', rs, { passive: true });
    if (reduced) return;
    (function tick() {
      f++;
      if (f % 3 === 0) {
        var img = ctx.createImageData(W, H), d = img.data;
        for (var i = 0; i < d.length; i += 4) {
          var v = Math.random() > .5 ? 255 : 0;
          d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      requestAnimationFrame(tick);
    })();
  })();

  /* ── 2. WebGL particle field ──────────────────────────────────────── */
  (function () {
    var c = document.getElementById('hero-canvas');
    if (!c || reduced) return;
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) { c.style.display = 'none'; return; }
    function rs() { c.width = c.offsetWidth; c.height = c.offsetHeight; gl.viewport(0, 0, c.width, c.height); }
    rs(); addEventListener('resize', rs, { passive: true });
    var VS = 'attribute vec2 a;attribute float s,al;uniform vec2 r;uniform float t;uniform vec2 m;varying float v;void main(){vec2 p=a;p.y=mod(p.y-t*.035,1.);vec2 d=m/r-p;float dt=length(d);p+=d*.01*smoothstep(.35,0.,dt);vec2 cl=(p*2.-1.)*vec2(1.,-1.);gl_Position=vec4(cl,0,1);gl_PointSize=s;v=al;}';
    var FS = 'precision mediump float;varying float v;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1,1,1,v*(1.-smoothstep(.3,.5,d))*.55);}';
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);
    var N = 160, pos = new Float32Array(N * 2), sz = new Float32Array(N), al = new Float32Array(N);
    for (var i = 0; i < N; i++) { pos[i*2] = Math.random(); pos[i*2+1] = Math.random(); sz[i] = Math.random() * 2.2 + .8; al[i] = Math.random() * .45 + .1; }
    function buf(data, name, n) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); var l = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0); }
    buf(pos, 'a', 2); buf(sz, 's', 1); buf(al, 'al', 1);
    var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');
    var mx = c.width / 2, my = c.height / 2;
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var t0 = performance.now();
    (function loop(now) {
      var t = (now - t0) * .001;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uR, c.width, c.height); gl.uniform1f(uT, t); gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.POINTS, 0, N); requestAnimationFrame(loop);
    })(t0);
  })();

  /* ── 3. Cinematic intro ───────────────────────────────────────────── */
  (function () {
    var intro = document.getElementById('intro');
    var line  = document.getElementById('intro-line');
    var logo  = document.getElementById('intro-logo');
    var skip  = document.getElementById('intro-skip');
    if (!intro) return;
    function done() {
      intro.style.transition = 'opacity .75s ease';
      intro.style.opacity = '0';
      intro.style.pointerEvents = 'none';
      setTimeout(function () {
        intro.style.display = 'none';
        document.body.classList.add('ready');
        countUp();
      }, 750);
    }
    if (skip) skip.addEventListener('click', done);
    if (reduced) { done(); return; }
    var t0 = performance.now(), H = innerHeight;
    (function scan(now) {
      var p = Math.min((now - t0) / 680, 1);
      var e = p < .5 ? 2*p*p : -1 + (4-2*p)*p;
      line.style.transform = 'translateY(' + (e * H) + 'px)';
      if (p < 1) requestAnimationFrame(scan);
      else {
        logo.style.transition = 'opacity .5s ease'; logo.style.opacity = '1';
        setTimeout(done, 1100);
      }
    })(t0);
  })();

  /* ── 4. Hero copy reveal (after intro) ───────────────────────────── */
  document.querySelectorAll('.h-hide').forEach(function (el) {
    if (document.body.classList.contains('ready')) { el.classList.add('h-show'); }
    else {
      var ob = new MutationObserver(function () {
        if (document.body.classList.contains('ready')) { el.classList.add('h-show'); ob.disconnect(); }
      });
      ob.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  });

  /* ── 5. Scroll progress bar ───────────────────────────────────────── */
  var bar = document.getElementById('scroll-bar');
  addEventListener('scroll', function () {
    if (!bar) return;
    bar.style.transform = 'scaleX(' + Math.min(scrollY / (document.documentElement.scrollHeight - innerHeight), 1) + ')';
  }, { passive: true });

  /* ── 6. Header scrolled state ─────────────────────────────────────── */
  var hdr = document.getElementById('site-header');
  addEventListener('scroll', function () {
    if (hdr) hdr.classList.toggle('scrolled', scrollY > 60);
  }, { passive: true });

  /* ── 7. Hero 5-layer mouse parallax ──────────────────────────────── */
  (function () {
    if (reduced) return;
    var bg  = document.getElementById('lyr-bg');
    var ph  = document.getElementById('lyr-photo');
    var cp  = document.getElementById('lyr-copy');
    var gl2 = document.getElementById('lyr-glow');
    var mx = 0, my = 0, cx = innerWidth/2, cy = innerHeight/2;
    var curX = 0, curY = 0;
    addEventListener('mousemove', function (e) { mx = (e.clientX-cx)/cx; my = (e.clientY-cy)/cy; }, { passive: true });
    addEventListener('resize', function () { cx = innerWidth/2; cy = innerHeight/2; }, { passive: true });
    (function tick() {
      curX += (mx - curX) * .055; curY += (my - curY) * .055;
      var sy = scrollY;
      var hero = document.getElementById('hero');
      if (hero && hero.getBoundingClientRect().bottom > 0) {
        if (bg) bg.style.transform = 'translateY(' + sy*.3 + 'px) rotateX(' + curY*-3 + 'deg) rotateY(' + curX*3 + 'deg) translateZ(-400px) scale(1.5)';
        if (ph) {
          var img = ph.querySelector('img');
          if (img) img.style.transform = 'translateX(' + curX*-10 + 'px) translateY(' + (curY*-5+sy*.12) + 'px) scale(1.07)';
          ph.style.transform = 'perspective(1200px) rotateY(' + curX*-2.5 + 'deg) rotateX(' + curY*1.2 + 'deg)';
        }
        if (cp) cp.style.transform = 'translate(' + curX*7 + 'px,' + (curY*3.5+sy*-.07) + 'px)';
        if (gl2) gl2.style.transform = 'translate(' + curX*18 + 'px,' + curY*12 + 'px)';
      }
      requestAnimationFrame(tick);
    })();
  })();

  /* ── 8. Depth scroll reveals ──────────────────────────────────────── */
  (function () {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('vis'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, d = parseInt(el.dataset.delay || 0);
        setTimeout(function () { el.classList.add('vis'); }, d);
        io.unobserve(el);
      });
    }, { threshold: .1, rootMargin: '0px 0px -48px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  })();

  /* ── 9. Scroll parallax on background images ──────────────────────── */
  (function () {
    if (reduced) return;
    var targets = document.querySelectorAll('[data-parallax]');
    addEventListener('scroll', function () {
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var spd = parseFloat(el.dataset.parallax || .2);
        el.style.transform = 'translateY(' + ((r.top + r.height/2 - innerHeight/2) * spd) + 'px) scale(1.07)';
      });
    }, { passive: true });
  })();

  /* ── 10. Count-up ─────────────────────────────────────────────────── */
  function countUp() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.dataset.count), suf = el.dataset.suffix || '', dur = parseInt(el.dataset.dur || 1200);
      if (reduced) { el.textContent = target + suf; return; }
      var t0 = performance.now();
      (function step(now) {
        var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(e * target) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ── 11. 3D card hover ────────────────────────────────────────────── */
  (function () {
    if (reduced) return;
    document.querySelectorAll('.process-panel,.review-card,.svc-card').forEach(function (card) {
      var max = card.classList.contains('process-panel') ? 8 : 5;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width/2)  / (r.width/2);
        var dy = (e.clientY - r.top  - r.height/2) / (r.height/2);
        card.style.transform = 'perspective(900px) rotateX('+(-dy*max)+'deg) rotateY('+(dx*max)+'deg) translateZ(10px) translateY(-3px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  })();

  /* ── 12. Magnetic cursor ──────────────────────────────────────────── */
  (function () {
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    var lbl  = document.getElementById('cursor-label');
    if (!dot || !ring) return;
    if (window.matchMedia('(hover:none)').matches) {
      dot.style.display = ring.style.display = 'none';
      document.body.style.cursor = 'auto'; return;
    }
    var mx = 0, my = 0, rx = 0, ry = 0;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      if (lbl) { lbl.style.left = mx + 'px'; lbl.style.top = my + 'px'; }
    }, { passive: true });
    (function lerp() {
      rx += (mx - rx) * .11; ry += (my - ry) * .11;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(lerp);
    })();
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        document.body.classList.add('cur-active');
        if (lbl) lbl.textContent = el.dataset.cursor;
      });
      el.addEventListener('mouseleave', function () {
        document.body.classList.remove('cur-active');
        if (lbl) lbl.textContent = '';
      });
    });
  })();

  /* ── 13. Hamburger ────────────────────────────────────────────────── */
  (function () {
    var btn = document.getElementById('hbg'), nav = document.getElementById('mob-nav');
    if (!btn || !nav) return;
    function close() { nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
    function open()  { nav.classList.add('open');    btn.setAttribute('aria-expanded','true');  document.body.style.overflow='hidden'; }
    btn.addEventListener('click', function (e) { e.stopPropagation(); nav.classList.contains('open') ? close() : open(); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ── 14. Smooth anchors ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

})();
