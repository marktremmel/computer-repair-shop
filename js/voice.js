/**
 * TechOps Budapest — character voice.
 *
 * Not speech synthesis: synthesised blips, the way a handheld game gives a
 * character a voice without words. Each person gets a timbre from their id,
 * so Marika néni always sounds like Marika néni, and the same line read by
 * a different customer sounds different.
 */
(function (window) {
  'use strict';

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967296;
  }

  var Voice = {
    ctx: null,
    speaking: null,

    _ac: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },

    /** A stable voice per character: base pitch, waveform, wobble, pace. */
    profileFor: function (person) {
      var seed = hash((person && (person.id || person.name)) || 'anon');
      var seed2 = hash('x' + ((person && (person.id || person.name)) || 'anon'));
      var age = (person && person.age) || 30;
      // older and larger → lower; younger → higher. Then spread by seed.
      var base = 400 - Math.min(180, (age - 12) * 3.2) + seed * 210;
      var waves = ['square', 'triangle', 'sawtooth', 'sine'];
      return {
        base: Math.max(150, base),
        wave: waves[Math.floor(seed2 * waves.length)],
        wobble: 0.1 + seed2 * 0.5,
        rate: 62 + seed * 34,        // ms per blip
        gain: 0.05 + seed2 * 0.025
      };
    },

    /** Blip out `text` — one note per couple of characters, pitch drifting with the letters. */
    speak: function (text, person) {
      var ac = this._ac();
      if (!ac || (window.sekAudio && window.sekAudio.muted)) return;
      this.stop();

      var p = this.profileFor(person);
      var chars = String(text).replace(/\s+/g, ' ').slice(0, 90);
      var t0 = ac.currentTime + 0.02;
      var nodes = [];
      var n = 0;

      for (var i = 0; i < chars.length; i += 2) {
        var ch = chars[i];
        if (ch === ' ') continue;
        var vowel = 'aeiouáéíóöőúüű'.indexOf(ch.toLowerCase()) !== -1;
        var step = (ch.charCodeAt(0) % 7) - 3;
        var f = p.base * Math.pow(2, (step * p.wobble) / 12);
        var at = t0 + n * (p.rate / 1000);
        var dur = vowel ? 0.075 : 0.045;

        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = p.wave;
        osc.frequency.setValueAtTime(f, at);
        osc.frequency.linearRampToValueAtTime(f * (vowel ? 1.04 : 0.93), at + dur);
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(p.gain, at + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
        osc.connect(g); g.connect(ac.destination);
        osc.start(at); osc.stop(at + dur + 0.02);
        nodes.push(osc);
        n++;
        if (n > 44) break;
      }
      this.speaking = nodes;
    },

    stop: function () {
      if (!this.speaking) return;
      this.speaking.forEach(function (o) { try { o.stop(); } catch (e) {} });
      this.speaking = null;
    }
  };

  window.TechOpsVoice = Voice;
})(window);
