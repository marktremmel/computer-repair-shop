# Developer notes — how the build fits together

Working notes for whoever edits the code next (including the AI assistants).
`ROADMAP.md` holds the invariants and the traps; this page is the map. Read both
before adding anything.

**Working copy:** `~/computer-repair-shop copy 0921` (git `main`, pushed to
`github.com/marktremmel/computer-repair-shop`). Other folders named
`computer-repair-shop*` are archives. Do not edit them.

---

## 1. The loop a student plays

```
Counter ──► Sit-down ──► Workbench ──► Software lab ──► Parts market ──► Handover
 (pick a     (ask, follow   (open it,     (the machine     (buy only what   (verify, price,
  customer)   up, theory)    measure,      switched on:     the readings     five judgements,
                             gestures)     apps / handset)  justify)         reputation)
```

Every fault must work in *each* of these it touches. A fault is not "added" until
a student can meet it at the counter, hear about it at the sit-down, find it on the
bench or in the lab, fix it with their hands, and prove the fix at the handover.

| View id | File | What lives there |
|---|---|---|
| `counter` | `ui-counter.js` | Queue of walk-ins, footfall, waiting for the next customers, returning-customer lines (`TechOpsCustomers.greet`) |
| `intake` | `ui-intake.js` + `data-interview.js` | 10 questions, per-fault answers (`hot/warm/cold/red`), follow-ups (`FOLLOWUPS`: `from` an answer or `after` an instrument, optional tone `choices`), working theory, **`REVEALED_BY`** (the one map of which instrument reveals which fault; exported as `TechOpsIntake.revealedBy/diagnosed`) |
| `bench` | `ui-bench.js`, `board.js`, `data-boards.js`, `precision.js`, `screw-heads.js` | Screws, teardown steps, the drawn board, instruments, multimeter HUD, bench actions with gestures, fitting parts, re-tests and fix confirmation |
| `mac` | `ui-macos.js`, `ui-minigames.js` | Desktop OSes: dock apps (Activity Monitor, Disk Utility, Storage, Terminal, Network, Browser, System Settings) and `JOB_STEPS` procedures. Phones/tablets: the **handset screen** (Battery & charging, Touch test, Storage). Consoles: storage list |
| `market` | `ui-market.js`, `data-parts.js` | Vendors, part categories (`CATS`), compatibility, delivery |
| `handover` | `ui-handover.js`, `sim-score.js` | Verification note, price, `grade()` → five axes, review, reputation, comebacks, customer memory, goals |
| `chipid` | `ui-chipid.js`, `chipid-data.json` | Chip identification trainer (iFixit data) |
| `shopfit` | `ui-shopfit.js`, `data-upgrades.js` | Spending the till on time-saving upgrades (never on score) |

Other pieces: `sim-state.js` (state, seeded RNG, save), `sim-ticket.js` (tools,
teardown steps, **ACTIONS**, `newTicket`, `footfall`, `resolveStep`), `app.js`
(navigation, goals/`BADGES`), `ui-tour.js` (walk-round and training ticket),
`ui-report.js` (hand-in code and teacher decoder), `ui-dossier.js` (goals,
save & load, guide).

## 2. Data shapes worth knowing

- **Fault** (`data-faults.js`): `appliesTo`, `complaints` (strings or
  `{t, os|kind}`), `customerTheory`, `readings` (merged over the machine's healthy
  baseline by `readingsFor`), optional `readingsOn[kind]`, `after` (what
  instruments say once fixed), `fixedBy` (`{kind:'part',cat}` or
  `{kind:'action',id,needsPartCat?}`), `wrongFix[cat]`, `explain`.
- **Reading fields** must match `formatReading` in `ui-shell.js`: battery uses
  `cycles/healthPct/condition`; power uses `watts/negotiated/seats`; etc.
  Unknown field names are silently replaced by the baseline's.
- **Evidence flags.** A fault's reading may carry `abnormal: true` (it shows the
  fault — the evidence rail marks it) or `decisive: true` (a normal reading that
  settles the diagnosis, e.g. a healthy drive in a machine that will not boot).
  Every instrument listed in `REVEALED_BY` must have one of the two (coverage 4f).
  Never infer "abnormal" from the wording of a note.
- **App instruments.** Some evidence lives in an app, so using the app is the
  instrument: `browser` (load or search in the Browser / handset Safari),
  `settings` (open a System Settings pane), `network` (ping a hop in the Network
  app). They are recorded by `recordCheck(id)` in `ui-macos.js`, cost 0.1 h once,
  and have healthy baselines like any other reading.
- **Meter** points come from `meterBaseline(machine)`: desktop/console
  `gnd rail12 sb5 vcore`; laptop/aio `gnd dcin sysbus vcore`; handhelds and phones
  `gnd vbus vbat`. A fault only lists the points it changes.
- **Action** (`sim-ticket.js ACTIONS`): `tool`, `needsStep`, `needsAction`,
  `needsPartCat` (consumed from the shelf), `onlyMachines/notMachines`,
  `software:true` (lives in the lab), `labourHours`, `done`.
- **Board** (`data-boards.js`): layouts in their own coordinate space; chip ids are
  mapped to teardown regions by `REGION_CHIP` in `ui-bench.js`.

## 3. Checklist: adding or changing a fault

1. `data-faults.js` — self-contained complaints (each must state the symptom on its
   own; they are picked singly), readings in the formatter's field names, `after`,
   `fixedBy`, `wrongFix`, `explain`.
2. `ui-intake.js REVEALED_BY` — only instruments whose reading **shows** the fault.
   Instruments that merely rule things out do not belong here.
3. `data-interview.js` — at least one `hot` answer; follow-ups where an answer
   invites one.
4. The fix happens **where it happens in real life**, with the hand: a bench
   gesture (`precision.js`), a lab app the student operates, or the handset
   screen. Never a column of "Do this" buttons or a tick-the-right-answers quiz.
5. The fix is verifiable: re-running the instrument that found it reads normal
   (`after`), or the app visibly works again.
6. Handover: `sim-score.js` only if the fault has a judgement of its own
   (e.g. liquid metal vs paste).
7. Run `./rebuild.sh`, `node tools/coverage.js`, `node tools/scoring.js`,
   `node tools/playthrough.js`, then click it through in a browser — Firefox too.

## 4. Rules that are easy to break

- **Every gesture has a keyboard route that costs the same** (precision.js `KEYS`;
  handset plug = Enter, restart = hold Space/Enter, touch grid = arrow keys).
- **Never act inside another module's `change` event.** Defer with
  `setTimeout(…, 0)`. The training ticket once swapped the shift back from inside
  the handover's own event and the rest of the handover ran on the real shift.
- **The training ticket runs on a copy.** `Shop.state.practice` blocks `save()`;
  `ui-tour.js` restores the snapshot and `Shop.reseed()`s the RNG afterwards.
- **Shift codes are promises.** `SHIFT_PROFILES` in `sim-ticket.js` holds the note
  and the behaviour together; the dossier reads the notes from there.
- **Same list for every job.** Any list a student inspects (extensions,
  notification sites, handset tabs) must look the same whether or not the fault is
  present, or its mere presence gives the answer away.
- **Class names built at runtime** (`'mood-' + mood`) are invisible to a
  literal-name scan. Comment them in the CSS so a cleanup does not delete them.

## 5. Generated data — never edit by hand

- `js/chipid-data.json`, `assets/chipid/`, `js/data-boards-real.js` come from
  `python3 tools/build-chipid.py "<path to the saved iFixit Guides folder>"`.
  It parses each saved Chip ID page, finds iFixit's coloured boxes in the
  annotated photo, subtracts anything also found on the clean photo (screw pads,
  shields), keeps only boxes from photos of the same shot (compared by
  correlation), and exports the clean photo so students have to find the chips.
  Connectors that are not chips (battery, port module, display) come from
  `tools/board-connectors.json`, read by hand from teardown photos, each with its
  source. Then run `./rebuild.sh` for the offline shim.
- Only the MacBook Neo's bench board is drawn from a photo so far. The Steam Deck,
  Switch 2, PS5 and iMac boards could be too, but their connector positions need
  the repair-guide photos, which were not saved locally (the pages lazy-load).
- `js/chipid-data.js`, `js/pixel-manifest.js` — offline shims made by `rebuild.sh`.

## 6. Things that are deliberately not wired yet

- `js/i18n.js` — Hungarian scaffolding, loaded but not used by any view. Lessons
  are taught in English; wire it after multi-job juggling.
