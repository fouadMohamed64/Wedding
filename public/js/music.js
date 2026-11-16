/* Background music.
   Default: a built-in romantic piano-style instrumental (Pachelbel-style "Canon in D" progression,
   a public-domain composition) generated live with the Web Audio API — no audio file, no copyright issues.
   Optional: set `musicPath` in config.js to use your own MP3 (falls back to the built-in tune if it fails to load).
   Playback only starts from a user click (autoplay-safe). */
(function () {
  "use strict";
  const cfg = window.WEDDING_CONFIG;
  const btn = document.getElementById("musicBtn");
  const label = document.getElementById("musicLabel");
  const volume = cfg.musicVolume ?? 0.55;

  /* ---------- engine 1: generated instrumental ---------- */
  function synthEngine() {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null, master = null, wet = null, timer = null, next = 0, step = 0, playing = false;

    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // chord: bass note, triad, two melody notes (top line of the classic Canon progression)
    const SONG = [
      { b: 38, t: [62, 66, 69], m: [78, 76] },  // D
      { b: 45, t: [61, 64, 69], m: [74, 73] },  // A
      { b: 47, t: [62, 66, 71], m: [71, 69] },  // Bm
      { b: 42, t: [61, 66, 69], m: [71, 73] },  // F#m
      { b: 43, t: [62, 67, 71], m: [74, 71] },  // G
      { b: 38, t: [62, 66, 69], m: [74, 78] },  // D
      { b: 43, t: [62, 67, 71], m: [79, 74] },  // G
      { b: 45, t: [61, 64, 69], m: [76, 73] }   // A
    ];
    const BEAT = 60 / 66;                         // ~66 bpm, gentle

    function build() {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      const dry = ctx.createGain(); dry.gain.value = 0.8;
      wet = ctx.createGain(); wet.gain.value = 0.45;
      const verb = ctx.createConvolver();
      const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      verb.buffer = ir;
      master.connect(dry); master.connect(verb); verb.connect(wet);
      dry.connect(comp); wet.connect(comp); comp.connect(ctx.destination);
    }

    function note(freq, when, dur, type, peak, attack) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(peak, when + (attack || 0.012));
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(master);
      o.start(when); o.stop(when + dur + 0.05);
    }

    function scheduleChord(c, t0) {
      const bar = BEAT * 4;
      note(mtof(c.b), t0, bar * 1.05, "sine", 0.34, 0.03);                 // bass
      c.t.forEach((m) => note(mtof(m - 12), t0, bar * 1.1, "triangle", 0.05, 0.6)); // soft pad
      for (let i = 0; i < 8; i++) {                                         // arpeggio, eighth notes
        const m = c.t[[0, 1, 2, 1, 0, 1, 2, 1][i]];
        note(mtof(m), t0 + i * BEAT / 2, BEAT * 1.4, "triangle", 0.11);
      }
      c.m.forEach((m, i) => {                                               // melody, piano-ish
        const w = t0 + i * BEAT * 2, f = mtof(m);
        note(f, w, BEAT * 3, "sine", 0.2, 0.01);
        note(f * 2, w, BEAT * 1.5, "sine", 0.05, 0.01);
      });
    }

    function pump() {
      while (next < ctx.currentTime + 0.8) {
        scheduleChord(SONG[step % SONG.length], next);
        next += BEAT * 4; step++;
      }
    }

    return {
      async play() {
        if (!AC) throw Object.assign(new Error("no WebAudio"), { name: "NotSupportedError" });
        if (!ctx) { build(); }
        await ctx.resume();
        if (!playing) { next = Math.max(next, ctx.currentTime + 0.1); }
        playing = true;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(volume, ctx.currentTime, 0.8);        // gentle fade-in
        pump(); clearInterval(timer); timer = setInterval(pump, 200);
      },
      pause() {
        if (!ctx) return;
        playing = false;
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        clearInterval(timer);
        setTimeout(() => { if (!playing) ctx.suspend(); }, 600);
      },
      get playing() { return playing; }
    };
  }

  /* ---------- engine 2: your own audio file ---------- */
  function fileEngine(src, onError) {
    const audio = new Audio();
    audio.loop = true; audio.preload = "none"; audio.volume = volume; audio.src = src;
    audio.addEventListener("error", onError);
    return {
      play: () => audio.play(),
      pause: () => audio.pause(),
      get playing() { return !audio.paused; }
    };
  }

  /* ---------- controller ---------- */
  const btnState = { wanted: false };
  let engine;

  function render() {
    const on = engine.playing;
    btn.classList.toggle("is-playing", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", I18n.t(on ? "music.pauseAria" : "music.playAria"));
    label.textContent = I18n.t(on ? "music.on" : "music.idle");
  }

  async function play() {
    btnState.wanted = true;
    try { await engine.play(); }
    catch (err) { btnState.wanted = false; }
    render();
  }
  function pause() { btnState.wanted = false; engine.pause(); render(); }

  const synth = synthEngine();
  engine = cfg.musicPath
    ? fileEngine(cfg.musicPath, () => { engine = synth; if (btnState.wanted) play(); })   // missing file → built-in tune
    : synth;

  btn.addEventListener("click", () => (engine.playing ? pause() : play()));
  document.addEventListener("langchange", render);

  // Pause when the tab is hidden, resume when it returns (if the visitor wanted music).
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (engine.playing) { engine.pause(); render(); } }
    else if (btnState.wanted && !engine.playing) { engine.play().then(render).catch(() => {}); }
  });

  window.WeddingMusic = { play, pause, show() { btn.hidden = false; render(); } };
})();
