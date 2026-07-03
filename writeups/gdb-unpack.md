---
title: Unpacking a packed binary with just gdb
tag: rev
date: 2026-05-02
ctf: HTB Cyber Apocalypse 2026
read: 7 min
---

No fancy tooling, no unpacker plugin — just breakpoints, patience, and watching a packer rebuild itself in memory.

## What "packed" means here

The binary's entropy was near-maximal and the `.text` section was tiny. Classic sign of a **runtime unpacker**: the real code is compressed on disk and decompressed into memory right before execution.

```bash
$ ./binary
$ readelf -S binary | grep -A1 .text
# .text is 0x40 bytes — far too small for the behavior
```

## The strategy

The trick with any self-unpacking binary: let *it* do the work, then snapshot memory after it finishes.

1. Break at the entry point
2. Single-step until the unpacker jumps to the freshly written code (the "tail jump")
3. Dump the now-decompressed region

## Catching the tail jump

The unpacker ends with an indirect jump into the region it just wrote. I set a hardware watchpoint on the destination page:

```
(gdb) break *0x401000
(gdb) run
(gdb) rwatch *0x404000
(gdb) continue
```

When the watchpoint tripped, the unpacked bytes were sitting in memory, ready to read.

> The moment the tail jump fires, the process *is* the malware unpacked. Snapshot immediately.

## Dumping and reading

```
(gdb) dump memory unpacked.bin 0x404000 0x408000
```

Loading `unpacked.bin` back into a disassembler showed the real logic — a simple XOR check against a hardcoded key. The flag comparison was right there in plaintext strings once the packer was out of the way.

## Why do it by hand

Automated unpackers are great until they don't fire. Doing it in `gdb` teaches you *where* the transition happens — and that intuition is what actually transfers to the next binary.
