/**
 * TechOps Budapest — screw head geometry.
 *
 * The whole "look at the head before you pick a driver" lesson depends on the
 * heads being genuinely distinguishable. CSS pseudo-element approximations were
 * not: a pentalobe and a torx both read as "roundish blob". These are drawn to
 * the real geometry — pentalobe has five rounded lobes, torx six sharp points,
 * tri-point three, Phillips a cross with tapered flutes.
 */
(function (window) {
  'use strict';

  /** Points of an n-lobed star, alternating outer/inner radius. */
  function star(cx, cy, n, rOuter, rInner, rot) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 === 0 ? rOuter : rInner;
      var a = (Math.PI / n) * i + (rot || 0);
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }

  /** Rounded-lobe rosette, used for pentalobe — lobes are circles, not points. */
  function rosette(cx, cy, n, rRing, rLobe, rot) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var a = (2 * Math.PI / n) * i + (rot || 0);
      out += '<circle cx="' + (cx + rRing * Math.cos(a)).toFixed(2) + '" cy="' + (cy + rRing * Math.sin(a)).toFixed(2)
           + '" r="' + rLobe + '"/>';
    }
    return out;
  }

  var SIZE = 26, C = SIZE / 2;

  var HEADS = {
    'phillips-00': phillips, 'phillips-0': phillips, 'phillips-1': phillips,
    'torx-t5': torx, 'torx-t6': torx, 'torx-t20': torx,
    'pentalobe-p2': pentalobe, 'pentalobe-p5': pentalobe,
    'tripoint-y000': tripoint
  };

  function phillips() {
    // A cross with tapered flutes — wider at the rim, narrowing to the centre.
    return '<path d="M ' + (C - 1.7) + ' 4 L ' + (C + 1.7) + ' 4 L ' + (C + 0.9) + ' ' + (C - 0.9)
         + ' L ' + (SIZE - 4) + ' ' + (C - 1.7) + ' L ' + (SIZE - 4) + ' ' + (C + 1.7)
         + ' L ' + (C + 0.9) + ' ' + (C + 0.9) + ' L ' + (C + 1.7) + ' ' + (SIZE - 4)
         + ' L ' + (C - 1.7) + ' ' + (SIZE - 4) + ' L ' + (C - 0.9) + ' ' + (C + 0.9)
         + ' L 4 ' + (C + 1.7) + ' L 4 ' + (C - 1.7) + ' L ' + (C - 0.9) + ' ' + (C - 0.9) + ' Z"/>';
  }

  function torx() {
    // Six sharp lobes — the classic star.
    return '<polygon points="' + star(C, C, 6, 8.2, 4.6, -Math.PI / 2) + '"/>';
  }

  function pentalobe() {
    // Five ROUNDED lobes around a small hub. This is what makes it unmistakable.
    return '<circle cx="' + C + '" cy="' + C + '" r="3.4"/>' + rosette(C, C, 5, 5.4, 2.5, -Math.PI / 2);
  }

  function tripoint() {
    // Three tapered slots at 120° — a Y, not a triangle. Apple's internal screw.
    var out = '<circle cx="' + C + '" cy="' + C + '" r="2.2"/>';
    for (var i = 0; i < 3; i++) {
      var a = (2 * Math.PI / 3) * i - Math.PI / 2;
      var tipX = C + 8.1 * Math.cos(a), tipY = C + 8.1 * Math.sin(a);
      var pX = Math.cos(a + Math.PI / 2), pY = Math.sin(a + Math.PI / 2);   // perpendicular
      out += '<polygon points="'
        + (C + pX * 2.5).toFixed(2) + ',' + (C + pY * 2.5).toFixed(2) + ' '
        + (tipX + pX * 1.5).toFixed(2) + ',' + (tipY + pY * 1.5).toFixed(2) + ' '
        + (tipX - pX * 1.5).toFixed(2) + ',' + (tipY - pY * 1.5).toFixed(2) + ' '
        + (C - pX * 2.5).toFixed(2) + ',' + (C - pY * 2.5).toFixed(2) + '"/>';
    }
    return out;
  }

  /**
   * Full screw: metal body, bevelled rim, and the recess cut into it.
   * `variant` — 'normal' | 'stripped' (recess rounded out) | 'tray'.
   */
  function svg(type, variant) {
    var id = 'sg' + Math.random().toString(36).slice(2, 8);
    var recess = variant === 'stripped'
      ? '<circle cx="' + C + '" cy="' + C + '" r="6.2"/>'
      : (HEADS[type] || phillips)();

    var body = variant === 'stripped'
      ? ['#e0a08c', '#9a5440', '#5e2c20']
      : ['#c3cbd6', '#7b8593', '#464e5b'];

    return '<svg viewBox="0 0 ' + SIZE + ' ' + SIZE + '" width="100%" height="100%" aria-hidden="true">'
      + '<defs><radialGradient id="' + id + '" cx="34%" cy="28%" r="78%">'
      + '<stop offset="0%" stop-color="' + body[0] + '"/>'
      + '<stop offset="58%" stop-color="' + body[1] + '"/>'
      + '<stop offset="100%" stop-color="' + body[2] + '"/>'
      + '</radialGradient></defs>'
      + '<circle cx="' + C + '" cy="' + C + '" r="' + (C - 0.6) + '" fill="url(#' + id + ')" stroke="#20262f" stroke-width="1"/>'
      + '<circle cx="' + C + '" cy="' + C + '" r="' + (C - 3.1) + '" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="0.9"/>'
      + '<g fill="' + (variant === 'stripped' ? '#3a1d15' : '#1b212a') + '">' + recess + '</g>'
      + (variant === 'stripped'
          ? '<circle cx="' + C + '" cy="' + C + '" r="6.2" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6" stroke-dasharray="2 2"/>'
          : '')
      + '</svg>';
  }

  /** Small inline glyph for the tool rack, so rack and chassis show the same shape. */
  function glyph(type, px) {
    px = px || 17;
    return '<span class="head-glyph" style="width:' + px + 'px;height:' + px + 'px">' + svg(type) + '</span>';
  }

  window.TechOpsScrewHeads = { svg: svg, glyph: glyph, types: Object.keys(HEADS) };
})(window);
