/**
 * TechOps Budapest — real board layouts, one per device family.
 *
 * The point is that these are not interchangeable. An ATX motherboard, a
 * console board, a laptop logic board, a handheld and a phone are laid out
 * differently because they solve different problems, and you can read that
 * off the board: memory sits next to the processor because the traces have to
 * be short; power stages cluster by the power inlet; RF hugs the antennas.
 *
 * Coordinates are in each layout's own `w` × `h` space.
 * `chips` carry a role from data-chiproles.js and, where we have one, the real
 * part identified in iFixit's chip-ID teardown of that device.
 */
(function (window) {
  'use strict';

  function C(id, x, y, w, h, role, label, opts) {
    return Object.assign({ id: id, x: x, y: y, w: w, h: h, role: role, label: label }, opts || {});
  }

  var LAYOUTS = {

    // ── ATX desktop: the textbook layout everything else is a compromise on ──
    atx: {
      w: 1000, h: 760, shape: 'rect', pcb: '#1b4a2e',
      note: 'A full-size ATX board has room to spread out. Everything is where it is for a reason: the socket sits in the airflow, the memory right beside it so the traces stay short, the expansion slots along the bottom edge where a card can reach out of the case.',
      chips: [
        C('vrm',     70,  40, 190, 90,  'power',   'VRM — power stages', { array: 8 }),
        C('socket',  300, 110, 250, 250, 'soc',    'CPU socket', { big: true }),
        C('dimm',    610, 60, 200, 330,  'memory', 'DIMM slots ×4', { slots: 4 }),
        C('chipset', 340, 430, 150, 150, 'signal', 'Chipset', { heatsink: true }),
        C('m2',      110, 430, 200, 46,  'storage','M.2 NVMe slot', { slot: true }),
        C('m2b',     110, 520, 200, 46,  'storage','M.2 NVMe slot 2', { slot: true }),
        C('pcie',    80,  620, 430, 40,  'signal', 'PCIe ×16 slot', { slot: true }),
        C('pcie2',   80,  690, 300, 32,  'signal', 'PCIe ×1 slot', { slot: true }),
        C('sata',    860, 430, 90, 130,  'storage','SATA ports', { array: 4 }),
        C('atx24',   880, 60, 70, 220,   'power',  '24-pin power inlet'),
        C('audio',   600, 640, 110, 60,  'audio',  'Audio codec'),
        C('lan',     760, 640, 110, 60,  'wireless','Network controller'),
        C('bios',    600, 470, 80, 50,   'security','BIOS chip'),
        C('cmos',    720, 470, 60, 60,   'power',  'CMOS battery', { round: true }),
        C('io',      40,  40, 34, 300,   'usbc',   'Rear I/O')
      ]
    },

    // ── Console: one enormous APU, memory ringed tight around it ──
    console: {
      w: 1000, h: 700, shape: 'rect', pcb: '#17402a',
      note: 'A console board is built around one very large, very hot processor with its memory packed in a ring as close as physically possible. Everything else is pushed to the edges. There are no expansion slots because there is nothing to expand.',
      chips: [
        C('apu',   380, 250, 240, 200, 'soc',    'APU — CPU + GPU', { big: true, part: 'AMD custom' }),
        C('g1',    300, 180, 80, 62,  'memory', 'GDDR6'),
        C('g2',    420, 160, 80, 62,  'memory', 'GDDR6'),
        C('g3',    540, 180, 80, 62,  'memory', 'GDDR6'),
        C('g4',    630, 250, 62, 80,  'memory', 'GDDR6'),
        C('g5',    630, 370, 62, 80,  'memory', 'GDDR6'),
        C('g6',    540, 460, 80, 62,  'memory', 'GDDR6'),
        C('g7',    420, 480, 80, 62,  'memory', 'GDDR6'),
        C('g8',    300, 460, 80, 62,  'memory', 'GDDR6'),
        C('g9',    230, 370, 62, 80,  'memory', 'GDDR6'),
        C('g10',   230, 250, 62, 80,  'memory', 'GDDR6'),
        C('vrmc',  60,  120, 130, 300, 'power',  'VRM bank', { array: 10 }),
        C('m2c',   760, 130, 190, 46,  'storage','M.2 expansion slot', { slot: true }),
        C('nand',  760, 230, 110, 70,  'storage','System NAND'),
        C('south', 760, 360, 130, 110, 'signal', 'I/O controller'),
        C('usbc',  770, 520, 120, 60,  'usbc',   'USB-C board'),
        C('wifi',  90,  500, 140, 80,  'wireless','Wi-Fi / Bluetooth'),
        C('cmosc', 300, 600, 60, 60,   'power',  'CMOS battery', { round: true }),
        C('fanc',  430, 590, 160, 70,  'power',  'Fan connector')
      ]
    },

    // ── Laptop logic board: long, thin, and almost entirely soldered ──
    laptop_logic: {
      w: 1000, h: 420, shape: 'strip', pcb: '#16321f',
      note: 'A laptop logic board is shaped by the space left over once the battery and the trackpad have taken theirs: a long thin strip along the hinge. The processor sits centrally under the heat pipe, with the memory stacked directly on top of it — which is exactly why you cannot upgrade it.',
      chips: [
        C('soc',    410, 130, 180, 160, 'soc',    'SoC + RAM stacked on top', { big: true }),
        C('nand1',  620, 150, 90, 70,  'storage','NAND flash'),
        C('nand2',  620, 240, 90, 70,  'storage','NAND flash'),
        C('pmic1',  290, 120, 80, 60,  'pmic',   'Power management'),
        C('pmic2',  290, 210, 80, 60,  'pmic',   'Power management'),
        C('usbc1',  70,  140, 90, 60,  'usbc',   'USB-C controller'),
        C('usbc2',  70,  230, 90, 60,  'usbc',   'USB-C controller'),
        C('audio',  760, 140, 90, 60,  'audio',  'Audio codec'),
        C('wifi',   760, 240, 110, 70, 'wireless','Wi-Fi / Bluetooth'),
        C('touch',  420, 320, 110, 50, 'input',  'Trackpad controller'),
        C('sec',    600, 60,  70, 50,  'security','Secure element'),
        C('disp',   200, 60,  90, 50,  'display','Display power'),
        C('vrml',   170, 300, 200, 60, 'power',  'Regulators', { array: 6 }),
        C('fanhdr', 900, 150, 60, 50,  'power',  'Fan connector'),
        C('battc',  880, 280, 90, 50,  'battery','Battery connector')
      ]
    },

    // ── The laptop you can still service: sockets, not solder ──
    laptop_serviceable: {
      w: 1000, h: 480, shape: 'strip', pcb: '#16321f',
      note: 'The same long thin strip, but from the years when a laptop had sockets. Two SO-DIMM slots stacked on top of each other to save height, and a drive bay you can actually reach. This is why a machine like this is still worth fixing in 2026 and a soldered one often is not.',
      chips: [
        C('cpu',    400, 150, 170, 150, 'soc',    'CPU', { big: true }),
        C('ram_a',  640, 130, 240, 44,  'memory', 'SO-DIMM slot A', { slot: true }),
        C('ram_b',  640, 196, 240, 44,  'memory', 'SO-DIMM slot B', { slot: true }),
        C('drive',  640, 300, 250, 62,  'storage','Drive bay', { slot: true }),
        C('chipl',  280, 300, 120, 90,  'signal', 'Chipset'),
        C('pmicl1', 250, 150, 90, 60,   'pmic',   'Power management'),
        C('vrmlap', 60,  120, 150, 80,  'power',  'Regulators', { array: 5 }),
        C('usbcl',  60,  240, 110, 60,  'usbc',   'USB / port controller'),
        C('wifil',  60,  340, 150, 70,  'wireless','Wi-Fi card (M.2)', { slot: true }),
        C('audiol', 430, 340, 110, 60,  'audio',  'Audio codec'),
        C('displ',  250, 60,  110, 55,  'display','Display power'),
        C('ecl',    430, 60,  110, 55,  'ec',     'Embedded controller'),
        C('fanl',   900, 130, 70, 55,   'power',  'Fan connector'),
        C('battl',  900, 300, 80, 60,   'battery','Battery connector'),
        C('bat_cmos',900, 400, 55, 55,  'power',  'CMOS cell', { round: true })
      ]
    },

    // ── Handheld PC: console architecture squeezed into two hands ──
    handheld_pc: {
      w: 1000, h: 620, shape: 'rect', pcb: '#164226',
      note: 'A handheld PC is a console board folded in half. The APU still needs its memory close and its power stages close, but now the whole thing has to fit behind a screen, so the board wraps around the fan and the cooling is the shape everything else works around.',
      chips: [
        C('apu',   400, 230, 190, 170, 'soc',    'APU — CPU + GPU', { big: true }),
        C('ram1',  300, 190, 80, 60,  'memory', 'LPDDR5'),
        C('ram2',  300, 290, 80, 60,  'memory', 'LPDDR5'),
        C('ram3',  610, 190, 80, 60,  'memory', 'LPDDR5'),
        C('ram4',  610, 290, 80, 60,  'memory', 'LPDDR5'),
        C('fancut',430, 30,  180, 140,'power',  'Fan cut-out', { cutout: true }),
        C('m2h',   90,  430, 210, 46, 'storage','M.2 2230 SSD', { slot: true }),
        C('sdr',   740, 430, 130, 60, 'reader', 'microSD reader'),
        C('ec',    150, 230, 100, 70, 'ec',     'Embedded controller'),
        C('pmich', 150, 330, 100, 60, 'pmic',   'Power management'),
        C('vrmh',  90,  120, 150, 70, 'power',  'Power stages', { array: 6 }),
        C('usbch', 700, 510, 130, 60,'usbc',    'USB-C controller'),
        C('audioh',740, 110, 110, 60,'audio',   'Audio amplifier'),
        C('wifih', 740, 250, 120, 70,'wireless','Wi-Fi / Bluetooth'),
        C('bright',330, 470, 120, 55,'display', 'Backlight driver'),
        C('battch',480, 510, 150, 55,'battery', 'Battery connector')
      ]
    },

    // ── Hybrid handheld: game card slot and a dock to talk to ──
    handheld_hybrid: {
      w: 1000, h: 560, shape: 'rect', pcb: '#153d27',
      note: 'Built around a mobile-class processor rather than a desktop one, so it runs cooler and the board is simpler — but it gains things a PC does not have: a game card reader, and a USB-C port that has to drive a television when docked.',
      chips: [
        C('soch',  400, 180, 180, 160, 'soc',    'SoC — CPU + GPU', { big: true }),
        C('ramh1', 300, 200, 80, 60,  'memory', 'LPDDR5'),
        C('ramh2', 600, 200, 80, 60,  'memory', 'LPDDR5'),
        C('ufs',   600, 290, 100, 60, 'storage','UFS NAND flash'),
        C('cardr', 90,  60, 180, 70,  'reader', 'Game card reader'),
        C('usbcs', 420, 460, 160, 60, 'usbc',   'USB-C controller'),
        C('pmics1',250, 330, 90, 55,  'pmic',   'Power management'),
        C('pmics2',360, 380, 90, 55,  'pmic',   'Power management'),
        C('audios',740, 130, 120, 60, 'audio',  'Audio codec'),
        C('wifis', 740, 240, 120, 70, 'wireless','Wi-Fi / Bluetooth'),
        C('bts',   740, 350, 120, 55, 'wireless','Bluetooth'),
        C('nfcs',  120, 200, 100, 55, 'security','NFC controller'),
        C('fancut2',420, 40, 170, 110,'power',  'Fan cut-out', { cutout: true }),
        C('battcs',120, 380, 150, 60, 'battery','Battery connector'),
        C('dispd', 640, 430, 130, 55, 'display','Display driver')
      ]
    },

    // ── Phone: everything stacked, because there is no room ──
    phone_board: {
      w: 620, h: 900, shape: 'lshape', pcb: '#14321f',
      note: 'A phone board is tiny and three-dimensional: the memory is not beside the processor, it is stacked on top of it in the same package. Modem and RF parts crowd one end so the antenna runs stay short, and the whole assembly folds over itself to fit beside the battery.',
      chips: [
        C('socp',  200, 300, 180, 160, 'soc',    'SoC + RAM (stacked)', { big: true }),
        C('nandp', 200, 490, 150, 90,  'storage','NAND flash'),
        C('modem', 390, 120, 140, 110, 'modem',  'Cellular modem'),
        C('rf1',   60,  120, 110, 70,  'rf',     'RF front end'),
        C('rf2',   60,  210, 110, 70,  'rf',     'RF front end'),
        C('rf3',   390, 250, 110, 70,  'rf',     'RF transceiver'),
        C('pmicp1',60,  330, 110, 80,  'pmic',   'Power management'),
        C('pmicp2',60,  430, 110, 80,  'pmic',   'Power management'),
        C('chargp',60,  540, 110, 70,  'battery','Battery charger'),
        C('usbcp', 210, 700, 140, 70,  'usbc',   'USB-C controller'),
        C('nfcp',  390, 420, 110, 70,  'security','NFC + secure element'),
        C('audiop',390, 520, 110, 70,  'audio',  'Audio codec'),
        C('dispp', 390, 620, 110, 70,  'display','Display power'),
        C('qip',   200, 620, 140, 60,  'qi',     'Wireless charging'),
        C('camp',  60,  650, 110, 70,  'camera', 'Camera / flash'),
        C('battcp',390, 720, 130, 60,  'battery','Battery connector')
      ]
    },

    // ── Tablet: a phone board stretched along one edge ──
    tablet_board: {
      w: 1000, h: 400, shape: 'strip', pcb: '#15351f',
      note: 'A tablet has the space a phone does not, so the same parts spread out along the top edge instead of stacking. It still shares the phone habit of putting the memory on top of the processor.',
      chips: [
        C('soct',  420, 120, 170, 150, 'soc',    'SoC + RAM (stacked)', { big: true }),
        C('nandt', 620, 140, 110, 80,  'storage','NAND flash'),
        C('pmict', 300, 130, 90, 70,   'pmic',   'Power management'),
        C('pmict2',300, 220, 90, 60,   'pmic',   'Power management'),
        C('usbct', 130, 150, 110, 70,  'usbc',   'USB-C controller'),
        C('audiot',770, 130, 100, 60,  'audio',  'Audio codec'),
        C('wifit', 770, 220, 120, 70,  'wireless','Wi-Fi / Bluetooth'),
        C('dispt', 140, 260, 120, 60,  'display','Display driver'),
        C('touch2',430, 300, 140, 55,  'input',  'Touch controller'),
        C('battct',870, 300, 110, 55,  'battery','Battery connector'),
        C('camt',  620, 250, 100, 60,  'camera', 'Camera controller')
      ]
    }
  };

  /** Which layout a machine uses. */
  var FOR_MACHINE = {
    tower_pc: 'atx',
    ps5pro: 'console',
    // Socketed machines get the serviceable board; soldered ones do not.
    mbp13_2012: 'laptop_serviceable', thinkpad_t480: 'laptop_serviceable', inspiron15: 'laptop_serviceable',
    mba_m1: 'laptop_logic', mbp14_m3: 'laptop_logic', imac_m1: 'laptop_logic',
    steamdeck: 'handheld_pc',
    switch2: 'handheld_hybrid',
    iphone12: 'phone_board', iphone17: 'phone_board',
    ipad_air: 'tablet_board'
  };


  // Boards drawn from real photos (tools/build-chipid.py) replace the family
  // layout for their machine.
  var REAL = window.TechOpsRealBoards;
  if (REAL) {
    Object.keys(REAL.layouts || {}).forEach(function (k) { LAYOUTS[k] = REAL.layouts[k]; });
    Object.keys(REAL.forMachine || {}).forEach(function (m) { FOR_MACHINE[m] = REAL.forMachine[m]; });
  }

  window.TechOpsBoards = {
    LAYOUTS: LAYOUTS,
    forMachine: function (m) { return LAYOUTS[FOR_MACHINE[m.id] || 'laptop_logic']; },
    layoutName: function (m) { return FOR_MACHINE[m.id] || 'laptop_logic'; }
  };
})(window);
