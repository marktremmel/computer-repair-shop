/**
 * TechOps Budapest — the workbench.
 *
 * Screws only come out with the right driver. Components only come out
 * once the battery is disconnected. Nothing here is a quiz question —
 * the machine simply refuses, and tells you why.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var esc  = function (s) { return UI.esc(s); };

  var state = { tool: null, inHand: null, msg: '', inspect: false };

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function hashCode(str) {
    var h = 2166136261, x = String(str);
    for (var i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  /** Screws are laid out around the perimeter, in whichever heads this machine actually uses. */
  function screwPlan(machine, ticket) {
    if (ticket._screws) return ticket._screws;
    var types = machine.screws;
    var isPhone = machine.kind === 'phone';
    var base = gluedShut(machine) ? 0 : (isPhone ? 2 : (machine.kind === 'desktop' ? 4 : 6));
    // Not every machine of a type is screwed together the same way.
    var wobble = base ? ((hashCode(ticket.id) % 3) - 1) : 0;
    var n = Math.max(0, base + wobble);

    // Someone has been in here before, and they were not careful. This is the
    // payoff for asking "has anyone else worked on it?" at the sit-down.
    var prior = ticket.priorRepair;
    var list = [];
    for (var i = 0; i < n; i++) {
      var t = types[(i % 3 === 2 && types[1]) ? 1 : 0];
      var pos;
      if (isPhone) {
        pos = { left: (i === 0 ? 38 : 56) + '%', bottom: '2%' };
      } else {
        var perSide = Math.ceil(n / 2);
        var onTop = i < perSide;
        var idx = onTop ? i : i - perSide;
        var span = onTop ? perSide : n - perSide;
        pos = { left: (8 + (idx * (84 / Math.max(1, span - 1 || 1)))) + '%' };
        pos[onTop ? 'top' : 'bottom'] = '3.5%';
      }
      list.push({ i: i, type: t, pos: pos, out: false, stripped: false });
    }
    if (prior === 'stripped' && list.length) {
      list[hashCode(ticket.id + 'a') % list.length].stripped = true;
    } else if (prior === 'wrong_screws' && list.length > 1) {
      // Someone put the wrong screws back in, so the heads do not match the case.
      var swap = hashCode(ticket.id + 'b') % list.length;
      list[swap].type = types[1] || types[0];
      list[(swap + 1) % list.length].type = types[0];
    } else if (prior === 'missing' && list.length > 2) {
      list.splice(hashCode(ticket.id + 'c') % list.length, 1);
      list.forEach(function (sc, k) { sc.i = k; });
    }
    ticket._screws = list;
    return list;
  }

  function openStepId(machine) {
    if (machine.kind === 'desktop') return 'side_panel';
    if (machine.kind === 'aio' || machine.kind === 'tablet') return 'lift_display';
    if (machine.kind === 'phone') return 'screen_lift';
    return 'bottom_case';
  }

  /** A machine held shut by glue has no screws to count — it has a seam to beat. */
  function gluedShut(machine) { return machine.kind === 'aio' || machine.kind === 'tablet'; }

  /** What is currently sitting in each bay, and whether the player has found the problem yet. */
  function bayState(ticket, cat) {
    var m = J.machine(ticket), f = J.fault(ticket);
    var installed = ticket.installed.filter(function (i) { return i.cat === cat; })[0];
    if (installed) {
      var p = window.TechOpsParts.get(installed.partId);
      return { filled: true, text: p.name };
    }
    // Only the instrument that genuinely finds this fault reveals it in the bay —
    // running an unrelated test must not hand you the answer.
    var REVEALED_BY = {
      dying_hdd: ['smart', 'listen', 'bench'],
      bad_ram_stick: ['memtest'],
      ram_starved: ['activity'],
      fan_seized: ['thermal', 'visual'],
      thermal_paste_dead: ['thermal', 'visual'],
      battery_swollen: ['battery', 'visual'],
      cracked_screen: ['visual'],
      port_lint: ['power', 'visual']
    };
    var found = (REVEALED_BY[f.id] || []).some(function (x) { return ticket.testsRun.indexOf(x) !== -1; });
    var faulty = (f.fixedBy.kind === 'part' && f.fixedBy.cat === cat) ||
                 (f.fixedBy.kind === 'action' && f.fixedBy.needsPartCat === cat);

    var base = {
      storage: m.storageSoldered ? 'soldered NAND — no slot' :
               (m.storageBuses.indexOf('nvme3') !== -1 || m.storageBuses.indexOf('nvme4') !== -1 || m.storageBuses.indexOf('nvme3x2') !== -1)
                 ? '256 GB drive · ' + window.TechOpsMachines.busLabel(window.TechOpsMachines.bestBus(m)) + ' slot'
                 : '500 GB drive · SATA bay',
      ram:     m.ramSoldered ? 'soldered — no slots' :
               (m.ramSolderedGB ? m.ramSolderedGB + ' GB soldered + ' + m.ramSlots + ' free slot' : m.ramSlots + ' slots · ' + m.ramType.toUpperCase()),
      fan:     'single blower fan',
      thermal: 'heatsink seated on the die',
      battery: m.battery ? m.battery.model + ' pack' : 'no battery',
      screen:  m.display ? m.display.res + ' ' + m.display.panel : '—',
      flex:    'charge port flex'
    }[cat] || '—';

    var faultText = {
      dying_hdd:          'drive present — SMART failing',
      bad_ram_stick:      'module in slot B failing',
      ram_starved:        'not enough for the workload',
      fan_seized:         'fan will not turn — bearing seized',
      thermal_paste_dead: 'paste dried and cracked, fins blocked',
      battery_swollen:    'pack visibly domed — swollen',
      cracked_screen:     'glass shattered, digitiser dead',
      port_lint:          'port packed with compacted lint'
    }[f.id];

    if (faulty && found && faultText) return { fault: true, text: faultText };
    return { text: base };
  }

  /**
   * Which chip on the real board stands for which teardown region. The board
   * draws chip ids, the game reasons in region ids, and these two have to be
   * kept in step — getting this wrong silently makes components unclickable.
   */
  var REGION_CHIP = {
    drive_bay:  ['drive', 'm2', 'm2h', 'm2c', 'nand1', 'nandt', 'ufs', 'nandp'],
    ram_bay:    ['ram_a', 'dimm', 'ram1', 'ramh1', 'g1'],
    fan:        ['fancut', 'fancut2', 'fanl', 'fanhdr', 'fanc'],
    cooler:     ['socket', 'apu'],
    heatsink:   ['cpu', 'soc', 'soch', 'socp', 'soct', 'apu', 'socket'],
    battery:    ['battl', 'battc', 'battch', 'battcs', 'battcp', 'battct'],
    battery_connector: ['battl', 'battc', 'battch', 'battcs', 'battcp', 'battct'],
    charge_port:['usbcp', 'usbch', 'usbcs', 'usbct', 'usbcl', 'usbc', 'usbc1'],
    display_flex:['displ', 'disp', 'dispp', 'dispd', 'dispt', 'bright']
  };

  /** region id -> the chip this machine's board actually has for it. */
  function chipForRegion(machine, regionId) {
    var L = window.TechOpsBoards.forMachine(machine);
    var has = {};
    L.chips.forEach(function (c) { has[c.id] = true; });
    var cands = REGION_CHIP[regionId] || [];
    for (var i = 0; i < cands.length; i++) if (has[cands[i]]) return cands[i];
    return null;
  }

  /**
   * chip id -> the region to act on. Several regions can share one chip (the
   * battery connector and the battery itself are the same place on the board),
   * so pick the one that can actually be done next rather than the first match.
   */
  function regionForChip(machine, chipId, ticket) {
    var hits = Object.keys(REGION_CHIP).filter(function (k) {
      return chipForRegion(machine, k) === chipId;
    });
    if (!hits.length) return null;
    if (!ticket) return hits[0];

    var undone = hits.filter(function (k) { return ticket.openSteps.indexOf(k) === -1; });
    if (!undone.length) return hits[0];
    // Prefer one that is unblocked right now — that is the step the player means.
    var ready = undone.filter(function (k) { return J.canStep(ticket, k).ok; });
    if (ready.length) {
      // and among those, the earliest in this machine's own teardown order
      var order = machine.teardown;
      ready.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
      return ready[0];
    }
    return undone[0];
  }

  function bayList(ticket) {
    var m = J.machine(ticket);
    var defs = [
      { cat: 'storage', step: 'drive_bay',   label: 'Drive bay' },
      { cat: 'ram',     step: 'ram_bay',     label: 'Memory' },
      { cat: 'fan',     step: 'fan',         label: 'Fan' },
      { cat: 'battery', step: 'battery',     label: 'Battery' },
      { cat: 'screen',  step: 'screen_lift', label: 'Display' },
      { cat: 'flex',    step: 'charge_port', label: 'Charge port' }
    ];
    return defs.filter(function (d) { return m.teardown.indexOf(d.step) !== -1; });
  }

  /**
   * Steps that are a gesture rather than a click, and the geometry each one
   * runs over. Percentages are relative to the board stage.
   */
  function gestureFor(stepId, machine) {
    var reg = window.TechOpsBoard.region(machine, stepId === 'battery' ? 'battery' : stepId);
    var L = window.TechOpsBoard.layoutFor(machine);
    var pc = function (r, fx, fy) {
      return { x: (r.x + r.w * fx) / L.w * 100, y: (r.y + r.h * fy) / L.h * 100 };
    };

    if (stepId === 'battery_connector' && reg) {
      return { type: 'lift', start: pc(reg, 0.5, 0.5), tolerance: 4.5,
        title: 'Lift the battery connector',
        hint: 'Get the spudger tip under it and lift straight up. Lever it sideways and you bend the pins flat.' };
    }
    if (stepId === 'display_flex' && reg) {
      return { type: 'lift', start: pc(reg, 0.5, 0.5), tolerance: 4,
        title: 'Unclip the display flex',
        hint: 'These pop straight up off the board. Pull along the cable instead and you tear the traces.' };
    }
    if (stepId === 'battery' && reg) {
      return { type: 'pull', start: pc(reg, 0.28, 0.0), tolerance: 5,
        title: 'Draw out the adhesive tab',
        hint: 'Slow and even, in line with the tab. Snatch it and it snaps off flush under the battery.' };
    }
    if (stepId === 'cut_adhesive') {
      var h = L.hull, pad = 4;
      var x0 = h.x / L.w * 100 + pad, x1 = (h.x + h.w) / L.w * 100 - pad;
      var y0 = h.y / L.h * 100 + pad, y1 = (h.y + h.h) / L.h * 100 - pad;
      return { type: 'trace', tolerance: 4.5,
        path: [{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1},{x:x0,y:y0}],
        start: { x: x0, y: y0 },
        title: 'Cut the display adhesive',
        hint: 'Run the wheel all the way round inside the channel. Wander out of it and you are cutting the display cable.' };
    }
    if (stepId === 'pick_seam') {
      var h2 = L.hull;
      var a = h2.x / L.w * 100 + 3, b = (h2.x + h2.w) / L.w * 100 - 3;
      var top = h2.y / L.h * 100 + 3;
      return { type: 'trace', tolerance: 5,
        path: [{x:a,y:top},{x:b,y:top}],
        start: { x: a, y: top },
        title: 'Work the picks along the seam',
        hint: 'Keep them shallow and moving. Dig in and you crack the digitiser you are trying to save.' };
    }
    return null;
  }

  function runGesture(stepId, onOk) {
    var t = Shop.state.ticket, m = J.machine(t);
    var g = gestureFor(stepId, m);
    var stage = document.querySelector('#view-bench .board-stage');
    if (!g || !stage) { onOk(1); return true; }

    window.TechOpsPrecision.run(Object.assign({}, g, {
      host: stage,
      onDone: function (res) {
        if (res.aborted) { state.msg = 'Backed off. Nothing done.'; return render(); }
        if (!res.ok) {
          // A failed gesture never completes the step. You always get another go —
          // a bench is not a quiz. What failure costs is time, and sometimes it
          // closes off the easy route and leaves you the slow one.
          t.labourHours += 0.4;
          if (stepId === 'battery') {
            t.snappedTabs = (t.snappedTabs || 0) + 1;
            var tabsLeft = Math.max(0, 2 - t.snappedTabs);
            state.msg = res.reason + (tabsLeft
              ? ' There ' + (tabsLeft === 1 ? 'is one more tab' : 'are ' + tabsLeft + ' more tabs') + ' — try again on that one, slower.'
              : ' Both tabs are gone. You will have to lever the pack out instead, which is slower and riskier.');
            UI.toast('Adhesive tab snapped', tabsLeft
              ? 'One tab gone. Pull the next one slowly and evenly.'
              : 'No tabs left. Use “Lever the pack out” on the bench — it always works, it just costs you.', 'bad');
          } else {
            state.msg = (res.reason || 'That did not go cleanly.') + ' Nothing is broken — line up on the marker and go again, slower.';
            UI.toast('Have another go', res.reason || 'Take it slowly. You can try as many times as you like; it only costs bench time.', 'bad');
          }
          Shop.emit('change');
          return render();
        }
        var Pp = Shop.state.perks || {};
        var qual = res.quality;
        if (Pp.gentleGlue && (stepId === 'pick_seam' || stepId === 'cut_adhesive')) qual = Math.min(1, qual + 0.2);
        if (Pp.steadyHand && (stepId === 'battery_connector' || stepId === 'display_flex')) qual = Math.min(1, qual + 0.2);
        res = { ok: res.ok, quality: qual, reason: res.reason };
        if (res.quality < 0.75) {
          t.sloppySteps = (t.sloppySteps || 0) + 1;
          UI.toast('Done, but scrappy', 'It is off, but you marked it doing it. That goes on the job record.', 'bad');
        }
        onOk(res.quality);
      }
    }));
    return false;
  }

  // ── actions ─────────────────────────────────────────────────────────
  function selectTool(id) {
    if (id === 'esd_strap') {
      Shop.state.ticket.esdOn = !Shop.state.ticket.esdOn;
      audio('playKeyPop');
      state.msg = Shop.state.ticket.esdOn
        ? 'Strap on, clipped to the mat. You are at the same potential as the board now.'
        : 'Strap off.';
      return render();
    }
    state.tool = state.tool === id ? null : id;
    state.inHand = null;
    audio('playKeyPop');
    var t = J.TOOLS[id];
    state.msg = t && t.hint ? t.hint : (t ? t.name + ' in hand.' : '');
    render();
  }

  function turnScrew(screw) {
    var t = Shop.state.ticket;
    if (screw.out) return;
    var tool = J.TOOLS[state.tool];

    // A rounded screw is not a dead end — that is what the extractor is for.
    if (screw.stripped) {
      if (state.tool === 'extractor') {
        screw.out = true;
        t.labourHours += 0.4;
        audio('playScrew');
        state.msg = 'The extractor bit bit into the ruined head and backed it out. Twenty-four minutes you will not get back.';
        UI.toast('Screw extracted', 'Out, but scrap. The damage still goes on the job record.', 'good');
        Shop.emit('change');
        return render();
      }
      state.msg = 'That head is rounded — a driver has nothing left to grip. Take the screw extractor off the rack.';
      audio('playErrorBuzz');
      return render();
    }

    if (!tool || tool.kind !== 'driver') {
      state.msg = 'Pick a driver off the rack first — and look at the screw head before you choose.';
      audio('playErrorBuzz');
      return render();
    }

    if (state.tool !== screw.type) {
      // First attempt: the bit skates. That is the signal a real technician feels
      // and stops on. Only ignoring it rounds the head.
      var allowed = 1 + ((Shop.state.perks || {}).extraSkate || 0);
      screw.skates = (screw.skates || 0) + 1;
      if (screw.skates <= allowed) {
        screw.skated = true;
        audio('playErrorBuzz');
        state.msg = 'The bit will not sit down in it — it skates out and turns without biting. Wrong shape. Look at the head and pick another driver before you try again.';
        UI.toast('The bit is skating', 'It is not catching. Force it again with this driver and you will round the head off.', 'bad');
        Shop.emit('change');
        return render();
      }
      screw.stripped = true;
      t.strippedScrews++;
      audio('playErrorBuzz');
      UI.toast('Screw stripped', 'A ' + J.TOOLS[state.tool].name + ' forced into a ' + J.TOOLS[screw.type].name
        + ' head, twice. The socket is round now — use the screw extractor.', 'bad');
      state.msg = 'Rounded. That head was a ' + J.TOOLS[screw.type].name + '. You can still get it out with the extractor, but it counts against the job.';
      Shop.emit('change');
      return render();
    }

    screw.out = true;
    t.labourHours += 0.05 * ((Shop.state.perks || {}).screwSpeed || 1);
    audio('playScrew');
    var left = screwsLeft(t);
    state.msg = left ? 'Out. ' + left + ' to go.' : 'That was the last one holding it shut — lift the case off.';
    Shop.emit('change');
    render();
  }

  /** Screws still physically holding the case on. A rounded one still holds. */
  function screwsLeft(t) {
    return screwPlan(J.machine(t), t).filter(function (s) { return !s.out; }).length;
  }

  function doStep(stepId) {
    var t = Shop.state.ticket, m = J.machine(t);
    var def = J.STEPS[stepId];
    var open = openStepId(m);

    if (stepId === open && !gluedShut(m) && screwsLeft(t) > 0) {
      state.msg = 'Still ' + screwsLeft(t) + ' screw' + (screwsLeft(t) === 1 ? '' : 's') + ' holding it shut.';
      audio('playErrorBuzz');
      return render();
    }

    var can = J.canStep(t, stepId);
    if (!can.ok) {
      state.msg = can.why;
      audio('playErrorBuzz');
      UI.toast('Not yet', can.why, 'bad');
      return render();
    }

    // Tool requirements — and the one that costs you a board.
    if (stepId === 'battery_connector') {
      if (state.tool !== 'spudger') {
        if (state.tool && J.TOOLS[state.tool] && (J.TOOLS[state.tool].kind === 'driver' || state.tool === 'tweezers')) {
          if (!t._metalWarned) {
            t._metalWarned = true;
            audio('playErrorBuzz');
            UI.toast('Stop — that is metal', 'You are about to put a metal tool across a live battery connector. Put it down and use the nylon spudger.', 'bad');
            state.msg = 'The tip is a millimetre from bridging two contacts on a live board. Use the nylon spudger instead — that is what it is for.';
            Shop.emit('change');
            return render();
          }
          t.boardDamaged = true;
          audio('playErrorBuzz');
          UI.toast('You shorted the board', 'Metal across a live battery connector. There was a bright spark and now nothing powers on.', 'bad');
          state.msg = 'That is why the spudger is nylon. Metal bridges the connector pins while the pack is still live.';
          Shop.emit('change');
          return render();
        }
        state.msg = 'Use the nylon spudger to lift the connector — never a metal tool.';
        audio('playErrorBuzz');
        UI.toast('Wrong tool', 'Lift the battery connector with the nylon spudger.', 'bad');
        return render();
      }
      // the flag is set once the lift gesture actually succeeds
      state.msg = 'Spudger under the connector. Now lift it straight up.';
    } else if (def.tool === 'driver') {
      // The screws needed a driver. Lifting the cover off afterwards does not —
      // the button said "ready" and then silently refused, which is nonsense.
      var screwsAllOut = screwsLeft(t) === 0;
      if (stepId === open && screwsAllOut) {
        // nothing in hand required
      } else if (!state.tool || J.TOOLS[state.tool].kind !== 'driver') {
        state.msg = '“' + def.label + '” is held in by screws — put a driver in your hand first.';
        audio('playErrorBuzz');
        UI.toast('No driver in hand', '“' + def.label + '” needs a screwdriver. Pick one off the rack.', 'bad');
        return render();
      }
    } else if (def.tool && def.tool !== 'driver' && state.tool !== def.tool) {
      state.msg = 'That step needs the ' + J.TOOLS[def.tool].name + '.';
      audio('playErrorBuzz');
      UI.toast('Wrong tool', '“' + def.label + '” needs the ' + J.TOOLS[def.tool].name + '.', 'bad');
      return render();
    }

    if (stepId === 'screen_lift' && state.tool === 'suction_cup') audio('playCableSnap');

    // Some steps are a gesture, not a click. Commit only when the hand was steady.
    if (gestureFor(stepId, m)) {
      var pending = stepId;
      var immediate = runGesture(stepId, function (quality) {
        if (t.openSteps.indexOf(pending) === -1) t.openSteps.push(pending);
        if (pending === 'battery_connector') t.batteryDisconnected = true;
        t.labourHours += 0.3;
        state.msg = J.STEPS[pending].label + ' — done' + (quality >= 0.95 ? ', cleanly.' : '.');
        audio('playScrew');
        Shop.emit('change');
        render();
      });
      if (!immediate) return;
      return;
    }

    t.openSteps.push(stepId);
    t.labourHours += 0.3;
    if (!state.msg || stepId !== 'battery_connector') state.msg = def.label + ' — done.';
    audio('playScrew');
    Shop.emit('change');
    render();
  }

  function doAction(actionId) {
    var t = Shop.state.ticket;
    var a = J.ACTIONS[actionId];
    if (t.actionsDone.indexOf(actionId) !== -1) return;

    if (actionId === 'lever_battery') {
      if (state.tool !== 'spudger') {
        state.msg = 'Use the nylon spudger — a metal tool against a lithium cell is how fires start.';
        audio('playErrorBuzz');
        UI.toast('Wrong tool', 'Nylon spudger only, on a battery.', 'bad');
        return render();
      }
      t.openSteps.push('battery');
      t.actionsDone.push(actionId);
      t.labourHours += a.labourHours;
      audio('playScrew');
      state.msg = a.done;
      UI.toast('Pack out', a.done, 'good');
      Shop.emit('change');
      return render();
    }

    if (actionId === 'reconnect_battery') {
      if (state.tool !== 'spudger') {
        state.msg = 'Press the connector back down with the nylon spudger.';
        audio('playErrorBuzz');
        UI.toast('Wrong tool', 'Use the nylon spudger to seat the connector.', 'bad');
        return render();
      }
      t.batteryDisconnected = false;
      t.openSteps = t.openSteps.filter(function (x) { return x !== 'battery_connector'; });
      t.labourHours += a.labourHours;
      audio('playCableSnap');
      state.msg = a.done;
      UI.toast('Battery reconnected', 'It can boot again. Lift it back off before you touch anything else.', 'good');
      Shop.emit('change');
      return render();
    }

    if (a.tool && state.tool !== a.tool) {
      state.msg = 'That needs the ' + J.TOOLS[a.tool].name + ' in hand.';
      audio('playErrorBuzz');
      UI.toast('Wrong tool', '“' + a.label + '” needs the ' + J.TOOLS[a.tool].name + '.', 'bad');
      return render();
    }
    if (a.needsStep && t.openSteps.indexOf(a.needsStep) === -1) {
      state.msg = 'You cannot reach it yet — ' + J.STEPS[a.needsStep].label.toLowerCase() + ' first.';
      audio('playErrorBuzz');
      UI.toast('Cannot reach it', 'You have to ' + J.STEPS[a.needsStep].label.toLowerCase() + ' before you can get at that.', 'bad');
      return render();
    }
    if (a.needsAction && t.actionsDone.indexOf(a.needsAction) === -1) {
      state.msg = 'Clean the old paste off before you put new paste on. New on top of old is worse than either.';
      audio('playErrorBuzz');
      UI.toast('Clean it first', 'Fresh paste on top of dried paste is worse than either on its own.', 'bad');
      return render();
    }
    // Paste is applied, not slotted into a bay — take it straight off the shelf.
    var consumedIdx = -1;
    if (a.needsPartCat) {
      var already = t.installed.some(function (i) { return i.cat === a.needsPartCat; });
      if (!already) {
        consumedIdx = Shop.state.shelf.findIndex(function (e) {
          var p = window.TechOpsParts.get(e.partId);
          return p && p.cat === a.needsPartCat;
        });
        if (consumedIdx === -1) {
          var onWay = Shop.state.onOrder.some(function (e) {
            var p = window.TechOpsParts.get(e.partId);
            return p && p.cat === a.needsPartCat;
          });
          state.msg = onWay
            ? 'Your thermal compound is still in transit. Wait for the delivery in the Parts market.'
            : 'Nothing to apply — you have no thermal compound. Buy some in the Parts market.';
          audio('playErrorBuzz');
          UI.toast(onWay ? 'Still in transit' : 'Nothing to apply', state.msg, 'bad');
          return render();
        }
      }
    }

    if (consumedIdx > -1) {
      var used = Shop.state.shelf.splice(consumedIdx, 1)[0];
      var usedPart = window.TechOpsParts.get(used.partId);
      t.installed.push({ partId: usedPart.id, cat: usedPart.cat });
      t.partsCostFt += used.paidFt || usedPart.priceFt;
      if (state.inHand !== null && state.inHand >= consumedIdx) state.inHand = null;
      UI.toast('Applied', usedPart.name + ' — used on this machine.', 'good');
    }

    if (actionId === 'clean_port') {
      var stage = document.querySelector('#view-bench .board-stage');
      if (stage && !t._scraped) {
        var mm = J.machine(t);
        var port = window.TechOpsBoard.region(mm, 'charge_port');
        var LL = window.TechOpsBoard.layoutFor(mm);
        var at = port
          ? { x: (port.x + port.w / 2) / LL.w * 100, y: (port.y + port.h / 2) / LL.h * 100 }
          : { x: 50, y: 88 };
        window.TechOpsPrecision.run({
          type: 'scrape', host: stage, start: at, tolerance: 5,
          title: 'Scrape the lint out',
          hint: 'Work the wooden pick in and out. Slide sideways and you are gouging the housing, not the lint.',
          onDone: function (res) {
            if (res.aborted || !res.ok) { state.msg = 'Backed off.'; return render(); }
            t._scraped = true;
            doAction('clean_port');
          }
        });
        return;
      }
    }

    t.actionsDone.push(actionId);
    t.labourHours += a.labourHours;
    audio(actionId === 'clean_fins' ? 'playAirBlow' : 'playScrew');
    state.msg = a.done;
    UI.toast(a.label, a.done, 'good');
    Shop.emit('change');
    render();
  }

  function runInstrument(id) {
    var t = Shop.state.ticket;
    var inst = UI.INSTRUMENTS[id];
    // Once something has been changed, every instrument can be run again so the
    // player can actually SEE the repair land instead of taking it on trust.
    if (t.testsRun.indexOf(id) !== -1) {
      if (!t.retestNeeded) return;
      t.retests = t.retests || {};
      if (t.retests[id]) return;
      t.retests[id] = true;
      t.labourHours += inst.hours;
      audio('playSuccessChime');
      var after = repairedReading(t, id);
      state.msg = inst.name + ' (after the repair): ' + after;
      UI.toast('\u2713 ' + inst.name + ' re-run', after, 'good');
      Shop.emit('change');
      return render();
    }
    if (inst.needsOpen && !J.flags(t).interior) {
      state.msg = 'Open the case first — you cannot inspect what you cannot see.';
      audio('playErrorBuzz');
      return render();
    }
    var P = Shop.state.perks || {};
    var cost = inst.hours * (P.testSpeed || 1);
    if (P.elecSpeed && (id === 'power' || id === 'battery')) cost *= P.elecSpeed;
    t.testsRun.push(id);
    t.labourHours += cost;
    if (P.sharpEyes && id === 'visual') {
      UI.toast('Under the microscope', 'The scope picks up something a naked eye would miss on this board.', 'good');
    }
    audio('playPing');
    var r = window.TechOpsFaults.readingsFor(J.machine(t), J.fault(t))[id] || {};
    state.msg = inst.name + ': ' + (r.note || 'nothing unusual.');
    Shop.emit('change');
    render();
  }

  /** What an instrument says once the fault has actually been dealt with. */
  function repairedReading(t, id) {
    var f = J.fault(t);
    var fixed = (f.fixedBy.kind === 'part'
        && t.installed.some(function (i) { return i.cat === f.fixedBy.cat; }))
      || (f.fixedBy.kind === 'action' && t.actionsDone.indexOf(f.fixedBy.id) !== -1);
    if (!fixed) return 'unchanged — whatever was wrong is still wrong.';
    return {
      smart:        'health GOOD, 0 reallocated, 0 pending. The new drive reports clean.',
      bench:        'sequential back up to full bus speed, latency under a millisecond.',
      listen:       'silent. No clicking.',
      memtest:      'four passes, zero errors.',
      thermal:      'peaks at 74 \u00b0C under full load and holds clock. No throttling.',
      battery:      'cycle count 0, 100% of design capacity, condition Normal.',
      power:        'plug seats flush, full wattage negotiated.',
      activity:     'memory pressure green, swap back to almost nothing.',
      storage_used: 'plenty of free space, write speed recovered.',
      visual:       'clean inside, nothing out of place.'
    }[id] || 'normal.';
  }

  function install(shelfIndex, cat) {
    var t = Shop.state.ticket;
    var entry = Shop.state.shelf[shelfIndex];
    if (!entry) return;
    var p = window.TechOpsParts.get(entry.partId);
    var m = J.machine(t);

    if (p.cat !== cat) {
      state.msg = 'A ' + p.cat + ' part does not go in the ' + cat + ' bay.';
      audio('playErrorBuzz');
      return render();
    }
    var bay = bayList(t).filter(function (b) { return b.cat === cat; })[0];
    if (!bay || t.openSteps.indexOf(bay.step) === -1) {
      state.msg = 'That bay is not open yet.';
      audio('playErrorBuzz');
      return render();
    }
    var c = window.TechOpsParts.compat(p, m);
    if (!c.ok) {
      state.msg = 'It will not go in. ' + c.reason;
      audio('playErrorBuzz');
      UI.toast('Does not fit', c.reason, 'bad');
      return render();
    }

    // already have one of this cat? swap it back to the shelf
    var prev = t.installed.filter(function (i) { return i.cat === cat; })[0];
    if (prev) {
      t.installed = t.installed.filter(function (i) { return i !== prev; });
      Shop.state.shelf.push({ partId: prev.partId });
    }

    t.installed.push({ partId: p.id, cat: p.cat });
    t.partsCostFt += entry.paidFt || p.priceFt;
    t.labourHours += 0.4;
    Shop.state.shelf.splice(shelfIndex, 1);
    state.inHand = null;
    audio('playCableSnap');

    // Did this actually address the fault? Say so — the player should not have
    // to guess whether the thing they just paid for was the right thing.
    var f = J.fault(t);
    var addresses = (f.fixedBy.kind === 'part' && f.fixedBy.cat === p.cat)
                 || (f.fixedBy.kind === 'action' && f.fixedBy.needsPartCat === p.cat);
    t.retestNeeded = true;
    state.msg = p.name + ' fitted.' + (c.capped ? ' ' + c.note : '');

    if (addresses) {
      UI.toast('\u2713 ' + p.name + ' fitted', 'That is the component your readings pointed at. Re-run the test that found it to confirm.', 'good');
    } else if (c.capped) {
      UI.toast('Fits, but throttled', c.note, 'bad');
    } else {
      UI.toast(p.name + ' fitted', 'Nothing in your readings pointed at this. It will not hurt the machine — it will hurt the bill.', 'bad');
    }
    Shop.emit('change');
    render();
  }

  /**
   * What to do next — procedure only. It never says what is wrong with the
   * machine; working that out is the game. It only stops a player being
   * stranded because the button they need is in a panel they never looked at.
   */
  function guidance(t, m, flags) {
    if (t.boardDamaged) return null;
    if (!flags.interior && gluedShut(m)) {
      if (m.kind === 'tablet' && !flags.heated) return ['', 'No screws on this one — the glass is glued to the frame. Warm the edges with the <b>heat pad</b> before anything else, or you will crack it.'];
      if (!flags.unglued) return ['', m.kind === 'aio'
        ? 'Run the <b>adhesive cutting wheel</b> round the seam. Set the depth right: too shallow and it stays stuck, too deep and you cut the display cable.'
        : 'Work the <b>thin picks</b> into the warm seam and leave them in as you go.'];
      return ['', 'Adhesive is through — use the <b>suction handles</b> to lift the display straight up, not at an angle.'];
    }
    if (!flags.interior && screwsLeft(t) > 0) {
      var stripped = (t._screws || []).filter(function (x) { return x.stripped && !x.out; }).length;
      if (stripped) return ['warn', 'A rounded screw still holds the case on. Take the <b>screw extractor</b> off the rack and click the red screw.'];
      return ['', 'Match the driver to the head, then click each screw. Hover a screw to read which head it is.'];
    }
    if (!flags.interior) return ['', 'Nothing is holding it shut — click <b>Lift off</b> on the case.'];
    if ((t.snappedTabs || 0) >= 2 && t.openSteps.indexOf('battery') === -1) {
      return ['warn', 'Both adhesive tabs have snapped. That happens \u2014 use <b>Lever the pack out slowly</b> under Bench work. '
        + 'It always works; it just costs you forty minutes.'];
    }
    if (!t.esdOn) return ['warn', 'You are working on an open board without the <b>ESD wrist strap</b>. It costs nothing and it is on the rack.'];
    if (!t.testsRun.length) return ['', 'You have measured nothing yet. <b>Instruments</b> are at the bottom of the procedure panel, and more are in the <b>macOS lab</b> tab.'];
    if (t.batteryDisconnected && !J.canRunSoftware(t).ok
        && !['smart', 'bench', 'activity', 'storage_used'].some(function (i) { return t.testsRun.indexOf(i) !== -1; })) {
      return ['warn', 'The battery is off, so the machine cannot boot — and you have not run a single software test. '
        + 'Reconnect it if you still need the <b>macOS lab</b>. Next job, read the software side before you open anything.'];
    }
    if (Shop.state.onOrder.length) return ['', 'A part is in transit. Go to the <b>Parts market</b> and wait for the delivery — the customer is waiting too.'];
    if (Shop.state.shelf.length) return ['good', 'There is a part on the <b>shelf</b> (bottom right). Open the bay it belongs in, click the part, then click the bay.'];
    if (t.installed.length || t.actionsDone.length) return ['good', 'Work done. When you are satisfied it is actually fixed, go to <b>Handover</b>.'];
    if (t.testsRun.length >= 4 && !t.installed.length && !t.actionsDone.length) {
      return ['warn', 'Four instruments run and nothing decided yet. Bench time is the customer\'s time — testing everything is not thoroughness, it is a day they did not have.'];
    }
    if (t.testsRun.length >= 2) return ['', 'You have readings. Decide what they mean — some faults need a part from the <b>Parts market</b>, and some need nothing but your time (see <b>Bench work</b>).'];
    return ['', 'Keep measuring, or move to the <b>macOS lab</b> for the software side.'];
  }

  // ── render ──────────────────────────────────────────────────────────
  function render() {
    var host = document.getElementById('view-bench');
    var t = Shop.state.ticket;
    if (!t) {
      host.innerHTML = '<div class="view-head"><h2>Workbench</h2><p>Nothing on the mat. Take a job at the counter.</p></div>';
      return;
    }
    if (t.boardDamaged) {
      host.innerHTML = '<div class="view-head"><h2>Workbench</h2></div>'
        + '<div class="note danger" style="max-width:62ch"><b>The logic board is dead.</b><br><br>'
        + 'A metal tool went across the battery connector while the pack was still plugged in. '
        + 'There is nothing left to repair on this machine — the only thing left to do is go to '
        + '<b>Handover</b> and tell the customer the truth.</div>';
      return;
    }

    var m = J.machine(t);
    var screws = screwPlan(m, t);
    var flags = J.flags(t);
    var open = openStepId(m);

    // ── tool rack ──
    var toolIds = ['esd_strap'].concat(m.screws).concat(['extractor', 'spudger', 'tweezers', 'pick', 'air_can', 'alcohol_wipe', 'paste_syringe']);
    if (m.kind === 'phone') toolIds = toolIds.concat(['suction_cup', 'heat_pad']);
    if (m.kind === 'tablet') toolIds = toolIds.concat(['heat_pad', 'thin_picks', 'suction_handles']);
    if (m.kind === 'aio') toolIds = toolIds.concat(['cutting_wheel', 'suction_handles']);
    var rack = '<div class="rack"><h4>Tool rack</h4>';
    toolIds.forEach(function (id) {
      var tl = J.TOOLS[id];
      if (!tl) return;
      var cls = 'tool' + (id === 'esd_strap' ? ' safety' + (t.esdOn ? ' on' : '') : (state.tool === id ? ' active' : ''));
      var iconName = window.TechOpsIcons.TOOL_ICON[id];
      var icon = tl.kind === 'driver'
        ? window.TechOpsScrewHeads.glyph(id)
        : '<span class="ti">' + (iconName ? window.TechOpsIcons.icon(iconName, 17) : tl.icon) + '</span>';
      rack += '<button class="' + cls + '" data-tool="' + id + '">' + icon
        + '<span>' + esc(tl.name) + (id === 'esd_strap' ? (t.esdOn ? ' ✓' : '') : '') + '</span></button>';
    });
    rack += '<div class="rack-hint">' + esc(state.msg || 'Pick up a tool. Look at a screw head before you choose a driver.') + '</div></div>';

    // ── chassis ──
    var chassis = '<div class="chassis ' + (flags.interior ? 'has-board ' : '') + (m.kind === 'phone' ? 'phone ' : m.kind === 'tablet' ? 'tablet ' : m.kind === 'aio' ? 'aio ' : '')
      + (gluedShut(m) ? 'glued ' : '') + (flags.heated ? 'heated ' : '') + (flags.unglued ? 'unglued ' : '')
      + (flags.interior ? 'opened' : '') + '">';
    if (t.priorRepair && !t._priorNoted && flags.interior) {
      t._priorNoted = true;
      UI.toast('Somebody has been in here', {
        stripped: 'One of the case screws is already rounded off. Not your doing — but it is your problem now.',
        wrong_screws: 'The screw heads do not match the case. Whoever closed this up last put the wrong ones back.',
        missing: 'There is a screw missing from the bottom case. It has been open before.'
      }[t.priorRepair] || '', 'bad');
    }

    var glued = gluedShut(m);
    var nLeft = glued ? 0 : screwsLeft(t);
    var nStripped = screws.filter(function (s) { return s.stripped && !s.out; }).length;
    var sealState = glued
      ? (flags.unglued ? 'adhesive cut all the way round — lift it off'
         : flags.heated ? 'adhesive warm and soft — work the seam'
         : 'bonded shut with adhesive · no screws anywhere')
      : (nLeft ? nLeft + ' screw' + (nLeft === 1 ? '' : 's') + ' still holding it shut'
                 + (nStripped ? ' · ' + nStripped + ' rounded' : '')
         : 'nothing holding it — lift it off');
    chassis += '<div class="chassis-label">' + m.icon + '<br>' + esc(m.name)
      + '<br><span style="font-size:10px">' + esc(sealState) + '</span>'
      + (closedNext ? '<br><span class="chassis-next">click to ' + esc(J.STEPS[closedNext].label.toLowerCase()) + '</span>' : '')
      + '</div>';
    if (closedNext) chassis = chassis.replace('<div class="chassis ', '<div data-devstep="' + closedNext + '" class="chassis clickable ');
    screws.forEach(function (s) {
      // Once the cover is off, the screws live in the tray — do not draw them over the bays.
      if (flags.interior && !s.stripped) return;
      var style = Object.keys(s.pos).map(function (k) { return k + ':' + s.pos[k]; }).join(';');
      var fx = (Math.random() * 40 + 140) + 'px';
      chassis += '<div class="screw' + (s.out ? ' out' : '') + (s.stripped ? ' stripped' : '')
        + (s.skated && !s.stripped ? ' skated' : '') + '" data-screw="' + s.i + '" '
        + 'data-type="' + s.type + '" title="' + esc(J.TOOLS[s.type].name + ' head') + '" '
        + 'style="' + style + ';--fx:' + fx + ';--fy:-90px">'
        + window.TechOpsScrewHeads.svg(s.type, s.stripped ? 'stripped' : 'normal')
        + '<span class="screw-tag">' + esc(s.stripped ? 'rounded — needs extractor' : J.TOOLS[s.type].name) + '</span></div>';
    });
    chassis += '<div class="tray"><span class="tray-label">Parts tray</span>';
    screws.filter(function (s) { return s.out; }).forEach(function (s) {
      chassis += '<span class="tray-screw" title="' + esc(J.TOOLS[s.type].name) + '">'
        + window.TechOpsScrewHeads.svg(s.type, s.stripped ? 'stripped' : 'normal') + '</span>';
    });
    chassis += '</div>';

    // The real internal layout, revealed as the teardown exposes it.
    if (flags.interior) {
      // With the cover off you can SEE everything — the teardown controls what you
      // have got at, not what is visible. Hiding the fan until you unscrew it was
      // both wrong and made the board look empty.
      var openRegions = { allOpen: true }, doneRegions = {}, faultyRegion = null;
      bayList(t).forEach(function (b) {
        var stx = bayState(t, b.cat);
        if (stx.filled) doneRegions[b.step] = true;
        if (stx.fault) faultyRegion = b.step;
      });
      t.openSteps.forEach(function (sid) { doneRegions[sid] = true; });

      var nextTarget = null;
      var seqAll = m.teardown.slice();
      for (var q = 0; q < seqAll.length; q++) {
        if (t.openSteps.indexOf(seqAll[q]) === -1 && J.canStep(t, seqAll[q]).ok) { nextTarget = seqAll[q]; break; }
      }

      var L = window.TechOpsBoards.forMachine(m);
      var mapChip = function (regionId) { return chipForRegion(m, regionId); };

      var boardDone = {}, boardTarget = null, boardFaulty = null;
      Object.keys(doneRegions).forEach(function (r) { var c = mapChip(r); if (c) boardDone[c] = true; });
      if (nextTarget) boardTarget = mapChip(nextTarget);
      if (faultyRegion) boardFaulty = mapChip(faultyRegion);

      chassis += '<div class="board-stage">'
        + window.TechOpsBoard.renderReal(m, {
            done: boardDone, target: state.inHand !== null ? null : boardTarget,
            faulty: boardFaulty, inspect: state.inspect
          })
        + '</div>'
        + '<div class="board-tools">'
        + '<button class="btn btn-sm' + (state.inspect ? ' btn-go' : '') + '" data-inspect>'
        + (state.inspect ? '\u2713 Labels on' : 'Label the components') + '</button>'
        + '<span class="board-note">' + esc(L.note) + '</span>'
        + '</div>';
    }

    // The next step you could actually take on a closed machine — so clicking
    // the device does the thing, instead of hunting for its button.
    var closedNext = null;
    if (!flags.interior) {
      (m.teardown || []).forEach(function (sid) {
        if (closedNext) return;
        if (t.openSteps.indexOf(sid) !== -1) return;
        if (sid === open) return;
        if (J.canStep(t, sid).ok) closedNext = sid;
      });
    }

    if (!flags.interior) {
      var openDef = J.STEPS[open];
      var locked = glued ? !flags.unglued : nLeft > 0;
      chassis += '<button class="lift-btn' + (locked ? ' locked' : '') + '" data-step="' + open + '">'
        + (locked
            ? (glued ? '🔒 ' + (m.kind === 'aio'
                                  ? 'still bonded — cut the seam'
                                  : flags.heated ? 'seam not cut through yet' : 'still bonded — heat it first')
                     : '🔒 ' + nLeft + ' screw' + (nLeft === 1 ? '' : 's') + ' still in')
            : '⬆️ ' + esc(openDef.label.replace(/^Remove |^Heat and lift the /, 'Lift off the ').replace('screws', 'cover')))
        + '</button>';
    }

    if (m.battery || m.kind === 'desktop') {
      chassis += '<div class="connector' + (t.batteryDisconnected || flags.battery_off ? ' off' : '') + '"><span class="led"></span>'
        + (t.batteryDisconnected || flags.battery_off ? 'board isolated' : 'BOARD LIVE') + '</div>';
    }
    chassis += '</div>';

    // ── procedure ──
    var proc = '<div class="procedure"><h4>Procedure</h4>';
    var seq = m.teardown.slice();
    if (m.kind === 'desktop' && seq.indexOf('psu_switch') === -1) seq.unshift('psu_switch');
    if (m.kind !== 'desktop' && seq.indexOf('battery_connector') === -1) seq.splice(1, 0, 'battery_connector');
    seq.forEach(function (sid, i) {
      var def = J.STEPS[sid];
      if (!def) return;
      var done = t.openSteps.indexOf(sid) !== -1 || (sid === 'battery_connector' && t.batteryDisconnected);
      var can = J.canStep(t, sid);
      var gate = def.safetyGate;
      var needsDriver = def.tool === 'driver' && !done
        && !(sid === openStepId(m) && screwsLeft(t) === 0);
      var wrongTool = needsDriver && (!state.tool || J.TOOLS[state.tool].kind !== 'driver');
      proc += '<button class="step' + (done ? ' done' : '') + (gate ? ' gate' : '') + '" data-step="' + sid + '"'
        + (done ? ' disabled' : '') + ' title="' + esc(def.why || (needsDriver ? 'Needs a screwdriver in hand.' : '')) + '">'
        + '<span class="sn">' + (done ? '✓' : i + 1) + '</span><span>' + esc(def.label)
        + (gate && !done ? '<br><span style="font-size:10.5px;color:var(--ink-3)">safety step</span>' : '')
        + (wrongTool ? '<br><span style="font-size:10.5px;color:var(--amber)">🪛 needs a driver in hand</span>' : '')
        + (def.tool && def.tool !== 'driver' && !done && state.tool !== def.tool
            ? '<br><span style="font-size:10.5px;color:var(--amber)">' + J.TOOLS[def.tool].icon + ' needs the ' + esc(J.TOOLS[def.tool].name) + '</span>' : '')
        + '</span></button>';
    });

    proc += '<h4 style="margin-top:14px">Bench work</h4>';
    Object.keys(J.ACTIONS).forEach(function (aid) {
      var a = J.ACTIONS[aid];
      if (a.software) return;
      if (aid === 'reconnect_battery' && !(t.batteryDisconnected && m.battery)) return;
      if (aid === 'lever_battery' && !((t.snappedTabs || 0) >= 2 && t.openSteps.indexOf('battery') === -1)) return;
      if (a.needsStep && m.teardown.indexOf(a.needsStep) === -1) return;
      if (aid === 'clean_port' && ['port_lint'].indexOf(J.fault(t).id) === -1 && m.kind !== 'phone' && m.teardown.indexOf('charge_port') === -1) {
        // still offer it — cleaning a port is never wrong, just sometimes pointless
      }
      var done = !a.repeatable && t.actionsDone.indexOf(aid) !== -1;
      var want = [];
      if (!done) {
        if (a.tool && state.tool !== a.tool) want.push(J.TOOLS[a.tool].icon + ' needs the ' + J.TOOLS[a.tool].name);
        if (a.needsStep && t.openSteps.indexOf(a.needsStep) === -1) want.push('🔒 ' + J.STEPS[a.needsStep].label.toLowerCase() + ' first');
        if (a.needsAction && t.actionsDone.indexOf(a.needsAction) === -1) want.push('🔒 ' + J.ACTIONS[a.needsAction].label.toLowerCase() + ' first');
        if (a.needsPartCat && !t.installed.some(function (i) { return i.cat === a.needsPartCat; })
            && !Shop.state.shelf.some(function (e) { var p = window.TechOpsParts.get(e.partId); return p && p.cat === a.needsPartCat; })) {
          want.push('📦 buy ' + a.needsPartCat + ' compound first');
        }
      }
      proc += '<button class="step' + (done ? ' done' : '') + '" data-action="' + aid + '"' + (done ? ' disabled' : '') + '>'
        + '<span class="sn">' + (done ? '✓' : a.icon) + '</span><span>' + esc(a.label)
        + (want.length ? '<br><span style="font-size:10.5px;color:var(--amber)">' + esc(want[0]) + '</span>' : '')
        + '</span></button>';
    });

    proc += '<h4 style="margin-top:14px">Instruments <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-3)">· each one costs bench time</span></h4><div class="instruments">';
    Object.keys(UI.INSTRUMENTS).forEach(function (iid) {
      var inst = UI.INSTRUMENTS[iid];
      if (inst.where !== 'bench') return;
      if (iid === 'battery' && !m.battery) return;
      var ran = t.testsRun.indexOf(iid) !== -1 && !(t.retestNeeded && !(t.retests || {})[iid]);
      var isRetest = t.testsRun.indexOf(iid) !== -1 && t.retestNeeded && !(t.retests || {})[iid];
      var wouldTip = !ran && J.turnaroundDays({ daysWaited: t.daysWaited, labourHours: t.labourHours + inst.hours }) > J.turnaroundDays(t);
      proc += '<button class="instr' + (ran ? ' ran' : '') + (wouldTip ? ' tips-day' : '') + '" data-instr="' + iid + '"' + (ran ? ' disabled' : '')
        + ' title="' + esc(inst.blurb + (wouldTip ? '  ⚠ This one pushes the job into another day.' : '')) + '">'
        + inst.icon + ' ' + esc(inst.name) + (isRetest ? ' <span class="retest">re-test</span>' : '')
        + ' <span class="cost">' + inst.hours + 'h</span></button>';
    });
    proc += '</div></div>';

    // ── shelf ──
    var shelf = '<div class="procedure shelf-col"><h4>Parts shelf</h4>';
    if (!Shop.state.shelf.length && !Shop.state.onOrder.length) {
      shelf += '<div style="font-size:11.5px;color:var(--ink-3);line-height:1.55">Empty. Diagnose first, then buy only what the measurements justify.</div>';
    }
    Shop.state.shelf.forEach(function (entry, i) {
      var p = window.TechOpsParts.get(entry.partId);
      var c = window.TechOpsParts.compat(p, m);
      shelf += '<div class="shelf-item' + (state.inHand === i ? ' dragging' : '') + '" draggable="true" data-shelf="' + i + '" data-cat="' + p.cat + '">'
        + '<div class="si-name">' + esc(p.name) + '</div>'
        + '<div class="si-meta">' + p.cat + ' · ' + window.techOpsFmt(entry.paidFt || p.priceFt)
        + (c.ok ? (c.capped ? ' · ⚠ throttled' : '') : ' · ✖ will not fit') + '</div></div>';
    });
    Shop.state.onOrder.forEach(function (o) {
      var p = window.TechOpsParts.get(o.partId);
      shelf += '<div class="shelf-item transit"><div class="si-name">' + esc(p.name) + '</div>'
        + '<div class="si-meta">in transit · ' + o.daysLeft + ' day' + (o.daysLeft === 1 ? '' : 's') + ' out</div></div>';
    });
    shelf += '<div style="margin-top:10px;font-size:11px;color:var(--ink-3);line-height:1.5">'
      + (state.inHand !== null ? 'Now click the bay it goes into.' : 'Click a part to pick it up, then click its bay.') + '</div></div>';

    var turn = J.turnaroundDays(t);
    var late = turn > t.urgencyDays;
    var hoursToday = (t.labourHours % J.HOURS_PER_DAY).toFixed(1);

    var caption = flags.interior
      ? (state.inHand !== null
          ? 'Click the part of the board it belongs in.'
          : 'Click a component to work on it. Amber outline is what comes next.')
      : '';

    host.innerHTML = '<div class="view-head"><h2>Workbench</h2>'
      + '<p>'
      + '<b>' + t.labourHours.toFixed(1) + ' h</b> on the bench · a working day is ' + J.HOURS_PER_DAY + ' h · '
      + '<span style="color:' + (late ? 'var(--red)' : turn === t.urgencyDays ? 'var(--amber)' : 'var(--green)') + '">'
      + 'day ' + Math.max(1, turn) + ' of the ' + t.urgencyDays + ' they can wait</span> · '
      + (t.esdOn ? '<span style="color:var(--green)">grounded</span>' : '<span style="color:var(--red)">not grounded</span>') + ' · '
      + (t.batteryDisconnected || (m.kind === 'desktop' && t.openSteps.indexOf('psu_switch') !== -1)
          ? '<span style="color:var(--green)">board isolated</span>'
          : '<span style="color:var(--red)">board live</span>') + '</p></div>'
      + (function () {
          var g = guidance(t, m, flags);
          return g ? '<div class="next-step ' + g[0] + '"><span class="ns-i">→</span><span>' + g[1] + '</span></div>' : '';
        })()
      + '<div class="bench">' + rack
      + '<div class="mat">' + chassis + (caption ? '<div class="board-caption">' + esc(caption) + '</div>' : '') + '</div>'
      + '<div class="bench-right">' + proc + shelf + '</div></div>';

    bind(host);
  }

  function bind(host) {
    host.querySelectorAll('[data-tool]').forEach(function (b) {
      b.addEventListener('click', function () { selectTool(b.getAttribute('data-tool')); });
    });
    host.querySelectorAll('[data-screw]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        turnScrew(screwPlan(J.machine(t), t)[+b.getAttribute('data-screw')]);
      });
    });
    host.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () { doStep(b.getAttribute('data-step')); });
    });
    host.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('click', function () { doAction(b.getAttribute('data-action')); });
    });
    host.querySelectorAll('[data-instr]').forEach(function (b) {
      b.addEventListener('click', function () { runInstrument(b.getAttribute('data-instr')); });
    });
    host.querySelectorAll('[data-shelf]').forEach(function (b) {
      var idx = +b.getAttribute('data-shelf');
      b.addEventListener('click', function () {
        state.inHand = state.inHand === idx ? null : idx;
        state.msg = state.inHand === null ? '' : 'In hand. Click the bay it belongs in.';
        audio('playKeyPop');
        render();
      });
      b.addEventListener('dragstart', function (e) {
        state.inHand = idx;
        e.dataTransfer.setData('text/plain', String(idx));
      });
    });
    host.querySelectorAll('[data-devstep]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-screw],.lift-btn,[data-region]')) return;
        doStep(el.getAttribute('data-devstep'));
      });
    });

    var insp = host.querySelector('[data-inspect]');
    if (insp) insp.addEventListener('click', function () { state.inspect = !state.inspect; render(); });

    host.querySelectorAll('[data-region]').forEach(function (g) {
      var chipId = g.getAttribute('data-region');
      var mm = J.machine(Shop.state.ticket);
      // The board speaks in chip ids; the game speaks in region ids.
      var rid = J.STEPS[chipId] ? chipId : regionForChip(mm, chipId, Shop.state.ticket);
      var bay = rid ? bayList(Shop.state.ticket).filter(function (b) { return b.step === rid; })[0] : null;

      g.addEventListener('click', function () {
        if (state.inHand !== null && bay) return install(state.inHand, bay.cat);
        if (rid && J.STEPS[rid] && Shop.state.ticket.openSteps.indexOf(rid) === -1) return doStep(rid);
        if (bay) {
          state.msg = 'Nothing in hand for the ' + bay.label.toLowerCase() + '. Pick a part off the shelf, then click here.';
          audio('playErrorBuzz');
          return render();
        }
        // Not a working area — say what it is rather than doing nothing.
        var c = window.TechOpsBoards.forMachine(mm).chips.filter(function (x) { return x.id === chipId; })[0];
        var R = window.TechOpsChipRoles;
        if (c) {
          state.msg = c.label + ' — ' + ((R.ROLES[c.role] || {}).what || 'part of the board.')
            + ' Nothing to do with it on this job.';
          audio('playKeyPop');
          return render();
        }
      });
      g.addEventListener('dragover', function (e) { if (bay) { e.preventDefault(); g.classList.add('drop-hot'); } });
      g.addEventListener('dragleave', function () { g.classList.remove('drop-hot'); });
      g.addEventListener('drop', function (e) {
        if (!bay) return;
        e.preventDefault(); g.classList.remove('drop-hot');
        install(+e.dataTransfer.getData('text/plain'), bay.cat);
      });
    });

    host.querySelectorAll('[data-bay]').forEach(function (b) {
      var cat = b.getAttribute('data-bay');
      b.addEventListener('click', function () {
        if (state.inHand === null) {
          state.msg = 'Pick a part off the shelf first.';
          audio('playErrorBuzz');
          UI.toast('Nothing in hand', 'Click a part on the shelf to pick it up, then click the bay.', 'bad');
          return render();
        }
        install(state.inHand, cat);
      });
      b.addEventListener('dragover', function (e) { e.preventDefault(); b.classList.add('drop-hot'); });
      b.addEventListener('dragleave', function () { b.classList.remove('drop-hot'); });
      b.addEventListener('drop', function (e) {
        e.preventDefault(); b.classList.remove('drop-hot');
        install(+e.dataTransfer.getData('text/plain'), cat);
      });
    });
  }

  window.TechOpsBench = { render: render, reset: function () { state = { tool: null, inHand: null, msg: '' }; } };
})(window);
