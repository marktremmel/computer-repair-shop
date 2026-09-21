/**
 * TechOps Budapest — Chip ID bench.
 *
 * A board laid out with its real chips on it. You pick a chip and say what it
 * does. Getting it wrong is cheap; the explanation is the point, and the
 * "how you could have told" line is the transferable part — most of these can
 * be worked out from the maker's name and the wording of the part number.
 *
 * Chip identifications come from iFixit's public chip-ID teardowns.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var R    = window.TechOpsChipRoles;
  var esc  = function (s) { return UI.esc(s); };

  var DATA = null;
  var state = { device: null, chips: [], picked: null, answers: {}, streak: 0 };

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (window.TechOpsChipData) {
      DATA = window.TechOpsChipData;
      return Promise.resolve(DATA);
    }
    return fetch('js/chipid-data.json?v=' + (window.TECHOPS_BUILD || '1'))
      .then(function (r) { return r.json(); })
      .then(function (j) { DATA = j; return j; })
      .catch(function (e) {
        if (window.TechOpsChipData) {
          DATA = window.TechOpsChipData;
          return DATA;
        }
        throw e;
      });
  }

  /** Deterministic positions so a board looks the same every time you open it. */
  function layout(deviceKey, chips) {
    var seed = 0;
    for (var i = 0; i < deviceKey.length; i++) seed = (seed * 31 + deviceKey.charCodeAt(i)) >>> 0;
    var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

    // Biggest first so the SoC lands centrally, the rest pack around it.
    var placed = [];
    chips.forEach(function (c, idx) {
      var big = c.r === 'soc';
      var w = big ? 132 : c.r === 'memory' || c.r === 'storage' ? 86 : 54 + rnd() * 30;
      var h = big ? 112 : c.r === 'memory' || c.r === 'storage' ? 62 : 34 + rnd() * 20;
      var x, y, tries = 0, ok;
      do {
        x = big ? 430 + rnd() * 40 : 40 + rnd() * (930 - w);
        y = big ? 250 + rnd() * 40 : 40 + rnd() * (570 - h);
        ok = placed.every(function (p) {
          return x + w + 10 < p.x || p.x + p.w + 10 < x || y + h + 10 < p.y || p.y + p.h + 10 < y;
        });
        tries++;
      } while (!ok && tries < 260);
      placed.push({ c: c, i: idx, x: x, y: y, w: w, h: h });
    });
    return placed;
  }

  function pickDevice(key) {
    state.device = key;
    state.chips = layout(key, DATA[key].chips);
    state.picked = null;
    state.answers = {};
    render();
  }

  function answer(roleKey) {
    var slot = state.chips[state.picked];
    if (!slot) return;
    var right = slot.c.r === roleKey;
    state.answers[state.picked] = { given: roleKey, right: right };
    if (right) {
      state.streak++;
      audio('playSuccessChime');
      if (state.streak === 5) {
        Shop.award('chip_reader');
        Shop.earn(4000, 'Board-level identification work');
        UI.toast('Five in a row', 'Word gets round that you read boards. A repair centre sends you 4.000 Ft of identification work.', 'good');
      }
    } else {
      state.streak = 0;
      audio('playErrorBuzz');
    }
    Shop.emit('change');
    render();
  }

  function render() {
    var host = document.getElementById('view-chipid');
    if (!host) return;
    if (!DATA) {
      host.innerHTML = '<div class="view-head"><h2>Chip ID bench</h2><p>Loading boards…</p></div>';
      load().then(render);
      return;
    }

    var devs = Object.keys(DATA).map(function (k) {
      return '<button class="mcat' + (state.device === k ? ' active' : '') + '" data-dev="' + k + '">'
        + esc(DATA[k].name) + ' <span style="opacity:.6">' + DATA[k].chips.length + '</span></button>';
    }).join('');

    if (!state.device) {
      host.innerHTML = head() + '<div class="market-cats">' + devs + '</div>'
        + '<div class="note" style="max-width:70ch">Pick a board. Each one is a real device, taken apart and photographed, '
        + 'with every chip on it identified by part number.</div>';
      bind(host); return;
    }

    var total = state.chips.length;
    var done = Object.keys(state.answers).length;
    var right = Object.keys(state.answers).filter(function (k) { return state.answers[k].right; }).length;

    var board = state.chips.map(function (s, i) {
      var a = state.answers[i];
      var cls = 'chip' + (state.picked === i ? ' sel' : '') + (a ? (a.right ? ' right' : ' wrong') : '');
      var fill = a && a.right ? R.colour(s.c.r) : null;
      return '<div class="' + cls + '" data-chip="' + i + '" style="left:' + (s.x / 1000 * 100) + '%;top:' + (s.y / 650 * 100)
        + '%;width:' + (s.w / 1000 * 100) + '%;height:' + (s.h / 650 * 100) + '%'
        + (fill ? ';--chip-tint:' + fill : '') + '">'
        + '<span class="chip-n">' + (i + 1) + '</span>'
        + (a && a.right ? '<span class="chip-role">' + esc(R.label(s.c.r)) + '</span>' : '')
        + '</div>';
    }).join('');

    var sel = state.picked != null ? state.chips[state.picked] : null;
    var selAns = state.picked != null ? state.answers[state.picked] : null;

    var panel;
    if (!sel) {
      panel = '<div class="note">Click a chip on the board. You will get its maker and part number — '
        + 'your job is to say what it is <b>for</b>.</div>';
    } else {
      var roleKeys = Object.keys(R.ROLES);
      // Offer the right answer plus five plausible neighbours.
      var opts = [sel.c.r];
      var pool = roleKeys.filter(function (k) { return k !== sel.c.r; });
      var s2 = (state.picked + 7) * 2654435761 % pool.length;
      for (var n = 0; n < 5; n++) opts.push(pool[(s2 + n * 3) % pool.length]);
      opts.sort();

      panel = '<div class="chip-card">'
        + '<div class="chip-head"><span class="chip-num">#' + (state.picked + 1) + '</span>'
        + '<div><b>' + esc(sel.c.v || 'unmarked') + '</b>'
        + '<div class="chip-part">' + esc(sel.c.p) + '</div></div></div>'
        + (sel.c.q ? '<div class="note warn" style="margin:10px 0;font-size:calc(12px * var(--a11y-scale, 1))">iFixit marked this one as a best guess — even the people who do this for a living are not always certain.</div>' : '')
        + (selAns
            ? '<div class="note ' + (selAns.right ? 'good' : 'danger') + '" style="margin:10px 0">'
              + (selAns.right ? '<b>Right — ' + esc(R.label(sel.c.r)) + '.</b>' : '<b>Not quite.</b> That one is <b>' + esc(R.label(sel.c.r)) + '</b>.')
              + '<br>' + esc(sel.c.d) + '</div>'
              + '<div class="note teach"><b>What that does.</b> ' + esc(R.ROLES[sel.c.r].what) + '</div>'
              + '<div class="note" style="margin-top:8px"><b>How you could have told.</b> ' + esc(R.ROLES[sel.c.r].tell) + '</div>'
            : '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2);margin:10px 0">What is this chip for?</p>'
              + '<div class="chip-opts">' + opts.map(function (k) {
                  return '<button class="chip-opt" data-role="' + k + '">' + esc(R.label(k)) + '</button>';
                }).join('') + '</div>')
        + '</div>';
    }

    host.innerHTML = head()
      + '<div class="market-cats">' + devs + '</div>'
      + '<div class="chipid-wrap">'
      + '<div><div class="chip-board">' + board + '</div>'
      + '<div class="board-caption">' + esc(DATA[state.device].name) + ' · ' + right + ' of ' + total + ' identified'
      + (state.streak > 1 ? ' · ' + state.streak + ' in a row' : '') + '</div></div>'
      + '<div>' + panel + '</div></div>';
    bind(host);
  }

  function head() {
    return '<div class="view-head"><h2>Chip ID bench</h2>'
      + '<p>Board-level work: not swapping a part, but knowing what every part <i>is</i>. '
      + 'Nobody expects you to memorise part numbers — but you can learn to read a board, and that is what turns '
      + '"it is broken" into "the thing that makes the backlight work is broken".</p>'
      + '<p style="font-size:calc(12px * var(--a11y-scale, 1));color:var(--ink-3)">Chip identifications from '
      + '<a href="https://www.ifixit.com" target="_blank" rel="noopener">iFixit</a>’s public chip-ID teardowns.</p></div>';
  }

  function bind(host) {
    host.querySelectorAll('[data-dev]').forEach(function (b) {
      b.addEventListener('click', function () { pickDevice(b.getAttribute('data-dev')); });
    });
    host.querySelectorAll('[data-chip]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.picked = +b.getAttribute('data-chip');
        audio('playKeyPop');
        render();
      });
    });
    host.querySelectorAll('[data-role]').forEach(function (b) {
      b.addEventListener('click', function () { answer(b.getAttribute('data-role')); });
    });
  }

  window.TechOpsChipID = { render: render, load: load };
})(window);
