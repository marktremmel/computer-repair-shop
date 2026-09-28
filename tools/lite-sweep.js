/**
 * TechOps Budapest — Lite: an automatic customer.
 *
 * Paste into the console on lite.html (or let a harness inject it) and call
 * `__sweep(40)`. It plays whole jobs through the real buttons and the real
 * drag engine — no shortcuts into the flow module — and reports anything
 * that threw, stalled, or left a beat with nothing to press.
 *
 * The point is coverage: thirty-odd faults across fourteen machines produce
 * combinations no one plays by hand, and every one of them has to be able to
 * reach a price. A job that cannot be finished is the worst bug this thing
 * can have, because it happens to a student in front of a class.
 */
(function (window) {
  'use strict';

  function el(sel, i) { return document.querySelectorAll(sel)[i || 0] || null; }

  function ev(node, type, x, y) {
    node.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, clientX: x, clientY: y,
      pointerId: 1, isPrimary: true, buttons: type === 'pointerup' ? 0 : 1
    }));
  }

  /** A real drag, with real intermediate moves, onto a real target. */
  function drag(from, to) {
    if (!from || !to) return false;
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var bx = b.left + b.width / 2, by = b.top + b.height / 2;
    ev(from, 'pointerdown', ax, ay);
    for (var s = 1; s <= 6; s++) {
      var x = ax + (bx - ax) * s / 6, y = ay + (by - ay) * s / 6;
      ev(document.elementFromPoint(x, y) || document.body, 'pointermove', x, y);
    }
    ev(document.elementFromPoint(bx, by) || document.body, 'pointerup', bx, by);
    return true;
  }

  function beat() {
    var t = window.TechOpsShop.state.ticket || window.TechOpsLite.finished;
    return t && t.lite ? t.lite.beat : null;
  }

  /** One move, whatever the screen is currently showing. Returns false if stuck. */
  function step(rng) {
    var b = beat();

    if (el('[data-act="ask"]'))  { el('[data-act="ask"]').click(); return true; }
    if (b === 'ask') {
      var q = el('[data-ask]');
      var asked = (window.TechOpsShop.state.ticket.asked || []).length;
      if (q && asked < 2) { q.click(); return true; }
      if (el('[data-act="open"]')) { el('[data-act="open"]').click(); return true; }
    }
    if (el('[data-act="esd"]')) {
      (rng() < 0.85 ? el('[data-act="esd"]') : el('[data-act="noesd"]')).click();
      return true;
    }
    var screw = el('[data-screw]');
    if (screw) {
      var want = screw.getAttribute('data-type');
      var tool = el('[data-tool="' + want + '"]');
      if (!tool) return 'no driver for ' + want;
      return drag(tool, screw) || 'drag failed';
    }
    if (el('[data-drop="connector"]')) {
      return drag(el('[data-tool="spudger"]'), el('[data-drop="connector"]')) || 'spudger failed';
    }
    if (el('[data-step]')) { el('[data-step]').click(); return true; }
    // A hand-tool step: try what is on the tray until one of them is the
    // right one, which also exercises the wrong-tool message on the way.
    if (el('[data-drop="step"]')) {
      var tools = document.querySelectorAll('[data-tool]');
      for (var i = 0; i < tools.length; i++) {
        var before = window.TechOpsShop.state.ticket.openSteps.length;
        drag(tools[i], el('[data-drop="step"]'));
        if (window.TechOpsShop.state.ticket.openSteps.length > before) return true;
        tools = document.querySelectorAll('[data-tool]');
        if (!tools.length) break;
      }
      return 'no tool on the tray opened this step';
    }
    if (b === 'test') {
      var instr = el('[data-instr]');
      if (instr && !(window.TechOpsShop.state.ticket.testsRun || []).length) {
        return drag(instr, el('[data-drop="test"]')) || 'instrument failed';
      }
      if (el('[data-act="fix"]')) { el('[data-act="fix"]').click(); return true; }
      if (instr) return drag(instr, el('[data-drop="test"]')) || 'instrument failed';
    }
    if (b === 'fix') {
      var cards = document.querySelectorAll('[data-fix]');
      // Sometimes one thing, sometimes two, sometimes straight to the counter
      // — the tray now stays open, so the sweep has to decide when to stop.
      if (cards.length && (!el('[data-act="close"]') || rng() < 0.45)) {
        return drag(cards[Math.floor(rng() * cards.length)], el('[data-drop="fix"]')) || 'fix failed';
      }
      if (el('[data-act="close"]')) { el('[data-act="close"]').click(); return true; }
      if (el('[data-act="recheck"]') && rng() < 0.5) { el('[data-act="recheck"]').click(); return true; }
      if (el('[data-act="price"]')) { el('[data-act="price"]').click(); return true; }
    }
    if (b === 'price') {
      var prices = document.querySelectorAll('.price');
      if (!prices.length) return 'no prices offered';
      // A refused bill has to be re-priced downwards, which is the same thing
      // a student does. If the cheapest is still refused, that is a bug.
      var pick = document.querySelector('.price.out')          // the honest way out
        || (document.querySelector('.refused') ? prices[0] : prices[Math.floor(rng() * prices.length)]);
      pick.click();
      return true;
    }
    if (el('[data-act="next"]')) { el('[data-act="next"]').click(); return true; }
    return 'stuck on beat "' + b + '" with nothing to press';
  }

  window.__sweep = function (jobs, seedCode) {
    var errs = [], seen = {}, stars = [];
    // A sweep is a few hundred clicks a second. Nobody wants to hear that,
    // least of all whoever is sitting next to the machine running it.
    var wasMuted = window.sekAudio ? window.sekAudio.muted : true;
    if (window.sekAudio) window.sekAudio.muted = true;
    var old = window.onerror;
    window.onerror = function (m, s, l) { errs.push('THREW: ' + m + ' @' + l); return false; };

    var h = 99991;
    function rng() { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; }

    if (seedCode) window.TechOpsShop.reset(seedCode);
    window.TechOpsLite.finished = null;
    window.TechOpsLiteFlow.render();

    for (var j = 0; j < jobs; j++) {
      var t = window.TechOpsShop.state.ticket;
      if (t) seen[t.machineId + ' / ' + t.faultId] = (seen[t.machineId + ' / ' + t.faultId] || 0) + 1;
      var guard = 0, done = false;
      while (guard++ < 120) {
        var r = step(rng);
        if (r !== true) { errs.push('job ' + j + ': ' + r); break; }
        if (beat() === 'done') { done = true; break; }
      }
      if (guard >= 120) errs.push('job ' + j + ': ran 120 moves without finishing');
      if (done) {
        var res = window.TechOpsLite.finished.lite.result;
        stars.push(res.stars);
        if (el('[data-act="next"]')) el('[data-act="next"]').click();
      } else break;
    }

    window.onerror = old;
    if (window.sekAudio) window.sekAudio.muted = wasMuted;
    return {
      played: stars.length,
      stars: stars,
      meanStars: stars.length ? +(stars.reduce(function (a, b) { return a + b; }, 0) / stars.length).toFixed(2) : null,
      pairs: Object.keys(seen).length,
      errors: errs
    };
  };
})(window);
