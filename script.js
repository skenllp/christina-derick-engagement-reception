/* Christina & Derick — Engagement & Holy Matrimony Invitation · V4
   Vanilla JS. Sections: config · wedding year · intro (video + CSS fallback) ·
   reveal · countdown · calendars · share · navigation. */
(() => {
  'use strict';

  /* ───────────── CONFIG — safe to edit ───────────── */
  const CONFIG = {
    // Public URL used when guests share. Leave '' to read <meta property="og:url"> from index.html.
    siteUrl: '',
    // Exact Google Maps links. Leave '' to keep the Maps *search* links already in index.html.
    maps: { engagement: '', reception: '', wedding: '', weddingReception: '' },
    // Play the opening video's own audio. Off: the background music plays instead.
    videoSound: false,
    // Background music (the <audio id="music"> file in index.html). Starts when the guest
    // taps "Open Invitation" / "Skip Intro"; the round button toggles it. Loops.
    music: { enabled: true, volume: 0.6, fadeMs: 2200 },
    // Seconds to hold on the video's last frame (names on the card) before the invitation appears.
    cardHold: 1.8,

    /* ── CELEBRATION 1 · ENGAGEMENT (confirmed) ── */
    // 02 Jan 2027, 4:30 PM India Standard Time (UTC+05:30). Absolute instant → timezone-safe.
    eventStart: '2027-01-02T16:30:00+05:30',
    calendar: {
      title: 'Engagement of Christina & Derick',
      location: 'St. Thomas Syro Malabar Church, North Paravur, Kerala',
      description: 'Engagement ceremony at 4:30 PM, directly followed by reception at 6:30 PM at One Kochi, Airport Road, Nedumbassery, Kerala. Dress code: Ethnic Elegance.'
    },

    /* ── CELEBRATION 2 · HOLY MATRIMONY ──
       Year confirmed by the family: 2027 (same year as the engagement;
       9 January 2027 is a Saturday). The year fills the page, the countdown
       includes the wedding, and the separate "Holy Matrimony" calendar button shows.
       A year in which 9 January is not a Saturday is rejected (shown as "to be confirmed"). */
    wedding: {
      year: 2027,
      month: 1, day: 9,                 // 9 January
      time: '14:30',                    // 2:30 PM IST
      weekday: 6,                       // Saturday (0 = Sunday)
      calendar: {
        title: 'Holy Matrimony of Derick & Christina',
        location: 'St. Joseph Syro Malabar Church, Punnakunnam, Kuttanad, Alappuzha, Kerala',
        description: 'Holy Matrimony at 2:30 PM, St. Joseph Syro Malabar Church, Punnakunnam, Kuttanad, Alappuzha. Wedding reception at Vijaya International Convention Centre, Thiruvalla.'
      }
    }
  };

  const d = document, html = d.documentElement, body = d.body;
  const $ = id => d.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = $('intro'), main = $('invite'), video = $('introVideo'), stage = $('stage');
  const openBtn = $('openBtn'), skipBtn = $('skipBtn');
  const SEEN_KEY = 'cd-intro-seen';
  const store = {
    get() { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } },
    set() { try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {} }
  };
  let started = false, finished = false, videoBroken = false;

  /* ───────────── background music ───────────── */
  const music = $('music'), musicBtn = $('musicBtn');
  const MUSIC_OFF = 'cd-music-off';
  const Music = (() => {
    const ok = CONFIG.music.enabled && music && musicBtn;
    let fadeRaf = 0, wantPlaying = false, hiddenPause = false;
    const pref = { off() { try { return sessionStorage.getItem(MUSIC_OFF) === '1'; } catch (e) { return false; } },
                   set(v) { try { v ? sessionStorage.setItem(MUSIC_OFF, '1') : sessionStorage.removeItem(MUSIC_OFF); } catch (e) {} } };
    const ui = on => { musicBtn.setAttribute('aria-pressed', on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); };
    function fade(to, ms, done) {
      cancelAnimationFrame(fadeRaf);
      const from = music.volume, t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / ms);
        try { music.volume = from + (to - from) * k; } catch (e) {}
        if (k < 1) fadeRaf = requestAnimationFrame(step); else if (done) done();
      };
      fadeRaf = requestAnimationFrame(step);
    }
    function play() {                      // call from a tap/click/key handler
      if (!ok) return;
      wantPlaying = true; pref.set(false); ui(true);
      try { music.volume = 0; } catch (e) {}
      const p = music.play();
      const fadeIn = () => fade(CONFIG.music.volume, CONFIG.music.fadeMs);
      if (p && p.then) p.then(fadeIn).catch(() => { wantPlaying = false; ui(false); }); else fadeIn();
    }
    function pause(byUser) {
      if (!ok) return;
      wantPlaying = false; ui(false); if (byUser) pref.set(true);
      fade(0, 500, () => music.pause());
    }
    if (ok) {
      musicBtn.addEventListener('click', () => (music.paused || !wantPlaying) ? play() : pause(true));
      music.addEventListener('pause', () => { if (!hiddenPause && !wantPlaying) ui(false); });
      d.addEventListener('visibilitychange', () => {           // pause in background tabs, resume on return
        if (d.hidden) { if (!music.paused) { hiddenPause = true; music.pause(); } }
        else if (hiddenPause) { hiddenPause = false; if (wantPlaying) music.play().catch(() => ui(false)); }
      });
    }
    return {
      start() { if (ok && !pref.off()) play(); },
      show() {
        if (!ok) return;
        musicBtn.hidden = false;
        if (music.paused && !pref.off()) {
          // returning visit (intro skipped, no tap yet): start on the guest's first tap anywhere
          const first = e => {
            if (e.target.closest && e.target.closest('#musicBtn')) return;
            if (music.paused && !pref.off()) play();
          };
          d.addEventListener('pointerdown', first, { once: true, capture: true });
          d.addEventListener('keydown', first, { once: true, capture: true });
        }
      }
    };
  })();

  /* ───────────── wedding year (configurable, validated) ───────────── */
  const W = CONFIG.wedding;
  const weddingYear = (() => {
    const y = Number(W.year);
    if (!W.year || !Number.isInteger(y) || y < 2026 || y > 2100) return null;
    const wd = new Date(Date.UTC(y, W.month - 1, W.day)).getUTCDay();
    if (wd !== W.weekday) {
      console.warn('[invitation] Wedding year ' + y + ' ignored: ' + W.day + ' January ' + y + ' is not a Saturday. The year stays "to be confirmed".');
      return null;
    }
    return y;
  })();
  const two = n => String(n).padStart(2, '0');
  const weddingStart = weddingYear ? Date.parse(weddingYear + '-' + two(W.month) + '-' + two(W.day) + 'T' + W.time + ':00+05:30') : NaN;
  if (weddingYear) {
    html.classList.add('wedding-confirmed');
    d.querySelectorAll('[data-wy]').forEach(el => { el.textContent = weddingYear; el.classList.add('is-set'); });
    d.querySelectorAll('[data-wy-tail]').forEach(el => { el.innerHTML = ' <b>·</b> ' + weddingYear; el.hidden = false; });
  }
  const weddingDateText = 'Saturday, 9 January' + (weddingYear ? ' ' + weddingYear : '');
  const shareText = 'You are warmly invited to celebrate Christina & Derick.\n' +
    'Engagement — Saturday, 02 January 2027, 4:30 PM, St. Thomas Syro Malabar Church, North Paravur (reception 6:30 PM, One Kochi, Nedumbassery).\n' +
    'Holy Matrimony — ' + weddingDateText + ', 2:30 PM, St. Joseph Syro Malabar Church, Punnakunnam, Kuttanad (reception at Vijaya International Convention Centre, Thiruvalla).';
  if (video) {   // remember early failures (missing file etc.) so Open can fall back instantly
    const mark = () => { videoBroken = true; };
    video.addEventListener('error', mark);
    const s0 = video.querySelector('source'); if (s0) s0.addEventListener('error', mark);
  }

  /* ───────────── scroll reveal ───────────── */
  function reveal() {
    const els = [...d.querySelectorAll('.r')];
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(e => io.observe(e));
  }

  /* ───────────── 01 · opening intro ───────────── */
  function finish() {
    if (finished) return;
    finished = true;
    store.set();
    intro.classList.add('done');                 // cross-fade: intro opacity → 0 over the (burgundy) page
    body.classList.remove('locked');
    main.removeAttribute('inert');
    scrollTo(0, 0);
    main.focus({ preventScroll: true });
    Music.show();
    reveal();
    setTimeout(() => { try { video.pause(); } catch (e) {} intro.hidden = true; }, 1500);
  }

  /* Resolves true once the MP4 is really playing, false if it is missing / blocked / stalls. */
  function tryVideo() {
    return new Promise(resolve => {
      if (!video || videoBroken || video.error || video.networkState === 3) { resolve(false); return; }
      let settled = false;
      const done = ok => { if (settled) return; settled = true; clearTimeout(timer); resolve(ok); };
      const timer = setTimeout(() => done(false), 6000);
      video.addEventListener('playing', () => {
        done(true);
        intro.classList.add('playing');
        // names fade onto the blank ivory card as it settles (~1.6 s before the end),
        // then the last frame is held briefly before the cross-fade to the invitation
        video.addEventListener('timeupdate', () => {
          if (video.duration && video.duration - video.currentTime < 1.6) intro.classList.add('card-in');
        });
        video.addEventListener('ended', () => { intro.classList.add('card-in'); setTimeout(finish, CONFIG.cardHold * 1000); }, { once: true });
        setTimeout(finish, ((video.duration || 12) + CONFIG.cardHold + 6) * 1000);   // absolute safety net
      }, { once: true });
      const src = video.querySelector('source');
      if (src) src.addEventListener('error', () => done(false), { once: true });
      video.addEventListener('error', () => done(false), { once: true });

      video.muted = !CONFIG.videoSound;
      const p = video.play();
      if (p && p.catch) p.catch(() => {
        // sound blocked? retry muted once; otherwise give up
        if (!video.muted) { video.muted = true; video.play().catch(() => done(false)); } else done(false);
      });
    });
  }

  function cssFallback() {
    stage.hidden = false;
    intro.classList.add('fallback');
    setTimeout(() => intro.classList.add('is-open'), 60);
    setTimeout(finish, 3400);
  }

  async function openInvitation() {
    if (started || finished) return;
    started = true;
    Music.start();                              // inside the tap → allowed to play with sound
    openBtn.disabled = true;
    intro.classList.add('opening');             // hides the opening UI
    if (reduce) { finish(); return; }           // reduced motion: no video, straight to the invitation
    const ok = await tryVideo();
    if (!ok && !finished) cssFallback();        // CSS envelope only when the video is unusable
  }

  if (html.classList.contains('skip-intro') || !intro) {
    // same tab, already seen → straight to the invitation
    if (intro) intro.hidden = true;
    body.classList.remove('locked');
    finished = true;
    Music.show();
    reveal();
  } else {
    body.classList.add('locked');
    main.setAttribute('inert', '');
    openBtn.focus({ preventScroll: true });
    openBtn.addEventListener('click', openInvitation);
    skipBtn.addEventListener('click', () => { Music.start(); finish(); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && !finished) { Music.start(); finish(); } });
    if (stage) stage.addEventListener('click', openInvitation);
  }

  /* ───────────── fit text inside the framed cards (never overflow the artwork) ───────────── */
  const FIT_BOXES = '.eng__in,.wcer__in,.rec__in';
  function fitBoxes() {
    d.querySelectorAll(FIT_BOXES).forEach(box => {
      const need = () => {                     // content height, ignoring reveal transforms
        let top = Infinity, bottom = -Infinity;
        for (const k of box.children) {
          if (!k.offsetHeight) continue;
          const cs = getComputedStyle(k);
          top = Math.min(top, k.offsetTop - parseFloat(cs.marginTop));
          bottom = Math.max(bottom, k.offsetTop + k.offsetHeight + parseFloat(cs.marginBottom));
        }
        return bottom - top;
      };
      let f = 1;
      box.style.setProperty('--fit', '1');
      for (let i = 0; i < 14 && need() > box.clientHeight && f > 0.68; i++) {
        f -= 0.03; box.style.setProperty('--fit', f.toFixed(2));
      }
    });
  }
  fitBoxes();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fitBoxes);
  addEventListener('load', fitBoxes);
  let fitT = 0;
  addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitBoxes, 150); });

  /* ───────────── venue links ───────────── */
  d.querySelectorAll('a[data-map]').forEach(a => {
    const url = CONFIG.maps[a.dataset.map];
    if (url) a.href = url;
  });

  /* ───────────── 03 · countdown to the next celebration (timezone-aware) ───────────── */
  const events = [
    { name: 'the Engagement', at: Date.parse(CONFIG.eventStart), when: '02 January 2027, 4:30 PM IST' },
    { name: 'the Holy Matrimony', at: weddingStart, when: weddingDateText + ', 2:30 PM IST' }
  ].filter(e => !isNaN(e.at));
  const cd = { D: $('cdD'), H: $('cdH'), M: $('cdM'), S: $('cdS'), box: $('countdown'), done: $('cdDone'), label: $('cdFor') };
  let timer = null, current = null;
  function tick() {
    const now = Date.now();
    const next = events.find(e => e.at > now);
    if (!next) {
      cd.box.hidden = true; if (cd.label) cd.label.hidden = true; cd.done.hidden = false;
      clearInterval(timer);
      return;
    }
    if (next !== current) {
      current = next;
      if (cd.label) cd.label.textContent = 'Until ' + next.name;
      cd.box.setAttribute('aria-label', 'Time remaining until ' + next.name + ', ' + next.when);
    }
    const s = Math.floor((next.at - now) / 1000);
    cd.D.textContent = Math.floor(s / 86400);
    cd.H.textContent = two(Math.floor(s % 86400 / 3600));
    cd.M.textContent = two(Math.floor(s % 3600 / 60));
    cd.S.textContent = two(s % 60);
  }
  if (cd.box && events.length) { tick(); timer = setInterval(tick, 1000); }

  /* ───────────── 03 · add to calendar (.ics, start time only — no invented end) ───────────── */
  const siteUrl = () => {
    if (CONFIG.siteUrl) return CONFIG.siteUrl;
    const og = d.querySelector('meta[property="og:url"]');
    return (og && og.content) || location.href.split('#')[0];
  };
  const esc = s => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const fold = line => {                        // RFC 5545: max 75 octets per line
    const out = []; let cur = '';
    for (const ch of line) {
      if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  };
  const utc = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');   // 20270102T110000Z
  function downloadIcs({ uid, start, title, location, description, file }) {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Christina and Derick//Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid + '@christina-derick-invitation',
      'DTSTAMP:' + utc(Date.now()),
      'DTSTART:' + utc(start),                 // start time only; deliberately no DTEND
      'SUMMARY:' + esc(title),
      'LOCATION:' + esc(location),
      'DESCRIPTION:' + esc(description),
      'URL:' + siteUrl(),
      'END:VEVENT', 'END:VCALENDAR'
    ].map(fold).join('\r\n') + '\r\n';
    const a = d.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = file;
    body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  // Engagement: 4:30 PM IST = 11:00 UTC
  $('cal').addEventListener('click', () => downloadIcs({
    uid: 'engagement-20270102', start: Date.parse(CONFIG.eventStart), ...CONFIG.calendar,
    file: 'christina-derick-engagement.ics'
  }));
  // Holy Matrimony: separate event, offered only once the year is confirmed
  const calWed = $('calWed');
  if (calWed && weddingYear) {
    calWed.hidden = false;
    calWed.addEventListener('click', () => downloadIcs({
      uid: 'holy-matrimony-' + weddingYear + two(W.month) + two(W.day), start: weddingStart, ...W.calendar,
      file: 'derick-christina-holy-matrimony.ics'
    }));
  }

  /* ───────────── 07 · share + back to top ───────────── */
  $('share').addEventListener('click', async () => {
    const url = siteUrl();
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) {             // phones: native sheet (WhatsApp included)
      try { await navigator.share({ title: 'Christina & Derick — Engagement & Wedding Invitation', text: shareText, url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText + '\n' + url), '_blank', 'noopener');
  });
  $('top').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ───────────── page dots (desktop) ───────────── */
  const dots = [...d.querySelectorAll('.dots a')];
  if (dots.length && 'IntersectionObserver' in window) {
    const map = new Map(dots.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { dots.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); }
    }), { rootMargin: '-45% 0px -45% 0px' });
    map.forEach((_, id) => { const s = d.getElementById(id); if (s) io.observe(s); });
  }
})();
