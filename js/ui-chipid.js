/**
 * TechOps Budapest — Chip ID bench.
 *
 * The real board, photographed by iFixit, with nothing marked on it. The bench
 * describes a job ("the chip that negotiates power over USB-C") and you find a
 * chip on the photo that does it. A loupe follows the pointer so the markings
 * can actually be read. Every click is answered with what that chip really is,
 * which is the transferable part: most of these can be worked out from the
 * maker's name, the shape of the part and where it sits.
 *
 * Photos and identifications: iFixit's public chip-ID teardowns, credited on
 * screen with a link to each page. The positions come from the coloured boxes
 * on iFixit's own annotated photos — see tools/build-chipid.py, which generates
 * js/chipid-data.json. Do not edit that file by hand.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var R    = window.TechOpsChipRoles;
  var esc  = function (s) { return UI.esc(s); };

  var DATA = null;
  // device, board index, the jobs still to find on this board, the current one,
  // what the last click said, and the crosshair for the keyboard route.
  var state = { device: null, board: 0, queue: [], target: null, said: null, streak: 0, found: {}, cross: { x: 0.5, y: 0.5 }, tries: 0 };

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (window.TechOpsChipData) { DATA = window.TechOpsChipData; return Promise.resolve(DATA); }
    return fetch('js/chipid-data.json?v=' + (window.TECHOPS_BUILD || '1'))
      .then(function (r) { return r.json(); })
      .then(function (j) { DATA = j; return j; });
  }

  function board() { return state.device ? DATA[state.device].boards[state.board] : null; }
  function located(b) { return b.chips.filter(function (c) { return c.boxes && c.boxes.length; }); }

  /** One job per role on the board, in a fixed order so a class sees the same board the same way. */
  function jobsFor(b) {
    var seen = {}, out = [];
    located(b).forEach(function (c) { if (!seen[c.role]) { seen[c.role] = true; out.push(c.role); } });
    var h = 0; String(b.title).split('').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
    return out.sort(function (a, z) { return ((a.charCodeAt(0) * 7 + h) % 13) - ((z.charCodeAt(0) * 7 + h) % 13) || (a < z ? -1 : 1); });
  }

  function pickDevice(key) {
    state.device = key; state.board = 0; startBoard();
  }
  function startBoard() {
    var b = board();
    state.queue = jobsFor(b); state.target = state.queue.shift() || null;
    state.said = null; state.found = {}; state.tries = 0; state.cross = { x: 0.5, y: 0.5 };
    render();
  }

  /** Which chip, if any, is at this point of the photo (0..1 coordinates). */
  function chipAt(b, x, y) {
    var pad = 0.006, hit = null, area = Infinity;
    located(b).forEach(function (c) {
      c.boxes.forEach(function (bx) {
        if (x >= bx.x - pad && x <= bx.x + bx.w + pad && y >= bx.y - pad && y <= bx.y + bx.h + pad && bx.w * bx.h < area) {
          hit = c; area = bx.w * bx.h;
        }
      });
    });
    return hit;
  }

  function choose(x, y) {
    var b = board(); if (!b || !state.target) return;
    var c = chipAt(b, x, y);
    if (!c) {
      state.said = { kind: 'none' };
      audio('playKeyPop');
      return render();
    }
    if (c.role === state.target) {
      state.found[state.target] = c;
      if (state.tries === 0) state.streak++;
      if (state.streak === 5) {
        Shop.award('chip_reader');
        Shop.earn(4000, 'Board-level identification work');
        UI.toast('Five in a row', 'Word gets round that you read boards. A repair centre sends you 4.000 Ft of identification work.', 'good');
      }
      state.said = { kind: 'right', chip: c, role: state.target };
      audio('playSuccessChime');
      state.target = state.queue.shift() || null;
      state.tries = 0;
    } else {
      state.streak = 0; state.tries++;
      state.said = { kind: 'wrong', chip: c };
      audio('playErrorBuzz');
    }
    Shop.emit('change');
    render();
  }

  function giveUp() {
    var b = board(); if (!b || !state.target) return;
    var c = located(b).filter(function (x) { return x.role === state.target; })[0];
    state.found[state.target] = c;
    state.said = { kind: 'shown', chip: c, role: state.target };
    state.streak = 0; state.tries = 0;
    state.target = state.queue.shift() || null;
    render();
  }

  function idLine(c) {
    return '<b>' + esc(c.vendor || '') + (c.part ? ' ' + esc(c.part) : '') + '</b>'
      + (c.desc ? ' — ' + esc(c.desc) : '') + (c.hedge ? ' <span class="cid-hedge">(' + esc(c.hedge) + ')</span>' : '');
  }

  function render() {
    var host = document.getElementById('view-chipid');
    if (!host) return;
    if (!DATA) { host.innerHTML = head() + '<p>Loading boards…</p>'; load().then(render); return; }

    var M = window.TechOpsMachines;
    var devs = Object.keys(DATA).map(function (k) {
      var d = DATA[k], inShop = d.machine && M && M.get(d.machine);
      var n = d.boards.reduce(function (a, b) { return a + located(b).length; }, 0);
      return '<button class="cid-dev' + (state.device === k ? ' on' : '') + '" data-dev="' + k + '">'
        + '<b>' + esc(d.name) + '</b><span>' + n + ' chips' + (inShop ? ' · comes into the shop' : '') + '</span></button>';
    }).join('');

    var b = board();
    var main = '';
    if (!b) {
      main = '<div class="card cid-empty"><p>Pick a device. You get its real board, photographed with nothing marked on it, and a job to find.</p></div>';
    } else {
      var d = DATA[state.device];
      var boards = d.boards.length > 1 ? '<div class="cid-boards">' + d.boards.map(function (bb, i) {
        return '<button class="btn btn-xs' + (i === state.board ? ' btn-primary' : '') + '" data-board="' + i + '">' + esc(bb.title) + '</button>';
      }).join('') + '</div>' : '';
      var role = state.target && R.ROLES[state.target];
      var task = role
        ? '<div class="cid-task"><div class="cid-task-k">Find a chip that does this</div><p>' + esc(role.what) + '</p>'
          + '<div class="cid-task-acts"><span class="cid-left">' + (state.queue.length + 1) + ' to find on this board</span>'
          + '<button class="btn btn-xs" data-giveup>Show me</button></div></div>'
        : '<div class="cid-task done"><div class="cid-task-k">Board read</div><p>Every job on this board has a chip to its name now.</p>'
          + (state.board < d.boards.length - 1 ? '<button class="btn btn-sm btn-primary" data-board="' + (state.board + 1) + '">Other side of the board →</button>' : '')
          + '</div>';
      var said = '';
      if (state.said) {
        var s = state.said;
        said = s.kind === 'none'
          ? '<div class="cid-say">Nothing identified there — bare board, or a passive part too small to have a job of its own.</div>'
          : s.kind === 'wrong'
            ? '<div class="cid-say bad">That one is ' + idLine(s.chip) + '. It is <b>' + esc(R.label(s.chip.role)) + '</b> — a different job.</div>'
            : '<div class="cid-say ' + (s.kind === 'right' ? 'good' : '') + '">' + (s.kind === 'right' ? 'Yes. ' : 'Here it is. ') + idLine(s.chip)
              + '<div class="cid-tell"><b>How you could have told:</b> ' + esc((R.ROLES[s.role] || {}).tell || '') + '</div></div>';
      }
      // Boxes stay invisible; only chips already found are outlined.
      var marks = Object.keys(state.found).map(function (r) {
        var c = state.found[r];
        return c.boxes.map(function (bx) {
          return '<span class="cid-mark" style="left:' + (bx.x * 100) + '%;top:' + (bx.y * 100) + '%;width:' + (bx.w * 100) + '%;height:' + (bx.h * 100) + '%;--c:' + R.colour(c.role) + '" title="' + esc(R.label(c.role)) + '"></span>';
        }).join('');
      }).join('');
        var imgSrc = esc(b.image) + (window.TECHOPS_BUILD ? '?v=' + window.TECHOPS_BUILD : '');
        main = boards
          + '<div class="cid-grid"><div class="cid-photo" data-photo tabindex="0" aria-label="Board photo. Move the crosshair with the arrow keys and press Enter to choose.">'
          + '<img src="' + imgSrc + '" alt="' + esc(d.name + ', ' + b.title) + '" draggable="false">'
        + marks + '<span class="cid-cross" data-cross style="left:' + (state.cross.x * 100) + '%;top:' + (state.cross.y * 100) + '%"></span>'
        + '<div class="cid-loupe" data-loupe></div></div>'
        + '<div class="cid-side">' + task + said
        + '<div class="cid-streak">' + (state.streak ? state.streak + ' in a row' : '') + '</div></div></div>'
        + '<div class="cid-credit">Photo and chip identifications: <a href="' + esc(d.source) + '" target="_blank" rel="noopener">iFixit — ' + esc(d.name) + ' Chip ID</a>.</div>';
    }

    host.innerHTML = head() + '<div class="cid-devs">' + devs + '</div>' + main;
    bind(host);
  }

  function head() {
    return '<div class="view-head"><h2>Chip ID bench</h2>'
      + '<p>Board-level work: not swapping a part, but knowing what every part <i>is</i>. The bench names a job; find the chip that '
      + 'does it on the real board. Hover to look closer — the markings are readable.</p></div>';
  }

  function bind(host) {
    host.querySelectorAll('[data-dev]').forEach(function (b) {
      b.addEventListener('click', function () { audio('playKeyPop'); pickDevice(b.getAttribute('data-dev')); });
    });
    host.querySelectorAll('[data-board]').forEach(function (b) {
      b.addEventListener('click', function () { state.board = +b.getAttribute('data-board'); startBoard(); });
    });
    var gu = host.querySelector('[data-giveup]');
    if (gu) gu.addEventListener('click', giveUp);

    var photo = host.querySelector('[data-photo]');
    if (!photo) return;
    var img = photo.querySelector('img'), loupe = photo.querySelector('[data-loupe]'), cross = photo.querySelector('[data-cross]');
    var ZOOM = 3;
    function lookAt(fx, fy) {
      var r = img.getBoundingClientRect();
      loupe.style.display = 'block';
      loupe.style.left = (fx * r.width) + 'px';
      loupe.style.top = (fy * r.height) + 'px';
      loupe.style.backgroundImage = 'url("' + img.getAttribute('src') + '")';
      loupe.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
      loupe.style.backgroundPosition = (-(fx * r.width * ZOOM) + 70) + 'px ' + (-(fy * r.height * ZOOM) + 70) + 'px';
    }
    function frac(e) {
      var r = img.getBoundingClientRect();
      return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
    }
    photo.addEventListener('pointermove', function (e) { var f = frac(e); lookAt(f.x, f.y); });
    photo.addEventListener('pointerleave', function () { loupe.style.display = 'none'; });
    photo.addEventListener('click', function (e) { var f = frac(e); state.cross = f; choose(f.x, f.y); });
    // Keyboard route: move a crosshair, look through the same loupe, choose.
    photo.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 0.002 : 0.01;
      var d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (d) {
        e.preventDefault();
        state.cross = { x: Math.max(0, Math.min(1, state.cross.x + d[0])), y: Math.max(0, Math.min(1, state.cross.y + d[1])) };
        cross.style.left = (state.cross.x * 100) + '%'; cross.style.top = (state.cross.y * 100) + '%';
        lookAt(state.cross.x, state.cross.y);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); state.kb = true; choose(state.cross.x, state.cross.y);
      }
    });
    photo.addEventListener('focus', function () { cross.style.display = 'block'; });
    photo.addEventListener('pointerdown', function () { state.kb = false; });
    // A keyboard choice re-renders the view; keep the keyboard where it was.
    if (state.kb) { photo.focus(); lookAt(state.cross.x, state.cross.y); }
  }

  window.TechOpsChipID = { render: render, load: load };
})(window);
