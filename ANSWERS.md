# 1. 🚀 How to Run

## Step 1:
Download all three files to the same folder

## Step 2:
Open `index.html` in any modern browser

## Or use these commands:

```bash
open index.html      # macOS
start index.html     # Windows
xdg-open index.html  # Linux
```

---

# 2. 🧠 Stack & design choices

**Stack:** Vanilla HTML + CSS + JavaScript with zero dependencies. No framework, no bundler, no npm. For a single-screen interactive app with no shared state or routing complexity, a framework adds overhead with no payoff. Vanilla JS is also easier to evaluate — every line is directly readable, no JSX transforms or reactivity internals to mentally trace.

---

## 🎯 Visual decision 1 — The ring takes 60–70% of the viewport width

The ring is sized with `width: min(72vw, 300px)`. On a phone at 360px wide, that's ~260px; on a laptop it caps at 300px. The reasoning: the timer is the entire point of the app — it should be impossible to miss the current state at a glance from arm's length. Making it smaller (to feel "minimal") creates cognitive overhead. Making it full-width on desktop looks toy-like. The cap at 300px keeps it anchored while the ring still dominates.

---

## 🎨 Visual decision 2 — Color is the primary mode signal, not just a badge

When the timer switches from focus to break, every accent element (ring stroke, mode badge, session count, check marks, button border, overlay border) transitions to green via a single CSS custom property `--accent` toggled on the `.app` element.

This means the entire interface changes temperature — you feel the mode shift without reading a label.

- Warm amber → focus (concentration, alertness)
- Soft mint → break (release, ease)

The mode text badge exists as a backup for accessibility and quick scanning, but the color does the heavy emotional lifting.

---

# 3. 📱 Responsive & Accessibility

## 📐 Responsive behavior

### 🟢 At 360px (narrow phone)
- The ring scales to ~260px
- The time display drops from 5.5rem to 3.8rem via `clamp()`
- The control buttons shrink slightly
- The layout remains a single column with no horizontal overflow
- The history list stacks naturally

---

### 💻 At 1440px (laptop)
- The app is center-aligned at a `max-width` of 480px so the ring doesn't balloon
- The type scale stays readable without becoming absurdly large
- White space around the panel increases

---

## ♿ Accessibility — what I handled

- All interactive elements (start, reset, skip, settings toggle, inputs, apply button) are focusable with visible `:focus-visible` outlines that use the current `--accent` color
- The timer region has `role="timer"` and `aria-live="off"` (live on a 1-second interval would be unusably noisy for screen readers — the static aria-label is updated on each tick instead, letting users poll with their reader)
- The mode badge has `aria-live="polite"` so mode changes are announced
- The completion overlay toggles `aria-hidden` and contains readable text
- Keyboard shortcuts (Space, R, S) work globally but are skipped when focus is inside INPUT or BUTTON elements to avoid conflicts

---

## ⚠️ Accessibility — what I skipped

I did not implement a `prefers-reduced-motion` media query to disable the pulse animation on the start button and the ring's CSS transition. Users with vestibular disorders can find those animations uncomfortable.

With another pass I'd wrap all animations in:

```css
@media (prefers-reduced-motion: no-preference)
```

and provide instant transitions as the default.

---

# 4. 🤖 AI usage

## Claude (claude.ai) — used for:

### 1. SVG tick-mark ring
I asked Claude to generate the math for placing 60 evenly spaced radial tick marks around a circle of radius 130 centered at 150,150.

It gave:

```js
(i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2
```

- The `-Math.PI/2` offset starts the ring at the top (12 o'clock) rather than 3 o'clock

I modified the implementation:
- Changed from CSS selector-based updates
- Used `classList.toggle('active', ...)` for simpler updates
- Avoided querySelector loops on every tick

---

### 2. Web Audio chord implementation
Claude provided a single oscillator pitch shift.

I changed it to:
- 3 oscillators
- staggered by 0.18s

Result:
- Ascending arpeggio instead of pitch slide
- More celebratory tone

---

### 3. LocalStorage date-keyed history schema
Claude suggested:

```js
new Date().toDateString()
```

I changed it to:

```
YYYY-MM-DD format
```

Reason:
- Avoids locale differences
- Safer across timezones and system formats

---

# 5. 🧩 Honest gap

The auto-start behavior after a session ends (the timer automatically starts the next phase) is **not configurable**.

---

## ⚠️ Issue
After focus/break ends, next session starts automatically after a short delay.

---

## ❗ Problem
Some users prefer manual control between phases.

---

## 💡 Fix
Add setting:

```
Auto-start next phase: ON/OFF
```

Default: ON (current behavior preserved)
