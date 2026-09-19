/**
 * TechOps Budapest — board layouts.
 *
 * Every machine gets a drawn internal layout rather than a grid of cards, so
 * "disconnect the battery" means putting a tool on the actual connector at the
 * actual place it sits. Coordinates are in a 1000 × 660 space and scale to fit.
 */
(function (window) {
  'use strict';

  /** A region is something you can look at, point a tool at, or drop a part into. */
  function R(id, x, y, w, h, label, opts) {
    return Object.assign({ id: id, x: x, y: y, w: w, h: h, label: label, r: 6 }, opts || {});
  }

  var LAYOUTS = {
    // ── a laptop you can still service ────────────────────────────────
    laptop_classic: {
      w: 1000, h: 660,
      hull: { x: 24, y: 24, w: 952, h: 612, r: 26 },
      regions: [
        R('logic_board', 60, 58, 880, 250, 'Logic board', { kind: 'board' }),
        R('fan',          700, 78, 210, 210, 'Fan', { kind: 'fan', r: 105 }),
        R('heatsink',     300, 132, 380, 62,  'Heatsink', { kind: 'heatsink' }),
        R('die',          300, 132, 78,  62,  'SoC / CPU die', { kind: 'die' }),
        R('drive_bay',    88,  208, 190, 92,  'Drive bay', { kind: 'slot', cat: 'storage' }),
        R('ram_bay',      420, 214, 250, 84,  'Memory slots', { kind: 'dimm', cat: 'ram' }),
        R('display_flex', 452, 34,  96,  30,  'Display flex', { kind: 'connector' }),
        R('battery_connector', 470, 318, 66, 30, 'Battery connector', { kind: 'connector', live: true }),
        R('battery',      70,  348, 860, 268, 'Battery pack', { kind: 'battery', cells: 3, cat: 'battery' })
      ]
    },

    // ── a laptop where almost nothing is a part ───────────────────────
    laptop_modern: {
      w: 1000, h: 660,
      hull: { x: 24, y: 24, w: 952, h: 612, r: 30 },
      regions: [
        R('logic_board', 250, 54, 500, 190, 'Logic board (everything soldered)', { kind: 'board' }),
        R('fan',          96,  62, 172, 172, 'Fan', { kind: 'fan', r: 86 }),
        R('fan2',         744, 62, 172, 172, 'Fan', { kind: 'fan', r: 86 }),
        R('heatsink',     400, 104, 210, 56, 'Heat spreader', { kind: 'heatsink' }),
        R('die',          400, 104, 70,  56, 'SoC die', { kind: 'die' }),
        R('display_flex', 452, 30,  96,  28, 'Display flex', { kind: 'connector' }),
        R('battery_connector', 470, 252, 66, 30, 'Battery connector', { kind: 'connector', live: true }),
        R('battery',      66,  286, 868, 330, 'Battery (adhesive-bonded)', { kind: 'battery', cells: 6, cat: 'battery', glued: true })
      ]
    },

    // ── tower ─────────────────────────────────────────────────────────
    desktop: {
      w: 1000, h: 660,
      hull: { x: 24, y: 24, w: 952, h: 612, r: 10 },
      regions: [
        R('logic_board', 60, 56, 640, 560, 'Motherboard', { kind: 'board' }),
        R('cooler',      190, 140, 250, 250, 'CPU cooler', { kind: 'fan', r: 122 }),
        R('die',         252, 202, 126, 126, 'CPU socket', { kind: 'die' }),
        R('ram_bay',     500, 96,  164, 300, 'DIMM slots ×4', { kind: 'dimm', cat: 'ram', vertical: true }),
        R('drive_bay',   140, 440, 400, 54,  'M.2 slot', { kind: 'slot', cat: 'storage' }),
        R('psu_switch',  740, 56,  210, 200, 'Power supply', { kind: 'psu', live: true }),
        R('fan',         740, 300, 210, 210, 'Case fan', { kind: 'fan', r: 100 })
      ]
    },

    phone: {
      w: 1000, h: 660,
      hull: { x: 210, y: 18, w: 580, h: 624, r: 58 },
      regions: [
        R('logic_board', 244, 56, 226, 280, 'Logic board', { kind: 'board' }),
        R('display_flex', 268, 84, 120, 34, 'Display flex', { kind: 'connector' }),
        R('battery_connector', 268, 140, 96, 32, 'Battery connector', { kind: 'connector', live: true }),
        R('battery',     250, 352, 500, 250, 'Battery', { kind: 'battery', cells: 1, cat: 'battery', glued: true }),
        R('charge_port', 400, 596, 200, 34, 'Charge port flex', { kind: 'connector', cat: 'flex' }),
        R('screen_lift', 500, 56, 256, 280, 'Camera / shield plate', { kind: 'board' })
      ]
    },

    tablet: {
      w: 1000, h: 660,
      hull: { x: 120, y: 20, w: 760, h: 620, r: 34 },
      regions: [
        R('logic_board', 160, 52, 680, 120, 'Logic board', { kind: 'board' }),
        R('display_flex', 300, 74, 130, 32, 'Display flex ×2', { kind: 'connector' }),
        R('battery_connector', 470, 74, 96, 32, 'Battery connector', { kind: 'connector', live: true }),
        R('battery',     164, 200, 330, 400, 'Battery cell A', { kind: 'battery', cells: 1, cat: 'battery', glued: true }),
        R('battery_b',   508, 200, 330, 400, 'Battery cell B', { kind: 'battery', cells: 1, glued: true }),
        R('charge_port', 440, 604, 140, 30, 'Charge port', { kind: 'connector', cat: 'flex' })
      ]
    },

    aio: {
      w: 1000, h: 660,
      hull: { x: 24, y: 24, w: 952, h: 612, r: 12 },
      regions: [
        R('logic_board', 170, 330, 660, 260, 'Logic board', { kind: 'board' }),
        R('display_flex', 430, 300, 140, 34, 'Display flex', { kind: 'connector' }),
        R('fan',         740, 366, 180, 180, 'Fan', { kind: 'fan', r: 90 }),
        R('heatsink',    280, 400, 330, 60, 'Heatsink', { kind: 'heatsink' }),
        R('die',         280, 400, 74, 60, 'SoC die', { kind: 'die' }),
        R('speakers',    120, 596, 760, 42, 'Speaker bar', { kind: 'board' })
      ]
    }
  };

  var KIND_FOR = {
    laptop: 'laptop_classic', desktop: 'desktop', phone: 'phone', tablet: 'tablet', aio: 'aio'
  };

  function layoutFor(machine) {
    if (machine.kind === 'laptop' && machine.ramSoldered && machine.storageSoldered) return LAYOUTS.laptop_modern;
    return LAYOUTS[KIND_FOR[machine.kind]] || LAYOUTS.laptop_classic;
  }

  // ── drawing ─────────────────────────────────────────────────────────
  function drawRegion(g, state) {
    var cls = 'reg reg-' + g.kind + (state.open ? ' open' : ' hidden')
      + (state.target ? ' target' : '') + (state.faulty ? ' faulty' : '') + (state.done ? ' done' : '');
    var body = '';

    if (g.kind === 'fan') {
      var cx = g.x + g.w / 2, cy = g.y + g.h / 2, rr = g.r || Math.min(g.w, g.h) / 2;
      body = '<circle cx="' + cx + '" cy="' + cy + '" r="' + rr + '" class="fan-housing"/>';
      for (var i = 0; i < 9; i++) {
        var a = (Math.PI * 2 / 9) * i;
        body += '<path class="fan-blade" d="M ' + cx + ' ' + cy
          + ' Q ' + (cx + rr * 0.62 * Math.cos(a - 0.35)) + ' ' + (cy + rr * 0.62 * Math.sin(a - 0.35))
          + ' ' + (cx + rr * 0.9 * Math.cos(a)) + ' ' + (cy + rr * 0.9 * Math.sin(a)) + ' Z"/>';
      }
      body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rr * 0.22) + '" class="fan-hub"/>';
    } else if (g.kind === 'battery') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="12" class="batt-body"/>';
      var n = g.cells || 3, pad = 12, cw = (g.w - pad * (n + 1)) / n;
      for (var c = 0; c < n; c++) {
        body += '<rect x="' + (g.x + pad + c * (cw + pad)) + '" y="' + (g.y + pad) + '" width="' + cw
          + '" height="' + (g.h - pad * 2) + '" rx="8" class="batt-cell"/>';
      }
      if (g.glued) {
        for (var t = 0; t < 2; t++) {
          body += '<rect x="' + (g.x + g.w * (0.28 + t * 0.4)) + '" y="' + (g.y - 16) + '" width="70" height="20" rx="5" class="pull-tab"/>';
        }
      }
    } else if (g.kind === 'dimm') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="6" class="slot-body"/>';
      var slots = g.vertical ? 4 : 2;
      for (var d = 0; d < slots; d++) {
        body += g.vertical
          ? '<rect x="' + (g.x + 12 + d * ((g.w - 24) / slots)) + '" y="' + (g.y + 10) + '" width="' + ((g.w - 24) / slots - 8) + '" height="' + (g.h - 20) + '" rx="3" class="slot-rail"/>'
          : '<rect x="' + (g.x + 10) + '" y="' + (g.y + 10 + d * ((g.h - 20) / slots)) + '" width="' + (g.w - 20) + '" height="' + ((g.h - 20) / slots - 8) + '" rx="3" class="slot-rail"/>';
      }
    } else if (g.kind === 'connector') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="5" class="conn-body"/>';
      var pins = Math.max(4, Math.round(g.w / 11));
      for (var p = 0; p < pins; p++) {
        body += '<rect x="' + (g.x + 5 + p * ((g.w - 10) / pins)) + '" y="' + (g.y + 5) + '" width="3" height="' + (g.h - 10) + '" class="conn-pin"/>';
      }
    } else if (g.kind === 'die') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="4" class="die-body"/>'
           + '<rect x="' + (g.x + 8) + '" y="' + (g.y + 8) + '" width="' + (g.w - 16) + '" height="' + (g.h - 16) + '" rx="2" class="die-core"/>';
    } else if (g.kind === 'heatsink') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="7" class="hs-body"/>';
      for (var f = 0; f < Math.round(g.w / 16); f++) {
        body += '<rect x="' + (g.x + 8 + f * 16) + '" y="' + (g.y + 6) + '" width="7" height="' + (g.h - 12) + '" class="hs-fin"/>';
      }
    } else if (g.kind === 'psu') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="8" class="psu-body"/>'
           + '<circle cx="' + (g.x + g.w / 2) + '" cy="' + (g.y + g.h / 2) + '" r="' + (Math.min(g.w, g.h) / 2 - 18) + '" class="psu-grille"/>';
    } else if (g.kind === 'slot') {
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="6" class="slot-body"/>'
           + '<rect x="' + (g.x + 10) + '" y="' + (g.y + 10) + '" width="' + (g.w - 20) + '" height="' + (g.h - 20) + '" rx="4" class="slot-rail"/>';
    } else {
      // A real board is mostly small parts: regulator stages, capacitor banks,
      // the chipset under its own heatsink, headers along the edges. Drawing
      // seven grey rectangles made every machine look like the same empty slab.
      body = '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="' + g.r + '" class="board-body"/>';

      // Deterministic per region, so a board looks the same every render.
      var seed = (g.x * 31 + g.y * 17 + g.w) >>> 0;
      var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

      // Copper traces
      var tr = '';
      for (var tI = 0; tI < Math.round(g.w / 46); tI++) {
        var tx = g.x + 14 + rnd() * (g.w - 28);
        var ty = g.y + 10 + rnd() * (g.h - 20);
        tr += '<path class="trace" d="M' + tx.toFixed(0) + ' ' + ty.toFixed(0)
           + 'h' + (14 + rnd() * 30).toFixed(0) + 'l' + (8 + rnd() * 10).toFixed(0) + ' ' + (rnd() > .5 ? '' : '-')
           + (8 + rnd() * 12).toFixed(0) + 'h' + (12 + rnd() * 26).toFixed(0) + '"/>';
      }
      body += tr;

      // VRM: a row of chokes with a MOSFET under each
      var phases = Math.max(3, Math.min(8, Math.round(g.w / 90)));
      for (var v = 0; v < phases; v++) {
        var vx = g.x + 16 + v * ((g.w - 34) / phases);
        body += '<rect class="choke" x="' + vx.toFixed(0) + '" y="' + (g.y + 10) + '" width="17" height="17" rx="3"/>'
             +  '<rect class="mosfet" x="' + vx.toFixed(0) + '" y="' + (g.y + 31) + '" width="17" height="10" rx="1.5"/>';
      }

      // Electrolytic capacitors, in the clusters they actually sit in
      var caps = Math.max(4, Math.round(g.w * g.h / 5200));
      for (var c2 = 0; c2 < caps; c2++) {
        var cx2 = g.x + 24 + rnd() * (g.w - 48);
        var cy2 = g.y + 50 + rnd() * Math.max(10, g.h - 70);
        var cr = 5 + rnd() * 3;
        body += '<circle class="cap" cx="' + cx2.toFixed(0) + '" cy="' + cy2.toFixed(0) + '" r="' + cr.toFixed(1) + '"/>'
             +  '<path class="cap-mark" d="M' + (cx2 - cr * .55).toFixed(1) + ' ' + cy2.toFixed(0)
             +  'h' + (cr * 1.1).toFixed(1) + '"/>';
      }

      // Surface-mount speckle — resistors and small caps
      for (var sm = 0; sm < Math.round(g.w * g.h / 1100); sm++) {
        var sx = g.x + 10 + rnd() * (g.w - 20);
        var sy = g.y + 10 + rnd() * (g.h - 20);
        var horiz = rnd() > .45;
        body += '<rect class="smd" x="' + sx.toFixed(0) + '" y="' + sy.toFixed(0)
             + '" width="' + (horiz ? 7 : 3) + '" height="' + (horiz ? 3 : 7) + '" rx="1"/>';
      }

      // Chipset under a low heatsink, plus a BIOS chip and a coin cell
      if (g.w > 260) {
        var chx = g.x + g.w * 0.56, chy = g.y + g.h * 0.52;
        body += '<rect class="chipset" x="' + chx.toFixed(0) + '" y="' + chy.toFixed(0) + '" width="54" height="54" rx="4"/>';
        for (var fI = 0; fI < 6; fI++) {
          body += '<rect class="chipset-fin" x="' + (chx + 5 + fI * 8).toFixed(0) + '" y="' + (chy + 5).toFixed(0) + '" width="4" height="44"/>';
        }
        body += '<rect class="bios" x="' + (g.x + g.w * 0.24).toFixed(0) + '" y="' + (g.y + g.h * 0.66).toFixed(0) + '" width="26" height="16" rx="2"/>';
        body += '<circle class="coincell" cx="' + (g.x + g.w * 0.13).toFixed(0) + '" cy="' + (g.y + g.h * 0.74).toFixed(0) + '" r="13"/>';
      }

      // Pin headers along the bottom edge
      var hdr = Math.round(g.w / 120);
      for (var h2 = 0; h2 < hdr; h2++) {
        var hx = g.x + 22 + h2 * ((g.w - 44) / Math.max(1, hdr));
        body += '<rect class="header" x="' + hx.toFixed(0) + '" y="' + (g.y + g.h - 16) + '" width="34" height="9" rx="1.5"/>';
        for (var pI = 0; pI < 8; pI++) {
          body += '<rect class="header-pin" x="' + (hx + 2 + pI * 4).toFixed(0) + '" y="' + (g.y + g.h - 14) + '" width="2" height="5"/>';
        }
      }
    }

    return '<g class="' + cls + '" data-region="' + g.id + '" tabindex="0" role="button" aria-label="' + g.label + '">'
      + body + '<title>' + g.label + '</title></g>';
  }

  /**
   * @param opts.open      set of region ids currently exposed
   * @param opts.target    region id to highlight
   * @param opts.faulty    region id showing the discovered fault
   * @param opts.done      set of region ids already dealt with
   */
  /** Draw one chip/connector from a real board layout. */
  function drawChip(c, L, st) {
    var R = window.TechOpsChipRoles;
    var tint = R ? R.colour(c.role) : '#6b7280';
    var cls = 'bchip bchip-' + c.role + (c.big ? ' big' : '') + (c.cutout ? ' cutout' : '')
      + (st.target ? ' target' : '') + (st.faulty ? ' faulty' : '') + (st.done ? ' done' : '');
    var o = '<g class="' + cls + '" data-region="' + c.id + '" data-role="' + c.role + '" tabindex="0">';

    if (c.cutout) {
      o += '<circle cx="' + (c.x + c.w / 2) + '" cy="' + (c.y + c.h / 2) + '" r="' + (Math.min(c.w, c.h) / 2) + '" class="bcut"/>';
      for (var b = 0; b < 9; b++) {
        var a = (Math.PI * 2 / 9) * b, cx0 = c.x + c.w / 2, cy0 = c.y + c.h / 2, rr = Math.min(c.w, c.h) / 2;
        o += '<path class="bcut-blade" d="M' + cx0 + ' ' + cy0
          + 'Q' + (cx0 + rr * .6 * Math.cos(a - .35)) + ' ' + (cy0 + rr * .6 * Math.sin(a - .35))
          + ' ' + (cx0 + rr * .88 * Math.cos(a)) + ' ' + (cy0 + rr * .88 * Math.sin(a)) + 'Z"/>';
      }
    } else if (c.round) {
      o += '<circle cx="' + (c.x + c.w / 2) + '" cy="' + (c.y + c.h / 2) + '" r="' + (c.w / 2)
        + '" class="bcoin" style="--tint:' + tint + '"/>';
    } else if (c.slot) {
      o += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="3" class="bslot"/>'
        +  '<rect x="' + (c.x + 5) + '" y="' + (c.y + c.h / 2 - 2) + '" width="' + (c.w - 10) + '" height="4" class="bslot-rail"/>';
    } else if (c.slots) {
      o += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="3" class="bslot"/>';
      for (var d2 = 0; d2 < c.slots; d2++) {
        o += '<rect x="' + (c.x + 8) + '" y="' + (c.y + 8 + d2 * ((c.h - 16) / c.slots)) + '" width="' + (c.w - 16)
          + '" height="' + ((c.h - 16) / c.slots - 8) + '" rx="2" class="bslot-rail"/>';
      }
    } else if (c.array) {
      o += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="3" class="barray" style="--tint:' + tint + '"/>';
      var horiz = c.w >= c.h;
      for (var q = 0; q < c.array; q++) {
        var qx = horiz ? c.x + 6 + q * ((c.w - 12) / c.array) : c.x + 6;
        var qy = horiz ? c.y + 6 : c.y + 6 + q * ((c.h - 12) / c.array);
        o += '<rect x="' + qx.toFixed(0) + '" y="' + qy.toFixed(0) + '" width="'
          + (horiz ? Math.max(5, (c.w - 12) / c.array - 4) : c.w - 12).toFixed(0) + '" height="'
          + (horiz ? c.h - 12 : Math.max(5, (c.h - 12) / c.array - 4)).toFixed(0) + '" rx="1.5" class="barray-cell"/>';
      }
    } else {
      o += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="' + (c.big ? 6 : 3)
        + '" class="bpkg" style="--tint:' + tint + '"/>';
      if (c.big) o += '<rect x="' + (c.x + 12) + '" y="' + (c.y + 12) + '" width="' + (c.w - 24)
        + '" height="' + (c.h - 24) + '" rx="3" class="bdie"/>';
      // pin rows, so a package reads as a package
      var pins = Math.max(3, Math.round(c.w / 13));
      for (var pI = 0; pI < pins; pI++) {
        var px = c.x + 4 + pI * ((c.w - 8) / pins);
        o += '<rect class="bpin" x="' + px.toFixed(1) + '" y="' + (c.y - 2.5) + '" width="2.5" height="3"/>'
          +  '<rect class="bpin" x="' + px.toFixed(1) + '" y="' + (c.y + c.h - 0.5) + '" width="2.5" height="3"/>';
      }
    }
    return o + '<title>' + (c.label || c.role) + '</title></g>';
  }

  /** Copper fan-out from the big package, which is what a board actually looks like. */
  function traces(L) {
    var hub = L.chips.filter(function (c) { return c.big; })[0];
    if (!hub) return '';
    var hx = hub.x + hub.w / 2, hy = hub.y + hub.h / 2, out = '';
    L.chips.forEach(function (c) {
      if (c === hub || c.cutout) return;
      var cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      var mx = (hx + cx) / 2;
      out += '<path class="btrace" d="M' + hx.toFixed(0) + ' ' + hy.toFixed(0)
        + 'H' + mx.toFixed(0) + 'V' + cy.toFixed(0) + 'H' + cx.toFixed(0) + '"/>';
    });
    return out;
  }

  /**
   * The real board for this machine. `opts.inspect` labels every chip;
   * `opts.open`/`done`/`faulty`/`target` mark the components you are working on.
   */
  function renderReal(machine, opts) {
    opts = opts || {};
    var L = window.TechOpsBoards.forMachine(machine);
    var done = opts.done || {}, openR = opts.open || {};

    var svg = '<svg class="board-svg real" viewBox="0 0 ' + L.w + ' ' + L.h + '" preserveAspectRatio="xMidYMid meet">'
      + '<defs><pattern id="pcbmask" width="26" height="26" patternUnits="userSpaceOnUse">'
      + '<rect width="26" height="26" fill="' + L.pcb + '"/>'
      + '<circle cx="13" cy="13" r="1.1" fill="rgba(255,255,255,.045)"/></pattern></defs>'
      + '<rect x="4" y="4" width="' + (L.w - 8) + '" height="' + (L.h - 8) + '" rx="14" fill="url(#pcbmask)" '
      + 'stroke="#2d6b47" stroke-width="3"/>'
      + traces(L);

    L.chips.forEach(function (c) {
      svg += drawChip(c, L, {
        target: opts.target === c.id,
        faulty: opts.faulty === c.id,
        done: !!done[c.id] || !!openR[c.id]
      });
    });

    if (opts.inspect) {
      L.chips.forEach(function (c) {
        if (c.cutout) return;
        svg += '<text class="bchip-label" x="' + (c.x + c.w / 2) + '" y="' + (c.y + c.h + 11)
          + '" text-anchor="middle">' + (c.label || '') + '</text>';
      });
    }
    return svg + '</svg>';
  }

  function render(machine, opts) {
    opts = opts || {};
    var L = layoutFor(machine);
    var open = opts.open || {}, done = opts.done || {};

    var svg = '<svg class="board-svg" viewBox="0 0 ' + L.w + ' ' + L.h + '" preserveAspectRatio="xMidYMid meet">'
      + '<rect x="' + L.hull.x + '" y="' + L.hull.y + '" width="' + L.hull.w + '" height="' + L.hull.h
      + '" rx="' + L.hull.r + '" class="hull"/>';

    L.regions.forEach(function (g) {
      svg += drawRegion(g, {
        open: !!open[g.id] || opts.allOpen,
        target: opts.target === g.id,
        faulty: opts.faulty === g.id,
        done: !!done[g.id]
      });
    });
    return svg + '</svg>';
  }

  function region(machine, id) {
    var L = layoutFor(machine);
    for (var i = 0; i < L.regions.length; i++) if (L.regions[i].id === id) return L.regions[i];
    return null;
  }

  window.TechOpsBoard = {
    LAYOUTS: LAYOUTS, layoutFor: layoutFor, render: render, region: region,
    renderReal: renderReal
  };
})(window);
