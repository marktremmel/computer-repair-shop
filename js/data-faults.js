/**
 * TechOps Budapest — Faults.
 *
 * The customer tells you a symptom. The symptom is not the fault, and
 * sometimes it points at the wrong part entirely. The only way to know
 * is to measure. Three of the ten faults here need no part at all —
 * selling hardware to fix them is the mistake the game is built to catch.
 */
(function (window) {
  'use strict';

  var FAULTS = {
    dying_hdd: {
      id: 'dying_hdd',
      title: 'Failing hard drive',
      appliesTo: ['mbp13_2012', 'inspiron15', 'tower_pc'],
      requiresHdd: true,
      severity: 'high',
      complaints: [
        'It takes like five minutes to turn on. Then the little rainbow wheel just spins forever.',
        'My cousin said it needs more memory. Can you put more memory in it?'
      ],
      customerTheory: 'They are sure it needs more RAM. Almost everybody says this.',
      readings: {
        smart: { health: 'FAILING', reallocated: 1247, pending: 88, hours: 31204, note: 'Reallocated sector count is climbing. Pending sectors means data it cannot read back.' },
        bench: { seqMBps: 41, randIops: 68, latencyMs: 840, note: 'Seek latency over 800 ms. A healthy drive answers in under 15.' },
        listen: { note: 'A rhythmic click every few seconds, then a pause, then the click again.' },
        activity: { memPressurePct: 34, swapGB: 0.2, topProc: 'Finder', topProcMemGB: 0.4, note: 'Memory is fine. It is waiting on the disk, not on RAM.' },
        memtest: { passes: 4, errors: 0, note: 'Memory is clean. Whatever this is, it is not RAM.' }
      },
      fixedBy: { kind: 'part', cat: 'storage' },
      wrongFix: {
        ram: 'You put memory in a machine whose disk is dying. It boots just as slowly, because it was never waiting on RAM.'
      },
      explain: 'SMART is the drive\'s own report card. Reallocated sectors mean it has already moved data off failing areas of the platter; pending sectors mean there is data it currently cannot read. Both climbing at once is a drive with weeks, not years.'
    },

    disk_full: {
      id: 'disk_full',
      title: 'Boot drive completely full',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'imac_m1', 'ipad_air', 'mbp14_m3'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'It keeps saying "Your disk is almost full" and now Pages won\'t even let me save.',
        'I think I need a bigger computer. Everything is broken.'
      ],
      customerTheory: 'They are ready to buy a whole new machine over this.',
      readings: {
        storage_used: { usedPct: 99, freeGB: 2.1, biggest: 'Downloads — 214 GB of duplicated video exports', note: '214 GB of it is one folder of exported videos, most of them saved twice.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 4102, note: 'The drive itself is perfectly healthy.' },
        bench: { seqMBps: 120, randIops: 4200, latencyMs: 9, note: 'Slower than rated — an almost-full SSD has nowhere to write, so it slows down. This recovers when space is freed.' },
        activity: { memPressurePct: 41, swapGB: 3.8, topProc: 'kernel_task', topProcMemGB: 1.2, note: 'Swap is high only because there is no disk space left to swap into.' }
      },
      readingsOn: {
        tablet: {
          storage_used: { usedPct: 99, freeGB: 0.6, biggest: 'Files \u203a Exports \u2014 video, most of it saved twice',
            note: '63.4 of 64 GB used. The biggest thing on it is a folder of exported videos, most of them saved twice under slightly different names.' },
          bench: { seqMBps: 310, randIops: 5100, latencyMs: 6, note: 'Writes have slowed to a crawl \u2014 flash with nowhere empty to write has to erase first.' }
        }
      },
      fixedBy: { kind: 'action', id: 'free_space' },
      wrongFix: {
        storage: 'You sold them a bigger drive to solve a folder of duplicate video exports. It works — and you charged forty thousand forints for something a ten-minute cleanup fixes. They will find out.'
      },
      explain: 'A full SSD is slow for a physical reason: flash can only write to empty blocks, so when the drive is full it has to erase before every write. Free 15% and the speed comes back on its own.'
    },

    ram_starved: {
      id: 'ram_starved',
      title: 'Not enough memory for the workload',
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'tower_pc'],
      severity: 'medium',
      complaints: [
        'It is fine until I open the editing program. Then everything turns to treacle and the fans go mad.',
        'Yesterday it froze for two minutes while I was exporting.'
      ],
      customerTheory: 'They assume the processor is too old.',
      readings: {
        activity: { memPressurePct: 94, swapGB: 14.2, topProc: 'Adobe Premiere Pro', topProcMemGB: 7.1, note: 'Memory pressure is in the red and the machine has pushed 14 GB out to swap. It is using the disk as slow, fake RAM.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 2900, note: 'Drive is healthy.' },
        memtest: { passes: 4, errors: 0, note: 'No errors. The RAM works — there is just not enough of it.' },
        bench: { seqMBps: 540, randIops: 82000, latencyMs: 0.1, note: 'Disk is fast. The stalling is not storage.' },
        thermal: { idleC: 44, loadC: 78, fanRpm: 4100, note: 'Warm under load but well inside spec.' }
      },
      fixedBy: { kind: 'part', cat: 'ram' },
      wrongFix: {
        storage: 'A faster disk makes the swapping less painful but does not stop it. The freezes come back the moment the timeline gets long.'
      },
      explain: 'Memory pressure, not "memory used", is the number that matters. Green means the system is comfortable. Red with gigabytes of swap means it is constantly shuffling data to disk to survive — and that shuffling is what the user feels as freezing.'
    },

    bad_ram_stick: {
      id: 'bad_ram_stick',
      title: 'One failing memory module',
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'tower_pc', 'inspiron15'],
      severity: 'high',
      complaints: [
        'It crashes. Not when I do anything special — just, randomly. Sometimes twice a day, sometimes not for a week.',
        'I already reinstalled the whole operating system and it still does it.'
      ],
      customerTheory: 'They think they caught a virus.',
      readings: {
        memtest: { passes: 4, errors: 1183, failAddr: '0x2F41A008', note: '1183 errors, all in one address range, all on the module in slot B. That is a physically bad chip.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 8800, note: 'Drive is fine.' },
        activity: { memPressurePct: 38, swapGB: 0.4, topProc: 'Safari', topProcMemGB: 1.9, note: 'Nothing unusual while it is up.' },
        thermal: { idleC: 41, loadC: 74, fanRpm: 3600, note: 'Temperatures normal.' },
        visual: { note: 'Nothing obviously wrong inside. Bad RAM does not look like anything.' }
      },
      fixedBy: { kind: 'part', cat: 'ram' },
      wrongFix: {
        storage: 'A new drive and a clean install. The crashes continue, because a bad memory cell corrupts whatever is loaded into it regardless of which disk it came from.'
      },
      explain: 'Random crashes with no pattern, surviving a full OS reinstall, is the classic signature of bad RAM. A memory test writes known patterns to every address and reads them back — the addresses that come back wrong tell you exactly which stick to pull.'
    },

    thermal_paste_dead: {
      id: 'thermal_paste_dead',
      title: 'Dried thermal paste and blocked fins',
      // Not the PS5: it has no paste on the APU. See ps5_liquid_metal.
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'tower_pc', 'imac_m1', 'mbp14_m3', 'steamdeck', 'switch2'],
      severity: 'medium',
      complaints: [
        'It sounds like a hairdryer and then it just switches itself off in the middle of a match.',
        'It has done this since about spring. It used to be quiet.'
      ],
      customerTheory: 'They want you to "put a better fan in it".',
      readings: {
        thermal: { idleC: 62, loadC: 99, fanRpm: 5600, throttleMhz: 800, note: 'Hits 99 °C in forty seconds under load, then clocks down to 800 MHz to survive. That is the stutter they feel.' },
        visual: { note: 'The paste under the heatsink has gone grey and cracked like dry mud. The fin stack behind the fan is packed solid with a felt mat of dust.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 12400, note: 'Drive is healthy.' },
        memtest: { passes: 4, errors: 0, note: 'Memory is clean.' },
        activity: { memPressurePct: 46, swapGB: 0.9, topProc: 'Steam', topProcMemGB: 2.2, note: 'Normal, right up until the thermal throttle kicks in.' }
      },
      fixedBy: { kind: 'action', id: 'repaste', needsPartCat: 'thermal' },
      wrongFix: {
        fan: 'A brand new fan spinning against a fin stack that is still blocked, on a die that is still insulated by dried-out paste. Barely three degrees better.'
      },
      explain: 'Thermal paste fills microscopic gaps between the chip and the heatsink. When it dries it stops conducting, so the heat never reaches the metal — the fan can spin as fast as it likes, it is cooling a heatsink that is not receiving the heat.'
    },

    fan_seized: {
      id: 'fan_seized',
      title: 'Seized cooling fan',
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'tower_pc', 'imac_m1', 'mbp14_m3', 'steamdeck', 'switch2', 'ps5pro'],
      severity: 'high',
      complaints: [
        'There was a horrible grinding noise for a week, and then it went quiet. Now it gets too hot to touch.',
        'Quiet is good though, right?'
      ],
      customerTheory: 'They think the noise stopping means it fixed itself.',
      readings: {
        thermal: { idleC: 78, loadC: 101, fanRpm: 0, throttleMhz: 600, note: 'Fan RPM reads zero while the chip sits at 78 °C doing nothing at all.' },
        visual: { note: 'The fan does not turn when you flick the blades — the bearing has seized solid. There is a burnt smell around the hub.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 9100, note: 'Drive is fine, though heat is not kind to it.' },
        memtest: { passes: 4, errors: 0, note: 'Memory clean.' }
      },
      fixedBy: { kind: 'part', cat: 'fan' },
      wrongFix: {
        thermal: 'Fresh paste on a machine whose fan does not turn. It reaches 99 °C slightly more slowly.'
      },
      explain: 'A fan that got loud and then went silent did not fix itself — the bearing wore out, screamed, and then stopped. Zero RPM at a high temperature is one of the few readings that is unambiguous.'
    },

    battery_swollen: {
      id: 'battery_swollen',
      title: 'Swollen battery',
      appliesTo: ['mbp13_2012', 'mba_m1', 'iphone12', 'inspiron15', 'thinkpad_t480', 'ipad_air', 'mbp14_m3', 'steamdeck', 'switch2', 'iphone17'],
      severity: 'critical',
      complaints: [
        { t: 'The trackpad has stopped clicking properly, and it only lasts about forty minutes now.', kind: ['laptop'] },
        { t: 'The screen has started lifting away from the frame on one side, and it only lasts a couple of hours now.', kind: ['phone', 'tablet'] },
        { t: 'The back has started to bulge and the buttons on one side feel spongy. It barely lasts an hour now.', kind: ['handheld'] },
        'Also the bottom is a bit... curved? It wobbles on the table.'
      ],
      customerTheory: 'They think the trackpad broke and the battery thing is separate.',
      readings: {
        battery: { cycles: 1412, healthPct: 58, condition: 'Service Recommended', designMah: 6700, currentMah: 3886, note: '1412 cycles on a 1000-cycle pack, down to 58% of design capacity.' },
        visual: { note: 'The centre cells are visibly domed — the pack is pressing up against the underside of the trackpad, which is why it will not click. This is a fire risk, not a cosmetic issue.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 15600, note: 'Drive is fine.' },
        thermal: { idleC: 46, loadC: 81, fanRpm: 3900, note: 'Within spec.' }
      },
      fixedBy: { kind: 'part', cat: 'battery' },
      safetyCritical: true,
      wrongFix: {},
      explain: 'A lithium pouch cell swells when its electrolyte breaks down and produces gas. It is pressing on the trackpad from below — that is the "broken trackpad". A swollen pack must never be punctured, bent or charged further; it is the one fault in this shop that can actually start a fire.'
    },

    port_lint: {
      id: 'port_lint',
      title: 'Charge port packed with pocket lint',
      appliesTo: ['iphone12', 'thinkpad_t480', 'mba_m1', 'ipad_air', 'mbp14_m3', 'switch2', 'steamdeck', 'iphone17'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'It only charges if I hold the cable at exactly the right angle and put a book on it.',
        'I have already bought three new cables. None of them work properly.'
      ],
      customerTheory: 'They are certain the port is broken and want it replaced.',
      readings: {
        power: { watts: 0, negotiated: 'none', seats: false, note: 'The plug stops about 2 mm short of home. No data pins make contact, so no charging negotiation happens at all.' },
        visual: { note: 'Shine a light in: a compacted grey felt disc of pocket lint, pressed into a solid pad at the bottom of the port by three years of plugging in.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 6200, note: 'Nothing wrong with the storage.' },
        battery: { cycles: 380, healthPct: 91, condition: 'Normal', designMah: 2815, currentMah: 2561, note: 'Battery is healthy. It just is not getting charged.' },
        meter: {
          vbus: { label: 'USB in', v: '0.00 V',
            note: 'Nothing at all at the port pins with the charger plugged in. The charger is live \u2014 the plug simply never reaches the contacts.' },
          // Same fault on a laptop: the meter's point there is DC-in.
          dcin: { label: 'DC in', v: '0.00 V',
            note: 'No voltage reaching the board from the charger. The brick tests fine on its own \u2014 the plug is stopping short of the pins.' }
        }
      },
      // What the same instruments say once the lint is out.
      after: {
        power: 'the plug clicks home flush. USB-PD negotiated at 9 V / 2.2 A \u2014 about 20 W, full fast charge. The charging icon comes up at once.',
        battery: 'same healthy cell, and now climbing: charging at a normal rate.'
      },
      fixedBy: { kind: 'action', id: 'clean_port' },
      wrongFix: {
        flex: 'You replaced a perfectly good charge port. The new one works — so did the old one, once the lint was out. That was twelve thousand forints of the customer\'s money for nothing.'
      },
      explain: 'Lint does not block the port by being dirty; it compacts into a solid pad that physically stops the plug seating the last two millimetres. The contacts never touch. Every replacement cable fails identically, which is exactly why the customer bought three.'
    },

    cracked_screen: {
      id: 'cracked_screen',
      title: 'Shattered display',
      appliesTo: ['iphone12', 'mbp13_2012', 'ipad_air', 'switch2', 'steamdeck', 'iphone17'],
      severity: 'high',
      complaints: [
        'It went out of my pocket onto the tram tracks. It still works but there is glass in my thumb.',
        'The bottom third does not respond to touch at all any more.'
      ],
      customerTheory: 'No mystery here — but which replacement panel you fit is the whole decision.',
      readings: {
        visual: { note: 'Spiderweb from the lower left corner. Digitiser is dead across the bottom third. The panel itself still lights up, so the connector and the board are fine.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 3300, note: 'Storage fine.' },
        battery: { cycles: 240, healthPct: 94, condition: 'Normal', designMah: 2815, currentMah: 2646, note: 'Battery fine — do not let anyone talk you into replacing it "while it is open" if it does not need it.' },
        power: { watts: 20, negotiated: 'USB-PD 9V/2.2A', seats: true, note: 'Charging normally.' }
      },
      fixedBy: { kind: 'part', cat: 'screen' },
      wrongFix: {},
      explain: 'With a cracked screen the diagnosis is free — the decision is which panel. An aftermarket LCD in an OLED phone is not a fake part, it is a different technology: grey blacks instead of true black, dimmer outdoors, and True Tone gone for good.'
    },

    sd_formatted: {
      id: 'sd_formatted',
      title: 'Card formatted by mistake',
      appliesTo: ['iphone12', 'ipad_air', 'inspiron15', 'mbp13_2012', 'thinkpad_t480', 'mba_m1'],
      severity: 'high',
      noPartNeeded: true,
      complaints: [
        'The camera asked if it should format the card and I pressed yes because I press yes to everything.',
        'Everything from the whole trip was on it. Four hundred photos. Please tell me they are not gone.'
      ],
      customerTheory: 'They think formatting destroyed the photos. It did not — not yet.',
      readings: {
        storage_used: { usedPct: 1, freeGB: 63.4, biggest: 'nothing — the card reads as empty', note: 'The card says it is empty. It is not; the index that lists the files was erased, and the files themselves are still sitting there untouched.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 0, note: 'The card itself is in perfect health. Nothing is broken here.' },
        visual: { note: 'An ordinary SD card with no physical damage at all.' }
      },
      fixedBy: { kind: 'action', id: 'card_recovery' },
      wrongFix: {
        storage: 'You sold them a new card. The photos were on the old one the whole time, and every hour it stayed in the camera made them less recoverable.'
      },
      explain: 'A quick format does not erase photos. It erases the table of contents that says where each photo starts, and marks the space as free. The image data is untouched until something writes over it — which is why the first thing you do is stop using the card.'
    },

    os_wrecked: {
      id: 'os_wrecked',
      title: 'Operating system will not boot',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'imac_m1', 'mbp14_m3'],
      severity: 'high',
      noPartNeeded: true,
      complaints: [
        { t: 'It updated overnight and now it just shows a folder with a question mark on it.', os: ['macos'] },
        { t: 'It updated overnight and now it goes straight to a blue screen that says Automatic Repair, round and round.', os: ['windows'] },
        'I have tried turning it off and on about forty times.'
      ],
      customerTheory: 'They are certain the hard drive has died and want a new one.',
      readings: {
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 6400, note: 'The drive is healthy. It reads and writes perfectly \u2014 there is simply no bootable system on it any more.' },
        bench: { seqMBps: 530, randIops: 71000, latencyMs: 0.1, note: 'Full speed. Nothing mechanical or electrical is wrong.' },
        memtest: { passes: 4, errors: 0, note: 'Memory clean.' },
        visual: { note: 'Nothing wrong inside.' },
        storage_used: { usedPct: 61, freeGB: 180, biggest: 'Users — 190 GB of their files, all still there', note: 'Every one of their files is intact. Only the system is broken.' }
      },
      fixedBy: { kind: 'action', id: 'reinstall_os' },
      wrongFix: {
        storage: 'You replaced a perfectly good drive because it would not boot. It boots now \u2014 on a blank system you could have installed on the old one in an hour, with all their files still on it.'
      },
      explain: 'A machine that will not boot is not the same as a machine with a dead disk. SMART tells you which one you are looking at in about ten seconds. A failed update breaks the system files and leaves every personal file exactly where it was — reinstall over the top and nothing is lost.'
    },

    migration: {
      id: 'migration',
      title: 'New machine, old life',
      appliesTo: ['mba_m1', 'mbp14_m3', 'imac_m1', 'inspiron15'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'I bought this new one but everything I own is still on the old one and I do not know how to move it.',
        'My son said just drag it across but drag what across exactly?'
      ],
      customerTheory: 'They expect to lose everything and have half accepted it.',
      readings: {
        storage_used: { usedPct: 4, freeGB: 480, biggest: 'nothing yet — it is brand new', note: 'The new machine is empty. The question is what comes across and what does not.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 2, note: 'Two hours of use. It is new.' },
        activity: { memPressurePct: 22, swapGB: 0, topProc: 'Finder', topProcMemGB: 0.3, note: 'Nothing running. Nothing wrong.' },
        visual: { note: 'Immaculate. Do not take this one apart.' }
      },
      fixedBy: { kind: 'action', id: 'migrate' },
      wrongFix: {},
      explain: 'Setting a machine up properly is a repair job in every way that matters: the customer cannot do it, it takes real knowledge, and doing it badly costs them everything. Move the files, sign them in, and do not carry across the junk that was slowing the old one down.'
    },

    no_backup: {
      id: 'no_backup',
      title: 'No backup, and they are about to need one',
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'mba_m1'],
      severity: 'medium',
      noPartNeeded: true,
      complaints: [
        'It made a noise. It is probably nothing. Can you just check it?',
        'Everything is on here. My whole business. No, I have not got a copy anywhere.'
      ],
      customerTheory: 'They came in about a noise. The noise is the least of it.',
      readings: {
        smart: { health: 'WARNING', reallocated: 84, pending: 6, hours: 27400, note: '84 reallocated sectors and climbing. This drive is not dead \u2014 but it has started dying, and there is no copy of anything on it.' },
        listen: { note: 'A faint tick every so often. Easy to miss. Not easy to un-hear.' },
        bench: { seqMBps: 310, randIops: 2100, latencyMs: 42, note: 'Slower than it should be, with occasional long pauses where it retries a bad sector.' },
        storage_used: { usedPct: 74, freeGB: 62, biggest: 'Work — 180 GB of invoices, quotes and photos', note: 'Everything they earn with, on one ageing drive, with no copy.' }
      },
      fixedBy: { kind: 'action', id: 'backup_first' },
      wrongFix: {},
      explain: 'A drive with reallocated sectors that is still readable is the best news a customer with no backup will ever get, and they will not understand why. Copy the data off first. Replace the drive second. Doing those in the other order is how people lose a decade of photos.'
    },

    water_damage: {
      id: 'water_damage',
      title: 'Liquid damage',
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'iphone12', 'iphone17', 'switch2', 'steamdeck', 'ipad_air', 'tower_pc'],
      severity: 'critical',
      complaints: [
        'A glass of orange juice went over it. I dried it with a hairdryer and put it in rice and it worked for two days.',
        { t: 'It is doing strange things now. Keys typing by themselves, and it gets warm in one corner.', kind: ['laptop', 'desktop', 'aio'] },
        { t: 'It is doing strange things now. The screen presses things on its own, and it gets warm in one corner.', kind: ['phone', 'tablet'] },
        { t: 'It is doing strange things now. The controls press themselves in menus, and it gets warm in one corner.', kind: ['handheld', 'console'] }
      ],
      customerTheory: 'They believe the rice fixed it and the new problem is unrelated.',
      readings: {
        meter: {
          sysbus: { label: 'System rail', v: '38 \u03a9 to ground', beep: true,
            note: 'Measured with the power off: 38 \u03a9 from the system rail to ground. A healthy rail reads thousands. '
              + 'Current is leaking to ground somewhere \u2014 start at the corroded connector.' },
          vbat: { label: 'Battery rail', v: '41 \u03a9 to ground', beep: true,
            note: 'Power off, 41 \u03a9 from the battery rail to ground where it should be thousands. Something wet is conducting.' }
        },
        visual: { note: 'Corrosion on the board around one corner: dull green-white crust on the pins of two connectors, and the liquid-contact indicator strip has gone bright red.' },
        power: { watts: 12, negotiated: 'USB-PD 5V/2.4A', seats: true, note: 'Charging, but drawing oddly and getting warm at the corner where the corrosion is.' },
        thermal: { idleC: 58, loadC: 86, fanRpm: 3800, note: 'One area runs hot that should not — current is going somewhere it should not go.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 5100, note: 'The drive is fine. The damage is on the board.' },
        memtest: { passes: 4, errors: 0, note: 'Memory passes — today.' }
      },
      fixedBy: { kind: 'action', id: 'clean_corrosion' },
      wrongFix: {
        battery: 'A new battery on a corroded board. The corrosion keeps eating, and it comes back worse in a month.'
      },
      explain: 'Sugary liquid is far worse than water: it leaves a conductive residue that keeps drawing current between things that should be separate, and corrodes for months afterwards. Rice does nothing — it does not pull moisture out of a sealed board. The only real fix is opening it, disconnecting the battery, and cleaning the board with isopropyl alcohol before the corrosion spreads further.'
    },

    dead_no_power: {
      id: 'dead_no_power',
      title: 'No sign of life',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'mbp14_m3', 'steamdeck', 'switch2', 'tower_pc', 'ps5pro'],
      severity: 'high',
      noPartNeeded: true,
      complaints: [
        'Completely dead. No light, no sound, no fan, nothing. It is as though it is not a computer any more.',
        'I have left it charging all night and it makes no difference.'
      ],
      customerTheory: 'They have decided the machine is finished and are half expecting you to confirm it.',
      readings: {
        meter: {
          sysbus: { label: 'System rail', v: '0.00 V',
            note: 'Nothing on the system rail \u2014 yet DC in reads 20 V. Power is reaching the board and not being switched through. '
              + 'The controller that decides when to turn on has latched, which is what a drain-and-reset clears.' },
          rail12: { label: '12 V main', v: '0.00 V',
            note: 'The main rail never came up, but 5 V standby is present. The supply is fine and waiting; the board is not asking it to turn on.' },
          vbat: { label: 'Battery rail', v: '3.84 V',
            note: 'The battery is charged and connected. The power is there; the board just is not starting.' }
        },
        power: { watts: 0, negotiated: 'none', seats: true, note: 'The plug seats and the charger is fine, but the machine draws nothing at all — not even the trickle a sleeping board takes.' },
        battery: { cycles: 340, healthPct: 88, condition: 'Normal', designMah: 6700, currentMah: 5896, note: 'The pack itself holds charge perfectly well. It is simply not being asked for any.' },
        visual: { note: 'No corrosion, no burn marks, no swelling. Nothing wrong that you can see \u2014 which is itself informative.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 3900, note: 'Pulled and read in an enclosure: the drive is perfect.' }
      },
      fixedBy: { kind: 'action', id: 'power_reset' },
      wrongFix: {
        battery: 'A new battery in a machine whose power controller was simply latched up. It would have come back on for nothing.'
      },
      explain: 'A machine that is completely dead is not always a broken machine. The controller that manages power can latch into a state where it refuses to start, and it stays there until it is fully drained of residual charge. Disconnect the battery, hold the power button to bleed the capacitors, reconnect, and a surprising number come straight back. Do this before you quote anyone for a board.'
    },

    no_internet: {
      id: 'no_internet',
      title: 'Full bars, no internet',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'imac_m1', 'mbp14_m3'],
      severity: 'medium',
      noPartNeeded: true,
      netBreak: 'dns',
      complaints: [
        'It says it is connected to the Wi-Fi. Full bars. But nothing loads, not a single page.',
        'My phone works fine on the same Wi-Fi, so it must be the computer.'
      ],
      customerTheory: 'They are convinced the Wi-Fi card has failed and want it replaced.',
      readings: {
        activity: { memPressurePct: 31, swapGB: 0.2, topProc: 'Safari', topProcMemGB: 1.1, note: 'Nothing wrong with the machine itself. It is idle and waiting.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 5200, note: 'Storage fine.' },
        visual: { note: 'Nothing to see. A network fault is not a physical fault.' },
        power: { watts: 30, negotiated: 'USB-PD 9V/3.3A', seats: true, note: 'Charging normally.' }
      },
      fixedBy: { kind: 'action', id: 'fix_dns' },
      wrongFix: {
        flex: 'You replaced a wireless card that was working perfectly. The connection was never the problem.'
      },
      explain: 'A connection is a chain and "connected" only proves the first link. The machine had an address, could reach the router and could reach the internet — but the DNS server it was told to use had stopped answering, so every name lookup failed while every raw address still worked. Ping along the chain in order and the broken link announces itself.'
    },

    router_down: {
      id: 'router_down',
      title: 'Nothing in the house has internet',
      appliesTo: ['mbp13_2012', 'inspiron15', 'imac_m1', 'thinkpad_t480'],
      severity: 'low',
      noPartNeeded: true,
      netBreak: 'isp',
      complaints: [
        'Nothing works. Not the computer, not the telly, not my phone unless I turn the Wi-Fi off.',
        'I assume the computer has given something to the rest of them.'
      ],
      customerTheory: 'They think the computer infected the whole house.',
      readings: {
        activity: { memPressurePct: 28, swapGB: 0.1, topProc: 'Finder', topProcMemGB: 0.4, note: 'The machine is perfectly healthy and perfectly idle.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 8800, note: 'Fine.' },
        visual: { note: 'Nothing wrong with the hardware.' }
      },
      fixedBy: { kind: 'action', id: 'confirm_isp' },
      wrongFix: {
        storage: 'You reinstalled everything on a machine whose only problem was outside the building.'
      },
      explain: 'When every device in a house loses the internet at once, the one thing they share is the way out. The machine can reach the router perfectly; the router cannot reach anything beyond the front door. That is a phone call to the provider, not a repair — and telling the customer so, with the ping trace to show them, is the job.'
    },

    smc_confused: {
      id: 'smc_confused',
      title: 'Hardware controller confused',
      appliesTo: ['mbp13_2012', 'mba_m1', 'mbp14_m3', 'imac_m1'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'The fans run flat out from the moment it starts, even sitting on the desk doing nothing. And the keyboard backlight has stopped.',
        { t: 'It also will not sleep when I shut the lid any more.', kind: ['laptop'] },
        { t: 'It also will not go to sleep on its own any more \u2014 the screen just stays on all night.', kind: ['aio', 'desktop'] }
      ],
      customerTheory: 'They are sure the fan is broken and want a new one fitted.',
      readings: {
        thermal: { idleC: 41, loadC: 72, fanRpm: 6200, note: 'Fans at maximum while the chip sits at 41 \u00b0C. The temperature does not justify the noise at all \u2014 something is telling the fans to run, and it is not the heat.' },
        visual: { note: 'Fan spins freely, fins are clear, paste looks recent. Nothing physically wrong.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 4100, note: 'Drive fine.' },
        battery: { cycles: 260, healthPct: 92, condition: 'Normal', designMah: 6700, currentMah: 6164, note: 'Battery fine, but it is charging oddly \u2014 another thing the same controller handles.' },
        memtest: { passes: 4, errors: 0, note: 'Memory clean.' }
      },
      fixedBy: { kind: 'action', id: 'reset_smc' },
      wrongFix: {
        fan: 'A brand new fan, running flat out for exactly the same reason. Nothing about the noise changes.'
      },
      explain: 'Fans, sleep, backlight, charging and the power button are all handled by one small always-on controller, separate from the main processor. When its stored state goes wrong it keeps insisting on things that make no sense \u2014 full fans on a cold machine is the classic sign. Resetting it costs nothing and takes a minute. Always try it before quoting anyone for a fan.'
    },

    nvram_lost: {
      id: 'nvram_lost',
      title: 'Settings that will not stick',
      appliesTo: ['mbp13_2012', 'mba_m1', 'imac_m1', 'mbp14_m3'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'Every time it starts, the volume is back to maximum and it asks me which disk to start from.',
        'The clock is wrong as well. I set it, and by the next morning it is wrong again.'
      ],
      customerTheory: 'They think it has a virus that resets everything.',
      readings: {
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 7100, note: 'Drive healthy, and the system on it is intact.' },
        storage_used: { usedPct: 58, freeGB: 190, biggest: 'Photos Library — 82 GB', note: 'Nothing unusual in the storage.' },
        activity: { memPressurePct: 33, swapGB: 0.3, topProc: 'Safari', topProcMemGB: 1.2, note: 'Nothing running that should not be.' },
        visual: { note: 'Clean inside. Worth noting the small coin cell on the board \u2014 that is what keeps these settings alive.' }
      },
      fixedBy: { kind: 'action', id: 'reset_nvram' },
      wrongFix: {
        storage: 'A whole new drive and a fresh install. It still forgets the startup disk, because that setting was never on the drive.'
      },
      explain: 'A handful of settings — startup disk, volume, screen resolution, time zone — live in a tiny piece of memory on the board rather than on the drive, so the machine can read them before it has loaded anything. When that memory gets into a bad state it keeps handing back nonsense. Resetting it clears those few settings and nothing else. No files are at risk.'
    },

    locked_out: {
      id: 'locked_out',
      title: 'Locked out of their own machine',
      appliesTo: ['mbp13_2012', 'mba_m1', 'inspiron15', 'thinkpad_t480', 'mbp14_m3'],
      severity: 'medium',
      noPartNeeded: true,
      complaints: [
        'I have forgotten the password. It is my own computer, I have the receipt, I just cannot get in.',
        'My daughter set it up for me four years ago and she does not remember either.'
      ],
      customerTheory: 'They expect to be told everything has to be wiped.',
      readings: {
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 9600, note: 'Drive is healthy and completely readable.' },
        storage_used: { usedPct: 66, freeGB: 150, biggest: 'Users — 210 GB of their documents and photos', note: 'Everything they own is on here, intact and behind one forgotten password.' },
        visual: { note: 'Nothing wrong with it. This is not a hardware problem at all.' }
      },
      fixedBy: { kind: 'action', id: 'reset_password' },
      wrongFix: {
        storage: 'You wiped it and started fresh. They can get in now, and four years of photographs are gone, and none of that was necessary.'
      },
      explain: 'A forgotten password is not a broken machine and almost never needs an erase. Recovery mode has a reset tool; on machines with an account attached there is an online route. The part that matters is the part people skip: proving the machine is actually theirs. A shop that resets passwords without asking for proof is a shop that launders stolen laptops.',
      needsProof: true
    },

    sticky_keys: {
      id: 'sticky_keys',
      title: 'Keys sticking after a spill',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'mbp14_m3'],
      severity: 'low',
      complaints: [
        'Three keys need a proper thump. It was a bit of lemonade, weeks ago, and I wiped it up straight away.',
        'The rest of it is completely fine, which is why I left it so long.'
      ],
      customerTheory: 'They want the whole keyboard replaced and are braced for the price.',
      readings: {
        visual: { note: 'Sugar residue under three keycaps \u2014 slightly tacky, visibly crystalline at the edges of the scissor mechanism. No corrosion anywhere on the board itself.' },
        power: { watts: 30, negotiated: 'USB-PD 9V/3.3A', seats: true, note: 'Charging normally.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 3200, note: 'Fine.' },
        thermal: { idleC: 43, loadC: 75, fanRpm: 3300, note: 'Normal.' }
      },
      fixedBy: { kind: 'action', id: 'clean_keys' },
      wrongFix: {
        screen: 'You replaced a whole top case for three sticky keys. It works, and you charged them for a keyboard, a trackpad and a battery they did not need.'
      },
      explain: 'Sugar is the problem, not water. It dries tacky and glues the scissor mechanism under the cap. On most keyboards the caps lift off with a plastic pick if you are patient, and the mechanism cleans with a little isopropyl. A whole top case is one of the most expensive parts in the machine, and three keys rarely justify it.'
    },

    runaway_process: {
      id: 'runaway_process',
      title: 'Runaway process / scareware',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'imac_m1', 'mbp14_m3'],
      severity: 'medium',
      noPartNeeded: true,
      complaints: [
        { t: 'It got really slow last Tuesday and a window keeps popping up saying my Mac has three viruses and I have to call a number.', os: ['macos'] },
        { t: 'It got really slow last Tuesday and a window keeps popping up saying Windows has three viruses and I have to call a number.', os: ['windows'] },
        'The fan is on all the time even when I am not doing anything.'
      ],
      customerTheory: 'They want you to wipe and reinstall everything, losing all their photos.',
      readings: {
        activity: { memPressurePct: 52, swapGB: 1.1, topProc: 'MacKeeperHelper', topProcMemGB: 2.4, topProcCpuPct: 340, note: 'One process called MacKeeperHelper is eating 340% CPU and it launches itself again after every restart.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 5400, note: 'Drive is healthy.' },
        memtest: { passes: 4, errors: 0, note: 'Memory clean.' },
        thermal: { idleC: 71, loadC: 88, fanRpm: 5200, note: 'Running hot at idle — because it is never actually idle.' },
        visual: { note: 'Nothing wrong with the hardware at all.' }
      },
      fixedBy: { kind: 'action', id: 'kill_process' },
      wrongFix: {
        storage: 'A new drive and a fresh install does remove it — along with every photo they had. There was a two-minute fix.',
        ram: 'More RAM to feed a process that should not be running. The fan is still at full speed.'
      },
      explain: 'A pop-up claiming your computer has exactly three viruses and giving you a phone number is never real. The actual damage is a launch agent that restarts the process on every boot — remove the agent, not the operating system.'
    },

    bent_socket_pins: {
      id: 'bent_socket_pins',
      title: 'Bent socket contacts',
      appliesTo: ['tower_pc'],
      severity: 'critical',
      noPartNeeded: true,
      complaints: [
        'My cousin and I built it on Saturday. You press the button, the fans spin for about half a second, and it clicks off.',
        'There is a little red light on the board next to where it says CPU. We bought the wrong motherboard, did we not.'
      ],
      customerTheory: 'They are sure the board arrived faulty and want you to confirm it so they can send it back.',
      readings: {
        meter: {
          vcore: { label: 'CPU core', v: '0.4 \u03a9 to ground', beep: true,
            note: 'A dead short on the processor supply. Lift the CPU and measure again: if it disappears, the short is in the socket \u2014 two bent contacts touching \u2014 not on the board.' }
        },
        visual: { note: 'Lift the processor and look into the socket under a light: three of the gold contacts in one corner are folded flat and two of them are touching each other. The little triangle on the chip is not where the triangle on the socket is — it went in a quarter turn out and the clamp was forced shut on top of it.' },
        power: { watts: 14, negotiated: 'none', seats: true, note: 'The supply reaches 14 W and cuts. Short-circuit protection trips on the standby rail before anything can boot.' },
        thermal: { idleC: 23, loadC: 23, fanRpm: 0, note: 'Room temperature. It never stays on long enough to make heat.' },
        memtest: { passes: 0, errors: 0, note: 'Cannot run. The memory controller lives in the processor and the processor never comes up.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 2, note: 'Brand new drive, two hours on it from the shop test.' }
      },
      fixedBy: { kind: 'action', id: 'straighten_pins' },
      wrongFix: {
        ram: 'New memory in a socket the processor cannot talk to. Same half-second, same red light.',
        storage: 'A different drive in a machine that never reaches the drive.'
      },
      explain: 'An LGA socket is a bed of several hundred gold springs, each about the thickness of a hair. The processor has no pins at all — the socket does. Force the clamp shut with the chip a quarter turn out and the corner contacts fold flat, and two folded together is a dead short the supply refuses to power. They are straightenable under magnification with a fine tip, patiently, one at a time. It is not a new board, and it is not the customer\'s fault for not knowing that a triangle in a corner was load-bearing.'
    },

    blown_caps: {
      id: 'blown_caps',
      title: 'Failed filter capacitors',
      appliesTo: ['tower_pc'],
      severity: 'high',
      complaints: [
        'It is perfect in the morning. Email, spreadsheets, hours of it. The second my son starts a game it restarts — no warning, no blue screen, just off and back on.',
        'Someone told me the power supply is too small, so I bought a bigger one. It did exactly the same thing.'
      ],
      customerTheory: 'They have already replaced the power supply and are now convinced the graphics card is dying.',
      readings: {
        meter: {
          rail12: { label: '12 V main', v: '12.02 V',
            note: 'Rock steady \u2014 and that is the lesson. A multimeter averages over a fraction of a second, so it cannot see the 460 mV of ripple '
              + 'that appears under load. That takes an oscilloscope, or your eyes on the tops of the capacitors. The right instrument matters as much as the reading.' }
        },
        visual: { note: 'Two of the small aluminium cans in the row beside the processor socket are domed on top instead of flat, and one has crusted brown residue around the vent scoring. The rest of the row is flat and clean, which is what makes these two obvious.' },
        bench: { seqMBps: 505, randIops: 71000, latencyMs: 0.1, note: 'Storage is fine — when it stays on long enough to test.' },
        power: { watts: 410, negotiated: 'ATX 12V', seats: true, ripplemV: 460, note: 'Ripple on the 12 V rail reaches 460 mV under load. The ATX specification allows 120 mV. At idle it sits at 40 mV, which is why it is fine all morning.' },
        thermal: { idleC: 38, loadC: 79, fanRpm: 1500, note: 'Cooling is doing its job. Temperature is not the problem.' },
        memtest: { passes: 2, errors: 0, note: 'Two clean passes, then the machine restarted mid-test. The restart is the symptom, not a memory error.' }
      },
      fixedBy: { kind: 'action', id: 'replace_caps' },
      wrongFix: {
        ram: 'New memory, same restart the moment the graphics card draws current. The memory was never failing — it was being browned out along with everything else.',
        thermal: 'Fresh paste on a machine that is not overheating.'
      },
      explain: 'Those little cans smooth the supply. Under a heavy, spiky load — which is what a game is — a worn capacitor cannot hold the rail steady and the voltage dips below what the processor needs, so the board protects itself and resets. It only shows under load, which is exactly why "it is fine for email" is a clue and not a contradiction. A domed top means the electrolyte inside has boiled and vented. Two capacitors cost about the price of a coffee; the customer had already spent forty thousand forint on a power supply that was never faulty.'
    },

    kernel_task_panic: {
      id: 'kernel_task_panic',
      title: 'Thermal sensor failure',
      // The sensor in question lives on the battery flex, so this is a portable
      // fault. An iMac has no battery and would fail a different sensor entirely.
      appliesTo: ['mbp13_2012', 'mba_m1', 'mbp14_m3'],
      severity: 'high',
      noPartNeeded: true,
      complaints: [
        'It has gone treacle slow. I type and the letters arrive five seconds later. Everything does.',
        'A shop told me it is overheating and needs a new fan. But feel it — it is stone cold. It is cold and it is slow.'
      ],
      customerTheory: 'They have been told it is overheating, and they can feel for themselves that it is not, so they have stopped trusting anybody.',
      readings: {
        activity: { memPressurePct: 34, swapGB: 0.4, topProc: 'kernel_task', topProcMemGB: 1.2, topProcCpuPct: 720, note: 'kernel_task is using 720% CPU. It is not a virus and it is not a runaway app — it is part of the system, and this is what it does on purpose.' },
        thermal: { idleC: 24, loadC: 26, fanRpm: 1100, throttleMhz: 400, note: 'Twenty-four degrees, and the clock is pinned at 400 MHz anyway. The machine is throttling itself hard while being completely cold.' },
        visual: { note: 'No dust, no damage, fins clear, fan spins freely. Nothing here explains anything.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 6100, note: 'Drive fine.' },
        memtest: { passes: 4, errors: 0, note: 'Memory clean.' },
        battery: { cycles: 340, healthPct: 88, condition: 'Normal', designMah: 6700, currentMah: 5896, note: 'Battery health is fine, but the reported temperature field is blank.' }
      },
      fixedBy: { kind: 'action', id: 'reseat_sensor' },
      wrongFix: {
        fan: 'A new fan on a machine whose old fan was perfect. Still cold, still 400 MHz, still unusable.',
        thermal: 'Fresh paste solves an overheating problem. This machine is twenty-four degrees.'
      },
      explain: 'When macOS cannot read a temperature sensor it does not guess and it does not ignore it — it assumes the worst and clamps the processor down to almost nothing so that whatever it cannot see cannot cook. kernel_task eating 700% is the system deliberately occupying the cores so nothing else can generate heat. So the machine is slow *because* it is cold: the sensor on the battery flex has come loose, the reading is missing, and the safety behaviour is working exactly as designed. This is worth knowing in general — a lot of "it is broken" is a protection doing its job over a fault somewhere else entirely.'
    },

    browser_push_spam: {
      id: 'browser_push_spam',
      title: 'Fake system alerts from a website',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'imac_m1', 'mbp14_m3', 'ipad_air'],
      severity: 'medium',
      noPartNeeded: true,
      complaints: [
        'Every twenty seconds a warning slides in from the corner. "5 SYSTEM THREATS FOUND. Renew your antivirus now." It looks exactly like the ones from the computer itself.',
        'I have not clicked it. But my granddaughter says I should pay it before it spreads, and it says my subscription expired, and I never had a subscription.'
      ],
      customerTheory: 'They believe the machine is infected and are frightened of losing everything on it.',
      readings: {
        activity: { memPressurePct: 33, swapGB: 0.2, topProc: 'Safari', topProcMemGB: 1.4, topProcCpuPct: 9, note: 'Nothing is running away. No unusual process, no launch agent, no background installer. The machine is idle.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 3800, note: 'Drive fine.' },
        storage_used: { usedPct: 41, freeGB: 290, biggest: 'Photos Library — 44 GB', note: 'Nothing has been dumped onto the disk.' },
        visual: { note: 'Nothing physical. There is a sticker on the lid from a shop in a shopping centre.' },
        thermal: { idleC: 40, loadC: 72, fanRpm: 2900, note: 'Normal.' }
      },
      fixedBy: { kind: 'action', id: 'revoke_notifications' },
      wrongFix: {
        storage: 'A new drive and a clean install to remove software that was never installed. Every photo gone with it.',
        ram: 'More memory for a machine that is doing nothing.'
      },
      explain: 'Nothing was installed and nothing is infected. At some point somebody clicked Allow on a website\'s request to send notifications, and that site now delivers adverts through the same channel the operating system uses for its own messages — which is exactly why they look identical. That resemblance is the whole scam. The fix is one setting: find the site in the browser\'s notification permissions and remove it. Worth showing the customer where that list lives, because the next site will ask too, and now they know what Allow actually grants.'
    },

    captive_portal_loop: {
      id: 'captive_portal_loop',
      title: 'Stuck behind a hotspot login',
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'mbp14_m3', 'ipad_air'],
      severity: 'low',
      noPartNeeded: true,
      netBreak: 'site',
      complaints: [
        'It works at home. At the caf\u00e9 downstairs it says connected, full signal, and then every single website gives me a certificate warning. A big red one.',
        'It tells me the connection is not private and somebody might be stealing my information, so I close the laptop. My phone is fine on the same Wi-Fi.'
      ],
      customerTheory: 'They think the caf\u00e9 network is hacked and are worried something has already been taken.',
      readings: {
        activity: { memPressurePct: 30, swapGB: 0.1, topProc: 'Safari', topProcMemGB: 0.9, topProcCpuPct: 4, note: 'Idle, waiting on the network.' },
        visual: { note: 'Nothing physical. The wireless card is seated and the antenna leads are on.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 2900, note: 'Drive fine.' },
        power: { watts: 30, negotiated: 'USB-PD 9V/3.3A', seats: true, note: 'Charging normally.' },
        thermal: { idleC: 39, loadC: 70, fanRpm: 2600, note: 'Normal.' }
      },
      fixedBy: { kind: 'action', id: 'clear_portal' },
      wrongFix: {
        flex: 'A new wireless card for a connection that was working the whole time.'
      },
      explain: 'The network is not hacked — it is holding them at the door. A public hotspot intercepts the first request the machine makes and answers with its own login page. That works fine over plain HTTP. Over HTTPS it cannot: the browser asks for the caf\u00e9\'s bank and gets an answer signed by the caf\u00e9\'s router instead, which is precisely the situation a certificate warning exists to report. So the warning is correct and the network is not malicious, and the way out is to make one deliberate unencrypted request so the gateway has something to redirect. The lesson worth leaving them with is the opposite of "ignore the warning": it is *why* it appeared, and that clicking through it on a page that actually matters is the dangerous half.'
    },

    console_full: {
      id: 'console_full',
      title: 'No room left for the game',
      appliesTo: ['ps5pro', 'switch2'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'He got the game for his birthday and it will not install. It downloads for two hours and then says there is not enough space.',
        'The shop said we need the bigger console. We are not buying a second one.'
      ],
      customerTheory: 'They have been told the console is too small and are about to replace a perfectly good machine.',
      readings: {
        storage_used: { usedPct: 97, freeGB: 24, biggest: 'Call of Duty — 248 GB', note: 'Twenty-four gigabytes free out of two terabytes. One shooter is taking 248 GB on its own, and eleven of the installed games have not been launched in over a year.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 3100, note: 'The internal drive is healthy. It is full, which is a different thing.' },
        bench: { seqMBps: 5200, randIops: 210000, latencyMs: 0.05, note: 'Reading and writing at full speed. Nothing wrong with the drive.' },
        thermal: { idleC: 41, loadC: 74, fanRpm: 2100, note: 'Cooling normal.' },
        visual: { note: 'Clean inside. The expansion bay is empty, with the cover still on it.' }
      },
      fixedBy: { kind: 'action', id: 'free_space' },
      wrongFix: {
        storage: 'An expansion drive does work — and it is a real option worth offering. But fitting one without mentioning that eleven unplayed games are taking a terabyte, and letting them believe they had no choice, is selling hardware to avoid a conversation.'
      },
      explain: 'A console that will not install a game is almost never broken. Modern titles are enormous, deleting one is reversible because the licence stays on the account, and a game can be reinstalled any time from the store. Fitting an expansion drive is a legitimate upgrade and sometimes the right call — but the honest order is to show them what is on there first, delete what nobody has opened in a year, and then let them decide whether they still want to spend the money. The difference between an upsell and a good sale is whether they knew they had a choice.'
    },

    charge_port_dead: {
      id: 'charge_port_dead',
      title: 'Damaged charge port',
      appliesTo: ['iphone12', 'iphone17', 'ipad_air', 'switch2', 'steamdeck'],
      severity: 'high',
      complaints: [
        'You have to hold the cable at an angle and not breathe. Last night it did not charge at all and I got to work on four percent.',
        'It started after I left the cable plugged in and the dog pulled the whole thing off the table.'
      ],
      customerTheory: 'They assume the battery has gone, because the thing they notice is that it runs out.',
      readings: {
        meter: {
          vbus: { label: 'USB in', v: '0 \u2013 5.0 V',
            note: 'Jumps between nothing and five volts as you touch the cable. The charger is fine and so is the battery; the contact in the port is not.' }
        },
        power: { watts: 3, negotiated: 'USB 5V/0.5A only', seats: false, note: 'The plug rocks in the socket instead of clicking home, and it only ever negotiates the slowest possible charge. Push it sideways and the wattage jumps, then dies.' },
        visual: { note: 'Under magnification the port shell is splayed on one side and two of the contacts inside are pushed back out of line. This is mechanical damage, not dirt — there is nothing in there to clean out.' },
        battery: { cycles: 260, healthPct: 91, condition: 'Normal', designMah: 3240, currentMah: 2948, note: 'Ninety-one percent health. The battery is in good shape — it is just rarely getting a full charge into it.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 4100, note: 'Storage fine.' },
        thermal: { idleC: 33, loadC: 61, fanRpm: 0, note: 'Normal.' }
      },
      after: {
        power: 'the new port takes the plug with a firm click and holds 9 V / 2.2 A even when you wiggle the cable. Before, it fell back to half an amp.',
        battery: 'the same healthy cell, charging steadily with no drop-outs.'
      },
      fixedBy: { kind: 'part', cat: 'flex' },
      wrongFix: {
        battery: 'A new battery in a device that cannot charge it. It lasts exactly as long as the old one did, because the old one was never the problem — and they have paid for a battery and still cannot plug it in.'
      },
      explain: 'A battery that runs out and a port that will not take charge look identical from the outside, and the customer will almost always name the battery. The two readings that separate them are sitting right next to each other: battery health is fine, and the port will not negotiate more than the fallback half-amp. Pull on a plugged-in cable hard enough and you splay the port shell — after that it makes contact at an angle or not at all. On most phones and handhelds the port is on its own small flex board precisely because it is the part that wears out, so this is a replaceable component and not a new device.'
    },

<<<<<<< HEAD
    ps5_liquid_metal: {
      id: 'ps5_liquid_metal',
      title: 'Liquid metal dried out under the cooler',
      appliesTo: ['ps5pro'],
      severity: 'medium',
      complaints: [
        'It says "Your PS5 is too hot" and switches itself off, always halfway through a long match. It never used to.',
        'The fan is louder than the television now. Somebody online said it is because I stand it upright.'
      ],
      customerTheory: 'They have read that standing it upright ruins the liquid metal, and mostly want to know whether to lay it flat.',
      readings: {
        thermal: { idleC: 58, loadC: 104, fanRpm: 4900, throttleMhz: 1400,
          note: 'The chip reaches 104 \u00b0C a few minutes into a demanding game and the console shuts down to protect itself. The fan is at full speed the whole time \u2014 it is working; the heat is just not reaching the heatsink.' },
        visual: { note: 'The fan and the dust catchers are clean, so this is not dust. With the cooler lifted: the liquid metal has gone grey and grainy along one edge of the die, and a third of the die is bare. A few silver beads have escaped onto the foam barrier round the chip \u2014 none past it.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 7300, note: 'The SSD is fine.' }
      },
      after: {
        thermal: 'peaks at 81 \u00b0C in the same game and holds there. The fan settles to a hum you can talk over.',
        visual: 'a thin mirror film across the whole die, barrier intact, cooler seated evenly.'
      },
      fixedBy: { kind: 'action', id: 'redo_liquid_metal', needsPartCat: 'thermal' },
      wrongFix: {
        fan: 'A new fan on a console whose fan was fine. It spins just as hard at a heatsink that is still not getting the heat.'
      },
      explain: 'The PS5 ships with liquid metal between the chip and the cooler, not paste. It moves heat several times better, and a chip drawing two hundred watts needs it. Over years of heating and cooling it can dry out and pull to one side, leaving part of the die bare. Sony put a foam barrier round the die so escaped beads cannot reach the board, which is why the repair is to swab the old metal out with isopropyl alcohol, check the barrier, and brush on a thin new film. The "never stand it upright" theory is repeated everywhere and is not well supported; age and heat cycles are the usual cause.'
    },

    ps5_rail_short: {
      id: 'ps5_rail_short',
      title: 'Shorted capacitor on the 12 V rail',
      appliesTo: ['ps5pro'],
      severity: 'high',
      complaints: [
        'It beeps once, the light flashes blue for a second, and then nothing. Every single time.',
        'It went like this after the big storm. It was plugged in but switched off.'
      ],
      customerTheory: 'They are sure the power supply has blown and want a new one fitted.',
      readings: {
        meter: {
          rail12: { label: '12 V main', v: '0.3 \u03a9 to ground', beep: true,
            note: 'Power off, continuity mode: the 12 V rail beeps to ground at 0.3 \u03a9. A healthy rail reads thousands. Something on this rail is a dead short \u2014 the supply sees it and shuts down, which is exactly what it should do. '
              + 'Feed a volt into the rail from the bench supply and one part warms up: a ceramic capacitor beside the chip\u2019s voltage regulator.' },
          sb5: { label: '5 V standby', v: '5.03 V', note: 'Standby is up. The supply is alive and waiting \u2014 it is refusing to switch the main rail on into a short.' }
        },
        power: { watts: 0, negotiated: 'mains in, standby up', seats: true,
          note: 'Mains arrives and standby comes up, so the supply is not dead. Press the button: a click, a single beep, and it shuts down in under a second. That is the supply protecting itself.' },
        visual: { note: 'Nothing to see. No burn marks, no swollen parts, no smell. Ceramic capacitors fail short without a visible mark on them, which is why looking will not find this one.' },
        thermal: { idleC: 24, loadC: 24, fanRpm: 0, note: 'It never stays on long enough to warm up. Room temperature; the fan does not even start.' }
      },
      after: {
        power: 'press the button and it stays on. The 12 V rail holds at 12.05 V into a game.',
        thermal: 'boots, runs a game, peaks at 78 \u00b0C. Normal.'
      },
      fixedBy: { kind: 'action', id: 'replace_shorted_cap', needsPartCat: 'caps' },
      wrongFix: {},
      explain: 'A decoupling capacitor is a tiny ceramic part that steadies a rail. When one fails, it usually fails short: a direct path from the rail to ground. The supply is fine and correctly refuses to power a short, so a new supply trips in exactly the same way, and a power reset changes nothing. Nothing is visible. A multimeter finds it in seconds, in continuity mode with the power off. Replace that one capacitor with a part of the same value and voltage rating, and the rail reads thousands of ohms again.'
    },

=======
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
    gpu_cable_wrong_port: {
      id: 'gpu_cable_wrong_port',
      title: 'Monitor plugged into motherboard HDMI',
      appliesTo: ['tower_pc'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'I cleaned behind my desk on Sunday and plugged everything back in. Now all my games run at 4 FPS like a slideshow, but YouTube and email are fine!',
        'I think my graphics card burned out when I vacuumed.'
      ],
      customerTheory: 'They are convinced the dedicated graphics card is dead and are bracing to buy a new GPU.',
      readings: {
        visual: { note: 'Looking at the back of the case settles it immediately: the HDMI cable is plugged into the top motherboard port, while the dedicated NVIDIA RTX graphics card at the bottom sits completely empty.' },
        thermal: { idleC: 36, loadC: 62, fanRpm: 1200, note: 'CPU runs normally; GPU fans are idling at zero RPM because it is not being asked to render anything.' },
        power: { watts: 85, negotiated: 'ATX 12V', seats: true, note: 'Tower draws barely 85 W under 3D games — the dedicated card is never engaging.' },
        bench: { seqMBps: 3400, randIops: 180000, latencyMs: 0.05, note: 'Storage is fast and healthy.' }
      },
      fixedBy: { kind: 'action', id: 'swap_gpu_cable' },
      wrongFix: {
        ram: 'More RAM for a machine that is running games on the CPU graphics chip.',
        thermal: 'New paste on a graphics card that was never plugged in.'
      },
      explain: 'When a PC has a dedicated graphics card, the monitor cable must plug directly into the GPU ports at the bottom of the case, not the motherboard video output at the top. Plugging into the motherboard forces games to run on weak integrated graphics. Moving the cable takes ten seconds and costs zero forints.'
    },

    keyboard_layout_swap: {
      id: 'keyboard_layout_swap',
      title: 'Keyboard layout switched in software',
      appliesTo: ['thinkpad_t480', 'inspiron15', 'mba_m1'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'My password fails every time, but I know it is right! I tried twenty times and it locked me out. The keyboard must be broken.',
        'It happened right after my little brother was playing around with the buttons.'
      ],
      customerTheory: 'They think the keyboard controller has died or keys are sending ghost keystrokes.',
      readings: {
<<<<<<< HEAD
        activity: { memPressurePct: 29, swapGB: 0.1, topProc: 'Browser', topProcMemGB: 0.8, note: 'Every process is normal and the keyboard is registering every press. Whatever is wrong, the machine is not struggling \u2014 the keys are arriving, just not as the letters on them.' },
=======
        activity: { memPressurePct: 29, swapGB: 0.1, topProc: 'SystemSettings', topProcMemGB: 0.8, note: 'Settings shows current active input source is US English (QWERTY), while the physical keyboard is Hungarian (QWERTZ).' },
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
        visual: { note: 'The physical keyboard is in perfect condition. Every keycap is clean, switches rebound crisply, zero liquid residue.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 2400, note: 'Drive fine.' },
        power: { watts: 28, negotiated: 'USB-PD 9V/3A', seats: true, note: 'Normal.' }
      },
      fixedBy: { kind: 'action', id: 'set_keyboard_layout' },
      wrongFix: {
        flex: 'A new keyboard assembly that will type with the exact same swapped letters because the layout is in software.'
      },
<<<<<<< HEAD
      explain: 'The letters printed on a key are only a label. What the key types is decided by the software layout. A Hungarian keyboard has Z and Y the other way round from English, '
        + 'and the key printed 0 sits where English puts the backtick \u2014 so under the wrong layout "Zebra0" types as "Yebra`" and the password fails every time, with nothing broken. '
        + 'On Windows, Alt+Shift or Windows+Space switches layout; on a Mac, Control+Space. Easy to press by accident, and nothing on screen says it happened.'
=======
      explain: 'On Hungarian keyboards, Z and Y are inverted compared to English QWERTY, and number keys carry accented characters (ö, ü, ó). Accidentally pressing Alt+Shift or Windows+Space switches the software layout, causing passwords to fail silently. Toggling it back in Settings solves it with zero parts.'
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
    },

    display_brightness_zero: {
      id: 'display_brightness_zero',
      title: 'Backlight brightness dimmed to zero',
      appliesTo: ['inspiron15', 'thinkpad_t480'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
        'The screen went completely pitch black yesterday. The green power light is on and I hear the fan, but nothing appears on screen.',
        'The shop near the station told me the LCD screen is dead and quoted 55,000 Ft.'
      ],
      customerTheory: 'They expect to buy an expensive replacement display panel.',
      readings: {
        visual: { note: 'Shining a phone flashlight at an angle against the black glass reveals desktop icons, folders and the cursor moving underneath! The LCD matrix is generating images, but the LED backlight brightness is set to 0%.' },
        power: { watts: 22, negotiated: 'USB-PD 20V/1.1A', seats: true, note: 'Machine is awake, booted and drawing power normally.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 3100, note: 'Drive healthy.' },
        thermal: { idleC: 38, loadC: 65, fanRpm: 1800, note: 'Temperatures normal.' }
      },
      fixedBy: { kind: 'action', id: 'restore_brightness' },
      wrongFix: {
        screen: 'Replacing a perfectly working display panel because the brightness shortcut key was pressed.'
      },
<<<<<<< HEAD
      explain: 'A torch held against the glass is the standard test, and it tells you one precise thing: the panel is drawing a picture, and the light behind it is off. '
        + 'That is very often a real hardware fault \u2014 a failed backlight driver, a blown fuse on the board, a damaged cable \u2014 and none of those is fixed by a new screen either. '
        + 'But some laptops let the brightness go all the way to off, and one keypress in the dark can do it. So the order matters: '
        + 'rule out the free explanation before you open the machine, and never quote for a panel when the panel just proved it works.'
=======
      explain: 'Modern LED displays can dim down to complete darkness. Shining a bright light at the panel shows whether the LCD crystals are still displaying content. Pressing the FN brightness key or moving the brightness slider in software illuminates the screen immediately without spending fifty thousand forint on a screen.'
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
    },

    audio_device_swapped: {
      id: 'audio_device_swapped',
      title: 'Sound muted or routed to phantom device',
      appliesTo: ['tower_pc', 'mbp13_2012', 'inspiron15'],
      severity: 'low',
      noPartNeeded: true,
      complaints: [
<<<<<<< HEAD
        { t: 'No sound at all. Games, YouTube and Discord are totally silent. Even the startup chime stopped.', os: ['macos'] },
        { t: 'No sound at all. Games, YouTube and Discord are totally silent. Even the little sound when I plug a USB stick in has gone.', os: ['windows'] },
=======
        'No sound at all. Games, YouTube and Discord are totally silent. Even the startup chime stopped.',
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
        'I unplugged my gaming headset on Sunday and since then the speakers have never worked.'
      ],
      customerTheory: 'They think the audio DAC or amplifier chip on the motherboard is fried.',
      readings: {
<<<<<<< HEAD
        activity: { memPressurePct: 32, swapGB: 0.2, topProc: 'Browser', topProcMemGB: 0.9, topProcCpuPct: 4, note: 'The audio service is running normally and is sending sound out \u2014 to wherever the output is set to go. Nothing here is broken.' },
=======
        activity: { memPressurePct: 32, swapGB: 0.2, topProc: 'coreaudiod', topProcMemGB: 0.5, topProcCpuPct: 1, note: 'Sound settings show default output device is set to disconnected HDMI Digital Audio (Muted), instead of Internal Speakers.' },
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
        visual: { note: 'Speaker cones are intact, audio jack has zero debris or bent contacts.' },
        smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 4400, note: 'Storage fine.' },
        power: { watts: 45, negotiated: 'ATX/DC', seats: true, note: 'Power delivery normal.' }
      },
      fixedBy: { kind: 'action', id: 'set_audio_device' },
      wrongFix: {
        caps: 'Soldering new audio capacitors on a motherboard whose audio was simply muted in software.'
      },
      explain: 'Operating systems switch default audio output when HDMI monitors or headsets are plugged in, and frequently fail to switch back when unplugged. Checking Sound Settings and toggling default output back to Speakers restores sound in ten seconds.'
    }
  };

  /**
   * Where a multimeter can go on this machine, and what a healthy one reads.
   *
   * The test points follow how the machine is actually powered: an ATX supply
   * has a 12 V main rail and a 5 V standby rail; a laptop has 20 V arriving
   * from the charger and a system rail around 12.6 V behind it; a phone or a
   * handheld runs from a single battery rail near 3.8 V. Offering "12 V main
   * rail" on an iPhone would teach something that is not true.
   *
   * `beep` marks a reading taken in continuity mode that would sound.
   */
  function meterBaseline(machine) {
    var gnd = { label: 'Chassis ground', v: '0.1 \u03a9', beep: true,
                note: 'Continuity to the chassis. This is your reference \u2014 every other reading is taken against it.' };
    if (machine.kind === 'desktop' || machine.kind === 'console') {
      return {
        gnd: gnd,
        rail12: { label: '12 V main', v: '12.04 V', note: 'Main rail at 12.04 V. The ATX tolerance is \u00b15 %, so anywhere from 11.4 to 12.6 V is healthy.' },
        sb5:    { label: '5 V standby', v: '5.02 V', note: 'Standby is up. This rail is live whenever the supply is plugged in, even with the machine off.' },
        vcore:  { label: 'CPU core', v: '1.21 V', note: 'Processor core voltage, normal at idle. It moves constantly under load; that is not a fault.' }
      };
    }
    if (machine.kind === 'laptop' || machine.kind === 'aio') {
      return {
        gnd: gnd,
        dcin:   { label: 'DC in', v: '20.1 V', note: 'The charger has negotiated 20 V and is delivering it to the board.' },
        sysbus: { label: 'System rail', v: '12.6 V', note: 'The main system rail, fed from the charger or the battery. On a Mac this is PPBUS_G3H. Healthy.' },
        vcore:  { label: 'CPU core', v: '0.92 V', note: 'Processor core voltage, normal at idle.' }
      };
    }
    return {
      gnd: gnd,
      vbus: { label: 'USB in', v: '5.05 V', note: 'Five volts arriving from the cable, steady.' },
      vbat: { label: 'Battery rail', v: '3.86 V', note: 'The battery rail, where almost everything on the board draws from. 3.86 V is a charged cell.' }
    };
  }

  /** Healthy instrument readings, so that a clean test looks like real data rather than "nothing found". */
  function baseline(machine) {
    // You can only hear a drive that has moving parts in it. On a machine
    // whose storage is soldered flash there is genuinely nothing to listen
    // to, and saying "quiet, no clicking" implied there might have been.
    var couldSpin = !machine.storageSoldered && (machine.storageBuses || []).indexOf('sata3') !== -1;
    return {
      meter: meterBaseline(machine),
      smart: { health: 'GOOD', reallocated: 0, pending: 0, hours: 4200, note: 'No reallocated or pending sectors. This drive is fine.' },
      bench: { seqMBps: 520, randIops: 74000, latencyMs: 0.1, note: 'Normal for the bus in this machine.' },
      memtest: { passes: 4, errors: 0, note: 'Four full passes, zero errors.' },
      thermal: { idleC: 42, loadC: 76, fanRpm: 3400, throttleMhz: 0, note: 'Idles cool, peaks well under the throttle point.' },
      battery: machine.battery
        ? { cycles: 210, healthPct: 93, condition: 'Normal', designMah: 6700, currentMah: 6231, note: 'Healthy for its age.' }
        : { condition: 'N/A', note: 'Desktop — no battery.' },
      power: { watts: 30, negotiated: 'USB-PD 9V/3.3A', seats: true, note: 'Plug seats flush, full negotiated wattage.' },
      storage_used: { usedPct: 54, freeGB: 210, biggest: 'Photos Library — 61 GB', note: 'Plenty of free space.' },
      activity: { memPressurePct: 36, swapGB: 0.3, topProc: 'Safari', topProcMemGB: 1.6, topProcCpuPct: 12, note: 'Memory pressure green, nothing running away.' },
      visual: { note: 'Clean inside. No swelling, no burn marks, no obvious damage.' },
      listen: couldSpin
        ? { note: 'Quiet. No clicking, no grinding — and this one has a 2.5" bay, so there could have been.' }
        : { note: 'Nothing to hear. The storage in this machine is flash soldered to the board — no platters, no head, no bearing. A drive only makes a noise if something in it is turning.' }
    };
  }

  window.TechOpsFaults = {
    all: FAULTS,
    get: function (id) { return FAULTS[id]; },
    /** Faults that can plausibly be seeded into this machine. */
    forMachine: function (machine) {
      return Object.keys(FAULTS).map(function (k) { return FAULTS[k]; }).filter(function (f) {
        if (f.appliesTo.indexOf(machine.id) === -1) return false;
        if (f.requiresHdd && machine.storageBuses.indexOf('sata3') === -1) return false;
        return true;
      });
    },
    baseline: baseline,
    /** Merge the healthy baseline with whatever this fault distorts. */
    readingsFor: function (machine, fault) {
      var base = baseline(machine);
      if (fault && fault.readings) {
        Object.keys(fault.readings).forEach(function (k) {
          base[k] = Object.assign({}, base[k] || {}, fault.readings[k]);
        });
      }
      // Some readings only make sense on one kind of machine: 214 GB of
      // exports cannot be sitting on a 64 GB iPad.
      var on = fault && fault.readingsOn && fault.readingsOn[machine.kind];
      if (on) {
        Object.keys(on).forEach(function (k) {
          base[k] = Object.assign({}, base[k] || {}, on[k]);
        });
      }
      return base;
    }
  };
})(window);
