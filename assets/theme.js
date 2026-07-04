// Shared behavior for every page: theme, hide-on-scroll nav, same-page
// smooth scrolling, bottom blur veil.
// Loaded in <head> so the theme is applied before first paint — no flash
// of the wrong theme for returning dark-mode visitors.
(function () {
  var root = document.documentElement;

  function apply(t) {
    root.setAttribute('data-theme', t);
    root.style.colorScheme = t;
  }

  // Saved choice wins; otherwise follow the OS. Persisted under 'bt-theme'.
  var theme = 'light';
  try {
    theme = localStorage.getItem('bt-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}
  if (theme !== 'dark') theme = 'light';
  apply(theme);

  // Scroll reveals are CSS scroll-driven animations (animation-timeline:view()).
  // Where those aren't supported (Firefox, Safari) flag <html> now — before
  // first paint — so site.css can hide reveal elements until they enter view.
  var nativeReveals = window.CSS && CSS.supports('animation-timeline: view()');
  if (!nativeReveals) root.classList.add('no-st');

  var SUN = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"></path></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"></path></svg>';

  // CSS scroll-behavior:smooth doesn't animate the default anchor-click jump
  // reliably, so drive it with rAF and a cubic ease-out instead.
  var scrollRaf;
  function animateScrollTo(target) {
    var start = window.scrollY;
    var dist = target - start;
    var dur = Math.min(900, Math.max(350, Math.abs(dist) * 0.6));
    var t0 = performance.now();
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + dist * (1 - Math.pow(1 - p, 3)));
      if (p < 1) scrollRaf = requestAnimationFrame(step);
    }
    scrollRaf = requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Keep the footer copyright year current (markup carries a static fallback).
    var copy = document.querySelector('.contact-copy');
    if (copy) copy.textContent = copy.textContent.replace(/© \d{4}/, '© ' + new Date().getFullYear());

    // Theme toggle
    var btn = document.querySelector('.theme-btn');
    function paintBtn() { if (btn) btn.innerHTML = theme === 'dark' ? SUN : MOON; }
    paintBtn();
    if (btn) btn.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('bt-theme', theme); } catch (e) {}
      apply(theme);
      paintBtn();
    });

    // Hide the nav while scrolling down, bring it back on any scroll up.
    // html.scrolled also fades out the hero's scroll cue once scrolling starts.
    var nav = document.querySelector('.nav');
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('hidden', y > lastY && y > 96);
      root.classList.toggle('scrolled', y > 40);
      lastY = y;
    }, { passive: true });

    // Reveal fallback: watch every reveal element (including ones rendered
    // later by page scripts) and stamp .in the first time it enters view.
    if (!nativeReveals) {
      var SEL = '.reveal-up,.reveal-left,.scroll-scale,.proj-card,.domain,.lang,.wcard,.wu-card';
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      var watch = function () {
        document.querySelectorAll(SEL).forEach(function (el) {
          if (!el.dataset.rv) { el.dataset.rv = '1'; io.observe(el); }
        });
      };
      watch();
      new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
    }

    // Same-page anchors scroll smoothly, offset for the sticky nav.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        var off = id === 'top' ? 0 : 80;
        animateScrollTo(Math.max(0, el.getBoundingClientRect().top + window.scrollY - off));
      });
    });

    // Bottom blur veil — a soft "there's more below" cue. Injected here so
    // every page gets it without touching markup; hidden once there is
    // nothing left to scroll to.
    var veil = document.createElement('div');
    veil.className = 'scroll-veil';
    document.body.appendChild(veil);
    function updateVeil() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      veil.classList.toggle('at-end', scrollable <= 8 || window.scrollY >= scrollable - 8);
    }
    window.addEventListener('scroll', updateVeil, { passive: true });
    window.addEventListener('resize', updateVeil, { passive: true });
    updateVeil();
  });
})();
