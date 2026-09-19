/**
 * TechOps Budapest — Scoring Invariants & Scenarios Test Harness.
 *
 * Validates the 6-axis scoring engine and Claude's pedagogical invariants:
 *   1. Money buys time, never score.
 *   2. Worst-axis cap: a single low axis limits overall stars.
 *   3. Zero-part faults severely punish upselling.
 *   4. Lateness is measured against promised turnaround.
 *   5. Customer archetypes have diverging preferences for budget vs speed.
 *
 * Usage: node tools/scoring.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };

function load(relPath) {
  const abs = path.join(__dirname, '..', 'js', relPath);
  const code = fs.readFileSync(abs, 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

load('data-customers.js');
load('data-machines.js');
load('data-parts.js');
load('data-chiproles.js');
load('data-boards.js');
load('screw-heads.js');
load('sim-state.js');
window.TechOpsShop.init('BUDAPEST');
load('sim-ticket.js');
load('data-faults.js');
load('data-interview.js');
load('sim-score.js');

const Score = window.TechOpsScore;
const Jobs = window.TechOpsJobs;
const Parts = window.TechOpsParts;
const Faults = window.TechOpsFaults;
const Machines = window.TechOpsMachines;
const Customers = window.TechOpsCustomers;

let totalTests = 0;
let passedTests = 0;
const failures = [];

function assert(condition, scenarioName, details) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failures.push({ scenarioName, details });
  }
}

console.log('\n--- TechOps Budapest: Running 27 Scoring Scenarios ---\n');

// Helper to create a base mock ticket with explicit deterministic customer
function mockTicket(faultId, machineId, customerId) {
  const f = Faults.get(faultId);
  const m = Machines.get(machineId || (f.appliesTo ? f.appliesTo[0] : 'mbp13_2012'));
  const c = Customers.get(customerId || 'eszter');
  const t = Jobs.newTicket(window.TechOpsShop, { machineId: m.id, fault: faultId, customer: c });
  t.promisedDays = 3;
  t.urgencyDays = 3;
  t.daysWaited = 1;
  t.labourHours = 1.0;
  t.openSteps = (m.teardown || []).slice(); // fully opened safely
  t.installed = [];
  t.actionsDone = [];
  t.testsRun = [];
  t.esdOn = true;
  t.partsCostFt = 0;
  return t;
}

// ── GROUP 1: Anti-Upselling Invariant on Zero-Part Faults (Scenarios 1-6) ──

// 1. disk_full fixed honestly with action free_space
{
  const t = mockTicket('disk_full', 'mbp13_2012');
  t.actionsDone.push('free_space');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 1: disk_full honest free fix gets high stars',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 2. disk_full upselling with 1TB SSD
{
  const t = mockTicket('disk_full', 'mbp13_2012');
  t.actionsDone.push('free_space');
  t.installed.push({ partId: 'ssd_sata_1tb_ipon', cat: 'storage' });
  t.partsCostFt = 28000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.stars <= 3, 'Scenario 2: disk_full upselling with unneeded SSD is capped at <= 3 stars',
    `Expected <= 3 stars due to selling unneeded hardware, got ${res.stars}`);
}

// 3. port_lint fixed honestly with action clean_port
{
  const t = mockTicket('port_lint', 'iphone12');
  t.actionsDone.push('clean_port');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 3: port_lint honest clean_port gets high score',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 4. port_lint upselling with new battery
{
  const t = mockTicket('port_lint', 'iphone12');
  t.actionsDone.push('clean_port');
  t.installed.push({ partId: 'batt_a2471_oem', cat: 'battery' });
  t.partsCostFt = 28000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.stars <= 3, 'Scenario 4: port_lint selling unneeded battery is penalized',
    `Expected <= 3 stars, got ${res.stars}`);
}

// 5. runaway_process fixed honestly with kill_process
{
  const t = mockTicket('runaway_process', 'mbp13_2012');
  t.actionsDone.push('kill_process');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 5: runaway_process fixed with kill_process scores high',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 6. runaway_process selling extra RAM instead of fixing software
{
  const t = mockTicket('runaway_process', 'mbp13_2012');
  t.installed.push({ partId: 'ddr3_8gb_used', cat: 'ram' });
  t.partsCostFt = 12000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.stars <= 3, 'Scenario 6: runaway_process upselling RAM is penalized and capped <= 3 stars',
    `Expected <= 3 stars, got ${res.stars}`);
}

// ── GROUP 2: The Worst-Axis Scoring Cap (Scenarios 7-12) ──

// 7. Safety failure: Battery levered without spudger / punctured
{
  const t = mockTicket('battery_swollen', 'mbp13_2012');
  t.installed.push({ partId: 'batt_a1322_oem', cat: 'battery' });
  t.partsCostFt = 18000;
  t.boardDamaged = true;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.stars <= 2, 'Scenario 7: Catastrophic safety fault caps stars <= 2 even if parts fit',
    `Expected <= 2 stars, got ${res.stars} (safety score: ${res.axes.safety})`);
}

// 8. Durability failure: cheap thermal paste that pumps out quickly
{
  const t = mockTicket('thermal_paste_dead', 'mbp13_2012');
  t.actionsDone.push('repaste');
  t.installed.push({ partId: 'paste_cheap', cat: 'thermal' });
  t.partsCostFt = 600;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.durability <= 70, 'Scenario 8: Cheap thermal paste heavily lowers durability axis',
    `Expected durability <= 70, got ${res.axes.durability}`);
}

// 9. Lateness beyond promised days
{
  const t = mockTicket('dying_hdd', 'mbp13_2012');
  t.installed.push({ partId: 'ssd_sata_500_ipon', cat: 'storage' });
  t.partsCostFt = 18000;
  t.promisedDays = 1;
  t.urgencyDays = 1;
  t.daysWaited = 7; // 6 days late
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.speed < 50 && res.stars <= 3, 'Scenario 9: Multiple days late caps final star rating',
    `Expected speed < 50 and stars <= 3, got speed ${res.axes.speed}, stars ${res.stars}`);
}

// 10. Fit failure: completely incompatible RAM generation
{
  const t = mockTicket('bad_ram_stick', 'mbp13_2012');
  // Fitting DDR4 into 2012 MacBook (DDR3)
  t.installed.push({ partId: 'ddr4_8gb_so_ipon', cat: 'ram' });
  t.partsCostFt = 9000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(!res.resolved && res.stars <= 2, 'Scenario 10: Incompatible part generation fails resolution and caps stars <= 2',
    `Expected not resolved and stars <= 2, got resolved=${res.resolved}, stars=${res.stars}`);
}

// 11. High quality across all 5 axes yields 5 stars
{
  const t = mockTicket('dying_hdd', 'mbp13_2012');
  t.installed.push({ partId: 'ssd_sata_500_ipon', cat: 'storage' });
  t.partsCostFt = 18000;
  t.promisedDays = 3;
  t.daysWaited = 1;
  t.labourHours = 1.5;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.resolved && res.stars === 5, 'Scenario 11: Flawless fit, budget, speed, durability & safety awards 5 stars',
    `Expected 5 stars, got ${res.stars} (overall: ${res.overall}, axes: ${JSON.stringify(res.axes)})`);
}

// 12. Unresolved fault with no actions or parts
{
  const t = mockTicket('dying_hdd', 'mbp13_2012');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(!res.resolved && res.stars <= 2, 'Scenario 12: Zero work done on broken machine scores <= 2 stars',
    `Expected <= 2 stars, got ${res.stars}`);
}

// ── GROUP 3: Customer Archetype Sensitivity (Scenarios 13-18) ──

// 13. Pensioner (Marika) is very price sensitive
{
  const t = mockTicket('dying_hdd', 'mbp13_2012', 'marika');
  t.installed.push({ partId: 'ssd_sata_480_sz', cat: 'storage' }); // cheap price
  t.partsCostFt = 9000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.budget >= 70, 'Scenario 13: Pensioner happy with modest budget part',
    `Expected budget >= 70, got ${res.axes.budget}`);
}

// 14. Pensioner given expensive SSD drops budget score
{
  const t = mockTicket('dying_hdd', 'mbp13_2012', 'marika');
  t.installed.push({ partId: 'ssd_sata_1tb_ipon', cat: 'storage' });
  t.partsCostFt = 95000; // severely over budget
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.budget < 60, 'Scenario 14: Over-budget part penalizes budget for price-sensitive customer',
    `Expected budget < 60, got ${res.axes.budget}`);
}

// 15. Pro Editor (Réka) demands performance, dislikes slow SATA in NVMe slot
{
  const t = mockTicket('dying_hdd', 'inspiron15', 'reka');
  // Dell Inspiron 15 supports PCIe NVMe, giving it a 2.5" SATA SSD works but limits speed
  t.installed.push({ partId: 'ssd_sata_500_ipon', cat: 'storage' });
  t.partsCostFt = 18000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.fit <= 80, 'Scenario 15: Pro video editor notes bus ceiling on SATA drive when NVMe was possible',
    `Expected fit <= 80, got ${res.axes.fit}`);
}

// 16. Pro Editor given high-end 2TB NVMe drive on workstation gets max fit score
{
  const t = mockTicket('dying_hdd', 'tower_pc', 'reka');
  t.installed.push({ partId: 'nvme_2tb_g4_ipon', cat: 'storage' });
  t.partsCostFt = 65000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.fit >= 85, 'Scenario 16: Fast 2TB NVMe drive on pro machine achieves top fit score',
    `Expected fit >= 85, got ${res.axes.fit}`);
}

// 17. Student with tight deadline values speed
{
  const t = mockTicket('cracked_screen', 'iphone12', 'nora');
  t.installed.push({ partId: 'scr_iphone12_oled_refurb', cat: 'screen' });
  t.partsCostFt = 24000;
  t.promisedDays = 1;
  t.daysWaited = 0;
  t.labourHours = 0.5;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.speed >= 80, 'Scenario 17: Same-day turnaround scores high speed for student',
    `Expected speed >= 80, got ${res.axes.speed}`);
}

// 18. Student with tight deadline delayed by Shenzhen order
{
  const t = mockTicket('cracked_screen', 'iphone12', 'nora');
  t.installed.push({ partId: 'scr_iphone12_lcd_sz', cat: 'screen' });
  t.partsCostFt = 12000;
  t.promisedDays = 1;
  t.urgencyDays = 1;
  t.daysWaited = 14; // Shenzhen delay
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.speed < 40, 'Scenario 18: 14-day delay on student job ruins speed score',
    `Expected speed < 40, got ${res.axes.speed}`);
}

// ── GROUP 4: Hardware Diagnoses & Edge Cases (Scenarios 19-27) ──

// 19. bad_ram_stick fixed with correct DDR3 module
{
  const t = mockTicket('bad_ram_stick', 'mbp13_2012');
  t.installed.push({ partId: 'ddr3_2x8_ipon', cat: 'ram' });
  t.partsCostFt = 16000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.resolved && res.stars >= 4, 'Scenario 19: Correct RAM module resolves bad_ram_stick',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 20. battery_swollen fixed with OEM battery
{
  const t = mockTicket('battery_swollen', 'mbp13_2012');
  t.installed.push({ partId: 'batt_a1322_oem', cat: 'battery' });
  t.partsCostFt = 18000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.resolved && res.axes.durability >= 80, 'Scenario 20: Genuine OEM battery provides high durability',
    `Expected durability >= 80, got ${res.axes.durability}`);
}

// 21. cracked_screen fixed with original OLED
{
  const t = mockTicket('cracked_screen', 'iphone12');
  t.installed.push({ partId: 'scr_iphone12_oled_oem', cat: 'screen' });
  t.partsCostFt = 34000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.resolved && res.stars >= 4, 'Scenario 21: OEM OLED panel on iPhone 12 preserves display quality',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 22. cracked_screen fitted with cheap In-Cell LCD panel on OLED phone
{
  const t = mockTicket('cracked_screen', 'iphone12');
  t.installed.push({ partId: 'scr_iphone12_lcd_sz', cat: 'screen' });
  t.partsCostFt = 12000;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.axes.fit <= 80, 'Scenario 22: In-Cell LCD on OLED phone incurs fit penalty for losing True Tone & contrast',
    `Expected fit <= 80, got ${res.axes.fit}`);
}

// 23. os_wrecked fixed with reinstall_os action
{
  const t = mockTicket('os_wrecked', 'mbp13_2012');
  t.actionsDone.push('reinstall_os');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 23: Reinstalling OS in place resolves unbootable machine',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 24. sd_formatted fixed with card_recovery action
{
  const t = mockTicket('sd_formatted', 'mbp13_2012');
  t.actionsDone.push('card_recovery');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 24: Carving photos resolves accidentally formatted card',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 25. water_damage board cleaned with clean_corrosion action
{
  const t = mockTicket('water_damage', 'mbp13_2012');
  t.actionsDone.push('clean_corrosion');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 25: Cleaning board corrosion resolves liquid damage',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 26. dead_no_power flea power drained via power_reset
{
  const t = mockTicket('dead_no_power', 'mbp13_2012');
  t.actionsDone.push('power_reset');
  const res = Score.grade(window.TechOpsShop, t, 0);
  assert(res.resolved && res.stars >= 4, 'Scenario 26: Bleeding power controller latch resolves dead machine for free',
    `Expected >= 4 stars, got ${res.stars}`);
}

// 27. Comeback rate calculation: high-risk parts increase comeback likelihood
{
  const t = mockTicket('fan_seized', 'inspiron15');
  t.installed.push({ partId: 'fan_generic_sz', cat: 'fan' }); // 0.24 risk
  t.partsCostFt = 3200;
  const res = Score.grade(window.TechOpsShop, t, t.partsCostFt);
  assert(res.riskPct > 15, 'Scenario 27: Generic sleeve bearing fan carries elevated comeback risk',
    `Expected riskPct > 15, got ${res.riskPct}%`);
}

// ── SUMMARY REPORT ──
console.log('========================================');
console.log(`Scoring Scenarios Complete: ${passedTests}/${totalTests} Passed.`);
console.log('========================================\n');

if (failures.length) {
  console.log('❌ SCENARIO FAILURES:');
  failures.forEach(f => {
    console.log(`  - [${f.scenarioName}]: ${f.details}`);
  });
  console.log('');
  process.exit(1);
} else {
  console.log('✅ ALL 27 SCENARIOS PASSED! SCORING INVARIANTS RIGOROUSLY PRESERVED.\n');
  process.exit(0);
}
