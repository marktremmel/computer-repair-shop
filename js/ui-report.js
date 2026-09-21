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
        + '<span style="font-size:calc(11px * var(--a11y-scale, 1))">' + esc(h.fault) + (h.soldUnneeded ? ' · sold parts it did not need' : '') + '</span>'
        + '<span class="v">' + '★'.repeat(h.stars) + '</span></div>';
    }).join('') || '<div style="color:var(--ink-3);font-size:calc(12.5px * var(--a11y-scale, 1))">No jobs closed.</div>';

    UI.modal('<div class="modal-head"><h3>Shift report</h3>'
      + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">Shift code <b>' + esc(S.shiftCode) + '</b> · ' + S.jobsDone + ' job'
      + (S.jobsDone === 1 ? '' : 's') + ' over ' + S.day + ' days</div></div>'
      + '<div class="modal-body" id="report-print">'
      + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">'
      + '<input id="student-name" placeholder="Your name and class" value="' + esc(S.studentName || '') + '" '
      + 'style="flex:1;background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:10px 13px;color:var(--ink);font-size:calc(14px * var(--a11y-scale, 1))">'
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
            + '<p style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-2)">Paste this into Google Classroom. It carries your whole shift — '
            + 'your teacher decodes it in their own browser, offline. Nothing is uploaded anywhere.</p>'
            + '<textarea id="hand-in-code" readonly style="width:100%;height:78px;background:var(--bg);border:1px solid var(--line);'
            + 'border-radius:9px;padding:10px;color:var(--green);font-family:var(--mono);font-size:calc(11px * var(--a11y-scale, 1));resize:vertical">' + esc(code) + '</textarea>'
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
  function getWeakestAxis(a) {
    if (!a) return null;
    var keys = Object.keys(AXIS);
    var worstI = -1;
    a.forEach(function (v, i) {
      if (v === null || v === undefined) return;
      if (worstI === -1 || v < a[worstI]) worstI = i;
    });
    return worstI >= 0 ? keys[worstI] : null;
  }

  function csvEscape(val) {
    var s = String(val === null || val === undefined ? '' : val);
    if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  var rosterSort = { col: 'stars', desc: true };

  function renderRosterRows(valid) {
    var list = valid.slice();
    list.sort(function (a, b) {
      var d1 = a.data, d2 = b.data;
      var v1, v2;
      var avg1 = d1.j ? (d1.s / d1.j) : 0;
      var avg2 = d2.j ? (d2.s / d2.j) : 0;
      if (rosterSort.col === 'name') { v1 = (d1.n || '').toLowerCase(); v2 = (d2.n || '').toLowerCase(); }
      else if (rosterSort.col === 'code') { v1 = d1.c || ''; v2 = d2.c || ''; }
      else if (rosterSort.col === 'jobs') { v1 = d1.j || 0; v2 = d2.j || 0; }
      else if (rosterSort.col === 'stars') { v1 = avg1; v2 = avg2; }
      else if (rosterSort.col === 'till') { v1 = d1.t || 0; v2 = d2.t || 0; }
      else if (rosterSort.col === 'rep') { v1 = d1.r || 0; v2 = d2.r || 0; }
      else if (rosterSort.col === 'fit') { v1 = (d1.a && d1.a[0]) || 0; v2 = (d2.a && d2.a[0]) || 0; }
      else if (rosterSort.col === 'budget') { v1 = (d1.a && d1.a[1]) || 0; v2 = (d2.a && d2.a[1]) || 0; }
      else if (rosterSort.col === 'speed') { v1 = (d1.a && d1.a[2]) || 0; v2 = (d2.a && d2.a[2]) || 0; }
      else if (rosterSort.col === 'durability') { v1 = (d1.a && d1.a[3]) || 0; v2 = (d2.a && d2.a[3]) || 0; }
      else if (rosterSort.col === 'safety') { v1 = (d1.a && d1.a[4]) || 0; v2 = (d2.a && d2.a[4]) || 0; }
      else { v1 = avg1; v2 = avg2; }

      if (v1 < v2) return rosterSort.desc ? 1 : -1;
      if (v1 > v2) return rosterSort.desc ? -1 : 1;
      return 0;
    });

    var badge = function (val) {
      if (val === null || val === undefined) return '—';
      var col = val >= 80 ? 'var(--green)' : val >= 55 ? 'var(--amber)' : 'var(--red)';
      return '<span style="color:' + col + ';font-weight:600">' + Math.round(val) + '%</span>';
    };

    return list.map(function (rec, idx) {
      var d = rec.data;
      var avg = d.j ? (d.s / d.j) : 0;
      var avgCol = avg >= 4 ? 'var(--green)' : avg >= 3 ? 'var(--amber)' : 'var(--red)';
      var wKey = getWeakestAxis(d.a);
      var wLabel = wKey ? AXIS[wKey].label : '—';
      return '<tr style="border-bottom:1px solid var(--line);font-size:calc(12px * var(--a11y-scale, 1))">'
        + '<td style="padding:7px 9px;font-weight:600;white-space:nowrap">' + esc(d.n || '(unnamed)') + '</td>'
        + '<td style="padding:7px 9px;font-family:var(--mono);color:var(--ink-2)">' + esc(d.c || '—') + '</td>'
        + '<td style="padding:7px 9px;text-align:center">' + d.j + '</td>'
        + '<td style="padding:7px 9px;text-align:center;font-weight:bold;color:' + avgCol + '">' + avg.toFixed(1) + '★</td>'
        + '<td style="padding:7px 9px;text-align:right;font-family:var(--mono)">' + fmt(d.t) + '</td>'
        + '<td style="padding:7px 9px;text-align:center;font-weight:600;color:' + UI.repColour(d.r) + '">' + d.r + '</td>'
        + '<td style="padding:7px 9px;text-align:center">' + badge(d.a && d.a[0]) + '</td>'
        + '<td style="padding:7px 9px;text-align:center">' + badge(d.a && d.a[1]) + '</td>'
        + '<td style="padding:7px 9px;text-align:center">' + badge(d.a && d.a[2]) + '</td>'
        + '<td style="padding:7px 9px;text-align:center">' + badge(d.a && d.a[3]) + '</td>'
        + '<td style="padding:7px 9px;text-align:center">' + badge(d.a && d.a[4]) + '</td>'
        + '<td style="padding:7px 9px;text-align:center">'
        + '<button class="btn btn-sm btn-inspect" data-code="' + esc(rec.code) + '" style="font-size:calc(11px * var(--a11y-scale, 1));padding:3px 7px">Inspect</button>'
        + '</td>'
        + '</tr>';
    }).join('');
  }

  function renderClassRoster(valid, failed) {
    var n = valid.length;
    var totalStarsAvg = 0, totalTill = 0, totalRep = 0, totalJobs = 0, totalHonest = 0, totalComebacks = 0;
    var axisSums = [0, 0, 0, 0, 0];
    var axisCounts = [0, 0, 0, 0, 0];

    valid.forEach(function (rec) {
      var d = rec.data;
      var avg = d.j ? (d.s / d.j) : 0;
      totalStarsAvg += avg;
      totalTill += (d.t || 0);
      totalRep += (d.r || 0);
      totalJobs += (d.j || 0);
      totalHonest += (d.h || 0);
      totalComebacks += (d.k || 0);
      if (Array.isArray(d.a)) {
        d.a.forEach(function (v, idx) {
          if (v !== null && v !== undefined && idx < 5) {
            axisSums[idx] += v;
            axisCounts[idx]++;
          }
        });
      }
    });

    var classAvgStars = (totalStarsAvg / n).toFixed(2);
    var classAvgTill = Math.round(totalTill / n);
    var classAvgRep = Math.round(totalRep / n);
    var classAvgJobs = (totalJobs / n).toFixed(1);

    var keys = Object.keys(AXIS);
    var classAxisAvgs = axisSums.map(function (sum, i) {
      return axisCounts[i] ? (sum / axisCounts[i]) : 0;
    });

    var worstAxisIdx = -1;
    classAxisAvgs.forEach(function (avg, i) {
      if (worstAxisIdx === -1 || avg < classAxisAvgs[worstAxisIdx]) worstAxisIdx = i;
    });
    var worstKey = worstAxisIdx >= 0 ? keys[worstAxisIdx] : null;

    var warnFailed = failed.length
      ? '<div class="note warn" style="margin-bottom:14px"><b>' + failed.length + ' code(s) could not be read.</b> '
        + 'They were omitted from the calculations below.</div>'
      : '';

    var th = function (id, label) {
      var active = rosterSort.col === id;
      var arrow = active ? (rosterSort.desc ? ' ▼' : ' ▲') : '';
      return '<th data-sort="' + id + '" style="padding:8px 9px;cursor:pointer;user-select:none;'
        + (active ? 'color:var(--amber);' : '') + '">' + esc(label) + arrow + '</th>';
    };

    return warnFailed
      + '<div class="note good" style="margin-bottom:16px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">'
      + '<div><b>Class Summary · ' + n + ' Student Submissions Decoded</b><br>'
      + '<span style="font-size:calc(12px * var(--a11y-scale, 1))">Aggregated across all submitted shift codes.</span></div>'
      + '<button class="btn btn-sm btn-primary" id="btn-export-csv" style="font-size:calc(12px * var(--a11y-scale, 1));padding:6px 12px">📥 Export CSV</button>'
      + '</div>'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:9px;margin-bottom:18px">'
      + stat('Class Avg ★', classAvgStars + '★', classAvgStars >= 4 ? 'var(--green)' : classAvgStars >= 3 ? 'var(--amber)' : 'var(--red)')
      + stat('Avg Till', fmt(classAvgTill), classAvgTill >= 150000 ? 'var(--green)' : 'var(--amber)')
      + stat('Avg Rep', classAvgRep, UI.repColour(classAvgRep))
      + stat('Avg Jobs', classAvgJobs)
      + stat('Honest Calls', totalHonest, totalHonest > 0 ? 'var(--green)' : 'var(--ink-3)')
      + stat('Comebacks', totalComebacks, totalComebacks ? 'var(--red)' : 'var(--green)')
      + '</div>'

      + '<div class="card-head">Class Average Judgement Scores</div>'
      + axisBars(classAxisAvgs.map(function (v) { return Math.round(v); }))

      + (worstKey ? '<div class="note warn" style="margin-top:14px"><b>Collective Weakest Axis: ' + AXIS[worstKey].label + ' (' + Math.round(classAxisAvgs[worstAxisIdx]) + '%)</b><br>'
             + esc(AXIS[worstKey].weak) + '</div>'
           + '<div class="note teach" style="margin-top:8px"><b>Lesson Recommendation for the Group:</b><br>'
             + esc(AXIS[worstKey].teach) + '</div>' : '')

      + '<div class="card-head" style="margin-top:22px;display:flex;justify-content:space-between;align-items:center">'
      + '<span>Student Roster</span>'
      + '<span style="font-size:calc(11.5px * var(--a11y-scale, 1));color:var(--ink-3);font-weight:normal">Click any column header to sort</span>'
      + '</div>'

      + '<div style="overflow-x:auto;margin-top:8px;border:1px solid var(--line);border-radius:9px;background:var(--bg)">'
      + '<table style="width:100%;border-collapse:collapse;text-align:left">'
      + '<thead><tr style="border-bottom:1px solid var(--line);font-size:calc(11.5px * var(--a11y-scale, 1));background:rgba(255,255,255,0.03)">'
      + th('name', 'Student')
      + th('code', 'Shift')
      + th('jobs', 'Jobs')
      + th('stars', 'Avg ★')
      + th('till', 'Till')
      + th('rep', 'Rep')
      + th('fit', 'Fit')
      + th('budget', 'Budget')
      + th('speed', 'Speed')
      + th('durability', 'Durable')
      + th('safety', 'Safety')
      + '<th style="padding:8px 9px;text-align:center">Detail</th>'
      + '</tr></thead>'
      + '<tbody id="roster-tbody">'
      + renderRosterRows(valid)
      + '</tbody>'
      + '</table>'
      + '</div>'

      + '<div id="roster-single-inspect" style="margin-top:24px"></div>';
  }

  function attachRosterEvents(valid) {
    var out = document.getElementById('decode-out');
    if (!out) return;

    // Export CSV
    var expBtn = document.getElementById('btn-export-csv');
    if (expBtn) {
      expBtn.addEventListener('click', function () {
        var header = ['Name', 'Shift Code', 'Days', 'Jobs', 'Avg Stars', 'Till (Ft)', 'Reputation', 'Honest Calls', 'Comebacks', 'Fit %', 'Budget %', 'Speed %', 'Durability %', 'Safety %', 'Weakest Axis'];
        var rows = [header.map(csvEscape).join(',')];

        valid.forEach(function (rec) {
          var d = rec.data;
          var avg = d.j ? (d.s / d.j).toFixed(2) : '0';
          var w = getWeakestAxis(d.a);
          var row = [
            d.n || 'Anonymous',
            d.c || '',
            d.d || 0,
            d.j || 0,
            avg,
            d.t || 0,
            d.r || 0,
            d.h || 0,
            d.k || 0,
            (d.a && d.a[0] !== undefined) ? d.a[0] : '',
            (d.a && d.a[1] !== undefined) ? d.a[1] : '',
            (d.a && d.a[2] !== undefined) ? d.a[2] : '',
            (d.a && d.a[3] !== undefined) ? d.a[3] : '',
            (d.a && d.a[4] !== undefined) ? d.a[4] : '',
            w ? AXIS[w].label : ''
          ];
          rows.push(row.map(csvEscape).join(','));
        });

        var csv = rows.join('\r\n');
        var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'techops-class-roster.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // Sort headers
    out.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = th.getAttribute('data-sort');
        if (rosterSort.col === col) {
          rosterSort.desc = !rosterSort.desc;
        } else {
          rosterSort.col = col;
          rosterSort.desc = true;
        }
        var tbody = document.getElementById('roster-tbody');
        if (tbody) tbody.innerHTML = renderRosterRows(valid);
        attachInspectButtons(valid);
        // update header arrows
        out.querySelectorAll('th[data-sort]').forEach(function (t) {
          var active = t.getAttribute('data-sort') === rosterSort.col;
          var baseText = t.textContent.replace(/\s*[▲▼]\s*$/, '');
          t.textContent = baseText + (active ? (rosterSort.desc ? ' ▼' : ' ▲') : '');
          t.style.color = active ? 'var(--amber)' : '';
        });
      });
    });

    attachInspectButtons(valid);
  }

  function attachInspectButtons(valid) {
    var out = document.getElementById('decode-out');
    if (!out) return;
    out.querySelectorAll('.btn-inspect').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-code');
        var rec = valid.find(function (r) { return r.code === code; });
        var target = document.getElementById('roster-single-inspect');
        if (rec && target) {
          target.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
            + '<h4>Individual Student Inspection: ' + esc(rec.data.n || 'Anonymous') + '</h4>'
            + '<button class="btn btn-sm" id="btn-close-inspect">Hide details</button></div>'
            + renderDecoded(rec.data);
          var closeBtn = document.getElementById('btn-close-inspect');
          if (closeBtn) closeBtn.addEventListener('click', function () { target.innerHTML = ''; });
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function showTeacherDecoder() {
    UI.modal('<div class="modal-head"><h3>Teacher · Class Shift Decoder &amp; Roster</h3>'
      + '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3)">Paste one or multiple student SEK7K- codes (up to 50). Everything decodes 100% offline in this browser.</div></div>'
      + '<div class="modal-body">'
      + '<textarea id="decode-in" placeholder="Paste SEK7K- codes here (one or multiple lines)..." '
      + 'style="width:100%;height:96px;background:var(--bg);border:1px solid var(--line);border-radius:9px;'
      + 'padding:10px;color:var(--ink);font-family:var(--mono);font-size:calc(11.5px * var(--a11y-scale, 1));resize:vertical"></textarea>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px">'
      + '<button class="btn btn-primary" id="btn-decode">Decode Codes</button>'
      + '<button class="btn" id="btn-sample-class" style="font-size:calc(12px * var(--a11y-scale, 1))">Load Sample Class (3 students)</button>'
      + '<button class="btn" id="btn-clear" style="font-size:calc(12px * var(--a11y-scale, 1))">Clear</button>'
      + '</div>'
      + '<div id="decode-out" style="margin-top:16px"></div>'
      + '</div><div class="modal-foot"><button class="btn" data-close>Close</button></div>');

    var inEl = document.getElementById('decode-in');
    var out = document.getElementById('decode-out');

    document.getElementById('btn-clear').addEventListener('click', function () {
      inEl.value = '';
      out.innerHTML = '';
      inEl.focus();
    });

    document.getElementById('btn-sample-class').addEventListener('click', function () {
      if (!window.sekCode) return;
      var sample1 = {
        v: 1, n: 'Kata N. (8.B)', c: 'SZER-01', d: 6, j: 6, s: 28,
        a: [88, 92, 75, 84, 90], h: 2, b: 0, k: 0, r: 88, t: 184500, g: ['first_job', 'five_jobs', 'no_upsell'],
        l: [[1,'Dóra','dying_hdd',5,1,0],[2,'Zsolt','thermal_paste_dead',5,1,0],[3,'Bálint','cracked_screen',4,1,0],[4,'Marika','port_lint',5,1,0],[5,'Dávid','fan_seized',4,1,0],[6,'Eszter','bad_ram_stick',5,1,0]]
      };
      var sample2 = {
        v: 1, n: 'Bence K. (8.B)', c: 'SZER-01', d: 5, j: 5, s: 16,
        a: [72, 44, 88, 58, 48], h: 0, b: 1, k: 1, r: 52, t: 138000, g: ['first_job'],
        l: [[1,'Dóra','dying_hdd',4,1,0],[2,'Zsolt','thermal_paste_dead',2,1,1],[3,'Bálint','cracked_screen',3,1,0],[4,'Marika','port_lint',3,1,1],[5,'Dávid','fan_seized',4,1,0]]
      };
      var sample3 = {
        v: 1, n: 'Zsombor T. (8.B)', c: 'SZER-01', d: 5, j: 5, s: 19,
        a: [80, 78, 42, 85, 75], h: 1, b: 0, k: 0, r: 64, t: 98000, g: ['first_job', 'no_upsell'],
        l: [[1,'Dóra','dying_hdd',4,1,0],[2,'Zsolt','thermal_paste_dead',4,1,0],[3,'Bálint','cracked_screen',3,1,0],[4,'Marika','port_lint',5,1,0],[5,'Dávid','fan_seized',3,1,0]]
      };
      var c1 = window.sekCode.encode(sample1);
      var c2 = window.sekCode.encode(sample2);
      var c3 = window.sekCode.encode(sample3);
      inEl.value = [c1, c2, c3].join('\n');
      document.getElementById('btn-decode').click();
    });

    document.getElementById('btn-decode').addEventListener('click', function () {
      var raw = inEl.value.trim();
      if (!raw) {
        out.innerHTML = '<div class="note warn">Paste at least one student SEK7K- completion code.</div>';
        return;
      }
      if (!window.sekCode) {
        out.innerHTML = '<div class="note danger">Code engine not loaded.</div>';
        return;
      }

      var matches = raw.match(/SEK7K-[A-Za-z0-9_-]+/g);
      if (!matches || !matches.length) {
        matches = raw.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      }

      var valid = [], failed = [];
      matches.forEach(function (codeStr) {
        var res = window.sekCode.decode(codeStr);
        if (res.ok && res.data && res.data.v === 1) {
          valid.push({ code: codeStr, data: res.data });
        } else {
          failed.push({ code: codeStr, error: res.ok ? 'Invalid code schema' : res.error });
        }
      });

      if (!valid.length) {
        out.innerHTML = '<div class="note danger"><b>Could not read any valid codes (' + failed.length + ' attempted).</b><br>'
          + (failed[0] ? esc(failed[0].error) : 'Check that the code starts with SEK7K- and is not truncated.') + '</div>';
        return;
      }

      if (valid.length === 1 && failed.length === 0) {
        out.innerHTML = renderDecoded(valid[0].data);
        return;
      }

      out.innerHTML = renderClassRoster(valid, failed);
      attachRosterEvents(valid);
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
        + '<span style="font-size:calc(11px * var(--a11y-scale, 1))">' + esc(f ? f.title : x[2])
        + (x[4] ? '' : ' · <b>not actually fixed</b>')
        + (x[5] ? ' · <b>sold unnecessary parts</b>' : '') + '</span>'
        + '<span class="v">' + '★'.repeat(x[3]) + '</span></div>';
    }).join('') || '<div style="color:var(--ink-3);font-size:calc(12.5px * var(--a11y-scale, 1))">No jobs in this code.</div>';

    return '<div class="note good" style="margin-bottom:14px"><b>' + esc(d.n || '(no name given)') + '</b><br>'
      + 'Shift code <b>' + esc(d.c) + '</b> · ' + d.j + ' job' + (d.j === 1 ? '' : 's') + ' over ' + d.d + ' days'
      + '<br><span style="font-size:calc(12px * var(--a11y-scale, 1))">Two students with the same shift code got the same customers, faults and prices — '
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
