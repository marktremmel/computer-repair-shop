/**
 * TechOps Budapest — what happened while you waited.
 *
 * Ordering a part from the other side of the world used to teleport the shop
 * nineteen days forward with nothing in between, which made the wait feel like
 * a punishment rather than a cost. The shop does not close while a part is in
 * the post: small counter jobs come and go, and you earn from them.
 *
 * It is still a cost — the customer on the bench is still waiting, and the
 * speed axis still scores it — but the days are now made of something.
 */
(function (window) {
  'use strict';

  var WALKINS = [
    { t: 'Screen protector fitted, no bubbles',        ft: [1500, 3000] },
    { t: 'Laptop fan blown out for a regular',          ft: [3000, 6000] },
    { t: 'Phone charge port picked clean at the counter', ft: [2500, 5000] },
    { t: 'Recovered a spreadsheet from a dying stick',  ft: [4000, 9000] },
    { t: 'Talked somebody out of a repair they did not need', ft: [0, 0], rep: 2 },
    { t: 'Set up a printer over Wi-Fi for a neighbour', ft: [2000, 4500] },
    { t: 'Swapped a keyboard someone spilt coffee into', ft: [6000, 12000] },
    { t: 'Sold a cable and gave the advice for free',   ft: [900, 2200] },
    { t: 'Second opinion for a customer another shop overcharged', ft: [0, 0], rep: 3 },
    { t: 'Cleaned up a laptop full of browser toolbars', ft: [4000, 8000] }
  ];

  var QUIET = [
    'Nobody came in. You tidied the parts drawers.',
    'Rain all day. Two people sheltered in the doorway and left.',
    'You reorganised the screw trays by head type. It helped, actually.',
    'Spent the afternoon reading the service manual for a machine you do not own yet.',
    'The cat sat on the bench mat and would not move.'
  ];

  /**
   * Run `days` of shop time. Returns a log of what happened so the player can
   * read it rather than watching a number jump.
   */
  function run(shop, days) {
    var log = [];
    var rep = shop.state.reputation;
    for (var d = 0; d < days; d++) {
      var day = shop.state.day + d + 1;
      // Busier shops get more passing trade.
      var chance = 0.25 + (rep / 100) * 0.5 + ((shop.state.perks || {}).footfall || 0);
      if (shop.rng() < chance) {
        var w = shop.pick(WALKINS);
        var ft = w.ft[1] ? shop.range(w.ft[0], w.ft[1]) : 0;
        log.push({ day: day, text: w.t, ft: ft, rep: w.rep || 0 });
      } else if (shop.rng() < 0.4) {
        log.push({ day: day, text: shop.pick(QUIET), ft: 0, rep: 0 });
      }
    }
    return log;
  }

  function apply(shop, log) {
    var earned = 0, repGain = 0;
    log.forEach(function (e) {
      if (e.ft) { shop.state.cashFt += e.ft; earned += e.ft; }
      if (e.rep) repGain += e.rep;
    });
    if (repGain) shop.adjustRep(repGain);
    if (earned) shop.logLine('+' + window.techOpsFmt(earned) + ' · counter trade while you waited');
    return { earned: earned, repGain: repGain };
  }

  window.TechOpsInterlude = { run: run, apply: apply };
})(window);
