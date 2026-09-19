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
                     hint: 'For screws that are already rounded. A reverse-threaded bit bites into the ruined head and backs it out. Slow, and the screw is scrap afterwards.' }
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
    charge_port:       { label: 'Free the charge port flex',    tool: 'tripoint-y000', needs: ['interior', 'battery_off'] }
  };

  /** Bench actions that fix things without buying anything. */
  var ACTIONS = {
    lever_battery: {
      id: 'lever_battery', label: 'Lever the pack out slowly', icon: '\ud83e\udd44', tool: 'spudger',
      needsStep: 'battery_connector', labourHours: 1.1, costFt: 0,
      done: 'Worked the spudger under one corner at a time, a millimetre at a time, until the adhesive let go. Forty minutes and no bent cells \u2014 which is the only outcome that matters with a lithium pack.'
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
      isFreeFix: true
    },
    clean_fins: {
      id: 'clean_fins', label: 'Blow out the fin stack', icon: '💨', tool: 'air_can',
      needsStep: 'fan', labourHours: 0.4, costFt: 0,
      done: 'A grey felt mat of dust comes out of the fins in one piece. Airflow through the heat exchanger is restored.'
    },
    scrape_paste: {
      id: 'scrape_paste', label: 'Clean off the old paste', icon: '🧻', tool: 'alcohol_wipe',
      needsStep: 'heatsink', labourHours: 0.3, costFt: 0,
      done: 'The cracked grey crust wipes off the die and the copper cold plate. Both surfaces are mirror-clean.'
    },
    repaste: {
      id: 'repaste', label: 'Apply fresh paste and refit', icon: '💉', tool: 'paste_syringe',
      needsStep: 'heatsink', needsAction: 'scrape_paste', needsPartCat: 'thermal',
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
    }
  };

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

    // Two in three walk-ins are assembled from the shared people vocabulary;
    // the written regulars keep turning up so the shop has familiar faces.
    var customer = opts.customer;
    if (!customer) {
      customer = (shop.rng() < 0.62 && window.TechOpsPeople)
        ? window.TechOpsPeople.generate(shop)
        : shop.pick(pool);
    }
    var machineId = opts.machineId || shop.pick(customer.machines);
    var machine = window.TechOpsMachines.get(machineId);

    var faults = window.TechOpsFaults.forMachine(machine);
    if (!faults.length) {
      // Safety net so a misconfigured machine cannot hand out an empty job —
      // but say so loudly, because silently swapping the machine hides the bug.
      if (window.console) console.warn('[TechOps] no faults registered for "' + machine.id + '" — falling back to inspiron15. Register it in data-faults.js appliesTo.');
      machine = window.TechOpsMachines.get('inspiron15');
      faults = window.TechOpsFaults.forMachine(machine);
    }
    var fault = opts.fault ? window.TechOpsFaults.get(opts.fault) : shop.pick(faults);

    var budget = shop.range(customer.budgetFt[0], customer.budgetFt[1]);
    var urgency = shop.range(customer.urgencyDays[0], customer.urgencyDays[1]);

    return {
      id: 'J' + S.day + '-' + Math.floor(shop.rng() * 9000 + 1000),
      person: customer.generated ? customer : null,
      dayOpened: S.day,
      customerId: customer.id,
      machineId: machine.id,
      faultId: fault.id,
      budgetFt: budget,
      urgencyDays: urgency,
      complaint: shop.pick(fault.complaints),
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
    if (machine.kind === 'desktop' && ticket.openSteps.indexOf('psu_switch') !== -1) f.battery_off = true;
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
    flags: flags,
    canStep: canStep,
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
      if (m.kind === 'desktop') {
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
