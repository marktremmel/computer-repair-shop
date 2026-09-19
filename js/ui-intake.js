/**
 * TechOps Budapest — the sit-down.
 *
 * The customer puts the machine on the counter and you talk to them before
 * you touch it. Questions are cheap; instruments are not. A good interview
 * tells you which two instruments are worth the bench time.
 *
 * At the end you commit to a working theory. Committing is optional, but a
 * theory you write down and then test is the difference between diagnosing
 * and guessing — and the debrief holds you to it.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var Q    = window.TechOpsInterview;
  var esc  = function (s) { return UI.esc(s); };

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function ask(qid) {
    var t = Shop.state.ticket;
    t.asked = t.asked || [];
    if (t.asked.indexOf(qid) !== -1) return;
    var def = Q.QUESTIONS.filter(function (x) { return x.id === qid; })[0];
    var free = (Shop.state.perks || {}).freeQuestions || 0;
    t.asked.push(qid);
    if (t.asked.length > free) t.labourHours += def.hours;
    audio('playKeyPop');
    var a = Q.answerFor(t.faultId, qid, J.useCase(t));
    if (window.TechOpsVoice && a && a.t) setTimeout(function () { window.TechOpsVoice.speak(a.t, J.customer(t)); }, 190);
    Shop.emit('change');
    render();
    var el = document.querySelector('#view-intake .transcript');
    if (el) el.scrollTop = el.scrollHeight;
  }

  function commit(faultId) {
    var t = Shop.state.ticket;
    t.theory = t.theory === faultId ? null : faultId;
    audio(t.theory ? 'playSuccessChime' : 'playKeyPop');
    Shop.emit('change');
    render();
  }

  /**
   * Is the committed theory supported yet? Deliberately says "your evidence
   * supports this", never "this is correct" — confirmation comes from the
   * instruments, not from the game telling you the answer.
   */
  function theoryStatus(t) {
    if (!t.theory) return null;
    var REVEALED_BY = {
      dying_hdd: ['smart', 'listen', 'bench'], disk_full: ['storage_used'],
      ram_starved: ['activity'], bad_ram_stick: ['memtest'],
      thermal_paste_dead: ['thermal', 'visual'], fan_seized: ['thermal', 'visual'],
      battery_swollen: ['battery', 'visual'], port_lint: ['power', 'visual'],
      cracked_screen: ['visual'], runaway_process: ['activity'],
      sd_formatted: ['storage_used', 'smart'], os_wrecked: ['smart', 'bench'],
      migration: ['storage_used', 'visual'], no_backup: ['smart', 'listen'],
      water_damage: ['visual', 'power', 'thermal'], dead_no_power: ['power', 'battery'],
      no_internet: ['activity'], router_down: ['activity'],
      smc_confused: ['thermal', 'visual'], nvram_lost: ['visual', 'smart'],
      locked_out: ['storage_used', 'visual'], sticky_keys: ['visual', 'thermal'],
      bent_socket_pins: ['visual', 'power'], blown_caps: ['visual', 'power'],
      kernel_task_panic: ['activity', 'thermal'], browser_push_spam: ['activity', 'storage_used'],
      captive_portal_loop: ['activity', 'visual'], console_full: ['storage_used', 'bench'],
      charge_port_dead: ['power', 'visual', 'battery']
    };
    var need = REVEALED_BY[t.theory] || [];
    var have = need.filter(function (i) { return t.testsRun.indexOf(i) !== -1; });
    if (!have.length) return { state: 'untested', need: need };
    return { state: t.theory === t.faultId ? 'supported' : 'contradicted', need: need, have: have };
  }

  /** The shortlist a student chooses between — never the answer, just the field. */
  function candidates(t) {
    var m = J.machine(t);
    return window.TechOpsFaults.forMachine(m);
  }

  function render() {
    var host = document.getElementById('view-intake');
    var t = Shop.state.ticket;
    if (!t) {
      host.innerHTML = '<div class="view-head"><h2>The sit-down</h2><p>Nobody at the counter. Take a job first.</p></div>';
      return;
    }
    t.asked = t.asked || [];

    var c = J.customer(t), m = J.machine(t), uc = J.useCase(t), f = J.fault(t);
    var leads = Q.leads(t, t.faultId, uc);

    // ── transcript ──
    var av = UI.face(c, 34);
    var lines = '<div class="chat-row them"><div class="chat-av">' + av + '</div>'
      + '<div class="bubble">' + esc(t.complaint) + '</div></div>'
      + '<div class="chat-row them"><div class="chat-av" style="visibility:hidden">·</div>'
      + '<div class="bubble">' + esc(c.lines.budget) + '</div></div>';

    t.asked.forEach(function (qid) {
      var def = Q.QUESTIONS.filter(function (x) { return x.id === qid; })[0];
      var a = Q.answerFor(t.faultId, qid, uc);
      if (qid === 'history' && t.priorRepair) {
        a = { w: 'warm', t: {
          stripped: 'My cousin had a go at it with a screwdriver from the kitchen drawer. He said he got one of the screws "a bit chewed".',
          wrong_screws: 'A shop on the corner opened it last year. I do not know what they did in there.',
          missing: 'My brother opened it once. There might be a screw missing, he is like that.'
        }[t.priorRepair], s: ['visual'] };
      }
      lines += '<div class="chat-row me"><div class="bubble mine">' + esc(def.q) + '</div></div>'
        + '<div class="chat-row them"><div class="chat-av">' + av + '</div>'
        + '<div class="bubble speakable ' + (a.w === 'hot' ? 'lead' : a.w === 'warm' ? 'soft' : '') + '" data-say="' + esc(a.t) + '" title="Click to hear it again">' + esc(a.t)
        + (a.s && a.s.length
            ? '<div class="lead-tag">points at: ' + a.s.map(function (i) {
                return (UI.INSTRUMENTS[i] || {}).name || i; }).join(', ') + '</div>'
            : '')
        + '</div></div>';
    });

    // ── question list ──
    var qs = Q.QUESTIONS.map(function (def) {
      var done = t.asked.indexOf(def.id) !== -1;
      return '<button class="ask-btn' + (done ? ' asked' : '') + '" data-ask="' + def.id + '"' + (done ? ' disabled' : '') + '>'
        + '<span class="ti">' + def.icon + '</span><span>' + esc(def.q) + '</span>'
        + '<span class="cost">' + def.hours + 'h</span></button>';
    }).join('');

    // ── theory shortlist ──
    var cands = candidates(t).map(function (cf) {
      return '<button class="theory' + (t.theory === cf.id ? ' picked' : '') + '" data-theory="' + cf.id + '">'
        + esc(cf.title) + '</button>';
    }).join('');

    host.innerHTML = '<div class="view-head"><h2>The sit-down</h2>'
      + '<p>Ask before you open. A question costs <b>0.1 h</b>; a memory test costs <b>1.5 h</b>. '
      + 'The cheapest diagnosis in this shop is the one you get by listening.</p></div>'

      + '<div class="intake">'
      + '<div class="card intake-chat">'
      + '<div class="card-head"><span class="clickable-name" data-person="' + esc(c.id || c.name) + '">'
      + esc(c.name) + '</span> · ' + esc(m.name) + '</div>'
      + '<div class="transcript">' + lines + '</div>'
      + (leads.length
          ? '<div class="note good" style="margin-top:12px"><b>What you have heard points at:</b> '
            + leads.map(function (i) { return (UI.INSTRUMENTS[i] || {}).name || i; }).join(' · ')
            + '<br><span style="font-size:12px">Run those, not all ten.</span></div>'
          : '<div class="note" style="margin-top:12px">Nothing decisive yet. Keep asking — or open it up and start measuring blind.</div>')
      + '</div>'

      + '<div class="card">'
      + '<div class="card-head">Questions · ' + t.asked.length + ' asked</div>'
      + '<div class="ask-list">' + qs + '</div>'

      + '<div class="card-head" style="margin-top:16px">Your working theory</div>'
      + '<p style="font-size:12.3px;color:var(--ink-2);margin-bottom:9px">Optional — but writing it down before you test is what makes it a diagnosis instead of a guess. You can change it later.</p>'
      + '<div class="theory-list">' + cands + '</div>'
      + (function () {
          var st = theoryStatus(t);
          if (!st) return '';
          var f = window.TechOpsFaults.get(t.theory);
          if (st.state === 'untested') {
            return '<div class="note" style="margin-top:10px"><b>Theory logged: ' + esc(f.title) + '.</b><br>'
              + 'Nothing has tested it yet. Run ' + st.need.map(function (i) { return '<b>' + esc((UI.INSTRUMENTS[i] || {}).name || i) + '</b>'; }).join(' or ')
              + ' and see whether the machine agrees with you.</div>';
          }
          if (st.state === 'supported') {
            return '<div class="note good theory-hit" style="margin-top:10px"><b>\u2713 Your readings back this up.</b><br>'
              + esc(f.title) + ' \u2014 the instrument you ran shows exactly what this fault does. '
              + 'You called it before you measured it, which is the whole job.</div>';
          }
          return '<div class="note danger" style="margin-top:10px"><b>\u2717 The readings do not support this.</b><br>'
            + 'You logged ' + esc(f.title) + ', but what you measured says otherwise. '
            + 'Change your theory \u2014 being wrong early and cheaply is the point of testing.</div>';
        })()
      + '<div style="margin-top:14px;display:flex;gap:8px">'
      + '<button class="btn btn-primary" style="flex:1;justify-content:center" data-go-bench>Open it up →</button>'
      + '</div></div></div>';

    host.querySelectorAll('[data-say]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (window.TechOpsVoice) window.TechOpsVoice.speak(b.getAttribute('data-say'), c);
      });
    });
    host.querySelectorAll('[data-ask]').forEach(function (b) {
      b.addEventListener('click', function () { ask(b.getAttribute('data-ask')); });
    });
    host.querySelectorAll('[data-theory]').forEach(function (b) {
      b.addEventListener('click', function () { commit(b.getAttribute('data-theory')); });
    });
    if (!t._greeted && window.TechOpsVoice) {
      t._greeted = true;
      setTimeout(function () { window.TechOpsVoice.speak(t.complaint, c); }, 320);
    }
    host.querySelector('[data-go-bench]').addEventListener('click', function () {
      window.TechOpsApp.go('bench');
    });
    UI.refresh();
  }

  window.TechOpsIntake = { render: render };
})(window);
