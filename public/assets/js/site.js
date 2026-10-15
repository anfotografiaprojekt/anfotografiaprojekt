/*!
 * Anna Niedobitek Fotografia — działanie strony
 * Kolejność: dane początkowe (dane.js) → renderowanie (render.js) → interakcje (ten plik).
 * Panel administratora (cms.js) ładuje się dopiero po kliknięciu kłódki.
 */
(function () {
  'use strict';
  var A = window.ANF, Rn = A.render, doc = document, html = doc.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var API = '/api';
  var KLUCZE = ['nav', 'kropki', 'jezyki', 'pasek', 'stopka'];
  var site = A.site = { api: API, demo: location.protocol === 'file:' };

  /* ---------- skrót danych (czy treść w HTML jest aktualna?) ---------- */
  site.hash = function (s) { return Rn.hash(JSON.stringify(s)); };

  /* ---------- język ---------- */
  function wybierzJezyk(s) {
    var q = new URLSearchParams(location.search).get('lang'), z = null;
    try { z = localStorage.getItem('anf-lang'); } catch (e) { }
    var l = q || z || 'pl';
    var ok = Rn.jezykiWl(s).some(function (j) { return j.kod === l; });
    return ok ? l : 'pl';
  }

  /* ---------- stan początkowy ---------- */
  var osadzony = doc.getElementById('cms-state'), state;
  try { state = Rn.stan(osadzony ? JSON.parse(osadzony.textContent) : null); } catch (e) { state = Rn.stan(); }
  site.state = state;
  site.lang = wybierzJezyk(state);

  /* ---------- renderowanie całości ---------- */
  function zamien(k, htmlStr) {
    var el = doc.querySelector('[data-ssr="' + k + '"]');
    if (!el) return;
    var tpl = doc.createElement('template'); tpl.innerHTML = htmlStr.trim();
    var nowy = tpl.content.firstElementChild;
    if (nowy) el.replaceWith(nowy);
  }
  function ustawMeta(sel, v) { var m = doc.querySelector(sel); if (m) m.setAttribute('content', v); }
  function renderuj(s, op) {
    op = op || {};
    site.state = s;
    site.lang = wybierzJezyk(s);
    var out = Rn.wszystko(s, { lang: site.lang });
    var main = doc.querySelector('main[data-ssr="sekcje"]');
    if (main) main.innerHTML = out.sekcje; else ['start', 'oMnie', 'historia', 'aktualnosci', 'kadra', 'portfolio', 'instagram', 'kontakt'].forEach(function (k) { zamien(k, out[k]); });
    KLUCZE.forEach(function (k) { zamien(k, out[k]); });
    html.setAttribute('data-motyw', out.motyw);
    ustawMeta('meta[name="theme-color"]', out.motywTlo);
    doc.title = out.title;
    ustawMeta('meta[name="description"]', out.description);
    ustawMeta('meta[property="og:title"]', out.title); ustawMeta('meta[name="twitter:title"]', out.title);
    ustawMeta('meta[property="og:description"]', out.description); ustawMeta('meta[name="twitter:description"]', out.description);
    var ld = doc.querySelector('script[data-ssr="jsonld"]'); if (ld) ld.textContent = out.jsonld;
    doc.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (l) { l.remove(); });
    var hm = doc.querySelector('meta[data-ssr="hreflang"]');
    if (hm && out.hreflang) hm.insertAdjacentHTML('afterend', out.hreflang);
    html.lang = site.lang;
    var meta = doc.querySelector('meta[name="anf-ssr"]');
    if (meta) meta.setAttribute('content', out.znacznik);
    if (!op.bezInit) initDynamiczne();
  }
  site.renderuj = renderuj;

  function aktualnyHtml(s) {
    var meta = doc.querySelector('meta[name="anf-ssr"]');
    return meta && meta.getAttribute('content') === Rn.znacznik(s, { today: Rn.dzis(), lang: site.lang });
  }

  /* ---------- tryb demonstracyjny: IndexedDB (z zapasem w localStorage) ---------- */
  var IDB = {
    db: function () {
      return new Promise(function (ok, nie) {
        if (!window.indexedDB) return nie(new Error('brak IndexedDB'));
        var r = indexedDB.open('anf-cms', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { ok(r.result); }; r.onerror = function () { nie(r.error); };
      });
    },
    get: function (k) {
      return IDB.db().then(function (db) {
        return new Promise(function (ok, nie) { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { nie(q.error); }; });
      }).catch(function () { try { return JSON.parse(localStorage.getItem('anf-' + k)); } catch (e) { return null; } });
    },
    set: function (k, v) {
      return IDB.db().then(function (db) {
        return new Promise(function (ok, nie) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = ok; tx.onerror = function () { nie(tx.error); }; });
      }).catch(function () { localStorage.setItem('anf-' + k, JSON.stringify(v)); });
    }
  };
  site.idb = IDB;

  /* ---------- wczytanie danych z serwera ---------- */
  function wczytaj() {
    if (site.demo) return IDB.get('stan').then(function (d) { return d ? Rn.stan(d) : null; });
    return fetch(API + '/tresci', { headers: { Accept: 'application/json' }, cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var ct = r.headers.get('content-type') || '';
        if (ct.indexOf('json') < 0) throw new Error('to nie JSON');
        return r.json();
      })
      .then(function (d) { return Rn.stan(d && d.dane ? d.dane : null); })
      .catch(function () {
        site.demo = true;
        return IDB.get('stan').then(function (d) { return d ? Rn.stan(d) : null; });
      });
  }

  /* ================= INTERAKCJE ================= */
  var obsSekcji, obsWej, obsHero, tickerTimer;

  function ustawPasek() {
    var p = doc.querySelector('.pasek');
    var h = p && !p.hidden ? p.offsetHeight : 0;
    html.style.setProperty('--pasek', h + 'px');
  }

  function initKropkiIMenu() {
    if (obsSekcji) obsSekcji.disconnect();
    var linki = doc.querySelectorAll('.kropki a, .menu-lista a');
    obsSekcji = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (!w.isIntersecting) return;
        var id = w.target.id;
        linki.forEach(function (a) {
          if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    doc.querySelectorAll('main > section[id]:not([hidden])').forEach(function (s) { obsSekcji.observe(s); });
  }

  function initNaglowek() {
    var hero = doc.getElementById('start'), nag = doc.getElementById('naglowek');
    if (obsHero) obsHero.disconnect();
    if (!hero || !nag) return;
    obsHero = new IntersectionObserver(function (w) {
      nag.classList.toggle('naglowek--przezr', w[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px', threshold: 0.12 });
    obsHero.observe(hero);
  }

  function initAnimacje() {
    if (obsWej) obsWej.disconnect();
    var wl = site.state.ustawienia.animacje && !reduced && 'IntersectionObserver' in window;
    html.classList.toggle('anim', !!wl);
    if (!wl) return;
    obsWej = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { if (w.isIntersecting) { w.target.classList.add('widac'); obsWej.unobserve(w.target); } });
    }, { threshold: 0.12 });
    doc.querySelectorAll('.sek, .rozdzial').forEach(function (s) { obsWej.observe(s); });
  }

  function initPasek() {
    clearInterval(tickerTimer);
    ustawPasek();
    var p = doc.querySelector('.pasek'); if (!p || p.hidden) return;
    var li = p.querySelectorAll('.pasek-lista li'), lic = p.querySelector('.pasek-licznik'), i = 0, stop = false;
    if (li.length < 2) return;
    p.addEventListener('mouseenter', function () { stop = true; }); p.addEventListener('mouseleave', function () { stop = false; });
    p.addEventListener('focusin', function () { stop = true; }); p.addEventListener('focusout', function () { stop = false; });
    tickerTimer = setInterval(function () {
      if (stop || doc.hidden) return;
      li[i].hidden = true; li[i].classList.remove('wej');
      i = (i + 1) % li.length;
      li[i].hidden = false; if (!reduced) li[i].classList.add('wej');
      if (lic) lic.textContent = (i + 1) + '/' + li.length;
    }, 5000);
  }

  function wideoDozwolone() {
    var c = navigator.connection;
    if (reduced || window.innerWidth < 768) return false;
    if (c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || ''))) return false;
    return true;
  }
  function initWideo() {
    doc.querySelectorAll('.sek-tlo-wideo[data-src]').forEach(function (v) {
      if (!wideoDozwolone() || !v.dataset.src) return;
      v.src = v.dataset.src; v.removeAttribute('data-src');
      var p = v.play(); if (p && p.catch) p.catch(function () { });
      var btn = v.closest('section').querySelector('.wideo-pauza');
      if (btn) {
        btn.hidden = false;
        btn.onclick = function () {
          var pauza = !v.paused;
          if (pauza) v.pause(); else v.play();
          btn.setAttribute('aria-pressed', String(pauza));
          btn.setAttribute('aria-label', pauza ? btn.dataset.lWznow : btn.dataset.lPauza);
        };
      }
    });
  }

  /* ---------- portfolio: mozaika ze stronami ----------
   * Każde zdjęcie zachowuje swoją orientację (pion/poziom). Zdjęcia układają się
   * w równe wiersze (jak w albumie), a wiersze w strony mieszczące się na jednym
   * ekranie. Kolejne strony: strzałki, klawiatura albo przesunięcie palcem. */
  var moz = { strona: 0 };
  function kafleWszystkie(m) { if (!m._kafle) m._kafle = [].slice.call(m.querySelectorAll('.kafel')); return m._kafle; }
  function ulozMozaike() {
    var sek = doc.getElementById('portfolio'); if (!sek || sek.hidden) return;
    var okno = sek.querySelector('.mozaika-okno'), m = sek.querySelector('.mozaika'), ster = sek.querySelector('.mozaika-ster');
    if (!okno || !m) return;
    var wszystkie = kafleWszystkie(m), kafle = wszystkie.filter(function (k) { return !k.hidden; });
    m.classList.remove('mozaika--js'); m.style.height = '';
    var W = okno.clientWidth, H = okno.clientHeight;
    if (W < 120 || H < 140 || !kafle.length) {
      /* za mało miejsca (np. telefon poziomo) — zwykła siatka bez stron */
      m.innerHTML = ''; wszystkie.forEach(function (k) { k.style.width = k.style.height = ''; m.appendChild(k); });
      if (ster) ster.hidden = true; return;
    }
    var maly = W < 600, g = maly ? 6 : 10;
    var nWierszy = maly ? (H > 560 ? 4 : 3) : (H > 820 ? 3 : 2);
    var t = Math.max(maly ? 70 : 110, ((H - g * (nWierszy - 1)) / nWierszy) * 0.94);
    var wiersze = [], wiersz = [], suma = 0;
    function zamknij(items, sum, ostatni) {
      var h = (W - g * (items.length - 1)) / sum;
      if (ostatni) h = Math.min(h, t);
      wiersze.push({ items: items, h: Math.min(h, H) });
    }
    kafle.forEach(function (k) {
      var ar = +k.dataset.ar || 1.5;
      if (wiersz.length && (suma + ar) * t + g * wiersz.length >= W) {
        var hZ = (W - g * wiersz.length) / (suma + ar), hBez = (W - g * (wiersz.length - 1)) / suma;
        if (Math.abs(hBez - t) < Math.abs(hZ - t)) { zamknij(wiersz, suma); wiersz = [k]; suma = ar; return; }
        wiersz.push(k); suma += ar; zamknij(wiersz, suma); wiersz = []; suma = 0; return;
      }
      wiersz.push(k); suma += ar;
    });
    if (wiersz.length) zamknij(wiersz, suma, true);
    var strony = [], biez = [], uzyte = 0;
    wiersze.forEach(function (r) {
      var potrzeba = r.h + (biez.length ? g : 0);
      if (biez.length && uzyte + potrzeba > H + 0.5) { strony.push(biez); biez = []; uzyte = 0; potrzeba = r.h; }
      biez.push(r); uzyte += potrzeba;
    });
    if (biez.length) strony.push(biez);
    var frag = doc.createDocumentFragment();
    strony.forEach(function (st, i) {
      var se = doc.createElement('div'); se.className = 'moz-strona'; se.style.gap = g + 'px';
      se.setAttribute('role', 'group'); se.setAttribute('aria-label', Rn.ui({ lang: site.lang }, 'strona') + ' ' + (i + 1) + ' / ' + strony.length);
      st.forEach(function (r) {
        var we = doc.createElement('div'); we.className = 'moz-wiersz'; we.style.gap = g + 'px';
        var h = Math.floor(r.h);
        r.items.forEach(function (k) { k.style.height = h + 'px'; k.style.width = Math.floor((+k.dataset.ar || 1.5) * r.h) + 'px'; we.appendChild(k); });
        se.appendChild(we);
      });
      frag.appendChild(se);
    });
    m.innerHTML = ''; m.appendChild(frag); m.classList.add('mozaika--js');
    m._strony = strony.length;
    moz.strona = Math.min(moz.strona, strony.length - 1);
    m.scrollLeft = moz.strona * m.clientWidth;
    if (ster) ster.hidden = strony.length < 2;
    licznikMoz(m);
    if (!m._nasluch) {
      m._nasluch = true;
      var tm;
      m.addEventListener('scroll', function () { clearTimeout(tm); tm = setTimeout(function () { moz.strona = Math.round(m.scrollLeft / Math.max(1, m.clientWidth)); licznikMoz(m); }, 60); }, { passive: true });
    }
  }
  function licznikMoz(m) {
    var sek = m.closest('section'), l = sek.querySelector('.moz-licznik'), n = m._strony || 1;
    if (l) l.textContent = (moz.strona + 1) + ' / ' + n;
    sek.querySelectorAll('.moz-btn').forEach(function (b) { b.disabled = (+b.dataset.kier < 0 && moz.strona <= 0) || (+b.dataset.kier > 0 && moz.strona >= n - 1); });
  }
  function stronaMoz(kier) {
    var m = doc.querySelector('#portfolio .mozaika--js'); if (!m) return;
    moz.strona = Math.max(0, Math.min((m._strony || 1) - 1, moz.strona + kier));
    m.scrollTo({ left: moz.strona * m.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    licznikMoz(m);
  }
  function filtruj(btn) {
    var sek = btn.closest('section'), kat = btn.dataset.kat, m = sek.querySelector('.mozaika');
    sek.querySelectorAll('.filtr').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
    kafleWszystkie(m).forEach(function (k) { k.hidden = !(kat === '*' || k.dataset.kat === kat); });
    moz.strona = 0; ulozMozaike();
  }

  /* ---------- dopasowanie sekcji do wysokości ekranu ----------
   * Jeśli treść sekcji (np. dłuższy tekst wpisany w panelu) nie mieści się na
   * jednym ekranie, zostaje proporcjonalnie zmniejszona — najwyżej do 85%,
   * żeby tekst pozostał czytelny. Przy bardzo niskich oknach sekcja po prostu rośnie. */
  var sonda;
  function wysEkranu() {
    if (!sonda) { sonda = doc.createElement('div'); sonda.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:1px;height:var(--wys)'; doc.body.appendChild(sonda); }
    return sonda.offsetHeight;
  }
  function dopasuj() {
    var dostepne = wysEkranu(); if (dostepne < 360) dostepne = 0;
    var cele = [];
    doc.querySelectorAll('main > section.sek:not([hidden]):not(.sek-hero):not(.sek--portfolio):not(.sek--historia)').forEach(function (s) {
      var inn = s.querySelector(':scope > .sek-in'); if (inn) cele.push({ el: s, inn: inn, glowa: null });
    });
    doc.querySelectorAll('.rozdzial').forEach(function (r) { cele.push({ el: r, inn: r.querySelector('.rozdzial-in'), glowa: r.querySelector('.rozdzial-glowa'), rozdzial: true }); });
    cele.forEach(function (c) {
      if (!c.inn) return;
      c.inn.style.zoom = '';
      if (!dostepne) return;
      var cs = getComputedStyle(c.el), pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      var extra = c.glowa ? c.glowa.getBoundingClientRect().height + 40 : 0;
      var potrzeba = c.inn.getBoundingClientRect().height + pad + extra;
      if (potrzeba <= dostepne) return;
      var z = Math.max(0.85, (dostepne - extra - pad) / (potrzeba - extra - pad));
      c.inn.style.zoom = z.toFixed(3);
      var po = c.inn.getBoundingClientRect().height + pad + extra;
      if (po > dostepne && z > 0.85) c.inn.style.zoom = Math.max(0.85, z * (dostepne - extra - pad) / (po - extra - pad)).toFixed(3);
    });
  }

  /* ---------- lightbox ---------- */
  var lb = { el: null, lista: [], i: 0, wrocDo: null };
  function lbPokaz() {
    var s = lb.lista[lb.i], img = s.querySelector('img'), cap = s.querySelector('figcaption');
    var lim = doc.getElementById('lb-img');
    lim.src = img.getAttribute('src'); lim.alt = img.alt; lim.removeAttribute('width'); lim.removeAttribute('height');
    if (img.getAttribute('srcset')) { lim.srcset = img.getAttribute('srcset'); lim.sizes = '100vw'; } else { lim.removeAttribute('srcset'); }
    doc.getElementById('lb-licznik').textContent = (lb.i + 1) + ' / ' + lb.lista.length;
    doc.getElementById('lb-podpis').textContent = cap ? cap.textContent : '';
  }
  function lbOtworz(slajd) {
    lb.el = doc.getElementById('lightbox');
    var m = slajd.closest('.mozaika');
    lb.lista = kafleWszystkie(m).filter(function (s) { return !s.hidden && s.querySelector('.slajd-pow'); });
    lb.i = Math.max(0, lb.lista.indexOf(slajd)); lb.wrocDo = doc.activeElement;
    lbPokaz(); lb.el.showModal(); lb.el.querySelector('.zamknij').focus();
  }
  function lbKrok(d) { lb.i = (lb.i + d + lb.lista.length) % lb.lista.length; lbPokaz(); }
  (function () {
    var el = doc.getElementById('lightbox'); if (!el) return;
    el.querySelector('.lb-prev').addEventListener('click', function () { lbKrok(-1); });
    el.querySelector('.lb-next').addEventListener('click', function () { lbKrok(1); });
    el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') lbKrok(1); if (e.key === 'ArrowLeft') lbKrok(-1); });
    el.addEventListener('close', function () { if (lb.wrocDo) lb.wrocDo.focus(); });
    el.addEventListener('click', function (e) { if (e.target === el || e.target.classList.contains('lb-in')) el.close(); });
    var x0 = null;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) lbKrok(dx < 0 ? 1 : -1); x0 = null; });
  })();

  /* ---------- okno „czytaj więcej” ---------- */
  var okno = doc.getElementById('okno'), oknoWroc = null;
  function otworzOkno(btn) {
    var src = doc.getElementById(btn.dataset.wiecej); if (!src || !okno) return;
    var sek = btn.closest('section, li, article');
    var h = btn.dataset.tytul || (sek && sek.querySelector('h2, h3') ? sek.querySelector('h2, h3').textContent : '');
    doc.getElementById('okno-tytul').textContent = h;
    doc.getElementById('okno-tresc').innerHTML = src.innerHTML;
    oknoWroc = btn; okno.showModal(); okno.querySelector('.zamknij').focus();
  }
  if (okno) {
    okno.addEventListener('close', function () { if (oknoWroc) oknoWroc.focus(); });
    okno.addEventListener('click', function (e) { if (e.target === okno) okno.close(); });
  }

  /* ---------- Instagram ---------- */
  function initInstagram() {
    var ul = doc.querySelector('.ig'); if (!ul) return;
    var sek = ul.closest('section'), kompakt = function (tak) { sek.classList.toggle('sek--kompakt', tak); };
    kompakt(!ul.children.length);
    if (ul.dataset.igTryb !== 'auto' || site.demo) return;
    fetch(API + '/instagram?n=' + (ul.dataset.igLiczba || 6)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.posty || !d.posty.length) return;
      kompakt(false);
      ul.innerHTML = d.posty.map(function (p) {
        return '<li><a href="' + Rn.esc(p.url) + '" target="_blank" rel="noopener"><img src="' + Rn.esc(p.img) + '" alt="' + Rn.esc(p.alt || 'Zdjęcie z Instagrama Anny Niedobitek') + '" width="640" height="640" loading="lazy" decoding="async" onerror="this.classList.add(\'img-blad\')"></a></li>';
      }).join('');
    }).catch(function () { });
  }

  /* ---------- mapa (wczytywana po kliknięciu) ---------- */
  function pokazMape(btn) {
    var q = btn.dataset.mapa || 'Zgorzelec';
    doc.getElementById('okno-tytul').textContent = btn.textContent;
    doc.getElementById('okno-tresc').innerHTML = '<div class="okno-mapa"><iframe title="Mapa Google — obszar działania: ' + Rn.esc(q) + '" src="https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=8&output=embed" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>';
    oknoWroc = btn; okno.showModal(); okno.querySelector('.zamknij').focus();
  }

  /* ---------- formularz kontaktowy w osobnym oknie ---------- */
  var formWroc = null;
  function otworzFormularz(btn) {
    var d = doc.getElementById('kontakt-form'); if (!d || !d.showModal) return;
    formWroc = btn; d.showModal();
    var p = d.querySelector('#f-imie'); if (p) p.focus();
    if (!d._nasluch) {
      d._nasluch = true;
      d.addEventListener('close', function () { if (formWroc) formWroc.focus(); });
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    }
  }

  /* ---------- wideo w portfolio ---------- */
  function odtworzWideo(btn) {
    var u = btn.dataset.wideo, id = A.ytId(u), fig = btn.closest('.kafel'), el;
    if (id) {
      el = doc.createElement('iframe');
      el.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      el.title = (fig.querySelector('figcaption') || {}).textContent || 'Wideo';
      el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; el.allowFullscreen = true;
    } else {
      el = doc.createElement('video'); el.src = u; el.controls = true; el.autoplay = true; el.playsInline = true;
    }
    btn.replaceWith(el); el.focus && el.focus();
  }

  /* ---------- formularz kontaktowy ---------- */
  var t0 = Date.now();
  var KOM = {
    wym: 'Proszę uzupełnić to pole.', email: 'Proszę podać poprawny adres e-mail, np. jan@poczta.pl.',
    tel: 'Numer telefonu może zawierać tylko cyfry, spacje, myślniki i znak +.', krotko: 'Proszę wpisać co najmniej 2 znaki.',
    zgoda: 'Do wysłania wiadomości potrzebna jest zgoda.', zaznacz: 'Proszę zaznaczyć to pole.'
  };
  function blad(pole, msg) {
    var b = doc.getElementById(pole.id + '-b');
    pole.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) pole.setAttribute('aria-describedby', pole.id + '-b'); else pole.removeAttribute('aria-describedby');
    if (b) { b.textContent = msg || ''; b.hidden = !msg; }
    return !msg;
  }
  /* walidacja pól zdefiniowanych w panelu (typ z atrybutu data-typ) */
  function bladPola(el) {
    var typ = el.dataset.typ, v = el.type === 'checkbox' ? (el.checked ? 'tak' : '') : el.value.trim();
    if (!v) return el.required ? (typ === 'tak' ? KOM.zaznacz : KOM.wym) : '';
    if (typ === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return KOM.email;
    if (typ === 'telefon' && !/^[+\d][\d\s-]{6,}$/.test(v)) return KOM.tel;
    if (el.name === 'imie' && v.length < 2) return KOM.krotko;
    return '';
  }
  function waliduj(f) {
    var ok = [];
    f.querySelectorAll('[data-typ]').forEach(function (el) { ok.push(blad(el, bladPola(el))); });
    ok.push(blad(f.elements.zgoda, f.elements.zgoda.checked ? '' : KOM.zgoda));
    return ok.every(Boolean);
  }
  function wyslij(f) {
    var st = f.querySelector('.form-status'), btn = f.querySelector('[type=submit]');
    st.className = 'form-status'; st.textContent = '';
    if (!waliduj(f)) {
      var pierwszy = f.querySelector('[aria-invalid="true"]'); if (pierwszy) pierwszy.focus();
      st.className = 'form-status err'; st.textContent = 'Proszę poprawić zaznaczone pola.';
      return;
    }
    var pola = {};
    f.querySelectorAll('[data-typ]').forEach(function (el) { pola[el.name] = el.type === 'checkbox' ? (el.checked ? 'tak' : '') : el.value.trim(); });
    var dane = { pola: pola, zgoda: f.elements.zgoda.checked, www: f.elements.www.value, t: Date.now() - t0 };
    if (site.demo) { st.className = 'form-status err'; st.textContent = 'Tryb demonstracyjny — formularz zadziała po wdrożeniu strony na serwer. Proszę napisać przez Messengera.'; return; }
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); st.textContent = 'Wysyłanie…';
    fetch(API + '/kontakt', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ANF': '1' }, body: JSON.stringify(dane) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { f.reset(); st.className = 'form-status ok'; st.textContent = 'Dziękuję za wiadomość! Odpowiem najszybciej, jak to możliwe.'; }
        else { st.className = 'form-status err'; st.textContent = (r.j && r.j.blad) || 'Nie udało się wysłać wiadomości. Proszę spróbować ponownie lub napisać przez Messengera.'; }
      })
      .catch(function () { st.className = 'form-status err'; st.textContent = 'Brak połączenia. Proszę spróbować ponownie lub napisać przez Messengera.'; })
      .then(function () { btn.disabled = false; btn.removeAttribute('aria-busy'); });
  }

  /* ---------- menu na telefonie ---------- */
  function menuOtworz(tak) {
    var b = doc.querySelector('.burger'), l = doc.querySelector('.menu-lista'); if (!b || !l) return;
    b.setAttribute('aria-expanded', String(tak)); b.setAttribute('aria-label', tak ? 'Zamknij menu' : 'Otwórz menu');
    l.classList.toggle('otwarte', tak);
  }

  /* ---------- panel administratora (ładowany na żądanie) ---------- */
  var cmsLaduje = null;
  function zaladujPanel() {
    if (A.cms) return Promise.resolve(A.cms);
    if (cmsLaduje) return cmsLaduje;
    cmsLaduje = new Promise(function (ok, nie) {
      var v = (doc.querySelector('script[src*="site.js"]') || {}).src || '';
      var ver = (v.split('?')[1] || '');
      var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/css/cms.css?' + ver; doc.head.appendChild(css);
      var s = doc.createElement('script'); s.src = 'assets/js/cms.js?' + ver;
      s.onload = function () { ok(A.cms); }; s.onerror = function () { cmsLaduje = null; nie(new Error('Nie udało się wczytać panelu')); };
      doc.body.appendChild(s);
    });
    return cmsLaduje;
  }
  function otworzPanel(skad) {
    var k = doc.getElementById('klodka');
    k && k.setAttribute('aria-busy', 'true');
    zaladujPanel().then(function (cms) { k && k.removeAttribute('aria-busy'); cms.start(skad || k); })
      .catch(function (e) { k && k.removeAttribute('aria-busy'); alert(e.message); });
  }
  site.otworzPanel = otworzPanel;
  site.oznaczZalogowany = function (tak) {
    var k = doc.getElementById('klodka'); if (!k) return;
    k.classList.toggle('zalogowany', !!tak);
    k.setAttribute('aria-label', tak ? 'Otwórz panel administratora' : 'Panel administratora — zaloguj');
  };
  if (/(^|;\s*)anf_zalogowany=1/.test(doc.cookie)) site.oznaczZalogowany(true);

  /* Pokaż sekcję na stronie (używane przez panel) */
  site.pokaz = function (k) {
    var el = doc.getElementById(Rn.idSekcji(k)) || doc.querySelector('[data-sekcja="' + k + '"]');
    if (!el || el.hidden) return false;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.classList.remove('podswietl'); void el.offsetWidth; el.classList.add('podswietl');
    setTimeout(function () { el.classList.remove('podswietl'); }, 2800);
    return true;
  };

  /* ---------- delegacja zdarzeń (działa po każdym przerysowaniu) ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t) {
      var lista = doc.querySelector('.menu-lista.otwarte'); if (lista && !e.target.closest('.menu')) menuOtworz(false);
      return;
    }
    if (t.matches('[data-wiecej]')) { otworzOkno(t); return; }
    if (t.matches('[data-zamknij]')) { t.closest('dialog').close(); return; }
    if (t.matches('.filtr')) { filtruj(t); return; }
    if (t.matches('.moz-btn')) { stronaMoz(+t.dataset.kier); return; }
    if (t.matches('.slajd-pow')) { lbOtworz(t.closest('.kafel')); return; }
    if (t.matches('.slajd-wideo')) { odtworzWideo(t); return; }
    if (t.matches('.link-mapa')) { pokazMape(t); return; }
    if (t.matches('.form-otworz')) { otworzFormularz(t); return; }
    if (t.matches('.burger')) { menuOtworz(t.getAttribute('aria-expanded') !== 'true'); return; }
    if (t.matches('#klodka') || t.matches('[data-panel]')) { e.preventDefault(); otworzPanel(t); return; }
    if (t.matches('[data-jezyk]')) { try { localStorage.setItem('anf-lang', t.dataset.jezyk); } catch (er) { } return; }
    if (t.closest('.menu-lista') && t.matches('a')) menuOtworz(false);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') menuOtworz(false);
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && e.target.closest && e.target.closest('#portfolio .mozaika-okno, #portfolio .mozaika-ster')) { e.preventDefault(); stronaMoz(e.key === 'ArrowRight' ? 1 : -1); }
  });
  doc.addEventListener('submit', function (e) { if (e.target.id === 'formularz') { e.preventDefault(); wyslij(e.target); } });
  doc.addEventListener('input', function (e) {
    var f = e.target.form; if (f && f.id === 'formularz' && e.target.getAttribute('aria-invalid') === 'true') waliduj(f);
  });
  var tRes, szerPoprz = window.innerWidth, wysPoprz = window.innerHeight;
  window.addEventListener('resize', function () {
    ustawPasek();
    clearTimeout(tRes);
    tRes = setTimeout(function () {
      /* na telefonie pasek adresu zmienia wysokość okna przy przewijaniu — ignorujemy małe zmiany */
      if (window.innerWidth === szerPoprz && Math.abs(window.innerHeight - wysPoprz) < 90) return;
      szerPoprz = window.innerWidth; wysPoprz = window.innerHeight;
      ulozMozaike(); dopasuj();
    }, 160);
  }, { passive: true });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { dopasuj(); ulozMozaike(); });

  function initDynamiczne() {
    ustawPasek(); initNaglowek(); initKropkiIMenu(); initAnimacje(); initPasek(); initWideo(); initInstagram();
    moz.strona = 0; ulozMozaike(); dopasuj();
  }

  /* ---------- start ---------- */
  if (!reduced) html.classList.add('plynnie');
  if (!aktualnyHtml(state)) renderuj(state, { bezInit: true });
  initDynamiczne();
  wczytaj().then(function (s) {
    if (!s) return;
    if (site.hash(s) !== site.hash(site.state) || !aktualnyHtml(s)) renderuj(s);
  });
  if (location.hash === '#panel') otworzPanel();
})();
