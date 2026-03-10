# Bias + Feedback Quality Ideas (discussion parking lot)

This file captures product ideas for addressing **bias** and improving **feedback quality** in BrewJudge.

Goal: Help judges write clearer, more useful BJCP-aligned feedback without turning the app into a "judge police" tool.

## Principles

- **Coaching, not grading.** Phrase as suggestions to improve clarity and usefulness.
- **Opt-in and private.** Judges should be able to disable nudges; admins should not see judge-coaching flags by default.
- **Never block submission** (unless a club explicitly chooses strict mode).
- **Avoid protected-class inference.** Focus on judging-quality signals (preference vs style, actionable feedback, consistency).
- **Transparency.** Make it clear what the system checks and what it does not.

## Lightweight, low-controversy nudges

### 1) Subjective-language rewrite suggestions
Detect phrases like:
- “I hate…” / “gross” / “weird” / “not my style” / “bad beer”

Suggest:
- Replace preference statements with **sensory observations** + **impact** + **fix**.

### 2) Pithiness / thin feedback detector
If comments are too short (“Nice beer”, “Clean”, “Good”), suggest:
- Add 1–2 sensory specifics
- Add 1 actionable improvement

### 3) Style-anchor reminder
If no mention of style alignment appears:
- “Add one sentence about stylistic accuracy: what matches, what diverges.”

### 4) Missing-dimension reminders
If a section lacks common dimensions:
- Flavor: balance, finish, fermentation character
- Mouthfeel: body, carbonation, warmth/astringency

## Soft consistency checks (still low drama)

- Notes contradict descriptor selection (e.g., “no diacetyl” + diacetyl checked)
- Overall sentiment vs total score mismatch
- Harsh fault language + high score in the same section

## Calibration / bias-awareness (more controversial)

### Outlier awareness (private)
After sufficient sample size:
- “Your average scores run ~X points higher/lower than panel average.”
- “You mark descriptor Y more than peers.”

Safeguards:
- Only after N submissions
- Only visible to the judge
- Framed as calibration, not reprimand

## UX framing ideas

- “**Clarity Coach**” toggle with levels: Off / Light / Standard
- “10-second self-check” before submit (dismissible)
- Provide example rewrite templates

## Open questions

- Should this run **during judging** (real-time nudges) or **after submission** (post-hoc coaching)?
- Should clubs be able to choose strictness?
- What metrics should be stored (if any), and who can see them?
