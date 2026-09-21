/**
 * TechOps Budapest — small procedure games.
 *
 * The phone and card procedures were a column of "Do this" buttons, which is
 * the same failure the bench had before the gestures went in: the step is
 * correct and asks nothing. Each of these makes the student do the thing that
 * the step is actually about, and nothing here can strand them.
 */
(function (window) {
  'use strict';

  var UI = window.TechOpsUI;
  var esc = function (s) { return UI.esc(s); };
  function audio(fn) { if (window.sekAudio && window.sekAudio[fn]) window.sekAudio[fn](); }

  function frame(title, body, footNote) {
    return '<div class="modal-head"><h3>' + esc(title) + '</h3></div>'
      + '<div class="modal-body" id="mg-body">' + body + '</div>'
      + '<div class="modal-foot">' + (footNote || '') + '<button class="btn" data-close>Cancel</button></div>';
  }

  /**
   * The customer's browser notification permissions. One list, shared with
   * the Browser app in the software lab, so the procedure and the app can
   * never disagree about which site is the rogue one.
   *
   * `why` is what the customer would say about each entry. None of them is
   * labelled as the culprit: recognising the one nobody would type on purpose
   * is the whole exercise.
   */
  var NOTIFICATION_SITES = [
    { d: 'nkp.hu',                  a: 'Allow', why: 'The school portal. They asked for this one.' },
    { d: 'mail.google.com',         a: 'Allow', why: 'Their email. Wanted.' },
    { d: 'idokep.hu',               a: 'Allow', why: 'Weather warnings. Harmless, and they chose it.' },
    { d: 'fast-cleaner-mac.info',   a: 'Allow', why: 'Nobody asks for this. Nobody has heard of it.', rogue: true },
    { d: 'facebook.com',            a: 'Deny',  why: 'Already blocked.' },
    { d: 'index.hu',                a: 'Allow', why: 'News. Their choice.' }
  ];

  var GAMES = {

    /** Eject before pulling the card: the menu path, with a decoy. */
    eject: function (done) {
      var m = UI.modal(frame('The card is still mounted',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">Pulling it out while the system still has it open is how you turn a recoverable card into a broken one. Get it off cleanly.</p>'
        + '<div class="mg-choices">'
        + '<button class="mg-choice" data-pick="yank">Just pull the card out</button>'
        + '<button class="mg-choice" data-pick="trash">Drag the card icon to the Trash</button>'
        + '<button class="mg-choice" data-pick="eject">Right-click the card &rarr; Eject</button>'
        + '<button class="mg-choice" data-pick="format">Reformat it, then pull it out</button>'
        + '</div><div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-pick');
          var say = document.getElementById('mg-say');
          if (v === 'eject' || v === 'trash') {
            b.classList.add('right');
            say.className = 'mg-say ok';
            say.innerHTML = v === 'trash'
              ? 'Correct, and it surprises people — on a Mac the Trash icon turns into an Eject icon while you drag a volume. Same thing.'
              : 'Clean unmount. Nothing is mid-write, so nothing new lands on top of the photos.';
            audio('playSuccessChime');
            setTimeout(function () { m.close(); done(); }, 1500);
          } else {
            b.classList.add('wrong');
            say.className = 'mg-say bad';
            say.innerHTML = v === 'format'
              ? 'No — that is a second format on a card you are trying to recover from. You would be writing over the very thing you came for.'
              : 'That is how the card got into this state. Anything half-written stays half-written.';
            audio('playErrorBuzz');
          }
        });
      });
    },

    /** Type the command. Short, and it teaches what the arguments mean. */
    type: function (done, step) {
      var target = step.cmd;
      var m = UI.modal(frame('Type it out',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">Copy this exactly. <b>if</b> is the input file, <b>of</b> is the output file — swap them and you write the empty image back over the card.</p>'
        + '<div class="mg-target">' + esc(target) + '</div>'
        + '<input class="mg-input" id="mg-typed" spellcheck="false" autocomplete="off" placeholder="type here">'
        + '<div id="mg-say" class="mg-say"></div>'));
      var input = document.getElementById('mg-typed');
      input.focus();
      input.addEventListener('input', function () {
        var v = input.value;
        var ok = target.slice(0, v.length) === v;
        input.classList.toggle('bad', !ok);
        var say = document.getElementById('mg-say');
        if (v === target) {
          say.className = 'mg-say ok';
          say.textContent = 'Reading the card into an image file. The original is now read-only as far as you are concerned.';
          audio('playSuccessChime');
          setTimeout(function () { m.close(); done(); }, 1200);
        } else if (!ok) {
          say.className = 'mg-say bad';
          say.textContent = 'That is not what it says. One wrong character here is a wiped card.';
        } else {
          say.className = 'mg-say';
          say.textContent = '';
        }
      });
    },

    /** Watch the carve run, and read what it is actually finding. */
    carve: function (done) {
      var m = UI.modal(frame('Scanning the image',
        '<div class="mg-scan"><div class="mg-scan-bar"><div id="mg-scan-fill"></div></div>'
        + '<div class="term" id="mg-log" style="min-height:150px;margin-top:11px"></div></div>'
        + '<div id="mg-say" class="mg-say"></div>'));
      var lines = [
        '<span class="d"># reading raw sectors, ignoring the (erased) index</span>',
        'sector 0x0004A200  <span class="w">FF D8 FF E0</span>  JPEG start  → IMG_0001.jpg',
        'sector 0x0011C800  <span class="w">FF D8 FF E1</span>  JPEG start  → IMG_0002.jpg',
        'sector 0x0023B100  <span class="e">no header</span>   skipping',
        'sector 0x0031F400  <span class="w">FF D8 FF E0</span>  JPEG start  → IMG_0003.jpg',
        '<span class="d"># ... 409 more</span>',
        '<span class="p">412 files recovered.</span>'
      ];
      var log = document.getElementById('mg-log'), fill = document.getElementById('mg-scan-fill'), i = 0;
      var iv = setInterval(function () {
        if (i >= lines.length) {
          clearInterval(iv);
          var say = document.getElementById('mg-say');
          say.className = 'mg-say ok';
          say.innerHTML = 'Every JPEG on earth starts with the same few bytes. That is the whole trick — no index needed.';
          audio('playSuccessChime');
          setTimeout(function () { m.close(); done(); }, 1500);
          return;
        }
        log.innerHTML += lines[i] + '\n';
        log.scrollTop = log.scrollHeight;
        fill.style.width = ((i + 1) / lines.length * 100) + '%';
        audio('playKeyPop');
        i++;
      }, 420);
    },

    /** Where do the recovered files go? The obvious answer is the wrong one. */
    pickdisk: function (done) {
      var m = UI.modal(frame('Where should the recovered files go?',
        '<div class="mg-choices">'
        + '<button class="mg-choice" data-pick="card">Back onto the SD card</button>'
        + '<button class="mg-choice" data-pick="ext">Onto the shop’s external drive</button>'
        + '<button class="mg-choice" data-pick="same">Into the same image file</button>'
        + '</div><div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-pick');
          var say = document.getElementById('mg-say');
          if (v === 'ext') {
            b.classList.add('right');
            say.className = 'mg-say ok';
            say.textContent = 'A different disk entirely. Nothing you write can land on a photo you have not found yet.';
            audio('playSuccessChime');
            setTimeout(function () { m.close(); done(); }, 1400);
          } else {
            b.classList.add('wrong');
            say.className = 'mg-say bad';
            say.textContent = v === 'card'
              ? 'That writes recovered photos on top of the ones still waiting to be found. You would lose half of them to save yourself a cable.'
              : 'The image is your only clean copy of the card. Writing into it destroys the thing you are reading from.';
            audio('playErrorBuzz');
          }
        });
      });
    },

    /** Navigate a real Settings path, one tap at a time, with plausible decoys. */
    settings: function (done, step) {
      var path = step.path;
      var depth = 0;
      var DECOYS = [
        ['Wi-Fi', 'Bluetooth', 'Screen Time', 'Privacy & Security'],
        ['iCloud', 'Media & Purchases', 'Find My', 'Family Sharing'],
        ['About', 'Software Update', 'AirDrop', 'Storage'],
        ['Reset', 'Transfer to a New iPhone', 'Erase All Content and Settings']
      ];
      var m = UI.modal(frame('Find it in Settings', '<div id="mg-settings"></div><div id="mg-say" class="mg-say"></div>'));

      function draw() {
        var host = document.getElementById('mg-settings');
        if (depth >= path.length) return;
        var want = path[depth];
        var opts = (DECOYS[Math.min(depth, DECOYS.length - 1)] || []).filter(function (d) { return d !== want; }).slice(0, 3);
        opts.push(want);
        opts.sort(function (a, b) { return a.length - b.length; });
        host.innerHTML = '<div class="mg-breadcrumb">' + path.slice(0, depth).map(esc).join(' &rsaquo; ') + (depth ? ' &rsaquo;' : '') + '</div>'
          + '<div class="mg-settings-list">' + opts.map(function (o) {
              return '<button class="mg-row" data-opt="' + esc(o) + '">' + esc(o) + '<span>&rsaquo;</span></button>';
            }).join('') + '</div>';
        host.querySelectorAll('[data-opt]').forEach(function (b) {
          b.addEventListener('click', function () {
            var say = document.getElementById('mg-say');
            if (b.getAttribute('data-opt') === want) {
              depth++;
              audio('playKeyPop');
              say.className = 'mg-say'; say.textContent = '';
              if (depth >= path.length) {
                say.className = 'mg-say ok';
                say.textContent = 'That is the one.';
                audio('playSuccessChime');
                setTimeout(function () { m.close(); done(); }, 900);
              } else draw();
            } else {
              b.classList.add('wrong');
              say.className = 'mg-say bad';
              say.textContent = 'Not in there. Read the labels — on a customer\'s phone you cannot just tap around.';
              audio('playErrorBuzz');
            }
          });
        });
      }
      draw();
    },

    /** Flip the right switches; leaving one on is the whole point. */
    toggles: function (done) {
      var items = [
        { id: 'watch',  label: 'Apple Watch still paired',        must: true },
        { id: 'wifi',   label: 'Home Wi-Fi remembered',           must: true },
        { id: 'bt',     label: 'Car Bluetooth remembered',        must: true },
        { id: 'bright', label: 'Screen brightness set to 60%',    must: false },
        { id: 'wall',   label: 'Custom wallpaper',                must: false }
      ];
      var state = {};
      var m = UI.modal(frame('Clear what should not follow the phone',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">Some of this has to go before the phone changes hands. Some of it is none of your business.</p>'
        + '<div class="mg-toggles">' + items.map(function (it) {
            return '<button class="mg-toggle" data-tg="' + it.id + '"><span class="tg-box"></span>' + esc(it.label) + '</button>';
          }).join('') + '</div>'
        + '<button class="btn btn-primary" id="mg-confirm" style="margin-top:12px">Done</button>'
        + '<div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-tg]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-tg');
          state[id] = !state[id];
          b.classList.toggle('on', state[id]);
          audio('playKeyPop');
        });
      });
      document.getElementById('mg-confirm').addEventListener('click', function () {
        var say = document.getElementById('mg-say');
        var missed = items.filter(function (it) { return it.must && !state[it.id]; });
        var extra  = items.filter(function (it) { return !it.must && state[it.id]; });
        if (!missed.length && !extra.length) {
          say.className = 'mg-say ok';
          say.textContent = 'Pairings cleared, personal settings left alone.';
          audio('playSuccessChime');
          setTimeout(function () { m.close(); done(); }, 1100);
        } else {
          say.className = 'mg-say bad';
          say.textContent = missed.length
            ? 'Still paired: ' + missed.map(function (x) { return x.label.toLowerCase(); }).join(', ') + '. Those follow the phone to its next owner.'
            : 'You have cleared things that were just how they liked it. Wiping preferences you were not asked to touch is not thoroughness.';
          audio('playErrorBuzz');
        }
      });
    },

    /** Reinstall: the one choice that decides whether they keep their files. */
    reinstall: function (done) {
      var m = UI.modal(frame('Reinstall — which one?',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">Two options that sound the same and are not.</p>'
        + '<div class="mg-choices">'
        + '<button class="mg-choice" data-pick="over">Reinstall macOS <span style="opacity:.6">(keeps the Users folder)</span></button>'
        + '<button class="mg-choice" data-pick="erase">Erase disk, then install <span style="opacity:.6">(clean install)</span></button>'
        + '</div><div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var say = document.getElementById('mg-say');
          if (b.getAttribute('data-pick') === 'over') {
            b.classList.add('right');
            say.className = 'mg-say ok';
            say.textContent = 'System files replaced, personal files untouched. They will log in and everything will be where they left it.';
            audio('playSuccessChime');
            setTimeout(function () { m.close(); done(); }, 1500);
          } else {
            b.classList.add('wrong');
            say.className = 'mg-say bad';
            say.textContent = 'That erases fifteen years of their photos to fix a broken update. A clean install is for a machine you are selling, not one you are repairing.';
            audio('playErrorBuzz');
          }
        });
      });
    },

    /** Which settings a reset will actually clear — and which it will not. */
    /**
     * Pick the right set out of a list. Defaults to the NVRAM reset (what a
     * customer actually loses), but any step can supply its own question, so
     * a step is never stuck borrowing another job's wording.
     */
    toggles3: function (done, step) {
      step = step || {};
      var items = step.items || [
        { id: 'boot',  label: 'Startup disk choice',        pick: true },
        { id: 'vol',   label: 'Speaker volume',             pick: true },
        { id: 'tz',    label: 'Time zone',                  pick: true },
        { id: 'res',   label: 'Screen resolution',          pick: true },
        { id: 'files', label: 'Their documents and photos', pick: false },
        { id: 'apps',  label: 'Installed applications',     pick: false }
      ];
      var title  = step.tgTitle  || 'What will this actually clear?';
      var prompt = step.tgPrompt || 'Tick the things the customer will lose, so you can tell them before rather than after.';
      var verb   = step.tgVerb   || 'Tell them';
      var okText = step.tgOk     || 'Exactly right. Four small settings, no files. Now they know.';
      var missLead  = step.tgMiss  || 'You missed: ';
      var extraText = step.tgExtra || 'You have just told a customer they will lose their photographs. They will not \u2014 this reset never touches the drive.';

      var state = {};
      var m = UI.modal(frame(title,
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">' + esc(prompt) + '</p>'
        + '<div class="mg-toggles">' + items.map(function (it) {
            return '<button class="mg-toggle" data-tg="' + it.id + '"><span class="tg-box"></span>' + esc(it.label) + '</button>';
          }).join('') + '</div>'
        + '<button class="btn btn-primary" id="mg-confirm" style="margin-top:12px">' + esc(verb) + '</button>'
        + '<div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-tg]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-tg');
          state[id] = !state[id];
          b.classList.toggle('on', state[id]);
          audio('playKeyPop');
        });
      });
      document.getElementById('mg-confirm').addEventListener('click', function () {
        var say = document.getElementById('mg-say');
        var missed = items.filter(function (i) { return i.pick && !state[i.id]; });
        var extra  = items.filter(function (i) { return !i.pick && state[i.id]; });
        if (!missed.length && !extra.length) {
          say.className = 'mg-say ok';
          say.textContent = okText;
          audio('playSuccessChime');
          setTimeout(function () { m.close(); done(); }, 1300);
        } else {
          say.className = 'mg-say bad';
          say.textContent = extra.length ? extraText
            : missLead + missed.map(function (x) { return x.label.toLowerCase(); }).join(', ') + '.';
          audio('playErrorBuzz');
        }
      });
    },

    /** Migration: what comes across and what gets left behind. */
    toggles2: function (done) {
      var items = [
        { id: 'docs',    label: 'Documents, photos and mail',        take: true },
        { id: 'accounts',label: 'Their accounts and passwords',      take: true },
        { id: 'bookmarks',label: 'Browser bookmarks',                take: true },
        { id: 'toolbar', label: '"PC Speed Booster" from 2019',      take: false },
        { id: 'drivers', label: 'Drivers for a printer they threw out', take: false },
        { id: 'startup', label: 'Nine things that launch at startup', take: false }
      ];
      var state = {};
      var m = UI.modal(frame('What comes across?',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">A new machine is a chance to leave the reason the old one was slow behind. Tick what moves.</p>'
        + '<div class="mg-toggles">' + items.map(function (it) {
            return '<button class="mg-toggle" data-tg="' + it.id + '"><span class="tg-box"></span>' + esc(it.label) + '</button>';
          }).join('') + '</div>'
        + '<button class="btn btn-primary" id="mg-confirm" style="margin-top:12px">Transfer these</button>'
        + '<div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-tg]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-tg');
          state[id] = !state[id];
          b.classList.toggle('on', state[id]);
          audio('playKeyPop');
        });
      });
      document.getElementById('mg-confirm').addEventListener('click', function () {
        var say = document.getElementById('mg-say');
        var missing = items.filter(function (i) { return i.take && !state[i.id]; });
        var junk = items.filter(function (i) { return !i.take && state[i.id]; });
        if (!missing.length && !junk.length) {
          say.className = 'mg-say ok';
          say.textContent = 'Everything they own, none of what was slowing them down.';
          audio('playSuccessChime');
          setTimeout(function () { m.close(); done(); }, 1300);
        } else {
          say.className = 'mg-say bad';
          say.textContent = missing.length
            ? 'You left behind: ' + missing.map(function (x) { return x.label.toLowerCase(); }).join(', ') + '. That is the part they actually care about.'
            : 'You carried across the junk. The new machine will be slow within a month and they will not know why.';
          audio('playErrorBuzz');
        }
      });
    },

    /** Verify: open something from the copy, not from the original. */
    verify: function (done) {
      var m = UI.modal(frame('Check the copy actually works',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">Open a file — but from where?</p>'
        + '<div class="mg-choices">'
        + '<button class="mg-choice" data-pick="orig">Open an invoice from the customer\u2019s drive</button>'
        + '<button class="mg-choice" data-pick="copy">Open an invoice from the external copy</button>'
        + '<button class="mg-choice" data-pick="size">Just check the folder sizes match</button>'
        + '</div><div id="mg-say" class="mg-say"></div>'));
      m.el.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-pick'), say = document.getElementById('mg-say');
          if (v === 'copy') {
            b.classList.add('right');
            say.className = 'mg-say ok';
            say.textContent = 'It opens. That is a backup. Now you can touch the drive.';
            audio('playSuccessChime');
            setTimeout(function () { m.close(); done(); }, 1400);
          } else {
            b.classList.add('wrong');
            say.className = 'mg-say bad';
            say.textContent = v === 'orig'
              ? 'That proves the original works, which you already knew. It tells you nothing about the copy.'
              : 'Matching sizes tell you the right number of bytes moved, not that any of them are readable. Open one.';
            audio('playErrorBuzz');
          }
        });
      });
    },

    /** Hold the right keys at the right moment. */
    /**
     * The browser's notification permissions, as a panel you can actually
     * read rather than a menu path to guess.
     *
     * Hunting for the right words in an invented menu tree taught nothing
     * except the tree. What matters is recognising which entry does not
     * belong in the list and knowing that removing it is the whole fix.
     */
    notifications: function (done, step) {
      var win = step && step.windows;
      var SITES = NOTIFICATION_SITES;
      var removed = {}, wrong = 0;
      var m = UI.modal(frame((win ? 'Edge' : 'Safari') + ' \u203a Settings \u203a Websites \u203a Notifications',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">Every site here was allowed by somebody clicking a button once. '
        + 'One of them is sending the fake warnings. Remove that one and nothing else \u2014 the others were asked for.</p>'
        + '<div class="mg-perms" id="mg-perms"></div>'
        + '<div id="mg-say" class="mg-say"></div>'));

      function draw() {
        document.getElementById('mg-perms').innerHTML = SITES.map(function (x, i) {
          if (removed[i]) {
            return '<div class="mg-perm gone"><span class="mg-fav">\u2013</span>'
              + '<div><b>' + esc(x.d) + '</b><span>removed</span></div></div>';
          }
          return '<div class="mg-perm"><span class="mg-fav">' + esc(x.d.charAt(0).toUpperCase()) + '</span>'
            + '<div><b>' + esc(x.d) + '</b><span>' + esc(x.why) + '</span></div>'
            + '<span class="mg-allow ' + (x.a === 'Allow' ? 'yes' : 'no') + '">' + x.a + '</span>'
            + '<button class="btn btn-sm" data-rm="' + i + '">Remove</button></div>';
        }).join('');
        document.getElementById('mg-perms').querySelectorAll('[data-rm]').forEach(function (b) {
          b.addEventListener('click', function () {
            var i = +b.getAttribute('data-rm');
            var say = document.getElementById('mg-say');
            removed[i] = true;
            if (SITES[i].rogue) {
              say.className = 'mg-say ok';
              say.textContent = 'That is the one. Nothing was installed, so nothing had to be uninstalled \u2014 one permission, gone.';
              audio('playSuccessChime');
              draw();
              setTimeout(function () { m.close(); done(); }, 1500);
              return;
            }
            wrong++;
            say.className = 'mg-say bad';
            say.textContent = 'That was a site they actually wanted. ' + SITES[i].why
              + ' Read the address, not the list \u2014 the odd one out is the one nobody would type on purpose.';
            audio('playErrorBuzz');
            draw();
          });
        });
      }
      draw();
    },

    keycombo: function (done, step) {
      var combo = step.combo, held = {};
      var m = UI.modal(frame(step.comboTitle || 'Hold the key combination',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">' + esc(step.comboWhy || '') + '</p>'
        + '<div class="mg-keys">' + combo.map(function (k) {
            return '<button class="mg-key" data-key="' + esc(k) + '">' + esc(k) + '</button>';
          }).join('<span class="mg-plus">+</span>') + '</div>'
        + '<button class="btn btn-primary" id="mg-power" disabled>Now press power</button>'
        + '<div id="mg-say" class="mg-say">Hold all of them down first.</div>'));
      var check = function () {
        var all = combo.every(function (k) { return held[k]; });
        document.getElementById('mg-power').disabled = !all;
        var say = document.getElementById('mg-say');
        say.className = 'mg-say' + (all ? ' ok' : '');
        say.textContent = all ? 'All held. Now the power button, and keep holding.' : 'Hold all of them down first.';
      };
      m.el.querySelectorAll('[data-key]').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-key');
          held[k] = !held[k];
          b.classList.toggle('on', held[k]);
          audio('playKeyPop');
          check();
        });
      });
      document.getElementById('mg-power').addEventListener('click', function () {
        var say = document.getElementById('mg-say');
        say.className = 'mg-say ok';
        say.textContent = step.comboDone || 'Held for twenty seconds. Released. It starts up fresh.';
        audio('playSuccessChime');
        setTimeout(function () { m.close(); done(); }, 1600);
      });
    },

    /**
     * Proof of ownership. The only step here that is about ethics rather than
     * technique, and the one a student is most likely to skip.
     */
    proof: function (done) {
      var m = UI.modal(frame('Before you reset anybody\u2019s password',
        '<p style="font-size:calc(13px * var(--a11y-scale, 1));color:var(--ink-2)">They say it is theirs. Almost always it is. '
        + 'What would you accept as proof?</p>'
        + '<div class="mg-choices">'
        + '<button class="mg-choice" data-pick="receipt">Receipt or invoice with the serial on it</button>'
        + '<button class="mg-choice" data-pick="account">They sign in to the account the machine is registered to</button>'
        + '<button class="mg-choice" data-pick="says">They seem nice and they say it is theirs</button>'
        + '<button class="mg-choice" data-pick="box">They brought the original box</button>'
        + '</div><div id="mg-say" class="mg-say"></div>'));
      var goodPicks = 0;
      m.el.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-pick'), say = document.getElementById('mg-say');
          if (v === 'receipt' || v === 'account') {
            b.classList.add('right'); goodPicks++;
            say.className = 'mg-say ok';
            say.textContent = v === 'account'
              ? 'The strongest proof there is: only the owner can sign in to the account the machine is tied to.'
              : 'A receipt with a matching serial is solid. Check the serial actually matches the machine.';
            if (goodPicks >= 1) {
              audio('playSuccessChime');
              setTimeout(function () { m.close(); done(); }, 1600);
            }
          } else {
            b.classList.add('wrong');
            say.className = 'mg-say bad';
            say.textContent = v === 'box'
              ? 'A box proves somebody owned one of these. Boxes get thrown out and picked up. It is not proof.'
              : 'Everyone who brings in a stolen laptop also seems nice and also says it is theirs. A shop that resets on trust alone is laundering stolen machines.';
            audio('playErrorBuzz');
          }
        });
      });
    },

    /** Backup: a wait with a real decision at the end. */
    backup: function (done) {
      var m = UI.modal(frame('Back it up',
        '<div class="mg-scan"><div class="mg-scan-bar"><div id="mg-scan-fill"></div></div>'
        + '<div id="mg-status" style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-2);margin-top:9px">Copying 41.2 GB…</div></div>'
        + '<div id="mg-say" class="mg-say"></div>'));
      var fill = document.getElementById('mg-scan-fill'), pct = 0;
      var iv = setInterval(function () {
        pct += 7 + Math.random() * 9;
        fill.style.width = Math.min(100, pct) + '%';
        if (pct >= 100) {
          clearInterval(iv);
          document.getElementById('mg-status').innerHTML = '<b>Backup finished.</b> Verify it opened before you erase anything.';
          var say = document.getElementById('mg-say');
          say.className = 'mg-say ok';
          say.textContent = 'A backup you have not opened is a rumour, not a backup.';
          audio('playSuccessChime');
          setTimeout(function () { m.close(); done(); }, 1600);
        }
      }, 230);
    }
  };

  window.TechOpsMiniGames = {
    NOTIFICATION_SITES: NOTIFICATION_SITES,
    run: function (step, onDone) {
      var g = GAMES[step.game];
      if (!g) { onDone(); return; }
      g(onDone, step);
    }
  };
})(window);
