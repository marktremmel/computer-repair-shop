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

## For teachers

- **Shift codes.** Any word seeds the shop; everyone who types the same word gets
  the same customers, faults and prices, so a class compares decisions rather than
  luck. Eight curated codes are listed in the game under **Record**.
- **Hand-in codes.** A student's whole shift compresses into one `SEK7K-…` code.
  Paste it into the teacher decoder (also under **Record**) and it decodes
  entirely in your browser. Nothing is uploaded anywhere.
- **The report names which of the five judgements a student keeps losing**, and
  suggests what to do about it next lesson. That is more useful than the star
  average.
- Everything prints. The shift report has a print stylesheet.

## Running it locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. There is no build step, but if you edit
anything in `js/` or `css/` run `./rebuild.sh` first — it stamps the asset URLs
so browsers pick up the change instead of serving a stale copy.

## Checking a change

```bash
node tools/coverage.js   # content integrity: nothing unwinnable, nothing unreachable
node tools/scoring.js    # 27 scoring scenarios
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
