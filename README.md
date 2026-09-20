# TechOps Budapest — a computer repair shop simulator

A browser game for teaching digital literacy and repair, written for SEK Budapest.
No accounts, no database, no build step. Open `index.html` and it runs — from a
web server, from a USB stick, or offline.

**Play it:** https://marktremmel.github.io/computer-repair-shop/

---

## What it is

You run a repair shop. Somebody puts a machine on the counter and tells you what
they think is wrong. They are often wrong — that is not a trick, it is what
actually happens at a counter.

The loop:

1. **Counter** — pick a job. The budget and the deadline are part of the puzzle.
2. **The sit-down** — ask questions before you open anything. A question costs
   0.1 h of bench time; a memory test costs 1.5 h. Listening is the cheapest
   diagnosis in the shop.
3. **Bench & macOS lab** — measure only what the answers pointed at. Testing
   everything costs the customer a day.
4. **Parts market** — four vendors with genuinely different trade-offs, and the
   customer gets to approve the cost and the wait before you spend their money.
5. **Bench** — right driver, battery off first, part into the board. Several
   operations are precision gestures, not clicks.
6. **Handover** — set your price and find out what they thought.

## What it is actually teaching

There is no globally correct part. A job is graded on five axes — **fit,
budget, turnaround, durability, workmanship** — and a job is only as good as its
*worst* axis. The same Samsung 990 PRO is five stars for a videographer and three
for a pensioner who checks her email.

Some things the game is built to make unavoidable:

- **Several of the faults need no parts at all.** Selling somebody a drive to fix
  a full Downloads folder works, and it is still the worst thing you can do to them.
- **Compatibility is physics.** An SO-DIMM will not go in a DIMM slot. A Gen4
  drive in a Gen3 ×2 socket runs at a quarter of what you paid for.
- **Delivery time is part of the price.** The cheap part that arrives in three
  weeks has cost the customer more than it saved them.
- **Sometimes the answer is no.** If the cheapest honest repair costs more than
  the machine is worth, saying so and charging for the diagnosis is a four-star
  outcome, not a failure.
- **A bill describes the work, not the wallet.** Staying inside the budget is
  the floor. Charging a pensioner everything she has for a five-minute fix, or
  running all ten instruments and billing for the lot, costs you stars — and
  people do not hand over full price for work they can see is poor.
- **A bad name empties the shop.** Reputation decides how many people are
  waiting at the counter and how many days pass before the next one. Over a
  long shift the careless shop earns a burst and then sits idle; the careful
  one is still busy.
- **Some faults are the machine protecting itself.** A MacBook can be unusably
  slow *because* it is cold: with a thermal sensor unplugged, macOS clamps the
  processor rather than risk heat it cannot see. The fix is a ribbon cable, and
  the lesson is that "it is broken" is often a safety behaviour over a fault
  somewhere else.
- **Some of it is not a fault at all.** A website that was granted notification
  permission can deliver fake virus warnings through the same channel the
  operating system uses, which is exactly why they look real. A public hotspot
  makes every HTTPS page throw a certificate error, and the warning is correct.
  Both are digital literacy wearing a repair ticket.

## For teachers

- **Shift codes.** Any word seeds the shop; everyone who types the same word gets
  the same customers, faults and prices, so a class compares decisions rather than
  luck. Eight curated codes are listed in the game under **Record**.
- **Hand-in codes.** A student's whole shift compresses into one `SEK7K-…` code.
  Paste it into the teacher decoder (also under **Record**) and it decodes
  entirely in your browser. Nothing is uploaded anywhere.
- **Save codes, so a shift survives the machine.** The shop saves itself to
  the browser after every job, but a shared computer or a wiped profile takes
  that with it. **Shop record → Carry this shop to another computer** gives a
  code that restores who you are, the till, the reputation and the job history
  somewhere else. It is a *different* code from the hand-in one, and the two
  refuse to be confused: a hand-in code reports a finished shift and cannot
  restore one, which is deliberate — otherwise a student could edit their own
  marks back in.
- **Paste the whole class at once.** The decoder takes up to fifty codes in one
  go and builds a roster: average stars, till, reputation and all five axes per
  student, sortable by any column, with a CSV export for the register. It names
  **the axis the class as a whole is weakest on** and what to do about it next
  lesson — which is more useful than thirty individual star averages. The
  “Load sample class” button shows you what it looks like before the lesson.
- Everything prints. The shift report has a print stylesheet.
- **It works off a USB stick with no server.** Open `index.html` straight from
  the file system and everything still runs, including the character builder and
  the chip-ID bench — the data those need is compiled into the page rather than
  fetched, because a `file://` page has no origin to fetch from.
- **Accessibility.** The precision gestures have a keyboard route (arrows or
  space, one press at a time; Esc backs off), and it is held to the same standard
  as the mouse — hammering the key stretches the adhesive tab just as snatching
  it does. Board states carry a glyph and a dash pattern as well as a colour, so
  they read without colour vision.

## Running it locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. There is no build step, but if you edit
anything in `js/` or `css/` run `./rebuild.sh` first — it stamps the asset URLs
so browsers pick up the change instead of serving a stale copy.

## Checking a change

```bash
node tools/coverage.js     # content integrity: nothing unwinnable, nothing unreachable
node tools/scoring.js      # 27 scoring scenarios
node tools/playthrough.js  # plays every job five ways and simulates 40-day
                           # shifts — is careful work visibly and financially
                           # better than careless work?
```

No dependencies — plain Node. See `ROADMAP.md` for how to add machines, faults
and parts without breaking anything.

## Layout

```
index.html            the whole shell
js/
  data-*.js           content: machines, parts, faults, customers, boards, upgrades
  sim-*.js            rules: state, ticket generation, scoring, the wait
  ui-*.js             screens
  board.js            board renderer
  precision.js        the gesture engine
  pixel-portrait.js   character compositor
css/                  two stylesheets
assets/bg/            shop art, five times of day
assets/pixel_portrait/ character sprite pack
shared/js/            audio synth and the SEK hand-in code engine
tools/                content-integrity and scoring harnesses
```

## Credits

- Character portraits are built from the
  [Pixel Portrait Creator](https://lyime.itch.io/pixel-portrait-creator) by **Lyime**.
- Component identifications on the boards draw on [iFixit](https://www.ifixit.com)'s
  public chip-ID teardowns.
- Everything else — shop art, writing, sound, code — is part of this material.

Built for SEK Budapest.
