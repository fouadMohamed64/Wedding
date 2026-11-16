/* Guest wishes: validation, Supabase REST (anon key + RLS), local fallback, feed rendering, polling. */
(function () {
  "use strict";

  const PAGE = 12;
  const POLL_MS = 30000;
  const COOLDOWN_MS = 30000;
  const LIMITS = { nameMin: 2, nameMax: 40, msgMin: 3, msgMax: 500 };
  const t = (k, v) => I18n.t(k, v);

  const env = window.ENV || {};
  const base = (env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = env.SUPABASE_ANON_KEY || "";
  const configured = /^https?:\/\//.test(base) && key.length > 20;
  const headers = { apikey: key, Authorization: "Bearer " + key };
  const endpoint = base + "/rest/v1/wishes";

  const $ = (id) => document.getElementById(id);
  const form = $("wishForm"), nameIn = $("wishName"), msgIn = $("wishMessage");
  const nameErr = $("nameError"), msgErr = $("messageError"), counter = $("counter");
  const submitBtn = $("wishSubmit"), feed = $("feed"), state = $("feedState");
  const moreBtn = $("loadMore"), countEl = $("wishCount");

  // Local storage: the wall when Supabase isn't set up, and an offline cache otherwise.
  const LOCAL_KEY = "wishes:local", CACHE_KEY = "wishes:cache";
  const readLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (_) { return []; } };
  const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  const seen = new Set();
  let offset = 0, total = null, loaded = false, formShownAt = Date.now();
  let lastState = null;     // {kind, key, retry} so the status text can be re-translated

  /* ---------- helpers ---------- */
  const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F​-‏‪-‮]/g, "").trim();

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const mins = (Date.now() - d) / 60000;
    const rtf = new Intl.RelativeTimeFormat(I18n.locale, { numeric: "auto" });
    if (mins < 1) return rtf.format(0, "second");
    if (mins < 60) return rtf.format(-Math.floor(mins), "minute");
    if (mins < 1440) return rtf.format(-Math.floor(mins / 60), "hour");
    return d.toLocaleDateString(I18n.locale, { day: "numeric", month: "short", year: "numeric" });
  }

  function toast(text, type) {
    const wrap = $("toasts");
    const el = document.createElement("div");
    el.className = "toast toast--" + (type || "ok");
    el.textContent = text;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 400); }, 4200);
  }

  function setState(kind, msgKey, retry) {
    lastState = kind ? { kind, msgKey, retry } : null;
    state.innerHTML = "";
    state.className = "feed-state" + (kind ? " feed-state--" + kind : "");
    if (!kind) return;
    if (kind === "loading") {
      const sp = document.createElement("span"); sp.className = "spinner"; state.appendChild(sp);
    }
    const p = document.createElement("p"); p.textContent = t(msgKey); state.appendChild(p);
    if (retry) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn btn--ghost"; b.textContent = t("feed.retry");
      b.addEventListener("click", retry); state.appendChild(b);
    }
  }

  const updateCount = () => { countEl.textContent = total ? "(" + total + ")" : ""; };

  /* ---------- rendering ---------- */
  function card(w, isNew) {
    const el = document.createElement("article");
    el.className = "wish" + (isNew ? " wish--new" : "");
    const heart = document.createElement("span");
    heart.className = "wish__heart"; heart.setAttribute("aria-hidden", "true"); heart.textContent = "♥";
    const msg = document.createElement("p");
    msg.className = "wish__msg"; msg.setAttribute("dir", "auto"); msg.textContent = w.message;
    const foot = document.createElement("footer");
    const nm = document.createElement("strong");
    nm.setAttribute("dir", "auto"); nm.textContent = w.name;
    const dt = document.createElement("time");
    dt.dateTime = w.created_at; dt.textContent = formatDate(w.created_at);
    foot.append(nm, dt);
    el.append(heart, msg, foot);
    return el;
  }

  function addWishes(list, { prepend = false, isNew = false } = {}) {
    const fresh = list.filter((w) => w && !seen.has(w.id));
    fresh.forEach((w) => seen.add(w.id));
    const frag = document.createDocumentFragment();
    (prepend ? fresh.slice().reverse() : fresh).forEach((w) => {
      const c = card(w, isNew);
      if (prepend) feed.prepend(c); else frag.appendChild(c);
    });
    if (!prepend) feed.appendChild(frag);
    return fresh.length;
  }

  /* ---------- API ---------- */
  async function fetchPage(from, withCount) {
    const url = `${endpoint}?select=id,name,message,created_at&order=created_at.desc&limit=${PAGE}&offset=${from}`;
    const h = Object.assign({}, headers);
    if (withCount) h.Prefer = "count=exact";
    const res = await fetch(url, { headers: h });
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (withCount) {
      const n = parseInt((res.headers.get("content-range") || "").split("/")[1], 10);
      if (!isNaN(n)) total = n;
    }
    return res.json();
  }

  async function initialLoad() {
    if (!configured) {
      // Local mode: wishes are saved in this browser until Supabase is connected.
      const rows = readLS(LOCAL_KEY);
      feed.innerHTML = ""; seen.clear();
      addWishes(rows);
      total = rows.length; offset = rows.length; loaded = true; updateCount();
      moreBtn.hidden = true;
      setState(rows.length ? null : "empty", "feed.emptyLocal");
      return;
    }
    setState("loading", "feed.loading");
    moreBtn.hidden = true;
    try {
      const rows = await fetchPage(0, true);
      feed.innerHTML = ""; seen.clear();
      addWishes(rows);
      offset = rows.length; loaded = true;
      writeLS(CACHE_KEY, rows);
      updateCount();
      setState(rows.length ? null : "empty", "feed.empty");
      moreBtn.hidden = !(total ? offset < total : rows.length === PAGE);
    } catch (e) {
      const cached = readLS(CACHE_KEY);
      if (cached.length) {
        feed.innerHTML = ""; seen.clear(); addWishes(cached); offset = cached.length; loaded = true;
        setState("error", "feed.offline", initialLoad);
      } else {
        setState("error", "feed.error", initialLoad);
      }
    }
  }

  async function loadMore() {
    moreBtn.disabled = true; moreBtn.textContent = t("feed.loadingMore");
    try {
      const rows = await fetchPage(offset, false);
      addWishes(rows);
      offset += rows.length;
      moreBtn.hidden = total ? offset >= total : rows.length < PAGE;
    } catch (e) {
      toast(t("toast.moreFail"), "err");
    } finally {
      moreBtn.disabled = false; moreBtn.textContent = t("feed.more");
    }
  }

  async function poll() {
    if (!configured || !loaded || document.hidden) return;
    try {
      const rows = await fetchPage(0, true);
      const added = addWishes(rows, { prepend: true, isNew: true });
      if (added) { offset += added; setState(null); updateCount(); }
    } catch (e) { /* silent: next poll will retry */ }
  }

  async function submit(payload) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=representation" }, headers),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = ""; try { msg = (await res.json()).message || ""; } catch (_) {}
      const err = new Error(msg || "HTTP " + res.status); err.status = res.status; throw err;
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  }

  /* ---------- validation / form ---------- */
  function validate() {
    const name = clean(nameIn.value).replace(/\s+/g, " ");
    const message = clean(msgIn.value);
    let ok = true;
    nameErr.textContent = msgErr.textContent = "";
    nameIn.classList.remove("invalid"); msgIn.classList.remove("invalid");

    const bad = (input, out, text) => { out.textContent = text; input.classList.add("invalid"); ok = false; };
    if (name.length < LIMITS.nameMin) bad(nameIn, nameErr, t("err.nameShort"));
    else if (name.length > LIMITS.nameMax) bad(nameIn, nameErr, t("err.nameLong", { n: LIMITS.nameMax }));

    if (message.length < LIMITS.msgMin) bad(msgIn, msgErr, t("err.msgShort"));
    else if (message.length > LIMITS.msgMax) bad(msgIn, msgErr, t("err.msgLong", { n: LIMITS.msgMax }));
    else if ((message.match(/https?:\/\/|www\./gi) || []).length > 1) bad(msgIn, msgErr, t("err.links"));

    return ok ? { name, message } : null;
  }

  function setBusy(b) { submitBtn.disabled = b; submitBtn.classList.toggle("is-busy", b); }

  const lastSent = () => { try { return +localStorage.getItem("wishes:last") || 0; } catch (_) { return 0; } };
  const markSent = () => { try { localStorage.setItem("wishes:last", String(Date.now())); } catch (_) {} };

  function afterSend(row, savedKey) {
    markSent();
    form.reset(); counter.textContent = `0 / ${LIMITS.msgMax}`;
    total = (total || 0) + 1; offset += 1; updateCount();
    setState(null);
    addWishes([row], { prepend: true, isNew: true });
    toast(t(savedKey), "ok");
    feed.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.website.value) return;               // honeypot caught a bot
    const data = validate();
    if (!data) { (form.querySelector(".invalid") || nameIn).focus(); return; }
    if (Date.now() - formShownAt < 2500) { toast(t("toast.quick"), "err"); return; }
    const wait = COOLDOWN_MS - (Date.now() - lastSent());
    if (wait > 0) { toast(t("toast.wait", { n: Math.ceil(wait / 1000) }), "err"); return; }

    if (!configured) {                                       // local mode (no Supabase yet)
      const row = { id: "local-" + Date.now(), name: data.name, message: data.message, created_at: new Date().toISOString() };
      writeLS(LOCAL_KEY, [row].concat(readLS(LOCAL_KEY)).slice(0, 200));
      afterSend(row, "toast.saved");
      return;
    }

    setBusy(true);
    try {
      const row = await submit(data);
      if (row && row.id) afterSend(row, "toast.sent");
      else { markSent(); form.reset(); toast(t("toast.sent"), "ok"); poll(); }
    } catch (err) {
      const rate = err.status === 429 || /too many/i.test(err.message);
      toast(t(rate ? "toast.rate" : "toast.fail"), "err");
    } finally {
      setBusy(false);
    }
  });

  msgIn.addEventListener("input", () => {
    counter.textContent = `${msgIn.value.length} / ${LIMITS.msgMax}`;
    if (msgIn.classList.contains("invalid")) validate();
  });
  nameIn.addEventListener("input", () => { if (nameIn.classList.contains("invalid")) validate(); });
  moreBtn.addEventListener("click", loadMore);

  // Re-translate dynamic bits when the language changes.
  document.addEventListener("langchange", () => {
    moreBtn.textContent = t("feed.more");
    feed.querySelectorAll("time[datetime]").forEach((el) => { el.textContent = formatDate(el.dateTime); });
    if (lastState) setState(lastState.kind, lastState.msgKey, lastState.retry);
    if (nameIn.classList.contains("invalid") || msgIn.classList.contains("invalid")) validate();
  });

  window.Wishes = {
    init() {
      formShownAt = Date.now();
      initialLoad();
      setInterval(poll, POLL_MS);
    }
  };
})();
