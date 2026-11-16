/* Tiny i18n: English (default) + Arabic. Elements use data-i18n / data-i18n-placeholder / data-i18n-aria. */
(function () {
  "use strict";
  const cfg = window.WEDDING_CONFIG;

  const dict = {
    en: {
      "lang.btn": "العربية", "lang.aria": "Switch to Arabic",
      "welcome.eyebrow": "The wedding invitation of", "welcome.open": "Open Invitation", "welcome.hint": "🎵 Best enjoyed with sound on",
      "hero.eyebrow": "Save the date • Wedding celebration", "hero.scroll": "Scroll down",
      "note.eyebrow": "With joyful hearts", "note.title": "You are invited",
      "events.eyebrow": "Join us in celebrating", "events.title": "Save the Date",
      "cd.days": "Days", "cd.hours": "Hours", "cd.min": "Min", "cd.sec": "Sec",
      "cd.today": "It’s happening today 🎉", "cd.past": "A beautiful day to remember ✨",
      "event.view": "View location →", "event.tba": "Date to be announced",
      "wishes.eyebrow": "Leave us a note", "wishes.title": "Wishes & Congratulations",
      "wishes.lead": "Your words will be kept forever in our little book of memories.",
      "form.name": "Your name", "form.message": "Your message",
      "form.namePh": "e.g. Sara Ahmed", "form.messagePh": "Write something sweet… (any language)",
      "form.send": "Send Your Wishes ❤️",
      "feed.title": "Messages from loved ones", "feed.more": "Show more wishes", "feed.loadingMore": "Loading…",
      "feed.loading": "Loading wishes…", "feed.empty": "No wishes yet — be the first to send one 💌",
      "feed.emptyLocal": "No wishes yet — be the first to send one 💌 (saved on this device)",
      "feed.error": "We couldn’t load the wishes right now.", "feed.offline": "You’re offline — showing the latest saved wishes.",
      "feed.retry": "Try again",
      "footer.eyebrow": "With all our love", "footer.made": "Made with", "footer.credit": "Created by Fouad",
      "music.idle": "Music", "music.on": "Playing", "music.none": "No music",
      "music.playAria": "Play music", "music.pauseAria": "Pause music",
      "err.nameShort": "Please enter your name.", "err.nameLong": "Name is too long (max {n}).",
      "err.msgShort": "Please write a short message.", "err.msgLong": "Message is too long (max {n}).",
      "err.links": "Please avoid adding several links.",
      "toast.sent": "Thank you! Your wishes were sent 💖", "toast.saved": "Thank you! Your wishes were saved 💖",
      "toast.quick": "That was quick! Please take a moment and try again.",
      "toast.wait": "Please wait {n}s before sending another wish.",
      "toast.rate": "Lots of wishes arriving! Please try again in a minute.",
      "toast.fail": "Sorry, we couldn’t send your wish. Please try again.",
      "toast.moreFail": "Couldn’t load more wishes. Please try again."
    },
    ar: {
      "lang.btn": "English", "lang.aria": "التبديل إلى الإنجليزية",
      "welcome.eyebrow": "دعوة زفاف", "welcome.open": "افتح الدعوة", "welcome.hint": "🎵 يُفضَّل تشغيل الصوت",
      "hero.eyebrow": "احجز الموعد • حفل الزفاف", "hero.scroll": "مرر للأسفل",
      "note.eyebrow": "بقلوب فرحة", "note.title": "أنتم مدعوون",
      "events.eyebrow": "شاركونا فرحتنا", "events.title": "موعد الفرح",
      "cd.days": "يوم", "cd.hours": "ساعة", "cd.min": "دقيقة", "cd.sec": "ثانية",
      "cd.today": "الفرح اليوم 🎉", "cd.past": "يوم جميل سيبقى في الذاكرة ✨",
      "event.view": "عرض الموقع ←", "event.tba": "الموعد يُعلن لاحقًا",
      "wishes.eyebrow": "اترك لنا كلمة", "wishes.title": "التهاني والأمنيات",
      "wishes.lead": "كلماتكم ستبقى معنا ذكرى جميلة للأبد.",
      "form.name": "اسمك", "form.message": "رسالتك",
      "form.namePh": "مثال: سارة أحمد", "form.messagePh": "اكتب كلمة طيبة… (بأي لغة)",
      "form.send": "أرسل تهنئتك ❤️",
      "feed.title": "رسائل من الأحباب", "feed.more": "عرض المزيد", "feed.loadingMore": "جارٍ التحميل…",
      "feed.loading": "جارٍ تحميل التهاني…", "feed.empty": "لا توجد تهاني بعد — كن أول من يكتب 💌",
      "feed.emptyLocal": "لا توجد تهاني بعد — كن أول من يكتب 💌 (محفوظة على هذا الجهاز)",
      "feed.error": "تعذّر تحميل التهاني الآن.", "feed.offline": "أنت غير متصل — نعرض آخر التهاني المحفوظة.",
      "feed.retry": "حاول مرة أخرى",
      "footer.eyebrow": "مع كل الحب", "footer.made": "صُنع بكل", "footer.credit": "تصميم وتنفيذ: فؤاد",
      "music.idle": "موسيقى", "music.on": "تعمل", "music.none": "لا موسيقى",
      "music.playAria": "تشغيل الموسيقى", "music.pauseAria": "إيقاف الموسيقى",
      "err.nameShort": "من فضلك اكتب اسمك.", "err.nameLong": "الاسم طويل جدًا (الحد الأقصى {n}).",
      "err.msgShort": "من فضلك اكتب رسالة قصيرة.", "err.msgLong": "الرسالة طويلة جدًا (الحد الأقصى {n}).",
      "err.links": "من فضلك تجنب إضافة عدة روابط.",
      "toast.sent": "شكرًا لك! تم إرسال تهنئتك 💖", "toast.saved": "شكرًا لك! تم حفظ تهنئتك 💖",
      "toast.quick": "سريع جدًا! من فضلك انتظر لحظة وحاول مرة أخرى.",
      "toast.wait": "من فضلك انتظر {n} ثانية قبل إرسال تهنئة أخرى.",
      "toast.rate": "تصل تهانٍ كثيرة! حاول مرة أخرى بعد دقيقة.",
      "toast.fail": "عذرًا، تعذّر إرسال تهنئتك. حاول مرة أخرى.",
      "toast.moreFail": "تعذّر تحميل المزيد. حاول مرة أخرى."
    }
  };

  let lang = cfg.defaultLang === "ar" ? "ar" : "en";
  try { const s = localStorage.getItem("wedding:lang"); if (s === "en" || s === "ar") lang = s; } catch (_) {}

  function t(key, vars) {
    let s = (dict[lang] && dict[lang][key]) || dict.en[key] || key;
    if (vars) for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }

  function apply() {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  function set(l) {
    lang = l === "ar" ? "ar" : "en";
    try { localStorage.setItem("wedding:lang", lang); } catch (_) {}
    apply();
  }

  window.I18n = {
    t, apply, set,
    toggle() { set(lang === "en" ? "ar" : "en"); },
    get lang() { return lang; },
    get content() { return cfg[lang]; },
    get locale() { return cfg[lang].locale; }
  };
})();
