# Lite — the second front door

`lite.html`. The same shop as `index.html`, walked down a corridor.

## Why it exists

The full shop was put in front of a class and proved too hard. Not the
diagnosis — the *interface*. Five things stacked up:

1. **Eight rooms open at once.** A student who does not know what happens next
   has eight guesses and no way to tell a wrong one from a slow one.
2. **Twenty tools in the rack**, and picking wrong strips a screw.
3. **Sixty-eight parts across four vendors**, each with a delivery and a risk.
4. **A lot of prose**, at 13px. `REVIEW.md` had already flagged this: *"a
   student who does not like reading will bounce off the sit-down."*
5. **Two-step interaction.** Select a tool, then click a screw. Nothing on
   screen says the tool is in your hand, and clicking the screw first does
   nothing at all.

Note what is *not* on that list: the hidden fault, the no-single-right-answer
pricing, the worst-axis cap. That is the lesson, and Lite keeps every bit of it.

## What it is

One column, one decision at a time, six beats:

    meet → ask → open → test → fix → price → the verdict

- Big portrait, big speech bubbles, 19px body text, phone-shaped, controls at
  the bottom where a thumb is.
- At most **three** choices on any screen.
- Everything is **drawn** (`js/lite-art.js`) and **moved by hand**
  (`js/lite-drag.js`) — drag it, or tap it and tap where it goes. The second
  way is not a poor relation: it is the touch idiom and it is how the keyboard
  works.

## What it does NOT do

It shares the engine, not the shop. Lite leaves out the software lab, the Chip
ID bench, the shopfit, the parts market as a place you visit, multi-job
juggling, precision gestures, and stripped screws. A wrong driver in Lite is
told it is wrong; it does not cost you anything. That consequence lives next
door.

## How the choices get narrowed

**This is the whole trick, and it lives in one place: the curation functions at
the top of `js/lite-flow.js`.** Every list is a *filter over the real
catalogues*, never a separate, easier set of data — so a student who moves up to
the full shop meets the same tools, instruments and parts they already know, and
a fault added to `data-faults.js` turns up in both.

| on screen | out of | chosen by |
|---|---|---|
| 3 questions | 22 | two this fault actually answers, plus one that does not |
| 3 drivers | 11 | the machine's own head type, plus two other families |
| 3 instruments | 14 | the ones whose reading is `abnormal` or `decisive`, padded |
| 2–3 fixes | 68 parts | **cheapest against soonest** — plus "nothing needs replacing", always |
| 3 prices | — | parts only · parts + time · parts + time + margin |

Two of those deserve a note:

- **Cheapest against soonest.** The first version offered cheapest and dearest,
  which reads as "good one or bad one" and is not a decision. The decision this
  shop is about is cheap against quick: the marketplace fan is a third of the
  price and three weeks away, and three weeks is the thing the customer cannot
  have.
- **"Nothing needs replacing" is on every screen**, including the screens where
  it is wrong. Several faults genuinely need no parts, and selling hardware for
  them is the expensive mistake the whole material is built to catch. The
  honest answer has to be available to get wrong.

## Handing in

The **Hand in** button in the top bar opens `TechOpsReport.show()` — the full
shop's own shift report, loaded from `js/ui-report.js` and not reimplemented.
A `SEK7K-` code produced in Lite decodes in the teacher's browser exactly like
any other, and is still rejected by the save-code loader, so it stays one-way.

The only thing Lite adds for it is somewhere for that markup to live: a block
at the end of `css/lite.css` mapping the classic colour tokens and the handful
of classes that module draws with onto Lite's palette. Nothing else from
`css/shop.css` comes across.

## Sharing the shift with the full shop

One save, one shift code, one reputation, one hand-in code. Grading is
`TechOpsScore`, untouched. A shift started in one and finished in the other
hands in identically.

The one thing that does **not** travel is a half-finished job: a ticket
abandoned halfway down Lite's corridor has nowhere sensible to land on the
classic bench. Both doors warn and let you choose.

## Files

| file | what it is |
|---|---|
| `lite.html` | the page. Loads every `data-*.js` and `sim-*.js` **unchanged** |
| `css/lite.css` | the whole look. Nothing below 15px |
| `js/lite-art.js` | ~35 drawn tools, instruments, parts and machines |
| `js/lite-drag.js` | pointer drag, tap-to-carry, and the keyboard path |
| `js/lite-flow.js` | the six beats, and the curation above |
| `js/lite-settle.js` | closing a job — **mirrors `ui-handover.js`, see below** |
| `js/lite-app.js` | boot |

It loads exactly one file from the classic UI: `js/ui-shell.js`, for the
instrument catalogue, the reading formatter and the portrait slot. It never
calls that file's HUD or rail, and never edits it. Anything Lite needs that is
not already there goes in a `lite-*.js`.

### The one piece of duplication

`js/lite-settle.js` repeats the bookkeeping in `handBack()` in
`js/ui-handover.js` — same grade call, same axes, same reputation curve, same
history entry. It is written out again rather than shared because the classic
handover keeps its bookkeeping wrapped around its own screens, and pulling it
apart would have meant editing the version that is live in front of a class.

**If you change one, change the other.** When Lite has been through a lesson or
two, the right move is to lift it into a `sim-` module and have both call it.

## Testing it

Two harnesses, both run from the console on `lite.html`. Both mute the audio
first.

```js
// plays badly on purpose: can it be broken, or stalled with nothing to press?
await fetch('/tools/lite-sweep.js').then(r => r.text()).then(eval);
__sweep(18, 'SWEEP-A');

// plays as well as the interface allows: can a careful student do well?
await fetch('/tools/lite-careful.js').then(r => r.text()).then(eval);
__careful(16, 'CAREFUL-1');
```

Last full run (September 2026):

| | jobs | result |
|---|---|---|
| random player | 360 | 0 errors, 0 stalls. Stars spread 1–5 |
| careful player | 192 | **4.51★ mean, 79% five-star**, 0 errors, 0 gaps |

Both were also run in a 430px-tall window (see bug 5 below): 4.56★, 0 errors.

The careful figure is the one that matters. If it drops below about four stars
something has become unwinnable, and that is a worse bug than a crash: nobody
can see it, and it lands on the one student who was paying attention.

The careful harness deliberately does *not* choose between parts on spec — it
takes whatever arrives soonest. So the two-star results it reports (a spinning
disk fitted for someone who wanted the machine to feel quick; RAM faster than
the controller can use; paste where the console was designed for liquid metal)
are the lesson working, not the game failing.

### Four real bugs those harnesses found

Worth recording, because none of them would have shown up in hand testing:

1. **Glued machines dead-ended.** The open beat assumed every machine was four
   screws and a cover. An iPad is heat, then picks worked into the seam, then
   the display lifted off — no screws anywhere — and it left a student on a
   screen with nothing to press. Lite now walks each machine's own teardown.
2. **A bill nobody would pay had no way out.** Buy a part the customer cannot
   afford and every price was refused, forever. There is now an honest exit
   that finds the most they will actually hand over and lets the shop eat the
   difference.
3. **Two-stage repairs closed after the first stage.** The PS5's cooler needs
   cleaning *and* fresh liquid metal. A careful player did half a repair and
   got one star for it, which is not a lesson, it is a trick.
4. **The machine scrolled off the top on a short window.** Every render
   scrolled the stage to the bottom, which is right while somebody is
   talking and wrong once there is a machine to drop things onto: on a
   430px-tall window you got a tray of tools and no machine in sight. The
   working beats now scroll to the mat, keep two lines of conversation
   rather than all of it, and the mat is sized off the window's height as
   well as its width. **You should never have to scroll between the tool in
   your hand and the thing you are putting it on.**
5. **The keyboard path was dead.** The drag engine re-bound its listeners on
   every render; Enter on a tool ran every stacked handler in turn, toggling
   the same thing in and out of your hand. The pointer survived it by luck.
   The only people affected were the ones who could not use a mouse.
