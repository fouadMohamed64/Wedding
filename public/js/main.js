/* Wiring: fills content from config (EN/AR), builds event cards, opens the invitation, reveals on scroll. */
(function () {
  "use strict";
  const cfg = window.WEDDING_CONFIG;
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const grid = $("eventsGrid");
  let stops = [];

  /* ---------- date helpers (locale follows the active language) ---------- */
  const longDate = (d) => d.toLocaleDateString(I18n.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const shortTime = (d) => d.toLocaleTimeString(I18n.locale, { hour: "numeric", minute: "2-digit" });

  /* ---------- events ---------- */
  function eventCard(key, ev, icon, revealed) {
    const at = Countdown.parse(ev.date, ev.time);
    const art = document.createElement("article");
    art.className = `event event--${key} reveal` + (revealed ? " in" : "");

    art.innerHTML = `
      <svg class="event__icon" width="44" height="44" aria-hidden="true"><use href="#${icon}"/></svg>
      <p class="event__tag"></p>
      <h4 class="event__title"></h4>
      <p class="event__sub"></p>
      <ul class="event__meta">
        <li><span aria-hidden="true">📅</span><span data-f="date"></span></li>
        <li><span aria-hidden="true">🕖</span><span data-f="time"></span></li>
        <li><span aria-hidden="true">📍</span><span data-f="venue"></span></li>
      </ul>
      <a class="btn btn--small" data-f="map" target="_blank" rel="noopener noreferrer"></a>
      <div class="countdown">
        <div><b data-unit="days">00</b><span data-k="cd.days"></span></div>
        <div><b data-unit="hours">00</b><span data-k="cd.hours"></span></div>
        <div><b data-unit="minutes">00</b><span data-k="cd.min"></span></div>
        <div><b data-unit="seconds">00</b><span data-k="cd.sec"></span></div>
        <p class="countdown__done" data-done></p>
      </div>`;

    // textContent for every config-driven value (no HTML injection from config)
    art.querySelector(".event__tag").textContent = ev.tag || "";
    art.querySelector(".event__title").textContent = ev.title;
    const sub = art.querySelector(".event__sub");
    if (ev.subtitle) { sub.textContent = ev.subtitle; sub.dir = "auto"; } else sub.remove();
    art.querySelector('[data-f="date"]').textContent = at ? longDate(at) : t("event.tba");
    const timeEl = art.querySelector('[data-f="time"]');
    if (at && ev.time) timeEl.textContent = shortTime(at); else timeEl.closest("li").remove();
    const venueEl = art.querySelector('[data-f="venue"]');
    if (ev.venue) { venueEl.textContent = ev.venue; venueEl.dir = "auto"; } else venueEl.closest("li").remove();
    const map = art.querySelector('[data-f="map"]');
    if (ev.mapsUrl) { map.href = encodeURI(ev.mapsUrl); map.textContent = t("event.view"); } else map.remove();
    art.querySelectorAll("[data-k]").forEach((s) => { s.textContent = t(s.dataset.k); });

    if (at) stops.push(Countdown.start(art.querySelector(".countdown"), at));
    else art.querySelector(".countdown").remove();
    return art;
  }

  /* ---------- (re)render everything that depends on language ---------- */
  function renderContent(initial) {
    const c = I18n.content;

    document.querySelectorAll("[data-cfg]").forEach((el) => {
      const v = c[el.dataset.cfg];
      if (typeof v === "string") { el.textContent = v; el.setAttribute("dir", "auto"); }
    });
    document.title = `${c.groom} & ${c.bride}`;

    const b = $("blessing");
    if (c.blessing) { b.textContent = c.blessing; b.hidden = false; } else b.hidden = true;

    const box = $("families");
    box.innerHTML = "";
    if (c.families && c.families.length) {
      c.families.forEach((f) => {
        const d = document.createElement("div"); d.className = "family reveal in";
        [["family__name", f.name], ["family__role", f.role], ["family__head", f.head]].forEach(([cls, text]) => {
          if (!text) return;
          const p = document.createElement("p"); p.className = cls; p.textContent = text; p.dir = "auto"; d.appendChild(p);
        });
        box.appendChild(d);
      });
      box.hidden = false;
    } else box.hidden = true;

    stops.forEach((s) => s()); stops = [];
    grid.innerHTML = "";
    const revealed = !initial;
    if (cfg.henna && c.henna) grid.append(eventCard("henna", Object.assign({}, cfg.henna, c.henna), "henna", revealed));
    grid.append(eventCard("wedding", Object.assign({}, cfg.wedding, c.wedding), "rings", revealed));
    grid.classList.toggle("events__grid--single", !(cfg.henna && c.henna));

    const at = Countdown.parse(cfg.wedding.date, cfg.wedding.time);
    if (at) {
      $("heroDate").textContent = longDate(at);
      $("footerDate").textContent = `${longDate(at)} • ${c.wedding.venue}`;
    }
    if (!initial) observeReveals();
  }

  /* ---------- falling petals (transform-only, light) ---------- */
  if (!reduceMotion) {
    const box = $("petals");
    const count = window.innerWidth < 600 ? 9 : 16;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.style.setProperty("--x", Math.random() * 100 + "vw");
      p.style.setProperty("--s", 8 + Math.random() * 10 + "px");
      p.style.setProperty("--t", 12 + Math.random() * 12 + "s");
      p.style.setProperty("--d", -Math.random() * 20 + "s");
      p.style.setProperty("--sway", (Math.random() * 80 - 40) + "px");
      box.appendChild(p);
    }
  }

  /* ---------- reveal on scroll ---------- */
  let io = null;
  function observeReveals() {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window) || reduceMotion) { els.forEach((e) => e.classList.add("in")); return; }
    io = io || new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- language ---------- */
  $("langBtn").addEventListener("click", () => I18n.toggle());
  document.addEventListener("langchange", () => renderContent(false));

  /* ---------- open invitation ---------- */
  const welcome = $("welcome"), invitation = $("invitation"), openBtn = $("openBtn");
  let opened = false;

  openBtn.addEventListener("click", () => {
    if (opened) return; opened = true;
    WeddingMusic.play();                 // must run inside the click handler (autoplay policy)
    WeddingMusic.show();
    openBtn.disabled = true;

    invitation.hidden = false;
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    welcome.classList.add("is-leaving");
    setTimeout(() => { welcome.hidden = true; }, reduceMotion ? 0 : 1100);

    observeReveals();
    Wishes.init();
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
    });
  });

  // First paint: apply language (default English), then fill content.
  I18n.apply();                          // fires "langchange" → renderContent(false)
})();
