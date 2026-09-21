# TechOps Budapest — Teacher guide

For a 45-minute lesson (or a double period) with students aged roughly 12–18.
Every step below has been checked against the game as it is now. If the game
and this guide ever disagree, the game is right and this page needs fixing.

---

## 1. What students do

They run a small repair shop in Budapest. People walk in with a machine and a
story. Nobody tells the student what is wrong: they **ask** at the sit-down,
**measure** on the workbench and in the software lab, **buy** only what the
readings justify, **fix it with their hands** (drag, trace, scrape, lift), **prove**
the fix by re-testing, and **set a price**. The customer then judges the job on
five things:

| On screen | What it asks |
|---|---|
| Right part for this person | Did the part suit this machine and what this person actually does with it? |
| Respected their money | Was the bill fair for the work — and was nothing sold that was not needed? |
| Turnaround against the deadline | Did delivery time and bench time fit the day they needed it back? |
| Still working next year | Warranty, part quality, and whether the repair comes back. |
| Safe, tidy workmanship | ESD strap, matching drivers to screws, working on a powered-off board. |

**A job is only as good as its worst judgement** — five stars on four of them does
not rescue a rounded-off screw or an unneeded part.

Two ideas carry the whole lesson:
- *Listening is cheap.* A question costs 0.1 h of bench time; the memory test
  costs 1.5 h.
- *The honest answer is often "no part needed".* Over a whole shift, careful
  work earns more than cutting corners, because reputation decides how busy the
  shop is. (Measured by `tools/playthrough.js`: over 40 days a careful shop ends
  around 370 000 Ft, a careless one around 317 000 Ft.)

---

## 2. Before the lesson

- **Open it** at the GitHub Pages address, or open `index.html` straight from a
  USB stick — it works offline, from `file://`, with no install.
- **One browser per student.** The shop saves itself in that browser. The
  **Save & load** tab (the floppy-disk button, top right) gives a save code for
  carrying on at home or on another computer.
- **Try the decoder on your own computer first.** On the title screen, click
  *Teacher? Decode the class's hand-in codes* (also in the report window and in
  Save & load). It needs no shift of its own.
- **Pick a shift code** (section 3).

---

## 3. Shift codes

Everyone who types the same code meets **the same first customers**. After that,
students' choices (who they take, how long they spend) make their shifts drift
apart — which is the point: you can compare decisions on the same people.

Students set it in **Goals & record** (the medal button, top right) → *Shift
seed* → pick a code or type one → **Start a new shift**. (Starting a new shift
wipes that browser's current shift; their face and name are kept.)

| Code | What it does |
|---|---|
| `BUDAPEST` | The default broad mix. Good for a first lesson. |
| `DUNA` | Deadlines halved. Delivery time becomes part of every price. |
| `FILLER` | Budgets about 40 % lower. Forces the cheap-versus-lasting argument. |
| `PARLAMENT` | Only machines from 2019 and earlier. "Is this even worth fixing?" |
| `METRO` | Only phones and tablets. Glued-shut teardowns and screen choices. |
| `SZIGET` | Bigger budgets and looser deadlines. Over-specifying is the trap. |
| `LANCHID` | Mostly faults that need no parts at all. Can they say so? |
| `KELETI` | A second broad mix, once the class knows the loop. |

Any other word works as a plain seed (a broad mix, same for everyone who types it).
These codes are checked by the test suite: if a code stopped doing what its note
says, `tools/coverage.js` would fail.

---

## 4. A 45-minute lesson

**0–5 min · Brief.** Project the title screen. Name the five judgements and the
two ideas above. Tell them the one rule: *ask before you open anything.*

**5–12 min · Training ticket** (optional but recommended for a first lesson).
On the title screen: **Training ticket**. One real job — Marika néni's laptop —
with a coach in the corner that says what each station is *for* and moves on when
the student has actually done it. It never names the answer. It runs on a copy of
the shop: when it ends, their real shift comes back untouched and it does not
count towards the hand-in code. The walk-round (**Show me around**) is the
faster alternative: nine stops, where things are, nothing more.

**12–35 min · Play.** Everyone on the same code. Aim for three or four jobs each.
Things worth walking round and watching for:
- Who opens the case before asking a single question.
- Who buys a part before any instrument has pointed at it.
- Who re-tests after fixing (the handover says *Fix confirmed on the bench*).
- Who, faced with a fault that needs no part, still sells one.

**35–40 min · Hand in.** Students click the **report** button (top right),
type their name and class, and **Copy code**. They paste it into Google Classroom
(or wherever you collect work). The code is a snapshot of the whole shift so far.

**40–45 min · Debrief.** Paste the codes into the decoder (up to 50 at once) on the
projector. It shows the class average for each judgement, the class's weakest one
with a suggestion for what to discuss, a sortable roster, and a CSV export.

---

## 5. Discussion questions that land

Pick the ones that match what you saw:

1. *"Somebody's charger wouldn't charge. Did anyone replace the port? What did the
   plug do when you turned it over?"* — the USB-C contact fault charges one way up
   and not the other; a port replacement is money for nothing.
2. *"The customer said it never got wet. What did the inside say — and how did you
   put that to them?"* — the liquid-indicator conversation has a blunt and a
   curious way to ask; only one gets the truth.
3. *"Who sold a part on a job that needed none? What did the review say?"*
4. *"The search engine kept going to a strange site. How did you work out which
   add-on was doing it — its name, or its details?"* — broad permissions alone
   prove nothing; an ad blocker needs them too.
5. *"Why does waiting three weeks for the cheapest part lose stars even when it
   works?"*
6. *"What did the multimeter tell you that looking at the board could not?"*
7. *"How did the battery come out of the MacBook Neo, compared with the other
   MacBooks in the shop?"* — the Neo's battery is held by screws, with no glue at
   all; the older MacBooks use adhesive that has to be pulled or pried. Nobody
   *has* to glue a battery in: it is a design decision someone made (and new EU
   rules will require user-replaceable batteries in portable devices by mid-2027).

---

## 6. What the hand-in code contains

Name and class (as typed), the shift code, days played, jobs done, total stars,
the five judgement averages, honest calls (jobs where they said no part was
needed or declined), jobs that went badly, comebacks, reputation, the till, the
goals reached, and the last twelve jobs with their stars.

It carries a checksum that catches a code damaged by copy-paste. It is **not**
tamper-proof: a determined student could craft one. Treat it as a report of the
shift, and use what you saw in the room alongside it.

---

## 7. The goals students can work towards

Twelve habits, shown with progress in **Goals & record**:

| Goal | What to do |
|---|---|
| Open for business | Close your first job. |
| Asked before opening | Fix a job after asking at least three questions and running no more than two instruments. |
| Told them the truth | Fix a fault that needed no parts — and sell none. |
| Grounded | Finish three jobs with the ESD strap on. |
| As promised | Hand back three jobs on or before the day you promised. |
| No upsell, twice | Be honest about needing no parts — or not being worth fixing — on two jobs. |
| Said no | Turn down a repair that was not worth it, and charge only for the diagnosis. |
| Measured, not guessed | Solve a job the multimeter helped you find. |
| Five stars | Get one job right on every judgement at once. |
| Five machines in | Close five jobs. |
| Word gets round | Reach a reputation of 75. |
| Reads boards | On the Chip ID bench, find five chips in a row on the real boards, each at the first try. |

---

## 8. Reading a weak judgement

| Weakest judgement | What it usually means | What to do next lesson |
|---|---|---|
| Right part for this person | Over- or under-specced parts, or a fast part throttled by a slow bus. | Read one machine's spec sheet together, then ask what the customer actually does all day. |
| Respected their money | Bills beyond what the work was worth, or parts sold for faults that needed none. | Replay a full-disk or lint-in-the-port job as a class. The fix is free; the temptation is a sale. |
| Turnaround against the deadline | Slow shipping or long diagnostics against tight deadlines. | Compare the three-week part and the two-day part on the same job for a customer with a Friday deadline. Try code `DUNA`. |
| Still working next year | No-warranty parts chosen repeatedly; repairs coming back. | Look at which cheap parts came back and what the rework cost. |
| Safe, tidy workmanship | No ESD strap, rounded screws, work on a live board. | The strap costs nothing. Match the driver to the head before touching anything. |

---

## 9. Practicalities

- **Accessibility:** the ♿ button sets text size, stronger contrast, a plainer
  font and less movement. Every hand gesture on the bench can also be done from
  the keyboard.
- **Sound** can be muted from the title screen or the speaker button.
- **Starting over:** Goals & record → *Start a new shift*.
- **Chip ID bench** (the chip button in the navigation): iFixit's real board
  photos with nothing marked on them. The bench describes a job — "the chip that
  negotiates power over USB-C" — and students find it, with a magnifier to read
  the markings. A good five-minute warm-up or a fast-finisher task.
- **Credits:** character portraits by Lyime (Pixel Portrait Creator); board photos
  and chip identifications from iFixit's public chip-ID teardowns, linked from
  each board in the game.

---

## 10. Student slip

```
TECHOPS BUDAPEST — BEFORE YOU START
1. Medal button (top right) → Shift seed → type the code on the board → Start a new shift.
2. Ask before you open anything. A question costs 6 minutes; a test can cost 90.
3. Look at the screw head before you pick a driver. Strap on before you open.
4. Buy only what a reading pointed at. Check the delivery date against their deadline.
5. After the repair, run the test that found the fault again.
6. At the end: report button (top right) → your name and class → Copy code → hand it in.
```
