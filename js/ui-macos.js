/**
 * TechOps Budapest — the macOS diagnostic lab.
 *
 * Not a separate game. This is where the software half of the evidence
 * comes from, and where two of the ten faults are fixed without spending
 * a forint. Force-quitting is not the fix; removing what relaunches it is.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var J    = window.TechOpsJobs;
  var esc  = function (s) { return UI.esc(s); };

  var open = {};   // appId -> {x, y}
  var z = 10;
  var sortBy = 'cpu';

  var APPS = {
    activity: { name: 'Activity Monitor', icon: '📈', w: 500, h: 430, x: 34,  y: 22 },
    disk:     { name: 'Disk Utility',     icon: '💽', w: 456, h: 380, x: 330, y: 74 },
    storage:  { name: 'Storage',          icon: '🗂️', w: 452, h: 340, x: 150, y: 128 },
    network:  { name: 'Network Utility',  icon: '📡', w: 500, h: 400, x: 90,  y: 60 },
    terminal: { name: 'Terminal',         icon: '⌨️', w: 540, h: 400, x: 240, y: 56 }
  };

  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function reading(id) {
    var t = Shop.state.ticket;
    return window.TechOpsFaults.readingsFor(J.machine(t), J.fault(t))[id] || {};
  }

  function runInstrument(id) {
    var t = Shop.state.ticket;
    if (t.testsRun.indexOf(id) !== -1) return false;
    t.testsRun.push(id);
    t.labourHours += UI.INSTRUMENTS[id].hours;
    audio('playPing');
    Shop.emit('change');
    return true;
  }

  // ── window bodies ───────────────────────────────────────────────────
  function bodyActivity() {
    var t = Shop.state.ticket;
    var ran = t.testsRun.indexOf('activity') !== -1;
    if (!ran) {
      return '<div style="text-align:center;padding:34px 20px">'
        + '<div style="font-size:34px;margin-bottom:10px">📈</div>'
        + '<p style="color:var(--ink-2)">Sample the last 60 seconds of memory and CPU.</p>'
        + '<button class="btn btn-primary" data-run="activity">Start sampling · 0.2 h</button></div>';
    }
    var r = reading('activity');
    var pressure = r.memPressurePct;
    var col = pressure > 80 ? 'var(--red)' : pressure > 60 ? 'var(--amber)' : 'var(--green)';

    // A pressure trace, drawn as bars so it reads like the real graph.
    var bars = '';
    for (var i = 0; i < 46; i++) {
      var v = Math.max(6, Math.min(100, pressure + Math.sin(i * 0.7) * 9 + (i > 34 ? 8 : 0) + (Math.random() * 7 - 3)));
      bars += '<div style="flex:1;height:' + v + '%;background:' + col + ';opacity:' + (0.35 + v / 190) + '"></div>';
    }

    var procs = [
      { n: r.topProc, mem: r.topProcMemGB, cpu: r.topProcCpuPct || 18, hot: true },
      { n: 'WindowServer', mem: 1.1, cpu: 9 },
      { n: 'Google Chrome Helper (Renderer)', mem: 1.8, cpu: 6 },
      { n: 'Safari', mem: 1.4, cpu: 4 },
      { n: 'Spotlight (mds_stores)', mem: 0.6, cpu: 2 },
      { n: 'Finder', mem: 0.4, cpu: 1 }
    ].sort(function (a, b) { return sortBy === 'mem' ? b.mem - a.mem : b.cpu - a.cpu; });

    var rows = procs.map(function (p) {
      return '<tr class="' + (p.hot && (p.cpu > 100 || p.mem > 5) ? 'hot' : '') + '"><td>' + esc(p.n) + '</td>'
        + '<td>' + p.mem.toFixed(1) + ' GB</td><td>' + p.cpu.toFixed(0) + '%</td>'
        + '<td>' + (p.hot ? '<button class="btn btn-sm btn-danger" data-fq="1">⨯&nbsp;Force&nbsp;Quit</button>' : '') + '</td></tr>';
    }).join('');

    return '<div class="gauge"><div class="gauge-label"><span>Memory pressure</span><b style="color:' + col + '">' + pressure + '%</b></div>'
      + '<div class="gauge-track"><div class="gauge-fill" style="width:' + pressure + '%;background:' + col + '"></div></div></div>'
      + '<div class="mem-graph" style="display:flex;align-items:flex-end;gap:1px;padding:4px">' + bars + '</div>'
      + '<div style="display:flex;gap:16px;font-size:11.5px;margin:9px 0;color:var(--ink-2)">'
      + '<span>Swap used <b style="color:' + (r.swapGB > 4 ? 'var(--red)' : 'var(--ink)') + '">' + r.swapGB + ' GB</b></span></div>'
      + '<table class="proc-table"><thead><tr><th>Process</th>'
      + '<th class="' + (sortBy === 'mem' ? 'sorted' : '') + '" data-sort="mem">Memory ▾</th>'
      + '<th class="' + (sortBy === 'cpu' ? 'sorted' : '') + '" data-sort="cpu">% CPU ▾</th><th></th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table>'
      + (t._forceQuit ? '<div class="note warn" style="margin-top:10px">Quit — and it came straight back. Something is relaunching it. Open <b>Terminal</b> and find out what.</div>' : '')
      + '<div class="note teach" style="margin-top:10px">Memory <b>pressure</b> is the number that matters, not "memory used". macOS will happily use all of it; red with gigabytes of swap is the machine struggling.</div>';
  }

  function bodyDisk() {
    var t = Shop.state.ticket;
    var hasSmart = t.testsRun.indexOf('smart') !== -1;
    var hasBench = t.testsRun.indexOf('bench') !== -1;
    var out = '<div style="display:flex;gap:8px;margin-bottom:12px">'
      + '<button class="btn btn-sm' + (hasSmart ? '' : ' btn-primary') + '" data-run="smart"' + (hasSmart ? ' disabled' : '') + '>🩺 Run First Aid / SMART · 0.2 h</button>'
      + '<button class="btn btn-sm' + (hasBench ? '' : '') + '" data-run="bench"' + (hasBench ? ' disabled' : '') + '>📊 Speed test · 0.3 h</button></div>';

    if (hasSmart) {
      var s = reading('smart');
      out += '<div class="disk-rows">'
        + row('SMART overall status', s.health, s.health !== 'GOOD')
        + row('Reallocated sector count', s.reallocated, s.reallocated > 0)
        + row('Current pending sectors', s.pending, s.pending > 0)
        + row('Power-on hours', s.hours + ' h', s.hours > 25000)
        + '</div><div class="note ' + (s.health === 'GOOD' ? 'good' : 'danger') + '" style="margin-top:10px">' + esc(s.note) + '</div>';
    }
    if (hasBench) {
      var b = reading('bench');
      out += '<div class="disk-rows" style="margin-top:12px">'
        + row('Sequential read', b.seqMBps + ' MB/s', b.seqMBps < 150)
        + row('Random 4K', b.randIops + ' IOPS', b.randIops < 1000)
        + row('Access latency', b.latencyMs + ' ms', b.latencyMs > 20)
        + '</div><div class="note" style="margin-top:10px">' + esc(b.note) + '</div>';
    }
    if (!hasSmart && !hasBench) {
      out += '<div style="color:var(--ink-3);font-size:12.5px;padding:18px 0;text-align:center">'
        + 'SMART is the drive\'s own record of sectors it has already had to abandon.<br>The speed test tells you what the user actually feels.</div>';
    }
    return out;
  }

  function row(k, v, bad) {
    return '<div class="disk-row ' + (bad ? 'bad' : 'ok') + '"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>';
  }

  function bodyStorage() {
    var t = Shop.state.ticket;
    var ran = t.testsRun.indexOf('storage_used') !== -1;
    if (!ran) {
      return '<div style="text-align:center;padding:34px 20px"><div style="font-size:34px;margin-bottom:10px">🗂️</div>'
        + '<p style="color:var(--ink-2)">Calculate what is actually taking up the disk.</p>'
        + '<button class="btn btn-primary" data-run="storage_used">Calculate · 0.2 h</button></div>';
    }
    var r = reading('storage_used');
    var done = t.actionsDone.indexOf('free_space') !== -1;
    var used = done ? 58 : r.usedPct;
    var segs = done
      ? [['System', 14, '#5aa9ff'], ['Apps', 12, '#a78bfa'], ['Documents', 18, '#3ddc91'], ['Photos', 14, '#f0a830'], ['Free', 42, '#242c3a']]
      : [['System', 9, '#5aa9ff'], ['Apps', 8, '#a78bfa'], ['Documents', 11, '#3ddc91'],
         [r.usedPct > 92 ? 'Downloads (duplicates)' : 'Photos', r.usedPct > 92 ? 61 : 26, r.usedPct > 92 ? '#ff5f6d' : '#f0a830'],
         ['Free', 100 - r.usedPct, '#242c3a']];

    var tm = segs.map(function (s) {
      return '<div class="tm-seg" style="flex:' + s[1] + ';background:' + s[2] + ';color:' + (s[0] === 'Free' ? 'var(--ink-3)' : '#0d1117') + '">'
        + (s[1] > 9 ? esc(s[0]) : '') + '</div>';
    }).join('');

    return '<div style="font-size:13px;margin-bottom:6px"><b>' + used + '% full</b> · ' + (done ? '420' : r.freeGB) + ' GB free</div>'
      + '<div class="treemap">' + tm + '</div>'
      + '<div class="note ' + (used > 92 ? 'warn' : 'good') + '">' + esc(done ? 'Space recovered and the write speed came back with it.' : r.note) + '</div>'
      + (used > 92 && !done
          ? '<div style="margin-top:12px"><div style="font-size:12px;color:var(--ink-2);margin-bottom:8px">'
            + '~/Downloads/exports/ — 214 GB, and most of these files exist twice under slightly different names.</div>'
            + '<button class="btn btn-primary btn-sm" data-act="free_space">🗑️ Copy to external, remove the duplicates</button></div>'
          : '')
      + '<div class="note teach" style="margin-top:12px">An almost-full SSD gets slower for a physical reason: flash can only write into erased blocks, so a full drive has to erase before every write. Free about 15% and the speed returns on its own.</div>';
  }

  /**
   * A console has no desktop to log into, but "it will not install" is a real
   * job and the decision in it is the interesting part: what is actually on
   * there, and does anyone play it.
   */
  function bodyConsoleStorage(t) {
    var ran = t.testsRun.indexOf('storage_used') !== -1;
    if (!ran) {
      return '<div style="text-align:center;padding:30px 20px"><div style="font-size:34px;margin-bottom:10px">\ud83c\udfae</div>'
        + '<p style="color:var(--ink-2)">Open the storage list and see what is actually installed.</p>'
        + '<button class="btn btn-primary" data-run="storage_used">Read the storage · 0.2 h</button></div>';
    }
    var r = reading('storage_used');
    var done = t.actionsDone.indexOf('free_space') !== -1;
    var GAMES = [
      ['Call of Duty', 248, 'yesterday'],
      ['EA FC', 96, 'last week'],
      ['Horizon', 118, '14 months ago'],
      ['Assassin\'s Creed', 142, '11 months ago'],
      ['Gran Turismo', 132, '2 years ago'],
      ['Cyberpunk', 84, '18 months ago'],
      ['Elden Ring', 61, '16 months ago'],
      ['Returnal', 58, 'never launched']
    ];
    var stale = function (g) { return /year|months|never/.test(g[2]); };
    var reclaim = GAMES.filter(stale).reduce(function (n, g) { return n + g[1]; }, 0);

    var rows = GAMES.map(function (g) {
      var old = stale(g);
      return '<div class="hop" style="align-items:center">'
        + '<div class="hop-main"><b>' + esc(g[0]) + '</b> <span class="hop-addr">' + g[1] + ' GB</span>'
        + '<div class="hop-why">Last played ' + esc(g[2]) + '</div></div>'
        + (old && !done ? '<span class="chip mono" style="color:var(--amber)">unplayed</span>' : '')
        + (done && old ? '<span class="chip mono" style="color:var(--green)">removed</span>' : '')
        + '</div>';
    }).join('');

    return '<div style="font-size:13px;margin-bottom:8px"><b>' + (done ? 50 : r.usedPct) + '% full</b> · '
      + (done ? (r.freeGB + reclaim) : r.freeGB) + ' GB free of 2 TB</div>'
      + '<div class="hops">' + rows + '</div>'
      + '<div class="note ' + (done ? 'good' : 'warn') + '" style="margin-top:10px">'
      + esc(done
          ? 'Six unplayed titles removed, ' + reclaim + ' GB back, and the new game installed. Every one of them can be downloaded again from the account at any time — the licences did not go anywhere.'
          : r.note) + '</div>'
      + (!done
          ? '<div style="margin-top:12px"><div style="font-size:12px;color:var(--ink-2);margin-bottom:8px">'
            + 'Six of these have not been launched in over a year. Together they are ' + reclaim + ' GB — and deleting a game does not take it off the account.</div>'
            + '<button class="btn btn-primary btn-sm" data-act="free_space">\ud83d\uddd1\ufe0f Show them the list and delete the unplayed ones</button></div>'
          : '')
      + '<div class="note teach" style="margin-top:12px">An expansion drive is a perfectly good upgrade and sometimes the right answer. '
      + 'But fitting one without showing the customer that a terabyte of it has never been opened is selling hardware to avoid a two-minute conversation. '
      + 'Show them first, then let them choose.</div>';
  }

  function bodyTerminal() {
    var t = Shop.state.ticket;
    var f = J.fault(t);
    var lines = ['<span class="p">techops@bench</span>:<span class="d">~</span>$ '];
    var isMalware = f.id === 'runaway_process';
    var killed = t.actionsDone.indexOf('kill_process') !== -1;

    if (!t._lsAgents) {
      return '<div class="term">' + lines.join('')
        + '<span style="opacity:.5">_</span>\n\n<span class="d"># Something is relaunching a process after every quit and every reboot.\n'
        + '# On macOS, that is almost always a LaunchAgent.</span></div>'
        + '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'
        + '<button class="btn btn-sm" data-term="ls">launchctl list | grep -v apple</button></div>';
    }

    var listing = isMalware
      ? '-\t0\tcom.mackeeper.helper\n-\t0\tcom.adobe.updater\n503\t0\tcom.spotify.webhelper'
      : '-\t0\tcom.adobe.updater\n503\t0\tcom.spotify.webhelper';

    var body = lines.join('') + 'launchctl list | grep -v apple\n<span class="d">PID\tStatus\tLabel</span>\n' + listing + '\n\n';
    if (isMalware && !killed) {
      body += '<span class="p">techops@bench</span>:<span class="d">~</span>$ <span style="opacity:.5">_</span>\n\n'
        + '<span class="w"># com.mackeeper.helper is not Apple, not Adobe, and not anything the customer installed on purpose.\n'
        + '# Its plist is what restarts the process every time you quit it.</span>';
    }
    if (killed) {
      body += '<span class="p">techops@bench</span>:<span class="d">~</span>$ launchctl bootout gui/501/com.mackeeper.helper\n'
        + '<span class="p">techops@bench</span>:<span class="d">~</span>$ rm ~/Library/LaunchAgents/com.mackeeper.helper.plist\n'
        + '<span class="p">techops@bench</span>:<span class="d">~</span>$ <span style="color:var(--green)"># gone, and it stays gone after a reboot.</span>';
    }

    var btns = '';
    if (isMalware && !killed) {
      btns = '<button class="btn btn-sm ' + (t._forceQuit ? 'btn-primary' : '') + '" data-term="rm"' + (t._forceQuit ? '' : ' disabled') + '>'
        + '<b>launchctl bootout</b> + <b>rm</b> \u2014 stop it and delete what restarts it</button>'
        + '<div class="term-why">'
        + (t._forceQuit
            ? 'You saw it come back after a force quit. This removes the plist file that relaunches it, so it stays gone after a reboot \u2014 and nothing else on the machine is touched.'
            : 'Force quit it in Activity Monitor first. Watch it come straight back \u2014 that is the thing this command actually fixes.')
        + '</div>';
    }

    return '<div class="term">' + body + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + btns + '</div>'
      + '<div class="note teach" style="margin-top:10px">A pop-up that names an exact number of viruses and gives you a phone number is never real. The damage is the launch agent — remove that, not the operating system, and every photo survives.</div>';
  }

  /**
   * Network Utility. The point is not the commands — it is that a connection is
   * a chain, and each test tells you which link is broken.
   */
  function bodyNetwork() {
    var t = Shop.state.ticket;
    t.net = t.net || {};
    var HOPS = [
      { id: 'self',   label: 'This Mac',        addr: '192.168.1.24', why: 'Does the machine have an address at all?' },
      { id: 'router', label: 'Your router',     addr: '192.168.1.1',  why: 'Can it reach the box in the hallway?' },
      { id: 'isp',    label: 'ISP gateway',     addr: '81.0.64.1',    why: 'Does anything leave the building?' },
      { id: 'dns',    label: 'DNS',             addr: '8.8.8.8',      why: 'Can it ask what a name means?' },
      { id: 'site',   label: 'A real website',  addr: 'nkp.hu',       why: 'And does the whole chain work end to end?' }
    ];
    // Where the chain is broken for this job. Wi-Fi faults break at the router.
    var breakAt = t.netBreak || 'dns';

    var rows = HOPS.map(function (h, i) {
      var done = t.net[h.id];
      var brokenHere = HOPS.findIndex(function (x) { return x.id === breakAt; }) <= i;
      var ok = !brokenHere;
      return '<div class="hop' + (done ? (ok ? ' ok' : ' bad') : '') + '">'
        + '<div class="hop-dot"></div>'
        + '<div class="hop-main"><b>' + esc(h.label) + '</b> <span class="hop-addr">' + esc(h.addr) + '</span>'
        + '<div class="hop-why">' + esc(h.why) + '</div>'
        + (done ? '<div class="hop-out">' + (ok
            ? 'ping ' + h.addr + ' \u2014 5 packets, 0% loss, 14 ms'
            : (h.id === 'dns'
                ? 'ping ' + h.addr + ' \u2014 100% packet loss. Requests go out, nothing comes back.'
                : 'ping ' + h.addr + ' \u2014 no route to host.')) + '</div>' : '')
        + '</div>'
        + (done ? '' : '<button class="btn btn-sm" data-ping="' + h.id + '">ping</button>')
        + '</div>';
    }).join('');

    var tested = Object.keys(t.net).length;
    var f2 = J.fault(t);
    var netJob = f2.fixedBy.kind === 'action'
      && ['fix_dns', 'confirm_isp'].indexOf(f2.fixedBy.id) !== -1;
    var verdict = '';
    if (tested >= 3) {
      var b = HOPS.filter(function (h) { return h.id === breakAt; })[0];
      verdict = '<div class="note good" style="margin-top:12px"><b>The chain breaks at: ' + esc(b.label) + '.</b><br>'
        + 'Everything before it answers, nothing after it does. That is the link to work on \u2014 and it means '
        + (breakAt === 'router' ? 'the problem is in this building, not with the provider.'
           : breakAt === 'dns'  ? 'the connection itself is fine; the machine just cannot turn names into addresses.'
           : breakAt === 'site' ? 'every link works right up to the last one. The network is not broken \u2014 something is answering for the site instead of letting you reach it.'
           : 'the fault is upstream of anything you can touch here.')
        + '</div>';
      if (netJob && t.actionsDone.indexOf(f2.fixedBy.id) === -1) {
        verdict += '<button class="btn btn-primary" style="margin-top:10px" data-netfix="' + f2.fixedBy.id + '">'
          + esc(J.ACTIONS[f2.fixedBy.id].label) + '</button>';
      } else if (netJob) {
        verdict += '<div class="note good" style="margin-top:10px">' + esc(J.ACTIONS[f2.fixedBy.id].done) + '</div>';
      }
    }

    return '<div class="note teach" style="margin-bottom:11px"><b>What ping is.</b> '
      + 'It sends a few packets to one address and counts how many come back. On its own that is almost useless. '
      + 'Sent along the chain in order, it tells you exactly where the connection stops.</div>'
      + '<div class="hops">' + rows + '</div>' + verdict;
  }

  /** Card recovery: a real procedure, in the order that does not lose the data. */
  var RECOVERY_STEPS = [
      { id: 'stop',  t: 'Stop using the card',
        d: 'Formatting did not erase the photos \u2014 it erased the index that says where they are. Every new write can land on top of them. The first move is to take it out and stop.',
        game: 'eject', verb: 'Eject it properly' },
      { id: 'image', t: 'Make a full copy of the card first',
        d: 'Work on a copy, never the original. If the recovery goes wrong you still have the card exactly as it was.',
        game: 'type', verb: 'Type the command', cmd: 'dd if=/dev/disk3 of=~/rescue.img' },
      { id: 'carve', t: 'Scan the copy for file headers',
        d: 'With no index to read, it reads the raw card looking for the bytes every JPEG starts with. Every one it finds is a photo.',
        game: 'carve', verb: 'Run the scan' },
      { id: 'save',  t: 'Write the results somewhere else',
        d: 'Recovered files go to a different disk. Writing them back onto the card would overwrite the ones you have not found yet.',
        game: 'pickdisk', verb: 'Choose where they go' }
  ];

  function bodyRecovery(t) {
    t.rec = t.rec || {};
    var STEPS = RECOVERY_STEPS;
    var doneCount = STEPS.filter(function (x) { return t.rec[x.id]; }).length;
    var body = STEPS.map(function (st, i) {
      var done = t.rec[st.id];
      var next = !done && doneCount === i;
      return '<div class="proc-step' + (done ? ' done' : next ? ' next' : ' later') + '">'
        + '<span class="ps-n">' + (done ? '\u2713' : i + 1) + '</span>'
        + '<div><b>' + esc(st.t) + '</b><div class="ps-d">' + esc(st.d) + '</div>'
        + (next ? '<button class="btn btn-sm btn-primary" style="margin-top:7px" data-recgame="' + st.id + '">'
                  + esc(st.verb || 'Do this') + '</button>' : '')
        + '</div></div>';
    }).join('');
    return '<div class="note teach" style="margin-bottom:11px"><b>Order matters more than tools here.</b> '
      + 'Do these out of order and the photos are gone for good.</div>'
      + '<div class="proc-list">' + body + '</div>'
      + (doneCount === STEPS.length
          ? '<div class="note good" style="margin-top:12px"><b>412 photos recovered.</b> Filenames and folders are gone \u2014 '
            + 'that index was what got erased \u2014 but every image is there.</div>' : '');
  }

  /** Phone reset: the steps, in the order that does not lock the customer out. */
  var RESET_STEPS = [
      { id: 'backup', t: 'Back it up first',
        d: 'Everything on the phone is about to be deleted. If they have not backed up, this is where they do it \u2014 not after.',
        game: 'backup', verb: 'Start the backup' },
      { id: 'appleid', t: 'Sign out of the Apple ID',
        d: 'This turns off Activation Lock. Skip it and the phone demands their password on the next setup screen, which is exactly how you hand someone a brick.',
        game: 'settings', verb: 'Find it in Settings',
        path: ['Settings', 'Their name, at the top', 'Sign Out'] },
      { id: 'unpair', t: 'Unpair the watch, forget the networks',
        d: 'Otherwise the next owner gets a phone that keeps trying to talk to somebody else\u2019s devices.',
        game: 'toggles', verb: 'Clear the pairings' },
      { id: 'erase', t: 'Erase All Content and Settings',
        d: 'This throws away the encryption key, which is what actually makes the old data unreadable \u2014 it is not overwriting anything.',
        game: 'settings', verb: 'Find it in Settings',
        path: ['Settings', 'General', 'Transfer or Reset iPhone', 'Erase All Content and Settings'] }
  ];

  function bodyPhoneReset(t) {
    t.rst = t.rst || {};
    var STEPS = RESET_STEPS;
    var doneCount = STEPS.filter(function (x) { return t.rst[x.id]; }).length;
    var body = STEPS.map(function (st, i) {
      var done = t.rst[st.id];
      var next = !done && doneCount === i;
      return '<div class="proc-step' + (done ? ' done' : next ? ' next' : ' later') + '">'
        + '<span class="ps-n">' + (done ? '\u2713' : i + 1) + '</span>'
        + '<div><b>' + esc(st.t) + '</b><div class="ps-d">' + esc(st.d) + '</div>'
        + (next ? '<button class="btn btn-sm btn-primary" style="margin-top:7px" data-rstgame="' + st.id + '">'
                  + esc(st.verb || 'Do this') + '</button>' : '')
        + '</div></div>';
    }).join('');
    return '<div class="note teach" style="margin-bottom:11px"><b>This is not a terminal job \u2014 it is an order-of-operations job.</b> '
      + 'Erase before signing out of the Apple ID and you hand back a phone nobody can activate.</div>'
      + '<div class="proc-list">' + body + '</div>'
      + (doneCount === STEPS.length
          ? '<div class="note good" style="margin-top:12px"><b>Clean and safe to hand on.</b> No Activation Lock, no data recoverable.</div>' : '');
  }

  /** Ordered procedures for the software jobs that are not a single click. */
  var JOB_STEPS = {
    reset_smc: [
      { id: 'rule_out', t: 'Rule out the things that actually are the fan',
        d: 'Before resetting anything, check the fan turns and the fins are clear. If the machine is genuinely hot, the fans are right and the reset will not help.',
        game: 'settings', verb: 'Check the temperature', path: ['Activity Monitor', 'Energy', 'Thermal state'] },
      { id: 'smc', t: 'Reset the controller',
        d: 'Shut down, hold the combination, then power on while still holding. On Apple Silicon there is no combination at all \u2014 a full shutdown for thirty seconds does it.',
        game: 'keycombo', verb: 'Do the reset',
        combo: ['Shift', 'Control', 'Option'],
        comboTitle: 'Reset the hardware controller',
        comboWhy: 'Left Shift, Control and Option, all together, then the power button \u2014 held for about ten seconds with the machine off.',
        comboDone: 'Released. The fans drop to nothing within seconds and the backlight comes back.' }
    ],
    reset_nvram: [
      { id: 'note', t: 'Write down what they will lose',
        d: 'A reset clears startup disk, volume, time zone and screen resolution. Nothing else, and no files \u2014 but tell them first so nothing is a surprise.',
        game: 'toggles3', verb: 'Note the settings' },
      { id: 'nvram', t: 'Clear the stored settings',
        d: 'Hold the combination from the moment you power on, until it chimes a second time.',
        game: 'keycombo', verb: 'Do the reset',
        combo: ['Option', 'Command', 'P', 'R'],
        comboTitle: 'Clear the settings memory',
        comboWhy: 'Option, Command, P and R together, from the instant you press power until you hear the second start-up chime.',
        comboDone: 'Second chime. Released. Settings memory cleared.' }
    ],
    reset_password: [
      { id: 'proof', t: 'Establish that it is actually theirs',
        d: 'This is the step that separates a repair shop from a fence. Everything after it is easy; this is the part that matters.',
        game: 'proof', verb: 'Check ownership' },
      { id: 'reset', t: 'Reset from recovery',
        d: 'Boot to recovery, run the reset tool, set a new password they choose. Warn them the keychain of saved passwords does not come with it.',
        game: 'keycombo', verb: 'Boot to recovery',
        combo: ['Command', 'R'],
        comboTitle: 'Boot into recovery',
        comboWhy: 'Command and R from power-on. On Apple Silicon you hold the power button instead until the options appear.',
        comboDone: 'Recovery loaded. Reset tool run, new password set with the customer typing it themselves.' }
    ],
    reinstall_os: [
      { id: 'check', t: 'Prove the drive is actually fine first',
        d: 'A machine that will not boot and a machine with a dead disk look identical from the outside. SMART settles it in ten seconds, and it decides whether this is an hour of work or a new drive.',
        game: 'settings', verb: 'Check SMART before anything', path: ['Disk Utility', 'The internal drive', 'First Aid', 'SMART status'] },
      { id: 'copy', t: 'Copy their files off before you touch the system',
        d: 'Reinstalling over the top should keep everything. Should. You copy first anyway, because "should" is not a backup.',
        game: 'backup', verb: 'Copy the user folder' },
      { id: 'install', t: 'Reinstall the system in place',
        d: 'Reinstall, not erase. This replaces the system files and leaves the Users folder exactly where it is.',
        game: 'reinstall', verb: 'Reinstall over the top' }
    ],
    migrate: [
      { id: 'audit', t: 'Work out what should actually come across',
        d: 'Their files, mail and accounts: yes. The four printer drivers and the toolbar that made the old one slow: no. A migration is a chance to leave the junk behind.',
        game: 'toggles2', verb: 'Choose what moves' },
      { id: 'move', t: 'Move the files across',
        d: 'Over a cable, not the internet, and verified afterwards.',
        game: 'backup', verb: 'Run the transfer' },
      { id: 'signin', t: 'Sign them in and update',
        d: 'Accounts, mail, and every update applied before it leaves the shop \u2014 so the first thing it does at home is not a two-hour download.',
        game: 'settings', verb: 'Finish the setup', path: ['Settings', 'Sign in to your account', 'Software Update'] }
    ],
    backup_first: [
      { id: 'stop2', t: 'Stop asking it to do things',
        d: 'Every read from a dying drive is a chance it does not come back. Close everything, then copy once, carefully.',
        game: 'eject', verb: 'Get it into a safe state' },
      { id: 'copy2', t: 'Copy the work off, now, before anything else',
        d: 'Not after the repair. Not once you have had a look. Now, while it still reads.',
        game: 'backup', verb: 'Copy 180 GB' },
      { id: 'verify', t: 'Open a few files from the copy',
        d: 'A backup nobody has opened is a rumour. Open an invoice and a photo from the copy before you tell them it is safe.',
        game: 'verify', verb: 'Verify the copy' }
    ],
    revoke_notifications: [
      { id: 'prove', t: 'Show them nothing is installed',
        d: 'Before touching a setting, open Activity Monitor together and look. No unknown process, no installer, nothing running. That is the reassurance they actually came in for \u2014 and it is also the evidence.',
        game: 'settings', verb: 'Check what is running', path: ['Activity Monitor', 'CPU', 'All Processes'] },
      { id: 'findsite', t: 'Find who was given permission',
        d: 'Browser settings keep a list of every site allowed to send notifications. The culprit is a name in that list, not a virus on the disk.',
        game: 'settings', verb: 'Open the notification list', path: ['Safari', 'Settings', 'Websites', 'Notifications'] },
      { id: 'revoke', t: 'Remove it, and show them the list',
        d: 'Deny is not enough on its own \u2014 remove it so the entry is gone. Then leave the list open and show them what Allow actually grants, because the next site will ask too.',
        game: 'toggles3', verb: 'Remove the permission',
        tgTitle: 'What actually stops the pop-ups?',
        tgPrompt: 'Tick everything that is part of the fix. Leave the rest \u2014 charging for work nobody needs is the other way to get this job wrong.',
        tgVerb: 'Do those',
        tgOk: 'Right. One permission removed, one list explained, nothing installed and nothing charged for hardware.',
        tgMiss: 'Not finished yet. You have not: ',
        tgExtra: 'That is work the machine does not need. Nothing was installed here, so there is nothing to uninstall \u2014 and a clean install would take their photographs with it.',
        items: [
          { id: 'remove',  label: 'Remove the rogue site from the notification list', pick: true },
          { id: 'show',    label: 'Show them where that list lives',                  pick: true },
          { id: 'explain', label: 'Explain what pressing Allow actually granted',     pick: true },
          { id: 'wipe',    label: 'Reinstall the operating system',                   pick: false },
          { id: 'av',      label: 'Sell them an antivirus subscription',              pick: false },
          { id: 'drive',   label: 'Replace the drive',                                pick: false }
        ] }
    ],
    clear_portal: [
      { id: 'chain', t: 'Prove the connection itself is fine',
        d: 'Ping along the chain first. Address, router, gateway, DNS \u2014 all answer. It is only the last step that fails, which already rules out the wireless card they were about to pay for.',
        game: 'settings', verb: 'Walk the chain', path: ['Network Utility', 'Ping', 'Trace the chain'] },
      { id: 'http', t: 'Make one deliberate unencrypted request',
        d: 'The gateway can only redirect a request it is allowed to read. HTTPS refuses to be read \u2014 correctly \u2014 so nothing can redirect it and every site fails. A plain HTTP address gives the portal something to intercept.',
        game: 'type', verb: 'Open the probe address', cmd: 'http://captive.apple.com' },
      { id: 'explain', t: 'Explain the warning before you clear it',
        d: 'The certificate warning was right. Somebody really was answering for a site they do not own. Worth thirty seconds, because the next time they see that warning it might not be a caf\u00e9.',
        game: 'toggles3', verb: 'Talk it through',
        tgTitle: 'What is true about that warning?',
        tgPrompt: 'Tick the statements you would actually stand behind. This is the part they take home with them.',
        tgVerb: 'Say those',
        tgOk: 'That is the honest version: the warning was doing its job, the caf\u00e9 is not sinister, and clicking through it somewhere that matters is the real risk.',
        tgMiss: 'You have left out something worth saying: ',
        tgExtra: 'You just taught somebody to ignore certificate warnings. The next one might be a bank.',
        items: [
          { id: 'right',   label: 'The warning was correct \u2014 something really was answering for that site', pick: true },
          { id: 'gateway', label: 'It was the hotspot login page, not an attack',                     pick: true },
          { id: 'careful', label: 'Clicking through it on a bank or email site is the dangerous case', pick: true },
          { id: 'ignore',  label: 'These warnings are always a false alarm \u2014 just click through',   pick: false },
          { id: 'virus',   label: 'The laptop has picked something up',                               pick: false },
          { id: 'card',    label: 'The wireless card needs replacing',                                pick: false }
        ] }
    ]
  };

  /** The software job this fault actually needs, shown where it can be done. */
  function bodySoftwareJob(t) {
    var f = J.fault(t);
    var act = f.fixedBy.kind === 'action' ? f.fixedBy.id : null;
    if (!act || !J.ACTIONS[act] || !J.ACTIONS[act].software) return '';
    if (act === 'free_space' || act === 'kill_process') return '';   // those live in their own apps

    if (act === 'card_recovery') {
      return '<div class="card"><div class="card-head">Card &amp; photo recovery</div>' + bodyRecovery(t) + '</div>';
    }
    var steps = JOB_STEPS[act];
    if (!steps) return '';
    t.job = t.job || {};
    var doneCount = steps.filter(function (x) { return t.job[x.id]; }).length;
    var rows = steps.map(function (st, i) {
      var done = t.job[st.id], next = !done && doneCount === i;
      return '<div class="proc-step' + (done ? ' done' : next ? ' next' : ' later') + '">'
        + '<span class="ps-n">' + (done ? '\u2713' : i + 1) + '</span>'
        + '<div><b>' + esc(st.t) + '</b><div class="ps-d">' + esc(st.d) + '</div>'
        + (next ? '<button class="btn btn-sm btn-primary" style="margin-top:7px" data-jobgame="' + st.id + '">'
                  + esc(st.verb) + '</button>' : '')
        + '</div></div>';
    }).join('');
    return '<div class="card"><div class="card-head">' + esc(J.ACTIONS[act].label) + '</div>'
      + '<div class="note teach" style="margin-bottom:11px">' + esc(f.explain) + '</div>'
      + '<div class="proc-list">' + rows + '</div>'
      + (doneCount === steps.length
          ? '<div class="note good" style="margin-top:12px">' + esc(J.ACTIONS[act].done) + '</div>' : '')
      + '</div>';
  }

  // ── shell ───────────────────────────────────────────────────────────
  function render() {
    var host = document.getElementById('view-mac');
    var t = Shop.state.ticket;
    if (!t) {
      host.innerHTML = '<div class="view-head"><h2>macOS lab</h2><p>No machine connected. Take a job at the counter.</p></div>';
      return;
    }
    var power = J.canRunSoftware(t);
    if (!power.ok) {
      host.innerHTML = '<div class="view-head"><h2>macOS lab</h2></div>'
        + '<div class="note warn" style="max-width:66ch"><b>This machine will not boot.</b><br><br>'
        + esc(power.why)
        + '<br><br>Software diagnostics run on a machine that is <i>working</i>. The order matters: '
        + 'read the disk, the memory pressure and the storage <b>before</b> you open it up, because once the '
        + 'battery is off you have thrown that away until you put it back.</div>'
        + (t.batteryDisconnected
            ? '<button class="btn btn-primary" style="margin-top:14px" id="btn-reconnect">Go and reconnect the battery</button>'
            : '');
      var rb = document.getElementById('btn-reconnect');
      if (rb) rb.addEventListener('click', function () { window.TechOpsApp.go('bench'); });
      return;
    }

    var m = J.machine(t);
    if (m.kind === 'console' || m.kind === 'handheld') {
      host.innerHTML = '<div class="view-head"><h2>Console software</h2>'
        + '<p>No desktop to log into on this one. What it does have is a storage list, '
        + 'and reading it before you sell anybody a drive is the whole job.</p></div>'
        + '<div style="max-width:720px"><div class="card"><div class="card-head">Storage</div>'
        + bodyConsoleStorage(t) + '</div></div>';
      bind(host);
      return;
    }
    if (m.kind === 'phone' || m.kind === 'tablet') {
      host.innerHTML = '<div class="view-head"><h2>' + (m.kind === 'tablet' ? 'Tablet' : 'Phone') + ' procedures</h2>'
        + '<p>No Mac to log into here \u2014 but the software side of a handset is still a job, and the order you do it in is the whole skill.</p></div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;max-width:1080px">'
        + '<div class="card"><div class="card-head">Card &amp; photo recovery</div>' + bodyRecovery(t) + '</div>'
        + '<div class="card"><div class="card-head">Wipe it safely for the next owner</div>' + bodyPhoneReset(t) + '</div>'
        // A tablet still has settings, a browser and a network stack, so the
        // software jobs that live in those belong here too.
        + bodySoftwareJob(t)
        + '</div>';
      bind(host);
      return;
    }
    if (false) {
      host.innerHTML = '<div class="view-head"><h2>macOS lab</h2></div>'
        + '<div class="note">This job is a phone. Software diagnostics for it happen on the bench instruments instead — '
        + 'use the charge port and battery tests over there.</div>';
      return;
    }

    // Keep every window inside the desktop, whatever size the pane is.
    var deskEl = host.querySelector('.mac-desktop');
    var deskW = deskEl ? deskEl.clientWidth : 900;
    var deskH = deskEl ? deskEl.clientHeight : 520;

    var wins = '';
    Object.keys(open).forEach(function (id) {
      var a = APPS[id], p = open[id];
      a = Object.assign({}, a, {
        w: Math.min(a.w, Math.max(300, deskW - 24)),
        h: Math.min(a.h, Math.max(240, deskH - 70))
      });
      p.x = Math.max(8, Math.min(p.x, deskW - a.w - 8));
      p.y = Math.max(6, Math.min(p.y, deskH - a.h - 56));
      var body = id === 'activity' ? bodyActivity()
               : id === 'disk'     ? bodyDisk()
               : id === 'storage'  ? bodyStorage()
               : id === 'network'  ? bodyNetwork()
               : bodyTerminal();
      wins += '<div class="mac-win" data-win="' + id + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + a.w + 'px;height:' + a.h + 'px;z-index:' + p.z + '">'
        + '<div class="mac-titlebar" data-drag="' + id + '"><span class="traffic">'
        + '<span class="tl r" data-shut="' + id + '"></span><span class="tl y"></span><span class="tl g"></span></span>'
        + esc(a.name) + '</div><div class="mac-wbody">' + body + '</div></div>';
    });

    var dock = Object.keys(APPS).map(function (id) {
      return '<button class="dock-app' + (open[id] ? ' open' : '') + '" data-app="' + id + '">' + APPS[id].icon
        + '<span class="dock-name">' + esc(APPS[id].name) + '</span></button>';
    }).join('');

    var jobPanel = bodySoftwareJob(t);

    host.innerHTML = '<div class="view-head"><h2>macOS lab</h2>'
      + '<p>The customer\'s machine, booted from your bench. Half the evidence lives here — and so do the repairs that cost nothing but your time.</p></div>'
      + (jobPanel ? '<div style="max-width:620px;margin-bottom:18px">' + jobPanel + '</div>' : '')
      + '<div class="mac-screen"><div class="mac-menubar"><span class="mm-apple"></span><span class="mm-b">Finder</span>'
      + '<span>File</span><span>Edit</span><span>View</span><span>Go</span>'
      + '<span class="mm-right"><span>' + esc(m.name.split('(')[0].trim()) + '</span><span>🔋</span><span>Day ' + Shop.state.day + '</span></span></div>'
      + '<div class="mac-desktop">' + wins + '<div class="mac-dock">' + dock + '</div></div></div>';

    bind(host);
  }

  function bind(host) {
    host.querySelectorAll('[data-app]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-app');
        if (open[id]) { open[id].z = ++z; } else { open[id] = { x: APPS[id].x, y: APPS[id].y, z: ++z }; }
        audio('playKeyPop');
        render();
      });
    });
    host.querySelectorAll('[data-shut]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); delete open[b.getAttribute('data-shut')]; render(); });
    });
    host.querySelectorAll('[data-run]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (runInstrument(b.getAttribute('data-run'))) { UI.refresh(); render(); }
      });
    });
    host.querySelectorAll('[data-sort]').forEach(function (b) {
      b.addEventListener('click', function () { sortBy = b.getAttribute('data-sort'); render(); });
    });
    host.querySelectorAll('[data-fq]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        t._forceQuit = true;
        t.labourHours += 0.1;
        audio('playErrorBuzz');
        UI.toast('Force quit', 'It disappeared from the list — and two seconds later it was back, with a new PID.', 'bad');
        Shop.emit('change');
        render();
      });
    });
    host.querySelectorAll('[data-term]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        if (b.getAttribute('data-term') === 'ls') { t._lsAgents = true; audio('playKeyPop'); }
        else {
          t.actionsDone.push('kill_process');
          t.labourHours += J.ACTIONS.kill_process.labourHours;
          audio('playSuccessChime');
          UI.toast('Launch agent removed', J.ACTIONS.kill_process.done, 'good');
        }
        Shop.emit('change');
        UI.refresh();
        render();
      });
    });
    host.querySelectorAll('[data-netfix]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t2 = Shop.state.ticket, act = b.getAttribute('data-netfix');
        t2.actionsDone.push(act);
        t2.labourHours += J.ACTIONS[act].labourHours;
        audio('playSuccessChime');
        UI.toast('\u2713 ' + J.ACTIONS[act].label, J.ACTIONS[act].done, 'good');
        Shop.emit('change'); UI.refresh(); render();
      });
    });

    host.querySelectorAll('[data-ping]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t2 = Shop.state.ticket;
        t2.net = t2.net || {};
        t2.net[b.getAttribute('data-ping')] = true;
        t2.labourHours += 0.1;
        audio('playPing');
        Shop.emit('change'); UI.refresh(); render();
      });
    });
    function runStep(stepId, steps, bag, hours) {
      var t2 = Shop.state.ticket;
      var step = steps.filter(function (x) { return x.id === stepId; })[0];
      var finish = function () {
        t2[bag] = t2[bag] || {};
        t2[bag][stepId] = true;
        t2.labourHours += hours;
        Shop.emit('change'); UI.refresh(); render();
      };
      if (window.TechOpsMiniGames && step && step.game) window.TechOpsMiniGames.run(step, finish);
      else { audio('playKeyPop'); finish(); }
    }

    host.querySelectorAll('[data-jobgame]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t2 = Shop.state.ticket;
        var f2 = J.fault(t2);
        var act = f2.fixedBy.id;
        var steps = JOB_STEPS[act] || [];
        var stepId = b.getAttribute('data-jobgame');
        var step = steps.filter(function (x) { return x.id === stepId; })[0];
        var finish = function () {
          t2.job = t2.job || {};
          t2.job[stepId] = true;
          t2.labourHours += 0.5;
          if (steps.every(function (x) { return t2.job[x.id]; }) && t2.actionsDone.indexOf(act) === -1) {
            t2.actionsDone.push(act);
            audio('playSuccessChime');
            UI.toast('\u2713 ' + J.ACTIONS[act].label, J.ACTIONS[act].done, 'good');
          }
          Shop.emit('change'); UI.refresh(); render();
        };
        if (window.TechOpsMiniGames && step && step.game) window.TechOpsMiniGames.run(step, finish);
        else finish();
      });
    });

    host.querySelectorAll('[data-recgame]').forEach(function (b) {
      b.addEventListener('click', function () {
        runStep(b.getAttribute('data-recgame'), RECOVERY_STEPS, 'rec', 0.3);
        var t2 = Shop.state.ticket;
        setTimeout(function () {
          if (RECOVERY_STEPS.every(function (x) { return (t2.rec || {})[x.id]; })
              && t2.actionsDone.indexOf('card_recovery') === -1) {
            t2.actionsDone.push('card_recovery');
            UI.toast('\u2713 Card recovered', J.ACTIONS.card_recovery.done, 'good');
            Shop.emit('change'); UI.refresh(); render();
          }
        }, 60);
      });
    });
    host.querySelectorAll('[data-rstgame]').forEach(function (b) {
      b.addEventListener('click', function () { runStep(b.getAttribute('data-rstgame'), RESET_STEPS, 'rst', 0.2); });
    });
    host.querySelectorAll('[data-act="free_space"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        t.actionsDone.push('free_space');
        t.labourHours += J.ACTIONS.free_space.labourHours;
        audio('playSuccessChime');
        UI.toast('Space recovered', J.ACTIONS.free_space.done, 'good');
        Shop.emit('change');
        UI.refresh();
        render();
      });
    });
    // window dragging
    host.querySelectorAll('[data-drag]').forEach(function (bar) {
      bar.addEventListener('mousedown', function (e) {
        if (e.target.hasAttribute('data-shut')) return;
        var id = bar.getAttribute('data-drag');
        var win = bar.parentElement;
        var sx = e.clientX, sy = e.clientY, ox = open[id].x, oy = open[id].y;
        open[id].z = ++z; win.style.zIndex = z;
        function mv(ev) {
          open[id].x = Math.max(0, ox + ev.clientX - sx);
          open[id].y = Math.max(0, oy + ev.clientY - sy);
          win.style.left = open[id].x + 'px';
          win.style.top = open[id].y + 'px';
        }
        function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
        document.addEventListener('mousemove', mv);
        document.addEventListener('mouseup', up);
        e.preventDefault();
      });
    });
  }

  window.TechOpsMac = { render: render, reset: function () { open = {}; } };
})(window);
