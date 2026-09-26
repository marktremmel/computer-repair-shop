/**
 * TechOps Budapest — the backup shelf.
 *
 * The shop already saves itself to this browser after every change, but there
 * is exactly one slot: start a new game, paste a save code, or sit down at a
 * machine somebody else has used, and the shift that was there is gone. In a
 * classroom that happens weekly, and the student it happens to is usually the
 * one who did not copy their save code.
 *
 * So the shop keeps a short shelf of its recent selves, here in the browser:
 * one snapshot per shift, refreshed as the days pass, plus a pinned one taken
 * immediately before anything that overwrites a shift. Save & load lists them
 * and puts any of them back.
 *
 * This is a safety net, not a way to carry a shift between computers — that is
 * the save code in sim-save.js, and it still is. Nothing here leaves the
 * machine, and a browser that refuses storage (private mode, wiped profiles)
 * simply gets no shelf.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var KEY = 'techops-budapest-shelf-v1';
  var MAX = 8;

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function write(list) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      // Out of room: drop the oldest unpinned shift and try once more, then
      // give up quietly. A failed backup must never break a repair.
      for (var i = list.length - 1; i >= 0; i--) {
        if (!list[i].keep) { list.splice(i, 1); break; }
      }
      try { window.localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e2) { return false; }
    }
  }

  /** What the shelf shows about a snapshot, without unpacking the whole thing. */
  function label(S) {
    return {
      code: S.shiftCode,
      name: (S.player && S.player.name) || '',
      shop: (S.player && S.player.shop) || '',
      avatar: (S.player && S.player.avatar) || '',
      day: S.day || 1,
      jobs: S.jobsDone || 0,
      cash: S.cashFt || 0,
      rep: Math.round(S.reputation || 0)
    };
  }

  /**
   * Put the shift as it stands on the shelf.
   * `pinned` marks the ones taken before something destructive: they are the
   * ones somebody will come looking for, so they are the last to be dropped.
   */
  function snapshot(reason, pinned) {
    var S = Shop.state;
    if (!S || S.practice) return null;                 // the training ticket is not a shift
    if (!S.player && (S.jobsDone || 0) === 0 && (S.day || 1) === 1) return null;   // nothing to lose yet

    var entry = label(S);
    entry.id = 'b' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
    entry.at = Date.now();
    entry.why = reason || 'as you played';
    entry.keep = !!pinned;
    try { entry.json = JSON.stringify(S); } catch (e) { return null; }

    var list = read();
    // One rolling entry per shift, so a long shift does not fill the shelf.
    // Pinned snapshots are never replaced this way.
    if (!entry.keep) list = list.filter(function (x) { return x.keep || x.code !== entry.code; });
    list.unshift(entry);

    while (list.length > MAX) {
      var idx = -1;
      for (var i = list.length - 1; i >= 0; i--) { if (!list[i].keep) { idx = i; break; } }
      list.splice(idx === -1 ? list.length - 1 : idx, 1);
    }
    write(list);
    return entry.id;
  }

  /**
   * Called on every save, which is every change, so the usual answer has to be
   * free: a marker in memory, no storage read, no serialising. Only a new day
   * or a finished job gets as far as the shelf.
   */
  var mark = null;
  function maybe() {
    var S = Shop.state;
    if (!S || S.practice) return;
    var now = S.shiftCode + '|' + (S.day || 1) + '|' + (S.jobsDone || 0);
    if (now === mark) return;
    mark = now;
    var last = read().filter(function (x) { return x.code === S.shiftCode && !x.keep; })[0];
    if (last && last.day === (S.day || 1) && last.jobs === (S.jobsDone || 0)) return;
    snapshot('as you played', false);
  }

  /** Put a shelved shift back. The shift being replaced goes on the shelf first. */
  function restore(id) {
    var entry = read().filter(function (x) { return x.id === id; })[0];
    if (!entry) return { ok: false, error: 'That shift is no longer on this computer.' };
    var state;
    try { state = JSON.parse(entry.json); } catch (e) { return { ok: false, error: 'That backup could not be read.' }; }

    snapshot('before going back to another shift', true);

    Shop.state = state;
    if (Shop.reseed) Shop.reseed();                    // the random sequence picks up where it left off
    // A hand-built face has to be remembered again, or its owner comes back faceless.
    if (state.customFaces && window.TechOpsPixel) {
      Object.keys(state.customFaces).forEach(function (k) {
        window.TechOpsPixel.remember(k, state.customFaces[k]);
        if (window.TechOpsPeople && window.TechOpsPeople.FACE_PRESETS.indexOf(k) === -1) {
          window.TechOpsPeople.FACE_PRESETS.unshift(k);
        }
      });
    }
    if (window.TechOpsUpgrades && window.TechOpsUpgrades.rebuildPerks) window.TechOpsUpgrades.rebuildPerks(state);
    Shop.save();
    Shop.emit('change');
    return { ok: true, name: (state.player && state.player.name) || 'that shift', day: state.day };
  }

  function forget(id) {
    write(read().filter(function (x) { return x.id !== id; }));
  }

  /** "just now", "14:20 today", "yesterday 09:05" — enough to tell two shifts apart. */
  function when(ms) {
    var d = new Date(ms), now = new Date();
    var mins = Math.round((now - d) / 60000);
    if (mins < 2) return 'just now';
    if (mins < 60) return mins + ' minutes ago';
    var hhmm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return 'today ' + hhmm;
    var y = new Date(now.getTime() - 86400000);
    if (d.toDateString() === y.toDateString()) return 'yesterday ' + hhmm;
    return d.getDate() + '/' + (d.getMonth() + 1) + ' ' + hhmm;
  }

  window.TechOpsBackup = {
    list: function () { return read(); },
    snapshot: snapshot,
    maybe: maybe,
    restore: restore,
    forget: forget,
    when: when
  };
})(window);
