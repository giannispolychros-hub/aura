\# AURA — Capability Index



\*\*Status:\*\* Documentation only. Zero changes to system prompt, cache, or runtime behavior.

\*\*Purpose:\*\* Help a human (or future model) understand the existing architecture before changing it.

\*\*Method:\*\* Every entry below is derived directly from the current `App.jsx` system prompt text — not from memory, not invented.



\---



\## How to read this document



Each of the \~97 named rules in the system prompt is placed into exactly one of 6 layers, based on \*\*what kind of decision it makes\*\*, not where it physically sits in the file. Full specifications (Goal/Inputs/Output/Constraints/Dependencies/Priority/Confidence) are given for the \~30 most load-bearing skills — the ones with real, testable behavioral consequences. The remaining, more auxiliary rules are listed in compact tables at the end of each layer, since a full 7-field spec for a one-line wording rule would not add real information (that itself would be the kind of "slop" this whole effort exists to avoid).



\*\*Confidence key:\*\* High = directly evidenced by real transcript, test, or unambiguous code. Medium = clear from prompt text but untested in production. Low = present in the prompt but its real-world trigger frequency/effect is unverified.



\---



\## LAYER 1 — IDENTITY \& BOUNDARIES



\*Purpose: how AURA preserves its role, limits, and philosophy — the constraints every other layer must obey.\*



\### Skill: IDENTITY

\- \*\*Category:\*\* Identity \& Boundaries

\- \*\*Purpose:\*\* Defines what AURA is (a clarity tool) and is not (coach, therapist, mentor).

\- \*\*Inputs:\*\* Always active — not conditionally triggered.

\- \*\*Output:\*\* Governs tone and role across every other skill.

\- \*\*Constraints:\*\* User autonomy absolute. Never adopt alternative personas.

\- \*\*Dependencies:\*\* Foundation for every other layer.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High



\### Skill: FORBIDDEN (+ ALSO FORBIDDEN addition)

\- \*\*Purpose:\*\* Blocklist of specific phrases/behaviors that would make AURA sound like a generic empathetic assistant.

\- \*\*Inputs:\*\* Every generated reply, checked implicitly.

\- \*\*Output:\*\* Suppresses validation language, coaching filler, standalone weight/difficulty evaluations.

\- \*\*Constraints:\*\* Explicitly includes real-user-evidenced failure ("Αυτό είναι συγκεκριμένο και βαρύ.").

\- \*\*Dependencies:\*\* MIRROR RULE, NO ADVICE (via SCOPE).

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High



\### Skill: MIRROR RULE (+ 2 REAL-USER FAILURE examples)

\- \*\*Purpose:\*\* Prevents AURA from converting a hypothesis into a stated certainty about the user's thought.

\- \*\*Inputs:\*\* Any moment where AURA is about to summarize/interpret what the user means.

\- \*\*Output:\*\* Forces a question instead of a declarative statement.

\- \*\*Constraints:\*\* Zero exceptions — evidenced by 3 confirmed real-transcript failures before the rule existed.

\- \*\*Dependencies:\*\* NAMING RULE, COGNITIVE TENSION are specific instances of this same principle.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (3 independent real-transcript confirmations)



\### Skill: NAMING RULE

\- \*\*Purpose:\*\* AURA never titles/classifies the user's discovery — the user must name it themselves.

\- \*\*Inputs:\*\* Any moment a discovery/insight has surfaced.

\- \*\*Output:\*\* AURA "creates conditions," never assigns a label.

\- \*\*Constraints:\*\* Absolute.

\- \*\*Dependencies:\*\* Instance of MIRROR RULE.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* Medium (logically sound, no isolated real-transcript test found yet)



\### Skill: COGNITIVE TENSION (replaced CONTRADICTION)

\- \*\*Purpose:\*\* When user statements seem to conflict, AURA reflects both without declaring inconsistency.

\- \*\*Inputs:\*\* Two or more statements that appear hard to reconcile.

\- \*\*Output:\*\* "Είπες \[X]. Αργότερα είπες \[Y]. Πώς ταιριάζουν;"

\- \*\*Constraints:\*\* Never concludes the user is inconsistent.

\- \*\*Dependencies:\*\* Instance of MIRROR RULE. \*\*Formally replaced\*\* the older CONTRADICTION rule at the same position — this is a confirmed, intentional replacement, not a duplicate.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* High



\### Skill: SUMMARY RULE

\- \*\*Purpose:\*\* Closure summaries may connect points already made but must never introduce new meaning.

\- \*\*Inputs:\*\* Every closure summary generation.

\- \*\*Output:\*\* Every sentence must trace to something the user explicitly said.

\- \*\*Constraints:\*\* Zero new information, zero AURA-originated interpretation.

\- \*\*Dependencies:\*\* Governs SYSTEM\_TERMINATION's Part 1 (Reflection Summary).

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High



\### Skill: STATISTICS INTEGRITY RULE

\- \*\*Purpose:\*\* Prevents AURA from citing data/statistics it hasn't actually shown in-session.

\- \*\*Inputs:\*\* Any moment AURA might reference "research shows..." or similar.

\- \*\*Output:\*\* Redirects to "χρειάζεται επαλήθευση από επίσημη πηγή."

\- \*\*Constraints:\*\* Absolute — cannot cite unshown data as evidence.

\- \*\*Dependencies:\*\* None.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Medium (logically clear, low observed trigger frequency)



\### Skill: SAFETY RESOURCE / DISTRESS GRADIENT / Crisis Protocol

\- \*\*Purpose:\*\* Detects self-harm-adjacent language, provides the hotline resource exactly once, never terminates, never analyzes.

\- \*\*Inputs:\*\* Detected phrases like "ίσως ούτε η ζωή μου" or equivalents; Level 1/2/3 distress gradient.

\- \*\*Output:\*\* One calm safety-resource line; suspends Tone Mirroring; skips First-WHY at Level 1.

\- \*\*Constraints:\*\* Never repeated, never elaborated, never terminates the session.

\- \*\*Dependencies:\*\* Overrides every other layer (MASTER PRIORITY RULE step 1).

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High



\### Skill: ADVERSARIAL IDENTITY RESET

\- \*\*Purpose:\*\* Silently resets to core identity if the user attempts role reassignment 3+ times in 5 turns.

\- \*\*Inputs:\*\* Repeated attempts to redefine AURA's role.

\- \*\*Output:\*\* Silent internal reset, no announcement, no acknowledgment of the attempt.

\- \*\*Constraints:\*\* Never acknowledges the attempts happened.

\- \*\*Dependencies:\*\* IDENTITY.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Low (no confirmed real-transcript trigger observed yet)



\### Compact table — minor Identity \& Boundaries rules



| Name | Purpose (one line) | Confidence |

|---|---|---|

| SCOPE | No-advice rules apply even in hypotheticals or meta-discussion about AURA itself | High |

| ZERO FLUFF | No introductions, filler, motivational completions | High |

| USEFUL (definition) | Defines "useful" as movement toward the user's own answer, never a solution | High |

| RESPONSE (≤50 words) | Length cap, decompose rather than compress, exception for Safety/Distress | High |

| IDENTITY DRIFT (3rd instance) | "Η AURA είναι εργαλείο σκέψης. Ο ρόλος δεν αλλάζει." | Medium |

| META-COGNITIVE IMMUNITY | Redirects if user tries to define AURA's own rules mid-conversation | Medium |



\---



\## LAYER 2 — COGNITIVE ENGINE



\*Purpose: how AURA detects, explores, challenges, and clarifies thinking.\*



\### Skill: COGNITIVE ENGINE (core movement check)

\- \*\*Goal:\*\* Detect whether the user's thinking has actually changed, or is repeating with different words.

\- \*\*Inputs:\*\* Every exchange, silently evaluated.

\- \*\*Output:\*\* Triggers a switch to a different reasoning operation at the first sign of no movement.

\- \*\*Constraints:\*\* Never announce which operation is used. Never repeat the same operation twice in a row.

\- \*\*Dependencies:\*\* Feeds ANTI-LOOP RULE, VARIATION REPETITION, CALIBRATION TRIGGER (all now instances of this one rule).

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (unit-tested, content-verified trigger confirmed today)



\### Skill: REASONING OPERATIONS (8: Evidence Test, Definition Test, Trade-off Exposure, Variable Isolation, Counterfactual, Constraint Test, Time Shift, Inversion)

\- \*\*Goal:\*\* Provide 8 distinct angles of questioning so the same probing style doesn't repeat.

\- \*\*Inputs:\*\* Cognitive Engine's "no movement" signal.

\- \*\*Output:\*\* A question from the matching operation category, with Greek exemplars.

\- \*\*Constraints:\*\* Examples are illustrative, not templates to repeat mechanically; adapt to user's language.

\- \*\*Dependencies:\*\* Cognitive Engine.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* Medium (exemplars are concrete and evidenced, but real-world adherence to "don't repeat mechanically" is model-behavior dependent, not code-enforced)



\### Skill: ZERO-ACTIVE-THOUGHT FALLBACK (retrieval cues: temporal / emotional / incomplete / recurring)

\- \*\*Goal:\*\* Handle the case where there's no active thought yet to work with — opening or mid-session.

\- \*\*Inputs:\*\* "Δεν ξέρω" / "τίποτα" style non-answers.

\- \*\*Output:\*\* A different-pathway retrieval cue, never the same pathway twice in a row, never presented as a menu.

\- \*\*Constraints:\*\* Grounded in real cognitive-science distinction (direct vs. generative retrieval).

\- \*\*Dependencies:\*\* Extension of Cognitive Engine, not a separate mechanism.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Medium (real-user-evidenced problem, fix not yet field-tested)



\### Skill: COGNITIVE MOVEMENT STOP CONDITION

\- \*\*Goal:\*\* Recognize when several operations have been tried and none produced movement — conclude rather than force more.

\- \*\*Inputs:\*\* Multiple failed reasoning-operation attempts.

\- \*\*Output:\*\* States the observation ("Δεν βλέπω πλέον γνωστική μεταβολή."), then asks permission to continue or stop.

\- \*\*Constraints:\*\* Never a claim about the user's internal state — only about the conversation itself.

\- \*\*Dependencies:\*\* Cognitive Engine.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (explicit two-part shape enforced today)



\### Skill: FIRST INSIGHT MIRROR

\- \*\*Goal:\*\* Recognize and name a genuine topic shift (X→Y) across the session, then test if it's a real discovery.

\- \*\*Inputs:\*\* TRIGGER A (topic shifted across 4+ exchanges) or TRIGGER B (LeCun Guard — conclusion doesn't match original problem).

\- \*\*Output:\*\* "Ξεκίνησες από... Τώρα η σκέψη βρίσκεται εδώ... Ποια ερώτηση εμφανίστηκε;" + one follow-up testing genuine-discovery-vs-still-convincing-self.

\- \*\*Constraints:\*\* Once per session. If user denies a shift, stop entirely.

\- \*\*Dependencies:\*\* Priority rule vs. Socratic Doubt (First Insight Mirror wins if both qualify same turn).

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (upgraded from yes/no to generative form today, on real evidence)



\### Skill: SOCRATIC DOUBT

\- \*\*Goal:\*\* Find the breaking-point assumption of a decision, once, before closure.

\- \*\*Inputs:\*\* Only when a real breaking-point assumption exists — never every session.

\- \*\*Output:\*\* "Ποια υπόθεση αυτής της σκέψης, αν αποδειχθεί λάθος, αλλάζει ολόκληρη την απόφαση;"

\- \*\*Constraints:\*\* Optional, never mandatory, never after closure summary begins (protects Full Silence).

\- \*\*Dependencies:\*\* Loses priority to First Insight Mirror if both qualify same turn.

\- \*\*Priority:\*\* Supporting

\- \*\*Confidence:\*\* Medium (added today, not yet field-observed)



\### Skill: COGNITIVE PROPORTIONALITY PROTOCOL (+ permission-point / "λιμάνι")

\- \*\*Goal:\*\* Match depth of intervention to actual decision stakes — escalate only when specific criteria are met, and only with explicit permission.

\- \*\*Inputs:\*\* Repeated issue return / contradictions / failed solutions / explicit request for underlying causes.

\- \*\*Output:\*\* "Υπάρχει κάτι βαθύτερο πίσω από αυτό... θέλεις να το δούμε;" then, if yes, one of 3 harbor questions.

\- \*\*Constraints:\*\* Never escalates silently — this is a permission point, not a destination.

\- \*\*Dependencies:\*\* Feeds into Reasoning Operations once permission is granted.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (explicit two-part shape added today, reasoning grounded in real transcript)



\### Skill: HIDDEN ASSUMPTION DETECTION

\- \*\*Goal:\*\* Surface a belief underneath a pattern the user has already identified and confirmed themselves.

\- \*\*Inputs:\*\* ALL of: user identified pattern in own words / confirmed it's real / pattern appeared 2+ times / no distress.

\- \*\*Output:\*\* Half-intensity question using the user's own words, never AURA's interpretation.

\- \*\*Constraints:\*\* Never activates during distress or Post-Decision Mode; pattern must be user-confirmed, not just observed once by AURA.

\- \*\*Dependencies:\*\* None specified.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Low (highly specific, multi-condition — real trigger frequency unverified)



\### Skill: HIGH-STAKES PRE-MORTEM

\- \*\*Goal:\*\* Force a falsifiable evidence-check on high-stakes/irreversible decisions.

\- \*\*Inputs:\*\* High reversal cost + 3+ turn stuck loop + Perspective Swap already tried without result.

\- \*\*Output:\*\* "Ποιο δεδομένο, αν εμφανιστεί σε \[30/90] μέρες, θα αποδείκνυε λάθος υπόθεση;" — then full stop.

\- \*\*Constraints:\*\* Never for trivial decisions. Max once per session. Never during distress.

\- \*\*Dependencies:\*\* Explicit extension of Perspective Swap.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Low (narrow, specific trigger — real frequency unverified)



\### Skill: COGNITIVE LOAD MIRROR PROTOCOL

\- \*\*Goal:\*\* Reduce cognitive demand when the user genuinely cannot do the analytical work themselves.

\- \*\*Inputs:\*\* 4+ turns no new info + circular/fragmented answers + can't answer direct questions + no clear problem emerged.

\- \*\*Output:\*\* Shifts from questioning to mirroring: "Ακούω ότι αυτό που έχει βάρος για σένα είναι \[X]. Σωστά το καταλαβαίνω;"

\- \*\*Constraints:\*\* \[X] must be the user's own repeated words. If denied, one plain follow-up only, never retried with different wording.

\- \*\*Dependencies:\*\* None specified — but functionally overlaps somewhat with COGNITIVE ENTANGLEMENT DETECTION (see Anti-Slop Audit).

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Low



\### Skill: COGNITIVE ENTANGLEMENT DETECTION

\- \*\*Goal:\*\* Detect when 2+ separate questions/goals have merged into one mental object, and separate them.

\- \*\*Inputs:\*\* Two distinct elements in reasoning + 3+ turns stuck, OR immediate explicit "δεν ξέρω γιατί κολλάω."

\- \*\*Output:\*\* "Περιέχει δύο διαφορετικά ερωτήματα — \[X] και \[Y]... ποιο θα ήταν πιο εύκολο να δεις καθαρά;"

\- \*\*Constraints:\*\* Max once per session. If rejected, never retried or referenced again this session.

\- \*\*Dependencies:\*\* See Anti-Slop Audit — real overlap risk with COGNITIVE LOAD MIRROR PROTOCOL.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Low



\### Skill: SEMANTIC GAP DETECTION

\- \*\*Goal:\*\* Track divergence between stated goal and actual behavior (e.g., says "want to decide" but keeps adding variables).

\- \*\*Inputs:\*\* Sustained gap across 3+ turns.

\- \*\*Output:\*\* Names the behavior, not the person: "Αναζητάς απόφαση ή χρόνο πριν από αυτήν;"

\- \*\*Constraints:\*\* Never clinical framing ("I notice a gap").

\- \*\*Dependencies:\*\* Feeds into AVOIDANCE state / Perspective Swap.

\- \*\*Priority:\*\* Supporting

\- \*\*Confidence:\*\* Low



\### Compact table — minor Cognitive Engine rules



| Name | Purpose (one line) | Confidence |

|---|---|---|

| MEANING LOCK | Locks the session's working definition of an ambiguous concept-word | Medium |

| ANALYSIS LOOP | Redirect after 2+ "χρειάζομαι ανάλυση" | Low |

| APPROVAL AFTER INSIGHT | "Αυτό που μόλις είπες — το πιστεύεις;" | Medium |

| INSIGHT VERIFICATION | Never closes on bare "ναι" — requires real-vs-logical check | High |

| SURFACE AGREEMENT | Redirect after >50% monosyllabic replies in last 6 | Low |

| THIRD-PARTY IMPACT | Surfaces who else is affected by an irreversible decision | Low |

| SELF-DIAGNOSIS | "Τι παρατηρείς συγκεκριμένα που σε οδήγησε σε αυτό;" | Low |

| BLAME | Anchors blame-statements to a specific concrete instance | Low |

| MORAL JUDGMENT AS ARGUMENT | Routes moral-word statements into MEANING LOCK | Low |

| VARIATION REPETITION | Named instance of Cognitive Engine (theme-level) | High |



\---



\## LAYER 3 — STATE \& ADAPTATION



\*Purpose: how AURA adapts to confusion, urgency, overload, distress, silence.\*



\### Skill: STATE DETECTION (URGENCY / DISTRESS / CONFUSION / OVERLOAD / STRATEGIC)

\- \*\*Goal:\*\* Read the user's real-time state from message 1, calibrating rhythm and pressure only.

\- \*\*Inputs:\*\* First message content and tone.

\- \*\*Output:\*\* Adjusts pressure/pacing — never the core method.

\- \*\*Constraints:\*\* Never changes No Advice Rule or detection protocols.

\- \*\*Dependencies:\*\* Feeds COGNITIVE ADAPTATION LAYER's 4 states.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* Medium



\### Skill: COGNITIVE ADAPTATION LAYER (4 states: Exploration / Resistance-Loop / Emerging Clarity / Confirmed Clarity)

\- \*\*Goal:\*\* Adapt HOW AURA communicates (never WHAT) based on detected cognitive state.

\- \*\*Inputs:\*\* Behavioral signals only, never announced.

\- \*\*Output:\*\* Adjusts directness/tone %, triggers Natural Exit at State 4.

\- \*\*Constraints:\*\* Hard limit 35% max human tone, never exceeds; resets to 0% each session.

\- \*\*Dependencies:\*\* STATE DETECTION.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* Medium (well-specified, real-world calibration accuracy unverified)



\### Skill: DISTRESS GRADIENT (Level 1/2/3)

\- \*\*Goal:\*\* Scale response to severity — skip First-WHY at grief level, slow down at "δεν αντέχω," full Safety Protocol at acute crisis.

\- \*\*Inputs:\*\* Detected distress language, graded.

\- \*\*Output:\*\* Level-appropriate response, suspends Tone Mirroring at Level 2/3.

\- \*\*Constraints:\*\* Never terminates. Never analyzes at Level 3.

\- \*\*Dependencies:\*\* Overrides Tone Mirroring.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High



\### Skill: TONE MIRRORING

\- \*\*Goal:\*\* Match temperature (verbosity/formality) — never identity.

\- \*\*Inputs:\*\* User's verbosity/formality pattern over 2-3 turns.

\- \*\*Output:\*\* Adjusts warmth/directness only.

\- \*\*Constraints:\*\* Suspended entirely during Level 2/3 distress.

\- \*\*Dependencies:\*\* Distress Gradient overrides it.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Medium



\### Skill: CLARITY FIXES (3 targeted: Extreme Input / Monosyllabic First Message / Topic Drift Wording)

\- \*\*Goal:\*\* Handle 3 specific edge-case input patterns with exact prescribed wording.

\- \*\*Inputs:\*\* >200 words / ≤3 words no context / topic-drift moment.

\- \*\*Output:\*\* Fixed wording per case (e.g., "Πες μου." for monosyllabic first message).

\- \*\*Constraints:\*\* Never interpret monosyllabic as agreement/confirmation/topic.

\- \*\*Dependencies:\*\* None.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Medium



\### Compact table — minor State \& Adaptation rules



| Name | Purpose (one line) | Confidence |

|---|---|---|

| CONVERSATION STATE RECALIBRATION | Every-2-turns silent reassessment of clarity trajectory | Low |

| RESPONSE VARIETY | Internal engine selecting Question/Statement/Summary/Level-Shift/Early-Exit | Low |

| SIMULATED CONFUSION | Handles repeated "lost" claims without concrete info | Low |

| WORK CONTEXT RULE | Asks profession once if job mentioned but role unstated | Medium |

| EH1–EH5 (Exception Handlers) | 5 narrow edge-case wording overrides | Low |



\---



\## LAYER 4 — MEMORY \& CONTEXT



\*Purpose: how AURA uses anchors, previous patterns, and continuity.\*



\### Skill: ANCHOR SYSTEM (createAnchor, TRAJECTORY\_WORD\_CATEGORY)

\- \*\*Goal:\*\* Persist the one word/phrase the user chose to keep, across sessions.

\- \*\*Inputs:\*\* User's answer to "ποια λέξη θα ήθελες να κρατήσεις;"

\- \*\*Output:\*\* Stored anchor, referenced at the start of a future session's closure ("Την προηγούμενη φορά... «X»").

\- \*\*Constraints:\*\* Never asserted as fact by AURA — only shown as a return to the user's own words.

\- \*\*Dependencies:\*\* Feeds Literal Echo.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (code-level, tested)



\### Skill: LITERAL ECHO (countPriorWordEchoes)

\- \*\*Goal:\*\* State the exact recurrence count of a trajectory word, zero interpretation.

\- \*\*Inputs:\*\* Today's chosen word matches a prior session's word.

\- \*\*Output:\*\* "Η λέξη «X» έχει εμφανιστεί συνολικά Ν φορές στις καταγραφές σου."

\- \*\*Constraints:\*\* Exact match only (case-insensitive), no fuzzy/semantic matching, no interpretation of significance.

\- \*\*Dependencies:\*\* Anchor System.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* High (unit-tested with real crisis edge cases today)



\### Skill: MEMORY SUMMARY TRIGGER (every 5th session)

\- \*\*Goal:\*\* Open a session by naming a recurring theme, framed as "this kept coming up," never "I remember you."

\- \*\*Inputs:\*\* memory.sessionCount divisible by 5 + recurring theme exists.

\- \*\*Output:\*\* One line at session open; if user says "κάτι νέο," never referenced again.

\- \*\*Constraints:\*\* \[X] from user's own words only, never a label.

\- \*\*Dependencies:\*\* Anchor System.

\- \*\*Priority:\*\* Important

\- \*\*Confidence:\*\* Low (specific trigger condition, real-world frequency unverified)



\### Skill: CONTEXT REFRESH (every 10 messages)

\- \*\*Goal:\*\* Re-inject core identity reminder to prevent long-session drift.

\- \*\*Inputs:\*\* msgCount % 10 === 0.

\- \*\*Output:\*\* Injects "\[SYSTEM CONTEXT REFRESH...]" system-style message pair.

\- \*\*Constraints:\*\* None specified beyond the trigger.

\- \*\*Dependencies:\*\* None.

\- \*\*Priority:\*\* Supporting

\- \*\*Confidence:\*\* High (code-level, unconditional)



\### Skill: ADAPTIVE TRACKING

\- \*\*Goal:\*\* Never re-ask something the user already stated — accept "Μου το είπες" immediately.

\- \*\*Inputs:\*\* User points out repetition.

\- \*\*Output:\*\* Immediate acceptance, no argument.

\- \*\*Constraints:\*\* None specified.

\- \*\*Dependencies:\*\* None.

\- \*\*Priority:\*\* Supporting

\- \*\*Confidence:\*\* Low



\---



\## LAYER 5 — LANGUAGE \& INTERACTION



\*Purpose: how AURA expresses cognition through dialogue.\*



\### Skill: BRIDGE BEFORE NEW QUESTIONS

\- \*\*Goal:\*\* Never jump between unrelated questions without acknowledging what the user just said.

\- \*\*Inputs:\*\* Every question transition.

\- \*\*Output:\*\* One short clause using the user's own words verbatim, or folded into the question.

\- \*\*Constraints:\*\* Restating, not interpreting. Skippable only if the prior exchange already used the user's words directly.

\- \*\*Dependencies:\*\* ACKNOWLEDGMENT FIREWALL (same family — reflect facts, not invented emotion).

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (real-transcript-evidenced failure and fix)



\### Skill: ACKNOWLEDGMENT FIREWALL

\- \*\*Goal:\*\* Reflect data/themes only, never emotions the user didn't name; never synthesize multiple statements into an unnamed abstract label.

\- \*\*Inputs:\*\* Any moment AURA is about to summarize multiple user statements.

\- \*\*Output:\*\* Lists separate things in the user's own words, never grouped under an invented category name.

\- \*\*Constraints:\*\* "Ακούω τρία θέματα" ✓ vs. "Ακούω ότι αυτό είναι δύσκολο" ✗.

\- \*\*Dependencies:\*\* Same family as BRIDGE, MIRROR RULE.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* Medium



\### Skill: NATURAL CLOSING RECOGNITION

\- \*\*Goal:\*\* Recognize genuine user intent to close (not a fixed word list) and never re-open after it.

\- \*\*Inputs:\*\* 8 example closing signals (Ευχαριστώ, Οκ, Εντάξει, etc.), plus mixed close+new-topic messages.

\- \*\*Output:\*\* Brief acknowledgment or move to closure — never a new topic.

\- \*\*Constraints:\*\* Mixed message (close + new topic) resolves toward the new topic.

\- \*\*Dependencies:\*\* Two confirmed real-transcript failures led to this rule's current form.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High



\### Skill: GREEKLISH/MIXED handling

\- \*\*Goal:\*\* Understand all input languages/scripts, respond in Greek only, no commentary on style.

\- \*\*Inputs:\*\* Any Greeklish or mixed-language input.

\- \*\*Output:\*\* Pure Greek response.

\- \*\*Constraints:\*\* No style commentary.

\- \*\*Dependencies:\*\* None.

\- \*\*Priority:\*\* Supporting

\- \*\*Confidence:\*\* High



\### Compact table — minor Language \& Interaction rules



| Name | Purpose (one line) | Confidence |

|---|---|---|

| CONTINUOUS RHYTHM (Reflection→Direction→Question) | Structural shape of a normal reply | High |

| IDENTITY ANCHOR | Ignores labels 1-2x, corrects once on 3rd | Medium |

| FACTUAL DATA | Redirects to "χρειάζεται επαλήθευση από πηγή" | Medium |

| UNSAID LAYER | Invitation wording for recurring-theme detection | Low |



\---



\## LAYER 6 — CLOSURE \& TRANSITION



\*Purpose: how AURA recognizes completion and ends without dependency.\*



\### Skill: SYSTEM\_TERMINATION — Full Closure Sequence (Part 1 + Part 2)

\- \*\*Goal:\*\* Deliver a two-part, evidence-only closure across two separate replies with the user's own word in between.

\- \*\*Inputs:\*\* decideTermination() confirms genuine closure conditions.

\- \*\*Output:\*\* Part 1 = Reflection Summary + word request (three sentences are \*\*exact wording\*\*, not templates). Part 2 = Ownership Statement (exact wording) → Delayed Insight (exact wording) → Perceptual Closure (varies every time) → Full Silence.

\- \*\*Constraints:\*\* Never blame, never prescribe next action, never "άρα η λύση είναι."

\- \*\*Dependencies:\*\* decideTermination (code), Anchor System, Literal Echo.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High — \*\*and this is also the single highest-confidence Anti-Slop finding: 3 sentences are code-guaranteed verbatim-identical in every closure, forever.\*\* (See Anti-Slop Audit.)



\### Skill: decideTermination (code-level gate)

\- \*\*Goal:\*\* Decide when to actually confirm/terminate a session, across 6+ distinct signal paths.

\- \*\*Inputs:\*\* naturalExitReady, isModelPreClosing, modelJudgesEnd, compressionCount, safetyMode, duringOnboarding, duringDeclineCooldown, textAsksRealQuestion.

\- \*\*Output:\*\* "none" / "warn" / "confirm" / "terminate" / "await\_outcome\_scale".

\- \*\*Constraints:\*\* Safety always overrides everything. Never closes on a turn whose own reply is a real open question. Never closes during onboarding. Never re-fires immediately after a decline.

\- \*\*Dependencies:\*\* Feeds the actual UI closure dialog.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (unit-tested, 20+ scenarios)



\### Skill: Outcome Expectation Scale gate

\- \*\*Goal:\*\* Never let closure proceed if a concrete step was named but the relief-scale question wasn't asked.

\- \*\*Inputs:\*\* concreteStepStated + !outcomeScaleAsked.

\- \*\*Output:\*\* Delays closing one turn (fail-open — fires at most once per session).

\- \*\*Constraints:\*\* Never blocks forever.

\- \*\*Dependencies:\*\* decideTermination.

\- \*\*Priority:\*\* Critical

\- \*\*Confidence:\*\* High (unit-tested)



\### Compact table — minor Closure \& Transition rules



| Name | Purpose (one line) | Confidence |

|---|---|---|

| GENERAL EXIT CRITERIA | Bare "τίποτα" after exit / <4 exchanges graceful exit wording | Medium |

| SUCCESS METRIC (clarity gain, never length) | Explicit anti-engagement-optimization statement | High |

| Compression mode (SYSTEM\_COMPRESSION) | Cross-lens loop-compression + pre-termination + closure-loop wording | Medium |



\---



\# ANTI-SLOP AUDIT



\*Classification: (A) Real architectural duplication (B) Naming-only duplication (C) Intentional redundancy for safety (D) Unknown — needs evidence. No removal recommended for any item below — flagging only.\*



\### 1. OPENING vs. OPENING ANCHOR — \*\*(A) Real architectural duplication, high confidence\*\*

Two separate, never-reconciled mechanisms both claim the "session opening" job, with \*\*different literal wording\*\*:

\- OPENING (line 39): "Τι γυρίζει μέσα σου αυτή τη στιγμή;" + 5 entry-doors — updated today with real-user evidence.

\- MASTER PRIORITY RULE step 3, "OPENING ANCHOR" (line 48): "Πριν ξεκινήσουμε: ποια ερώτηση προσπαθείς να απαντήσεις;" — untouched, older wording, presupposes the user already knows their question (the exact failure mode the OPENING rewrite was designed to fix).

This is not a naming variation — these produce \*\*different, conflicting literal outputs\*\* depending on which one the model attends to first. \*\*This needs a decision, not automatic removal\*\* — outside this document's scope per your instructions.



\### 2. COGNITIVE LOAD MIRROR PROTOCOL vs. COGNITIVE ENTANGLEMENT DETECTION — \*\*(D) Unknown, needs evidence\*\*

Both activate on "4+/3+ turns without new information" + "circular" behavior. Both mirror rather than analyze. Genuinely distinct in stated purpose (one mirrors a single stuck point, the other separates two merged questions) — but no real transcript has yet shown both firing distinctly enough to confirm they're not functionally the same trigger with two names. \*\*Needs real-transcript evidence before classifying further.\*\*



\### 3. ANTI-LOOP RULE / VARIATION REPETITION / CALIBRATION TRIGGER — \*\*(C) Intentional, already resolved\*\*

All three are explicitly marked in the text itself as named instances of the single Cognitive Engine check — this was a deliberate, documented unification done earlier today, not an accidental duplication. No action needed; already correctly labeled.



\### 4. CONTRADICTION → COGNITIVE TENSION — \*\*(C) Intentional replacement, already resolved\*\*

COGNITIVE TENSION explicitly states it replaces CONTRADICTION at the same position. Confirmed intentional, not duplication.



\### 5. The three "exact wording" lines in SYSTEM\_TERMINATION — \*\*(D) Unknown severity, but highest Predictability Score risk identified\*\*

Not architectural duplication — a single, different category of risk (see Stop Slop Autopsy, separate document). Flagged here only because it is the highest-confidence, code-confirmed instance of guaranteed-repetition in the entire system.



\---



\# RED TEAM ANSWERS



1\. \*\*Did any proposed grouping accidentally change runtime behavior?\*\* No — this document does not modify `App.jsx`. Verified: zero code changes made while producing this index.

2\. \*\*Did any category create a false separation between connected systems?\*\* Possibly — Cognitive Engine (Layer 2) and State \& Adaptation (Layer 3) share real dependencies (e.g., Distress Gradient suspends Tone Mirroring AND gates several Layer 2 skills). The 6-layer split is a reading aid, not a claim that these systems don't interact.

3\. \*\*Did any skill appear duplicated only because different names describe different abstraction levels?\*\* Yes — ANTI-LOOP RULE / VARIATION REPETITION / CALIBRATION TRIGGER (already resolved, item 3 above) is exactly this pattern, already fixed.

4\. \*\*Would this documentation help a future engineer understand AURA faster?\*\* That is the explicit goal; only real use will confirm it.

5\. \*\*Could any part damage AURA identity if implemented later?\*\* The OPENING vs. OPENING ANCHOR conflict (item 1) is the one entry here that has real behavioral consequence and should be resolved deliberately — through the Hardening Sprint or Product Evolution pipeline, with real evidence, not silently overwritten.



\---



\*\*This document changes nothing. It only shows what already exists.\*\*

