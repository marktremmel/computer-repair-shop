/**
 * TechOps Budapest — precision gestures.
 *
 * The operations that need a steady hand in real life need one here too.
 * Four gesture types, all pointer-based so a trackpad, a mouse and a
 * classroom touchscreen behave the same:
 *
 *   lift   — get the spudger tip under a connector and lift straight up.
 *            Drift sideways and you bend the pins.
 *   pull   — draw an adhesive tab out slowly and evenly. Snatch it and it snaps.
 *   trace  — follow a seam with a wheel or a pick, staying in the channel.
 *   scrape — work a pick in and out of a port to drag compacted lint free.
 *
 * Failure is never a dead end: it costs time, or a consumable, or quality.
 */
(function (window) {
  'use strict';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /** Shortest distance from p to a polyline, plus how far along it that is (0..1). */
  function projectOnPath(p, pts) {
    var best = { d: Infinity, t: 0 };
    var total = 0, lens = [];
    for (var i = 1; i < pts.length; i++) { lens.push(dist(pts[i - 1], pts[i])); total += lens[i - 1]; }
    var acc = 0;
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j];
      var vx = b.x - a.x, vy = b.y - a.y;
      var L2 = vx * vx + vy * vy || 1;
      var t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / L2));
      var px = a.x + t * vx, py = a.y + t * vy;
      var d = Math.hypot(p.x - px, p.y - py);
      if (d < best.d) best = { d: d, t: (acc + t * lens[j - 1]) / (total || 1) };
      acc += lens[j - 1];
    }
    return best;
  }

  var Precision = {
    active: null,

    /**
     * @param o.type      'lift' | 'pull' | 'trace' | 'scrape'
     * @param o.host      element to mount the overlay over
     * @param o.title     short instruction
     * @param o.hint      the reason this needs care
     * @param o.path      [{x,y}...] in host-relative % for trace
     * @param o.start     {x,y} in % — where the gesture begins
     * @param o.tolerance % of host width
     * @param o.onDone    fn({ok, quality, reason})
     */
    run: function (o) {
      Precision.cancel();

      var host = o.host;
      var rect = host.getBoundingClientRect();
      var pct = function (p) { return { x: p.x / 100 * rect.width, y: p.y / 100 * rect.height }; };
      var tolPx = (o.tolerance || 6) / 100 * rect.width;

      var wrap = el('div', { class: 'precision', tabindex: '0', role: 'dialog', 'aria-label': o.title });
      wrap.innerHTML =
        '<div class="prec-banner"><b>' + o.title + '</b><span>' + (o.hint || '') + '</span>'
        + '<span class="prec-kb-hint">Keyboard: arrows or space, one press at a time \u00b7 Esc to back off</span>'
        + '<button class="prec-abort" title="Back off">Back off</button></div>'
        + '<svg class="prec-svg"></svg>'
        + '<div class="prec-meter"><div class="prec-meter-fill"></div></div>'
        + '<div class="prec-read"></div>';
      host.appendChild(wrap);
      try { wrap.focus(); } catch (err) {}
      Precision.active = { wrap: wrap, o: o };

      var svg = wrap.querySelector('.prec-svg');
      var meter = wrap.querySelector('.prec-meter-fill');
      var read = wrap.querySelector('.prec-read');
      svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);

      var path = (o.path || []).map(pct);
      var targets = (o.targets || []).map(pct);
      var start = pct(o.start || (targets.length ? o.targets[0] : o.path[0]));
      // How far a nudge has to travel, and the point past which it is a break.
      var nudgeMin = rect.height * 0.10, nudgeMax = rect.height * 0.22;
      var pushDir = o.pushDir || 'up';

      // ── guide ──
      var guide = '';
      if (o.type === 'trace' && path.length > 1) {
        var d = 'M ' + path.map(function (p) { return p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' L ');
        guide += '<path d="' + d + '" class="prec-channel" stroke-width="' + (tolPx * 2) + '"/>'
               + '<path d="' + d + '" class="prec-line"/>'
               + '<path d="' + d + '" class="prec-progress" stroke-dasharray="1 1"/>';
      } else if (o.type === 'lift') {
        guide += '<line x1="' + start.x + '" y1="' + start.y + '" x2="' + start.x + '" y2="' + (start.y - rect.height * 0.3)
               + '" class="prec-line"/>'
               + '<rect x="' + (start.x - tolPx) + '" y="' + (start.y - rect.height * 0.32) + '" width="' + (tolPx * 2)
               + '" height="' + (rect.height * 0.34) + '" rx="' + tolPx + '" class="prec-channel-rect"/>';
      } else if (o.type === 'pull') {
        guide += '<line x1="' + start.x + '" y1="' + start.y + '" x2="' + (start.x) + '" y2="' + (start.y + rect.height * 0.34)
               + '" class="prec-line"/>'
               + '<rect x="' + (start.x - tolPx) + '" y="' + start.y + '" width="' + (tolPx * 2)
               + '" height="' + (rect.height * 0.36) + '" rx="' + tolPx + '" class="prec-channel-rect"/>';
      } else if (o.type === 'scrape') {
        guide += '<rect x="' + (start.x - tolPx) + '" y="' + (start.y - rect.height * 0.16) + '" width="' + (tolPx * 2)
               + '" height="' + (rect.height * 0.32) + '" rx="' + tolPx + '" class="prec-channel-rect"/>';
      } else if (o.type === 'nudge') {
        // Several tiny targets, worked one at a time. Each wants a short push
        // in one direction: not far enough does nothing, too far snaps it off.
        guide += targets.map(function (tg, i) {
          return '<circle cx="' + tg.x.toFixed(1) + '" cy="' + tg.y.toFixed(1) + '" r="' + (tolPx * 0.9).toFixed(1)
            + '" class="prec-pin" data-pin="' + i + '"/>';
        }).join('');
      }
      guide += '<circle cx="' + start.x + '" cy="' + start.y + '" r="' + Math.max(13, tolPx * 0.8) + '" class="prec-handle"/>';
      svg.innerHTML = guide;

      var handle = svg.querySelector('.prec-handle');
      var progressEl = svg.querySelector('.prec-progress');

      var st = {
        dragging: false, quality: 1, progress: 0, strokes: 0, lastKeyT: 0, pin: 0, pushed: 0,
        lastPt: null, lastT: 0, dir: 1, maxT: 0, failed: null
      };

      function say(txt, cls) { read.textContent = txt; read.className = 'prec-read ' + (cls || ''); }
      function setMeter(v, cls) {
        meter.style.width = Math.max(0, Math.min(100, v * 100)) + '%';
        meter.className = 'prec-meter-fill ' + (cls || '');
      }

      say(o.type === 'pull' ? 'Press the tab and draw it out slowly and evenly.'
        : o.type === 'trace' ? 'Press on the marker and follow the channel.'
        : o.type === 'lift'  ? 'Press the connector and lift straight up.'
        : o.type === 'nudge' ? 'One contact at a time. Press on the marked one and ease it '
            + pushDir + ' \u2014 a short, straight push. Too little does nothing; too far and it comes off.'
        : 'Press the pick in, then work it in and out.');

      function local(ev) {
        var r = host.getBoundingClientRect();
        return { x: ev.clientX - r.left, y: ev.clientY - r.top };
      }

      /** For `nudge`: where the marker sits right now, and how a push is measured. */
      function pinAt() { return targets[st.pin] || start; }
      function pushAmount(p) {
        var o0 = pinAt();
        return pushDir === 'up' ? (o0.y - p.y)
             : pushDir === 'down' ? (p.y - o0.y)
             : pushDir === 'left' ? (o0.x - p.x)
             : (p.x - o0.x);
      }
      function pushLateral(p) {
        var o0 = pinAt();
        return (pushDir === 'up' || pushDir === 'down') ? Math.abs(p.x - o0.x) : Math.abs(p.y - o0.y);
      }
      function markPinDone() {
        var node = svg.querySelector('[data-pin="' + st.pin + '"]');
        if (node) node.classList.add('done');
        st.pin++;
        st.pushed = 0;
        st.progress = st.pin / targets.length;
        setMeter(st.progress, st.quality < 0.6 ? 'bad' : '');
        if (st.pin >= targets.length) return finish(true);
        var n = pinAt();
        handle.setAttribute('cx', n.x); handle.setAttribute('cy', n.y);
        say('That one is upright. ' + (targets.length - st.pin) + ' to go.', 'ok');
        if (window.sekAudio) window.sekAudio.playSuccessChime();
      }

      function down(ev) {
        var p = local(ev);
        var from = o.type === 'nudge' ? pinAt() : start;
        if (dist(p, from) > Math.max(30, tolPx * 2.2)) {
          say(o.type === 'nudge' ? 'Not that one. The marked contact.' : 'Start on the marker.', 'warn');
          return;
        }
        st.dragging = true; st.lastPt = p; st.lastT = performance.now();
        wrap.classList.add('dragging');
        if (window.sekAudio) window.sekAudio.playKeyPop();
        ev.preventDefault();
      }

      function move(ev) {
        if (!st.dragging || st.failed) return;
        var p = local(ev);
        var now = performance.now();
        var dt = Math.max(1, now - st.lastT);
        var speed = dist(p, st.lastPt) / dt * 1000 / rect.width;   // widths per second
        handle.setAttribute('cx', p.x); handle.setAttribute('cy', p.y);

        if (o.type === 'trace') {
          var pr = projectOnPath(p, path);
          var off = pr.d / tolPx;
          if (off > 1) {
            st.quality -= 0.035;
            say('Off the channel — you are cutting into the machine, not the glue.', 'bad');
            wrap.classList.add('off');
          } else {
            wrap.classList.remove('off');
            say('Good line. Keep the depth steady.', 'ok');
          }
          st.maxT = Math.max(st.maxT, pr.t);
          st.progress = st.maxT;
          if (progressEl) progressEl.style.strokeDasharray = (st.progress * 3000) + ' 3000';
          setMeter(st.progress, st.quality < 0.6 ? 'bad' : '');
          if (st.progress > 0.985) return finish(true);

        } else if (o.type === 'lift') {
          var dx = Math.abs(p.x - start.x);
          var rise = Math.max(0, start.y - p.y);
          if (dx > tolPx) {
            st.quality -= 0.045;
            say('You are levering it sideways — that bends the pins.', 'bad');
            wrap.classList.add('off');
          } else {
            wrap.classList.remove('off');
            say('Straight up. That is it.', 'ok');
          }
          st.progress = Math.min(1, rise / (rect.height * 0.26));
          setMeter(st.progress, st.quality < 0.6 ? 'bad' : '');
          if (st.progress >= 1) return finish(true);

        } else if (o.type === 'pull') {
          var dx2 = Math.abs(p.x - start.x);
          var drawn = Math.max(0, p.y - start.y);
          var tooFast = speed > 0.55;
          if (tooFast) {
            st.quality -= 0.09;
            say('Too fast — the tab is stretching.', 'bad');
            wrap.classList.add('off');
          } else if (dx2 > tolPx) {
            st.quality -= 0.05;
            say('Keep it in line with the tab.', 'bad');
            wrap.classList.add('off');
          } else {
            wrap.classList.remove('off');
            say(speed < 0.05 ? 'Slow and steady. Keep going.' : 'Good, even pull.', 'ok');
          }
          if (st.quality <= 0.32) return finish(false, 'The tab stretched thin and snapped off flush with the battery.');
          st.progress = Math.min(1, drawn / (rect.height * 0.3));
          setMeter(st.progress, st.quality < 0.6 ? 'bad' : '');
          if (st.progress >= 1) return finish(true);

        } else if (o.type === 'scrape') {
          var dy = p.y - st.lastPt.y;
          if (Math.abs(p.x - start.x) > tolPx) {
            st.quality -= 0.03;
            say(o.offText || 'Stay inside the port — you are scraping the housing.', 'bad');
          } else if (Math.abs(dy) > 3 && Math.sign(dy) !== st.dir) {
            st.dir = Math.sign(dy); st.strokes++;
            if (window.sekAudio) window.sekAudio.playScrew();
            say(o.strokeText || 'Another pass. It is coming loose.', 'ok');
          }
          st.progress = Math.min(1, st.strokes / (o.strokes || 6));
          setMeter(st.progress);
          if (st.progress >= 1) return finish(true);

        } else if (o.type === 'nudge') {
          var fwd = pushAmount(p), side = pushLateral(p);
          st.pushed = fwd;
          if (side > tolPx) {
            st.quality -= 0.05;
            say(o.sideText || 'You are dragging it sideways. It wants lifting, not bending further.', 'bad');
            wrap.classList.add('off');
          } else if (fwd > nudgeMax) {
            return finish(false, o.overText || ('You pushed straight through it. That contact is now lying on the one next to it, '
              + 'and this is where a straightenable board becomes a scrap one.'));
          } else if (speed > 0.42) {
            st.quality -= 0.07;
            say('Slower. These move about the width of a hair.', 'bad');
            wrap.classList.add('off');
          } else {
            wrap.classList.remove('off');
            say(fwd < nudgeMin
              ? 'Keep going \u2014 it has not come up yet.'
              : 'That is it. Let go there.', 'ok');
          }
          if (st.quality <= 0.32) {
            return finish(false, o.wornText || 'Between the slips and the over-bending there is not enough of that corner left to seat a processor on.');
          }
          var shown = Math.min(1, Math.max(0, fwd / nudgeMin));
          setMeter((st.pin + shown * 0.9) / targets.length, st.quality < 0.6 ? 'bad' : '');
        }

        st.lastPt = p; st.lastT = now;
      }

      function up() {
        if (!st.dragging || st.failed) return;
        st.dragging = false;
        wrap.classList.remove('dragging');

        if (o.type === 'nudge') {
          var n = pinAt();
          if (st.pushed >= nudgeMin && st.pushed <= nudgeMax) return markPinDone();
          if (st.pushed > 0.02 * rect.height) {
            st.quality -= 0.03;
            say('Not far enough \u2014 it sprang back. Try again, a little further.', 'warn');
          }
          st.pushed = 0;
          handle.setAttribute('cx', n.x); handle.setAttribute('cy', n.y);
          setMeter(st.pin / targets.length, st.quality < 0.6 ? 'bad' : '');
          if (st.quality <= 0.32) {
            return finish(false, 'Too many attempts on the same contact. The metal has work-hardened and snapped.');
          }
          return;
        }

        if (st.progress > 0.02 && st.progress < 0.98) {
          if (o.type === 'pull') {
            st.quality -= 0.14;
            say('You let go halfway. Pick the tab back up and keep going.', 'warn');
          } else {
            say('Stopped short. Start again from the marker.', 'warn');
          }
          if (st.quality <= 0.32) return finish(false, 'The tab tore where you kept stopping and starting.');
          handle.setAttribute('cx', start.x); handle.setAttribute('cy', start.y);
          st.progress = o.type === 'trace' ? st.maxT : 0;
          setMeter(st.progress);
        }
      }

      function finish(ok, reason) {
        if (st.failed) return;
        st.failed = true;
        st.dragging = false;
        var q = Math.max(0, Math.min(1, st.quality));
        wrap.classList.add(ok ? 'done-ok' : 'done-bad');
        if (window.sekAudio) window.sekAudio[ok ? 'playCableSnap' : 'playErrorBuzz']();
        setTimeout(function () {
          Precision.cancel();
          if (o.onDone) o.onDone({ ok: ok, quality: q, reason: reason });
        }, ok ? 340 : 700);
      }

      /**
       * The keyboard route through a gesture.
       *
       * It is not a shortcut. Holding a key down and letting it repeat is the
       * keyboard version of snatching the tab, and it costs quality on exactly
       * the same terms the pointer does — you can tear an adhesive strip with
       * the space bar. The work is the same work: press, wait, press.
       */
      var KEYS = {
        lift:   { keys: ['ArrowUp'],                   step: 0.16, gap: 190, hurry: 'Jerking it up. Straight and slow, one press at a time.' },
        pull:   { keys: ['ArrowDown'],                 step: 0.14, gap: 240, hurry: 'Too fast — the tab is stretching.' },
        trace:  { keys: ['ArrowRight', 'ArrowDown'],   step: 0.09, gap: 150, hurry: 'You are running the wheel too fast to keep the depth.' },
        scrape: { keys: ['ArrowUp', 'ArrowDown'],      step: 0,    gap: 180, hurry: 'Scrubbing at it. Let the pick bite between passes.' },
        // Four presses lift a contact; a fifth on the same one bends it past
        // saving, so the keyboard route can overshoot exactly as a drag can.
        nudge:  { keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], step: 0, gap: 260, hurry: 'Slower. These move about the width of a hair.' }
      };

      function onKeyDown(ev) {
        if (st.failed) return;

        if (ev.key === 'Escape') {
          ev.preventDefault();
          Precision.cancel();
          if (o.onDone) o.onDone({ ok: false, aborted: true, quality: 1 });
          return;
        }

        var K = KEYS[o.type];
        if (!K) return;
        var isAdvance = K.keys.indexOf(ev.key) !== -1 || ev.key === ' ' || ev.key === 'Enter';
        if (!isAdvance) return;
        ev.preventDefault();

        var now = Date.now();
        var since = st.lastKeyT ? (now - st.lastKeyT) : K.gap;
        st.lastKeyT = now;

        // Auto-repeat from a held key, or hammering, is hurrying it.
        var hurried = ev.repeat || since < K.gap;
        if (hurried) {
          st.quality -= (o.type === 'pull' ? 0.09 : 0.055);
          say(K.hurry, 'bad');
          wrap.classList.add('off');
          if (st.quality <= 0.32) {
            return finish(false, o.type === 'pull'
              ? 'The tab stretched thin and snapped off flush with the battery.'
              : 'You forced it. That is damage you cannot undo from here.');
          }
        } else {
          wrap.classList.remove('off');
          say(o.type === 'trace' ? 'Good line. Keep the depth steady.'
            : o.type === 'scrape' ? 'Another pass. It is coming loose.'
            : o.type === 'pull' ? 'Slow and steady. Keep going.'
            : 'Straight up. That is it.', 'ok');
        }

        if (o.type === 'nudge') {
          st.pushed++;
          if (st.pushed > 5) {
            return finish(false, 'One press too many. That contact is now lying on the one next to it, '
              + 'and this is where a straightenable board becomes a scrap one.');
          }
          if (window.sekAudio) window.sekAudio.playKeyPop();
          if (st.pushed >= 4) return markPinDone();
          say('Coming up. ' + (4 - st.pushed) + ' more, gently.', 'ok');
          setMeter((st.pin + st.pushed / 4 * 0.9) / targets.length, st.quality < 0.6 ? 'bad' : '');
          return;
        }

        if (o.type === 'scrape') {
          st.strokes++;
          st.progress = Math.min(1, st.strokes / 6);
          if (window.sekAudio) window.sekAudio.playScrew();
        } else {
          st.progress = Math.min(1, st.progress + K.step);
          if (window.sekAudio) window.sekAudio.playKeyPop();
          if (o.type === 'lift' && handle) {
            handle.setAttribute('cy', start.y - (st.progress * rect.height * 0.26));
          } else if (o.type === 'pull' && handle) {
            handle.setAttribute('cy', start.y + (st.progress * rect.height * 0.3));
          } else if (o.type === 'trace' && progressEl) {
            progressEl.style.strokeDasharray = (st.progress * 3000) + ' 3000';
          }
        }

        setMeter(st.progress, st.quality < 0.6 ? 'bad' : '');
        if (st.progress >= (o.type === 'trace' ? 0.985 : 1)) finish(true);
      }

      wrap.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('keydown', onKeyDown);
      wrap.querySelector('.prec-abort').addEventListener('click', function () {
        Precision.cancel();
        if (o.onDone) o.onDone({ ok: false, aborted: true, quality: 1 });
      });

      Precision.active.teardown = function () {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('keydown', onKeyDown);
      };
    },

    cancel: function () {
      if (!Precision.active) return;
      if (Precision.active.teardown) Precision.active.teardown();
      if (Precision.active.wrap && Precision.active.wrap.parentNode) Precision.active.wrap.remove();
      Precision.active = null;
    }
  };

  window.TechOpsPrecision = Precision;
})(window);
