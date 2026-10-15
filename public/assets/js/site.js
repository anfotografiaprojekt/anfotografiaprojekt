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
  var KLUCZE = ['start', 'oMnie', 'historia', 'aktualnosci', 'kadra', 'portfolio', 'instagram', 'kontakt', 'nav', 'kropki', 'jezyki', 'pasek', 'stopka'];
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
    KLUCZE.forEach(function (k) { zamien(k, out[k]); });
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

  /* ---------- slider portfolio ---------- */
  function slajdyWidoczne(tor) { return [].slice.call(tor.querySelectorAll('.slajd:not([hidden])')); }
  function biezacy(tor) {
    var sl = slajdyWidoczne(tor), srodek = tor.scrollLeft + tor.clientWidth / 2, best = 0, d = Infinity;
    sl.forEach(function (s, i) { var c = s.offsetLeft + s.offsetWidth / 2, x = Math.abs(c - srodek); if (x < d) { d = x; best = i; } });
    return best;
  }
  function doSlajdu(tor, i) {
    var sl = slajdyWidoczne(tor); if (!sl.length) return;
    i = (i + sl.length) % sl.length;
    var s = sl[i];
    tor.scrollTo({ left: s.offsetLeft - (tor.clientWidth - s.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }
  function licznik(slider) {
    var tor = slider.querySelector('.slider-tor'), sl = slajdyWidoczne(tor), l = slider.querySelector('.slider-licznik');
    if (l) l.textContent = (sl.length ? biezacy(tor) + 1 : 0) + ' / ' + sl.length;
  }
  function initSlider() {
    doc.querySelectorAll('.slider').forEach(function (slider) {
      var tor = slider.querySelector('.slider-tor'), t;
      tor.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(function () { licznik(slider); }, 80); }, { passive: true });
      tor.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); doSlajdu(tor, biezacy(tor) + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); doSlajdu(tor, biezacy(tor) - 1); }
      });
      licznik(slider);
    });
  }
  function filtruj(btn) {
    var sek = btn.closest('section'), kat = btn.dataset.kat, tor = sek.querySelector('.slider-tor');
    sek.querySelectorAll('.filtr').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
    var sl = tor.querySelectorAll('.slajd'), n = 0;
    sl.forEach(function (s) { s.hidden = !(kat === '*' || s.dataset.kat === kat); });
    var wid = slajdyWidoczne(tor);
    wid.forEach(function (s, i) { s.setAttribute('aria-label', (i + 1) + ' ' + Rn.ui({ lang: site.lang }, 'z') + ' ' + wid.length); n++; });
    tor.scrollLeft = 0;
    licznik(sek.querySelector('.slider'));
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
    lb.lista = slajdyWidoczne(slajd.parentNode).filter(function (s) { return s.querySelector('.slajd-pow'); });
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
  function pokazMape(box) {
    var q = box.dataset.mapa || 'Zgorzelec';
    box.innerHTML = '<iframe title="Mapa Google — obszar działania: ' + Rn.esc(q) + '" src="https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=8&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }

  /* ---------- wideo w portfolio ---------- */
  function odtworzWideo(btn) {
    var u = btn.dataset.wideo, id = A.ytId(u), fig = btn.closest('.slajd'), el;
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
    imie: 'Proszę podać imię i nazwisko.', email: 'Proszę podać poprawny adres e-mail, np. jan@poczta.pl.',
    tel: 'Numer telefonu może zawierać tylko cyfry, spacje, myślniki i znak +.',
    wiad: 'Proszę wpisać wiadomość (co najmniej 10 znaków).', zgoda: 'Do wysłania wiadomości potrzebna jest zgoda.'
  };
  function blad(pole, msg) {
    var b = doc.getElementById(pole.id + '-b');
    pole.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) pole.setAttribute('aria-describedby', pole.id + '-b'); else pole.removeAttribute('aria-describedby');
    if (b) { b.textContent = msg || ''; b.hidden = !msg; }
    return !msg;
  }
  function waliduj(f) {
    var ok = [], el = f.elements;
    ok.push(blad(el.imie, el.imie.value.trim().length < 2 ? KOM.imie : ''));
    ok.push(blad(el.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim()) ? '' : KOM.email));
    ok.push(blad(el.telefon, !el.telefon.value.trim() || /^[+\d][\d\s-]{6,}$/.test(el.telefon.value.trim()) ? '' : KOM.tel));
    ok.push(blad(el.wiadomosc, el.wiadomosc.value.trim().length < 10 ? KOM.wiad : ''));
    ok.push(blad(el.zgoda, el.zgoda.checked ? '' : KOM.zgoda));
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
    var el = f.elements, dane = {
      imie: el.imie.value.trim(), email: el.email.value.trim(), telefon: el.telefon.value.trim(), termin: el.termin.value.trim(),
      rodzaj: el.rodzaj.value, wiadomosc: el.wiadomosc.value.trim(), zgoda: el.zgoda.checked, www: el.www.value, t: Date.now() - t0
    };
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
    if (t.matches('.slider-btn')) { var tor = t.closest('.slider').querySelector('.slider-tor'); doSlajdu(tor, biezacy(tor) + (+t.dataset.kier)); return; }
    if (t.matches('.slajd-pow')) { lbOtworz(t.closest('.slajd')); return; }
    if (t.matches('.slajd-wideo')) { odtworzWideo(t); return; }
    if (t.matches('.mapa-btn')) { pokazMape(t.closest('.mapa')); return; }
    if (t.matches('.burger')) { menuOtworz(t.getAttribute('aria-expanded') !== 'true'); return; }
    if (t.matches('#klodka') || t.matches('[data-panel]')) { e.preventDefault(); otworzPanel(t); return; }
    if (t.matches('[data-jezyk]')) { try { localStorage.setItem('anf-lang', t.dataset.jezyk); } catch (er) { } return; }
    if (t.closest('.menu-lista') && t.matches('a')) menuOtworz(false);
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') menuOtworz(false); });
  doc.addEventListener('submit', function (e) { if (e.target.id === 'formularz') { e.preventDefault(); wyslij(e.target); } });
  doc.addEventListener('input', function (e) {
    var f = e.target.form; if (f && f.id === 'formularz' && e.target.getAttribute('aria-invalid') === 'true') waliduj(f);
  });
  window.addEventListener('resize', function () { ustawPasek(); }, { passive: true });

  function initDynamiczne() {
    ustawPasek(); initNaglowek(); initKropkiIMenu(); initAnimacje(); initPasek(); initSlider(); initWideo(); initInstagram();
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
