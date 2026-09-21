/**
 * TechOps Budapest — access settings.
 *
 * A school has to be able to hand this to a whole class, which means the
 * people who need larger text, stronger contrast or less movement have to be
 * able to get them without asking anybody. Four switches, remembered in the
 * browser, applied as attributes on <html> so the stylesheets can respond
 * without any JavaScript running again.
 *
 * Deliberately small. Every one of these is something a student might
 * genuinely need on a school machine they cannot change the settings of.
 */
(function (window) {
  'use strict';

  var KEY = 'techops.a11y';

  var DEFAULTS = { text: 100, contrast: false, motion: false, dyslexic: false, transparency: 35, backdrop: 'auto' };

  var OPTIONS = {
    text: [
      { v: 100, label: 'Normal' },
      { v: 115, label: 'Large' },
      { v: 132, label: 'Larger' },
      { v: 150, label: 'Largest' }
    ],
    backdrops: [
      { id: 'auto', label: 'Auto' },
      { id: 'morning', label: 'Morning' },
      { id: 'noon', label: 'Midday' },
      { id: 'afternoon', label: 'Afternoon' },
      { id: 'golden-hour', label: 'Golden hour' },
      { id: 'sunset', label: 'Sunset' },
      { id: 'dusk', label: 'Dusk' },
      { id: 'night', label: 'Night' },
      { id: 'overcast', label: 'Overcast' },
      { id: 'rain', label: 'Rain' },
      { id: 'sleet', label: 'Sleet' },
      { id: 'snow', label: 'Snow' }
    ]
  };

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }

  function write(s) {
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  var state = read();

  function apply() {
    var r = document.documentElement;
    var scale = (state.text / 100).toFixed(3);
    var trans = ((state.transparency == null ? 35 : state.transparency) / 100).toFixed(2);
    r.style.setProperty('--a11y-scale', scale);
    r.style.setProperty('--win-transparency', trans);
    r.setAttribute('data-text-size', state.text);
    r.setAttribute('data-contrast', state.contrast ? 'high' : 'normal');
    r.setAttribute('data-motion', state.motion ? 'reduced' : 'normal');
    r.setAttribute('data-typeface', state.dyslexic ? 'readable' : 'normal');
    if (document.body) {
      document.body.style.setProperty('--a11y-scale', scale);
      document.body.style.setProperty('--win-transparency', trans);
    }
    if (window.TechOpsAmbience && window.TechOpsAmbience.apply) {
      window.TechOpsAmbience.apply();
    }
  }

  /** The system setting wins the first time; after that the player's choice does. */
  function init() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        state.motion = true;
      }
    } catch (e) {}
    apply();
  }

  function set(k, v) { state[k] = v; write(state); apply(); }

  window.TechOpsA11y = {
    state: function () { return state; },
    OPTIONS: OPTIONS,
    set: set,
    apply: apply,
    init: init,

    /** The settings panel, shared by the title screen and the top bar. */
    panel: function () {
      var t = OPTIONS.text.map(function (o) {
        return '<button class="a11y-step' + (state.text === o.v ? ' on' : '') + '" data-a11y-text="' + o.v + '">'
          + o.label + '</button>';
      }).join('');
      var curBg = state.backdrop || 'auto';
      var bgList = OPTIONS.backdrops.map(function (b) {
        return '<button class="a11y-step a11y-step-sm' + (curBg === b.id ? ' on' : '') + '" data-a11y-bg="' + b.id + '">'
          + b.label + '</button>';
      }).join('');
      var curTrans = state.transparency == null ? 35 : state.transparency;
      var row = function (key, title, blurb, on) {
        return '<button class="a11y-row' + (on ? ' on' : '') + '" data-a11y-toggle="' + key + '">'
          + '<span class="a11y-box">' + (on ? '✓' : '') + '</span>'
          + '<span><b>' + title + '</b><span>' + blurb + '</span></span></button>';
      };
      return '<div class="a11y">'
        + '<div class="a11y-sec"><div class="a11y-label">Window &amp; panel transparency</div>'
        + '<div class="a11y-slider-row">'
        + '<input type="range" class="a11y-slider" data-a11y-range="transparency" min="0" max="85" step="5" value="' + curTrans + '">'
        + '<span class="a11y-val-disp">' + curTrans + '%</span>'
        + '</div>'
        + '<div class="a11y-slider-bounds"><span>Solid (0%)</span><span>Balanced (35%)</span><span>Glass (85%)</span></div>'
        + '<div class="a11y-note">Adjusts how clearly the workshop background shows through windows, cards, and lab panels.</div></div>'
        + '<div class="a11y-sec"><div class="a11y-label">Shop background &amp; weather</div>'
        + '<div class="a11y-steps a11y-bg-picks">' + bgList + '</div>'
        + '<div class="a11y-note">Choose Auto to follow bench hours and dynamic weather, or lock a specific mood.</div></div>'
        + '<div class="a11y-sec"><div class="a11y-label">Text size</div>'
        + '<div class="a11y-steps">' + t + '</div>'
        + '<div class="a11y-note">Everything scales together, so nothing overlaps at the larger sizes.</div></div>'
        + '<div class="a11y-sec"><div class="a11y-label">Reading</div>'
        + row('contrast', 'Higher contrast',
              'Stronger borders and brighter text. Helps on a projector, and on the school laptops with the washed-out screens.',
              state.contrast)
        + row('dyslexic', 'Plainer letterforms',
              'A more open typeface with wider spacing between letters and lines.',
              state.dyslexic)
        + row('motion', 'Less movement',
              'Stops the pulsing, blinking and sliding. On by default if your system already asks for it.',
              state.motion)
        + '</div>'
        + '<div class="a11y-note" style="margin-top:12px">Every precision job on the bench can also be done from the keyboard '
        + '— arrows or space, one press at a time, Esc to back off. The board marks faults with a symbol as well as a colour.</div>'
        + '</div>';
    },

    /** Wire a rendered panel up. `after` runs on any change. */
    bind: function (root, after) {
      root.querySelectorAll('[data-a11y-text]').forEach(function (b) {
        b.addEventListener('click', function () {
          set('text', +b.getAttribute('data-a11y-text'));
          if (after) after();
        });
      });
      root.querySelectorAll('[data-a11y-bg]').forEach(function (b) {
        b.addEventListener('click', function () {
          set('backdrop', b.getAttribute('data-a11y-bg'));
          if (after) after();
        });
      });
      root.querySelectorAll('[data-a11y-range]').forEach(function (slider) {
        var k = slider.getAttribute('data-a11y-range');
        var disp = root.querySelector('.a11y-val-disp');
        slider.addEventListener('input', function () {
          var val = +slider.value;
          state[k] = val;
          if (disp) disp.textContent = val + '%';
          apply();
        });
        slider.addEventListener('change', function () {
          var val = +slider.value;
          set(k, val);
          if (after) after();
        });
      });
      root.querySelectorAll('[data-a11y-toggle]').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-a11y-toggle');
          set(k, !state[k]);
          if (after) after();
        });
      });
    }
  };

  init();
})(window);
