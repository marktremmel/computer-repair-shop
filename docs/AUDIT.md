# TechOps Budapest — Comprehensive Codebase Audit
**Author:** Pair Programming Agent (Analysis & Quality Review)  
**Date:** September 2026  
**Target:** Vanilla JS / HTML5 Educational Repair Shop Simulator  

---

## 1. Executive Summary

This audit evaluates the codebase of **TechOps Budapest** across four key dimensions requested:
1. **Concrete Bugs & Logic Flaws** (functional errors, state corruption, UI desynchronisation)
2. **Duplicated Code** (repeated boilerplate, shared logic across UI views)
3. **Dead, Unused & Uncalled Code** (orphaned methods, unused schema fields, unstyled CSS classes)
4. **Outdated Code & Documentation Divergence** (stale instructions in `ROADMAP.md`, vendor nomenclature drift, axis terminology mismatch)

The simulator is remarkably stable and cleanly written with no build-step dependencies. However, several subtle edge-case bugs and architectural redundancies exist that will affect shift determinism, score grading, and long-term maintainability.

---

## 2. Identified Bugs & Edge-Case Flaws

### 2.1 [CRITICAL] PRNG Generator Desynchronisation on Save Restoration
* **Location:** [`js/sim-save.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-save.js#L55-L95) vs [`js/sim-state.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-state.js#L82-L95)
* **The Bug:**
  When a player or teacher restores a shift from a carry-over code (`TechOpsSave.load(codeStr)`):
  ```javascript
  // js/sim-save.js line 75-76
  if (d.sd !== undefined) S.seed = d.sd;
  if (d.rc !== undefined) S.rngCalls = d.rc;
  ```
  The state values `S.seed` and `S.rngCalls` are updated, and `Shop.save()` persists them to `localStorage`. However, **`Shop._rng` is never re-seeded or fast-forwarded in memory**. The active PRNG closure (`this._rng`) continues producing random numbers from whatever shift seed was active *before* the code was pasted.
* **Impact:**
  Two students who enter the same save code onto different lab computers will receive different customers, budgets, and fault draws until they manually refresh their browsers to trigger `Shop.init()`.
* **Suggested Solution (in markdown/doc):**
  Add a reseed helper in [`sim-state.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-state.js):
  ```javascript
  reseed: function (seed, calls) {
    this.state.seed = seed;
    this.state.rngCalls = calls || 0;
    this._rng = makeRng(this.state.seed);
    for (var i = 0; i < this.state.rngCalls; i++) this._rng();
  }
  ```
  Call `Shop.reseed(d.sd, d.rc)` in `TechOpsSave.load()`.

---

### 2.2 [HIGH] State Mutation & Premature Badge Award Inside Pure Grading Function
* **Location:** [`js/sim-score.js:76-79`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js#L76-L79) vs [`js/ui-handover.js:33-43`](file:///Users/marktremmel/computer-repair-shop/js/ui-handover.js#L33-L43)
* **The Bug:**
  In [`sim-score.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js), the `grade(shop, ticket, priceFt)` function directly mutates game state and awards badges:
  ```javascript
  // js/sim-score.js line 76-79
  if (fault.noPartNeeded && resolved && !ticket.installed.length) {
    findings.push({ axis: 'budget', good: true, text: 'You found a fault that needed no parts...' });
    shop.state.honestRefusals++;
    shop.award('honest_tech');
  }
  ```
  In [`ui-handover.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-handover.js), `grade()` is called when the user clicks "Hand it back":
  ```javascript
  var res = window.TechOpsScore.grade(Shop, t, p);
  if (!window.TechOpsScore.willPay(t, p, res.overall)) {
    // Customer refuses the bill!
    return; // Player prompted to re-price
  }
  ```
* **Impact:**
  If a student fixes a zero-part fault (such as clearing lint or wiping duplicates) and enters an unreasonable price (e.g., 50,000 Ft):
  1. `shop.state.honestRefusals` increments immediately.
  2. The `'honest_tech'` badge event triggers immediately via `Shop.award()`.
  3. The customer subsequently refuses to pay (`willPay() === false`).
  4. If the student tries three different unreasonable prices before repricing fairly, `honestRefusals` increments three times for a single unfinished repair.
* **Suggested Solution:**
  Keep `grade()` strictly pure (returning analysis and proposed badges). State mutation should occur exclusively in `ui-handover.js` inside `handBack()` *after* `willPay()` validates the invoice.

---

### 2.3 [MEDIUM] Window Click Does Not Focus / Raise Z-Index in Software Lab
* **Location:** [`js/ui-macos.js:723-728`](file:///Users/marktremmel/computer-repair-shop/js/ui-macos.js#L723-L728) & [`js/ui-macos.js:880-905`](file:///Users/marktremmel/computer-repair-shop/js/ui-macos.js#L880-L905)
* **The Bug:**
  In the macOS software lab, open windows are rendered with `class="mac-win" data-win="<id>"`. While dragging the title bar (`data-drag`) updates `z-index`, clicking inside an open window body or window frame does **not** raise the window to the front.
* **Impact:**
  If the Disk Utility window overlaps the Terminal window, clicking on the Terminal body will not bring it in front of Disk Utility. The user is forced to either drag the title bar or click the app icon in the dock to focus it.
* **Suggested Solution:**
  Add a delegation listener in `bind(host)`:
  ```javascript
  host.querySelectorAll('.mac-win').forEach(function (win) {
    win.addEventListener('mousedown', function () {
      var id = win.getAttribute('data-win');
      if (open[id]) { open[id].z = ++z; win.style.zIndex = z; }
    });
  });
  ```

---

### 2.4 [MEDIUM] Silent Comeback for Uncleaned Fins on Repaste Jobs
* **Location:** [`js/sim-score.js:441-443`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js#L441-L443)
* **The Bug:**
  For `thermal_paste_dead`, repasting the die resolves the ticket (`resolved = true`). If the player does not execute the `clean_fins` action, line 441 queues a comeback:
  ```javascript
  if (fault.id === 'thermal_paste_dead' && ticket.actionsDone.indexOf('clean_fins') === -1) {
    comeback = comeback || { cat: 'thermal', inDays: 6, reason: 'You repasted but never cleared the blocked fin stack.' };
  }
  ```
  However, **no negative finding is added to `findings`**, and no penalty is applied to the safety/workmanship or durability axis during handover!
* **Impact:**
  The student is awarded 5 stars at handover, receives glowing initial feedback, but 6 days later suffers an unexpected comeback with no prior educational indicator during review.
* **Suggested Solution:**
  Add a finding during grading:
  ```javascript
  findings.push({ axis: 'durability', good: false, text: 'You replaced the dried paste but left the fin stack choked with dust. It will overheat again within a week.' });
  durabilityScore -= 25;
  ```

---

### 2.5 [LOW] Semantic Mixing of Teardown Step vs Bench Action (`reconnect_power`)
* **Location:** [`js/ui-bench.js:614-615`](file:///Users/marktremmel/computer-repair-shop/js/ui-bench.js#L614-L615) vs [`js/sim-ticket.js:80-85`](file:///Users/marktremmel/computer-repair-shop/js/sim-ticket.js#L80-L85)
* **The Bug:**
  `reconnect_power` is defined in `TechOpsJobs.ACTIONS`, but when executed in [`ui-bench.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-bench.js), the code pushes it into `ticket.openSteps` and strips it from `ticket.actionsDone`:
  ```javascript
  t.openSteps.push('reconnect_power');
  t.actionsDone = t.actionsDone.filter(function (x) { return x !== 'reconnect_power'; });
  ```
* **Impact:**
  `openSteps` is intended strictly for physical disassembly phases defined in `STEPS`. Pushing an action ID into `openSteps` creates cross-domain pollution. While `flags(ticket)` explicitly handles this quirk, it violates the schema design documented in `ROADMAP.md`.

---

## 3. Duplicated Code & Repetitive Patterns

### 3.1 Namespace Initialization Boilerplate
Across 14 UI files (`ui-bench.js`, `ui-counter.js`, `ui-dossier.js`, `ui-handover.js`, `ui-intake.js`, `ui-macos.js`, `ui-market.js`, `ui-report.js`, `ui-shopfit.js`, `ui-title.js`, `ui-tour.js`, etc.), the following 5 lines are duplicated verbatim:
```javascript
'use strict';
var Shop = window.TechOpsShop;
var UI   = window.TechOpsUI;
var J    = window.TechOpsJobs;
var fmt  = window.techOpsFmt;
var esc  = function (s) { return UI.esc(s); };
```
*Recommendation:* In a future refactor, define these conveniences on `UI` or pass a shared context object to module initializers.

### 3.2 Modal Creation & Accessibility Panel Binding
[`app.js`](file:///Users/marktremmel/computer-repair-shop/js/app.js) and [`ui-title.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-title.js) both contain near-identical modal rendering blocks for accessibility settings:
```javascript
// Duplicated in app.js and ui-title.js:
UI.modal('<div class="modal-head"><h3>Access settings</h3>...</div><div class="modal-body"></div><div class="modal-foot"><button class="btn btn-primary" data-close>Done</button></div>');
var repaint = function () {
  m.el.querySelector('.modal-body').innerHTML = window.TechOpsA11y.panel();
  window.TechOpsA11y.bind(m.el, repaint);
  window.TechOpsIcons.scan(m.el);
};
repaint();
```
*Recommendation:* Encapsulate `TechOpsA11y.openModal(UI)` directly within [`a11y.js`](file:///Users/marktremmel/computer-repair-shop/js/a11y.js).

### 3.3 Custom Face Storage Callback
[`ui-character.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-character.js) and [`ui-dossier.js`](file:///Users/marktremmel/computer-repair-shop/js/ui-dossier.js) duplicate the character builder save callback:
```javascript
window.TechOpsCharBuild.open(existing, function (built) {
  var key = 'custom-' + Math.random().toString(36).slice(2, 8);
  window.TechOpsPixel.remember(key, built);
  Shop.state.customFaces = Shop.state.customFaces || {};
  Shop.state.customFaces[key] = built;
  Shop.save();
  ...
});
```
*Recommendation:* Create a single helper `TechOpsPixel.saveCustomFace(built)` that handles key generation, memory storage, and state persistence.

---

## 4. Dead, Unused & Orphaned Code

### 4.1 Uncalled Functions / Methods
* `window.TechOpsBoards.layoutName(m)` in [`data-boards.js:227`](file:///Users/marktremmel/computer-repair-shop/js/data-boards.js#L227):
  Only referenced by the static test harness [`tools/coverage.js`](file:///Users/marktremmel/computer-repair-shop/tools/coverage.js). The production game engine always calls `TechOpsBoards.forMachine(m)`.

### 4.2 Dead Attributes in Data Catalogs
* **`data-machines.js`:**
  * `storageForm` (e.g. `'2.5in'`, `'m2_2280'`, `'soldered'`): Present on all 13 machines (13 definitions), but never read by [`data-parts.js`](file:///Users/marktremmel/computer-repair-shop/js/data-parts.js) compatibility checks (compatibility uses `storageBuses` instead).
  * `openTool` (present on `ipad_air` and `switch2`): Never checked or validated.
  * `tagline`, `priceNewFt`, `ports`: Zero usages across the entire project.
  * `thermal.tdpW`: Declared for all machines, but thermal scoring uses hardcoded temperature delta thresholds rather than machine TDP.
* **`data-faults.js`:**
  * `severity` (e.g., `'low'`, `'medium'`, `'high'`, `'critical'`): Defined on all 29 faults (29 occurrences), but never read by [`sim-ticket.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-ticket.js), [`sim-score.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js), or any UI template.
  * `requiresHdd`: Defined on 2 faults (`dying_hdd`, `hdd_bad_sectors`), never checked by ticket generator or parts market.
  * `needsProof`: Defined on 1 fault, never referenced.
* **`data-customers.js`:**
  * `useCases`: Array defined once at the top of the file, never referenced elsewhere.

### 4.3 Dead Attributes in the DOM
* `data-type` on screwdriver bits in [`ui-bench.js:1067`](file:///Users/marktremmel/computer-repair-shop/js/ui-bench.js#L1067): Output into HTML, but event listeners only read `data-tool`.
* `data-win` on window containers in [`ui-macos.js:723`](file:///Users/marktremmel/computer-repair-shop/js/ui-macos.js#L723): Output into HTML, but never selected or queried.

### 4.4 Unstyled CSS Classes
The following classes are output in HTML templates but have no matching rules in [`shop.css`](file:///Users/marktremmel/computer-repair-shop/css/shop.css) or [`bench.css`](file:///Users/marktremmel/computer-repair-shop/css/bench.css):
* `.shelf-col` (used in [`ui-bench.js:1230`](file:///Users/marktremmel/computer-repair-shop/js/ui-bench.js#L1230))
* `.btn-inspect` (used in [`ui-report.js:239`](file:///Users/marktremmel/computer-repair-shop/js/ui-report.js#L239))
* `.mg-scan` (wrapper element in [`ui-minigames.js:91`](file:///Users/marktremmel/computer-repair-shop/js/ui-minigames.js#L91), though child `.mg-scan-bar` is styled)
* `.ident` (container in [`shop-identity.js:74`](file:///Users/marktremmel/computer-repair-shop/js/shop-identity.js#L74))
* `.a11y`, `.them`, `.mono` (legacy semantic tags)

---

## 5. Outdated Code & Documentation Divergences

### 5.1 `ROADMAP.md` §5 References Removed `board.js KIND_FOR`
* **Issue:** `ROADMAP.md` states:
  > *"A new machine needs an entry in `data-machines.js`, a board layout in `data-boards.js` (or an honest reuse of an existing one), a chassis kind mapped in `board.js KIND_FOR`..."*
* **Reality:** `KIND_FOR` was completely removed when the schematic chassis renderer was replaced with real SVG logic board layouts. `TechOpsBoards.forMachine(m)` now looks up layouts directly.

### 5.2 Vendor Nomenclature Drift
* **Issue:** `README.md` and `REVIEW.md` describe vendors with placeholder names: `quickpart`, `oemdirect`, `usedrigs`, `aliexpress`.
* **Reality:** The production simulator in [`data-parts.js`](file:///Users/marktremmel/computer-repair-shop/js/data-parts.js) uses authentic Budapest/Hungarian tech ecosystem entities:
  * `sz_direct` (SZ-TechParts Direct, Shenzhen)
  * `hardverapro` (HardverApró, Budapest 2nd-hand community)
  * `ipon` (iPon Webshop, Hungarian retail distributor)
  * `oem_service` (Authorised Service Parts, genuine factory channels)

### 5.3 Five Axes vs Six Axes
* **Issue:** Comments in [`sim-score.js`](file:///Users/marktremmel/computer-repair-shop/js/sim-score.js) and sections of `ROADMAP.md` describe "grading on six axes".
* **Reality:** The roll-up weight dictionary sets `resolved: 0`:
  ```javascript
  var W = { resolved: 0, fit: 34, budget: 20, speed: 15, durability: 14, safety: 21 };
  ```
  `resolved` is a hard gating requirement (capping overall score at 22 if false), not an axis. The actual displayed and measured axes are five: **Fit, Budget, Turnaround (Speed), Durability, and Workmanship (Safety)**.

### 5.4 Generated Offline Shims (`.json` vs `.js`)
* **Issue:** `chipid-data.json` and `pixel-manifest.json` exist alongside their generated `.js` twins (`chipid-data.js` and `pixel-manifest.js`).
* **Caution:** Developers unaware of `rebuild.sh` might edit `chipid-data.js` directly, which will be overwritten on the next rebuild, or edit `chipid-data.json` and wonder why browser changes don't take effect.
