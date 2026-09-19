# TechOps Budapest · Project Lead Comprehensive Review & Expansion Blueprint

**Target Project**: `materials/techops/` (TechOps Budapest — Repair Shop Simulator)  
**Author**: Antigravity Project Lead  
**Scope**: Codebase & Simulation Audit, Bug Catalog & Fixes, Expansion Developer Documentation (Boards, Repairs, Software, Conversations), and Next-Level Evolution Roadmap.

---

## Executive Summary & Educational Assessment

**TechOps Budapest** is a masterclass in modern digital pedagogy. Unlike traditional quiz-based educational software or bureaucratic worksheets, it implements a **tactile, consequential IT repair simulation** that teaches systems thinking, empirical measurement, consumer ethics, and digital literacy.

### What Makes It Exceptional
1. **Zero-Friction & Zero-GDPR Architecture**: No student accounts, no database, no tracking, and 100% client-side execution.
2. **Empirical Measurement over Guesswork**: Customer symptoms deliberately mislead (e.g., users claiming they need "more RAM" when a drive is clicking, or assuming a phone needs a new port when lint blocks the plug). Students learn that diagnosis requires instruments, not assumptions.
3. **Anti-Greed Scoring Engine**: Selling an unneeded SSD for a problem caused by duplicate files in `~/Downloads` or pocket lint is penalized as an ethical failure. Students are rewarded for honest diagnoses that charge only for bench time.
4. **Authentic Local Flavor**: Incorporates real Hungarian marketplace dynamics (HardverApró second-hand pick-ups, iPon retail warranties, SZ-Direct Shenzhen delays, Jófogás flippers, and genuine school IT hardware like 2012 unibody MacBooks and school-issue ThinkPads).
5. **Classroom Resiliency**: Employs deterministic shift seeds (e.g., `BUDAPEST`, `DUNA`, `PARLAMENT`) and cryptographic `SEK7K-` report strings, enabling teachers to assess an entire class offline without a server.

---

## Part 1: Detailed Bug & Inconsistency Audit

During comprehensive cross-module testing and code review, **8 key bugs and inconsistencies** were identified. Below is the technical breakdown, root cause analysis, and suggested code fixes.

---

### Bug 1: Missing Console & Handheld Layouts on the Workbench
- **Files**: [`board.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/board.js#L105-L113) & [`data-machines.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/data-machines.js)
- **Impact**: Critical Visual & Functional Glitch.
- **Root Cause**: In [`board.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/board.js#L105), `KIND_FOR` maps:
  ```javascript
  var KIND_FOR = {
    laptop: 'laptop_classic', desktop: 'desktop', phone: 'phone', tablet: 'tablet', aio: 'aio'
  };
  ```
  It has **no entry for `'console'`** (`ps5pro`) or **`'handheld'`** (`steamdeck`, `switch2`).  
  When a PS5 Pro or Steam Deck is opened on the workbench, `layoutFor(machine)` falls back to `LAYOUTS.laptop_classic`. Consequently:
  - A PS5 Pro renders on the bench with a **3-cell laptop battery pack** and **laptop display flex**.
  - PS5 Pro teardown steps (`psu_switch`, `cooler`, `cpu`) have no matching regions in `laptop_classic`, making clicking on regions fail.
- **Suggested Fix**:
  1. Add `console` and `handheld` mappings to `KIND_FOR`:
     ```javascript
     var KIND_FOR = {
       laptop: 'laptop_classic', desktop: 'desktop', phone: 'phone',
       tablet: 'tablet', aio: 'aio', console: 'console', handheld: 'handheld'
     };
     ```
  2. Add chassis layouts for `console` and `handheld` to `LAYOUTS` in [`board.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/board.js), or alias them appropriately to `desktop` and `phone`/`tablet` where relevant:
     ```javascript
     // Fallback mapping if dedicated chassis SVGs are not yet drawn:
     console: 'desktop',
     handheld: 'tablet'
     ```

---

### Bug 2: Missing `openStepId` Case for Consoles
- **File**: [`ui-bench.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-bench.js#L70-L75)
- **Impact**: Gameplay Flow / State Lock.
- **Root Cause**:
  ```javascript
  function openStepId(machine) {
    if (machine.kind === 'desktop') return 'side_panel';
    if (machine.kind === 'aio' || machine.kind === 'tablet') return 'lift_display';
    if (machine.kind === 'phone') return 'screen_lift';
    return 'bottom_case';
  }
  ```
  For `ps5pro` (`machine.kind === 'console'`), `openStepId` returns `'bottom_case'`. However, in [`data-machines.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/data-machines.js#L257), `ps5pro.teardown` uses `'side_panel'`.  
  Because `openStepId` does not match the actual teardown step, screw checks in [`ui-bench.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-bench.js#L380) and button activation in line 917 misfire.
- **Suggested Fix**:
  Update `openStepId`:
  ```javascript
  function openStepId(machine) {
    if (machine.kind === 'desktop' || machine.kind === 'console') return 'side_panel';
    if (machine.kind === 'aio' || machine.kind === 'tablet') return 'lift_display';
    if (machine.kind === 'phone') return 'screen_lift';
    return 'bottom_case';
  }
  ```

---

### Bug 3: Teardown Step "cpu" vs Region "die" Mismatch on Desktop
- **Files**: [`data-machines.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/data-machines.js#L102), [`board.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/board.js#L57), and [`ui-bench.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-bench.js#L138-L148)
- **Impact**: Inability to click/target CPU socket during Desktop teardown.
- **Root Cause**:
  `tower_pc.teardown` specifies `['psu_switch', 'side_panel', 'drive_bay', 'ram_bay', 'cooler', 'cpu']`.  
  In [`board.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/board.js#L57), the desktop socket region is declared with `id: 'die'`.  
  In [`ui-bench.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-bench.js#L138), `REGION_CHIP` contains `cooler: ['socket', 'apu']` and `heatsink: ['cpu', ...]`, but **omits `cpu` and `psu_switch`**.  
  Consequently, `chipForRegion(m, 'cpu')` returns `null`, leaving the CPU step unmapped.
- **Suggested Fix**:
  In [`ui-bench.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-bench.js#L138-L148), add `cpu` and `psu_switch` to `REGION_CHIP`:
  ```javascript
  var REGION_CHIP = {
    drive_bay:  ['drive', 'm2', 'm2h', 'm2c', 'nand1', 'nandt', 'ufs', 'nandp'],
    ram_bay:    ['ram_a', 'dimm', 'ram1', 'ramh1', 'g1'],
    fan:        ['fancut', 'fancut2', 'fanl', 'fanhdr', 'fanc'],
    cooler:     ['socket', 'apu'],
    cpu:        ['socket', 'cpu', 'apu', 'soc'],
    psu_switch: ['atx24', 'io', 'vrm'],
    heatsink:   ['cpu', 'soc', 'soch', 'socp', 'soct', 'apu', 'socket'],
    battery:    ['battl', 'battc', 'battch', 'battcs', 'battcp', 'battct'],
    battery_connector: ['battl', 'battc', 'battch', 'battcs', 'battcp', 'battct'],
    charge_port:['usbcp', 'usbch', 'usbcs', 'usbct', 'usbcl', 'usbc', 'usbc1'],
    display_flex:['displ', 'disp', 'dispp', 'dispd', 'dispt', 'bright']
  };
  ```

---

### Bug 4: Warranty Comeback Fallback Bug on Smartphones & Tablets
- **File**: [`ui-handover.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-handover.js#L82-L89)
- **Impact**: Spawns Impossible & Incoherent Tickets.
- **Root Cause**:
  ```javascript
  function comebackFault(cat, t) {
    var map = { storage: 'dying_hdd', ram: 'bad_ram_stick', battery: 'battery_swollen',
                screen: 'cracked_screen', fan: 'fan_seized', thermal: 'thermal_paste_dead', flex: 'port_lint' };
    var id = map[cat] || 'thermal_paste_dead';
    var m = J.machine(t);
    var f = window.TechOpsFaults.get(id);
    return (f && f.appliesTo.indexOf(m.id) !== -1) ? id : 'thermal_paste_dead';
  }
  ```
  If an `iphone12`, `iphone17`, or `ipad_air` customer has a comeback where the mapped fault doesn't apply (or for unmapped categories), it defaults to `'thermal_paste_dead'`.  
  However, `thermal_paste_dead.appliesTo` does NOT include iPhones or iPads (they do not use thermal paste). This leads to an impossible ticket on a phone where no thermal compound can be bought or applied.
- **Suggested Fix**:
  Select a valid fault from `forMachine`:
  ```javascript
  function comebackFault(cat, t) {
    var map = { storage: 'dying_hdd', ram: 'bad_ram_stick', battery: 'battery_swollen',
                screen: 'cracked_screen', fan: 'fan_seized', thermal: 'thermal_paste_dead', flex: 'port_lint' };
    var id = map[cat] || 'thermal_paste_dead';
    var m = J.machine(t);
    var f = window.TechOpsFaults.get(id);
    if (f && f.appliesTo.indexOf(m.id) !== -1) return id;
    var machineFaults = window.TechOpsFaults.forMachine(m);
    return machineFaults.length ? machineFaults[0].id : 'port_lint';
  }
  ```

---

### Bug 5: Unescaped Unicode Literal in `ui-shopfit.js`
- **File**: [`ui-shopfit.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-shopfit.js#L59)
- **Impact**: Visual typography bug in UI header.
- **Root Cause**:
  ```javascript
  + '<p>Everything you earn beyond the parts bill ends up here. None of it buys a better review \\u2014 '
  ```
  The double backslash causes JavaScript to treat it as string literal `\u2014`, displaying ugly raw text `\u2014` in the browser instead of the em-dash `—`.
- **Suggested Fix**:
  Replace `\\u2014` with `\u2014` or `&mdash;` or standard unicode character `—`.

---

### Bug 6: Local File Protocol (`file://`) CORS Block on JSON Data
- **Files**: [`ui-chipid.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-chipid.js#L26) & [`pixel-portrait.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/pixel-portrait.js#L36)
- **Impact**: Breaks 100% offline USB-drive usage in school labs.
- **Root Cause**:
  `ui-chipid.js` fetches `js/chipid-data.json` and `pixel-portrait.js` fetches `js/pixel-manifest.json` via standard `fetch()`. When a teacher or student runs the site locally via `file:///Users/.../index.html` without a local HTTP server, Chrome and Edge block `fetch()` with CORS policy errors (`origin 'null'`).
- **Suggested Fix**:
  Expose the JSON data also as global variables inside lightweight `.js` scripts (or embed them as fallback constants), e.g.:
  ```javascript
  // In chipid-data.js:
  window.TechOpsChipData = { ... };
  // In ui-chipid.js:
  function load() {
    if (window.TechOpsChipData) return Promise.resolve(window.TechOpsChipData);
    return fetch('js/chipid-data.json?...').then(...);
  }
  ```

---

### Bug 7: Showcase Navigation Disconnect
- **Files**: Root [`index.html`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/index.html#L293) and [`materials/field-guide.html`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/field-guide.html)
- **Impact**: TechOps Budapest is completely hidden from the portfolio showcase!
- **Root Cause**:
  Line 293 in root `index.html` still links to `materials/field-guide/index.html`.  
  `materials/field-guide.html` redirects to `field-guide/index.html`.  
  Neither links to `materials/techops/index.html`. Anyone landing on the main site will only ever see the old prototype!
- **Suggested Fix**:
  Update `index.html` card link:
  ```html
  <a class="card" href="materials/techops/index.html">
    <div class="card-head">
      <h3>TechOps Budapest · IT Szerviz Szimulátor</h3>
      <span class="chip live mono">ÚJ / 5–12. OSZTÁLY</span>
    </div>
  ...
  ```
  And update `materials/field-guide.html` to point to `techops/index.html`.

---

### Bug 8: Fault Distribution Imbalance Across Device Types
- **File**: [`data-faults.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/data-faults.js)
- **Impact**: Console, Desktop, and Smartphone tickets feel repetitive.
- **Root Cause**:
  - `ps5pro`: only **2 faults** (`thermal_paste_dead`, `fan_seized`).
  - `tower_pc`: only **5 faults**.
  - `iphone17`: only **4 faults**.
  - `iphone12`: only **5 faults**.
  Meanwhile, `mbp13_2012` has **20 faults** and `inspiron15` has **18 faults**.
- **Suggested Fix**: Expand `appliesTo` arrays for existing faults (e.g. `dead_no_power` for `tower_pc` and `ps5pro`; `cracked_screen` for `iphone17`; `water_damage` for `tower_pc`).

---

## Part 2: Developer Expansion Blueprints

To fulfill the project lead mandate ("craft documentation for expansions for more boards for more repairs for more software issues for more conversations"), this section provides strict schema definitions, integration points, and concrete code blueprints.

```
                  TECHOPS SYSTEM ARCHITECTURE
                  
       +---------------------------------------------+
       |             The Sit-Down (Intake)           |
       |  data-customers.js  <->  data-interview.js  |
       +----------------------+----------------------+
                              |
       +----------------------v----------------------+
       |            Diagnostics / Measurement        |
       |    ui-bench.js (HW)  <->  ui-macos.js (SW)  |
       |      data-faults.js  <->  precision.js      |
       +----------------------+----------------------+
                              |
       +----------------------v----------------------+
       |           Parts Market & Assembly           |
       |    data-parts.js     <->  data-machines.js  |
       |    data-boards.js    <->  board.js          |
       +----------------------+----------------------+
                              |
       +----------------------v----------------------+
       |           Handover & 6-Axis Grading         |
       |    sim-score.js      <->  ui-report.js      |
       +---------------------------------------------+
```

---

### Expansion Category A: Adding More Boards

Boards operate on two layers:
1. **Interactive PCB Chip Inspector** (`data-boards.js` & `TechOpsBoards`): 1000 × 700 coordinate system detailing discrete chips, traces, and iFixit-style teardown roles (`data-chiproles.js`).
2. **Workbench Surgical Chassis** (`board.js` & `TechOpsBoard`): Hull boundaries, modular bays, screws, and tools.

#### How to Add a New Board:
1. Define the layout in `data-boards.js`:
   ```javascript
   LAYOUTS.my_new_board = {
     w: 1000, h: 700, shape: 'rect', pcb: '#1a3325',
     note: 'Pedagogical note on why this board is laid out this way...',
     chips: [
       C('chip_id', x, y, width, height, 'role_key', 'Label', { opts })
     ]
   };
   ```
2. Map machine IDs in `FOR_MACHINE` in `data-boards.js`:
   ```javascript
   var FOR_MACHINE = {
     ...
     my_machine_id: 'my_new_board'
   };
   ```
3. Map region targets in `ui-bench.js` (`REGION_CHIP`).

#### Concrete Ready-to-Add Board Layouts:

#### 1. Dedicated Desktop Graphics Card (GPU Board: `pcie_gpu`)
- **Pedagogical Purpose**: Teaches high-power PCIe design, high-speed GDDR6 vRAM placement surrounding the GPU silicon, and dedicated VRM phases for 300W graphics cards.
- **Specification**:
  ```javascript
  pcie_gpu: {
    w: 1000, h: 520, shape: 'rect', pcb: '#111827',
    note: 'A graphics card is a complete computer on a card: its own processor, its own dedicated high-bandwidth GDDR6 memory ring, and high-amperage power stages along the back.',
    chips: [
      C('gpu_die',  380, 160, 200, 200, 'soc',    'GPU Silicon Core', { big: true }),
      C('vram1',    260, 140, 80, 55,  'memory', 'GDDR6 VRAM 1'),
      C('vram2',    360, 80,  80, 55,  'memory', 'GDDR6 VRAM 2'),
      C('vram3',    480, 80,  80, 55,  'memory', 'GDDR6 VRAM 3'),
      C('vram4',    600, 140, 80, 55,  'memory', 'GDDR6 VRAM 4'),
      C('vram5',    600, 260, 80, 55,  'memory', 'GDDR6 VRAM 5'),
      C('vram6',    480, 380, 80, 55,  'memory', 'GDDR6 VRAM 6'),
      C('vram7',    360, 380, 80, 55,  'memory', 'GDDR6 VRAM 7'),
      C('vram8',    260, 260, 80, 55,  'memory', 'GDDR6 VRAM 8'),
      C('gpu_vrm',  740, 60,  120, 380, 'power',  '14-Phase Core VRM', { array: 14 }),
      C('pcie_edge',120, 480, 500, 35,  'signal', 'PCIe 4.0 x16 Connector', { slot: true }),
      C('disp_out', 40,  80,  45,  340, 'display','DisplayPort x3 + HDMI 2.1'),
      C('pcie_pwr', 880, 60,  70,  120, 'power',  '12VHPWR Power Inlet')
    ]
  }
  ```

#### 2. Network Switch & Router Board (`router_switch`)
- **Pedagogical Purpose**: Teaches networking hardware: magnetics (RJ45 isolation transformers), PHY chips, switch fabric ASIC, and serial SPI Flash.
- **Specification**:
  ```javascript
  router_switch: {
    w: 1000, h: 480, shape: 'rect', pcb: '#1e3a5f',
    note: 'A managed switch board organizes data traffic at line rate. Network packets enter through isolated RJ45 jacks with magnetics, decode in PHY transceivers, and switch in the central packet fabric.',
    chips: [
      C('switch_asic', 420, 150, 180, 160, 'soc',    'Switch Packet ASIC', { big: true }),
      C('ram_buf',     640, 160, 90,  60,  'memory', 'Packet Buffer RAM'),
      C('spi_flash',   640, 260, 70,  50,  'storage','Boot ROM / SPI Flash'),
      C('phy_bank',    180, 130, 120, 240, 'signal', 'Ethernet PHY Transceivers'),
      C('rj45_ports',  30,  100, 100, 300, 'wireless','8-Port Gigabit MagJack Array'),
      C('sfp_cage',    840, 140, 120, 90,  'signal', 'SFP+ 10GbE Cage'),
      C('pwr_stepdown',840, 300, 110, 120, 'power',  'DC-DC Stepdown Regulators')
    ]
  }
  ```

#### 3. Wearable / Smartwatch SiP (`smartwatch_sip`)
- **Pedagogical Purpose**: Illustrates System-in-Package (SiP) technology where CPU, DRAM, PMIC, and sensors are vacuum-sealed inside a single conformal coating block.

---

### Expansion Category B: Adding More Hardware Repairs & Faults

Faults are authored in `data-faults.js`. Every fault requires:
1. **Complaints**: User quotes highlighting symptoms.
2. **Customer Theory**: The user's flawed hypothesis.
3. **Readings**: Distorted values across test instruments (`smart`, `bench`, `memtest`, `thermal`, `battery`, `power`, `storage_used`, `activity`, `visual`, `listen`).
4. **Resolution**: `fixedBy: { kind: 'part', cat: '...' }` OR `{ kind: 'action', id: '...' }`.
5. **Interview Clues**: Authoritative clues in `data-interview.js`.

#### Concrete Ready-to-Add Faults:

#### 1. Bent Socket Pins / Inadequate Mounting Pressure (`bent_socket_pins`)
- **Concept**: Student or cousin tried to seat a CPU with excessive force or upside down, bending pin contacts. Machine won't POST or drops memory channels.
- **Data Definition (`data-faults.js`)**:
  ```javascript
  bent_socket_pins: {
    id: 'bent_socket_pins',
    title: 'Bent CPU socket pins',
    appliesTo: ['tower_pc'],
    severity: 'critical',
    complaints: [
      'I built it yesterday. The fans spin for half a second, then it clicks off.',
      'There is a red light on the motherboard next to "CPU".'
    ],
    customerTheory: 'They think they received a dead motherboard from the shop.',
    readings: {
      visual: { note: 'Socket lever was forced down with the CPU 90° out of rotation. Three gold pins in corner A are crushed flat; two more are bridged.' },
      power: { watts: 14, negotiated: 'none', seats: true, note: 'PSU enters short-circuit protection instantly on standby rail.' },
      thermal: { idleC: 22, loadC: 22, fanRpm: 0, note: 'System cannot stay on long enough to generate heat.' },
      memtest: { passes: 0, errors: 1, note: 'Cannot initialize memory controller.' }
    },
    fixedBy: { kind: 'action', id: 'align_pins' },
    wrongFix: {
      power: 'Replacing the power supply does nothing. The board still trips short protection because the pins are touching.'
    },
    explain: 'LGA sockets hold hundreds of hair-thin gold spring contacts. Forcing the clamp when the triangle is misaligned crushes them flat. Straightening them requires 0.3mm tweezers, a microscope, and immense patience.'
  }
  ```

#### 2. Bulging / Blown Electrolytic Capacitor (`blown_caps`)
- **Concept**: Classic desktop/vintage failure. Filter capacitor tops bulge and leak electrolyte, causing ripple voltage and random restarts under GPU load.

#### 3. Stripped Screw Head (`stripped_screw_nightmare`)
- **Concept**: A customer or amateur used a Phillips #1 driver on a Torx T5 or Pentalobe screw, boring out the head into a circular pit. Requires the `extractor` tool and an interactive reverse-drill gesture.

---

### Expansion Category C: Adding More Software & macOS Diagnostics

Software faults live across [`ui-macos.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-macos.js) and [`ui-minigames.js`](file:///Users/marktremmel/PracticeSheetsCombined_AntiGravity%20NonLameActually_claudeFinAntigravWhatevs/materials/techops/js/ui-minigames.js).

#### 1. Sensor Panic / Runaway `kernel_task` (`kernel_task_panic`)
- **Concept**: A disconnected or corroded battery thermal sensor returns `-128°C` or `+128°C`. macOS safety logic launches `kernel_task` to consume 700% CPU to prevent other processes from running, making the machine completely unresponsive.
- **Workflow**:
  1. Activity Monitor: `kernel_task` consumes 680% CPU.
  2. Terminal: Run `pmset -g thermlog`. Reveals "CPU_Speed_Limit = 10% due to Thermal Sensor (TB0T / Battery)".
  3. Action: Reseat battery flex cable or replace faulty battery sensor board.

#### 2. Safari Scam Push Notification Spam (`browser_push_spam`)
- **Concept**: User clicked "Allow" on a shady pirate/streaming site. Simulated macOS system notifications appear every 30 seconds with fake "System Corrupted" alerts.
- **Workflow**:
  1. Settings App in macOS lab: Navigate to `Safari -> Settings -> Websites -> Notifications`.
  2. Identify rogue origin (e.g., `track-fast-cleaner.com`).
  3. Toggle permission from "Allow" to "Deny / Remove".

#### 3. Captive Portal Trapped Connection (`captive_portal_loop`)
- **Concept**: Wi-Fi shows full bars, router ping succeeds, but all internet URLs fail with SSL certificate errors because the public/school hotel hotspot requires accepting terms.
- **Workflow**:
  1. Network Utility: Router ping OK, DNS lookup returns router IP (`192.168.1.1`).
  2. Safari: Force open `http://captive.apple.com` or `http://1.1.1.1` (unencrypted HTTP) to trigger login splash page.
  3. Check "Accept Terms" checkbox to open gateway.

---

### Expansion Category D: More Conversations & Narrative Dynamics

The intake interview (`data-interview.js` and `data-people.js`) is the primary digital culture encounter.

#### 1. Narrative Persona Expansion
Add distinct social profiles reflecting actual digital divides:
- **The Stressed University Student (`bence_elte`)**: Has thesis deadline in 18 hours. Stored only copy on a thumb drive. Panicked, willing to pay anything, but needs speed above all.
- **The Skeptical Gamer (`krisz_ranked`)**: Convinced the repair shop will steal their GPU or swap OEM parts with cheap knockoffs. Demands to watch or inspect serial numbers.
- **The Senior Citizen on Fixed Pension (`ildiko_neni`)**: Needs iPad to FaceTime grandchildren in Germany. Modest budget, easily intimidated by jargon.

#### 2. Multi-Turn Dialogue & Bargaining
Currently questions are single-shot. Adding conditional follow-ups:
```
[Player]: "Has it been dropped or got wet?"
[Customer]: "No, never!"
   -> [Inspect: Visual finding reveals red LDI (Liquid Damage Indicator)]
   -> [Player Follow-Up]: "The indicator inside is bright pink. Did someone spill tea recently?"
   -> [Customer]: "Oh... well, my daughter had a water bottle leak in her backpack last week..."
```

---

## Part 3: Project Lead Roadmap — "Next Levels"

To evolve TechOps from a working prototype into an internationally acclaimed educational title, we recommend the following four milestone phases:

```mermaid
graph LR
    L1[Level 1: Component Diagnostics] --> L2[Level 2: Thermal & Board Imaging]
    L2 --> L3[Level 3: Shop Metagame & Apprentice]
    L3 --> L4[Level 4: Classroom Tournament Mode]
```

### Level 1: Multimeter & Board-Level Diagnostics Mode
- **Feature**: Introduce a 2-probe digital multimeter (`DMM`) on the Workbench.
- **Mechanic**:
  - Switch between DC Volts (`⎓V`), Resistance (`Ω`), and Continuity Beep (`🔊`).
  - Touch Probe A to chassis ground, Probe B to test points on the board (`PPBUS_G3H`, `3V3_S5`, `1V8_CORE`).
  - Teaches how power rails step down: `19V / 20V (Inlet)` -> `12V (Main Bus)` -> `5V / 3.3V (Standby)` -> `0.9V - 1.2V (VCore)`.

### Level 2: Thermal Imaging Camera Mode (FLIR)
- **Feature**: Toggle a false-color thermal overlay on the board when power is injected.
- **Mechanic**:
  - When a shorted ceramic decoupling capacitor pulls 4 amps to ground, it glows bright white-hot (78°C) while the rest of the board remains dark blue (24°C).
  - Teaches students how real repair technicians identify short circuits in seconds without schematics.

### Level 3: Shop Progression & The Apprentice Metagame
- **Feature**: Expand `ui-shopfit.js` into a living repair workshop.
- **Mechanic**:
  - Hire and train an apprentice (`Peti`) to handle basic jobs (cleaning dust, replacing standard batteries).
  - Negotiate vendor credit terms with iPon and HardverApró sellers.
  - Upgrade bench equipment (Ultrasonic cleaner for liquid damage, hot air rework station).

### Level 4: Classroom Competition & Bilingual Localization
- **Feature**: Multi-language support (Hungarian / English toggle matching the portfolio) + SEK Tournament Mode.
- **Mechanic**:
  - Hungarian default copy with instant English switch.
  - "Shift of the Day" tournament mode where every student in a class starts with seed `SEK2026` and competes for the highest 5-star streak and lowest comeback rate.
  - Instant teacher leaderboard import parsing all student `SEK7K-` codes into a class summary table.

---

## Verification & Implementation Priority

| Priority | Item | Impact | Complexity |
| :--- | :--- | :--- | :--- |
| **P0** | Fix Bugs 1–3 (PS5 & Desktop board/teardown alignment) | Prevents console/desktop crashes | Low (20 mins) |
| **P0** | Fix Bug 4 (Comeback fallback on mobile devices) | Prevents broken warranty tickets | Low (10 mins) |
| **P0** | Fix Bug 7 (Link TechOps in `index.html`) | Makes game accessible from portfolio | Low (5 mins) |
| **P1** | Fix Bug 6 (`file://` offline JSON fallback) | Enables 100% offline USB classroom use | Medium (30 mins) |
| **P1** | Fix Bug 8 (Balance faults for console/phones) | Improves replayability | Medium (45 mins) |
| **P2** | Implement Expansion Boards (GPU & Router) | Deepens hardware curriculum | High (2 hours) |
| **P2** | Implement Next Level 1 (Multimeter Rail Prober) | Elevates gameplay to pro repair level | High (3 hours) |

---
*Report formulated for Mark Tremmel / SEK Digital Culture Curriculum.*
