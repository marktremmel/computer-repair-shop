/**
 * TechOps Budapest — shift report and teacher decoder.
 *
 * Follows the house pattern: no accounts, no database, nothing leaves the
 * browser. A student's whole shift compresses into one SEK7K- code that the
 * teacher pastes into the same page and reads back offline.
 *
 * The point of the report is not the star average. It is naming WHICH of the
 * five judgements a student keeps losing, because that is the thing to teach
 * next lesson.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var fmt  = window.techOpsFmt;
  var esc  = function (s) { return UI.esc(s); };

  var AXIS = {
    fit:        { label: 'Right part for this person',
                  weak: 'Parts that did not suit the machine or the person using it — over-specced, under-specced, or throttled by a bus the student did not check.',
                  teach: 'Work through one machine\'s spec sheet together: which bus, how many slots, what is soldered. Then ask what the customer actually does all day.' },
    budget:     { label: 'Respected their money',
                  weak: 'Bills beyond what the customer said they had, or hardware sold for faults that needed none.',
                  teach: 'Replay a full-disk or lint-in-port job as a class. The fix is free; the temptation is a sale.' },
    speed:      { label: 'Turnaround against the deadline',
                  weak: 'Slow parts or long diagnostics against tight deadlines. Delivery time and bench time are both the customer\'s time.',
                  teach: 'Compare the 20-day marketplace part against the 2-day shop part on the same job, for a customer with a Friday deadline.' },
    durability: { label: 'Still working next year',
                  weak: 'No-warranty parts chosen repeatedly. Cheap is a real choice — but it is a bet, and the rework lands on the shop.',
                  teach: 'Look at the comeback log: which cheap parts came back, and what the rework cost.' },
    safety:     { label: 'Safe, tidy workmanship',
                  weak: 'ESD strap skipped, screws rounded off, or work done on a live board.',
                  teach: 'The strap costs nothing and prevents damage that shows up weeks later. Match drivers to heads before touching anything.' }
  };

  function averages() { return Shop.axisAverages(); }

  function weakest() {
    var a = averages(), worst = null;
    Object.keys(a).forEach(function (k) {
      if (a[k] === null) return;
      if (!worst || a[k] < a[worst]) worst = k;
    });
    return worst;
  }

  /** Compact payload — short keys keep the code short enough to paste into Classroom. */
  function buildPayload() {
    var S = Shop.state, a = averages();
    return {
      v: 1,
      n: S.studentName || '',
      c: S.shiftCode,
      d: S.day,
      j: S.jobsDone,
      s: S.starsTotal,
      a: [a.fit, a.budget, a.speed, a.durability, a.safety],
      h: S.honestRefusals || 0,
      b: S.jobsBotched || 0,
      k: S.comebacks || 0,
      r: Math.round(S.reputation),
      t: Math.round(S.cashFt),
      g: Object.keys(S.badges || {}),
      l: (S.history || []).slice(0, 12).map(function (x) {
        return [x.day, x.customer, x.faultId || '', x.stars, x.resolved ? 1 : 0, x.soldUnneeded ? 1 : 0];
      })
    };
  }

  function axisBars(vals) {
    return Object.keys(AXIS).map(function (k, i) {
      var v = Array.isArray(vals) ? vals[i] : vals[k];
      if (v === null || v === undefined) v = 0;
      var col = v >= 80 ? 'var(--green)' : v >= 55 ? 'var(--amber)' : 'var(--red)';
      return '<div class="axis"><div class="axis-top"><span class="n">' + AXIS[k].label + '</span>'
        + '<span class="v" style="color:' + col + '">' + v + '</span></div>'
        + '<div class="axis-track"><div class="axis-fill" style="width:' + v + '%;background:' + col + '"></div></div></div>';
    }).join('');
  }

  // ── student side ───────────────────────────────────────────────────
  function showShiftReport() {
    var S = Shop.state;
    if (!S.jobsDone) {
      UI.modal('<div class="modal-head"><h3>No shift to report yet</h3></div><div class="modal-body">'
        + '<p style="color:var(--ink-2)">Close at least one job first — the report is built from what you actually did at the counter.</p>'
        + '</div><div class="modal-foot"><button class="btn" data-close>Close</button></div>');
      return;
    }
    var avg = (S.starsTotal / S.jobsDone);
    var w = weakest();
    var code = window.sekCode ? window.sekCode.encode(buildPayload()) : null;

    var jobs = (S.history || []).slice(0, 12).map(function (h) {
      return '<div class="disk-row' + (h.stars >= 4 ? ' ok' : h.stars <= 2 ? ' bad' : '') + '">'
        + '<span class="k">day ' + h.day + ' · ' + esc(h.customer) + '</span>'
        + '<span style="font-size:11px">' + esc(h.fault) + (h.soldUnneeded ? ' · sold parts it did not need' : '') + '</span>'
        + '<span class="v">' + '★'.repeat(h.stars) + '</span></div>';
    }).join('') || '<div style="color:var(--ink-3);font-size:12.5px">No jobs closed.</div>';

    UI.modal('<div class="modal-head"><h3>Shift report</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">Shift code <b>' + esc(S.shiftCode) + '</b> · ' + S.jobsDone + ' job'
      + (S.jobsDone === 1 ? '' : 's') + ' over ' + S.day + ' days</div></div>'
      + '<div class="modal-body" id="report-print">'
      + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">'
      + '<input id="student-name" placeholder="Your name and class" value="' + esc(S.studentName || '') + '" '
      + 'style="flex:1;background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:10px 13px;color:var(--ink);font-size:14px">'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:9px;margin-bottom:18px">'
      + stat('Average', avg.toFixed(1) + '★', avg >= 4 ? 'var(--green)' : avg >= 3 ? 'var(--amber)' : 'var(--red)')
      + stat('Till', fmt(S.cashFt), S.cashFt >= 150000 ? 'var(--green)' : 'var(--amber)')
      + stat('Reputation', Math.round(S.reputation), UI.repColour(S.reputation))
      + stat('Honest calls', S.honestRefusals || 0, (S.honestRefusals || 0) > 0 ? 'var(--green)' : 'var(--ink-3)')
      + stat('Comebacks', S.comebacks || 0, (S.comebacks || 0) ? 'var(--red)' : 'var(--green)')
      + '</div>'

      + '<div class="card-head">How you judged, across every job</div>'
      + axisBars(averages())
      + (w ? '<div class="note teach" style="margin-top:14px"><b>Your weakest judgement: ' + AXIS[w].label.toLowerCase() + '.</b><br>'
             + esc(AXIS[w].weak) + '</div>' : '')

      + '<div class="card-head" style="margin-top:18px">Jobs</div><div class="disk-rows">' + jobs + '</div>'

      + (code
          ? '<div class="card-head" style="margin-top:18px">Hand-in code</div>'
            + '<p style="font-size:12.5px;color:var(--ink-2)">Paste this into Google Classroom. It carries your whole shift — '
            + 'your teacher decodes it in their own browser, offline. Nothing is uploaded anywhere.</p>'
            + '<textarea id="hand-in-code" readonly style="width:100%;height:78px;background:var(--bg);border:1px solid var(--line);'
            + 'border-radius:9px;padding:10px;color:var(--green);font-family:var(--mono);font-size:11px;resize:vertical">' + esc(code) + '</textarea>'
          : '')
      + '</div>'
      + '<div class="modal-foot">'
      + '<button class="btn" id="btn-print-report">🖨️ Print</button>'
      + '<button class="btn btn-primary" id="btn-copy-code">Copy code</button>'
      + '<button class="btn" data-close>Close</button></div>');

    var nameIn = document.getElementById('student-name');
    nameIn.addEventListener('input', function () {
      Shop.state.studentName = nameIn.value;
      var ta = document.getElementById('hand-in-code');
      if (ta && window.sekCode) ta.value = window.sekCode.encode(buildPayload());
      Shop.save();
    });
    document.getElementById('btn-copy-code').addEventListener('click', function () {
      var ta = document.getElementById('hand-in-code');
      if (!ta) return;
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(function () {});
      UI.toast('Copied', 'Paste it into Classroom.', 'good');
    });
    document.getElementById('btn-print-report').addEventListener('click', function () {
      document.body.classList.add('printing-report');
      window.print();
      setTimeout(function () { document.body.classList.remove('printing-report'); }, 600);
    });
  }

  function stat(k, v, col) {
    return '<div class="constraint"><div class="k">' + esc(k) + '</div>'
      + '<div class="v" style="color:' + (col || 'var(--ink)') + '">' + esc(String(v)) + '</div></div>';
  }

  // ── teacher side ───────────────────────────────────────────────────
  function showTeacherDecoder() {
    UI.modal('<div class="modal-head"><h3>Teacher · decode a shift code</h3>'
      + '<div style="font-size:12.5px;color:var(--ink-3)">Everything happens in this browser. No network, no accounts.</div></div>'
      + '<div class="modal-body">'
      + '<textarea id="decode-in" placeholder="Paste a student\'s SEK7K- code here" '
      + 'style="width:100%;height:84px;background:var(--bg);border:1px solid var(--line);border-radius:9px;'
      + 'padding:10px;color:var(--ink);font-family:var(--mono);font-size:11.5px;resize:vertical"></textarea>'
      + '<button class="btn btn-primary" id="btn-decode" style="margin-top:10px">Decode</button>'
      + '<div id="decode-out" style="margin-top:16px"></div>'
      + '</div><div class="modal-foot"><button class="btn" data-close>Close</button></div>');

    document.getElementById('btn-decode').addEventListener('click', function () {
      var raw = document.getElementById('decode-in').value;
      var out = document.getElementById('decode-out');
      if (!window.sekCode) { out.innerHTML = '<div class="note danger">Code engine not loaded.</div>'; return; }
      var res = window.sekCode.decode(raw);
      if (!res.ok) {
        out.innerHTML = '<div class="note danger"><b>Could not read that code.</b><br>' + esc(res.error)
          + '<br><br>Most often this is a copy that missed the last few characters.</div>';
        return;
      }
      out.innerHTML = renderDecoded(res.data);
    });
  }

  function renderDecoded(d) {
    if (!d || d.v !== 1) return '<div class="note danger">Unrecognised code version.</div>';
    var avg = d.j ? (d.s / d.j) : 0;
    var keys = Object.keys(AXIS);
    var worstI = -1;
    (d.a || []).forEach(function (v, i) {
      if (v === null || v === undefined) return;
      if (worstI === -1 || v < d.a[worstI]) worstI = i;
    });
    var w = worstI >= 0 ? keys[worstI] : null;

    var jobs = (d.l || []).map(function (x) {
      var f = window.TechOpsFaults.get(x[2]);
      return '<div class="disk-row' + (x[3] >= 4 ? ' ok' : x[3] <= 2 ? ' bad' : '') + '">'
        + '<span class="k">day ' + x[0] + ' · ' + esc(x[1]) + '</span>'
        + '<span style="font-size:11px">' + esc(f ? f.title : x[2])
        + (x[4] ? '' : ' · <b>not actually fixed</b>')
        + (x[5] ? ' · <b>sold unnecessary parts</b>' : '') + '</span>'
        + '<span class="v">' + '★'.repeat(x[3]) + '</span></div>';
    }).join('') || '<div style="color:var(--ink-3);font-size:12.5px">No jobs in this code.</div>';

    return '<div class="note good" style="margin-bottom:14px"><b>' + esc(d.n || '(no name given)') + '</b><br>'
      + 'Shift code <b>' + esc(d.c) + '</b> · ' + d.j + ' job' + (d.j === 1 ? '' : 's') + ' over ' + d.d + ' days'
      + '<br><span style="font-size:12px">Two students with the same shift code got the same customers, faults and prices — '
      + 'so their results are directly comparable.</span></div>'

      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:9px;margin-bottom:18px">'
      + stat('Average', avg.toFixed(1) + '★', avg >= 4 ? 'var(--green)' : avg >= 3 ? 'var(--amber)' : 'var(--red)')
      + stat('Till', fmt(d.t), d.t >= 150000 ? 'var(--green)' : 'var(--amber)')
      + stat('Reputation', d.r, UI.repColour(d.r))
      + stat('Honest calls', d.h, d.h > 0 ? 'var(--green)' : 'var(--ink-3)')
      + stat('Comebacks', d.k, d.k ? 'var(--red)' : 'var(--green)')
      + '</div>'

      + '<div class="card-head">How this student judged</div>'
      + axisBars(d.a)
      + (w ? '<div class="note warn" style="margin-top:14px"><b>Weakest: ' + AXIS[w].label.toLowerCase() + '</b><br>'
             + esc(AXIS[w].weak) + '</div>'
           + '<div class="note teach" style="margin-top:8px"><b>What to do about it next lesson</b><br>'
             + esc(AXIS[w].teach) + '</div>' : '')

      + '<div class="card-head" style="margin-top:18px">Jobs</div><div class="disk-rows">' + jobs + '</div>';
  }

  window.TechOpsReport = {
    show: showShiftReport,
    teacher: showTeacherDecoder,
    AXIS: AXIS
  };
})(window);
