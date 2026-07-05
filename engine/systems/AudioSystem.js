/**
 * NovaCraft Engine — AudioSystem
 * Web Audio API wrapper for sound effects and music.
 */
class AudioSystem {
  constructor() {
    this._ctx       = null;
    this._sounds    = new Map();
    this._music     = null;
    this._musicGain = null;
    this._sfxGain   = null;
    this.musicVolume = 0.7;
    this.sfxVolume   = 1.0;
    this._initContext();
  }

  _initContext() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._sfxGain   = this._ctx.createGain();
      this._musicGain = this._ctx.createGain();
      this._sfxGain.gain.value   = this.sfxVolume;
      this._musicGain.gain.value = this.musicVolume;
      this._sfxGain.connect(this._ctx.destination);
      this._musicGain.connect(this._ctx.destination);
    } catch (e) { console.warn('AudioSystem: Web Audio not available'); }
  }

  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  }

  // Register pre-loaded AudioBuffer
  register(name, buffer) {
    this._sounds.set(name, buffer);
  }

  // Play sound effect
  play(name, options = {}) {
    this._resume();
    if (!this._ctx) return null;
    const buffer = this._sounds.get(name);
    if (!buffer) return null;

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = options.loop || false;
    source.playbackRate.value = options.pitch || 1;

    const gain = this._ctx.createGain();
    gain.gain.value = options.volume !== undefined ? options.volume : 1;
    source.connect(gain);
    gain.connect(this._sfxGain);
    source.start(0, options.offset || 0);
    return source;
  }

  // Programmatically generate beep tones (no file needed)
  beep(freq = 440, duration = 0.1, type = 'sine', volume = 0.3) {
    this._resume();
    if (!this._ctx) return;
    const osc  = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this._musicGain) this._musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this._sfxGain) this._sfxGain.gain.value = v;
  }

  update() {} // no-op; audio is event-driven
}
