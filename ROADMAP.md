# Where to pick this up from

Written for whoever works on this next — including me, later, having forgotten
all of it.

Two outside reviews have now been folded in (`suggeestion-techops_review_and_expansion_guide_v1.md`
and `-v2.md`, kept in this repo for their expansion blueprints). Everything
those reviews listed as a bug is fixed; §3 is what is genuinely left.

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

**An accessible route is the same work, not less of it.** The keyboard path
through a precision gesture advances one press at a time and penalises hammering
or a held key exactly as a snatched drag is penalised — you can still tear an
adhesive strip with the space bar. An accommodation that skipped the difficulty
would quietly become the route everyone takes, and the tactile mechanic would
stop existing. Hold any future alternate input to the same standard.

---

## 2. Known rough edges

Honest list, roughly by how much they matter.

- **Board traces are a simple fan-out.** They radiate from the main package in
  right angles. Real routing has bus groups, vias and layer changes. Cosmetic,
  but the boards are good enough now that the traces are the weak part.
- **Only one machine on the bench at a time.** Real shops juggle. Multi-job would
  add a lot of texture and a lot of state complexity.
- **No Hungarian.** The whole thing is English. The portal cards elsewhere are
  bilingual. The sit-down dialogue is the most voice-dependent part and would be
  the hardest to translate well.
- **No student-tested balance.** The scoring was tuned against a scenario
  harness, not against a class. Expect to re-tune after one lesson.
- **The breather's ambience is synthesised**, deliberately, so it works offline.
  It is decent but it is not music.

---

## 3. Things worth building next

Roughly in order of value per effort.

**Fill out the thin machines.** The spread is mbp13_2012 23, inspiron15 20,
thinkpad_t480 19, mba_m1 and mbp14_m3 17, imac_m1 11, tower_pc and switch2 9,
ipad_air 9, steamdeck 8, iphone12 6, iphone17 5, **ps5pro 4**. A student who
draws the PS5 twice sees the same job. The tempting fix — padding `appliesTo`
— is the wrong one: a fault whose readings and interview answers were written
for a laptop reads as nonsense on a console. Write it for the machine.

**More faults from the iFixit set.** The guide dump still has unmined material:
sticky-key variants, the Pixel 10a guides, MacBook Neo keyboard / trackpad /
USB-port replacements. Adding a fault means touching five files — see §5 —
then running the coverage check.

**A multimeter and rail prober.** Two probes, black on chassis ground, red on
board test pads (`PPBUS_G3H`, `3V3_S5`, `1V8_CORE`), with DC volts, resistance
and a continuity beep. It teaches how 20 V at the inlet becomes 0.9 V at the
core, and a shorted decoupling cap beeps straight to ground. The strongest
candidate for the next real instrument, and `blown_caps` already established
that ripple and rail voltage are things this shop measures.

**Multi-job juggling.** Two or three machines on the go, each with its own clock.
The biggest change to how the game feels, and the biggest risk to its clarity.

**A proper diagnosis commitment.** The sit-down lets you log a theory and tells
you whether the readings support it. It still does not *cost* anything to be
wrong, or reward being right early. There is a real mechanic in there.

**Consequences that outlive a job.** Comebacks exist. Regulars who ask for you
by name, a customer who tells their friends, a bad review that sits on the shop
for a week — reputation is currently a single number doing a lot of work.

**Multi-turn interviews.** Questions are single-shot. There is a good mechanic
in "the liquid indicator is pink — are you sure nothing was spilled?" that does
not exist yet.

**More boards.** Two are specified ready-to-build in the v2 guide: `pcie_gpu`
(a graphics card is a whole computer on a card — its own processor, a GDDR6
memory ring, 14 power phases) and `router_switch` (magnetics-isolated RJ45,
PHY transceivers, a packet ASIC, SPI boot flash). Both teach something no
current board does.

**Real part numbers on the boards.** `js/chipid-data.json` holds real components
across nine devices. The Chip ID bench uses them; the boards still use generic
labels. Half a day, and "Label the components" gets much richer.

**Hungarian.** An EN/HU toggle would match the rest of the portal and would make
this usable with groups who find English an extra barrier on top of the content.

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

**Actions name steps in laptop language.** `repaste` needs `heatsink`; a tower
and a console have `cooler`. `power_reset` needs `battery_connector`; a machine
with no battery makes the board safe at the PSU instead. That translation lives
in exactly one place — `TechOpsJobs.resolveStep()` in `sim-ticket.js` — because
it was originally written out at each call site, and a call site that forgot it
silently hid the action. Never inline it again; `hasStepFor()` is there for
"could this machine ever reach it".

**Machines need faults *and* parts that fit them.** A machine missing from a
fault's `appliesTo` silently falls back to the Dell. A fault whose `fixedBy` part
fits nothing on that machine is an unwinnable job. `tools/coverage.js` checks
both, plus action prerequisites — run it after touching any data file.

**A lookup table that duplicates knowledge will drift from it.** `REVEALED_BY`
in `ui-intake.js` listed ten of twenty-two faults, so a student who committed to
one of the other twelve was told "untested" forever, however many instruments
they ran. It threw nothing and looked fine. Coverage now cross-checks every
entry against that fault's actual `readings`.

**A hand-transcribed copy of a data file will drift too.** The offline shims
(`chipid-data.js`, `pixel-manifest.js`) were originally typed out by hand and
had already gained a wrong sprite path. They are now **generated by
`rebuild.sh`** from the `.json`. Do not edit them; edit the JSON and rebuild.

**A render sweep proves nothing about clicking.** A sweep that drove all 157
machine × fault pairs through all eight screens reported zero errors while
*every bench action was throwing a ReferenceError on click* — `doAction()`
referenced an undefined `m`. The error went to `window.onerror`, not
`console.error`, so even the console check missed it. Verification has to click
the controls, and has to listen on `window` for uncaught errors, not just watch
the console.

**Reusing a mini-game reuses its wording.** `toggles3` was hard-coded to the
NVRAM reset's "what will the customer lose". Borrowing it for a notification
permission produced a question about startup disks. It is parameterised now
(`tgTitle`, `tgPrompt`, `items`, and so on) with the NVRAM case as its default —
when a step needs a different question, give it one rather than borrowing.

**A new field the scorer does not read is a silent nothing.** The first version
of the board-rework penalty wrote `t.boardQuality`, which nothing anywhere
looked at, so breaking a socket contact cost exactly zero. Consequences go
through the channels `sim-score.js` already reads — `sloppySteps`,
`strippedScrews`, `snappedTabs`, `boardDamaged`, `boardRework` — and a new one
means adding it there, with its finding text, in the same change.

**A new tool has to be pickable.** The tool rack was a hand-written list, so an
action needing a tool the list did not mention refused every time it was
clicked. The rack now derives from the actions and teardown steps this machine
can actually reach, so adding an action adds its tool.

**Actions speak laptop.** `straighten_pins` on a console whose processor is
soldered down is nonsense, but it passed the step check because the console has
a `cpu` step. `onlyMachines` on the action pins it to the machines where it is
physically meaningful, and `hasStepFor()` honours it, so the UI and the coverage
harness cannot disagree about it.

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

**Screw heads must be drawn as what they are.** `torx-t3` and `torx-t8` were
missing from `HEADS` in `screw-heads.js`, so they fell back to drawing a
Phillips cross. A student who looked carefully, saw a cross and picked the
Phillips driver was then penalised for stripping it. Coverage now fails if a
machine uses a screw type the renderer does not know.

---

## 5. How to add things

**A new fault** touches five files:
1. `data-faults.js` — the fault, its `appliesTo`, instrument `readings`,
   `fixedBy`, `wrongFix` and the `explain` text that carries the teaching.
2. `data-interview.js` — at least one decisive (`w: 'hot'`) answer, or it cannot
   be diagnosed by asking.
3. `ui-intake.js` — a `REVEALED_BY` entry naming the instruments that show it,
   or the sit-down will never confirm a correct theory.
4. `sim-ticket.js` — if it is fixed by an action rather than a part.
5. `ui-macos.js` or `ui-bench.js` — somewhere to actually perform that action.

Then run the coverage check.

**A new machine** needs an entry in `data-machines.js`, a board layout in
`data-boards.js` (or an honest reuse of an existing one), a chassis kind mapped
in `board.js` `KIND_FOR`, its ids added to the `appliesTo` of every fault it can
have, and parts in `data-parts.js` that fit it.

**A new board layout** needs a `note` explaining *why* that machine is laid out
that way. The note is the teaching; the rectangles are just rectangles.

**A new precision gesture** goes in `precision.js` as a type, with geometry in
`gestureFor()` in `ui-bench.js`, a keyboard entry in that file's `KEYS` table,
and a fallback for when it fails.

**A new state colour on the board** needs a non-colour cue with it. `.done`,
`.target` and `.faulty` each carry a glyph badge and a distinct dash pattern, so
they are still distinguishable without colour vision.

---

## 6. Checks before shipping a change

```bash
for f in js/*.js; do node -c "$f"; done   # everything parses
./rebuild.sh                              # regenerate shims, stamp asset URLs
```

```bash
node tools/coverage.js   # every machine x fault x part x action x teardown step
                         # is reachable and winnable; every fault has a decisive
                         # interview answer and a REVEALED_BY entry backed by a
                         # real reading; every screw type can be drawn
node tools/scoring.js    # 27 scenarios: the same part scores differently for
                         # different customers, no-part faults punish upselling,
                         # misdiagnosis fails, the worst-axis cap holds
```

Both run on plain Node with no dependencies. `coverage.js` has now caught six
classes of shipped bug that playtesting missed — run it after touching any
data file.

Then open it in a browser and click through a job. The harnesses cannot see a
silent refusal or a control nobody can reach, which is the category most of the
real bugs have fallen into. When sweeping in the console, **click the controls
and listen on `window` for uncaught errors** — a sweep that only renders every
screen once reported all clear while every bench action was throwing.
