// Home page: hero interactions, animated terminal + wandering knight,
// letter-repel, stack rendering, recent writeups. Ported from the
// Portfolio Home design (DCLogic) to plain DOM.
(function () {
  var DOMAINS = [
    { label: 'Full-Stack', icon: '<path d="M12 3l9 5-9 5-9-5 9-5z"></path><path d="M3 13l9 5 9-5"></path>' },
    { label: 'Embedded Systems', icon: '<rect x="8" y="8" width="8" height="8" rx="1"></rect><path d="M8 3v3M16 3v3M8 18v3M16 18v3M3 8h3M3 16h3M18 8h3M18 16h3"></path>' },
    { label: 'Game Development', icon: '<rect x="2" y="9" width="20" height="9" rx="4.5"></rect><circle cx="8.5" cy="13.5" r="1.1"></circle><circle cx="15.5" cy="13.5" r="1.1"></circle>' },
    { label: 'Cybersecurity', icon: '<path d="M12 2.5l7 2.7v5.3c0 4.7-3 8.2-7 9.5-4-1.3-7-4.8-7-9.5V5.2l7-2.7z"></path>' },
    { label: 'Mobile', icon: '<rect x="7" y="2" width="10" height="20" rx="2.2"></rect><path d="M10.5 18.5h3"></path>' }
  ];
  var LANGS = [
    { label: 'C#', mono: 'C#', bg: '#8b5cf6', fg: '#fff' },
    { label: 'TypeScript', mono: 'TS', bg: '#3178c6', fg: '#fff' },
    { label: 'JavaScript', mono: 'JS', bg: '#f0db4f', fg: '#1d1d1f' },
    { label: 'HTML/CSS', mono: '&lt;/&gt;', bg: '#e34f26', fg: '#fff' }, // pre-escaped: rendered via innerHTML
    { label: 'Python', mono: 'PY', bg: '#4b8bbe', fg: '#fff' },
    { label: 'PHP', mono: 'PHP', bg: '#8892bf', fg: '#fff' },
    { label: 'C++', mono: 'C++', bg: '#00599c', fg: '#fff' },
    { label: 'Rust', mono: 'RS', bg: '#b7410e', fg: '#fff' }
  ];

  // ── Letter-ize: wrap each character in a .ltr span for cursor repel ──
  var letters = [];
  function letterize(el) {
    var text = el.textContent;
    var keep = el.getAttribute('data-color');
    el.textContent = '';
    text.split(' ').forEach(function (word, wi, arr) {
      var wrap = document.createElement('span');
      wrap.className = 'ltr-word';
      [].forEach.call(word, function (ch) {
        var s = document.createElement('span');
        s.className = 'ltr';
        s.textContent = ch;
        if (keep) { s.style.color = keep; s.dataset.keep = '1'; }
        letters.push(s);
        wrap.appendChild(s);
      });
      el.appendChild(wrap);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  function moveLetters(mx, my) {
    var R = 120;
    letters.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var dx = r.left + r.width / 2 - mx;
      var dy = r.top + r.height / 2 - my;
      var d = Math.hypot(dx, dy);
      if (d < R) {
        var f = 1 - d / R;
        var ang = Math.atan2(dy, dx);
        var p = f * 16;
        el.style.transform = 'translate(' + (Math.cos(ang) * p).toFixed(1) + 'px,' + (Math.sin(ang) * p).toFixed(1) + 'px) scale(' + (1 + f * 0.1).toFixed(3) + ')';
        if (!el.dataset.keep) el.style.color = f > 0.4 ? '#3b6fd6' : '';
      } else {
        el.style.transform = 'translate(0,0) scale(1)';
        if (!el.dataset.keep) el.style.color = '';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Letterize hero text (same-page anchor scrolling lives in theme.js)
    document.querySelectorAll('[data-letterize]').forEach(letterize);

    // Hero pointer interactions
    var hero = document.getElementById('top');
    var spot = document.getElementById('heroSpot');
    var grid = document.getElementById('heroGrid');
    var orbs = document.getElementById('heroOrbs');
    var term = document.getElementById('term');

    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

    var resetHero = function () {
      spot.style.background = '';
      grid.style.opacity = '0';
      orbs.style.transform = '';
      term.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
      term.style.transform = 'perspective(1100px)';
      letters.forEach(function (el) {
        el.style.transform = 'translate(0,0) scale(1)';
        if (!el.dataset.keep) el.style.color = '';
      });
    };

    // Listen on the window (not the capped .hero) so the glow keeps tracking the
    // cursor across the full-bleed effect layers — including the page gutters
    // outside the 1200px content column. React only while the pointer is within
    // the hero's vertical band; reset once it moves past it.
    var heroActive = false;
    window.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var inBand = e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inBand) {
        if (heroActive) { heroActive = false; resetHero(); }
        return;
      }
      heroActive = true;

      // fraction within the hero content box (clamped) — orb parallax + card tilt
      var px = clamp((e.clientX - r.left) / r.width);
      var py = clamp((e.clientY - r.top) / r.height);
      // fraction within the full-bleed effect layer — glow + dot-grid, so the
      // highlight follows the cursor across the whole viewport width.
      var lr = spot.getBoundingClientRect();
      var lx = ((e.clientX - lr.left) / lr.width * 100).toFixed(1);
      var ly = ((e.clientY - lr.top) / lr.height * 100).toFixed(1);
      spot.style.background = 'radial-gradient(260px circle at ' + lx + '% ' + ly + '%, rgba(59,111,214,0.26), rgba(59,111,214,0.12) 22%, rgba(59,111,214,0.05) 45%, transparent 68%)';
      grid.style.opacity = '1';
      var m = 'radial-gradient(230px circle at ' + lx + '% ' + ly + '%, #000 0%, #000 8%, transparent 66%)';
      grid.style.webkitMaskImage = m; grid.style.maskImage = m;
      orbs.style.transform = 'translate(' + ((px - 0.5) * 56).toFixed(1) + 'px,' + ((py - 0.5) * 56).toFixed(1) + 'px)';
      term.style.transition = 'transform .1s ease-out';
      term.style.transform = 'perspective(1100px) rotateX(' + (-(py - 0.5) * 9).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 11).toFixed(2) + 'deg)';
      moveLetters(e.clientX, e.clientY);
    }, { passive: true });
    // Pointer leaving the window entirely also resets.
    document.addEventListener('mouseleave', function () {
      if (heroActive) { heroActive = false; resetHero(); }
    });

    // ── Terminal typing + wandering knight ────────────────────────────
    var lines = [
      '$ whoami',
      'boris — full-stack · embedded · games · security',
      '$ ./serendipity_chess --demo',
      'engine ready. knight wandering…'
    ];
    var full = lines.join('\n');
    var typedEl = document.getElementById('typed');
    var i = 0;
    var typer = setInterval(function () {
      i += 1;
      typedEl.textContent = full.slice(0, i);
      if (i >= full.length) {
        clearInterval(typer);
        startBoard();
      }
    }, 24);

    function startBoard() {
      var wrap = document.getElementById('boardWrap');
      var boardEl = document.getElementById('board');
      var moveEl = document.getElementById('boardMove');
      wrap.style.display = '';
      var files = 'abcdefgh';
      var knight = { r: 7, c: 1 };
      var moveCount = 0;
      function draw() {
        var rows = [];
        for (var r = 0; r < 8; r += 1) {
          var cells = [];
          for (var c = 0; c < 8; c += 1) cells.push(r === knight.r && c === knight.c ? '♞' : '·');
          rows.push(cells.join(' '));
        }
        boardEl.textContent = rows.join('\n');
        moveEl.textContent = 'move ' + moveCount + ' · N' + files[knight.c] + (8 - knight.r);
      }
      draw();
      setInterval(function () {
        var deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        var moves = deltas
          .map(function (d) { return { r: knight.r + d[0], c: knight.c + d[1] }; })
          .filter(function (m) { return m.r >= 0 && m.r < 8 && m.c >= 0 && m.c < 8; });
        knight = moves[Math.floor(Math.random() * moves.length)];
        moveCount += 1;
        draw();
      }, 900);
    }

    // ── Stack section ─────────────────────────────────────────────────
    // Each row/tile carries a --i index for a staggered scroll-reveal, and
    // language tiles carry their own --c colour so the hover glow is tinted
    // to that language rather than the generic accent.
    var domainsEl = document.getElementById('domains');
    domainsEl.innerHTML = DOMAINS.map(function (d, i) {
      return '<div class="domain" style="--i:' + i + '"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex:none">' + d.icon + '</svg><span>' + d.label + '</span></div>';
    }).join('');

    var langsEl = document.getElementById('langs');
    langsEl.innerHTML = LANGS.map(function (l, i) {
      return '<div class="lang" style="--i:' + i + ';--c:' + l.bg + '">' +
        '<div class="lang-badge" style="background:' + l.bg + ';color:' + l.fg + '">' + l.mono + '</div>' +
        '<span>' + l.label + '</span></div>';
    }).join('');

    // ── Recent writeups (first 2 from manifest) ───────────────────────
    var recentEl = document.getElementById('recent');
    function renderRecent() {
      recentEl.innerHTML = (window.POSTS || []).slice(0, 2).map(function (p, i) {
        var tc = window.tagColor(p.tag);
        return '<a class="wcard" style="--i:' + i + ';--tc:' + tc.fg + '" href="article.html?slug=' + encodeURIComponent(p.slug) + '">' +
          '<div class="wcard-meta"><span class="wcard-tag" style="color:' + tc.fg + ';background:' + tc.bg + '">' + p.tag + '</span>' +
          '<span class="wcard-date">' + p.date + '</span></div>' +
          '<div class="wcard-title">' + p.title + '</div>' +
          '<div class="wcard-foot"><span class="wcard-ctf">' + p.ctf + '</span><span class="wcard-arrow">&rarr;</span></div>' +
          '</a>';
      }).join('');
    }
    renderRecent();
    new MutationObserver(renderRecent).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  });
})();
