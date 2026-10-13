# Repository instructions

## Running the app

Open `index.html` directly in a browser. The app is self-contained: its styles, JavaScript, question data, and SVG artwork are inline, with no external dependencies.

## Architecture

Orbit is a single-page, ten-question space quiz implemented entirely in `index.html` using native DOM APIs. The document contains the quiz and results views; their visibility is controlled with `hidden`. The inline stylesheet defines the visual system, and the script at the end of the body initializes the quiz.

- `questions` holds ordered records with `category`, `question`, `options`, a zero-based `answer` index, and an explanatory `fact`.
- `current`, `score`, and `answered` hold in-memory session state. `renderQuestion()` builds option buttons and resets per-question feedback; `selectAnswer()` locks the answer, scores it, reveals the correct option and fact, and enables continuation.
- The Next handler advances questions or calls `showResults()`. Restart resets state and progress before rendering the first question. Reloading also starts a new quiz.

## Coupled behavior and conventions

- Question count is partly dynamic and partly fixed at ten. If changing the count, update the hero copy, question-total markup, initial progressbar attributes, result-score denominator, accuracy calculation (`score * 10`), result-tier thresholds, and `.track::after` ten-segment styling alongside the question data.
- Progress measures questions **answered**, not the currently displayed question. Answer selection updates the fill, percentage, mission status, and progressbar ARIA values together; Restart resets them together.
- Each correct answer earns one point. Result messaging uses score thresholds of eight and five. `answered` and disabled option buttons prevent repeated scoring; Next cannot advance an unanswered question.
- Use the existing `$` ID lookup helper and native element creation, `textContent`, and `replaceChildren()` for dynamic content. Option text, feedback, and results are constructed as DOM nodes rather than interpolated HTML.
- Maintain the existing accessibility flow: no forced focus on initial render, question-heading focus on advancement/restart, Next focus after answering, and result-heading focus on completion. Feedback and score use polite live regions; decorative option letters/icons are hidden from assistive technology, while answered buttons receive descriptive labels.
- Theme colors come from `:root` custom properties with `prefers-color-scheme: dark` overrides. The primary button has an additional dark-mode text override. Preserve the `prefers-reduced-motion` rule and the narrow-screen layout at 420px.
- The global `[hidden]` rule uses `display: none !important` so component display styles do not expose inactive views or feedback.

## Browser checks

Exercise correct and incorrect answers, repeated-answer prevention, Next gating, final-question results, and Restart. Check result messaging at scores 4/5 and 7/8, along with score totals and accuracy. Verify progress starts at 0%, advances only after answering, reaches 100%, and resets on Restart. Check keyboard focus and announcements, narrow screens, light/dark appearance, and reduced motion.
