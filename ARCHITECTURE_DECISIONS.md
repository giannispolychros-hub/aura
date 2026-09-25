# AURA — Architecture Decision Log

Καταγράφει *γιατί* πάρθηκε (ή δεν πάρθηκε) κάθε δομική απόφαση — όχι μόνο τι άλλαξε. Στόχος: να μη χαθεί ποτέ ο λόγος πίσω από μια απόφαση, ούτε να ξεχαστεί ένα πραγματικό ρίσκο επειδή "το είχαμε αφήσει".

---

## ADR-001 — Boolean gate flags vs. State Machine

**Decision:** Δεν μετατρέπουμε τα 9 boolean gate flags σε explicit state machine, προς το παρόν.

**Reason:** Κανένα evidence ότι τα flags προκαλούν πραγματικά bugs μέσω σύγκρουσης καταστάσεων. Το μοναδικό επιβεβαιωμένο ρίσκο (`onMisfire` ενεργό ενώ άλλο gate ήταν ανοιχτό) διορθώθηκε με μονογραμμικό guard, όχι με αλλαγή αρχιτεκτονικής.

**Evidence (7 Ιουλίου 2026):** 9 flags συνολικά. 1 πραγματικό, επιβεβαιωμένο overlap βρέθηκε και διορθώθηκε (`onMisfire`). Κανένα άλλο evidenced conflict.

**Status:** *Conditional — ανοιχτό, όχι κλειστό.*

**Review condition (οποιοδήποτε από τα παρακάτω το ξανανοίγει):**
- Εμφανιστεί πραγματικό bug από interaction/state collision (πέρα από θεωρητικό ρίσκο)
- Ο αριθμός των flags αυξηθεί σημαντικά (π.χ. +3 νέα gate flags από νέα features)
- Μία αλλαγή χρειαστεί τροποποίηση σε πολλαπλές, ανεξάρτητες περιοχές κώδικα ταυτόχρονα
- Η κατανόηση της ροής γίνει αντικειμενικά δυσκολότερη από την ίδια την υλοποίηση (π.χ. νέος colaborator/μελλοντικό Claude session χρειάζεται πάνω από 15 λεπτά να καταλάβει τη σειρά gates)

### ΚΑΤΑΣΤΑΣΗ ΣΗΜΕΡΑ — 12 Σεπτεμβρίου 2026

**Η review condition #2 έχει ικανοποιηθεί.** Δεν απαιτείται πλέον «αν» — έχει συμβεί.

Το ADR-001 γράφτηκε με **9 boolean gate flags** και όριζε ως συνθήκη επανεξέτασης «ο αριθμός των flags αυξηθεί σημαντικά (π.χ. +3 νέα gate flags από νέα features)». Σήμερα το `AURAv2` δηλώνει **47 `useRef`** (μετρημένα με το ίδιο regex που χρησιμοποιεί ο φρουρός `auratests/test_ref_reset_integrity.js`), πέρα από τα `useState`.

Μόνο η συνεδρία της 11–12 Σεπτεμβρίου 2026 πρόσθεσε **τρία**: `shiftCheckCtxDelivered`, `friendPerspectiveCtxDelivered`, `premiseInversionCtxDelivered` (commit `3ff0029`, budgets εκπομπής για ctx που επαναλαμβάνονταν κάθε turn). Δηλαδή το «+3 από νέα features» εκπληρώθηκε από **μία** συνεδρία.

Το Future Friction Log παραπάνω το είχε προβλέψει ρητά: *«ο αριθμός flags τείνει να μεγαλώνει μονότονα, ποτέ να μικραίνει — Μέτρια σοβαρότητα, τροφοδοτεί απευθείας το ADR-001 review condition #2».* Η πρόβλεψη επιβεβαιώθηκε.

**Τι ΔΕΝ αποφασίζεται εδώ:** αν θα γίνει state machine, αν θα ομαδοποιηθούν τα refs, ή αν η αύξηση είναι πρόβλημα. Η καταγραφή αυτή σημειώνει **μόνο** ότι η συνθήκη που ξανανοίγει το ADR-001 έχει περάσει, και ότι η απόφαση είναι ανοιχτή και ανήκει στον ιδρυτή.

**Status:** *Conditional — ανοιχτό, και η συνθήκη επανεξέτασης έχει πλέον ενεργοποιηθεί.*

---

## ADR-002 — Text-based triggers vs. Structured signals

**Decision:** Αντικαταστάθηκαν όλα τα γνωστά text-sniffing σημεία (ανίχνευση συγκεκριμένων λέξεων στην απάντηση του μοντέλου για να αποφασιστεί ενέργεια κώδικα) με structured/counted signals, όπου ήταν εφικτό.

**Reason:** Ένα text-trigger βρέθηκε (onboarding demo) να εξαρτάται 100% από το αν το μοντέλο θα πει ΑΚΡΙΒΩΣ μια φράση — εύθραυστο, silent-fail σε παράφραση.

**Evidence:** Αντικαταστάθηκε με μετρητή βημάτων (`onboardingStepRef`) — ανεξάρτητο από τη διατύπωση του μοντέλου.

**Status:** *Ολοκληρωμένο για τα γνωστά σημεία.* 2 prompt-text-dependent decisions παραμένουν (safety line 10306 injection, explicit-pause detection) — και τα δύο χαμηλού ρίσκου (απλή ενίσχυση, όχι κρίσιμη λειτουργική απόφαση).

**Review condition:** Νέο prompt-dependent decision προστεθεί χωρίς αξιολόγηση εναλλακτικού structured signal πρώτα.

---

## Future Friction Log (αναδρομική καταγραφή σημερινών προσθηκών)

Όχι "τι έσπασε" — τι κάνει την επόμενη αλλαγή δυσκολότερη:

| Προσθήκη σήμερα | Future Friction | Σοβαρότητα |
|---|---|---|
| `closureConfirmPending`, `awaitingRememberedWord` (2 νέα flags) | Κάθε επόμενο νέο "περίμενε απόφαση χρήστη" feature θα ζητήσει το ίδιο μοτίβο — ο αριθμός flags τείνει να μεγαλώνει μονότονα, ποτέ να μικραίνει | Μέτρια — τροφοδοτεί απευθείας το ADR-001 review condition #2 |
| Onboarding demo + word-save λογική μπήκε μέσα στο `generateResponse` | Το ήδη μεγάλο God Function μεγάλωσε ακόμα (179 γραμμές) — κάθε μελλοντική προσθήκη εκεί αυξάνει cyclomatic complexity χωρίς αντίστοιχο διαχωρισμό | Μέτρια-Υψηλή |
| Two-part Closure Summary (Part 1 / Part 2 split) | Απαιτεί το μοντέλο να «σταματήσει» ρητά στη μέση μιας ροής (μην προχωρήσεις σε Ownership Statement) — νέο, λεπτό σημείο πρότυπης εξάρτησης από πειθαρχία μοντέλου, ξεχωριστό από τα ήδη γνωστά 2 prompt-dependent decisions | Χαμηλή-Μέτρια — δεν έχει ακόμα αποδειχθεί πρόβλημα, αλλά είναι νέο, ρητά αδοκίμαστο pattern |
| `TRAJECTORY_WORD_CATEGORY` ως ρητή κατηγορία μέσα στο ήδη γενικό `anchors` array | Το `anchors` array τώρα εξυπηρετεί 2+ εννοιολογικά διαφορετικούς σκοπούς (decisions + trajectory words) κάτω από την ίδια δομή — μελλοντική σύγχυση αν προστεθεί 3ος τύπος | Χαμηλή |

**Κανένα από αυτά δεν είναι bug σήμερα. Όλα είναι υποψήφια σημεία όπου η επόμενη αλλαγή θα κοστίσει λίγο παραπάνω απ' όσο θα κόστιζε σε καθαρότερη δομή.**

---

---

## ADR-003 — Unified "brain" architecture (state router) for the ~100 protocols

**Decision:** Δεν χτίζεται πλήρης ιεραρχία/state-machine πάνω σε όλα τα ~100 πρωτόκολλα. Μόνο τα states με ήδη αποδεδειγμένο, πραγματικό evidence γίνονται code-enforced.

**Reason:** Real transcripts σήμερα έδειξαν ότι το prompt-only "εμπιστέψου το μοντέλο να ιεραρχήσει" αποτυγχάνει αξιόπιστα (άπειρο "Εντάξει.", advice cascade, παραλειπόμενα βήματα onboarding). Deep research (2026 production LLM routing) επιβεβαίωσε: state detection πρέπει να είναι code-first/deterministic όπου γίνεται, μοντέλο μόνο σε στενή, forced-choice απόφαση — ποτέ semantic self-report στο ίδιο μεγάλο μοντέλο (το `[[EXIT:yes/no]]` tag απέτυχε ακριβώς γι' αυτό τον λόγο).

**Evidence — τι είναι ήδη code-enforced, με απόδειξη:**
- **SAFETY** (`detectSafetySignal`) — πραγματικό `\b`+ελληνικά bug βρέθηκε/διορθώθηκε
- **CLOSING** (`isModelPreClosing`, `decideTermination`) — πραγματικός ατέρμονος βρόχος βρέθηκε/διορθώθηκε
- **ADVICE_RISK** (`looksLikeAdviceCascade`) — **passive/observational only**, βασισμένο στο πραγματικό transcript του μάγειρα, δεν αλλάζει ακόμα συμπεριφορά, περιμένει evidence πριν ενεργοποιηθεί

**Ρητά ΔΕΝ έγινε:** πλήρης 5-state router (LOOP, NORMAL κ.λπ.), αναδιάταξη των υπόλοιπων ~95 πρωτοκόλλων, οποιαδήποτε "καλύτερη ιεραρχία εκ των προτέρων" χωρίς transcript evidence.

**Status:** *Conditional — επεκτείνεται σταδιακά, μόνο όταν νέο evidence το δικαιολογεί.*

**Review condition:** Το `looksLikeAdviceCascade` περνάει από observational σε active gating μόνο αφού επιβεβαιωθεί σε πραγματικό, ζωντανό test ότι δεν παράγει πολλά false positives. Νέα states προστίθενται μόνο όταν πραγματικό transcript αποδείξει ανάγκη — όχι από θεωρητική ομαδοποίηση συγγένειας.

### ΚΑΤΑΣΤΑΣΗ ΣΗΜΕΡΑ — 12 Σεπτεμβρίου 2026

Το ADR-003 παραπάνω ήταν ακριβές την ημέρα που γράφτηκε. Έπαψε να είναι, και **κανένα test δεν το έλεγχε** — ένα ADR είναι markdown, δεν εκτελείται. Οι αρχικές αποφάσεις και το σκεπτικό τους παραμένουν ακέραια· αυτή η ενότητα καταγράφει τι από αυτά ισχύει σήμερα.

Από τους τρεις πυλώνες που το ADR απαριθμεί ως code-enforced, **δύο ζουν και ένας δεν υπάρχει**.

| Πυλώνας | Τι λέει το ADR | Τι ισχύει σήμερα |
|---|---|---|
| SAFETY — `detectSafetySignal` | code-enforced | **Ενεργό.** 3 κλήσεις· οδηγεί τα CRISIS/DISTRESS σκαλιά του `handleSubmit` |
| CLOSING — `isModelPreClosing`, `decideTermination` | code-enforced | **Ενεργό.** `decideTermination` γρ. 2194–2317, καταναλώνεται στις γρ. 3801/3807/3824 |
| ADVICE_RISK — `looksLikeAdviceCascade` | «passive/observational only… περιμένει evidence πριν ενεργοποιηθεί» | **ΔΕΝ ΥΠΑΡΧΕΙ.** 0 εμφανίσεις στο `src/App.jsx` |

#### 1. Ο τρίτος πυλώνας δεν περιμένει — χάθηκε

Αυτό δεν είναι εκκρεμότητα. Είναι γεγονός με διαδρομή:

- **Μπήκε** στο `src/App.jsx` με τον commit **`9e84e6f`** — τον ίδιο commit που έγραψε αυτό το ADR-003. Οριζόταν ως συνάρτηση και **καλούνταν μία φορά**, μέσα στο `generateResponse`, ως `console.warn("[AURA watch] possible advice-cascade pattern detected (observational only)", …)`.
- **Αφαιρέθηκε** στον commit **`b4867b8`** (*«restore: reapply the complete hardening build after an older App.jsx from a separate conversation overwrote it — that file predated today's work»*). Το diff είναι **−2** για αυτό το σύμβολο: η επαναφορά προήλθε από build που προηγούνταν του ανιχνευτή, οπότε ο ανιχνευτής έφυγε μαζί με ό,τι άλλο δεν υπήρχε σε εκείνο το αντίγραφο.
- **Κανένα test δεν το έπιασε.** Ο commit της επαναφοράς επαληθεύτηκε με 315 tests σε 30 suites, 0 αποτυχίες. Κανένα από αυτά δεν άγγιζε αυτόν τον ανιχνευτή μέσα στο `App.jsx`. Η απώλεια ήταν σιωπηλή εξ ολοκλήρου.
- **Επιβιώνει μόνο** στο `tests/aura_pure.js` (ορισμός γρ. 1407, εξαγωγή γρ. 1568) — αντίγραφο που δεν τρέχει στην παραγωγή και δεν καλείται από πουθενά εκεί μέσα.

**Η review condition του πυλώνα δεν μπορεί καν να αξιολογηθεί.** Ζητά «επιβεβαίωση σε πραγματικό, ζωντανό test ότι δεν παράγει πολλά false positives» — αλλά δεν παράγεται **κανένα** observation, ούτε ένα false positive ούτε ένα true positive, γιατί ο κώδικας δεν εκτελείται. Η συνθήκη δεν είναι ανεκπλήρωτη· είναι μη αξιολογήσιμη.

#### 2. Γνωστή, μη επιλυμένη αντίφαση: το `[[EXIT:yes/no]]` παραμένει σε παραγωγή

Το σκεπτικό του ADR-003 στηρίζεται ρητά σε αυτό: *«ποτέ semantic self-report στο ίδιο μεγάλο μοντέλο (το `[[EXIT:yes/no]]` tag απέτυχε ακριβώς γι' αυτό τον λόγο)».*

Ο μηχανισμός **εξακολουθεί να διαβάζεται και να τροφοδοτεί απόφαση**:

- γρ. 3521–3522 — `const exitTagMatch = rawTextWithTags.match(/\[\[EXIT:(yes|no)\]\]\s*$/i); const modelJudgesEnd = …`
- γρ. 3792 — το `modelJudgesEnd` περνάει ως όρισμα στη `decideTermination`
- γρ. 2279 — εκεί αποτελεί έναν από τους τέσσερις κλάδους που θέτουν `decision = "confirm"`

Δηλαδή ένας μηχανισμός που αυτό το ίδιο έγγραφο χαρακτηρίζει **τεκμηριωμένα αναξιόπιστο** παραμένει ζωντανή είσοδος σε έναν από τους δύο πυλώνες που το ίδιο έγγραφο χαρακτηρίζει **αξιόπιστους**.

Καταγράφεται εδώ ως γνωστή αντίφαση, χωρίς προτεινόμενη λύση. Ο σκοπός της καταγραφής είναι να πάψει να είναι αόρατη: μέχρι σήμερα η αντίφαση υπήρχε ολόκληρη μέσα σε αυτό το αρχείο, σε δύο παραγράφους που δεν διαβάστηκαν ποτέ μαζί.

#### 3. Ο φάκελος `tests/` είναι πηγή ψευδούς κάλυψης

Χωριστός από το `auratests/` (τη ζωντανή σουίτα). Περιέχει παγωμένο αντίγραφο της λογικής της εφαρμογής:

| | ζωντανό `src/App.jsx` | παγωμένο `tests/aura_pure.js` |
|---|---|---|
| core prompt | **291.286** χαρακτήρες, 883 γραμμές | **33.326** χαρακτήρες, 523 γραμμές |

Διαφορά τάξης μεγέθους. Το `auratests/RUN_ALL.bat` **δεν αναφέρει κανένα αρχείο του `tests/`** (0 εμφανίσεις για `aura_pure`, `test_baseline`, `test_integration`), άρα τίποτα εκεί δεν τρέχει στη ροή εργασίας.

Τα `tests/test_baseline.js` γρ. 143–150 ελέγχουν το `looksLikeAdviceCascade` και **περνάνε** — επαληθεύοντας κώδικα που δεν υπάρχει στην παραγωγή. Αυτό είναι ακριβώς το μοτίβο που έκανε την απώλεια του πυλώνα σιωπηλή: υπήρχε πράσινο test με το σωστό όνομα, δείχνοντας σε λάθος αντίγραφο.

Καταγράφεται ως γνωστή πηγή ψευδούς κάλυψης. Καμία ενέργεια δεν αποφασίζεται εδώ.

#### 4. Σημείωση λεξιλογίου: το «LOOP» αυτού του ADR

Το ADR-003 γράφει *«πλήρης 5-state router (LOOP, NORMAL κ.λπ.)»*. Εκείνο το **LOOP είναι υποθετικό όνομα state ενός router που δεν χτίστηκε ποτέ** — δεν αντιστοιχεί σε κανέναν μηχανισμό του `App.jsx`, ούτε τότε ούτε τώρα.

Από τότε, οι commits `6dc5cf1` («Disambiguate LOOP naming») και `9dda674` («Rename NEGATIVE EXIT and CLOSURE LOOP to remove semantic collisions») άλλαξαν τη σημασία της λέξης «LOOP» μέσα στο prompt. Το λεξιλόγιο αυτού του εγγράφου είναι επομένως μία γενιά πίσω. Δεν υπάρχει σύγκρουση — απλώς δύο διαφορετικά πράγματα με το ίδιο όνομα, και το παραπάνω δεν πρέπει να διαβαστεί με τη σημερινή σημασία.

#### Τι ΔΕΝ άλλαξε σήμερα

Η συνεδρία 11–12 Σεπτεμβρίου 2026 έκανε 23 commits στο `src/App.jsx`. **Κανένας τους δεν άγγιξε μηχανισμό του ADR-003** — ελέγχθηκε ανά commit για `detectSafetySignal`, `isModelPreClosing`, `function decideTermination`, `looksLikeAdviceCascade`: 0/23. Ο τρίτος πυλώνας έλειπε ήδη πριν αρχίσει η συνεδρία.

#### 5. Η δηλωμένη προτεραιότητα του πυλώνα CLOSING δεν υφίσταται — και ο αριθμητικός του φραγμός είναι νεκρός

*Προσθήκη 12 Σεπτεμβρίου 2026, μετά από εξαντλητική ιχνηλάτηση διαδρομών. Κανένας κώδικας δεν διαγράφηκε· τα σημεία ορισμού φέρουν πλέον σχόλια και ο φρουρός `auratests/test_dead_paths.js` κλειδώνει το γεγονός.*

**(α) «Layer Gate και Pivot είναι pre-model intercepts» — δεν ισχύει.**

Η γρ. 218 του prompt (LAYER CLARIFICATION — REPETITION/STUCK DETECTION) επιλύει μια τεκμηριωμένη τετραπλή επικάλυψη στην οικογένεια repetition/stuck δηλώνοντας ότι τα «Layer Gate» και «Pivot» είναι PRE-MODEL intercepts — *«when either fires, generateResponse is never called for that turn»* — και ότι αυτό σκιάζει τα REFLECTIVE CHECKPOINT και ANALYSIS LOOP. Το κείμενο κλείνει με *«the existing structural precedence already resolves it correctly»*.

Καμία από τις δύο δεν μπορεί να πυροδοτήσει:

```
setLayerGatePending  → 2 κλήσεις, ΑΜΦΟΤΕΡΕΣ με false (γρ. 4035, 4328)
setPendingUserMessage→ 2 κλήσεις, ΑΜΦΟΤΕΡΕΣ με null  (γρ. 4036, 4329)
   └→ το UI block (γρ. 4968) δεν αποδίδεται ποτέ
        └→ τα δύο κουμπιά του (γρ. 4977-4978) είναι οι ΜΟΝΟΙ καλούντες της handleLayerChoice
             └→ setMode("AUDIT") (γρ. 4040, η μοναδική στο αρχείο) δεν εκτελείται ποτέ
                  └→ offerPivot απαιτεί mode === "AUDIT" → ποτέ αληθές
                       └→ setPivotPending(true) (γρ. 4296) ΑΠΡΟΣΙΤΟ
```

Αποκλείστηκε και έμμεση κλήση: `eval(`, `new Function(`, `.apply(`, `.call(` και computed setters μετρήθηκαν **όλα 0** στο αρχείο.

Ό,τι μένει ζωντανό για την επανάληψη του χρήστη είναι το `offerGate` (γρ. 4270, `mode === "ANSWER"`), το οποίο **δεν διακόπτει**: θέτει `clarityPivotHint` και συνεχίζει στη `generateResponse`. Είναι η υβριδική αντικατάσταση που περιγράφει το σχόλιο της γρ. 4245, μετά από αποδεδειγμένη βλάβη από το παλιό σκληρό override. **Συνέπεια: το σήμα κύκλου του χρήστη φτάνει στο μοντέλο ως context, ποτέ ως pre-model intercept.** Η ιεραρχία που η γρ. 218 θεωρεί «ήδη επιλυμένη» στηρίζεται σε μηχανισμούς που δεν εκτελούνται.

**(β) Ο κλάδος `compressionCount >= 2` της `decideTermination` είναι κλειστός κύκλος.**

```
αύξηση: ΜΟΝΟ γρ. 3643, μέσα στη generateResponse, μόνο όταν currentMode === "COMPRESSION"
generateResponse(…, "COMPRESSION"): ΜΟΝΟ γρ. 4127, μέσα στην handleWarningChoice
handleWarningChoice: μηδενίζει το compressionCount στη γρ. 4121 — ΕΞΙ ΓΡΑΜΜΕΣ ΝΩΡΙΤΕΡΑ
```

Κάθε COMPRESSION πέρασμα ξεκινά με μηδενισμένο μετρητή και τον αφήνει στο 1. **Δεν φτάνει ποτέ το 2.** Η `handlePivotChoice` καλεί `callAura` απευθείας (γρ. 4059) και παρακάμπτει τη `generateResponse`, άρα δεν αυξάνει ούτε αυτή — και είναι έτσι κι αλλιώς απρόσιτη. Τρίτος μηδενισμός στη γρ. 4258 σε αλλαγή θέματος.

**(γ) Η συνέπεια για τον τερματισμό, δηλωμένη καθαρά.**

Με αυτό το μισό νεκρό, από τους τέσσερις κλάδους που μπορούν να κλείσουν συνεδρία, **τρεις διαβάζουν το κείμενο που παρήγαγε η ίδια η AURA**: `isModelPreClosing(text)`, `modelJudgesEnd` (το tag `[[EXIT]]`) και `modelSignalsEnd` (regex). Μόνο το `naturalExitReady` διαβάζει απευθείας μηνύματα του χρήστη.

Αυτό το ίδιο ADR ονομάζει το semantic self-report από το ίδιο μεγάλο μοντέλο ως τον λόγο που το `[[EXIT]]` απέτυχε — και όπως καταγράφηκε ήδη στην παράγραφο 2 παραπάνω, το tag εξακολουθεί να διαβάζεται. **Η καταγραφή εδώ είναι ισχυρότερη: δεν είναι μόνο ότι ένας αναξιόπιστος μηχανισμός επιβιώνει, αλλά ότι ο αριθμητικός φραγμός που θα τον εξισορροπούσε δεν λειτουργεί.**

**Καμία πρόταση διόρθωσης δεν γίνεται εδώ.** Η διαγραφή, η αναβίωση ή η αντικατάσταση αυτών των διαδρομών είναι απόφαση ιδρυτή. Αυτή η ενότητα καταγράφει μόνο τι ισχύει.

**Status (αναθεωρημένο):** *Conditional — αλλά με έναν από τους τρεις πυλώνες απόντα και τη review condition του μη αξιολογήσιμη. Το ADR περιγράφει αρχιτεκτονική κατά ένα τρίτο ανύπαρκτη μέχρι αυτό να αποκατασταθεί ή να αποφασιστεί ρητά ότι δεν αποκαθίσταται.*

---

## Watch List — family-adjacent πρωτόκολλα, χωρίς άμεσο evidence, προς ειδική προσοχή στο επόμενο ζωντανό τεστ

Δεν έχουν αλλάξει. Καταγράφονται **μόνο** για να ξέρουμε πού να κοιτάξουμε πρώτα στο επόμενο πραγματικό transcript — όχι ως πρόθεση αλλαγής.

| Family | Αποδεδειγμένο μέλος (ήδη διορθώθηκε) | Συγγενικά μέλη — παρατήρηση, όχι αλλαγή |
|---|---|---|
| CLOSING | `isModelPreClosing` | CLARITY CLOSURE, USER CLOSURE, FALSE BREAKTHROUGH, PASSIVE AGREEMENT |
| CONFUSION / BRIDGING | Reflection bridging (MI-informed) | VAGUE, NOISY, STALLED, TOPIC DRIFT, SIMULATED CONFUSION |
| ADVICE | CONTEXT LOCK, `looksLikeAdviceCascade` | FACT/ANALYSIS classification, FIRST SUBSTANTIVE RESPONSE RULE |

*Κανόνας: family-grouping στοχεύει παρατήρηση, ποτέ δεν αναβαθμίζει αυτόματα προτεραιότητα υλοποίησης χωρίς δικό του evidence.*


---

## ΚΑΤΑΣΤΑΣΗ ΣΗΜΕΡΑ — Evidence Architecture, πρώτος κύκλος

**Τι έφτασε στον χρήστη:** COMMITMENT (ζεύγος πριν/μετά) και RECURRING (cross-session, με τα
αποσπάσματα), και οι δύο code-computed, και οι δύο με mutation-tested φρουρούς. Το Blueprint
αποδίδει τρεις **προαιρετικές** ζώνες: ΜΠΗΚΕΣ ΜΕ (evidence), ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ (pattern),
ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ (evidence). Ζώνη χωρίς στοιχείο **απουσιάζει**, ποτέ κενό πλαίσιο.

### SHIFT — αναβλήθηκε οριστικά για τώρα, με καταγεγραμμένη αιτία

Το SHIFT δήλωση→δήλωση απαιτεί δύο ρητές δηλώσεις του χρήστη. Η δεύτερη (η λέξη που κρατά)
έχει πλήρη αλυσίδα provenance μέσω του κρυφού tag `[[EARLY_WORD:yes]]`. **Η πρώτη δεν έχει
καμία:**

1. η απάντηση στην ερώτηση DECISION SPACE ANCHORS δεν συλλαμβάνεται πουθενά·
2. το «MANDATORY» είναι οδηγία προς το μοντέλο, όχι εγγύηση κώδικα·
3. ο `detectsAnchorsInvited` αναγνωρίζει **4/8** εύλογες αναδιατυπώσεις της ερώτησης.

Το (3) είναι το αποφασιστικό: χωρίς αξιόπιστη γνώση ότι η ερώτηση τέθηκε, το «το επόμενο μήνυμα
είναι η δήλωση» είναι **συναγωγή, όχι απόδειξη**.

### Όταν ξανανοίξει — DECLARATION_EVENT abstraction, όχι tag ανά signal

Η προφανής διόρθωση είναι ένα ακόμη κρυφό tag για αυτή τη μία ερώτηση. **Να μην γίνει έτσι.**
Το πρόβλημα δεν είναι ειδικό: κάθε μελλοντικό signal που χρειάζεται να αποδείξει *«αυτή η
απάντηση απαντά σε εκείνη την ερώτηση»* θα ζητήσει το δικό του tag, και θα καταλήξουμε με
N ad-hoc μηχανισμούς για ένα κοινό πρόβλημα.

Αντ' αυτού να εξεταστεί **DECLARATION_EVENT**: η ερώτηση εκδίδεται με ταυτότητα, και η επόμενη
απάντηση συνδέεται ρητά ως `response_to` εκείνης της ταυτότητας. Γενικευμένη υποδομή, μία φορά,
αντί για patch ανά signal. Τα υπάρχοντα `[[EARLY_WORD]]` και `[[EXIT]]` γίνονται οι πρώτοι
καταναλωτές της.

**Πότε:** στο ίδιο commit με το εκκρεμές `ΒΡΗΚΕΣ` sourcing fix, αφού και τα δύο ακυρώνουν το
prompt cache — μία ακύρωση, δύο διορθώσεις.

**Έγινε.** Το `DECLARATION_EVENT` υπάρχει σήμερα ως `issueDeclaration` / `linkDeclarationResponse` /
`getDeclaration`, session-scoped, χωρίς καμία αποθήκευση — άρα καμία νέα κατηγορία
δεδομένων και καμία αλλαγή στο consent. Πρώτος καταναλωτής: `EARLY_WORD`, δίπλα στο
υπάρχον ref, όχι αντικαθιστώντας το.

Η αξία του είναι στις **αρνήσεις**: απάντηση χωρίς ερώτηση δεν συνδέεται, απάντηση πριν
από την ερώτηση δεν συνδέεται, δεύτερη απάντηση σε ήδη απαντημένη δεν συνδέεται.
Αυτές οι αρνήσεις είναι το Zero Inference σε κώδικα.

**Το SHIFT παραμένει μη υλοποιημένο.** Η υποδομή υπάρχει, το κενό (1) — η απάντηση στο
DECISION SPACE ANCHORS δεν συλλαμβάνεται πουθενά — κλείνει με μία κλήση `issueDeclaration`
όταν και αν αποφασιστεί. Δεν αποφασίζεται τώρα: το επόμενο βήμα είναι πραγματικοί χρήστες.

**ΒΡΗΚΕΣ:** διορθώθηκε στο ίδιο commit. Το beat έχει πλέον δικό του sourcing requirement —
τα λόγια πρέπει να είναι του χρήστη, και αν δεν διατύπωσε ποτέ εύρημα, δεν κατασκευάζεται.
Αυτό ακύρωσε το prompt cache (sha256 908109b8… → 2066c6c9…). Το DECLARATION_EVENT τελικά
**δεν χρειάστηκε αλλαγή prompt**: τα υπάρχοντα tags αποτελούν ήδη ταυτότητες. Ένα γενικό
`[[ASK:<id>]]` στο prompt απορρίφθηκε: οδηγία χωρίς καταναλωτή είναι όγκος σε ένα prompt
292.801 χαρακτήρων, όχι υποδομή.

### Παγωμένα, αμετάβλητα

Silent Profile (unsupported inference layer), `obstacles.type`, `thinkingQuality`, `clarityGain`,
`detectShadowTrigger`. DROPOUT / EMERGENCE / CONTRADICTION: καμία αξιόπιστη πηγή σήμερα —
επανεξέταση όταν διορθωθεί το stemming.

---

## G1 — ROAD MAP: προαποφασισμένος κανόνας, εκκρεμεί μόνο η μέτρηση

**Το εύρημα:** ο κανόνας ROAD DISCOVERY / ΔΡΟΜΟΣ ζει μόνο στο prompt. **Μηδέν** γραμμές
κώδικα τον απαιτούν — 17 τον παρατηρούν παθητικά. Σε δύο πραγματικές συνεδρίες
παρήχθησαν **0 χάρτες**. Αυτό σπάει τον κρίκο ΧΑΟΣ → ΔΟΜΗ.

**Γιατί δεν διορθώνεται τώρα:** δύο συνεδρίες δεν είναι δείγμα. Κάθε διόρθωση που θα γινόταν
σήμερα θα ήταν εικασία πάνω σε εικασία. Το `session_completed.roadMap` του telemetry το
μετράει πλέον απευθείας, με τον πραγματικό parser.

**Ο κανόνας απόφασης, προαποφασισμένος ώστε να μην χρειαστεί νέο audit.**
Δείγμα: **≥ 20 `session_completed`**. Ποσοστό = `roadMap:true` / σύνολο.

| Ποσοστό | Συμπέρασμα | Ενέργεια |
|---|---|---|
| **≥ 30%** | Ο κρίκος δουλεύει. Το prompt αρκεί. | Καμία. Ξεμπλοκάρει το D2 (Blueprint «δρόμοι/κόστη»). |
| **5–30%** | Πυροδοτείται, σπάνια. | Καμία ακόμα. Πρώτα: σε ποιες συνεδρίες πυροδοτείται (turns, explicitClosure). |
| **< 5%** | Ο κανόνας δεν φτάνει στο output. | **Τότε και μόνο τότε** επιλογή μεταξύ (α) και (β) παρακάτω. |

Στο < 5%, οι δύο μόνες επιλογές, με τη σειρά προτίμησης:

- **(α) Αφαίρεση του κανόνα από το prompt.** Ένας κανόνας που δεν παράγει ποτέ έξοδο είναι
  όγκος σε ένα prompt 292.801 χαρακτήρων, όχι χαμένη δυνατότητα. Το να παραδεχτούμε
  ότι δεν δουλεύει είναι πραγματικό αποτέλεσμα, όχι αποτυχία.
- **(β) Code-side trigger.** Μόνο αν το (α) απορριφθεί ρητά. **Ποτέ επιβολή χάρτη**: χάρτης
  που επιβάλλεται είναι κατασκευασμένος χάρτης, και ο κανόνας DETECT THE CHANGE, NEVER
  MANUFACTURE IT το απαγορεύει ρητά («οι δρόμοι δεν κατασκευάζονται για συμμετρία»).
  Το μόνο επιτρεπτό είναι ένα ctx που λέει στο μοντέλο ότι το υλικό το επιτρέπει — και αυτό
  υπάρχει ήδη (`roadDiscoveryDue`), άρα το (β) είναι ρύθμιση υπάρχοντος, όχι νέο σύστημα.

**Προηγείται όλων:** αν τα `session_completed` είναι ελάχιστα σε σχέση με τα `session_started`,
το ερώτημα του Road Map είναι άνευ αντικειμένου — οι άνθρωποι φεύγουν πριν φτάσουν
εκεί, και το πραγματικό πρόβλημα είναι αλλού. Αυτό ελέγχεται πρώτο.

**Δεν χρειάζεται νέο audit για αυτό.** Μόνο τα νούμερα και ο πίνακας παραπάνω.

---

## Blueprint → Decision Sheet: τι μπήκε και τι έμεινε έξω

**Έμπειρικό εύρημα:** το φύλλο δεν του έλειπαν δεδομένα — τα πετούσε. Ο `parseRoadMap`
επέστρεφε πάντα δρόμους με κέρδη/κόστη και χρησιμοποιούσαμε μόνο το `unknown`. Ο
`buildRoadArtifact` συναρμολογούσε από κώδικα τις αυτούσιες απαντήσεις ανά δρόμο και έμεναν
μόνο στο chat. Ο `classifyRoadProvenance` χαρακτήριζε ήδη κάθε γραμμή ΚΕΡΔΙΖΕΙΣ/ΚΟΣΤΙΖΕΙ
SUPPORTED / MILD / SEVERE, με αποδέκτη μόνο το debug panel.

**Μοντέλο 2, κάθετη στήλη:** ΜΠΗΚΕΣ ΜΕ → **ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ** → ΟΙ ΔΡΟΜΟΙ ΣΟΥ →
Η ΣΚΕΨΗ ΣΟΥ ΑΝΑ ΔΡΟΜΟ → ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ → ΤΙ ΑΠΟΦΑΣΙΣΕΣ. Το άγνωστο ανέβηκε **πάνω από τους
δρόμους** επειδή ο ίδιος ο κανόνας του prompt το λέει: *«SEARCH IS A PREREQUISITE, NOT A ROAD»*.

**Το footer άλλαξε κατ’ ανάγκη.** Η παλιά διατύπωση δήλωνε ότι κάθε γραμμή του φύλλου είναι
δικά του λόγια. Αυτό έπαυε να ισχύει τη στιγμή που μπήκαν γραμμές διατύπωσης της AURA.
Τρίτη φορά που διορθώνεται αυτή η κλάση λάθους (consent copy, παλιό footer, τώρα αυτό).

### ΕΚΤΟΣ, ρητά — μην περάσουν σιωπηλά

**TENSIONS (Statement A ↔ Statement B).** Εξαρτάται από `detectSelfMarkedTension` (1 κλήση, τροφοδοτεί
ctx) και `detectsBinaryOppositionPhrasing` (1 κλήση, μετρητής). **Κανένας από τους δύο δεν
παράγει δομημένο αντικείμενο με προέλευση**, και μετρήθηκαν αναξιόπιστοι: χάνουν
πραγματικά παραδείγματα και πυροδοτούν σε τετριμμένα.

**ΓΕΝΙΚΟ DEPENDENCY GRAPH (X → αν ισχύει → Y).** Καμία πηγή. Η **μία** εξάρτηση που είναι
ήδη αποδεδειγμένη — το άγνωστο μπλοκάρει όλους τους δρόμους — εκφράζεται ήδη από τη **θέση**
του αγνώστου πάνω από τους δρόμους. Τίποτα άλλο δεν χτίζεται χωρίς evidence.

**ΓΙΑ ΑΡΓΟΤΕΡΑ, το κρίσιμο εμπορικό όριο:** όλες οι νέες ζώνες εξαρτώνται από το αν
βγήκε Road Map. Το ταβάνι αξίας του φύλλου το ορίζει το ποσοστό συνεδριών που παράγουν
χάρτη — ακριβώς το νούμερο του G1. Η τηλεμετρία το μετράει ανεξάρτητα (`blueprint_generated.roads`).

---

## Blueprint: το κέντρο βάρους — τι μπήκε, τι μένει για δοκιμή

**Έμπειρικό εύρημα του audit:** το **δωρεάν Αρχείο έδειχνε περισσότερα στοιχεία
ανά συνεδρία από το πληρωμένο Blueprint** — η κάρτα του Αρχείου τύπωνε ημερομηνία +
`before` + `peak` + `shift` + τη λέξη, ενώ η ζώνη ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ του φύλλου μόνο `before`.

**Η απόφαση: το Αρχείο ΔΕΝ φτωχαίνει.** Τρεις λόγοι:
1. Το `peak` είναι **αυτούσια δικά του λόγια**. Παραπέτασμα πάνω στα λόγια του αντιφάσκει
   με το User Ownership — δηλαδή με αυτό ακριβώς που πουλάμε.
2. Είναι ήδη στη συσκευή του (`localStorage`). Απόκρυψη από το UI θα ήταν **νέα ασυμφωνία**
   με το consent copy — ίδια κατηγορία λάθους με το footer και το consent, διορθωμένα δις.
3. Η ασυμμετρία δεν είναι ποσότητα, είναι **μορφή**: το Αρχείο είναι λίστα θραυσμάτων.
   Το φύλλο κουβαλά δρόμους, κόστη με ετικέτα προέλευσης, απαντήσεις ανά δρόμο, επιβεβαίωση Κ4,
   και το άγνωστο ως επικεφαλίδα — τίποτα από αυτά δεν μπορεί να κρατήσει το Αρχείο.

Το να χειροτεύεις ένα δωρεάν κομμάτι για να πουλήσεις άλλο είναι η ίδια οικογένεια με τα retention loops
και το gamification που το προϊόν αρνείται παντού αλλού. **Επανεξέταση μόνο αν δεδομένα
δείξουν ότι το Αρχείο οντως υποκαθιστά το φύλλο** — κανείς δεν το έχει μετρήσει σήμερα.

### ΓΙΑ ΔΟΚΙΜΗ ΑΡΓΟΤΕΡΑ — όχι τώρα

| | Τι είναι | Γιατί περιμένει |
|---|---|---|
| **Ε1** | «Τι μου ζήτησες» — τα `stylePreferences` αυτούσια πίσω στον χρήστη | Ασφαλές, αλλά αδοκίμαστη αξία |
| **Ε3** | Χρονικός άξονας από τα ήδη υπάρχοντα `at` | Καθαρά οπτικό, δεύτερης προτεραιότητας |
| **Ε4** | Το φύλλο να δηλώνει την ίδια του τη φτώχεια ως εύρημα | Θέμα διατύπωσης — να δοκιμαστεί με ανθρώπους |

### ΕΚΤΟΣ ΡΗΤΑ

**Ε2 — «Τι αφαίρεσες» (μέτρηση απορρίψεων Κ4).** Ένας αριθμός απορρίψεων μπορεί να
διαβαστεί ως βαθμολογία. Να μην μπει πριν δοκιμαστεί με πραγματικούς ανθρώπους.

**Αλληγορικές / έμμεσες ερωτήσεις με κρυφό σκοπό — ΠΟΤΕ.** Συλλογή δεδομένων μέσω
παραπλάνησης για τον σκοπό της ερώτησης. Ιδια κατηγορία με το Silent Behavioral Profiling
— και χειρότερη, γιατί εκεί η συλλογή ήταν σιωπηλή, ενώ εδώ θα ήταν ενεργή. Σημείωση:
ο κώδικας του Silent Profile **υπάρχει ακόμη** πίσω από consent gate (`0a937d2`) — μια
«παιχνιδιάρικη» ερώτηση θα του έδινε ακριβώς το είδος εισόδου που δεν έχει σήμερα.

---

## Queued cache-invalidating change: align the cached Part 1 definition

**Recorded 2026-09-22. Not done yet — deliberately queued.**

### The issue

`SYSTEM_TERMINATION` line 1119 still reads:

> `── PART 1 (first reply — REFLECTION SUMMARY + word request) ──`

`419ea67` removed the narrative from Part 1 by rewriting the **per-turn trigger
message** only, and left the cached block untouched on purpose, to protect the
prompt cache. Verified: `git show 419ea67 | grep -c "PART 1 (first reply"` → `0`.

On the Part 2 call the model therefore reads three things that cannot all be true:

1. a system prompt saying Part 1 contains a reflection summary,
2. a conversation history in which Part 1 contained no such summary,
3. a trigger saying *"Do not **repeat** the Reflection Summary or the
   word-question"* — a word that presupposes it already happened.

It reconciles them by delivering the missing Part 1 in full, then Part 2. Measured
on the live 2026-09-22 transcript: the Part 2 turn matched the cached Part 1 spec
on every countable dimension — 8 sentences against "4-8", a 7-word opening against
"≤15", ending on the exact prescribed last line, carrying the spec's own
«παραμένει» steady-anchor formulation.

`419ea67`'s own commit message predicted this under OUT OF SCOPE: *"Part 2 can
still retell. Its own instruction already forbids that and the model ignored it
once."* It did, and it took the word-question with it.

### The correct repair

Align the cached Part 1 definition with what the per-turn trigger already dictates:
the word-to-remember question and essentially nothing else, no reflection summary.
Once the cached text and the trigger agree, the contradiction disappears at its
source.

### Why it is not done now

It invalidates the prompt cache. It joins the queue for a single future
cache-invalidating commit, together with:

- **the disconnected 1-10 question** (`CLARITY + OWNERSHIP SCALE`, line 407): its
  trigger is model-judged — *"The moment a concrete, specific next step has
  emerged"* — and on the live transcript no code gate armed it at all
  (`detectsConcreteStep` matched nothing all session). Prompt-level by nature.
- **the ΒΡΗΚΕΣ / DECLARATION_EVENT rewrite.**

### Precondition, binding

The code-level filter shipped today (`stripRepeatedClosing`,
`stripPrematureFarewell`, `wordQuestionDelivered`) **stays in place after the
prompt is fixed.** It is not scaffolding to be removed once the cached text is
aligned. `419ea67` already demonstrated that a single sentence of instruction to
the model does not hold: the Part 2 trigger forbade exactly this and was ignored.
A second line of defence that costs nothing at runtime is kept.

### What was deliberately NOT filtered, and why

The reflection summary is **not** pattern-matched. Part 2's own `STEP 2` spec
prescribes, verbatim, *"Ξεκίνησες προσπαθώντας να Χ. Στην πορεία η ερώτηση έγινε
Υ."* — narrative prose is legitimate Part 2 output, so a summary detector would cut
the very text Part 2 exists to write. The word-question is the only safe anchor: it
has fixed prescribed wording, is forbidden in Part 2 without exception, and its own
spec places it last in Part 1. Everything up to and including it is therefore
misplaced Part 1 **by position**, and the summary is removed with it — never by
matching its prose.

### Known residual limit

`stripPrematureFarewell` cannot stop the premature farewell where it is written.
That reply is committed to state at `App.jsx:4826` and `decideTermination` does not
run until `:4964`. The farewell is removed at the only moment the answer is known
for certain — as the closing sequence delivers its own first message, in the same
atomic state update. A viewer watching that exact turn may see the farewell briefly
before it is removed.

---

## Road map exit contract (shipped 2026-09-22)

**The measured problem.** A live session produced roads three separate times and
`parseRoadMap` returned null on all three, so the sheet carried no decision space at
all. The only watchdog, `detectOutputViolation`'s `ROAD_MAP_MISSING`, fired **zero**
times on that session: it requires 3+ bulleted lines and user stagnation, the real
failure had neither, and it only ever increments a debug-panel counter.

**What the contract does.** `extractRoadMapFromProse` re-reads accumulated assistant
history for the same three labels the specification names — ΔΡΟΜΟΣ, ΚΕΡΔΙΖΕΙΣ,
ΚΟΣΤΙΖΕΙ — in layouts `parseRoadMap` refuses: inline, lowercase, accented, bulleted,
separated by `·` or `—` instead of `:`. Pure code over text already written; no model
call. Native parsing always wins; recovery only ever sees what produced nothing.

**The rule is derived from the specification, not from the transcript.** That is the
standing lesson from `parseRoadMap`, which was widened twice by reading one session
each time and broke on the next. The prompt's EXACT FORMAT block names three slots;
what it never asked for — three consecutive lines, capitals, a colon — stops being
required. Nothing else was inferred.

### What it deliberately cannot do

It does **not** recover roads written as plain prose with no label words. The live
session wrote «Διδακτορικό για διεύθυνση — 10+ χρόνια, χωρίς άμεσο εισόδημα.»
Deciding that "10+ χρόνια" is a cost and "διεύθυνση" a gain is semantic judgment,
which the contract forbids, and guessing it would manufacture a decision space the
person never saw. **This contract would not have rescued the session that motivated
it.** It closes the "labels written, layout wrong" door; the "labels never written"
door stays open, and `roadsRecovered` exists to keep the two rates apart.

Those prose lines are pinned in `test_road_recovery.js` as **refusals**, not targets.

### Conservative thresholds, each pinned by a mutation

- all three labels, in the specified order, within one paragraph
- each followed by a separator and non-empty content — a road without its cost is not
  a road, per the prompt's own DELIVERY rule
- a field over 240 characters means a paragraph was swallowed, not a field read
- ΔΡΟΜΟΣ must not head a longer word; the guard is narrow by construction and matters
  for ΚΟΣΤΙΖΕΙ alone, since the other two labels end in a final sigma, which is
  word-final by definition
- dedupe by normalised name, hard cap of five — a run that finds more has stopped
  reading a map and started collecting label words

### Downstream

A recovered map sets the same `roadMapDelivered` a native one would, so Road
Questions, Κ4 and the Blueprint zones behave identically. Every recovered line goes
through `classifyRoadProvenance` on the same path as a native line, so UNVERIFIED
content carries the existing «μη ελεγμένο» mark rather than passing silently as
ordinary. `roadMapRecovered` is kept separate from `roadMapDelivered` so the recovery
can never mask the compliance failure it survives.

Telemetry key is `roadsRecovered`, not `roadMapRecoveredViaExtraction`: the schema
caps a key at 24 characters. Meaning unchanged.

### Restated invariant

`test_signals`' "the unknown comes from a parsed road map, never from prose" was a
proximity regex and broke on a comment placed between the two tokens. Restated to
test the intent. The intent itself widened deliberately: the unknown may now come
from a recovered map too, because recovery reads ΑΓΝΩΣΤΟ off its own label exactly
as the native parser does. The zone still cannot carry anything the person did not
name under that label.

### Explicitly out of scope

No generalisation to stakes, thresholds or assumptions. The map only.

---

## Session coverage report (shipped 2026-09-22)

**The asymmetry it addresses.** `dynamicSuffix` sends the model twenty ctx signals a
turn and almost all are INSTRUCTIONS — *"use that specific response"*, *"these take
priority"*, *"switch now"*. Exactly one, `materialEvidenceCtx`, is framed as an
observation: counted from the user's own messages, *"surfaced here so they do not have
to be recalled"*, headed OBSERVATION ONLY, NOT A SUFFICIENCY JUDGMENT.

An instruction tells the model what to do this turn. A report tells it where it is.
Only the second lets it choose to go deeper, to reflect, or to move past something.
`buildCoverageReport` is a sibling of that one report.

### The two facts it carries, both already computed and discarded

**(A) Which signal families have already fired.** `EXPLORATION COVERAGE PRINCIPLE`
asks for exactly this — *"prefer whichever of these you have not yet used this
session"* — and no variable ever remembered it. The PROTOCOL COLLISION LOGGER already
computes the list every single turn and drops it on `window`. Accumulating it is
transport, not new logic. Fourth instance of that pattern in this codebase, after
`peak`, `roadAnswersFinal` and `classifyRoadProvenance`.

**(B) Question density.** Consecutive replies ending in a question, and replies since
the last structural output. A live session produced eleven replies, **all eleven**
ending in a question, with no structural output at all. `PROBLEM STRUCTURE MAP`
already says what to do — *"once 1-2 detecting questions have surfaced enough… reflect
that shape back"* — so the rule existed and only its trigger was blind.

### It reports and never directs

Not a stylistic preference. A twenty-first order in a prompt already carrying twenty
would compete with the rules rather than feed them. It sits in **tier 1** of
`dynamicSuffix` (informational background), beside `materialEvidenceCtx` — the
position of lowest attention, which is the right place for a report and is
deliberately not the hard-constraint tier at the end. Pinned by a mutation that
appends a second copy there.

Every line it adds is a counted number. No new rule, no new detector, no semantic
judgment, and nothing it emits decides anything.

### The structural predicate is injected, not copied

A first version spelled the label patterns out inside the function, and
`test_format_compliance`'s *"only one place still spells out the road label pattern"*
caught it on the full-suite run. `structuralLabelsIn` is the single source of truth;
two patterns for one question drift, and this repo has paid for that before. The
caller injects `t => { const l = structuralLabelsIn(t); return l.road || l.beat; }`.
Stronger than lockstep — there is nothing to keep in step. A missing or non-function
predicate reports "none", never a guess.

### Independent of the road-map exit contract

By construction: it counts labels present in the text and reads no state from that
work — no `roadMapDelivered`, no `roadMapRecovered`, no `extractRoadMapFromProse`.
Pinned by an assertion and by a mutation that introduces such a read. Either can be
reverted without touching the other.

### What it does not do

It does not enforce. Measured on the same live session: `firstReplyFloorCtx` declares
itself *"code-enforced floor, not a suggestion"* and forbids binary-choice framing on
the first reply; that reply was *"…δεν έρχεται κόσμος, **ή** κάτι άλλο…"*. Anything
delivered as prompt text is a suggestion. This raises the probability of a
better-aimed next question; it cannot compel one. Enforcement needs a hard override —
the product has two — and that is a separate decision with the reverted Anchors/Stakes
gates behind it.

---

## Phase 1: the lens selector actually selects (shipped 2026-09-22, REVERTED 2026-09-25)

> **This entry is history, not current behaviour.** The selector was reverted after it caused
> a No-Advice violation in a real session. See *Phase 1 reverted*, below. What survived the
> revert: `activeLensRef` and the `lens`/`lensSwitches` telemetry.

**Measured before the change.** AURA has four system prompts — SIMPLIFY, CHALLENGE,
PERSPECTIVE, EXPLORE — and a working chooser, `inferLensFallback`. It was reached from
**one** place: the First-WHY branch, which requires an opening of 60 words or fewer
(RT-08's threshold, added so a long first message would not have its context discarded).

On the two real sessions we have:

| session | needsFirstWhy | lens it would get | lens it got |
|---|---|---|---|
| nurse/teacher | false (74 words) | **EXPLORE** | SIMPLIFY |
| gaming | false (74 words) | **PERSPECTIVE** | SIMPLIFY |

Both ran end to end on SIMPLIFY, and three of the four prompts were unreachable for
anyone arriving with something substantial to say. Not dead code — a strategy selector
that does not select, and when it does not run every session gets the same strategy.

`decideOpeningLens` is now called on the main path for the session's first user message.

### Chosen once, from the opening

Re-deciding every turn would let the lens thrash on a single stray word. The existing
switch points — after a compression pass, and on distress — remain the only other places
it moves. Anything outside the four known lenses is refused rather than folded into the
default: a wrong lens chosen confidently is worse than the default chosen honestly.

### The async trap, and why a ref exists

`setActiveLens` is React state. Calling it and then awaiting `generateResponse` in the
same tick leaves the callback reading the OLD value, so the lens would apply from the
NEXT turn — on the very turn it matters most. **The distress path at the time of writing
already had exactly this defect**, silently: it set PERSPECTIVE and then immediately
called `generateResponse`, which used whatever lens was there before.

`activeLensRef` mirrors the state and is written synchronously at every change site;
`getLensPrompt` now reads the ref at both call sites. Same mirror pattern as
`introChoiceRef`, but set directly rather than through an effect, because an effect is
also too late.

### Telemetry

`lens` travels as a code (0–3 in fixed order, **4 for unknown — deliberately not 0**, so
a mapping failure can never read as a session that ran on SIMPLIFY) and `lensSwitches`
counts the moves. **Zero is the finding**, not a blank: it means the selector never ran,
which is the state every session was in until now.

### Scope

No cached block touched. Twelve mutations, none survived.

---

## Phase 1 reverted: a lens is a single-use instrument, and session state cannot hold one (2026-09-25)

**A real user paid for the change above, within three days.** A 41-year-old nursing teacher,
four children, 1300€, opened a session with a 39-word message. `needsFirstWhy` was false, so it
took the main path — where the new selector ran and chose **EXPLORE**.

`SYSTEM_LENS_EXPLORE` says, verbatim:

> "Surface options the user has not considered or has dismissed too quickly."
> "2–3 directions maximum."
> "What are you ruling out before examining it?"

AURA produced exactly three directions he had never raised — φροντιστήριο/ιδιαίτερα, online
διδασκαλία, σύνταξη εκπαιδευτικού υλικού — then proposed a second public-sector post, then
conceded it did not know whether that was legal for a civil servant. He answered:

> "Άρα μου προτείνεις κάτι που δεν ξέρεις αν επιτρέπεται και με βάζεις να το ψάξω?"

That is **No Advice**, the first non-negotiable, broken. The lens did not malfunction — it did
exactly what its prompt instructs.

### The real defect was duration, not choice

Every one of the four lens prompts ends with:

> "USE THIS LENS ONCE. Ask one question. Then stop and wait."

But `activeLens` is **session-level**. That contradiction sat harmless in the codebase for as
long as the lens was always SIMPLIFY, whose instruction is purely subtractive — *"Never add
complexity. Never introduce new considerations. Remove."* A standing instruction to remove
degrades into no instruction. A standing instruction to **surface options** becomes a generator,
and it was aimed at a man who had just said he has none.

The Phase 1 entry argued the selector should decide **once, from the opening**, to stop the lens
thrashing. That reasoning was sound about *when to choose* and silent about *how long the choice
lasts* — and the prompts had already answered the second question. I did not read them against
the state they were being wired into.

### What was removed, and what was kept

| | |
|---|---|
| `decideOpeningLens` — function **and** call site | **removed** — deleted outright, not left uncalled, so nothing reads as merely unwired |
| `activeLensRef` + writes at all four change sites | **kept** — it fixes a real pre-existing bug: the distress path set PERSPECTIVE and immediately awaited `generateResponse`, which read the old state, so the lens applied a turn late |
| `getLensPrompt(activeLensRef.current)` at both call sites | **kept** — same reason |
| `lens` / `lensSwitches` telemetry | **kept** — how often the lens actually moves is a number we had no way to see before. With the selector gone, `lensSwitches` of 0 is now the *expected* reading, and anything above 0 is a compression pass, distress, or First-WHY |

The lens returns to SIMPLIFY for every session: known-good behaviour, and the state every
session was already in before Phase 1.

### The precondition for ever re-landing this

Not "add a test". The one-shot contract has to be resolved first, one of two ways:

1. **Scope the lens to a single turn** — it applies to one reply and reverts, matching what the
   prompts already claim, or
2. **Rewrite the four lens prompts to survive standing use** — drop "USE THIS LENS ONCE" and
   make each safe as a persistent posture.

Both touch prompt text, so both are cache-invalidating and belong in the queued batch. Until one
is done, wiring any chooser to the main path re-creates this exact failure.

### Scope

No cached block touched — all nine prompt blocks verified byte-identical, cache prefix intact.
Seven mutations, none survived. Full suite 57 suites / 1765 passed / 0 failed / 0 silent.

**Process note.** One mutation in this round first read as a survivor and was not: the source
line carries alignment padding, so a `replace` written with single spaces silently matched
nothing. A mutation that fails to apply is indistinguishable from a test that fails to catch.
Mutation scripts now assert the file actually changed before running the suite.

---

## The approved order after the lens incident, and what the single cache write contains (2026-09-25)

Founder-approved. The governing principle is **build the net before you climb again**: the lens
incident was caused by a change, but it went undetected because every output-side guard we own
keys on grammatical form. Order 1→5 ships first; 6 is one cache write at the end.

| # | work | cache |
|---|---|---|
| 1 | Unsourced-option detector — catches advice delivered as a declarative sentence | none |
| 2 | CI runs 33 suites while 57 exist — 24 never run | none |
| 3 | Map the 35 one-shot prompt rules against the ~19 code latches (read-only) | none |
| 4 | Re-land the lens via `deliverOnce(..., budget 1)` — one turn, as its prompt says | none |
| 5 | Phase 0 — `test_tag_contract_integrity` per block, catching the `[[EXIT]]` class | none |
| 6 | **One cache write, four changes together** — below | one write |

### Why the lens fix is cache-neutral (measured, not assumed)

`callAura` puts the breakpoint at the END of `AURA_CORE_PERSONALITY` and nowhere else. Every lens
prompt is `CORE + suffix`, so the suffix already lands in the uncached second block. Moving that
suffix text into a `deliverOnce` ctx therefore costs **no cache write at all**. This is why item 4
does not have to wait for item 6.

### Item 6 — the single cache write, four changes in it

1. **EXPLORE stops having its own authority to generate roads.** Founder's decision, with the
   reason that makes it structural rather than cosmetic: PATH GENERATION already has a legitimate
   gate (explicit repeated request, or directions genuinely implied by the user's own material)
   **and** a code-level provenance audit via `classifyRoadProvenance`. EXPLORE bypassed both
   through a second, unconnected authority. Routing EXPLORE *through* PATH GENERATION's gate makes
   the self-contradiction disappear structurally — rather than softening the wording, which would
   leave the second authority in place.
2. **The EXPLORE self-contradiction itself**: "You are not generating options for the user"
   sitting six lines above "Surface options the user has not considered… 2–3 directions maximum."
   The model resolved it toward the operative instruction, correctly. The first line is decoration.
3. **Epistemic-status tagging** — USER STATED / AURA INFERENCE / UNKNOWN. Founder's framing, and
   it is the *structural* counterpart to item 1 of the sequence, not an alternative to it: the
   detector catches the harm **after** it is produced and counts it; the tags force the model to
   declare what is UNKNOWN **before** it writes it as a road. Both are wanted.
4. **Three-way categorization of excluded roads** — ruled out by-you / unavailable-by-constraints /
   not-yet-examined. Collapsing these three into one "excluded" bucket is what let the teacher
   session treat a legal prohibition as if it were a preference.

Already queued for the same write from earlier sessions: Part 1 definition alignment in
`SYSTEM_TERMINATION`, the model-judged 1-10 trigger, ΒΡΗΚΕΣ/DECLARATION_EVENT, and possibly moving
the `[[EXIT]]` instruction to a block that actually reaches its parser.

### Explicitly parallel, not in the sequence

The GOAL / OBSTACLE / STAKES gap the teacher session exposed (time pressure, psychological
pressure, what was tried and rejected) touches neither cache nor lens. It runs whenever convenient
and must not delay 1→6.

