# Status against the design docs

The other files in `docs/` were written by a second tool (Antigravity) on the
`dev-antigrav-story` branch, together with one code commit. That commit has
been merged into `main`, with corrections. On 2026-09-21, a push with raw git
merge conflict markers across 9 files was cleanly resolved, harmonizing both
workstreams without data loss. Every check (`scoring.js`, `coverage.js`,
`playthrough.js`) passes 100%. This page ticks each item off against what is
actually in the game, so the next piece of work starts from the truth rather
than from the plan.

**Legend** — ✅ in the game and verified · 🟡 partly there · ⬜ not started ·
❌ proposed but deliberately not done, with the reason.

---

## 1. `AUDIT.md` — bugs

Every bug claim was checked against the code before being fixed. All four
real ones were real; three of the dead-code claims in §4–§5 were not.

| Item | Status | Notes |
|---|---|---|
| 2.1 RNG not re-seeded when a save is restored | ✅ | Antigravity's `Shop.reseed()` kept. After a restore, the next customers are now the ones the shift code promises. |
| 2.2 `grade()` changes state and awards a badge | ✅ | `grade()` is now pure and returns `honestNoPart`; the handover counts it once, **after** the customer agrees to pay. It had been counting one repair per price tried. |
| 2.3 Clicking a lab window does not bring it forward | ✅ | Any click inside a window raises it. |
| 2.4 Silent comeback after a repaste | ✅ | **Worse than reported.** On the tower the fin stack was *unreachable*, so every tower repaste came back however carefully it was done. Fixed the reachability (`resolveStep`: fan → cooler), added a finding and a durability cost when the fins are skipped, and a coverage check that fails if a comeback can ever again be unpreventable. |
| 2.5 `reconnect_power` stored in `openSteps` | 🟡 | Fair point about the schema; it works and is read in one place. Left as is. |
| 4.1 / 4.2 / 4.4 dead code and unstyled classes | 🟡 | `severity`, `storageForm`, `tagline`, `priceNewFt` really are unread. **Not true:** `requiresHdd` is checked in `TechOpsFaults.forMachine`; `useCases` is used by `tools/playthrough.js`; `hdd_bad_sectors` does not exist. |
| 4.3 `data-win` never read | ✅ | Now read by the window-focus fix. |
| 5.1 ROADMAP mentions the removed `KIND_FOR` | ✅ | Corrected. |
| 5.2 Placeholder vendor names in the docs | ❌ | Checked — there are none. |
| 5.3 "Six axes" | ✅ | It is five judgements behind one gate. The one comment that said six is corrected. |

---

## 2. What the Antigravity commit added

Kept, and verified by playing each job through in the browser:

| Addition | Status | Notes |
|---|---|---|
| Four settings faults: monitor cable in the wrong port, keyboard layout switched, brightness at zero, sound routed to a missing device | ✅ | Good digital-literacy content. The keyboard one uses the real Hungarian QWERTZ Z/Y swap. |
| Browser and System Settings apps in the software lab | ✅ | Rebuilt — see §3. |
| Multimeter | ✅ | Rebuilt — see §3. |
| Dedicated Save & load tab, profile on the player chip | ✅ | Kept as written. |
| Harsher reputation curve for 1–3★ jobs | ✅ | Measured before keeping it: the careless shop now falls to reputation 20 and loses 7.6 of 40 days to an empty counter (was 33 and 2.4), while careful play still holds 100. The consequence now lands inside a lesson. |
| Continuity beep | ✅ | |
| Text-size fix for the body | ✅ | Caught a real bug of mine — `body` was a fixed 15px. See §3 for the follow-up. |

---

## 3. What had to be corrected, and why

These were the "lame solutions" — places where the simulator quietly stopped
being a simulator.

**The software lab gave the answer away.** A glowing dot marked the dock app
that fixes the current fault — before the student had asked a single question —
and a floating panel printed the fix and the fault's explanation on arrival.
*My own earlier version had the second problem too.* The dot is gone, and the
procedure panel now appears only once the student has run an instrument that
actually shows the fault (`TechOpsIntake.diagnosed`).

**The new apps were one click on a labelled answer.** The rogue site was red and
tagged "(Spamming popups)"; the wrong keyboard layout said "Active (Swapped) ⚠";
each fix was a single button next to its own label. Rebuilt so each app shows
what a real settings pane shows and nothing more, with a test you run:

- *Keyboard* — an on-screen Hungarian keyboard. Type the customer's password
  and watch `Zebra0` come out as ``Yebra` `` under the wrong layout.
- *Sound* — a test tone that stays silent until the output **and** the mute are
  both right.
- *Brightness* — a slider you drag, with a screen that lights as you go.
- *Notifications* — six sites, none labelled; removing one they wanted is
  explained, and does not count.
- *Captive portal* — an address bar. HTTPS shows the certificate warning with
  the café's gateway as issuer; plain HTTP reaches the login page.

**The procedure buttons skipped the teaching.** For the two browser jobs they
just opened the app and returned, so the steps about *which* site to remove and
*why* the certificate warning was right could never be completed. Restored.

**The multimeter taught wrong electronics.** It reported a dead short on the
12 V rail for failed capacitors — a fault whose symptom is a PC that runs fine
until a game loads. A short would stop it powering on at all. It also offered
ATX rails on an iPhone, cost no time, and did not count as evidence. Rebuilt:

- Test points follow the machine: ATX rails on a tower, DC-in and system rail on
  a laptop, the battery rail on a phone.
- Readings come from the fault data (`readings.meter`), not hardcoded `if`s.
- Failed capacitors read a steady 12 V, **and the note explains why that is the
  lesson**: a multimeter averages, so it cannot see ripple.
- It costs bench time the first time and counts as evidence for the four faults
  it genuinely shows.

**The brightness fault would have taught the wrong thing.** A torch against the
glass is the standard test for a **dead backlight** — usually a hardware fault.
The explanation now teaches the order: rule out the free cause before opening
the machine, and never quote for a panel that has just proved it works.

**Text size was double-scaled.** A 13px note became 34px at "Largest", while
customer names did not change at all. Every one of the 307 pixel font sizes is
now `calc(Npx × scale)`, so everything grows by exactly the chosen factor.

**Two smaller crashes** from the half-applied patch: the software lab threw on
every software fault, and using the multimeter crashed the evidence rail. Both
fixed; the rail now skips anything it does not recognise.

---

## 4. `NEW_PROBLEMS_AND_SOLUTIONS.md`

| Proposed | Status | Notes |
|---|---|---|
| Swollen "spicy pillow" battery, safety-first removal | 🟡 | `battery_swollen` exists with a pull gesture and a metal-tool penalty. The IPA-softening step and the disposal bucket are not modelled. |
| PS5 liquid-metal dry-out | ✅ | `ps5_liquid_metal`. Swab the old metal out (a scrape gesture that punishes pushing beads toward the barrier), brush a new film on (a trace). Liquid metal is correct here and is not penalised as unsafe; paste resolves it but costs fit and can come back. The laptop-written `thermal_paste_dead` no longer lands on the PS5. |
| Shorted decoupling cap on a power rail | ✅ | `ps5_rail_short` on the PS5's 12 V rail, and `laptop_rail_short` on the ThinkPad's 20 V DC-in rail. Only the multimeter reveals it: looking shows nothing, and a power reset changes nothing. Fixed by lifting the part with hot tweezers; an unmarked capacitor of unknown voltage rating costs fit and can fail again. Verified across both machines. |
| Notification abuse, captive portal | ✅ | `browser_push_spam`, `captive_portal_loop`. |
| Deceptive browser extensions | ✅ | `browser_rogue_extension`. Searching in the Browser bounces through searchzone.top; *Settings › Search engine* says which add-on controls it. The Extensions page is the same four add-ons on every machine with one neutral icon — the culprit is only visible in its details (added last Tuesday, by another program, allowed to change search settings). Removing a wanted add-on is explained and counts against workmanship. Searching again confirms the fix. |
| Corroded USB-C configuration pin | ✅ | `usbc_cc_short`, on machines that really charge over USB-C. On a phone or iPad, turn the plug over: one way reads *Slow charger connected*, the other charges. The fix is its own action — scrub the contacts with IPA — so "lint or corrosion?" is a real decision; a pick in a port with no lint comes out empty. |

---

## 5. `EXPANSIONS_AND_SYSTEMS.md`

| Proposed | Status | Notes |
|---|---|---|
| Multimeter and rail prober | ✅ | Continuity and DC volts on desktop, console, and laptop rails. |
| Multi-turn interviews | ✅ | Answers open follow-ups, which can chain. Bench findings open things to put to the customer, with curious vs blunt choices affecting `t.tension`, now reflected directly in customer reviews and debriefings. Nine faults have them. |
| Multi-job juggling | ⬜ | |
| Swipe mode for phones | ⬜ | |
| HU / EN localisation | 🟡 | `js/i18n.js` is scaffolding only: loaded, but no view uses it and there is no switch. Deliberately parked — lessons are taught in English. Comes after multi-job juggling. |
| 45-minute lesson plan | ✅ | `docs/TEACHER_GUIDE.md`, checked against the game line by line (the first version promised customers, vendors and pages that did not exist). |

---

## 6. `STORY_AND_MEETINGS.md`

| Proposed | Status | Notes |
|---|---|---|
| Recurring characters & persistent memory | 🟡 | `customerMemory` records what actually happened at each handover (overcharged, sold an unneeded part, late, accused over the spill, came back under warranty). Returning customers say so, carry a *Returning* tag on the counter, and it changes things: a happy regular comes back more often with a bigger budget, a sore one with less patience. The named story characters (Béla bácsi, János, Kovács úr) are not built yet. |
| Dialogue tree: the pink liquid indicator | ✅ | Unless they confessed at the counter, the customer now denies any spill. Visual inspection unlocks the confrontation. Blunt gets "it must be the humidity" and nothing useful; curious gets "my son, a glass of cola" — and sugar is why it cannot wait. Adapted to our fault (board corrosion, not a trackpad flex). |
| Dialogue tree: the counterfeit charger | ✅ | On `dead_no_power` and `laptop_rail_short`: unbranded charger lead, click, faint pop, and smell. |
| Seasonal interludes | ⬜ | |

---

## 7. Found while playing (not in any doc)

| Problem | Status | Notes |
|---|---|---|
| Character Builder blank at start / menu save issues | ✅ | Fixed manifest sync fallback in `pixel-portrait.js`, robust `ensure()` fallback in `ui-charbuild.js`, re-matched skin tones on thumbnails so noses/makeup don't vanish, added `.title-you-new` to title screen so fresh players can create technician/shop directly from menu, fixed existing `custom-*` key updating rather than spamming duplicate random keys, and prevented Dossier click interception on `#t-you`. |
| Waiting for the next customer usually brought nobody new | ✅ | The old queue was kept and topped up. Waiting now sends them away first. |
| Only one customer to choose from | ✅ | Three wait from reputation 25 upward. A bad name now costs quiet days after every job instead. The careful shop still out-earns the careless one over 40 and 90 days. |
| Phone and tablet lab showed card recovery and a resale wipe whatever the fault | ✅ | Replaced by the device itself: Battery & charging (drag the cable in, hold the button to restart), a touch test you paint with a finger, and Storage. The same three pages for every fault, so opening them gives nothing away. Card recovery appears only once its fault is diagnosed. |
| No way to see a repair work | ✅ | Every action re-arms the instruments, and re-running the one that found the fault confirms the fix. On a handset, plugging the charger back in does it. The handover says whether anyone checked. |
| iPad with a full disk could not be fixed | ✅ | The fix lived in the Mac storage app. The iPad's Storage page now does it: you choose what goes, and their only copy of the photos is refused on the spot. |
| Capacitors could not be bought | ✅ | No market tab, so the tower's capacitor job was unwinnable. A "Board parts" tab now exists, and coverage fails if a fix needs something the market does not sell. |
| Does the iPad have screws? | ✅ | No — the glass is glued to the frame. That is correct, and the bench says so. |
| Visible build version number missing | ✅ | Stamped in fixed footer (`#build-tag`), title screen, and in-game dossier. Auto-updated via `rebuild.sh`. |
| First-time onboarding | ✅ | The training ticket was rebuilt: it promised four steps and showed one, threw away the job on the bench and the whole queue, and counted towards the hand-in code. Now it runs on a copy of the shop, a coach card sets the goal of each of eleven stations and moves on when the student has actually done it (never naming the answer), and the real shift comes back byte-for-byte. |
| Teacher guide | ✅ | Rewritten. The first version described a customer order, vendors, goal names and a `dossier.html` that did not exist. |
| Hungarian / English scaffolding | 🟡 | See §5. |

## 8. Review round (21 September)

A review of the build as Antigravity left it, then fixes. Everything below was
found by reading the code and playing it, not from a harness.

| Problem | Status | Notes |
|---|---|---|
| The class decoder could not be opened | ✅ | Its only button lost its markup in a tab restructure. Reachable again from the title screen, the report window (including the empty one a teacher sees on a fresh computer) and Save & load. |
| Shift codes promised content they did not deliver | ✅ | "Phones and tablets", "low budgets", "faults that need no parts" were plain seeds. Each code now has a profile that does what its note says, and coverage deals 60 walk-ins per code to check it. |
| Evidence summary said "nothing obviously wrong" above damage | ✅ | Abnormal was guessed from keywords. Readings now carry `abnormal` / `decisive` flags from the fault data. |
| Diagnosis opened on readings that showed nothing | ✅ | Every instrument in `REVEALED_BY` must now be flagged abnormal or decisive (coverage 4f). Faults whose evidence lives in an app got the app as the instrument: **Browser check**, **Settings check**, **Network chain**. Safari was added to the handset screen for the iPad's browser faults. |
| Customers opened with lines that did not say what was wrong | ✅ | 31 complaints written as second halves of another line. Rewritten; coverage 4g catches the pattern. |
| Returning customers said the wrong thing | ✅ | See §6. |
| Old tick-the-answer procedures beside the real apps | ✅ | The notification and captive-portal quiz panels are gone; the Browser does the job, the evidence and the verification. |
| Dead code | ✅ | 69 CSS selectors for the old hand-drawn board parts, badge row and queue list; the bench's drifting copy of `REVEALED_BY`; two unused mini-games; `severity`, `openTool`, `needsProof`, `ripplemV`. Battery wear is now judged against each pack's own design cycles instead of a flat 900. |
| Handset gestures had no keyboard route | ✅ | Plug (Enter), restart (hold Space/Enter for the same time), touch test (walk every square with the arrow keys). |

| Chip ID data was mis-parsed and the board was fake | ✅ | The old data had part number and maker swapped and the Steam Deck's processor missing, and chips were placed randomly on a drawn board. Rebuilt by `tools/build-chipid.py` from the saved iFixit pages: 13 real board photos, 149 chips located from iFixit's own coloured boxes. The bench names a job and you find the chip on the clean photo, with a loupe; every click says what that chip really is. Keyboard route: crosshair and Enter. |
| MacBook Neo | ✅ | 14th machine. Its bench board is drawn from the chip-ID photo (chips exact, connectors from the teardown photos). Eight P5 screws; the USB-C ports are a module (four T5 screws, press connector) — a worn port is a ~10 000 Ft module (iFixit: the same modular design as recent MacBooks); the battery is screwed down (T5, a trace along the row of screws) instead of glued. Twelve faults apply. Facts from iFixit's repair guides and teardown article. |
| Fitting a part by clicking its chip failed when the chip was two regions | ✅ | A battery connector is also the battery bay. With a part in hand, the click now goes to the bay. (Affected the MacBook Air too.) |

## 9. What to do next, in order

1. **Redraw the Steam Deck, Switch 2, PS5 and iMac boards from their photos** — the chips are ready; the battery/fan/SSD connector positions need the repair-guide photos, which were not saved (the pages lazy-load). Needs a download of those images first.
2. Saved for later, in this order: scenario codes with fixed job lists, the phone parcel-scam triage, find-the-short with a thermal camera, backups as a habit, the meter's V/Ω dial and probing a closed machine at its port, multi-job juggling, the 390 px phone layout, then Hungarian.

*Verification for this round: `tools/coverage.js` (14 machines, 38 faults, new
checks 4b'', 4e, 4f, 4g), `tools/scoring.js` (31 scenarios), `tools/playthrough.js`,
a click sweep of all 194 machine × fault pairs including every board region and every Chip ID board (13,855 clicks, no errors), and each
fixed job played by hand in the browser.*
