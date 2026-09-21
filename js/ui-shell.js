/**
 * TechOps Budapest — app frame: HUD, job rail, evidence notebook, toasts.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var fmt = window.techOpsFmt;

  /** Every measurement you can take, where you take it, and what it costs you in bench time. */
  var INSTRUMENTS = {
    visual:       { id: 'visual',       name: 'Visual inspection',   icon: '🔦', where: 'bench', hours: 0.3, needsOpen: true,
                    blurb: 'Open it up and actually look. Swelling, burn marks, dried paste, a felt mat of dust.' },
    listen:       { id: 'listen',       name: 'Listen to the drive', icon: '👂', where: 'bench', hours: 0.2,
                    blurb: 'A dying mechanical drive tells you out loud.' },
    memtest:      { id: 'memtest',      name: 'Memory test · 4 passes', icon: '🧠', where: 'bench', hours: 1.5,
                    blurb: 'Writes known patterns to every address and reads them back. Slow, and the only way to be sure about RAM.' },
    thermal:      { id: 'thermal',      name: 'Thermal load test',   icon: '🌡️', where: 'bench', hours: 0.8,
                    blurb: 'Full load for ten minutes while logging core temperature, fan RPM and clock speed.' },
    battery:      { id: 'battery',      name: 'Battery health',      icon: '🔋', where: 'bench', hours: 0.2,
                    blurb: 'Cycle count against design cycles, and current capacity against design capacity.' },
    power:        { id: 'power',        name: 'Charge port / wattage', icon: '⚡', where: 'bench', hours: 0.2,
                    blurb: 'What wattage does the port actually negotiate, and does the plug seat fully.' },
    smart:        { id: 'smart',        name: 'SMART health',        icon: '💾', where: 'mac',   hours: 0.2,
                    blurb: 'The drive\'s own log of how many sectors it has already had to give up on.' },
    bench:        { id: 'bench',        name: 'Disk speed test',     icon: '📊', where: 'mac',   hours: 0.3,
                    blurb: 'Sequential throughput, random IOPS and access latency.' },
    activity:     { id: 'activity',     name: 'Activity Monitor',    icon: '📈', where: 'mac',   hours: 0.2,
                    blurb: 'Memory pressure, swap in use, and which process is eating the machine.' },
    storage_used: { id: 'storage_used', name: 'Storage usage',       icon: '🗂️', where: 'mac',   hours: 0.2,
                    blurb: 'How full the disk is, and what is taking the room.' },
    // Has its own panel on the board, so it is not listed with the bench
    // instruments — but it is still an instrument, and the evidence rail
    // has to know what to call it.
    // Recorded by opening a pane in System Settings, and by walking the chain
    // in the Network app. For faults that live in a setting or a connection,
    // the app is the instrument.
    settings:     { id: 'settings',     name: 'Settings check',      icon: '⚙️', where: 'mac',   hours: 0.1,
                    blurb: 'Open the settings the complaint is about and read what they are actually set to.' },
    network:      { id: 'network',      name: 'Network chain',       icon: '🔗', where: 'mac',   hours: 0.1,
                    blurb: 'Ping hop by hop: this machine, the router, the provider, DNS, a real site.' },
    // Recorded by using the browser in the software lab (or Safari on a
    // handset): load a site, search for something, see where it goes.
    browser:      { id: 'browser',      name: 'Browser check',       icon: '🌐', where: 'mac',   hours: 0.1,
                    blurb: 'Load a site and search for something. Where does it actually go, and what pops up?' },
    meter:        { id: 'meter',        name: 'Multimeter',          icon: '📟', where: 'board', hours: 0.4,
                    blurb: 'Rail voltages and continuity to ground, one test point at a time.' }
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /** Turn a raw instrument reading into a monospace readout + verdict. */
  /** The points you have actually probed, in the order you probed them. */
  function formatMeter(t, pts) {
    var probed = t.meterProbed || [];
    if (!probed.length) return { hit: false, data: '', note: 'Out and zeroed. Nothing probed yet.' };
    var hit = false;
    var data = probed.map(function (k) {
      var r = pts[k] || {};
      var bad = !!r.beep && k !== 'gnd' || /^0\.00 V/.test(r.v || '') || /–/.test(r.v || '');
      if (bad) hit = true;
      return esc(r.label || k) + ' <span class="' + (bad ? 'bad' : 'ok') + '">' + esc(r.v || '?') + '</span>';
    }).join(' \u00b7 ');
    var last = pts[probed[probed.length - 1]] || {};
    return { hit: hit, data: data, note: last.note || '' };
  }

  function formatReading(toolId, r) {
    function n(v, bad, unit) { return '<span class="' + (bad ? 'bad' : 'ok') + '">' + v + (unit || '') + '</span>'; }
    var d = '', hit = false;
    switch (toolId) {
      case 'smart':
        hit = r.health !== 'GOOD';
        d = 'health ' + n(r.health, hit) + ' · realloc ' + n(r.reallocated, r.reallocated > 0)
          + ' · pending ' + n(r.pending, r.pending > 0) + ' · ' + r.hours + ' h powered';
        break;
      case 'bench':
        hit = r.seqMBps < 150 || r.latencyMs > 20;
        d = n(r.seqMBps, r.seqMBps < 150, ' MB/s') + ' seq · ' + r.randIops + ' IOPS · '
          + n(r.latencyMs, r.latencyMs > 20, ' ms') + ' latency';
        break;
      case 'memtest':
        hit = r.errors > 0;
        d = r.passes + ' passes · ' + n(r.errors, hit) + ' errors' + (r.failAddr ? ' · first at ' + r.failAddr : '');
        break;
      case 'thermal':
        hit = r.loadC >= 95 || r.fanRpm === 0;
        d = 'idle ' + n(r.idleC, r.idleC > 60, ' °C') + ' · load ' + n(r.loadC, r.loadC >= 95, ' °C')
          + ' · fan ' + n(r.fanRpm, r.fanRpm === 0, ' rpm') + (r.throttleMhz ? ' · throttled to ' + r.throttleMhz + ' MHz' : '');
        break;
      case 'battery':
        if (r.condition === 'N/A') { d = 'no battery — desktop'; break; }
        hit = r.condition !== 'Normal' || r.healthPct < 80;
        // Worn is relative to this pack: a phone cell is rated for about 500
        // cycles, a laptop pack for about 1000.
        var design = r.designCycles || 1000;
        if (r.cycles > design) hit = true;
        d = n(r.cycles, r.cycles > design, '') + ' of ' + design + ' cycles · ' + n(r.healthPct, r.healthPct < 80, '%') + ' of design · ' + n(r.condition, hit);
        break;
      case 'power':
        hit = !r.seats || r.watts === 0;
        d = n(r.watts, r.watts === 0, ' W') + ' · ' + r.negotiated + ' · plug seats: ' + n(r.seats ? 'yes' : 'no', !r.seats);
        break;
      case 'storage_used':
        hit = r.usedPct > 92;
        d = n(r.usedPct, hit, '% full') + ' · ' + r.freeGB + ' GB free · biggest: ' + esc(r.biggest);
        break;
      case 'activity':
        hit = r.memPressurePct > 80 || (r.topProcCpuPct || 0) > 150;
        d = 'pressure ' + n(r.memPressurePct, r.memPressurePct > 80, '%') + ' · swap ' + n(r.swapGB, r.swapGB > 4, ' GB')
          + ' · top: ' + esc(r.topProc) + ' (' + r.topProcMemGB + ' GB'
          + (r.topProcCpuPct ? ', ' + n(r.topProcCpuPct, r.topProcCpuPct > 150, '% CPU') : '') + ')';
        break;
      case 'browser':
      case 'settings':
      case 'network':
        d = r.abnormal ? 'shows the problem' : 'as expected';
        break;
      case 'visual':
      case 'listen':
        d = r.abnormal ? 'abnormal' : 'nothing obviously wrong';
        break;
    }
    // The fault data says which of its readings are evidence. Guessing it from
    // keywords missed corrosion, bent pins and a splayed port, and told the
    // student "nothing obviously wrong" above a note describing the damage.
    if (r.abnormal === true) hit = true;
    else if (r.abnormal === false || toolId === 'visual' || toolId === 'listen'
             || toolId === 'browser' || toolId === 'settings' || toolId === 'network') hit = false;
    return { data: d, note: r.note || '', hit: hit };
  }

  var UI = {
    INSTRUMENTS: INSTRUMENTS,
    /**
     * A pixel portrait placeholder. Sprites load asynchronously, so this emits
     * a slot that App.paintFaces() fills once the manifest is in.
     */
    face: function (person, size) {
      if (!person) return '';
      var seed = person.portraitSeed || person.id || person.name || 'anon';
      return '<div class="pface" data-seed="' + esc(String(seed)) + '"'
        + ' data-arch="' + esc(person.archetype || '') + '"'
        + ' data-age="' + (person.age || '') + '"'
        + ' data-size="' + (size || 44) + '"></div>';
    },
    esc: esc,
    formatReading: formatReading,

    toast: function (title, body, kind) {
      var host = document.getElementById('toasts');
      var t = document.createElement('div');
      t.className = 'toast ' + (kind || '');
      t.innerHTML = '<b>' + esc(title) + '</b>' + (body ? esc(body) : '');
      host.appendChild(t);
      setTimeout(function () {
        t.style.transition = 'opacity .35s, transform .35s';
        t.style.opacity = '0'; t.style.transform = 'translateX(30px)';
        setTimeout(function () { t.remove(); }, 380);
      }, kind === 'bad' ? 6200 : 4200);
    },

    modal: function (html, opts) {
      opts = opts || {};
      var veil = document.createElement('div');
      veil.className = 'modal-veil';
      veil.innerHTML = '<div class="modal">' + html + '</div>';
      document.body.appendChild(veil);
      var close = function () { veil.remove(); if (opts.onClose) opts.onClose(); };
      veil.addEventListener('click', function (e) { if (e.target === veil && !opts.sticky) close(); });
      veil.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
      return { el: veil, close: close };
    },

    stars: function (n) {
      var s = '';
      for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '<span class="off">★</span>';
      return '<span class="stars">' + s + '</span>';
    },

    /** Reputation drives the colour of the meter and who walks in the door. */
    repColour: function (r) {
      return r >= 70 ? '#3ddc91' : r >= 45 ? '#f0a830' : '#ff5f6d';
    },

    renderHUD: function () {
      var S = Shop.state;
      document.getElementById('hud-day').textContent = S.day;
      var cash = document.getElementById('hud-cash');
      cash.querySelector('b').textContent = fmt(S.cashFt);
      cash.classList.toggle('negative', S.cashFt < 0);
      document.getElementById('hud-jobs').textContent = S.jobsDone;
      var avg = S.jobsDone ? (S.starsTotal / S.jobsDone) : 0;
      document.getElementById('hud-stars').textContent = avg ? avg.toFixed(1) + '★' : '—';
      var fill = document.getElementById('rep-fill');
      fill.style.width = S.reputation + '%';
      fill.style.background = UI.repColour(S.reputation);
      document.getElementById('hud-rep-n').textContent = Math.round(S.reputation);
    },

    renderRail: function () {
      var rail = document.getElementById('rail');
      var t = Shop.state.ticket;
      if (!t) {
        rail.innerHTML = '<div class="rail-empty"><span class="big">🔧</span>'
          + 'No job on the bench.<br>Go to the <b>Counter</b> and take the next customer.</div>';
        return;
      }
      var c = window.TechOpsJobs.customer(t);
      var m = window.TechOpsJobs.machine(t);
      var uc = window.TechOpsJobs.useCase(t);
      var readings = window.TechOpsFaults.readingsFor(m, window.TechOpsJobs.fault(t));

      var bus = window.TechOpsMachines.bestBus(m);
      var specLine = m.ramSoldered && m.storageSoldered
        ? 'everything soldered'
        : window.TechOpsMachines.busLabel(bus) + ' · ' + (m.ramSoldered ? 'RAM soldered' : m.ramType.toUpperCase() + ' ×' + m.ramSlots);

      var html = '<div class="card">'
        + '<div class="card-head">Job ' + esc(t.id) + (t.warranty ? ' · WARRANTY RETURN' : '') + '</div>'
        + '<div class="cust-row"><div class="cust-avatar">' + UI.face(c, 44) + '</div><div>'
        + '<div class="cust-name clickable-name" data-person="' + esc(c.id || c.name) + '">' + esc(c.name) + '</div>'
        + '<div class="cust-tag">' + esc(c.tag) + '</div>'
        + '<div class="cust-usecase">' + esc(uc.label) + '</div>'
        + '</div></div>'
        + '<div class="quote-bubble">“' + esc(t.complaint) + '”</div>'
        + '<div class="machine-strip"><span class="ico">' + m.icon + '</span><div>'
        + '<div class="nm">' + esc(m.name) + '</div><div class="sp">' + esc(specLine) + '</div></div></div>'
        + '<div class="constraint-grid">'
        + '<div class="constraint"><div class="k">Their budget</div><div class="v">' + fmt(t.budgetFt) + '</div></div>'
        + '<div class="constraint' + (window.TechOpsJobs.turnaroundDays(t) >= t.urgencyDays ? ' urgent' : '') + '"><div class="k">Needs it in</div><div class="v">'
        + t.urgencyDays + 'd <span style="font-size:calc(11px * var(--a11y-scale, 1));color:var(--ink-3)">· at ' + window.TechOpsJobs.turnaroundDays(t) + 'd</span></div></div>'
        + '</div></div>';

      html += '<div class="card"><div class="card-head">Evidence notebook</div>';
      if (!t.testsRun.length) {
        html += '<div style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-3);line-height:1.6">Nothing measured yet. '
          + 'The complaint is a symptom, not a diagnosis — and customers are wrong about the cause more often than they are right.</div>';
      } else {
        html += '<div class="evidence-list">';
        t.testsRun.forEach(function (id) {
          var inst = INSTRUMENTS[id];
          // An instrument the rail does not know about must never take the
          // whole screen down. The multimeter did exactly that the first time
          // it recorded itself here.
          if (!inst) return;
          var f = id === 'meter' ? formatMeter(t, readings.meter || {}) : formatReading(id, readings[id] || {});
          html += '<div class="ev ' + (f.hit ? 'hit' : 'clear') + '">'
            + '<div class="ev-tool">' + inst.icon + ' ' + esc(inst.name) + '</div>'
            + (f.data ? '<div class="ev-data">' + f.data + '</div>' : '')
            + '<div class="ev-note">' + esc(f.note) + '</div></div>';
        });
        html += '</div>';
      }
      html += '</div>';

      rail.innerHTML = html;
    },

    refresh: function () {
      UI.renderHUD();
      UI.renderRail();
      if (window.TechOpsAmbience) window.TechOpsAmbience.apply();
    }
  };

  window.TechOpsUI = UI;
})(window);
