/**
 * TechOps Budapest — pixel portraits.
 *
 * Built from the layered 64×64 sprite pack in assets/pixel_portrait.
 * Convention in that pack:
 *   <name>L.png   line art, single dark colour — drawn as-is
 *   <name>C.png   colour base, a greyscale ramp — normalised then multiplied
 *                 by a tint, which is what lets one hair sprite be any colour
 *   <name>1..4    small accent details, drawn untinted
 *
 * Everything composites into one canvas so a portrait is a single element.
 */
(function (window) {
  'use strict';

  var BASE = 'assets/pixel_portrait/Assets/Sprites/';
  var SIZE = 64;

  var manifest = null;
  var imgCache = {};
  var tintCache = {};

  function load(path) {
    if (imgCache[path]) return imgCache[path];
    imgCache[path] = new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = BASE + path;
    });
    return imgCache[path];
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    if (window.TechOpsPixelManifest) {
      manifest = window.TechOpsPixelManifest;
      return Promise.resolve(manifest);
    }
    return fetch('js/pixel-manifest.json?v=' + (window.TECHOPS_BUILD || '1')).then(function (r) { return r.json(); }).then(function (m) {
      manifest = m; return m;
    }).catch(function (e) {
      if (window.TechOpsPixelManifest) {
        manifest = window.TechOpsPixelManifest;
        return manifest;
      }
      throw e;
    });
  }

  /**
   * Normalise a colour-base sprite against its own brightest pixel, then
   * multiply by `tint`. Normalising is what makes the body sprites (already
   * skin-coloured) and the hair sprites (near-white) behave the same.
   */
  function tinted(img, tint, key) {
    var ck = key + '|' + tint;
    if (tintCache[ck]) return tintCache[ck];

    var c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, 0, SIZE, SIZE);

    var d = x.getImageData(0, 0, SIZE, SIZE);
    var p = d.data, maxL = 1;
    for (var i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 8) continue;
      var l = Math.max(p[i], p[i + 1], p[i + 2]);
      if (l > maxL) maxL = l;
    }
    var tr = parseInt(tint.slice(1, 3), 16),
        tg = parseInt(tint.slice(3, 5), 16),
        tb = parseInt(tint.slice(5, 7), 16);
    for (var j = 0; j < p.length; j += 4) {
      if (p[j + 3] < 8) continue;
      p[j]     = Math.min(255, (p[j]     / maxL) * tr);
      p[j + 1] = Math.min(255, (p[j + 1] / maxL) * tg);
      p[j + 2] = Math.min(255, (p[j + 2] / maxL) * tb);
    }
    x.putImageData(d, 0, 0);
    tintCache[ck] = c;
    return c;
  }

  // ── palettes ────────────────────────────────────────────────────────
  var SKIN  = ['#f7d9c0','#f0c8a8','#e3ad86','#d29468','#b87a4e','#9c6039','#7b4628','#5d3320','#fae3d0','#c9996f'];
  var HAIR  = ['#2a2320','#3d2b22','#5a3a24','#7d5230','#a6753f','#c9a05c','#e3cb90','#9a9a9a','#cfcfcf','#f2f2f2',
               '#7a2e1f','#b03a2e','#ff5fa8','#a24bff','#3fa0ff','#22c38c','#ff7a35','#f2d040','#ff2d55','#00d5e0'];
  var IRIS  = ['#4a3526','#6b4a2e','#2f5d7a','#3f7a5c','#6b4f7a','#8a8f98','#1f2933','#b0562e','#2e8b8b'];
  var LIP   = ['#b4564f','#c2685f','#d4837a','#a04a45','#8c3f3a','#d94f7a','#7a2f5f','#3b2b2b'];
  var CLOTH = ['#2c3444','#3a2f45','#243b36','#44303a','#1f2a3a','#3f3a2c','#2b2b33','#5a3f2c','#334a5c','#4a3350'];

  /** Which tint each category takes. */
  var TINT_OF = {
    body: 'skin', ears: 'skin',
    backhair: 'hair', basehair: 'hair', bangs: 'hair', eyebrows: 'hair',
    eyes: 'iris', mouth: 'lip',
    inner: 'inner', outer: 'outer',
    extra: 'accent', access: null, misc: null, makeup: null, nose: null, bg: null
  };

  /** Back-to-front. Anything not listed is skipped. */
  var ORDER = ['backhair', 'body', 'ears', 'inner', 'outer', 'misc',
               'eyes', 'eyebrows', 'nose', 'mouth', 'makeup',
               'basehair', 'bangs', 'extra', 'access'];

  function rngFrom(seed) {
    var h = 2166136261, s = String(seed);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    var v = h >>> 0;
    return function () { v ^= v << 13; v >>>= 0; v ^= v >> 17; v ^= v << 5; v >>>= 0; return v / 4294967296; };
  }
  function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function maybe(rnd, p) { return rnd() < p; }

  /** Archetypes bias which sprites get drawn, so a pensioner is not an egirl. */
  var ARCH = {
    egirl:        { hairDye: 0.8,  access: 0.55, extra: 0.6,  makeup: 0.9,  misc: 0.5, outer: 0.5 },
    eboy:         { hairDye: 0.5,  access: 0.5,  extra: 0.45, makeup: 0.25, misc: 0.45, outer: 0.6 },
    normie:       { hairDye: 0.08, access: 0.25, extra: 0.2,  makeup: 0.25, misc: 0.35, outer: 0.5 },
    professional: { hairDye: 0.04, access: 0.35, extra: 0.12, makeup: 0.3,  misc: 0.3, outer: 0.7 },
    artsy:        { hairDye: 0.45, access: 0.4,  extra: 0.5,  makeup: 0.45, misc: 0.45, outer: 0.55 },
    kid:          { hairDye: 0.1,  access: 0.2,  extra: 0.3,  makeup: 0.1,  misc: 0.5, outer: 0.4 },
    elder:        { hairDye: 0.03, access: 0.5,  extra: 0.1,  makeup: 0.15, misc: 0.85, outer: 0.65, grey: 0.9 },
    sporty:       { hairDye: 0.15, access: 0.2,  extra: 0.2,  makeup: 0.15, misc: 0.3, outer: 0.45 }
  };

  /**
   * @param seed  string — same seed, same face
   * @param opts  { archetype, age }
   */
  function generate(seed, opts) {
    opts = opts || {};
    if (!manifest) return null;
    var rnd = rngFrom(seed);
    var archName = opts.archetype || pick(rnd, Object.keys(ARCH));
    var A = ARCH[archName] || ARCH.normie;
    var age = opts.age != null ? opts.age : 16 + Math.floor(rnd() * 50);

    var keys = function (cat) { return manifest[cat] ? Object.keys(manifest[cat]) : []; };

    var grey = A.grey != null ? A.grey : Math.max(0, (age - 45) / 45);
    var hairCol = maybe(rnd, A.hairDye) ? pick(rnd, HAIR.slice(12))
                : maybe(rnd, grey)      ? pick(rnd, ['#9a9a9a','#cfcfcf','#f2f2f2'])
                : pick(rnd, HAIR.slice(0, 7));

    var parts = {};
    parts.body     = pick(rnd, keys('body'));
    parts.ears     = pick(rnd, keys('ears'));
    parts.eyes     = pick(rnd, keys('eyes'));
    parts.eyebrows = pick(rnd, keys('eyebrows'));
    parts.nose     = pick(rnd, keys('nose'));
    parts.mouth    = pick(rnd, keys('mouth'));
    parts.basehair = pick(rnd, keys('basehair'));
    parts.inner    = pick(rnd, keys('inner'));
    if (maybe(rnd, 0.72)) parts.bangs    = pick(rnd, keys('bangs'));
    if (maybe(rnd, 0.40)) parts.backhair = pick(rnd, keys('backhair'));
    if (maybe(rnd, A.outer))  parts.outer  = pick(rnd, keys('outer'));
    if (maybe(rnd, A.misc))   parts.misc   = pick(rnd, keys('misc'));
    if (maybe(rnd, A.makeup)) parts.makeup = pick(rnd, keys('makeup'));
    if (maybe(rnd, A.extra))  parts.extra  = pick(rnd, keys('extra'));
    if (maybe(rnd, A.access)) parts.access = pick(rnd, keys('access'));

    // One numbered shape per category that offers them.
    var numVariant = {};
    Object.keys(parts).forEach(function (cat) {
      var L = manifest[cat] && manifest[cat][parts[cat]];
      if (!L) return;
      var nums = Object.keys(L).filter(function (k) { return /^n\d+$/.test(k); });
      if (nums.length) numVariant[cat] = pick(rnd, nums);
    });

    return {
      seed: seed, archetype: archName, age: age, parts: parts, numVariant: numVariant,
      tints: {
        skin: pick(rnd, SKIN), hair: hairCol, iris: pick(rnd, IRIS), lip: pick(rnd, LIP),
        inner: pick(rnd, CLOTH), outer: pick(rnd, CLOTH), accent: pick(rnd, HAIR.slice(12))
      }
    };
  }

  /** Composite a character onto a canvas. Resolves with the canvas. */
  function draw(ch, px) {
    px = px || 128;
    var c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;

    var jobs = [];
    ORDER.forEach(function (cat) {
      var v = ch.parts[cat];
      if (!v || !manifest[cat] || !manifest[cat][v]) return;
      var L = manifest[cat][v];                 // { C, L, O, n1..n4, x } -> paths
      var tintKey = TINT_OF[cat];
      var tint = tintKey ? ch.tints[tintKey] : null;

      // The numbered files are ALTERNATE shapes, not stacking detail — the
      // character picks one and it is drawn instead of the others.
      var variantIdx = (ch.numVariant && ch.numVariant[cat]) || null;

      if (L.C) jobs.push({ path: L.C, tint: tint, key: cat + '/' + v + '/C' });
      if (variantIdx && L[variantIdx]) jobs.push({ path: L[variantIdx] });
      if (L.O) jobs.push({ path: L.O });
      if (L.L) jobs.push({ path: L.L });
      if (!L.C && !L.L && L.x) jobs.push({ path: L.x });
    });

    return Promise.all(jobs.map(function (j) { return load(j.path); })).then(function (imgs) {
      imgs.forEach(function (im, i) {
        if (!im) return;
        var j = jobs[i];
        if (j.tint) x.drawImage(tinted(im, j.tint, j.key), 0, 0);
        else x.drawImage(im, 0, 0, SIZE, SIZE);
      });
      var outC = document.createElement('canvas');
      outC.width = px; outC.height = px;
      var ox = outC.getContext('2d');
      ox.imageSmoothingEnabled = false;
      ox.drawImage(c, 0, 0, px, px);
      return outC;
    });
  }

  /** Drop a portrait into `el` (async). Returns the character used. */
  /** Characters the player built by hand, keyed by the seed they are stored under. */
  var custom = {};
  function remember(key, ch) { custom[key] = ch; }

  function mount(el, seedOrChar, px, opts) {
    if (!manifest) {
      loadManifest().then(function () { mount(el, seedOrChar, px, opts); });
      return null;
    }
    var ch = typeof seedOrChar === 'string'
      ? (custom[seedOrChar] || generate(seedOrChar, opts))
      : seedOrChar;
    if (!ch) return null;
    draw(ch, px || 128).then(function (canvas) {
      canvas.className = 'pixel-portrait';
      el.innerHTML = '';
      el.appendChild(canvas);
    });
    return ch;
  }

  window.TechOpsPixel = {
    load: loadManifest,
    generate: generate,
    draw: draw,
    mount: mount,
    manifest: function () { return manifest; },
    remember: remember,
    custom: function (k) { return custom[k]; },
    ARCH: ARCH, SKIN: SKIN, HAIR: HAIR, IRIS: IRIS, LIP: LIP, CLOTH: CLOTH,
    ORDER: ORDER, TINT_OF: TINT_OF
  };
})(window);
