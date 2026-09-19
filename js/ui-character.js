/**
 * TechOps Budapest — who you are.
 *
 * The player is assembled from the same vocabulary the shop uses to
 * generate walk-ins, so the customers belong to the same world instead of
 * being a separate hand-written cast. Backgrounds change the opening
 * position a little; none of them change how a repair is judged.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var P    = window.TechOpsPeople;
  var esc  = function (s) { return UI.esc(s); };

  var draft = { name: '', avatar: '🧑‍🔧', background: null, shop: '' };

  var SHOP_NAMES = ['Bit & Bolt', 'Kábel Kft.', 'Nyolcadik Kerületi Szerviz', 'Pixel Klinika',
                    'Csavar és Chip', 'TechOps Budapest', 'Alaplap Doktor', 'Zöld Mat Szerviz'];

  function show(onDone, opts) {
    opts = opts || {};
    if (opts.reset) {
      var cur = Shop.state.player || {};
      draft = { name: cur.name || '', avatar: cur.avatar || 'ava-1',
                background: cur.background || null, shop: cur.shop || '' };
      // A new set of faces every time you come back to this screen.
      P.FACE_PRESETS.forEach(function (_, i) { P.FACE_PRESETS[i] = 'ava-' + Math.random().toString(36).slice(2, 8); });
    }
    draft.shop = draft.shop || SHOP_NAMES[Math.floor(Math.random() * SHOP_NAMES.length)];

    var avatars = P.FACE_PRESETS.map(function (a) {
      return '<button class="av-pick' + (draft.avatar === a ? ' picked' : '') + '" data-av="' + a + '">'
        + '<div class="pface" data-seed="' + esc(a) + '" data-size="54"></div></button>';
    }).join('')
      + '<button class="av-pick reroll" data-reroll title="Roll new faces">' + window.TechOpsIcons.icon('gear', 20) + '</button>'
      + '<button class="av-pick build" data-build title="Build one from scratch, part by part">'
      + window.TechOpsIcons.icon('driver', 18) + '<span>Build</span></button>';

    var bgs = P.BACKGROUNDS.map(function (b) {
      return '<button class="bg-pick' + (draft.background === b.id ? ' picked' : '') + '" data-bg="' + b.id + '">'
        + '<div class="bg-top"><span class="bg-ico">' + b.icon + '</span><b>' + esc(b.name) + '</b></div>'
        + '<div class="bg-blurb">' + esc(b.blurb) + '</div>'
        + '<div class="bg-effect">' + esc(b.effect) + '</div></button>';
    }).join('');

    var modal = UI.modal('<div class="modal-head"><h3>Before you open up</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">Who is behind the counter? The people who walk in are built from the same pieces.</div></div>'
      + '<div class="modal-body">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
      + '<label class="field"><span>Your name</span>'
      + '<input id="ch-name" placeholder="e.g. Kovács Anna" value="' + esc(draft.name) + '" maxlength="28"></label>'
      + '<label class="field"><span>Shop name</span>'
      + '<input id="ch-shop" value="' + esc(draft.shop) + '" maxlength="28"></label>'
      + '</div>'
      + '<div class="card-head">Pick a face <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-3)">'
      + '&middot; portraits from <a href="https://lyime.itch.io/pixel-portrait-creator" target="_blank" rel="noopener">Pixel Portrait Creator</a> by Lyime</span></div>'
      + '<div class="av-grid">' + avatars + '</div>'
      + '<div class="card-head" style="margin-top:18px">Where you learned</div>'
      + '<div class="bg-grid">' + bgs + '</div>'
      + '</div><div class="modal-foot">'
      + '<span id="ch-warn" style="font-size:12.5px;color:var(--amber);margin-right:auto;align-self:center"></span>'
      + '<button class="btn btn-primary" id="ch-start">Open the shop →</button></div>',
      { sticky: true });

    // The face grid is a set of empty slots until this runs.
    if (window.TechOpsApp) window.TechOpsApp.paintFaces(modal.el);
    if (window.TechOpsApp) window.TechOpsApp.paintIcons(modal.el);

    function rerender() { modal.close(); show(onDone, {}); }

    var buildBtn = modal.el.querySelector('[data-build]');
    if (buildBtn) buildBtn.addEventListener('click', function () {
      draft.name = document.getElementById('ch-name').value;
      draft.shop = document.getElementById('ch-shop').value;
      var existing = draft.avatar ? window.TechOpsPixel.custom(draft.avatar) : null;
      window.TechOpsCharBuild.open(existing || null, function (built) {
        var key = 'custom-' + Math.random().toString(36).slice(2, 8);
        window.TechOpsPixel.remember(key, built);
        Shop.state.customFaces = Shop.state.customFaces || {};
        Shop.state.customFaces[key] = built;
        draft.avatar = key;
        if (P.FACE_PRESETS.indexOf(key) === -1) P.FACE_PRESETS.unshift(key);
        Shop.emit('change');
        rerender();
      });
    });

    var reroll = modal.el.querySelector('[data-reroll]');
    if (reroll) reroll.addEventListener('click', function () {
      draft.name = document.getElementById('ch-name').value;
      draft.shop = document.getElementById('ch-shop').value;
      draft.avatar = null;
      // New seeds for the grid: same generator, different draw.
      P.FACE_PRESETS.forEach(function (_, i) {
        P.FACE_PRESETS[i] = 'ava-' + Math.random().toString(36).slice(2, 8);
      });
      if (window.sekAudio) window.sekAudio.playKeyPop();
      rerender();
    });

    modal.el.querySelectorAll('[data-av]').forEach(function (b) {
      b.addEventListener('click', function () {
        draft.avatar = b.getAttribute('data-av');
        modal.el.querySelectorAll('[data-av]').forEach(function (o) { o.classList.remove('picked'); });
        b.classList.add('picked');
        if (window.sekAudio) window.sekAudio.playKeyPop();
      });
    });
    modal.el.querySelectorAll('[data-bg]').forEach(function (b) {
      b.addEventListener('click', function () {
        draft.background = b.getAttribute('data-bg');
        modal.el.querySelectorAll('[data-bg]').forEach(function (o) { o.classList.remove('picked'); });
        b.classList.add('picked');
        if (window.sekAudio) window.sekAudio.playKeyPop();
      });
    });

    document.getElementById('ch-start').addEventListener('click', function () {
      var name = document.getElementById('ch-name').value.trim();
      var shopName = document.getElementById('ch-shop').value.trim();
      var warn = document.getElementById('ch-warn');
      if (!name) { warn.textContent = 'Put your name in — it goes on the hand-in code.'; return; }
      if (!draft.avatar) { warn.textContent = 'Pick a face.'; return; }
      if (!draft.background) { warn.textContent = 'Pick where you learned.'; return; }

      var S = Shop.state;
      S.studentName = name;
      S.player = { name: name, avatar: draft.avatar, background: draft.background, shop: shopName || 'TechOps Budapest' };
      var bg = P.background(draft.background);
      if (bg && !S.backgroundApplied) { bg.apply(S); S.backgroundApplied = true; }
      Shop.emit('change');
      modal.close();
      if (window.sekAudio) window.sekAudio.playSuccessChime();
      UI.toast('Welcome to ' + S.player.shop, bg ? bg.effect : '', 'good');
      if (onDone) onDone();
    });
  }

  window.TechOpsCharacter = { show: show };
})(window);
