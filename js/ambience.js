/**
 * TechOps Budapest — time of day.
 *
 * The shop looks out over the Danube, and the light changes as the day burns
 * down. Bench hours push the clock forward, so a job you drag out visibly
 * costs you daylight — the same pressure the speed axis scores, made visible.
 */
(function (window) {
  'use strict';

  var PHASES = [
    { id: 'morning',   from: 0.00, label: 'morning',       img: 'assets/bg/shop-morning.webp',   tint: '#cfe3ff', warmth: 0.15 },
    { id: 'noon',      from: 0.22, label: 'midday',        img: 'assets/bg/shop-noon.webp',      tint: '#ffffff', warmth: 0.00 },
    { id: 'afternoon', from: 0.48, label: 'afternoon',     img: 'assets/bg/shop-afternoon.webp', tint: '#ffe0b8', warmth: 0.35 },
    { id: 'evening',   from: 0.72, label: 'golden hour',   img: 'assets/bg/shop-evening.webp',   tint: '#ffb877', warmth: 0.6  },
    { id: 'night',     from: 0.90, label: 'after closing', img: 'assets/bg/shop-night.webp',     tint: '#8fa8d8', warmth: 0.1  }
  ];

  var HOURS_IN_DAY = 6;   // one bench day, matching TechOpsJobs.HOURS_PER_DAY

  /**
   * 0..1 through the working day. Each day starts at its own hour rather than
   * always at nine, so the light in the shop actually varies — otherwise a
   * short job never leaves the morning and the art is wasted.
   */
  function progress() {
    var S = window.TechOpsShop && window.TechOpsShop.state;
    if (!S) return 0;
    if (S.dayStart == null) S.dayStart = 0;
    var t = S.ticket;
    var hrs = t ? (t.labourHours || 0) : 0;
    return Math.min(0.999, (S.dayStart + (hrs % HOURS_IN_DAY) / HOURS_IN_DAY) % 1);
  }

  function phaseAt(p) {
    var out = PHASES[0];
    PHASES.forEach(function (ph) { if (p >= ph.from) out = ph; });
    return out;
  }

  var Ambience = {
    PHASES: PHASES,
    current: null,

    phase: function () { return phaseAt(progress()); },

    /** Clock face for the HUD. The shop day runs 08:00–20:00. */
    clock: function () {
      var mins = Math.round(progress() * 12 * 60);
      var h = 8 + Math.floor(mins / 60), mm = mins % 60;
      return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
    },

    /** Called when the clock rolls over to a new day. */
    newDay: function (shop) {
      // Somewhere between first thing and mid-afternoon — never starting at
      // the same hour twice in a row.
      shop.state.dayStart = 0.02 + shop.rng() * 0.6;
    },

    apply: function () {
      var ph = this.phase();
      var host = document.getElementById('shopdrop');
      if (!host) return;
      if (this.current !== ph.id) {
        this.current = ph.id;
        // Cross-fade: the new plate fades in over the old one, then replaces it.
        var next = document.createElement('div');
        next.className = 'shop-plate';
        next.style.backgroundImage = 'url("' + ph.img + '")';
        host.appendChild(next);
        requestAnimationFrame(function () { next.classList.add('in'); });
        setTimeout(function () {
          Array.prototype.slice.call(host.querySelectorAll('.shop-plate')).forEach(function (n) {
            if (n !== next) n.remove();
          });
        }, 900);
        document.body.setAttribute('data-phase', ph.id);
      }
      var badge = document.getElementById('hud-clock');
      if (badge) badge.textContent = this.clock();
      var lab = document.getElementById('hud-phase');
      if (lab) lab.textContent = ph.label;
    }
  };

  window.TechOpsAmbience = Ambience;
})(window);
