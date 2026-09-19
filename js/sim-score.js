/**
 * TechOps Budapest — grading a finished job.
 *
 * Deliberately NOT "did you pick the expensive part". A job is graded on
 * six axes, and the cheap part wins on several of them. What loses is
 * mismatch: hardware that does not fit the machine, or does not fit the
 * person, or does not arrive before their deadline.
 */
(function (window) {
  'use strict';

  var W = { resolved: 0, fit: 34, budget: 20, speed: 15, durability: 14, safety: 21 };

  function clamp(n) { return Math.max(0, Math.min(100, n)); }

  function totalRamAfter(machine, ticket) {
    var added = 0;
    ticket.installed.forEach(function (i) {
      var p = window.TechOpsParts.get(i.partId);
      if (p && p.cat === 'ram') added += p.spec.totalGB;
    });
    return added ? added + (machine.ramSolderedGB || 0) : 0;
  }

  function grade(shop, ticket, priceFt) {
    var machine = window.TechOpsJobs.machine(ticket);
    var fault   = window.TechOpsJobs.fault(ticket);
    var cust    = window.TechOpsJobs.customer(ticket);
    var uc      = window.TechOpsJobs.useCase(ticket);

    var findings = [];   // { axis, good, text }
    var conductivePaste = false;
    var lessons  = [];   // teaching notes shown in the debrief
    var axes = {};

    // ── 1. Did the machine actually get fixed? ────────────────────────
    var resolved = false;
    var fb = fault.fixedBy;
    if (fb.kind === 'part') {
      var match = ticket.installed.filter(function (i) { return i.cat === fb.cat; });
      resolved = match.length > 0 && match.every(function (i) {
        return window.TechOpsParts.compat(window.TechOpsParts.get(i.partId), machine).ok;
      });
    } else if (fb.kind === 'action') {
      resolved = ticket.actionsDone.indexOf(fb.id) !== -1;
      if (resolved && fb.needsPartCat) {
        resolved = ticket.installed.some(function (i) { return i.cat === fb.needsPartCat; });
      }
    }
    if (ticket.boardDamaged) resolved = false;

    // Replacing a dying disk with another spinning disk is "resolved" and still wrong.
    var hddForHdd = false;
    if (resolved && fault.id === 'dying_hdd') {
      var st = ticket.installed.filter(function (i) { return i.cat === 'storage'; })[0];
      var sp = st && window.TechOpsParts.get(st.partId);
      if (sp && sp.spec.tech === 'hdd') {
        hddForHdd = true;
        findings.push({ axis: 'fit', good: false, text: 'You replaced a dying hard drive with another hard drive. The clicking is gone; the six-minute boot is not.' });
      }
    }

    // Selling hardware for a fault that needed none.
    var soldAirFor = 0;
    if (fault.noPartNeeded && ticket.installed.length) {
      var instCat = ticket.installed[0].cat;
      var wrongText = (fault.wrongFix && fault.wrongFix[instCat]);
      // Hardware that papers over a software fault genuinely does leave the machine
      // working. Calling it "not fixed" would be a lie; calling it wasteful is the lesson.
      resolved = true;
      soldAirFor = ticket.partsCostFt;
      findings.push({ axis: 'budget', good: false, text: wrongText || 'This fault needed no parts at all, and you fitted some anyway. It works — and none of it was necessary.' });
      lessons.push('The most expensive mistake in a repair shop is not a broken part — it is a part that was never needed. ' + fault.explain);
    }
    if (fault.noPartNeeded && resolved && !ticket.installed.length) {
      findings.push({ axis: 'budget', good: true, text: 'You found a fault that needed no parts, said so, and charged for your time instead of inventing a sale.' });
      shop.state.honestRefusals++;
      shop.award('honest_tech');
    }

    // ── 2. Fit: does the hardware suit this person? ───────────────────
    var fitScore = 100;
    if (hddForHdd) fitScore -= 35;
    if (soldAirFor) fitScore -= 40;
    ticket.installed.forEach(function (inst) {
      var p = window.TechOpsParts.get(inst.partId);
      if (!p) return;
      var c = window.TechOpsParts.compat(p, machine);

      if (!c.ok) {
        fitScore = 0;
        findings.push({ axis: 'fit', good: false, text: '“' + p.name + '” does not fit this machine. ' + c.reason });
        return;
      }
      if (c.capped) {
        fitScore -= 22;
        findings.push({ axis: 'fit', good: false, text: c.note });
        lessons.push('A part can fit perfectly and still be the wrong purchase. ' + c.note);
      }

      if (p.cat === 'storage') {
        var s = p.spec;
        if (uc.needsSsd && s.tech === 'hdd') {
          fitScore -= 40;
          findings.push({ axis: 'fit', good: false, text: 'A spinning hard drive in 2026, for someone who just wants the machine to feel quick. Everything else you did is undone by this one choice.' });
        }
        if (s.capacityGB < uc.storageIdeal * 0.6) {
          fitScore -= 22;
          findings.push({ axis: 'fit', good: false, text: 'Only ' + s.capacityGB + ' GB for someone doing ' + uc.label.toLowerCase() + '. They will be full again within months.' });
        }
        if (s.capacityGB > uc.storageWaste) {
          fitScore -= 16;
          findings.push({ axis: 'fit', good: false, text: s.capacityGB + ' GB for ' + uc.label.toLowerCase() + '. They will never fill a quarter of it, and they paid for all of it.' });
        }
        if (!uc.needsFastNvme && s.tech === 'nvme' && s.seqMBps >= 7000) {
          fitScore -= 14;
          findings.push({ axis: 'fit', good: false, text: 'A 7000 MB/s Gen4 drive for ' + uc.label.toLowerCase() + '. Against a normal SSD, this person could not tell the difference in a blind test.' });
          lessons.push('Past about 500 MB/s, extra sequential speed is invisible unless you are actually moving huge files. Opening Word does not get faster.');
        }
        if (uc.needsFastNvme && s.tech === 'ssd' && s.bus === 'sata3' && machine.storageBuses.some(function (b) { return b.indexOf('nvme') === 0; })) {
          fitScore -= 20;
          findings.push({ axis: 'fit', good: false, text: 'You fitted a SATA SSD in a machine with a free NVMe slot, for someone who moves 4K footage all day. That is six times the bandwidth left on the table.' });
        }
      }

      if (p.cat === 'ram') {
        var after = totalRamAfter(machine, ticket);
        if (after < uc.ramIdeal) {
          fitScore -= 24;
          findings.push({ axis: 'fit', good: false, text: after + ' GB total for ' + uc.label.toLowerCase() + '. It will start swapping again the first time they open everything at once.' });
        }
        if (after > uc.ramWaste) {
          fitScore -= 18;
          findings.push({ axis: 'fit', good: false, text: after + ' GB for ' + uc.label.toLowerCase() + '. Memory that will sit empty for the life of the machine.' });
        }
        if (p.spec.sticks === 1 && machine.ramSlots >= 2 && !machine.ramSolderedGB) {
          fitScore -= 10;
          findings.push({ axis: 'fit', good: false, text: 'One stick in a two-slot machine runs single channel — roughly 20% less memory bandwidth than a matched pair of the same total size, for the same money.' });
          lessons.push('Two 8 GB sticks beat one 16 GB stick in a dual-channel machine. Same capacity, same price, more bandwidth. Always check how many slots there are before you order.');
        }
      }

      if (p.cat === 'screen' && machine.display) {
        if (machine.display.panel === 'OLED' && p.spec.panel === 'LCD') {
          fitScore -= (uc.screenTier === 'exact' ? 42 : uc.screenTier === 'good' ? 28 : 14);
          findings.push({ axis: 'fit', good: false, text: 'An LCD in a phone that came with OLED. Black is now dark grey, it is dimmer in sunlight, and there is no going back.' });
          lessons.push('OLED pixels emit their own light, so black is genuinely off. An LCD has a backlight that is always on behind the whole panel — which is why replacement LCDs look washed out on a phone that shipped with OLED.');
        }
        if (machine.display.trueTone && !p.spec.trueTone) {
          fitScore -= (uc.screenTier === 'exact' ? 16 : 8);
          findings.push({ axis: 'fit', good: false, text: 'True Tone is gone — the ambient sensor is paired to the original panel and does not transfer.' });
        }
      }

      if (p.cat === 'battery' && p.spec.reportsHealth === false) {
        fitScore -= 18;
        findings.push({ axis: 'fit', good: false, text: 'Battery Health now reads "Unknown Part" and will for the rest of the machine\'s life. Customers read that screen.' });
      }

      if (p.cat === 'thermal' && p.spec.conductive) {
        conductivePaste = true;
        findings.push({ axis: 'safety', good: false, text: 'Liquid metal in a customer machine. It works brilliantly right up until it migrates, and then it shorts a board you do not own.' });
      }
    });
    axes.fit = clamp(fitScore);

    // ── 3. Budget ─────────────────────────────────────────────────────
    var over = priceFt - ticket.budgetFt;
    var wasteHit = soldAirFor ? 55 : 0;
    var budgetScore;
    if (over <= 0) {
      var headroom = -over / Math.max(1, ticket.budgetFt);
      budgetScore = 100 - wasteHit;
      if (headroom > 0.45 && resolved && !soldAirFor) {
        findings.push({ axis: 'budget', good: true, text: 'Came in well under what they had set aside, and it still works.' });
      }
    } else {
      budgetScore = clamp(100 - wasteHit - (over / Math.max(1, ticket.budgetFt)) * 180 * uc.priceSensitivity);
      findings.push({ axis: 'budget', good: false, text: 'The bill came to ' + window.techOpsFmt(priceFt) + ' against a budget of ' + window.techOpsFmt(ticket.budgetFt) + '.' });
    }
    axes.budget = clamp(budgetScore);

    // ── 4. Speed ──────────────────────────────────────────────────────
    var days = window.TechOpsJobs.turnaroundDays(ticket);
    var speedScore = 100;
    if (days > ticket.urgencyDays) {
      var late = days - ticket.urgencyDays;
      // Lateness is judged against what was promised. A day late on a one-day
      // job is a broken promise; a day late on a ten-day job is a rounding error.
      var patience = 1 - ((window.TechOpsShop.state.perks || {}).patience || 0);
      var overrun = (late / Math.max(1, ticket.urgencyDays)) * patience;
      speedScore = clamp(100 - overrun * 55 * (0.4 + uc.speedSensitivity) - late * 3);
      var benchDays = window.TechOpsJobs.benchDays(ticket);
      findings.push({ axis: 'speed', good: false, text: 'They needed it in ' + ticket.urgencyDays + ' day' + (ticket.urgencyDays === 1 ? '' : 's') + ' and waited ' + days + '. '
        + (late >= 10 ? 'Three weeks on a slow boat for a part that saved ten thousand forints.'
           : benchDays >= 2
             ? ticket.labourHours.toFixed(1) + ' hours of that was your own bench time — testing everything costs the customer days.'
             : 'Most of that was waiting on a delivery.') });
      // One bench day is just doing the job. Two or more means the diagnosis itself ran long.
      if (benchDays >= 2) lessons.push('You spent ' + ticket.labourHours.toFixed(1) + ' hours on the bench, and a working day is six. Running every instrument on every machine is not thoroughness — it is days the customer did not have. Pick the two or three tests the symptom actually points at.');
      if (late >= 10) lessons.push('Delivery time is part of the price. A part that saves 10.000 Ft and arrives three weeks late has cost the customer far more than it saved them.');
    } else if (days <= 1) {
      findings.push({ axis: 'speed', good: true, text: 'Same-day turnaround.' });
    }
    axes.speed = clamp(speedScore);

    // ── 5. Durability ─────────────────────────────────────────────────
    var risk = 0;
    ticket.installed.forEach(function (i) {
      var p = window.TechOpsParts.get(i.partId);
      if (p) risk = Math.max(risk, p.risk);
    });
    var durScore = clamp(100 - risk * 100 * (0.6 + uc.durabilitySensitivity * 0.8));
    if (risk >= 0.25) {
      findings.push({ axis: 'durability', good: false, text: 'No warranty on the parts you fitted, and this class of part has a real failure rate. If it dies in four months, that is your problem, not the seller\'s.' });
    } else if (risk <= 0.05 && ticket.installed.length) {
      findings.push({ axis: 'durability', good: true, text: 'Parts with a real warranty behind them.' });
    }
    axes.durability = durScore;

    // ── 6. Safety and workmanship ─────────────────────────────────────
    var safety = 100;
    if (!ticket.esdOn && ticket.openSteps.length) {
      safety -= 30;
      findings.push({ axis: 'safety', good: false, text: 'You worked on an open board without the ESD strap. Nothing failed today — static damage rarely fails today.' });
      lessons.push('Electrostatic discharge you cannot feel is around 3000 volts; a logic board can be damaged by 100. The strap costs nothing and the damage it prevents shows up weeks later as an unexplainable fault.');
    }
    if (ticket.boardDamaged) {
      safety = 0;
      findings.push({ axis: 'safety', good: false, text: 'You shorted the board working on it live. The machine is now worth less than it was when they handed it to you.' });
    }
    if (ticket.sloppySteps > 0) {
      safety -= ticket.sloppySteps * 11;
      findings.push({ axis: 'safety', good: false, text: ticket.sloppySteps + ' connector' + (ticket.sloppySteps === 1 ? '' : 's')
        + ' levered off sideways instead of lifted straight up. The pins are splayed — it works today.' });
    }
    if (ticket.snappedTabs > 0) {
      safety -= ticket.snappedTabs * 13;
      findings.push({ axis: 'safety', good: false, text: ticket.snappedTabs + ' adhesive pull-tab snapped off under the battery, so the pack had to be levered out. '
        + 'Whoever opens this next has no tabs left to pull.' });
    }
    if (ticket.boardRework > 0) {
      // Short of a dead board, but permanent: a snapped socket contact or a
      // pad torn off with the component. It works, and it is never new again.
      safety -= ticket.boardRework * 22;
      findings.push({ axis: 'safety', good: false, text: ticket.boardRework
        + (ticket.boardRework === 1 ? ' piece of board damage' : ' pieces of board damage')
        + ' you caused and then repaired. It posts and it runs \u2014 but you handed back a board with a repair on it '
        + 'that did not have one when it arrived, and you should say so.' });
      lessons.push('Board-level work has a point of no return, and it comes sooner than it feels like it should. '
        + 'A socket contact bends about the width of a hair before it snaps; a pad lifts the moment you rock a '
        + 'component instead of drawing it straight up. Slow is not caution here \u2014 it is the only speed that works.');
    }
    if (ticket.strippedScrews > 0) {
      safety -= ticket.strippedScrews * 14;
      findings.push({ axis: 'safety', good: false, text: ticket.strippedScrews + ' stripped screw' + (ticket.strippedScrews === 1 ? '' : 's') + ' from using the wrong driver. The next person to open this will not thank you.' });
    }
    if (conductivePaste) safety -= 50;
    if (fault.safetyCritical && resolved) {
      findings.push({ axis: 'safety', good: true, text: 'A swollen cell removed and disposed of properly rather than left in a laptop on someone\'s bed.' });
    }
    axes.safety = clamp(safety);

    // ── Roll up ───────────────────────────────────────────────────────
    var total = 0, wsum = 0;
    Object.keys(W).forEach(function (k) {
      if (!W[k]) return;
      total += axes[k] * W[k];
      wsum += W[k];
    });
    var overall = wsum ? total / wsum : 0;

    // A repair is only as good as its worst dimension. Averaging alone let a
    // wildly over-specced or three-weeks-late job still score five stars.
    var worst = 100;
    Object.keys(W).forEach(function (k) { if (W[k]) worst = Math.min(worst, axes[k]); });
    if (worst < 30)      overall = Math.min(overall, 45);
    else if (worst < 55) overall = Math.min(overall, 68);
    else if (worst < 75) overall = Math.min(overall, 85);

    if (!resolved) overall = Math.min(overall, 22);
    if (ticket.boardDamaged) overall = 0;

    var stars = overall >= 88 ? 5 : overall >= 72 ? 4 : overall >= 54 ? 3 : overall >= 32 ? 2 : 1;

    // ── The review ────────────────────────────────────────────────────
    var openers = {
      precise:  ['Measured, documented, and I checked their work.', 'I went in with a theory and they corrected it with data.'],
      gentle:   ['Such a nice young person at the desk.', 'They explained it all twice, which I needed.'],
      impatient:['Right, so.', 'Ok so, here is the thing.'],
      busy:     ['Short version, because I have marking to do.', 'No time to write much.'],
      sharp:    ['Straight to it.', 'Numbers first.'],
      anxious:  ['I was so worried about this.', 'I could not sleep before I picked it up.'],
      blunt:    ['Fine. Here it is.', 'Honest review:'],
      panicked: ['Deadline was Friday. Context matters here.', 'Writing this at 1am so bear with me.'],
      shy:      ['My dad says I should write a review.', 'Um, so:']
    };
    var opener = (openers[cust.voice] || openers.blunt)[stars >= 4 ? 0 : 1] || openers.blunt[0];

    var bad = findings.filter(function (f) { return !f.good; });
    var good = findings.filter(function (f) { return f.good; });
    var body;
    if (ticket.boardDamaged) {
      body = opener + ' I brought in a working-ish computer and got back one that does not turn on at all. ' + (bad[0] ? bad[0].text : '');
    } else if (!resolved) {
      body = opener + ' The original problem is still there. ' + (fault.wrongFix && ticket.installed[0] && fault.wrongFix[ticket.installed[0].cat] ? fault.wrongFix[ticket.installed[0].cat] : 'Whatever was done, it was not the thing that was broken.');
    } else if (stars === 5) {
      body = opener + ' Fixed properly, priced fairly, and they did not try to sell me anything I did not need. ' + (good[0] ? good[0].text : '');
    } else {
      body = opener + ' It works now, but — ' + bad.slice(0, 2).map(function (f) { return f.text; }).join(' ');
    }

    // ── Reputation and comeback ───────────────────────────────────────
    var repDelta = Math.round((stars - 3) * 4);
    if (ticket.warranty) repDelta -= 3;

    var comeback = null;
    if (resolved && !ticket.boardDamaged) {
      var roll = shop.rng();
      if (roll < risk) {
        var cbCat = null;
        ticket.installed.forEach(function (i) {
          var p = window.TechOpsParts.get(i.partId);
          if (p && p.risk >= risk - 0.001) cbCat = p.cat;
        });
        comeback = { cat: cbCat, inDays: 3 + Math.floor(shop.rng() * 5) };
      }
      // Dead paste on a fault you "fixed" with a fan and nothing else, etc.
      if (fault.id === 'thermal_paste_dead' && ticket.actionsDone.indexOf('clean_fins') === -1) {
        comeback = comeback || { cat: 'thermal', inDays: 6, reason: 'You repasted but never cleared the blocked fin stack.' };
      }
    }

    return {
      resolved: resolved,
      axes: axes,
      overall: Math.round(overall),
      stars: stars,
      findings: findings,
      lessons: lessons.concat(resolved ? [] : [fault.explain]),
      reviewBody: body,
      repDelta: repDelta,
      comeback: comeback,
      riskPct: Math.round(risk * 100)
    };
  }

  /**
   * Will the customer actually pay this? Budget is a wall, not a suggestion —
   * but a job done visibly well buys a little stretch.
   */
  function willPay(ticket, priceFt, quality) {
    var uc = window.TechOpsJobs.useCase(ticket);
    var stretch = 1 + (0.22 * (1 - uc.priceSensitivity)) + (quality > 80 ? 0.12 : 0);
    return priceFt <= ticket.budgetFt * stretch;
  }

  window.TechOpsScore = { grade: grade, willPay: willPay };
})(window);
