// Hestia Startseite: Ringe, Einblenden, kleine nachgebaute App-Ausschnitte zum Ausprobieren.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 60) : ms));
  const fmt = new Intl.NumberFormat('de-DE');
  const buzz = () => navigator.userActivation?.hasBeenActive && navigator.vibrate && navigator.vibrate(8);

  // ---------- Ringe (wie ProgressRing in der App) ----------
  const NS = 'http://www.w3.org/2000/svg';
  function makeRing(el) {
    const size = +el.dataset.size || 46;
    const stroke = +el.dataset.stroke || (size > 60 ? 5 : 3.5);
    const color = `var(--${el.dataset.ring})`;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    el.style.width = el.style.height = size + 'px';
    el.style.setProperty('--s', size + 'px');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    const mk = (cls, col) => {
      const ci = document.createElementNS(NS, 'circle');
      ci.setAttribute('cx', size / 2);
      ci.setAttribute('cy', size / 2);
      ci.setAttribute('r', r);
      ci.setAttribute('fill', 'none');
      ci.setAttribute('stroke-width', stroke);
      ci.setAttribute('stroke-linecap', 'round');
      ci.style.stroke = col;
      ci.setAttribute('class', cls);
      svg.appendChild(ci);
      return ci;
    };
    mk('rt', 'var(--track)');
    const v = mk('rv', color);
    v.style.strokeDasharray = c;
    v.style.strokeDashoffset = c;
    el.prepend(svg);
    el.setRing = (val) => {
      const p = Math.max(0, Math.min(1, val));
      v.style.strokeDashoffset = c * (1 - p);
      v.style.opacity = p === 0 ? 0 : 1;
    };
    el.setRing(0);
  }
  $$('[data-ring]').forEach(makeRing);
  const fillRings = (root) => $$('[data-ring]', root).forEach((el) => el.setRing(+el.dataset.value || 0));

  // ---------- Zahlen hochzählen ----------
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const to = +el.dataset.count;
    if (reduce) { el.textContent = fmt.format(to); return; }
    const t0 = performance.now();
    const dur = 1300;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt.format(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Einblenden beim Scrollen ----------
  const onShow = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      fillRings(el);
      $$('[data-count]', el).forEach(countUp);
      const fn = onShow.get(el);
      if (fn) fn();
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  // Sichtbarkeit für laufende Schleifen (nur animieren, wenn man hinsieht)
  const visible = new WeakMap();
  const vio = new IntersectionObserver((entries) => entries.forEach((en) => visible.set(en.target, en.isIntersecting)), { threshold: 0.05 });
  const watch = (el) => { vio.observe(el); return () => visible.get(el); };

  // ---------- Navigation ----------
  const nav = $('#nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:24px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([en]) => nav.classList.toggle('scrolled', !en.isIntersecting)).observe(sentinel);

  // ---------- Hero ----------
  const hero = $('.hero');
  const heroVisible = watch(hero);
  setTimeout(() => {
    fillRings(hero);
    $$('[data-count]', hero).forEach(countUp);
    $$('.protein i b', hero).forEach((b) => b.classList.add('go'));
  }, reduce ? 0 : 700);

  const ringM = $('#heroRingM');
  const tileM = $('#heroTileM');
  const subM = $('#heroSubM');
  const task = $('#heroTask');
  const taskCircle = $('.circle', task);
  async function heroLoop() {
    await sleep(2800);
    for (;;) {
      if (!heroVisible() && !reduce) { await sleep(800); continue; }
      taskCircle.classList.add('done');
      await sleep(380);
      ringM.setRing(1);
      tileM.classList.add('glow-indigo');
      subM.textContent = 'Alles erledigt';
      await sleep(500);
      task.classList.add('gone');
      if (reduce) return;
      await sleep(4200);
      taskCircle.classList.remove('done');
      task.classList.remove('gone');
      tileM.classList.remove('glow-indigo');
      ringM.setRing(0.62);
      subM.textContent = '1 offen · 10 min';
      await sleep(2600);
    }
  }
  heroLoop();

  // Telefon neigt sich leicht zur Maus
  const phone = $('#heroPhone');
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        phone.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
      });
    });
    hero.addEventListener('pointerleave', () => { phone.style.transform = ''; });
  }

  // ---------- Frag Hestia ----------
  const chat = $('#chat');
  const ctext = $('#composerTxt');
  const wave = $('#wave');
  const chatVisible = watch(chat);
  const checkSvg = '<svg><use href="#check"/></svg>';
  const scenes = [
    { say: 'Hatte gerade einen Cappuccino, und die Milch ist leer.', out: [
      { a: 'Cappuccino eingetragen', s: 'Snacks & Getränke · 110 kcal' },
      { a: 'Milch auf die Einkaufsliste', s: 'Im Vorrat als leer markiert' },
    ] },
    { say: 'Bad ist geputzt. Jonas hat den Müll schon rausgebracht.', out: [
      { a: 'Bad putzen erledigt', s: 'Für dich · 20 min' },
      { a: 'Müll rausbringen erledigt', s: 'Für Jonas · 5 min' },
      { text: 'Damit seid ihr beide für heute fertig.' },
    ] },
    { say: 'Was können wir heute Abend kochen, mit dem, was da ist?', out: [
      { text: 'Aus eurem Vorrat passt gut:' },
      { recipe: 'Ofengemüse mit Feta', s: '35 min · alles im Vorrat' },
      { a: 'Für heute Abend einplanen', s: 'Mira und Jonas', ink: true },
    ] },
    { say: 'Wie viel Eiweiß hatte ich heute?', out: [
      { text: '62 g von 90 g. Ein Skyr am Abend würde fast reichen.' },
    ] },
  ];
  const nodeFor = (o) => {
    const d = document.createElement('div');
    if (o.text) { d.className = 'answer'; d.textContent = o.text; }
    else if (o.recipe) { d.className = 'recipe-mini'; d.innerHTML = `<div class="rc-img"></div><div><b>${o.recipe}</b><span>${o.s}</span></div>`; }
    else {
      d.className = 'action';
      d.innerHTML = `<span class="ic${o.ink ? ' ink' : ''}">${o.ink ? '+' : checkSvg}</span><span class="t">${o.a}<small>${o.s}</small></span>${o.ink ? '' : '<span class="undo">Rückgängig</span>'}`;
    }
    return d;
  };
  async function chatLoop() {
    let i = 0;
    for (;;) {
      if (!chatVisible()) { await sleep(600); continue; }
      const sc = scenes[i % scenes.length];
      wave.classList.add('on');
      ctext.classList.add('typing');
      ctext.textContent = '';
      for (const ch of sc.say) {
        ctext.textContent += ch;
        await sleep(reduce ? 0 : 34 + Math.random() * 30);
      }
      if (reduce) ctext.textContent = sc.say;
      await sleep(700);
      wave.classList.remove('on');
      ctext.classList.remove('typing');
      ctext.textContent = 'Hör zu …';
      const b = document.createElement('div');
      b.className = 'bubble';
      b.textContent = sc.say;
      chat.appendChild(b);
      await sleep(650);
      for (const o of sc.out) {
        chat.appendChild(nodeFor(o));
        await sleep(520);
      }
      await sleep(3800);
      chat.style.transition = 'opacity .35s';
      chat.style.opacity = '0';
      await sleep(380);
      chat.innerHTML = '';
      chat.style.opacity = '1';
      i++;
    }
  }
  onShow.set($('.hestia-stage'), () => chatLoop());

  // ---------- Haushalt: Abhaken ----------
  $$('.pcard').forEach((card) => {
    const ring = $('[data-ring]', card);
    const sub = $('[data-sub]', card);
    const circles = $$('.circle', card);
    const total = circles.reduce((s, c) => s + +c.dataset.min, 0);
    const update = () => {
      const done = circles.filter((c) => c.classList.contains('done'));
      const doneMin = done.reduce((s, c) => s + +c.dataset.min, 0);
      const open = circles.length - done.length;
      ring.setRing(doneMin / total);
      sub.textContent = open ? `${open} offen · ${total - doneMin} min` : 'Alles erledigt';
      const complete = open === 0;
      if (complete && !card.classList.contains('complete')) buzz();
      card.classList.toggle('complete', complete);
    };
    circles.forEach((c) => c.addEventListener('click', () => {
      c.classList.toggle('done');
      c.closest('li').classList.toggle('is-done', c.classList.contains('done'));
      buzz();
      update();
    }));
  });
  // Jonas hat schon eine Aufgabe erledigt, damit der Ring etwas zeigt
  onShow.set($('.chores-board'), () => setTimeout(() => {
    const first = $('#pcardJ .circle');
    if (!first.classList.contains('done')) first.click();
  }, 900));

  // ---------- Essen ----------
  const scan = $('.b-scan');
  const scanVisible = watch(scan);
  onShow.set(scan, async () => {
    for (;;) {
      await sleep(2600);
      if (!scanVisible()) continue;
      scan.classList.add('found');
      if (reduce) return;
      await sleep(3800);
      scan.classList.remove('found');
    }
  });

  const urlEl = $('#urlTyped');
  const rcard = $('#recipeCard');
  const imp = $('.b-import');
  const impVisible = watch(imp);
  onShow.set(imp, async () => {
    const url = 'https://kochseite.de/ofengemuese-feta';
    for (;;) {
      if (!impVisible()) { await sleep(600); continue; }
      urlEl.textContent = '';
      rcard.classList.remove('show');
      await sleep(500);
      for (const ch of url) { urlEl.textContent += ch; await sleep(reduce ? 0 : 45); }
      if (reduce) urlEl.textContent = url;
      await sleep(600);
      rcard.classList.add('show');
      if (reduce) return;
      await sleep(4200);
    }
  });

  const timer = $('.timer');
  const tRing = $('.timer-ring', timer);
  const tText = $('b', timer);
  let secs = 720;
  setInterval(() => {
    if (!timer.closest('.in')) return;
    secs = secs <= 0 ? 720 : secs - 1;
    tText.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    tRing.style.setProperty('--t', `${(1 - secs / 720) * 360}deg`);
  }, 1000);

  // ---------- Einkauf ----------
  const items = $$('#shopItems button');
  const sRing = $('#shopRing');
  const sNum = $('#shopNum');
  const sTitle = $('#shopTitle');
  const sCard = $('#shopProgress');
  const updateShop = () => {
    const n = items.filter((b) => b.classList.contains('is-done')).length;
    sRing.setRing(n / items.length);
    sNum.textContent = `${n}/${items.length}`;
    const left = items.length - n;
    sTitle.textContent = left ? `${left} ${left === 1 ? 'Artikel' : 'Artikel'} offen` : 'Alles im Wagen';
    if (!left && !sCard.classList.contains('complete')) buzz();
    sCard.classList.toggle('complete', !left);
  };
  items.forEach((b) => b.addEventListener('click', () => {
    b.classList.toggle('is-done');
    $('.circle', b).classList.toggle('done');
    buzz();
    updateShop();
  }));
  onShow.set($('.shop-list'), () => setTimeout(() => { items[0].click(); setTimeout(() => items[3].click(), 450); }, 900));

  const rStage = $('#receiptStage');
  const rObs = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    rObs.disconnect();
    rStage.classList.add('run');
    setTimeout(() => rStage.classList.add('done'), reduce ? 0 : 2600);
  }, { threshold: 0.4 });
  rObs.observe(rStage);

  // ---------- Widgets ----------
  let kcal = 1420;
  const wq = $('#wqKcal');
  const toast = $('#wqToast');
  let tTimer;
  $$('#wqGrid button').forEach((b) => b.addEventListener('click', () => {
    kcal += +b.dataset.kcal;
    wq.textContent = `${fmt.format(kcal)} kcal`;
    toast.textContent = `✓ ${b.textContent}`;
    toast.classList.add('show');
    buzz();
    clearTimeout(tTimer);
    tTimer = setTimeout(() => toast.classList.remove('show'), 1300);
  }));

  // ---------- Haushalts-Zeichen in den Personenfarben ----------
  const house = $('#house');
  const sw = $$('.swatches button');
  const paint = () => {
    const cols = sw.filter((b) => b.classList.contains('on')).map((b) => b.style.getPropertyValue('--c'));
    const g = cols.length === 1 ? [cols[0], cols[0]] : cols;
    house.style.background = `linear-gradient(135deg, ${g.join(', ')})`;
    house.style.setProperty('--g1', g[0]);
  };
  sw.forEach((b) => b.addEventListener('click', () => {
    const on = sw.filter((x) => x.classList.contains('on'));
    if (b.classList.contains('on') && on.length === 1) return;
    b.classList.toggle('on');
    buzz();
    paint();
  }));
  paint();
})();
