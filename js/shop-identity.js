/**
 * TechOps Budapest — your shop's own mark.
 *
 * You already name the shop; naming it and then looking at somebody else's
 * sign is a small, constant disappointment. A colour and a mark are two
 * clicks, cost nothing, and they turn "a shop" into "your shop" — which is
 * the whole reason the character builder is in here.
 *
 * Applied as CSS variables on <html>, so the top bar, the brand mark and the
 * neon sign on the title screen all pick it up without anything re-running.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;

  var COLOURS = [
    { id: 'amber',  name: 'Sodium',    hex: '#f0a830' },
    { id: 'green',  name: 'Neon mint', hex: '#3ddc91' },
    { id: 'blue',   name: 'Cold blue', hex: '#5aa9ff' },
    { id: 'violet', name: 'Violet',    hex: '#a78bfa' },
    { id: 'pink',   name: 'Hot pink',  hex: '#ff5fa8' },
    { id: 'red',    name: 'Ruby',      hex: '#ff5f6d' },
    { id: 'teal',   name: 'Teal',      hex: '#00d5e0' },
    { id: 'lime',   name: 'Acid',      hex: '#b8f24a' }
  ];

  var MARKS = [
    { id: 'repair',  name: 'Driver & spanner' },
    { id: 'bench',   name: 'Workbench' },
    { id: 'laptop',  name: 'Laptop' },
    { id: 'parts',   name: 'Parts box' },
    { id: 'gauge',   name: 'Gauge' },
    { id: 'coffee',  name: 'Coffee' },
    { id: 'star',    name: 'Star' },
    { id: 'medal',   name: 'Medal' }
  ];

  function colourOf(p) {
    var want = p && p.shopColour;
    for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i].id === want) return COLOURS[i];
    return COLOURS[0];
  }
  function markOf(p) {
    var want = p && p.shopMark;
    for (var i = 0; i < MARKS.length; i++) if (MARKS[i].id === want) return MARKS[i];
    return MARKS[0];
  }

  /**
   * Push the choice into the page. Safe to call at any time.
   *
   * Takes an optional object so the setup screen can preview a draft the
   * player has not saved yet — the top bar changes colour under the modal
   * while they are still choosing, which is the point of choosing.
   */
  function apply(draft) {
    var p = draft || Shop.state.player || {};
    var c = colourOf(p);
    document.documentElement.style.setProperty('--brand', c.hex);
    // Black on a bright sign reads; black on a dark one does not.
    var r = parseInt(c.hex.slice(1, 3), 16), g = parseInt(c.hex.slice(3, 5), 16), b = parseInt(c.hex.slice(5, 7), 16);
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    document.documentElement.setAttribute('data-brand-dark', lum < 0.52 ? '1' : '0');
    var mark = document.getElementById('brand-mark');
    if (mark && window.TechOpsIcons) {
      mark.innerHTML = window.TechOpsIcons.icon(markOf(p).id, 18);
    }
  }

  /** The picker, used by the setup screen and the shop book. */
  function picker(p) {
    var c = colourOf(p), mk = markOf(p);
    return '<div class="ident">'
      + '<div class="ident-sec"><div class="cb-label">Sign colour</div>'
      + '<div class="ident-row">' + COLOURS.map(function (x) {
          return '<button class="ident-col' + (x.id === c.id ? ' on' : '') + '" data-shopcol="' + x.id + '"'
            + ' title="' + x.name + '" style="--c:' + x.hex + '"></button>';
        }).join('') + '</div></div>'
      + '<div class="ident-sec"><div class="cb-label">Sign mark</div>'
      + '<div class="ident-row">' + MARKS.map(function (x) {
          return '<button class="ident-mark' + (x.id === mk.id ? ' on' : '') + '" data-shopmark="' + x.id + '"'
            + ' title="' + x.name + '">' + (window.TechOpsIcons ? window.TechOpsIcons.icon(x.id, 18) : '') + '</button>';
        }).join('') + '</div></div>'
      + '</div>';
  }

  /** `onPick` runs after each change so the caller can repaint its preview. */
  function bind(root, p, onPick) {
    root.querySelectorAll('[data-shopcol]').forEach(function (b) {
      b.addEventListener('click', function () {
        p.shopColour = b.getAttribute('data-shopcol');
        apply(p);
        if (onPick) onPick();
      });
    });
    root.querySelectorAll('[data-shopmark]').forEach(function (b) {
      b.addEventListener('click', function () {
        p.shopMark = b.getAttribute('data-shopmark');
        apply(p);
        if (onPick) onPick();
      });
    });
  }

  window.TechOpsIdentity = {
    COLOURS: COLOURS, MARKS: MARKS,
    colourOf: colourOf, markOf: markOf,
    apply: apply, picker: picker, bind: bind
  };
})(window);
