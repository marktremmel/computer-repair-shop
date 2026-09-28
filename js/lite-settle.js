/**
 * TechOps Budapest — Lite: closing a job and paying for it.
 *
 * This mirrors `handBack()` in ui-bench's sibling `ui-handover.js`, which is
 * still the canonical copy: same grade call, same axes, same reputation
 * curve, same history entry, so a shift played in Lite and a shift played in
 * the classic shop produce the same teacher report and the same hand-in code.
 *
 * It is written out again here rather than shared because the classic
 * handover keeps its bookkeeping wrapped around its own screens, and pulling
 * it apart would mean editing the version that is live in front of a class.
 * When Lite has been through a lesson or two, the right move is to lift this
 * into a sim module and have both call it. Until then: if you change one,
 * change the other, and `tools/lite-check.js` will tell you if they drift.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var J    = window.TechOpsJobs;
  var LABOUR_RATE = 5000;                 // Ft per bench hour — matches ui-handover.js:17

  /** Parts at cost plus your time. The honest number, before anybody decides. */
  function fair(t) {
    return Math.round((t.partsCostFt + t.labourHours * LABOUR_RATE) / 500) * 500;
  }

  function comebackFault(cat, t) {
    // The part you fitted is the part that fails, so the machine comes back
    // for the same thing — which is the point of the lesson.
    return t.faultId;
  }

  /**
   * Take the money and record everything that follows from it.
   * Returns the grade result, or { refused: true, why } if they will not pay.
   */
  function settle(t, priceFt) {
    var res = window.TechOpsScore.grade(Shop, t, priceFt);

    if (!window.TechOpsScore.willPay(t, priceFt, res.overall)) {
      return { refused: true, why: window.TechOpsScore.payRefusal(t, priceFt, res.overall), res: res };
    }

    Shop.earn(priceFt, 'Job ' + t.id + ' · ' + J.customer(t).name);
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
      stars: res.stars, paidFt: priceFt, review: res.reviewBody,
      resolved: res.resolved, soldUnneeded: !!(J.fault(t).noPartNeeded && t.installed.length)
    });

    var custId = t.customerId || (J.customer(t) && J.customer(t).id) || (J.customer(t) && J.customer(t).name);
    if (custId) {
      var mem = Shop.state.customerMemory = Shop.state.customerMemory || {};
      mem[custId] = mem[custId] || { visits: 0, repairs: [] };
      mem[custId].visits++;
      mem[custId].repairs.push({
        day: Shop.state.day,
        machine: J.machine(t).name,
        fault: J.fault(t).title,
        stars: res.stars,
        paidFt: priceFt,
        wasOvercharged: !!(res.axes && res.axes.budget < 50),
        soldUnneeded: !!(J.fault(t).noPartNeeded && t.installed.length),
        late: !!(res.axes && res.axes.speed < 50),
        accused: !!t.tension,
        comeback: !!res.comeback,
        warranty: !!t.warranty
      });
    }

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

    var G = Shop.state.goalStats = Shop.state.goalStats || {};
    var promised = t.agreedDays && t.agreedDays > t.urgencyDays ? t.agreedDays : t.urgencyDays;
    if (J.turnaroundDays(t) <= promised) G.onTime = (G.onTime || 0) + 1;
    if (t.esdOn && t.openSteps.length) G.grounded = (G.grounded || 0) + 1;

    Shop.award('first_job');
    if (res.resolved && (t.asked || []).length >= 3 && t.testsRun.length <= 2) Shop.award('asked_first');
    if (G.grounded >= 3) Shop.award('grounded');
    if (G.onTime >= 3) Shop.award('on_time');
    if (res.stars === 5) Shop.award('five_star');
    if (Shop.state.jobsDone >= 5) Shop.award('five_jobs');
    if (Shop.state.honestRefusals >= 2) Shop.award('no_upsell');
    if (Shop.state.reputation >= 75) Shop.award('good_name');

    Shop.state.ticket = null;
    Shop.advanceDays(1);
    var ff = J.footfall(Shop);
    if (ff.quietDays > 1) {
      Shop.advanceDays(ff.quietDays - 1);
      Shop.state.queue = (Shop.state.queue || []).filter(function (q) { return q.warranty; });
      res.quietDays = ff.quietDays - 1;
    }
    Shop.emit('change');
    return res;
  }

  window.TechOpsLiteSettle = { settle: settle, fair: fair, LABOUR_RATE: LABOUR_RATE };
})(window);
