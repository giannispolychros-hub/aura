const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsStylePreference'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

// Must correctly detect clear, deliberate statements
assert("'θέλω πιο άμεσες ερωτήσεις' -> more_direct", detectsStylePreference("Θέλω πιο άμεσες ερωτήσεις σε παρακαλώ.") === "more_direct");
assert("'θέλω περισσότερα παραδείγματα' -> more_examples", detectsStylePreference("Θέλω περισσότερα παραδείγματα για να καταλάβω.") === "more_examples");
assert("'θέλω πιο σύντομες απαντήσεις' -> shorter_replies", detectsStylePreference("Θέλω πιο σύντομες απαντήσεις από δω και πέρα.") === "shorter_replies");
assert("'θέλω πιο αναλυτικές εξηγήσεις' -> longer_replies", detectsStylePreference("Θέλω πιο αναλυτικές εξηγήσεις, μη τα κόβεις.") === "longer_replies");

// CRITICAL: must NOT fire on common, incidental phrasing (the exact failure mode rejected earlier
// today with "δεν ξέρω/ίσως" — this detector must stay narrow, not broad)
assert("plain 'θέλω να σκεφτώ' does NOT match (incidental 'θέλω', no style content)", detectsStylePreference("Θέλω να σκεφτώ λίγο ακόμα.") === null);
assert("'δεν ξέρω τι θέλω' does NOT match", detectsStylePreference("Δεν ξέρω τι θέλω πραγματικά.") === null);
assert("ordinary dilemma content does NOT match", detectsStylePreference("Δεν ξέρω αν πρέπει να αλλάξω δουλειά.") === null);
assert("mentioning 'παράδειγμα' about the problem itself does NOT match", detectsStylePreference("Για παράδειγμα, χθες μου συνέβη κάτι.") === null);
assert("empty/neutral message does NOT match", detectsStylePreference("Ναι, εντάξει.") === null);
assert("'θέλω να χωρίσω' (real dilemma content) does NOT match", detectsStylePreference("Θέλω να χωρίσω αλλά φοβάμαι.") === null);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
