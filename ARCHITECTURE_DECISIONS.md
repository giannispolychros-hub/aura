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

---

## Watch List — family-adjacent πρωτόκολλα, χωρίς άμεσο evidence, προς ειδική προσοχή στο επόμενο ζωντανό τεστ

Δεν έχουν αλλάξει. Καταγράφονται **μόνο** για να ξέρουμε πού να κοιτάξουμε πρώτα στο επόμενο πραγματικό transcript — όχι ως πρόθεση αλλαγής.

| Family | Αποδεδειγμένο μέλος (ήδη διορθώθηκε) | Συγγενικά μέλη — παρατήρηση, όχι αλλαγή |
|---|---|---|
| CLOSING | `isModelPreClosing` | CLARITY CLOSURE, USER CLOSURE, FALSE BREAKTHROUGH, PASSIVE AGREEMENT |
| CONFUSION / BRIDGING | Reflection bridging (MI-informed) | VAGUE, NOISY, STALLED, TOPIC DRIFT, SIMULATED CONFUSION |
| ADVICE | CONTEXT LOCK, `looksLikeAdviceCascade` | FACT/ANALYSIS classification, FIRST SUBSTANTIVE RESPONSE RULE |

*Κανόνας: family-grouping στοχεύει παρατήρηση, ποτέ δεν αναβαθμίζει αυτόματα προτεραιότητα υλοποίησης χωρίς δικό του evidence.*

