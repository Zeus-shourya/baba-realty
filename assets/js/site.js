/* ==========================================================================
   BABA — main site behaviour. Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.BABA || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- 1. WhatsApp links ------------------------------------------------ */
  function wireWhatsApp() {
    var href = CFG.waLink ? CFG.waLink(CFG.whatsappText) : '#';
    $$('[data-wa]').forEach(function (a) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    var label = $('#waLabel');
    if (label && CFG.whatsappName) label.textContent = 'Chat with ' + CFG.whatsappName;

    $$('#phoneLink, .js-phone').forEach(function (a) {
      if (CFG.phoneHref) a.href = 'tel:' + CFG.phoneHref;
      if (CFG.phoneDisplay) a.textContent = CFG.phoneDisplay;
    });
    $$('#mailLink, .js-mail').forEach(function (a) {
      if (CFG.email) { a.href = 'mailto:' + CFG.email; a.textContent = CFG.email; }
    });
  }

  /* ---- 2. Header state -------------------------------------------------- */
  function wireHeader() {
    var header = $('#header');
    if (!header) return;
    var hero = $('.hero');
    var heroH = hero ? hero.offsetHeight : 0;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-stuck', y > 40);
      if (hero) header.classList.toggle('header--over', y <= 40 && y <= heroH - 120);
    }
    /* coalesce to one class update per frame instead of per scroll event */
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      heroH = hero ? hero.offsetHeight : 0;
      update();
    }, { passive: true });
  }

  /* ---- 3. Mobile drawer ------------------------------------------------- */
  function wireDrawer() {
    var burger = $('#burger'), drawer = $('#drawer');
    if (!burger || !drawer) return;

    function close() {
      drawer.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');
    }
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---- 4. Scroll reveal -------------------------------------------------
     Content starts at opacity 0, so this must be failure-proof. Embedded
     webviews and preview panes can throttle or never deliver observer
     callbacks; if that were the only path, the page would stay blank.
     Three independent paths guarantee content appears:
       1. anything already on screen is shown synchronously, no callback
       2. the observer handles the normal case
       3. a throttled scroll sweep + a hard timeout catch everything else
     ---------------------------------------------------------------------- */
  function wireReveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;

    function show(el) { el.classList.add('is-in'); }

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(show);
      return;
    }

    var pending = els.slice();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    /* 1 — synchronous first pass: whatever is already visible never waits */
    pending.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show(el);
      else io.observe(el);
    });

    /* 3 — sweep anything the observer missed */
    var lastSweep = 0;
    function sweep() {
      var still = [];
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        if (el.classList.contains('is-in')) continue;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.15 && r.bottom > -120) show(el);
        else still.push(el);
      }
      pending = still;
      if (!pending.length) window.removeEventListener('scroll', onScroll);
    }
    function onScroll() {
      var now = Date.now();
      if (now - lastSweep < 150) return;
      lastSweep = now;
      sweep();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    window.addEventListener('load', function () { setTimeout(sweep, 300); });

    /* hard backstop — nothing stays invisible, whatever the environment does */
    setTimeout(function () {
      if (pending.length) { pending.forEach(show); pending = []; }
    }, 3000);
  }

  /* ---- 5. Active nav link ---------------------------------------------- */
  function wireSpy() {
    var links = $$('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) {
      var sec = document.getElementById(l.getAttribute('href').slice(1));
      if (sec) map[sec.id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        if (map[en.target.id]) map[en.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---- 6. Hero parallax ------------------------------------------------- */
  function wireParallax() {
    if (reduced) return;
    var layers = $$('[data-par]');
    if (!layers.length) return;
    var raf = null;
    function tick() {
      var y = window.scrollY || window.pageYOffset;
      layers.forEach(function (l) {
        var k = parseFloat(l.getAttribute('data-par')) || 0;
        l.style.transform = 'translate3d(0,' + (y * k).toFixed(2) + 'px,0)';
      });
      raf = null;
    }
    window.addEventListener('scroll', function () {
      if (raf === null && window.scrollY < window.innerHeight * 1.4) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---- 7. Ticker (duplicate content for a seamless loop) ---------------- */
  function wireTicker() {
    var t = $('#ticker');
    if (!t) return;
    t.innerHTML += t.innerHTML;
  }

  /* ---- 7b. Park decorative animations while they're off-screen ---------- */
  function wireIdleAnimations() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var targets = [$('.ticker'), $('.iband__seal')].filter(Boolean);
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-idle', !en.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    targets.forEach(function (t) { t.classList.add('is-idle'); io.observe(t); });
  }

  /* ---- 8. Gallery filter + lightbox ------------------------------------ */
  function wireGallery() {
    var filters = $$('.filter');
    var cards = $$('#grid .card');

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        cards.forEach(function (c) {
          c.classList.toggle('is-hidden', cat !== 'all' && c.getAttribute('data-cat') !== cat);
        });
      });
    });

    var box = $('#lightbox');
    if (!box) return;
    var img = $('#lightboxImg'), ttl = $('#lightboxTitle'), meta = $('#lightboxMeta');
    var last = null;

    function open(card) {
      last = card;
      img.src = card.getAttribute('data-img');
      img.alt = card.getAttribute('data-title') || '';
      ttl.textContent = card.getAttribute('data-title') || '';
      meta.textContent = card.getAttribute('data-meta') || '';
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      $('#lightboxClose').focus();
    }
    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (last) last.focus();
    }

    cards.forEach(function (c) { c.addEventListener('click', function () { open(c); }); });
    $('#lightboxClose').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
    });
  }

  /* ---- 9. Count-up numbers --------------------------------------------- */
  function wireCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduced) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
      var dur = 1500, t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---- 10. Enquiry form ------------------------------------------------- */
  function wireForm() {
    var form = $('#enquiryForm');
    if (!form) return;
    var ok = $('#enquiryOk');

    function setErr(field, bad) { field.classList.toggle('is-invalid', bad); }

    function validate() {
      var valid = true;
      $$('.field', form).forEach(function (field) {
        var input = $('input, select, textarea', field);
        if (!input || !input.required) return;
        var v = (input.value || '').trim();
        var bad = !v;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && input.type === 'tel')   bad = v.replace(/\D/g, '').length < 7;
        setErr(field, bad);
        if (bad) valid = false;
      });
      return valid;
    }

    $$('input, select, textarea', form).forEach(function (i) {
      i.addEventListener('input',  function () { setErr(i.closest('.field'), false); });
      i.addEventListener('change', function () { setErr(i.closest('.field'), false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var first = $('.field.is-invalid input, .field.is-invalid select', form);
        if (first) first.focus();
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      if (CFG.formEndpoint) {
        fetch(CFG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error('bad status');
          done('Thank you — we have your details. A member of our team will call you back shortly.');
          form.reset();
        }).catch(function () {
          done('We could not submit the form just now. Opening WhatsApp instead…');
          setTimeout(function () { window.open(CFG.waLink(compose(data)), '_blank', 'noopener'); }, 900);
        });
      } else {
        /* No backend configured — hand off to WhatsApp with everything filled in. */
        done('Opening WhatsApp with your enquiry…');
        window.open(CFG.waLink(compose(data)), '_blank', 'noopener');
        form.reset();
      }
    });

    function compose(d) {
      return 'New enquiry — BABA Real Estate & Developers\n\n'
        + 'Name: '    + [d.firstName, d.lastName].filter(Boolean).join(' ') + '\n'
        + 'Phone: '   + (d.phone || '-') + '\n'
        + 'Email: '   + (d.email || '-') + '\n'
        + 'Type: '    + (d.enquiryType || '-') + '\n'
        + 'Message: ' + (d.message || '-');
    }

    function done(msg) {
      if (!ok) return;
      ok.textContent = msg;
      ok.classList.add('is-shown');
    }
  }

  /* ---- 11. Misc --------------------------------------------------------- */
  function wireMisc() {
    var yr = $('#yr');
    if (yr) yr.textContent = new Date().getFullYear();

    /* offset anchor scrolling for the fixed header */
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      a.addEventListener('click', function (e) {
        var t = document.getElementById(id.slice(1));
        if (!t) return;
        e.preventDefault();
        var h = document.querySelector('.header');
        var off = (h ? h.offsetHeight : 0) - 1;
        var y = t.getBoundingClientRect().top + window.scrollY - off;
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ---- boot ------------------------------------------------------------- */
  function init() {
    wireWhatsApp();
    wireHeader();
    wireDrawer();
    wireReveal();
    wireSpy();
    wireParallax();
    wireTicker();
    wireIdleAnimations();
    wireGallery();
    wireCounters();
    wireForm();
    wireMisc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
