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
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'tower_pc', 'imac_m1', 'mbp14_m3', 'steamdeck', 'switch2', 'ps5pro'],
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
        'The trackpad has stopped clicking properly, and it only lasts about forty minutes now.',
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
        battery: { cycles: 380, healthPct: 91, condition: 'Normal', designMah: 2815, currentMah: 2561, note: 'Battery is healthy. It just is not getting charged.' }
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
        'It updated overnight and now it just shows a folder with a question mark on it.',
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
      appliesTo: ['mbp13_2012', 'thinkpad_t480', 'inspiron15', 'iphone12', 'iphone17', 'switch2', 'steamdeck', 'ipad_air'],
      severity: 'critical',
      complaints: [
        'A glass of orange juice went over it. I dried it with a hairdryer and put it in rice and it worked for two days.',
        'It is doing strange things now. Keys typing by themselves, and it gets warm in one corner.'
      ],
      customerTheory: 'They believe the rice fixed it and the new problem is unrelated.',
      readings: {
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
      appliesTo: ['mbp13_2012', 'mba_m1', 'thinkpad_t480', 'inspiron15', 'mbp14_m3', 'steamdeck', 'switch2'],
      severity: 'high',
      noPartNeeded: true,
      complaints: [
        'Completely dead. No light, no sound, no fan, nothing. It is as though it is not a computer any more.',
        'I have left it charging all night and it makes no difference.'
      ],
      customerTheory: 'They have decided the machine is finished and are half expecting you to confirm it.',
      readings: {
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
        'It also will not sleep when I shut the lid any more.'
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
        'It got really slow last Tuesday and a window keeps popping up saying my Mac has three viruses and I have to call a number.',
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
    }
  };

  /** Healthy instrument readings, so that a clean test looks like real data rather than "nothing found". */
  function baseline(machine) {
    var hasHdd = false;
    return {
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
      listen: { note: 'Quiet. No clicking, no grinding.' }
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
      return base;
    }
  };
})(window);
