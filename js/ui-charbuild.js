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
      tints: [['skin', 'Skin'], ['iris', 'Eyes'], ['lip', 'Lips']], tones: ['nose', 'ears'] },
    { id: 'hair',    label: 'Hair',
      cats: ['basehair', 'bangs', 'backhair'],
      tints: [['hair', 'Hair colour']] },
    { id: 'clothes', label: 'Clothes',
      cats: ['inner', 'outer'],
      tints: [['inner', 'Top'], ['outer', 'Layer']] },
    { id: 'extras',  label: 'Extras',
      cats: ['access', 'extra', 'makeup', 'misc'],
      tints: [['accent', 'Accent']], tones: ['misc', 'makeup'] }
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

  var TONE_LABEL = { nose: 'Nose shade', ears: 'Ear shade', misc: 'Detail shade', makeup: 'Make-up shade' };

  var ch = null, tab = 'face', onDone = null, onCancel = null, modal = null;

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function ensure() {
    if (!ch || !ch.parts || !Object.keys(ch.parts).length) {
      ch = P().generate('build-' + Math.random().toString(36).slice(2, 8), {});
    }
    if (!ch || !ch.parts || !ch.parts.body) {
      ch = P().generate('ava-1', {}) || {
        seed: 'build-1', archetype: 'normie', age: 25,
        parts: { body: '1', ears: 'human', eyes: 'calm', eyebrows: 'calm', nose: 'straight', mouth: 'smile', basehair: 'bob', inner: 'crew' },
        numVariant: { ears: 'n1', eyes: 'n1', nose: 'n1' },
        tints: { skin: '#ffe0bd', hair: '#3a2312', iris: '#4a2f13', lip: '#c97a7e', inner: '#2b3b52', outer: '#1c2430' }
      };
    }
    ch.parts = ch.parts || {};
    ch.tints = ch.tints || {};
    if (P().normaliseTints) P().normaliseTints(ch);
    if (P().matchSkinTones) P().matchSkinTones(ch);
    return ch;
  }

  /** Render a small preview of the character with one part swapped. */
  function thumb(el, cat, variant) {
    var clone = JSON.parse(JSON.stringify(ch));
    if (variant === null) delete clone.parts[cat]; else clone.parts[cat] = variant;
    if (clone.numVariant) delete clone.numVariant[cat];
    if (P().matchSkinTones) P().matchSkinTones(clone);
    P().draw(clone, 108).then(function (c) {
      c.className = 'pixel-portrait';
      el.innerHTML = ''; el.appendChild(c);
    }).catch(function () {});
  }

  function paintPreview() {
    var host = modal ? modal.el.querySelector('#cb-preview') : document.getElementById('cb-preview');
    if (!host) return;
    if (!host.querySelector('.pixel-portrait') && !host.querySelector('.cb-loading')) {
      host.innerHTML = '<div class="cb-loading" style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--ink-3);font-size:calc(12px * var(--a11y-scale, 1))">Drawing portrait…</div>';
    }
    P().draw(ch, 320).then(function (c) {
      c.className = 'pixel-portrait';
      host.innerHTML = ''; host.appendChild(c);
    }).catch(function (e) {
      console.warn('CharBuild preview draw error:', e);
      host.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--amber);font-size:calc(11px * var(--a11y-scale, 1))">Preview unavailable</div>';
    });
  }

  function body() {
    var man = P().manifest() || (typeof window !== 'undefined' && window.TechOpsPixelManifest) || {};
    var T = TABS.filter(function (x) { return x.id === tab; })[0];

    var sections = T.cats.map(function (cat) {
      if (!man[cat]) return '';
      // Same filter the generator uses, so the grid never offers a sprite
      // that would cover the whole character in one flat colour.
      var vars = P().usable(cat);
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

    /*
     * The pack draws the nose, ears, freckles and blush in four fixed skin
     * tones rather than as recolourable layers, so these are a choice between
     * the artist's four rather than a colour picker. They follow the skin by
     * default; picking one here locks it.
     */
    var tones = (T.tones || []).map(function (cat) {
      var v = ch.parts[cat];
      var L = v && P().manifest()[cat] && P().manifest()[cat][v];
      if (!L) return '';
      var nums = Object.keys(L).filter(function (k) { return /^n\d+$/.test(k); }).sort();
      if (nums.length < 2) return '';
      var cur = (ch.numVariant || {})[cat];
      var locked = ch.toneLocked && ch.toneLocked[cat];
      return '<div class="cb-section"><div class="cb-label">' + esc(TONE_LABEL[cat] || cat) + '</div>'
        + '<button class="cb-match' + (locked ? '' : ' on') + '" data-tonematch="' + cat + '">'
          + (locked ? 'match my skin' : '\u2713 follows my skin') + '</button>'
        + '<div class="cb-swatches">' + nums.map(function (n, i) {
            return '<button class="cb-tone' + (cur === n ? ' on' : '') + '" data-tone="' + cat
              + '" data-toneval="' + n + '" title="tone ' + (i + 1) + '">' + (i + 1) + '</button>';
          }).join('') + '</div></div>';
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
      + '<div class="cb-scroll">' + swatches + tones + sections + '</div>'
      + '</div></div>';
  }

  var thumbJob = 0;

  /**
   * Full rebuild. Only for opening the builder and switching tab.
   *
   * The forty-eight option thumbnails are each a full composite of a dozen
   * sprite layers. Queued all at once they took the best part of a second on
   * this machine and far longer on a school laptop, and because the big
   * preview was queued behind them the panel sat empty until every thumbnail
   * had finished. Draw the preview on its own first, then trickle the
   * thumbnails in batches so they never hold anything up.
   */
  function paint() {
    modal.el.querySelector('.modal-body').innerHTML = body();
    bind();
    paintPreview();
    paintThumbs();
  }

  function paintThumbs() {
    var job = ++thumbJob;
    var els = [].slice.call(modal.el.querySelectorAll('[data-t]'));
    var i = 0;
    var batch = function () {
      if (job !== thumbJob) return;        // a newer paint has taken over
      var end = Math.min(els.length, i + 6);
      for (; i < end; i++) {
        var parts = els[i].getAttribute('data-t').split('|');
        thumb(els[i], parts[0], parts[1]);
      }
      if (i < els.length) setTimeout(batch, 0);
    };
    setTimeout(batch, 40);                 // let the preview go first
  }

  /**
   * Picking something should feel instant.
   *
   * Rebuilding the whole panel on every click meant redrawing every
   * thumbnail, so the preview blanked and came back a second later and the
   * click read as having done nothing. Move the selection, repaint the one
   * portrait that changed, and leave the rest of the DOM alone.
   */
  function update(opts) {
    opts = opts || {};
    modal.el.querySelectorAll('[data-cat]').forEach(function (b) {
      var cat = b.getAttribute('data-cat'), v = b.getAttribute('data-var') || null;
      b.classList.toggle('on', (ch.parts[cat] || null) === v);
    });
    modal.el.querySelectorAll('[data-tint]').forEach(function (b) {
      b.classList.toggle('on', ch.tints[b.getAttribute('data-tint')] === b.getAttribute('data-colour'));
    });
    modal.el.querySelectorAll('[data-tone]').forEach(function (b) {
      var cat = b.getAttribute('data-tone');
      b.classList.toggle('on', (ch.numVariant || {})[cat] === b.getAttribute('data-toneval'));
    });
    modal.el.querySelectorAll('[data-tonematch]').forEach(function (b) {
      var cat = b.getAttribute('data-tonematch');
      var locked = ch.toneLocked && ch.toneLocked[cat];
      b.classList.toggle('on', !locked);
      b.textContent = locked ? 'match my skin' : '\u2713 follows my skin';
    });
    paintPreview();
    // The thumbnails show each part on *your* face, so a skin change is the
    // one edit that genuinely invalidates all of them.
    if (opts.skinChanged) paintThumbs();
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
        update();
      });
    });
    modal.el.querySelectorAll('[data-tint]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-tint');
        ch.tints[key] = b.getAttribute('data-colour');
        // Changing the skin re-picks the tone of every part still following
        // it, so choosing a skin colour never leaves somebody else's nose on.
        if (key === 'skin') P().matchSkinTones(ch);
        audio('playKeyPop');
        update({ skinChanged: key === 'skin' });
      });
    });
    modal.el.querySelectorAll('[data-tone]').forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-tone');
        ch.numVariant = ch.numVariant || {};
        ch.numVariant[cat] = b.getAttribute('data-toneval');
        ch.toneLocked = ch.toneLocked || {};
        ch.toneLocked[cat] = true;
        audio('playKeyPop');
        update();
      });
    });
    modal.el.querySelectorAll('[data-tonematch]').forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-tonematch');
        if (ch.toneLocked) delete ch.toneLocked[cat];
        P().matchSkinTones(ch);
        audio('playKeyPop');
        update();
      });
    });
    var rnd = modal.el.querySelector('#cb-random');
    if (rnd) rnd.addEventListener('click', function () {
      ch = P().generate('build-' + Math.random().toString(36).slice(2, 8), {});
      audio('playSuccessChime');
      paint();
    });
  }

  /** @param start   an existing character to edit, or null for a fresh one
   *  @param done    callback when user confirms with That is me
   *  @param cancel  callback when user cancels or closes */
  function open(start, done, cancel) {
    onDone = done;
    onCancel = cancel;
    if (!P().manifest()) {
      P().load().then(function () { open(start, done, cancel); });
      return;
    }
    try {
      if (typeof start === 'string') {
        ch = P().editable(start) || P().generate(start, {});
      } else if (start) {
        ch = JSON.parse(JSON.stringify(start));
      } else {
        ch = null;
      }
    } catch (e) {
      ch = start || null;
    }
    ensure();
    tab = 'face';
    modal = UI.modal('<div class="modal-head"><h3>Build your character</h3>'
      + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">Every piece is yours to pick. '
      + 'Portraits from <a href="https://lyime.itch.io/pixel-portrait-creator" target="_blank" rel="noopener">Pixel Portrait Creator</a> by Lyime.</div></div>'
      + '<div class="modal-body"></div>'
      + '<div class="modal-foot"><button class="btn" id="cb-cancel" data-close>Cancel</button>'
      + '<button class="btn btn-primary" id="cb-done">That is me</button></div>', {
        sticky: true,
        onClose: function () {
          if (onCancel) {
            var c = onCancel;
            onCancel = null;
            c();
          }
        }
      });
    paint();
    modal.el.querySelector('#cb-done').addEventListener('click', function () {
      var saved = JSON.parse(JSON.stringify(ch));
      onCancel = null;
      modal.close();
      if (onDone) onDone(saved);
    });
  }

  window.TechOpsCharBuild = { open: open };
})(window);
