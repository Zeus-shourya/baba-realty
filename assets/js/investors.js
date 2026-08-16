/* ==========================================================================
   BABA — Investor Relations page behaviour.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.BABA || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- 1. WhatsApp + contact links -------------------------------------- */
  function wireLinks() {
    var href = CFG.waLink ? CFG.waLink(CFG.whatsappTextInvestor || CFG.whatsappText) : '#';
    $$('[data-wa-investor]').forEach(function (a) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('.js-investor-mail').forEach(function (a) {
      var m = CFG.investorEmail || CFG.email;
      if (m) { a.href = 'mailto:' + m; a.textContent = m; }
    });
    var yr = $('#yr');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---- 2. Nav state + scroll spy ---------------------------------------- */
  function wireNav() {
    var nav = $('#irnav');
    if (nav) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          nav.classList.toggle('is-stuck', (window.scrollY || 0) > 40);
        });
      }, { passive: true });
    }

    var links = $$('.irnav__link[href^="#"]');
    if (links.length && 'IntersectionObserver' in window) {
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
      }, { rootMargin: '-40% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    }

    /* offset anchors under the fixed sub-nav */
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      a.addEventListener('click', function (e) {
        var t = document.getElementById(id.slice(1));
        if (!t) return;
        e.preventDefault();
        var off = (nav ? nav.offsetHeight : 0) - 1;
        window.scrollTo({
          top: t.getBoundingClientRect().top + window.scrollY - off,
          behavior: reduced ? 'auto' : 'smooth'
        });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ---- 3. Reveal ---------------------------------------------------------
     Same failure-proof structure as the main site: synchronous first pass,
     observer for the normal case, scroll sweep + hard timeout as backstops.
     Content starts at opacity 0, so it must never depend on a callback that
     an embedded webview might not deliver. */
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

    pending.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show(el);
      else io.observe(el);
    });

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

    setTimeout(function () {
      if (pending.length) { pending.forEach(show); pending = []; }
    }, 3000);
  }

  /* ---- 4. Counters ------------------------------------------------------- */
  function wireCounters() {
    var nums = $$('[data-count]');
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduced) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
      var dur = 1500, t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!nums.length) return;
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---- 5. Use-of-funds bars --------------------------------------------- */
  function wireBars() {
    var bars = $$('[data-bar]');
    if (!bars.length) return;
    function fill(el) { el.style.width = (parseFloat(el.getAttribute('data-bar')) || 0) + '%'; }
    if (!('IntersectionObserver' in window)) { bars.forEach(fill); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    bars.forEach(function (b) { io.observe(b); });
  }

  /* ---- 6. Modal + thank-you --------------------------------------------- */
  var modal, thanks, opener;

  function openModal(from) {
    opener = from || null;
    modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    var first = $('#i-first');
    if (first) setTimeout(function () { first.focus(); }, 320);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    if (!thanks.classList.contains('is-open')) document.body.classList.remove('is-locked');
    if (opener && opener.focus) opener.focus();
  }
  function openThanks() {
    thanks.classList.add('is-open');
    document.body.classList.add('is-locked');
    var b = $('#irThanksClose');
    if (b) setTimeout(function () { b.focus(); }, 320);
  }
  function closeThanks() {
    thanks.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  function wireModal() {
    modal  = $('#irModal');
    thanks = $('#irThanks');
    if (!modal || !thanks) return;

    $$('[data-open-modal]').forEach(function (b) {
      b.addEventListener('click', function () { openModal(b); });
    });
    $('#irModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    $('#irThanksClose').addEventListener('click', closeThanks);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (thanks.classList.contains('is-open')) closeThanks();
      else if (modal.classList.contains('is-open')) closeModal();
    });

    /* keep tab focus inside whichever dialog is open */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var box = thanks.classList.contains('is-open') ? thanks
              : modal.classList.contains('is-open')  ? modal : null;
      if (!box) return;
      var f = $$('a[href], button, input, select, textarea', box)
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---- 7. Investor form -------------------------------------------------- */
  function wireForm() {
    var form = $('#irForm');
    if (!form) return;

    function validate() {
      var valid = true;
      $$('.field', form).forEach(function (field) {
        var input = $('input, select, textarea', field);
        if (!input || !input.required) return;
        var v = (input.value || '').trim();
        var bad = !v;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && input.type === 'tel')   bad = v.replace(/\D/g, '').length < 7;
        field.classList.toggle('is-invalid', bad);
        if (bad) valid = false;
      });
      return valid;
    }

    $$('input, select, textarea', form).forEach(function (i) {
      ['input', 'change'].forEach(function (ev) {
        i.addEventListener(ev, function () { i.closest('.field').classList.remove('is-invalid'); });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var first = $('.field.is-invalid input, .field.is-invalid select', form);
        if (first) first.focus();
        return;
      }

      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = v; });

      function finish() {
        closeModal();
        form.reset();
        openThanks();
      }

      if (CFG.formEndpoint) {
        fetch(CFG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.assign({ _form: 'investor-interest' }, d))
        }).then(function (r) {
          if (!r.ok) throw new Error('bad status');
          finish();
        }).catch(function () {
          window.open(CFG.waLink(compose(d)), '_blank', 'noopener');
          finish();
        });
      } else {
        window.open(CFG.waLink(compose(d)), '_blank', 'noopener');
        finish();
      }
    });

    function compose(d) {
      return 'Expression of investment interest — BABA Real Estate & Developers\n\n'
        + 'Name: '  + [d.firstName, d.lastName].filter(Boolean).join(' ') + '\n'
        + 'Email: ' + (d.email || '-') + '\n'
        + 'Phone: ' + (d.phone || '-') + '\n'
        + 'Range: ' + (d.range || '-') + '\n'
        + 'About: ' + (d.about || '-');
    }
  }

  /* ---- boot -------------------------------------------------------------- */
  function init() {
    wireLinks();
    wireNav();
    wireReveal();
    wireCounters();
    wireBars();
    wireModal();
    wireForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
