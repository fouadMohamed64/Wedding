/* Background music.
   Built-in tunes are generated live with the Web Audio API (no audio file, no copyright issues):
     "zaffa" (default) — Egyptian wedding-procession style: darbuka "maqsum" rhythm, riq, drone and a
                         reed-pipe (mizmar-like) melody in the Hijaz scale.
     "piano"           — soft romantic piano-style tune (Canon in D progression, public domain).
   Optional: set `musicPath` in config.js to use your own MP3 (falls back to the built-in tune if it fails).
   Playback only starts from a user click (autoplay-safe). */
(function () {
  "use strict";
  const cfg = window.WEDDING_CONFIG;
  const btn = document.getElementById("musicBtn");
  const label = document.getElementById("musicLabel");
  const volume = cfg.musicVolume ?? 0.55;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- generic live-synth engine ---------- */
  function synthEngine(style) {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null, master = null, noiseBuf = null, timer = null, next = 0, step = 0, playing = false;

    function build() {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      const dry = ctx.createGain(); dry.gain.value = 0.8;
      const wet = ctx.createGain(); wet.gain.value = 0.35;
      const verb = ctx.createConvolver();
      const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      verb.buffer = ir;
      master.connect(dry); master.connect(verb); verb.connect(wet);
      dry.connect(comp); wet.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }

    /* ----- shared voices ----- */
    function note(freq, when, dur, type, peak, attack) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(peak, when + (attack || 0.012));
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(master);
      o.start(when); o.stop(when + dur + 0.05);
    }

    function dum(when) {                          // darbuka bass hit: sine with fast pitch drop
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(190, when);
      o.frequency.exponentialRampToValueAtTime(70, when + 0.14);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.75, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
      o.connect(g); g.connect(master);
      o.start(when); o.stop(when + 0.3);
    }

    function tek(when, vol, freq) {               // rim / jingle hit: short band-passed noise
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq || 3200; f.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(when); s.stop(when + 0.1);
    }

    function reed(midi, when, dur) {              // mizmar-like lead: filtered saw + vibrato
      const f0 = mtof(midi);
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2300; lp.Q.value = 3;
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      o.type = "sawtooth"; o2.type = "square"; o.frequency.value = f0; o2.frequency.value = f0 * 1.003;
      lfo.frequency.value = 5.5; lfoG.gain.value = 14;            // cents
      lfo.connect(lfoG); lfoG.connect(o.detune); lfoG.connect(o2.detune);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.10, when + 0.04);
      g.gain.setValueAtTime(0.10, when + Math.max(0.05, dur - 0.08));
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master);
      [o, o2, lfo].forEach((n) => { n.start(when); n.stop(when + dur + 0.05); });
    }

    /* ----- style: Egyptian zaffa (D Hijaz: D Eb F# G A Bb C D) ----- */
    const EIGHTH = 60 / 112 / 2;
    // maqsum pattern over 8 eighths: Dum Tek _ Tek Dum _ Tek _
    const MAQSUM = ["D", "T", "", "T", "D", "", "T", ""];
    const PHRASES = [
      [[74, 2], [72, 1], [70, 1], [69, 2], [67, 2], [66, 2], [63, 2], [62, 4]],
      [[62, 2], [66, 2], [67, 2], [69, 2], [70, 2], [69, 2], [67, 2], [66, 2]],
      [[69, 2], [70, 1], [72, 1], [74, 4], [72, 2], [70, 2], [69, 2], [67, 2]],
      [[70, 2], [69, 2], [67, 2], [66, 2], [63, 2], [66, 2], [67, 2], [62, 2]]
    ];
    const zaffa = {
      span: EIGHTH * 16,                                    // two bars per phrase
      play(t0, idx) {
        for (let bar = 0; bar < 2; bar++) {
          for (let i = 0; i < 8; i++) {
            const t = t0 + (bar * 8 + i) * EIGHTH, h = MAQSUM[i];
            if (h === "D") dum(t);
            else if (h === "T") tek(t, 0.34, 3400);
            if (i % 2 === 1) tek(t + EIGHTH * 0.5, 0.07, 6500);   // riq shimmer
          }
        }
        note(mtof(50), t0, this.span * 1.02, "sine", 0.22, 0.2);   // D drone
        note(mtof(57), t0, this.span * 1.02, "triangle", 0.05, 0.4);
        let t = t0;
        PHRASES[idx % PHRASES.length].forEach(([m, d]) => { reed(m, t, d * EIGHTH * 0.96); t += d * EIGHTH; });
      }
    };

    /* ----- style: soft piano (Canon in D progression) ----- */
    const BEAT = 60 / 66;
    const SONG = [
      { b: 38, t: [62, 66, 69], m: [78, 76] }, { b: 45, t: [61, 64, 69], m: [74, 73] },
      { b: 47, t: [62, 66, 71], m: [71, 69] }, { b: 42, t: [61, 66, 69], m: [71, 73] },
      { b: 43, t: [62, 67, 71], m: [74, 71] }, { b: 38, t: [62, 66, 69], m: [74, 78] },
      { b: 43, t: [62, 67, 71], m: [79, 74] }, { b: 45, t: [61, 64, 69], m: [76, 73] }
    ];
    const piano = {
      span: BEAT * 4,
      play(t0, idx) {
        const c = SONG[idx % SONG.length], bar = BEAT * 4;
        note(mtof(c.b), t0, bar * 1.05, "sine", 0.34, 0.03);
        c.t.forEach((m) => note(mtof(m - 12), t0, bar * 1.1, "triangle", 0.05, 0.6));
        for (let i = 0; i < 8; i++) note(mtof(c.t[[0, 1, 2, 1, 0, 1, 2, 1][i]]), t0 + i * BEAT / 2, BEAT * 1.4, "triangle", 0.11);
        c.m.forEach((m, i) => {
          const w = t0 + i * BEAT * 2, f = mtof(m);
          note(f, w, BEAT * 3, "sine", 0.2, 0.01); note(f * 2, w, BEAT * 1.5, "sine", 0.05, 0.01);
        });
      }
    };

    const tune = style === "piano" ? piano : zaffa;

    function pump() {
      while (next < ctx.currentTime + 0.8) { tune.play(next, step); next += tune.span; step++; }
    }

    return {
      async play() {
        if (!AC) throw Object.assign(new Error("no WebAudio"), { name: "NotSupportedError" });
        if (!ctx) build();
        await ctx.resume();
        if (!playing) next = Math.max(next, ctx.currentTime + 0.1);
        playing = true;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(volume, ctx.currentTime, 0.6);
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

  /* ---------- engine: your own audio file ---------- */
  function fileEngine(src, onError) {
    const audio = new Audio();
    audio.loop = true; audio.preload = "none"; audio.volume = volume; audio.src = src;
    audio.addEventListener("error", onError);
    return { play: () => audio.play(), pause: () => audio.pause(), get playing() { return !audio.paused; } };
  }

  /* ---------- engine: YouTube (official IFrame player, audio only — nothing is downloaded) ---------- */
  function youtubeEngine(videoId, onError) {
    let player = null, ready = false, pending = false, yt = false;
    const holder = document.createElement("div");
    holder.id = "ytMusic"; holder.setAttribute("aria-hidden", "true");
    holder.style.cssText = "position:fixed;left:-9999px;top:0;width:220px;height:124px;pointer-events:none";
    holder.innerHTML = '<div id="ytMusicFrame"></div>';
    document.body.appendChild(holder);

    function create() {
      player = new YT.Player("ytMusicFrame", {
        width: "220", height: "124", videoId,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: videoId, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1 },
        events: {
          onReady() { ready = true; player.setVolume(Math.round(volume * 100)); if (pending) { player.playVideo(); } },
          onStateChange(e) { yt = e.data === 1 || e.data === 3; render(); },
          onError() { onError(); }                       // e.g. embedding blocked / video removed
        }
      });
    }
    window.onYouTubeIframeAPIReady = create;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api"; s.async = true; s.onerror = onError;
    document.head.appendChild(s);

    return {
      async play() { pending = true; if (ready) player.playVideo(); yt = true; },
      pause() { pending = false; yt = false; if (ready) player.pauseVideo(); },
      get playing() { return yt; }
    };
  }

  /* ---------- controller ---------- */
  const state = { wanted: false };
  let engine;

  function render() {
    const on = engine.playing;
    btn.classList.toggle("is-playing", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", I18n.t(on ? "music.pauseAria" : "music.playAria"));
    label.textContent = I18n.t(on ? "music.on" : "music.idle");
  }

  async function play() {
    state.wanted = true;
    try { await engine.play(); } catch (err) { state.wanted = false; }
    render();
  }
  function pause() { state.wanted = false; engine.pause(); render(); }

  const builtIn = synthEngine(cfg.musicStyle === "piano" ? "piano" : "zaffa");
  const fallback = () => { engine = builtIn; if (state.wanted) play(); render(); };   // if the chosen source fails
  engine = cfg.youtubeId ? youtubeEngine(cfg.youtubeId, fallback)
         : cfg.musicPath ? fileEngine(cfg.musicPath, fallback)
         : builtIn;

  btn.addEventListener("click", () => (engine.playing ? pause() : play()));
  document.addEventListener("langchange", render);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (engine.playing) { engine.pause(); render(); } }
    else if (state.wanted && !engine.playing) { engine.play().then(render).catch(() => {}); }
  });

  window.WeddingMusic = { play, pause, show() { btn.hidden = false; render(); } };
})();
