// Headless scenario harness for the TechOps scoring engine.
const fs = require('fs'), vm = require('vm');
const base = require('path').join(__dirname, '..', 'js') + '/';
const win = {};
win.window = win;
win.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
win.Intl = Intl;
const ctx = vm.createContext(win);
['data-machines','data-parts','data-faults','data-customers','sim-state','sim-ticket','sim-score']
  .forEach(f => vm.runInContext(fs.readFileSync(base + f + '.js', 'utf8'), ctx, { filename: f }));

const Shop = win.TechOpsShop, J = win.TechOpsJobs, Score = win.TechOpsScore;
Shop.init('TEST');

function job(customerId, machineId, faultId, over) {
  const t = J.newTicket(Shop, {
    customer: win.TechOpsCustomers.get(customerId), machineId, fault: faultId
  });
  Object.assign(t, over || {});
  // a competently opened machine, so safety is not what we are measuring
  t.esdOn = true; t.batteryDisconnected = true;
  t.openSteps = win.TechOpsMachines.get(machineId).teardown.slice();
  return t;
}
function run(label, t, price) {
  const r = Score.grade(Shop, t, price);
  const ax = Object.entries(r.axes).map(([k, v]) => k[0] + ':' + Math.round(v)).join(' ');
  console.log(
    (label + ' ').padEnd(56, '.') + ' ' + r.stars + '★  fixed=' + (r.resolved ? 'Y' : 'N') + '  [' + ax + ']'
  );
  if (process.env.V) r.findings.forEach(f => console.log('      ' + (f.good ? '+ ' : '- ') + f.text));
  return r;
}

console.log('\n── SAME FAULT, DIFFERENT PARTS ' + '─'.repeat(40));
// Marika (email, low budget) — dying hard drive in an old MacBook Pro.
const budget = 33000;
run('grandma/email · used HDD again (6.000)',
    job('marika','mbp13_2012','dying_hdd',{budgetFt:budget,urgencyDays:10,daysWaited:1,
      installed:[{partId:'hdd_1tb_used',cat:'storage'}],partsCostFt:6000,labourHours:2}), 20000);
run('grandma/email · retail 500GB SATA SSD (17.500)',
    job('marika','mbp13_2012','dying_hdd',{budgetFt:budget,urgencyDays:10,daysWaited:2,
      installed:[{partId:'ssd_sata_500_ipon',cat:'storage'}],partsCostFt:17500,labourHours:2}), 30000);
run('grandma/email · marketplace SSD, 21-day wait (8.500)',
    job('marika','mbp13_2012','dying_hdd',{budgetFt:budget,urgencyDays:10,daysWaited:21,
      installed:[{partId:'ssd_sata_480_sz',cat:'storage'}],partsCostFt:8500,labourHours:2}), 20000);
run('grandma/email · 1TB SSD, way over budget (29.000)',
    job('marika','mbp13_2012','dying_hdd',{budgetFt:budget,urgencyDays:10,daysWaited:2,
      installed:[{partId:'ssd_sata_1tb_ipon',cat:'storage'}],partsCostFt:29000,labourHours:2}), 48000);

console.log('\n── SAME PART, DIFFERENT PERSON ' + '─'.repeat(40));
run('videographer · Gen4 2TB in a Gen4 board (78.000)',
    job('reka','tower_pc','dying_hdd',{budgetFt:120000,urgencyDays:5,daysWaited:2,
      installed:[{partId:'nvme_2tb_g4_ipon',cat:'storage'}],partsCostFt:78000,labourHours:2}), 95000);
run('grandma · same Gen4 2TB drive',
    job('marika','inspiron15','dying_hdd',{budgetFt:38000,urgencyDays:10,daysWaited:2,
      installed:[{partId:'nvme_2tb_g4_ipon',cat:'storage'}],partsCostFt:78000,labourHours:2}), 38000);
run('budget laptop · Gen4 drive in a Gen3 x2 slot',
    job('nora','inspiron15','dying_hdd',{budgetFt:60000,urgencyDays:6,daysWaited:2,
      installed:[{partId:'nvme_1tb_g4_ipon',cat:'storage'}],partsCostFt:42000,labourHours:2}), 55000);

console.log('\n── THE FAULTS THAT NEED NO PARTS ' + '─'.repeat(38));
run('full disk · told them the truth, charged labour only',
    job('agi','inspiron15','disk_full',{budgetFt:30000,urgencyDays:5,daysWaited:0,
      actionsDone:['free_space'],labourHours:1}), 6000);
run('full disk · sold them a 1TB SSD instead',
    job('agi','inspiron15','disk_full',{budgetFt:30000,urgencyDays:5,daysWaited:2,
      installed:[{partId:'ssd_sata_1tb_ipon',cat:'storage'}],partsCostFt:29000,labourHours:2}), 42000);
run('scareware · removed the launch agent',
    job('lili','mba_m1','runaway_process',{budgetFt:25000,urgencyDays:3,daysWaited:0,
      actionsDone:['kill_process'],labourHours:0.8}), 5000);
run('lint in port · scraped it out, no part',
    job('peti','iphone12','port_lint',{budgetFt:20000,urgencyDays:2,daysWaited:0,
      actionsDone:['clean_port'],labourHours:0.4}), 4000);
run('lint in port · replaced the charge port flex',
    job('peti','iphone12','port_lint',{budgetFt:20000,urgencyDays:2,daysWaited:5,
      installed:[{partId:'flex_usbc_oem',cat:'flex'}],partsCostFt:12500,labourHours:2}), 19000);

console.log('\n── SCREEN: OLED vs LCD ' + '─'.repeat(48));
run('cracked iPhone · aftermarket LCD (19.000)',
    job('zsolt','iphone12','cracked_screen',{budgetFt:55000,urgencyDays:3,daysWaited:18,
      installed:[{partId:'scr_iphone12_lcd_sz',cat:'screen'}],partsCostFt:19000,labourHours:2}), 34000);
run('cracked iPhone · refurb original OLED (36.000)',
    job('zsolt','iphone12','cracked_screen',{budgetFt:55000,urgencyDays:3,daysWaited:1,
      installed:[{partId:'scr_iphone12_oled_refurb',cat:'screen'}],partsCostFt:36000,labourHours:2}), 52000);
run('cracked iPhone · reseller, same cheap LCD',
    job('balint','iphone12','cracked_screen',{budgetFt:26000,urgencyDays:10,daysWaited:18,
      installed:[{partId:'scr_iphone12_lcd_sz',cat:'screen'}],partsCostFt:19000,labourHours:2}), 25000);

console.log('\n── MISDIAGNOSIS & MALPRACTICE ' + '─'.repeat(41));
run('dying drive · fitted RAM instead (the customer theory)',
    job('nora','mbp13_2012','dying_hdd',{budgetFt:35000,urgencyDays:2,daysWaited:1,
      installed:[{partId:'ddr3_2x8_ipon',cat:'ram'}],partsCostFt:19000,labourHours:2}), 30000);
run('overheating · new fan, paste never touched',
    job('david','tower_pc','thermal_paste_dead',{budgetFt:50000,urgencyDays:4,daysWaited:2,
      installed:[{partId:'fan_oem',cat:'fan'}],partsCostFt:11000,labourHours:2}), 28000);
run('overheating · clean + scrape + MX-4 repaste',
    job('david','tower_pc','thermal_paste_dead',{budgetFt:50000,urgencyDays:4,daysWaited:2,
      installed:[{partId:'paste_mx4',cat:'thermal'}],partsCostFt:2800,
      actionsDone:['clean_fins','scrape_paste','repaste'],labourHours:2.5}), 20000);
run('overheating · liquid metal in a customer machine',
    job('david','tower_pc','thermal_paste_dead',{budgetFt:50000,urgencyDays:4,daysWaited:3,
      installed:[{partId:'paste_liquid_metal',cat:'thermal'}],partsCostFt:6500,
      actionsDone:['clean_fins','scrape_paste','repaste'],labourHours:2.5}), 26000);
run('no ESD strap, two stripped screws',
    job('david','tower_pc','ram_starved',{budgetFt:50000,urgencyDays:5,daysWaited:2,
      installed:[{partId:'ddr4_2x8_dimm_ipon',cat:'ram'}],partsCostFt:21000,labourHours:2,
      esdOn:false,strippedScrews:2}), 40000);
run('shorted the board with a metal tool',
    job('david','tower_pc','ram_starved',{budgetFt:50000,urgencyDays:5,daysWaited:2,
      installed:[{partId:'ddr4_2x8_dimm_ipon',cat:'ram'}],partsCostFt:21000,labourHours:2,
      boardDamaged:true}), 40000);

console.log('\n── SOLDERED MACHINE: the honest "no" ' + '─'.repeat(34));
const soldered = win.TechOpsParts.compat(win.TechOpsParts.get('ddr4_16gb_so_ipon'), win.TechOpsMachines.get('mba_m1'));
console.log('  M1 Air + SO-DIMM →', soldered.ok ? 'ACCEPTED (bug!)' : 'refused: ' + soldered.reason);
const nvmeInSata = win.TechOpsParts.compat(win.TechOpsParts.get('nvme_500_g3_ipon'), win.TechOpsMachines.get('mbp13_2012'));
console.log('  2012 MBP + NVMe →', nvmeInSata.ok ? 'ACCEPTED (bug!)' : 'refused: ' + nvmeInSata.reason);
const g4inG3x2 = win.TechOpsParts.compat(win.TechOpsParts.get('nvme_1tb_g4_ipon'), win.TechOpsMachines.get('inspiron15'));
console.log('  Inspiron + Gen4 →', g4inG3x2.capped ? 'capped: ' + g4inG3x2.note : 'no cap (bug!)');
console.log();

console.log('── DOES BENCH TIME NOW BITE? ' + '─'.repeat(42));
// Same correct repair, same part, same delivery. Only the amount of testing differs.
[['focused: 2 tests, 2.6 h', 2.6], ['thorough-ish: 5 tests, 5.4 h', 5.4],
 ['brute force: every instrument, 7.6 h', 7.6], ['obsessive: 13.2 h', 13.2]]
 .forEach(function (c) {
   run(c[0] + ' · Eszter, 1-day deadline',
     job('eszter','inspiron15','ram_starved',{budgetFt:55000,urgencyDays:1,daysWaited:0,
       installed:[{partId:'ddr4_8gb_so_ipon',cat:'ram'}],partsCostFt:9500,labourHours:c[1]}), 40000);
 });
[['focused: 2.6 h', 2.6], ['brute force: 7.6 h', 7.6]].forEach(function (c) {
  run(c[0] + ' · Marika, 10-day deadline',
    job('marika','mbp13_2012','dying_hdd',{budgetFt:34000,urgencyDays:10,daysWaited:2,
      installed:[{partId:'ssd_sata_500_ipon',cat:'storage'}],partsCostFt:17500,labourHours:c[1]}), 30000);
});
console.log();
