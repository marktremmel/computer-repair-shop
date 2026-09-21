/**
 * TechOps Budapest — shop state.
 *
 * One store, one event bus. Everything the player has done to the shop
 * lives here and nowhere else, so a save is just this object.
 */
(function (window) {
  'use strict';

  var SAVE_KEY = 'techops-budapest-save-v1';

  /**
   * A shift code nobody typed.
   *
   * With no code, every new shop used to seed from "BUDAPEST", so every
   * student who pressed Open saw the same opening customers in the same
   * order — fine for a class comparing notes, dull for anyone playing twice.
   * A code is still what makes a shift reproducible, so this one is shown in
   * the shop record like any other: a student can hand it to a friend, and a
   * teacher who wants the whole room on the same shift types their own.
   */
  var PLACES = ['LANCHID', 'DUNA', 'MARGIT', 'OKTOGON', 'DEAK', 'GELLERT', 'KELETI', 'NYUGATI',
                'ASTORIA', 'BUDA', 'PEST', 'CSEPEL', 'OBUDA', 'VAR', 'ANDRASSY', 'SZIGET'];
  function randomShiftCode() {
    var w = PLACES[Math.floor(Math.random() * PLACES.length)];
    return w + '-' + (1000 + Math.floor(Math.random() * 9000));
  }

  /** Small seeded RNG so a teacher can hand a whole class the same shift. */
  function makeRng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  function seedFromString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  var Shop = {
    state: null,
    _handlers: {},

    fresh: function (shiftCode) {
      var code = shiftCode || randomShiftCode();
      return {
        shiftCode: code,
        seed: seedFromString(code),
        rngCalls: 0,
        day: 1,
        cashFt: 150000,
        reputation: 50,          // 0–100; gates which customers walk in
        starsTotal: 0,
        jobsDone: 0,
        jobsBotched: 0,
        comebacks: 0,
        honestRefusals: 0,       // times you told someone "this does not need a part"
        ticket: null,            // the job on the bench right now
        queue: [],               // waiting customers
        shelf: [],               // parts bought and delivered, not yet installed
        onOrder: [],             // parts bought, still in transit
        history: [],             // finished jobs
        badges: {},
        dayStart: 0.05,
        axisTotals: { fit: 0, budget: 0, speed: 0, durability: 0, safety: 0 },
        axisCount: 0,
        customerMemory: {},
        studentName: '',
        log: []
      };
    },

    /** Roll one graded job into the running per-axis record. */
    recordAxes: function (axes) {
      var S = this.state;
      S.axisTotals = S.axisTotals || { fit: 0, budget: 0, speed: 0, durability: 0, safety: 0 };
      Object.keys(S.axisTotals).forEach(function (k) {
        S.axisTotals[k] += (axes[k] || 0);
      });
      S.axisCount = (S.axisCount || 0) + 1;
    },

    axisAverages: function () {
      var S = this.state, n = S.axisCount || 0, out = {};
      Object.keys(S.axisTotals || {}).forEach(function (k) {
        out[k] = n ? Math.round(S.axisTotals[k] / n) : null;
      });
      return out;
    },

    init: function (shiftCode) {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { saved = null; }
      if (saved && saved.shiftCode && !shiftCode) {
        this.state = saved;
      } else {
        this.state = this.fresh(shiftCode);
      }
      this._rng = makeRng(this.state.seed);
      // Replay the RNG to where the save left off, so loading is deterministic.
      for (var i = 0; i < (this.state.rngCalls || 0); i++) this._rng();
      return this.state;
    },

    rng: function () {
      this.state.rngCalls = (this.state.rngCalls || 0) + 1;
      return this._rng();
    },

    pick: function (arr) { return arr[Math.floor(this.rng() * arr.length)]; },
    range: function (lo, hi) { return Math.floor(lo + this.rng() * (hi - lo + 1)); },

    save: function () {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch (e) { /* private mode */ }
    },

    reset: function (shiftCode) {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      this.state = this.fresh(shiftCode);
      this._rng = makeRng(this.state.seed);
      this.emit('reset');
      this.emit('change');
    },

    reseed: function (seed, calls) {
      if (seed !== undefined) this.state.seed = seed;
      if (calls !== undefined) this.state.rngCalls = calls;
      this._rng = makeRng(this.state.seed);
      for (var i = 0; i < (this.state.rngCalls || 0); i++) this._rng();
    },

    // ── money ──────────────────────────────────────────────────────────
    spend: function (ft, why) {
      this.state.cashFt -= ft;
      this.logLine('−' + fmt(ft) + ' · ' + why);
      this.emit('change');
    },
    earn: function (ft, why) {
      this.state.cashFt += ft;
      this.logLine('+' + fmt(ft) + ' · ' + why);
      this.emit('change');
    },

    logLine: function (text) {
      this.state.log.unshift({ day: this.state.day, text: text });
      if (this.state.log.length > 80) this.state.log.pop();
    },

    adjustRep: function (delta) {
      this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + delta));
      this.emit('change');
    },

    award: function (badgeId) {
      if (this.state.badges[badgeId]) return false;
      this.state.badges[badgeId] = this.state.day;
      this.emit('badge', badgeId);
      this.emit('change');
      return true;
    },

    // ── clock ──────────────────────────────────────────────────────────
    advanceDays: function (n) {
      for (var d = 0; d < n; d++) {
        this.state.day++;
        if (window.TechOpsAmbience) window.TechOpsAmbience.newDay(this);
        // Deliveries land.
        var stillOut = [];
        for (var i = 0; i < this.state.onOrder.length; i++) {
          var o = this.state.onOrder[i];
          o.daysLeft--;
          if (o.daysLeft <= 0) {
            this.state.shelf.push(o);
            this.logLine('📦 delivered: ' + (window.TechOpsParts.get(o.partId) || {}).name);
            this.emit('delivery', o);
          } else {
            stillOut.push(o);
          }
        }
        this.state.onOrder = stillOut;
      }
      this.emit('change');
    },

    // ── events ─────────────────────────────────────────────────────────
    on: function (evt, fn) {
      (this._handlers[evt] = this._handlers[evt] || []).push(fn);
      return this;
    },
    emit: function (evt, payload) {
      (this._handlers[evt] || []).forEach(function (fn) { fn(payload); });
      this.save();
    }
  };

  function fmt(ft) {
    return new Intl.NumberFormat('hu-HU').format(Math.round(ft)) + ' Ft';
  }

  window.TechOpsShop = Shop;
  window.techOpsFmt = fmt;
})(window);
