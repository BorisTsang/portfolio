// Shared behavior: theme toggle + hide-on-scroll nav.
// Applied theme is persisted to localStorage under 'bt-theme'.
(function () {
  const root = document.documentElement;

  function apply(t) {
    root.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    try { root.style.colorScheme = t === 'dark' ? 'dark' : 'light'; } catch (e) {}
  }

  let theme = 'light';
  try { theme = localStorage.getItem('bt-theme') === 'dark' ? 'dark' : 'light'; } catch (e) {}
  apply(theme);

  const SUN = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"></path></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"></path></svg>';

  function paintBtn(btn) { btn.innerHTML = theme === 'dark' ? SUN : MOON; }

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.querySelector('.theme-btn');
    if (btn) {
      paintBtn(btn);
      btn.addEventListener('click', function () {
        theme = theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('bt-theme', theme); } catch (e) {}
        apply(theme);
        paintBtn(btn);
      });
    }

    // Hide-on-scroll nav
    const nav = document.querySelector('.nav');
    if (nav) {
      let lastY = window.scrollY;
      window.addEventListener('scroll', function () {
        const y = window.scrollY;
        if (y > lastY && y > 96) nav.classList.add('hidden');
        else nav.classList.remove('hidden');
        lastY = y;
      }, { passive: true });
    }

    // Smooth-scroll for #contact anchors
    document.querySelectorAll('a[href$="#contact"]').forEach(function (a) {
      if (!a.getAttribute('href').startsWith('#')) return; // only same-page
      a.addEventListener('click', function (e) {
        const el = document.getElementById('contact');
        if (!el) return;
        e.preventDefault();
        const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 80);
        window.scrollTo({ top: target, behavior: 'smooth' });
      });
    });
  });
})();
