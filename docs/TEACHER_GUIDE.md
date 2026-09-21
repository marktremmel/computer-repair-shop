# TechOps Budapest — Teacher Guide & Classroom Lesson Handout
**Target:** SEK Budapest & Digital Literacy Education (Grades 7–12 / Vocational IT)  
**Uniform Shift Seed:** `SEKBUDAPEST2026`  
**Standard Duration:** 45-minute lesson (or 90-minute double block)  
**Deployment:** Zero-build offline resilience — works directly from USB thumbstick (`file://index.html`) or local web server.

---

## 1. Pedagogical Philosophy

TechOps Budapest is **a simulator, not a quiz**. Students are not asked multiple-choice questions with obvious answers. Instead, they run an independent repair business in the 8th District of Budapest where:
1. **Nobody tells them what is wrong.** They must ask the customer, run diagnostic tools, and inspect the physical hardware.
2. **Customers are human narrators.** Customers may be embarrassed about spills, misdiagnose problems ("I need a whole new motherboard!"), or lack technical vocabulary.
3. **Shortcuts carry real costs.** Rushing a repair strips screws, fitting cheap unverified parts creates angry comeback customers, and overcharging ruins word-of-mouth reputation.
4. **Listening is cheaper than probing.** Asking an intake question takes 6 minutes (0.1h); running a memory test takes 90 minutes (1.5h).

---

## 2. 45-Minute Lesson Blueprint

```
+-------------------------------------------------------------------------------+
| TIMELINE: "The Cost of Shortcuts in Technology Repair"                        |
| Uniform Shift Code: SEKBUDAPEST2026                                           |
+-------------------------------------------------------------------------------+
```

### 00:00 – 00:08 | Briefing & The Five Evaluation Axes
* Teacher projects the shop title screen (`index.html`).
* Introduces the **Five Evaluation Axes** displayed on every job card:
  1. **Right Part for This Person (Fit):** Did you fit what they actually need, or did you upsell a pensioner an esports NVMe SSD?
  2. **Respected Their Money (Budget):** Did the repair stay inside what they could afford?
  3. **Turnaround (Speed):** Did you deliver before their deadline without missing shifts?
  4. **Durability & Parts Quality:** Did you buy genuine, OEM, or risky unbranded parts?
  5. **Workmanship & Safety:** Did you unplug the battery? Did you match the screwdriver bit (PH00 vs Torx T5)? Did you clean the thermal paste?
* Emphasizes the **Golden Rule of Diagnostics**:
  > *"Listen before you touch. Asking a question costs 6 minutes. Opening the machine costs 30 minutes. Breaking a ribbon cable costs 3 days."*

### 00:08 – 00:32 | Autonomous Shift Play (Uniform Seed: `SEKBUDAPEST2026`)
* Every student enters `SEKBUDAPEST2026` as their Shift Code (or clicks `New shift` in Dossier).
* **Guaranteed Uniform Flow:**
  - Because PRNG is deterministic from the shift code, every student encounters the same sequence of customers and faults.
  - **Job 1:** Marika néni's Inspiron 15 with a seized fan (or `disk_full` zero-part fix).
  - **Job 2:** Gergő's gaming laptop or phone with a misleading complaint.
  - **Job 3:** USB-C port lint or CC-pin short requiring careful port cleaning rather than expensive board replacement.
* Students must finish at least 3 tickets, collect their earnings in the till, and watch their reputation meter.

### 00:32 – 00:40 | Teacher Decoder & Class Roster Analysis
* Students click **Dossier (Book icon)** → **Shift Report (SEK7K-)** → click **Copy Hand-in Code**.
* Teacher opens **Teacher Decoder** (`dossier.html` or in-game Teacher view) on the projector.
* Paste student codes in bulk.
* The decoder displays a comparative table:
  - Student Name
  - Jobs Completed & Botched
  - Final Till Balance (Ft) & Reputation
  - Average Stars per Axis: `[Fit | Budget | Speed | Durability | Safety]`
* Sort by lowest axis to identify class-wide misconceptions:
  - If **Budget** is low: Students bought the most expensive part on iPon regardless of use-case.
  - If **Safety** is low: Students forgot to disconnect the battery before probing or used the wrong driver size.
  - If **Speed** is low: Students ran all 4 diagnostic instruments indiscriminately.

### 00:40 – 00:45 | Guided Class Debrief
Key discussion prompts:
1. *"Why did fitting a 2TB Samsung 990 PRO NVMe drive to Marika néni's laptop lose you stars, even though it's technically a great SSD?"*
2. *"Did anyone tell a customer that their device didn't need a replacement part? How did that affect your shop's reputation?"*
3. *"What happens in real life when you replace an iPad screen without testing the ambient light sensor first?"*

---

## 3. Teacher Decoder Reference

The `SEK7K-` hand-in code is an authenticated, base-32 packed report of the student's shift. It encodes:
* Student Name & Shop Name
* Seed & RNG call count (guarantees the run was authentic and not hand-edited)
* Number of jobs done, botched, and comebacks
* Total cash in till (HUF)
* Five-axis point breakdown (0–100 scale per axis)
* Badges earned (e.g., *Honest Refusal*, *Clean Bench*, *Screwdriver Master*)

### Decoder Axis Interpretation Table

| Axis | What a Low Score (< 60) Means | How to Guide the Student |
| :--- | :--- | :--- |
| **Fit** | Overspecified hardware or recommended parts mismatched to customer's stated daily use. | *"Check their background during intake. A student writing essays does not need a Gen4 heatsink drive."* |
| **Budget** | Exceeded customer's budget ceiling or added unjustified labor charges. | *"If the customer has 25,000 Ft, ordering an 18,000 Ft part plus 12,000 Ft labor will anger them."* |
| **Speed** | Missed deadline or ordered parts with 5-day shipping when deadline was 2 days. | *"Check supplier lead times in the market. Local bike courier arrives in 2h; standard post takes 3 days."* |
| **Durability** | Purchased unbranded or 'salvage bin' parts without warranty. | *"Cheap parts fail within a week. When they return, comebacks cost you free labor and reputation."* |
| **Safety** | Stripped screw heads, pried battery with metal spudger, or skipped thermal paste. | *"Use the screw gauge. If a screw is PH00, never force a PH1 or Torx into it."* |

---

## 4. Uniform Seed Guide: `SEKBUDAPEST2026`

When entered in `New shift` (`Shift code` input box):

```
Seed: SEKBUDAPEST2026
Initial Cash: 150,000 Ft
Initial Reputation: 50★
Initial Day: Day 1 (Morning)
```

### Expected Walk-in Progression:
1. **Customer 1 (Marika néni):** Complains laptop is boiling and turning off.
   - *Intake Clue:* Fan makes buzzing / grinding noise.
   - *Honest Diagnostic:* Seized cooling fan.
   - *Correct Action:* Clean heatsink fins + replace 54mm fan or lubricate bearing.
2. **Customer 2 (Bence - University Student):** Laptop won't save files; says "drive broken".
   - *Intake Clue:* "My sister downloaded 60GB of movies onto C: drive."
   - *Honest Diagnostic:* Zero-part fix! Drive is simply 99.8% full.
   - *Correct Action:* Disk cleanup / temp file wipe (Free fix).
3. **Customer 3 (Eszter - Remote Worker):** Phone only charges when the cable is pulled sideways.
   - *Intake Clue:* Carried in pocket of wool coat for 2 years.
   - *Honest Diagnostic:* Compacted pocket lint in USB-C port, or corroded CC configuration channel pin.
   - *Correct Action:* Clean port with wooden pick / alcohol swab.

---

## 5. Printable Student Handout Checklist

Cut or photocopy the slip below for each student workstation:

```
+-------------------------------------------------------------------------------+
|                      TECHOPS BUDAPEST — WORKBENCH RULES                       |
+-------------------------------------------------------------------------------+
| 1. ENTER SHIFT CODE: SEKBUDAPEST2026 before starting.                         |
| 2. INTERVIEW FIRST: Ask at least 2 questions at the counter before unscrewing.|
| 3. CHECK THE SCREWS: Match the bit size. Stripping a screw fails the job.     |
| 4. BATTERY FIRST: Always isolate the battery before touching board components.|
| 5. RESPECT THE BUDGET: Check customer's limit before ordering from iPon/Alza. |
| 6. COPY HAND-IN: At the end of shift, open Dossier -> Copy SEK7K- code.       |
+-------------------------------------------------------------------------------+
```
