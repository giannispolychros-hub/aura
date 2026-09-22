// ── ROAD MAP EXIT CONTRACT: post-hoc recovery from non-compliant output ─────
//
// THE RULE IS DERIVED FROM THE SPECIFICATION, NOT FROM A TRANSCRIPT. That is the
// whole lesson of the previous parser bug: the old parseRoadMap was widened twice
// by reading one live session each time, and broke on the next. So the rule here
// is read off the prompt's own EXACT FORMAT block:
//
//     ΔΡΟΜΟΣ:    [the direction, in their words]
//     ΚΕΡΔΙΖΕΙΣ: [what it protects or makes possible]
//     ΚΟΣΤΙΖΕΙ:  [what it costs]
//
// Three named slots. parseRoadMap requires them on three consecutive LINES, in
// capitals, with a colon. Everything the specification asks for is the three label
// words in that order, each introducing its content. Recovery therefore accepts
// the same three labels wherever they sit — inline, lowercase, accented, bulleted,
// separated by · or — instead of : — and nothing else.
//
// WHAT THIS DELIBERATELY DOES **NOT** DO, and it must be said plainly: it does not
// recover roads written in plain prose with no label words. The live 2026-09-22
// session wrote "Διδακτορικό για διεύθυνση — 10+ χρόνια, χωρίς άμεσο εισόδημα."
// Deciding that "10+ χρόνια" is the cost and "διεύθυνση" the gain is semantic
// judgment, which the contract forbids, and guessing it would manufacture a map.
// Those fixtures are below as REFUSALS, not as targets. This contract closes the
// "labels written, layout wrong" door; the "labels never written" door stays open
// and is what the telemetry boolean exists to measure separately.
//
// A road without its cost is not a road — the prompt's own DELIVERY rule. So all
// three fields must carry content, or the block is refused entirely.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('extractRoadMapFromProse'));
eval(extract('parseRoadMap'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }
const A = t => [{ role: "assistant", content: t }];

// ── 1. ACCEPTED — the same three labels, layout the parser cannot read ──────
const inline = A("ΔΡΟΜΟΣ: μετανάστευση οικογενειακά — ΚΕΡΔΙΖΕΙΣ: σχεδόν διπλάσιο μισθό — ΚΟΣΤΙΖΕΙ: τα πάντα είναι εδώ");
assert("native parser cannot read the inline form (this is why recovery exists)", parseRoadMap(inline[0].content) === null);
const r1 = extractRoadMapFromProse(inline);
assert("inline: one road recovered", !!r1 && r1.roads.length === 1);
assert("inline: name", !!r1 && r1.roads[0].name === "μετανάστευση οικογενειακά");
assert("inline: gain", !!r1 && r1.roads[0].gain === "σχεδόν διπλάσιο μισθό");
assert("inline: cost", !!r1 && r1.roads[0].cost === "τα πάντα είναι εδώ");

const lower = A("Δρόμος 1: δεύτερη δουλειά. Κερδίζεις: εισόδημα τώρα. Κοστίζει: τα βράδια σου.");
const r2 = extractRoadMapFromProse(lower);
assert("lowercase + accents + enumerator recovered", !!r2 && r2.roads.length === 1 && r2.roads[0].name === "δεύτερη δουλειά");
// Trailing sentence punctuation is stripped uniformly from all three fields: when the
// model writes the map as sentences, the period before the next label is a boundary,
// not content. Cosmetic and best-effort, the same stance parseRoadMap takes on names.
assert("lowercase: gain and cost kept whole, trailing sentence punctuation normalised",
  !!r2 && r2.roads[0].gain === "εισόδημα τώρα" && r2.roads[0].cost === "τα βράδια σου");

const dotted = A("- ΔΡΟΜΟΣ · ψυχολογία · ΚΕΡΔΙΖΕΙΣ · ιδιωτικές συνεδρίες · ΚΟΣΤΙΖΕΙ · 4-5 χρόνια");
assert("bulleted, mid-dot separators recovered",
  (()=>{const r=extractRoadMapFromProse(dotted);return !!r && r.roads.length===1 && r.roads[0].cost==="4-5 χρόνια";})());

// ── 2. ACCUMULATED HISTORY — roads may arrive across turns ─────────────────
const multi = [
  { role: "assistant", content: "ΔΡΟΜΟΣ: μετανάστευση — ΚΕΡΔΙΖΕΙΣ: διπλάσιος μισθός — ΚΟΣΤΙΖΕΙ: η οικογένεια εδώ" },
  { role: "user", content: "και οι σπουδές;" },
  { role: "assistant", content: "ΔΡΟΜΟΣ: ψυχολογία — ΚΕΡΔΙΖΕΙΣ: ιδιωτικές συνεδρίες — ΚΟΣΤΙΖΕΙ: 4-5 χρόνια" },
];
const rm = extractRoadMapFromProse(multi);
assert("multi-turn: both roads recovered", !!rm && rm.roads.length === 2);
assert("multi-turn: order follows the conversation", !!rm && rm.roads[0].name === "μετανάστευση" && rm.roads[1].name === "ψυχολογία");
assert("multi-turn: a road repeated in a later turn is not duplicated",
  (()=>{const r=extractRoadMapFromProse([...multi, multi[0]]);return !!r && r.roads.length===2;})());
assert("user messages are never read, even when they contain the labels",
  extractRoadMapFromProse([{ role: "user", content: "ΔΡΟΜΟΣ: Α — ΚΕΡΔΙΖΕΙΣ: Β — ΚΟΣΤΙΖΕΙ: Γ" }]) === null);

// ── 3. NATIVE MAPS ARE NOT RECOVERY'S BUSINESS ─────────────────────────────
const native = "ΔΡΟΜΟΣ: μετανάστευση\nΚΕΡΔΙΖΕΙΣ: διπλάσιος μισθός\nΚΟΣΤΙΖΕΙ: η οικογένεια εδώ\nΑΓΝΩΣΤΟ: αν επιτρέπεται η άδεια";
assert("a compliant map parses natively", parseRoadMap(native) !== null);
assert("recovery stands down on a message the native parser already read",
  extractRoadMapFromProse(A(native)) === null);

// ── 4. ΑΓΝΩΣΤΟ travels with a recovered map, same tolerance ────────────────
assert("unknown line recovered alongside",
  (()=>{const r=extractRoadMapFromProse(A("ΔΡΟΜΟΣ: Α — ΚΕΡΔΙΖΕΙΣ: Β — ΚΟΣΤΙΖΕΙ: Γ\n\nΑΓΝΩΣΤΟ: αν επιτρέπεται η άδεια"));
        return !!r && r.unknown === "αν επιτρέπεται η άδεια";})());
assert("no unknown means null, never an empty string",
  (()=>{const r=extractRoadMapFromProse(inline);return !!r && r.unknown === null;})());

// ── 5. ADVERSARIAL REFUSALS — prefer no map over a manufactured one ────────
// 5a. The real live session. Stated as refusals on purpose: this contract does
// not claim to rescue it, and a test that pretended otherwise would be the lie.
const LIVE_PROSE = [
  "Δύο δρόμοι φαίνονται στο τραπέζι: δεύτερη δουλειά στη Θεσσαλονίκη, ή μετανάστευση οικογενειακά.",
  "Δύο διαφορετικοί στόχοι: γρήγορο εισόδημα ή μακροπρόθεσμη εξέλιξη.",
  "Διδακτορικό για διεύθυνση — 10+ χρόνια, χωρίς άμεσο εισόδημα.\nΨυχολογία — 4-5 χρόνια, μετά δυνατότητα ιδιωτικών συνεδριών.",
];
LIVE_PROSE.forEach((t, i) => assert(
  "REFUSED: live prose turn " + (i+1) + " has no label words — recovering it would be semantic judgment",
  extractRoadMapFromProse(A(t)) === null));
assert("REFUSED: the whole live session together still yields nothing",
  extractRoadMapFromProse(LIVE_PROSE.map(t => ({ role: "assistant", content: t }))) === null);

// 5b. Structural refusals derived from the rule itself.
assert("REFUSED: plural 'δρόμοι' is not the ΔΡΟΜΟΣ label",
  extractRoadMapFromProse(A("Δύο δρόμοι: Α ή Β. Κερδίζεις: κάτι. Κοστίζει: κάτι άλλο.")) === null);
assert("REFUSED: only two of the three labels",
  extractRoadMapFromProse(A("Μετανάστευση — ΚΕΡΔΙΖΕΙΣ: διπλάσιος μισθός — ΚΟΣΤΙΖΕΙ: η οικογένεια")) === null);
assert("REFUSED: labels out of specified order",
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ: Α — ΚΟΣΤΙΖΕΙ: Γ — ΚΕΡΔΙΖΕΙΣ: Β")) === null);
// A blank line between the three label LINES is still a native map — parseRoadMap's
// own `\s*` spans it, and its comment says so. Recovery stands down, as it must.
assert("blank lines between the three label lines remain a NATIVE map, not recovery's",
  parseRoadMap("ΔΡΟΜΟΣ: Α\n\nΚΕΡΔΙΖΕΙΣ: Β\n\nΚΟΣΤΙΖΕΙ: Γ") !== null &&
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ: Α\n\nΚΕΡΔΙΖΕΙΣ: Β\n\nΚΟΣΤΙΖΕΙ: Γ")) === null);
// The real paragraph-boundary case: unrelated prose sits between the labels, so the
// native parser cannot read it AND the three labels do not belong to one road. Found
// by mutation — the fixture above could never have caught a lost block boundary,
// because that text never reached the boundary code at all.
const SCATTERED = "ΔΡΟΜΟΣ: μετανάστευση — κάτι ακόμη\n\nΜια εντελώς άσχετη παράγραφος ενδιάμεσα.\n\nΚΕΡΔΙΖΕΙΣ: διπλάσιος μισθός\n\nΚΟΣΤΙΖΕΙ: η οικογένεια εδώ";
assert("REFUSED: labels scattered across paragraphs with prose between are not one road",
  parseRoadMap(SCATTERED) === null && extractRoadMapFromProse(A(SCATTERED)) === null);
// The label words must be searched FORWARD from the previous one. A message that uses
// "Κερδίζεις" as an ordinary verb before the real block must still yield the real block.
assert("a label word used in prose before the block does not consume the real one",
  (()=>{const r=extractRoadMapFromProse(A("Κερδίζεις χρόνο έτσι. ΔΡΟΜΟΣ: Α — ΚΕΡΔΙΖΕΙΣ: Β — ΚΟΣΤΙΖΕΙ: Γ"));
        return !!r && r.roads.length===1 && r.roads[0].gain === "Β";})());
// The word-boundary guard is narrow by construction and matters for ΚΟΣΤΙΖΕΙ alone:
// ΔΡΟΜΟΣ and ΚΕΡΔΙΖΕΙΣ end in a final sigma, which is word-final by definition, so no
// letter can follow them. ΚΟΣΤΙΖΕΙ ends in a vowel and its second-person form can.
assert("REFUSED: 'κοστίζεις:' is a longer word, not the ΚΟΣΤΙΖΕΙ label",
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ: Α — ΚΕΡΔΙΖΕΙΣ: Β — κοστίζεις: τον χρόνο")) === null);
assert("REFUSED: a label with no separator is prose, not a field",
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ Α ΚΕΡΔΙΖΕΙΣ Β ΚΟΣΤΙΖΕΙ Γ")) === null);
// Found by mutation: the fixture above survives a dropped separator requirement by
// accident — the optional enumerator swallows the lone capital and leaves the field
// empty, so the empty-field rule refuses it instead. Real words are what expose it:
// without a required separator this yields a road named "ανάστευση".
assert("REFUSED: labels followed by bare words, no separator anywhere",
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ μετανάστευση ΚΕΡΔΙΖΕΙΣ μισθός ΚΟΣΤΙΖΕΙ οικογένεια")) === null);
assert("REFUSED: an empty field — a road without its cost is not a road",
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ: Α — ΚΕΡΔΙΖΕΙΣ: Β — ΚΟΣΤΙΖΕΙ:")) === null);
assert("REFUSED: 'κερδίζεις' used as an ordinary verb in prose",
  extractRoadMapFromProse(A("Αν φύγεις κερδίζεις χρήματα και κοστίζει η απόσταση, σε όποιον δρόμος και να πας.")) === null);
assert("REFUSED: a field long enough to be a swallowed paragraph",
  extractRoadMapFromProse(A("ΔΡΟΜΟΣ: Α — ΚΕΡΔΙΖΕΙΣ: " + "λ".repeat(300) + " — ΚΟΣΤΙΖΕΙ: Γ")) === null);
assert("REFUSED: empty / malformed input never throws",
  extractRoadMapFromProse([]) === null && extractRoadMapFromProse(null) === null &&
  extractRoadMapFromProse([{ role: "assistant" }]) === null);

// 5c. Cap — a runaway extraction is itself a manufactured map.
assert("at most five roads are ever returned",
  (()=>{const many=[];for(let i=0;i<9;i++)many.push({role:"assistant",content:`ΔΡΟΜΟΣ: δρόμος${i} — ΚΕΡΔΙΖΕΙΣ: κ${i} — ΚΟΣΤΙΖΕΙ: χ${i}`});
        const r=extractRoadMapFromProse(many);return !!r && r.roads.length===5;})());

// ── 6. WIRING — recovery must reach the product, and only through provenance ──
const exportBlock = raw.slice(raw.indexOf("const _kept = getMostRecentWordAnchor"), raw.indexOf("recordTelemetry(\"blueprint_generated\""));
assert("WIRING: the Blueprint export falls back to recovery when no native map exists",
  /extractRoadMapFromProse\(/.test(exportBlock));
assert("WIRING: every recovered line still goes through classifyRoadProvenance",
  /classifyRoadProvenance\(/.test(exportBlock));
assert("WIRING: recovery sets the same roadMapDelivered state a native map would",
  (()=>{const h=raw.slice(raw.indexOf("// ROAD QUESTIONS — ARM"), raw.indexOf("// Termination decision"));
        return /extractRoadMapFromProse\(/.test(h) && /roadMapDelivered\.current\s*=\s*true/.test(h);})());
// Asserting both keys EXIST proves nothing — pointing them at the same expression
// would satisfy that while making the recovery invisible, which is the exact failure
// the boolean exists to prevent. Found by mutation.
const teleAt = raw.indexOf('recordTelemetry("blueprint_generated"');
const tele = teleAt === -1 ? "" : raw.slice(teleAt, teleAt + 1200);
const roadsExpr = (tele.match(/\broads:\s*([^,\n]+)/) || [])[1];
const recExpr = (tele.match(/\broadsRecovered:\s*([^,\n]+)/) || [])[1];
assert("WIRING: telemetry reports recovery as its own signal, not a copy of the compliance one",
  !!roadsExpr && !!recExpr && roadsExpr.trim() !== recExpr.trim());
assert("WIRING: no model call is introduced — recovery is pure code over existing text",
  !/callAura/.test(extract('extractRoadMapFromProse')));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
