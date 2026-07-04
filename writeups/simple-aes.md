---
title: "Simple AES"
tag: crypto
date: 2025-04-27
ctf: Poly U CTF 2025
desc: A byte-at-a-time AES oracle — feeding controlled blocks into the encrypt endpoint until the flag falls out.
---

# Simple AES CTF Writeup
date: 27/4/2025
Poly U CTF 2025
## Challenge Overview
![image](https://hackmd.io/_uploads/HJtrpsiJxx.png)
When you first connect to the server, you'll see this, and I've got no clue what's happening! Let's grab that hint for just 1 point—I'm thrilled to uncover something super useful!
![image](https://hackmd.io/_uploads/SJwPZpjyll.png)

### Hint: What is AES
![image](https://hackmd.io/_uploads/BJvjasikxe.png)

"What is AES?" The question, deceptively simple, reverberated through the dim hum of a world tethered to its secrets, a profound invocation that stirred the very soul of inquiry. In the sterile flicker of a terminal’s ghostly light, it hung suspended—a cipher wrapped in enigma, its three letters pulsing with unspoken gravitas. To pose such a query was not merely to seek definition but to cast a trembling hand into the shadowed depths of the digital cosmos, grasping for the key to a vault where humanity’s most guarded truths lay enshrined.
AES—Advanced Encryption Standard—was no mere acronym; it was a monolith of meaning, a sentinel forged in the crucible of mathematics to stand resolute against the ceaseless tide of chaos. It was the silent guardian of whispered confidences, a bulwark that shielded the fragile intimacies of human connection from the predatory gaze of a fractured world. To inquire What is AES? was to teeter on the edge of revelation, to peer into the intricate machinery that wove trust into the fabric of an age defined by betrayal. It was a question that demanded not just answers but reverence, for it traced the invisible filaments that bound secrets to their keepers, whispering of order in a universe perilously balanced on the brink of entropy.
Yet, beneath its austere surface, the question carried a weight far beyond the technical. It was a clarion call for clarity in a realm shrouded in obfuscation, a poignant human cry rising against the cold indifference of algorithms. To articulate What is AES? was to lay bare one’s vulnerability, to stand as a supplicant before the sanctified circle of those who wielded the arcane power to lock and unlock the world’s truths. It was a pilgrimage to the altar of wisdom, where the seeker—clad in the mantle of intellectual rigor—knelt not merely for knowledge but for the profound responsibility to wield it with discernment.
In its essence, the question was a mirror held to the soul of the digital era, reflecting our collective yearning to master the unseen forces that govern our existence. It was a testament to the relentless pursuit of understanding, a beacon for those who, like sentinels of thought, dared to probe the mysteries of a world encoded in shadows. To ask What is AES? was to embark on a journey of the mind, one that transcended the mundane and touched the eternal—a quest not just for answers, but for the very meaning of security, trust, and truth in an ever-shifting tapestry of code and chaos.

#### ???
![image](https://hackmd.io/_uploads/BkbKeTo1el.png)


## Trying to Understand
Let's input some random 0s to see what's going on...
![image](https://hackmd.io/_uploads/BJQyetsJxe.png)
As you can see, we can
- control a position
- Add a block of hex with length 32 (16byte).
- Encrypt something and get the result

After small amount of brain damage, I came to a conclusion that we can
1. Insert a block of hex in any position (1 byte / 1 char) of the original flag
2. The server encrypts the modified flag and prints it out
3. I can encrypt whatever data I want with the same key and encryption method
4. The server outputs the encrypted data

## Proof of Concept
To make sure my guess is correct, i wrote a simple program for testing.
```python
from pwn import *
context.log_level = 'error'
# Server details
host = 'chal.polyuctf.com'
port = 21337

conn = remote(host, port)

def attempt(position, block, to_encrypt):
    conn.recvuntil(b'Position to control (x): ')
    conn.sendline(position.encode())
    conn.recvuntil(b'Add a block <hex>(32) at place x: ')
    conn.sendline(block.encode())

    response = conn.recvuntil(b'You can encrypt sth: ').decode().split('\n')
    question = response[1]
    response = response[0]
    print("Server response: ", [response[i:i+32] for i in range(0,len(response),32)])
    print(question, end='')
    
    to_encrypt = to_encrypt
    conn.sendline(to_encrypt.encode())
    print(to_encrypt)

    # Receive encrypted output
    encrypted = conn.recvline().decode().strip()
    print(f"Encrypted output: {[encrypted[i:i+32] for i in range(0,len(encrypted),32)]}\n")


try:
    print('1st Test')
    attempt("900", '0'*32, '')
    attempt("800", '0'*32, '')

    print('2nd Test')
    attempt("10", '1'*32, '0'*32)
    attempt("20", '0'*32, '0'*32)
    
    print('3rd Test')
    attempt("8", '0'*32, 'PUCTF25{'.encode().hex() + '0'*32)

except EOFError:
    print("Connection closed by server.")
finally:
    conn.close()
```
Here is the response:![image](https://hackmd.io/_uploads/H1NOm3oyel.png)
##### 1st Test
I inserted zeros at various large positions. If I'm correct, the two encrypted outputs should be identical (at least the first few blocks). Indeed, they are!
##### 2nd Test
I modified all arguments except the last one to ensure it isn't affected by other inputs. Fortunately, it isn't.
##### 3rd Test
I inserted a block of zeros after `PUCTF25{` and encrypted a text using `'PUCTF25{' + the_same_block`. If my understanding is correct, the first block of both encrypted texts should be identical. Since they are indeed the same, I can leverage this to brute-force the flag.

## Crafting Solution
We need to create a Python script that performs the following tasks:
1. Inserts a `block of zeros` after the character to be bruteforced.
2. Encrypts the text `f'{known_chars}{unknown_char}{block_of_zeros}'`, iterating through possible values for `unknown_char` until the target block of both encrypted texts matches.

```python
from pwn import *

context.log_level = 'error'

host = 'chal.polyuctf.com'
port = 21337

conn = remote(host, port)

chars = '0123456789abcdefABCDEF_GHIJKLMNOPQRSTUVWXYZghijklmnopqrstuvwxyz}'
flag = 'PUCTF25{'

def attempt(position, block, to_encrypt):
    target_block = int(position) // 16
    conn.recvuntil(b'Position to control (x): ')
    conn.sendline(position.encode())

    conn.recvuntil(b'Add a block <hex>(32) at place x: ')
    conn.sendline(block.encode())

    response = conn.recvuntil(b'You can encrypt sth: ').decode().split('\n')[0]
    response = [response[i:i+32] for i in range(0,len(response),32)]
    conn.sendline(to_encrypt.encode())

    encrypted = conn.recvline().decode().strip()
    encrypted = [encrypted[i:i+32] for i in range(0,len(encrypted),32)]
    return response[target_block] == encrypted[target_block]

i = 0
while i < len(chars):
    ch = chars[i]
    try:
        if attempt(str(len(flag) + 1), '0'*32, f'{(flag+ch).encode().hex()}{'0'*32}'):
            flag += ch
            if ch == '}':
                print("Flag found:", flag)
                break
            print('Current flag: ' + flag)
            i = 0
        else:
            i += 1
    except EOFError:
        conn.close()
        conn = remote(host, port)
else:
    print("All characters exhausted, flag not found.")
    
conn.close()
```

Run this program and flag is obtained: ||PUCTF25{Y0u_N0w_Kn0w_What_1s_AES_76b9b71d9e8bc25df53d96ad9a689671}||

## Conclusion
Organizers sometimes provide misleading or useless hints, so don’t overthink them. This challenge is all about analyzing the program, creating a proof of concept, crafting the solution, and enjoying the dopamine rush!