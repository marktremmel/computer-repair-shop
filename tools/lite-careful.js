/**
 * TechOps Budapest — Lite: a careful customer.
 *
 * The other harness (lite-sweep.js) plays badly on purpose and only asks
 * whether the thing can be broken. This one plays as well as the interface
 * allows — right driver, the instrument the readings actually point at, the
 * fix the fault names, the fair price — and asks a different question:
 *
 *   can a student who does everything right get a good result?
 *
 * If this drops below about four stars, something has become unwinnable, and
 * that is a worse bug than a crash: nobody can see it, and it lands on the
 * one student who was paying attention.
 *
 * It deliberately does NOT choose between parts on spec — it takes whatever
 * arrives soonest. The two-star results it reports are therefore the lesson
 * working, not the game failing: a fast cheap drive can still be the wrong
 * drive, and that judgement is the thing being taught.
 */
(function (window) {
  'use strict';

  function el(s, i) { return document.querySelectorAll(s)[i || 0] || null; }
  /** Click if it is there; say so if it is not, rather than throwing. */
  var missing = null;
  function tap(sel) {
    var e = el(sel);
    if (!e) { missing = sel; return false; }
    e.click(); return true;
  }
  function ids(sel) {
    return [].map.call(document.querySelectorAll(sel), function (e) { return e.getAttribute(sel.slice(1, -1)); });
  }
  function ev(n, ty, x, y) {
    n.dispatchEvent(new PointerEvent(ty, { bubbles: 1, cancelable: 1, clientX: x, clientY: y,
      pointerId: 1, isPrimary: 1, buttons: ty === 'pointerup' ? 0 : 1 }));
  }
  function drag(f, t) {
    if (!f || !t) return false;
    var a = f.getBoundingClientRect(), b = t.getBoundingClientRect();
    var ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var bx = b.left + b.width / 2, by = b.top + b.height / 2;
    ev(f, 'pointerdown', ax, ay);
    for (var s = 1; s <= 6; s++) {
      var x = ax + (bx - ax) * s / 6, y = ay + (by - ay) * s / 6;
      ev(document.elementFromPoint(x, y) || document.body, 'pointermove', x, y);
    }
    ev(document.elementFromPoint(bx, by) || document.body, 'pointerup', bx, by);
    return true;
  }

  /** Has the fault actually been dealt with? Same test the grader uses. */
  function satisfied(t, f) {
    var fb = f.fixedBy;
    var hasCat = function (c) { return (t.installed || []).some(function (i) { return i.cat === c; }); };
    if (fb.kind === 'part') return hasCat(fb.cat);
    return (t.actionsDone || []).indexOf(fb.id) !== -1 && (!fb.needsPartCat || hasCat(fb.needsPartCat));
  }

  window.__careful = function (jobs, code) {
    var stars = [], errs = [], notes = [];
    var wasMuted = window.sekAudio ? window.sekAudio.muted : true;
    if (window.sekAudio) window.sekAudio.muted = true;
    var old = window.onerror;
    window.onerror = function (m, s, l) { errs.push('THREW: ' + m + ' @' + l); return false; };

    window.TechOpsShop.reset(code);
    window.TechOpsLite.finished = null;
    window.TechOpsLiteFlow.render();

    for (var j = 0; j < jobs; j++) {
      var t = window.TechOpsShop.state.ticket;
      var f = window.TechOpsJobs.fault(t), m = window.TechOpsJobs.machine(t), guard = 0;
      missing = null;                       // a fresh job gets a fresh verdict
      while (guard++ < 160) {
        var b = t.lite.beat;
        if (el('[data-act="ask"]')) { el('[data-act="ask"]').click(); continue; }
        if (b === 'ask') {
          if ((t.asked || []).length < 2 && el('[data-ask]')) { el('[data-ask]').click(); continue; }
          if (tap('[data-act="open"]')) continue; break;
        }
        if (el('[data-act="esd"]')) { el('[data-act="esd"]').click(); continue; }
        if (el('[data-step]')) { el('[data-step]').click(); continue; }
        if (el('[data-screw]')) {
          var sc = el('[data-screw]');
          drag(el('[data-tool="' + sc.getAttribute('data-type') + '"]'), sc);
          continue;
        }
        if (el('[data-drop="step"]')) {
          var nxt = m.teardown.filter(function (s) { return t.openSteps.indexOf(s) === -1; })[0];
          var want = window.TechOpsJobs.STEPS[nxt].tool;
          if (!drag(el('[data-tool="' + want + '"]'), el('[data-drop="step"]'))) {
            errs.push('no ' + want + ' offered on ' + m.id); break;
          }
          continue;
        }
        if (el('[data-drop="connector"]')) {
          drag(el('[data-tool="spudger"]'), el('[data-drop="connector"]')); continue;
        }
        if (b === 'test') {
          if (!(t.testsRun || []).length) {
            var r = window.TechOpsFaults.readingsFor(m, f);
            var offered = ids('[data-instr]');
            var tell = offered.filter(function (i) {
              var x = r[i] || {};
              return x.abnormal === true || x.decisive === true
                || (i === 'meter' && Object.keys(x).some(function (k) { return x[k] && x[k].beep; }));
            })[0];
            if (!tell) { notes.push('NO TELLING INSTRUMENT: ' + m.id + '/' + f.id + ' — offered ' + offered.join(', ')); tell = offered[0]; }
            drag(el('[data-instr="' + tell + '"]'), el('[data-drop="test"]'));
            continue;
          }
          if (tap('[data-act="fix"]')) continue; break;
        }
        if (b === 'fix') {
          if (satisfied(t, f)) {
            if (tap('[data-act="close"]') || tap('[data-act="price"]')) continue;
            break;
          }
          var offer = ids('[data-fix]'), want2 = null;
          if (f.fixedBy.kind === 'action' && (t.actionsDone || []).indexOf(f.fixedBy.id) === -1
              && offer.indexOf(f.fixedBy.id) !== -1) {
            want2 = f.fixedBy.id;
          } else {
            var cat = f.fixedBy.kind === 'part' ? f.fixedBy.cat : f.fixedBy.needsPartCat;
            if (cat) {
              want2 = offer.filter(function (id) {
                var p = window.TechOpsParts.get(id); return p && p.cat === cat;
              }).sort(function (a, c) {
                return window.TechOpsParts.get(a).deliveryDays - window.TechOpsParts.get(c).deliveryDays;
              })[0];
            }
          }
          if (want2) { drag(el('[data-fix="' + want2 + '"]'), el('[data-drop="fix"]')); continue; }
          notes.push('NO RIGHT FIX OFFERED: ' + m.id + '/' + f.id + ' — offered ' + offer.join(', '));
          if (tap('[data-act="close"]') || tap('[data-act="price"]')) continue;
          break;
        }
        if (b === 'price') {
          var ps = document.querySelectorAll('.price');
          (document.querySelector('.price.out') || ps[1] || ps[0]).click();
          continue;
        }
        if (b === 'done') {
          var res = window.TechOpsLite.finished.lite.result;
          stars.push(res.stars);
          if (res.stars < 4) {
            notes.push(res.stars + '★ ' + m.id + '/' + f.id + ' — '
              + ((res.findings.filter(function (x) { return !x.good; })[0] || {}).text || '(no finding given)'));
          }
          tap('[data-act="next"]');
          break;
        }
      }
      // A job that reached the verdict is finished, whatever button the
      // harness went looking for on the way past.
      if (missing && t.lite.beat !== 'done') {
        errs.push('nothing to press (' + missing + ') on ' + m.id + '/' + f.id + ' at beat "' + t.lite.beat + '"');
        break;
      }
      if (guard >= 160) { errs.push('stalled on ' + m.id + '/' + f.id + ' at beat "' + t.lite.beat + '"'); break; }
    }

    window.onerror = old;
    if (window.sekAudio) window.sekAudio.muted = wasMuted;
    var mean = stars.length ? stars.reduce(function (a, b) { return a + b; }, 0) / stars.length : 0;
    return {
      played: stars.length,
      mean: +mean.toFixed(2),
      five: stars.filter(function (s) { return s === 5; }).length,
      errors: errs,
      notes: notes
    };
  };
})(window);
