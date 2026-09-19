/**
 * SEK Audio Engine — Zero-dependency Web Audio Synthesizer
 * Provides tactile clicks, mechanical keyboard sounds, chimes, and tool SFX.
 * Persists mute preference in localStorage.
 */
(function(window) {
  'use strict';

  class SekAudioEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      try {
        this.muted = localStorage.getItem('sek_audio_muted') === 'true';
      } catch (e) {}
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMuted(muted) {
      this.muted = !!muted;
      try {
        localStorage.setItem('sek_audio_muted', String(this.muted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('sek-audio-mute-changed', { detail: { muted: this.muted } }));
    }

    toggleMute() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    _canPlay() {
      if (this.muted) return false;
      this.init();
      return !!this.ctx;
    }

    // Mechanical keypress pop
    playKeyPop() {
      if (!this._canPlay()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    }

    // Cable snap into port
    playCableSnap() {
      if (!this._canPlay()) return;
      const t = this.ctx.currentTime;
      
      // Click burst
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);

      // White noise latch
      this._playNoise(0.04, 0.2);
    }

    // Screwdriver ratchet turn
    playScrew() {
      if (!this._canPlay()) return;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1400 + i * 200, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.02);
        }, i * 40);
      }
    }

    // Compressed air blow
    playAirBlow() {
      if (!this._canPlay()) return;
      this._playNoise(0.35, 0.4, 1800);
    }

    // Cash register / coin drop
    playCoin() {
      if (!this._canPlay()) return;
      const t = this.ctx.currentTime;
      [1760, 2637].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.3, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.35);
      });
    }

    // Success Chime (harmonic triad)
    playSuccessChime() {
      if (!this._canPlay()) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);
        gain.gain.setValueAtTime(0.25, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.45);
      });
    }

    // Error / Warning Buzz
    playErrorBuzz() {
      if (!this._canPlay()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.setValueAtTime(110, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    // Network ping pip
    playPing() {
      if (!this._canPlay()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    // Noise burst helper (for air, trash, friction)
    _playNoise(duration, volume = 0.2, filterFreq = 1200) {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + duration);
    }

    // Attach sound to common elements
    wireInteractiveElements(root = document) {
      root.querySelectorAll('button:not([data-no-sound]), .btn:not([data-no-sound])').forEach(btn => {
        if (!btn._sekSoundWired) {
          btn._sekSoundWired = true;
          btn.addEventListener('click', () => this.playKeyPop());
        }
      });
    }

    // Create a mute toggle button
    createMuteButton() {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-icon';
      btn.id = 'sek-audio-toggle';
      btn.setAttribute('data-no-sound', 'true');
      btn.title = this.muted ? 'Unmute Audio' : 'Mute Audio';
      btn.setAttribute('aria-label', btn.title);

      const updateIcon = () => {
        btn.innerHTML = this.muted
          ? `<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"/></svg>`
          : `<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/></svg>`;
        btn.title = this.muted ? 'Unmute Audio' : 'Mute Audio';
        btn.setAttribute('aria-label', btn.title);
      };

      btn.addEventListener('click', () => {
        this.toggleMute();
        updateIcon();
        if (!this.muted) this.playKeyPop();
      });

      window.addEventListener('sek-audio-mute-changed', updateIcon);
      updateIcon();
      return btn;
    }
  }

  window.sekAudio = new SekAudioEngine();
})(window);
