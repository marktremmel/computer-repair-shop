/**
 * TechOps Budapest — carrying a shift between machines.
 *
 * The shop saves itself to this browser after every job, which is enough
 * until somebody sits at a different computer, or the school wipes profiles
 * overnight, or two students share a machine. Then the shift is simply gone,
 * and the `SEK7K-` hand-in code cannot help: it is a *report* — deliberately
 * one-way, so a student cannot edit their own marks back in.
 *
 * So this is a second, separate code that restores the shop: who you are,
 * what the till says, and the jobs behind you. It rides on the same encoder
 * (nothing new to trust) and is told apart by `k: 'save'`, which the teacher
 * decoder rejects and this one requires.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;

  /** Only what is needed to carry on being this person, in this shop. */
  function collect() {
    var S = Shop.state;
    var faces = {};
    // The hand-built face has to travel with you or you arrive as somebody
    // else. Presets regenerate from their seed and cost nothing to carry.
    if (S.player && S.player.avatar && S.customFaces && S.customFaces[S.player.avatar]) {
      faces[S.player.avatar] = S.customFaces[S.player.avatar];
    }
    return {
      k: 'save', sv: 1,
      p: S.player || null,
      f: faces,
      c: S.shiftCode, sd: S.seed, rc: S.rngCalls,
      d: S.day, $: S.cashFt, r: S.reputation,
      j: S.jobsDone, st: S.starsTotal, jb: S.jobsBotched,
      cb: S.comebacks, hr: S.honestRefusals,
      at: S.axisTotals, ac: S.axisCount,
      bd: S.badges, up: S.upgrades,
      pc: S.pendingComebacks,
      // The last dozen jobs: enough for the record to mean something without
      // making a code nobody can paste.
      h: (S.history || []).slice(0, 12)
    };
  }

  function make() {
    if (!window.sekCode) return null;
    return window.sekCode.encode(collect());
  }

  /** @returns {ok:true, name} or {ok:false, error} */
  function load(codeStr) {
    if (!window.sekCode) return { ok: false, error: 'Code engine not loaded.' };
    var res = window.sekCode.decode(String(codeStr || '').trim());
    if (!res.ok) return { ok: false, error: res.error };
    var d = res.data;
    if (!d || d.k !== 'save') {
      return { ok: false, error: 'That is a hand-in code, not a save code. A hand-in code reports a finished shift; it cannot restore one.' };
    }

    var S = Shop.state;
    if (d.p) S.player = d.p;
    if (d.f && window.TechOpsPixel) {
      S.customFaces = S.customFaces || {};
      Object.keys(d.f).forEach(function (k) {
        S.customFaces[k] = d.f[k];
        window.TechOpsPixel.remember(k, d.f[k]);
        if (window.TechOpsPeople && window.TechOpsPeople.FACE_PRESETS.indexOf(k) === -1) {
          window.TechOpsPeople.FACE_PRESETS.unshift(k);
        }
      });
    }
    if (d.c) S.shiftCode = d.c;
    if (d.sd !== undefined) S.seed = d.sd;
    if (d.rc !== undefined) S.rngCalls = d.rc;
    if (Shop.reseed && d.sd !== undefined) Shop.reseed(d.sd, d.rc);
    if (d.d) S.day = d.d;
    if (d.$ !== undefined) S.cashFt = d.$;
    if (d.r !== undefined) S.reputation = d.r;
    if (d.j !== undefined) S.jobsDone = d.j;
    if (d.st !== undefined) S.starsTotal = d.st;
    if (d.jb !== undefined) S.jobsBotched = d.jb;
    if (d.cb !== undefined) S.comebacks = d.cb;
    if (d.hr !== undefined) S.honestRefusals = d.hr;
    if (d.at) S.axisTotals = d.at;
    if (d.ac !== undefined) S.axisCount = d.ac;
    if (d.bd) S.badges = d.bd;
    if (d.up) S.upgrades = d.up;
    if (d.pc) S.pendingComebacks = d.pc;
    if (d.h) S.history = d.h;

    // A half-finished job does not travel: the bench state is large and
    // fiddly, and arriving mid-teardown on another machine is worse than
    // starting the next job cleanly. Say so rather than pretending.
    S.ticket = null;
    S.queue = [];

    if (window.TechOpsUpgrades) window.TechOpsUpgrades.rebuildPerks(S);
    Shop.save();
    return { ok: true, name: (S.player && S.player.name) || 'your shop', day: S.day };
  }

  window.TechOpsSave = { make: make, load: load, collect: collect };
})(window);
