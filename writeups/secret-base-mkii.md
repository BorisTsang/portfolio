---
title: "Secret Base MKII"
tag: crypto
date: 2025-09-29
ctf: CUHK CTF 2025
desc: Cracking the "ultra-Robust Skulking Approach" — an upgraded obfuscation scheme that still gave up its secret base.
---

# Secret Base MKII - CUHK2025CTF Writeup

## Challenge Overview

**Challenge Name:** Secret Base MKII  
**DATE** 29/9/2025  
**Category:** Crypto  
**Event:** CUHK CTF 2025  
**Description:**  
> I have again obfuscated my secret base with the ultra-  
> Robust Skulking Approach but with an upgraded security  
> system! This time you really cannot find my secret base!  
> 
> nc chall.25.cuhkctf.org 25058

The challenge serves up a remote RSA oracle that's basically a "guess my secret base" game, but with a twist: we get an RSA modulus `n` and a ciphertext `c` hiding the flag as an integer `m` (< `n`). The oracle lets us feed it pairs of ciphertexts `(c1, c2)` (as long as they're not the obvious forbidden ones: `c` or `n - c`), and it spits back `m1 ^ m2` where `mi = ci^d mod n`—decryptions via the secret private key `d`. It's like asking the server to do your bitwise homework, one pair at a time.

Our mission: Crack `m` (the flag) with minimal chit-chat. 2048-bit RSA means no brute-forcing this beast; we gotta outsmart it.

## Key Insights

1. **Oracle Behavior**:  
   - Forbidden: `c` and `n - c` (because who wants *easy* wins?).  
   - `decrypt(ci) = ci^d mod n`.  
   - Pairs give XORs, perfect for sneaky plaintext algebra.  
   - Bonus: `d` is odd—server code picks an odd `e` coprime to `φ(n)`, so `d` follows suit. (No even drama here.)

2. **Properties of Decryption Modulo n**:  
   - `n - x ≡ -x mod n`, hence `(n - x)^d ≡ (-1)^d * x^d mod n`.  
   - Odd `d` means `(-1)^d = -1`, so `(n - x)^d ≡ n - x^d mod n`. Negation for free—math's little cheat code.

3. **Attack Strategy**:  
   - **Step 1**: Hit it with `(n-1, n-2)` to snag `2^d mod n`.  
     - `decrypt(n-1) ≡ n-1` (easy peasy).  
     - `decrypt(n-2) ≡ n - 2^d mod n`.  
     - XOR 'em, flip with `n-1`, negate—boom, `2^d`.  
   - **Step 2**: Scale the target: `r = c * 2^{-1} mod n`.  
     - `decrypt(r) = m * 2^{-d} mod n`. (We're dividing by powers now—feels fancy.)  
   - **Step 3**: Query `(n-4, r)` for `m * 2^{-d} mod n`.  
     - `decrypt(n-4) ≡ n - 4^d = n - (2^d)^2 mod n`.  
     - XOR to isolate the good stuff.  
   - **Step 4**: `m = (that) * 2^d mod n`. Scaling back up—voilà!

Two queries, flag in hand. Efficient, or as the author might say, "ultra-robustly skulking."

## Potential Pitfalls & Assumptions

- **d Odd**: Code confirms it; even `d` would ruin the negation party.  
- **Flag Encoding**: Big-endian bytes to int; decode back with a shrug for errors.  
- **Edge Cases**: Queries stay safe (flag ain't 1 or n-1, thankfully). Server slaps invalid inputs.  
- **Modular Arithmetic**: Python's `pow` handles the heavy lifting—no sweat.

## Proof-of-Concept (POC) Testing

```python
# mock_server.py - Local mock for testing (save challenge code here, modify main() to not loop forever)
from secret_base_2 import *  # Assume challenge code in secret_base_2.py

# Run once with dummy flag
flag = b"TEST{this_is_a_dummy_flag_for_testing}"
secret_base = int.from_bytes(flag, "big")
c = encrypt(secret_base)
print(f"n: {n}")
print(f"c: {c}")

# Simulate one query pair
def mock_query(c1, c2):
    assert 1 < c1 < n and c1 not in [c, n-c]
    assert 1 < c2 < n and c2 not in [c, n-c]
    m1 = decrypt(c1)
    m2 = decrypt(c2)
    return m1 ^ m2

# Test Step 1
c1_test = n - 1
c2_test = n - 2
xor_test = mock_query(c1_test, c2_test)
m1_test = n - 1  # Known: decrypt(n-1) = n-1
m2_test = xor_test ^ m1_test
a_test = n - m2_test  # 2^d mod n
print(f"Recovered 2^d mod n: {a_test}")

# Test Step 2-4 (full recovery)
inv2 = pow(2, -1, n)
r_test = (c * inv2) % n
c3_test = n - 4
xor2_test = mock_query(c3_test, r_test)
four_d = pow(a_test, 2, n)
m3_test = n - four_d
b_test = xor2_test ^ m3_test  # m * 2^{-d} mod n
m0_test = (b_test * a_test) % n

byte_len = (m0_test.bit_length() + 7) // 8
recovered_flag = m0_test.to_bytes(byte_len, 'big').decode('utf-8', errors='ignore').strip()
print(f"Recovered flag: {recovered_flag}")  # Should be "TEST{this_is_a_dummy_flag_for_testing}"
```

**Local Test Output:**  
```
n: 12675041096568228133209204718566905622419362346509623356556077790353518006745752947408241120909192952899430393392570139131262834739229570423807515039939050863052161145331932594174415896257235276299936336462554587399031442923154890574598879072951175594156958900182599873538408414304358962801817105839833481156927863180503566958522441052492340872636086937074304728978600921302777027617525580240554208555334013920971357878003443563533363249441746034361754657984446705386871336014628154547340693376413721069466562040455340405488804399382521680612005112852577596420632255602131416946877890487471115239071033924883545302621
c: 2434993123134743485869989665155741540727897302862477730658859223023444954427580247608714229124301680195337376981904525404607456074014064038597353956260745739565020539280859147375570535421543671095537403196963155332743271795497042430138416624313798443952402706625779992024298499488278043250012638103360621227804897513395290701264867566785399949311965830752383234158109682371220655128841789068904133462490999388819658161266055423486002171009680916176688677100243239767180297943233809838358135521333294561239201574401384691129207172332078385057170325270653714452030316133667320889818766533637978884437061400447093515798
Recovered 2^d mod n: 7791948223035840273693785314288316262117945413789626513834350002129289820473739652379655343293357292394325211969815687106250956042413734421503428453899155881564933329821875624419139904079901443321082876042100402325720308399942549739598161926714363431285454655092378274606676863925476966460194889661547711586692183170183030676132720752251430322765626039631825379966255696480036620773831328724483240085438218050538097657304698875459333542560451203388906747356751853675518140039731697434701756972328206251988001303230960705509858798935135087064957017992684458041830538277400944616398862496332712342275886764675949696389
Recovered flag: TEST{this_is_a_dummy_flag_for_testing}
```

Works like a charm. Remote? Just socket-ify the queries.

## Solution Code

```python
import socket
import re

# Remote connection details
HOST = 'chall.25.cuhkctf.org'
PORT = 25058

def recv_until_pattern(s, pattern):
    """Receive data until a regex pattern is found."""
    data = b''
    while not re.search(pattern, data):
        chunk = s.recv(4096)
        if not chunk:
            raise ValueError("Connection closed unexpectedly")
        data += chunk
    return data

def parse_n_c(data):
    """Parse n and c from initial server output."""
    lines = data.decode('utf-8').splitlines()
    n, c = None, None
    for line in lines:
        if line.startswith('n: '):
            n = int(line[3:])
        elif line.startswith('c: '):
            c = int(line[3:])
    if n is None or c is None:
        raise ValueError("Failed to parse n or c from server")
    return n, c

def query_pair(s, c1, c2, n):
    """Send a pair (c1, c2) and return the XOR response."""
    # Send c1
    s.send(f"{c1}\n".encode())
    # Send c2
    s.send(f"{c2}\n".encode())
    # Receive XOR
    data = recv_until_pattern(s, rb'm:\s*\d+')
    match = re.search(r'm:\s*(\d+)', data.decode('utf-8'))
    if not match:
        raise ValueError("Failed to parse XOR from server")
    return int(match.group(1))

def recover_flag():
    """Main recovery logic."""
    # Connect to server
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((HOST, PORT))
    try:
        # Receive initial n and c
        data = recv_until_pattern(s, rb'c:\s*\d+')
        n, c = parse_n_c(data)
        print(f"Received n: {n}")
        print(f"Received c: {c}")

        # Step 1: Query (n-1, n-2) to get 2^d mod n
        c1 = n - 1
        c2 = n - 2
        xor1 = query_pair(s, c1, c2, n)
       
        # decrypt(n-1) = n-1 (since d odd)
        m1 = n - 1
        m2 = xor1 ^ m1 # decrypt(n-2) = n - 2^d mod n
        a = n - m2 # a = 2^d mod n
        print(f"Recovered 2^d mod n: {a}")

        # Step 2: Compute r = c * 2^{-1} mod n
        # decrypt(r) will be m * 2^{-d} mod n
        inv2 = pow(2, -1, n)
        r = (c * inv2) % n
        print(f"Computed r: {r}")

        # Step 3: Query (n-4, r) to get m * 2^{-d} mod n
        c3 = n - 4
        c4 = r
        xor2 = query_pair(s, c3, c4, n)
       
        # decrypt(n-4) = n - 4^d mod n = n - (2^d)^2 mod n
        four_d = pow(a, 2, n)
        m3 = n - four_d
        b = xor2 ^ m3 # b = decrypt(r) = m * 2^{-d} mod n
        print(f"Recovered m * 2^{{-d}} mod n: {b}")

        # Step 4: Recover m = b * 2^d mod n
        m = (b * a) % n
        print(f"Recovered m: {m}")

        # Convert to flag bytes
        byte_len = (m.bit_length() + 7) // 8
        flag_bytes = m.to_bytes(byte_len, 'big')
        flag = flag_bytes.decode('utf-8', errors='ignore').strip()
        print(f"Flag: {flag}")
       
        return flag
    finally:
        s.close()

if __name__ == "__main__":
    flag = recover_flag()
```

**Remote Run Output:**  
```
Received n: 15950052754600783201567118085975050444867632306385366757660839141674248182497625169744458582711650626144382993590180292128163454050809686521920899276214630499053935665180856053748834020225581647293947040554194126491675322861820548145949980698136522421662333104905487180697528141767114607294867006016633965477553579304867348216733930517677845806970825461083690641021081617187461393913238441503916517774652184144212647837971984499732456598369416271990226927744733821709176951747723727653770140248208603948393993307670581123731097787371831988485388470097304029351761242762471108149141202392025191026359307841587351669059
Received c: 2489108661791696332053699661885156759542233241946256622852435016362574416080428893614877883627422194650039275520327724109442879992100648958827895380683780757061669895385925003191462010386954095021119894493250623935940447422571348432991469612753464556838194424541304542740823876311376518669819225251617205898343805553865551274299946291601906790070371894048925833433953173073655905166411118760189797534780082721078855909126925033490058102175257291503851687680977370898147236574621105689622742592724735109825469459556021156413226363136410079784490640637938096567562182705557164298082099588185379907173336464875241902105
Recovered 2^d mod n: 4692490543946443291987113854894683653307158088469673996799571048065149347617016500785577471843607079608305147690220675397482624308722216224743816393976608221896868750631888608247930357107725420979632215334962386020315282866360983086922758433135741859153947510865719755821501966959391156225647091702911334560116352481651880242034937359609211945986858731085911102610315422278987278791852268655922917365578708531239186522538673032675645962384599045918751132519157109558820084533764541501949093639730429295570260509994632612154096132422000253676490292615659452714197277501205868617406607571529799097502963479422433013056
Computed r: 9219580708196239766810408873930103602204932774165811690256637079018411299289027031679668233169536410397211134555254008118803167021455167740374397328449205628057802780283390528470148015306267871157533467523722375213807885142195948289470725155444993489250263764723395861719176009039245562982343115634125585687948692429366449745516938404639876298520598677566308237227517395130558649539824780132053157654716133432645751873549454766611257350272336781747039307712855596303662094161172416671696441420466669529109731383613301140072162075254121034134939555367621062959661712734014136223611650990105285466766322153231296785582
Recovered m * 2^{-d} mod n: 10570943679510671892248746830872683947012434876027077176700792862283948924366020868600470032568362569115501723162962982411548227247526597970435783232550725283324777978473593628319804353104685485816269736044549397468019707862492426317275502311007958372109755685366901425312844897072098573585896793042362224394617768148074685163857136307184126755925805573606863787058671969820280424975407315991920238285699887783804582289398532579261274797513511711083931957762254871956060388361324858777363765740982066214715364479173959912702486194129666656743987680980914702971784026777759238517172832191766449134457642932725979213241
Recovered m: 5209070839800487383091860243273764230651702923458321511206345502847084189241123534718844931000134498499485752671459797702439349663995201842869317636669309
Flag: cuhk25ctf{d0_you_l1ke_the_s3cret_b4s3_50ng_in_MKI_0r_MKII_m0r3?}
```

## Why This is Elegant

- **Efficiency**: Four ciphertexts, two pairs—quicker than ordering takeout.  
- **Math Beauty**: Odd `d` for negation tricks, XOR for combos, `2^{\pm d}` scaling to unwrap the flag. It's like RSA therapy: expose the vulnerability gently.  
- **No Factoring**: Oracle-only; plug-and-play for any odd-`d` RSA setup.  

A cheeky spin on padding oracles, but with XOR spice instead of yes/no games. Shoutout to the author’s “UwU” forbidden-set hint—adorable troll, or just cat-typing the code?

**Flag:** `cuhk25ctf{d0_you_l1ke_the_s3cret_b4s3_50ng_in_MKI_0r_MKII_m0r3?}`  