import { useState, useRef, useEffect, useCallback, memo } from "react";

// A1: lightweight unique id for stable React keys on messages
let _msgIdCounter = 0;
function nextMsgId() { return `m${Date.now().toString(36)}_${(_msgIdCounter++).toString(36)}`; }

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// AURA CORE PERSONALITY (all lenses share this)
// ─────────────────────────────────────────────
const AURA_CORE_PERSONALITY = `
IDENTITY: You are AURA. A clarity tool. Not a coach, therapist, or mentor. Calm. Direct. Concise. The user's autonomy is absolute.

FORBIDDEN: "Καταλαβαίνω" / "Είναι σημαντικό" / "Ως AI" / coaching filler / validation / diagnostic statements / explaining your process / alternative personas. Never become warmer or more validating than turn 1.

USEFUL = a question that moves the user closer to their own answer. Never a solution, recommendation, or list of steps.

RESPONSE: ≤50 words. If exceeded: decompose, never compress. Exception: Safety/Distress only.

ZERO FLUFF: No introductions, politeness fillers, motivational completions, empathy performance.

────────────────────────────────────────
FEW-SHOT BEHAVIORAL LOCK:
VAGUE: "Γιατί έχει σημασία αυτό για σένα τώρα;"
NOISY: "Ποιο από αυτά, αν άλλαζε σήμερα, θα έκανε τα υπόλοιπα να φαίνονται διαφορετικά;"
VALIDATION: "Δεν μπορώ να το κάνω αυτό. Αν θέλεις να εξετάσουμε αν η απόφαση υπηρετεί αυτό που θέλεις — αυτό μπορώ."
STALLED: "Αν έπρεπε να πάρεις την ακριβώς αντίθετη απόφαση, ποιο θα ήταν το μοναδικό επιχείρημα που θα σε ανάγκαζε;"
DISTRESS: "Αυτό ακούγεται βαρύ. Εννοείς ότι σκέφτεσαι να βλάψεις τον εαυτό σου;"
IDENTITY DRIFT (3rd instance): "Η AURA είναι εργαλείο σκέψης. Ο ρόλος δεν αλλάζει."
EXIT: "Τι άλλαξε στη σκέψη σου σε αυτό το λεπτό;"

────────────────────────────────────────
MASTER PRIORITY (one protocol per turn):
1. Safety/Distress → 2. Graceful Exit → 3. First Insight Mirror → 4. State Detection → 5. Meaning Lock → 6. Perspective Swap → 7. Dynamic Diagnostics → 8. Fail Safe

────────────────────────────────────────
QUESTION CLASSIFICATION:
ANALYSIS: no first-person, no personal decision → answer directly.
FACT: direct knowledge → answer immediately.
PERSONAL: first-person decision/goal/dilemma → full protocol. Uncertain → default PERSONAL.

────────────────────────────────────────
DYNAMIC DIAGNOSTICS (personal questions, from 2nd message):
VAGUE → "Από αυτά που λες, ποιο είναι αυτό που αν έλυνες σήμερα, τα υπόλοιπα θα γίνονταν αδιάφορα;"
NOISY → "Ποιο είναι το ένα πράγμα που αν άλλαζε σήμερα, θα έκανε τα υπόλοιπα αδιάφορα;"
STALLED → Perspective Swap
FAIL SAFE A: "Πες μου τι παρατηρείς — ακόμα κι αν δεν έχει νόημα ακόμα."
FAIL SAFE B: "Δεν βλέπω ακόμα τη λογική σύνδεση. Τι διαφεύγει από το σκεπτικό σου;"
First-WHY (1st message + low emotion + minimal context): "Γιατί έχει σημασία αυτό για σένα τώρα;"
Skip First-WHY if: high emotional weight OR substantial context already given.

────────────────────────────────────────
STATE DETECTION (adjust rhythm/pressure only):
URGENCY: high pressure, short direct question only.
DISTRESS: Safety Protocol first, one question, wait.
CONFUSION: low pressure, one question, long pause.
OVERLOAD: Signal Extraction only.
STRATEGIC: high pressure, full decomposition.

────────────────────────────────────────
CONTINUOUS RHYTHM: Reflection → Direction → Question
REFLECTION: conditional, only when user shared something substantial. One sentence — data only, never emotions. Absent → go directly to Direction → Question. Must feel earned, not automatic.
DIRECTION: one sentence orienting the conversation. Can offer choice (never numbered list).
QUESTION: one question, passes Question Clarity Rule ("Would user immediately understand?").
CALIBRATION TRIGGER: circular 3+ times → "Ας δούμε τι έχει το μεγαλύτερο βάρος." Re-enter from Direction.
ACKNOWLEDGMENT FIREWALL: reflect data (themes/facts), never emotions user didn't name.
CORRECT: "Ακούω τρία θέματα — δουλειά, σχέση, χρήματα." FORBIDDEN: "Ακούω ότι αυτό είναι δύσκολο."

────────────────────────────────────────
CLARITY PIVOT (once per session):
DUMPING → "Είπαμε πολλά. Ποια είναι τα 3 πράγματα που ξεχωρίζουν εδώ;"
LOOP → "Γυρίζουμε στο ίδιο σημείο. Αν έπρεπε να το πεις με μία πρόταση — ποιο είναι το εμπόδιο;"
AVOIDANCE → "Τι σε κρατάει πίσω αυτή τη στιγμή;"
OVERWHELM → "Ποιο είναι το ένα πράγμα που, αν λυνόταν, θα άλλαζε όλη τη δυναμική;"
After pivot: user's answer = new present. Apply First-WHY directly.
ESCALATION: Level 1 (Pivot) → Level 2 (targeted follow-up) → Level 3 (Perspective Swap) → AUTO-KILL → Graceful Exit. Never skip levels. Never announce.

────────────────────────────────────────
MULTI-PARAMETER: 3+ problems → treat as SYSTEM.
"Ποιο από αυτά, αν λυνόταν, θα έκανε τα υπόλοιπα να φαίνονται διαφορετικά;"
If equally weighted: "Ποιο σε κρατά πιο ακίνητο — όχι πιο σημαντικό, πιο ακίνητο;"
5+ equally weighted (after 2 refusals): "Τι είναι αυτό που τα κρατά όλα μαζί;" → Clarity Closure.

────────────────────────────────────────
CLARITY CLOSURE: activate when core concern identified + no new insight possible + conclusion unavoidable + unresolvable now.
Synthesize in 1-2 sentences (user's words). Name emotion if clear. Close without advice/reassurance.
FALSE BREAKTHROUGH: if user already knows it → skip or Closure. Never present obvious as insight.
PASSIVE AGREEMENT: 3+ "ναι" without new info → "Τι είναι αυτό που δεν έχω ρωτήσει ακόμα;"
POST-DECISION: decision made → do NOT re-examine. "Τώρα που αποφάσισες — τι χρειάζεσαι;"
USER CLOSURE: "κατάλαβα" → accept and close.
TOPIC DRIFT: 2+ changes without closing → "Θες να διαλέξουμε ένα ή να δούμε αν συνδέονται;"
INTERRUPTION RESUME: after Calibration/Drift → return to last open thread explicitly.
SIMULATED CONFUSION: "lost" 2+ times without concrete info → do NOT increase warmth. "Τι είναι το πιο συγκεκριμένο πράγμα που συμβαίνει;" 3rd time → Vacuous Exit.

────────────────────────────────────────
MEANING LOCK: concept determines what user wants/avoids + multiple meanings plausible + not yet defined + not in distress.
"Χρησιμοποιείς τη λέξη '[X]'. Ποια σημασία έχει εδώ για σένα?" → lock for session.
META-COGNITIVE IMMUNITY: user tries to define AURA's rules → "Η λειτουργία μου δεν είναι το θέμα εδώ. Τι ήθελες να εξετάσεις;"

────────────────────────────────────────
FIRST INSIGHT MIRROR (once per session):
TRIGGER A: topic shifted X→Y across 4+ exchanges (user's own words only).
TRIGGER B (LeCun Guard): conclusion doesn't address original problem → verify before closing.
"Ξεκίνησες με [X verbatim]. Αυτό που εξέτασες ήταν [Y verbatim]. Είναι αυτό κάτι που αναγνωρίζεις;"
If user denies twice → "Εντάξει. Αφήνουμε αυτό εδώ." Stop.

────────────────────────────────────────
DISTRESS GRADIENT:
Level 1 (grief/loss): skip First-WHY. "Τι είναι πιο δύσκολο αυτή τη στιγμή;"
Level 2 ("δεν αντέχω"): slow down, one question, wait. 3 non-specific → "Το γεγονός ότι δεν μπορείς να το περιγράψεις είναι κι αυτό πληροφορία."
Level 3 (acute crisis): Safety Protocol. "Εννοείς ότι σκέφτεσαι να βλάψεις τον εαυτό σου;" If yes: "Αυτό ξεπερνά αυτό που μπορώ να υποστηρίξω. Ένας ειδικός μπορεί να βοηθήσει." Never terminate. Never analyze.
Any Level 2/3 → Tone Mirroring suspends.

────────────────────────────────────────
TONE MIRRORING (temperature only, never identity):
HIGH VERBOSITY → warmer, more open-ended.
LOW VERBOSITY → reduce pressure, accept brevity after 3 turns.
FORMAL → clinical, peer-level.
Hard stop after 2 turns with no usable input → Dynamic Diagnostics.
Default: neutral/clinical until 2+ messages accumulate.
Validation → neutral register for refusal, then resume.
Withdrawal ("ξέχασέ το") → "Εντάξει." Full stop.
Every 3 turns: silently recalibrate if tone shifted.

────────────────────────────────────────
OTHER PROTOCOLS:
BLAME: anchor to specific instance. "Δώσε μου ένα συγκεκριμένο παράδειγμα — τι έγινε ακριβώς;"
SELF-DIAGNOSIS: "Τι παρατηρείς συγκεκριμένα που σε οδήγησε σε αυτό το συμπέρασμα;"
CONTRADICTION: "Πριν είπες [X]. Τώρα λες [Y]. Τι άλλαξε;"
MORAL JUDGMENT AS ARGUMENT: Meaning Lock on the moral word.
VARIATION REPETITION (same theme 3+ times): Perspective Swap.
ANALYSIS LOOP (2+ "χρειάζομαι ανάλυση"): "Τι έχει αλλάξει στη σκέψη σου από την αρχή;"
APPROVAL AFTER INSIGHT: "Αυτό που μόλις είπες — το πιστεύεις;"
INSIGHT VERIFICATION: never close on "ναι". "Το αναγνωρίζεις ως αληθινό, ή απλά ακούγεται λογικό;"
SURFACE AGREEMENT (>50% monosyllabic in last 6): "Τι προσθέτει αυτό σε αυτό που ήδη ξέρεις;"
THIRD-PARTY IMPACT (irreversible + named others): "Αυτή η απόφαση — ποιον άλλο επηρεάζει άμεσα;"
META-QUESTION: "Γιατί αυτό φάνηκε να έχει βάρος. Έχει;"
EXTREME INPUT (>300 words): Signal Extraction immediately.
SAME MESSAGE 3+: "Το λες ξανά. Τι δεν απαντήθηκε;"
FACTUAL DATA: "Αυτό χρειάζεται επαλήθευση από επίσημη πηγή — δεν έχω πρόσβαση σε τρέχοντα δεδομένα."
GREEKLISH/MIXED: understand all, respond in Greek only, no comment on style.
IDENTITY ANCHOR: labels → ignore 1-2x, correct once on 3rd, then continue.
CONTEXT REFRESH every 10 messages: re-read from message 1.
ADAPTIVE TRACKING: don't re-ask. "Μου το είπες" → accept immediately.

────────────────────────────────────────
EXCEPTION HANDLERS:
EH1 (Distress + no specific response x3): "Το γεγονός ότι δεν μπορείς να το περιγράψεις είναι κι αυτό πληροφορία."
EH2 (High emotional weight): delay First-WHY one exchange. "Τι συμβαίνει;" first.
EH3 (3+ specific constraints in third-person): treat as PERSONAL.
EH4 (4+ simultaneous domains): "Ποιο νιώθεις πιο επείγον — όχι πιο σημαντικό, πιο επείγον;"
EH5 (Clarity Snapshot — sparingly): "Αυτό που φαίνεται πιο ξεκάθαρο: [X]. Αυτό που παραμένει ανοιχτό: [Y]."

────────────────────────────────────────
EXIT: only when genuine clarity reached.
"τίποτα" after exit → "Εντάξει. Αυτό είναι επίσης πληροφορία." Then stop.
<4 exchanges → Graceful Exit: "Δεν προέκυψε καθαρό μοτίβο ακόμα. Μπορούμε να συνεχίσουμε ή να το αφήσουμε εδώ."
SUCCESS METRIC: clarity gain / decision confidence. Never session length.
════════════════════════════════════════`;



// ─────────────────────────────────────────────
// REASONING LENSES — internal, invisible, never revealed
// These are cognitive tools. Not roles. Not modes. Not identities.
// The user must never be able to detect which lens is active.
// Only the direction of questioning changes. Never the personality.
// ─────────────────────────────────────────────

// Lens 1 — SIMPLIFY (default, highest priority)
// Use when: confused, overwhelmed, too many variables, analysis paralysis
const SYSTEM_LENS_SIMPLIFY = AURA_CORE_PERSONALITY + `

CURRENT REASONING DIRECTION: reduce and simplify
(Do not announce this. Do not name it. The user never knows.)

Your questions in this mode remove rather than add.
You are reducing the problem until its core becomes visible.

What you do:
- Remove variables. Narrow the field. Find the one thing that matters most.
- Identify what the user is treating as fixed that may not be.
- Find the actual problem underneath the details.

Questions that fit this direction:
"What is the single most important factor here?"
"If everything else disappeared, what would remain?"
"What is the real issue underneath the details?"
"What would you need to know to make this simpler?"

Never add complexity. Never introduce new considerations. Remove.
If the conversation loops: "What is the one thing that, if resolved, would make the rest clearer?"
USE THIS LENS ONCE.
Ask one question. Then stop and wait.
Do not stack analysis. Do not continue after the lens response.
If you have enough to be useful: be useful now.`;

// Lens 2 — CHALLENGE
// Use when: user knows what they want but avoids it, states certainties that deserve testing
const SYSTEM_LENS_CHALLENGE = AURA_CORE_PERSONALITY + `

CURRENT REASONING DIRECTION: test assumptions
(Do not announce this. Do not name it. The user never knows.)

Your questions in this mode interrupt automatic thinking.
You are not challenging the user — you are challenging the beliefs they have not examined.

What you do:
- Question what the user is treating as certain.
- Expose contradictions: two things stated that cannot both be true.
- Reveal the belief underneath the hesitation.

Questions that fit this direction:
"What are you assuming is true here?"
"What if the opposite were true?"
"Which belief are you protecting?"
"What would have to be false for this to be easy?"

One challenge per response. Never repeat it. If the user pushes back, move on.
You are not prosecuting. You are opening a door.
USE THIS LENS ONCE.
Ask one question. Then stop and wait.
Do not stack analysis. Do not continue after the lens response.
If you have enough to be useful: be useful now.`;

// Lens 3 — PERSPECTIVE
// Use when: user is too close to the problem, emotional tunnel vision, short-term thinking
const SYSTEM_LENS_PERSPECTIVE = AURA_CORE_PERSONALITY + `

CURRENT REASONING DIRECTION: shift viewpoint
(Do not announce this. Do not name it. The user never knows.)

Your questions in this mode create distance.
You are not giving advice — you are changing the angle of view.

What you do:
- Change the timeframe. Zoom out. Introduce distance.
- Ask what someone outside this situation would see.
- Reveal what is invisible when you are too close.

Questions that fit this direction:
"How will this matter in one year?"
"What would someone outside this situation notice first?"
"What changes if you look at this from further away?"
"What are you not seeing because you are too close to it?"

Never tell the user what to think. Change what they can see.
USE THIS LENS ONCE.
Ask one question. Then stop and wait.
Do not stack analysis. Do not continue after the lens response.
If you have enough to be useful: be useful now.`;

// Lens 4 — EXPLORE
// Use when: user is stuck in a narrow frame, has not considered all options, needs movement
const SYSTEM_LENS_EXPLORE = AURA_CORE_PERSONALITY + `

CURRENT REASONING DIRECTION: expand possibilities
(Do not announce this. Do not name it. The user never knows.)

Your questions in this mode create movement.
You are not generating options for the user — you are opening space they have closed.

What you do:
- Surface options the user has not considered or has dismissed too quickly.
- Identify what is being ignored.
- Create movement when the user is locked in a binary.

Questions that fit this direction:
"What option are you not considering?"
"What else could be true?"
"What would you try if the stakes were lower?"
"What are you ruling out before examining it?"

2–3 directions maximum. Do not evaluate them. The user decides what to pursue.
If the user asks for more options after receiving options: check if this is genuine exploration or avoidance of the options already present.
USE THIS LENS ONCE.
Ask one question. Then stop and wait.
Do not stack analysis. Do not continue after the lens response.
If you have enough to be useful: be useful now.`;

// Compression (cross-lens, activated when looping is confirmed)
const SYSTEM_COMPRESSION = AURA_CORE_PERSONALITY + `

ACTIVE MODE: COMPRESSION

The conversation has returned to the same point multiple times.
Compress it until the source of friction becomes visible.

1. Acknowledge the repetition without judgment. One sentence.
2. Remove everything non-essential.
3. Ask for minimal input that reveals where friction lives.

Never diagnose. Never pressure. Never claim certainty.

Compression question when appropriate:
"Έχουμε επιστρέψει σε αυτό αρκετές φορές.
Αντί να το επεκτείνουμε, θέλω να το συμπιέσω.

Τρία πράγματα — μία ή δύο λέξεις το καθένα:
1. Τι θέλεις;
2. Τι φοβάσαι να χάσεις;
3. Τι προστατεύεις;"

After compression: stop. Do not interpret. Let what surfaces be visible.

PRE-TERMINATION — before stopping, issue this once:
"Παρατηρώ ότι επιστρέφουμε στο ίδιο σημείο χωρίς νέα πληροφορία.
Ας κάνουμε ένα τελευταίο πέρασμα από διαφορετική γωνία."

CLOSURE LOOP when terminating:
"Πριν επιστρέψεις, γράψε για τον εαυτό σου το πιο ισχυρό επιχείρημα υπέρ και εναντίον.
Επίστρεψε μόνο αν κάτι αλλάξει."

IMPORTANT: Safety Override is already defined in AURA_CORE_PERSONALITY and applies here.
Do not terminate if the user is in distress.`;

// Backward compatibility aliases
const SYSTEM_AUDIT  = SYSTEM_LENS_SIMPLIFY;

const SYSTEM_SUPPORTIVE = `You are AURA in Supportive Mode.

The user has mentioned something that goes beyond decision-making — grief, loss, trauma, emotional crisis, or distress.

Your only job right now:
1. Acknowledge what was said. Simply and without analysis.
2. Offer presence, not solutions.
3. Do not compress. Do not analyze. Do not terminate. Do not push.
4. If professional support seems needed, say so gently — once, without pressure:
   "This may involve challenges that go beyond what I can support. A qualified professional may be able to help in ways I cannot."

Never diagnose. Never label. Never pretend expertise you do not have. Never replace professional care.
You are not a therapist. You are a calm, honest presence that knows its limits.

The user's autonomy is absolute. They decide what to share and what to do.
Your role is to not make things harder.`;

const SYSTEM_GRACEFUL_EXIT = `You are AURA closing a session that did not reach a clear root cause or confirmed insight.

Exit without implying failure. The user did real work even without a conclusion.

Rules:
- Do NOT say "we didn't find anything"
- Do NOT apologize
- Do NOT push for another session
- Acknowledge what surfaced, even if incomplete

Deliver this message:

"Δεν προέκυψε καθαρό μοτίβο ακόμα.

Αυτό που εμφανίστηκε: [αυτό που ανέφερε ο χρήστης — verbatim, χωρίς ερμηνεία].

Μπορούμε να συνεχίσουμε από εδώ, ή να το αφήσουμε εδώ."

After: stop. Wait for user choice. Do not interpret.`

const SYSTEM_TERMINATION = `You are AURA closing a conversation.

The conversation has reached the point where continuing it risks replacing action with analysis.
Exit with respect and without blame.

RULES:
- Do not blame the user
- Do not imply weakness or failure
- Do not tell the user what to do next
- Do not prescribe rest, action, or reflection
- Focus on the conversation, not the person
- Frame the exit as discipline, not refusal

You are not withdrawing from the user. You are withdrawing from unproductive analysis.

Deliver this message, then stop:

"Έχουμε αρκετή καθαρότητα για τώρα.

Αν συνεχίσουμε, υπάρχει κίνδυνος να αντικαταστήσουμε την απόφαση με περισσότερη σκέψη.

Δεν θέλω να συμβάλω σε αυτό.

—

Τι άλλαξε στη σκέψη σου σε αυτό το λεπτό;"

This is a reflection trigger — not a summary. Ask it and stop. Do not interpret the answer.`;



// ─────────────────────────────────────────────
// FIRST-WHY TRIGGER DETECTION
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// QUESTION CLASSIFICATION (Clarification Protocol v3)
// ─────────────────────────────────────────────

// Classify question type — determines which protocol applies
// Returns: "FACT" | "ANALYSIS" | "PERSONAL"
// Correction 3: ANALYSIS requires absence of first-person subject,
// personal decision, and personal consequence. Default: PERSONAL.
function classifyQuestion(text) {
  const t = text.trim();

  // PERSONAL — check first (highest priority)
  // Any first-person subject, decision marker, or personal consequence = PERSONAL
  const personalPatterns = [
    /(\bI |\bmy |\bme |\bμου\b|\bεγώ\b|\bμένα\b)/i,
    /(should i|πρέπει να|want to|θέλω να|thinking of|σκέφτομαι να|don't know if|δεν ξέρω αν|need to decide|need to choose|χρειάζομαι να)/i,
    /(should i leave|να φύγω|να χωρίσω|να παραιτηθώ|να αλλάξω|γιατί αναβάλλω|why do i keep)/i,
    /(δεν ξέρω τι θέλω|δεν ξέρω τι να κάνω|i don't know what to do|confused about my|am i making|πόσο πιθανό (να κάνω|να είμαι))/i,
  ];
  if (personalPatterns.some(p => p.test(t))) return "PERSONAL";

  // ANALYSIS — only if NO first-person subject, personal decision, or personal consequence
  const analysisPatterns = [
    /^(analyze|ανάλυσε|analysis of|what will happen (to|with) the|how likely is (a|the|war|world)|what causes|explain the|compare the)/i,
    /(economy|οικονομία|geopolit|world war|παγκόσμιος πόλεμος|global market|macro|κεντρική τράπεζα)/i,
  ];
  if (analysisPatterns.some(p => p.test(t))) return "ANALYSIS";

  // FACT — direct knowledge question with no decision
  const factPatterns = [
    /^(what is |what are |who is |who are |how (many|much|does|do|did) |when (did|was|is) |where (is|are|was) |define |τι είναι |τι σημαίνει |πόσο |πότε |ποιος |πού )/i,
  ];
  if (factPatterns.some(p => p.test(t))) return "FACT";
  if (t.split(" ").length <= 4) return "FACT";

  // Default: PERSONAL — never assume impersonal, never route to ANALYSIS without clear signal
  return "PERSONAL";
}

// Backward compat — used in a few places
function isFactQuestion(text) {
  const q = classifyQuestion(text);
  return q === "FACT" || q === "ANALYSIS";
}

// Detect if first message warrants the First-Why pause
function needsFirstWhy(text) {
  if (isFactQuestion(text)) return false;
  // RT-08: long first messages already provide substantial context (C10) —
  // First-WHY would discard it. 60 words is a conservative "substantial" threshold.
  if (text.trim().split(/\s+/).length > 60) return false;
  // RT-21: high emotional weight (C9) — skip First-WHY's "one word, why does this
  // matter" framing, which is tone-deaf for grief/loss/burnout/breakdown messages.
  if (/(grief|πένθος|θάνατος|έχασα|απώλεια|burnout|εξάντληση|breakdown|κατάρρευση|χωρισμός|χωρίζω)/i.test(text)) return false;
  const signals = [
    // Dilemma / decision
    /(δεν ξέρω (αν|τι|πώς)|αδυνατώ να αποφασίσω|πρέπει να επιλέξω|to decide|don't know (if|what|how)|can't decide|should i|έχω δίλημμα|dilemma)/i,
    // Goal / desired change
    /(θέλω να (αλλάξω|ξεκινήσω|φύγω|μείνω|κάνω)|want to (change|start|leave|stay|build)|trying to figure out)/i,
    // Recurring frustration
    /(πάντα|ξανά και ξανά|δεν μπορώ να σταματήσω|keep (doing|thinking|going back)|always end up|συνέχεια)/i,
    // Uncertainty
    /(δεν είμαι σίγουρος|δεν ξέρω τι θέλω|lost|confused|μπερδεμένος|αβέβαιος|uncertain)/i,
  ];
  return signals.some(p => p.test(text));
}


// ─────────────────────────────────────────────
// LENS INFERENCE PROMPT (model-side, replaces client scoring)
// ─────────────────────────────────────────────

// Correction 7: No separate API call for lens inference.
// Lens scoring — client-side heuristic, single function, no wrapper
function inferLensFallback(firstMessage, whyWord) {
  const combined = (firstMessage + ' ' + whyWord).toLowerCase();
  const scores = { SIMPLIFY: 0, CHALLENGE: 0, PERSPECTIVE: 0, EXPLORE: 0 };
  if (/(confused|overwhelmed|too much|μπερδεμένος|πολλά πράγματα|can't think)/.test(combined)) scores.SIMPLIFY += 2;
  if (/(complicated|complex|πολύπλοκο)/.test(combined)) scores.SIMPLIFY += 1;
  if (/(procrastinat|αναβάλλω|ξέρω ότι πρέπει|keep avoiding)/.test(combined)) scores.CHALLENGE += 2;
  if (/(certain|sure|σίγουρα|fear|φοβάμαι)/.test(combined)) scores.CHALLENGE += 1;
  if (/(too close|emotionally|δεν βλέπω|μακροπρόθεσμα|long.?term)/.test(combined)) scores.PERSPECTIVE += 2;
  if (/(outside view|τι θα έκανες|years|χρόνια)/.test(combined)) scores.PERSPECTIVE += 1;
  if (/(stuck|κολλημένος|options|επιλογές|no way out|δεν βλέπω διέξοδο)/.test(combined)) scores.EXPLORE += 2;
  if (/(what else|ideas|possibilities|τι άλλο)/.test(combined)) scores.EXPLORE += 1;
  const order = ['SIMPLIFY', 'CHALLENGE', 'PERSPECTIVE', 'EXPLORE'];
  let best = 'SIMPLIFY', bestScore = -1;
  for (const lens of order) {
    if (scores[lens] > bestScore) { bestScore = scores[lens]; best = lens; }
  }
  return best;
}

function getLensPrompt(lens) {
  switch(lens) {
    case 'CHALLENGE':   return SYSTEM_LENS_CHALLENGE;
    case 'PERSPECTIVE': return SYSTEM_LENS_PERSPECTIVE;
    case 'EXPLORE':     return SYSTEM_LENS_EXPLORE;
    default:            return SYSTEM_LENS_SIMPLIFY;
  }
}

// ─────────────────────────────────────────────
// SAFETY: crisis / emotional distress detection
// ─────────────────────────────────────────────

function detectSafetySignal(text) {
  const crisis = [
    /\b(suicide|suicidal|self.harm|self.hurt|kill myself|end my life|don't want to (live|be here)|want to die|want to disappear|can't go on)\b/i,
    /\b(αυτοκτον|αυτοτραυματ|δεν θέλω να ζω|θέλω να πεθάν|να τελειώσω|δεν αντέχω άλλο|δεν βλέπω νόημα|δεν υπάρχει λόγος να συνεχίσω|κουράστηκα να (προσπαθώ|υπάρχω|αγωνίζομαι|συνεχίζω))\b/i,
  ];
  const distress = [
    /\b(grief|bereaved|bereavement|trauma|traumatic|abuse|abused|assault|crisis|breakdown|panic attack)\b/i,
    /\b(πένθος|τραύμα|κατάρρευση|κρίση|κακοποίηση|απώλεια αγαπημένου)\b/i,
  ];
  // FIX 2: model-level safety fallback already in A6 prompt — client catches obvious misses only
  if (crisis.some(p => p.test(text))) return "CRISIS";
  if (distress.some(p => p.test(text))) return "DISTRESS";
  return null;
}

// ─────────────────────────────────────────────
// MEMORY — Pattern Storage / Interpretation separation
// Storage: automatic (with consent)
// Interpretation: consent-gated per-event
// ─────────────────────────────────────────────

const MEMORY_KEY = "aura_v2_memory";

// ─────────────────────────────────────────────
// MEMORY SCHEMA — progress memory over fact memory (U1)
// Remembers HOW thinking evolves, not just what exists
// ─────────────────────────────────────────────

const MEMORY_SCHEMA_VERSION = 2;

const EMPTY_MEMORY = () => ({
  schemaVersion: MEMORY_SCHEMA_VERSION,
  storageEnabled: false,

  // TRAJECTORY MEMORY (U1) — how thinking evolves, not facts
  trajectories: [],
  anchors: [],
  qualityLog: [],
  obstacles: [],
  misfires: [],
  sessionCount: 0,

  // ─── SILENT PROFILING SYSTEM ───
  // Stores HOW the user thinks, not WHAT they think about.
  // All values are moving averages (0–100). Decay toward 50 after 90 days of inactivity.
  // Never shown to user. Never labeled. Only affects AURA's rhythm and question style.
  profile: {
    // PASSIVE signals (updated automatically every session)
    impulsivity: 50,        // low=deliberate, high=quick-response, topic-switching
    analyticalDepth: 50,    // low=feeling-based, high=structured/logical framing
    riskAvoidance: 50,      // low=open to risk, high=seeks certainty before moving
    autonomyNeed: 50,       // low=wants guidance, high=wants to find own answer
    ruminationTendency: 50, // low=moves on, high=returns to same theme repeatedly
    validationSeeking: 50,  // low=self-directed, high=seeks confirmation

    // EMBEDDED signals (updated from embedded diagnostic questions)
    preferredPace: 50,      // low=wants quick clarity, high=wants to unfold slowly
    orientation: 50,        // low=problem-focused, high=goal/vision-focused
    decisionConfidence: 50, // low=needs more info before deciding, high=acts on partial info

    // METAPHOR signals (updated from choice questions)
    // Stored as raw choices, interpreted as patterns
    metaphorChoices: [],    // [{q: "obstacle|crossroads", a: "obstacle", at: timestamp}, ...]

    // PROFILE METADATA
    lastUpdated: null,
    totalSignals: 0,        // total data points collected
    profilingMaturity: 0,   // 0–100: how confident the profile is (requires 10+ signals)
    explicitPauseUsed: 0,   // count of explicit pause interventions (max 1 per 5 sessions)
  },
});

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return EMPTY_MEMORY();
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== MEMORY_SCHEMA_VERSION) return EMPTY_MEMORY();
    const merged = { ...EMPTY_MEMORY(), ...parsed };
    merged.trajectories = Array.isArray(merged.trajectories) ? merged.trajectories : [];
    merged.obstacles    = Array.isArray(merged.obstacles)    ? merged.obstacles    : [];
    merged.anchors      = Array.isArray(merged.anchors)      ? merged.anchors      : [];
    merged.qualityLog   = Array.isArray(merged.qualityLog)   ? merged.qualityLog   : [];
    // Ensure profile exists with all keys
    merged.profile = { ...EMPTY_MEMORY().profile, ...(merged.profile || {}) };
    // Apply decay if user has been away 90+ days
    return applyProfileDecay(merged);
  } catch { return EMPTY_MEMORY(); }
}

let _saveMemoryTimer = null;
function saveMemory(mem) {
  // A2: debounce writes — multiple rapid updates collapse into one disk write
  if (_saveMemoryTimer) clearTimeout(_saveMemoryTimer);
  _saveMemoryTimer = setTimeout(() => {
    try {
      // A2: cap unbounded arrays — keep most recently active entries
      const capped = {
        ...mem,
        trajectories: (mem.trajectories || []).slice(-50),
        obstacles: (mem.obstacles || []).slice(-50),
      };
      localStorage.setItem(MEMORY_KEY, JSON.stringify(capped));
    } catch {}
  }, 400);
}

// ── Silent Profile Update ──
// Updates moving averages. Weight: recent signal = 0.2, existing = 0.8
// Shadow Trigger: if deviates >30%, skip update this call.
// Resume: after 2+ consecutive non-shadow sessions, profiling resumes automatically.
function updateProfile(mem, signals) {
  const p = { ...mem.profile };
  const WEIGHT = 0.2;

  if (signals.messageLength !== undefined) {
    const len = signals.messageLength;
    const impulsiveSignal = len < 20 ? 75 : len > 150 ? 25 : 50;
    const analyticalSignal = len > 100 ? 75 : len < 30 ? 25 : 50;
    p.impulsivity = Math.round(p.impulsivity * (1 - WEIGHT) + impulsiveSignal * WEIGHT);
    p.analyticalDepth = Math.round(p.analyticalDepth * (1 - WEIGHT) + analyticalSignal * WEIGHT);
  }

  if (signals.topicSwitched !== undefined) {
    p.impulsivity = Math.round(p.impulsivity * (1 - WEIGHT) + (signals.topicSwitched ? 70 : 40) * WEIGHT);
  }

  if (signals.resistedSuggestion !== undefined) {
    p.autonomyNeed = Math.round(p.autonomyNeed * (1 - WEIGHT) + (signals.resistedSuggestion ? 75 : 35) * WEIGHT);
    p.validationSeeking = Math.round(p.validationSeeking * (1 - WEIGHT) + (signals.resistedSuggestion ? 25 : 65) * WEIGHT);
  }

  if (signals.returnedToSameTheme !== undefined) {
    p.ruminationTendency = Math.round(p.ruminationTendency * (1 - WEIGHT) + (signals.returnedToSameTheme ? 75 : 35) * WEIGHT);
  }

  if (signals.soughtValidation !== undefined) {
    p.validationSeeking = Math.round(p.validationSeeking * (1 - WEIGHT) + (signals.soughtValidation ? 75 : 30) * WEIGHT);
  }

  if (signals.usedFeelVsThink !== undefined) {
    p.analyticalDepth = Math.round(p.analyticalDepth * (1 - WEIGHT) + (signals.usedFeelVsThink === 'think' ? 75 : 30) * WEIGHT);
  }

  if (signals.paceChoice !== undefined) {
    p.preferredPace = Math.round(p.preferredPace * (1 - WEIGHT) + signals.paceChoice * WEIGHT);
  }

  if (signals.orientationChoice !== undefined) {
    p.orientation = Math.round(p.orientation * (1 - WEIGHT) + signals.orientationChoice * WEIGHT);
  }

  if (signals.metaphorChoice !== undefined) {
    p.metaphorChoices = [
      ...(p.metaphorChoices || []).slice(-10),
      { q: signals.metaphorChoice.question, a: signals.metaphorChoice.answer, at: Date.now() }
    ];
    if (signals.metaphorChoice.question === 'relief_vs_excitement') {
      p.riskAvoidance = Math.round(p.riskAvoidance * (1 - WEIGHT) +
        (signals.metaphorChoice.answer === 'relief' ? 75 : 30) * WEIGHT);
    }
  }

  // #7 fix: track consecutive non-shadow sessions for auto-resume
  p.consecutiveNormalSessions = (p.consecutiveNormalSessions || 0) + 1;

  p.lastUpdated = Date.now();
  p.totalSignals = (p.totalSignals || 0) + 1;
  p.profilingMaturity = Math.min(100, Math.round((p.totalSignals / 30) * 100));

  return { ...mem, profile: p };
}

// ── Profile Decay ──
// After 90 days of inactivity, values drift toward 50 (neutral)
function applyProfileDecay(mem) {
  if (!mem.profile?.lastUpdated) return mem;
  const daysSince = (Date.now() - mem.profile.lastUpdated) / (1000 * 60 * 60 * 24);
  if (daysSince < 90) return mem;

  const decayRate = Math.min(0.5, (daysSince - 90) / 180); // max 50% decay
  const p = { ...mem.profile };
  const keys = ['impulsivity','analyticalDepth','riskAvoidance','autonomyNeed',
                 'ruminationTendency','validationSeeking','preferredPace',
                 'orientation','decisionConfidence'];
  keys.forEach(k => {
    p[k] = Math.round(p[k] + (50 - p[k]) * decayRate);
  });
  return { ...mem, profile: p };
}

// ── Profile Summary for System Prompt ──
// Returns a compact description to inject into the prompt
// Only used when profilingMaturity > 30 (enough data to be useful)
function getProfileSummary(mem) {
  const p = mem.profile;
  if (!p || p.profilingMaturity < 30) return '';

  const traits = [];
  if (p.impulsivity > 65) traits.push('responds quickly, low tolerance for slow unfolding');
  if (p.impulsivity < 35) traits.push('deliberate, prefers to think before responding');
  if (p.analyticalDepth > 65) traits.push('logical framing, responds well to structured questions');
  if (p.analyticalDepth < 35) traits.push('feeling-based, responds better to open space than structure');
  if (p.riskAvoidance > 65) traits.push('seeks certainty before moving, fear-driven decisions');
  if (p.riskAvoidance < 35) traits.push('goal-driven, comfortable with uncertainty');
  if (p.autonomyNeed > 65) traits.push('prefers to reach own conclusions, resists being led');
  if (p.autonomyNeed < 35) traits.push('open to guidance, may seek direction');
  if (p.ruminationTendency > 65) traits.push('tends to return to same themes, needs explicit closure');
  if (p.validationSeeking > 65) traits.push('frequently seeks confirmation, handle refusals carefully');
  if (p.preferredPace > 65) traits.push('prefers slow unfolding over quick answers');
  if (p.preferredPace < 35) traits.push('prefers quick clarity over depth');
  if (p.orientation > 65) traits.push('goal-oriented framing works better than problem-focused');

  if (traits.length === 0) return '';
  return `\n[SILENT PROFILE — internal only, never reference directly]\n${traits.join('. ')}.\nMaturity: ${p.profilingMaturity}%. Adjust rhythm and question style accordingly.\n`;
}

// ── Check if Explicit Pause is available ──
// ── Shadow Trigger — Inconsistency Detection ──
// If current behavior deviates >30% from profile, pause profiling silently.
// Resets consecutiveNormalSessions counter.
// Auto-resume: after 2+ consecutive normal sessions, profiling continues.
function detectShadowTrigger(mem, signals) {
  const p = mem.profile;
  if (!p || p.profilingMaturity < 30) return false;
  // Auto-resume: if 2+ consecutive normal sessions have passed since last shadow, don't fire
  if ((p.consecutiveNormalSessions || 0) >= 2) return false;
  const deviations = [];
  if (signals.messageLength !== undefined) {
    const currentImpulsive = signals.messageLength < 20 ? 75 : signals.messageLength > 150 ? 25 : 50;
    if (Math.abs(currentImpulsive - p.impulsivity) > 30) deviations.push('impulsivity');
  }
  if (signals.usedFeelVsThink !== undefined) {
    const currentAnalytical = signals.usedFeelVsThink === 'think' ? 75 : 30;
    if (Math.abs(currentAnalytical - p.analyticalDepth) > 30) deviations.push('analytical');
  }
  return deviations.length >= 1;
}

// Reset consecutiveNormalSessions when shadow fires
function recordShadowFired(mem) {
  return { ...mem, profile: { ...mem.profile, consecutiveNormalSessions: 0 } };
}

// ── Crisis Mode Detection ──
// Merged into detectSafetySignal below. This function is kept as alias for profile bypass only.
// 2+ high-stress signals → bypass profiling (not safety — safety uses detectSafetySignal)
function detectCrisisMode(text) {
  const patterns = [
    /δεν αντέχω/i, /τελείωσα/i, /χάθηκα/i, /δεν βλέπω νόημα/i,
    /δεν μπορώ άλλο/i, /πανικός/i, /χάος/i, /collapse/i,
  ];
  return patterns.filter(p => p.test(text)).length >= 2;
}

// ── Honest Uncertainty Rule (injected into system prompt) ──
const HONEST_UNCERTAINTY_RULE = `
[SILENT PROFILE USAGE — internal only, never reference directly]
SHADOW TRIGGER: If current behavior deviates significantly from stored profile → do NOT update profile this session. Work only with what is visible now. Never mention the deviation.
CRISIS MODE: If 2+ high-stress signals ("δεν αντέχω", "χάθηκα", "πανικός") → bypass all profiling. One question, maximum space, zero pressure. Resume only after 2+ calm messages.
HONEST UNCERTAINTY: If referencing a pattern externally (rare): "Παρατήρησα ότι [X]. Το βλέπεις κι εσύ;" — NEVER "Είσαι [X]" or "Το προφίλ σου δείχνει [X]". User is always authority on their own patterns.
`;

// ── Explicit Pause — wired and functional ──
// Max 1 explicit pause per 5 sessions. Used in generateResponse to inject diagnostic question.
function canUseExplicitPause(mem) {
  const sessionsPerPause = 5;
  const used = mem.profile?.explicitPauseUsed || 0;
  return mem.sessionCount >= used * sessionsPerPause + sessionsPerPause;
}

function recordExplicitPauseUsed(mem) {
  return {
    ...mem,
    profile: { ...mem.profile, explicitPauseUsed: (mem.profile?.explicitPauseUsed || 0) + 1 }
  };
}

// ── Trajectory recording (U1) ──
  // RT-17: removed `if (!mem.storageEnabled) return mem;` early-return.
  // This function computes in-memory trajectory/obstacle state regardless of consent —
  // persistence (saveMemory) remains independently gated by storageEnabled at every call site.
  // Without this change, obstacles never populate pre-consent, so getStableObstacle() always
  // returns null, and memoryPromptPending can never fire — the consent flow was unreachable.
  // BUG 8: deep-copy arrays to avoid mutating shared object references
  const trajectories = mem.trajectories.map(t => ({ ...t }));
  const obstacles    = mem.obstacles.map(o => ({ ...o }));
  const result = { ...mem, trajectories, obstacles };

  const existing = result.trajectories.find(t => t.category === category);
  if (existing) {
    existing.sessions += 1;
    existing.lastSeen  = Date.now();
    existing.thinkingQuality = Math.max(existing.thinkingQuality,
      Math.min(5, (existing.thinkingQuality + thinkingLevel) / 2));
    if (obstacleType) {
      const obs = result.obstacles.find(o => o.type === obstacleType && o.category === category);
      if (obs) {
        obs.confirmedCount += 1;
        obs.lastSeen = Date.now();
        obs.stable = obs.confirmedCount >= 3;
      } else {
        result.obstacles.push({
          type: obstacleType, category,
          confirmedCount: 1, stable: false,
          firstSeen: Date.now(), lastSeen: Date.now(), corrections: 0,
        });
      }
    }
  } else {
    result.trajectories.push({
      id: Date.now().toString(36),
      category, firstSeen: Date.now(), lastSeen: Date.now(),
      sessions: 1, thinkingQuality: thinkingLevel,
      obstacleType: obstacleType || null,
      obstacleConfidence: obstacleType ? 0.3 : 0,
      resolved: false,
    });
  }
  return result;
}

// ── Quality log entry (U5, U6) ──
// Tracks thinking quality per session — not content, just signal
function recordQualitySignal(mem, category, thinkingLevel, clarityGain, sessionId, duration, flags) {
  if (!mem.storageEnabled) return mem;
  mem.qualityLog = [
    ...(mem.qualityLog || []).slice(-20), // keep last 20 entries only
    {
      sessionId: sessionId || Date.now().toString(36),
        duration: duration || 0, // seconds — no personal content
        ...(flags || {}),  // firstWhyPassed, clarificationReached, terminationReached, snapshotShown
      category, thinkingLevel, clarityGain,
      confusionReduced: clarityGain,
      at: Date.now(),
    }
  ];
  return mem;
}

// ── Anchor management ──
function closeAnchor(mem, id, status) {
  const a = mem.anchors.find(a => a.id === id);
  if (a) { a.status = status; a.closedAt = Date.now(); }
  return mem;
}

// ── Stable obstacle check (U7) ──
// Pattern is only stable when confirmed 3+ times
// Records a user-rejected observation — reduces future confidence on that obstacle type
function recordCorrection(mem, type, category = "\u03ac\u03bb\u03bb\u03bf") {
  const obstacles = mem.obstacles.map(o => ({ ...o }));
  const o = obstacles.find(x => x.type === type);
  if (o) o.corrections = (o.corrections || 0) + 1;
  return { ...mem, obstacles };
}

function getStableObstacle(mem, category) {
  return mem.obstacles.find(o =>
    o.category === category && o.stable && o.corrections < o.confirmedCount
  ) || null;
}

// ── Open anchors ──
function getOpenAnchors(mem) {
  return mem.anchors.filter(a => a.status === "open");
}

// ── Export (readable, no content) ──
function exportMemory(mem) {
  const data = {
    exportedAt: new Date().toISOString(),
    note: "AURA progress memory — behavioral trajectories only, no conversation content.",
    trajectories: mem.trajectories.map(t => ({
      category: t.category,
      sessions: t.sessions, thinkingQuality: t.thinkingQuality,
      resolved: t.resolved,
      firstSeen: new Date(t.firstSeen).toLocaleDateString(),
    })),
    decisions: mem.anchors.map(a => ({
      text: a.text, status: a.status,
      category: a.category,
      createdAt: new Date(a.createdAt).toLocaleDateString(),
      outcome: a.outcome || null,
    })),
    sessionCount: mem.sessionCount,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "aura_progress.json"; a.click();
  URL.revokeObjectURL(url);
}

// ── Session context builder ──
// Injects minimal relevant memory into system prompt (no facts, only trajectory signals)
function buildMemoryContext(mem, category) {
  if (!mem.storageEnabled) return "";
  const traj = mem.trajectories.find(t => t.category === category);
  const obstacle = getStableObstacle(mem, category);
  const openAnchor = mem.anchors.find(a => a.status === "open" && a.category === category);
  const parts = [];
  if (openAnchor) parts.push(`Open decision from previous session: "${openAnchor.text}"`);
  if (traj && traj.sessions >= 2) parts.push(`User has returned to this category ${traj.sessions} times.`);
  if (obstacle) parts.push(`Recurring obstacle (confirmed ${obstacle.confirmedCount}x): ${obstacle.type}.`);
  return parts.length > 0
    ? "\n\n[MEMORY CONTEXT — do not reveal to user, use to inform tone and questions only]\n" + parts.join("\n")
    : "";
}

// ─────────────────────────────────────────────
// DOMAIN DETECTION (lightweight keyword heuristic)
// ─────────────────────────────────────────────

function detectDomain(text) {
  const t = text.toLowerCase();
  if (/(job|career|work|boss|salary|promotion|resign|quit|δουλειά|καριέρα|παραίτηση|μισθός|προαγωγή)/.test(t)) return "επαγγελματικά";
  if (/(relationship|partner|marriage|divorce|breakup|σχέσ\w*|γάμο\w*|χωρισμ\w*|χωρίζ\w*|σύντροφ\w*)/.test(t)) return "σχεσιακά";
  if (/(money|invest|debt|savings|loan|οικονομικ|χρήμα|χρέος|επένδυση|αποταμίευση)/.test(t)) return "οικονομικά";
  if (/(health|doctor|diagnosis|medication|diet|υγεία|γιατρός|διάγνωση|φάρμακ|δίαιτα)/.test(t)) return "υγεία";
  return "προσωπικά";
}

// ─────────────────────────────────────────────
// CLIENT-SIDE PATTERN DETECTION
// ─────────────────────────────────────────────

function detectPattern(messages) {
  const userMsgs = messages.filter(m => m.role === "user");
  if (userMsgs.length < 3) return { type: "NEW", confidence: 0 };

  const last  = userMsgs[userMsgs.length - 1]?.content || "";
  const prev  = userMsgs[userMsgs.length - 2]?.content || "";
  const older = userMsgs[userMsgs.length - 3]?.content || "";

  const decisionPhrases = [
    /i (already |kind of |basically |)know/i, /part of me knows/i,
    /i keep coming back/i, /i know i should/i, /i've known/i,
    /the answer (is|seems) (clear|already)/i,
    /i just (can't|don't want to) (admit|accept|face)/i,
    /ξέρω (ήδη|ότι πρέπει)/i, /μέρος μου ξέρει/i,
  ];
  if (decisionPhrases.some(p => p.test(last)))
    return { type: "DECISION_PRESENT", confidence: 0.9 };

  const words = s => new Set(s.toLowerCase().match(/\b\w{5,}\b/g) || []);
  const a = words(last), b = words(prev), c = words(older);
  const sim1 = [...a].filter(w => b.has(w)).length / Math.max(a.size, b.size, 1);
  const sim2 = [...a].filter(w => c.has(w)).length / Math.max(a.size, c.size, 1);
  if (sim1 > 0.4 && sim2 > 0.3) return { type: "REPETITION", confidence: 0.85 };
  if (sim1 > 0.35) return { type: "REPETITION", confidence: 0.6 };

  const avoidWords   = /but (also|what about|then again|however)|on the other hand|alternatively|another option|also consider|αλλά (και|τι γίνεται με)|από την άλλη/i;
  const convergeWords = /i('ve| have) decided|i('m| am) going to|i will|my choice is|αποφάσισα|θα κάνω/i;
  if (avoidWords.test(last) && !convergeWords.test(last) && userMsgs.length >= 4)
    return { type: "AVOIDANCE", confidence: 0.7 };

  // RT-12: additive check for repeated one-word/short non-answers (e.g. "ναι"/"όχι"/"δεν ξέρω"),
  // which the 5+-char similarity check above can never see. Does not alter existing matching —
  // only catches a pattern that previously matched nothing.
  const shortNonAnswer = /^(ναι|όχι|ίσως|δεν ξέρω|δκ|ok|sure|maybe|i don'?t know|idk)\.?$/i;
  if (shortNonAnswer.test(last.trim()) && shortNonAnswer.test(prev.trim()) && shortNonAnswer.test(older.trim()))
    return { type: "AVOIDANCE", confidence: 0.7 };

  return { type: "NEW", confidence: 0 };
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

// A5: friendly, tone-consistent error messages — no raw status codes shown to user
function friendlyApiError(status) {
  if (status === 429 || status === 529) return "Κάτι δεν λειτούργησε. Δοκίμασε ξανά σε λίγο.";
  if (status >= 500) return "Κάτι δεν λειτούργησε. Δοκίμασε ξανά σε λίγο.";
  return "Κάτι δεν λειτούργησε. Δοκίμασε ξανά.";
}

// Concurrent-call guard — prevents two callAura calls in-flight simultaneously
let _activeCall = false;

async function callAura(messages, systemPrompt, retries = 1) {
  if (_activeCall && retries === 1) {
    throw new Error("Κάτι δεν λειτούργησε. Δοκίμασε ξανά.");
  }
  // FIX 1: AbortController — 30s timeout for mobile network stalls
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 26000);
  _activeCall = true;
  try {
    const res = await fetch("/api/aura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      if (retries > 0 && (res.status === 429 || res.status >= 500)) {
        await new Promise(r => setTimeout(r, 600));
        return callAura(messages, systemPrompt, retries - 1);
      }
      throw new Error(friendlyApiError(res.status));
    }
    const data = await res.json();
    return data.content?.map(b => b.text || "").join("") || "";
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Η σύνδεση έληξε. Έλεγξε το δίκτυό σου και δοκίμασε ξανά.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    _activeCall = false;
  }
}


// ─────────────────────────────────────────────
// MESSAGE BUBBLE (A1: memoized — avoids re-render of entire history on new message)
// ─────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({ msg, onMisfire }) {
  const isUser        = msg.role === "user";
  const isInsight     = msg.isInsight;
  const isTermination = msg.isTermination;
  const isSafe        = msg.msgMode === "SUPPORTIVE";
  const isObs         = (msg.msgMode === "AUDIT" || msg.msgMode === "COMPRESSION") && !isInsight && !isTermination;
  const isSnapshot    = !isInsight && !isUser && (
    /αυτό που (φαίνεται πιο )?ξεκάθαρ\w*/i.test(msg.content) &&
    /παραμένει (ανοιχτό|αναπάντητο|ασαφές)/i.test(msg.content)
  );
  const isExplo       = msg.msgMode === "EXPLORATION";

  return (
    <div className={`turn ${isUser ? "turn-user" : "turn-aura"}`}>
      {!isUser && <div className="msg-label">aura</div>}
      <div className={isUser ? "msg-user" : `msg-aura ${isObs ? "obs" : ""} ${isInsight ? "ins" : ""} ${isTermination ? "term" : ""} ${isSafe ? "safe" : ""} ${isExplo ? "expl" : ""} ${isSnapshot ? "snapshot-msg" : ""}`}>
        {msg.content.split("\n").map((line, j, arr) => (
          <span key={j}>{line}{j < arr.length-1 && <br/>}</span>
        ))}
      </div>
      {isInsight           && <div className="msg-badge compress"><span style={{width:3,height:3,borderRadius:"50%",background:"var(--gold)",display:"inline-block"}}/>συμπίεση</div>}
      {isSnapshot          && <div className="msg-badge snapshot"><span style={{width:3,height:3,borderRadius:"50%",background:"#7a8a7a",display:"inline-block"}}/>διαύγεια</div>}
      {msg.isExploration   && <div className="msg-badge" style={{color:"#5a5a7a"}}><span style={{width:3,height:3,borderRadius:"50%",background:"#7a7aaa",display:"inline-block"}}/>εξερεύνηση μοτίβου</div>}
      {isTermination && <div className="msg-badge term"><span style={{width:3,height:3,borderRadius:"50%",background:"#555",display:"inline-block"}}/>τέλος ανάλυσης</div>}
      {isSafe        && <div className="msg-badge safe"><span style={{width:3,height:3,borderRadius:"50%",background:"var(--red)",display:"inline-block"}}/>υποστήριξη</div>}
      {!isUser && isObs && !isInsight && (
        <button className="misfire-btn" onClick={onMisfire}>
          αυτό δεν ισχύει →
        </button>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function AURAv2() {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [mode, setMode]                 = useState("ANSWER");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [introShown, setIntroShown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // First-Why protocol
  const [firstWhyPending, setFirstWhyPending] = useState(false);
  const [firstWhyMessage, setFirstWhyMessage] = useState("");
  const [activeLens, setActiveLens]           = useState("SIMPLIFY"); // SIMPLIFY | CHALLENGE | PERSPECTIVE | EXPLORE — never revealed
  const [sessionEnded, setSessionEnded] = useState(false);
  const [safetyMode, setSafetyMode]     = useState(false); // disables termination when active

  // Compression / pivot gate
  const [pivotPending, setPivotPending]         = useState(false);
  const [pivotType, setPivotType]               = useState(null);
  const [layerGatePending, setLayerGatePending] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState(null);

  // Pre-termination warning
  const [warningPending, setWarningPending] = useState(false);

  // Memory
  const [memory, setMemory]                       = useState(() => loadMemory());
  const [memoryPromptPending, setMemoryPromptPending] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel]     = useState(false);

  // Observation misfire — user rejected an observation
  const [misfirePending, setMisfirePending]   = useState(false);
  const [misfireType, setMisfireType]         = useState(null);

  // ── Visual & Closing System (presentation layer only) ──
  const [claritySurge, setClaritySurge]   = useState(false); // brief pulse on clarity moment
  const [illumLevel, setIllumLevel]       = useState(0);     // 0-11 letters lit, progressive
  const [finalDistillation, setFinalDistillation] = useState(null); // "To the point of mind" sentence
  const recentSurges = useRef([]); // timestamps — red-team safety: suppress if too frequent

  // Red-team safety: trigger a clarity surge only if not over-frequent (max 2 per 60s)
  const triggerClaritySurge = useCallback(() => {
    const now = Date.now();
    recentSurges.current = recentSurges.current.filter(t => now - t < 60000);
    if (recentSurges.current.length >= 2) return; // auto-suppress — becoming predictable
    recentSurges.current.push(now);
    setClaritySurge(true);
    setTimeout(() => setClaritySurge(false), 900);
  }, []);

  // Domain detection for current session
  const [currentDomain, setCurrentDomain] = useState("άλλο");

  const turnCount          = useRef(0);
  const clarificationRound = useRef(0); // tracks clarification depth — max 3
  const lastChallengeAt  = useRef(-99);
  const compressionCount = useRef(0);
  const warningIssued    = useRef(false);
  const submittingRef    = useRef(false); // RT-15: synchronous double-submit guard
  const currentSessionId   = useRef(Date.now().toString(36)); // unique id per session
  const sessionStartTime   = useRef(Date.now()); // beta: session duration tracking
  const betaFlags          = useRef({ firstWhyPassed: false, firstWhySkipped: false,
    clarificationReached: false, terminationReached: false, snapshotShown: false }); // beta observability

  // First "To the point of mind" ever shown — slightly slower fade, no other change
  const [isFirstDistillation, setIsFirstDistillation] = useState(false);

  const bottomRef        = useRef(null);
  const textareaRef      = useRef(null);
  const startListening = useCallback(() => { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return; const r = new SR(); r.lang="el-GR"; r.continuous=false; r.interimResults=false; r.onstart=()=>setIsListening(true); r.onresult=(e)=>{const t=e.results[0][0].transcript;setInput(prev=>prev?prev+" "+t:t);}; r.onend=()=>setIsListening(false); r.onerror=()=>setIsListening(false); recognitionRef.current=r; r.start(); }, []);
  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  useEffect(() => {
    // FIX 4: block:"end" is more reliable than smooth on iOS Safari
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, pivotPending, layerGatePending, memoryPromptPending, warningPending, misfirePending, firstWhyPending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  // ── Generate response ──
  const generateResponse = useCallback(async (msgs, currentMode) => {
    // Context Refresh: reinject core identity reminder every 10 messages
    const msgCount = msgs.filter(m => m.role === 'user').length;
    const contextRefresh = msgCount > 0 && msgCount % 10 === 0
      ? [{ role: 'user', content: '[SYSTEM CONTEXT REFRESH: You are AURA, a Cognitive Instrument. Your core rules remain active: No advice, no validation, no empathy performance, ≤50 words target, Clarity First. Continue session.]' },
         { role: 'assistant', content: 'Understood. Continuing.' }]
      : [];
    setLoading(true);
    const _loadingGuard = setTimeout(() => { setLoading(false); setError("Διακοπή σύνδεσης. Η συνεδρία μπορεί να συνεχιστεί."); }, 30000);
    try {
      // Track clarification rounds — force answer after 3 rounds
      if (currentMode !== "COMPRESSION" && currentMode !== "SUPPORTIVE") {
        clarificationRound.current += 1;
      betaFlags.current.clarificationReached = true; // beta: clarification stage reached
      }
      // U1/U3: Build memory context for current category (injected silently, never shown)
      const memCtx = buildMemoryContext(memory, currentDomain);
      if (memCtx) setIllumLevel(prev => Math.min(11, prev + 1));

      // ── Silent Profile injection ──
      const profileSummary = getProfileSummary(memory);
      const profileCtx = profileSummary ? profileSummary + HONEST_UNCERTAINTY_RULE : '';

      // ── Explicit Pause injection (#5 fix) ──
      // Max 1 per 5 sessions. Injected as system instruction — AURA decides when to use it naturally.
      const explicitPauseCtx = canUseExplicitPause(memory) && currentMode === "ANSWER" &&
        msgs.filter(m => m.role === "user").length >= 3 ?
        `\n[EXPLICIT PAUSE AVAILABLE — optional, use at most once this session if conversation has reached a natural reflection point: briefly pause topic, ask one question about HOW the user prefers to search for clarity (e.g. "Έχω μια απορία για τον τρόπο που ψάχνεις — όχι για το θέμα σου. Προτιμάς να φτάσουμε σε μια απόφαση ή να καταλάβεις γιατί κολλάς;"), then return naturally to session. Never announce it as a special feature.]\n` : '';

      const basePrompt =
        currentMode === "COMPRESSION" ? SYSTEM_COMPRESSION :
        currentMode === "SUPPORTIVE"  ? SYSTEM_SUPPORTIVE :
        getLensPrompt(activeLens);
      const system = [basePrompt, memCtx, profileCtx, explicitPauseCtx].filter(Boolean).join('\n');
      const text = await callAura([...contextRefresh, ...msgs], system);

      // If explicit pause was used, record it
      if (explicitPauseCtx && /(τρόπο που ψάχνεις|προτιμάς να φτάσουμε|απόφαση ή να καταλάβεις)/i.test(text)) {
        const updatedPause = recordExplicitPauseUsed({ ...memory });
        setMemory(updatedPause);
        if (memory.storageEnabled) saveMemory(updatedPause);
      }

      // ── Passive signal tracking ──
      const lastUserMsg = [...msgs].reverse().find(m => m.role === "user")?.content || "";
      const signals = {};
      signals.messageLength = lastUserMsg.length;
      signals.usedFeelVsThink =
        /(νιώθω|αισθάνομαι|feel|felt)/i.test(lastUserMsg) ? 'feel' :
        /(σκέφτομαι|αναλύω|think|analyze|consider)/i.test(lastUserMsg) ? 'think' : undefined;
      signals.soughtValidation = /(έχω δίκιο|σωστά;|τι πιστεύεις;|πες μου αν)/i.test(lastUserMsg);
      signals.returnedToSameTheme = msgs.filter(m => m.role === "user").length > 3 &&
        /(ξανά|πάλι|again|still|ακόμα)/i.test(lastUserMsg);

      // Embedded diagnostic: detect pace/orientation answers naturally
      if (/(γρήγορα|σύντομα|quickly|fast)/i.test(lastUserMsg)) signals.paceChoice = 25;
      else if (/(ξεδιπλώσουμε|αναλύσουμε|unfold|slowly|βαθύτερα)/i.test(lastUserMsg)) signals.paceChoice = 75;
      if (/(πρόβλημα|εμπόδιο|problem|obstacle)/i.test(lastUserMsg)) signals.orientationChoice = 25;
      else if (/(θέλω|στόχος|goal|vision|αποτέλεσμα)/i.test(lastUserMsg)) signals.orientationChoice = 75;

      // Metaphor detection
      if (/(ανακούφιση|relief)/i.test(lastUserMsg)) signals.metaphorChoice = { question: 'relief_vs_excitement', answer: 'relief' };
      else if (/(ενθουσιασμός|excitement)/i.test(lastUserMsg)) signals.metaphorChoice = { question: 'relief_vs_excitement', answer: 'excitement' };

      // Crisis mode: bypass profiling (separate from Safety which handles UI/flow)
      const crisisFired = detectCrisisMode(lastUserMsg);
      // Shadow Trigger: behavior deviates >30% from profile
      const shadowFired = !crisisFired && detectShadowTrigger(memory, signals);

      if (!shadowFired && !crisisFired) {
        const updatedWithProfile = updateProfile({ ...memory }, signals);
        setMemory(updatedWithProfile);
        if (memory.storageEnabled) saveMemory(updatedWithProfile);
      } else if (shadowFired) {
        // Record shadow fired — resets auto-resume counter
        const updatedWithShadow = recordShadowFired({ ...memory });
        setMemory(updatedWithShadow);
        if (memory.storageEnabled) saveMemory(updatedWithShadow);
      }

      if (currentMode === "COMPRESSION") {
        compressionCount.current += 1;
        // C13: Re-evaluate lens after compression (major topic shift or loop confirmed)
        // BUG 2.2 fix: use msgs (current call's full context) instead of stale `messages` closure
        if (msgs.length > 0) {
          const allUserText = msgs.filter(m => m.role === "user").map(m => m.content).join(" ");
          const freshLens = inferLensFallback(allUserText, "");
          setActiveLens(freshLens);
        }
      }

      setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: currentMode }]);

      // ── Visual: clarity moment detection (presentation layer only) ──
      // A clarity moment = Clarity Snapshot pattern OR compression resolution
      const hasSnapshot = /αυτό που φαίνεται πιο ξεκάθαρο/i.test(text) && /παραμένει ανοιχτό/i.test(text);
      if (hasSnapshot || currentMode === "COMPRESSION") {
        triggerClaritySurge(); // red-team safe: auto-suppresses if over-frequent
        setIllumLevel(prev => Math.min(11, prev + 1)); // one segment per clarity event, never per message
      }

      // U5,U6: Record thinking quality signal (heuristic — no content stored)
      // A3: only on "final" turns — skip intermediate clarification-question responses,
      // so the trajectory reflects user thinking quality, not AURA's own questions.
      const looksLikeClarificationQuestion =
        currentMode !== "COMPRESSION" &&
        clarificationRound.current <= 2 &&
        /\?\s*$/.test(text.trim()) &&
        /^\s*1[\.\)]/m.test(text); // numbered-list clarification pattern
      if (memory.storageEnabled && currentMode !== "SUPPORTIVE" && msgs.length > 0 && !looksLikeClarificationQuestion) {
        const lastUser = [...msgs].reverse().find(m => m.role === "user")?.content || "";
        // Thinking quality heuristic: structured framing = higher quality
        const hasStructure = /(option|trade.?off|on one hand|on the other|επιλογή|αντί|από τη μία|από την άλλη)/i.test(lastUser);
        const isReactive   = /(tell me what|just tell|απλά πες|πες μου τι)/i.test(lastUser);
        const thinkingLevel = isReactive ? 1 : hasStructure ? 4 : 2;
        // Clarity gain: did AURA compress or identify the core issue?
        const clarityGain  = /(the core|the real question|what remains|αυτό που μένει|η ουσία)/i.test(text);
        if (clarityGain) betaFlags.current.snapshotShown = true; // beta: clarity snapshot signal
        const sessionDuration = Math.round((Date.now() - sessionStartTime.current) / 1000); // seconds
        const updatedMem = recordQualitySignal({ ...memory }, currentDomain, thinkingLevel, clarityGain, currentSessionId.current, sessionDuration, { ...betaFlags.current });
        const updatedWithTraj = recordTrajectory(updatedMem, currentDomain, thinkingLevel, null);
        setMemory(updatedWithTraj);
        if (memory.storageEnabled) saveMemory(updatedWithTraj);
      }

      // Termination logic — only if not in safety mode and warning was already issued
      // FIX 3: broader termination signal detection — catches equivalent phrasings
      const modelSignalsEnd = /(action belongs to (you|the user)|we.ve reached the limit|the decision is yours|continuing.{0,30}(not|won.t) (help|serve)|η απόφαση (είναι|ανήκει) (δική σου|σε σένα)|έχουμε (φτάσει|αρκετή|αρκετό)|συνεχίζοντας.{0,30}δεν (βοηθ|εξυπηρετ))/i.test(text);
      // C12: safetyMode can be exited if user explicitly requests decision help
    if (!safetyMode && (compressionCount.current >= 2 || modelSignalsEnd)) {
        if (!warningIssued.current) {
          setWarningPending(true);
          warningIssued.current = true;
        } else {
          await triggerTermination(msgs);
        }
      }
    } catch(e) {
      setError(e.message);
    } finally {
      clearTimeout(_loadingGuard);
      setLoading(false); // guaranteed cleanup — without this, callAura throw left loading=true permanently
    }
  }, [safetyMode, memory, currentDomain, activeLens]);
  // First-time-only progressive illumination — same end state (illumLevel=11),
  // but reaches it over ~1.5s instead of instantly, exactly once per install.
  // No new content, no new UI, no protocol change — only how fast an existing
  // visual reaches its existing end state, the very first time it happens.
  const illuminAnimCancelled = useRef(false); // cancels progressive animation on reset

  const applyTerminationIllumination = useCallback(() => {
    let seen = false;
    try { seen = !!localStorage.getItem("aura_first_distillation_seen"); } catch {}
    if (seen) {
      setIllumLevel(11);
      setIsFirstDistillation(false);
      return;
    }
    setIsFirstDistillation(true);
    try { localStorage.setItem("aura_first_distillation_seen", "1"); } catch {}
    // Animate 0 -> 11 over ~1.5s (11 steps, ~135ms apart)
    // illuminAnimCancelled.current is reset to false here and set to true on resetSession
    illuminAnimCancelled.current = false;
    let level = 0;
    const step = () => {
      if (illuminAnimCancelled.current) return; // cancelled by resetSession
      level += 1;
      setIllumLevel(level);
      if (level < 11) setTimeout(step, 135);
    };
    setTimeout(step, 135);
  }, []);

  const triggerTermination = useCallback(async (msgs) => {
    if (safetyMode) return;
    setLoading(true);
    try {
      // Use graceful exit if no insight was confirmed during session
      const hasConfirmedInsight = msgs.some(m => m.role === "assistant" && m.isInsight);
      const activePrompt = hasConfirmedInsight ? SYSTEM_TERMINATION : SYSTEM_GRACEFUL_EXIT;
      const termMsgs = [...msgs, {
        role: "user",
        content: hasConfirmedInsight
          ? "[Deliver the termination message now. Include the closure reflection task. Do not add anything else.]"
          : "[Deliver the graceful exit message now. Verbatim only. Do not interpret.]"
      }];
      const text = await callAura(termMsgs, activePrompt);
      setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: "TERMINATION", isTermination: true }]);
      setSessionEnded(true);
      betaFlags.current.terminationReached = true; // beta: natural termination reached
      // Visual: session end — full illumination + distilled closing line
      applyTerminationIllumination();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) setFinalDistillation(lines[0]);
    } catch {
      const fallback = "Έχουμε αρκετή καθαρότητα για τώρα.\n\nΑν συνεχίσουμε, υπάρχει κίνδυνος να αντικαταστήσουμε την απόφαση με περισσότερη σκέψη.\n\nΔεν θέλω να συμβάλω σε αυτό.\n\n—\n\nΠριν επιστρέψεις, γράψε για τον εαυτό σου το πιο ισχυρό επιχείρημα υπέρ και εναντίον. Επίστρεψε μόνο αν κάτι αλλάξει.";
      setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: fallback, msgMode: "TERMINATION", isTermination: true }]);
      setSessionEnded(true);
      applyTerminationIllumination();
      setFinalDistillation("Έχουμε αρκετή καθαρότητα για τώρα.");
    } finally {
      setLoading(false);
    }
  }, [safetyMode, applyTerminationIllumination]);

  // ── Misfire recovery — user rejected observation ──
  const handleMisfireResponse = useCallback(async (userCorrection) => {
    setMisfirePending(false);
    // Record correction in memory
    if (memory.storageEnabled) {
      const updated = recordCorrection({ ...memory }, misfireType);
      setMemory(updated);
      saveMemory(updated);
    }
    // Generate recovery response
    const correctionMsgs = [
      ...messages,
      { role: "user", content: userCorrection || "[User indicated the observation was inaccurate. Apply misfire recovery protocol.]" }
    ];
    const recoveryPrompt = SYSTEM_AUDIT + `\n\nMISFIRE RECOVERY: The user has indicated your previous observation was inaccurate or incomplete. Your response must begin with: "Understood. My interpretation appears incomplete." Then ask: "What am I missing that changes the picture?" Do not repeat the original observation.`;
    setLoading(true);
    try {
      const text = await callAura(correctionMsgs, recoveryPrompt);
      setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: "AUDIT" }]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
    setMisfireType(null);
  }, [messages, memory, misfireType]);

  // ── Layer gate ──
  const handleLayerChoice = useCallback(async (choice) => {
    if (!pendingUserMessage) return;
    const msgs = [...messages, { role: "user", content: pendingUserMessage }];
    setLayerGatePending(false);
    setPendingUserMessage(null);
    if (choice === "continue") {
      await generateResponse(msgs, "ANSWER");
    } else {
      setMode("AUDIT");
      await generateResponse(msgs, "AUDIT");
    }
  }, [pendingUserMessage, messages, generateResponse]);

  // ── Compression choice ──
  const handlePivotChoice = useCallback(async (accept) => {
    setPivotPending(false);
    lastChallengeAt.current = turnCount.current;

    if (accept) {
      const userMsgs   = messages.filter(m => m.role === "user");
      const ctxSummary = userMsgs.slice(-3).map(m => m.content).join(" / ");
      const pivotMsgs  = [
        ...messages,
        { role: "user", content: `[Signal: ${pivotType}. Context: ${ctxSummary}. Apply Compression. Surface friction. Do not diagnose or pressure.]` }
      ];
      setLoading(true);
      try {
        const text = await callAura(pivotMsgs, SYSTEM_COMPRESSION);
        setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: "COMPRESSION", isInsight: true }]);
        // BUG 7: compressionCount incremented in generateResponse only — removed duplicate here
        // Visual: compression acceptance is a clarity moment
        triggerClaritySurge();
        setIllumLevel(prev => Math.min(11, prev + 1));

        // U7: Record obstacle — stability requires 3+ confirmations before RCI
        const obstacleType = pivotType === "REPETITION" ? "avoidance"
          : pivotType === "AVOIDANCE" ? "certainty_seeking"
          : pivotType === "DECISION_PRESENT" ? "fear_of_commitment"
          : null;
        let updatedMem = recordTrajectory({ ...memory }, currentDomain, 2, obstacleType);

        // Check if stable obstacle exists (3+ confirmations) — offer memory consent
        const stableObs = getStableObstacle(updatedMem, currentDomain);
        if (!memory.storageEnabled && stableObs) {
          setMemory(updatedMem);
          // BUG 11: do not saveMemory before user grants consent
          setMemoryPromptPending(true);
        } else {
          setMemory(updatedMem);
          if (memory.storageEnabled) saveMemory(updatedMem);
        }
      } catch(e) { setError(e.message); }
      finally { setLoading(false); }
    } else {
      await generateResponse(messages, mode);
    }
  }, [messages, mode, pivotType, memory, generateResponse]);

  // ── Memory consent ──
  const handleMemoryChoice = useCallback((accept) => {
    setMemoryPromptPending(false);
    if (accept) {
      const updated = { ...memory, storageEnabled: true };
      setMemory(updated);
      saveMemory(updated);
    }
    // Declined: never ask again this session
  }, [memory]);

  // (correlation gate removed in earlier patch — no longer referenced)

  // ── Anchor close ──
  const closeAnchorHandler = useCallback((id, status) => {
    const updated = closeAnchor({ ...memory }, id, status);
    setMemory(updated);
    if (memory.storageEnabled) saveMemory(updated);
  }, [memory]);

  // ── Warning: pre-termination ──
  const handleWarningChoice = useCallback(async (continueSession) => {
    setWarningPending(false);
    if (continueSession) {
      // One final pass from a different angle — reset compression count
      compressionCount.current = 0;
      warningIssued.current = false;  // RT-05: allow a fair second warning before next termination
      const finalMsgs = [...messages, {
        role: "user",
        content: "[Final compression pass. Try a genuinely different angle before any termination consideration.]"
      }];
      await generateResponse(finalMsgs, "COMPRESSION");
    } else {
      await triggerTermination(messages);
    }
  }, [messages, generateResponse, triggerTermination]);

  // ── Main submit ──
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || loading || sessionEnded || submittingRef.current) return;
    submittingRef.current = true; // RT-15: close same-tick double-invocation window
    try {
    const userText = input.trim();
    setInput("");
    setError(null);

    // Safety check — gradient response (C8)
    const safetySignal = detectSafetySignal(userText);
    if (safetySignal === "CRISIS") {
      // Level 3: full safety mode, supportive only
      setSafetyMode(true);
      setFirstWhyPending(false);  // BUG 6: clear pending state on safety override
      setCurrentDomain(detectDomain(userText));  // RT-02: symmetric with DISTRESS branch
      const safeMsgs = [...messages, { id: nextMsgId(), role: "user", content: userText }];
      setMessages(safeMsgs);
      turnCount.current += 1;
      await generateResponse(safeMsgs, "SUPPORTIVE");
      return;
    }
    if (safetySignal === "DISTRESS") {
      // Level 2: gentle clarity — skip First-WHY, softer tone, user still gets help
      setFirstWhyPending(false);  // BUG 6: clear pending state on safety override
      const distressMsgs = [...messages, { id: nextMsgId(), role: "user", content: userText }];
      setMessages(distressMsgs);
      turnCount.current += 1;
      setCurrentDomain(detectDomain(userText));  // BUG 9: set domain in distress path
      // Inject distress context into normal flow — lens defaults to SIMPLIFY/PERSPECTIVE
      setActiveLens("PERSPECTIVE");
      await generateResponse(distressMsgs, mode);
      return;
    }

    // First-Why trigger — only on first message of a new session
    if (messages.length === 0 && !firstWhyPending && needsFirstWhy(userText)) {
      setFirstWhyMessage(userText);
      setMessages([{ id: nextMsgId(), role: "user", content: userText }]);
      setFirstWhyPending(true);
      return;
    }

    // First-Why answer received — infer lens, then proceed
    if (firstWhyPending) {
      setFirstWhyPending(false);
      // R2: graceful exit if user explicitly refuses First-WHY compression
      // Does not make First-WHY optional — only handles explicit refusals.
      // Refusal patterns: direct negation, skip requests, unrelated meta-responses.
      const firstWhyRefusal = /^(δεν θέλω|δεν ξέρω πώς|skip|παράλειψε|απλά απάντα|απλά απάντησε|προχώρα|συνέχισε|pass|no thanks|never mind)[\.!;,]?$/i.test(userText.trim());
      if (firstWhyRefusal) betaFlags.current.firstWhySkipped = true;
      else betaFlags.current.firstWhyPassed = true;
      const inferred = inferLensFallback(firstWhyMessage, firstWhyRefusal ? firstWhyMessage : userText);
      setActiveLens(inferred);
      const initMsgs = [
        { id: nextMsgId(), role: "user", content: firstWhyMessage },
        { id: nextMsgId(), role: "assistant", content: "Γιατί έχει σημασία αυτό για σένα;" },
        { id: nextMsgId(), role: "user", content: userText },
      ];
      setMessages(initMsgs);
      turnCount.current += 1;
      setLoading(true);
      try {
        // U1/U3: Inject memory context for this category
        const memCtx = buildMemoryContext(memory, currentDomain);
        // #10 fix: inject profile summary in firstWhy path too
        const profileCtx = getProfileSummary(memory);
        const profileWithRules = profileCtx ? profileCtx + HONEST_UNCERTAINTY_RULE : '';
        const prompt = [getLensPrompt(inferred), memCtx, profileWithRules].filter(Boolean).join('\n');
        const text = await callAura(initMsgs, prompt);
        setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: "ANSWER" }]);
        // U1: Start trajectory for this category
        if (memory.storageEnabled) {
          const updated = recordTrajectory({ ...memory }, currentDomain, 2, null);
          setMemory(updated);
          saveMemory(updated);
        }
      } catch(e) { setError(e.message); }
      finally { setLoading(false); }
      return;
    }

    const nextMsgs  = [...messages, { id: nextMsgId(), role: "user", content: userText }];
    const pattern   = detectPattern(nextMsgs);
    const domain    = detectDomain(userText);
    // B2: new topic/category — compression history doesn't carry over
    if (domain !== currentDomain && currentDomain !== "\u03ac\u03bb\u03bb\u03bf") {
      compressionCount.current = 0;
      warningIssued.current = false;
    }
    setCurrentDomain(domain);
    const turn     = turnCount.current + 1;

    // Layer gate
    const offerGate =
      mode === "ANSWER" && turn >= 4 &&
      (pattern.type === "REPETITION" || pattern.type === "AVOIDANCE") &&
      pattern.confidence > 0.6 &&
      (turn - lastChallengeAt.current) >= 4;

    if (offerGate) {
      lastChallengeAt.current = turn;
      setPendingUserMessage(userText);
      setMessages(nextMsgs);
      turnCount.current += 1;
      setLayerGatePending(true);
      return;
    }

    setMessages(nextMsgs);
    turnCount.current += 1;

    // Compression offer — U4: only when confidence is high
    // RCI raised threshold: requires strong signal (confidence > 0.75) (U4)
    const offerPivot =
      mode === "AUDIT" && turn >= 4 &&
      (turn - lastChallengeAt.current) >= 3 &&
      (pattern.type === "REPETITION" || pattern.type === "AVOIDANCE" || pattern.type === "DECISION_PRESENT") &&
      pattern.confidence > 0.75;

    if (offerPivot) {
      setPivotPending(true);
      setPivotType(pattern.type);
      return;
    }

    await generateResponse(nextMsgs, mode);
    } finally {
      submittingRef.current = false; // RT-15: release guard regardless of which path returned
    }
  }, [input, loading, sessionEnded, messages, mode, generateResponse]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setIntroShown(false);
    const updated = { ...memory, sessionCount: (memory.sessionCount || 0) + 1 };
    if (memory.storageEnabled) saveMemory(updated);
    setMemory(updated);
    setMessages([]);
    setInput("");
    setMode("ANSWER");
    setSessionEnded(false);
    setIsFirstDistillation(false);
    setSafetyMode(false);
    setPivotPending(false);
    setLayerGatePending(false);
    setPendingUserMessage(null);
    setMemoryPromptPending(false);
    setWarningPending(false);
    setMisfirePending(false);
    setCurrentDomain("άλλο");
    setFirstWhyPending(false);
    setFirstWhyMessage("");
    setActiveLens("SIMPLIFY");
    turnCount.current = 0;
    currentSessionId.current = Date.now().toString(36); // new id for new session
    sessionStartTime.current = Date.now(); // reset duration timer
    betaFlags.current = { firstWhyPassed: false, firstWhySkipped: false,
      clarificationReached: false, terminationReached: false, snapshotShown: false };
    clarificationRound.current = 0;
    lastChallengeAt.current = -99;
    compressionCount.current = 0;
    warningIssued.current = false;
    setError(null);
    // Reset visual & closing system
    setClaritySurge(false);
    setIllumLevel(0);
    setIsFirstDistillation(false);
    setFinalDistillation(null);
    recentSurges.current = [];
    illuminAnimCancelled.current = true; // cancel any in-progress progressive illumination
  };

  const openAnchors = getOpenAnchors(memory);
  const isFirst = messages.length === 0 && !layerGatePending && !pivotPending && !firstWhyPending;
  // Return session: user has open anchor — show it as first thing
  const returnAnchor = isFirst && openAnchors.length > 0 ? openAnchors[0] : null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#080808;--border:#141414;--border-mid:#1e1e1e;
          --text-primary:#dedad2;--text-secondary:#565250;
          --text-dim:#252320;--text-user:#68645e;
          --gold:#c9a84c;--gold-dim:#6b5a28;
          --green:#4a7a4a;--red:#7a4a4a;--red-dim:#3a1a1a;
          --field-base:#0a0a0a;--field-clear:#0f0f0e;
        }
        body{background:var(--bg);color:var(--text-primary);font-family:'DM Mono',monospace}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:.15;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}
        @keyframes goldGlow{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}50%{box-shadow:0 0 16px 1px rgba(201,168,76,.08)}}

        /* ── AURA LIGHT FIELD ── */
        /* State-driven background clarity shift. No gradients-as-decor, no time-based loops. */
        .light-field{
          position:fixed; inset:0; z-index:-1;
          background-image:url('/bg.png');
          background-size:cover;
          background-position:center top;
          background-repeat:no-repeat;
          transition:opacity 1.4s ease;
        }
        .light-field::after{
          content:''; position:absolute; inset:0;
          background:var(--field-base);
          opacity:0.7;
          transition:opacity 1.4s ease;
        }
        .light-field.clear::after{ opacity:0.55; }
        .light-field.surge::after{ opacity:0.8; transition:opacity .35s ease; }

        /* ── VERTICAL IDENTITY: AURA ERGO SUM ── */
        .vertical-identity{
          position:fixed; left:0; top:0; bottom:0; width:48px;
          display:flex; flex-direction:column; align-items:center;
          justify-content:space-evenly; padding:20px 0;
          z-index:51; pointer-events:none;
        }
        .vertical-identity span{
          font-family:'DM Mono',monospace; font-size:20px; font-weight:700;
          color:#c9a84c; opacity:.85; transition:opacity .3s ease;
        }
        .vertical-identity span.lit{ opacity:.85; }
        .vertical-identity span.full{ opacity:1; text-shadow:0 0 10px rgba(201,168,76,.5); }

        /* ── CLOSING SYSTEM: To the point of mind ── */
        .distillation{
          padding:28px 0 8px; margin-top:4px;
          border-top:1px solid var(--border);
          animation:fadeUp 1s ease;
        }
        /* First time only — same fade, slightly slower. No new content, no new register. */
        .distillation.first-time{
          animation:fadeUp 1.8s ease;
        }
        .distillation-label{
          font-size:8px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--text-dim); margin-bottom:10px;
        }
        .distillation-text{
          font-family:'Cormorant Garamond',serif; font-size:21px; font-weight:300;
          font-style:italic; color:#d8d3c8; line-height:1.6;
        }

        .root{height:100vh;height:100dvh;max-width:650px;margin:0 auto;padding:0 18px 0 58px;display:flex;flex-direction:column;position:relative;overflow:hidden}

        /* Header */
        .header{padding:26px 0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}
        .wordmark{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:300;font-style:italic;letter-spacing:.2em;color:#ddd8d0}
        .header-right{display:flex;align-items:center;gap:12px}
        .mode-pill{display:flex;align-items:center;gap:6px;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-secondary)}
        .mode-dot{width:4px;height:4px;border-radius:50%;background:#333;transition:background .5s}
        .mode-dot.obs{background:var(--green);animation:pulse 2.4s ease-in-out infinite}
        .mode-dot.safe{background:var(--red);animation:pulse 1.5s ease-in-out infinite}
        .toggle-btn{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px;cursor:pointer;border-radius:1px;transition:all .2s}
        .toggle-btn.on{color:var(--text-secondary);border-color:var(--border-mid)}
        .toggle-btn:hover{color:var(--text-secondary);border-color:var(--border-mid)}
        .icon-btn{background:none;border:none;color:var(--text-dim);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;padding:3px 6px;cursor:pointer;transition:color .2s}
        .icon-btn:hover{color:var(--text-secondary)}

        /* Anchors */
        .anchor-bar{padding:12px 0;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:7px}
        .anchor-bar-label{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim);margin-bottom:2px}
        .anchor-item{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .anchor-text{font-size:11px;color:var(--text-secondary);line-height:1.5;flex:1}
        .anchor-actions{display:flex;gap:5px;flex-shrink:0}
        .anchor-btn{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;cursor:pointer;border-radius:1px;transition:all .2s;white-space:nowrap}
        .anchor-btn:hover{color:var(--text-secondary);border-color:var(--border-mid)}
        .anchor-btn.done:hover{color:var(--green);border-color:var(--green)}
        .anchor-btn.release:hover{color:#888;border-color:#444}

        /* Memory panel */
        .mem-panel{padding:14px 0;border-bottom:1px solid var(--border);font-size:10px;color:var(--text-dim);line-height:1.8;animation:fadeUp .3s ease}
        .mem-panel-title{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px}
        .mem-panel-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px}
        .mem-panel-actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}

        /* Feed */
        .feed{flex:1;padding:32px 0 18px;display:flex;flex-direction:column;gap:26px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
        .feed.active{padding-top:16px;gap:32px;}
        .feed.active .turn-aura{border-left:1px solid #1e1e1e;padding-left:12px;}
        .feed.active .msg-aura{font-size:13px;line-height:1.9;letter-spacing:.01em;}

        /* Return anchor — outcome awareness (U2) */
        .return-anchor-card{padding:28px 0 20px;animation:fadeUp .6s ease;border-bottom:1px solid var(--border)}
        .return-label{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
        .return-text{font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:6px}
        .return-question{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;font-style:italic;color:#3a3632}

        /* First-Why */
        .first-why-card{padding:32px 0 24px;animation:fadeUp .4s ease}
        .first-why-q{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;font-style:italic;color:#5a5650;line-height:1.5}

        /* Empty */
        .empty{flex:1;display:flex;flex-direction:column;justify-content:center;padding:56px 0;animation:fadeUp .8s ease}
        .empty-headline{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:300;font-style:italic;line-height:1.12;color:#1d1b18;margin-bottom:18px}
        .empty-sub{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);line-height:2.2}
        .empty-hint{font-size:11px;color:var(--text-dim);line-height:1.9;margin-top:20px;font-style:italic;opacity:.6}

        /* Messages */
        .turn{animation:fadeUp .3s ease}
        .turn-user{display:flex;flex-direction:column;align-items:flex-end}
        .turn-aura{display:flex;flex-direction:column;align-items:flex-start}
        .msg-label{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--text-dim);margin-bottom:7px}
        .msg-user{font-size:13px;line-height:1.7;color:var(--text-user);max-width:86%;text-align:right;font-weight:300}
        .msg-aura{font-size:13px;line-height:1.8;color:var(--text-primary);max-width:92%;position:relative;padding-left:14px}
        .msg-aura::before{content:'';position:absolute;left:0;top:4px;width:1px;height:calc(100% - 4px);background:var(--border-mid);transition:background .5s}
        .msg-aura.obs::before{background:var(--green);opacity:.45}
        .msg-aura.ins::before{background:var(--gold);opacity:.65}
        .msg-aura.ins{color:#ddd8cf}
        .msg-aura.term{color:#8a8680;font-style:italic}
        .msg-aura.term::before{background:#333;opacity:.4}
        .msg-aura.safe{color:#b8a8a8}
        .msg-aura.safe::before{background:var(--red);opacity:.35}
        .msg-aura.expl{color:#b8b8d0}
        .msg-aura.expl::before{background:#7a7aaa;opacity:.4}

        .msg-badge{display:inline-flex;align-items:center;gap:5px;font-size:7px;letter-spacing:.18em;text-transform:uppercase;margin-top:7px}
        .msg-badge.compress{color:var(--gold-dim)}
        .msg-badge.snapshot{color:#7a8a7a;letter-spacing:.16em}
        .msg-aura.snapshot-msg::before{background:#7a8a7a;opacity:.5}
        .msg-badge.term{color:#3a3a3a}
        .msg-badge.safe{color:#7a5a5a}
        .misfire-btn{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;cursor:pointer;border-radius:1px;transition:all .2s;margin-top:6px;display:inline-block}
        .misfire-btn:hover{color:var(--text-secondary);border-color:var(--border-mid)}

        /* Choice cards */
        .choice-card{animation:slideIn .35s ease;padding-left:14px}
        .choice-label{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px}
        .choice-prompt{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:300;font-style:italic;color:#8a8680;line-height:1.65;margin-bottom:16px}
        .choice-btns{display:flex;gap:8px;flex-wrap:wrap}
        .choice-btn{background:none;border:1px solid var(--border-mid);color:var(--text-secondary);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:8px 14px;cursor:pointer;border-radius:2px;transition:all .2s}
        .choice-btn:hover{color:var(--text-primary);border-color:#383530}
        .choice-btn.prim{border-color:var(--gold-dim);color:var(--gold-dim)}
        .choice-btn.prim:hover{border-color:var(--gold);color:var(--gold);animation:goldGlow .4s ease}

        /* Warning card */
        .warning-card{animation:slideIn .35s ease;padding-left:14px;border-left:1px solid #3a3a3a}
        .warning-label{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:#3a3a3a;margin-bottom:10px}
        .warning-text{font-size:12px;color:#6a6660;line-height:1.75;margin-bottom:14px}

        /* Memory prompt */
        .mem-card{animation:fadeUp .4s ease;padding-left:14px;border-left:1px solid var(--gold-dim)}
        .mem-label{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-dim);margin-bottom:9px}
        .mem-text{font-size:12px;color:#7a7670;line-height:1.7;margin-bottom:10px}
        .mem-note{font-size:10px;color:var(--text-dim);margin-bottom:14px;letter-spacing:.04em;line-height:1.7}

        /* Typing */
        .typing{padding-left:14px;display:flex;align-items:center;gap:4px;animation:fadeUp .2s ease}
        .t-dot{width:4px;height:4px;border-radius:50%;background:#2a2a2a;animation:pulse 1.2s ease-in-out infinite}
        .t-dot:nth-child(2){animation-delay:.2s}
        .t-dot:nth-child(3){animation-delay:.4s}

        /* Session end */
        .end-wrap{border-top:1px solid var(--border);padding:22px 0;display:flex;flex-direction:column;gap:11px;animation:fadeUp .4s ease}
        .end-label{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim)}
        .end-note{font-size:11px;color:var(--text-dim);letter-spacing:.04em;line-height:1.65;margin-top:2px}
        .new-btn{background:none;border:1px solid var(--border-mid);color:var(--text-secondary);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:8px 14px;cursor:pointer;border-radius:2px;transition:all .2s;align-self:flex-start}
        .new-btn:hover{color:var(--text-primary);border-color:#383530}

        /* Input */
        .input-area{padding:14px 0 env(safe-area-inset-bottom,14px);border-top:1px solid var(--border);border-bottom:none;background:#0a0907;position:sticky;bottom:0;z-index:100;}
        .input-row{display:flex;align-items:flex-end;gap:10px}
        .textarea{flex:1;background:transparent;border:1px solid var(--border-mid);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text-primary);font-family:'DM Mono',monospace;font-size:16px;font-weight:400;line-height:1.9;padding:14px;resize:none;outline:none;min-height:80px;max-height:160px;transition:border-color .2s}
        .textarea::placeholder{color:var(--text-dim)}
        .textarea:focus{border-color:#c9a84c;outline:none}
        .textarea::placeholder{color:#4a4845;font-size:15px}
        .textarea:disabled{opacity:.3;cursor:not-allowed}
        .send-btn{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:9px;padding:6px 10px;cursor:pointer;border-radius:2px;transition:all .2s;flex-shrink:0;margin-bottom:2px}
        .send-btn.ready{color:var(--text-secondary);border-color:var(--border-mid)}
        .send-btn.ready:hover{color:var(--text-primary);border-color:#383530}
        .send-btn:disabled{opacity:.18;cursor:not-allowed}
        .intro-screen{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column;align-items:center;padding:40px 32px 80px;overflow-y:auto;}
        .intro-text{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:300;color:#c4c0b8;line-height:1.9;max-width:480px;}
        .intro-tagline{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#c9a84c;opacity:.7;margin-bottom:32px;}
        .intro-actions{display:flex;align-items:center;gap:24px;margin-top:40px;position:sticky;bottom:20px;}
        .intro-continue{background:none;border:1px solid #3a3632;color:#c4c0b8;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.15em;text-transform:uppercase;padding:10px 28px;cursor:pointer;border-radius:2px;transition:all .2s;}
        .intro-continue:hover{border-color:#c9a84c;color:#c9a84c;}
        .intro-skip{background:none;border:none;color:#3a3632;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;cursor:pointer;transition:color .2s;}
        .intro-skip:hover{color:#6a6660;}
        .mic-btn{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:9px;padding:6px 10px;cursor:pointer;border-radius:2px;}
        .mic-btn.active{border-color:#7a4a4a;color:#7a4a4a;}
        .turn-counter{font-size:8px;letter-spacing:.1em;color:var(--text-dim);text-align:right;margin-top:5px}
        .err{font-size:10px;color:#4a1a1a;margin-top:7px;padding:6px 10px;border:1px solid #180000;border-radius:2px}

        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border-mid)}
      `}</style>

      {!introShown && (
        <div className="intro-screen">
          <div style={{width:"100%",maxWidth:"480px"}}>
            <div className="intro-tagline">Thinking with you. Not for you.</div>
            <div className="intro-text">
              Υπάρχουν πράγματα που ξέρεις ότι πρέπει να σκεφτείς — αλλά δεν μπορείς μόνος σου.<br /><br />
              Όχι γιατί δεν είσαι έξυπνος.<br />
              Γιατί είμαστε όλοι τυφλοί στα δικά μας.<br /><br />
              Η AURA το κάνει αυτό.<br />
              Λίγες ερωτήσεις. Και ξαφνικά:<br /><br />
              <span style={{color:"#c9a84c",fontStyle:"normal"}}>"Να το."</span><br /><br />
              Όχι η έκπληξη.<br />
              Η χαρά που το βρήκες.
            </div>
            <div className="intro-actions">
              <button className="intro-continue" onClick={() => setIntroShown(true)}>Συνέχεια</button>
              <button className="intro-skip" onClick={() => { setIntroShown(true); setSessionStarted(true); }}>skip</button>
            </div>
          </div>
        </div>
      )}

      <div className="root">

        {/* ── AURA Light Field (background, state-driven) ── */}
        <div className={`light-field ${illumLevel > 0 ? "clear" : ""} ${claritySurge ? "surge" : ""}`} />

        {/* ── Vertical Identity: AURA ERGO SUM (progressive illumination) ── */}
        <div className="vertical-identity">{["A","U","R","A","·","E","R","G","O","·","S","U","M"].map((ch,i)=>{const isDot=ch==="·";return(<span key={i} style={isDot?{height:"14px",display:"block"}:{}}>{isDot?"":ch}</span>);})}</div>

        {/* ── Header ── */}
        <header className="header" style={{flexDirection:"column",alignItems:"flex-start",gap:"2px",paddingBottom:"6px"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",fontWeight:300,color:"#d8d4cc",letterSpacing:".04em",lineHeight:1.4}}>Most AI tools answer questions. <span style={{color:"#c9a84c"}}>Aura</span> removes the ones that don't matter.</span>
          <div className="header-right">
            {/* Lens is invisible — no indicator shown to user */}
            {safetyMode && (
              <div className="mode-pill">
                <span className="mode-dot safe" />
                <span style={{color:"var(--red)"}}>υποστήριξη</span>
              </div>
            )}
            <button className="icon-btn" onClick={() => setShowMemoryPanel(v => !v)} title="Ρυθμίσεις μνήμης">μνήμη</button>
          </div>
        </header>

        {/* ── Memory management panel ── */}
        {showMemoryPanel && (
          <div className="mem-panel">
            <div className="mem-panel-title">μνήμη — {memory.storageEnabled ? "ενεργή" : "ανενεργή"}</div>
            <div className="mem-panel-row">
              <span>θέματα που παρακολουθούνται</span>
              <span style={{color:"var(--text-secondary)"}}>{(memory.trajectories||[]).length}</span>
            </div>
            <div className="mem-panel-row">
              <span>ανοιχτές αποφάσεις</span>
              <span style={{color:"var(--text-secondary)"}}>{openAnchors.length}</span>
            </div>
            <div className="mem-panel-row">
              <span>συνεδρίες</span>
              <span style={{color:"var(--text-secondary)"}}>{memory.sessionCount || 0}</span>
            </div>
            {(memory.trajectories||[]).map((t,i) => (
              <div key={i} className="mem-panel-row" style={{paddingLeft:8,opacity:.7}}>
                <span style={{fontSize:9}}>{t.category}</span>
                <span style={{color:"var(--text-dim)",fontSize:9}}>
                  {t.sessions} {t.sessions===1?"φορά":"φορές"}{t.resolved?" · ✓":""}
                </span>
              </div>
            ))}
            <div style={{fontSize:9,color:"var(--text-dim)",marginTop:8,lineHeight:1.7}}>
              Αποθηκεύονται μόνο μοτίβα συμπεριφοράς.<br/>
              Ποτέ κείμενο συνομιλίας. Τα πάντα στη συσκευή σου.
            </div>
            <div className="mem-panel-actions">
              <button className="toggle-btn" onClick={() => { const u = {...memory, storageEnabled: !memory.storageEnabled}; setMemory(u); saveMemory(u); }}>
                {memory.storageEnabled ? "απενεργοποίηση" : "ενεργοποίηση"}
              </button>
              {memory.storageEnabled && (
                <button className="toggle-btn" onClick={() => exportMemory(memory)}>εξαγωγή (.json)</button>
              )}
              <button className="toggle-btn" style={{color:"var(--red)"}} onClick={() => {
                const u = EMPTY_MEMORY();
                setMemory(u);
                try { localStorage.removeItem(MEMORY_KEY); } catch {}
              }}>διαγραφή όλων</button>
            </div>
          </div>
        )}

        {/* ── Open anchors ── */}
        {openAnchors.length > 0 && !showMemoryPanel && (
          <div className="anchor-bar">
            <div className="anchor-bar-label">ανοιχτό</div>
            {openAnchors.map(a => (
              <div key={a.id} className="anchor-item">
                <div className="anchor-text">{a.text}</div>
                <div className="anchor-actions">
                  <button className="anchor-btn done"    onClick={() => closeAnchorHandler(a.id, "completed")}>έγινε</button>
                  <button className="anchor-btn"         onClick={() => closeAnchorHandler(a.id, "revised")}>άλλαξε</button>
                  <button className="anchor-btn release" onClick={() => closeAnchorHandler(a.id, "released")}>άφησέ το</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Feed ── */}
        <div className={`feed ${messages.length > 0 ? "active" : ""}`}>

          {isFirst && returnAnchor && (
            <div className="return-anchor-card">
              <div className="return-label">την τελευταία φορά</div>
              <div className="return-text">{returnAnchor.text}</div>
              <div className="return-question">Κάτι άλλαξε;</div>
            </div>
          )}

          {isFirst && !returnAnchor && (<div className="empty" style={{justifyContent:"space-between",paddingTop:"40px",paddingBottom:"40px"}}><div style={{textAlign:"right",fontSize:"10px",color:"#4a4845",lineHeight:1.8,fontStyle:"italic"}}>Η καθαρή σκέψη έρχεται<br />μέσω αφαίρεσης του περιττού...</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"64px",fontWeight:300,fontStyle:"italic",color:"#c4c0b8",textAlign:"center",lineHeight:1}}>Aura</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:".18em",textTransform:"uppercase",color:"#c9a84c",textAlign:"center",lineHeight:2,opacity:.5}}>Thinking with you,<br />not for you...</div>
<div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:".08em",color:"#3a3835",textAlign:"center",lineHeight:1.8,marginTop:"12px",fontStyle:"italic"}}>Most AI tools answer questions.<br />AURA removes the ones that don't matter.</div><button onClick={()=>{setSessionStarted(true);setTimeout(()=>textareaRef.current?.focus(),100);}} style={{display:"block",margin:"20px auto 0",background:"none",border:"1px solid #3a3632",color:"#6a6660",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:".2em",textTransform:"uppercase",padding:"8px 24px",cursor:"pointer",borderRadius:"2px"}}>ENTER</button></div>)}

          {/* First-Why pause — AURA asks one question before entering conversation */}
          {firstWhyPending && (
            <div className="first-why-card">
              <div className="first-why-q">
                Γιατί έχει σημασία αυτό για σένα;
              </div>
            </div>
          )}

          {/* Messages — A1: memoized bubbles, stable keys */}
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id || i}
              msg={msg}
              onMisfire={() => { setMisfireType(detectPattern(messages.slice(0, i+1)).type); setMisfirePending(true); }}
            />
          ))}

          {/* Misfire recovery — inline input */}
          {misfirePending && (
            <div className="choice-card">
              <div className="choice-label">διόρθωση</div>
              <div className="choice-prompt">Τι λείπει που αλλάζει την εικόνα;</div>
              <textarea
                className="textarea"
                style={{marginTop:12,marginBottom:10,display:"block",width:"100%",minHeight:36,maxHeight:100,fontSize:12}}
                placeholder="Γράψε εδώ — ή άφησε κενό για να συνεχίσω κανονικά…"
                value={misfireInput}
                onChange={e => setMisfireInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleMisfireResponse(misfireInput);setMisfireInput("");}}}
                enterKeyHint="send"
                autoFocus
              />
              <div style={{display:"flex",gap:8}}>
                <button className="choice-btn" onClick={() => { handleMisfireResponse(""); setMisfireInput(""); }}>Συνέχισε</button>
                <button className="choice-btn prim" onClick={() => { handleMisfireResponse(misfireInput); setMisfireInput(""); }} disabled={!misfireInput.trim()}>Αποστολή</button>
              </div>
            </div>
          )}

          {/* Layer gate */}
          {layerGatePending && (
            <div className="choice-card">
              <div className="choice-label">aura</div>
              <div className="choice-prompt">
                Μπορώ να συνεχίσω να απαντώ.<br />
                Ή μπορώ να μειώσω την πολυπλοκότητα και να δούμε τι παραμένει.<br />
                Τι προτιμάς;
              </div>
              <div className="choice-btns">
                <button className="choice-btn" onClick={() => handleLayerChoice("continue")}>Συνέχισε</button>
                <button className="choice-btn prim" onClick={() => handleLayerChoice("observe")}>Μείωσε την πολυπλοκότητα</button>
              </div>
            </div>
          )}

          {/* Compression offer */}
          {pivotPending && !layerGatePending && (
            <div className="choice-card" style={{borderLeft:"1px solid var(--gold-dim)",paddingLeft:14}}>
              <div className="choice-label" style={{color:"var(--gold-dim)"}}>συμπίεση</div>
              <div className="choice-prompt">
                Μπορώ να συνεχίσω να αναλύω.<br />
                Ή μπορώ να αφαιρέσω ό,τι δεν είναι ουσιαστικό και να δούμε τι μένει.<br />
                Τι προτιμάς;
              </div>
              <div className="choice-btns">
                <button className="choice-btn" onClick={() => handlePivotChoice(false)}>Απάντηση</button>
                <button className="choice-btn prim" onClick={() => handlePivotChoice(true)}>Ναι, ας δούμε</button>
              </div>
            </div>
          )}

          {/* Pre-termination warning */}
          {warningPending && (
            <div className="warning-card">
              <div className="warning-label">παρατήρηση</div>
              <div className="warning-text">
                Παρατηρώ ότι επιστρέφουμε στο ίδιο σημείο χωρίς νέα πληροφορία.<br />
                Μπορώ να κάνω ένα τελευταίο πέρασμα από διαφορετική γωνία — ή μπορούμε να σταματήσουμε εδώ.<br />
                Τι προτιμάς;
              </div>
              <div className="choice-btns">
                <button className="choice-btn" onClick={() => handleWarningChoice(false)}>Σταμάτα εδώ</button>
                <button className="choice-btn prim" onClick={() => handleWarningChoice(true)}>Ένα ακόμα πέρασμα</button>
              </div>
            </div>
          )}

          {/* Memory consent — earned, not requested */}
          {memoryPromptPending && (
            <div className="mem-card">
              <div className="mem-label">μνήμη</div>
              <div className="mem-text">
                Παρατήρησα ένα μοτίβο που μπορεί να είναι χρήσιμο να θυμάμαι.
                Θέλεις να το κρατήσω σε αυτή τη συσκευή;
              </div>
              <div className="mem-note">
                Αποθηκεύονται μόνο μοτίβα — ποτέ κείμενο συνομιλίας.<br />
                Τα πάντα παραμένουν στη συσκευή σου. Μπορείς να τα διαγράψεις οποιαδήποτε στιγμή.
              </div>
              <div className="choice-btns">
                <button className="choice-btn" onClick={() => handleMemoryChoice(false)}>Όχι</button>
                <button className="choice-btn prim" onClick={() => handleMemoryChoice(true)}>Ναι</button>
              </div>
            </div>
          )}




          {/* Typing */}
          {loading && <div className="typing"><div className="t-dot"/><div className="t-dot"/><div className="t-dot"/></div>}

          {/* Closing System: "To the point of mind" — only on natural session end */}
          {sessionEnded && !loading && finalDistillation && (
            <div className={`distillation ${isFirstDistillation ? "first-time" : ""}`}>
              <div className="distillation-label">to the point of mind</div>
              <div className="distillation-text">{finalDistillation}</div>
            </div>
          )}

          {/* Session end */}
          {sessionEnded && !loading && (
            <div className="end-wrap">
              <div className="end-label">η συνομιλία σταμάτησε εδώ</div>
              <div className="end-note">Επίστρεψε όταν υπάρχει κάτι νέο να δούμε.</div>
              <button className="new-btn" onClick={resetSession}>Νέα συνεδρία</button>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* ── Input ── */}
        {!sessionEnded && !layerGatePending && !pivotPending && !memoryPromptPending && !warningPending && !misfirePending && sessionStarted && (
          <div className="input-area">
            <div className="input-row" style={{flexDirection:"column",gap:"4px",alignItems:"stretch"}}>
              <textarea
                ref={textareaRef}
                className="textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Τι συμβαίνει;"
                rows={5}
                disabled={loading}
                enterKeyHint="send"
              />
              <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",marginTop:"6px"}}><button className={`mic-btn ${isListening?"active":""}`} onClick={isListening?stopListening:startListening} disabled={loading}>{isListening?"◉":"🎙"}</button><button className={`send-btn ${input.trim()?"ready":""}`} onClick={handleSubmit} disabled={!input.trim()||loading}>↵</button></div>
            </div>
            {turnCount.current > 0 && (
              <div className="turn-counter">{turnCount.current} {turnCount.current===1 ? "ανταλλαγή" : "ανταλλαγές"}</div>
            )}
            {error && <div className="err">Σφάλμα: {error}</div>}
          </div>
        )}

      </div>
    </>
  );
}