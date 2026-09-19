/**
 * TechOps Budapest — take five.
 *
 * A shift is long and a classroom lesson is longer. This is a place to stop
 * for a minute without leaving the material.
 *
 * The ambience is synthesised in the browser rather than streamed, so it works
 * on a school connection, from a USB stick, and without sending anyone's
 * browser off to a third party. If someone wants real radio there is a link,
 * clearly marked as leaving the page.
 */
(function (window) {
  'use strict';

  var UI = window.TechOpsUI;
  var esc = function (s) { return UI.esc(s); };

  var ctx = null, nodes = [], playing = false, mode = 'rain';
  var dropTimer = null, padTimer = null;
  var master = null;
  var level = 0.6;        // 0..1, remembered across sessions
  var variation = 0.6;    // how much the chords wander
  try {
    var st = JSON.parse(localStorage.getItem('techops-breather') || '{}');
    if (typeof st.level === 'number') level = st.level;
    if (typeof st.variation === 'number') variation = st.variation;
    if (st.mode) mode = st.mode;
  } catch (e) {}
  function remember() {
    try { localStorage.setItem('techops-breather', JSON.stringify({ level: level, variation: variation, mode: mode })); } catch (e) {}
  }

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function stop() {
    playing = false;
    clearTimeout(dropTimer); clearTimeout(padTimer);
    nodes.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    nodes = [];
  }

  /**
   * Rain. Band-limited noise alone just sounds like traffic — the thing that
   * makes rain read as rain is the scatter of individual droplet transients on
   * top of the hiss, and a brighter band than you would expect.
   */
  function rain(a, out, asWind) {
    var len = a.sampleRate * 4;
    var buf = a.createBuffer(2, len, a.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    }
    var src = a.createBufferSource();
    src.buffer = buf; src.loop = true;

    // Wide, bright band: traffic lives below 800 Hz, rain lives above it.
    var hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = asWind ? 220 : 900;
    var lp = a.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = asWind ? 1800 : 7200;
    var g  = a.createGain(); g.gain.value = asWind ? 0.11 : 0.085;

    var swell = a.createOscillator(); swell.frequency.value = asWind ? 0.018 : 0.045;
    var swellG = a.createGain(); swellG.gain.value = asWind ? 0.07 : 0.03;
    swell.connect(swellG); swellG.connect(g.gain);

    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    src.start(); swell.start();
    nodes.push(src, swell);

    // Droplets: short filtered pings at irregular intervals.
    var drop = function () {
      if (!playing) return;
      var when = a.currentTime;
      var o = a.createBufferSource();
      var dl = Math.floor(a.sampleRate * 0.03);
      var db = a.createBuffer(1, dl, a.sampleRate);
      var dd = db.getChannelData(0);
      for (var k = 0; k < dl; k++) dd[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / dl, 5);
      o.buffer = db;
      var bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1400 + Math.random() * 3600;
      bp.Q.value = 3 + Math.random() * 6;
      var dg = a.createGain();
      dg.gain.value = 0.05 + Math.random() * 0.09;
      var pan = a.createStereoPanner ? a.createStereoPanner() : null;
      if (pan) pan.pan.value = Math.random() * 2 - 1;
      o.connect(bp); bp.connect(dg);
      if (pan) { dg.connect(pan); pan.connect(out); } else dg.connect(out);
      o.start(when);
      nodes.push(o);
      dropTimer = setTimeout(drop, 40 + Math.random() * 190);
    };
    if (!asWind) drop();
  }

  /**
   * Chords that actually move. A single held stack got boring fast, so this
   * walks a short progression, voices it differently each time, and drops the
   * occasional note on top.
   */
  function pad(a, out) {
    // ii - V - I - vi in A minor-ish, as semitone offsets from A2
    var PROG = [[0, 3, 7, 10], [5, 9, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]];
    var root = 110;
    var step = 0;

    var bus = a.createGain(); bus.gain.value = 0.85;
    var lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
    var wob = a.createOscillator(); wob.frequency.value = 0.07;
    var wobG = a.createGain(); wobG.gain.value = 320;
    wob.connect(wobG); wobG.connect(lp.frequency); wob.start();
    bus.connect(lp); lp.connect(out);
    nodes.push(wob, bus);

    var voice = function (semi, at, dur, level, type) {
      var o = a.createOscillator();
      o.type = type || 'triangle';
      o.frequency.value = root * Math.pow(2, semi / 12);
      var g = a.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(level, at + dur * 0.35);
      g.gain.linearRampToValueAtTime(0, at + dur);
      // slight detune drift, so it never sounds like a keyboard demo
      var det = a.createOscillator(); det.frequency.value = 0.04 + Math.random() * 0.05;
      var detG = a.createGain(); detG.gain.value = 1.2 + Math.random();
      det.connect(detG); detG.connect(o.frequency); det.start(at);
      o.connect(g); g.connect(bus);
      o.start(at); o.stop(at + dur + 0.1);
      nodes.push(o, det);
    };

    var bar = function () {
      if (!playing) return;
      var at = a.currentTime + 0.05;
      // Higher variation occasionally jumps the progression instead of walking it.
      if (Math.random() < 0.3 * variation) step += 1 + Math.floor(Math.random() * 2);
      var chord = PROG[step % PROG.length];
      var dur = 7.5;
      chord.forEach(function (semi, i) {
        // re-voice: sometimes an octave up, sometimes dropped
        var lift = Math.random() < 0.3 * variation ? 12 : Math.random() < 0.2 * variation ? -12 : 0;
        voice(semi + lift, at + i * 0.18, dur - i * 0.2, 0.036 / (i * 0.5 + 1));
      });
      // an occasional single note over the top
      if (Math.random() < 0.25 + 0.6 * variation) {
        var mel = chord[1 + Math.floor(Math.random() * 3)] + 12;
        voice(mel, at + 1.4 + Math.random() * 3, 2.4, 0.03, 'sine');
      }
      step++;
      padTimer = setTimeout(bar, dur * 1000 * 0.82);
    };
    bar();
  }

  function start() {
    var a = ac();
    if (!a) return;
    stop();
    master = a.createGain();
    // Two layers at full level was genuinely too loud; duck the mix when both run.
    master.gain.value = level * (mode === 'both' ? 0.55 : 1);
    master.connect(a.destination);
    var out = master;
    nodes.push(master);
    playing = true;
    if (mode === 'rain' || mode === 'wind' || mode === 'both') rain(a, out, mode === 'wind');
    if (mode === 'pad'  || mode === 'both') pad(a, out);
  }

  function show() {
    var m = UI.modal('<div class="breather">'
      + '<div class="br-scene">'
      + '<div class="br-cup">'
      +   '<div class="br-steam"><span></span><span></span><span></span></div>'
      +   '<div class="br-mug"><div class="br-coffee"></div><div class="br-handle"></div></div>'
      +   '<div class="br-saucer"></div>'
      + '</div>'
      + '</div>'
      + '<h3>Take five</h3>'
      + '<p>The bench will still be there. Sit with a coffee for a minute.</p>'
      + '<div class="br-modes">'
      + ['rain', 'wind', 'pad', 'both'].map(function (k) {
          var label = { rain: 'Rain on the window', wind: 'Wind outside', pad: 'Slow chords', both: 'Rain & chords' }[k];
          return '<button class="br-mode' + (mode === k ? ' on' : '') + '" data-mode="' + k + '">' + label + '</button>';
        }).join('')
      + '</div>'
      + '<button class="btn btn-primary br-play" id="br-play">' + (playing ? 'Pause' : 'Play') + '</button>'
      + '<div class="br-sliders">'
      + '<label><span>Volume</span>'
      + '<input type="range" id="br-vol" min="0" max="100" value="' + Math.round(level * 100) + '"></label>'
      + '<label><span>Variation</span>'
      + '<input type="range" id="br-var" min="0" max="100" value="' + Math.round(variation * 100) + '"></label>'
      + '</div>'
      + '<p class="br-radio">Prefer actual radio? '
      + '<a href="https://lahmacun.hu" target="_blank" rel="noopener">lahmacun.hu</a> is a Budapest community station. '
      + 'That one opens a new tab and leaves this page — everything here plays offline.</p>'
      + '</div>'
      + '<div class="modal-foot"><button class="btn btn-primary" data-close>Back to the shop</button></div>',
      { onClose: function () { /* ambience keeps going on purpose */ } });

    m.el.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        remember();
        m.el.querySelectorAll('[data-mode]').forEach(function (o) { o.classList.remove('on'); });
        b.classList.add('on');
        if (playing) start();
      });
    });
    var vol = document.getElementById('br-vol');
    vol.addEventListener('input', function () {
      level = +vol.value / 100;
      if (master) master.gain.value = level * (mode === 'both' ? 0.55 : 1);
      remember();
    });
    var vr = document.getElementById('br-var');
    vr.addEventListener('input', function () { variation = +vr.value / 100; remember(); });

    document.getElementById('br-play').addEventListener('click', function () {
      if (playing) { stop(); this.textContent = 'Play'; }
      else { start(); this.textContent = 'Pause'; }
    });
  }

  window.TechOpsBreather = { show: show, stop: stop, isPlaying: function () { return playing; } };
})(window);
