/**
 * TechOps Budapest — Lite: picking things up and putting them somewhere.
 *
 * The classic bench works by selecting a tool and then clicking a screw. It
 * is precise and it is invisible: nothing on screen says the tool is in your
 * hand, and a student who clicks the screw first sees nothing happen at all.
 *
 * Here the tool physically moves. Drag it onto the screw, or tap it and then
 * tap the screw — and the second way is not a poor relation. It is how a
 * phone wants to be used, it is how a keyboard has to work, and it is the
 * whole interaction for anybody whose hands do not get on with dragging. So
 * the two share one state: something is either in your hand or it is not,
 * and the screen always says which.
 *
 * Nothing here knows what a screwdriver is. It reports "this was put on
 * that" and the flow decides whether that was sensible.
 */
(function (window) {
  'use strict';

  var doc = window.document;
  var THRESHOLD = 7;                 // px before a press becomes a drag, not a tap

  var current = null;                // { cfg, itemEl, ghost, ... } while dragging
  var held = null;                   // { cfg, itemEl } while carried after a tap

  function targets(cfg) {
    return Array.prototype.slice.call(cfg.root.querySelectorAll(cfg.targetSel));
  }

  function accepts(cfg, itemEl, targetEl) {
    return cfg.accepts ? !!cfg.accepts(itemEl, targetEl) : true;
  }

  /** Light up everywhere this thing could go, so the next move is never a guess. */
  function markTargets(cfg, itemEl, on) {
    targets(cfg).forEach(function (t) {
      var ok = on && accepts(cfg, itemEl, t);
      t.classList.toggle('can-drop', !!ok);
      if (ok) { t.setAttribute('tabindex', '0'); }
      else if (!on) { t.removeAttribute('tabindex'); }
    });
  }

  function clearHeld() {
    if (!held) return;
    held.itemEl.classList.remove('held');
    markTargets(held.cfg, held.itemEl, false);
    if (held.cfg.onHold) held.cfg.onHold(null);
    held = null;
  }

  function pickUp(cfg, itemEl) {
    if (held && held.itemEl === itemEl) { clearHeld(); return; }
    clearHeld();
    held = { cfg: cfg, itemEl: itemEl };
    itemEl.classList.add('held');
    markTargets(cfg, itemEl, true);
    if (cfg.onHold) cfg.onHold(itemEl);
  }

  function drop(cfg, itemEl, targetEl) {
    clearHeld();
    if (!targetEl || !accepts(cfg, itemEl, targetEl)) {
      if (cfg.onMiss) cfg.onMiss(itemEl, targetEl || null);
      return;
    }
    cfg.onDrop(itemEl, targetEl);
  }

  /** A copy of the thing that follows your finger. The original stays put and dims. */
  function makeGhost(itemEl, x, y) {
    var art = itemEl.querySelector('.la') || itemEl.firstElementChild || itemEl;
    var box = art.getBoundingClientRect();
    var g = doc.createElement('div');
    g.className = 'lite-ghost';
    g.innerHTML = art.outerHTML;
    g.style.width = Math.max(56, box.width) + 'px';
    g.style.height = Math.max(56, box.height) + 'px';
    doc.body.appendChild(g);
    moveGhost(g, x, y);
    return g;
  }

  function moveGhost(g, x, y) {
    g.style.transform = 'translate(' + (x - g.offsetWidth / 2) + 'px,'
      + (y - g.offsetHeight / 2 - 18) + 'px)';
  }

  function targetUnder(cfg, x, y) {
    var el = doc.elementFromPoint(x, y);
    while (el && el !== doc.body) {
      if (el.matches && el.matches(cfg.targetSel) && cfg.root.contains(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function onMove(e) {
    if (!current) return;
    var x = e.clientX, y = e.clientY;
    if (!current.dragging) {
      if (Math.abs(x - current.x0) + Math.abs(y - current.y0) < THRESHOLD) return;
      current.dragging = true;
      clearHeld();
      current.itemEl.classList.add('dragging');
      current.ghost = makeGhost(current.itemEl, x, y);
      markTargets(current.cfg, current.itemEl, true);
      if (current.cfg.onHold) current.cfg.onHold(current.itemEl);
    }
    moveGhost(current.ghost, x, y);
    var over = targetUnder(current.cfg, x, y);
    if (over !== current.over) {
      if (current.over) current.over.classList.remove('drop-over');
      current.over = over && accepts(current.cfg, current.itemEl, over) ? over : null;
      if (current.over) current.over.classList.add('drop-over');
    }
    e.preventDefault();
  }

  function onUp(e) {
    if (!current) return;
    var c = current;
    current = null;
    doc.removeEventListener('pointermove', onMove);
    doc.removeEventListener('pointerup', onUp);
    doc.removeEventListener('pointercancel', onUp);
    c.itemEl.classList.remove('dragging');
    if (c.over) c.over.classList.remove('drop-over');
    if (c.ghost) c.ghost.remove();

    if (!c.dragging) {                                   // a tap, not a drag
      pickUp(c.cfg, c.itemEl);
      return;
    }
    markTargets(c.cfg, c.itemEl, false);
    if (c.cfg.onHold) c.cfg.onHold(null);
    drop(c.cfg, c.itemEl, targetUnder(c.cfg, e.clientX, e.clientY));
  }

  /*
   * Wire up one screen.
   *
   * The flow re-renders on every change and calls this again each time, so
   * the listeners go on once per root and the configuration behind them is
   * swapped. Adding a fresh set every render looked harmless — the pointer
   * path happened to survive it, because a drag keeps its state in one
   * module variable and the last listener registered wins.
   *
   * The keyboard path did not survive it. Enter on a tool ran every stacked
   * handler in turn, each one toggling the same thing in and out of your
   * hand, so after an even number of renders the key did nothing at all and
   * the only people affected were the ones who could not use the mouse.
   */
  var wired = typeof WeakMap === 'function' ? new WeakMap() : null;

  function init(cfg) {
    clearHeld();
    var holder = wired && wired.get(cfg.root);
    if (holder) { holder.cfg = cfg; return; }        // same screen, new state
    holder = { cfg: cfg };
    if (wired) wired.set(cfg.root, holder);

    cfg.root.addEventListener('pointerdown', function (e) {
      var c = holder.cfg;
      var item = e.target.closest ? e.target.closest(c.itemSel) : null;
      if (!item || !c.root.contains(item)) return;
      if (item.hasAttribute('data-locked')) return;
      current = { cfg: c, itemEl: item, x0: e.clientX, y0: e.clientY, dragging: false, over: null };
      doc.addEventListener('pointermove', onMove, { passive: false });
      doc.addEventListener('pointerup', onUp);
      doc.addEventListener('pointercancel', onUp);
      e.preventDefault();
    });

    cfg.root.addEventListener('click', function (e) {
      var c = holder.cfg;
      var t = e.target.closest ? e.target.closest(c.targetSel) : null;
      if (!t || !held || held.cfg !== c) return;
      drop(c, held.itemEl, t);
    });

    // Keyboard: the same two moves, in the same order.
    cfg.root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var c = holder.cfg;
      var item = e.target.closest ? e.target.closest(c.itemSel) : null;
      if (item && !item.hasAttribute('data-locked')) {
        e.preventDefault();
        pickUp(c, item);
        return;
      }
      var t = e.target.closest ? e.target.closest(c.targetSel) : null;
      if (t && held && held.cfg === c) {
        e.preventDefault();
        drop(c, held.itemEl, t);
      }
    });

    // Escape puts it back down.
    cfg.root.addEventListener('keyup', function (e) {
      if (e.key === 'Escape') clearHeld();
    });
  }

  window.TechOpsLiteDrag = {
    init: init,
    held: function () { return held ? held.itemEl : null; },
    release: clearHeld
  };
})(window);
