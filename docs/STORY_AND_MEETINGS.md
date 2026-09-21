# TechOps Budapest — Story, Characters & Dialogue Expansions
**Author:** Pair Programming Agent  
**Date:** September 2026  
**Target:** Narrative Architecture & Dialogue System Design  

---

## 1. The Narrative Arc: The Józsefváros Workshop

The narrative anchors the technical mechanics in a living community in Budapest's District VIII (near Corvin negyed / Rákóczi tér). The player is not an abstract technician; they are opening an independent counter in a neighbourhood where pensioners, university students from ELTE/BME/MOME, gamers, and local small businesses cross paths.

```
+-----------------------------------------------------------------------------+
| ACT 1: The Cold Counter (Days 1–10)                                        |
| Focus: Establishing trust, surviving on breadcrumbs, simple physical faults|
| Key Theme: "Listening is cheaper than probing."                             |
+-------------------------------------+---------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| ACT 2: Word on the Boulevard (Days 11–25)                                   |
| Focus: Commercial freelancers, warranty pressures, counterfeit part risks   |
| Key Theme: "A bill describes the work, not the wallet."                     |
+-------------------------------------+---------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| ACT 3: The Neighbourhood Pillar (Days 26–40+)                              |
| Focus: Institutional contracts (schools), complex board diagnostics, legacy |
| Key Theme: "The honest shop outlasts the shortcut shop."                    |
+-----------------------------------------------------------------------------+
```

---

## 2. Reoccurring Characters & Dynamic Meetings

Rather than purely randomized procedural customers, TechOps Budapest benefits enormously from **six anchor regulars**. These characters return across the shift with evolving machines, higher stakes, and continuing personal storylines.

### 2.1 Béla Bácsi — The Retired BKV Tram Driver
* **Visuals:** Elderly, grey flat cap, knitted cardigan, heavy steel wristwatch, kindly crow's feet.
* **Voice:** Gentle, slow, rhythmic Hungarian-cadenced English.
* **Hardware:** Ancient **ThinkPad T480** and an inherited **Dell Inspiron 15**.
* **Story Arc:**
  * **Meeting 1 (Day 3):** Brings in his ThinkPad with grinding fans. Expects you to tell him it's garbage. When you clean the fin stack for a fair price, he leaves a handful of *Negró* hard candies on the counter.
  * **Meeting 2 (Day 14):** Comes back wanting to add RAM so his 10-year-old granddaughter can run Scratch for school. He has 18,000 Ft saved in an envelope. If you fit a sensible DDR4 stick well under his budget, his gratitude is profound.
  * **Meeting 3 (Day 28):** Arrives visibly agitated holding his phone. He received an SMS claiming his postal package is held for 1,200 Ft tax with a suspicious link. This is an intake interview with zero hardware faults: your job is digital literacy triage.
* **Pedagogical Function:** Teaches patience, anti-e-waste ethics, and the responsibility of protecting vulnerable community members.

### 2.2 Eszter — The MOME Design Student
* **Visuals:** Asymmetrical dyed haircut, oversized canvas tote bag with charcoal smudges, wireframe glasses.
* **Voice:** Panicked, fast-talking, highly articulate about aesthetics, completely blind to file sizes.
* **Hardware:** **Mid-2012 MacBook Pro 13"**, later upgrading to a second-hand **M1 MacBook Air**.
* **Story Arc:**
  * **Meeting 1 (Day 5):** "My thesis project won't export and Premiere says Scratch Disk Full!" Has 214 GB of duplicated ProRes exports in Downloads. If you upsell her a 40,000 Ft SSD, she pays out of fear, but later reviews: *"My tutor looked at it and told me they just had to empty my trash."* (2 stars).
  * **Meeting 2 (Day 18):** Cracks her screen right before semester critique. Demands the cheapest screen. If you fit an aftermarket TFT panel with poor color reproduction, her print proofs come out magenta and she returns crushed.
* **Pedagogical Function:** Demonstrates that storage management is software hygiene, and that creative professionals need color accuracy, not just resolution.

### 2.3 Gábor — The Freelance Videographer
* **Visuals:** Dark beard, black technical hoodie, smartwatch, carrying hard-shell Pelican cases.
* **Voice:** Precise, impatient, technical buzzwords ("sustained write throughput", "thermal throttling").
* **Hardware:** **MacBook Pro 14" M3** and a custom **Tower PC**.
* **Story Arc:**
  * **Meeting 1 (Day 8):** Needs a 2 TB NVMe drive for 4K multicam editing. If you install a budget QLC SATA drive or Gen3 NVMe, he returns two days later with drive benchmarks showing write-cache dropoff.
  * **Meeting 2 (Day 22):** Tower PC sudden power cut under heavy rendering. You must diagnose blown 12V PSU rail capacitors versus GPU thermal runaway.
* **Pedagogical Function:** Teaches IOPS, bus architecture ceilings, and that premium hardware genuinely matters for professional workloads.

### 2.4 János — The DPD / GLS Delivery Courier
* **Visuals:** High-vis jacket, handheld barcode scanner holstered on hip, perpetually in a hurry.
* **Function:** Not just an order delivery notification!
* **Meetings:**
  * Every time an order from Shenzhen or iPon arrives, János drops off the box and delivers neighbourhood news:
    > *"Heavy box from Shenzhen today. Customs stamped it twice. By the way, the phone shop over on Baross utca got raided yesterday for selling fake Apple batteries."*
  * **Day 16 Walk-in:** On a rainy afternoon, János slams his company barcode scanner phone on the counter: lint has packed into the USB-C port and his route scanner won't charge. A 3-minute precision pick scrape repair while he waits.

### 2.5 Kovács Úr — The Building Landlord
* **Visuals:** Wool trench coat, leather briefcase, silver-rimmed bifocals, severe posture.
* **Function:** Shop upkeep and safety enforcement.
* **Visits:**
  * **Day 10 (First Rent & Inspection):** Checks the circuit breaker. If you have uninsulated test wires or swollen lithium batteries sitting on an open wooden shelf instead of a metal safety bin, he warns you sternly.
  * **Day 30 (Reputation Milestone):** If shop reputation is >80, he remarks: *"The bakery downstairs says your customers are polite and don't block the hallway. I'm keeping your rent unchanged for next term."*

### 2.6 Tamás — "FastFix" Boulevard Competitor
* **Visuals:** Slicked hair, branded polo shirt, gold chain, airpods in both ears.
* **Function:** The cautionary foil. Tamás runs the high-turnover kiosk at the tram stop.
* **Encounters:**
  * Drops by looking to buy scrap logic boards for parts or borrow your Torx-T8 driver.
  * Tries to sell you a tray of generic "Grade A++ OEM" iPhone screens with fake serial numbers.
  * Represents the opposite philosophy: high margin, zero diagnostic honesty, quick glue bodges, moving on before the warranty comebacks hit.

---

## 3. Multi-Turn Diagnostic Interview Trees

In the current simulator, intake questions are single-shot. Below are **four complete multi-turn interrogation trees** designed for the multi-turn interview expansion.

### Dialogue Tree 1: The Pink Liquid Contact Indicator (LCI)
* **Context:** Customer brings in a MacBook Air M1 that randomly restarts.
* **Initial Question (`drop`):** "Has it been dropped, or got wet?"
  * **Customer:** *"Never! I treat it like a baby. It never leaves my desk."*
* **Observation:** Visual inspection on the bench reveals the LCI sticker under the trackpad is bright crimson.
* **Turn 2 (Confrontation Choice):**
  * **Option A (Blunt):** *"The moisture sensor inside is bright pink. That only happens with direct liquid."*
    * *Customer Reaction:* Defensive. *"Are you accusing me of lying? My flat has high humidity!"*
    * *Reputation Risk:* Neutral, but customer tension rises.
  * **Option B (Empathetic / Curious):** *"The internal indicator shows moisture contact near the trackpad. Did someone borrow it, or could condensation have got in?"*
    * *Customer Reaction:* Pause. *"Wait... my roommate cleaned the desk last week with surface spray. Could that do it?"*
    * *Outcome:* Breakthrough. The customer remembers the spray cleaner, pointing diagnosis straight to trackpad flex corrosion.
  * **Option C (Ignore and order a motherboard):**
    * *Outcome:* 65,000 Ft wasted on a board when a 4,000 Ft flex cable ultrasonic clean was all that was needed.

### Dialogue Tree 2: The Counterfeit Charger Blowout
* **Context:** ThinkPad T480 won't power on; zero LEDs.
* **Initial Question (`power`):** "How is it on battery, and while charging?"
  * **Customer:** *"It died yesterday. I plugged it in overnight with my new cable, and this morning nothing."*
* **Turn 2 (Follow-up):**
  * **Option A:** *"Where did you buy the new cable and charger?"*
    * *Customer:* *"At the night market near the station. It was only 1,500 Ft and said 100W Fast Charge on the plastic wrap."*
    * *Technical Clue:* Cheap cables lack 5.1kΩ CC pulldown resistors and E-marker chips, frequently sending 20V straight into 3.3V logic lines.
  * **Option B:** *"Did you see any sparks or smell burning?"*
    * *Customer:* *"There was a tiny click and a smell like warm fish when I plugged it in."*
    * *Technical Clue:* Blown USB-C Power Delivery controller (TUSB320 / Cypress CCG3).
* **Pedagogical Takeaway:** Power supplies and cables are active electronic components, not passive wires.

---

## 4. Daily Atmospheric Interludes & Counter Events

To make the passage of shop days feel alive, the shift cycle should incorporate atmospheric flavor notes between jobs:

```
+-------------------------------------------------------------------------+
| [Morning Standup - 08:45]                                               |
| Rain lashes against the workshop window on József körút.                |
| The smell of damp stone and ozone.                                      |
| Till: 142,500 Ft · Reputation: 78 · Parts on shelf: 2                   |
| Note: A thunderstorm yesterday means three people will walk in with     |
| surge-damaged router power supplies by noon.                           |
+-------------------------------------------------------------------------+
```

### Seasonal Contexts:
1. **The Budapest Summer Heatwave (38 °C outside):**
   * Dust-clogged laptops that operated fine all winter suddenly begin thermal throttling.
   * Repasting and fin-stack cleaning volume doubles.
2. **University Exam Period (January / June):**
   * High influx of panicked students with broken displays, thesis data recovery emergencies, and coffee spills.
   * Deadlines drop from 5 days to 24 hours.
3. **Winter Sleet & Salt Dust:**
   * Heavy lint and road salt grit packed into phone charge ports.
