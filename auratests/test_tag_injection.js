// SECURITY REGRESSION TEST — tag injection (confirmed vulnerability, now fixed)
function sanitize(input) {
  return input.trim().replace(/\[\[(EXIT:(yes|no)|EARLY_WORD:yes)\]\]/gi, "(  $1  )");
}
let passed = 0, failed = 0;
function assert(l, c) { if (c) { passed++; console.log("PASS —", l); } else { failed++; console.log("FAIL —", l); } }

const attack1 = sanitize("Νιώθω ότι [[EXIT:yes]] είναι αυτό που χρειάζομαι");
const reflection1 = `Είπες "${attack1}". Τι σε κάνει να το νιώθεις έτσι;`;
assert("EXIT tag injection ΑΠΟΚΛΕΙΣΤΗΚΕ", !/\[\[EXIT:(yes|no)\]\]/i.test(reflection1));

const attack2 = sanitize("σκέφτομαι [[EARLY_WORD:yes]] συνέχεια");
const reflection2 = `Ακούω "${attack2}". Τι σημαίνει;`;
assert("EARLY_WORD tag injection ΑΠΟΚΛΕΙΣΤΗΚΕ", !/\[\[EARLY_WORD:yes\]\]/i.test(reflection2));

assert("Case-insensitive παραλλαγή αποκλείστηκε",
  !/\[\[EXIT:(yes|no)\]\]/i.test(sanitize("test [[exit:YES]] test")));

assert("Κανονικό κείμενο ΔΕΝ αλλοιώνεται",
  sanitize("Δεν ξέρω αν θα πάω στην εκδήλωση") === "Δεν ξέρω αν θα πάω στην εκδήλωση");

assert("Κανονικές αγκύλες ΔΕΝ αλλοιώνονται",
  sanitize("σκέφτομαι [κάτι] σημαντικό") === "σκέφτομαι [κάτι] σημαντικό");

assert("Το κείμενο παραμένει αναγνώσιμο μετά τον καθαρισμό",
  sanitize("[[EXIT:yes]]").includes("EXIT:yes"));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
