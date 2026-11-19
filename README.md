# Christina & Derick — Engagement & Holy Matrimony Invitation · V4

Static site (HTML/CSS/vanilla JS). Upload the folder to any static host (Vercel, Netlify, GitHub Pages) or run `python3 -m http.server`.

## Two celebrations, each with its own reception

| | Ceremony | Reception | Best Compliments |
|---|---|---|---|
| **Engagement** | Sat, 02 January 2027 · 4:30 PM · St. Thomas Syro Malabar Church, North Paravur | 6:30 PM · One Kochi, Airport Road, Nedumbassery | Charles Cherian |
| **Holy Matrimony** | Sat, 9 January 2027 · 2:30 PM · St. Joseph Syro Malabar Church, Punnakunnam, Kuttanad, Alappuzha | Vijaya International Convention Centre, Thiruvalla · *no time supplied, none shown* | Donna & Joel |

## Pages
1. Opening — the video's **first frame** fills the screen with "Engagement & Holy Matrimony", **Christina & Derick** and both dates over it, plus Open Invitation / Skip Intro. On Open, `assets/video/envelope-open.mp4` plays; as the blank ivory card settles, the names and both dates fade onto it and the last frame is held briefly (`CONFIG.cardHold`) before the invitation appears. CSS envelope only if the video can't play. Seen once per tab.
2. Engagement invitation card
3. Save the Dates — both dates (each links to its section), live IST countdown to the *next* celebration, separate Engagement and Holy Matrimony calendar buttons
4. Engagement ceremony · 5. Engagement reception · 6. Dress code (labelled for the engagement)
7. Holy Matrimony invitation card · 8. Holy Matrimony ceremony · 9. Wedding reception
10. Closing — Best Compliments for each celebration, both dates, Share, Back to Top

## Background music
`assets/audio/a-thousand-years.mp3` (re-encoded to 96 kbps, ~3.4 MB). It starts, fading in, when the guest taps **Open Invitation** or **Skip Intro**, loops, and pauses while the tab is in the background. The round gold button (bottom-right) pauses/plays it. On a repeat visit in the same tab (intro skipped) it starts on the guest's first tap, unless they paused it.
Settings: `CONFIG.music` (`enabled`, `volume`, `fadeMs`). The video's own audio is off (`CONFIG.videoSound: false`) so the two don't clash.
To change the song, replace the file (keep the name) or edit the `<audio id="music">` src in `index.html`.

## Wedding year
Confirmed as **2027**, the same year as the engagement (9 January 2027 is a Saturday). It is set in `script.js` (`CONFIG.wedding.year`) and also written into the HTML and share texts. A year in which 9 January isn't a Saturday is rejected by the script.

## House-name spellings (kept as supplied, pending confirmation)
- Engagement card: "Elenjikkal House", "Kappil Koipallil"
- Wedding card: "Elanjikkal House", "Kappil Koippallil, Punnakunnam"

## Other things you may want to edit
- **Production domain**: in `index.html` `<head>`, replace the domain in `canonical`, `og:url`, `og:image`, `twitter:image`. Sharing reads `og:url`.
- **Exact map links**: `CONFIG.maps` in `script.js` (`engagement`, `reception`, `wedding`, `weddingReception`; empty = Google Maps search links in `index.html`).
- **Calendar**: start times only; no end times are invented.
- WhatsApp preview image: `assets/share.jpg` (1200×630) now lists both celebrations; the previous engagement-only version is kept as `assets/share-engagement-original.jpg`. Re-share the link after deploying, because WhatsApp caches previews.
