# TechOps Budapest — Architecture & Codebase Structure Reference
**Author:** Pair Programming Agent  
**Date:** September 2026  
**Target:** Educational Simulation Software Architecture  

---

## 1. Architectural Philosophy

TechOps Budapest is deliberately engineered with **zero external runtime dependencies**, **zero build step**, and **complete offline resilience**.

```
                           +------------------------+
                           |       index.html       |
                           +-----------+------------+
                                       |
    +-------------------+--------------+--------------+--------------------+
    |                   |                             |                    |
+---+----+      +-------+--------+            +-------+--------+    +------+-----+
| Shared |      | Data Catalogs  |            |  Sim Engines   |    | UI Views   |
| Engine |      | (Machines,     |            | (State, Ticket,|    | (Counter,  |
| (Audio,|      |  Faults, Parts,|            |  Score, Inter, |    |  Intake,   |
|  Codes)|      |  Boards, Screws)            |  Save)         |    |  Bench,Lab)|
+--------+      +----------------+            +----------------+    +------------+
```

### Core Tenets:
1. **USB Stick Ready (`file://` safe):** Uses compiled JavaScript data shims (`chipid-data.js`, `pixel-manifest.js`) instead of asynchronous `fetch()` calls on `.json` files, preventing CORS origin violations when run directly from local storage.
2. **Deterministic Reproducibility:** A 32-bit xorshift seeded PRNG ensures that identical shift codes produce identical tickets, customer personalities, and hardware faults across every desk in a classroom.
3. **Event-Driven Single State Store:** All mutable simulation data resides in `TechOpsState.state`. Views re-render idempotently in response to state change events.

---

## 2. File Directory & Subsystem Organization

### 2.1 Shared Foundation (`shared/`)
* [`shared/js/sek-audio.js`](file:///Users/marktremmel/computer-repair-shop/shared/js/sek-audio.js): Pure Web Audio API synthesis engine. Synthesizes mechanical clicks, screwdriver ratchets, fan hums, air blasts, multimeter continuity tones, and feedback chimes without audio sample files.
* [`shared/js/sek-code.js`](file:///Users/marktremmel/computer-repair-shop/shared/js/sek-code.js): Custom Base36-packed, tamper-resistant shift code encoder/decoder (`SEK7K-...`). Handles teacher roster generation, class CSV exports, and cross-computer state transfers.

### 2.2 Content Catalogs (`js/data-*.js`, `js/screw-heads.js`)
* [`js/data-machines.js`](file:///Users/marktremmel/computer-repair-shop/js/data-machines.js): Definitions of 14 physical computers (laptops, desktops, consoles, handhelds, phones). Specifies bus ceilings (SATA, NVMe Gen3/Gen4), memory slots vs soldered RAM, teardown sequences, and display attributes.
* [`js/data-parts.js`](file:///Users/marktremmel/computer-repair-shop/js/data-parts.js): 68 replacement components across 4 authentic vendors (`sz_direct`, `hardverapro`, `ipon`, `oem_service`). Encapsulates trade-offs between delivery days, durability risk, price, and OEM compatibility.
* [`js/data-faults.js`](file:///Users/marktremmel/computer-repair-shop/js/data-faults.js): 38 real-world faults with symptom complaints, diagnostic instrument outputs, fix requirements (`part` vs `action`), and educational explanations.
* [`js/data-customers.js`](file:///Users/marktremmel/computer-repair-shop/js/data-customers.js): Customer personas and archetypes (Student, Pensioner, Gamer, Creative, Office, Reseller/Techie) with distinct price sensitivities and turnaround expectations.
* [`js/data-interview.js`](file:///Users/marktremmel/computer-repair-shop/js/data-interview.js): Matrix of interview questions and weighted answers (`hot`, `warm`, `cold`, `red`) guiding diagnostic triage.
* [`js/data-boards.js`](file:///Users/marktremmel/computer-repair-shop/js/data-boards.js): Physical motherboard topologies and chip coordinates (ATX, console, logic boards, tablet/phone).
* [`js/screw-heads.js`](file:///Users/marktremmel/computer-repair-shop/js/screw-heads.js): SVG path definitions for 18 screwdriver tip geometries (Phillips, Torx, Pentalobe, Tri-point, Hex, Standoff).

### 2.3 Simulation Core (`js/sim-*.js`)
* [`js/sim-state.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-state.js): Central store (`TechOpsShop`), xorshift PRNG, transaction ledger, reputation tracker, event emitter (`change`, `badge`, `reset`).
* [`js/sim-ticket.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-ticket.js): Work ticket lifecycle (`TechOpsJobs`), teardown dependency resolution, physical capability unlocking (`flags(ticket)`), tool verification, and customer footfall generation.
* [`js/sim-score.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js): 5-axis pedagogical grading engine (`TechOpsScore`). Applies worst-axis caps, gouging penalties, upsell punishments, and comeback risk calculations.
* [`js/sim-interlude.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-interlude.js): Simulates counter micro-jobs and ambient passing trade while waiting for ordered parts to ship.
* [`js/sim-save.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-save.js): Serializes shift progress into compact portable save strings distinct from grading codes.

### 2.4 Hardware & Graphics Engines (`js/board.js`, `js/precision.js`, `js/pixel-*.js`)
* [`js/board.js`](file:///Users/marktremmel/computer-repair-shop/js/board.js): Renders dynamic, interactive motherboard SVGs with fan-out copper traces, socket rails, chip pins, and status badges.
* [`js/precision.js`](file:///Users/marktremmel/computer-repair-shop/js/precision.js): Physics-based gesture mini-game engine. Evaluates speed, lateral drift, and torque for delicate procedures (lifting ribbon cables, peeling battery adhesive, tracing chassis glue, scraping USB lint). Includes full keyboard accessibility fallback.
* [`js/pixel-portrait.js`](file:///Users/marktremmel/computer-repair-shop/js/pixel-portrait.js): Dynamic canvas compositor layering pixel-art hair, eyes, skin, and clothing sprites into unique customer portraits.

### 2.5 User Interface Views (`js/ui-*.js`, `js/app.js`)
* [`js/ui-counter.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-counter.js): Job intake counter and triage ticket selection.
* [`js/ui-intake.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-intake.js): The Sit-Down interview screen and diagnostic theory logger.
* [`js/ui-bench.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-bench.js): Workbench hardware disassembly, screwdriver selection, and parts installation.
* [`js/ui-macos.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-macos.js): Software lab environment simulating macOS Recovery, Disk Utility, Activity Monitor, Terminal, and Network diagnostics.
* [`js/ui-market.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-market.js): Parts vendor catalogue, order placement, and delivery simulation.
* [`js/ui-handover.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-handover.js): Final billing, invoice submission, customer review debrief, and star rating.
* [`js/ui-report.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-report.js): Shift review screen, teacher decoder roster, class axis weakness diagnosis, and printable summary.

---

## 3. Data Flow & Game Lifecycle

```
[ Counter View ] 
       | (Customer arrives, ticket accepted)
       v
[ The Sit-Down ] 
       | (Questions asked: 0.1h bench time each; theory formed)
       v
[ Hardware Bench / Software Lab ] <=======> [ Parts Market ]
       | (Screws undone, tests run,             | (Parts purchased,
       |  delicate gestures performed,          |  delivery waited)
       |  firmware/OS restored)                 |
       +--------------------+-------------------+
                            |
                            v
                    [ Handover View ]
                            | (Price set, 5-axis grading calculated)
                            v
                   [ Reviews & Reputation ]
                            | (Footfall recalculated for next day)
                            v
                    (Back to Counter)
```

### 3.1 Teardown State Resolution
Disassembly is strictly sequential:
1. `ticket.openSteps` tracks completed operations.
2. `TechOpsJobs.flags(ticket)` computes capabilities:
   - Screws must be removed before chassis panels lift.
   - `battery_off` must be established before sensitive board components can be disconnected without causing short-circuit penalties.
   - Adhesive must be heated or sliced before glass panels open.

### 3.2 Pedagogical Scoring Constraints
The grading formula in [`sim-score.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js) enforces strict educational lessons:
* **Worst-Axis Cap:** Overall grade is capped by the lowest scoring axis. If `durability` scores 20 (e.g., used counterfeit battery), the total score cannot exceed 45 (2 stars), regardless of a perfect 100 on budget and turnaround.
* **Gouging Penalty:** Charging a customer significantly above `fairFt` (parts cost + actual labour hours) heavily penalizes the budget score, even if the total bill remains under their maximum budget.
* **Zero-Part Protection:** Installing hardware for faults marked `noPartNeeded` (e.g. clearing browser push notifications or cleaning charging lint) triggers severe budget penalties and customer dissatisfaction.
