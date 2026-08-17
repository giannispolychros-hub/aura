AURA — REGRESSION TEST SUITE
315 tests / 30 suites

ΠΟΥ ΤΑ ΒΑΖΩ
Μέσα στο AURA_COMPLETE, σε φάκελο tests/ — δίπλα στο src/:

  AURA_COMPLETE/
    src/App.jsx
    api/aura.js
    tests/        <-- εδώ

Βρίσκουν μόνα τους το App.jsx. Δουλεύουν και αν τα βάλεις δίπλα του.

ΠΩΣ ΤΑ ΤΡΕΧΩ
Διπλό κλικ στο RUN_ALL.bat
ή από PowerShell:   cd tests    node stress_test_closing.js

ΤΟ real_parse_check.js
Επαληθεύει ότι το App.jsx είναι συντακτικά έγκυρο (πλήρες AST).
Χρειάζεται μία φορά:   npm install @babel/parser

ΠΟΤΕ ΤΑ ΤΡΕΧΩ
Πριν και μετά από ΚΑΘΕ αλλαγή στο App.jsx. Αν κάτι πέσει από 315,
η τελευταία αλλαγή έσπασε κάτι.

ΓΙΑΤΙ ΕΧΕΙ ΣΗΜΑΣΙΑ
Δεν ήταν ποτέ στο git repo — ζούσαν μόνο στο περιβάλλον εργασίας.
Κάθε νέα συνομιλία που δεν τα έχει, ξαναχτίζει tests από το μηδέν
και χάνει την υπάρχουσα κάλυψη.
