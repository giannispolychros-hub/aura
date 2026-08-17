@echo off
REM Τρέχει ολόκληρο το regression suite. Διπλό κλικ, ή: RUN_ALL.bat
setlocal enabledelayedexpansion
echo === AURA REGRESSION — 30 suites ===
echo.
for %%f in (stress_test_closing test_carry_forward test_anchor_coverage test_no_questions test_shift_parser test_bare_emoji test_farewell_closing test_conflict_matrix test_outcome_gate test_gates_dispatch test_showdemo_matrix test_dual_gates test_style_preference test_20_personas test_extreme_topics test_clarity_ownership test_core_readiness test_shift_check test_gate_proof test_early_word test_10_session_stress test_clarity_pivot_hybrid test_ara_backstop test_self_repetition test_english_ara test_tag_injection test_prompt_injection test_exhaustion test_xss test_user_stagnation) do (
  echo|set /p="%%f: "
  node %%f.js 2>&1 | findstr /C:"passed"
)
echo.
echo === ΤΕΛΟΣ ===
pause
