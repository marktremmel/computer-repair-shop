/**
 * TechOps Budapest — icon set.
 *
 * Line-drawn, single-weight, currentColor. Emoji render differently on every
 * machine and carry a cartoon tone the rest of the shop does not; these keep
 * one voice and sit properly on the baseline.
 */
(function (window) {
  'use strict';

  var S = 24;                       // all paths drawn in a 24×24 box
  var P = {
    // ── navigation ──
    counter:   'M3 18h18M4 18V9l8-4 8 4v9M9 18v-4h6v4M7 11.5h1.5M15.5 11.5H17',
    chat:      'M4 5h16v11H9l-4 4v-4H4z M8 9.5h8M8 12.5h5',
    bench:     'M3 20h18M5 20v-5M19 20v-5M3 12h18v3H3z M8 12V7l3-2 3 2v5',
    // The shop mark: a driver and a spanner crossed. The old bench drawing
    // read as a shopping trolley at 18px, which is the wrong shop entirely.
    repair:    'M6.2 4.6l2.6 2.6M4.4 6.4l2.6 2.6M5.3 5.5L3.6 3.8a3.4 3.4 0 004.6 4.6l9 9a1.9 1.9 0 002.7-2.7l-9-9'
               + 'M14.8 9.6l4.3-4.3M13.1 7.9l4.3-4.3M19.1 5.3l1.6-1.6',
    coffee:    'M4 9h12v5a4 4 0 01-4 4H8a4 4 0 01-4-4z M16 10.5h1.8a2.2 2.2 0 010 4.4H16'
               + 'M7 6c0-1 1-1.4 1-2.4M10.5 6c0-1 1-1.4 1-2.4M14 6c0-1 1-1.4 1-2.4 M3 21h14',
    access:    'M12 3.2a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4z M6.6 9.2c3.6 1.1 7.2 1.1 10.8 0'
               + 'M12 7.6v6.1M12 13.7h3.4l2 6M12 13.7H8.6l-2 6',
    palette:   'M12 3.5c4.7 0 8.5 3.4 8.5 7.6 0 2.4-2 4-4.3 4h-1.6c-1.2 0-2.1.9-2.1 2 0 .5.2 1 .5 1.4.3.4.5.8.5 1.3'
               + ' 0 1-.9 1.7-2 1.7-4.7 0-8.5-3.9-8.5-9s3.8-9 8.5-9z'
               + 'M8 8.6h.01M12 7.1h.01M15.8 9.1h.01M7.4 12.6h.01',
    laptop:    'M5 6h14v9H5z M3 18h18l-1.5-3H4.5z',
    parts:     'M4 8l8-4 8 4v9l-8 4-8-4z M4 8l8 4 8-4M12 12v9',
    // A capacitor as drawn on a schematic: two plates and their leads.
    caps:      'M12 3v6.5M12 14.5V21M6 9.5h12M6 14.5h12',
    handover:  'M6 3h9l4 4v14H6z M15 3v4h4M9 12h7M9 16h5',

    // ── hud ──
    coin:      'M12 4c4.4 0 8 1.6 8 3.5S16.4 11 12 11 4 9.4 4 7.5 7.6 4 12 4z M4 7.5v9c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-9',
    calendar:  'M4 6h16v14H4z M4 10h16M8 3v4M16 3v4',
    medal:     'M12 3l3 5 5 .8-3.6 3.5.9 5-5.3-2.8L6.7 17.3l.9-5L4 8.8 9 8z',
    question:  'M12 3a9 9 0 110 18 9 9 0 010-18z M9.5 9.5a2.5 2.5 0 114.5 1.5c-.8 1-2 1.3-2 2.5M12 17h.01',
    gear:      'M12 8.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z M12 2.5l1.4 2.3 2.6-.5 1 2.5 2.4 1.1-.8 2.6 1.6 2.1-1.9 1.9.3 2.7-2.6.6-1.3 2.4-2.5-1-2.5 1-1.3-2.4-2.6-.6.3-2.7-1.9-1.9L4.4 11l-.8-2.6L6 7.3l1-2.5 2.6.5z',
    speaker:   'M4 9.5h3.5L12 6v12l-4.5-3.5H4z M15.5 9.5a4 4 0 010 5M18 7.5a7 7 0 010 9',
    speakerOff:'M4 9.5h3.5L12 6v12l-4.5-3.5H4z M16 10l4 4M20 10l-4 4',
    report:    'M6 3h12v18H6z M9 8h6M9 12h6M9 16h3',
    save:      'M4 4h12l4 4v12H4z M7 4v5h8V4 M7 15h10v5H7z',
    star:      'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z',
    gauge:     'M4 18a8 8 0 1116 0 M12 18l4-5',

    // ── tools ──
    strap:     'M7 5.5h10v3a5 5 0 01-10 0z M9 14.5l3 5 3-5M5 8.5H3M21 8.5h-2',
    driver:    'M14.5 3.5l6 6-2.5 2.5-6-6z M12 6L4 14v6h6l8-8',
    spudger:   'M20 4L9 15l-5 5 1.5-6L16.5 3z',
    tweezers:  'M9 3l2.5 12M15 3l-2.5 12M11.5 15h1l.5 6h-2z',
    pick:      'M17 3l4 4-11 11-5 1 1-5z',
    air:       'M4 12h9a4 4 0 100-4M4 16h6a3 3 0 110 3M17 13.5h.01M19.5 15h.01',
    wipe:      'M5 4h11l3 3v13H5z M16 4v3h3M8 12h8M8 16h5',
    syringe:   'M14 3l7 7M18 6l-9 9-4 1 1-4 9-9zM5 19l2-2',
    extractor: 'M12 4v9M8 8l4-4 4 4M6 15a6 6 0 1012 0',
    suction:   'M6 8a6 6 0 1112 0c0 3-2 4-2 6H8c0-2-2-3-2-6z M10 14v6h4v-6',
    heat:      'M7 20a5 5 0 0110 0z M9 4c0 3-2 3-2 5s2 2 2 4M15 4c0 3-2 3-2 5s2 2 2 4',
    wheel:     'M12 4a8 8 0 110 16 8 8 0 010-16z M12 9a3 3 0 110 6 3 3 0 010-6z M12 4v5M12 15v5M4 12h5M15 12h5',
    picks:     'M6 3l3 14-1.5 4L6 17zM13 3l3 14-1.5 4L13 17z',

    // ── categories ──
    storage:   'M4 6h16v12H4z M7 9h10M7 12h10M16.5 15.5h.01',
    memory:    'M5 7h14v10H5z M8 10h8v4H8z M8 7V4M12 7V4M16 7V4M8 20v-3M12 20v-3M16 20v-3',
    battery:   'M3 8h15v8H3z M20 11v2M6 11h6',
    display:   'M3 5h18v11H3z M9 20h6M12 16v4',
    thermal:   'M12 4a2 2 0 012 2v7a4 4 0 11-4 0V6a2 2 0 012-2z M12 12v3',
    fan:       'M12 12a3 3 0 100-.01 M12 9c0-3 1-5 3-5s2 3 0 4M15 12c3 0 5 1 5 3s-3 2-4 0M12 15c0 3-1 5-3 5s-2-3 0-4M9 12c-3 0-5-1-5-3s3-2 4 0',
    flex:      'M4 7h6a4 4 0 010 8H4 M14 5h6v6h-6z M14 13h6v6h-6z',

    // ── misc ──
    search:    'M11 4a7 7 0 110 14 7 7 0 010-14z M16 16l4 4',
    check:     'M5 13l4 4L19 7',
    cross:     'M6 6l12 12M18 6L6 18',
    lock:      'M6 11h12v9H6z M9 11V8a3 3 0 016 0v3',
    box:       'M4 8l8-4 8 4v9l-8 4-8-4z',
    clock:     'M12 3a9 9 0 110 18 9 9 0 010-18z M12 7v5l3.5 2',
    warning:   'M12 4l9 16H3z M12 10v4M12 17h.01',
    wifi:      'M5 10a10 10 0 0114 0M8 13.5a6 6 0 018 0M12 18h.01',
    terminal:  'M4 5h16v14H4z M7 9l3 3-3 3M13 15h4'
  };

  /**
   * @param name  key in the set
   * @param size  px (default 18)
   */
  function icon(name, size, cls) {
    var d = P[name];
    if (!d) return '';
    return '<svg class="ic ' + (cls || '') + '" width="' + (size || 18) + '" height="' + (size || 18)
      + '" viewBox="0 0 ' + S + ' ' + S + '" fill="none" stroke="currentColor" stroke-width="1.6"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + d.split(' M').map(function (seg, i) { return '<path d="' + (i ? 'M' + seg : seg) + '"/>'; }).join('')
      + '</svg>';
  }

  /** Map the tool ids to icons so the rack stops being a row of emoji. */
  var TOOL_ICON = {
    esd_strap: 'strap', spudger: 'spudger', tweezers: 'tweezers', pick: 'pick',
    air_can: 'air', alcohol_wipe: 'wipe', paste_syringe: 'syringe', extractor: 'extractor',
    suction_cup: 'suction', suction_handles: 'suction', heat_pad: 'heat',
    cutting_wheel: 'wheel', thin_picks: 'picks'
  };

  var CAT_ICON = {
    storage: 'storage', ram: 'memory', battery: 'battery', screen: 'display',
    thermal: 'thermal', fan: 'fan', flex: 'flex', caps: 'caps'
  };

  window.TechOpsIcons = { icon: icon, paths: P, TOOL_ICON: TOOL_ICON, CAT_ICON: CAT_ICON };
})(window);
