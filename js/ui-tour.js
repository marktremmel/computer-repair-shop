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

  window.TechOpsTour = {
    start: start,
    seen: function () {
      try { return window.localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
    },
    /** The one-line offer shown to somebody opening the shop for the first time. */
    offer: function (after) {
      UI.modal('<div class="modal-head"><h3>First time behind the counter?</h3></div>'
        + '<div class="modal-body"><p style="font-size:13.5px;line-height:1.65">'
        + 'Two minutes, eight stops, and it only shows you where things are — '
        + 'what is actually wrong with each machine is yours to work out.</p></div>'
        + '<div class="modal-foot">'
        + '<button class="btn" data-close id="tour-no">I will find my way</button>'
        + '<button class="btn btn-primary" id="tour-yes">Show me around</button></div>');
      var yes = document.getElementById('tour-yes');
      var no  = document.getElementById('tour-no');
      if (no) no.addEventListener('click', function () {
        try { window.localStorage.setItem(KEY, '1'); } catch (e) {}
        if (after) after();
      });
      if (yes) yes.addEventListener('click', function () {
        var veil = document.querySelector('.modal-veil');
        if (veil) veil.remove();
        start(after);
      });
    }
  };
})(window);
