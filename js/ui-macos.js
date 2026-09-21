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
    terminal: { name: 'Terminal',         icon: '⌨️', w: 540, h: 400, x: 240, y: 56 },
    browser:  { name: 'Browser',          icon: '🧭', w: 520, h: 430, x: 70,  y: 40 },
    settings: { name: 'System Settings',  icon: '⚙️', w: 490, h: 410, x: 210, y: 65 }
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
        + '<div style="font-size:calc(34px * var(--a11y-scale, 1));margin-bottom:10px">📈</div>'
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
      + '<div style="display:flex;gap:16px;font-size:calc(11.5px * var(--a11y-scale, 1));margin:9px 0;color:var(--ink-2)">'
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
      out += '<div style="color:var(--ink-3);font-size:calc(12.5px * var(--a11y-scale, 1));padding:18px 0;text-align:center">'
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
      return '<div style="text-align:center;padding:34px 20px"><div style="font-size:calc(34px * var(--a11y-scale, 1));margin-bottom:10px">🗂️</div>'
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

    return '<div style="font-size:calc(13px * var(--a11y-scale, 1));margin-bottom:6px"><b>' + used + '% full</b> · ' + (done ? '420' : r.freeGB) + ' GB free</div>'
      + '<div class="treemap">' + tm + '</div>'
      + '<div class="note ' + (used > 92 ? 'warn' : 'good') + '">' + esc(done ? 'Space recovered and the write speed came back with it.' : r.note) + '</div>'
      + (used > 92 && !done
          ? '<div style="margin-top:12px"><div style="font-size:calc(12px * var(--a11y-scale, 1));color:var(--ink-2);margin-bottom:8px">'
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
      return '<div style="text-align:center;padding:30px 20px"><div style="font-size:calc(34px * var(--a11y-scale, 1));margin-bottom:10px">\ud83c\udfae</div>'
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

    return '<div style="font-size:calc(13px * var(--a11y-scale, 1));margin-bottom:8px"><b>' + (done ? 50 : r.usedPct) + '% full</b> · '
      + (done ? (r.freeGB + reclaim) : r.freeGB) + ' GB free of 2 TB</div>'
      + '<div class="hops">' + rows + '</div>'
      + '<div class="note ' + (done ? 'good' : 'warn') + '" style="margin-top:10px">'
      + esc(done
          ? 'Six unplayed titles removed, ' + reclaim + ' GB back, and the new game installed. Every one of them can be downloaded again from the account at any time — the licences did not go anywhere.'
          : r.note) + '</div>'
      + (!done
          ? '<div style="margin-top:12px"><div style="font-size:calc(12px * var(--a11y-scale, 1));color:var(--ink-2);margin-bottom:8px">'
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
    var mNet = J.machine(t);
    var win = mNet.os === 'windows';
    /*
     * Every hop carries the command you would actually type, because the
     * point of this screen is not that a student can click through it here
     * — it is that they can walk the same chain on a real machine that is
     * not loading pages. The commands follow whatever is on the bench.
     */
    var HOPS = [
      { id: 'self',   label: 'This machine',   addr: '192.168.1.24', why: 'Does it have an address at all, or did nothing hand one out?',
        cmd: win ? 'ipconfig' : 'ifconfig | grep "inet "',
        cmdWhy: 'An address starting 169.254 means nothing answered. That is the whole diagnosis, and you are done.' },
      { id: 'router', label: 'Your router',    addr: '192.168.1.1',  why: 'Can it reach the box in the hallway?',
        cmd: win ? 'ping 192.168.1.1' : 'ping -c 4 192.168.1.1',
        cmdWhy: win ? 'Find the address first with ipconfig — it is the Default Gateway.'
                    : 'Find the address first with netstat -nr | grep default.' },
      { id: 'isp',    label: 'ISP gateway',    addr: '81.0.64.1',    why: 'Does anything leave the building?',
        cmd: win ? 'tracert -h 3 1.1.1.1' : 'traceroute -m 3 1.1.1.1',
        cmdWhy: 'The first hop past your own router is the provider. If that never answers, the fault is outside and nothing you do in here fixes it.' },
      { id: 'dns',    label: 'DNS',            addr: '8.8.8.8',      why: 'Can it turn a name into an address?',
        cmd: win ? 'nslookup nkp.hu' : 'dig +short nkp.hu',
        cmdWhy: 'The one that catches people out: the connection is fine and only the name lookup is broken. Test against a name, not an address.' },
      { id: 'site',   label: 'A real website', addr: 'nkp.hu',       why: 'And does the whole chain work end to end?',
        cmd: 'curl -I http://nkp.hu',
        cmdWhy: 'Plain HTTP on purpose. A hotspot login page can only intercept a request it is allowed to read, so this is also how you find one.' }
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
        + '<div class="hop-cmd"><code>' + esc(h.cmd) + '</code><span>' + esc(h.cmdWhy) + '</span></div>'
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
      + 'Sent along the chain in order, it tells you exactly where the connection stops.<br><br>'
      + 'The command under each step is the one you would type on a real '
      + (win ? 'Windows machine, in Command Prompt or PowerShell' : 'Mac, in Terminal')
      + '. That is the part worth taking home — this panel is only a way of practising the order.</div>'
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
        d: 'Browser settings keep a list of every site allowed to send notifications. The culprit is a name on that list, not a virus on the disk. '
         + 'On a Mac it is Safari \u203a Settings \u203a Websites \u203a Notifications; in Chrome and Edge it is Settings \u203a Privacy \u203a Site settings \u203a Notifications.',
        game: 'notifications', verb: 'Open the notification list' },
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
    ],
<<<<<<< HEAD
    // Settings faults are fixed where they live. One step each: it opens the
    // Settings app on the right section, and the job completes when the
    // machine actually works again — the test tone plays, the screen lights,
    // the password goes through. No menu-path hunting.
    set_keyboard_layout: [
      { id: 'fix', t: 'Put the input source back and prove it with their password',
        d: 'Settings › Keyboard. The physical keys are Hungarian; whatever the software layout is set to decides what each one actually types. Try their password on the keyboard before and after — that is the test.',
        verb: 'Open Keyboard settings' }
    ],
    restore_brightness: [
      { id: 'fix', t: 'Bring the backlight up',
        d: 'Settings › Displays. If the flashlight test showed a picture, the panel is alive — so try the brightness before you believe the backlight is dead.',
        verb: 'Open Display settings' }
    ],
    set_audio_device: [
      { id: 'fix', t: 'Send the sound back to the speakers, and test it',
        d: 'Settings › Sound. Unplugging a monitor or a headset often leaves the output pointed at it. Pick the right device, check it is not muted, and play the test sound.',
        verb: 'Open Sound settings' }
=======
    set_keyboard_layout: [
      { id: 'check', t: 'Check active input source in Settings',
        d: 'Open Settings \u2192 Keyboard. Notice the layout is set to US English, which inverts Z and Y and misaligns punctuation.',
        game: 'settings', verb: 'Open Keyboard Settings', path: ['Settings', 'Keyboard', 'Input Sources'] },
      { id: 'switch', t: 'Switch layout back to Hungarian QWERTZ',
        d: 'Select Hungarian (QWERTZ) as default input source. Test keystrokes in the password verification box.',
        game: 'settings', verb: 'Apply Hungarian QWERTZ', path: ['Settings', 'Keyboard', 'Hungarian (QWERTZ)'] }
    ],
    restore_brightness: [
      { id: 'inspect', t: 'Check panel with flashlight for faint display',
        d: 'Shining a light reveals the LCD matrix is drawing pixels, but the LED backlight intensity is at 0%.',
        game: 'settings', verb: 'Inspect Displays', path: ['Settings', 'Displays', 'Brightness'] },
      { id: 'slider', t: 'Restore brightness level',
        d: 'Slide brightness up to 80%. Backlight instantly illuminates screen.',
        game: 'settings', verb: 'Set Brightness to 80%', path: ['Settings', 'Displays', 'Brightness Slider'] }
    ],
    set_audio_device: [
      { id: 'route', t: 'Inspect default sound output in Settings',
        d: 'Open Settings \u2192 Sound. Default playback is pointed at a disconnected HDMI/USB audio device and muted.',
        game: 'settings', verb: 'Open Sound Settings', path: ['Settings', 'Sound', 'Output'] },
      { id: 'speaker', t: 'Switch default output to Internal Speakers',
        d: 'Select Internal Speakers and unmute volume. Sound output returns immediately.',
        game: 'settings', verb: 'Select Internal Speakers', path: ['Settings', 'Sound', 'Internal Speakers'] }
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
    ]
  };

  /*
   * The same jobs on Windows.
   *
   * A Dell and a ThinkPad were being walked through macOS Recovery and told
   * to hold Command and R — a combination those machines do not have, on an
   * operating system they do not run, and the one shortcut that reloads the
   * browser the game is running in. `JOB_STEPS_BY_OS` picks the right
   * procedure for the machine on the bench.
   *
   * The password job deliberately teaches the legitimate route — prove it is
   * theirs, then reset through the account that owns it — rather than any of
   * the bypasses that are all over the internet. A shop that uses those is a
   * shop that unlocks stolen laptops.
   */
  var JOB_STEPS_WINDOWS = {
    reset_password: [
      { id: 'proof', t: 'Establish that it is actually theirs',
        d: 'This is the step that separates a repair shop from a fence. Everything after it is easy; this is the part that matters.',
        game: 'proof', verb: 'Check ownership' },
      { id: 'which', t: 'Work out which kind of account it is',
        d: 'A Microsoft account resets online from any other device and takes two minutes. A local account does not, and the honest answer there is different. Look at the sign-in screen before you promise anything.',
        game: 'settings', verb: 'Read the sign-in screen',
        path: ['Sign-in screen', 'The account name', 'Is there an email address?'] },
      { id: 'reset', t: 'Reset it through the account that owns it',
        d: 'For a Microsoft account: account.live.com/password/reset from your phone, with the customer doing the verification. For a local account with no reset disk there is no legitimate way in, and the honest answer is that the files can be copied off to another machine but the account cannot be opened. Say that rather than reaching for a bypass.',
        game: 'toggles3', verb: 'Do it properly',
        tgTitle: 'Which of these would you actually do?',
        tgPrompt: 'Tick everything that belongs in an honest shop. Leave the rest.',
        tgVerb: 'Those ones',
        tgOk: 'That is the professional route: prove it, reset it through the owner, and be straight about what cannot be done.',
        tgMiss: 'You have left out something that matters: ',
        tgExtra: 'That is how stolen machines get unlocked. A shop that does it once is the shop that gets asked again.',
        items: [
          { id: 'id',    label: 'Check photo ID and proof of purchase first',            pick: true },
          { id: 'ms',    label: 'Reset the Microsoft account with the owner present',    pick: true },
          { id: 'say',   label: 'Say plainly when a local account cannot be opened',     pick: true },
          { id: 'copy',  label: 'Offer to copy their files off to another machine',      pick: true },
          { id: 'byp',   label: 'Swap a system file at the login screen to get a shell', pick: false },
          { id: 'noask', label: 'Get on with it \u2014 they seem nice enough',              pick: false }
        ] }
    ],
    reinstall_os: [
      { id: 'check', t: 'Prove the drive is actually fine first',
        d: 'A machine that will not boot and a machine with a dead disk look identical from the outside. SMART settles it in ten seconds, and it decides whether this is an hour of work or a new drive.',
        game: 'settings', verb: 'Check SMART before anything',
        path: ['Command Prompt', 'wmic diskdrive get status', 'CrystalDiskInfo', 'SMART status'] },
      { id: 'copy', t: 'Copy their files off before you touch the system',
        d: 'Pull the drive, or boot a live USB, and copy the Users folder to your own storage. An in-place repair install keeps everything. Should. You copy first anyway, because "should" is not a backup.',
        game: 'backup', verb: 'Copy the Users folder' },
      { id: 'install', t: 'Repair install over the top',
        d: 'Media Creation Tool on a working PC, 8 GB stick, boot from it, and choose Upgrade \u2014 Keep personal files and apps. Not Custom, which is the one that wipes the partition.',
        game: 'reinstall', verb: 'Repair install' }
    ]
  };

  /** The right procedure for the machine on the bench. */
  function jobStepsFor(machine, act) {
    if (machine && machine.os === 'windows' && JOB_STEPS_WINDOWS[act]) return JOB_STEPS_WINDOWS[act];
    return JOB_STEPS[act];
  }

  /** Has the student found this fault yet, or already fixed it? */
  function diagnosedYet(t, act) {
    if (act && t.actionsDone.indexOf(act) !== -1) return true;
    return !!(window.TechOpsIntake && window.TechOpsIntake.diagnosed && window.TechOpsIntake.diagnosed(t));
  }

  /** What to call the software bench for this machine. */
  function labTitle(machine) {
    return machine && machine.os === 'windows' ? 'Windows lab'
         : machine && machine.os === 'macos'   ? 'macOS lab'
         : 'Software lab';
  }

<<<<<<< HEAD
  /*
   * The Browser and System Settings apps.
   *
   * These are where a settings fault actually gets found and fixed, so they
   * show what a real settings pane shows — the brightness value, the active
   * input source, the selected output device — and nothing more. No red
   * label on the answer, no "(Swapped) ⚠" and no note saying what to
   * click: spotting that the output is going to a monitor that is not
   * plugged in is the diagnosis. Neither app opens on the tab that happens to
   * match the fault, because that would be a tell too.
   *
   * Each has a test you can run and read, the way you would on a real
   * machine: a test tone, a screen that lights as you drag, and a keyboard
   * that shows what your keypresses actually produce.
   */

  // Physical Hungarian keycaps, and what each produces when the software
  // layout is set to English (US). Same positions, different labels: the
  // key printed Z sits where US has Y, the key printed 0 is where US has the
  // backtick, and so on.
  var HU_ROWS = [
    ['0','1','2','3','4','5','6','7','8','9','ö','ü','ó'],
    ['q','w','e','r','t','z','u','i','o','p','ő','ú'],
    ['a','s','d','f','g','h','j','k','l','é','á','ű'],
    ['í','y','x','c','v','b','n','m']
  ];
  var US_AT = { z: 'y', y: 'z', '0': '`', 'ö': '0', 'ü': '-', 'ó': '=',
                'ő': '[', 'ú': ']', 'é': ';', 'á': "'", 'ű': '\\', 'í': '\\' };

  function keyOut(cap, shift, layout) {
    var c = layout === 'us' && US_AT[cap] !== undefined ? US_AT[cap] : cap;
    return shift && /[a-zà-ſ]/.test(c) ? c.toUpperCase() : c;
  }

  function bodyBrowser() {
    var t = Shop.state.ticket;
    var f = J.fault(t);
    var tab = t._browserTab || 'web';
    var nav = '<div class="app-tabs">'
      + '<button class="app-tab' + (tab === 'web' ? ' on' : '') + '" data-btab="web">Web</button>'
      + '<button class="app-tab' + (tab === 'perms' ? ' on' : '') + '" data-btab="perms">Settings › Notifications</button>'
      + '</div>';

    if (tab === 'perms') {
      var sites = window.TechOpsMiniGames.NOTIFICATION_SITES.filter(function (x) {
        return !x.rogue || f.id === 'browser_push_spam';
      });
      var removed = t._permRemoved || {};
      var rows = sites.map(function (x) {
        var gone = removed[x.d] || (x.rogue && t.actionsDone.indexOf('revoke_notifications') !== -1);
        return '<div class="mg-perm' + (gone ? ' gone' : '') + '"><span class="mg-fav">' + esc(x.d.charAt(0).toUpperCase()) + '</span>'
          + '<div><b>' + esc(x.d) + '</b><span>' + (gone ? 'removed' : 'Notifications') + '</span></div>'
          + (gone ? '' : '<span class="mg-allow ' + (x.a === 'Allow' ? 'yes' : 'no') + '">' + x.a + '</span>'
             + '<button class="btn btn-sm" data-perm-rm="' + esc(x.d) + '">Remove</button>')
          + '</div>';
      }).join('');
      return nav
        + '<div class="app-crumb">Websites › Notifications — every site allowed to send alerts to this machine.</div>'
        + '<div class="mg-perms">' + rows + '</div>'
        + '<div id="perm-say" class="mg-say"></div>';
    }

    // Web tab: an address bar and whatever the network actually does with it.
    var url = t._browserUrl || '';
    var portal = f.id === 'captive_portal_loop' && t.actionsDone.indexOf('clear_portal') === -1;
    var page;
    if (!url) {
      page = '<div class="web-page muted">Type an address, or pick one. Try more than one kind.</div>';
    } else if (portal && /^https:/i.test(url)) {
      var host = url.replace(/^https?:\/\//i, '').split('/')[0];
      page = '<div class="web-page cert"><b>Your connection is not private</b>'
        + '<p>The certificate presented for <code>' + esc(host) + '</code> was issued by '
        + '<code>CafeNet-Gateway</code>, not by anyone who owns ' + esc(host) + '.</p>'
        + '<p class="muted">NET::ERR_CERT_AUTHORITY_INVALID</p></div>';
    } else if (portal && /^http:/i.test(url)) {
      page = '<div class="web-page portal"><b>🌐 CafeNet Free Wi-Fi</b>'
        + '<p>Welcome. Please accept the terms of use to get online.</p>'
        + '<label class="web-check"><input type="checkbox" id="portal-agree"> I accept the terms of use</label>'
        + '<button class="btn btn-sm btn-primary" id="portal-go" style="margin-top:8px">Connect</button></div>';
    } else {
      page = '<div class="web-page"><b>' + esc(url.replace(/^https?:\/\//i, '')) + '</b>'
        + '<p class="muted">Page loaded normally.</p></div>';
    }
    var picks = ['https://nkp.hu', 'https://www.google.com', 'http://captive.apple.com', 'http://neverssl.com'];
    return nav
      + '<div class="web-bar"><input class="mg-input" id="web-url" spellcheck="false" autocomplete="off" '
      + 'placeholder="address" value="' + esc(url) + '"><button class="btn btn-sm" id="web-go">Go</button></div>'
      + '<div class="web-picks">' + picks.map(function (u) {
          return '<button class="web-pick" data-web="' + esc(u) + '">' + esc(u) + '</button>';
        }).join('') + '</div>'
      + page;
  }

  function bodySettings() {
    var t = Shop.state.ticket;
    var f = J.fault(t);
    var tab = t._settingsTab || null;
    var nav = '<div class="app-tabs">'
      + ['displays', 'sound', 'keyboard'].map(function (k) {
          return '<button class="app-tab' + (tab === k ? ' on' : '') + '" data-stab="' + k + '">'
            + { displays: 'Displays', sound: 'Sound', keyboard: 'Keyboard' }[k] + '</button>';
        }).join('') + '</div>';

    if (!tab) {
      return nav + '<div class="web-page muted">Pick a section.</div>';
    }

    if (tab === 'displays') {
      var dim = f.id === 'display_brightness_zero' && t.actionsDone.indexOf('restore_brightness') === -1;
      var v = t._brightness !== undefined ? t._brightness : (dim ? 0 : 80);
      return nav
        + '<div class="set-row"><span>Brightness</span>'
        + '<input type="range" min="0" max="100" value="' + v + '" id="set-bright" style="flex:1">'
        + '<b class="mono" id="set-bright-v">' + v + '%</b></div>'
        + '<div class="set-screen" id="set-screen" style="--lit:' + (v / 100) + '"><span>Desktop</span></div>';
    }

    if (tab === 'sound') {
      var muted = f.id === 'audio_device_swapped' && t.actionsDone.indexOf('set_audio_device') === -1;
      var out = t._audioOut || (muted ? 'hdmi' : 'internal');
      var isMuted = t._audioMuted !== undefined ? t._audioMuted : muted;
      var devs = [
        ['hdmi', 'LG 27UL500 (HDMI)', 'not connected'],
        ['internal', 'Internal speakers', 'built in'],
        ['usb', 'Jabra USB headset', 'not connected']
      ];
      return nav
        + '<div class="set-label">Output</div>'
        + '<div class="set-list">' + devs.map(function (d) {
            return '<label class="set-opt"><input type="radio" name="audio-out" value="' + d[0] + '"'
              + (out === d[0] ? ' checked' : '') + '> <b>' + d[1] + '</b><span>' + d[2] + '</span></label>';
          }).join('') + '</div>'
        + '<label class="set-opt" style="margin-top:8px"><input type="checkbox" id="audio-mute"' + (isMuted ? ' checked' : '') + '> <b>Mute</b></label>'
        + '<button class="btn btn-sm" id="audio-test" style="margin-top:10px">Play test sound</button>'
        + '<div id="audio-say" class="mg-say"></div>';
    }

    // keyboard
    var swapped = f.id === 'keyboard_layout_swap' && t.actionsDone.indexOf('set_keyboard_layout') === -1;
    var layout = t._kbLayout || (swapped ? 'us' : 'hu');
    var typed = t._kbTyped || '';
    return nav
      + '<div class="set-label">Input source</div>'
      + '<div class="set-list">'
      + '<label class="set-opt"><input type="radio" name="kb-layout" value="hu"' + (layout === 'hu' ? ' checked' : '') + '> <b>Hungarian</b><span>QWERTZ</span></label>'
      + '<label class="set-opt"><input type="radio" name="kb-layout" value="us"' + (layout === 'us' ? ' checked' : '') + '> <b>English (US)</b><span>QWERTY</span></label>'
      + '</div>'
      + '<div class="set-label" style="margin-top:10px">Try the password on their keyboard</div>'
      + '<div class="kb-out mono">' + (typed ? esc(typed) : '<span class="muted">nothing typed yet</span>') + '</div>'
      + '<div class="kb">' + HU_ROWS.map(function (row) {
          return '<div class="kb-row">' + row.map(function (k) {
            return '<button class="kb-key" data-kb="' + esc(k) + '">' + esc(k.toUpperCase()) + '</button>';
          }).join('') + '</div>';
        }).join('')
      + '<div class="kb-row"><button class="kb-key wide' + (t._kbShift ? ' on' : '') + '" data-kb-shift>Shift</button>'
      + '<button class="kb-key wide" data-kb-back>⌫</button>'
      + '<button class="kb-key wide" data-kb-login>Log in</button></div></div>'
      + '<div id="kb-say" class="mg-say"></div>';
  }

  /*
   * ── The handset itself ─────────────────────────────────────────────
   * A phone or tablet has no desktop to log into, but it does have a screen,
   * and the three checks a counter tech actually does on one live there:
   * does it charge when you plug it in, does every part of the glass answer
   * a finger, and what is filling it up. The same three tabs appear whatever
   * the fault is, so opening them gives nothing away — and each one is also
   * how you prove a repair worked, which the old panels never let you do.
   */
  function fixedNow(t) {
    var f = J.fault(t);
    return (f.fixedBy.kind === 'part' && t.installed.some(function (i) { return i.cat === f.fixedBy.cat; }))
      || (f.fixedBy.kind === 'action' && t.actionsDone.indexOf(f.fixedBy.id) !== -1);
  }

  /** Anything done to the device since it was last restarted. */
  function changeCount(t) { return t.installed.length + t.actionsDone.length; }

  function confirmFix(t, how) {
    if (t.fixConfirmed || !fixedNow(t)) return;
    t.fixConfirmed = true;
    audio('playSuccessChime');
    UI.toast('✓ Fix confirmed', how, 'good');
    Shop.emit('change');
  }

  function provesFault(t, inst) {
    var by = (window.TechOpsIntake ? window.TechOpsIntake.revealedBy(J.fault(t).id) : []);
    return by.indexOf(inst) !== -1;
  }

  /** What the lock screen says when a charger goes in. */
  function chargeStatus(t) {
    var id = J.fault(t).id, fixed = fixedNow(t);
    if (!fixed && id === 'port_lint') return { cls: 'none', head: 'Not charging',
      sub: 'The plug stops a couple of millimetres short and wobbles. Nothing happens on the screen at all.' };
    if (!fixed && id === 'charge_port_dead') return { cls: 'flicker', head: 'Charging … not charging',
      sub: 'The bolt comes and goes every time the cable moves. When it does hold, it is the slowest possible trickle.' };
    if (!fixed && id === 'water_damage') return { cls: 'liquid', head: 'Liquid detected in the USB-C connector',
      sub: 'Charging is switched off until the connector is dry. The device is protecting itself — it cannot tell corrosion from wet.' };
    var p = reading('power');
    return { cls: 'ok', head: 'Charging', sub: (p.negotiated && p.watts >= 10 ? p.negotiated : 'USB-PD 9V/2.2A') + ' · fast charge, steady even when you move the cable.' };
  }

  function bodyHandset(t) {
    var m = J.machine(t);
    var tab = t._hsTab || 'battery';
    var tabs = [['battery', 'Battery & charging'], ['touch', 'Touch test'], ['storage', m.kind === 'tablet' ? 'iPad storage' : 'iPhone storage']];
    var head = '<div class="hs-tabs">' + tabs.map(function (x) {
      return '<button class="btn btn-sm' + (tab === x[0] ? ' btn-primary' : '') + '" data-hs-tab="' + x[0] + '">' + esc(x[1]) + '</button>';
    }).join('') + '</div>';
    if (t._hsBooting) {
      return head + '<div class="hs-screen ' + m.kind + ' booting"><div class="hs-boot"><span class="hs-spin"></span>Starting up\u2026</div></div>';
    }
    var body = tab === 'touch' ? handsetTouch(t, m) : tab === 'storage' ? handsetStorage(t, m) : handsetBattery(t, m);
    return head + body;
  }

  function handsetBattery(t, m) {
    var b = reading('battery');
    var stale = (t._hsRestartedAt || 0) < changeCount(t)
      && t.installed.some(function (i) { return i.cat === 'battery'; });
    var health;
    if (t.testsRun.indexOf('battery') === -1) {
      health = '<button class="btn btn-sm" data-hs-health>Open Battery Health · 0.2 h</button>';
    } else if (stale) {
      health = '<div class="hs-row"><span>Maximum capacity</span><b>—</b></div>'
        + '<div class="hs-small">A new cell has gone in and the ' + (m.kind === 'tablet' ? 'iPad' : 'phone') + ' has not restarted since. It reads the pack when it boots — restart it.</div>';
    } else {
      var fixedBatt = fixedNow(t) && J.fault(t).fixedBy.cat === 'battery';
      var pct = fixedBatt ? 100 : b.healthPct, cond = fixedBatt ? 'Normal' : b.condition;
      health = '<div class="hs-row"><span>Maximum capacity</span><b>' + pct + '%</b></div>'
        + '<div class="hs-row"><span>Condition</span><b class="' + (cond === 'Normal' ? '' : 'bad') + '">' + esc(cond || 'Normal') + '</b></div>'
        + '<div class="hs-row"><span>Cycle count</span><b>' + (fixedBatt ? 1 : b.cycles) + '</b></div>';
    }
    var cs = t._hsPlugged ? chargeStatus(t) : null;
    return '<div class="hs-screen ' + m.kind + '">'
      + '<div class="hs-status">' + (cs ? '<span class="hs-bolt ' + cs.cls + '">⚡</span>' : '') + '<span>' + (m.kind === 'tablet' ? 'iPad' : 'iPhone') + '</span></div>'
      + '<div class="hs-card"><div class="hs-title">Battery Health</div>' + health + '</div>'
      + '<div class="hs-card"><div class="hs-title">Charger</div>'
      + (cs ? '<div class="hs-charge ' + cs.cls + '"><b>' + esc(cs.head) + '</b><div class="hs-small">' + esc(cs.sub) + '</div></div>'
            + '<button class="btn btn-xs" data-hs-unplug style="margin-top:8px">Unplug</button>'
            : '<div class="hs-plugrow"><div class="hs-plug" data-hs-plug title="Drag the plug into the port">USB-C ▸</div>'
              + '<div class="hs-port" data-hs-port>port</div></div>'
              + '<div class="hs-small">Drag the cable into the port and watch the screen, not the cable.</div>')
      + '</div>'
      + '<div class="hs-card"><div class="hs-title">Restart</div>'
      + '<button class="hs-side" data-hs-hold><span class="hs-fill"></span>Hold the top button</button>'
      + '<div class="hs-small">Press and keep holding. A tap only locks the screen.</div></div>'
      + '</div>';
  }

  function handsetTouch(t, m) {
    var cols = m.kind === 'tablet' ? 8 : 5, rows = m.kind === 'tablet' ? 6 : 9;
    var cells = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) cells += '<i data-r="' + r + '"></i>';
    return '<div class="hs-screen ' + m.kind + '">'
      + '<div class="hs-small" style="margin-bottom:6px">Drag a finger over every square. A square that stays dark is glass that is not listening.</div>'
      + '<div class="hs-grid" data-hs-grid data-rows="' + rows + '" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cells + '</div>'
      + '<div class="hs-small" data-hs-touchsay style="margin-top:6px"></div></div>';
  }

  /** Items on a full iPad, and whether they are yours to remove. */
  var HS_STORAGE = [
    { id: 'exports', name: 'Files › Exports', size: 7.5, ok: true,
      say: 'Every video saved twice under two names. You keep one of each, and the customer watched you check.' },
    { id: 'render',  name: 'iMovie · render cache', size: 3.1, ok: true,
      say: 'Cache — iMovie rebuilds it the next time it needs it. Nothing of theirs is lost.' },
    { id: 'netflix', name: 'Netflix · downloaded episodes', size: 2.4, ok: true,
      say: 'Downloads they can fetch again on Wi-Fi.' },
    { id: 'photos',  name: 'Photos · 6 412 items, not in iCloud', size: 31, ok: false,
      say: 'Not yours to delete. These are the only copies — nothing is backed up.' },
    { id: 'system',  name: 'System data', size: 9, ok: false,
      say: 'You cannot delete this, and you should not try: it is the system managing its own caches.' }
  ];

  function handsetStorage(t, m) {
    if (t.testsRun.indexOf('storage_used') === -1) {
      return '<div class="hs-screen ' + m.kind + '"><div class="hs-card" style="text-align:center">'
        + '<div class="hs-small" style="margin-bottom:8px">Settings › General › Storage. It has to count everything first.</div>'
        + '<button class="btn btn-sm btn-primary" data-run="storage_used">Calculate · 0.2 h</button></div></div>';
    }
    var f = J.fault(t), r = reading('storage_used');
    if (f.id === 'disk_full') {
      t._hsDel = t._hsDel || {};
      var cap = 64, freed = HS_STORAGE.reduce(function (a, x) { return a + (t._hsDel[x.id] ? x.size : 0); }, 0);
      var free = Math.round((cap * (100 - r.usedPct) / 100 + freed) * 10) / 10;
      var pct = Math.round(free / cap * 100);
      var done = t.actionsDone.indexOf('free_space') !== -1;
      return '<div class="hs-screen ' + m.kind + '">'
        + '<div class="hs-row"><span><b>' + (cap - free).toFixed(1) + ' GB</b> of ' + cap + ' GB used</span><b class="' + (pct < 15 ? 'bad' : '') + '">' + free + ' GB free</b></div>'
        + '<div class="hs-bar"><i style="width:' + (100 - pct) + '%"></i></div>'
        + '<div class="hs-small" style="margin:6px 0 10px">Flash slows down badly when it has no empty blocks. Aim for about 15 % free — here, 9.6 GB.</div>'
        + HS_STORAGE.map(function (x) {
            var gone = t._hsDel[x.id];
            return '<button class="hs-item' + (gone ? ' gone' : '') + '" data-hs-del="' + x.id + '"' + (gone || done ? ' disabled' : '') + '>'
              + '<span>' + esc(x.name) + '</span><b>' + (gone ? 'removed' : x.size + ' GB') + '</b></button>'
              + (t._hsSay === x.id ? '<div class="hs-say ' + (x.ok ? 'good' : 'bad') + '">' + esc(x.say) + '</div>' : '');
          }).join('')
        + (done ? '<div class="note good" style="margin-top:10px">' + esc(J.ACTIONS.free_space.done) + '</div>' : '')
        + '</div>';
    }
    if (f.id === 'sd_formatted') {
      return '<div class="hs-screen ' + m.kind + '">'
        + '<div class="hs-title">Files › Locations</div>'
        + '<div class="hs-row"><span>On My ' + (m.kind === 'tablet' ? 'iPad' : 'iPhone') + '</span><b>41 GB free</b></div>'
        + '<div class="hs-row"><span>EOS_DIGITAL · card reader</span><b>' + r.freeGB + ' GB free</b></div>'
        + '<div class="hs-small" style="margin-top:6px">The card lists no files at all.</div></div>';
    }
    return '<div class="hs-screen ' + m.kind + '">'
      + '<div class="hs-row"><span>' + r.usedPct + '% used</span><b>' + r.freeGB + ' GB free</b></div>'
      + '<div class="hs-bar"><i style="width:' + r.usedPct + '%"></i></div>'
      + '<div class="hs-small" style="margin-top:6px">Biggest: ' + esc(r.biggest || 'Photos') + '</div></div>';
  }

  function bindHandset(host) {
    var t = Shop.state.ticket;
    host.querySelectorAll('[data-hs-tab]').forEach(function (b) {
      b.addEventListener('click', function () { t._hsTab = b.getAttribute('data-hs-tab'); audio('playKeyPop'); render(); });
    });
    var hb = host.querySelector('[data-hs-health]');
    if (hb) hb.addEventListener('click', function () {
      if (runInstrument('battery')) { UI.refresh(); render(); }
    });
    host.querySelectorAll('[data-hs-unplug]').forEach(function (b) {
      b.addEventListener('click', function () { t._hsPlugged = false; audio('playKeyPop'); render(); });
    });

    // The cable: a real drag, dropped on the port.
    var plug = host.querySelector('[data-hs-plug]'), port = host.querySelector('[data-hs-port]');
    if (plug && port) {
      plug.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var x0 = e.clientX, y0 = e.clientY;
        plug.setPointerCapture(e.pointerId);
        plug.classList.add('held');
        var move = function (ev) { plug.style.transform = 'translate(' + (ev.clientX - x0) + 'px,' + (ev.clientY - y0) + 'px)'; };
        var up = function (ev) {
          plug.removeEventListener('pointermove', move);
          plug.removeEventListener('pointerup', up);
          plug.classList.remove('held');
          var pr = port.getBoundingClientRect();
          var hit = ev.clientX >= pr.left - 12 && ev.clientX <= pr.right + 12 && ev.clientY >= pr.top - 12 && ev.clientY <= pr.bottom + 12;
          plug.style.transform = '';
          if (!hit) return;
          plugIn();
        };
        plug.addEventListener('pointermove', move);
        plug.addEventListener('pointerup', up);
      });
    }
    function plugIn() {
      t._hsPlugged = true;
      var cs = chargeStatus(t);
      // Plugging a charger in is the charge test. The first time it costs the
      // same bench time and counts as the same evidence.
      if (t.testsRun.indexOf('power') === -1) {
        t.testsRun.push('power');
        t.labourHours += UI.INSTRUMENTS.power.hours;
        Shop.emit('change');
      } else if (t.retestNeeded) {
        t.retests = t.retests || {};
        if (!t.retests.power) { t.retests.power = true; t.labourHours += UI.INSTRUMENTS.power.hours; }
      }
      audio(cs.cls === 'ok' ? 'playPing' : 'playErrorBuzz');
      if (cs.cls === 'ok' && provesFault(t, 'power')) confirmFix(t, 'Plugged in, it charges steadily. The complaint the customer walked in with is gone.');
      UI.refresh(); render();
    }

    // Restart: a press-and-hold on the side button.
    var hold = host.querySelector('[data-hs-hold]');
    if (hold) {
      var timer = null;
      var cancel = function () { hold.classList.remove('holding'); clearTimeout(timer); timer = null; };
      hold.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        hold.classList.add('holding');
        timer = setTimeout(function () {
          cancel();
          t._hsBooting = true;
          t._hsPlugged = false;
          t._hsRestartedAt = changeCount(t);
          t.labourHours += 0.05;
          audio('playKeyPop');
          render();
          setTimeout(function () {
            t._hsBooting = false;
            var fb = J.fault(t).fixedBy;
            if (fb.kind === 'part' && fb.cat === 'battery' && t.testsRun.indexOf('battery') !== -1 && provesFault(t, 'battery')) {
              confirmFix(t, 'After the restart Battery Health reads the new cell: 100 %, condition Normal.');
            }
            Shop.emit('change'); render();
          }, 1400);
        }, 1500);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
        hold.addEventListener(ev, function () {
          if (timer) { cancel(); UI.toast('Screen locked', 'That was a tap. Restarting needs the button held down until the slider appears.', 'info'); }
        });
      });
    }

    // Touch test: paint the grid with a finger.
    var grid = host.querySelector('[data-hs-grid]');
    if (grid) {
      var rowsN = +grid.getAttribute('data-rows');
      var dead = J.fault(t).id === 'cracked_screen' && !fixedNow(t) ? Math.ceil(rowsN * 2 / 3) : rowsN;
      var say = host.querySelector('[data-hs-touchsay]');
      var painting = false;
      var paint = function (el) {
        if (!el || el.parentNode !== grid || el.classList.contains('on')) return;
        if (+el.getAttribute('data-r') >= dead) { el.classList.add('dead'); }
        else el.classList.add('on');
        var cells = grid.children, on = 0, off = 0;
        for (var i = 0; i < cells.length; i++) { if (cells[i].classList.contains('on')) on++; if (cells[i].classList.contains('dead')) off++; }
        if (on + off === cells.length) {
          if (off) say.textContent = 'The bottom third never answers. The panel draws fine there — it is the digitiser layer on top that is dead.';
          else {
            say.textContent = 'Every square answers.';
            if (J.fault(t).fixedBy.cat === 'screen' && fixedNow(t)) confirmFix(t, 'The whole new panel answers a finger, edge to edge, including the bottom third that was dead.');
          }
        }
      };
      // A quick swipe delivers far fewer move events than the squares it
      // crosses, so paint every point along the stroke, not just its samples.
      var last = null;
      var stroke = function (x, y) {
        var steps = last ? Math.max(1, Math.ceil(Math.hypot(x - last.x, y - last.y) / 8)) : 1;
        for (var k = 1; k <= steps; k++) {
          var px = last ? last.x + (x - last.x) * k / steps : x, py = last ? last.y + (y - last.y) * k / steps : y;
          paint(document.elementFromPoint(px, py));
        }
        last = { x: x, y: y };
      };
      grid.addEventListener('pointerdown', function (e) { painting = true; last = null; try { grid.setPointerCapture(e.pointerId); } catch (_) {} stroke(e.clientX, e.clientY); });
      grid.addEventListener('pointermove', function (e) { if (painting) stroke(e.clientX, e.clientY); });
      grid.addEventListener('pointerup', function () { painting = false; last = null; });
    }

    // Storage: choose what goes.
    host.querySelectorAll('[data-hs-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-hs-del');
        var item = HS_STORAGE.filter(function (x) { return x.id === id; })[0];
        t._hsSay = id;
        if (!item.ok) { audio('playErrorBuzz'); return render(); }
        t._hsDel = t._hsDel || {};
        t._hsDel[id] = true;
        t.labourHours += 0.1;
        audio('playKeyPop');
        var r = reading('storage_used');
        var free = 64 * (100 - r.usedPct) / 100 + HS_STORAGE.reduce(function (a, x) { return a + (t._hsDel[x.id] ? x.size : 0); }, 0);
        if (free / 64 >= 0.15 && t.actionsDone.indexOf('free_space') === -1) {
          t.actionsDone.push('free_space');
          t.labourHours += J.ACTIONS.free_space.labourHours;
          t.fixConfirmed = true;
          audio('playSuccessChime');
          UI.toast('✓ Space recovered', J.ACTIONS.free_space.done, 'good');
        }
        Shop.emit('change'); UI.refresh(); render();
      });
    });
=======
  // ── Browser App ──────────────────────────────────────────────────────
  function bodyBrowser() {
    var t = Shop.state.ticket;
    var f = J.fault(t);
    var tab = t._browserTab || (f.id === 'captive_portal_loop' ? 'portal' : 'notifications');
    var isPush = f.id === 'browser_push_spam';
    var isPortal = f.id === 'captive_portal_loop';
    var pushDone = t.actionsDone.indexOf('revoke_notifications') !== -1;
    var portalDone = t.actionsDone.indexOf('clear_portal') !== -1;

    var navTabs = '<div style="display:flex;gap:6px;margin-bottom:12px;border-bottom:1px solid var(--line);padding-bottom:8px">'
      + '<button class="btn btn-sm' + (tab === 'notifications' ? ' btn-primary' : '') + '" data-btab="notifications">🔔 Site Permissions</button>'
      + '<button class="btn btn-sm' + (tab === 'portal' ? ' btn-primary' : '') + '" data-btab="portal">🚪 Captive Portal Probe</button>'
      + '</div>';

    if (tab === 'notifications') {
      var sites = [
        { origin: 'https://mail.google.com', perm: 'Allowed', safe: true },
        { origin: 'https://naptar.budapest.hu', perm: 'Allowed', safe: true }
      ];
      if (isPush && !pushDone) {
        sites.unshift({ origin: 'https://system-security-alert-update.xyz', perm: 'Allowed (Spamming popups)', bad: true });
      }

      var rows = sites.map(function (s) {
        return '<div class="hop" style="align-items:center;justify-content:space-between">'
          + '<div class="hop-main"><b>' + esc(s.origin) + '</b>'
          + '<div class="hop-why" style="color:' + (s.bad ? 'var(--red)' : 'var(--ink-2)') + '">' + esc(s.perm) + '</div></div>'
          + (s.bad ? '<button class="btn btn-sm btn-danger" data-browser-act="revoke_notifications">🔕 Revoke Permission</button>'
             : '<span class="chip mono" style="color:var(--green)">Clean</span>')
          + '</div>';
      }).join('');

      return navTabs
        + '<div style="font-size:12px;color:var(--ink-2);margin-bottom:10px">'
        + 'Browser Settings &rsaquo; Websites &rsaquo; Notifications. Rogue websites trick users into clicking "Allow", then send fake system alert popups.'
        + '</div>'
        + '<div class="hops">' + rows + '</div>'
        + (pushDone
            ? '<div class="note good" style="margin-top:12px"><b>Permission revoked.</b> ' + esc(J.ACTIONS.revoke_notifications.done) + '</div>'
            : isPush
              ? '<div class="note warn" style="margin-top:12px">The rogue site is flooding notifications because permission was granted. Revoke it above — no hardware or reinstallation needed.</div>'
              : '<div class="note good" style="margin-top:12px">All notification permissions are healthy.</div>');
    }

    // Portal probe tab
    var probeUrl = 'http://captive.apple.com';
    return navTabs
      + '<div style="display:flex;gap:6px;margin-bottom:12px">'
      + '<input class="form-input mono" style="flex:1" value="' + probeUrl + '" readonly>'
      + '<button class="btn btn-sm btn-primary" data-bprobe="1">Send HTTP Probe</button>'
      + '</div>'
      + '<div class="card" style="background:var(--bg-1);border:1px solid var(--line);padding:14px;border-radius:6px">'
      + '<div style="font-size:15px;font-weight:600;margin-bottom:6px">🌐 Budapest Free Wi-Fi Gateway</div>'
      + '<p style="font-size:12.5px;color:var(--ink-2);margin-bottom:12px">This public network requires captive portal authentication before internet routing is granted. Plain HTTP requests trigger the splash page redirection.</p>'
      + (!portalDone
          ? '<button class="btn btn-primary btn-sm" data-browser-act="clear_portal">Accept Terms &amp; Connect to Internet</button>'
          : '<div class="note good"><b>✓ Gateway Authenticated.</b> ' + esc(J.ACTIONS.clear_portal.done) + '</div>')
      + '</div>';
  }

  // ── System Settings App ──────────────────────────────────────────────
  function bodySettings() {
    var t = Shop.state.ticket;
    var f = J.fault(t);
    var tab = t._settingsTab || (f.id === 'display_brightness_zero' ? 'displays'
                              : f.id === 'keyboard_layout_swap' ? 'keyboard'
                              : f.id === 'audio_device_swapped' ? 'sound' : 'displays');

    var isBrightness = f.id === 'display_brightness_zero';
    var isKeyboard = f.id === 'keyboard_layout_swap';
    var isAudio = f.id === 'audio_device_swapped';

    var brightDone = t.actionsDone.indexOf('restore_brightness') !== -1;
    var kbDone = t.actionsDone.indexOf('set_keyboard_layout') !== -1;
    var audioDone = t.actionsDone.indexOf('set_audio_device') !== -1;

    var nav = '<div style="display:flex;gap:6px;margin-bottom:12px;border-bottom:1px solid var(--line);padding-bottom:8px">'
      + '<button class="btn btn-sm' + (tab === 'displays' ? ' btn-primary' : '') + '" data-stab="displays">☀️ Displays</button>'
      + '<button class="btn btn-sm' + (tab === 'sound' ? ' btn-primary' : '') + '" data-stab="sound">🔊 Sound</button>'
      + '<button class="btn btn-sm' + (tab === 'keyboard' ? ' btn-primary' : '') + '" data-stab="keyboard">⌨️ Keyboard</button>'
      + '</div>';

    if (tab === 'displays') {
      var pct = isBrightness && !brightDone ? 0 : 80;
      return nav
        + '<div style="margin-bottom:14px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Screen Brightness: <b>' + pct + '%</b></label>'
        + '<div style="background:var(--bg-1);height:18px;border-radius:9px;border:1px solid var(--line);overflow:hidden;position:relative">'
        + '<div style="width:' + pct + '%;height:100%;background:' + (pct === 0 ? 'var(--red)' : 'var(--accent)') + '"></div></div></div>'
        + (isBrightness && !brightDone
            ? '<div class="note warn" style="margin-bottom:12px">Brightness slider is set to 0%. The display panel is on, but the backlight LED is completely dark.</div>'
              + '<button class="btn btn-primary btn-sm" data-settings-act="restore_brightness">☀️ Set Brightness to 80% (or press FN+F12)</button>'
            : '<div class="note good">Brightness level is normal (80%). ' + (brightDone ? esc(J.ACTIONS.restore_brightness.done) : '') + '</div>');
    }

    if (tab === 'sound') {
      return nav
        + '<div style="font-size:13px;font-weight:600;margin-bottom:8px">Sound Output Device</div>'
        + '<div class="hops">'
        + '<div class="hop" style="align-items:center;justify-content:space-between">'
        + '<div class="hop-main"><b>Internal Stereo Speakers</b><div class="hop-why">Built-in speakers</div></div>'
        + (audioDone || !isAudio ? '<span class="chip mono" style="color:var(--green)">Active (Unmuted) ✓</span>'
           : '<button class="btn btn-sm btn-primary" data-settings-act="set_audio_device">Set as Default Output</button>')
        + '</div>'
        + '<div class="hop" style="align-items:center;justify-content:space-between">'
        + '<div class="hop-main"><b>HDMI Digital Audio (Phantom / Disconnected)</b><div class="hop-why">No physical audio monitor attached</div></div>'
        + (isAudio && !audioDone ? '<span class="chip mono" style="color:var(--red)">Active (Muted 🔇)</span>' : '<span class="chip mono">Disconnected</span>')
        + '</div></div>'
        + (isAudio && !audioDone
            ? '<div class="note warn" style="margin-top:12px">The audio subsystem is currently pointed at a disconnected HDMI device and muted. Switch default output to Internal Speakers.</div>'
            : '<div class="note good" style="margin-top:12px">Sound output configured properly. ' + (audioDone ? esc(J.ACTIONS.set_audio_device.done) : '') + '</div>');
    }

    // Keyboard tab
    return nav
      + '<div style="font-size:13px;font-weight:600;margin-bottom:8px">Input Sources</div>'
      + '<div class="hops">'
      + '<div class="hop" style="align-items:center;justify-content:space-between">'
      + '<div class="hop-main"><b>Hungarian (QWERTZ)</b><div class="hop-why">Matches physical keyboard keycaps (ö, ü, ó, ő, ú, é, á, ű, í)</div></div>'
      + (kbDone || !isKeyboard ? '<span class="chip mono" style="color:var(--green)">Active ✓</span>'
         : '<button class="btn btn-sm btn-primary" data-settings-act="set_keyboard_layout">Select Hungarian</button>')
      + '</div>'
      + '<div class="hop" style="align-items:center;justify-content:space-between">'
      + '<div class="hop-main"><b>English (US) - QWERTY</b><div class="hop-why">Z and Y inverted; numbers shifted</div></div>'
      + (isKeyboard && !kbDone ? '<span class="chip mono" style="color:var(--amber)">Active (Swapped) ⚠️</span>' : '<span class="chip mono">Inactive</span>')
      + '</div></div>'
      + '<div style="margin-top:12px">'
      + '<label style="font-size:12px;color:var(--ink-2);display:block;margin-bottom:4px">Test Typing Area:</label>'
      + '<input class="form-input mono" style="width:100%" readonly value="'
      + (isKeyboard && !kbDone ? 'Zebra0 \u2192 Types as: Yebra\u00f6 (Password fails!)' : 'Zebra0 \u2192 Types as: Zebra0 (Password accepted!)') + '">'
      + '</div>'
      + (isKeyboard && !kbDone
          ? '<div class="note warn" style="margin-top:12px">Software layout was switched to English. Switch it back to Hungarian above so customer password works.</div>'
          : '<div class="note good" style="margin-top:12px">Keyboard layout matches physical hardware. ' + (kbDone ? esc(J.ACTIONS.set_keyboard_layout.done) : '') + '</div>');
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
  }

  /** The software job this fault actually needs, shown where it can be done. */
  function bodySoftwareJob(t, isDesktop) {
    var f = J.fault(t);
    var act = f.fixedBy.kind === 'action' ? f.fixedBy.id : null;
    if (!act || !J.ACTIONS[act] || !J.ACTIONS[act].software) return '';
<<<<<<< HEAD
    // Nothing here until the student has measured something that points at
    // the real fault. The panel names the fix and explains the fault, so
    // showing it on arrival handed every software job over for free.
    if (!diagnosedYet(t, act)) return '';
    if (act === 'free_space' || act === 'kill_process') return '';   // those live in their own apps

=======
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
    if (act === 'card_recovery') {
      return '<div class="card"><div class="card-head">Card &amp; photo recovery</div>' + bodyRecovery(t) + '</div>';
    }
    var steps = jobStepsFor(J.machine(t), act);
    if (!steps) return '';
    t.job = t.job || {};
    var doneCount = steps.filter(function (x) { return t.job[x.id]; }).length;
    var allDone = doneCount === steps.length || t.actionsDone.indexOf(act) !== -1;

    if (isDesktop) {
      if (t._notesHidden) return '';
      var deskRows = steps.map(function (st, i) {
        var done = t.job[st.id] || t.actionsDone.indexOf(act) !== -1;
        var next = !done && doneCount === i;
<<<<<<< HEAD
        return '<div class="proc-step' + (done ? ' done' : next ? ' next' : ' later') + '" style="margin-bottom:6px;font-size:calc(11.5px * var(--a11y-scale, 1))">'
          + '<span class="ps-n" style="width:18px;height:18px;line-height:18px;font-size:calc(10px * var(--a11y-scale, 1))">' + (done ? '\u2713' : i + 1) + '</span>'
=======
        return '<div class="proc-step' + (done ? ' done' : next ? ' next' : ' later') + '" style="margin-bottom:6px;font-size:11.5px">'
          + '<span class="ps-n" style="width:18px;height:18px;line-height:18px;font-size:10px">' + (done ? '\u2713' : i + 1) + '</span>'
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
          + '<div style="flex:1"><b>' + esc(st.t) + '</b>'
          + (next ? '<button class="btn btn-xs btn-primary" style="margin-top:4px;display:block" data-jobgame="' + st.id + '">\ud83d\udc49 ' + esc(st.verb) + '</button>' : '')
          + '</div></div>';
      }).join('');

      return '<div class="mac-notes" style="position:absolute;top:12px;right:14px;width:290px;max-height:calc(100% - 90px);background:rgba(26,30,40,0.92);backdrop-filter:blur(18px);border:1px solid rgba(212,163,75,0.45);border-radius:10px;box-shadow:0 12px 35px rgba(0,0,0,0.6);z-index:9;display:flex;flex-direction:column;overflow:hidden">'
<<<<<<< HEAD
        + '<div style="padding:8px 12px;background:rgba(212,163,75,0.15);border-bottom:1px solid rgba(212,163,75,0.25);font-size:calc(12px * var(--a11y-scale, 1));font-weight:600;display:flex;justify-content:space-between;align-items:center">'
        + '<span>\ud83d\udccb Service Notes</span>'
        + '<button class="btn btn-xs btn-ghost" data-hide-notes style="padding:0 5px;line-height:1">\u2715</button>'
        + '</div>'
        + '<div style="padding:10px 12px;overflow-y:auto;font-size:calc(12px * var(--a11y-scale, 1));flex:1">'
        + '<div style="font-weight:600;color:var(--accent);margin-bottom:4px">' + esc(J.ACTIONS[act].label) + '</div>'
        + '<p style="font-size:calc(11px * var(--a11y-scale, 1));color:var(--ink-2);margin-bottom:10px;line-height:1.35">' + esc(f.explain.slice(0, 160)) + '...</p>'
        + '<div class="proc-list">' + deskRows + '</div>'
        + (allDone ? '<div class="note good" style="margin-top:8px;font-size:calc(11px * var(--a11y-scale, 1));padding:6px 8px"><b>\u2713 Job complete!</b> Handover ready.</div>' : '')
=======
        + '<div style="padding:8px 12px;background:rgba(212,163,75,0.15);border-bottom:1px solid rgba(212,163,75,0.25);font-size:12px;font-weight:600;display:flex;justify-content:space-between;align-items:center">'
        + '<span>\ud83d\udccb Service Notes</span>'
        + '<button class="btn btn-xs btn-ghost" data-hide-notes style="padding:0 5px;line-height:1">\u2715</button>'
        + '</div>'
        + '<div style="padding:10px 12px;overflow-y:auto;font-size:12px;flex:1">'
        + '<div style="font-weight:600;color:var(--accent);margin-bottom:4px">' + esc(J.ACTIONS[act].label) + '</div>'
        + '<p style="font-size:11px;color:var(--ink-2);margin-bottom:10px;line-height:1.35">' + esc(f.explain.slice(0, 160)) + '...</p>'
        + '<div class="proc-list">' + deskRows + '</div>'
        + (allDone ? '<div class="note good" style="margin-top:8px;font-size:11px;padding:6px 8px"><b>\u2713 Job complete!</b> Handover ready.</div>' : '')
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
        + '</div></div>';
    }

    var rows = steps.map(function (st, i) {
      var done = t.job[st.id] || t.actionsDone.indexOf(act) !== -1, next = !done && doneCount === i;
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
      + (allDone ? '<div class="note good" style="margin-top:12px">' + esc(J.ACTIONS[act].done) + '</div>' : '')
      + '</div>';
  }

  // ── shell ───────────────────────────────────────────────────────────
  function render() {
    var host = document.getElementById('view-mac');
    var t = Shop.state.ticket;
    if (!t) {
      host.innerHTML = '<div class="view-head"><h2>Software lab</h2><p>No machine connected. Take a job at the counter.</p></div>';
      return;
    }
    var power = J.canRunSoftware(t);
    if (!power.ok) {
      host.innerHTML = '<div class="view-head"><h2>' + labTitle(J.machine(t)) + '</h2></div>'
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
<<<<<<< HEAD
      host.innerHTML = '<div class="view-head"><h2>' + (m.kind === 'tablet' ? 'The iPad' : 'The iPhone') + ', switched on</h2>'
        + '<p>Plug it in, touch every part of the glass, see what is filling it. The same checks tell you what is wrong and, after the repair, whether you fixed it.</p></div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;max-width:1080px;align-items:start">'
        + '<div class="card"><div class="card-head">On the device</div>' + bodyHandset(t) + '</div>'
        + bodySoftwareJob(t, false)
        + '</div>';
      bind(host);
      bindHandset(host);
=======
      host.innerHTML = '<div class="view-head"><h2>' + (m.kind === 'tablet' ? 'Tablet' : 'Phone') + ' procedures</h2>'
        + '<p>No Mac to log into here \u2014 but the software side of a handset is still a job, and the order you do it in is the whole skill.</p></div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;max-width:1080px">'
        + '<div class="card"><div class="card-head">Card &amp; photo recovery</div>' + bodyRecovery(t) + '</div>'
        + '<div class="card"><div class="card-head">Wipe it safely for the next owner</div>' + bodyPhoneReset(t) + '</div>'
        + bodySoftwareJob(t, false)
        + '</div>';
      bind(host);
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
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
               : id === 'browser'  ? bodyBrowser()
               : id === 'settings' ? bodySettings()
               : bodyTerminal();
      wins += '<div class="mac-win" data-win="' + id + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + a.w + 'px;height:' + a.h + 'px;z-index:' + p.z + '">'
        + '<div class="mac-titlebar" data-drag="' + id + '"><span class="traffic">'
        + '<span class="tl r" data-shut="' + id + '"></span><span class="tl y"></span><span class="tl g"></span></span>'
        + esc(a.name) + '</div><div class="mac-wbody">' + body + '</div></div>';
    });

    var f2 = J.fault(t);
    var act2 = f2.fixedBy.kind === 'action' ? f2.fixedBy.id : null;
<<<<<<< HEAD

    // Every app looks the same in the dock. An earlier version lit up the one
    // that fixes the current fault, which told the student both that it was a
    // software fault and where to look, before they had measured anything.
    var dock = Object.keys(APPS).map(function (id) {
      return '<button class="dock-app' + (open[id] ? ' open' : '') + '" data-app="' + id + '" title="' + esc(APPS[id].name) + '">'
        + APPS[id].icon
=======
    var recApp = (act2 === 'revoke_notifications' || act2 === 'clear_portal') ? 'browser'
               : (act2 === 'set_keyboard_layout' || act2 === 'restore_brightness' || act2 === 'set_audio_device') ? 'settings'
               : (act2 === 'kill_process') ? 'activity'
               : (act2 === 'free_space') ? 'storage'
               : (act2 === 'reinstall_os' || act2 === 'backup_first') ? 'disk'
               : (act2 === 'fix_dns' || act2 === 'confirm_isp') ? 'network'
               : null;

    var dock = Object.keys(APPS).map(function (id) {
      var isRec = id === recApp;
      return '<button class="dock-app' + (open[id] ? ' open' : '') + (isRec ? ' recommended' : '') + '" data-app="' + id + '" title="' + esc(APPS[id].name) + (isRec ? ' (Recommended for this job)' : '') + '">'
        + APPS[id].icon
        + (isRec ? '<span style="position:absolute;top:-3px;right:-3px;width:9px;height:9px;background:var(--amber);border-radius:50%;box-shadow:0 0 6px var(--amber)"></span>' : '')
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
        + '<span class="dock-name">' + esc(APPS[id].name) + '</span></button>';
    }).join('');

    var jobDesk = bodySoftwareJob(t, true);

    host.innerHTML = '<div class="view-head"><h2>' + labTitle(m) + '</h2>'
      + '<p>The customer\'s machine, booted from your bench. Half the evidence lives here — and so do the repairs that cost nothing but your time.</p></div>'
      + '<div class="mac-screen"><div class="mac-menubar"><span class="mm-apple"></span><span class="mm-b">Finder</span>'
      + '<span>File</span><span>Edit</span><span>View</span><span>Go</span>'
<<<<<<< HEAD
      + (jobDesk || (t._notesHidden && diagnosedYet(t, act2))
          ? '<span class="mm-notes" data-toggle-notes>\ud83d\udccb Service notes</span>' : '')
=======
      + (act2 && J.ACTIONS[act2] && J.ACTIONS[act2].software
          ? '<span class="mm-notes" style="cursor:pointer;background:rgba(212,163,75,0.22);color:var(--amber);padding:1px 8px;border-radius:4px;font-weight:600" data-toggle-notes>\ud83d\udccb Service Notes</span>' : '')
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
      + '<span class="mm-right"><span>' + esc(m.name.split('(')[0].trim()) + '</span><span>🔋</span><span>Day ' + Shop.state.day + '</span></span></div>'
      + '<div class="mac-desktop">' + wins + jobDesk + '<div class="mac-dock">' + dock + '</div></div></div>';

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
    /**
     * Run one step of a multi-step procedure.
     *
     * `completes` is the action the whole procedure amounts to. The check has
     * to happen *inside* `finish`, after the mini-game closes — it used to sit
     * in a 60 ms timer next to the call, which meant it asked "are all four
     * steps done?" while the player was still on the first screen of the
     * fourth one. It was never true, and it never ran again, so a student who
     * completed the whole card recovery was told at the handover that they
     * had done nothing.
     */
    function runStep(stepId, steps, bag, hours, completes) {
      var t2 = Shop.state.ticket;
      var step = steps.filter(function (x) { return x.id === stepId; })[0];
      var finish = function () {
        t2[bag] = t2[bag] || {};
        t2[bag][stepId] = true;
        t2.labourHours += hours;
        if (completes
            && steps.every(function (x) { return t2[bag][x.id]; })
            && t2.actionsDone.indexOf(completes) === -1) {
          t2.actionsDone.push(completes);
          audio('playSuccessChime');
          UI.toast('\u2713 ' + J.ACTIONS[completes].label, J.ACTIONS[completes].done, 'good');
        }
        Shop.emit('change'); UI.refresh(); render();
      };
      if (window.TechOpsMiniGames && step && step.game) window.TechOpsMiniGames.run(step, finish);
      else { audio('playKeyPop'); finish(); }
    }

<<<<<<< HEAD
    // ── Browser ──
    function completeAct(act) {
      var t = Shop.state.ticket;
      if (t.actionsDone.indexOf(act) !== -1) return;
      t.actionsDone.push(act);
      t.labourHours += J.ACTIONS[act].labourHours;
      audio('playSuccessChime');
      UI.toast('✓ ' + J.ACTIONS[act].label, J.ACTIONS[act].done, 'good');
      Shop.emit('change'); UI.refresh();
    }
    host.querySelectorAll('[data-btab]').forEach(function (b) {
      b.addEventListener('click', function () {
        Shop.state.ticket._browserTab = b.getAttribute('data-btab');
        audio('playKeyPop'); render();
      });
    });
    var goUrl = function (u) {
      var t = Shop.state.ticket;
      u = String(u || '').trim();
      if (u && !/^[a-z]+:\/\//i.test(u)) u = 'https://' + u;   // what a browser does
      t._browserUrl = u;
      t.labourHours += 0.05;
      audio('playPing'); render();
    };
    var goBtn = host.querySelector('#web-go');
    if (goBtn) goBtn.addEventListener('click', function () { goUrl(host.querySelector('#web-url').value); });
    var urlIn = host.querySelector('#web-url');
    if (urlIn) urlIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') goUrl(urlIn.value); });
    host.querySelectorAll('[data-web]').forEach(function (b) {
      b.addEventListener('click', function () { goUrl(b.getAttribute('data-web')); });
    });
    var pgo = host.querySelector('#portal-go');
    if (pgo) pgo.addEventListener('click', function () {
      var agree = host.querySelector('#portal-agree');
      if (!agree || !agree.checked) {
        audio('playErrorBuzz');
        UI.toast('Not connected', 'The gateway will not let you through until the terms are accepted.', 'bad');
        return;
      }
      Shop.state.ticket._browserUrl = 'https://nkp.hu';
      completeAct('clear_portal'); render();
    });
    host.querySelectorAll('[data-perm-rm]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        var d = b.getAttribute('data-perm-rm');
        var site = window.TechOpsMiniGames.NOTIFICATION_SITES.filter(function (x) { return x.d === d; })[0];
        t._permRemoved = t._permRemoved || {};
        t._permRemoved[d] = true;
        if (site && site.rogue) {
          completeAct('revoke_notifications');
          render();
          return;
        }
        render();
        var say = host.querySelector('#perm-say') || document.getElementById('perm-say');
        if (say) {
          say.className = 'mg-say bad';
          say.textContent = 'That was a site they actually wanted. ' + (site ? site.why : '')
            + ' Read the address, not the list — the odd one out is the one nobody would type on purpose.';
        }
        audio('playErrorBuzz');
      });
    });

    // ── System Settings ──
    host.querySelectorAll('[data-stab]').forEach(function (b) {
      b.addEventListener('click', function () {
        Shop.state.ticket._settingsTab = b.getAttribute('data-stab');
        audio('playKeyPop'); render();
      });
    });
    var bright = host.querySelector('#set-bright');
    if (bright) {
      bright.addEventListener('input', function () {
        var t = Shop.state.ticket;
        var v = +bright.value;
        t._brightness = v;
        var lab = host.querySelector('#set-bright-v'); if (lab) lab.textContent = v + '%';
        var scr = host.querySelector('#set-screen'); if (scr) scr.style.setProperty('--lit', v / 100);
      });
      bright.addEventListener('change', function () {
        var t = Shop.state.ticket;
        if (J.fault(t).id === 'display_brightness_zero' && +bright.value >= 25) {
          completeAct('restore_brightness'); render();
        }
      });
    }
    host.querySelectorAll('input[name="audio-out"]').forEach(function (r) {
      r.addEventListener('change', function () { Shop.state.ticket._audioOut = r.value; audio('playKeyPop'); });
    });
    var mute = host.querySelector('#audio-mute');
    if (mute) mute.addEventListener('change', function () { Shop.state.ticket._audioMuted = mute.checked; });
    var atest = host.querySelector('#audio-test');
    if (atest) atest.addEventListener('click', function () {
      var t = Shop.state.ticket;
      var f = J.fault(t);
      var faulty = f.id === 'audio_device_swapped' && t.actionsDone.indexOf('set_audio_device') === -1;
      var out = t._audioOut || (faulty ? 'hdmi' : 'internal');
      var muted = t._audioMuted !== undefined ? t._audioMuted : faulty;
      var say = host.querySelector('#audio-say');
      if (out === 'internal' && !muted) {
        audio('playSuccessChime');
        say.className = 'mg-say ok';
        say.textContent = 'You hear it out of the speakers.';
        if (f.id === 'audio_device_swapped') completeAct('set_audio_device');
      } else {
        audio('playErrorBuzz');
        say.className = 'mg-say bad';
        say.textContent = 'Nothing comes out of the laptop.';
      }
    });
    host.querySelectorAll('input[name="kb-layout"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var t = Shop.state.ticket;
        t._kbLayout = r.value; t._kbTyped = '';
        audio('playKeyPop'); render();
      });
    });
    host.querySelectorAll('[data-kb]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        var f = J.fault(t);
        var swapped = f.id === 'keyboard_layout_swap' && t.actionsDone.indexOf('set_keyboard_layout') === -1;
        var layout = t._kbLayout || (swapped ? 'us' : 'hu');
        t._kbTyped = (t._kbTyped || '') + keyOut(b.getAttribute('data-kb'), t._kbShift, layout);
        t._kbShift = false;
        audio('playKeyPop'); render();
      });
    });
    var sh = host.querySelector('[data-kb-shift]');
    if (sh) sh.addEventListener('click', function () { var t = Shop.state.ticket; t._kbShift = !t._kbShift; render(); });
    var bk = host.querySelector('[data-kb-back]');
    if (bk) bk.addEventListener('click', function () { var t = Shop.state.ticket; t._kbTyped = (t._kbTyped || '').slice(0, -1); render(); });
    var login = host.querySelector('[data-kb-login]');
    if (login) login.addEventListener('click', function () {
      var t = Shop.state.ticket;
      var f = J.fault(t);
      var say = host.querySelector('#kb-say');
      if ((t._kbTyped || '') === 'Zebra0') {
        audio('playSuccessChime');
        say.className = 'mg-say ok';
        say.textContent = 'Signed in.';
        var swapped = f.id === 'keyboard_layout_swap' && t.actionsDone.indexOf('set_keyboard_layout') === -1;
        var layout = t._kbLayout || (swapped ? 'us' : 'hu');
        if (f.id === 'keyboard_layout_swap' && layout === 'hu') completeAct('set_keyboard_layout');
      } else {
        audio('playErrorBuzz');
        say.className = 'mg-say bad';
        say.textContent = 'Incorrect password. What came out was “' + (t._kbTyped || '') + '”.';
      }
    });
=======
    host.querySelectorAll('[data-btab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        t._browserTab = b.getAttribute('data-btab');
        audio('playKeyPop');
        render();
      });
    });
    host.querySelectorAll('[data-bprobe]').forEach(function (b) {
      b.addEventListener('click', function () {
        audio('playPing');
        UI.toast('HTTP Probe Sent', 'Received HTTP 302 Redirect to captive portal login gateway.', 'good');
      });
    });
    host.querySelectorAll('[data-browser-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        var act = b.getAttribute('data-browser-act');
        if (t.actionsDone.indexOf(act) === -1) {
          t.actionsDone.push(act);
          t.labourHours += J.ACTIONS[act].labourHours;
          audio('playSuccessChime');
          UI.toast('\u2713 ' + J.ACTIONS[act].label, J.ACTIONS[act].done, 'good');
          Shop.emit('change');
          UI.refresh();
          render();
        }
      });
    });

    host.querySelectorAll('[data-stab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        t._settingsTab = b.getAttribute('data-stab');
        audio('playKeyPop');
        render();
      });
    });
    host.querySelectorAll('[data-settings-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        var act = b.getAttribute('data-settings-act');
        if (t.actionsDone.indexOf(act) === -1) {
          t.actionsDone.push(act);
          t.labourHours += J.ACTIONS[act].labourHours;
          audio('playSuccessChime');
          UI.toast('\u2713 ' + J.ACTIONS[act].label, J.ACTIONS[act].done, 'good');
          Shop.emit('change');
          UI.refresh();
          render();
        }
      });
    });
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4

    host.querySelectorAll('[data-hide-notes]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        t._notesHidden = true;
        audio('playKeyPop');
        render();
      });
    });
    host.querySelectorAll('[data-toggle-notes]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Shop.state.ticket;
        t._notesHidden = !t._notesHidden;
        audio('playKeyPop');
        render();
      });
    });

    host.querySelectorAll('[data-jobgame]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t2 = Shop.state.ticket;
        var f2 = J.fault(t2);
        var act = f2.fixedBy.id;
        var steps = jobStepsFor(J.machine(Shop.state.ticket), act) || [];
        var stepId = b.getAttribute('data-jobgame');
        var step = steps.filter(function (x) { return x.id === stepId; })[0];

<<<<<<< HEAD
        // The three settings jobs are done in the Settings app itself; the
        // step just takes you there. The browser jobs keep their procedures,
        // because each step of those teaches something the app does not.
        var SETTINGS_TAB = { set_keyboard_layout: 'keyboard', restore_brightness: 'displays', set_audio_device: 'sound' };
        if (SETTINGS_TAB[act]) {
          open.settings = { x: APPS.settings.x, y: APPS.settings.y, z: ++z };
          t2._settingsTab = SETTINGS_TAB[act];
          audio('playKeyPop');
=======
        // If step points to an app in the dock, open that app directly!
        if (act === 'set_keyboard_layout' || act === 'restore_brightness' || act === 'set_audio_device') {
          open['settings'] = { x: APPS['settings'].x, y: APPS['settings'].y, z: ++z };
          audio('playKeyPop');
          Shop.emit('change');
          render();
          return;
        }
        if (act === 'revoke_notifications' || act === 'clear_portal') {
          open['browser'] = { x: APPS['browser'].x, y: APPS['browser'].y, z: ++z };
          audio('playKeyPop');
          Shop.emit('change');
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
          render();
          return;
        }

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
        runStep(b.getAttribute('data-recgame'), RECOVERY_STEPS, 'rec', 0.3, 'card_recovery');
      });
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

    // Window focus raising
    host.querySelectorAll('.mac-win').forEach(function (win) {
      win.addEventListener('mousedown', function () {
        var id = win.getAttribute('data-win');
        if (open[id]) {
          open[id].z = ++z;
          win.style.zIndex = z;
        }
      });
    });

<<<<<<< HEAD
    // Clicking anywhere in a window brings it to the front, as on a real
    // desktop. Only the title bar used to, so a window hidden behind another
    // stayed hidden until you found its title bar or went back to the dock.
    host.querySelectorAll('.mac-win').forEach(function (win) {
      win.addEventListener('mousedown', function () {
        var id = win.getAttribute('data-win');
        if (open[id] && +win.style.zIndex !== z) { open[id].z = ++z; win.style.zIndex = z; }
      });
    });

=======
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4
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
