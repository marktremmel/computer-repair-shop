/**
 * TechOps Budapest — build a character part by part.
 *
 * The preset grid was fine for getting started but it is not a character
 * creator. This is: every category in the sprite pack, every colour, with a
 * live preview, and randomise for anyone who would rather not decide.
 */
(function (window) {
  'use strict';

  var UI = window.TechOpsUI;
  function P() { return window.TechOpsPixel; }
  var esc = function (s) { return UI.esc(s); };

  var TABS = [
    { id: 'face',    label: 'Face',
      cats: ['body', 'ears', 'eyes', 'eyebrows', 'nose', 'mouth'],
      tints: [['skin', 'Skin'], ['iris', 'Eyes'], ['lip', 'Lips']] },
    { id: 'hair',    label: 'Hair',
      cats: ['basehair', 'bangs', 'backhair'],
      tints: [['hair', 'Hair colour']] },
    { id: 'clothes', label: 'Clothes',
      cats: ['inner', 'outer'],
      tints: [['inner', 'Top'], ['outer', 'Layer']] },
    { id: 'extras',  label: 'Extras',
      cats: ['access', 'extra', 'makeup', 'misc'],
      tints: [['accent', 'Accent']] }
  ];

  var PRETTY = {
    body: 'Face shape', ears: 'Ears', eyes: 'Eyes', eyebrows: 'Brows', nose: 'Nose',
    mouth: 'Mouth', basehair: 'Hair', bangs: 'Fringe', backhair: 'Back hair',
    inner: 'Top', outer: 'Jacket', access: 'Accessory', extra: 'Extra',
    makeup: 'Make-up', misc: 'Details'
  };

  var SWATCH = {
    skin: 'SKIN', hair: 'HAIR', iris: 'IRIS', lip: 'LIP',
    inner: 'CLOTH', outer: 'CLOTH', accent: 'HAIR'
  };

  var ch = null, tab = 'face', onDone = null, modal = null;

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function ensure() {
    if (!ch) ch = P().generate('build-' + Math.random().toString(36).slice(2, 8), {});
    ch.parts = ch.parts || {};
    return ch;
  }

  /** Render a small preview of the character with one part swapped. */
  function thumb(el, cat, variant) {
    var clone = JSON.parse(JSON.stringify(ch));
    if (variant === null) delete clone.parts[cat]; else clone.parts[cat] = variant;
    if (clone.numVariant) delete clone.numVariant[cat];
    P().draw(clone, 108).then(function (c) {
      c.className = 'pixel-portrait';
      el.innerHTML = ''; el.appendChild(c);
    });
  }

  function paintPreview() {
    var host = document.getElementById('cb-preview');
    if (!host) return;
    P().draw(ch, 320).then(function (c) {
      c.className = 'pixel-portrait';
      host.innerHTML = ''; host.appendChild(c);
    });
  }

  function body() {
    var man = P().manifest();
    var T = TABS.filter(function (x) { return x.id === tab; })[0];

    var sections = T.cats.map(function (cat) {
      if (!man[cat]) return '';
      var vars = Object.keys(man[cat]);
      var optional = ['bangs', 'backhair', 'outer', 'access', 'extra', 'makeup', 'misc'].indexOf(cat) !== -1;
      var cells = (optional ? [null] : []).concat(vars).map(function (v) {
        var on = (ch.parts[cat] || null) === v;
        return '<button class="cb-opt' + (on ? ' on' : '') + '" data-cat="' + cat + '" data-var="' + (v === null ? '' : esc(v)) + '"'
          + ' title="' + esc(v === null ? 'none' : v) + '">'
          + (v === null ? '<span class="cb-none">none</span>' : '<span class="cb-thumb" data-t="' + cat + '|' + esc(v) + '"></span>')
          + '</button>';
      }).join('');
      return '<div class="cb-section"><div class="cb-label">' + esc(PRETTY[cat] || cat)
        + ' <span>' + vars.length + '</span></div><div class="cb-grid">' + cells + '</div></div>';
    }).join('');

    var swatches = T.tints.map(function (pair) {
      var key = pair[0], pal = P()[SWATCH[key]] || P().HAIR;
      return '<div class="cb-section"><div class="cb-label">' + esc(pair[1]) + '</div>'
        + '<div class="cb-swatches">' + pal.map(function (c) {
            return '<button class="cb-sw' + (ch.tints[key] === c ? ' on' : '') + '" data-tint="' + key
              + '" data-colour="' + c + '" style="background:' + c + '"></button>';
          }).join('') + '</div></div>';
    }).join('');

    return '<div class="cb">'
      + '<div class="cb-left"><div id="cb-preview" class="cb-preview"></div>'
      + '<button class="btn btn-sm" id="cb-random">Randomise everything</button></div>'
      + '<div class="cb-right">'
      + '<div class="cb-tabs">' + TABS.map(function (x) {
          return '<button class="cb-tab' + (tab === x.id ? ' on' : '') + '" data-tab="' + x.id + '">' + x.label + '</button>';
        }).join('') + '</div>'
      + '<div class="cb-scroll">' + swatches + sections + '</div>'
      + '</div></div>';
  }

  function paint() {
    modal.el.querySelector('.modal-body').innerHTML = body();
    bind();
    paintPreview();
    // thumbnails after the frame, so the panel appears immediately
    requestAnimationFrame(function () {
      modal.el.querySelectorAll('[data-t]').forEach(function (el) {
        var parts = el.getAttribute('data-t').split('|');
        thumb(el, parts[0], parts[1]);
      });
    });
  }

  function bind() {
    modal.el.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.getAttribute('data-tab'); audio('playKeyPop'); paint(); });
    });
    modal.el.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-cat'), v = b.getAttribute('data-var') || null;
        if (v === null) delete ch.parts[cat]; else ch.parts[cat] = v;
        // pick a numbered sub-shape for the new part, if it has any
        var man = P().manifest();
        if (v && man[cat] && man[cat][v]) {
          var nums = Object.keys(man[cat][v]).filter(function (k) { return /^n\d+$/.test(k); });
          ch.numVariant = ch.numVariant || {};
          if (nums.length) ch.numVariant[cat] = nums[Math.floor(Math.random() * nums.length)];
          else delete ch.numVariant[cat];
        }
        audio('playKeyPop');
        paint();
      });
    });
    modal.el.querySelectorAll('[data-tint]').forEach(function (b) {
      b.addEventListener('click', function () {
        ch.tints[b.getAttribute('data-tint')] = b.getAttribute('data-colour');
        audio('playKeyPop');
        paint();
      });
    });
    var rnd = modal.el.querySelector('#cb-random');
    if (rnd) rnd.addEventListener('click', function () {
      ch = P().generate('build-' + Math.random().toString(36).slice(2, 8), {});
      audio('playSuccessChime');
      paint();
    });
  }

  /** @param start  an existing character to edit, or null for a fresh one */
  function open(start, done) {
    onDone = done;
    if (!P().manifest()) { P().load().then(function () { open(start, done); }); return; }
    ch = start || null; ensure();
    tab = 'face';
    modal = UI.modal('<div class="modal-head"><h3>Build your character</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">Every piece is yours to pick. '
      + 'Portraits from <a href="https://lyime.itch.io/pixel-portrait-creator" target="_blank" rel="noopener">Pixel Portrait Creator</a> by Lyime.</div></div>'
      + '<div class="modal-body"></div>'
      + '<div class="modal-foot"><button class="btn" data-close>Cancel</button>'
      + '<button class="btn btn-primary" id="cb-done">That is me</button></div>', { sticky: true });
    paint();
    modal.el.querySelector('#cb-done').addEventListener('click', function () {
      modal.close();
      if (onDone) onDone(ch);
    });
  }

  window.TechOpsCharBuild = { open: open };
})(window);
