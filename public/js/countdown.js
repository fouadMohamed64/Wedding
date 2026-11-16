/* Countdown helper: Countdown.start(rootEl, targetDate) updates [data-unit] elements every second. */
(function () {
  "use strict";
  const pad = (n) => String(n).padStart(2, "0");

  function parse(date, time) {
    // Local time on purpose: the event happens at that clock time where it is held.
    const d = new Date(`${date}T${time || "00:00"}:00`);
    return isNaN(d) ? null : d;
  }

  function start(root, target) {
    if (!root || !target) return () => {};
    const el = {
      days: root.querySelector('[data-unit="days"]'),
      hours: root.querySelector('[data-unit="hours"]'),
      minutes: root.querySelector('[data-unit="minutes"]'),
      seconds: root.querySelector('[data-unit="seconds"]')
    };
    const done = root.querySelector("[data-done]");

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        root.classList.add("is-done");
        if (done) done.textContent = I18n.t(Date.now() - target < 864e5 ? "cd.today" : "cd.past");
        return false;
      }
      const s = Math.floor(diff / 1000);
      el.days.textContent = pad(Math.floor(s / 86400));
      el.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      el.minutes.textContent = pad(Math.floor((s % 3600) / 60));
      el.seconds.textContent = pad(s % 60);
      return true;
    }

    if (!tick()) return () => {};
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }

  window.Countdown = { start, parse };
})();
