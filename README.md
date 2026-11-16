# 💍 Interactive Wedding Invitation

A romantic, mobile-first wedding invitation: opening screen, background music, two events (Henna Day + Wedding Day) with live countdowns, and a public **wishes wall** powered by Supabase.
Plain HTML + CSS + vanilla JS — no framework, no runtime dependencies.

## Project structure

```
wedding/
├─ public/                    ← the website (this folder is deployed)
│  ├─ index.html
│  ├─ css/styles.css
│  ├─ js/
│  │  ├─ config.js            ← ✏️ EDIT YOUR WEDDING DETAILS HERE
│  │  ├─ env.js               ← Supabase public settings (auto-generated on deploy)
│  │  ├─ music.js             ← music player + toggle
│  │  ├─ countdown.js
│  │  ├─ wishes.js            ← form, validation, Supabase, feed
│  │  └─ main.js              ← wiring, events, animations
│  └─ assets/
│     ├─ music/wedding.mp3    ← 🎵 add your song here
│     └─ images/hero.jpg      ← 🖼 optional background photo
├─ supabase/schema.sql        ← table + RLS policies + anti-spam
├─ scripts/build-env.js       ← writes env.js from environment variables
├─ vercel.json  package.json  .env.example  .gitignore
```

## 1. Change the wedding details

Open [`public/js/config.js`](public/js/config.js). Everything lives there: names, initials, quote, invitation message, final message, and for each event (`henna`, `wedding`): title, date (`YYYY-MM-DD`), time (24h `HH:MM`), venue, Google Maps link (leave `""` to hide the button). Current values are **placeholders**.

To get a Maps link: open Google Maps → find the venue → *Share* → *Copy link*.

## 2. Add music and images

- **Music:** save your song as `public/assets/music/wedding.mp3` (or change `musicPath` in `config.js`). Keep it under ~4 MB. Use a track you have the right to use.
- **Background photo (optional):** `public/assets/images/hero.jpg` (~1600px wide, under ~300 KB). Without it the built-in gradient + floral decorations are used.

Music starts when the visitor taps **Open Invitation** (required by browser autoplay rules). A floating button toggles play/pause and shows animated bars while playing. It keeps playing while scrolling, and pauses when the tab is hidden.

## 3. Set up Supabase (guest wishes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Dashboard → **SQL Editor** → New query → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates the `wishes` table, enables **Row Level Security**, and adds:
   - `select` policy: anyone can read non-hidden wishes
   - `insert` policy: anyone can add a wish (name 2–40 chars, message 3–500 chars)
   - **no update/delete policies** → visitors can never edit or delete anything
   - a trigger that rejects floods (20+ wishes per minute)
3. Dashboard → **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   ⚠️ Never use the `service_role` key — it is not needed and must never appear in frontend code. (The build script refuses it.)

### Moderating / deleting messages
Dashboard → **Table Editor → wishes**:
- **Delete:** select the row → delete.
- **Hide without deleting:** edit the row and tick `is_hidden`.
Changes appear on the site within ~30 seconds (or on refresh).

## 4. Run locally

```bash
cp .env.example .env      # then fill in the two values (Windows: copy .env.example .env)
npm run dev               # builds env.js and serves http://localhost:3000
```

Without Node you can simply paste the URL/anon key into `public/js/env.js` and open `public/index.html` (or use any static server). Without credentials the site still works; the wishes wall shows a friendly "not connected" message.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo. Framework preset: **Other**. (`vercel.json` already sets the build command and the `public` output directory.)
3. **Settings → Environment Variables**, add for *Production* (and Preview):
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon public key
4. Deploy. Every build regenerates `public/js/env.js` from these variables.

CLI alternative: `npm i -g vercel`, then `vercel` and `vercel --prod` from this folder (add the env vars first with `vercel env add`).

Netlify also works: build command `node scripts/build-env.js`, publish directory `public`, same two env vars.

## Features checklist

- Opening screen (monogram, names, quote, **Open Invitation**) with staggered entrance animation
- Music: starts on click, play/pause toggle, animated indicator, graceful if the file is missing
- Hero, invitation message, two distinct event cards with maps buttons and live countdowns
- Wishes: validation, honeypot, 30 s cooldown, loading/empty/error states, instant update after sending, 30 s auto-refresh, "show more" pagination, Arabic/RTL text supported
- Responsive from 320 px to large desktops, no horizontal scroll, touch-friendly targets, `prefers-reduced-motion` respected

## Security notes
- Only the **anon** key is in the browser; all access is limited by RLS.
- Messages are rendered with `textContent` (no HTML injection).
- Client-side checks are convenience; the same limits are enforced by the database.
