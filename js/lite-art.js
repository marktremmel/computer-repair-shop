/**
 * TechOps Budapest — Lite: drawn tools, instruments and parts.
 *
 * The classic shop labels its tools with a name and a 17px line icon. That is
 * fine once you know what a spudger is; it is no help at all to somebody
 * meeting one for the first time, which is most of a class. These are the
 * same tools drawn big enough to recognise — chunky, flat, high contrast,
 * one visual voice, and sharp on a projector or a phone.
 *
 * Drawn rather than photographed on purpose: the whole shop has to run from a
 * USB stick with no network, every file here is a couple of kilobytes, and
 * nothing needs a licence checking before a school can use it.
 *
 * Every piece is a 100x100 box, so anything can stand in for anything else
 * at any size. Colour carries meaning: a driver family keeps its colour
 * wherever it appears, so "the blue one" is a thing a student can say.
 */
(function (window) {
  'use strict';

  var INK = '#0d1017';

  var C = {
    steel:   '#ccd5e2', steelD:  '#8792a4', steelL: '#eef3fa',
    amber:   '#f7b23f', amberD:  '#b9761a',
    blue:    '#5aa9ff', blueD:   '#2b6cb5',
    green:   '#3ddc91', greenD:  '#17925c',
    red:     '#ff6470', redD:    '#bf3340',
    violet:  '#a78bfa', violetD: '#6a4bd0',
    pink:    '#ff8fc5', pinkD:   '#c4558c',
    wood:    '#d9a766', woodD:   '#9c6f3a',
    dark:    '#2b3446', darkD:   '#1a2130',
    white:   '#f4f8ff',
    board:   '#1f7a52', boardD:  '#124a32'
  };

  /** Everything is drawn with the same weight, so nothing looks like a different set. */
  function wrap(body, extra) {
    return '<svg viewBox="0 0 100 100" class="la" ' + (extra || '')
      + ' xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
      + '<g stroke="' + INK + '" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">'
      + body + '</g></svg>';
  }

  function rect(x, y, w, h, r, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + fill + '"/>';
  }
  function circ(cx, cy, r, fill) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/>';
  }
  function path(d, fill, sw, stroke) {
    return '<path d="' + d + '" fill="' + (fill || 'none') + '"'
      + (sw ? ' stroke-width="' + sw + '"' : '')
      + (stroke ? ' stroke="' + stroke + '"' : '') + '/>';
  }
  /** A highlight line — no outline, so it reads as a shine rather than an edge. */
  function shine(d) {
    return '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"/>';
  }

  // ── drivers ────────────────────────────────────────────────────────
  /*
   * One drawing, four colours. A student does not have to read "Torx T6" to
   * tell two drivers apart at a glance — but the colour is never the answer
   * on its own, because the tip shape beside it is what has to match the
   * screw. Colour gets them to the right family; looking gets them the size.
   */
  var DRIVER_COLOUR = {
    phillips: [C.amber, C.amberD],
    torx:     [C.blue, C.blueD],
    pentalobe:[C.violet, C.violetD],
    tripoint: [C.green, C.greenD],
    hex:      [C.pink, C.pinkD]
  };

  function driverFamily(id) {
    return String(id).split('-')[0];
  }

  function driver(id) {
    var fam = driverFamily(id);
    var col = DRIVER_COLOUR[fam] || DRIVER_COLOUR.phillips;
    var g = '<g transform="rotate(-32 50 50)">'
      // handle
      + rect(35, 8, 30, 44, 13, col[0])
      + path('M41 16v28M50 14v32M59 16v28', null, 3, col[1])
      // collar
      + rect(41, 50, 18, 8, 3, C.steelD)
      // shaft
      + rect(44.5, 56, 11, 26, 2, C.steel)
      + shine('M48 60v16')
      // tip
      + path('M44.5 82h11l-3 10h-5z', C.steelD)
      + '</g>';
    return wrap(g);
  }

  // ── hand tools ─────────────────────────────────────────────────────
  var TOOL = {
    esd_strap: function () {
      /* A band with a metal plate, a lead, and a crocodile clip on the end.
         Drawn flat rather than as a loop: a loop at this size reads as a
         doughnut, and the point of the picture is that it connects you to
         something. */
      return wrap(
        rect(4, 26, 74, 30, 14, C.dark)
        + path('M4 41h74', null, 2.6, '#4a566b')
        + rect(30, 20, 26, 42, 7, C.steel)
        + shine('M37 28v26')
        + circ(43, 41, 5, C.steelD)
        + path('M70 56c10 8 2 16 12 22', null, 4)
        + path('M70 82l22 5-2 11-22-5z', C.green)
        + path('M76 85l12 3M75 91l12 3', null, 2.2)
      );
    },
    spudger: function () {
      return wrap(
        path('M18 82l10-10 40-46a8 8 0 0 1 12 10L34 76 24 88z', C.dark)
        + path('M28 72l10 10', null, 2.6)
        + shine('M40 56l24-28')
      );
    },
    tweezers: function () {
      return wrap(
        path('M30 8l12 4 8 58 2 22-6-22-16-58z', C.steel)
        + path('M70 8l-12 4-8 58-2 22 6-22 16-58z', C.steel)
        + rect(38, 34, 24, 11, 5, C.blue)
      );
    },
    micro_tweezers: function () {
      return wrap(
        path('M38 10l8 54 4 28 4-28 8-54', C.steelL)
        + rect(43, 34, 14, 9, 4, C.violet)
        + circ(50, 88, 4, C.red)
      );
    },
    pick: function () {
      return wrap(
        '<g transform="rotate(-30 50 50)">'
        + path('M40 14h20l-4 56-6 18-6-18z', C.wood)
        + path('M44 26h12M44 38h12', null, 2.6, C.woodD)
        + '</g>'
      );
    },
    air_can: function () {
      return wrap(
        rect(20, 30, 34, 58, 12, C.blue)
        + rect(20, 30, 34, 16, 12, C.blueD)
        + rect(30, 16, 14, 16, 4, C.steel)
        + path('M44 20h16', null, 5)
        + path('M66 22c6 0 8 4 14 4M66 30c8 0 10 6 18 6M64 14c5 0 7 3 12 3', null, 3)
        + shine('M28 50v26')
      );
    },
    alcohol_wipe: function () {
      return wrap(
        rect(14, 46, 40, 40, 8, C.white)
        + path('M14 56c10 6 30 6 40 0M14 68c10 6 30 6 40 0', null, 2.6)
        + rect(60, 24, 24, 56, 8, C.green)
        + rect(66, 12, 12, 14, 4, C.dark)
        + '<text x="72" y="60" font-size="20" font-weight="800" fill="' + INK + '" text-anchor="middle" stroke="none">99</text>'
      );
    },
    paste_syringe: function () {
      return wrap(
        '<g transform="rotate(-28 50 50)">'
        + rect(36, 16, 28, 48, 6, C.white)
        + rect(36, 34, 28, 30, 6, C.steelD)
        + rect(30, 6, 40, 12, 5, C.amber)
        + rect(44, 64, 12, 12, 3, C.steel)
        + path('M47 76l3 16 3-16z', C.steel)
        + '</g>'
        + circ(74, 84, 7, C.steelD)
      );
    },
    heat_pad: function () {
      return wrap(
        rect(12, 46, 76, 40, 10, C.red)
        + rect(12, 46, 76, 12, 10, C.redD)
        + path('M30 36c0-8-6-8-6-14s6-6 6-12M50 36c0-8-6-8-6-14s6-6 6-12M70 36c0-8-6-8-6-14s6-6 6-12', null, 3.4)
        + shine('M22 68h56')
      );
    },
    suction_cup: function () {
      return wrap(
        path('M18 52c0-20 14-32 32-32s32 12 32 32c0 8-10 10-14 14H32c-4-4-14-6-14-14z', C.green)
        + rect(40, 60, 20, 10, 4, C.dark)
        + rect(44, 14, 12, 48, 5, C.steel)
        + rect(34, 6, 32, 12, 6, C.dark)
      );
    },
    suction_handles: function () {
      return wrap(
        path('M6 62c0-14 8-22 22-22s22 8 22 22c0 6-6 8-9 10H15c-3-2-9-4-9-10z', C.green)
        + path('M50 62c0-14 8-22 22-22s22 8 22 22c0 6-6 8-9 10H59c-3-2-9-4-9-10z', C.green)
        + rect(18, 22, 20, 10, 5, C.dark)
        + rect(62, 22, 20, 10, 5, C.dark)
        + path('M28 27h44', null, 5)
      );
    },
    cutting_wheel: function () {
      return wrap(
        circ(34, 50, 24, C.steel)
        + circ(34, 50, 8, C.dark)
        + path('M34 26v10M34 64v10M10 50h10M48 50h10M17 33l7 7M44 60l7 7M51 33l-7 7M24 60l-7 7', null, 2.8)
        + rect(58, 42, 34, 16, 8, C.amber)
        + shine('M66 47h18')
      );
    },
    thin_picks: function () {
      return wrap(
        '<g transform="rotate(-12 50 50)">'
        + path('M28 84l8-64 6 64z', C.steelL)
        + path('M46 88l6-72 6 72z', C.steelL)
        + path('M64 84l8-62 6 62z', C.steelL)
        + '</g>'
      );
    },
    extractor: function () {
      return wrap(
        rect(38, 10, 24, 34, 8, C.red)
        + rect(43, 42, 14, 16, 3, C.steelD)
        + path('M42 58h16l-3 14-5 12-5-12z', C.steel)
        + path('M42 64h16M43 70h14M45 76h10', null, 2.4)
        + path('M76 40a14 14 0 1 1-6-11', null, 3.4)
        + path('M62 24l8 5-8 6z', INK)
      );
    },
    solder_iron: function () {
      return wrap(
        '<g transform="rotate(-30 50 50)">'
        + rect(36, 8, 28, 40, 10, C.amber)
        + rect(36, 8, 28, 12, 10, C.amberD)
        + rect(42, 46, 16, 12, 4, C.steelD)
        + path('M44 58h12l-2 14-4 12-4-12z', C.steel)
        + '</g>'
        + path('M74 68c0-6-5-6-5-10s5-5 5-9', null, 3)
      );
    },
    multimeter: function () {
      return wrap(
        rect(16, 22, 54, 66, 10, C.amber)
        + rect(24, 30, 38, 22, 5, C.dark)
        + '<text x="43" y="47" font-size="15" font-weight="800" fill="' + C.green + '" text-anchor="middle" stroke="none" font-family="monospace">0.00</text>'
        + circ(43, 68, 12, C.dark)
        + path('M43 60v6', null, 3)
        + circ(31, 84, 3.6, C.red) + circ(55, 84, 3.6, INK)
        + path('M70 40c14 0 18 10 18 20s-6 16-6 24', null, 3.2)
      );
    }
  };

  // ── instruments ────────────────────────────────────────────────────
  var INSTR = {
    visual: function () {
      return wrap(
        circ(42, 42, 26, 'rgba(90,169,255,.35)')
        + shine('M30 32a16 16 0 0 1 12-6')
        + path('M61 61l22 22', null, 12)
        + path('M61 61l22 22', null, 6, C.amber)
      );
    },
    listen: function () {
      /* A drive with sound coming off it, rather than an ear. The instrument
         is "listen to the drive", and a drawn ear at 60px is a pink blob. */
      return wrap(
        rect(8, 30, 54, 44, 6, C.steel)
        + circ(35, 52, 15, C.dark)
        + circ(35, 52, 4, C.steelL)
        + path('M46 44l8 6-8 6', null, 3, C.steelD)
        + path('M70 36c7 8 7 32 0 40M84 26c11 12 11 48 0 60', null, 4, C.pink)
      );
    },
    memtest: function () {
      return wrap(
        rect(8, 34, 84, 30, 5, C.green)
        + rect(16, 40, 14, 16, 2, C.dark) + rect(34, 40, 14, 16, 2, C.dark)
        + rect(52, 40, 14, 16, 2, C.dark) + rect(70, 40, 14, 16, 2, C.dark)
        + path('M20 64v8M32 64v8M44 64v8M56 64v8M68 64v8M80 64v8', null, 2.6)
        + path('M28 18l10 10 22-22', null, 7, C.green)
      );
    },
    thermal: function () {
      return wrap(
        path('M40 18a10 10 0 0 1 20 0v40a18 18 0 1 1-20 0z', C.white)
        + circ(50, 74, 12, C.red)
        + rect(46, 30, 8, 40, 4, C.red)
        + path('M68 30c0-8-6-8-6-14M80 38c0-8-6-8-6-14', null, 3.2)
      );
    },
    battery: function () {
      return wrap(
        rect(10, 30, 72, 40, 8, C.white)
        + rect(84, 42, 8, 16, 3, C.steelD)
        + rect(17, 37, 22, 26, 4, C.green)
        + rect(43, 37, 22, 26, 4, C.green)
        + rect(69, 37, 8, 26, 3, 'rgba(0,0,0,.12)')
      );
    },
    power: function () {
      return wrap(
        path('M32 14v22M62 14v22', null, 6)
        + path('M20 36h56v14a28 28 0 0 1-56 0z', C.blue)
        + path('M48 50v36', null, 6)
        + path('M56 60l-12 14h10l-8 14', null, 5, C.amber)
      );
    },
    smart: function () {
      return wrap(
        rect(10, 24, 80, 52, 8, C.steel)
        + circ(38, 50, 18, C.dark)
        + circ(38, 50, 5, C.steelL)
        + path('M58 50h6l4-10 6 20 4-10h6', null, 4, C.green)
      );
    },
    bench: function () {
      return wrap(
        path('M12 74a38 38 0 1 1 76 0z', C.dark)
        + path('M50 74L74 44', null, 7, C.red)
        + circ(50, 74, 7, C.steel)
        + path('M22 62l6-4M50 38v-7M78 62l-6-4', null, 3.6, C.white)
      );
    },
    activity: function () {
      return wrap(
        rect(10, 16, 80, 68, 8, C.white)
        + rect(22, 52, 12, 22, 3, C.blue)
        + rect(40, 38, 12, 36, 3, C.amber)
        + rect(58, 28, 12, 46, 3, C.red)
        + path('M18 74h64', null, 3)
      );
    },
    storage_used: function () {
      return wrap(
        circ(50, 50, 36, C.white)
        + path('M50 50V14a36 36 0 0 1 31 54z', C.red)
        + circ(50, 50, 13, C.dark)
      );
    },
    settings: function () {
      return wrap(
        path('M50 20a30 30 0 1 1 0 60 30 30 0 0 1 0-60z', C.steel)
        + circ(50, 50, 12, C.dark)
        + path('M50 8v12M50 80v12M8 50h12M80 50h12M20 20l9 9M71 71l9 9M80 20l-9 9M29 71l-9 9', null, 5)
      );
    },
    network: function () {
      return wrap(
        circ(20, 50, 11, C.blue) + circ(50, 50, 11, C.green) + circ(80, 50, 11, C.amber)
        + path('M31 50h8M61 50h8', null, 5)
        + path('M20 28v-8M50 28v-8M80 28v-8', null, 3.4)
      );
    },
    browser: function () {
      return wrap(
        circ(50, 50, 36, C.blue)
        + path('M14 50h72M50 14c12 14 12 58 0 72M50 14c-12 14-12 58 0 72', null, 3)
      );
    },
    meter: function () { return TOOL.multimeter(); }
  };

  // ── parts ──────────────────────────────────────────────────────────
  var PART = {
    storage: function () {
      return wrap(
        rect(8, 32, 78, 36, 6, C.dark)
        + rect(16, 40, 26, 20, 3, C.steelD)
        + rect(48, 40, 30, 20, 3, C.steelD)
        + path('M86 40v6M86 54v6', null, 3)
        + path('M14 68v6M26 68v6M38 68v6M50 68v6M62 68v6M74 68v6', null, 3)
      );
    },
    ram: function () {
      return wrap(
        rect(6, 34, 88, 28, 4, C.green)
        + rect(14, 40, 16, 16, 2, C.dark) + rect(34, 40, 16, 16, 2, C.dark)
        + rect(54, 40, 16, 16, 2, C.dark) + rect(74, 40, 14, 16, 2, C.dark)
        + path('M14 62v8M26 62v8M38 62v8M50 62v8M62 62v8M74 62v8M86 62v8', null, 3)
      );
    },
    battery: function () {
      return wrap(
        rect(10, 22, 80, 56, 8, C.dark)
        + rect(18, 30, 20, 40, 4, C.green)
        + rect(42, 30, 20, 40, 4, C.green)
        + rect(66, 30, 16, 40, 4, C.green)
        + path('M50 8v14', null, 5)
        + path('M44 12h12', null, 5)
      );
    },
    screen: function () {
      return wrap(
        rect(8, 16, 84, 58, 6, C.dark)
        + rect(15, 23, 70, 44, 3, C.blue)
        + shine('M24 32l14 24')
        + path('M34 82h32', null, 6)
      );
    },
    thermal: function () {
      return wrap(
        '<g transform="rotate(-24 50 50)">'
        + rect(34, 12, 32, 44, 6, C.white)
        + rect(34, 32, 32, 24, 6, C.steelD)
        + rect(28, 4, 44, 10, 5, C.amber)
        + rect(44, 56, 12, 10, 3, C.steel)
        + '</g>'
        + circ(72, 80, 8, C.steelD)
      );
    },
    fan: function () {
      return wrap(
        rect(8, 8, 84, 84, 10, C.dark)
        + circ(50, 50, 34, C.steelD)
        + path('M50 50c0-18 6-26 18-22 6 2 4 14-18 22z', C.steel)
        + path('M50 50c18 0 26 6 22 18-2 6-14 4-22-18z', C.steel)
        + path('M50 50c0 18-6 26-18 22-6-2-4-14 18-22z', C.steel)
        + path('M50 50c-18 0-26-6-22-18 2-6 14-4 22 18z', C.steel)
        + circ(50, 50, 9, C.amber)
      );
    },
    flex: function () {
      return wrap(
        path('M12 30c22 0 22 40 44 40s32-18 32-18', null, 17, C.amber)
        + '<path d="M12 30c22 0 22 40 44 40s32-18 32-18" fill="none" stroke="' + C.amberD + '" stroke-width="4" stroke-dasharray="6 5"/>'
        + rect(6, 20, 14, 20, 3, C.dark)
      );
    },
    caps: function () {
      return wrap(
        rect(22, 20, 24, 50, 6, C.blue)
        + rect(54, 20, 24, 50, 6, C.steelD)
        + path('M34 70v18M66 70v18', null, 4)
        + path('M28 30h12M60 30h12', null, 3)
      );
    }
  };

  // ── the machine on the mat ─────────────────────────────────────────
  /*
   * Closed, it is a shell with screws on it. Open, you can see why you
   * opened it: a board, its chips, and an empty bay with a socket in it.
   * The difference has to be obvious at a glance, because "is this thing
   * open yet" is the question the whole teardown turns on.
   */
  function machine(kind, open) {
    if (!open) {
      // A phone is not a laptop and a student should not have to be told so.
      if (kind === 'phone') {
        return wrap(rect(30, 4, 40, 92, 10, C.dark)
          + rect(35, 12, 30, 72, 3, '#121722') + shine('M40 20v28'));
      }
      if (kind === 'tablet') {
        return wrap(rect(16, 6, 68, 88, 9, C.dark)
          + rect(22, 12, 56, 76, 3, '#121722') + shine('M30 20v34'));
      }
      if (kind === 'handheld') {
        return wrap(rect(20, 26, 60, 48, 8, '#121722')
          + path('M20 30a14 14 0 0 0-14 14v12a14 14 0 0 0 28 0V44a14 14 0 0 0-14-14z', C.dark)
          + path('M80 30a14 14 0 0 1 14 14v12a14 14 0 0 1-28 0V44a14 14 0 0 1 14-14z', C.dark)
          + circ(14, 44, 4, C.steelD) + circ(86, 44, 4, C.steelD));
      }
      if (kind === 'desktop' || kind === 'console' || kind === 'aio') {
        return wrap(rect(16, 8, 68, 84, 10, C.dark) + shine('M28 22v40'));
      }
      return wrap(path('M16 66V16a6 6 0 0 1 6-6h56a6 6 0 0 1 6 6v50z', C.dark)
        + shine('M28 22v34')
        + path('M6 66h88l6 14a4 4 0 0 1-4 6H4a4 4 0 0 1-4-6z', C.steelD));
    }
    // Opened: the inside, with somewhere for a part to go.
    return wrap(
      rect(6, 10, 88, 80, 10, C.darkD)
      + rect(12, 16, 76, 68, 6, C.board)
      // traces
      + path('M20 30h24v14h20M30 74h34V56h14M56 20v10', null, 2.4, C.boardD)
      // chips
      + rect(18, 22, 18, 14, 2, C.dark)
      + rect(62, 24, 22, 16, 2, C.dark)
      + rect(18, 48, 14, 12, 2, C.dark)
      // the empty bay
      + rect(40, 52, 44, 24, 4, C.darkD)
      + path('M46 58h32M46 64h32M46 70h24', null, 2.6, C.steelD)
    );
  }

  function art(kind, id) {
    var fn = kind === 'tool'
      ? (DRIVER_COLOUR[driverFamily(id)] && String(id).indexOf('-') > 0 ? function () { return driver(id); } : TOOL[id])
      : kind === 'instrument' ? INSTR[id]
      : kind === 'part' ? PART[id] : null;
    return fn ? fn() : wrap(circ(50, 50, 30, C.steelD));
  }

  window.TechOpsLiteArt = {
    tool: function (id) { return art('tool', id); },
    instrument: function (id) { return art('instrument', id); },
    part: function (cat) { return art('part', cat); },
    machine: machine,
    driverColour: function (id) { return (DRIVER_COLOUR[driverFamily(id)] || DRIVER_COLOUR.phillips)[0]; },
    has: function (kind, id) {
      return kind === 'tool' ? !!(TOOL[id] || DRIVER_COLOUR[driverFamily(id)])
           : kind === 'instrument' ? !!INSTR[id] : !!PART[id];
    }
  };
})(window);
