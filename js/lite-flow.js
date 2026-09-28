/**
 * TechOps Budapest — Lite: one job, six beats, one decision at a time.
 *
 * The classic shop puts eight rooms in front of you and lets you find your
 * own way round. That is the right shape for somebody who already knows what
 * a repair looks like, and it is the thing that lost the class: a student who
 * does not know what happens next has eight guesses and no way to tell a
 * wrong one from a slow one.
 *
 * So Lite takes the same shift, the same faults, the same parts and the same
 * marking, and walks them down a corridor instead:
 *
 *     meet → ask → open → test → fix → price → the verdict
 *
 * Every screen shows the person you are working for, one thing to decide, and
 * at most three ways to decide it. Nothing here is dumbed down — the fault is
 * still hidden, the customer is still wrong about it, the cheap part is still
 * three weeks away and the bill still has to be defensible. What is gone is
 * the navigation, the twenty-tool rack, the sixty-eight-part catalogue and
 * the wall of prose.
 *
 * Everything on screen is drawn (lite-art.js) and moved by hand
 * (lite-drag.js). The grading is `TechOpsScore`, untouched, so a shift played
 * here hands in exactly like a shift played next door.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var F    = window.TechOpsFaults;
  var Q    = window.TechOpsInterview;
  var Parts= window.TechOpsParts;
  var Art  = window.TechOpsLiteArt;
  var Drag = window.TechOpsLiteDrag;
  var Settle = window.TechOpsLiteSettle;

  var esc = function (s) { return UI.esc(s); };
  var fmt = window.techOpsFmt;

  var stage, bar;

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  /** Stable shuffles, so a re-render never moves the cards under somebody's finger. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function shuffled(arr, seedStr) {
    var out = arr.slice(), h = hash(seedStr);
    for (var i = out.length - 1; i > 0; i--) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      var j = h % (i + 1);
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  /** Lite's own scratch space on the ticket. Saved with everything else. */
  function L(t) {
    if (!t.lite) t.lite = { beat: 'meet', said: [], reading: null, result: null };
    return t.lite;
  }

  function say(t, who, text) {
    L(t).said.push({ who: who, text: text });
  }

  /*
   * What your hands just did, as opposed to what was said.
   *
   * These started life as speech bubbles and turned the conversation into a
   * running commentary — "Strap on.", "All four out.", "Bottom case off." —
   * four bubbles of narration between two things the customer actually said.
   * They belong under the machine, where the machine is.
   */
  function note(t, text) { L(t).note = text; }

  // ─────────────────────────────── curation ───────────────────────────
  /*
   * "Fewer choices" is done here and nowhere else. Every list below is a
   * filter over the real catalogues, never a separate, easier set of data —
   * so a student who moves up to the classic shop meets the same tools, the
   * same instruments and the same parts they already know.
   */

  /** Three questions: the two this fault actually answers, plus one that does not. */
  function questions(t) {
    var l = L(t);
    if (l.qs) return l.qs.map(function (id) {
      return Q.QUESTIONS.filter(function (q) { return q.id === id; })[0];
    });
    var uc = J.useCase(t);
    var useful = [], filler = [];
    Q.QUESTIONS.forEach(function (q) {
      var a = Q.answerFor(t.faultId, q.id, uc, t);
      (a && (a.w === 'hot' || a.w === 'warm') ? useful : filler).push(q.id);
    });
    l.qs = shuffled(useful, t.id + 'u').slice(0, 2).concat(shuffled(filler, t.id + 'f').slice(0, 1));
    l.qs = shuffled(l.qs, t.id + 'q');
    return questions(t);
  }

  /**
   * The way into this machine, and only that far.
   *
   * A laptop is four screws and a cover. An iPad is heat, then picks worked
   * into the seam, then the whole display lifted off — no screws anywhere.
   * The first version of this assumed everybody's machine opened like the
   * laptop, and a glued tablet dead-ended with nothing left to press, which
   * is the worst thing a screen can do to somebody who does not yet know
   * what they are looking at.
   *
   * So: walk the machine's own teardown list, in order, as far as the step
   * that reveals the inside. Anything past that is bay work Lite does not do.
   */
  function wayIn(m) {
    var out = [];
    for (var i = 0; i < (m.teardown || []).length; i++) {
      var sid = m.teardown[i], st = J.STEPS[sid];
      if (!st) continue;
      out.push(sid);
      if (st.reveals === 'interior') break;
    }
    return out;
  }

  function nextWayIn(t, m) {
    var done = t.openSteps || [];
    var steps = wayIn(m);
    for (var i = 0; i < steps.length; i++) {
      if (done.indexOf(steps[i]) === -1) return steps[i];
    }
    return null;
  }

  /** The right tool for one step, plus one that is plausibly wrong. */
  function toolsFor(t, stepId) {
    var l = L(t);
    l.stepTools = l.stepTools || {};
    if (l.stepTools[stepId]) return l.stepTools[stepId];
    var want = J.STEPS[stepId].tool;
    var pool = ['heat_pad', 'thin_picks', 'suction_handles', 'suction_cup', 'cutting_wheel',
                'spudger', 'tweezers', 'pick', 'air_can', 'alcohol_wipe', 'extractor']
      .filter(function (id) { return id !== want && J.TOOLS[id]; });
    l.stepTools[stepId] = shuffled([want].concat(shuffled(pool, t.id + stepId).slice(0, 1)), t.id + stepId + 'x');
    return l.stepTools[stepId];
  }

  /** Three drivers: the one this machine uses, and two that look plausible. */
  function drivers(t) {
    var l = L(t);
    if (l.drivers) return l.drivers;
    var m = J.machine(t);
    var right = (m.screws || [])[0] || 'phillips-0';
    var fam = String(right).split('-')[0];
    var others = Object.keys(J.TOOLS).filter(function (id) {
      return J.TOOLS[id].kind === 'driver' && String(id).split('-')[0] !== fam;
    });
    l.drivers = shuffled([right].concat(shuffled(others, t.id + 'd').slice(0, 2)), t.id + 'r');
    return l.drivers;
  }

  /** Three instruments: the ones that would show this fault, padded with ones that would not. */
  function instruments(t) {
    var l = L(t);
    if (l.instr) return l.instr;
    var m = J.machine(t), r = F.readingsFor(m, J.fault(t));
    var tells = [], quiet = [];
    Object.keys(UI.INSTRUMENTS).forEach(function (id) {
      // The multimeter was left out as board-level work until a sweep found
      // the one fault in the shop that nothing else can see: a ceramic
      // capacitor shorted across the 12 V rail leaves no mark, no heat and
      // no noise. Looking at it tells you nothing — which is the lesson.
      // So Lite carries a meter, and it reads one thing: the rail that beeps.
      if (id === 'meter' && !(J.fault(t).readings || {}).meter) return;
      if (id === 'battery' && !m.battery) return;
      if (id === 'listen' && (m.storageSoldered || (m.storageBuses || []).indexOf('sata3') === -1)) return;
      if (!Art.has('instrument', id)) return;
      // A fault marks its telling readings either `abnormal` (a number out
      // of range) or `decisive` (a reading that settles it without being
      // wrong in itself — a disk two-thirds full behind a forgotten
      // password). Reading only the first of those left a dozen faults with
      // nothing worth measuring on the tray.
      var rr = r[id] || {};
      var tells_ = rr.abnormal === true || rr.decisive === true
        || (id === 'meter' && !!shortOn(rr));
      (tells_ ? tells : quiet).push(id);
    });
    var picked = shuffled(tells, t.id + 't').slice(0, 2);
    if (!picked.length) picked = quiet.slice(0, 1);      // never leave a job unmeasurable
    l.instr = shuffled(picked.concat(shuffled(quiet, t.id + 'z').slice(0, 3 - picked.length)), t.id + 'i');
    return l.instr;
  }

  /** The probe point that is telling you something: a beep, or a dead rail. */
  function shortOn(meterPts) {
    var keys = Object.keys(meterPts || {});
    for (var i = 0; i < keys.length; i++) {
      var pt = meterPts[keys[i]];
      if (pt && (pt.beep === true || /^0\.0/.test(String(pt.v || '')))) return pt;
    }
    return null;
  }

  /**
   * What you can do about it: at most three cards, and one of them is always
   * "it needs nothing". Three of the faults in this shop genuinely need no
   * parts, and the whole point of the material is that selling hardware for
   * them is the expensive mistake — so the honest answer has to be on the
   * table every single time, including the times it is wrong.
   */
  function fixes(t) {
    var l = L(t);
    if (l.fixes) return l.fixes;
    var m = J.machine(t), f = J.fault(t), out = [];

    if (f.fixedBy.kind === 'action') {
      var a = J.ACTIONS[f.fixedBy.id];
      if (a) out.push({
        k: 'action', id: a.id, name: a.label, art: 'tool', artId: a.tool || 'spudger',
        needsPart: f.fixedBy.needsPartCat || null,
        line: f.fixedBy.needsPartCat
          ? 'Needs fresh ' + f.fixedBy.needsPartCat + ' as well — do both.'
          : 'Your time, not their money.'
      });
    }
    var cat = f.fixedBy.kind === 'part' ? f.fixedBy.cat : (f.fixedBy.needsPartCat || Object.keys(f.wrongFix || {})[0]);
    if (cat) {
      var fit = Parts.byCat(cat).filter(function (p) { return Parts.compat(p, m).ok; });
      fit.sort(function (x, y) { return x.priceFt - y.priceFt; });
      /*
       * Which two, out of up to a dozen that fit.
       *
       * The first version took the cheapest and the dearest, which reads as
       * "good one or bad one" and is not a decision. The decision this shop
       * is actually about is cheap against quick: the marketplace fan is a
       * third of the price and three weeks away, and three weeks is the
       * thing the customer cannot have. So: the cheapest, and the soonest.
       */
      var room = 3 - out.length - 1;
      var chosen = [];
      if (fit.length) {
        var soonest = fit.slice().sort(function (x, y) { return x.deliveryDays - y.deliveryDays; })[0];
        chosen.push(fit[0]);
        if (soonest && soonest !== fit[0]) chosen.push(soonest);
        else if (fit[1]) chosen.push(fit[1]);
        chosen = chosen.slice(0, Math.max(0, room));
      }
      chosen.forEach(function (p) {
        out.push({
          k: 'part', id: p.id, name: p.name, art: 'part', artId: p.cat,
          priceFt: p.priceFt, days: p.deliveryDays,
          overBudget: p.priceFt > t.budgetFt,
          line: p.pitch
        });
      });
    }
    out.push({ k: 'none', id: 'none', name: 'Nothing needs replacing', art: 'instrument', artId: 'visual',
               line: 'Hand it back and charge for the time.' });
    l.fixes = out;
    return out;
  }

  // ─────────────────────────────── pieces ─────────────────────────────

  /*
   * How much of the conversation to keep on screen.
   *
   * All of it, while you are talking to them. Two lines once you are working
   * on the machine — the whole exchange stays in the ticket, but a growing
   * wall of it pushes the thing you have to drop something onto off the top
   * of a short laptop window, and leaves a student looking at a tray of
   * tools with no machine in sight.
   */
  function bubbles(t, keep) {
    var c = J.customer(t);
    var said = L(t).said;
    if (keep && said.length > keep) said = said.slice(-keep);
    return '<div class="bubbles">' + said.map(function (b) {
      return b.who === 'you'
        ? '<div class="bub you">' + esc(b.text) + '</div>'
        : '<div class="bub them"><span class="bub-who">' + esc(c.name.split(' ')[0]) + '</span>'
          + esc(b.text) + '</div>';
    }).join('') + '</div>';
  }

  function personCard(t) {
    var c = J.customer(t), m = J.machine(t);
    return '<div class="person">'
      + '<div class="pic">' + UI.face(c, 76) + '</div>'
      + '<div class="who"><b>' + esc(c.name) + '</b><span>' + esc(m.name) + '</span></div>'
      + '<div class="asks">'
      + '<span class="ask"><i>can pay</i>' + fmt(t.budgetFt) + '</span>'
      + '<span class="ask' + (J.turnaroundDays(t) > t.urgencyDays ? ' over' : '') + '"><i>wants it in</i>'
      + t.urgencyDays + ' days</span>'
      + '</div></div>';
  }

  /** The machine itself: the thing everything gets dropped onto. */
  function mat(t, opts) {
    opts = opts || {};
    var m = J.machine(t), l = L(t);
    var open = J.flags(t).interior;
    var h = '<div class="mat' + (open ? ' open' : '') + '">';
    h += '<div class="mat-shell' + (opts.drop ? ' drop' : '') + '"'
       + (opts.drop ? ' data-drop="' + esc(opts.drop) + '" role="button" aria-label="' + esc(opts.dropLabel || 'the machine') + '"' : '')
       + '>' + Art.machine(m.kind, open);
    if (!open && l.screws) {
      l.screws.forEach(function (s) {
        h += '<span class="mscrew' + (s.out ? ' out' : '') + '" style="left:' + s.x + '%;top:' + s.y + '%"'
          + (s.out ? '' : ' data-drop="screw" data-screw="' + s.i + '" data-type="' + esc(s.type) + '"'
             + ' role="button" tabindex="-1" aria-label="' + esc(J.TOOLS[s.type].name + ' screw') + '"')
          + '>' + window.TechOpsScrewHeads.svg(s.type) + '</span>';
      });
    }
    if (opts.step) {
      var sd = J.STEPS[opts.step];
      h += '<span class="mstep" data-drop="step" role="button" aria-label="' + esc(sd.label) + '">'
        + '<b>' + esc(sd.label) + '</b></span>';
    }
    if (open && opts.connector) {
      h += '<span class="mconn" data-drop="connector" role="button" aria-label="battery connector">'
        + '<span class="conn-plug"></span><b>battery</b></span>';
    }
    h += '</div>';
    if (l.note) h += '<div class="mat-note">' + esc(l.note) + '</div>';
    if (opts.caption) h += '<div class="mat-cap">' + esc(opts.caption) + '</div>';
    return h + '</div>';
  }

  function card(cls, art, title, line, attrs) {
    return '<button class="lcard ' + cls + '" ' + (attrs || '') + '>'
      + '<span class="lcard-art">' + art + '</span>'
      + '<span class="lcard-txt"><b>' + esc(title) + '</b>'
      + (line ? '<span>' + esc(line) + '</span>' : '') + '</span></button>';
  }

  function go(t, beat) {
    L(t).beat = beat;
    Drag.release();
    Shop.emit('change');
    render();
  }

  // ─────────────────────────────── the beats ──────────────────────────

  var BEATS = {

    // 1. Somebody walks in and tells you what is wrong. They are not right.
    meet: function (t) {
      var l = L(t);
      if (!l.said.length) say(t, 'them', t.complaint);
      return {
        scene: personCard(t) + bubbles(t),
        tray: '<button class="big" data-act="ask">Have a look at it</button>'
      };
    },

    // 2. Asking is the cheapest diagnosis in the shop. Two questions is plenty.
    ask: function (t) {
      var asked = (t.asked || []).length;
      var qs = questions(t).filter(function (q) { return (t.asked || []).indexOf(q.id) === -1; });
      var tray = qs.map(function (q) {
        return '<button class="qchip" data-ask="' + q.id + '">' + esc(q.q) + '</button>';
      }).join('');
      if (asked) tray += '<button class="big" data-act="open">Right — let us open it</button>';
      else tray += '<div class="tray-hint">Ask two. Their answers tell you what to measure.</div>';
      return { scene: personCard(t) + bubbles(t), tray: tray };
    },

    // 3. Getting inside. Ground yourself, match the driver to the head,
    //    kill the power before you touch anything.
    open: function (t) {
      var l = L(t), m = J.machine(t), flags = J.flags(t);

      if (!t.esdOn && !l.skippedEsd) {
        return {
          scene: '<div class="solo">' + Art.tool('esd_strap')
            + '<h2>Put the strap on first</h2>'
            + '<p>It earths you to the bench. The static you cannot feel is enough to kill a chip '
            + 'quietly, weeks after they have paid you.</p></div>',
          tray: '<button class="big" data-act="esd">Put it on</button>'
            + '<button class="flat" data-act="noesd">Skip it</button>'
        };
      }

      var next = nextWayIn(t, m);

      // Inside at last: the board is still live until the pack comes off.
      if (!next) {
        if (flags.interior && !flags.battery_off) {
          return {
            scene: bubbles(t, 2) + mat(t, { connector: true, caption: 'The board is live until this comes off.' }),
            tray: '<div class="rack">'
              + '<button class="lcard tool" data-drag="tool" data-tool="spudger">'
              + '<span class="lcard-art">' + Art.tool('spudger') + '</span>'
              + '<span class="lcard-txt"><b>Nylon spudger</b><span>plastic, on purpose</span></span></button>'
              + '</div><div class="tray-hint">Lift the battery plug off. A metal tool across that connector kills the board.</div>'
          };
        }
        return go(t, 'test'), { scene: '', tray: '' };
      }

      var def = J.STEPS[next];

      // Some steps are a decision, not a tool: switching a desktop off at the
      // wall is the whole safety lesson and it needs no equipment at all.
      if (!def.tool) {
        return {
          scene: bubbles(t, 2) + mat(t, { caption: def.why || 'Before anything else.' }),
          tray: '<button class="big" data-step="' + esc(next) + '">' + esc(def.label) + '</button>'
        };
      }

      // A driver step: the screws come out one at a time, and the head has to
      // match. This is the only place in Lite where a wrong choice is visible
      // rather than expensive, which is why it is worth having.
      if (def.tool === 'driver') {
        if (!l.screws) {
          l.screws = [];
          var type = (m.screws || [])[0] || 'phillips-0';
          [[16, 20], [78, 20], [16, 74], [78, 74]].forEach(function (pos, i) {
            l.screws.push({ i: i, type: type, out: false, x: pos[0], y: pos[1] });
          });
        }
        var left = l.screws.filter(function (x) { return !x.out; }).length;
        if (!left) {
          t.openSteps.push(next);
          t.labourHours += 0.5;
          note(t, def.label + '.');
          l.screws = null;
          return BEATS.open(t);
        }
        return {
          scene: bubbles(t, 2) + mat(t, { caption: left + (left === 1 ? ' screw left' : ' screws left') }),
          tray: '<div class="rack">' + drivers(t).map(function (id) {
              return '<button class="lcard tool" data-drag="tool" data-tool="' + id + '">'
                + '<span class="lcard-art">' + Art.tool(id) + '</span>'
                + '<span class="lcard-txt"><b>' + esc(J.TOOLS[id].name) + '</b>'
                + '<span class="tip">' + window.TechOpsScrewHeads.svg(id) + '</span></span></button>';
            }).join('') + '</div>'
            + '<div class="tray-hint">Look at the shape in the screw, then pick the driver that matches it.</div>'
        };
      }

      // Everything else — heat, picks, suction, a spudger — is one tool onto
      // one place on the machine.
      return {
        scene: bubbles(t, 2) + mat(t, { step: next, caption: def.why || '' }),
        tray: '<div class="rack">' + toolsFor(t, next).map(function (id) {
            var tl = J.TOOLS[id];
            return '<button class="lcard tool" data-drag="tool" data-tool="' + esc(id) + '">'
              + '<span class="lcard-art">' + Art.tool(id) + '</span>'
              + '<span class="lcard-txt"><b>' + esc(tl.name) + '</b>'
              + (tl.hint ? '<span>' + esc(tl.hint.split('.')[0]) + '.</span>' : '') + '</span></button>';
          }).join('') + '</div>'
          + '<div class="tray-hint">Only one of these is the right tool for that.</div>'
      };
    },

    // 4. Measuring. The complaint is a symptom; this is where it becomes a fault.
    test: function (t) {
      var l = L(t), m = J.machine(t);
      var scene = bubbles(t, 2);
      if (l.reading) {
        var rd = l.reading;
        scene += '<div class="readout ' + (rd.hit ? 'hit' : 'clear') + '">'
          + '<div class="ro-head">' + Art.instrument(rd.id) + '<b>' + esc(UI.INSTRUMENTS[rd.id].name) + '</b></div>'
          + (rd.data ? '<div class="ro-data">' + rd.data + '</div>' : '')
          + '<div class="ro-note">' + esc(rd.note) + '</div>'
          + '<div class="ro-tag">' + (rd.hit ? 'That is not normal.' : 'Nothing wrong here.') + '</div></div>';
      } else {
        scene += mat(t, { drop: 'test', dropLabel: 'the open machine', caption: 'Drop an instrument on it.' });
      }
      var ran = t.testsRun || [];
      var tray = '<div class="rack">' + instruments(t).map(function (id) {
        var inst = UI.INSTRUMENTS[id], done = ran.indexOf(id) !== -1;
        return '<button class="lcard instr' + (done ? ' done' : '') + '"'
          + (done ? ' data-locked="1"' : ' data-drag="instr" data-instr="' + id + '"') + '>'
          + '<span class="lcard-art">' + Art.instrument(id) + '</span>'
          + '<span class="lcard-txt"><b>' + esc(inst.name) + '</b>'
          + '<span>' + (done ? 'done' : inst.hours + ' h of your day') + '</span></span></button>';
      }).join('') + '</div>';
      if (ran.length) tray += '<button class="big" data-act="fix">I know what it needs</button>';
      else tray += '<div class="tray-hint">Each one costs time, and their time is part of the price.</div>';
      return { scene: scene, tray: tray };
    },

    // 5. Doing something about it. Including, sometimes, nothing.
    fix: function (t) {
      var l = L(t);
      var applied = l.applied || (l.applied = []);

      if (l.closed) {
        return {
          scene: bubbles(t, 2) + (l.reading
            ? '<div class="readout clear"><div class="ro-head">' + Art.instrument(l.reading.id)
              + '<b>' + esc(UI.INSTRUMENTS[l.reading.id].name) + '</b></div>'
              + (l.reading.data ? '<div class="ro-data">' + l.reading.data + '</div>' : '')
              + '<div class="ro-note">' + esc(l.reading.note) + '</div>'
              + '<div class="ro-tag">Reads normal now.</div></div>'
            : mat(t, { caption: 'Closed up and ready.' })),
          tray: (l.rechecked || !(t.testsRun || []).length
                  ? ''
                  : '<button class="flat" data-act="recheck">Test it again to be sure</button>')
            + '<button class="big" data-act="price">Call them and name a price</button>'
        };
      }

      /*
       * Most repairs are one move. A few are genuinely two — the PS5's
       * cooler has to be cleaned AND given fresh liquid metal, and a blown
       * capacitor has to come off AND be replaced. Closing the job after the
       * first card meant a careful player did half a repair and got one star
       * for it, which is not a lesson, it is a trick.
       *
       * So the tray stays open until you say you are done.
       */
      var left = fixes(t).filter(function (o) { return applied.indexOf(o.id) === -1; });
      var tray = '';
      if (left.length) {
        tray += '<div class="rack wide">' + left.map(function (o) {
          var meta = o.k === 'part'
            ? fmt(o.priceFt) + ' \u00b7 ' + (o.days ? o.days + ' days to arrive' : 'on the shelf')
              + (o.overBudget ? ' \u00b7 more than they have' : '')
            : o.line;
          return '<button class="lcard fix' + (o.k === 'none' ? ' none' : '')
            + (o.overBudget ? ' pricey' : '') + '" data-drag="fix" data-fix="' + esc(o.id) + '">'
            + '<span class="lcard-art">' + (o.art === 'part' ? Art.part(o.artId)
                : o.art === 'instrument' ? Art.instrument(o.artId) : Art.tool(o.artId)) + '</span>'
            + '<span class="lcard-txt"><b>' + esc(o.name) + '</b><span>' + esc(meta) + '</span></span></button>';
        }).join('') + '</div>';
      }
      if (applied.length) tray += '<button class="big" data-act="close">That is it — close it up</button>';
      else tray += '<div class="tray-hint">Drop what it needs onto the machine. Some jobs need two things; some need none.</div>';

      return {
        scene: bubbles(t, 2) + mat(t, { drop: 'fix', dropLabel: 'the open machine',
                                     caption: applied.length ? 'Anything else?' : 'Drop what it needs onto it.' }),
        tray: tray
      };
    },

    // 6. The bill. There is no right answer printed anywhere — there is only
    //    what the work was worth and what they can actually pay.
    price: function (t) {
      var l = L(t);
      var fair = Settle.fair(t);
      var cost = Math.max(2000, Math.round(t.partsCostFt / 500) * 500);
      var over = Math.round(fair * 1.6 / 500) * 500;
      var opts = [
        t.partsCostFt
          ? { ft: cost, label: 'Just what the parts cost', sub: 'Your time for nothing.' }
          : { ft: cost, label: 'Next to nothing', sub: 'A goodwill charge. You worked for free.' },
        { ft: fair, label: 'The parts and your time', sub: t.labourHours.toFixed(1) + ' h at 5.000 Ft.' },
        { ft: over, label: 'The parts, your time and a margin', sub: 'They will not know the difference. Probably.' }
      ].filter(function (o, i, a) { return i === 0 || o.ft !== a[i - 1].ft; });

      /*
       * The way out of a job you have already lost money on.
       *
       * Buy a part somebody cannot afford and every price you name gets
       * refused — which, with three fixed buttons and nothing else, is a
       * student stuck on a screen with no move left. The full shop has a
       * decline-honestly path; this is the same idea. It finds the most they
       * will actually hand over, says so plainly, and lets the shop eat the
       * difference. Losing money on a bad call is a lesson. Being trapped is
       * not.
       */
      if (l.refused) {
        var most = 0;
        for (var p = Math.round(t.budgetFt / 500) * 500; p >= 0; p -= 500) {
          var q = window.TechOpsScore.grade(Shop, t, p);
          if (window.TechOpsScore.willPay(t, p, q.overall)) { most = p; break; }
        }
        opts.push({ ft: most, label: 'Take what they will actually pay', sub: most < t.partsCostFt
          ? 'The shop swallows ' + fmt(t.partsCostFt - most) + ' of parts. That is what over-buying costs.'
          : 'Less than the job was worth to you.', out: true });
      }

      return {
        scene: personCard(t) + bubbles(t)
          + (l.refused ? '<div class="refused">' + esc(l.refused) + '</div>' : ''),
        tray: '<div class="prices">' + opts.map(function (o) {
            return '<button class="price' + (o.out ? ' out' : '') + '" data-price="' + o.ft + '">'
              + '<b>' + fmt(o.ft) + '</b><span>' + esc(o.label) + '</span>'
              + '<i>' + esc(o.sub) + '</i></button>';
          }).join('') + '</div>'
      };
    },

    // The verdict. Stars, in their words, and the one thing worth knowing.
    done: function (t) {
      var res = L(t).result, c = J.customer(t);
      var lesson = (res.lessons || [])[0];
      return {
        scene: '<div class="verdict">'
          + '<div class="stars-big">' + UI.stars(res.stars) + '</div>'
          + '<div class="person small"><div class="pic">' + UI.face(c, 56) + '</div>'
          + '<div class="who"><b>' + esc(c.name) + '</b><span>' + fmt(res.paidFt) + ' paid</span></div></div>'
          + '<div class="bub them big-bub">' + esc(res.reviewBody) + '</div>'
          + (lesson ? '<div class="lesson"><b>Worth knowing</b>' + esc(lesson) + '</div>' : '')
          + (res.quietDays ? '<div class="lesson bad"><b>A quiet spell</b>Nobody new comes in for '
             + res.quietDays + ' day' + (res.quietDays === 1 ? '' : 's') + '. People read the reviews.</div>' : '')
          + '</div>',
        tray: '<button class="big" data-act="next">Next customer</button>'
      };
    }
  };

  // ─────────────────────────────── actions ────────────────────────────

  function ask(t, qid) {
    var q = Q.QUESTIONS.filter(function (x) { return x.id === qid; })[0];
    if (!q || (t.asked || []).indexOf(qid) !== -1) return;
    t.asked.push(qid);
    t.labourHours += q.hours;
    say(t, 'you', q.q);
    say(t, 'them', Q.answerFor(t.faultId, qid, J.useCase(t), t).t);
    audio('playKeyPop');
    Shop.emit('change');
    render();
  }

  function useDriver(t, toolId, screwIdx) {
    var l = L(t), s = l.screws[screwIdx];
    if (!s || s.out) return;
    if (toolId === s.type) {
      s.out = true;
      t.labourHours += 0.05;
      audio('playScrew');

    } else {
      var same = String(toolId).split('-')[0] === String(s.type).split('-')[0];
      l.slip = same
        ? 'Right shape, wrong size — it rattles in the head. Read the number on the handle.'
        : 'That shape does not go in that screw. Look at the head again.';
      audio('playErrorBuzz');
    }
    Shop.emit('change');
    render();
  }

  /**
   * One tool, one step. The wrong tool is told what it is wrong for, because
   * "nothing happened" is the response that teaches nothing at all.
   */
  function useTool(t, toolId) {
    var m = J.machine(t), next = nextWayIn(t, m);
    if (!next) return;
    var def = J.STEPS[next];
    if (toolId !== def.tool) {
      L(t).slip = '“' + def.label + '” is not a job for the ' + J.TOOLS[toolId].name.toLowerCase()
        + '. Read what it is asking for.';
      audio('playErrorBuzz');
      Shop.emit('change');
      return render();
    }
    t.openSteps.push(next);
    t.labourHours += 0.4;
    note(t, def.label + '.');
    audio(def.tool === 'heat_pad' ? 'playAirBlow' : 'playCableSnap');
    Shop.emit('change');
    render();
  }

  /** A step that needs no equipment — switching a desktop off at the wall. */
  function doStep(t, stepId) {
    var def = J.STEPS[stepId];
    if (!def || t.openSteps.indexOf(stepId) !== -1) return;
    t.openSteps.push(stepId);
    t.labourHours += 0.2;
    note(t, def.label + '.');
    audio('playKeyPop');
    Shop.emit('change');
    render();
  }

  function unplugBattery(t) {
    t.batteryDisconnected = true;
    if (t.openSteps.indexOf('battery_connector') === -1) t.openSteps.push('battery_connector');
    t.labourHours += 0.2;
    note(t, 'Battery off — safe to work on now.');
    audio('playCableSnap');
    go(t, 'test');
  }

  /*
   * Some instruments have no numbers — looking at a board and listening to a
   * drive give a verdict, not a readout. `formatReading` returns the word
   * "abnormal" for those, which in a monospace box under a red border is
   * three things all saying the same thing. Drop it and let the sentence talk.
   */
  var WORDY = ['abnormal', 'nothing obviously wrong', 'shows the problem', 'as expected'];
  function plainOnly(data) {
    return WORDY.indexOf(String(data).trim()) === -1 ? data : '';
  }

  function runTest(t, id) {
    if ((t.testsRun || []).indexOf(id) !== -1) return;
    var m = J.machine(t), inst = UI.INSTRUMENTS[id];
    t.testsRun.push(id);
    t.labourHours += inst.hours;
    var r = F.readingsFor(m, J.fault(t))[id] || {};
    if (id === 'meter') {
      // One probe, one answer. The classic bench lets you walk the board test
      // point by test point; here the meter reports the point that is wrong,
      // or says every rail is where it should be.
      var bad = shortOn(r);
      var any = bad || r[Object.keys(r)[0]] || {};
      L(t).reading = {
        id: id,
        data: esc(any.label || 'rail') + ' <span class="' + (bad ? 'bad' : 'ok') + '">' + esc(any.v || '?') + '</span>',
        note: any.note || 'Every rail reads where it should.',
        hit: !!bad
      };
    } else {
      var f = UI.formatReading(id, r);
      L(t).reading = { id: id, data: plainOnly(f.data), note: f.note || 'Nothing to report.', hit: f.hit };
    }
    audio(L(t).reading.hit ? 'playContinuityBeep' : 'playKeyPop');
    Shop.emit('change');
    render();
  }

  /** The same instrument again, now that the part is in. The payoff for measuring. */
  function recheck(t) {
    var l = L(t), id = (l.reading && l.reading.id) || (t.testsRun || [])[0];
    if (!id) return;
    var m = J.machine(t);
    // The fault itself may say what this instrument reads once it is dealt
    // with — the PS5 that "peaks at 81 degrees and holds there" is written
    // into the fault, and it is better than anything a baseline can say.
    var own = (J.fault(t).after || {})[id];
    if (own) {
      l.reading = { id: id, data: '', note: own.charAt(0).toUpperCase() + own.slice(1), hit: false };
    } else {
      var r = (F.baseline(m) || {})[id] || {};
      var f = UI.formatReading(id, r);
      l.reading = { id: id, data: plainOnly(f.data), note: f.note || 'Back to normal.', hit: false };
    }
    l.rechecked = true;
    t.labourHours += UI.INSTRUMENTS[id].hours;
    audio('playSuccessChime');
    Shop.emit('change');
    render();
  }

  function applyFix(t, optId) {
    var l = L(t), o = fixes(t).filter(function (x) { return x.id === optId; })[0];
    if (!o) return;

    if (o.k === 'part') {
      var p = Parts.get(o.id);
      Shop.spend(p.priceFt, p.name);
      t.daysWaited += p.deliveryDays;
      t.installed.push({ partId: p.id, cat: p.cat });
      t.partsCostFt += p.priceFt;
      t.labourHours += 0.4;
      say(t, 'you', p.deliveryDays
        ? 'Ordered. ' + p.deliveryDays + ' days until it lands — that is ' + p.deliveryDays + ' days they are without it.'
        : 'Fitted.');
      audio('playCableSnap');
    } else if (o.k === 'action') {
      var a = J.ACTIONS[o.id];
      t.actionsDone.push(o.id);
      t.labourHours += a.labourHours || 0.3;
      if (a.costFt) Shop.spend(a.costFt, a.label);
      say(t, 'you', a.done || a.label);
      audio('playSuccessChime');
    } else {
      say(t, 'you', 'Nothing in there needs replacing. I will close it up.');
      audio('playKeyPop');
    }
    (l.applied = l.applied || []).push(o.id);
    if (o.k === 'none') l.closed = true;               // nothing else to do by definition
    l.reading = null;
    Shop.emit('change');
    render();
  }

  function priceIt(t, ft) {
    var l = L(t);
    var res = Settle.settle(t, ft);
    if (res.refused) {
      l.refused = res.why;
      audio('playErrorBuzz');
      Shop.emit('change');
      render();
      return;
    }
    res.paidFt = ft;
    l.refused = null;
    l.result = res;
    l.beat = 'done';
    // settle() clears Shop.state.ticket, so the finished job is held here
    // for the verdict screen and dropped when the next customer walks in.
    window.TechOpsLite.finished = t;
    audio(res.stars >= 4 ? 'playSuccessChime' : 'playErrorBuzz');
    render();
  }

  function nextCustomer() {
    window.TechOpsLite.finished = null;
    Shop.state.ticket = J.newTicket(Shop, {});
    Shop.emit('change');
    render();
  }

  // ─────────────────────────────── render ─────────────────────────────

  function hud() {
    var S = Shop.state;
    var avg = S.jobsDone ? (S.starsTotal / S.jobsDone).toFixed(1) : null;
    return '<span class="h day">Day ' + S.day + '</span>'
      + '<span class="h till">' + fmt(S.cashFt) + '</span>'
      + (avg ? '<span class="h stars">' + avg + '★</span>' : '')
      + '<span class="h rep"><i style="width:' + Math.round(S.reputation) + '%"></i></span>';
  }

  function render() {
    var t = Shop.state.ticket || window.TechOpsLite.finished;
    if (!t) { Shop.state.ticket = J.newTicket(Shop, {}); t = Shop.state.ticket; }

    var l = L(t);
    var out = (BEATS[l.beat] || BEATS.meet)(t);
    if (!out.scene && !out.tray) return;                 // a beat that forwarded

    document.getElementById('lite-hud').innerHTML = hud();
    stage.innerHTML = '<div class="scene">' + out.scene + '</div>';
    bar.innerHTML = (l.slip ? '<div class="slip">' + esc(l.slip) + '</div>' : '') + out.tray;
    l.slip = null;

    /*
     * Where to leave the view.
     *
     * At the bottom while they are talking, so the newest line is the one you
     * read. On the machine once you are working on it: scrolling to the
     * bottom of a tall scene put the mat above the top of the window on a
     * short one, and dropping a tool on something you cannot see is not a
     * skill anybody should need.
     */
    var focus = stage.querySelector('.mat, .readout, .solo');
    if (focus && ['open', 'test', 'fix'].indexOf(l.beat) !== -1) {
      stage.scrollTop = Math.max(0, focus.offsetTop - 8);
    } else {
      stage.scrollTop = stage.scrollHeight;
    }
    if (window.TechOpsLite.paintFaces) window.TechOpsLite.paintFaces(stage);
    bindAll(t);
  }

  function bindAll(t) {
    var root = document.getElementById('lite-app');

    root.querySelectorAll('[data-act]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-act');
        if (a === 'ask')      go(t, 'ask');
        else if (a === 'open')go(t, 'open');
        else if (a === 'esd') { t.esdOn = true; note(t, 'Strapped and earthed.'); Shop.emit('change'); render(); }
        else if (a === 'noesd'){ L(t).skippedEsd = true; render(); }
        else if (a === 'fix') go(t, 'fix');
        else if (a === 'close') { L(t).closed = true; Shop.emit('change'); render(); }
        else if (a === 'recheck') recheck(t);
        else if (a === 'price') go(t, 'price');
        else if (a === 'next') nextCustomer();
      };
    });
    root.querySelectorAll('[data-ask]').forEach(function (b) {
      b.onclick = function () { ask(t, b.getAttribute('data-ask')); };
    });
    root.querySelectorAll('[data-step]').forEach(function (b) {
      b.onclick = function () { doStep(t, b.getAttribute('data-step')); };
    });
    root.querySelectorAll('[data-price]').forEach(function (b) {
      b.onclick = function () { priceIt(t, +b.getAttribute('data-price')); };
    });

    Drag.init({
      root: root,
      itemSel: '[data-drag]',
      targetSel: '[data-drop]',
      accepts: function (item, target) {
        var kind = item.getAttribute('data-drag');
        var drop = target.getAttribute('data-drop');
        return (kind === 'tool' && item.getAttribute('data-tool') === 'spudger' && drop === 'connector')
            || (kind === 'tool' && drop === 'screw')
            || (kind === 'tool' && drop === 'step')
            || (kind === 'instr' && drop === 'test')
            || (kind === 'fix' && drop === 'fix');
      },
      onHold: function (item) {
        document.getElementById('lite-app').classList.toggle('carrying', !!item);
      },
      onMiss: function (item, target) {
        if (!target) return;
        L(t).slip = 'That does not go there.';
        render();
      },
      onDrop: function (item, target) {
        var kind = item.getAttribute('data-drag');
        if (kind === 'tool' && target.getAttribute('data-drop') === 'screw') {
          useDriver(t, item.getAttribute('data-tool'), +target.getAttribute('data-screw'));
        } else if (kind === 'tool' && target.getAttribute('data-drop') === 'connector') {
          if (item.getAttribute('data-tool') === 'spudger') unplugBattery(t);
        } else if (kind === 'tool' && target.getAttribute('data-drop') === 'step') {
          useTool(t, item.getAttribute('data-tool'));
        } else if (kind === 'instr') {
          runTest(t, item.getAttribute('data-instr'));
        } else if (kind === 'fix') {
          applyFix(t, item.getAttribute('data-fix'));
        }
      }
    });
  }

  window.TechOpsLiteFlow = {
    mount: function (stageEl, barEl) { stage = stageEl; bar = barEl; },
    render: render
  };
})(window);
