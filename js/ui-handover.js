/**
 * TechOps Budapest — handover, pricing and the debrief.
 *
 * The review is not a score for picking the expensive part. It is six
 * separate judgements, and the debrief shows all six so a student can
 * see exactly which one they lost.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var fmt  = window.techOpsFmt;
  var esc  = function (s) { return UI.esc(s); };

  var LABOUR_RATE = 5000;   // Ft per bench hour
  var price = null;

  var AXIS_LABEL = {
    fit:        'Right part for this person',
    budget:     'Respected their money',
    speed:      'Turnaround against their deadline',
    durability: 'Will it still be working next year',
    safety:     'Safe, tidy workmanship'
  };

  function suggested(t) {
    return Math.round((t.partsCostFt + t.labourHours * LABOUR_RATE) / 500) * 500;
  }

  function handBack(t, p) {
    var res = window.TechOpsScore.grade(Shop, t, p);

    if (!window.TechOpsScore.willPay(t, p, res.overall)) {
      if (window.sekAudio) window.sekAudio.playErrorBuzz();
      UI.modal('<div class="modal-head"><h3>“I cannot pay that.”</h3></div><div class="modal-body">'
        + '<p>' + esc(J.customer(t).name) + ' has ' + fmt(t.budgetFt) + '. You are asking ' + fmt(p) + '.</p>'
        + '<div class="note warn">' + esc(window.TechOpsScore.payRefusal(t, p, res.overall))
        + ' You can drop the price and take the hit, or you can look again at why the job is worth less than you are asking.</div>'
        + '</div><div class="modal-foot"><button class="btn btn-primary" data-close>Re-price it</button></div>');
      return;
    }

    Shop.earn(p, 'Job ' + t.id + ' · ' + J.customer(t).name);
    // Counted here, once, now that they have actually paid — not inside
    // grade(), which runs for every price tried.
    if (res.honestNoPart) {
      Shop.state.honestRefusals = (Shop.state.honestRefusals || 0) + 1;
      Shop.award('honest_tech');
    }
    Shop.recordAxes(res.axes);
    Shop.state.jobsDone++;
    Shop.state.starsTotal += res.stars;
    if (res.stars <= 2) Shop.state.jobsBotched++;
    Shop.adjustRep(res.repDelta);
    Shop.state.history.unshift({
      id: t.id, day: Shop.state.day, customer: J.customer(t).name,
      machine: J.machine(t).name, fault: J.fault(t).title, faultId: t.faultId,
      stars: res.stars, paidFt: p, review: res.reviewBody,
      resolved: res.resolved, soldUnneeded: !!(J.fault(t).noPartNeeded && t.installed.length)
    });

    if (res.comeback) {
      Shop.state.pendingComebacks = Shop.state.pendingComebacks || [];
      Shop.state.pendingComebacks.push({
        dueDay: Shop.state.day + res.comeback.inDays,
        customerId: t.customerId, machineId: t.machineId,
        faultId: comebackFault(res.comeback.cat, t),
        originJobId: t.id, reason: res.comeback.reason || null
      });
      Shop.state.comebacks++;
    }

    // ── goals ── counted here, once the money has actually changed hands.
    var G = Shop.state.goalStats = Shop.state.goalStats || {};
    var promised = t.agreedDays && t.agreedDays > t.urgencyDays ? t.agreedDays : t.urgencyDays;
    if (J.turnaroundDays(t) <= promised) G.onTime = (G.onTime || 0) + 1;
    if (t.esdOn && t.openSteps.length) G.grounded = (G.grounded || 0) + 1;

    Shop.award('first_job');
    if (res.resolved && (t.asked || []).length >= 3 && t.testsRun.length <= 2) Shop.award('asked_first');
    if (G.grounded >= 3) Shop.award('grounded');
    if (G.onTime >= 3) Shop.award('on_time');
    if (res.resolved && t.testsRun.indexOf('meter') !== -1
        && window.TechOpsIntake && window.TechOpsIntake.revealedBy(t.faultId).indexOf('meter') !== -1) {
      Shop.award('measured');
    }
    if (res.stars === 5) Shop.award('five_star');
    if (Shop.state.jobsDone >= 5) Shop.award('five_jobs');
    if (Shop.state.honestRefusals >= 2) Shop.award('no_upsell');
    if (Shop.state.reputation >= 75) Shop.award('good_name');

    Shop.state.ticket = null;
    Shop.advanceDays(1);
    // What a bad name actually costs: quiet days before the next group.
    var ff = J.footfall(Shop);
    if (ff.quietDays > 1) {
      Shop.advanceDays(ff.quietDays - 1);
      Shop.state.queue = (Shop.state.queue || []).filter(function (q) { return q.warranty; });
      UI.toast('A quiet ' + (ff.quietDays - 1 === 1 ? 'day' : (ff.quietDays - 1) + ' days'),
        'Nobody new comes in for a while. People read the reviews before they choose a shop.', 'bad');
    }
    price = null;
    if (window.sekAudio) window.sekAudio[res.stars >= 4 ? 'playSuccessChime' : 'playErrorBuzz']();
    Shop.emit('change');
    UI.refresh();
    showDebrief(t, res, p);
  }

  function comebackFault(cat, t) {
    var map = { storage: ['dying_hdd'], ram: ['bad_ram_stick'], battery: ['battery_swollen'],
                screen: ['cracked_screen'], fan: ['fan_seized'], thermal: ['thermal_paste_dead', 'ps5_liquid_metal'],
                flex: ['port_lint'], caps: ['blown_caps', 'ps5_rail_short'] };
    var m = J.machine(t);
    var hit = (map[cat] || []).filter(function (id) {
      var f = window.TechOpsFaults.get(id);
      return f && f.appliesTo.indexOf(m.id) !== -1;
    })[0];
    if (hit) return hit;
    var candidates = window.TechOpsFaults.forMachine(m);
    return (candidates && candidates.length) ? candidates[0].id : 'thermal_paste_dead';
  }

  function showDebrief(t, res, p) {
    var c = J.customer(t), f = J.fault(t);
    var bars = Object.keys(AXIS_LABEL).map(function (k) {
      var v = Math.round(res.axes[k]);
      var col = v >= 80 ? 'var(--green)' : v >= 55 ? 'var(--amber)' : 'var(--red)';
      return '<div class="axis"><div class="axis-top"><span class="n">' + AXIS_LABEL[k] + '</span><span class="v" style="color:' + col + '">' + v + '</span></div>'
        + '<div class="axis-track"><div class="axis-fill" style="width:' + v + '%;background:' + col + '"></div></div></div>';
    }).join('');

    var findings = res.findings.map(function (fd) {
      return '<div class="note ' + (fd.good ? 'good' : 'warn') + '" style="margin-bottom:7px">' + esc(fd.text) + '</div>';
    }).join('');

    var lessons = res.lessons.length
      ? '<div class="card-head" style="margin-top:18px">What this job was teaching</div>'
        + res.lessons.map(function (l) { return '<div class="note teach" style="margin-bottom:7px">' + esc(l) + '</div>'; }).join('')
      : '';

    UI.modal('<div class="modal-head">'
      + '<div style="display:flex;align-items:center;gap:13px">'
      + '<div class="cust-avatar" style="width:52px;height:52px">' + UI.face(c, 52) + '</div>'
      + '<div><h3>' + esc(c.name) + ' · job ' + esc(t.id) + '</h3>'
      + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">' + esc(f.title) + ' · ' + esc(J.machine(t).name) + '</div></div>'
      + '<div style="margin-left:auto;text-align:right">' + UI.stars(res.stars)
      + '<div style="font-size:calc(12px * var(--a11y-scale, 1));color:var(--ink-3)">' + fmt(p) + ' paid</div></div></div></div>'
      + '<div class="modal-body">'
      + '<div class="quote-bubble" style="font-style:normal;font-size:calc(13.5px * var(--a11y-scale, 1));margin-bottom:18px">' + esc(res.reviewBody) + '</div>'
      + bars
      + (res.resolved ? '' : '<div class="note danger" style="margin-top:12px"><b>The machine is not fixed.</b> ' + esc(f.explain) + '</div>')
      + '<div class="card-head" style="margin-top:18px">Line by line</div>' + findings
      + lessons
      + (res.comeback ? '<div class="note danger" style="margin-top:14px"><b>Expect this one back.</b> '
          + esc(res.comeback.reason || 'The part you fitted has a real failure rate and no warranty behind it. If it dies, the rework is on you.')
          + '</div>' : '')
      + '</div><div class="modal-foot"><button class="btn btn-primary" data-close>Next customer →</button></div>',
      { sticky: true, onClose: function () { window.TechOpsApp.go('counter'); } });
  }

  /**
   * Cheapest part that actually fixes this fault and fits this machine.
   * When that is more than the customer has, the job cannot be done for their
   * money — and saying so is a legitimate, well-scored outcome rather than a
   * dead end the student has to bluff their way out of.
   */
  function cheapestFix(t) {
    var f = J.fault(t), m = J.machine(t);
    var cat = f.fixedBy.kind === 'part' ? f.fixedBy.cat : f.fixedBy.needsPartCat;
    if (!cat) return 0;                                   // labour-only fix
    var options = window.TechOpsParts.byCat(cat).filter(function (p) {
      return window.TechOpsParts.compat(p, m).ok;
    });
    if (!options.length) return Infinity;
    return Math.min.apply(null, options.map(function (p) { return p.priceFt; }));
  }

  function declineHonestly(t, feeFt) {
    var c = J.customer(t);
    Shop.earn(feeFt, 'Diagnostic fee · ' + c.name);
    Shop.state.jobsDone++;
    Shop.state.starsTotal += 4;
    Shop.recordAxes({ fit: 100, budget: 100, speed: 100, durability: 100, safety: 100 });
    Shop.adjustRep(3);
    Shop.state.honestRefusals = (Shop.state.honestRefusals || 0) + 1;
    Shop.award('first_job');
    Shop.award('said_no');
    if (Shop.state.honestRefusals >= 2) Shop.award('no_upsell');
    if (Shop.state.reputation >= 75) Shop.award('good_name');
    Shop.state.history.unshift({
      id: t.id, day: Shop.state.day, customer: c.name, machine: J.machine(t).name,
      fault: J.fault(t).title, faultId: t.faultId, stars: 4, paidFt: feeFt,
      resolved: false, declined: true,
      review: 'They told me straight that it would cost more than I had, and what it would take. They charged me for the look and nothing else. I would go back.'
    });
    Shop.state.ticket = null;
    Shop.advanceDays(1);
    price = null;
    if (window.sekAudio) window.sekAudio.playSuccessChime();
    Shop.emit('change');
    UI.refresh();

    UI.modal('<div class="modal-head"><h3>You told them the truth</h3></div><div class="modal-body">'
      + '<div class="quote-bubble" style="font-style:normal">"Thanks for being straight with me. I would rather know now than after I had paid you."</div>'
      + '<div class="note good" style="margin-top:14px">You charged <b>' + fmt(feeFt) + '</b> for the diagnosis and nothing else. '
      + 'You did not fix the machine, and that is fine \u2014 the cheapest honest repair costs more than they have, and pretending otherwise '
      + 'would have meant a bill they could not pay or a bodge that fails in a month.</div>'
      + '<div class="note teach" style="margin-top:10px">Knowing when a repair is not worth it is part of the job. '
      + 'A shop that only ever says yes is not being kind.</div>'
      + '</div><div class="modal-foot"><button class="btn btn-primary" data-close>Next customer</button></div>',
      { sticky: true, onClose: function () { window.TechOpsApp.go('counter'); } });
  }

  function render() {
    var host = document.getElementById('view-handover');
    var t = Shop.state.ticket;
    if (!t) {
      host.innerHTML = '<div class="view-head"><h2>Handover</h2><p>Nothing to hand back.</p></div>';
      return;
    }
    var c = J.customer(t), m = J.machine(t);
    if (price === null) price = suggested(t);

    var admin = (Shop.state.perks || {}).adminHours || 0;
    if (admin && !t._adminApplied) { t._adminApplied = true; t.labourHours = Math.max(0.2, t.labourHours - admin); }
    var labourFt = Math.round(t.labourHours * LABOUR_RATE);
    var min = t.partsCostFt;
    var max = Math.max(min + labourFt * 2, Math.round((min + labourFt) * 2.2));

    var work = '';
    t.installed.forEach(function (i) {
      var p = window.TechOpsParts.get(i.partId);
      work += '<div class="disk-row"><span class="k">' + esc(p.cat) + '</span><span>' + esc(p.name) + '</span><span class="v">' + fmt(p.priceFt) + '</span></div>';
    });
    t.actionsDone.forEach(function (a) {
      work += '<div class="disk-row ok"><span class="k">bench work</span><span>' + esc(J.ACTIONS[a].label) + '</span><span class="v">—</span></div>';
    });
    if (!work) work = '<div class="note warn">You have not done anything to this machine yet.</div>';

    var warnings = '';
    if (!t.testsRun.length) warnings += '<div class="note danger">You have not measured anything. You are about to hand back a machine on a guess.</div>';
    if (t.boardDamaged) warnings += '<div class="note danger"><b>The board is dead.</b> Whatever you charge, this goes badly. Charging nothing is the only defensible move.</div>';
    // Did anyone check it worked? Saying "not re-tested" must not leak whether
    // it would have passed — only that nobody looked.
    if (t.fixConfirmed) {
      warnings += '<div class="note good"><b>\u2713 Fix confirmed on the bench.</b> The same test that found the fault reads normal now. You can say so to their face.</div>';
    } else if ((t.installed.length || t.actionsDone.length) && t.testsRun.length) {
      warnings += '<div class="note teach"><b>Not re-tested.</b> You think it is fixed. Re-run the test that found the fault on the bench \u2014 otherwise the customer is the one who finds out.</div>';
    }
    if (t.installed.length && !t.esdOn) warnings += '<div class="note warn">Fitted without the ESD strap. It will probably be fine. Probably.</div>';

    // Is this job even doable for what they have?
    var need = cheapestFix(t);
    var alreadyDone = t.installed.length || t.actionsDone.length;
    var unaffordable = need !== 0 && isFinite(need)
      && (need + Math.round(t.labourHours * LABOUR_RATE)) > t.budgetFt && !alreadyDone;
    var impossible = need === Infinity && !alreadyDone;

    host.innerHTML = '<div class="view-head"><h2>Handover</h2>'
      + '<p>' + esc(c.name) + ' is at the counter. Budget ' + fmt(t.budgetFt) + ', wanted it in ' + t.urgencyDays
      + ' day' + (t.urgencyDays === 1 ? '' : 's') + ', actually waited <b>' + J.turnaroundDays(t) + '</b> — '
      + t.daysWaited + ' on deliveries and ' + J.benchDays(t) + ' of your own bench time ('
      + t.labourHours.toFixed(1) + ' h).</p></div>'
      + '<div style="display:grid;grid-template-columns:1fr 360px;gap:18px;max-width:1080px;align-items:start">'
      + '<div class="card"><div class="card-head">Work done</div><div class="disk-rows">' + work + '</div>'
      + '<div style="display:flex;gap:18px;margin-top:14px;font-size:calc(13px * var(--a11y-scale, 1))">'
      + '<span>Parts <b>' + fmt(t.partsCostFt) + '</b></span>'
      + '<span>Labour <b>' + t.labourHours.toFixed(1) + ' h</b> → ' + fmt(labourFt) + '</span>'
      + '<span style="margin-left:auto">Your cost <b>' + fmt(t.partsCostFt) + '</b></span></div>'
      + (warnings ? '<div style="margin-top:14px">' + warnings + '</div>' : '')
      + ((unaffordable || impossible)
          ? '<div class="note warn" style="margin-top:14px"><b>This cannot be done for what they have.</b><br>'
            + (impossible
                ? 'There is no part in the catalogue that fits this machine and fixes this fault.'
                : 'The cheapest part that actually fixes it is <b>' + fmt(need) + '</b>, and with your time that is already over their '
                  + fmt(t.budgetFt) + ' budget.')
            + '<br><br>You can still fit something and hand them a bill they cannot pay \u2014 or you can tell them straight, '
            + 'charge for the diagnosis, and let them decide. The second one is a real answer.</div>'
            + '<button class="btn btn-go" style="margin-top:12px" id="btn-decline">Tell them it is not worth it \u00b7 charge '
            + fmt(Math.min(t.budgetFt, Math.max(2500, Math.round(t.labourHours * LABOUR_RATE * 0.5 / 500) * 500))) + ' for the diagnosis</button>'
          : '')
      + '</div>'
      + '<div class="card"><div class="card-head">The bill</div>'
      + '<div style="font-size:calc(30px * var(--a11y-scale, 1));font-weight:750;font-variant-numeric:tabular-nums;margin-bottom:4px" id="price-out">' + fmt(price) + '</div>'
      + '<div style="font-size:calc(12px * var(--a11y-scale, 1));color:' + (price > t.budgetFt ? 'var(--red)' : 'var(--green)') + ';margin-bottom:12px" id="price-note">'
      + (price > t.budgetFt ? fmt(price - t.budgetFt) + ' over their budget' : fmt(t.budgetFt - price) + ' inside their budget') + '</div>'
      + '<input type="range" id="price-slider" min="' + min + '" max="' + max + '" step="500" value="' + price + '" style="width:100%">'
      + '<div style="display:flex;justify-content:space-between;font-size:calc(10.5px * var(--a11y-scale, 1));color:var(--ink-3);font-family:var(--mono);margin-top:3px">'
      + '<span>' + fmt(min) + ' (break even)</span><span>' + fmt(max) + '</span></div>'
      + '<div class="note" style="margin-top:14px;font-size:calc(12.3px * var(--a11y-scale, 1))">Your margin is ' + fmt(price - t.partsCostFt)
      + ' for ' + t.labourHours.toFixed(1) + ' hours of bench time. Charging nothing is not generosity if you then cannot buy parts for the next job.</div>'
      + '<button class="btn btn-primary" style="width:100%;margin-top:14px;justify-content:center" id="btn-hand">Hand it back</button>'
      + '</div></div>';

    var sl = document.getElementById('price-slider');
    sl.addEventListener('input', function () {
      price = +sl.value;
      document.getElementById('price-out').textContent = fmt(price);
      var n = document.getElementById('price-note');
      n.textContent = price > t.budgetFt ? fmt(price - t.budgetFt) + ' over their budget' : fmt(t.budgetFt - price) + ' inside their budget';
      n.style.color = price > t.budgetFt ? 'var(--red)' : 'var(--green)';
    });
    document.getElementById('btn-hand').addEventListener('click', function () { handBack(t, price); });
    var dec = document.getElementById('btn-decline');
    if (dec) dec.addEventListener('click', function () {
      declineHonestly(t, Math.min(t.budgetFt, Math.max(2500, Math.round(t.labourHours * LABOUR_RATE * 0.5 / 500) * 500)));
    });
  }

  window.TechOpsHandover = { render: render, reset: function () { price = null; } };
})(window);
