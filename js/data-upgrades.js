/**
 * TechOps Budapest — what the money is for.
 *
 * Until now the till was a scoreboard. These give it a purpose, and each one is
 * a decision a real shop makes: do you buy tools that make you faster, stock
 * that makes you quicker to answer, or a sign that brings better work in?
 *
 * Nothing here buys a better *score*. Upgrades buy time, stock and footfall —
 * the five judgement axes are untouched, so a well-equipped shop that fits the
 * wrong part still gets two stars.
 */
(function (window) {
  'use strict';

  var UPGRADES = [
    // ── tools: buy back bench time ──
    {
      id: 'driver_set', cat: 'tools', name: 'Proper driver set', costFt: 18000, icon: 'driver',
      blurb: 'Sixty bits in a magnetic holder instead of the four you started with.',
      effect: 'Screws come out 40% faster, and a wrong bit skates twice before it rounds the head.',
      apply: function (S) { S.perks.screwSpeed = 0.6; S.perks.extraSkate = 1; }
    },
    {
      id: 'bench_psu', cat: 'tools', name: 'Bench power supply', costFt: 26000, icon: 'coin',
      blurb: 'Feed a board a known voltage instead of guessing from a battery that may itself be dead.',
      effect: 'Electrical instruments (charge port, battery) take half the time.',
      apply: function (S) { S.perks.elecSpeed = 0.5; }
    },
    {
      id: 'hot_plate', cat: 'tools', name: 'Adhesive heat plate', costFt: 34000, icon: 'thermal',
      blurb: 'Even heat across a whole panel instead of a hand-held pad and hope.',
      effect: 'Glued teardowns (phones, tablets, iMacs) are far more forgiving of a wobbly hand.',
      apply: function (S) { S.perks.gentleGlue = true; }
    },
    {
      id: 'microscope', cat: 'tools', name: 'Inspection microscope', costFt: 45000, icon: 'search',
      blurb: 'See what is actually on the board rather than what you assume is.',
      effect: 'Visual inspection reveals a second clue, and connector work stops being scrappy.',
      apply: function (S) { S.perks.sharpEyes = true; S.perks.steadyHand = true; }
    },

    // ── stock: buy back waiting ──
    {
      id: 'stock_consumables', cat: 'stock', name: 'Consumables cupboard', costFt: 22000, icon: 'box',
      blurb: 'Thermal paste, alcohol, adhesive strips, picks — the things you reorder every month anyway.',
      effect: 'Thermal compound is always on the shelf. No order, no wait, no delivery cost.',
      apply: function (S) { S.perks.stockThermal = true; }
    },
    {
      id: 'stock_common', cat: 'stock', name: 'Common parts shelf', costFt: 60000, icon: 'storage',
      blurb: 'One of each of the parts you fit most: a sensible SATA SSD and a stick of each memory type.',
      effect: 'Those parts arrive same-day instead of in two days.',
      apply: function (S) { S.perks.fastStock = true; }
    },
    {
      id: 'courier', cat: 'stock', name: 'Account with a courier', costFt: 38000, icon: 'parts',
      blurb: 'A standing arrangement instead of whatever postage the seller felt like.',
      effect: 'Every delivery arrives two days sooner. Marketplace orders still take weeks — nothing fixes that.',
      apply: function (S) { S.perks.courierDays = 2; }
    },

    // ── the shop itself: buy better work ──
    {
      id: 'sign', cat: 'shop', name: 'A sign people can read', costFt: 15000, icon: 'medal',
      blurb: 'Painted, lit, and facing the tram stop.',
      effect: 'More passing trade while you wait on parts.',
      apply: function (S) { S.perks.footfall = 0.18; }
    },
    {
      id: 'waiting_area', cat: 'shop', name: 'Somewhere to sit and a kettle', costFt: 24000, icon: 'chat',
      blurb: 'Two chairs, a plant, and tea. It costs almost nothing and changes every conversation.',
      effect: 'Customers answer one extra question for free, and are slightly more patient.',
      apply: function (S) { S.perks.freeQuestions = 1; S.perks.patience = 0.15; }
    },
    {
      id: 'diagnostic_rig', cat: 'shop', name: 'Dedicated diagnostic bench', costFt: 52000, icon: 'gauge',
      blurb: 'A second bench that does nothing but test, so the machine you are working on stays untouched.',
      effect: 'Every instrument costs 30% less bench time.',
      apply: function (S) { S.perks.testSpeed = 0.7; }
    },
    {
      id: 'apprentice', cat: 'shop', name: 'Take on an apprentice', costFt: 85000, icon: 'counter',
      blurb: 'Somebody to run the counter, order the parts and ask the first few questions.',
      effect: 'Reassembly and admin are handled: 1 hour off every job, and the counter earns while you wait.',
      apply: function (S) { S.perks.adminHours = 1; S.perks.footfall = (S.perks.footfall || 0) + 0.25; }
    }
  ];

  var CATS = {
    tools: { label: 'Tools', note: 'Buy back the hours a job takes.' },
    stock: { label: 'Stock & supply', note: 'Buy back the days a part takes to arrive.' },
    shop:  { label: 'The shop', note: 'Change what walks through the door.' }
  };

  window.TechOpsUpgrades = {
    all: UPGRADES,
    CATS: CATS,
    get: function (id) {
      for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === id) return UPGRADES[i];
      return null;
    },
    owned: function (S, id) { return !!(S.upgrades && S.upgrades[id]); },
    /** Re-apply every owned upgrade onto a fresh perks object (used on load). */
    rebuildPerks: function (S) {
      S.perks = {};
      Object.keys(S.upgrades || {}).forEach(function (id) {
        var u = window.TechOpsUpgrades.get(id);
        if (u) u.apply(S);
      });
    }
  };
})(window);
