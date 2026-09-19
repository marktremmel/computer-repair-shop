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
const DEDICATED_APPS = ['free_space', 'kill_process', 'card_recovery', 'fix_dns', 'confirm_isp'];
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
