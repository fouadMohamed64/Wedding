/* ==========================================================================
   WEDDING CONFIGURATION  —  the ONLY file you need to edit for your details.
   Text exists in two languages: `en` (default) and `ar`. Dates/times/links are shared.
   ========================================================================== */
window.WEDDING_CONFIG = {
  defaultLang: "en",               // "en" or "ar" — what visitors see first

  // ---- Shared (language independent) ----
  wedding: {
    date: "2026-11-21",            // YYYY-MM-DD  (Saturday 21/11/2026)
    time: "20:00",                 // 24h HH:MM, 8 PM (device local time)
    mapsUrl: ""                    // Google Maps link; leave "" to hide the button
  },
  // Optional second event: add `henna: { date, time, mapsUrl }` here AND `henna: {...}` in en/ar below.

  // Music: "" = built-in tune generated in the browser (no file needed).
  //   musicStyle "zaffa" = Egyptian wedding-procession style (default), "piano" = soft romantic piano.
  // To use a real song instead, put it in public/assets/music/ and set e.g. "assets/music/wedding.mp3".
  // Music source, in priority order: youtubeId → musicPath (your own file) → built-in tune.
  // youtubeId = the part after "v=" in a YouTube link (played through YouTube's official embedded player).
  youtubeId: "FmyQtbslamM",          // Tamer Hosny – Helm Snen
  musicPath: "",
  musicStyle: "zaffa",               // built-in tune used if YouTube/file can't load
  musicVolume: 0.55,

  // ---- English ----
  en: {
    locale: "en-GB",
    groom: "Abdullah",
    bride: "Samah",
    initials: "A & S",
    blessing: "In the name of God, the Most Gracious, the Most Merciful",
    quote:
      "“And among His signs is that He created for you spouses from among yourselves, that you may find tranquility in them, and He placed between you affection and mercy.”",
    invitationMessage:
      "Our families are honoured to invite you and your dear family to the wedding celebration and marriage contract, God willing.",
    finalMessage: "May God bless you both, and bring you together in goodness.",
    families: [
      { name: "Al-Meshneb Family", role: "Akhmim", head: "Hajj Ahmed Allam Mahmoud Al-Meshneb" },
      { name: "Al-Sheibani Family", role: "Al-Mansha", head: "Hajj Qadri Abdel Hamid Hashem Al-Sheibani" }
    ],
    wedding: {
      title: "The Wedding Day",
      subtitle: "Wedding & marriage contract",
      tag: "Saturday",
      venue: "Grand VIP Hall"
    }
  },

  // ---- العربية ----
  ar: {
    locale: "ar-EG-u-nu-latn",     // "-u-nu-latn" = 0-9 digits; remove it for ٠-٩
    groom: "عبدالله",
    bride: "سماح",
    initials: "ع & س",
    blessing: "بسم الله الرحمن الرحيم",
    quote:
      "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً",
    invitationMessage:
      "يتشرف الأهل بدعوة سيادتكم والعائلة الكريمة لحضور حفل زفاف وعقد قران، وذلك بمشيئة الله تعالى.",
    finalMessage: "بارك الله لهما وبارك عليهما وجمع بينهما في خير",
    families: [
      { name: "آل المشنب", role: "أخميم", head: "الحاج أحمد علام محمود المشنب" },
      { name: "آل الشيباني", role: "المنشاه", head: "الحاج قدري عبد الحميد هاشم الشيباني" }
    ],
    wedding: {
      title: "يوم الزفاف",
      subtitle: "حفل زفاف وعقد قران",
      tag: "يوم السبت",
      venue: "قاعة جراند VIP"
    }
  }
};
