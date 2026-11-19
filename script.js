(() => {
  const d = document, body = d.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = d.getElementById('intro'), main = d.getElementById('invite'), video = d.getElementById('introVideo');
  const openBtn = d.getElementById('openBtn'), skipBtn = d.getElementById('skipBtn');
  const VIDEO = 'assets/video/envelope-open.mp4';
  let started = false, finished = false;

  body.classList.add('locked');
  main.setAttribute('inert', '');
  openBtn.focus({ preventScroll: true });

  function reveal() {
    const els = [...d.querySelectorAll('.r')];
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(e => io.observe(e));
  }

  function finish() {
    if (finished) return;
    finished = true;
    video.pause();
    intro.classList.add('done');
    body.classList.remove('locked');
    main.removeAttribute('inert');
    scrollTo(0, 0);
    main.focus({ preventScroll: true });
    reveal();
    setTimeout(() => { intro.hidden = true; }, 1400);
  }

  async function hasVideo() {
    try { return (await fetch(VIDEO, { method: 'HEAD' })).ok; } catch (e) { return false; }
  }

  async function open() {
    if (started) return;
    started = true;
    openBtn.disabled = true;
    intro.classList.add('opening','is-open');
    if (!reduce && await hasVideo()) {
      try {
        video.src = VIDEO; video.hidden = false;
        await video.play();
        video.classList.add('on');
        video.onended = finish; video.onerror = finish;
        setTimeout(finish, 15000);
        return;
      } catch (e) { video.hidden = true; }
    }
    setTimeout(finish, reduce ? 0 : 3300);
  }

  openBtn.addEventListener('click', open);
  skipBtn.addEventListener('click', finish);
  d.getElementById('env').addEventListener('click', open);

  // WhatsApp share (uses the current page URL)
  const url = location.href.split('#')[0];
  const msg = 'You are warmly invited to the engagement of Christina & Derick — Saturday, 02 January 2027, 4:30 PM, St. Thomas Syro Malabar Church, North Paravur.\n' + url;
  d.getElementById('share').href = 'https://wa.me/?text=' + encodeURIComponent(msg);

  // Add to Calendar (.ics, 02 Jan 2027 4:30 PM Asia/Kolkata)
  d.getElementById('cal').addEventListener('click', () => {
    const esc = s => s.replace(/([,;])/g, '\\$1');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Christina and Derick//Invitation//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VTIMEZONE', 'TZID:Asia/Kolkata', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0530', 'TZOFFSETTO:+0530', 'TZNAME:IST', 'END:STANDARD', 'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:engagement-20270102@christina-derick', 'DTSTAMP:' + stamp,
      'DTSTART;TZID=Asia/Kolkata:20270102T163000', 'DTEND;TZID=Asia/Kolkata:20270102T210000',
      'SUMMARY:' + esc('Engagement of Christina & Derick'),
      'LOCATION:' + esc('St. Thomas Syro Malabar Church, North Paravur'),
      'DESCRIPTION:' + esc('Engagement ceremony at 4:30 PM, directly followed by reception at 6:30 PM at One Kochi, Airport Road, Nedumbassery. Dress code: Ethnic Elegance.'),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const a = d.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'christina-derick-engagement.ics';
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  d.getElementById('top').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
})();
