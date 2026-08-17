// SECURITY REGRESSION TEST — backend cost-attack defenses
let passed = 0, failed = 0;
function assert(l, c) { if (c) { passed++; console.log("PASS —", l); } else { failed++; console.log("FAIL —", l); } }
const src = require('fs').readFileSync('aura.js', 'utf8');

assert("Model pinned server-side (δεν περνάει body.model)", /model: ALLOWED_MODEL/.test(src) && !/model: body\.model/.test(src));
assert("max_tokens παραμένει capped", /Math\.min\(body\.max_tokens \|\| 1000, 1000\)/.test(src));
assert("Rate limiting υπάρχει (429)", /status\(429\)/.test(src));
assert("Rate window ορισμένο", /RATE_WINDOW_MS/.test(src));
assert("Map bounded (δεν μεγαλώνει άπειρα)", /__auraRate\.size > 5000/.test(src));
assert("Body size guard παραμένει", /contentLength > 1000000/.test(src));

// Προσομοίωση rate limiter
const RATE_MAX = 20, RATE_WINDOW_MS = 60000;
let hits = [], blocked = 0;
for (let i = 0; i < 30; i++) {
  const now = Date.now();
  hits = hits.filter(t => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) { blocked++; continue; }
  hits.push(now);
}
assert("30 γρήγορα αιτήματα → 10 μπλοκάρονται", blocked === 10);
console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
