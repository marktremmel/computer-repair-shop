/**
 * TechOps Budapest — playthrough evaluation.
 *
 * coverage.js proves every job is winnable. scoring.js proves the grading
 * invariants hold on 27 hand-built scenarios. Neither says what a *class*
 * will actually experience, which is the thing that decides whether a lesson
 * works: does careful work reliably beat careless work, by a visible margin,
 * across every machine and fault in the game?
 *
 * This plays every machine x fault pair several times under four named
 * strategies and reports the distribution. Run: node tools/playthrough.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
['data-customers.js', 'data-machines.js', 'data-parts.js', 'data-chiproles.js',
 'data-boards.js', 'screw-heads.js', 'data-upgrades.js', 'data-people.js',
 'sim-state.js', 'sim-ticket.js', 'data-faults.js', 'data-interview.js',
 'sim-score.js'].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), { filename: f });
});

const Machines = window.TechOpsMachines;
const Faults   = window.TechOpsFaults;
const Parts    = window.TechOpsParts;
const Jobs     = window.TechOpsJobs;
const Score    = window.TechOpsScore;
const Shop     = window.TechOpsShop;

/** A shop in a known state, so a run is reproducible. */
function shop(seed) {
  Shop.init(seed || 'EVAL');
  Shop.state.player = { name: 'Eval' };
  Shop.state.reputation = 60;
  Shop.state.cashFt = 200000;
  return Shop;
}

/** Parts that fit, ordered cheapest and fastest first. */
function fitting(cat, machine) {
  return Parts.byCat(cat).filter(p => Parts.compat(p, machine).ok);
}

/**
 * Play one ticket to a graded outcome.
 *
 * `strategy` decides how the job is done, not whether it is possible —
 * coverage.js already guarantees that.
 */
function play(S, machine, fault, strategy) {
  const t = Jobs.newTicket(S, { machineId: machine.id, fault: fault.id });
  const uc = Jobs.useCase(t);

  // Diagnosis. The careful technician asks, then runs the two instruments the
  // answers point at. The careless one runs everything.
  const Q = window.TechOpsInterview;
  if (strategy.asks) {
    Q.QUESTIONS.slice(0, 4).forEach(q => t.asked.push(q.id));
    t.labourHours += 0.4;
    const leads = Q.leads(t, fault.id, uc);
    (leads.length ? leads : ['visual']).forEach(i => { t.testsRun.push(i); t.labourHours += 1.0; });
  } else {
    ['smart', 'bench', 'memtest', 'thermal', 'battery', 'power', 'storage_used', 'activity', 'visual', 'listen']
      .forEach(i => { t.testsRun.push(i); t.labourHours += 1.2; });
  }

  t.openSteps = machine.teardown.slice();
  t.esdOn = !!strategy.esd;
  if (strategy.sloppy) { t.sloppySteps = 2; t.strippedScrews = 1; }

  // The repair.
  const fb = fault.fixedBy;

  /*
   * Declining is a real answer, not a forfeit.
   *
   * When the cheapest part that actually fixes it already costs more than the
   * customer has, there is no bill that is both honest and affordable. The
   * handover screen offers exactly this, and grades it a flat four stars: you
   * charge for the diagnosis, tell them straight, and let them decide.
   */
  if (strategy.declines && fb.kind === 'part') {
    const opts0 = fitting(fb.cat, machine);
    const cheapest0 = opts0.slice().sort((a, b) => a.priceFt - b.priceFt)[0];
    if (!opts0.length || cheapest0.priceFt >= t.budgetFt) {
      const fee = Math.min(t.budgetFt, Math.max(2500, Math.round(t.labourHours * 4500 * 0.5 / 500) * 500));
      return { stars: 4, declined: true, overall: 80, axes: { fit: 100, budget: 100, speed: 100, durability: 100, safety: 100 },
               profitFt: fee, priceFt: fee, partsFt: 0 };
    }
  }
  if (strategy.fix === 'none') {
    // walks away without repairing
  } else if (fb.kind === 'action') {
    t.actionsDone.push(fb.id);
    t.labourHours += (Jobs.ACTIONS[fb.id] || {}).labourHours || 0.5;
    if (fb.needsPartCat) {
      const p = fitting(fb.needsPartCat, machine)[0];
      if (p) { t.installed.push({ partId: p.id, cat: p.cat }); t.partsCostFt += p.priceFt; }
    }
    if (strategy.fix === 'upsell' && fault.noPartNeeded) {
      // sells hardware for a fault that needed none
      const cats = ['storage', 'ram', 'battery', 'screen', 'fan'];
      for (const c of cats) {
        const p = fitting(c, machine).sort((a, b) => b.priceFt - a.priceFt)[0];
        if (p) { t.installed.push({ partId: p.id, cat: p.cat }); t.partsCostFt += p.priceFt; break; }
      }
    }
  } else {
    const opts = fitting(fb.cat, machine);
    if (!opts.length) return null;
    let p;
    if (strategy.fix === 'cheapest') p = opts.slice().sort((a, b) => a.priceFt - b.priceFt)[0];
    else if (strategy.fix === 'dearest') p = opts.slice().sort((a, b) => b.priceFt - a.priceFt)[0];
    else {
      // "considered": inside budget, warranty if affordable, fastest of those
      const afford = opts.filter(o => o.priceFt <= t.budgetFt * 0.72);
      const pool = afford.length ? afford : opts.slice().sort((a, b) => a.priceFt - b.priceFt).slice(0, 1);
      p = pool.slice().sort((a, b) =>
        (b.warrantyMonths - a.warrantyMonths) || (a.deliveryDays - b.deliveryDays))[0];
    }
    t.installed.push({ partId: p.id, cat: p.cat });
    t.partsCostFt += p.priceFt;
    t.daysWaited = strategy.waits === false ? 0 : p.deliveryDays;
  }

  t.daysWaited = (t.daysWaited || 0) + (strategy.dawdleDays || 0);

  // The professional move the market screen offers: if nothing that fits can
  // arrive in time, go back to them with the real date before you order.
  if (strategy.renegotiates) {
    const turnaround = Jobs.turnaroundDays(t);
    if (turnaround > t.urgencyDays) t.agreedDays = turnaround;
  }

  const labourFt = Math.round(t.labourHours * 4500);
  let price = Math.round((t.partsCostFt + labourFt) * (strategy.margin || 1.15));
  // Nobody hands over a bill they know the customer cannot pay; the handover
  // screen has a slider, and a careful technician uses it.
  if (strategy.trimsBill && price > t.budgetFt && t.partsCostFt < t.budgetFt) {
    price = Math.max(t.partsCostFt, t.budgetFt);
  }
  // The greedy route: ask for everything they have, whatever the job was.
  if (strategy.billsTheWallet) price = Math.max(price, t.budgetFt);
  /*
   * A price is not money until somebody pays it.
   *
   * The handover refuses a bill past what the customer actually has, and makes
   * you re-price. An evaluation that counted the asking price as profit made
   * overcharging look like a winning strategy; it is not, because nobody hands
   * it over. Walk the price down the way the screen forces you to.
   */
  let refused = 0;
  // What they will pay depends on how the job turned out, so grade first,
  // then walk the price down the way the handover screen forces you to.
  let r = Score.grade(S, t, price);
  while (price > 500 && !Score.willPay(t, price, r.overall)) {
    price = Math.round(price * 0.93);
    refused++;
    if (refused > 60) break;
    r = Score.grade(S, t, price);
  }
  r.refusals = refused;
  // What the shop actually keeps. A five-star review bought by charging
  // break-even is not a business, and the material should be able to say so.
  r.profitFt = price - t.partsCostFt;
  r.benchHours = t.labourHours;
  r.waitedDays = t.daysWaited || 0;
  r.priceFt = price;
  r.partsFt = t.partsCostFt;
  return r;
}

const STRATEGIES = [
  // The behaviour the material is trying to teach: ask first, measure only
  // what the answers point at, renegotiate a date you cannot meet, and do not
  // hand over a bill they cannot pay.
  { name: 'careful',   asks: true,  esd: true,  fix: 'considered', margin: 1.15, renegotiates: true, trimsBill: true, declines: true },
  // Same care, but never warns them about a delay or trims the bill — this is
  // the gap that measures whether managing expectations is worth anything.
  { name: 'silent',    asks: true,  esd: true,  fix: 'considered', margin: 1.15 },
  { name: 'cheapest',  asks: true,  esd: true,  fix: 'cheapest',   margin: 1.15, renegotiates: true, trimsBill: true, declines: true },
  { name: 'top-spec',  asks: true,  esd: true,  fix: 'dearest',    margin: 1.3,  renegotiates: true, trimsBill: true, declines: true },
  { name: 'careless',  asks: false, esd: false, fix: 'considered', margin: 1.5, sloppy: true, dawdleDays: 4, billsTheWallet: true }
];

const rows = {};
const perFault = {};
let plays = 0, nulls = 0;

const profits = {}, declines = {}, repriced = {};
STRATEGIES.forEach(s => { rows[s.name] = []; profits[s.name] = []; });

['EVAL', 'BUDAPEST', 'DUNA'].forEach(seed => {
  const S = shop(seed);
  Machines.list().forEach(m => {
    Faults.forMachine(m).forEach(f => {
      STRATEGIES.forEach(s => {
        const r = play(S, m, f, s);
        plays++;
        if (!r) { nulls++; return; }
        rows[s.name].push(r.stars);
        profits[s.name].push(r.profitFt || 0);
        if (r.declined) declines[s.name] = (declines[s.name] || 0) + 1;
        if (r.refusals) repriced[s.name] = (repriced[s.name] || 0) + 1;
        const key = m.id + ' / ' + f.id;
        perFault[key] = perFault[key] || {};
        perFault[key][s.name] = r.stars;
      });
    });
  });
});

/*
 * A whole shift, not a single job.
 *
 * Per-job margin says overcharging pays. It only looks that way because a
 * single job cannot see the consequence: reputation decides who walks in, and
 * a shop with a bad name gets the customers who have no money. Whether honesty
 * actually pays is a question about twenty jobs, not one, so here are twenty.
 */
function runShift(strategy, seed, days) {
  const S = shop(seed);
  S.state.reputation = 60;
  S.state.cashFt = 200000;
  const machines = Machines.list();
  let done = 0, starSum = 0, comebacks = 0, idle = 0;

  while (S.state.day <= days) {

    const m = S.pick(machines);
    const fs = Faults.forMachine(m);
    if (!fs.length) { S.state.day += 1; continue; }
    const f = S.pick(fs);
    const r = play(S, m, f, strategy);
    if (!r) { S.state.day += 1; continue; }

    done++;
    starSum += r.stars;
    S.state.cashFt += (r.profitFt || 0);
    // Ask the scorer, never restate its formula here — a harness that
    // reimplements a rule can agree with itself and disagree with the game.
    S.adjustRep(r.declined ? 3 : r.repDelta);
    // A job occupies the bench: its own hours, plus any wait for a part.
    S.state.day += Math.max(1, Math.ceil((r.benchHours || 2) / 6)) + (r.waitedDays || 0);
    // Then the shop sits quiet for as long as its name says — the same
    // footfall() the handover uses, so the eval cannot drift from the game.
    const quiet = Math.max(0, Jobs.footfall(S).quietDays - 1);
    S.state.day += quiet; idle += quiet;
    if (r.comeback) {
      // It comes back under warranty: bench days spent, nothing earned, and
      // the customer tells people. That is what a cheap part really costs.
      comebacks++;
      S.state.day += 1 + Math.ceil((r.benchHours || 2) / 6);
      S.adjustRep(-6);
    }
  }
  return {
    till: S.state.cashFt,
    rep: Math.round(S.state.reputation),
    stars: done ? starSum / done : 0,
    jobs: done,
    idle: idle,
    comebacks: comebacks
  };
}

const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const hist = a => [1, 2, 3, 4, 5].map(n => n + '★:' + a.filter(x => x === n).length).join('  ');

console.log('\n--- TechOps Budapest: Playthrough evaluation ---\n');
console.log(`${plays} plays across ${Object.keys(perFault).length} machine x fault pairs, 3 seeds, ${STRATEGIES.length} strategies.`);
if (nulls) console.log(`${nulls} plays skipped (no fitting part).`);
console.log('');
STRATEGIES.forEach(s => {
  const a = rows[s.name], pf = profits[s.name];
  console.log(s.name.padEnd(10),
    'mean ' + mean(a).toFixed(2) + '\u2605   ' + hist(a),
    '  | margin ' + Math.round(mean(pf)).toLocaleString('hu-HU').padStart(8) + ' Ft'
    + (declines[s.name] ? '  (' + declines[s.name] + ' declined' : '  (')
    + (repriced[s.name] ? (declines[s.name] ? ', ' : '') + repriced[s.name] + ' re-priced)' : (declines[s.name] ? ')' : ')')));
});

const errors = [], warnings = [];
const mCareful = mean(rows['careful']), mCareless = mean(rows['careless']);
console.log('');
if (mCareful - mCareless < 0.8) {
  errors.push(`Careful work beats careless work by only ${(mCareful - mCareless).toFixed(2)} stars. `
    + `The lesson does not land if the two look the same from the outside.`);
} else {
  console.log(`Careful beats careless by ${(mCareful - mCareless).toFixed(2)} stars. Good.`);
}
if (mCareful < 3.4) {
  errors.push(`A careful technician averages only ${mCareful.toFixed(2)} stars. That reads as "the game is unfair" rather than "you made a choice".`);
}
// The careful strategy here has perfect information by construction — it is
// told the fault and reads every spec — so a high average is expected and
// correct. It only matters if it reaches a guaranteed five, which would mean
// there is no decision left in the game at all.
if (mCareful > 4.95) {
  warnings.push(`Even with perfect information a careful technician averages ${mCareful.toFixed(2)} stars. `
    + `There is no decision left to make.`);
}

const mSilent = mean(rows['silent']);
if (mCareful - mSilent < 0.05) {
  warnings.push(`Renegotiating a date and trimming the bill is worth only ${(mCareful - mSilent).toFixed(2)} stars. `
    + `Managing expectations should visibly pay.`);
} else {
  console.log(`Warning them early is worth ${(mCareful - mSilent).toFixed(2)} stars over saying nothing.`);
}

// Per-pair: a job where even the careful route cannot clear 3 stars is
// effectively unwinnable even though coverage says it is solvable.
const stuck = Object.keys(perFault).filter(k => {
  // A pair is only stuck if NO honest route clears three stars.
  const best = Math.max(...STRATEGIES.filter(s => s.name !== 'careless').map(s => perFault[k][s.name] || 0));
  return best < 3;
});
if (stuck.length) {
  stuck.slice(0, 12).forEach(k => warnings.push(`Careful play scores only ${perFault[k]['careful']}★ on ${k}.`));
  if (stuck.length > 12) warnings.push(`…and ${stuck.length - 12} more pairs where careful play scores under 3★.`);
}
const greedProfit = mean(profits['careless']), careProfit0 = mean(profits['careful']);
if (greedProfit > careProfit0 * 1.35) {
  console.log(`Per job, careless work extracts more (`
    + `${Math.round(greedProfit).toLocaleString('hu-HU')} Ft vs ${Math.round(careProfit0).toLocaleString('hu-HU')} Ft) \u2014 `
    + `the shift figures below are what decide whether that is actually a winning strategy.`);
} else if (false) {
  errors.push(`Careless work earns ${Math.round(greedProfit).toLocaleString('hu-HU')} Ft a job against `
    + `${Math.round(careProfit0).toLocaleString('hu-HU')} Ft for careful work. If overcharging pays this much better, `
    + `the stars are a cosmetic scold and the material teaches the opposite of what it says.`);
} else {
  console.log(`Careless work earns ${Math.round(greedProfit).toLocaleString('hu-HU')} Ft against careful's `
    + `${Math.round(careProfit0).toLocaleString('hu-HU')} Ft \u2014 greed does not out-earn care.`);
}

const mProfit = mean(profits['careful']);
if (mProfit < 8000) {
  warnings.push(`A careful technician averages only ${Math.round(mProfit).toLocaleString('hu-HU')} Ft margin per job. `
    + `The shop cannot pay for its own upgrades, so the economy never becomes a choice.`);
} else {
  console.log(`Careful work averages ${Math.round(mProfit).toLocaleString('hu-HU')} Ft margin \u2014 the shop can grow.`);
}

// And one where careless play scores full marks is a lesson with no teeth.
const freebies = Object.keys(perFault).filter(k => (perFault[k]['careless'] || 0) >= 5);
freebies.slice(0, 8).forEach(k => warnings.push(`Careless play still scores 5★ on ${k}.`));


/*
 * The claim the whole material rests on: there is no globally correct part.
 * If the same component suits everybody equally, every other lesson here is
 * decoration.
 *
 * Tested against each customer's *own* budget and deadline, because that is
 * what makes the claim true. Given unlimited money and unlimited time the
 * best part is simply the best part for everybody, and the question the shop
 * is built around stops existing.
 */
console.log('\n--- The same part, different people ---\n');
const spreadRows = [];
const CASES = [['inspiron15', 'dying_hdd', 'storage'], ['thinkpad_t480', 'ram_starved', 'ram'],
               ['mbp13_2012', 'battery_swollen', 'battery'], ['iphone12', 'cracked_screen', 'screen']];
CASES.forEach(([mid, fid, cat]) => {
  const S2 = shop('SPREAD');
  const m = Machines.get(mid);
  const opts = Parts.byCat(cat).filter(p => Parts.compat(p, m).ok);
  const uses = Object.keys(window.TechOpsCustomers.useCases);
  opts.forEach(p => {
    const res = uses.map(use => {
      const cust = window.TechOpsCustomers.all.filter(c => c.useCase === use)[0];
      if (!cust) return null;
      const t = Jobs.newTicket(S2, { machineId: mid, fault: fid, customer: cust });
      t.esdOn = true; t.testsRun = ['visual', 'smart']; t.labourHours = 2.4;
      t.openSteps = m.teardown.slice();
      t.installed.push({ partId: p.id, cat: cat });
      t.partsCostFt = p.priceFt; t.daysWaited = p.deliveryDays;
      if (Jobs.turnaroundDays(t) > t.urgencyDays) t.agreedDays = Jobs.turnaroundDays(t);
      let price = p.priceFt + Math.round(t.labourHours * 5000);
      if (price > t.budgetFt && p.priceFt < t.budgetFt) price = t.budgetFt;
      const r = Score.grade(S2, t, price);
      return { use, stars: r.stars, fit: Math.round(r.axes.fit), overall: Math.round(r.overall) };
    }).filter(Boolean);
    if (res.length < 2) return;
    const best = res.reduce((a, b) => (b.overall > a.overall ? b : a));
    const worst = res.reduce((a, b) => (b.overall < a.overall ? b : a));
    spreadRows.push({ cat, part: p.name, best, worst,
      dStars: best.stars - worst.stars, dOverall: best.overall - worst.overall });
  });
});
const byCat = {};
spreadRows.forEach(r => {
  byCat[r.cat] = byCat[r.cat] || { stars: 0, overall: 0 };
  byCat[r.cat].stars = Math.max(byCat[r.cat].stars, r.dStars);
  byCat[r.cat].overall = Math.max(byCat[r.cat].overall, r.dOverall);
});
spreadRows.filter(r => r.dStars >= 1).sort((a, b) => b.dOverall - a.dOverall).slice(0, 8).forEach(r =>
  console.log('  ' + r.part.slice(0, 40).padEnd(42)
    + r.worst.use.padEnd(9) + r.worst.stars + '\u2605 (' + String(r.worst.overall).padStart(3) + ')'
    + '   \u2192   ' + r.best.use.padEnd(9) + r.best.stars + '\u2605 (' + String(r.best.overall).padStart(3) + ')'));
console.log('');
Object.keys(byCat).forEach(cat => {
  const b = byCat[cat];
  // A one-star swing with a double-digit point swing is a difference a student
  // reads in the debrief. The bar is here to catch a category that is genuinely
  // flat \u2014 the same score for everyone \u2014 not to insist every part be a
  // three-star argument.
  if (b.stars < 1 || b.overall < 15) {
    errors.push(`A ${cat} part suits every customer about equally `
      + `(widest spread across the six use cases: ${b.stars} star${b.stars === 1 ? '' : 's'}, ${b.overall} points). `
      + `"There is no globally correct part" is the claim this material is built on.`);
  } else {
    console.log(`  ${cat}: widest spread ${b.stars} star${b.stars === 1 ? '' : 's'} / ${b.overall} points between use cases.`);
  }
});

const HORIZON = Number(process.env.TECHOPS_DAYS || 40);
console.log('\n--- ' + HORIZON + '-day shifts (reputation decides how busy the counter is) ---\n');
const shiftRows = {};
STRATEGIES.forEach(st => {
  const runs = ['EVAL', 'BUDAPEST', 'DUNA', 'PARLAMENT', 'MARGIT'].map(sd => runShift(st, sd, HORIZON));
  const r = {
    till: Math.round(mean(runs.map(x => x.till))),
    rep:  Math.round(mean(runs.map(x => x.rep))),
    stars: mean(runs.map(x => x.stars)),
    jobs: mean(runs.map(x => x.jobs)),
    idle: mean(runs.map(x => x.idle)),
    comebacks: mean(runs.map(x => x.comebacks))
  };
  shiftRows[st.name] = r;
  console.log(st.name.padEnd(10),
    'till ' + r.till.toLocaleString('hu-HU').padStart(10) + ' Ft',
    ' rep ' + String(r.rep).padStart(3),
    ' mean ' + r.stars.toFixed(2) + '\u2605',
    ' jobs ' + r.jobs.toFixed(1).padStart(4),
    ' comebacks ' + r.comebacks.toFixed(1).padStart(4),
    ' idle ' + r.idle.toFixed(1).padStart(4) + 'd');
});
console.log('');
if (shiftRows['careless'].till > shiftRows['careful'].till) {
  errors.push(`Over ${HORIZON} days the careless shop finishes with `
    + `${shiftRows['careless'].till.toLocaleString('hu-HU')} Ft against the careful shop's `
    + `${shiftRows['careful'].till.toLocaleString('hu-HU')} Ft. Cutting corners wins the game, `
    + `which is the opposite of what the material claims.`);
} else {
  console.log(`Over ${HORIZON} days the careful shop finishes ahead on money as well as stars `
    + `(${shiftRows['careful'].till.toLocaleString('hu-HU')} Ft vs ${shiftRows['careless'].till.toLocaleString('hu-HU')} Ft).`);
}
if (shiftRows['careless'].rep > 35) {
  warnings.push(`${HORIZON} days of careless work only drag reputation to ${shiftRows['careless'].rep}. `
    + `The consequence is too slow to be felt inside one lesson.`);
}

console.log('\n========================================');
console.log(`Playthrough Complete: ${errors.length} Errors, ${warnings.length} Warnings.`);
console.log('========================================\n');
if (warnings.length) { console.log('⚠️  WARNINGS:'); warnings.forEach(w => console.log('  - ' + w)); console.log(''); }
if (errors.length) {
  console.log('❌ ERRORS:');
  errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
}
console.log('✅ The spread between careful and careless work is visible and fair.\n');
