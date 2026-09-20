# TechOps Budapest — Systems & Feature Expansions Blueprint
**Author:** Pair Programming Agent  
**Date:** September 2026  
**Target:** Gameplay Systems Architecture & Suggested Code Implementations  

---

## 1. The Multimeter & Rail Prober Subsystem

### 1.1 Educational Value
Currently, voltage readings in TechOps Budapest are displayed as static text tables. Electronics repair fundamentally revolves around **rail probing**: measuring how a 20V charger inlet steps down through switching buck regulators (`12V` -> `5V` -> `3.3V` -> `1.8V` -> `0.9V Core`), and locating short circuits to ground.

```
[ 20V DC Inlet ] ---> [ Inrush MOSFET ] ---> [ Main 12V Bus ]
                                                    |
             +--------------------+-----------------+--------------------+
             |                    |                                      |
             v                    v                                      v
       [ 5V Standby ]       [ 3.3V Always ]                        [ Buck Reg ]
                                                                         |
                                                                         v
                                                                   [ 0.9V VCORE ]
```

### 1.2 Probing Mechanics
* **Interactive Tool:** Two probes appear on screen.
  * **Black Probe (Ground):** Clipped to any motherboard screw standoff hole or chassis shield.
  * **Red Probe (Signal):** Dragged and touched to labeled test pads on the SVG logic board.
* **Modes:**
  * **DC Voltage:** Measures rail potential relative to ground.
  * **Resistance (Ohms):** Measures resistance. A reading of `< 1.0 Ω` on a 12V rail indicates a dead short.
  * **Continuity Beep:** Synthesizes a real-time `880 Hz` square wave tone via `sek-audio.js` whenever resistance is `< 25 Ω`.

### 1.3 Suggested Implementation Code (Non-modifying / Ready for adoption)

```javascript
// Suggested extension for js/ui-multimeter.js
(function (window) {
  'use strict';

  var Multimeter = {
    mode: 'volts', // 'volts' | 'ohms' | 'continuity'
    grounded: false,

    // Test pad definitions mapped to data-boards.js coordinates
    RAILS: {
      PP20V_IN:  { targetV: 20.0, nominalR: 45000 },
      PPBUS_G3H: { targetV: 12.6, nominalR: 12000 },
      PP3V3_S5:  { targetV: 3.3,  nominalR: 3500 },
      PP1V8_AON: { targetV: 1.8,  nominalR: 1800 },
      PP0V9_CPU: { targetV: 0.9,  nominalR: 15 } // CPU core has naturally low resistance!
    },

    probePad: function (padId, isShorted) {
      if (!this.grounded) {
        return { display: 'O.L (No GND)', beep: false };
      }
      var rail = this.RAILS[padId];
      if (!rail) return { display: '0.00 V', beep: false };

      if (this.mode === 'volts') {
        var v = isShorted ? 0.02 : rail.targetV;
        return { display: v.toFixed(2) + ' V', beep: false };
      }

      if (this.mode === 'continuity' || this.mode === 'ohms') {
        var r = isShorted ? 0.4 : rail.nominalR;
        var beep = r < 25;
        if (beep && window.sekAudio) {
          window.sekAudio.playTone(880, 0.15, 'square');
        }
        return {
          display: r < 1000 ? r.toFixed(1) + ' Ω' : (r / 1000).toFixed(1) + ' kΩ',
          beep: beep
        };
      }
    }
  };

  window.TechOpsMultimeter = Multimeter;
})(window);
```

---

## 2. Multi-Turn Interview & Interrogation Engine

### 2.1 The Concept
In real repair shops, customers are unreliable narrators not out of malice, but from embarrassment, lack of vocabulary, or fear of warranty invalidation. 

The **Multi-Turn Interview Engine** adds a second layer of interaction:
1. **Initial Inquiry:** Ask one of the 10 standard intake questions (costs 0.1h bench time).
2. **Follow-Up Opportunity:** If physical inspection reveals contradictory evidence, a **Challenge / Clarify** dialogue button unlocks.
3. **Outcome:** A successful follow-up unmasks the true failure mode without running costly bench instruments.

```
             [ Initial Question Asked ]
                         |
                         v
       [ Customer Gives Vague/Misleading Answer ]
                         |
      +------------------+-------------------+
      |                                      |
      v                                      v
[ Run 4 Instruments ]             [ Uncover Contradiction ]
(Costs 4.5h bench time)           (e.g., Pink LCI, Dent on corner)
                                             |
                                             v
                                  [ Ask Multi-Turn Follow-Up ]
                                  (Costs 0.1h bench time)
                                             |
                                             v
                                  [ Honest Admission Unlocked ]
```

### 2.2 Suggested Implementation Schema

```javascript
// Suggested extension for js/data-interview.js
var MULTI_TURN_TREES = {
  liquid_spill: {
    prerequisiteObservation: 'lci_pink',
    prompt: 'The internal liquid indicator sticker under the trackpad is crimson red.',
    options: [
      {
        text: 'The indicator is pink. Was anything spilled, even a few drops?',
        reaction: 'They pause, look away, and admit: "My cat knocked over a glass of water two nights ago. I dried the outside immediately and hoped it was fine."',
        unlockedClue: 'liquid_corrosion',
        suggestedInstruments: ['visual', 'board_inspection']
      },
      {
        text: 'You said it never got wet, but this sticker proves you lied.',
        reaction: 'Offended and defensive: "I don\'t appreciate being called a liar. My flat has condensation!"',
        reputationHit: 2
      }
    ]
  }
};
```

---

## 3. Multi-Job Bench Juggling (Shop Logistics)

### 3.1 Gameplay Mechanics
Currently, the player works on exactly one machine at a time. In reality, a repair shop balances:
* Machine A: Disassembled on bench, waiting 4 days for a replacement screen from iPon.
* Machine B: Walk-in customer needing a 10-minute port lint clean.

**The Dual-Slot Bench Interface:**
* **Slot 1 (Active Workbench):** Machine currently under the screwdrivers and software lab.
* **Slot 2 (Waiting Shelf / Staging):** Machine with parts on order.
* **Tension:** Taking a new walk-in job when your shelf is full risks deadline defaults if multiple parts arrive on the same morning.

---

## 4. Mobile / Quick-Fire "Swipe Mode" (390px Triage)

### 4.1 Concept
For phone play or bus commutes where teardown gestures are cumbersome on small touchscreens, **Swipe Mode** transforms the diagnostic database into a rapid-fire literacy quiz.

```
       +------------------------------------+
       |         TECH TRIAGE CARD           |
       |                                    |
       |  "Browser popup says: Windows has  |
       |   detected 33 viruses. Call this   |
       |   number to unlock."               |
       |                                    |
       |     [SWIPE LEFT]     [SWIPE RIGHT] |
       |     Free Software    Replace Part  |
       |      Settings Fix      (Upsell)    |
       +------------------------------------+
```

* **Controls:**
  * **Swipe Left:** "Software / Settings / Zero-Part Fix" (Honest triage)
  * **Swipe Right:** "Hardware Fault / Needs Replacement Part"
* **Scoring:** Graded on speed and ethical diagnostic accuracy.

---

## 5. Bilingual Localization Architecture (HU / EN)

### 5.1 Zero-Build i18n Strategy
To maintain the zero-build USB stick promise, localization uses a lightweight dictionary lookup on the `window` object:

```javascript
// Suggested implementation for js/i18n.js
(function (window) {
  'use strict';

  var currentLang = localStorage.getItem('techops-lang') || 'en';

  var DICT = {
    en: {
      'nav.counter': 'Counter',
      'nav.intake': 'The sit-down',
      'nav.bench': 'Workbench',
      'nav.market': 'Parts market',
      'axis.fit': 'Right part for this person',
      'axis.budget': 'Respected their money',
      'axis.speed': 'Turnaround against their deadline',
      'axis.durability': 'Durability & parts quality',
      'axis.safety': 'Workmanship & safety'
    },
    hu: {
      'nav.counter': 'Pult',
      'nav.intake': 'Kérdezz-felelek',
      'nav.bench': 'Munkaasztal',
      'nav.market': 'Alkatrész piac',
      'axis.fit': 'Megfelelő alkatrész a célnak',
      'axis.budget': 'Tiszteletben tartott büdzsé',
      'axis.speed': 'Határidő betartása',
      'axis.durability': 'Tartósság és minőség',
      'axis.safety': 'Biztonságos, tiszta munka'
    }
  };

  window.TechOpsI18n = {
    lang: function (l) {
      if (l) { currentLang = l; localStorage.setItem('techops-lang', l); }
      return currentLang;
    },
    t: function (k) {
      return (DICT[currentLang] && DICT[currentLang][k]) || DICT.en[k] || k;
    }
  };
})(window);
```

---

## 6. Classroom Lesson Plan: 45-Minute Module (SEK Budapest)

```
+-------------------------------------------------------------------------------+
| LESSON BLUEPRINT: "The Cost of Shortcuts in Technology Repair"                |
| Target Audience: Grades 7–12 / SEK Digital Literacy                           |
| Shift Seed: "SEKBUDAPEST2026" (Uniform class experience)                      |
+-------------------------------------------------------------------------------+
```

### Timeline:
* **00:00 – 00:08 | Briefing & The Golden Rule:**
  * Teacher explains the 5 evaluation axes. Emphasizes: *"Listening is cheaper than probing; asking a question costs 6 minutes, running a memory test costs 90 minutes."*
* **00:08 – 00:32 | Autonomous Shift Play:**
  * Students boot `index.html` with seed `SEKBUDAPEST2026`.
  * Complete 3–4 repair tickets.
  * Encounter at least one zero-part fault (`disk_full` or `port_lint`).
* **00:32 – 00:40 | Class Shift Decoder Analysis:**
  * Students copy their `SEK7K-...` hand-in codes.
  * Teacher pastes all codes into **Teacher Decoder** on projector.
  * Roster sorts by lowest axis: reveals whether the class overcharged on budget or stripped screws through incorrect driver selection.
* **00:40 – 00:45 | Guided Debrief:**
  * *"Why did fitting a 2TB Samsung PRO drive to Eszter's laptop lose you stars?"*
  * *"How did word-of-mouth reputation affect how many customers walked in?"*
