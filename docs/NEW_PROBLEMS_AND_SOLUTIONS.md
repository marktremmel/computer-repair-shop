# TechOps Budapest — New Problems, Solutions & Pedagogical Scenarios
**Author:** Pair Programming Agent  
**Date:** September 2026  
**Target:** Hardware & Digital Literacy Expansion Scenarios  

---

## 1. Overview & Pedagogical Objective

TechOps Budapest teaches that **diagnosis precedes repair** and that **the cheapest fix is often the right fix**. 

The expansions below introduce modern failure modes observed across 2020–2026 consumer electronics. They are split into two categories:
1. **Hardware Precision & Electrical Diagnostics** (Board-level shorts, thermal boundary failures, battery hazards)
2. **Digital Literacy & Free Fixes** (Notification abuse, captive portal traps, deceptive extensions)

---

## 2. New Hardware Problems & Engineering Solutions

```
+-------------------------------------------------------------------------------+
| FAULT 1: Swollen Lithium Pouch Battery (The "Spicy Pillow")                   |
+-------------------------------------------------------------------------------+
| Machine: MacBook Air M1 (mba_m1), MacBook Pro 13 (mbp13_2012), Steam Deck    |
| Category: battery | Severity: CRITICAL SAFETY                                 |
+-------------------------------------------------------------------------------+
```
* **Customer Complaint:**
  * *"The trackpad suddenly stopped clicking. It feels stiff, and yesterday the bottom lid started rocking on the table."*
  * *"I think the trackpad spring is broken."*
* **The Reality:**
  The lithium-polymer pouch cells have suffered electrolyte decomposition from prolonged trickle charging at 100% heat, producing gas. The swelling battery pushes upward directly against the trackpad mechanism and downward against the aluminum bottom cover.
* **Intake Clues (`data-interview.js`):**
  * `when`: *"It started slightly last month, but this week the case won't sit flat."* (warm)
  * `power`: *"I leave it plugged into the monitor on my desk 24 hours a day."* (hot — pointer to float charge heat degradation)
  * `history`: *"Nobody has opened it."* (cold)
* **Diagnostic Instrument Readings (`readings`):**
  * `visual`: `"The pouch cells are bloated like sealed balloons, pressing hard against the underside of the trackpad. Puncture hazard is severe."`
  * `battery`: `{ healthPct: 61, cycleCount: 218, status: 'SERVICE_RECOMMENDED', swellDetected: true }`
* **Bench Procedure & Rules:**
  1. **Safety First:** Metal spudgers or screwdrivers are strictly prohibited near the pack. Puncturing an expanded pouch causes immediate thermal runaway and smoke.
  2. **Chemical Dissolution:** Apply 2–3 drops of high-purity Isopropyl Alcohol (IPA) along the adhesive perimeter.
  3. **Precision Gesture:** Execute the `pull` / `peel` gesture at less than 15 degrees angle. Snatched or angled pulls result in tab tears.
  4. **Hazardous Disposal:** Place the removed pack in the shop's vermiculite battery safety bucket.
* **Scoring & Axis Impact:**
  * Resolving with a genuine or tier-1 battery scores +25 on Safety.
  * Selling a replacement trackpad without replacing the swollen cell fails the job completely (Overall = 0, Safety = 0).

---

```
+-------------------------------------------------------------------------------+
| FAULT 2: PS5 Pro Liquid Metal Thermal Boundary Dry-Out                        |
+-------------------------------------------------------------------------------+
| Machine: PlayStation 5 Pro (ps5pro)                                           |
| Category: thermal | Action Fix: respread_liquid_metal                         |
+-------------------------------------------------------------------------------+
```
* **Customer Complaint:**
  * *"It plays for twenty minutes, the fan sounds like a commercial jet engine, and then it shuts off with three beeps and a black screen."*
  * *"The exhaust air coming out the back feels completely cold, so it can't be overheating!"*
* **The Reality:**
  The gallium-indium-tin liquid metal TIM on the custom APU has oxidized or migrated away from the center of the die due to thermal cycling while standing vertically. The heatsink is cool *because* heat cannot cross the dry spot from the die to the copper block.
* **Diagnostic Instrument Readings:**
  * `thermal`: `{ apuTempC: 104, heatsinkTempC: 36, fanRpm: 4800, throttle: 'CRITICAL_SHUTDOWN' }`
  * `visual`: `"Under the heatsink, a dry grey oxidized spot roughly 12mm wide sits bare in the center of the silicon mirror. The liquid metal has pooled along the foam gasket edge."`
* **Fix Action (`respread_liquid_metal`):**
  * Tool: `foam_swab`
  * Needs Step: `heatsink`
  * Labour: 1.2 hours
  * Procedure: Clean dry oxide skin with lint-free tip, re-wet the APU die surface tension, spread evenly across the nickel-plated copper block, inspect foam barrier gasket.
* **Pedagogical Lesson:**
  Cold exhaust air + screaming fan = heat transfer breakdown between chip and cooler.

---

```
+-------------------------------------------------------------------------------+
| FAULT 3: Primary 20V Supply Rail Shorted Decoupling Capacitor                 |
+-------------------------------------------------------------------------------+
| Machine: ThinkPad T480 (thinkpad_t480), Tower PC (tower_pc)                   |
| Category: caps | Fixed by: replace_smd_cap                                    |
+-------------------------------------------------------------------------------+
```
* **Customer Complaint:**
  * *"Completely dead. When I plug the USB-C charger in, the little light on the laptop blinks once, and the charger's own LED clicks off."*
* **The Reality:**
  A tiny 0805 multilayer ceramic capacitor (MLCC) on the 20V input rail has suffered internal dielectric breakdown, shorting directly to ground. The charger detects zero ohms and trips its internal short-circuit protection.
* **Diagnostic Instrument Readings:**
  * `multimeter`: `{ rail_20v: '0.02 V', resistance_to_ground: '0.4 Ω (SHORT)', continuity: 'BEEP' }`
  * `thermal_cam`: `{ hotSpot: 'C1042 near charging inductor glowing at 78 °C under 1V injection' }`
* **Fix Action (`replace_smd_cap`):**
  * Tool: `soldering_iron` + `microscope`
  * Needs Part: `caps_ceramic` (cost: 400 Ft)
  * Labour: 1.8 hours
* **Pedagogical Lesson:**
  Capacitors fail short, resistors fail open. A 400 Ft component saves a 120,000 Ft motherboard.

---

## 3. New Digital Literacy & Zero-Part Problems

These faults simulate situations where **no hardware is broken**, and selling parts to the customer is an ethical failure.

```
+-------------------------------------------------------------------------------+
| FAULT 4: Fake Browser Push Ransomware Notification Loop                      |
+-------------------------------------------------------------------------------+
| Machine: Inspiron 15, MacBook Air M1, ThinkPad T480                           |
| Category: software | Fixed by: revoke_notifications | noPartNeeded: true      |
+-------------------------------------------------------------------------------+
```
* **Customer Complaint:**
  * *"I have a terrible virus! Red windows keep popping up saying my hard drive is infected and demanding 30,000 Ft in bitcoin or my files will be deleted!"*
* **The Reality:**
  A movie streaming website prompted *"Click Allow to prove you are not a robot"*. The user inadvertently granted notification permission. The website is now firing web push notifications with the Windows/macOS system alert sound and custom red warning icons.
* **Diagnostic Readings (`ui-macos.js` / Lab):**
  * `activity`: `{ cpuUsagePct: 4, memPressurePct: 22, suspectProcesses: 'None' }`
  * `browser_settings`: `{ origin: 'https://security-alert-center.top', permission: 'notifications: ALLOW' }`
* **Fix Action (`revoke_notifications`):**
  * Open browser settings -> Site permissions -> Notifications -> Click **Remove**.
  * Bench time: 0.2 hours (12 minutes).
  * Cost: 0 Ft.
* **Pedagogical Lesson:**
  The operating system's own notification system was co-opted. Software literacy means understanding origin permissions, not installing antivirus tools that charge subscriptions for nothing.

---

```
+-------------------------------------------------------------------------------+
| FAULT 5: Captive Portal TLS Hijack Loop ("Your Connection is Not Private")    |
+-------------------------------------------------------------------------------+
| Machine: All laptops and phones                                               |
| Category: software | Fixed by: clear_portal | noPartNeeded: true              |
+-------------------------------------------------------------------------------+
```
* **Customer Complaint:**
  * *"Every single website I open gives me a huge red privacy warning. It says hackers are stealing my passwords! The internet card must be fried."*
* **The Reality:**
  The user is connected to a public Wi-Fi hotspot (train station, university campus) that redirects traffic to a login terms page. Because the user's browser opens an HTTPS site with HSTS (like `google.com`), the router's redirect presents the hotspot's unverified certificate for Google's domain. The browser correctly warns of an interception.
* **Fix Action (`clear_portal`):**
  * Send one unencrypted HTTP probe request (`http://neverssl.com`).
  * Router intercepts cleanly without certificate mismatch.
  * Accept terms; Wi-Fi functions immediately.
* **Pedagogical Lesson:**
  HTTPS security certificates prevent man-in-the-middle impersonation. The red warning was not a virus; it was security working exactly as designed.

---

## 4. Suggested Code Integration Schemas

Below are ready-to-use schemas for [`data-faults.js`](file:///Users/marktremmel/computer-repair-shop/js/data-faults.js) to integrate these new faults into the simulator without modifying live files:

```javascript
// Suggested extension block for js/data-faults.js
battery_swollen: {
  id: 'battery_swollen',
  title: 'Expanded lithium pouch battery',
  appliesTo: ['mbp13_2012', 'mba_m1', 'mbp14_m3', 'steamdeck', 'ipad_air'],
  complaints: [
    'The trackpad will not click at all, and the bottom of the case is wobbling on my desk.',
    'It feels like the middle of the keyboard is lifting up.'
  ],
  customerTheory: 'They want you to replace the trackpad mechanism.',
  readings: {
    visual: { note: 'Battery pack is visibly swollen like a metallic cushion. Trackpad is under heavy upward strain.' },
    battery: { healthPct: 62, cycleCount: 190, status: 'CHECK_BATTERY', note: 'Swelling detected from continuous thermal stress.' },
    thermal: { idleC: 44, loadC: 68, note: 'Normal temperatures.' }
  },
  fixedBy: { kind: 'part', cat: 'battery' },
  safetyCritical: true,
  wrongFix: {
    trackpad: 'You replaced the trackpad. The new one still cannot click because the bloated cell is pushing against it, and you left a fire hazard inside their backpack.'
  },
  explain: 'Lithium polymer cells generate gas when degraded by continuous heat and float-charging. A swollen battery expands inside the chassis, jamming mechanical components above it. Puncturing it risks thermal runaway.'
},

usbc_cc_short: {
  id: 'usbc_cc_short',
  title: 'Corroded USB-C configuration pin',
  appliesTo: ['thinkpad_t480', 'inspiron15', 'switch2', 'mbp14_m3'],
  complaints: [
    'It only charges when the cable is plugged in upside down.',
    'It says "Slow charger connected" even with the original 65W brick.'
  ],
  customerTheory: 'They think their wall socket at home is broken.',
  readings: {
    visual: { note: 'Pin A5 (CC1) inside the port has green copper corrosion crust. Pin B5 (CC2) is clean.' },
    power: { volts: 5.0, amps: 0.45, negotiatedW: 2.25, note: 'Power Delivery handshake failed; fell back to 5V trickle mode.' }
  },
  fixedBy: { kind: 'action', id: 'clean_port' },
  noPartNeeded: true,
  wrongFix: {
    battery: 'A new battery charges at the exact same two watts. The issue is the communication pin negotiating wattage, not the cell storing it.'
  },
  explain: 'USB-C is reversible for users, but internally relies on Configuration Channel (CC) pins to negotiate high-voltage Power Delivery. If one CC pin is bridged by corrosion or lint, the machine defaults to safe 5V trickle charging or only works in one orientation.'
}
```
