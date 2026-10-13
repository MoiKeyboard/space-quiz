# Repository instructions

## Running the app

Open `index.html` directly in a browser. The app is self-contained: its styles, JavaScript, question data, and SVG artwork are inline, with no external dependencies.

## Architecture

Orbit is a single-page, ten-question space quiz implemented entirely in `index.html` using native DOM APIs. The document contains the quiz and results views; their visibility is controlled with `hidden`. The inline stylesheet defines the visual system, and the script at the end of the body initializes the quiz.

- `questions` is the canonical bank of records with `category`, `question`, `options`, a zero-based `answer` index, and an explanatory `fact`. `shuffleQuestions()` uses Fisher-Yates on a copy; `attemptQuestions` holds the fixed order for the current attempt, created on initial load and each Restart. Option order and the canonical bank are unchanged; consecutive attempts may have the same order by chance.
- `current`, `score`, and `answered` hold in-memory session state. `renderQuestion()` builds option buttons and resets per-question feedback; `selectAnswer()` locks the answer, scores it, reveals the correct option and fact, and enables continuation.
- The Next handler advances questions or calls `showResults()`. Restart resets state and progress before rendering the first question. Reloading also starts a new quiz.
- `updatePersonalBest()` runs only on results. It validates the `orbit.personalBest` local-storage value as a canonical integer from zero to ten and saves only first or improved completed scores. Storage errors show an explicit warning without interrupting results or replay; no account or device sync is involved.

## Coupled behavior and conventions

- Question count is partly dynamic and partly fixed at ten. If changing the count, update the hero copy, question-total markup, initial progressbar attributes, result-score denominator, accuracy calculation (`score * 10`), result-tier thresholds, and `.track::after` ten-segment styling alongside the question data.
- Progress measures questions **answered**, not the currently displayed question. Answer selection updates the fill, percentage, mission status, and progressbar ARIA values together; Restart resets them together.
- Each correct answer earns one point. Result messaging uses score thresholds of eight and five. `answered` and disabled option buttons prevent repeated scoring; Next cannot advance an unanswered question.
- Use the existing `$` ID lookup helper and native element creation, `textContent`, and `replaceChildren()` for dynamic content. Option text, feedback, and results are constructed as DOM nodes rather than interpolated HTML.
- Maintain the existing accessibility flow: no forced focus on initial render, question-heading focus on advancement/restart, Next focus after answering, and result-heading focus on completion. Feedback and score use polite live regions; decorative option letters/icons are hidden from assistive technology, while answered buttons receive descriptive labels.
- Theme colors come from `:root` custom properties with `prefers-color-scheme: dark` overrides. The primary button has an additional dark-mode text override. Preserve the `prefers-reduced-motion` rule and the narrow-screen layout at 420px.
- The global `[hidden]` rule uses `display: none !important` so component display styles do not expose inactive views or feedback.

## Browser checks

For dependency-free regression checks, open `index.html` in a browser and paste the contents of `tests/quiz.js` into the developer console. The checks exercise the live DOM and leave the quiz at the start of a fresh attempt.

The checks temporarily mock and then restore `window.localStorage` without changing the real saved best. They cover first completion (including zero), improvements, ties, lower scores, unfinished attempts, invalid values, getter/read/write failures, and storage recovery. To check real persistence, complete an attempt, reload the same URL, then complete a lower-scoring attempt and verify the best is unchanged. Check this with `index.html` opened directly; file-URL storage behavior varies by browser, so unsupported storage must show the warning instead.

Exercise correct and incorrect answers, repeated-answer prevention, Next gating, final-question results, and Restart. Check result messaging at scores 4/5 and 7/8, along with score totals and accuracy. Verify progress starts at 0%, advances only after answering, reaches 100%, and resets on Restart. Check keyboard focus and announcements, narrow screens, light/dark appearance, and reduced motion.
