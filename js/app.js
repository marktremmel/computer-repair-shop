/**
 * TechOps Budapest — boot and navigation.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var esc  = function (s) { return UI.esc(s); };

  /*
   * Goals.
   *
   * These started as badges with the description hidden in a tooltip, so a
   * student could not see what they were for until they had stumbled into
   * one. They are now a visible checklist of the basic habits the shop
   * teaches: each says what to do, why it matters, and how far along you are.
   * Ordered roughly the way a first shift would meet them.
   *
   * `progress(S)` returns [have, need] for anything countable.
   */
  var BADGES = {
    first_job:   { icon: '🔧', name: 'Open for business',
                   goal: 'Close your first job.',
                   why:  'Everything else starts here.',
                   progress: function (S) { return [Math.min(1, S.jobsDone || 0), 1]; } },
    asked_first: { icon: '💬', name: 'Asked before opening',
                   goal: 'Fix a job after asking at least three questions and running no more than two instruments.',
                   why:  'A question costs six minutes. Running every test costs the customer a day.' },
    honest_tech: { icon: '🤝', name: 'Told them the truth',
                   goal: 'Fix a fault that needed no parts — and sell none.',
                   why:  'Sometimes the right repair is free. Saying so is the job.' },
    grounded:    { icon: '⚡', name: 'Grounded',
                   goal: 'Finish three jobs with the ESD strap on.',
                   why:  'Static you cannot feel kills chips weeks later, long after the customer has paid.',
                   progress: function (S) { return [Math.min(3, (S.goalStats || {}).grounded || 0), 3]; } },
    on_time:     { icon: '⏱️', name: 'As promised',
                   goal: 'Hand back three jobs on or before the day you promised.',
                   why:  'Their time is part of the price. A cheap part that arrives late cost them more.',
                   progress: function (S) { return [Math.min(3, (S.goalStats || {}).onTime || 0), 3]; } },
    no_upsell:   { icon: '🪙', name: 'No upsell, twice',
                   goal: 'Be honest about needing no parts — or not being worth fixing — on two jobs.',
                   why:  'Once is luck. Twice is the habit the whole shop is built on.',
                   progress: function (S) { return [Math.min(2, S.honestRefusals || 0), 2]; } },
    said_no:     { icon: '🙅', name: 'Said no',
                   goal: 'Turn down a repair that was not worth it, and charge only for the diagnosis.',
                   why:  'Knowing when not to repair is part of repairing.' },
    measured:    { icon: '📟', name: 'Measured, not guessed',
                   goal: 'Solve a job the multimeter helped you find.',
                   why:  'A reading beats a hunch — as long as it is the right instrument for the question.' },
    five_star:   { icon: '⭐', name: 'Five stars',
                   goal: 'Get one job right on every judgement at once: part, price, time, durability and workmanship.',
                   why:  'A job is only as good as its worst side.' },
    five_jobs:   { icon: '🧰', name: 'Five machines in',
                   goal: 'Close five jobs.',
                   why:  'The shop gets easier to read the more of it you have seen.',
                   progress: function (S) { return [Math.min(5, S.jobsDone || 0), 5]; } },
    good_name:   { icon: '🏪', name: 'Word gets round',
                   goal: 'Reach a reputation of 75.',
                   why:  'A good name is what fills the counter tomorrow.',
                   progress: function (S) { return [Math.min(75, Math.round(S.reputation || 0)), 75]; } },
    chip_reader: { icon: '🔬', name: 'Reads boards',
                   goal: 'On the Chip ID bench, find five chips in a row on the real boards, each at the first try.',
                   why:  'Knowing what you are looking at is half of any repair.' }
  };

  var VIEWS = ['counter', 'intake', 'bench', 'mac', 'market', 'handover', 'chipid', 'shopfit'];

  /**
   * Curated starting words. Nothing special about them mechanically — any word
   * seeds a shop — but these are hand-checked to open with a useful lesson, so
   * a teacher can hand one to a class and know roughly what turns up.
   */
  // The notes live with the profiles that implement them (sim-ticket.js), so
  // what a student reads about a code is what the code does.
  var SHIFT_CODES = Object.keys(window.TechOpsJobs.SHIFT_PROFILES).map(function (code) {
    return { code: code, note: window.TechOpsJobs.SHIFT_PROFILES[code].note };
  });

  var App = {
    current: 'counter',

    go: function (id) {
      App.current = id;
      document.body.setAttribute('data-view', id);
      VIEWS.forEach(function (v) {
        document.getElementById('view-' + v).classList.toggle('active', v === id);
        var nav = document.querySelector('[data-view="' + v + '"]');
        if (nav) nav.classList.toggle('active', v === id);
      });
      App.renderCurrent();
      if (window.sekAudio) window.sekAudio.playKeyPop();
    },

    renderCurrent: function () {
      ({
        counter: window.TechOpsCounter,
        intake: window.TechOpsIntake,
        bench: window.TechOpsBench,
        mac: window.TechOpsMac,
        market: window.TechOpsMarket,
        handover: window.TechOpsHandover,
        chipid: window.TechOpsChipID,
        shopfit: window.TechOpsShopfit
      })[App.current].render();
      App.paintIcons();
      App.paintFaces();
      if (window.TechOpsIdentity) window.TechOpsIdentity.apply();
      App.refreshPlayerChip();
      UI.refresh();
    },

    /**
     * Hints, graded. The first two are procedure and cost nothing; the last one
     * points at the fault and costs bench time, because in the shop the way you
     * buy an answer is by spending time on it.
     */
    hints: function () {
      var t = Shop.state.ticket;
      if (!t) {
        UI.modal('<div class="modal-head"><h3>Hints</h3></div><div class="modal-body">'
          + '<p style="color:var(--ink-2)">Take a job first \u2014 hints are about the machine in front of you.</p>'
          + '</div><div class="modal-foot"><button class="btn" data-close>Close</button></div>');
        return;
      }
      var J = window.TechOpsJobs;
      var f = J.fault(t), m = J.machine(t), uc = J.useCase(t);
      t.hintsUsed = t.hintsUsed || 0;

      var steps = [];
      // 0 — can this even be done? Checked first, because a student stuck on an
      // unaffordable job will otherwise hunt for a part that does not exist.
      var cat = f.fixedBy.kind === 'part' ? f.fixedBy.cat : f.fixedBy.needsPartCat;
      if (cat) {
        var fits = window.TechOpsParts.byCat(cat).filter(function (pp) {
          return window.TechOpsParts.compat(pp, m).ok;
        });
        var min = fits.length ? Math.min.apply(null, fits.map(function (pp) { return pp.priceFt; })) : Infinity;
        if (!isFinite(min) || min > t.budgetFt) {
          steps.push({
            cost: 0, title: 'Can this job even be done?',
            body: !isFinite(min)
              ? 'No. Nothing in the catalogue both fits this machine and fixes this fault. Go to <b>Handover</b> and tell them so \u2014 there is a button for it.'
              : 'Not for their money. The cheapest part that fits and fixes it is <b>' + window.techOpsFmt(min)
                + '</b> and they have <b>' + window.techOpsFmt(t.budgetFt) + '</b>.<br><br>'
                + 'Go to <b>Handover</b> and tell them honestly. Charging a diagnosis fee and sending them away is a four-star outcome, not a failure.'
          });
        }
      }

      // 1 — what to do next, free.
      steps.push({
        cost: 0, title: 'What should I do next?',
        body: !t.asked.length
          ? 'You have not asked them anything. Go to <b>The sit-down</b> \u2014 a question costs 0.1 h and an instrument costs up to 1.5 h.'
          : !t.testsRun.length
            ? 'You have their story but no measurements. Run the instruments the answers pointed at, on the bench or in the software lab.'
            : (!t.installed.length && !t.actionsDone.length)
              ? 'You have readings. Decide what they mean, then either fit a part from the market or do the work on the bench \u2014 remember some faults need no parts at all.'
              : 'Re-run the test that found the fault to confirm the repair, then go to <b>Handover</b>.'
      });
      // 2 — how to read this machine, free.
      steps.push({
        cost: 0, title: 'What should I know about this machine?',
        body: esc(m.name) + ' \u2014 ' + esc(m.blurb)
          + '<br><br>Storage: <b>' + (m.storageSoldered ? 'soldered, not replaceable' : window.TechOpsMachines.busLabel(window.TechOpsMachines.bestBus(m))) + '</b>. '
          + 'Memory: <b>' + (m.ramSoldered ? 'soldered, not replaceable' : m.ramType.toUpperCase() + ', ' + m.ramSlots + ' slot(s)') + '</b>.'
          + '<br><br>' + esc(J.customer(t).name) + ' uses it for <b>' + esc(uc.label.toLowerCase()) + '</b>. ' + esc(uc.blurb)
      });
      // 3 — narrow the field, free but only after measuring.
      steps.push({
        cost: 0, title: 'Narrow it down for me', locked: !t.testsRun.length,
        lockedWhy: 'Measure something first. There is nothing to narrow down from a complaint alone.',
        body: (function () {
          var all = window.TechOpsFaults.forMachine(m);
          var ruled = all.filter(function (x) { return x.id !== f.id; }).slice(0, Math.max(1, all.length - 3));
          return 'On what you have measured so far you can set aside: '
            + ruled.map(function (x) { return '<b>' + esc(x.title) + '</b>'; }).join(', ')
            + '.<br><br>That still leaves more than one answer. The instrument that settles it is the one your interview pointed at.';
        })()
      });
      // 4 — the actual answer, paid for in time.
      steps.push({
        cost: 0.8, title: 'Just tell me what is wrong',
        body: '<b>' + esc(f.title) + '.</b><br><br>' + esc(f.explain)
          + '<br><br>' + (f.noPartNeeded
              ? 'This one needs <b>no parts at all</b>. Selling hardware for it is the expensive mistake.'
              : 'Fix: fit a <b>' + (f.fixedBy.cat || f.fixedBy.needsPartCat) + '</b> part that suits this machine and this person.')
      });

      var html = steps.map(function (st, i) {
        var opened = (t.hintsOpen || {})[i];
        return '<div class="hint-card' + (st.locked ? ' locked' : '') + (opened ? ' open' : '') + '">'
          + '<button class="hint-head" data-hint="' + i + '"' + (st.locked ? ' disabled' : '') + '>'
          + '<span>' + st.title + '</span>'
          + '<span class="hint-cost">' + (st.locked ? 'locked' : st.cost ? '+' + st.cost + ' h' : 'free') + '</span></button>'
          + (opened ? '<div class="hint-body">' + st.body + '</div>'
                    : st.locked ? '<div class="hint-body muted">' + st.lockedWhy + '</div>' : '')
          + '</div>';
      }).join('');

      UI.modal('<div class="modal-head"><h3>Hints</h3>'
        + '<div style="font-size:calc(12.3px * var(--a11y-scale, 1));color:var(--ink-3)">The first three are free. The last one costs bench time \u2014 the same way buying an answer works in a real shop.</div></div>'
        + '<div class="modal-body">' + html + '</div>'
        + '<div class="modal-foot"><button class="btn" data-close>Close</button></div>');

      document.querySelectorAll('[data-hint]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = +b.getAttribute('data-hint');
          t.hintsOpen = t.hintsOpen || {};
          if (!t.hintsOpen[i]) {
            t.hintsOpen[i] = true;
            if (steps[i].cost) {
              t.labourHours += steps[i].cost;
              t.hintsUsed++;
              UI.toast('Hint taken', steps[i].cost + ' h of bench time. It counts against the turnaround.', 'bad');
            }
            Shop.emit('change');
          }
          document.querySelector('.modal-veil').remove();
          App.hints();
        });
      });
    },

    briefing: function () {
      UI.modal('<div class="modal-head"><h3>TechOps Budapest</h3>'
        + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">You are running the repair shop.</div></div><div class="modal-body">'
        + '<p style="font-size:calc(13.5px * var(--a11y-scale, 1));color:var(--ink-2)">Somebody hands you a machine and tells you what they think is wrong. '
        + 'They are often wrong — that is not a trick, it is what actually happens at a counter.</p>'
        + '<div class="note" style="margin:14px 0"><b>The loop</b><br>'
        + '<b>1 · Counter</b> — pick a job. The budget and the deadline are part of the puzzle.<br>'
        + '<b>2 · The sit-down</b> — ask them questions before you open anything. A question costs 0.1 h, a memory test costs 1.5 h.<br>'
        + '<b>3 · Bench &amp; software lab</b> — measure only what the answers pointed at. Testing everything costs the customer a day.<br>'
        + '<b>4 · Market</b> — buy only what your measurements justify. Cheap, used, retail and genuine are four real answers.<br>'
        + '<b>5 · Bench</b> — right driver, battery disconnected first, part into the bay.<br>'
        + '<b>6 · Handover</b> — set your price and find out what they thought.</div>'
        + '<div class="note teach"><b>The one thing worth knowing before you start:</b> three of the ten faults in this shop '
        + 'need no parts at all. Selling somebody a drive to fix a full Downloads folder works, and it is still the worst thing you can do to them.</div>'
        + '<div class="note" style="margin-top:14px;font-size:calc(12.2px * var(--a11y-scale, 1))"><b>Credits.</b> '
        + 'Character portraits are built from the <a href="https://lyime.itch.io/pixel-portrait-creator" target="_blank" rel="noopener">'
        + 'Pixel Portrait Creator</a> by <b>Lyime</b>. The shop art, sounds and everything else are part of this material.</div>'
        + '</div><div class="modal-foot"><button class="btn btn-primary" data-close>Open the shop</button></div>');
      try { localStorage.setItem('techops-seen-briefing', '1'); } catch (e) {}
    },

    /**
     * Your face and name in the top bar, and the way into everything about you.
     * Repainted whenever it might have changed rather than once on an event
     * that may already have fired.
     */
    refreshPlayerChip: function () {
      var p = Shop.state.player;
      var host = document.getElementById('player-chip');
      if (!host) return;
      if (!p) { host.style.display = 'none'; return; }
      var sig = p.name + '|' + p.avatar;
      if (host.dataset.sig !== sig) {
        host.dataset.sig = sig;
        // Same fallback the dossier and the title use, so a player saved
        // before they picked a face still draws somebody rather than the
        // string "undefined".
        host.innerHTML = '<div class="pface" data-seed="' + esc(p.avatar || 'ava-1') + '" data-size="22"></div>'
          + '<span>' + esc(p.name) + '</span>';
        App.paintFaces(host);
      }
      host.style.display = 'flex';
      host.style.cursor = 'pointer';
      host.title = (p.shop || 'Your shop') + ' — click for your character, record and how it all works';
      host.onclick = function () { window.TechOpsDossier.book('you'); };
    },

    /**
     * Repaint the whole interface from current state. Used after anything that
     * changes how things look rather than what they are — building a face, for
     * instance — so nobody has to reload the page to see their own character.
     */
    refreshAll: function () {
      // Mark them for repainting but leave the old portrait up. `mount()`
      // swaps its canvas in only once the new one has finished drawing, so
      // blanking here made every face flash empty and come back.
      document.querySelectorAll('.pface').forEach(function (n) {
        delete n.dataset.painted;
      });
      App.refreshPlayerChip();
      App.renderCurrent();
      App.paintIcons();
      App.paintFaces();
      UI.refresh();
    },

    /** Fill every .pface slot with its pixel portrait once sprites are ready. */
    paintFaces: function (root) {
      if (!window.TechOpsPixel) return;
      window.TechOpsPixel.load().then(function () {
        (root || document).querySelectorAll('.pface').forEach(function (n) {
          if (n.dataset.painted) return;
          n.dataset.painted = '1';
          var px = +(n.dataset.size || 44);
          n.style.width = px + 'px'; n.style.height = px + 'px';
          window.TechOpsPixel.mount(n, n.dataset.seed, px * 2, {
            archetype: n.dataset.arch || undefined,
            age: n.dataset.age ? +n.dataset.age : undefined
          });
        });
      });
    },

    /** Replace every <i data-ic="name"> placeholder with its drawn icon. */
    paintIcons: function (root) {
      (root || document).querySelectorAll('i[data-ic]').forEach(function (n) {
        if (n.firstChild) return;
        n.innerHTML = window.TechOpsIcons.icon(n.getAttribute('data-ic'), +(n.dataset.size || 18));
      });
    },

    boot: function () {
      console.info('TechOps Budapest build ' + (window.TECHOPS_BUILD || 'dev'));
      Shop.init();
      if (window.TechOpsJobs.repairComplaints(Shop)) Shop.save();
      Shop.state.pendingComebacks = Shop.state.pendingComebacks || [];
      Shop.state.upgrades = Shop.state.upgrades || {};
      // Hand-built faces are stored whole, so they survive a reload.
      if (Shop.state.customFaces && window.TechOpsPixel) {
        Object.keys(Shop.state.customFaces).forEach(function (k) {
          window.TechOpsPixel.remember(k, Shop.state.customFaces[k]);
          if (window.TechOpsPeople && window.TechOpsPeople.FACE_PRESETS.indexOf(k) === -1) {
            window.TechOpsPeople.FACE_PRESETS.unshift(k);
          }
        });
      }
      if (window.TechOpsUpgrades) window.TechOpsUpgrades.rebuildPerks(Shop.state);

      document.querySelectorAll('[data-view]').forEach(function (b) {
        b.addEventListener('click', function () { App.go(b.getAttribute('data-view')); });
      });
      var pChip = document.getElementById('player-chip');
      if (pChip) pChip.addEventListener('click', function () { window.TechOpsDossier.book('you'); });
      var btnSave = document.getElementById('btn-save');
      if (btnSave) btnSave.addEventListener('click', function () { window.TechOpsDossier.book('save'); });
      document.getElementById('btn-badges').addEventListener('click', function () {
        window.TechOpsDossier.book('record');
      });
      document.getElementById('btn-report').addEventListener('click', function () { window.TechOpsReport.show(); });

      Shop.on('change', App.refreshPlayerChip);
      document.getElementById('btn-access').addEventListener('click', function () {
        var m = UI.modal('<div class="modal-head"><h3>Making it easier to read</h3>'
          + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">Kept in this browser, so it stays set on this machine.</div></div>'
          + '<div class="modal-body">' + window.TechOpsA11y.panel() + '</div>'
          + '<div class="modal-foot"><button class="btn btn-primary" data-close>Done</button></div>');
        // Re-render so the switches show their new state, then re-bind.
        var repaint = function () {
          m.el.querySelector('.modal-body').innerHTML = window.TechOpsA11y.panel();
          window.TechOpsA11y.bind(m.el, repaint);
        };
        window.TechOpsA11y.bind(m.el, repaint);
      });

      document.getElementById('btn-help').addEventListener('click', function () {
        window.TechOpsDossier.book('guide');
      });
      // Shift-click the help button for the walk round again. Also offered as
      // a button inside the guide itself.
      document.getElementById('btn-help').addEventListener('click', function (e) {
        if (e.shiftKey && window.TechOpsTour) {
          var veil = document.querySelector('.modal-veil');
          if (veil) veil.remove();
          window.TechOpsTour.start(function () {});
        }
      });
      var br = document.getElementById('btn-breather');
      if (br) br.addEventListener('click', function () { window.TechOpsBreather.show(); });

      var hb = document.getElementById('btn-hints');
      if (hb) hb.addEventListener('click', App.hints);

      var mute = document.getElementById('btn-mute');
      mute.addEventListener('click', function () {
        if (!window.sekAudio) return;
        window.sekAudio.toggleMute();
        if (window.sekAudio.muted && window.TechOpsVoice) window.TechOpsVoice.stop();
        if (window.sekAudio.muted && window.TechOpsBreather) window.TechOpsBreather.stop();
        mute.innerHTML = window.TechOpsIcons.icon(window.sekAudio.muted ? 'speakerOff' : 'speaker', 18);
      });

      Shop.on('badge', function (id) {
        var b = BADGES[id];
        if (b) UI.toast(b.icon + ' Goal reached — ' + b.name, b.why, 'good');
      });
      Shop.on('change', function () {
        UI.refresh(); App.paintFaces();
        if (window.TechOpsIdentity) window.TechOpsIdentity.apply();
      });

      App.paintIcons();
      App.paintFaces();
      App.refreshPlayerChip();
      UI.refresh();
      App.go(Shop.state.ticket ? (Shop.state.ticket.asked && Shop.state.ticket.asked.length ? 'bench' : 'intake') : 'counter');

      /*
       * The shop from the outside first, every time.
       *
       * Walking a class straight onto a workbench is a lot at once, and a
       * character you built deserves somewhere to be looked at. The title
       * screen is also where the access settings live, so somebody who needs
       * larger text can find it before they need to read anything.
       */
      var start = function () {
        var afterSetup = function () {
          App.refreshAll();
          // Offered once, skippable, and never in the way of somebody who
          // already knows where everything is.
          if (window.TechOpsTour && !window.TechOpsTour.seen()) {
            window.TechOpsTour.offer(function () { App.briefing(); });
          } else {
            App.briefing();
          }
        };
        if (!Shop.state.player) {
          window.TechOpsCharacter.show(afterSetup);
        } else if (window.TechOpsTour && !window.TechOpsTour.seen()) {
          window.TechOpsTour.offer(function () {});
        }
      };
      if (window.TechOpsTitle) {
        setTimeout(function () { window.TechOpsTitle.show(start); }, 120);
      } else {
        setTimeout(start, 260);
      }
    }
  };

  App.BADGES = BADGES;
  App.SHIFT_CODES = SHIFT_CODES;
  window.TechOpsApp = App;
  document.addEventListener('DOMContentLoaded', App.boot);
})(window);
