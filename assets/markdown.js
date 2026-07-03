// Minimal, self-contained Markdown -> HTML renderer.
// Supports: front-matter, headings, paragraphs, fenced code, inline code,
// bold/italic, links, images, blockquotes, ordered/unordered lists, hr.
// Intentionally small — no external dependencies, safe to run from file://.
window.MD = (function () {
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(s) {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, url) {
      return '<img src="' + url + '" alt="' + alt + '" style="max-width:100%;border-radius:10px;margin:6px 0">';
    });
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, txt, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + txt + '</a>';
    });
    return t;
  }

  function parseFrontMatter(text) {
    const meta = {};
    let body = text.trim();
    const m = body.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (m) {
      m[1].split('\n').forEach(function (line) {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        meta[key] = val;
      });
      body = body.slice(m[0].length);
    }
    return { meta: meta, body: body };
  }

  function render(src) {
    const lines = src.replace(/\r\n/g, '\n').split('\n');
    let out = '';
    let i = 0;
    let para = [];
    const flush = function () {
      if (para.length) { out += '<p>' + inline(para.join(' ')) + '</p>'; para = []; }
    };
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line.trim())) {
        flush(); i += 1;
        const code = [];
        while (i < lines.length && !/^```/.test(lines[i].trim())) { code.push(lines[i]); i += 1; }
        i += 1;
        out += '<pre><code>' + esc(code.join('\n')) + '</code></pre>';
        continue;
      }
      if (/^\s*$/.test(line)) { flush(); i += 1; continue; }
      const hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm) {
        flush();
        const level = Math.min(hm[1].length, 6);
        const tag = level <= 2 ? 'h2' : 'h3';
        out += '<' + tag + '>' + inline(hm[2]) + '</' + tag + '>';
        i += 1; continue;
      }
      if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flush(); out += '<hr>'; i += 1; continue; }
      if (/^>\s?/.test(line)) {
        flush();
        const bq = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { bq.push(lines[i].replace(/^>\s?/, '')); i += 1; }
        out += '<blockquote>' + inline(bq.join(' ')) + '</blockquote>';
        continue;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        flush();
        const items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i += 1; }
        out += '<ul>' + items.map(function (it) { return '<li>' + inline(it) + '</li>'; }).join('') + '</ul>';
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        flush();
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i += 1; }
        out += '<ol>' + items.map(function (it) { return '<li>' + inline(it) + '</li>'; }).join('') + '</ol>';
        continue;
      }
      para.push(line.trim());
      i += 1;
    }
    flush();
    return out;
  }

  return { render: render, parseFrontMatter: parseFrontMatter };
})();
