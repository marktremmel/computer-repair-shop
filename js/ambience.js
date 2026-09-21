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
    { id: 'morning',     from: 0.00, label: 'morning',       img: 'assets/bg/shop-morning.webp',     tint: '#cfe3ff', warmth: 0.15 },
    { id: 'noon',        from: 0.20, label: 'midday',        img: 'assets/bg/shop-noon.webp',        tint: '#ffffff', warmth: 0.00 },
    { id: 'afternoon',   from: 0.40, label: 'afternoon',     img: 'assets/bg/shop-afternoon.webp',   tint: '#ffe0b8', warmth: 0.35 },
    { id: 'golden-hour', from: 0.60, label: 'golden hour',   img: 'assets/bg/shop-golden-hour.webp', tint: '#ffb877', warmth: 0.6  },
    { id: 'sunset',      from: 0.75, label: 'sunset',        img: 'assets/bg/shop-evening.webp',     tint: '#ff8a50', warmth: 0.8  },
    { id: 'dusk',        from: 0.86, label: 'dusk',          img: 'assets/bg/shop-dusk.webp',        tint: '#7986cb', warmth: 0.3  },
    { id: 'night',       from: 0.94, label: 'after closing', img: 'assets/bg/shop-night.webp',       tint: '#8fa8d8', warmth: 0.1  }
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

  var BACKDROPS = {
    'morning':     { id: 'morning',     label: 'morning',       img: 'assets/bg/shop-morning.webp' },
    'noon':        { id: 'noon',        label: 'midday',        img: 'assets/bg/shop-noon.webp' },
    'afternoon':   { id: 'afternoon',   label: 'afternoon',     img: 'assets/bg/shop-afternoon.webp' },
    'golden-hour': { id: 'golden-hour', label: 'golden hour',   img: 'assets/bg/shop-golden-hour.webp' },
    'sunset':      { id: 'sunset',      label: 'sunset',        img: 'assets/bg/shop-evening.webp' },
    'dusk':        { id: 'dusk',        label: 'dusk',          img: 'assets/bg/shop-dusk.webp' },
    'night':       { id: 'night',       label: 'after closing', img: 'assets/bg/shop-night.webp' },
    'overcast':    { id: 'overcast',    label: 'overcast',      img: 'assets/bg/shop-overcast.webp' },
    'rain':        { id: 'rain',        label: 'rainy',         img: 'assets/bg/shop-rain.webp' },
    'sleet':       { id: 'sleet',       label: 'sleet',         img: 'assets/bg/shop-sleet.webp' },
    'snow':        { id: 'snow',        label: 'snowy',         img: 'assets/bg/shop-snow.webp' }
  };

  var Ambience = {
    PHASES: PHASES,
    BACKDROPS: BACKDROPS,
    current: null,

    phase: function () {
      var a11y = window.TechOpsA11y && window.TechOpsA11y.state ? window.TechOpsA11y.state() : null;
      if (a11y && a11y.backdrop && a11y.backdrop !== 'auto') {
        if (BACKDROPS[a11y.backdrop]) return BACKDROPS[a11y.backdrop];
      }
      var S = window.TechOpsShop && window.TechOpsShop.state;
      var base = phaseAt(progress());
      if (S && S.weather === 'rain') {
        return { id: 'rain', label: 'rainy ' + base.label, img: 'assets/bg/shop-rain.webp' };
      }
      if (S && S.weather === 'snow') {
        return { id: 'snow', label: 'snowy ' + base.label, img: 'assets/bg/shop-snow.webp' };
      }
      if (S && S.weather === 'sleet') {
        return { id: 'sleet', label: 'sleet ' + base.label, img: 'assets/bg/shop-sleet.webp' };
      }
      if (S && S.weather === 'overcast') {
        return { id: 'overcast', label: 'overcast ' + base.label, img: 'assets/bg/shop-overcast.webp' };
      }
      return base;
    },

    /** Clock face for the HUD. The shop day runs 08:00–20:00. */
    clock: function () {
      var mins = Math.round(progress() * 12 * 60);
      var h = 8 + Math.floor(mins / 60), mm = mins % 60;
      return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
    },

    /** Called when the clock rolls over to a new day. */
    newDay: function (shop) {
      var roll = shop.rng ? shop.rng() : Math.random();
      if (roll < 0.12) {
        shop.state.weather = 'rain';
      } else if (roll < 0.22) {
        shop.state.weather = 'snow';
      } else if (roll < 0.32) {
        shop.state.weather = 'sleet';
      } else if (roll < 0.44) {
        shop.state.weather = 'overcast';
      } else {
        shop.state.weather = 'clear';
      }
      shop.state.dayStart = 0.02 + (shop.rng ? shop.rng() : Math.random()) * 0.45;
    },

    apply: function () {
      var ph = this.phase();
      var host = document.getElementById('shopdrop');
      if (!host) return;
      var hasPlate = host.querySelector('.shop-plate');
      if (this.current !== ph.id || !hasPlate) {
        this.current = ph.id;
        // Cross-fade: the new plate fades in over the old one, then replaces it.
        var next = document.createElement('div');
        next.className = 'shop-plate';
        var imgUrl = ph.img + (window.TECHOPS_BUILD ? '?v=' + window.TECHOPS_BUILD : '');
        next.style.backgroundImage = 'url("' + imgUrl + '")';
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
