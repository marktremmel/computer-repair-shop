/**
 * TechOps Budapest — the front counter.
 *
 * Choosing which job to take is already a decision: the one-day deadline
 * pays the same as the week-long one and gives you no time to order parts.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var fmt  = window.techOpsFmt;
  var esc  = function (s) { return UI.esc(s); };

  function fillQueue() {
    // A job you botched comes back on its own, under warranty, and you fix it for free.
    var pend = Shop.state.pendingComebacks = Shop.state.pendingComebacks || [];
    var due = pend.filter(function (c) { return c.dueDay <= Shop.state.day; });
    if (due.length) {
      Shop.state.pendingComebacks = pend.filter(function (c) { return c.dueDay > Shop.state.day; });
      due.forEach(function (c) {
        var t = J.newTicket(Shop, {
          customer: window.TechOpsCustomers.get(c.customerId),
          machineId: c.machineId,
          fault: c.faultId,
          warranty: true,
          originJobId: c.originJobId
        });
        t.budgetFt = 0;
        t.urgencyDays = 1;
        t.complaint = 'You fixed this ' + (Shop.state.day - (c.dueDay - 4)) + ' days ago and it has done the same thing again. '
          + (c.reason ? c.reason + ' ' : '') + 'I am not paying twice.';
        Shop.state.queue.unshift(t);
      });
    }
    while (Shop.state.queue.length < J.footfall(Shop).waiting) {
      Shop.state.queue.push(J.newTicket(Shop, {}));
    }
  }

  /** Nothing at the counter is a state you can get out of — by waiting. */
  /**
   * Pass on everyone waiting and see who comes in next.
   *
   * This used to advance the day and then refill the queue — which was
   * already full of the same people, so nobody new ever arrived and the
   * button looked broken. The people you passed on do not wait around for
   * days either: they leave. Warranty comebacks stay, because those are
   * yours whether you like it or not.
   */
  function waitForTrade() {
    var f = J.footfall(Shop);
    Shop.state.queue = (Shop.state.queue || []).filter(function (q) { return q.warranty; });
    Shop.advanceDays(f.quietDays);
    fillQueue();
    UI.toast('The bell goes',
      f.quietDays === 1 ? 'Somebody comes in the next morning.'
        : f.quietDays + ' quiet days, and then somebody finally comes in. That is what the reviews are costing you.',
      f.quietDays > 1 ? 'bad' : 'good');
    Shop.emit('change');
    render();
  }

  function take(idx) {
    // Stale buttons survive a view switch, so a second click can arrive after the
    // queue has already moved on. Fail quietly rather than throwing.
    if (Shop.state.ticket) { window.TechOpsApp.go('intake'); return; }
    var t = Shop.state.queue.splice(idx, 1)[0];
    if (!t) { render(); return; }
    Shop.state.ticket = t;
    if (window.TechOpsBench) window.TechOpsBench.reset();
    if (window.TechOpsMac) window.TechOpsMac.reset();
    if (window.sekAudio) window.sekAudio.playSuccessChime();
    UI.toast('Job ' + t.id + ' opened', J.customer(t).name + ' · ' + J.machine(t).name);
    Shop.emit('change');
    UI.refresh();
    window.TechOpsApp.go('intake');
  }

  function render() {
    var host = document.getElementById('view-counter');
    var t = Shop.state.ticket;

    if (t) {
      var c = J.customer(t), m = J.machine(t), f = J.fault(t);
      host.innerHTML = '<div class="view-head"><h2>Front counter</h2><p>One machine on the bench at a time. Finish this one first.</p></div>'
        + '<div class="counter-scene"><div class="walkin">'
        + '<div class="walkin-avatar">' + UI.face(c, 78) + '</div>'
        + '<h3 class="clickable-name" data-person="' + esc(c.id || c.name) + '">' + esc(c.name) + '</h3>'
        + '<div style="font-size:calc(12px * var(--a11y-scale, 1));color:var(--ink-3);margin-bottom:10px">' + esc(c.tag) + '</div>'
        + '<div class="speech">“' + esc(t.complaint) + '”</div>'
        + '<div class="speech">“' + esc(window.TechOpsCustomers.greet(c, Shop.state)) + '”</div>'
        + '<div class="speech">“' + esc(c.lines.budget) + '”</div>'
        + '<div class="note teach" style="margin-top:14px"><b>What they think is wrong:</b> ' + esc(f.customerTheory)
        + '<br><br>They are describing a symptom. Go and measure the machine before you believe any of it.</div>'
        + '</div><div class="card"><div class="card-head">What they actually need it for</div>'
        + '<div style="font-size:calc(14px * var(--a11y-scale, 1));font-weight:650;margin-bottom:6px">' + esc(J.useCase(t).label) + '</div>'
        + '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">' + esc(J.useCase(t).blurb) + '</p>'
        + '<div class="constraint-grid">'
        + '<div class="constraint"><div class="k">Budget</div><div class="v">' + fmt(t.budgetFt) + '</div></div>'
        + '<div class="constraint"><div class="k">Deadline</div><div class="v">' + t.urgencyDays + ' days</div></div>'
        + '</div>'
        + '<div class="machine-strip"><span class="ico">' + m.icon + '</span><div><div class="nm">' + esc(m.name) + '</div>'
        + '<div class="sp">' + esc(m.blurb) + '</div></div></div>'
        + '<div style="margin-top:14px"><button class="btn btn-primary" data-go="intake">Talk to them →</button></div>'
        + '</div></div>';
      host.querySelectorAll('[data-go]').forEach(function (b) {
        b.addEventListener('click', function () { window.TechOpsApp.go('intake'); });
      });
      return;
    }

    fillQueue();
    var cards = Shop.state.queue.map(function (q, i) {
      var c = J.customer(q), m = J.machine(q), uc = J.useCase(q);
      var tight = q.urgencyDays <= 2;
      return '<div class="card"><div class="cust-row"><div class="cust-avatar">' + UI.face(c, 44) + '</div><div style="flex:1">'
        + '<div class="cust-name clickable-name" data-person="' + esc(c.id || c.name) + '">' + esc(c.name) + '</div>'
        + '<div class="cust-tag">' + esc(c.tag) + '</div>'
        + '<div class="cust-usecase">' + esc(uc.label) + '</div></div></div>'
        + '<div class="quote-bubble">“' + esc(q.complaint) + '”</div>'
        + '<div class="machine-strip"><span class="ico">' + m.icon + '</span><div>'
        + '<div class="nm">' + esc(m.name) + '</div><div class="sp">' + esc(m.year + ' · ' + m.kind) + '</div></div></div>'
        + '<div class="constraint-grid">'
        + '<div class="constraint"><div class="k">Budget</div><div class="v">' + fmt(q.budgetFt) + '</div></div>'
        + '<div class="constraint' + (tight ? ' urgent' : '') + '"><div class="k">Needs it in</div><div class="v">' + q.urgencyDays + ' d</div></div>'
        + '</div>'
        + (tight ? '<div class="note warn" style="margin-top:10px;font-size:calc(12px * var(--a11y-scale, 1))">A ' + q.urgencyDays + '-day deadline rules out anything that has to be shipped from Shenzhen.</div>' : '')
        + '<div style="margin-top:12px"><button class="btn btn-primary" style="width:100%" data-take="' + i + '">Take this job</button></div>'
        + '</div>';
    }).join('');

    var ff = J.footfall(Shop);
    var n = Shop.state.queue.length;
    host.innerHTML = '<div class="view-head"><h2>Front counter · day ' + Shop.state.day + '</h2>'
      + '<p>' + (n === 1 ? 'One person waiting' : n + ' people waiting') + '. '
      + 'Read the budget and the deadline before you read the complaint — they decide which parts are even available to you.</p></div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;max-width:1120px">' + cards + '</div>'
      // Inside a card, because the view sits on a photograph and a bare note
      // over it is unreadable.
      + '<div class="card" style="margin-top:16px;max-width:74ch">'
      + '<div class="card-head">How busy the counter is</div>'
      + '<div class="note ' + (Shop.state.reputation >= 72 ? 'good' : Shop.state.reputation >= 40 ? '' : 'warn') + '">'
      + esc(ff.why)
      + (Shop.state.reputation < 40
          ? ' Waiting for the next one costs you ' + ff.quietDays + ' day' + (ff.quietDays === 1 ? '' : 's')
            + ' — empty days the rent still has to come out of.'
          : '')
      + '</div>'
      + '<div style="margin-top:12px"><button class="btn" id="btn-wait">Pass on these · wait for the next customers ('
      + ff.quietDays + ' day' + (ff.quietDays === 1 ? '' : 's') + ')</button></div>'
      + '</div>';

    host.querySelectorAll('[data-take]').forEach(function (b) {
      b.addEventListener('click', function () { take(+b.getAttribute('data-take')); });
    });
    var wb = document.getElementById('btn-wait');
    if (wb) wb.addEventListener('click', waitForTrade);
  }

  window.TechOpsCounter = { render: render };
})(window);
