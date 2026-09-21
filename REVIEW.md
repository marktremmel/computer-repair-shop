# TechOps Budapest — where it stands, and where it could go

Written at the point the shop is ready to put in front of a class. `ROADMAP.md`
is the working document for whoever edits the code; this one is for deciding
what is worth doing next, and why.

---

## 1. What it is now, honestly

A repair shop with 14 machines, 38 faults, 68 parts, four vendors and six
customer types. A job runs: read the counter card → sit down and ask → measure
what the answers pointed at → buy the part the customer can live with → do the
work with your hands → set a price → find out what they thought.

Three things make it a simulator rather than a quiz, and they are the three
things to protect:

- **The fault is hidden.** Nothing tells you what is wrong. Instruments give
  readings; readings need interpreting.
- **There is no globally right answer.** Measured, not asserted: the same 2 TB
  Gen4 drive is 3★ for a pensioner and 5★ for a video editor, and across the
  four part categories the widest spread between customer types is 2–3 stars.
- **Consequences outlive the job.** Comebacks, reputation, footfall, the till.

**Measured behaviour** (`tools/playthrough.js`, 2,355 plays across every
machine × fault pair, five strategies, three seeds):

| strategy | mean | margin/job | 40-day till | rep |
|---|---|---|---|---|
| careful | 4.87★ | 11 500 Ft | 371 000 Ft | 100 |
| top-spec | 4.92★ | 11 700 Ft | 396 000 Ft | 100 |
| cheapest | 4.73★ | 11 500 Ft | 312 000 Ft | 94 |
| silent (never warns about delays) | 4.56★ | 10 500 Ft | 325 000 Ft | 90 |
| careless | 2.46★ | 34 200 Ft | 355 000 Ft | 33 |

Read that bottom row carefully: **overcharging is more profitable per job**, and
only loses over a whole shift, because reputation empties the counter. Over 90
days the careless shop does 8.6 jobs to the careful shop's 34.8. That is the
argument the material is making, and it is now measurable rather than asserted.

---

## 2. What I would fix first, if a lesson showed a problem

Ranked by how likely it is to be the thing that actually goes wrong.

1. **Balance against a real class.** Everything above was tuned against a
   harness. Thirty students will find combinations the harness never tried.
   Watch specifically for: jobs where the budget is impossible and the student
   does not find the decline button, and whether anybody notices the footfall
   penalty at all inside one lesson.
2. **The first ten minutes.** The walk round is new and untested on anyone.
   If students skip it and then flounder, the answer is probably a scripted
   first *job* rather than a longer tour.
3. **Reading load.** There is a lot of prose. It is good prose, but a student
   who does not like reading will bounce off the sit-down. Worth watching who
   stops reading and when.

---

## 3. Where it could go next

Grouped by what they would buy, not by effort.

### Would make it a better lesson

- **A tutorial job**, not just a tour: one machine, one obvious fault, the rest
  of the shop closed off. The difference between "here is the bench" and
  "you have now fixed something".
- **Multi-turn interviews.** Questions are single-shot. The mechanic that is
  missing is the follow-up: *"the liquid indicator is pink — are you sure
  nothing was spilled?"* That is where the digital-literacy lesson about
  unreliable narrators actually lives.
- **A diagnosis commitment that costs something.** You can log a theory and the
  game tells you whether the readings support it. Being wrong is currently free.
- **Hungarian.** The single biggest accessibility change available, bigger than
  anything in the access panel, for a group who find English an extra barrier
  on top of the content.
- **A teacher's lesson plan.** One page: which shift codes to hand out, what to
  look for in the class roster, three discussion questions. The software is
  done; the teaching wrapper is not.

### Would make it a better game

- **Multi-job juggling.** Two or three machines, each with its own clock. The
  biggest change to how it feels and the biggest risk to its clarity.
- **A multimeter and rail prober.** Probe test pads, watch 20 V become 0.9 V,
  find a short by continuity. `blown_caps` already established that this shop
  measures rails.
- **More procedure mini-games.** The loom routing on the PSU reconnect is the
  pattern: a short, physical, failable action replacing a click. Candidates:
  seating a cooler evenly across four screws, pulling a display ribbon at the
  right angle, thermal paste spread patterns.
- **Consequences with names.** Regulars who ask for you, a customer who tells
  their friends, a bad review that sits on the shop for a week. Reputation is
  one number doing a lot of work.

### Would make it reach further

- **A phone build.** Two separate pieces: making the existing bench usable at
  390 px, and a genuinely different **swipe mode** — one symptom per card,
  hardware or software, would-this-fix-it, scored on speed and accuracy. The
  second is the better lesson on a phone and would work on a bus.
- **Friends in the shift.** A local session where a class builds each other as
  the walk-in customers, so the person whose iPhone you are fixing is two desks
  away. Plus a preview of the next ~20 customers to rename and re-style.
- **More boards.** `pcie_gpu` and `router_switch` are specified ready to build
  and teach things no current board does.
- **Real part numbers on the boards.** `chipid-data.json` holds real components
  for nine devices; the boards still use generic labels.

---

## 4. Content gaps, specifically

- **The spread is still uneven**: the PS5 and the iPhone 17 have 5–8 faults against
  24 for the 2012 MacBook. The fix is faults written for those machines, not
  wider `appliesTo` lists.
- **No fault teaches backups as a habit** rather than a rescue. `no_backup`
  exists but fires after the fact.
- **Nothing covers a scam that costs money** — a phishing page, a fake invoice,
  a "your subscription expired" mail. `browser_push_spam` is the closest and it
  is the most useful fault in the game for a general audience.

---

## 5. What has been measured, and what has not

**Measured**, and re-measured on every change:
- Every machine × fault pair is winnable, reachable and has a decisive
  interview answer (`coverage.js`).
- The scoring invariants hold across 31 scenarios (`scoring.js`).
- Careful work beats careless work by 2.4 stars and wins over a shift; the same
  part suits different customers differently (`playthrough.js`).
- All 194 machine × fault pairs are clicked through every screen (about 13,900
  clicks) with no uncaught errors.

**Not measured, and worth knowing:**
- Whether any of it teaches anybody anything. No student has played it.
- Whether the reading level is right for the younger end of 5–12.
- Whether it holds up for a full 45-minute lesson or runs out in 20.
- Performance on a low-end school laptop. The sprite compositing is canvas work
  and has not been profiled.

---

*For the code-level contract, the traps that have already bitten, and how to
add a fault, machine, board or gesture, see `ROADMAP.md`.*
