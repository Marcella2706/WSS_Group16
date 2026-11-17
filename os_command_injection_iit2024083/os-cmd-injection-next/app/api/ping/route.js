
// import { exec } from "node:child_process";

// function checkHost(host) {

//   const cmd = "ping -c 1 " + host;
//   return new Promise((resolve) => {
//     // exec() runs the string through /bin/sh, so ; && || | $() are interpreted.
//     exec(cmd, { timeout: 20000 }, (err) => resolve(!err)); // output is discarded -> blind
//   });
// }

import { execFile } from "node:child_process";
import { isIP } from "node:net";

const HOSTNAME =
  /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

function checkHost(host) {
  const target = String(host).trim();

  if (!isIP(target) && !HOSTNAME.test(target)) return Promise.resolve(false);
  return new Promise((resolve) => {
    execFile("ping", ["-c", "1", target], { timeout: 20000 }, (err) => resolve(!err));
  });
}


export async function POST(req) {
  const { host = "" } = await req.json();
  const reachable = await checkHost(host);
  return Response.json({ message: reachable ? "Host is reachable" : "Host is unreachable" });
}
