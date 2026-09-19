/**
 * TechOps Budapest — who you are looking at.
 *
 * Portraits are clickable everywhere. For a customer it opens what you know
 * about them, which is the information that decides whether a part is the
 * right part. For the player it opens their own record.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var fmt  = window.techOpsFmt;
  var esc  = function (s) { return UI.esc(s); };

  function customerCard(person, ticket) {
    var uc = window.TechOpsCustomers.useCase(person.useCase) || {};
    var t = ticket;

    var known = t ? [
      ['Machine', J.machine(t).name],
      ['What they use it for', uc.label],
      ['Budget', fmt(t.budgetFt)],
      ['Wants it in', t.urgencyDays + ' day' + (t.urgencyDays === 1 ? '' : 's')],
      ['Waited so far', J.turnaroundDays(t) + ' day' + (J.turnaroundDays(t) === 1 ? '' : 's')]
    ] : [['What they use it for', uc.label]];

    var past = (Shop.state.history || []).filter(function (h) { return h.customer === person.name; });

    return '<div class="modal-head"><div style="display:flex;align-items:center;gap:14px">'
      + '<div class="cust-avatar" style="width:72px;height:72px">' + UI.face(person, 72) + '</div>'
      + '<div><h3>' + esc(person.name) + '</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">' + esc(person.tag || '')
      + (person.age ? ' · ' + person.age : '') + '</div></div></div></div>'
      + '<div class="modal-body">'
      + (uc.blurb ? '<div class="note teach" style="margin-bottom:14px">' + esc(uc.blurb) + '</div>' : '')
      + '<div class="disk-rows">' + known.map(function (k) {
          return '<div class="disk-row"><span class="k">' + esc(k[0]) + '</span><span class="v">' + esc(String(k[1])) + '</span></div>';
        }).join('') + '</div>'
      + (t ? '<div class="card-head" style="margin-top:16px">What they told you</div>'
           + '<div class="quote-bubble" style="font-style:normal">' + esc(t.complaint) + '</div>'
           + (t.asked && t.asked.length
               ? '<div style="font-size:12.3px;color:var(--ink-2);margin-top:8px">You have asked them '
                 + t.asked.length + ' question' + (t.asked.length === 1 ? '' : 's') + '.</div>'
               : '<div class="note warn" style="margin-top:8px">You have not asked them anything yet.</div>')
         : '')
      + (past.length
          ? '<div class="card-head" style="margin-top:16px">You have worked for them before</div><div class="disk-rows">'
            + past.slice(0, 5).map(function (h) {
                return '<div class="disk-row"><span class="k">day ' + h.day + '</span><span>' + esc(h.fault)
                  + '</span><span class="v">' + '★'.repeat(h.stars) + '</span></div>';
              }).join('') + '</div>'
          : '')
      + '</div><div class="modal-foot"><button class="btn" data-close>Close</button></div>';
  }

  var TAB = 'you';

  function guideBody() {
    return '<div class="note" style="margin-bottom:12px"><b>The loop</b><br>'
      + '<b>1 &middot; Counter</b> — pick a job. The budget and the deadline are part of the puzzle.<br>'
      + '<b>2 &middot; The sit-down</b> — ask before you open anything. A question costs 0.1 h; a memory test costs 1.5 h.<br>'
      + '<b>3 &middot; Bench &amp; macOS lab</b> — measure only what the answers pointed at. Testing everything costs the customer a day.<br>'
      + '<b>4 &middot; Parts market</b> — buy what the measurements justify, and check with the customer first.<br>'
      + '<b>5 &middot; Bench</b> — right driver, battery off first, part into the board.<br>'
      + '<b>6 &middot; Handover</b> — set your price and find out what they thought.</div>'

      + '<div class="card-head" style="margin-top:16px">How a job is judged</div>'
      + '<div class="disk-rows">'
      + [['Right part for this person', 'Does it fit the machine AND suit what they actually do?'],
         ['Respected their money', 'Within budget, and nothing sold that was not needed.'],
         ['Turnaround', 'Delivery time and your own bench hours both count.'],
         ['Still working next year', 'Cheap with no warranty is a bet you are making on their behalf.'],
         ['Safe, tidy workmanship', 'Strap on, battery off, right driver, connectors lifted straight.']]
        .map(function (r) {
          return '<div class="disk-row"><span class="k">' + r[0] + '</span><span style="font-size:12px">' + r[1] + '</span></div>';
        }).join('') + '</div>'
      + '<div class="note teach" style="margin-top:12px">A job is only as good as its <b>worst</b> axis. '
      + 'You cannot make up for the wrong part by being fast.</div>'

      + '<div class="card-head" style="margin-top:16px">Three things worth knowing</div>'
      + '<div class="note" style="margin-bottom:7px"><b>Some faults need no parts.</b> A full disk, lint in a port, '
      + 'a pop-up claiming three viruses — selling hardware for those works, and it is still the worst thing you can do to someone.</div>'
      + '<div class="note" style="margin-bottom:7px"><b>Check the bus before you buy.</b> A 7000 MB/s drive in a slot that '
      + 'runs at 1700 is money the machine physically cannot use.</div>'
      + '<div class="note"><b>Unplugging the battery turns the machine off.</b> Read the disk, the memory and the storage '
      + '<i>before</i> you open it, or you throw that away until you plug it back in.</div>'

      + '<div class="card-head" style="margin-top:16px">Credits</div>'
      + '<p style="font-size:12.3px;color:var(--ink-2)">Character portraits are built from the '
      + '<a href="https://lyime.itch.io/pixel-portrait-creator" target="_blank" rel="noopener">Pixel Portrait Creator</a> by <b>Lyime</b>.</p>';
  }

  function playerCard() {
    var S = Shop.state, p = S.player || {};
    var bg = window.TechOpsPeople.background(p.background);
    var avg = S.jobsDone ? (S.starsTotal / S.jobsDone) : 0;
    return '<div class="modal-head"><div style="display:flex;align-items:center;gap:14px">'
      + '<button class="cust-avatar avatar-edit" id="d-face" title="Click to change how you look" '
      + 'style="width:72px;height:72px;padding:0;border:none">'
      + '<div class="pface" data-noclick="1" data-seed="' + esc(p.avatar || 'ava-1') + '" data-size="72"></div>'
      + '<span class="avatar-edit-hint">edit</span></button>'
      + '<div><h3>' + esc(p.name || 'You') + '</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">' + esc(p.shop || '') + '</div></div></div></div>'
      + '<div class="modal-body">'
      + (bg ? '<div class="note" style="margin-bottom:14px"><b>' + esc(bg.name) + '</b><br>' + esc(bg.blurb) + '</div>' : '')
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:9px">'
      + '<div class="constraint"><div class="k">Jobs</div><div class="v">' + S.jobsDone + '</div></div>'
      + '<div class="constraint"><div class="k">Average</div><div class="v">' + (avg ? avg.toFixed(1) + '★' : '—') + '</div></div>'
      + '<div class="constraint"><div class="k">Till</div><div class="v">' + fmt(S.cashFt) + '</div></div>'
      + '<div class="constraint"><div class="k">Reputation</div><div class="v">' + Math.round(S.reputation) + '</div></div>'
      + '</div>'
      + '<div class="card-head" style="margin-top:16px">Shift</div>'
      + '<div class="disk-rows"><div class="disk-row"><span class="k">Code</span><span class="v">' + esc(S.shiftCode) + '</span></div>'
      + '<div class="disk-row"><span class="k">Day</span><span class="v">' + S.day + '</span></div></div>'

      + '<div class="card-head" style="margin-top:18px">Change how you look</div>'
      + '<div class="dossier-actions">'
      + '<button class="btn" id="d-build">Build my face, piece by piece</button>'
      + '<button class="btn" id="d-rechar">Change name, shop and background</button>'
      + '</div>'
      + '<p style="font-size:12.2px;color:var(--ink-3);margin-top:8px">Changing your face or your name keeps everything you have earned. '
      + 'Starting a whole new shift is further down, under <b>Record</b>.</p>'
      + '</div>';
  }

  /** Everything about you, your shop and the rules, behind one set of tabs. */
  function book() {
    var S = Shop.state;
    var tabs = [['you', 'You &amp; the shop'], ['record', 'Record'], ['guide', 'How it works']];
    var body = TAB === 'guide' ? '<div class="modal-body">' + guideBody() + '</div>'
             : TAB === 'record' ? recordBody()
             : playerCard();

    return (TAB === 'you' ? '' : '<div class="modal-head"><h3>' + (TAB === 'record' ? 'Shop record' : 'How the shop works') + '</h3></div>')
      + '<div class="book-tabs">' + tabs.map(function (t) {
          return '<button class="book-tab' + (TAB === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
        }).join('') + '</div>'
      + body
      + '<div class="modal-foot">'
      + '<button class="btn" id="dossier-report">Shift report &amp; hand-in code</button>'
      + '<button class="btn btn-primary" data-close>Close</button></div>';
  }

  function recordBody() {
    var S = Shop.state;
    var hist = (S.history || []).slice(0, 10).map(function (h) {
      return '<div class="disk-row' + (h.stars >= 4 ? ' ok' : h.stars <= 2 ? ' bad' : '') + '">'
        + '<span class="k">day ' + h.day + ' &middot; ' + esc(h.customer) + '</span>'
        + '<span style="font-size:11.5px">' + esc(h.fault) + (h.declined ? ' · declined honestly' : '') + '</span>'
        + '<span class="v">' + '★'.repeat(h.stars) + '</span></div>';
    }).join('') || '<div style="color:var(--ink-3);font-size:12.5px">No jobs closed yet.</div>';

    var ups = Object.keys(S.upgrades || {});
    var upList = ups.length
      ? ups.map(function (id) {
          var u = window.TechOpsUpgrades.get(id);
          return u ? '<div class="disk-row ok"><span class="k">' + esc(u.name) + '</span><span class="v">day ' + S.upgrades[id] + '</span></div>' : '';
        }).join('')
      : '<div style="color:var(--ink-3);font-size:12.5px">Nothing fitted yet. The till is for spending.</div>';

    return '<div class="modal-body">'
      + '<div class="card-head">Jobs</div><div class="disk-rows">' + hist + '</div>'
      + '<div class="card-head" style="margin-top:16px">Fitted out</div><div class="disk-rows">' + upList + '</div>'
      + '<div class="card-head" style="margin-top:16px">Badges</div>'
      + '<div class="badge-row">' + badgeList() + '</div>'

      + '<div class="card-head" style="margin-top:18px">Shift code</div>'
      + '<p style="font-size:12.3px;color:var(--ink-2)">Any word seeds its own shop, and everyone who types the same word meets the same '
      + 'people and the same faults \u2014 so a class can compare decisions instead of luck.</p>'
      + '<div class="shift-picks">' + (window.TechOpsApp.SHIFT_CODES || []).map(function (sc) {
          return '<button class="shift-pick' + (S.shiftCode === sc.code ? ' current' : '') + '" data-shift="' + sc.code + '">'
            + '<b>' + sc.code + '</b><span>' + esc(sc.note) + '</span></button>';
        }).join('') + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:10px">'
      + '<input id="shift-in" value="' + esc(S.shiftCode) + '" style="flex:1;background:var(--bg);border:1px solid var(--line);'
      + 'border-radius:9px;padding:9px 12px;color:var(--ink);font-family:var(--mono)">'
      + '<button class="btn btn-danger" id="btn-newshift">Start a new shift</button></div>'
      + '<p style="font-size:12px;color:var(--ink-3);margin-top:6px">A new shift wipes the till, the jobs and the shop fittings. '
      + 'Your face and name are kept.</p>'

      + '<div class="card-head" style="margin-top:18px">For the teacher</div>'
      + '<button class="btn" id="d-teacher">Decode a student\u2019s shift code</button>'
      + '</div>';
  }

  function badgeList() {
    var B = window.TechOpsApp.BADGES || {};
    var got = Shop.state.badges || {};
    return Object.keys(B).map(function (k) {
      var b = B[k], has = !!got[k];
      return '<div class="badge-chip' + (has ? ' on' : '') + '" title="' + esc(b.desc) + '">'
        + '<span>' + b.icon + '</span><b>' + esc(b.name) + '</b>'
        + (has ? '<i>day ' + got[k] + '</i>' : '<i>not yet</i>') + '</div>';
    }).join('');
  }

  function open(seed) {
    var t = Shop.state.ticket;
    var person = null;

    if (t && (J.customer(t).id === seed || J.customer(t).name === seed
              || (J.customer(t).portraitSeed || '') === seed)) {
      person = J.customer(t);
    } else {
      person = window.TechOpsCustomers.get(seed);
      // Generated walk-ins live on their tickets, not in the roster.
      if (!person) {
        (Shop.state.queue || []).forEach(function (q) {
          var c = J.customer(q);
          if (c && (c.id === seed || c.name === seed)) { person = c; t = q; }
        });
      }
    }

    if (!person) { TAB = 'you'; openBook(); }
    else {
      var tk = (t && J.customer(t) === person) ? t : null;
      UI.modal(customerCard(person, tk));
    }
    if (window.TechOpsApp) window.TechOpsApp.paintFaces(document.querySelector('.modal-veil'));
  }

  function openBook() {
    var m = UI.modal(book());
    if (window.TechOpsApp) window.TechOpsApp.paintFaces(m.el);
    m.el.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        TAB = b.getAttribute('data-tab');
        m.close();
        openBook();
      });
    });
    var rep = m.el.querySelector('#dossier-report');
    if (rep) rep.addEventListener('click', function () { m.close(); window.TechOpsReport.show(); });

    function openBuilder() {
      var cur = Shop.state.player || {};
      var existing = cur.avatar ? window.TechOpsPixel.custom(cur.avatar) : null;
      m.close();
      window.TechOpsCharBuild.open(existing || null, function (built) {
        var key = 'custom-' + Math.random().toString(36).slice(2, 8);
        window.TechOpsPixel.remember(key, built);
        Shop.state.customFaces = Shop.state.customFaces || {};
        Shop.state.customFaces[key] = built;
        Shop.state.player.avatar = key;
        Shop.emit('change');
        // Repaint everything, so the new face is live without a reload.
        window.TechOpsApp.refreshAll();
        UI.toast('That is you', 'Your face is updated everywhere in the shop.', 'good');
        TAB = 'you';
        openBook();
      });
    }

    var build = m.el.querySelector('#d-build');
    if (build) build.addEventListener('click', openBuilder);
    var faceBtn = m.el.querySelector('#d-face');
    if (faceBtn) faceBtn.addEventListener('click', openBuilder);

    var rechar = m.el.querySelector('#d-rechar');
    if (rechar) rechar.addEventListener('click', function () {
      m.close();
      window.TechOpsCharacter.show(function () {
        window.TechOpsApp.refreshAll();
        TAB = 'you';
        openBook();
      }, { reset: true });
    });

    var teach = m.el.querySelector('#d-teacher');
    if (teach) teach.addEventListener('click', function () { m.close(); window.TechOpsReport.teacher(); });

    m.el.querySelectorAll('[data-shift]').forEach(function (b) {
      b.addEventListener('click', function () {
        var inp = m.el.querySelector('#shift-in');
        if (inp) inp.value = b.getAttribute('data-shift');
        m.el.querySelectorAll('[data-shift]').forEach(function (o) { o.classList.remove('current'); });
        b.classList.add('current');
      });
    });
    var ns = m.el.querySelector('#btn-newshift');
    if (ns) ns.addEventListener('click', function () {
      var keep = Shop.state.player, faces = Shop.state.customFaces;
      var code = ((m.el.querySelector('#shift-in') || {}).value || 'BUDAPEST').toUpperCase().trim();
      Shop.reset(code);
      Shop.state.player = keep;
      Shop.state.customFaces = faces;
      Shop.emit('change');
      m.close();
      window.TechOpsApp.refreshAll();
      window.TechOpsApp.go('counter');
      UI.toast('New shift', 'Shop reset on code ' + code + '. You are still you.');
    });
  }

  /** One delegated listener, so portraits added later are clickable too. */
  document.addEventListener('click', function (e) {
    var named = e.target.closest && e.target.closest('[data-person]');
    if (named) { e.stopPropagation(); open(named.getAttribute('data-person')); return; }
    var slot = e.target.closest && e.target.closest('.pface');
    if (!slot) return;
    // Inside the character builder the click means "pick this face"; on the
    // edit button it means "change my face" and that button handles itself.
    if (slot.closest('.av-pick') || slot.dataset.noclick) return;
    e.stopPropagation();
    open(slot.dataset.seed);
  });

  window.TechOpsDossier = {
    open: open,
    book: function (tab) { TAB = tab || 'you'; openBook(); }
  };
})(window);
