/**
 * TechOps Budapest — Machine catalog.
 *
 * Every machine carries the constraints that make a parts decision real:
 * which storage bus it actually has, what RAM it accepts, whether anything
 * is soldered down, and which screwdriver opens it. A part that ignores
 * these does not "score badly" — it physically does not fit.
 */
(function (window) {
  'use strict';

  /*
   * `os` is what the machine actually runs, and the software procedures have
   * to read it. A Dell and a ThinkPad were being handed macOS Recovery and
   * told to hold Command and R, which is not a thing that happens on a
   * Windows laptop — it is also the one key combination that reloads the
   * browser, so the instruction was wrong twice over.
   */

  var MACHINES = {
    mbp13_2012: {
      id: 'mbp13_2012',
      os: 'macos',
      name: 'MacBook Pro 13" (Mid 2012)',
      kind: 'laptop',
      icon: '💻',
      year: 2012,
      blurb: 'The last MacBook you could actually open and upgrade. Still everywhere in Hungarian classrooms.',
      // --- storage ---
      storageBuses: ['sata3'],          // 6 Gb/s, ~550 MB/s ceiling
      storageForm: '2.5in',
      storageSoldered: false,
      // --- memory ---
      ramType: 'ddr3-1600',
      ramForm: 'sodimm',
      ramSlots: 2,
      ramMaxGB: 16,
      ramSoldered: false,
      // --- physical ---
      screws: ['phillips-00', 'torx-t6'],
      display: { size: 13.3, res: '1280x800', hz: 60, panel: 'TN', trueTone: false },
      battery: { model: 'A1322', designCycles: 1000 },
      thermal: { tdpW: 35, pasteAllowed: ['standard', 'premium'] },
      teardown: ['bottom_case', 'battery_connector', 'drive_bay', 'ram_bay', 'fan', 'heatsink']
    },

    mba_m1: {
      id: 'mba_m1',
      os: 'macos',
      name: 'MacBook Air (M1, 2020)',
      kind: 'laptop',
      icon: '💻',
      year: 2020,
      blurb: 'Fast and silent. Also: everything is soldered. The only honest answer is sometimes "you cannot upgrade this".',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'unified-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 16,
      ramSoldered: true,
      screws: ['pentalobe-p5', 'torx-t5'],
      display: { size: 13.3, res: '2560x1600', hz: 60, panel: 'IPS', trueTone: true },
      battery: { model: 'A2389', designCycles: 1000 },
      thermal: { tdpW: 15, pasteAllowed: ['standard', 'premium'] },
      teardown: ['bottom_case', 'battery_connector', 'battery', 'display_flex']
    },

    thinkpad_t480: {
      id: 'thinkpad_t480',
      os: 'windows',
      name: 'Lenovo ThinkPad T480',
      kind: 'laptop',
      icon: '💻',
      year: 2018,
      blurb: 'The repair tech\'s favourite. NVMe slot, a real RAM slot, and a service manual that exists.',
      storageBuses: ['nvme3', 'sata3'],  // Gen3 x4 — ~3500 MB/s ceiling
      storageForm: 'm2-2280',
      storageSoldered: false,
      ramType: 'ddr4-2400',
      ramForm: 'sodimm',
      ramSlots: 1,                       // one slot + 8GB soldered
      ramSolderedGB: 8,
      ramMaxGB: 32,
      ramSoldered: false,
      screws: ['phillips-0'],
      display: { size: 14, res: '1920x1080', hz: 60, panel: 'IPS', trueTone: false },
      battery: { model: '01AV489', designCycles: 800 },
      thermal: { tdpW: 15, pasteAllowed: ['standard', 'premium', 'liquid_metal'] },
      teardown: ['bottom_case', 'battery_connector', 'drive_bay', 'ram_bay', 'fan', 'heatsink']
    },

    tower_pc: {
      id: 'tower_pc',
      os: 'windows',
      name: 'Custom Tower PC (B550 / Ryzen)',
      kind: 'desktop',
      icon: '🖥️',
      year: 2021,
      blurb: 'Built by a cousin in 2021. Four RAM slots, a Gen4 NVMe slot, and a CPU cooler mounted by someone in a hurry.',
      storageBuses: ['nvme4', 'nvme3', 'sata3'],
      storageForm: 'm2-2280',
      storageSoldered: false,
      ramType: 'ddr4-3200',
      ramForm: 'dimm',
      ramSlots: 4,
      ramMaxGB: 128,
      ramSoldered: false,
      screws: ['phillips-1', 'torx-t20'],
      display: null,
      battery: null,
      thermal: { tdpW: 105, pasteAllowed: ['standard', 'premium', 'liquid_metal'] },
      teardown: ['psu_switch', 'side_panel', 'drive_bay', 'ram_bay', 'cooler', 'cpu']
    },

    iphone12: {
      id: 'iphone12',
      os: 'ios',
      name: 'iPhone 12',
      kind: 'phone',
      icon: '📱',
      year: 2020,
      blurb: 'Pentalobe on the outside, tri-point inside, and a battery glued down with pull-tabs that snap if you rush.',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'unified-soldered',
      ramSlots: 0,
      ramMaxGB: 4,
      ramSoldered: true,
      screws: ['pentalobe-p2', 'tripoint-y000'],
      display: { size: 6.1, res: '2532x1170', hz: 60, panel: 'OLED', trueTone: true },
      battery: { model: 'A2471', designCycles: 500 },
      thermal: { tdpW: 6, pasteAllowed: [] },
      teardown: ['screen_lift', 'battery_connector', 'display_flex', 'battery', 'charge_port']
    },

    imac_m1: {
      id: 'imac_m1',
      os: 'macos',
      name: 'iMac 24" (M1, 2021)',
      kind: 'aio',
      icon: '🖥️',
      year: 2021,
      blurb: 'No screws on the outside at all. The screen is glued on, and the only way in is to cut the adhesive all the way round without touching the panel.',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'unified-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 16,
      ramSoldered: true,
      screws: ['torx-t5'],
      display: { size: 23.5, res: '4480x2520', hz: 60, panel: 'IPS', trueTone: true },
      battery: null,
      thermal: { tdpW: 20, pasteAllowed: ['standard', 'premium'] },
      teardown: ['cut_adhesive', 'lift_display', 'display_flex', 'fan', 'heatsink'],
      openTool: 'cutting_wheel'
    },

    ipad_air: {
      id: 'ipad_air',
      os: 'ipados',
      name: 'iPad Air (5th gen)',
      kind: 'tablet',
      icon: '📲',
      year: 2022,
      blurb: 'The worst thing in the shop to open. Glass bonded straight to the frame, a battery glued flat across the back, and a digitiser that cracks if you rush the heat.',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'unified-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 8,
      ramSoldered: true,
      screws: ['tripoint-y000'],
      display: { size: 10.9, res: '2360x1640', hz: 60, panel: 'IPS', trueTone: true },
      battery: { model: 'A2779', designCycles: 1000 },
      thermal: { tdpW: 8, pasteAllowed: [] },
      teardown: ['heat_edges', 'pick_seam', 'lift_display', 'battery_connector', 'display_flex', 'battery', 'charge_port'],
      openTool: 'thin_picks'
    },

    mbp14_m3: {
      id: 'mbp14_m3',
      os: 'macos',
      name: 'MacBook Pro 14" (M3, 2024)',
      kind: 'laptop',
      icon: '💻',
      year: 2024,
      blurb: 'Fast, beautifully built, and almost nothing inside is a part you can buy. Battery and fans, and that is the list.',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'unified-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 36,
      ramSoldered: true,
      screws: ['pentalobe-p5', 'torx-t3'],
      display: { size: 14.2, res: '3024x1964', hz: 120, panel: 'mini-LED', trueTone: true },
      battery: { model: 'A2992', designCycles: 1000 },
      thermal: { tdpW: 30, pasteAllowed: ['standard', 'premium'] },
      teardown: ['bottom_case', 'battery_connector', 'fan', 'heatsink', 'battery']
    },

    steamdeck: {
      id: 'steamdeck',
      os: 'steamos',
      name: 'Steam Deck',
      kind: 'handheld',
      icon: '🎮',
      year: 2022,
      blurb: 'A handheld PC that Valve actually publishes the service manual for. The SSD is a standard M.2 2230 and the fan is four screws — almost unheard of in this class.',
      storageBuses: ['nvme3x2'],
      storageForm: 'm2-2230',
      storageSoldered: false,
      ramType: 'lpddr5-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 16,
      ramSoldered: true,
      screws: ['phillips-0', 'torx-t5'],
      display: { size: 7, res: '1280x800', hz: 60, panel: 'IPS', trueTone: false },
      battery: { model: 'JCPBT-1', designCycles: 800 },
      thermal: { tdpW: 15, pasteAllowed: ['standard', 'premium'] },
      teardown: ['bottom_case', 'battery_connector', 'drive_bay', 'fan', 'heatsink', 'battery']
    },

    switch2: {
      id: 'switch2',
      os: 'switchos',
      name: 'Nintendo Switch 2',
      kind: 'handheld',
      icon: '🕹️',
      year: 2025,
      blurb: 'Tri-point screws, a glued battery and a fan buried under the shield plate. Popular enough that you will see three a week.',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'lpddr5-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 12,
      ramSoldered: true,
      screws: ['tripoint-y000', 'phillips-00'],
      display: { size: 7.9, res: '1920x1080', hz: 120, panel: 'LCD', trueTone: false },
      battery: { model: 'HEG-003', designCycles: 800 },
      thermal: { tdpW: 12, pasteAllowed: ['standard', 'premium'] },
      teardown: ['bottom_case', 'battery_connector', 'fan', 'heatsink', 'battery', 'display_flex']
    },

    ps5pro: {
      id: 'ps5pro',
      os: 'ps5os',
      name: 'PlayStation 5 Pro',
      kind: 'console',
      icon: '🎛️',
      year: 2024,
      blurb: 'Side panels come off by hand, the fan and PSU are modular, and the CMOS battery is a coin cell anyone can change. Big, heavy, and genuinely serviceable.',
      storageBuses: ['nvme4', 'nvme3'],
      storageForm: 'm2-2280',
      storageSoldered: false,
      ramType: 'gddr6-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 16,
      ramSoldered: true,
      screws: ['phillips-1', 'torx-t8'],
      display: null,
      battery: null,
      thermal: { tdpW: 200, pasteAllowed: ['standard', 'premium', 'liquid_metal'] },
      teardown: ['psu_switch', 'side_panel', 'drive_bay', 'fan', 'cooler', 'cpu']
    },

    iphone17: {
      id: 'iphone17',
      os: 'ios',
      name: 'iPhone 17',
      kind: 'phone',
      icon: '📱',
      year: 2025,
      blurb: 'Opens from the back now, which makes the battery a far shorter job than it used to be. The screen is still the expensive decision.',
      storageBuses: ['soldered'],
      storageForm: 'soldered',
      storageSoldered: true,
      ramType: 'unified-soldered',
      ramForm: 'soldered',
      ramSlots: 0,
      ramMaxGB: 8,
      ramSoldered: true,
      screws: ['pentalobe-p2', 'tripoint-y000'],
      display: { size: 6.3, res: '2622x1206', hz: 120, panel: 'OLED', trueTone: true },
      battery: { model: 'A3310', designCycles: 1000 },
      thermal: { tdpW: 8, pasteAllowed: [] },
      teardown: ['screen_lift', 'battery_connector', 'display_flex', 'battery', 'charge_port']
    },

    inspiron15: {
      id: 'inspiron15',
      os: 'windows',
      name: 'Dell Inspiron 15 3000',
      kind: 'laptop',
      icon: '💻',
      year: 2019,
      blurb: 'The 180.000 Ft "it was cheap" laptop. One RAM slot, a slow spinning disk, and a Gen3 x2 NVMe slot that halves any drive you put in it.',
      storageBuses: ['nvme3x2', 'sata3'], // x2 lanes only — ~1700 MB/s ceiling
      storageForm: 'm2-2280',
      storageSoldered: false,
      ramType: 'ddr4-2666',
      ramForm: 'sodimm',
      ramSlots: 1,
      ramSolderedGB: 4,
      ramMaxGB: 16,
      ramSoldered: false,
      screws: ['phillips-0'],
      display: { size: 15.6, res: '1366x768', hz: 60, panel: 'TN', trueTone: false },
      battery: { model: 'M5Y1K', designCycles: 500 },
      thermal: { tdpW: 15, pasteAllowed: ['standard', 'premium'] },
      teardown: ['bottom_case', 'battery_connector', 'drive_bay', 'ram_bay', 'fan', 'heatsink']
    }
  };

  /** Human-readable ceiling for a bus, used in the market and the handover benchmark. */
  var BUS_CEILING_MBPS = {
    'sata3': 550,
    'nvme3x2': 1700,
    'nvme3': 3500,
    'nvme4': 7000,
    'soldered': 2900
  };

  var BUS_LABEL = {
    'sata3': 'SATA III',
    'nvme3x2': 'NVMe Gen3 ×2',
    'nvme3': 'NVMe Gen3 ×4',
    'nvme4': 'NVMe Gen4 ×4',
    'soldered': 'soldered (not replaceable)'
  };

  window.TechOpsMachines = {
    all: MACHINES,
    get: function (id) { return MACHINES[id]; },
    list: function () { return Object.keys(MACHINES).map(function (k) { return MACHINES[k]; }); },
    busCeiling: function (bus) { return BUS_CEILING_MBPS[bus] || 500; },
    busLabel: function (bus) { return BUS_LABEL[bus] || bus; },
    /** Fastest bus this machine can actually run. */
    bestBus: function (machine) {
      var best = null, bestSpeed = 0;
      (machine.storageBuses || []).forEach(function (b) {
        var s = BUS_CEILING_MBPS[b] || 0;
        if (s > bestSpeed) { bestSpeed = s; best = b; }
      });
      return best;
    }
  };
})(window);
