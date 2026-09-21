/**
 * TechOps Budapest — Static Coverage & Winnability Test.
 *
 * Runs on plain Node with no dependencies.
 * Verifies every machine x fault x part x teardown step is reachable and winnable,
 * and every fault has a decisive interview answer and diagnostic theory mapping.
 *
 * Usage: node tools/coverage.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;

function load(relPath) {
  const abs = path.join(__dirname, '..', 'js', relPath);
  const code = fs.readFileSync(abs, 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

// Load core simulation definitions
load('data-customers.js');
load('data-machines.js');
load('data-parts.js');
load('data-chiproles.js');
load('data-boards.js');
load('screw-heads.js');
load('sim-ticket.js');
load('data-faults.js');
load('data-interview.js');

const Machines = window.TechOpsMachines;
const Faults = window.TechOpsFaults;
const Parts = window.TechOpsParts;
const Jobs = window.TechOpsJobs;
const Boards = window.TechOpsBoards;
const Screws = window.TechOpsScrewHeads;
const Interview = window.TechOpsInterview;

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

console.log('\n--- TechOps Budapest: Running Static Coverage Suite ---\n');

// 1. Machines & Screws & Teardown Steps
const machineList = Machines.list();
console.log(`Checking ${machineList.length} machines...`);

machineList.forEach(m => {
  // Teardown steps
  if (!m.teardown || !m.teardown.length) {
    err(`Machine [${m.id}] has no teardown sequence defined.`);
  } else {
    m.teardown.forEach(stepId => {
      if (!Jobs.STEPS[stepId]) {
        err(`Machine [${m.id}] teardown references non-existent step: "${stepId}".`);
      }
    });
  }

  // Screws
  (m.screws || []).forEach(screwType => {
    if (Screws.types.indexOf(screwType) === -1) {
      err(`Machine [${m.id}] uses screw type "${screwType}" which is missing from screw-heads.js HEADS.`);
    }
  });

  // Tools
  (m.tools || []).forEach(toolId => {
    if (!Jobs.TOOLS[toolId]) {
      err(`Machine [${m.id}] references non-existent tool: "${toolId}".`);
    }
  });

  // Board layout
  const layoutKey = Boards.layoutName(m);
  if (!layoutKey || !Boards.LAYOUTS[layoutKey]) {
    err(`Machine [${m.id}] has no board layout mapped in TechOpsBoards.`);
  }
});

// 2. Faults Winnability & Parts Compatibility
const allFaults = Object.keys(Faults.all).map(k => Faults.all[k]);
console.log(`Checking ${allFaults.length} faults...`);

allFaults.forEach(f => {
  if (!f.appliesTo || !f.appliesTo.length) {
    err(`Fault [${f.id}] has an empty appliesTo list.`);
    return;
  }

  // Check appliesTo machine validity
  f.appliesTo.forEach(mId => {
    const m = Machines.get(mId);
    if (!m) {
      err(`Fault [${f.id}] appliesTo references non-existent machine "${mId}".`);
      return;
    }

    // Part-based winnability
    if (f.fixedBy && f.fixedBy.kind === 'part') {
      const cat = f.fixedBy.cat;
      const compatibleParts = Parts.byCat(cat).filter(p => Parts.compat(p, m).ok);
      if (!compatibleParts.length) {
        err(`UNWINNABLE JOB: Fault [${f.id}] on machine [${m.id}] needs a [${cat}] part, but zero compatible parts exist in catalog.`);
      }
    }

    // Action-based winnability
    if (f.fixedBy && f.fixedBy.kind === 'action') {
      const actId = f.fixedBy.id;
      const act = Jobs.ACTIONS[actId];
      if (!act) {
        err(`Fault [${f.id}] fixedBy references non-existent action "${actId}".`);
      } else {
        // Ask the sim itself, so this check cannot drift from the game's rule.
        if (!Jobs.hasStepFor(act, m)) {
          err(`UNWINNABLE ACTION: Fault [${f.id}] action "${actId}" requires step "${act.needsStep}" `
            + `(resolves to "${Jobs.resolveStep(act, m)}" on this machine), which machine [${m.id}] teardown does not have.`);
        }
        if (act.tool && !Jobs.TOOLS[act.tool]) {
          err(`Action "${actId}" needs tool "${act.tool}", which does not exist in TOOLS.`);
        }
        if (act.needsAction && !Jobs.ACTIONS[act.needsAction]) {
          err(`Action "${actId}" needs prior action "${act.needsAction}", which does not exist.`);
        }
        if (act.needsAction) {
          const prior = Jobs.ACTIONS[act.needsAction];
          if (prior && !Jobs.hasStepFor(prior, m)) {
            err(`UNWINNABLE ACTION: Fault [${f.id}] action "${actId}" needs prior action `
              + `"${act.needsAction}", which machine [${m.id}] cannot reach.`);
          }
        }
        if (act.needsPartCat) {
          const fitting = Parts.byCat(act.needsPartCat).filter(p => Parts.compat(p, m).ok);
          if (!fitting.length) {
            err(`UNWINNABLE ACTION: Fault [${f.id}] action "${actId}" needs a [${act.needsPartCat}] `
              + `part, but nothing in the catalogue fits machine [${m.id}].`);
          }
        }
      }
    }
  });

  // 3. Interview Clues
  const dummyUseCase = { label: 'General', blurb: 'Web browsing.' };
  const hasHot = Interview.QUESTIONS.some(q => Interview.answerFor(f.id, q.id, dummyUseCase).w === 'hot');
  if (!hasHot) {
    err(`Fault [${f.id}] has NO decisive ('hot') interview answer. Cannot be diagnosed by asking.`);
  }
});

// 4. Theory Status Revealed By Coverage (from ui-intake.js)
// Read REVEALED_BY directly from ui-intake.js to verify all faults are covered
const intakeCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui-intake.js'), 'utf8');
const match = intakeCode.match(/var REVEALED_BY = \{([\s\S]*?)\};/);
if (match) {
  try {
    const revealedBy = eval('({' + match[1] + '})');
    allFaults.forEach(f => {
      const need = revealedBy[f.id];
      if (!need || !need.length) {
        err(`Fault [${f.id}] is missing from REVEALED_BY in ui-intake.js. `
          + `A student who commits to this theory is told "untested" forever, however many instruments they run.`);
        return;
      }
      // An instrument listed here must actually report on this fault, or the
      // sit-down tells a student their correct theory is unsupported.
      need.forEach(inst => {
        if (!f.readings || !f.readings[inst]) {
          err(`Fault [${f.id}] lists "${inst}" in REVEALED_BY, but has no ${inst} reading. `
            + `Running it would silently fail to confirm a correct theory.`);
        }
      });
    });
  } catch (e) {
    warn(`Could not parse REVEALED_BY from ui-intake.js: ${e.message}`);
  }
}

// 4b. Software actions must have somewhere to be performed.
// A software fix with no procedure and no dedicated app is an unwinnable job
// that throws nothing: the lab simply renders without the button.
const macCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui-macos.js'), 'utf8');
const jobStepKeys = (() => {
  const m = macCode.match(/var JOB_STEPS = \{([\s\S]*?)\n  \};/);
  if (!m) return null;
  return (m[1].match(/^    ([a-z_]+):/gm) || []).map(x => x.trim().replace(':', ''));
})();
// Actions with a hand-built home of their own rather than a JOB_STEPS list.
const DEDICATED_APPS = ['free_space', 'kill_process', 'card_recovery', 'fix_dns', 'confirm_isp', 'remove_extension', 'revoke_notifications', 'clear_portal'];
if (!jobStepKeys) {
  warn('Could not parse JOB_STEPS from ui-macos.js — software reachability unchecked.');
} else {
  Object.keys(Jobs.ACTIONS).forEach(id => {
    const a = Jobs.ACTIONS[id];
    if (!a.software) return;
    if (DEDICATED_APPS.indexOf(id) !== -1) return;
    if (jobStepKeys.indexOf(id) === -1) {
      err(`UNREACHABLE ACTION: software action "${id}" has no JOB_STEPS entry in ui-macos.js `
        + `and is not one of the dedicated apps. The lab will render with no way to do it.`);
    }
  });
}

// 4b'. On a phone or tablet the lab is the handset screen, not a desktop.
// Only the bench instruments, the meter, and the handset's own Storage and
// Battery pages can be run there. A software fault whose evidence lives only
// in Activity Monitor can never be diagnosed on a handset, so its procedure
// never appears; free_space shipped on the iPad with no way to do it at all.
(() => {
  const intakeCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui-intake.js'), 'utf8');
  const rb = {};
  (intakeCode.match(/var REVEALED_BY = \{([\s\S]*?)\n  \};/) || ['', ''])[1]
    .replace(/([a-z_]+):\s*\[([^\]]*)\]/g, (_, k, v) => { rb[k] = v.match(/[a-z_]+/g) || []; });
  const HANDSET_RUNNABLE = ['visual', 'battery', 'power', 'thermal', 'memtest', 'meter', 'storage_used', 'browser'];
  const HANDSET_HOMES = ['free_space', 'card_recovery', 'revoke_notifications', 'clear_portal'];
  Object.values(Faults.all).forEach(f => {
    f.appliesTo.forEach(mid => {
      const m = Machines.get(mid);
      if (!m || (m.kind !== 'phone' && m.kind !== 'tablet')) return;
      const ev = (rb[f.id] || []).filter(i => HANDSET_RUNNABLE.includes(i));
      if (!ev.length) err(`UNDIAGNOSABLE ON A HANDSET: ${f.id} on [${mid}] is only revealed by `
        + `${(rb[f.id] || []).join(', ') || 'nothing'}, none of which a phone or tablet can run.`);
      const a = f.fixedBy.kind === 'action' && Jobs.ACTIONS[f.fixedBy.id];
      if (a && a.software && !HANDSET_HOMES.includes(a.id) && jobStepKeys && !jobStepKeys.includes(a.id)) {
        err(`UNREACHABLE ON A HANDSET: ${a.id} (${f.id}) on [${mid}] has no procedure the handset lab can show.`);
      }
      if (a && ['kill_process', 'fix_dns', 'confirm_isp'].includes(a.id)) {
        err(`UNREACHABLE ON A HANDSET: ${a.id} lives in a desktop app, and [${mid}] has no desktop.`);
      }
    });
  });
})();

// 4b''. Every part a fix needs has to be for sale.
// Capacitors had no tab in the Parts market, so the capacitor job could only
// ever be finished by a harness that stocked the shelf directly.
(() => {
  const mk = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui-market.js'), 'utf8');
  const cats = ((mk.match(/var CATS = \[([\s\S]*?)\];/) || ['', ''])[1].match(/id: '([a-z_]+)'/g) || [])
    .map(x => x.slice(5, -1));
  const needed = new Set();
  Object.values(Faults.all).forEach(f => {
    if (f.fixedBy.kind === 'part') needed.add(f.fixedBy.cat);
    if (f.fixedBy.needsPartCat) needed.add(f.fixedBy.needsPartCat);
  });
  Object.values(Jobs.ACTIONS).forEach(a => { if (a.needsPartCat) needed.add(a.needsPartCat); });
  needed.forEach(c => {
    if (!cats.includes(c)) err(`UNBUYABLE PART: fixes need a "${c}" part but the Parts market has no "${c}" tab.`);
  });
  Object.values(Faults.all).forEach(f => {
    const c = f.fixedBy.kind === 'part' ? f.fixedBy.cat : f.fixedBy.needsPartCat;
    if (!c) return;
    f.appliesTo.forEach(mid => {
      const m = Machines.get(mid);
      const ok = Parts.byCat(c).some(p => Parts.compat(p, m).ok);
      if (!ok) err(`UNBUYABLE PART: ${f.id} on [${mid}] needs a ${c} part and nothing in the market fits it.`);
    });
  });
})();

// 4b'''. Follow-ups must hang off something that can actually happen.
(() => {
  const I = window.TechOpsInterview;
  if (!I || !I.FOLLOWUPS) return warn('No follow-ups exported from data-interview.js.');
  const qids = I.QUESTIONS.map(q => q.id);
  const inst = ['visual', 'listen', 'memtest', 'thermal', 'battery', 'power', 'smart', 'bench', 'activity', 'storage_used', 'meter', 'browser', 'settings', 'network'];
  Object.keys(I.FOLLOWUPS).forEach(fid => {
    if (!Faults.get(fid)) err(`FOLLOW-UP for unknown fault "${fid}".`);
    const list = I.FOLLOWUPS[fid], ids = list.map(x => x.id);
    list.forEach(fu => {
      if (fu.from && !qids.includes(fu.from) && !ids.includes(fu.from))
        err(`FOLLOW-UP ${fid}.${fu.id} hangs off "${fu.from}", which is neither a question nor a follow-up.`);
      if (fu.after && !inst.includes(fu.after)) err(`FOLLOW-UP ${fid}.${fu.id} waits for unknown instrument "${fu.after}".`);
      if (!fu.from && !fu.after) err(`FOLLOW-UP ${fid}.${fu.id} can never be asked: no "from" and no "after".`);
      (fu.choices ? fu.choices.map(c => c.a) : [fu.a]).forEach(a => {
        if (!a || !a.t) err(`FOLLOW-UP ${fid}.${fu.id} has a choice with no answer.`);
        (a && a.s || []).forEach(i => { if (!inst.includes(i)) err(`FOLLOW-UP ${fid}.${fu.id} points at unknown instrument "${i}".`); });
      });
    });
  });
})();

// 4c. A comeback must be preventable.
// thermal_paste_dead comes back if the fin stack is not cleared. On a machine
// where clearing it is unreachable, a careful student is guaranteed a comeback
// they could do nothing about — which shipped on the tower for weeks.
(() => {
  const f = Faults.get('thermal_paste_dead');
  const fins = Jobs.ACTIONS.clean_fins;
  if (!f || !fins) return;
  f.appliesTo.forEach(mid => {
    const m = Machines.get(mid);
    if (m && !Jobs.hasStepFor(fins, m)) {
      err(`UNPREVENTABLE COMEBACK: thermal_paste_dead on [${mid}] comes back unless the fins are cleaned, `
        + `but clean_fins is unreachable on that machine.`);
    }
  });
})();

// 4d. What the customer says has to fit the machine on the counter.
// A Switch arrived with a trackpad that would not click; a ThinkPad showed the
// Mac's question-mark folder. Complaints can be tagged with `os` or `kind`,
// and every machine a fault reaches must still have one that fits.
(() => {
  const SIGNS = [
    [/trackpad|touchpad/i,             m => m.kind === 'laptop',                         'a trackpad'],
    [/question mark|flashing folder/i, m => m.os === 'macos',                            'the Mac question-mark folder'],
    [/startup chime/i,                 m => m.os === 'macos',                            'a startup chime'],
    [/\blid\b/i,                       m => m.kind === 'laptop',                         'a lid'],
    [/my mac\b/i,                      m => m.os === 'macos',                            '"my Mac"'],
    [/keys typing/i,                   m => ['laptop', 'desktop', 'aio'].includes(m.kind), 'a keyboard'],
    [/blue screen|windows has/i,       m => m.os === 'windows',                          'Windows']
  ];
  allFaults.forEach(f => f.appliesTo.forEach(mid => {
    const m = Machines.get(mid);
    if (!m) return;
    const fits = f.complaints.filter(c => Jobs.complaintFits(c, m));
    if (!fits.length) {
      err(`Fault [${f.id}] has no complaint that fits [${mid}] \u2014 the customer would have nothing to say.`);
      return;
    }
    fits.forEach(c => {
      const t = typeof c === 'string' ? c : c.t;
      SIGNS.forEach(([re, ok, what]) => {
        if (re.test(t) && !ok(m)) {
          err(`Fault [${f.id}] can tell a [${mid}] customer about ${what}: "${t.slice(0, 60)}\u2026" `
            + `Tag the complaint with os or kind.`);
        }
      });
    });
  }));
})();

// 4e. A shift code's note is a promise to the student. Deal 60 walk-ins from
// each profile and check the promise holds. They used to be plain seeds
// whose notes nothing implemented ("Phones and tablets" dealt MacBooks).
(() => {
  load('data-people.js'); load('sim-state.js');
  const Shop = window.TechOpsShop, P = Jobs.SHIFT_PROFILES || {};
  const deal = code => { Shop.state = Shop.fresh(code); Shop._rng = null; Shop.init(code);
    const out = []; for (let i = 0; i < 60; i++) out.push(Jobs.newTicket(Shop, {})); return out; };
  const mean = (a, k) => a.reduce((s, t) => s + t[k], 0) / a.length;
  Object.keys(P).forEach(code => {
    const p = P[code], ts = deal(code);
    if (!p.note) err(`SHIFT ${code} has no note.`);
    if (p.machine) ts.forEach(t => { if (!p.machine(Machines.get(t.machineId))) err(`SHIFT ${code} dealt ${t.machineId}, which its note excludes.`); });
    if (p.fault) {
      const share = ts.filter(t => p.fault(Faults.get(t.faultId))).length / ts.length;
      if (share < (p.share || 1) - 0.2) err(`SHIFT ${code}: only ${Math.round(share * 100)}% of faults match its note.`);
    }
    // Same code, same seed, profile switched off: the only difference left is
    // what the profile does.
    if (p.budget || p.urgency) {
      delete P[code]; const plain = deal(code); P[code] = p;
      const ratio = k => mean(ts, k) / mean(plain, k);
      if (p.budget && Math.abs(ratio('budgetFt') - p.budget) > 0.15) err(`SHIFT ${code}: budgets are ${ratio('budgetFt').toFixed(2)}x, its note promises ${p.budget}x.`);
      if (p.urgency && Math.abs(ratio('urgencyDays') - p.urgency) > 0.25) err(`SHIFT ${code}: deadlines are ${ratio('urgencyDays').toFixed(2)}x, its note promises ${p.urgency}x.`);
    }
  });
})();

// 4f. An instrument that "reveals" a fault must show it. Each one listed in
// REVEALED_BY needs a reading from the fault flagged `abnormal` (it shows the
// fault) or `decisive` (a normal reading that settles the diagnosis, like a
// healthy drive in a machine that will not boot). A plain rule-out ("Normal.")
// used to open the diagnosis gate on its own.
(() => {
  const intakeCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui-intake.js'), 'utf8');
  const rb = {};
  (intakeCode.match(/var REVEALED_BY = \{([\s\S]*?)\n  \};/) || ['', ''])[1]
    .replace(/([a-z_0-9]+):\s*\[([^\]]*)\]/g, (_, k, v) => { rb[k] = v.match(/[a-z_]+/g) || []; });
  Object.keys(rb).forEach(fid => {
    const f = Faults.get(fid); if (!f) return;
    rb[fid].forEach(inst => {
      if (inst === 'meter') return;
      const r = (f.readings || {})[inst];
      if (!r) return err(`EVIDENCE: ${fid} is revealed by ${inst}, but the fault has no ${inst} reading.`);
      if (r.abnormal !== true && r.decisive !== true)
        err(`EVIDENCE: ${fid}/${inst} is listed as revealing the fault but is flagged neither abnormal nor decisive.`);
    });
  });
})();

// 4g. A complaint is picked on its own, so it has to stand on its own. Lines
// written as the second half of another ("Quiet is good though, right?",
// "It went like this after the storm") left the customer opening without
// ever saying what was wrong.
(() => {
  const FOLLOW_ON = /^(also\b|it also\b|quiet is|the rest of it|it has done this|it went like this|it started after|it happened|i assume|the clock is wrong as well|i have tried turning|my (son|daughter|cousin) (said|set)|someone told me|a shop told me|the shop said|i think my)/i;
  Object.values(Faults.all).forEach(f => f.complaints.forEach(c => {
    const t = typeof c === 'string' ? c : c.t;
    if (FOLLOW_ON.test(t)) err(`COMPLAINT: ${f.id} has a line that only works after another one: "${t.slice(0, 70)}"`);
  }));
})();

// 5. Board Layout Pedagogy Notes
Object.keys(Boards.LAYOUTS).forEach(bId => {
  const b = Boards.LAYOUTS[bId];
  if (!b.note || !b.note.trim()) {
    warn(`Board layout [${bId}] has no explanatory 'note' explaining its pedagogy.`);
  }
});

// Report summary
console.log('\n========================================');
console.log(`Coverage Check Complete: ${errors.length} Errors, ${warnings.length} Warnings.`);
console.log('========================================\n');

if (warnings.length) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(w => console.log('  - ' + w));
  console.log('');
}

if (errors.length) {
  console.log('❌ ERRORS FOUND:');
  errors.forEach(e => console.log('  - ' + e));
  console.log('');
  process.exit(1);
} else {
  console.log('✅ ALL MACHINES, FAULTS, PARTS, TEARDOWNS, AND INTERVIEWS PASS COVERAGE!\n');
  process.exit(0);
}
