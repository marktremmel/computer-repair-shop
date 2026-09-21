/**
 * TechOps Budapest — the board renderer.
 *
 * Draws the per-device layouts from `data-boards.js`, so "disconnect the
 * battery" means putting a tool on the actual connector at the actual place it
 * sits on that machine's board.
 *
 * This file used to carry a second, schematic set of chassis layouts that only
 * existed to position precision gestures. They were a different coordinate
 * system from the board actually on screen, so the markers landed near the
 * right component rather than on it. `chipCentre()` in `ui-bench.js` now
 * measures the rendered SVG instead, and the schematic layouts are gone.
 */
(function (window) {
  'use strict';

  function xml(v) { return String(v).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

  // ── drawing ─────────────────────────────────────────────────────────

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
    var cBadge = '';
    var cx1 = c.x + c.w - 9, cy1 = c.y + 9;
    if (st.faulty) {
      cBadge = '<g class="reg-badge reg-badge-faulty">'
        + '<circle cx="' + cx1 + '" cy="' + cy1 + '" r="7.5" class="reg-badge-bg"/>'
        + '<text x="' + cx1 + '" y="' + (cy1 + 1) + '" class="reg-badge-text" style="font-size:calc(9.5px * var(--a11y-scale, 1))">⚠</text></g>';
    } else if (st.done) {
      cBadge = '<g class="reg-badge reg-badge-done">'
        + '<circle cx="' + cx1 + '" cy="' + cy1 + '" r="7.5" class="reg-badge-bg"/>'
        + '<text x="' + cx1 + '" y="' + (cy1 + 1) + '" class="reg-badge-text" style="font-size:calc(9.5px * var(--a11y-scale, 1))">✓</text></g>';
    } else if (st.target) {
      cBadge = '<g class="reg-badge reg-badge-target">'
        + '<circle cx="' + cx1 + '" cy="' + cy1 + '" r="7.5" class="reg-badge-bg"/>'
        + '<text x="' + cx1 + '" y="' + (cy1 + 1) + '" class="reg-badge-text" style="font-size:calc(9.5px * var(--a11y-scale, 1))">⦿</text></g>';
    }
    return o + cBadge + '<title>' + xml(c.title || c.label || c.role) + '</title></g>';
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
        if (c.cutout || !c.label) return;
        svg += '<text class="bchip-label" x="' + (c.x + c.w / 2) + '" y="' + (c.y + c.h + 11)
          + '" text-anchor="middle">' + xml(c.label || '') + '</text>';
      });
    }
    return svg + '</svg>';
  }



  window.TechOpsBoard = { renderReal: renderReal };
})(window);
