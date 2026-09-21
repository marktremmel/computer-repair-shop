/**
 * TechOps Budapest — jobs, tools and teardown rules.
 */
(function (window) {
  'use strict';

  var TOOLS = {
    esd_strap:     { id: 'esd_strap', name: 'ESD wrist strap', icon: '⚡', kind: 'safety', hint: 'Grounds you to the bench. Static you cannot feel is enough to kill a chip quietly, weeks later.' },
    'phillips-00': { id: 'phillips-00', name: 'Phillips #00', icon: '🪛', kind: 'driver' },
    'phillips-0':  { id: 'phillips-0',  name: 'Phillips #0',  icon: '🪛', kind: 'driver' },
    'phillips-1':  { id: 'phillips-1',  name: 'Phillips #1',  icon: '🪛', kind: 'driver' },
    'torx-t5':     { id: 'torx-t5',     name: 'Torx T5',      icon: '✳️', kind: 'driver' },
    'torx-t6':     { id: 'torx-t6',     name: 'Torx T6',      icon: '✳️', kind: 'driver' },
    'torx-t20':    { id: 'torx-t20',    name: 'Torx T20',     icon: '✳️', kind: 'driver' },
    'torx-t8':     { id: 'torx-t8',     name: 'Torx T8',      icon: '✳️', kind: 'driver' },
    'pentalobe-p2':{ id: 'pentalobe-p2',name: 'Pentalobe P2', icon: '🌸', kind: 'driver', hint: 'Five-lobed. Apple uses it on the outside of phones specifically so you cannot open them with a normal kit.' },
    'pentalobe-p5':{ id: 'pentalobe-p5',name: 'Pentalobe P5', icon: '🌸', kind: 'driver' },
    'tripoint-y000':{id: 'tripoint-y000',name:'Tri-point Y000',icon:'🔻', kind: 'driver' },
    spudger:       { id: 'spudger',     name: 'Nylon spudger', icon: '🥢', kind: 'hand', hint: 'Plastic on purpose — a metal tool across a connector shorts it.' },
    suction_cup:   { id: 'suction_cup', name: 'Suction cup',   icon: '🟢', kind: 'hand' },
    tweezers:      { id: 'tweezers',    name: 'ESD tweezers',  icon: '🔬', kind: 'hand' },
    pick:          { id: 'pick',        name: 'Wooden pick',   icon: '🪵', kind: 'hand', hint: 'Wood, not metal. A metal pick in a live charge port bridges the contacts.' },
    air_can:       { id: 'air_can',     name: 'Compressed air', icon: '💨', kind: 'hand' },
    alcohol_wipe:  { id: 'alcohol_wipe',name: '99% IPA wipe',  icon: '🧻', kind: 'hand' },
    paste_syringe: { id: 'paste_syringe',name:'Paste syringe', icon: '💉', kind: 'hand' },
    heat_pad:      { id: 'heat_pad',    name: 'Heat pad',      icon: '♨️', kind: 'hand', hint: 'Softens display adhesive. Too hot and you cook the OLED you are trying to save.' },
    'torx-t3':     { id: 'torx-t3',     name: 'Torx T3',       icon: '✳️', kind: 'driver' },
    cutting_wheel: { id: 'cutting_wheel', name: 'Adhesive cutting wheel', icon: '🎡', kind: 'hand',
                     hint: 'A pizza wheel for glue. Runs round the seam at a set depth so it cuts the adhesive and not the display cable behind it.' },
    thin_picks:    { id: 'thin_picks',  name: 'Thin steel picks', icon: '🗡️', kind: 'hand',
                     hint: 'Slid into a heated seam and left in place, one after another, to stop the glue re-bonding behind you.' },
    suction_handles:{id: 'suction_handles', name: 'Suction handles', icon: '🫙', kind: 'hand',
                     hint: 'Two big cups so you can pull a whole glued display straight up without flexing it.' },
    extractor:     { id: 'extractor',   name: 'Screw extractor', icon: '🩹', kind: 'hand',
                     hint: 'For screws that are already rounded. A reverse-threaded bit bites into the ruined head and backs it out. Slow, and the screw is scrap afterwards.' },
    micro_tweezers:{ id: 'micro_tweezers', name: '0.2 mm tweezers', icon: '🧿', kind: 'hand',
                     hint: 'Finer than the ESD pair and non-magnetic, for work you can only really see through the loupe. Socket contacts are about the thickness of a hair.' },
    solder_iron:   { id: 'solder_iron',  name: 'Soldering station', icon: '🔥', kind: 'hand',
                     hint: 'Temperature controlled. Board work means getting heat in and out fast enough to free a joint without lifting the pad underneath it.' },
    multimeter:    { id: 'multimeter',   name: 'Digital multimeter', icon: '📟', kind: 'hand',
                     hint: 'Tests continuity and rail voltages. A continuity beep to ground tells you a rail is shorted before you even power it on.' }
  };

  /**
   * Teardown graph. Each step names the tool it needs and what must already
   * be open. `safetyGate` steps are the ones that will cost you a board if
   * you skip them.
   */
  var STEPS = {
    side_panel:        { label: 'Remove side panel',            tool: 'driver',        needs: [], reveals: 'interior' },
    psu_switch:        { label: 'Switch off and unplug the PSU', tool: null,           needs: [], safetyGate: true,
                         why: 'A desktop PSU keeps the standby rail live even when the machine is "off". Working on a plugged-in board is how motherboards die.' },
    bottom_case:       { label: 'Remove bottom case screws',    tool: 'driver',        needs: [], reveals: 'interior' },
    screen_lift:       { label: 'Heat and lift the display',    tool: 'suction_cup',   needs: [], reveals: 'interior', alsoNeeds: ['heat_pad'] },
    heat_edges:        { label: 'Heat the edges evenly',         tool: 'heat_pad',      needs: [],
                         why: 'The adhesive under this glass only releases at about 80 °C. Cold glass cracks; overheated glass cooks the panel behind it.' },
    pick_seam:         { label: 'Work picks into the seam',      tool: 'thin_picks',    needs: ['heated'],
                         why: 'Leave each pick in as you go. Pull them out and the glue grabs again behind you.' },
    cut_adhesive:      { label: 'Cut the display adhesive',      tool: 'cutting_wheel', needs: [],
                         why: 'Run the wheel all the way round at the set depth. Go deeper and you cut the display cable, which is not a part you can buy.' },
    lift_display:      { label: 'Lift the display off',          tool: 'suction_handles', needs: ['unglued'], reveals: 'interior' },
    battery_connector: { label: 'Disconnect the battery',       tool: 'spudger',       needs: ['interior'], safetyGate: true,
                         why: 'Until this connector is off, the board is live. Every component you touch can short against something and take the logic board with it.' },
    drive_bay:         { label: 'Open the drive bay',           tool: 'driver',        needs: ['interior', 'battery_off'] },
    ram_bay:           { label: 'Release the RAM clips',        tool: null,            needs: ['interior', 'battery_off'] },
    fan:               { label: 'Unscrew the fan',              tool: 'driver',        needs: ['interior', 'battery_off'] },
    heatsink:          { label: 'Unbolt the heatsink',          tool: 'driver',        needs: ['interior', 'battery_off', 'fan'] },
    cooler:            { label: 'Unbolt the CPU cooler',        tool: 'driver',        needs: ['interior', 'battery_off'] },
    cpu:               { label: 'Raise the socket lever',       tool: null,            needs: ['interior', 'cooler'] },
    battery:           { label: 'Pull the battery adhesive',    tool: 'tweezers',      needs: ['interior', 'battery_off'] },
    display_flex:      { label: 'Unclip the display flex',      tool: 'spudger',       needs: ['interior', 'battery_off'] },
    charge_port:       { label: 'Free the charge port flex',    tool: 'tripoint-y000', needs: ['interior', 'battery_off'] },
    // MacBook Neo: the ports are a module on a press connector, and the
    // battery is screwed down. No heat, no pull tabs, no prying.
    usb_board:         { label: 'Unscrew the USB-C port module', tool: 'torx-t5',      needs: ['interior', 'battery_off'],
                         why: 'Four Torx 5IP screws and a press connector under a two-screw cover. The ports are one small module, not part of the logic board.' },
    battery_screws:    { label: 'Unscrew the battery',           tool: 'torx-t5',      needs: ['interior', 'battery_off'],
                         why: 'Eighteen Torx 5IP screws and no adhesive at all. Leave the four tall standoff screws alone \u2014 they hold the frame, not the pack.' }
  };

  /** Bench actions that fix things without buying anything. */
  var ACTIONS = {
    lever_battery: {
      id: 'lever_battery', label: 'Lever the pack out slowly', icon: '\ud83e\udd44', tool: 'spudger',
      needsStep: 'battery_connector', labourHours: 1.1, costFt: 0,
      done: 'Worked the spudger under one corner at a time, a millimetre at a time, until the adhesive let go. Forty minutes and no bent cells \u2014 which is the only outcome that matters with a lithium pack.'
    },
    reconnect_power: {
      id: 'reconnect_power', label: 'Plug the PSU back in and route the loom', icon: '\ud83d\udd0c',
      needsStep: 'psu_switch', onlyMachines: ['tower_pc', 'ps5pro'],
      repeatable: true, labourHours: 0.4, costFt: 0,
      done: '24-pin seated until the latch clicks, loom routed behind the tray and clear of the fan, switch back on. It powers up.'
    },
    reconnect_battery: {
      id: 'reconnect_battery', label: 'Reconnect the battery to boot it', icon: '\u26a1', tool: 'spudger',
      repeatable: true, labourHours: 0.2, costFt: 0,
      done: 'Connector pressed back down until it clicks. The machine can boot again — remember to lift it off before you touch anything else.'
    },
    clean_port: {
      id: 'clean_port', label: 'Scrape the port out', icon: '🪵', tool: 'pick',
      needsOpen: false, labourHours: 0.3, costFt: 0,
      done: 'The lint comes out as one compacted grey disc. The plug now seats with an audible click and the port negotiates full wattage.',
      // What the pick finds when the problem in the port is not lint.
      doneByFault: {
        usbc_cc_short: 'Nothing comes out. There is no lint in there \u2014 the plug was already going all the way in. Whatever is wrong with this port, a pick is not the tool.'
      },
      isFreeFix: true
    },
    // Corrosion on the contacts is not lint: it needs a solvent, not a pick.
    clean_contacts: {
      id: 'clean_contacts', label: 'Scrub the port contacts with IPA', icon: '🧻', tool: 'alcohol_wipe',
      needsOpen: false, labourHours: 0.3, costFt: 0,
      onlyMachines: ['thinkpad_t480', 'mba_m1', 'mbp14_m3', 'switch2', 'steamdeck', 'iphone17', 'ipad_air', 'mbneo'],
      done: 'A few strokes with a fibre brush wet with isopropyl alcohol, and the green crust comes off the contact. It dries in a minute.',
      doneByFault: {
        port_lint: 'The contacts come up bright, but the plug still stops short. The alcohol cleaned what was already clean; the lint packed at the bottom is still there.'
      },
      isFreeFix: true
    },
    clean_fins: {
      id: 'clean_fins', label: 'Blow out the fin stack', icon: '💨', tool: 'air_can',
      needsStep: 'fan', labourHours: 0.4, costFt: 0,
      done: 'A grey felt mat of dust comes out of the fins in one piece. Airflow through the heat exchanger is restored.'
    },
    scrape_paste: {
      id: 'scrape_paste', label: 'Clean off the old paste', icon: '🧻', tool: 'alcohol_wipe',
      // The PS5 has liquid metal on the die, not paste: see clean_lm.
      needsStep: 'heatsink', notMachines: ['ps5pro'], labourHours: 0.3, costFt: 0,
      done: 'The cracked grey crust wipes off the die and the copper cold plate. Both surfaces are mirror-clean.'
    },
    repaste: {
      id: 'repaste', label: 'Apply fresh paste and refit', icon: '💉', tool: 'paste_syringe',
      needsStep: 'heatsink', notMachines: ['ps5pro'], needsAction: 'scrape_paste', needsPartCat: 'thermal',
      labourHours: 0.5, costFt: 0,
      done: 'A pea-sized dot in the centre, heatsink lowered flat and torqued in a cross pattern so the pressure is even.'
    },
    reseat_ram: {
      id: 'reseat_ram', label: 'Reseat the memory', icon: '🤏', tool: null,
      needsStep: 'ram_bay', labourHours: 0.1, costFt: 0,
      done: 'Modules out, contacts checked, clipped back in until both clips snap. Worth trying before you spend anyone\'s money.'
    },
    card_recovery: {
      id: 'card_recovery', label: 'Recover the card', icon: '\ud83d\udcbe', tool: null,
      software: true, labourHours: 1.2, costFt: 0,
      done: '412 photos carved off a card that said it was empty. Filenames gone, every image intact, written to a different disk.',
      isFreeFix: true
    },
    reinstall_os: {
      id: 'reinstall_os', label: 'Reinstall the system over the top', icon: '\u2699\ufe0f', tool: null,
      software: true, labourHours: 1.5, costFt: 0,
      done: 'System reinstalled in place. It boots, and every one of their files is exactly where they left it.',
      isFreeFix: true
    },
    migrate: {
      id: 'migrate', label: 'Set up the new machine', icon: '\u27a1\ufe0f', tool: null,
      software: true, labourHours: 1.8, costFt: 0,
      done: 'Files, mail and accounts moved across, signed in, updated, and none of the junk from the old machine came with them.',
      isFreeFix: true
    },
    backup_first: {
      id: 'backup_first', label: 'Copy everything off before anything else', icon: '\ud83d\udee1\ufe0f', tool: null,
      software: true, labourHours: 1.6, costFt: 0,
      done: '180 GB copied to an external drive and verified before a single other thing was touched. Whatever happens to the drive now, they still have their work.',
      isFreeFix: true
    },
    clean_corrosion: {
      id: 'clean_corrosion', label: 'Clean the corrosion off the board', icon: '\ud83e\uddea', tool: 'alcohol_wipe',
      needsStep: 'battery_connector', labourHours: 1.4, costFt: 0,
      done: 'Board flooded with isopropyl, corrosion brushed off the affected connectors, dried properly. The residue that was quietly eating the traces is gone.'
    },
    power_reset: {
      id: 'power_reset', label: 'Drain it and reset the power controller', icon: '\u26a1', tool: 'spudger',
      needsStep: 'battery_connector', labourHours: 0.4, costFt: 0,
      done: 'Battery off, power button held for thirty seconds to bleed the capacitors, battery back on. It boots \u2014 and it cost nothing but the knowledge of where to press.',
      isFreeFix: true
    },
    fix_dns: {
      id: 'fix_dns', label: 'Point it at a DNS server that answers', icon: '\ud83d\udce1', tool: null,
      software: true, labourHours: 0.4, costFt: 0,
      done: 'Set the resolver to one that responds. Names resolve again, pages load, and nothing was replaced.',
      isFreeFix: true
    },
    confirm_isp: {
      id: 'confirm_isp', label: 'Prove the fault is outside the building', icon: '\ud83c\udfe0', tool: null,
      software: true, labourHours: 0.4, costFt: 0,
      done: 'Traced the chain with the customer watching: everything inside the house answers, nothing beyond the router does. Written down for them to read out to the provider.',
      isFreeFix: true
    },
    reset_smc: {
      id: 'reset_smc', label: 'Reset the hardware controller', icon: '\u26a1',
      software: true, labourHours: 0.3, costFt: 0,
      done: 'Controller reset. Fans drop to idle within seconds, the backlight is back, and it sleeps on the lid again. No parts, no charge beyond the minute it took.',
      isFreeFix: true
    },
    reset_nvram: {
      id: 'reset_nvram', label: 'Clear the stored settings', icon: '\ud83e\uddf9',
      software: true, labourHours: 0.3, costFt: 0,
      done: 'Settings memory cleared and the startup disk set again. Volume, clock and boot disk all stay put now. Nothing on the drive was touched.',
      isFreeFix: true
    },
    reset_password: {
      id: 'reset_password', label: 'Reset the password (with proof of ownership)', icon: '\ud83d\udd11',
      software: true, labourHours: 0.6, costFt: 0,
      done: 'Ownership checked, password reset from recovery, keychain explained. They are back in, and every file is exactly where it was.',
      isFreeFix: true
    },
    clean_keys: {
      id: 'clean_keys', label: 'Lift the caps and clean the mechanisms', icon: '\u2328\ufe0f', tool: 'pick',
      needsStep: null, labourHours: 0.9, costFt: 0,
      done: 'Three caps off, sugar dissolved with isopropyl, mechanisms worked until they moved freely, caps clipped back. All three keys travel properly again.',
      isFreeFix: true
    },
    free_space: {
      id: 'free_space', label: 'Clear the duplicate exports', icon: '🗑️', tool: null,
      software: true, labourHours: 0.4, costFt: 0,
      done: '214 GB of duplicated video exports moved to an external drive and removed. 40% free space restored and the write speed came straight back.',
      isFreeFix: true
    },
    kill_process: {
      id: 'kill_process', label: 'Force quit and remove the launch agent', icon: '🛑', tool: null,
      software: true, labourHours: 0.5, costFt: 0,
      done: 'Process force quit, its LaunchAgent plist removed, and the browser notification permission revoked. It no longer comes back on reboot. Every photo untouched.',
      isFreeFix: true
    },
    straighten_pins: {
      id: 'straighten_pins', label: 'Straighten the socket contacts', icon: '🧿', tool: 'micro_tweezers',
      // Only machines with a socket to bend. A console's processor is soldered.
      needsStep: 'cpu', onlyMachines: ['tower_pc'], labourHours: 1.6, costFt: 0,
      done: 'Five contacts coaxed back upright under the loupe, one at a time, checked against the rows either side. Processor seated with the triangle in the corner where it belongs. It posts first try.',
      isFreeFix: true
    },
    replace_caps: {
      id: 'replace_caps', label: 'Desolder and replace the failed capacitors', icon: '🔥', tool: 'solder_iron',
      needsStep: 'side_panel', onlyMachines: ['tower_pc'], needsPartCat: 'caps', labourHours: 2.2, costFt: 0,
      done: 'Both domed capacitors out, pads cleaned, new low-ESR parts in with the polarity stripe the right way round. Ripple on the 12 V rail is back under 60 mV and it holds through an hour of load.'
    },
    clean_lm: {
      id: 'clean_lm', label: 'Swab out the old liquid metal', icon: '🧻', tool: 'alcohol_wipe',
      needsStep: 'cooler', onlyMachines: ['ps5pro'], labourHours: 0.5, costFt: 0,
      done: 'The grey crust and the loose beads come up on isopropyl swabs, a bead at a time. The foam barrier round the die is whole \u2014 nothing got past it onto the board.'
    },
    redo_liquid_metal: {
      id: 'redo_liquid_metal', label: 'Brush on a new film and refit the cooler', icon: '💉', tool: 'paste_syringe',
      needsStep: 'cooler', needsAction: 'clean_lm', needsPartCat: 'thermal', onlyMachines: ['ps5pro'],
      labourHours: 0.6, costFt: 0,
      done: 'A thin mirror film worked across the whole die and a touch on the cooler plate, barrier checked, cooler lowered flat and tightened evenly.'
    },
    replace_shorted_cap: {
      id: 'replace_shorted_cap', label: 'Lift the shorted capacitor and fit a new one', icon: '🔥', tool: 'solder_iron',
      needsStep: 'cooler', onlyMachines: ['ps5pro', 'thinkpad_t480'], needsPartCat: 'caps', labourHours: 1.4, costFt: 0,
      done: 'The shorted part is off with hot tweezers, and the rail reads thousands of ohms to ground again. A new capacitor of the same value and voltage rating sits in its place.'
    },
    reseat_sensor: {
      id: 'reseat_sensor', label: 'Reseat the battery sensor flex', icon: '🌡️', tool: 'spudger',
      // The sensor is on the battery flex, so this needs a machine with a pack.
      needsStep: 'battery_connector', onlyMachines: ['mbp13_2012', 'mba_m1', 'mbp14_m3'],
      labourHours: 0.7, costFt: 0,
      done: 'The sensor flex was sitting half out of its socket. Reseated until it clicked, battery back on. The temperature reads again, kernel_task drops to nothing, and the machine is instantly quick.',
      isFreeFix: true
    },
    revoke_notifications: {
      id: 'revoke_notifications', label: 'Remove the site\'s notification permission', icon: '🔕',
      software: true, labourHours: 0.4, costFt: 0,
      done: 'Rogue origin found in the notification list and removed, and the customer shown where that list lives so they can check it themselves. Nothing was installed, so nothing had to be uninstalled.',
      isFreeFix: true
    },
    remove_extension: {
      id: 'remove_extension', label: 'Remove the deceptive browser extension', icon: '🧩',
      software: true, labourHours: 0.3, costFt: 0,
      done: 'Rogue shopping assistant / PDF converter extension uninstalled from the browser. Search provider restored to normal, unauthorized webRequest traffic intercepts removed. No hardware or costly antivirus needed.',
      isFreeFix: true
    },
    clear_portal: {
      id: 'clear_portal', label: 'Open the hotspot gateway over plain HTTP', icon: '🚪',
      software: true, labourHours: 0.3, costFt: 0,
      done: 'One deliberate unencrypted request, the login page appeared, terms accepted. Every site loads normally and the certificate warnings are gone — and they now know what the warning was actually telling them.',
      isFreeFix: true
    },
    swap_gpu_cable: {
      id: 'swap_gpu_cable', label: 'Move HDMI cable to dedicated graphics card port', icon: '🔌',
      needsOpen: false, onlyMachines: ['tower_pc'], labourHours: 0.2, costFt: 0,
      done: 'Cable moved down 15 cm from the motherboard iGPU port to the dedicated graphics card port. Dedicated GPU renders display output at full frame rates.',
      isFreeFix: true
    },
    set_keyboard_layout: {
      id: 'set_keyboard_layout', label: 'Switch keyboard layout back to Hungarian QWERTZ', icon: '⌨️',
      software: true, labourHours: 0.2, costFt: 0,
      done: 'Input source switched from English US (QWERTY) back to Hungarian (QWERTZ). Z and Y return to their labeled places, accents and numbers match keycaps, login succeeds.',
      isFreeFix: true
    },
    restore_brightness: {
      id: 'restore_brightness', label: 'Restore display brightness slider / FN backlight', icon: '☀️',
      software: true, labourHours: 0.1, costFt: 0,
      done: 'Brightness level restored from 0% back to 80%. Backlight LED illuminates the panel brightly, full picture visible.',
      isFreeFix: true
    },
    set_audio_device: {
      id: 'set_audio_device', label: 'Switch audio output device to internal speakers', icon: '🔊',
      software: true, labourHours: 0.2, costFt: 0,
      done: 'Default sound output switched from disconnected HDMI audio back to internal stereo speakers, unmuted. Audio playback restored clearly.',
      isFreeFix: true
    }
  };

  /**
   * What the customer says, for this machine.
   *
   * A complaint is a plain string when it fits anything, or
   * `{ t, os: [...] }` / `{ t, kind: [...] }` when it only makes sense on some
   * machines. Complaints used to be picked from the fault alone, so a Switch
   * came in with a trackpad that would not click and a ThinkPad showed the
   * Mac's flashing question-mark folder — exactly the kind of detail a
   * student who owns one of these notices, and stops trusting the rest.
   */
  function complaintFits(c, machine) {
    if (typeof c === 'string') return true;
    if (c.os && c.os.indexOf(machine.os) === -1) return false;
    if (c.kind && c.kind.indexOf(machine.kind) === -1) return false;
    return true;
  }
  function complaintFor(shop, fault, machine) {
    var fits = fault.complaints.filter(function (c) { return complaintFits(c, machine); });
    var c = shop.pick(fits.length ? fits : fault.complaints);
    return typeof c === 'string' ? c : c.t;
  }

  /*
   * What each named shift code actually does. These notes are shown to
   * students in the dossier, so a note that promises "phones and tablets" has
   * to produce phones and tablets — they used to be plain seeds with
   * descriptions nothing implemented. Any other word is still a plain seed.
   *
   * machine(m) → may this machine walk in; fault(f) → a preferred fault, taken
   * `share` of the time; budget/urgency scale what the customer brings.
   */
  var SHIFT_PROFILES = {
    BUDAPEST:  { note: 'The default. A broad mix \u2014 good for a first lesson.' },
    DUNA:      { note: 'Tight deadlines. Delivery time becomes part of every price.',
                 urgency: 0.5 },
    FILLER:    { note: 'Low budgets throughout. Forces the cheap-versus-lasting argument.',
                 budget: 0.6 },
    PARLAMENT: { note: 'Older machines only (2019 and earlier). Lots of "is this even worth fixing?".',
                 machine: function (m) { return m.year <= 2019; } },
    METRO:     { note: 'Phones and tablets only. Glued-shut teardowns and screen choices.',
                 machine: function (m) { return m.kind === 'phone' || m.kind === 'tablet'; } },
    SZIGET:    { note: 'Money about, deadlines loose. Over-specification is the trap here.',
                 budget: 1.6, urgency: 1.6 },
    LANCHID:   { note: 'Mostly faults that need no parts at all. Tests whether you can say so.',
                 fault: function (f) { return !!f.noPartNeeded; }, share: 0.8 },
    KELETI:    { note: 'A second broad mix, for once the class knows the loop.' }
  };
  function profileFor(shop) {
    return SHIFT_PROFILES[String((shop.state && shop.state.shiftCode) || '').toUpperCase()] || null;
  }

  function newTicket(shop, opts) {
    opts = opts || {};
    var S = shop.state;

    // Reputation gates who walks in: a bad shop gets the desperate and the cheap.
    var pool = window.TechOpsCustomers.all.slice();
    if (S.reputation < 35) {
      pool = pool.filter(function (c) { return c.useCase === 'reseller' || c.useCase === 'student' || c.useCase === 'email'; });
    } else if (S.reputation > 75) {
      // Word gets around: the people with real work and real money show up.
      pool = pool.concat(pool.filter(function (c) { return c.useCase === 'video' || c.useCase === 'office'; }));
    }

    // Word of mouth, person by person: somebody who was happy last time comes
    // back more often. (Somebody who was not still comes back — they are the
    // ones who teach you something.)
    var CM = window.TechOpsCustomers;
    if (CM && CM.memory) {
      pool = pool.concat(pool.filter(function (c) { var m = CM.memory(c, S); return m && m.mood === 'happy'; }));
    }

    // Two in three walk-ins are assembled from the shared people vocabulary;
    // the written regulars keep turning up so the shop has familiar faces.
    var customer = opts.customer;
    if (!customer) {
      customer = (shop.rng() < 0.62 && window.TechOpsPeople)
        ? window.TechOpsPeople.generate(shop)
        : shop.pick(pool);
    }
    var prof = profileFor(shop);
    var machineId = opts.machineId;
    if (!machineId && prof && prof.machine) {
      // Keep the customer's own machine if it fits the shift; otherwise they
      // bring one that does.
      var M = window.TechOpsMachines;
      var own = customer.machines.filter(function (id) { return prof.machine(M.get(id)); });
      machineId = own.length ? shop.pick(own)
        : shop.pick(M.list().filter(prof.machine).map(function (m) { return m.id; }));
    }
    machineId = machineId || shop.pick(customer.machines);
    var machine = window.TechOpsMachines.get(machineId);

    var faults = window.TechOpsFaults.forMachine(machine);
    if (!faults.length) {
      // Safety net so a misconfigured machine cannot hand out an empty job —
      // but say so loudly, because silently swapping the machine hides the bug.
      if (window.console) console.warn('[TechOps] no faults registered for "' + machine.id + '" — falling back to inspiron15. Register it in data-faults.js appliesTo.');
      machine = window.TechOpsMachines.get('inspiron15');
      faults = window.TechOpsFaults.forMachine(machine);
    }
    var fault = opts.fault ? window.TechOpsFaults.get(opts.fault) : null;
    if (!fault && prof && prof.fault) {
      var pref = faults.filter(prof.fault);
      if (pref.length && shop.rng() < (prof.share || 1)) fault = shop.pick(pref);
    }
    fault = fault || shop.pick(faults);

    var budget = shop.range(customer.budgetFt[0], customer.budgetFt[1]);
    var urgency = shop.range(customer.urgencyDays[0], customer.urgencyDays[1]);
    // What they remember changes what they bring: trust stretches a budget,
    // a bad experience shortens the patience.
    var mem = CM && CM.memory ? CM.memory(customer, S) : null;
    if (mem && !opts.warranty) {
      if (mem.mood === 'happy') budget = Math.round(budget * 1.15 / 500) * 500;
      if (mem.mood === 'sore') urgency = Math.max(1, urgency - 1);
    }
    if (prof && prof.budget && !opts.warranty) budget = Math.round(budget * prof.budget / 500) * 500;
    if (prof && prof.urgency && !opts.warranty) urgency = Math.max(1, Math.round(urgency * prof.urgency));

    return {
      id: 'J' + S.day + '-' + Math.floor(shop.rng() * 9000 + 1000),
      person: customer.generated ? customer : null,
      dayOpened: S.day,
      customerId: customer.id,
      machineId: machine.id,
      faultId: fault.id,
      budgetFt: budget,
      urgencyDays: urgency,
      complaint: complaintFor(shop, fault, machine),
      // Roughly a third of machines have been opened before, badly.
      priorRepair: (function () {
        var r = shop.rng();
        return r < 0.12 ? 'stripped' : r < 0.22 ? 'wrong_screws' : r < 0.30 ? 'missing' : null;
      })(),
      // Where the network chain breaks, when the job is a connectivity one.
      netBreak: (fault && fault.netBreak) || shop.pick(['router', 'dns', 'isp']),
      // progress
      asked: [],
      theory: null,
      testsRun: [],
      openSteps: [],
      strippedScrews: 0,
      esdOn: false,
      batteryDisconnected: false,
      boardDamaged: false,
      actionsDone: [],
      installed: [],       // { partId, cat }
      removed: [],
      partsCostFt: 0,
      labourHours: 0,
      daysWaited: 0,
      warranty: !!opts.warranty,
      originJobId: opts.originJobId || null,
      closed: false
    };
  }

  /** Which capability flags the current teardown state has unlocked. */
  function flags(ticket) {
    var f = {};
    ticket.openSteps.forEach(function (s) {
      f[s] = true;
      var def = STEPS[s];
      if (def && def.reveals) f[def.reveals] = true;
    });
    if (ticket.batteryDisconnected) f.battery_off = true;
    var machine = window.TechOpsMachines.get(ticket.machineId);
    if ((machine.kind === 'desktop' || machine.kind === 'console')
        && ticket.openSteps.indexOf('psu_switch') !== -1
        && ticket.openSteps.indexOf('reconnect_power') === -1) f.battery_off = true;
    if (ticket.openSteps.indexOf('heat_edges') !== -1) f.heated = true;
    if (ticket.openSteps.indexOf('pick_seam') !== -1 || ticket.openSteps.indexOf('cut_adhesive') !== -1) f.unglued = true;
    if (!machine.battery) f.battery_off = true;          // no pack to disconnect
    return f;
  }

  /** Can this teardown step be performed right now? */
  function canStep(ticket, stepId) {
    var def = STEPS[stepId];
    if (!def) return { ok: false, why: 'Not a step on this machine.' };
    if (ticket.openSteps.indexOf(stepId) !== -1) return { ok: false, why: 'Already done.' };
    var f = flags(ticket);
    for (var i = 0; i < def.needs.length; i++) {
      if (!f[def.needs[i]]) {
        return { ok: false, why: def.needs[i] === 'battery_off'
          ? 'The battery is still connected. Disconnect it before you take anything else out — the board is live until you do.'
          : 'You have to open the ' + (def.needs[i] === 'interior' ? 'case' : def.needs[i].replace(/_/g, ' ')) + ' first.' };
      }
    }
    return { ok: true };
  }

  window.TechOpsJobs = {
    TOOLS: TOOLS,
    STEPS: STEPS,
    ACTIONS: ACTIONS,
    newTicket: newTicket,
    SHIFT_PROFILES: SHIFT_PROFILES,
    flags: flags,
    canStep: canStep,
    complaintFits: complaintFits,

    /**
     * Put right any saved ticket whose complaint no longer fits its machine.
     *
     * A complaint is written into the ticket when the customer walks in, so a
     * save from before a complaint was corrected keeps the old wording — a
     * Switch still describing its trackpad — until that customer is served.
     * Run on load: anything that does not fit is re-picked from the ones
     * that do. Only the words change; the fault is the same fault.
     */
    repairComplaints: function (shop) {
      var S = shop.state, fixed = 0;
      var tickets = (S.queue || []).slice();
      if (S.ticket) tickets.push(S.ticket);
      tickets.forEach(function (t) {
        var f = window.TechOpsFaults.get(t.faultId);
        var m = window.TechOpsMachines.get(t.machineId);
        if (!f || !m || t.warranty) return;
        var fitting = f.complaints.filter(function (c) { return complaintFits(c, m); })
          .map(function (c) { return typeof c === 'string' ? c : c.t; });
        if (fitting.length && fitting.indexOf(t.complaint) === -1) {
          t.complaint = fitting[Math.floor(Math.random() * fitting.length)];
          fixed++;
        }
      });
      return fixed;
    },

    /**
     * How much trade a shop with this name actually sees.
     *
     * Reputation used to change only *who* walked in, never how many, so a
     * shop everyone warns their friends about got exactly as much work as a
     * good one. Cutting corners then paid, straightforwardly, which is the
     * opposite of the argument this material is making. A bad name costs you
     * customers, and customers are the only thing the shop runs on.
     *
     * There is always at least one waiting, because a shop with no way back is
     * a dead end, not a lesson.
     */
    footfall: function (shop) {
      var rep = shop.state.reputation;
      var perks = shop.state.perks || {};
      var bonus = (perks.footfall || 0) >= 0.4 ? 2 : (perks.footfall || 0) >= 0.15 ? 1 : 0;
      // Two separate things. How many people are waiting is a *choice* —
      // which budget, which deadline, which machine you know — and choosing
      // between three is part of the game, so an ordinary shop keeps it.
      // How long until the next group walks in is what a bad name costs:
      // `quietDays` is spent after every job, not only when you press wait.
      // Tying the two together left good players with one customer and no
      // choice, and letting both go made cutting corners pay again.
      var waiting = rep >= 25 ? 3 : 2;
      var quietDays = rep >= 55 ? 1 : rep >= 40 ? 2 : rep >= 25 ? 3 : 4;
      if (bonus) quietDays = Math.max(1, quietDays - 1);
      return {
        waiting: Math.min(4, waiting + bonus),
        quietDays: quietDays,
        why: rep >= 72 ? 'Word of mouth is doing the work — people are asking for you by name.'
           : rep >= 55 ? 'A normal day. Pick the job that suits you — or pass on all of them and wait for the next lot.'
           : rep >= 40 ? 'Slower than it should be. After each job the shop sits quiet for a day before anyone new comes in.'
           : rep >= 25 ? 'Thin. People are reading the reviews first, and the quiet days between customers add up.'
           : 'Almost nobody comes in any more. The reviews have done that, and only better work will undo it.'
      };
    },

    /**
     * The teardown step an action actually needs *on this machine*.
     *
     * Actions name the step in laptop language, because most machines are
     * laptops. A tower and a console reach the same place by a different
     * route: their heatsink is the CPU cooler, and the way you make the board
     * safe is switching the PSU off at the wall rather than lifting a battery
     * connector. Same procedure, different noun.
     *
     * This lives here, alone, on purpose. The alias used to be written out at
     * each call site, and a call site that forgot it silently hid the action.
     */
    resolveStep: function (action, machine) {
      var want = action && action.needsStep;
      if (!want || !machine || !machine.teardown) return want || null;
      if (machine.teardown.indexOf(want) !== -1) return want;
      if (want === 'heatsink' && machine.teardown.indexOf('cooler') !== -1) return 'cooler';
      // A tower's fan is on the cooler, so it is reached the same way. Without
      // this the fin stack was unreachable and every tower repaste came back.
      if (want === 'fan' && machine.teardown.indexOf('fan') === -1
          && machine.teardown.indexOf('cooler') !== -1) return 'cooler';
      if (want === 'battery_connector' && !machine.battery
          && machine.teardown.indexOf('psu_switch') !== -1) return 'psu_switch';
      // Laptops have no 'cooler' step; the board rails are reached once the battery is isolated.
      if (want === 'cooler' && machine.teardown.indexOf('cooler') === -1
          && machine.teardown.indexOf('battery_connector') !== -1) return 'battery_connector';
      return want;
    },

    /**
     * Does this machine have any route to that action's prerequisite step at
     * all? `onlyMachines` additionally pins an action to the machines where it
     * is physically meaningful — straightening socket contacts is not an
     * option on a console whose processor is soldered down.
     */
    hasStepFor: function (action, machine) {
      if (!action) return true;
      if (action.onlyMachines && action.onlyMachines.indexOf(machine.id) === -1) return false;
      if (action.notMachines && action.notMachines.indexOf(machine.id) !== -1) return false;
      var want = action.needsStep;
      if (!want) return true;
      return machine.teardown.indexOf(this.resolveStep(action, machine)) !== -1;
    },
    customer: function (t) {
      return (t && (t.person || window.TechOpsCustomers.get(t.customerId))) || window.TechOpsCustomers.all[0];
    },
    machine: function (t) { return window.TechOpsMachines.get(t.machineId); },
    fault: function (t) { return window.TechOpsFaults.get(t.faultId); },
    useCase: function (t) { return window.TechOpsCustomers.useCase(this.customer(t).useCase); },
    /**
     * Can the software side be used right now? A board with the battery lifted
     * off is dead, so every macOS instrument is unavailable until it goes back on.
     */
    canRunSoftware: function (t) {
      var m = this.machine(t);
      if (t.boardDamaged) return { ok: false, why: 'The board is dead. Nothing is going to boot.' };
      if (m.kind === 'desktop' || m.kind === 'console') {
        if (t.openSteps.indexOf('psu_switch') !== -1 && t.openSteps.indexOf('reconnect_power') === -1) {
          return { ok: false, why: 'You switched the power supply off at the wall to work on it safely. It will not boot until you plug it back in.' };
        }
        return { ok: true };
      }
      if (t.batteryDisconnected) {
        return { ok: false, why: 'The battery connector is lifted off, so the board has no power at all. Reconnect it before you can boot this machine again.' };
      }
      return { ok: true };
    },

    /** A shop day is six hours on the bench. Work is time, and time is the deadline. */
    HOURS_PER_DAY: 6,
    /**
     * Six hours of work is a day. Seven hours is two days, because the seventh
     * hour happens tomorrow — rounding down was handing out a free working day
     * and made running every instrument cost nothing.
     */
    benchDays: function (t) { return Math.ceil((t.labourHours || 0) / 6); },
    /** What the customer actually experiences: delivery waits plus your bench time. */
    turnaroundDays: function (t) {
      return t.daysWaited + Math.ceil((t.labourHours || 0) / 6);
    }
  };
})(window);
