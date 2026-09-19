# Where to pick this up from

Written at the point the shop became genuinely playable, for whoever works on it
next — including me, later, having forgotten all of this.

---

## 1. The rules that hold it together

Break these and the game still runs, but it stops teaching. They are the reason
it is not just a clicking exercise.

**Money buys time, never score.** Shop upgrades cut bench hours, delivery days
and footfall. Not one of them touches the five judgement axes. A fully equipped
shop that fits the wrong part still gets two stars. If a new upgrade would nudge
fit / budget / speed / durability / safety directly, it is the wrong upgrade.

**A job is only as good as its worst axis.** `sim-score.js` caps the star rating
when any single axis is low. Plain weighted averaging let a three-weeks-late or
wildly over-specced job still score five stars, which taught the opposite of the
intended lesson. Do not remove the cap.

**Several faults must need no parts.** `disk_full`, `port_lint`,
`runaway_process`, `sd_formatted`, `os_wrecked`, `no_internet`, `dead_no_power`
and others are flagged `noPartNeeded`. Selling hardware for them "works" and
scores about two stars. Keep free fixes well represented in any new content.

**Asking beats testing.** A sit-down question costs 0.1 h; the memory test costs
1.5 h. Decisive answers name which instruments to run. Keep that ratio.

**Bench hours are days.** `benchDays = ceil(labourHours / 6)`, and lateness is
scored against what was *promised*, not in absolute days. This is what stops
students brute-forcing every instrument: running all of them is fine for a
patient pensioner and a two-star job for a teacher with a Friday deadline.

**Failure is never a dead end.** A botched precision gesture costs time, quality,
or forces the slow route — it never strands the player. When adding a gesture,
add its fallback at the same time.

**Every refusal announces itself.** A blocked action gets a toast *and*, where
possible, a label on the control before it is clicked. A silent no-op is
indistinguishable from a broken button.

---

## 2. Known rough edges

Honest list, roughly by how much they matter.

- **Board traces are a simple fan-out.** They radiate from the main package in
  right angles. Real routing has bus groups, vias and layer changes. Cosmetic,
  but the boards are good enough now that the traces are the weak part.
- **Only one machine on the bench at a time.** Real shops juggle. Multi-job would
  add a lot of texture and a lot of state complexity.
- **Chip data is collected but barely used.** `js/chipid-data.json` holds 89 real
  components across nine devices. The Chip ID bench uses them; the *boards* use
  generic labels. Wiring real part numbers onto the board components is a
  half-day job and would make "Label the components" much richer.
- **No Hungarian.** The whole thing is English. The portal cards elsewhere are
  bilingual. The sit-down dialogue is the most voice-dependent part and would be
  the hardest to translate well.
- **No student-tested balance.** The scoring was tuned against a scenario harness,
  not against a class. Expect to re-tune after one lesson.
- **The breather's ambience is synthesised**, deliberately, so it works offline.
  It is decent but it is not music.

---

## 3. Things worth building next

Roughly in order of value per effort.

**A teacher dashboard across many codes.** The decoder handles one student at a
time. Pasting thirty codes and seeing *which axis the class as a whole loses*
would turn this from a game into a teaching instrument. The data is already in
the hand-in code.

**More faults from the iFixit set.** The guide dump still has unmined material:
sticky-key variants, pop-up blockers, the Pixel 10a guides, MacBook Neo
keyboard / trackpad / USB-port replacements. Adding a fault means touching four
files — see §5.

**Multi-job juggling.** Two or three machines on the go, each with its own clock.
This is the single biggest change to how the game feels, and the biggest risk to
its clarity.

**A proper diagnosis commitment.** The sit-down lets you log a working theory and
tells you whether the readings support it. It does not yet *cost* anything to be
wrong, or reward being right early. There is a real mechanic in there.

**Consequences that outlive a job.** Comebacks exist. Regulars who ask for you by
name, a customer who tells their friends, a bad review that sits on the shop for
a week — reputation is currently a single number doing a lot of work.

**Accessibility.** No keyboard path through the precision gestures, and the
colour-coded board states have no non-colour cue. Both are real barriers.

---

## 4. Traps that have already bitten

Every one of these shipped at least once.

**Chip ids versus region ids.** The board draws chip ids (`dimm`, `battc`); the
game reasons in teardown region ids (`ram_bay`, `battery_connector`). Cross
between them *only* through `chipForRegion()` / `regionForChip()` in
`ui-bench.js`, and keep `REGION_CHIP` in step with any new layout. Getting this
wrong throws nothing — components silently stop being clickable.

**One chip, several regions.** The battery connector and the battery are the same
place on the board. Resolve to the region `canStep()` says is doable *now*, or
clicking the connector will tell you to disconnect the battery first.

**Board layout must match serviceability.** `laptop_logic` is for soldered
machines, `laptop_serviceable` for ones with real sockets. Giving a socketed
ThinkPad the soldered board made its RAM uninstallable.

**Machines need faults *and* parts that fit them.** A machine missing from a
fault's `appliesTo` silently falls back to the Dell. A fault whose `fixedBy` part
fits nothing on that machine is an unwinnable job. `scratchpad/coverage.js`
checks both — run it after touching any data file.

**Rewiring a button strands the code behind it.** When the badges modal was
replaced, `App.badges()` stopped being called and took the "Change character"
button with it — still in source, still parsing, completely unreachable. After
changing an entry point, check what used to call the old path.

**Paint UI state idempotently.** Anything that relies on a one-shot event to
appear will eventually not appear. `App.refreshPlayerChip()` and
`App.refreshAll()` are safe to call at any time; prefer that pattern.

**Browser caching.** Run `./rebuild.sh` after editing `js/` or `css/`. Stale
JavaScript masquerades as logic bugs and has cost real debugging time.

**Sprite MIME types.** The portrait sprites are WebP. They were originally named
`.png`, which Chrome sniffed and Firefox refused — blank character selector, no
console error. Name image files for what they actually are.

---

## 5. How to add things

**A new fault** touches four files:
1. `data-faults.js` — the fault, its `appliesTo`, instrument `readings`,
   `fixedBy`, `wrongFix` and the `explain` text that carries the teaching.
2. `data-interview.js` — at least one decisive (`w: 'hot'`) answer, or it cannot
   be diagnosed by asking.
3. `sim-ticket.js` — if it is fixed by an action rather than a part.
4. `ui-macos.js` or `ui-bench.js` — somewhere to actually perform that action.

Then run the coverage check.

**A new machine** needs an entry in `data-machines.js`, a board layout in
`data-boards.js` (or an honest reuse of an existing one), its ids added to the
`appliesTo` of every fault it can have, and parts in `data-parts.js` that fit it.

**A new board layout** needs a `note` explaining *why* that machine is laid out
that way. The note is the teaching; the rectangles are just rectangles.

**A new precision gesture** goes in `precision.js` as a type, with geometry in
`gestureFor()` in `ui-bench.js`, and a fallback for when it fails.

---

## 6. Checks before shipping a change

```bash
for f in js/*.js; do node -c "$f"; done   # everything parses
./rebuild.sh                              # stamp the asset URLs
```

```bash
node tools/coverage.js   # every machine x fault x part x teardown step is
                         # reachable and winnable, and every fault has a
                         # decisive interview answer
node tools/scoring.js    # 27 scenarios: the same part scores differently for
                         # different customers, no-part faults punish upselling,
                         # misdiagnosis fails
```

Both run on plain Node with no dependencies. `coverage.js` has caught four
classes of shipped bug that playtesting missed — run it after touching any
data file.
