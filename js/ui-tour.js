/**
 * TechOps Budapest — the walk round.
 *
 * Not a tutorial that plays the game for you. It points at the six places
 * work happens, says what each one is for in a sentence, and gets out of the
 * way. Skippable at every step and re-runnable from the help button, because
 * the students who do not need it should not have to sit through it.
 *
 * Deliberately says nothing about *how* to diagnose anything. Being told
 * where the instruments are is orientation; being told which one to run is
 * the lesson, and the lesson is the game's job.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var esc  = function (s) { return UI.esc(s); };
  var KEY  = 'techops.tour.done';

  var STEPS = [
    { view: 'counter', sel: '#view-counter .card',
      title: 'The counter',
      body: 'People wait here with a machine and a story. The <b>budget</b> and the <b>days they can wait</b> '
          + 'are on every card, and they decide which parts you are even allowed to consider. Read those before the complaint.' },

    { view: 'counter', sel: '[data-view="intake"]',
      title: 'The sit-down',
      body: 'Ask before you open anything. A question costs about six minutes of bench time; the memory test costs '
          + 'an hour and a half. Customers are not lying, but they are often wrong — what they noticed is a clue, '
          + 'not a diagnosis.' },

    { view: 'counter', sel: '[data-view="bench"]',
      title: 'The workbench',
      body: 'Tools on the left, the machine in the middle, the procedure on the right. '
          + 'Look at a screw head <i>before</i> you pick a driver. Some steps are a real movement rather than a click — '
          + 'and every one of those can be done from the keyboard instead.' },

    { view: 'counter', sel: '[data-view="mac"]',
      title: 'The software lab',
      body: 'Half the faults in this shop are not hardware at all. The lab has the disk, the memory pressure, '
          + 'the network chain and the terminal — and the commands it shows you are the ones you would type on a real machine.' },

    { view: 'counter', sel: '[data-view="market"]',
      title: 'The parts market',
      body: 'Four sellers, genuinely different trade-offs: cheap and three weeks away, in stock in Budapest, '
          + 'or the genuine part with a warranty. There is no best part — only the right one for this person. '
          + 'The customer approves the price and the wait before you spend their money.' },

    { view: 'counter', sel: '[data-view="handover"]',
      title: 'The handover',
      body: 'You set the price and find out what they thought. Five judgements: the right part, their money, '
          + 'the time it took, how long it will last, and how you worked. '
          + '<b>A job is only as good as its worst one.</b>' },

    { view: 'counter', sel: '.hud',
      title: 'What the shop is doing',
      body: 'Day, till, jobs, average stars and reputation. Reputation is not decoration — it decides how many '
          + 'people are waiting at the counter tomorrow. A shop nobody trusts sits empty.' },

    { view: 'counter', sel: '#btn-badges',
      title: 'Your goals',
      body: 'Twelve habits a good repair shop runs on — ask before you open, sell nothing that is not needed, '
          + 'wear the strap, deliver when you said. Each one says what to do and why, and shows how far along you are. '
          + 'A good place to start if you are not sure what to aim for.' },

    { view: 'counter', sel: '#btn-access',
      title: 'If you need it easier to read',
      body: 'Text size, stronger contrast, plainer letters, less movement. Set once and this machine remembers. '
          + 'The question mark next to it opens the full guide at any time.' }
  ];

  var i = 0, wrap = null, onEnd = null;

  function done() {
    try { window.localStorage.setItem(KEY, '1'); } catch (e) {}
    if (wrap) { wrap.remove(); wrap = null; }
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    if (onEnd) { var f = onEnd; onEnd = null; f(); }
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); done(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  }

  function next() { if (i >= STEPS.length - 1) return done(); i++; render(); }
  function back() { if (i <= 0) return; i--; render(); }

  /** Put the hole and the card where the target actually is. */
  function place() {
    if (!wrap) return;
    var s = STEPS[i];
    var el = document.querySelector(s.sel);
    var hole = wrap.querySelector('.tour-hole');
    var card = wrap.querySelector('.tour-card');
    if (!el) { hole.style.display = 'none'; card.style.left = '50%'; card.style.top = '50%';
               card.style.transform = 'translate(-50%,-50%)'; return; }

    var r = el.getBoundingClientRect();
    var pad = 8;
    hole.style.display = 'block';
    hole.style.left = (r.left - pad) + 'px';
    hole.style.top = (r.top - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    // Below the target if there is room, otherwise above.
    var cw = Math.min(360, window.innerWidth - 24);
    card.style.width = cw + 'px';
    var left = Math.max(12, Math.min(window.innerWidth - cw - 12, r.left + r.width / 2 - cw / 2));
    var belowTop = r.bottom + 14;
    var fitsBelow = belowTop + card.offsetHeight < window.innerHeight - 12;
    card.style.transform = 'none';
    card.style.left = left + 'px';
    card.style.top = (fitsBelow ? belowTop : Math.max(12, r.top - card.offsetHeight - 14)) + 'px';
  }

  function render() {
    var s = STEPS[i];
    if (s.view && window.TechOpsApp) window.TechOpsApp.go(s.view);

    wrap.querySelector('.tour-card').innerHTML =
        '<div class="tour-step">' + (i + 1) + ' of ' + STEPS.length + '</div>'
      + '<h3>' + esc(s.title) + '</h3>'
      + '<p>' + s.body + '</p>'
      + '<div class="tour-acts">'
      + '<button class="btn btn-sm" data-tour="skip">Skip the tour</button>'
      + '<span style="flex:1"></span>'
      + (i > 0 ? '<button class="btn btn-sm" data-tour="back">Back</button>' : '')
      + '<button class="btn btn-sm btn-primary" data-tour="next">'
      + (i === STEPS.length - 1 ? 'Start working' : 'Next') + '</button>'
      + '</div>';

    wrap.querySelectorAll('[data-tour]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-tour');
        if (a === 'next') next(); else if (a === 'back') back(); else done();
      });
    });
    // After the view has painted.
    requestAnimationFrame(function () { requestAnimationFrame(place); });
  }

  function start(after) {
    onEnd = after || null;
    i = 0;
    if (wrap) wrap.remove();
    wrap = document.createElement('div');
    wrap.className = 'tour';
    wrap.innerHTML = '<div class="tour-hole"></div><div class="tour-card" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(wrap);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    render();
  }

  /*
   * ── The training ticket ──────────────────────────────────────────────
   * One real job, played by the student, with a coach that sets the goal of
   * each station and points at where it happens. The coach never clicks, and
   * it never names the instrument or the part: it asks the question a good
   * technician asks, and moves on when the student has actually done it.
   *
   * It runs on a copy of the shop. The real shift is put aside, nothing is
   * saved while practising, and leaving (or finishing) puts the shift back
   * exactly as it was — including where the random sequence had got to, so a
   * class still meets the same customers afterwards.
   */
  var practice = null;   // { snapshot, step, timer, card }

  function J() { return window.TechOpsJobs; }
  function tk() { return Shop.state.ticket; }
  function has(arr, x) { return (arr || []).indexOf(x) !== -1; }

  var COACH = [
    { view: 'counter', sel: '#view-counter [data-go="intake"]',
      title: 'Read the card first',
      body: 'Marika néni is at the counter. Her <b>budget</b> and how many <b>days</b> she can wait decide which parts '
          + 'you may even consider — read those before the complaint. Then sit down with her.',
      done: function () { return window.TechOpsApp.current === 'intake'; } },
    { view: 'intake', sel: '#view-intake .ask-list',
      title: 'Ask before you open anything',
      body: 'Every question costs six minutes; the slowest test costs ninety. Keep asking until an answer '
          + '<b>points at something you can measure</b> — it will say so under her reply.',
      done: function () {
        var t = tk(); if (!t) return false;
        return window.TechOpsInterview.leads(t, t.faultId, J().useCase(t)).length > 0;
      } },
    { view: 'intake', sel: '#view-intake .theory-list',
      title: 'Write your theory down',
      body: 'Pick what you think is wrong. Writing it before you test is what turns a guess into a diagnosis — '
          + 'and the game will tell you whether the machine agrees.',
      done: function () { return !!(tk() && tk().theory); } },
    { view: 'bench', sel: '#view-bench .instruments',
      title: 'Measure before you open',
      body: 'On the workbench, run the instrument her answer pointed at. Some tests work with the case closed — '
          + 'start with one of those.',
      done: function () {
        var t = tk(); if (!t) return false;
        return window.TechOpsIntake.diagnosed(t);
      } },
    { view: 'bench', sel: '#view-bench .rack',
      title: 'Open it safely',
      body: 'Strap on the ESD band first. Then look at a screw head, pick the driver that matches it, '
          + 'and take the screws out. The wrong driver rounds them off.',
      done: function () { var t = tk(); return !!(t && J().flags(t).interior); } },
    { view: 'bench', sel: '#view-bench .board-stage',
      title: 'Power off the board',
      body: 'Before your hands go near anything inside, lift the battery connector off the board. '
          + 'Straight up — levering it sideways bends the pins.',
      done: function () { var t = tk(); return !!(t && (t.batteryDisconnected || has(t.openSteps, 'battery_connector'))); } },
    { view: 'bench', sel: '#view-bench .instruments',
      title: 'Now look at it',
      body: 'With the case open you can inspect what the first test suggested. Does what you see match your theory?',
      done: function () { var t = tk(); return !!(t && has(t.testsRun, 'visual')); } },
    { view: 'market', sel: '#view-market .market-cats',
      title: 'Buy only what the readings justify',
      body: 'You know what failed. Find a replacement that <b>fits this machine</b>, fits <b>her budget</b>, '
          + 'and arrives before her deadline. She has to agree to the price and the wait.',
      done: function () {
        var S = Shop.state;
        return (S.shelf || []).concat(S.onOrder || []).some(function (e) {
          var p = window.TechOpsParts.get(e.partId); return p && p.cat === 'fan';
        }) || (tk() && tk().installed.some(function (i) { return i.cat === 'fan'; }));
      } },
    { view: 'bench', sel: '#view-bench .shelf-col',
      title: 'Fit it',
      body: 'If it is still in transit, the parts market lets you wait for the delivery. Then drag it from the '
          + 'shelf onto the part you are replacing.',
      done: function () { var t = tk(); return !!(t && t.installed.some(function (i) { return i.cat === 'fan'; })); } },
    { view: 'bench', sel: '#view-bench .instruments',
      title: 'Prove it worked',
      body: 'A repair you have not re-tested is a repair you are taking on trust. Run the test that found '
          + 'the fault again and see whether it reads normal now.',
      done: function () { var t = tk(); return !!(t && t.fixConfirmed); } },
    { view: 'handover', sel: '#view-handover .card',
      title: 'Hand it back',
      body: 'Set a price that describes the work you did — the part and your time — not what she can afford. '
          + 'Then find out what she thought.',
      done: function () { return !tk() && (Shop.state.history || []).length > practice.historyAt; } }
  ];

  function coachEl() {
    if (practice.card) return practice.card;
    var c = document.createElement('div');
    c.className = 'coach';
    c.setAttribute('role', 'status');
    document.body.appendChild(c);
    practice.card = c;
    return c;
  }

  function paintCoach() {
    if (!practice) return;
    var s = COACH[practice.step];
    document.querySelectorAll('.coach-target').forEach(function (e) { e.classList.remove('coach-target'); });
    var here = window.TechOpsApp.current === s.view;
    var tgt = here ? document.querySelector(s.sel) : document.querySelector('[data-view="' + s.view + '"]');
    if (tgt) tgt.classList.add('coach-target');
    coachEl().innerHTML = '<div class="coach-head"><span class="coach-tag">Training ticket</span>'
      + '<span class="coach-count">' + (practice.step + 1) + ' of ' + COACH.length + '</span></div>'
      + '<h4>' + esc(s.title) + '</h4><p>' + s.body + '</p>'
      + (here ? '' : '<p class="coach-where">This happens in <b>' + esc(viewName(s.view)) + '</b> — the highlighted tab.</p>')
      + '<div class="coach-acts"><button class="btn btn-xs" data-coach="leave">Leave practice</button></div>';
    practice.card.querySelector('[data-coach="leave"]').addEventListener('click', function () { endTraining(false); });
  }

  function viewName(v) {
    return { counter: 'the Counter', intake: 'the Sit-down', bench: 'the Workbench', mac: 'the Software lab',
             market: 'the Parts market', handover: 'the Handover' }[v] || v;
  }

  function tick() {
    if (!practice) return;
    // Finished: wait until the handover's own code has run to the end and the
    // student has read (and closed) the debrief. Swapping the real shift back
    // from inside the handover's change event let its remaining lines — the
    // next day, the quiet-day queue clear — land on the real shift.
    if (practice.finished) {
      if (!document.querySelector('.modal-veil')) endTraining(true);
      return;
    }
    var moved = false;
    while (practice.step < COACH.length && COACH[practice.step].done()) { practice.step++; moved = true; }
    if (practice.step >= COACH.length) {
      practice.finished = true;
      if (practice.card) practice.card.style.display = 'none';
      return;
    }
    if (moved && window.sekAudio && window.sekAudio.playKeyPop) window.sekAudio.playKeyPop();
    paintCoach();
  }

  function startTraining() {
    if (practice) return;
    try { window.localStorage.setItem(KEY, '1'); } catch (e) {}
    var real = Shop.state;
    var copy = JSON.parse(JSON.stringify(real));
    copy.practice = true;
    copy.queue = []; copy.shelf = []; copy.onOrder = []; copy.pendingComebacks = [];
    practice = { snapshot: real, step: 0, historyAt: (copy.history || []).length, card: null };
    Shop.state = copy;

    var t = J().newTicket(Shop, { customer: window.TechOpsCustomers.get('marika'), machineId: 'inspiron15', fault: 'fan_seized' });
    t._training = true;
    t.budgetFt = 40000;
    t.urgencyDays = 7;
    t.priorRepair = null;
    Shop.state.ticket = t;
    Shop.emit('change');
    window.TechOpsApp.go('counter');

    UI.modal('<div class="modal-head"><h3>Training ticket</h3></div>'
      + '<div class="modal-body"><p style="font-size:calc(13.5px * var(--a11y-scale, 1));line-height:1.6">'
      + 'One real job, done by you, with a coach in the corner that says what each station is for and moves on when you have '
      + 'actually done it. It will not tell you the answer.</p>'
      + '<p style="font-size:calc(13px * var(--a11y-scale, 1));line-height:1.6;color:var(--ink-2)">'
      + 'This is practice. Your shift is put aside and comes back exactly as it was when you finish or leave — '
      + 'the till, the queue, your reputation and your hand-in code are not touched.</p></div>'
      + '<div class="modal-foot"><button class="btn btn-primary" data-close>Start</button></div>');

    // Never act inside someone else's change event; look after it has finished.
    Shop.on('change', function () { setTimeout(tick, 0); });
    practice.timer = setInterval(tick, 700);
    paintCoach();
  }

  function endTraining(finished) {
    if (!practice) return;
    var p = practice, last = (Shop.state.history || [])[0];
    practice = null;
    clearInterval(p.timer);
    if (p.card) p.card.remove();
    document.querySelectorAll('.coach-target').forEach(function (e) { e.classList.remove('coach-target'); });
    // Put the real shift back, including the random sequence position.
    Shop.state = p.snapshot;
    Shop.reseed();
    Shop.emit('change');
    window.TechOpsApp.go('counter');
    if (window.TechOpsApp.refreshAll) window.TechOpsApp.refreshAll();
    UI.modal('<div class="modal-head"><h3>' + (finished ? 'Training ticket done' : 'Practice left') + '</h3></div>'
      + '<div class="modal-body"><p style="font-size:calc(13.5px * var(--a11y-scale, 1));line-height:1.6">'
      + (finished && last
          ? 'Marika néni gave it <b>' + '★'.repeat(last.stars) + '</b>. That was the whole loop: ask, measure, open safely, '
            + 'buy only what the readings justify, fit it, prove it, price it. '
          : '')
      + 'Your real shift is back exactly as you left it.</p></div>'
      + '<div class="modal-foot"><button class="btn btn-primary" data-close>Back to the counter</button></div>');
  }

  window.TechOpsTour = {
    start: start,
    startTraining: startTraining,
    inTraining: function () { return !!practice; },
    seen: function () {
      try { return window.localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
    },
    /** The one-line offer shown to somebody opening the shop for the first time. */
    offer: function (after) {
      UI.modal('<div class="modal-head"><h3>First time behind the counter?</h3></div>'
        + '<div class="modal-body"><p style="font-size:calc(13.5px * var(--a11y-scale, 1));line-height:1.65">'
        + 'Two ways to start: take the two-minute walk round to see where everything is, '
        + 'or jump straight into a guided training ticket with Marika néni.</p></div>'
        + '<div class="modal-foot" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">'
        + '<button class="btn" data-close id="tour-no">I will find my way</button>'
        + '<button class="btn" id="tour-walk">Walk round (9 stops)</button>'
        + '<button class="btn btn-primary" id="tour-training">Start Training Ticket</button></div>');
      var walk = document.getElementById('tour-walk');
      var train = document.getElementById('tour-training');
      var no  = document.getElementById('tour-no');
      if (no) no.addEventListener('click', function () {
        try { window.localStorage.setItem(KEY, '1'); } catch (e) {}
        if (after) after();
      });
      if (walk) walk.addEventListener('click', function () {
        var veil = document.querySelector('.modal-veil');
        if (veil) veil.remove();
        start(after);
      });
      if (train) train.addEventListener('click', function () {
        var veil = document.querySelector('.modal-veil');
        if (veil) veil.remove();
        startTraining();
      });
    }
  };
})(window);
