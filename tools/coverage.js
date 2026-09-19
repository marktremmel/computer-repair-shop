// Every machine must produce jobs that can actually be finished.
const fs = require('fs'), vm = require('vm');
const base = require('path').join(__dirname, '..', 'js') + '/';
const win = {}; win.window = win;
win.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
win.Intl = Intl;
const ctx = vm.createContext(win);
['data-machines','data-parts','data-faults','data-customers','data-people','data-interview','sim-state','sim-ticket','sim-score']
  .forEach(f => vm.runInContext(fs.readFileSync(base + f + '.js','utf8'), ctx, {filename:f}));

const M = win.TechOpsMachines, F = win.TechOpsFaults, P = win.TechOpsParts;
let problems = 0;

console.log('\nMACHINE'.padEnd(32) + 'FAULTS  SOLVABLE  NOTES');
console.log('─'.repeat(88));
M.list().forEach(m => {
  const faults = F.forMachine(m);
  const notes = [];
  let solvable = 0;
  faults.forEach(f => {
    const fb = f.fixedBy;
    if (fb.kind === 'action') {
      if (fb.needsPartCat) {
        const ok = P.byCat(fb.needsPartCat).some(p => P.compat(p, m).ok);
        ok ? solvable++ : notes.push('NO ' + fb.needsPartCat + ' fits (' + f.id + ')');
      } else solvable++;
    } else {
      const ok = P.byCat(fb.cat).some(p => P.compat(p, m).ok);
      ok ? solvable++ : notes.push('UNWINNABLE: no ' + fb.cat + ' fits (' + f.id + ')');
    }
  });
  if (!faults.length) notes.push('NO FAULTS AT ALL — machine never appears');
  if (notes.length) problems++;
  console.log(m.id.padEnd(32) + String(faults.length).padEnd(8) + String(solvable).padEnd(10) + (notes.join('; ') || 'ok'));
});

console.log('\nTEARDOWN REACHABILITY');
console.log('─'.repeat(88));
M.list().forEach(m => {
  // Walk the teardown graph the way the bench gates it.
  const S = win.TechOpsShop; S.init('COV');
  const t = { openSteps: [], batteryDisconnected: false, machineId: m.id, _screws: [] };
  const seq = m.teardown.slice();
  let progressed = true, stuck = [];
  while (progressed) {
    progressed = false;
    seq.forEach(sid => {
      if (t.openSteps.indexOf(sid) !== -1) return;
      const can = win.TechOpsJobs.canStep(t, sid);
      if (can.ok) {
        t.openSteps.push(sid);
        if (sid === 'battery_connector') t.batteryDisconnected = true;
        progressed = true;
      }
    });
  }
  stuck = seq.filter(s => t.openSteps.indexOf(s) === -1);
  if (stuck.length) problems++;
  console.log(m.id.padEnd(32) + (stuck.length ? 'UNREACHABLE: ' + stuck.join(', ') : 'all ' + seq.length + ' steps reachable'));
});

console.log('\nINTERVIEW COVERAGE (every fault should have at least one decisive answer)');
console.log('─'.repeat(88));
Object.keys(F.all).forEach(fid => {
  const uc = win.TechOpsCustomers.useCase('student');
  const hot = win.TechOpsInterview.QUESTIONS
    .map(q => win.TechOpsInterview.answerFor(fid, q.id, uc))
    .filter(a => a.w === 'hot');
  if (!hot.length) problems++;
  console.log(fid.padEnd(32) + (hot.length ? hot.length + ' decisive answer(s)' : '!! NONE — cannot be interviewed'));
});

console.log('\n' + (problems ? '⚠ ' + problems + ' problem(s)' : '✓ no coverage problems') + '\n');
