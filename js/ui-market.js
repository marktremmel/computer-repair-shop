/**
 * TechOps Budapest — the parts market.
 *
 * Every card shows its own pitch AND its own catch, because in a real
 * shop both are true. What the market will not tell you is which one is
 * right for the person waiting at the counter.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var P    = window.TechOpsParts;
  var fmt  = window.techOpsFmt;
  var esc  = function (s) { return UI.esc(s); };

  var cat = 'storage';
  var CATS = [
    { id: 'storage', label: 'Storage' }, { id: 'ram', label: 'Memory' },
    { id: 'battery', label: 'Battery' }, { id: 'screen', label: 'Display' },
    { id: 'thermal', label: 'Thermal' }, { id: 'fan', label: 'Fan' },
    { id: 'flex',    label: 'Flex' }
  ];

  function chips(p, machine) {
    var out = [];
    var s = p.spec;
    if (p.cat === 'storage') {
      out.push(['hi', s.capacityGB >= 1000 ? (s.capacityGB / 1000) + ' TB' : s.capacityGB + ' GB']);
      out.push([s.tech === 'hdd' ? 'bad' : '', s.tech.toUpperCase()]);
      out.push([s.seqMBps > 1000 ? 'hi' : '', s.seqMBps + ' MB/s']);
      out.push(['', window.TechOpsMachines.busLabel(s.bus)]);
    } else if (p.cat === 'ram') {
      out.push(['hi', s.totalGB + ' GB']);
      out.push(['', s.type.toUpperCase()]);
      out.push([s.sticks === 2 ? 'hi' : 'warn', s.sticks === 2 ? '2 sticks · dual channel' : '1 stick · single channel']);
    } else if (p.cat === 'battery') {
      out.push([s.capacityPct < 100 ? 'warn' : 'hi', s.capacityPct + '% of design']);
      out.push([s.reportsHealth ? 'hi' : 'bad', s.reportsHealth ? 'reports health' : 'no health data']);
    } else if (p.cat === 'screen') {
      out.push([s.panel === 'OLED' ? 'hi' : s.panel === 'LCD' ? 'warn' : '', s.panel]);
      out.push(['', s.nits + ' nits']);
      out.push([s.trueTone ? 'hi' : 'warn', s.trueTone ? 'True Tone kept' : 'no True Tone']);
    } else if (p.cat === 'thermal') {
      out.push(['hi', s.conductivity + ' W/m·K']);
      out.push([s.conductive ? 'bad' : '', s.conductive ? 'electrically conductive' : 'non-conductive']);
      out.push(['', '−' + s.tempDropC + ' °C']);
    } else if (p.cat === 'fan') {
      out.push([s.noiseDb > 34 ? 'warn' : 'hi', s.noiseDb + ' dB']);
    }
    out.push([p.warrantyMonths === 0 ? 'bad' : p.warrantyMonths >= 24 ? 'hi' : '',
              p.warrantyMonths === 0 ? 'no warranty' : p.warrantyMonths >= 999 ? 'lifetime warranty' : p.warrantyMonths + ' mo warranty']);
    return out.map(function (c) { return '<span class="chip ' + c[0] + '">' + esc(c[1]) + '</span>'; }).join('');
  }

  /**
   * Before spending the customer's money you tell them what it costs and when
   * they get the machine back — and they can say no. This is the conversation
   * a real shop has, and it is where "cheap but three weeks" gets refused.
   */
  function proposeToCustomer(p, onAccept) {
    var t = Shop.state.ticket;
    if (!t) { onAccept(); return; }
    var c = J.customer(t), uc = J.useCase(t);

    var dd = effectiveDelivery(p);
    var arriveDay = Shop.state.day + dd;
    var totalWait = J.turnaroundDays(t) + dd;
    var likelyBill = Math.round((t.partsCostFt + p.priceFt + (t.labourHours + 1) * 5000) / 500) * 500;
    var overBudget = likelyBill > t.budgetFt;
    var tooSlow    = totalWait > t.urgencyDays;

    // How they react is driven by the same sensitivities that score the job.
    var refuses = (overBudget && uc.priceSensitivity > 0.75 && likelyBill > t.budgetFt * 1.15)
               || (tooSlow && uc.speedSensitivity > 0.75 && totalWait > t.urgencyDays + 1);

    var reply = refuses
      ? (tooSlow
          ? '"' + (dd > 10 ? 'Three weeks?' : totalWait + ' days?') + ' No. I told you I need it in '
            + t.urgencyDays + '. Find me something that gets here sooner, even if it costs more."'
          : '"That is more than I have. I said ' + fmt(t.budgetFt) + ' and I meant it. Find me something cheaper."')
      : (tooSlow
          ? '"That is longer than I wanted, but fine \u2014 as long as it is done properly."'
          : overBudget
            ? '"Bit more than I hoped. Go on then, if that is what it needs."'
            : '"That sounds fair. Go ahead."');

    UI.modal('<div class="modal-head">'
      + '<div style="display:flex;align-items:center;gap:12px">'
      + '<div class="cust-avatar" style="width:48px;height:48px">' + UI.face(c, 48) + '</div>'
      + '<div><h3>Checking with ' + esc(c.name) + '</h3>'
      + '<div style="font-size:12.3px;color:var(--ink-3)">Budget ' + fmt(t.budgetFt) + ' \u00b7 wanted it in ' + t.urgencyDays + ' days</div></div></div></div>'
      + '<div class="modal-body">'
      + '<div class="note" style="margin-bottom:14px"><b>' + esc(p.name) + '</b><br>'
      + esc(P.vendors[p.vendor].name) + ' \u00b7 ' + fmt(p.priceFt) + '</div>'
      + '<div class="disk-rows">'
      + '<div class="disk-row' + (tooSlow ? ' bad' : ' ok') + '"><span class="k">Part arrives</span>'
      + '<span>' + (dd === 0 ? 'today, from your own shelf' : 'day ' + arriveDay) + '</span>'
      + '<span class="v">' + (dd === 0 ? 'same day' : '+' + dd + ' days') + '</span></div>'
      + '<div class="disk-row' + (tooSlow ? ' bad' : ' ok') + '"><span class="k">They get it back after</span>'
      + '<span>they asked for ' + t.urgencyDays + '</span>'
      + '<span class="v">' + totalWait + ' days</span></div>'
      + '<div class="disk-row' + (overBudget ? ' bad' : ' ok') + '"><span class="k">Likely final bill</span>'
      + '<span>parts + your time so far</span><span class="v">' + fmt(likelyBill) + '</span></div>'
      + '</div>'
      + '<div class="quote-bubble" style="margin-top:14px;font-style:normal">' + esc(reply) + '</div>'
      + (refuses ? '<div class="note danger" style="margin-top:12px">They will not agree to this one. Pick a different part.</div>' : '')
      + '</div><div class="modal-foot">'
      + '<button class="btn" data-close>Back to the market</button>'
      + (refuses ? '' : '<button class="btn btn-primary" id="btn-approve">They agreed \u2014 order it</button>')
      + '</div>');

    if (window.TechOpsApp) window.TechOpsApp.paintFaces(document.querySelector('.modal-veil'));
    var ok = document.getElementById('btn-approve');
    if (ok) ok.addEventListener('click', function () {
      document.querySelector('.modal-veil').remove();
      onAccept();
    });
  }

  /** Delivery after the shop's own supply arrangements. */
  function effectiveDelivery(p) {
    var P = Shop.state.perks || {};
    if (P.stockThermal && p.cat === 'thermal') return 0;
    if (P.fastStock && (p.cat === 'ram' || (p.cat === 'storage' && p.spec.bus === 'sata3'))) return 0;
    return Math.max(0, p.deliveryDays - (P.courierDays || 0));
  }

  function buy(partId) {
    var p = P.get(partId);
    if (Shop.state.cashFt < p.priceFt) {
      UI.toast('Not enough cash', 'The shop has ' + fmt(Shop.state.cashFt) + '. You need ' + fmt(p.priceFt) + '. Finish a job first.', 'bad');
      return;
    }
    proposeToCustomer(p, function () { completePurchase(p); });
  }

  function completePurchase(p) {
    Shop.spend(p.priceFt, p.name);
    var days = effectiveDelivery(p);
    var entry = { partId: p.id, paidFt: p.priceFt, daysLeft: days };
    if (days === 0) {
      Shop.state.shelf.push(entry);
      UI.toast('Collected', p.name + ' — picked up the same day.', 'good');
    } else {
      Shop.state.onOrder.push(entry);
      UI.toast('Ordered', p.name + ' — ' + days + ' day' + (days === 1 ? '' : 's') + ' away. The customer is waiting.',
               days > 10 ? 'bad' : '');
    }
    if (window.sekAudio) window.sekAudio.playCoin();
    Shop.emit('change');
    UI.refresh();
    render();
  }

  function waitForParts() {
    var t = Shop.state.ticket;
    if (!Shop.state.onOrder.length) return;
    var soonest = Math.min.apply(null, Shop.state.onOrder.map(function (o) { return o.daysLeft; }));

    // The shop does not close while a part is in the post.
    var log = window.TechOpsInterlude ? window.TechOpsInterlude.run(Shop, soonest) : [];
    Shop.advanceDays(soonest);
    if (t) t.daysWaited += soonest;
    var gains = window.TechOpsInterlude ? window.TechOpsInterlude.apply(Shop, log) : { earned: 0, repGain: 0 };
    if (window.sekAudio) window.sekAudio.playPing();
    Shop.emit('change');
    UI.refresh();
    render();

    var arrived = Shop.state.shelf.slice(-1)[0];
    UI.modal('<div class="modal-head"><h3>' + soonest + ' day' + (soonest === 1 ? '' : 's') + ' later</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">Day ' + Shop.state.day + ' at the counter'
      + (t ? ' \u00b7 ' + J.customer(t).name + ' has now waited ' + J.turnaroundDays(t) + ' days' : '') + '</div></div>'
      + '<div class="modal-body">'
      + (log.length
          ? '<div class="interlude">' + log.map(function (e) {
              return '<div class="il-row"><span class="il-day">day ' + e.day + '</span>'
                + '<span class="il-text">' + esc(e.text) + '</span>'
                + '<span class="il-ft">' + (e.ft ? '+' + fmt(e.ft) : e.rep ? '+' + e.rep + ' rep' : '\u2014') + '</span></div>';
            }).join('') + '</div>'
          : '<p style="color:var(--ink-2)">A very quiet stretch. Nothing came through the door.</p>')
      + (gains.earned
          ? '<div class="note good" style="margin-top:12px">Counter trade while you waited: <b>' + fmt(gains.earned) + '</b>. '
            + 'Waiting for a part is not free time \u2014 but it is not dead time either.</div>'
          : '')
      + (t && J.turnaroundDays(t) > t.urgencyDays
          ? '<div class="note danger" style="margin-top:10px"><b>' + esc(J.customer(t).name) + ' is past their deadline.</b> '
            + 'They asked for ' + t.urgencyDays + ' day' + (t.urgencyDays === 1 ? '' : 's') + '. This will show up in the review.</div>'
          : '')
      + '</div><div class="modal-foot"><button class="btn btn-primary" data-close>'
      + (arrived ? 'Get back to the bench' : 'Carry on') + '</button></div>');
  }

  function render() {
    var host = document.getElementById('view-market');
    var t = Shop.state.ticket;
    var machine = t ? J.machine(t) : null;

    var head = '<div class="view-head"><h2>Parts market</h2>'
      + '<p>Same part class, four very different answers. Cheap is genuinely cheaper — it costs you delivery time, warranty and a real chance of a comeback. '
      + (t ? 'Check it against <b>' + esc(machine.name) + '</b> and against what ' + esc(J.customer(t).name) + ' actually does all day.' : 'Take a job first so the fit checks have something to check against.') + '</p></div>';

    var vend = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:9px;margin-bottom:18px">';
    Object.keys(P.vendors).forEach(function (vid) {
      var v = P.vendors[vid];
      vend += '<div class="card" style="padding:11px"><div style="display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:650">'
        + v.icon + ' <span style="color:' + v.colour + '">' + esc(v.name) + '</span></div>'
        + '<div style="font-size:10.5px;color:var(--ink-3);font-family:var(--mono);margin:3px 0 6px">' + esc(v.origin) + '</div>'
        + '<div style="font-size:11.8px;color:var(--ink-2);line-height:1.5">' + esc(v.note) + '</div></div>';
    });
    vend += '</div>';

    var tabs = '<div class="market-cats">' + CATS.map(function (c) {
      return '<button class="mcat' + (cat === c.id ? ' active' : '') + '" data-cat="' + c.id + '">'
        + window.TechOpsIcons.icon(window.TechOpsIcons.CAT_ICON[c.id], 15) + '<span>' + c.label + '</span></button>';
    }).join('') + (Shop.state.onOrder.length
      ? '<button class="btn btn-sm btn-primary" style="margin-left:auto" data-wait>⏭ Wait for deliveries ('
        + Math.min.apply(null, Shop.state.onOrder.map(function (o) { return o.daysLeft; })) + 'd)</button>' : '') + '</div>';

    var parts = P.byCat(cat);
    if (machine) {
      parts = parts.filter(function (p) { return !p.fits || p.fits.indexOf(machine.id) !== -1 || true; });
    }

    var grid = '<div class="market-grid">';
    parts.forEach(function (p) {
      var v = P.vendors[p.vendor];
      var c = machine ? P.compat(p, machine) : { ok: true };
      grid += '<div class="part-card' + (c.ok ? '' : ' incompatible') + '">'
        + '<div class="pc-vendor" style="color:' + v.colour + '">' + v.icon + ' <span class="vn">' + esc(v.name) + '</span>'
        + '<span class="vo">' + esc(v.origin.split('·')[0].trim()) + '</span></div>'
        + '<div class="pc-body"><div class="pc-name">' + esc(p.name) + '</div>'
        + '<div class="pc-specs">' + chips(p, machine) + '</div>'
        + '<div class="pc-pitch">' + esc(p.pitch) + '</div>'
        + '<div class="pc-catch">' + esc(p.catch) + '</div>'
        + (!c.ok ? '<div class="pc-block"><b>Will not fit this machine.</b><br>' + esc(c.reason) + '</div>' : '')
        + (c.capped ? '<div class="pc-cap"><b>Fits, but throttled.</b><br>' + esc(c.note) + '</div>' : '')
        + '</div>'
        + '<div class="pc-foot"><div><div class="pc-price">' + fmt(p.priceFt) + '</div>'
        + (function () {
            var dd2 = effectiveDelivery(p);
            var quicker = dd2 < p.deliveryDays;
            return '<div class="pc-deliver' + (dd2 > 10 ? ' slow' : quicker ? ' quick' : '') + '">'
              + (dd2 === 0 ? (quicker ? 'in stock \u00b7 today' : 'collect today') : dd2 + ' day delivery')
              + (quicker ? ' <s>' + p.deliveryDays + 'd</s>' : '') + '</div></div>';
          })()
        + '<button class="btn btn-sm' + (c.ok ? ' btn-primary' : '') + '" data-buy="' + p.id + '"' + (c.ok ? '' : ' disabled') + '>Buy</button>'
        + '</div></div>';
    });
    grid += '</div>';

    host.innerHTML = head + vend + tabs + grid;

    host.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); render(); });
    });
    host.querySelectorAll('[data-buy]').forEach(function (b) {
      b.addEventListener('click', function () { buy(b.getAttribute('data-buy')); });
    });
    var w = host.querySelector('[data-wait]');
    if (w) w.addEventListener('click', waitForParts);
  }

  window.TechOpsMarket = { render: render, waitForParts: waitForParts };
})(window);
