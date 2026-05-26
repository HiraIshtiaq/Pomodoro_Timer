## 1. 🚀 How to Run

```bash
# Step 1: Download all three files to the same folder
# Step 2: Open index.html in any modern browser

# Or use these commands:
open index.html      # macOS
start index.html     # Windows
xdg-open index.html  # Linux


## 2. Stack & design choices

**Stack:** Vanilla HTML + CSS + JavaScript with zero dependencies. No framework, no bundler, no npm. For a single-screen interactive app with no shared state or routing complexity, a framework adds overhead with no payoff. Vanilla JS is also easier to evaluate — every line is directly readable, no JSX transforms or reactivity internals to mentally trace.

**Visual decision 1 — The ring takes 60–70% of the viewport width.**

The ring is sized with `width: min(72vw, 300px)`. On a phone at 360px wide, that's ~260px; on a laptop it caps at 300px. The reasoning: the timer is the entire point of the app — it should be impossible to miss the current state at a glance from arm's length. Making it smaller (to feel "minimal") creates cognitive overhead. Making it full-width on desktop looks toy-like. The cap at 300px keeps it anchored while the ring still dominates.

**Visual decision 2 — Color is the primary mode signal, not just a badge.**

When the timer switches from focus to break, every accent element (ring stroke, mode badge, session count, check marks, button border, overlay border) transitions to green via a single CSS custom property `--accent` toggled on the `.app` element. This means the entire interface changes temperature — you feel the mode shift without reading a label. I chose warm amber for focus (concentration, alertness) and soft mint for break (release, ease). The mode text badge exists as a backup for accessibility and quick scanning, but the color does the heavy emotional lifting.

## 3. Responsive & accessibility

**Responsive behavior:**

- **At 360px (narrow phone):** the ring scales to ~260px, the time display drops from 5.5rem to 3.8rem via `clamp()`, and the control buttons shrink slightly. The layout remains a single column with no horizontal overflow. The history list stacks naturally.

- **At 1440px (laptop):** the app is center-aligned at a `max-width` of 480px so the ring doesn't balloon. The type scale stays readable without becoming absurdly large. White space around the panel increases.

**Accessibility — what I handled:**

- All interactive elements (start, reset, skip, settings toggle, inputs, apply button) are focusable with visible `:focus-visible` outlines that use the current `--accent` color.
- The timer region has `role="timer"` and `aria-live="off"` (live on a 1-second interval would be unusably noisy for screen readers — the static aria-label is updated on each tick instead, letting users poll with their reader).
- The mode badge has `aria-live="polite"` so mode changes are announced.
- The completion overlay toggles `aria-hidden` and contains readable text.
- Keyboard shortcuts (Space, R, S) work globally but are skipped when focus is inside INPUT or BUTTON elements to avoid conflicts.

**Accessibility — what I skipped:**

I did not implement a `prefers-reduced-motion` media query to disable the pulse animation on the start button and the ring's CSS transition. Users with vestibular disorders can find those animations uncomfortable. With another pass I'd wrap all animations in `@media (prefers-reduced-motion: no-preference)` blocks and provide instant transitions as the default.


## 4. AI usage

**Claude (claude.ai)** — used for:

1. **Scaffolding the SVG tick-mark ring.** I asked Claude to generate the math for placing 60 evenly spaced radial tick marks around a circle of radius 130 centered at 150,150. It gave me a for loop using `(i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2` — the `-Math.PI/2` offset starts the ring at the top (12 o'clock) rather than 3 o'clock. I kept the math but changed how active ticks are highlighted: Claude's version applied a data attribute and used a CSS selector. I switched to a direct `classList.toggle('active', ...)` on each re-render because it's simpler and avoids a querySelector loop on every tick.

2. **Web Audio chord implementation.** I asked for a completion sound using the Web Audio API. Claude gave me a single oscillator with a frequency change. I changed it to three separate oscillator/gain node pairs staggered by 0.18s each, making it a proper ascending arpeggio rather than a pitch slide — the arpeggio version feels celebratory instead of alarming, which is the right emotion for a completed session.

3. **LocalStorage date-keyed history schema.** Asked for a pattern to store daily history that auto-resets. Claude suggested using `new Date().toDateString()` as the key. I changed it to `${year}-${month}-${date}` (numeric parts) because `toDateString()` returns locale-sensitive strings like "Sun May 25 2025" that could theoretically differ across system locales or timezone edge cases at midnight.


## 5. Honest gap

The auto-start behavior after a session ends (the timer automatically starts the next phase) is **not configurable**. Most power users of Pomodoro timers want to control when the break starts — they may need a moment to jot something down before the break clock begins, or they prefer to manually initiate each session. Right now the next phase starts automatically after the 2.2-second completion flash, with no way to opt out.

**To fix it:** I'd add an "auto-start next phase" toggle to the settings panel (default: on, to preserve current behavior). When disabled, the timer would idle after each completed phase and wait for the user to press Start.