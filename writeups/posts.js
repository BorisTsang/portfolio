// Single source of truth for writeup metadata.
// To add a writeup: drop `<slug>.md` in this folder and add an entry here (newest first).
// The `slug` must match the .md filename (without extension); it's used in ?slug= links.
window.POSTS = [
  {
    slug: 'ret2libc',
    date: '2026-06-14',
    tag: 'pwn',
    ctf: 'DownUnderCTF 2026',
    title: 'ret2libc, but the stars aligned',
    desc: 'A classic buffer overflow from a weekend CTF — leaking libc, finding gadgets, and the one offset that cost me two hours.'
  },
  {
    slug: 'cookie-crumbs',
    date: '2026-05-30',
    tag: 'web',
    ctf: 'picoCTF 2026',
    title: 'Cookie crumbs: session forgery in three acts',
    desc: 'Weak signing, predictable session IDs, and why the flag was hiding in an admin panel nobody linked to.'
  },
  {
    slug: 'gdb-unpack',
    date: '2026-05-02',
    tag: 'rev',
    ctf: 'HTB Cyber Apocalypse 2026',
    title: 'Unpacking a packed binary with just gdb',
    desc: 'No fancy tooling — breakpoints, patience, and watching the unpacker rebuild itself in memory.'
  }
];

// Tag color tokens shared by the listing + article pages.
window.TAG_COLORS = {
  pwn:  { lbg: '#fce8e6', lfg: '#c0392b', dbg: '#3a201d', dfg: '#ff9b8a' },
  web:  { lbg: '#e7eefc', lfg: '#2c5bb8', dbg: '#1d2a44', dfg: '#8fb4f6' },
  rev:  { lbg: '#f0e9fb', lfg: '#7c3aed', dbg: '#2a2140', dfg: '#c6a8f6' },
  misc: { lbg: '#e8eef0', lfg: '#3b6fd6', dbg: '#1c2530', dfg: '#8fb4f6' }
};
