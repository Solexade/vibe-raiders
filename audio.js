// Locally synthesized audio: no audio downloads or autoplay before interaction.
export class RaiderAudio {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicVolume = .35;
    this.effectsVolume = .7;
    this.playing = false;
    this.step = 0;
  }
  async init() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      const c = this.context;
      this.master = c.createGain();
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 18;
      limiter.ratio.value = 8;
      this.music = c.createGain();
      this.effects = c.createGain();
      this.music.connect(this.master);
      this.effects.connect(this.master);
      this.master.connect(limiter);
      limiter.connect(c.destination);
      this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
      this.nextBeat = c.currentTime;
      this.timer = setInterval(() => this.schedule(), 80);
      this.updateVolumes();
    }
    try { await this.context.resume(); } catch { /* Muted browser audio does not block play. */ }
  }
  updateVolumes() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : .7, t, .025);
    this.music.gain.setTargetAtTime(this.playing ? this.musicVolume : 0, t, .025);
    this.effects.gain.setTargetAtTime(this.effectsVolume, t, .025);
  }
  tone(freq, duration, type = 'sine', volume = .1, end = freq, bus = this.effects, when) {
    if (!this.context || !bus) return;
    const c = this.context, t = when ?? c.currentTime;
    const oscillator = c.createOscillator(), envelope = c.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, t);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    envelope.gain.setValueAtTime(.001, t);
    envelope.gain.linearRampToValueAtTime(volume, t + .006);
    envelope.gain.exponentialRampToValueAtTime(.001, t + duration);
    oscillator.connect(envelope); envelope.connect(bus);
    oscillator.start(t); oscillator.stop(t + duration + .01);
  }
  noise(duration, volume, frequency, when, pan = 0) {
    if (!this.context) return;
    const c = this.context, t = when ?? c.currentTime;
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'lowpass'; filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    source.connect(filter); filter.connect(gain);
    const stereo = c.createStereoPanner(); stereo.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(stereo); stereo.connect(this.effects);
    source.start(t, Math.random() * .3); source.stop(t + duration);
  }
  setPlaying(playing) {
    this.playing = playing;
    if (this.context) {
      this.nextBeat = this.context.currentTime + .04;
      this.music.gain.setTargetAtTime(playing ? this.musicVolume : 0, this.context.currentTime, .05);
    }
  }
  schedule() {
    if (!this.context || !this.playing || this.context.state !== 'running') return;
    const c = this.context;
    while (this.nextBeat < c.currentTime + .15) {
      const t = Math.max(this.nextBeat, c.currentTime), s = this.step++;
      const chord = [0, 5, 9, 7][Math.floor(s / 16) % 4];
      const note = n => 110 * Math.pow(2, n / 12);
      if (s % 4 === 0) {
        this.tone(135, .18, 'sine', .38, 34, this.music, t);
        this.tone(note(chord - 12), .28, 'triangle', .26, note(chord - 12), this.music, t);
      }
      if (s % 8 === 4) this.tone(195, .09, 'triangle', .12, 65, this.music, t);
      if (s % 2 === 0) this.tone(5100, .025, 'square', .012, 2700, this.music, t);
      if (s % 2 === 1) {
        const melody = [12, 19, 16, 24, 19, 16, 14, 19][Math.floor(s / 2) % 8];
        this.tone(note(chord + melody), .2, 'sine', .07, note(chord + melody), this.music, t);
      }
      if (s % 16 === 0) for (const offset of [0, 4, 7]) this.tone(note(chord + offset), 1.1, 'sine', .045, note(chord + offset), this.music, t);
      this.nextBeat += 60 / 112 / 4;
    }
  }
  shot(index) {
    if (index === 0) { this.tone(640, .18, 'sawtooth', .12, 85); this.tone(1200, .09, 'sine', .1, 320); }
    if (index === 1) { this.noise(.105, .3, 2600); this.tone(155, .09, 'triangle', .3, 45); this.tone(1400, .028, 'square', .035, 400); }
    if (index === 2) { this.noise(.3, .55, 1650); this.tone(105, .28, 'sine', .5, 24); this.tone(220, .08, 'sawtooth', .14, 45); }
  }
  stepSound(sprint) { this.noise(.065, sprint ? .055 : .035, 450); this.tone(75, .05, 'sine', .06, 40); }
  hit(kill, pan = 0) { this.noise(.07, .1, 3500, undefined, pan); this.tone(kill ? 720 : 390, kill ? .18 : .07, 'triangle', .09, kill ? 1250 : 650); }
  damage() { this.noise(.18, .2, 700); this.tone(90, .2, 'sawtooth', .12, 35); }
  reload() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.noise(.07, .13, 2400, t);
    this.noise(.08, .13, 1600, t + .42);
    this.tone(450, .05, 'square', .035, 220, this.effects, t + .75);
  }
  switch() { this.noise(.055, .09, 1800); this.tone(320, .08, 'triangle', .045, 480); }
  wave() { [330, 440, 660].forEach((f, i) => this.tone(f, .22, 'triangle', .09, f, this.effects, this.context ? this.context.currentTime + i * .13 : undefined)); }
  death() { this.tone(240, .8, 'sawtooth', .12, 35); }
}
