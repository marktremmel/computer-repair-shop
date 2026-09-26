/**
 * TechOps Budapest — the way in.
 *
 * Dropping a class straight onto a workbench is a lot to take in at once.
 * This is the shop from the outside: the sign lit, the door shut, and three
 * things you can do. It also gives the character you built somewhere to be
 * looked at, which is most of the reason for building one.
 *
 * The sign flickers, so it honours the "less movement" setting.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var esc  = function (s) { return UI.esc(s); };

  var BG = [
    'shop-morning', 'shop-noon', 'shop-afternoon', 'shop-golden-hour',
    'shop-evening', 'shop-dusk', 'shop-night', 'shop-overcast',
    'shop-rain', 'shop-sleet', 'shop-snow'
  ];

  /** The shop is a real place with a time of day, even before you go in. */
  function backdrop() {
    var a11y = window.TechOpsA11y && window.TechOpsA11y.state ? window.TechOpsA11y.state() : null;
    if (a11y && a11y.backdrop && a11y.backdrop !== 'auto') {
      var k = a11y.backdrop;
      if (k === 'sunset') k = 'evening';
      return 'shop-' + k;
    }
    return BG[Math.floor(Math.random() * BG.length)];
  }

  function show(onPlay) {
    var host = document.getElementById('title-screen');
    if (!host) return;
    var p = Shop.state.player;
    var shopName = ((p && p.shop) || '').trim();

    host.className = 'title on';
    // Resolved against the document, not the stylesheet. A relative url() in a
    // custom property is resolved where the property is *used*, which put this
    // under css/ and 404'd every time.
    var stamp = window.TECHOPS_BUILD ? '?v=' + window.TECHOPS_BUILD : '';
    var bgUrl = new URL('assets/bg/' + backdrop() + '.webp' + stamp, document.baseURI).href;
    host.style.setProperty('--title-bg', 'url("' + bgUrl + '")');
    host.innerHTML =
        '<div class="title-scrim"></div>'
      + '<div class="title-inner">'

      + '<div class="neon" role="heading" aria-level="1">'
      +   '<span class="neon-a">TechOps</span> <span class="neon-b">Budapest</span>'
      +   '<span class="neon-sub">szerviz · repair shop simulator</span>'
      + '</div>'

      + '<div class="title-row">'
      +   '<button class="opensign" id="t-play" aria-label="Open the shop and start">'
      +     '<span class="opensign-chain"></span>'
      +     '<span class="opensign-board"><b>OPEN</b><span>gyere be</span></span>'
      +   '</button>'

      +   (p
            ? '<button class="title-you" id="t-you" title="Have another look at your character">'
              + '<span class="pface title-face" data-seed="' + esc(p.avatar || 'ava-1') + '" data-size="132" data-noclick="1"></span>'
              + '<span class="title-you-name">' + esc(p.name || 'you') + '</span>'
              + (shopName ? '<span class="title-you-shop">' + esc(shopName) + '</span>' : '')
              + '<span class="title-you-edit">change</span>'
              + '</button>'
            : '<button class="title-you title-you-new" id="t-you" title="Create your technician and shop">'
              + '<span class="pface title-face" data-seed="ava-1" data-size="132" data-noclick="1"></span>'
              + '<span class="title-you-name">Build technician</span>'
              + '<span class="title-you-shop">Set up shop</span>'
              + '<span class="title-you-edit">create</span>'
              + '</button>')
      + '</div>'

      + '<div class="title-acts">'
      +   '<button class="btn btn-newgame" id="t-new" title="Clear the shift saved on this computer and set up your own shop">✨ New game</button>'
      +   '<button class="btn" id="t-access">♿ Text size &amp; contrast</button>'
      +   '<button class="btn" id="t-sound">' + (window.sekAudio && window.sekAudio.muted ? '🔇 Sound off' : '🔊 Sound on') + '</button>'
      +   '<button class="btn" id="t-tour">Show me around</button>'
      +   '<button class="btn" id="t-training">🧑‍🔧 Training ticket</button>'
      +   '<button class="btn" id="t-how">How the shop works</button>'
      + '</div>'

      + '<div class="title-foot">'
      +   '<div>A repair shop, not a quiz. Nobody tells you what is wrong '
      +   '— you ask, you measure, and you live with what you chose.</div>'
      +   '<button class="title-teacher" id="t-teacher" type="button">Teacher? Decode the class\u2019s hand-in codes</button>'
      +   (window.TECHOPS_BUILD ? '<div class="title-build-tag">build <code>' + esc(window.TECHOPS_BUILD) + '</code></div>' : '')
      + '</div>'
      + '</div>';

    if (window.TechOpsApp) window.TechOpsApp.paintFaces(host);

    // Escape backs out of the title the same way the sign does.
    var onKey = function (e) {
      if (e.key === 'Escape' && host.classList.contains('on') && !document.querySelector('.modal-veil')) {
        e.preventDefault();
        document.getElementById('t-play').click();
      }
    };
    window.addEventListener('keydown', onKey);

    var close = function () {
      window.removeEventListener('keydown', onKey);
      host.className = 'title';
      setTimeout(function () { host.innerHTML = ''; }, 320);
    };

    document.getElementById('t-play').addEventListener('click', function () {
      if (window.sekAudio) window.sekAudio.playSuccessChime();
      close();
      if (onPlay) onPlay();
    });

    var you = document.getElementById('t-you');
    if (you) you.addEventListener('click', function () {
      if (!Shop.state.player) {
        window.TechOpsCharacter.show(function () {
          show(onPlay);
        });
        return;
      }
      var curAv = (Shop.state.player && Shop.state.player.avatar) || 'ava-1';
      var existing = window.TechOpsPixel.editable(curAv);
      window.TechOpsCharBuild.open(
        existing,
        function (ch) {
          if (!ch) return;
          var key = (curAv && curAv.indexOf('custom-') === 0) ? curAv : ('custom-' + Date.now().toString(36));
          window.TechOpsPixel.remember(key, ch);
          Shop.state.customFaces = Shop.state.customFaces || {};
          Shop.state.customFaces[key] = ch;
          Shop.state.player.avatar = key;
          if (window.TechOpsPeople && window.TechOpsPeople.FACE_PRESETS.indexOf(key) === -1) {
            window.TechOpsPeople.FACE_PRESETS.unshift(key);
          }
          Shop.save();
          Shop.emit('change');
          if (window.TechOpsApp) window.TechOpsApp.refreshAll();
          show(onPlay);
        });
    });

    /*
     * A classroom computer usually still has the last student's shop on it, and
     * "start a new shift" lives three clicks deep in the dossier. This says the
     * same thing plainly on the way in, and then runs the first-time sequence:
     * build a technician and a shop, then the walk round or the training ticket.
     */
    document.getElementById('t-new').addEventListener('click', function () {
      var S = Shop.state;
      var who = (S.player && (S.player.name || '').trim()) || '';
      var shopName = (S.player && (S.player.shop || '').trim()) || '';
      var used = !!S.player || (S.jobsDone || 0) > 0 || S.day > 1;
      var fmt = window.techOpsFmt || function (n) { return n + ' Ft'; };
      var jobs = S.jobsDone || 0;
      var m = UI.modal('<div class="modal-head"><h3>' + (used ? 'Start a new game?' : 'Set up your shop') + '</h3></div>'
        + '<div class="modal-body" style="font-size:calc(13.5px * var(--a11y-scale, 1));line-height:1.6">'
        + (used
            ? '<p>There is already a shop saved on this computer'
              + (who ? ' \u2014 <b>' + esc(who) + '</b>' + (shopName ? ', ' + esc(shopName) : '') : '')
              + ': day ' + S.day + ', ' + jobs + ' job' + (jobs === 1 ? '' : 's') + ' done, ' + fmt(S.cashFt) + ' in the till.</p>'
              + '<p style="color:var(--ink-2)">A new game clears all of that on this machine and gives you your own technician, '
              + 'your own shop and a new set of customers. If it belongs to somebody who wants to carry on with it, they can '
              + 'copy their save code first from the floppy-disk button.</p>'
            : '<p>Nothing is saved on this computer yet. This builds your technician and your shop, and then shows you round.</p>')
        + '</div>'
        + '<div class="modal-foot">'
        + '<button class="btn" data-close>' + (used ? 'Leave it as it is' : 'Not now') + '</button>'
        + '<button class="btn ' + (used ? 'btn-danger' : 'btn-primary') + '" id="t-new-go">'
        + (used ? 'Clear it and start fresh' : 'Build my technician') + '</button>'
        + '</div>');
      m.el.querySelector('#t-new-go').addEventListener('click', function () {
        m.close();
        Shop.reset();                       // fresh shift and a fresh code; the saved game goes with it
        // The last student's hand-made faces are out of the save now; take them
        // out of the picker too, or they are still on offer until a reload.
        if (window.TechOpsPeople && window.TechOpsPeople.FACE_PRESETS) {
          var faces = window.TechOpsPeople.FACE_PRESETS;
          for (var i = faces.length - 1; i >= 0; i--) {
            if (String(faces[i]).indexOf('custom-') === 0) faces.splice(i, 1);
          }
        }
        if (window.TechOpsTour && window.TechOpsTour.forget) window.TechOpsTour.forget();
        if (window.TechOpsIdentity) window.TechOpsIdentity.apply();
        close();
        if (onPlay) onPlay();
        setTimeout(function () {
          var veil = document.querySelector('.modal-veil');
          if (veil) veil.remove();
          if (window.TechOpsApp) window.TechOpsApp.go('counter');
          window.TechOpsCharacter.show(function () {
            if (window.TechOpsApp) window.TechOpsApp.refreshAll();
            if (window.TechOpsTour) {
              window.TechOpsTour.offer(function () { if (window.TechOpsApp) window.TechOpsApp.briefing(); });
            } else if (window.TechOpsApp) {
              window.TechOpsApp.briefing();
            }
          }, { reset: true });
        }, 320);
      });
    });

    document.getElementById('t-access').addEventListener('click', function () {
      var m = UI.modal('<div class="modal-head"><h3>Making it easier to read</h3>'
        + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">Kept in this browser, so it stays set on this machine.</div></div>'
        + '<div class="modal-body">' + window.TechOpsA11y.panel() + '</div>'
        + '<div class="modal-foot"><button class="btn btn-primary" data-close>Done</button></div>');
      var repaint = function () {
        m.el.querySelector('.modal-body').innerHTML = window.TechOpsA11y.panel();
        window.TechOpsA11y.bind(m.el, repaint);
      };
      window.TechOpsA11y.bind(m.el, repaint);
    });

    document.getElementById('t-sound').addEventListener('click', function (e) {
      if (!window.sekAudio) return;
      window.sekAudio.toggleMute();
      e.currentTarget.textContent = window.sekAudio.muted ? '🔇 Sound off' : '🔊 Sound on';
    });

    document.getElementById('t-tour').addEventListener('click', function () {
      close();
      if (onPlay) onPlay();
      setTimeout(function () {
        var veil = document.querySelector('.modal-veil');
        if (veil) veil.remove();
        window.TechOpsTour.start(function () {});
      }, 420);
    });

    var trn = document.getElementById('t-training');
    if (trn) trn.addEventListener('click', function () {
      close();
      if (onPlay) onPlay();
      setTimeout(function () {
        var veil = document.querySelector('.modal-veil');
        if (veil) veil.remove();
        if (window.TechOpsTour && window.TechOpsTour.startTraining) {
          window.TechOpsTour.startTraining();
        }
      }, 350);
    });

    document.getElementById('t-how').addEventListener('click', function () {
      window.TechOpsDossier.book('guide');
    });

    // The teacher's own browser has no shift, so the decoder has to be
    // reachable before anyone plays.
    document.getElementById('t-teacher').addEventListener('click', function () {
      window.TechOpsReport.teacher();
    });

    document.getElementById('t-play').focus();
  }

  window.TechOpsTitle = { show: show };
})(window);
