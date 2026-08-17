AURA — REGRESSION TEST SUITE
333 tests / 31 suites

ΠΟΥ ΤΑ ΒΑΖΩ
  AURA_COMPLETE/
    src/App.jsx
    api/aura.js
    tests/        <-- εδώ

ΠΩΣ ΤΑ ΤΡΕΧΩ
  Διπλό κλικ στο RUN_ALL.bat

ΜΙΑ ΦΟΡΑ ΜΟΝΟ (για το real_parse_check.js)
  npm install @babel/parser

ΤΟ test_entry_flow.js ΕΙΝΑΙ ΤΟ ΣΗΜΑΝΤΙΚΟΤΕΡΟ
Φυλάει τη ροή εισόδου. Το ίδιο bug — διπλή ερώτηση «τι σε φέρνει εδώ» —
εμφανίστηκε ΤΡΕΙΣ φορές, κάθε φορά από άλλο σημείο, επειδή κανένα test
δεν το φύλαγε. Αν πέσει, μην προσθέσεις απαγόρευση: βρες τι ΖΗΤΑΕΙ την
ερώτηση και αφαίρεσέ το.

ΠΟΤΕ ΤΑ ΤΡΕΧΩ
Πριν και μετά από ΚΑΘΕ αλλαγή στο App.jsx.
