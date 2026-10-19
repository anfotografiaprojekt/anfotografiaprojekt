/*!
 * Anna Niedobitek Fotografia — PANEL ADMINISTRATORA (CMS)
 * ---------------------------------------------------------------
 * Ładowany na żądanie (kłódka w lewym dolnym rogu / link w stopce / adres #panel).
 * Zapis: Cloudflare Pages Functions (/api/…), dane w KV (powiązanie TRESCI).
 * Gdy API nie odpowiada → tryb demonstracyjny (IndexedDB w tej przeglądarce).
 *
 * Kolory panelu = kolory marki:
 *   kolor główny #7A5240 · akcent #8A5A44 · dekor #B88A6E · tło #FAF7F2 · tło 2 #F2EBE3 · tekst #2B2622
 */
(function () {
  'use strict';
  var A = window.ANF, Rn = A.render, site = A.site, doc = document, API = site.api;
  var esc = Rn.esc, t = Rn.t;
  var CMS = A.cms = {};

  /* ================= STAN PANELU ================= */
  var P = {
    stan: Rn.clone(site.state), demo: !!site.demo, zalogowany: false, otwarty: false,
    strona: 'pulpit', szkic: null, szkicStrona: null, filtr: 'wszystkie', root: null, wrocDo: null
  };
  function dzis() { return Rn.dzis(); }
  function plusDni(iso, n) { var p = iso.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return d.toISOString().slice(0, 10); }
  function roznicaDni(a, b) { var pa = a.split('-'), pb = b.split('-'); return Math.round((Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / 864e5); }
  function krotkaData(iso) { if (!iso) return '—'; var p = iso.split('-'); return (+p[2]) + '.' + p[1] + '.' + p[0]; }
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function getP(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setP(o, path, v) {
    var ks = path.split('.'), last = ks.pop(), cur = o;
    ks.forEach(function (k) { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; });
    cur[last] = v;
  }
  function jezyki() { return P.stan.ustawienia.jezyki || [{ kod: 'pl', nazwa: 'Polski', wl: true, staly: true }]; }

  /* ================= API ================= */
  function api(metoda, sciezka, body) {
    var op = { method: metoda, credentials: 'same-origin', headers: { 'X-CMS': '1', Accept: 'application/json' } };
    if (body !== undefined) { op.headers['Content-Type'] = 'application/json'; op.body = JSON.stringify(body); }
    return fetch(API + sciezka, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j = j || {}; j._status = r.status; j._ok = r.ok; return j; });
    });
  }

  /* ================= ZAPIS (automatyczny) ================= */
  var zapisTimer = null, zapisTrwa = false, zapisPonow = false;
  function wskaznik(stan, tekst) {
    var w = P.root && P.root.querySelector('.cmsp-zapis'); if (!w) return;
    w.className = 'cmsp-zapis cmsp-zapis--' + stan;
    w.querySelector('.cmsp-zapis-tekst').textContent = tekst;
  }
  function zastosuj(op) {
    // natychmiast na stronie + zapis w tle
    site.renderuj(Rn.clone(P.stan));
    odswiezLiczniki();
    zaplanujZapis();
    // „Zapisano” pokazujemy dopiero, gdy serwer potwierdzi zapis (zapiszTeraz)
    if (op && op.toast) P.toastPoZapisie = op.toast;
  }
  function alarmZapisu(tekst) {
    var a = P.root && P.root.querySelector('.cmsp-alarm');
    if (!tekst) { if (a) a.remove(); return; }
    if (!a) {
      a = doc.createElement('div'); a.className = 'cmsp-alarm'; a.setAttribute('role', 'alert');
      (P.root.querySelector('.cmsp-glowna') || P.root).prepend(a);
    }
    a.innerHTML = '<strong>Zmiany NIE zostały zapisane na serwerze.</strong> <span></span> ' +
      '<span class="cmsp-alarm-info">Strona w tej karcie pokazuje wersję roboczą — po odświeżeniu zobaczysz ostatnią zapisaną.</span>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--glowny" data-akcja="ponow-zapis">Spróbuj ponownie</button>';
    a.querySelector('span').textContent = tekst;
  }
  function zaplanujZapis() {
    wskaznik('trwa', 'Zapisywanie…');
    clearTimeout(zapisTimer); zapisTimer = setTimeout(zapiszTeraz, 450);
  }
  function godzina() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function zapiszTeraz() {
    if (zapisTrwa) { zapisPonow = true; return; }
    zapisTrwa = true;
    var dane = Rn.clone(P.stan);
    var obietnica = P.demo ? site.idb.set('stan', dane).then(function () { return { _ok: true }; })
      : api('PUT', '/tresci', { dane: dane });
    obietnica.then(function (r) {
      if (r._ok) {
        wskaznik('ok', (P.demo ? 'Zapisano lokalnie ' : 'Zapisano ') + godzina()); alarmZapisu('');
        /* Cloudflare KV rozsyła nową wersję po serwerach do ok. minuty — do tego czasu ta przeglądarka
         * pokazuje stronę z własnej kopii, więc w nowej karcie od razu widać zapisane zmiany */
        if (!P.demo && r.zapisano) { try { localStorage.setItem('anf-zapis', JSON.stringify({ z: r.zapisano, d: dane })); } catch (e) { } }
        if (P.toastPoZapisie) { toast(P.toastPoZapisie); P.toastPoZapisie = null; }
        return;
      }
      if (r._status === 401) { wskaznik('blad', 'Sesja wygasła'); pokazLogowanie(function () { zaplanujZapis(); }, 'Sesja wygasła — proszę zalogować się ponownie, zmiany zostaną zapisane.'); return; }
      wskaznik('blad', 'Błąd zapisu'); P.toastPoZapisie = null;
      alarmZapisu(r.blad || 'Serwer odpowiedział błędem ' + r._status + '.'); toast('Nie udało się zapisać zmian.', 'blad');
    }).catch(function () { wskaznik('blad', 'Brak połączenia'); P.toastPoZapisie = null; alarmZapisu('Brak połączenia z serwerem.'); toast('Nie udało się zapisać zmian.', 'blad'); })
      .then(function () { zapisTrwa = false; if (zapisPonow) { zapisPonow = false; zapiszTeraz(); } });
  }

  /* ================= TOAST ================= */
  function toast(msg, typ) {
    var box = P.root && P.root.querySelector('.cmsp-toasty'); if (!box) return;
    var el = doc.createElement('div'); el.className = 'cmsp-toast' + (typ ? ' cmsp-toast--' + typ : ''); el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () { el.classList.add('cmsp-toast--znika'); }, 3200);
    setTimeout(function () { el.remove(); }, 3700);
  }

  /* ================= LOGOWANIE ================= */
  function pokazLogowanie(poZalogowaniu, info) {
    var stare = doc.getElementById('cmsp-login'); if (stare) stare.remove();
    var wrap = doc.createElement('div');
    wrap.innerHTML = '<div class="cmsp-tlo-modal" id="cmsp-login"><div class="cmsp-login" role="dialog" aria-modal="true" aria-labelledby="cmsp-login-t">' +
      '<div class="cmsp-login-logo" aria-hidden="true">AN</div>' +
      '<h2 id="cmsp-login-t">Panel administratora</h2><p class="cmsp-login-pod">' + esc(info || 'Anna Niedobitek Fotografia — proszę podać hasło.') + '</p>' +
      '<form novalidate><label for="cmsp-haslo">Hasło</label>' +
      '<div class="cmsp-haslo-wrap"><input id="cmsp-haslo" type="password" autocomplete="current-password" required>' +
      '<button type="button" class="cmsp-oko" aria-label="Pokaż hasło" aria-pressed="false">👁</button></div>' +
      '<p class="cmsp-login-blad" role="alert" hidden></p>' +
      '<div class="cmsp-login-akcje"><button type="button" class="cmsp-btn cmsp-btn--jasny" data-anuluj>Anuluj</button><button type="submit" class="cmsp-btn cmsp-btn--glowny">Zaloguj</button></div></form></div></div>';
    var el = wrap.firstChild; doc.body.appendChild(el);
    var inp = el.querySelector('input'), bl = el.querySelector('.cmsp-login-blad'), form = el.querySelector('form');
    var wroc = doc.activeElement;
    function zamknij() { el.remove(); if (wroc && wroc.focus) wroc.focus(); }
    el.querySelector('[data-anuluj]').onclick = zamknij;
    el.querySelector('.cmsp-oko').onclick = function () { var p = inp.type === 'password'; inp.type = p ? 'text' : 'password'; this.setAttribute('aria-pressed', String(p)); this.setAttribute('aria-label', p ? 'Ukryj hasło' : 'Pokaż hasło'); };
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); zamknij(); } pulapka(e, el); });
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!inp.value) { bl.textContent = 'Proszę wpisać hasło.'; bl.hidden = false; inp.focus(); return; }
      var b = form.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Sprawdzanie…';
      api('POST', '/login', { haslo: inp.value }).then(function (r) {
        if (r._ok) { P.zalogowany = true; site.oznaczZalogowany(true); el.remove(); poZalogowaniu && poZalogowaniu(); return; }
        bl.hidden = false;
        if (r._status === 429) bl.textContent = 'Zbyt wiele nieudanych prób. Proszę spróbować ponownie za ' + (r.minut || 15) + ' min.';
        else if (r._status === 401) bl.textContent = 'Nieprawidłowe hasło.' + (r.pozostalo != null ? ' Pozostało prób: ' + r.pozostalo + '.' : '');
        else if (r._status === 503) bl.textContent = r.blad || 'Panel nie jest jeszcze skonfigurowany na serwerze.';
        else bl.textContent = 'Nie udało się zalogować (' + r._status + ').';
        inp.select(); inp.focus();
      }).catch(function () { bl.hidden = false; bl.textContent = 'Brak połączenia z serwerem.'; })
        .then(function () { b.disabled = false; b.textContent = 'Zaloguj'; });
    };
    inp.focus();
  }

  CMS.start = function (zrodlo) {
    P.wrocDo = zrodlo || doc.activeElement;
    if (P.otwarty) return;
    if (P.demo) { otworzPanel(); return; }
    if (P.zalogowany) { otworzPanel(); return; }
    api('GET', '/sesja').then(function (r) {
      if (r._ok && r.zalogowany) { P.zalogowany = true; site.oznaczZalogowany(true); otworzPanel(); }
      else { site.oznaczZalogowany(false); pokazLogowanie(otworzPanel); }
    }).catch(function () { P.demo = site.demo = true; otworzPanel(); });
  };

  /* ================= PUŁAPKA FOKUSU ================= */
  function pulapka(e, kontener) {
    if (e.key !== 'Tab') return;
    var f = [].slice.call(kontener.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      .filter(function (x) { return x.offsetParent !== null || x === doc.activeElement; });
    if (!f.length) return;
    var pierwszy = f[0], ost = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === pierwszy) { e.preventDefault(); ost.focus(); }
    else if (!e.shiftKey && doc.activeElement === ost) { e.preventDefault(); pierwszy.focus(); }
  }

  /* ================= DEFINICJA STRON PANELU ================= */
  var GRUPY = [
    { n: 'Przegląd', s: ['pulpit', 'braki', 'sekcje'] },
    { n: 'Treści czasowe', s: ['aktualnosci'] },
    { n: 'Wizerunek', s: ['start', 'oMnie', 'historia', 'kadra'] },
    { n: 'Galeria', s: ['portfolio', 'instagram'] },
    { n: 'Kontakt i dane', s: ['kontakt', 'formularz'] },
    { n: 'Ustawienia', s: ['wyglad', 'seo', 'polityka', 'jezyki', 'haslo', 'kopia'] }
  ];
  var STRONY = {
    pulpit: { n: 'Pulpit', ik: '◧', opis: 'Najważniejsze informacje o stronie w jednym miejscu.' },
    braki: { n: 'Do uzupełnienia', ik: '!', opis: 'Lista miejsc, które nie zostały jeszcze wypełnione: teksty „[DO UZUPEŁNIENIA]”, zdjęcia zastępcze, brakujące dane i linki. Kliknij „Uzupełnij”, aby przejść prosto do pola.' },
    sekcje: { n: 'Sekcje strony', ik: '☰', opis: 'Włączanie i wyłączanie sekcji, nazwy w menu i nagłówki.' },
    aktualnosci: { n: 'Aktualności', ik: '✎', opis: 'Wpisy z datą „pokazuj od / do”. Po terminie znikają ze strony same i zostają tu w archiwum.', sek: 'aktualnosci' },
    start: { n: 'Pierwszy ekran', ik: '◎', opis: 'Imię i nazwisko, podpis, myśl przewodnia, przycisk i duże zdjęcie lub film w tle.', sek: 'start' },
    oMnie: { n: 'O mnie', ik: '♡', opis: 'Misja, pełny tekst „czytaj więcej”, rodzaje sesji i wartości.', sek: 'oMnie' },
    historia: { n: 'Historia', ik: '❘', opis: 'Dwa układy do wyboru: oś czasu przewijana w poziomie albo jedna opowieść ze zdjęciem.', sek: 'historia' },
    kadra: { n: 'Kto fotografuje', ik: '☺', opis: 'Osoby, które fotografują (Anna i drugi fotograf przy reportażach ślubnych).', sek: 'kadra' },
    portfolio: { n: 'Portfolio', ik: '▦', opis: 'Galeria zdjęć i wideo w mozaice: każde zdjęcie w swojej orientacji (pion lub poziom), a strony mieszczą się na jednym ekranie.', sek: 'portfolio' },
    instagram: { n: 'Instagram', ik: '◉', opis: 'Najnowsze zdjęcia z Instagrama — automatycznie albo wybrane ręcznie.', sek: 'instagram' },
    kontakt: { n: 'Kontakt i stopka', ik: '✆', opis: 'Messenger, profile, obszar działania, dane działalności (NIP) i hasło w stopce.', sek: 'kontakt' },
    formularz: { n: 'Formularz kontaktowy', ik: '✉', opis: 'Adres e-mail, na który przychodzą wiadomości z formularza na stronie, oraz tekst nad formularzem. Wiadomości nie są przechowywane na stronie.', sek: 'kontakt' },
    wyglad: { n: 'Wygląd i efekty', ik: '✦', opis: 'Motyw kolorystyczny (3 wyraźnie różne style), kropki nawigacji i animacje.' },
    polityka: { n: 'Polityka prywatności', ik: '§', opis: 'Treść podstrony „Polityka prywatności”: dane administratora i kolejne punkty. Data aktualizacji ustawia się sama przy zapisie.' },
    seo: { n: 'SEO (Google)', ik: '⌕', opis: 'Tytuł i opis strony widoczne w wynikach wyszukiwania Google.' },
    jezyki: { n: 'Wersje językowe', ik: '⚑', opis: 'Włączanie i wyłączanie wersji językowych strony.' },
    haslo: { n: 'Hasło do panelu', ik: '⚿', opis: 'Zmiana hasła logowania do panelu administratora.' },
    kopia: { n: 'Kopia zapasowa', ik: '⟲', opis: 'Eksport i import treści, kopie automatyczne na serwerze, przywracanie treści początkowych.' }
  };

  var STARE = { '#f2ebe3': 'motyw:tlo2', '#faf7f2': 'motyw:jasne', '#2b2622': 'motyw:ciemne' };
  function normalizuj(s) {
    Object.keys(s.sekcje || {}).forEach(function (k) {
      var tl = s.sekcje[k].tlo; if (!tl || !tl.kolor || /^motyw:|^wlasny$/.test(tl.kolor)) return;
      var m = STARE[String(tl.kolor).toLowerCase()];
      if (m) tl.kolor = m; else { tl.kolorWlasny = tl.kolor; tl.kolor = 'wlasny'; }
    });
    /* motywy z poprzedniej wersji (szałwia, grafit) → Kremowy beż */
    if (s.ustawienia && !A.MOTYWY.some(function (x) { return x.id === s.ustawienia.motyw; })) s.ustawienia.motyw = 'bez';
    if (s.historia && s.historia.wariant !== 'opowiesc') s.historia.wariant = 'os';
    var op = s.historia && s.historia.opowiesc;
    if (op && op.wiecej) {
      ['pl', 'en'].forEach(function (l) { if (Rn.plain(t(op.wiecej, l)).length > Rn.plain(t(op.tresc, l)).length) { op.tresc = op.tresc || {}; op.tresc[l] = op.wiecej[l]; } });
    }
    if (op) { delete op.wiecej; delete op.wyrLiczba; delete op.wyrOpis; }
    (s.historia && s.historia.rozdzialy || []).forEach(function (r) { if (r.krotki == null) r.krotki = true; delete r.ciemno; delete r.tekst; delete r.kolor; });
    return s;
  }

  /* ================= PANEL: SZKIELET ================= */
  function otworzPanel() {
    if (P.otwarty) return;
    P.stan = normalizuj(Rn.clone(site.state));
    P.otwarty = true;
    var el = doc.createElement('div');
    el.className = 'cmsp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Panel administratora');
    el.innerHTML =
      '<header class="cmsp-top">' +
      '<div class="cmsp-marka"><span class="cmsp-logo" aria-hidden="true">AN</span><span><strong>Anna Niedobitek Fotografia</strong><small>Panel administratora</small></span></div>' +
      '<div class="cmsp-zapis cmsp-zapis--ok" role="status" aria-live="polite"><span class="cmsp-kropka" aria-hidden="true"></span><span class="cmsp-zapis-tekst">' + (P.demo ? 'Tryb lokalny' : 'Wszystko zapisane') + '</span></div>' +
      '<div class="cmsp-top-akcje"><button type="button" class="cmsp-btn cmsp-btn--jasny" data-akcja="zobacz">Zobacz stronę</button>' +
      (P.demo ? '' : '<button type="button" class="cmsp-btn cmsp-btn--obrys" data-akcja="wyloguj">Wyloguj</button>') + '</div></header>' +
      (P.demo ? '<div class="cmsp-demo" role="note"><strong>Tryb demonstracyjny</strong> — zmiany zapisują się tylko na tym komputerze. Po wdrożeniu na Cloudflare Pages panel zapisuje dane na serwerze.</div>' : '') +
      '<div class="cmsp-cialo"><nav class="cmsp-menu" aria-label="Menu panelu"></nav><main class="cmsp-glowna" tabindex="-1"></main></div>' +
      '<div class="cmsp-toasty" aria-live="polite"></div>';
    doc.body.appendChild(el);
    P.root = el;
    doc.documentElement.classList.add('cmsp-otwarty');
    el.addEventListener('click', klik);
    el.addEventListener('input', zmiana);
    el.addEventListener('change', zmiana);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !doc.querySelector('.cmsp-modal-tlo')) { e.preventDefault(); zamknijPanel(); return; }
      if (!doc.querySelector('.cmsp-modal-tlo')) pulapka(e, el);
    });
    el.addEventListener('focusin', podswietlPole); el.addEventListener('mouseover', podswietlPole);
    el.addEventListener('focusout', zgasPole); el.addEventListener('mouseout', zgasPole);
    rysujMenu();
    idz(P.strona || 'pulpit');
  }
  function zamknijPanel(poZamknieciu) {
    if (!potwierdzPorzucenie()) return;
    P.otwarty = false; P.szkic = null;
    if (P.root) P.root.remove(); P.root = null;
    doc.documentElement.classList.remove('cmsp-otwarty');
    if (poZamknieciu) poZamknieciu(); else if (P.wrocDo && P.wrocDo.focus) P.wrocDo.focus();
  }
  CMS.zamknij = zamknijPanel;

  function licznikiMenu() {
    var s = P.stan, today = dzis();
    var akt = (s.aktualnosci.lista || []).filter(function (w) { return Rn.status(w, today) === 'aktywna'; }).length;
    return {
      aktualnosci: { n: (s.aktualnosci.lista || []).length, akt: akt },
      historia: { n: (s.historia.rozdzialy || []).length },
      kadra: { n: (s.kadra.lista || []).length },
      braki: (function () { var b = znajdzBraki(s).filter(function (x) { return !x.ukryte; }).length; return b ? { n: b, uwaga: true } : null; })(),
      portfolio: { n: (s.portfolio.elementy || []).length }
    };
  }
  function rysujMenu() {
    var m = P.root.querySelector('.cmsp-menu'), L = licznikiMenu();
    m.innerHTML = GRUPY.map(function (g) {
      return '<div class="cmsp-grupa"><p class="cmsp-grupa-n">' + esc(g.n) + '</p><ul>' + g.s.map(function (id) {
        var st = STRONY[id], l = L[id], lic = '';
        if (l && l.uwaga) lic = '<span class="cmsp-licz cmsp-licz--uwaga" title="Do uzupełnienia">' + l.n + '</span>';
        else if (l && l.akt != null) lic = '<span class="cmsp-licz cmsp-licz--ziel" title="Aktywne na stronie">' + l.akt + '</span><span class="cmsp-licz">' + l.n + '</span>';
        else if (l && l.nowe) lic = l.n ? '<span class="cmsp-licz cmsp-licz--ziel" title="Nieprzeczytane">' + l.n + '</span>' : '';
        else if (l) lic = '<span class="cmsp-licz">' + l.n + '</span>';
        return '<li><button type="button" data-idz="' + id + '"' + (P.strona === id ? ' aria-current="page"' : '') + '><span class="cmsp-ik" aria-hidden="true">' + st.ik + '</span><span class="cmsp-menu-n">' + esc(st.n) + '</span>' + lic + '</button></li>';
      }).join('') + '</ul></div>';
    }).join('');
  }
  function odswiezLiczniki() { if (P.root) rysujMenu(); }

  function potwierdzPorzucenie() {
    if (P.szkic && JSON.stringify(P.szkic) !== JSON.stringify(P.stan)) {
      return window.confirm('Masz niezapisane zmiany na tej podstronie. Porzucić je?');
    }
    return true;
  }
  function idz(id, opcje) {
    if (!STRONY[id]) id = 'pulpit';
    if (P.strona !== id && !potwierdzPorzucenie()) return;
    P.strona = id; P.szkic = null;
    rysujMenu();
    var g = P.root.querySelector('.cmsp-glowna'), st = STRONY[id];
    g.innerHTML = '<div class="cmsp-naglowek"><div><h1>' + esc(st.n) + '</h1><p>' + esc(st.opis) + '</p></div>' +
      (st.sek ? '<button type="button" class="cmsp-btn cmsp-btn--obrys" data-akcja="pokaz" data-sek="' + st.sek + '">Zobacz na stronie ↗</button>' : '') + '</div>' +
      '<div class="cmsp-strona" id="cmsp-strona"></div>';
    RYSUJ[id](g.querySelector('#cmsp-strona'), opcje || {});
    g.scrollTop = 0;
    if (!opcje || !opcje.bezFokusu) g.focus({ preventScroll: true });
    var akt = P.root.querySelector('[data-idz="' + id + '"]'); if (akt && akt.scrollIntoView && window.innerWidth < 900) akt.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ================= PODGLĄD SEKCJI NA ŻYWO ================= */
  var NAZWY_SEK = { polityka: 'Polityka prywatności (podstrona)', start: 'Pierwszy ekran', oMnie: 'O mnie', historia: 'Historia', aktualnosci: 'Aktualności', kadra: 'Kto fotografuje', portfolio: 'Portfolio', instagram: 'Instagram', kontakt: 'Kontakt + stopka' };
  function htmlSekcji(k, stan) {
    var ctx = Rn.ctx(stan, { lang: 'pl' });
    var h = A.R[k](stan, ctx);
    if (k === 'polityka') h = '<div class="podstrona-tresc cmsp-podstrona">' + h + '</div>';
    if (k === 'kontakt') h = h.replace('<dialog class="okno okno-form"', '<div class="okno okno-form cmsp-form-podglad"').replace('</dialog>', '</div>') + A.R.stopka(stan, ctx);
    if (/^<section[^>]*hidden><\/section>$/.test(h)) {
      h = '<div class="cmsp-mini-pusta">Ta sekcja jest teraz ukryta na stronie' + (k === 'aktualnosci' ? ' (brak aktywnych wpisów lub sekcja wyłączona)' : '') + '.</div>';
    }
    // bez zdublowanych identyfikatorów i bez znaczników renderowania strony
    return h.replace(/\sid="/g, ' data-pid="').replace(/\sdata-ssr="/g, ' data-pssr="').replace(/\saria-labelledby="[^"]*"/g, '').replace(/loading="lazy"/g, '');
  }
  function mini(k, stan, opcje) {
    opcje = opcje || {};
    return '<div class="cmsp-mini' + (opcje.male ? ' cmsp-mini--male' : '') + '" data-mini="' + k + '"><div class="cmsp-mini-in" data-motyw="' + esc((stan.ustawienia && stan.ustawienia.motyw) || 'bez') + '" inert aria-hidden="true">' + htmlSekcji(k, stan) + '</div></div>';
  }
  function skalujMini(kont) {
    (kont || P.root).querySelectorAll('.cmsp-mini').forEach(function (m) {
      var inn = m.firstChild, w = m.clientWidth || 300, base = 1280;
      inn.style.width = base + 'px'; inn.style.zoom = (w / base).toFixed(4);
    });
  }
  function odswiezMini(k, stan) {
    P.root.querySelectorAll('.cmsp-mini[data-mini="' + k + '"]').forEach(function (m) {
      m.firstChild.innerHTML = htmlSekcji(k, stan);
      m.firstChild.setAttribute('data-motyw', (stan.ustawienia && stan.ustawienia.motyw) || 'bez');
      skalujMini(m.parentNode);
      if (P.aktywnePole) zapal(P.aktywnePole);
    });
  }
  function kartaPodgladu(k, stan) {
    return '<section class="cmsp-karta cmsp-podglad" aria-label="Podgląd sekcji">' +
      '<div class="cmsp-podglad-g"><p>Ta zmiana dotyczy sekcji: <strong>' + esc(NAZWY_SEK[k] || k) + '</strong></p>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly" data-akcja="pokaz" data-sek="' + k + '">Pokaż na stronie</button></div>' +
      mini(k, stan) + '<p class="cmsp-pomoc">Podgląd na żywo. Najedź na pole formularza, aby zobaczyć, który element strony zmieniasz.</p></section>';
  }
  /* podświetlanie: pole formularza ↔ element w podglądzie */
  function zapal(f) {
    P.aktywnePole = f;
    P.root.querySelectorAll('.cmsp-hl').forEach(function (x) { x.classList.remove('cmsp-hl'); });
    if (!f) return;
    var sel = '[data-f="' + f.replace(/"/g, '') + '"]';
    doc.querySelectorAll('.cmsp-mini ' + sel).forEach(function (x, i) {
      x.classList.add('cmsp-hl');
      var m = x.closest('.cmsp-mini'); if (!m || i) return;
      var r = x.getBoundingClientRect(), mr = m.getBoundingClientRect();
      if (r.top < mr.top || r.bottom > mr.bottom) m.scrollTop += r.top - mr.top - 30;
    });
  }
  function podswietlPole(e) {
    var p = e.target.closest && e.target.closest('[data-hl]'); if (!p) return;
    zapal(p.getAttribute('data-hl'));
  }
  function zgasPole(e) {
    var p = e.target.closest && e.target.closest('[data-hl]'); if (!p) return;
    if (e.type === 'mouseout' && p.contains(doc.activeElement)) return;
    if (e.type === 'mouseout' && e.relatedTarget && p.contains(e.relatedTarget)) return;
    zapal(null);
  }

  /* ================= FORMULARZE (opis pól → HTML) ================= */
  var FORMY = {}, nrPola = 0;
  /* typy: tekst, obszar, zdjecie, data, godzina, tak, wybor, liczba, suwak, kolor, url, radio */
  function etykieta(d, id) {
    return '<label for="' + id + '" class="cmsp-et">' + esc(d.et) + (d.wym ? ' <span class="cmsp-wym" aria-hidden="true">*</span><span class="cmsp-sr">(wymagane)</span>' : '') + '</label>';
  }
  function pomoc(d, id) { return d.pomoc ? '<p class="cmsp-pomoc" id="' + id + '-p">' + d.pomoc + '</p>' : ''; }
  function pole(d, obj) {
    var id = 'cmsp-p' + (++nrPola), v = getP(obj, d.k), hl = d.f ? ' data-hl="' + esc(d.f) + '"' : '', opisane = d.pomoc ? ' aria-describedby="' + id + '-p"' : '';
    var szer = d.szer ? ' cmsp-pole--' + d.szer : '';
    if (d.i18n) {
      var jl = jezyki();
      var wl = jl.filter(function (j) { return j.wl || j.staly; }), wyl = jl.filter(function (j) { return !(j.wl || j.staly); });
      var multi = wl.length > 1;
      var inp = function (j, idx) {
        var jid = id + '-' + j.kod, val = v && typeof v === 'object' ? (v[j.kod] || '') : (j.kod === 'pl' ? (v || '') : '');
        var lab = multi || j.kod !== 'pl' ? '<span class="cmsp-jez">' + esc(j.kod.toUpperCase()) + '</span>' : '';
        var ctl = d.typ === 'obszar'
          ? '<textarea id="' + jid + '" data-pole="' + esc(d.k + '.' + j.kod) + '" rows="' + (d.wiersze || 4) + '"' + (d.max ? ' maxlength="' + d.max + '"' : '') + opisane + (d.wym && j.kod === 'pl' ? ' required aria-required="true"' : '') + '>' + esc(val) + '</textarea>'
          : '<input id="' + jid + '" type="text" data-pole="' + esc(d.k + '.' + j.kod) + '" value="' + esc(val) + '"' + (d.max ? ' maxlength="' + d.max + '"' : '') + opisane + (d.wym && j.kod === 'pl' ? ' required aria-required="true"' : '') + '>';
        return '<div class="cmsp-jez-pole">' + lab + ctl + (d.licznik ? '<span class="cmsp-znaki" data-znaki-dla="' + jid + '">' + val.length + ' zn.</span>' : '') + '</div>';
      };
      var h = '<div class="cmsp-pole' + szer + '"' + hl + '>' + etykieta(d, id + '-pl') +
        '<div class="cmsp-jezyki' + (multi ? ' cmsp-jezyki--multi' : '') + '">' + wl.map(inp).join('') + '</div>' +
        (wyl.length ? wyl.map(function (j) { return '<details class="cmsp-wylaczona"><summary>' + esc(j.nazwa) + ' (' + esc(j.kod.toUpperCase()) + ') — wersja wyłączona</summary>' + inp(j) + '</details>'; }).join('') : '') +
        pomoc(d, id) + '</div>';
      return h;
    }
    switch (d.typ) {
      case 'motyw':
        return '<fieldset class="cmsp-pole cmsp-motywy"><legend class="cmsp-sr">' + esc(d.et) + '</legend>' + A.MOTYWY.map(function (m) {
          return '<label class="cmsp-motyw"><input type="radio" name="' + id + '" data-pole="' + esc(d.k) + '" value="' + m.id + '"' + ((v || 'bez') === m.id ? ' checked' : '') + '>' +
            '<span class="cmsp-motyw-k"><span class="cmsp-motyw-paski">' + m.kolory.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' +
            '<strong>' + esc(m.nazwa) + '</strong><small>' + esc(m.opis) + '</small></span></label>';
        }).join('') + '</fieldset>';
      case 'zdjecie': return poleZdjecia(d, obj, id, hl);
      case 'tak':
        return '<div class="cmsp-pole cmsp-pole--tak' + szer + '"' + hl + '><label class="cmsp-przel"><input type="checkbox" id="' + id + '" data-pole="' + esc(d.k) + '"' + (v ? ' checked' : '') + opisane + '><span class="cmsp-przel-s" aria-hidden="true"></span><span>' + esc(d.et) + '</span></label>' + pomoc(d, id) + '</div>';
      case 'wybor':
        return '<div class="cmsp-pole' + szer + '"' + hl + '>' + etykieta(d, id) + '<select id="' + id + '" data-pole="' + esc(d.k) + '"' + opisane + '>' +
          d.opcje.map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(v) === String(o.v) ? ' selected' : '') + '>' + esc(o.n) + '</option>'; }).join('') + '</select>' + pomoc(d, id) + '</div>';
      case 'radio':
        return '<fieldset class="cmsp-pole cmsp-radio' + szer + '"' + hl + '><legend class="cmsp-et">' + esc(d.et) + '</legend>' + d.opcje.map(function (o, i) {
          return '<label><input type="radio" name="' + id + '" data-pole="' + esc(d.k) + '" value="' + esc(o.v) + '"' + (String(v) === String(o.v) ? ' checked' : '') + '><span>' + esc(o.n) + '</span></label>';
        }).join('') + pomoc(d, id) + '</fieldset>';
      case 'suwak':
        return '<div class="cmsp-pole' + szer + '"' + hl + '>' + etykieta(d, id) + '<div class="cmsp-suwak"><input type="range" id="' + id + '" data-pole="' + esc(d.k) + '" min="' + (d.min || 0) + '" max="' + (d.max || 100) + '" step="' + (d.krok || 5) + '" value="' + esc(v || 0) + '"' + opisane + '><output for="' + id + '">' + esc(v || 0) + '%</output></div>' + pomoc(d, id) + '<p class="cmsp-ostrz" data-ostrz-dla="' + id + '" hidden></p></div>';
      case 'kolor':
        return '<div class="cmsp-pole' + szer + '"' + hl + '>' + etykieta(d, id) + '<div class="cmsp-kolor"><input type="color" id="' + id + '" data-pole="' + esc(d.k) + '" value="' + esc(v || '#FAF7F2') + '"><code>' + esc(v || '') + '</code></div>' + pomoc(d, id) + '</div>';
      case 'obszar':
        return '<div class="cmsp-pole' + szer + '"' + hl + '>' + etykieta(d, id) + '<textarea id="' + id + '" data-pole="' + esc(d.k) + '" rows="' + (d.wiersze || 4) + '"' + opisane + '>' + esc(v || '') + '</textarea>' + pomoc(d, id) + '</div>';
      default:
        var typ = { data: 'date', godzina: 'time', liczba: 'number', url: 'url', email: 'email' }[d.typ] || 'text';
        return '<div class="cmsp-pole' + szer + '"' + hl + '>' + etykieta(d, id) + '<input id="' + id + '" type="' + typ + '" data-pole="' + esc(d.k) + '" value="' + esc(v == null ? '' : v) + '"' +
          (d.min != null ? ' min="' + d.min + '"' : '') + (d.max != null && typ === 'number' ? ' max="' + d.max + '"' : '') + (d.max && typ === 'text' ? ' maxlength="' + d.max + '"' : '') + (d.wym ? ' required aria-required="true"' : '') + (d.ph ? ' placeholder="' + esc(d.ph) + '"' : '') + opisane + '>' + pomoc(d, id) + '</div>';
    }
  }
  function poleZdjecia(d, obj, id, hl) {
    var z = getP(obj, d.k) || {};
    return '<div class="cmsp-pole cmsp-zdj' + (d.szer ? ' cmsp-pole--' + d.szer : '') + '"' + hl + ' data-zdj="' + esc(d.k) + '">' +
      '<p class="cmsp-et">' + esc(d.et) + (d.wym ? ' <span class="cmsp-wym" aria-hidden="true">*</span><span class="cmsp-sr">(wymagane)</span>' : '') + '</p>' +
      '<div class="cmsp-zdj-rzad"><div class="cmsp-zdj-pod">' + (z.src ? '<img src="' + esc(z.src) + '" alt="" style="object-position:' + pozZdj(z).x + '% ' + pozZdj(z).y + '%">' : '<span>Brak zdjęcia</span>') + '</div>' +
      '<div class="cmsp-zdj-akcje"><label class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys cmsp-plik">Wgraj z dysku<input type="file" accept="image/jpeg,image/png,image/webp,image/heic" data-plik="' + esc(d.k) + '"></label>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--jasny" data-akcja="zdj-usun" data-k="' + esc(d.k) + '"' + (z.src ? '' : ' disabled') + '>Usuń zdjęcie</button>' +
      '<p class="cmsp-pomoc">Zdjęcie zostanie automatycznie zmniejszone (do 1600 px) i zapisane jako JPEG.</p></div></div>' +
      '<div class="cmsp-zdj-pola"><div class="cmsp-pole"><label class="cmsp-et" for="' + id + '-u">Adres URL zdjęcia</label><input id="' + id + '-u" type="text" data-pole="' + esc(d.k) + '.src" value="' + esc(z.src || '') + '" placeholder="https://… lub assets/img/…"></div>' +
      (d.bezAlt ? '' : '<div class="cmsp-pole"><label class="cmsp-et" for="' + id + '-a">Opis zdjęcia dla Google i niewidomych (alt)</label><input id="' + id + '-a" type="text" data-pole="' + esc(d.k) + '.alt" value="' + esc(t(z.alt, 'pl')) + '" placeholder="np. Rodzina podczas sesji w plenerze w Zgorzelcu"></div>') +
      '</div><div class="cmsp-kadr" data-kadr="' + esc(d.k) + '"' + (z.src ? '' : ' hidden') + '>' + (z.src ? kadrHtml(z) : '') + '</div>' +
      '<p class="cmsp-zdj-stan" role="status" aria-live="polite"></p></div>';
  }
  /* ---------- KADROWANIE: który fragment zdjęcia ma być zawsze widoczny ----------
   * Na stronie zdjęcia są przycinane do kształtu ramki (inaczej na komputerze, inaczej na telefonie).
   * Punkt kadru = object-position: ten fragment zostaje w kadrze. Zapis: zdjecie.poz = { x, y } w %. */
  function pozZdj(z) { var p = z && z.poz; return { x: p && isFinite(p.x) ? +p.x : 50, y: p && isFinite(p.y) ? +p.y : 50 }; }
  function kadrHtml(z) {
    var p = pozZdj(z), op = 'object-position:' + p.x + '% ' + p.y + '%', src = esc(z.src);
    return '<p class="cmsp-et">Kadrowanie — który fragment ma być zawsze widoczny</p>' +
      '<div class="cmsp-kadr-uk"><div class="cmsp-kadr-obraz" data-kadr-obraz title="Kliknij lub przeciągnij punkt">' +
      '<img src="' + src + '" alt="" draggable="false"><span class="cmsp-kadr-pkt" style="left:' + p.x + '%;top:' + p.y + '%" aria-hidden="true"></span></div>' +
      '<div class="cmsp-kadr-podg" aria-hidden="true">' +
      '<figure><span class="cmsp-kadr-ramka cmsp-kadr-ramka--poz"><img src="' + src + '" alt="" style="' + op + '"></span><figcaption>Komputer</figcaption></figure>' +
      '<figure><span class="cmsp-kadr-ramka cmsp-kadr-ramka--kw"><img src="' + src + '" alt="" style="' + op + '"></span><figcaption>Kwadrat</figcaption></figure>' +
      '<figure><span class="cmsp-kadr-ramka cmsp-kadr-ramka--pion"><img src="' + src + '" alt="" style="' + op + '"></span><figcaption>Telefon</figcaption></figure></div></div>' +
      '<div class="cmsp-kadr-strz" role="group" aria-label="Przesuń kadr">' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="kadr" data-dx="0" data-dy="-5" title="Pokaż więcej górnej części">↑ Wyżej</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="kadr" data-dx="0" data-dy="5" title="Pokaż więcej dolnej części">↓ Niżej</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="kadr" data-dx="-5" data-dy="0" title="Pokaż więcej lewej strony">← W lewo</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="kadr" data-dx="5" data-dy="0" title="Pokaż więcej prawej strony">→ W prawo</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--jasny" data-akcja="kadr-srodek">Wyśrodkuj</button></div>' +
      '<p class="cmsp-pomoc cmsp-kadr-stan">Punkt kadru: <strong>' + p.x + '% od lewej, ' + p.y + '% od góry</strong>. Kliknij na zdjęciu miejsce, które ma być zawsze widoczne (np. twarz), albo użyj strzałek. Podgląd obok pokazuje przycięcie na różnych ekranach.</p>';
  }
  var kadrRaf = null;
  function ustawKadr(el, x, y) {
    var blok = el.closest('[data-kadr]'), fe = el.closest('[data-forma]'); if (!blok || !fe) return;
    var F = FORMY[fe.getAttribute('data-forma')], k = blok.getAttribute('data-kadr'), z = F && getP(F.obj, k);
    if (!z || !z.src) return;
    x = Math.round(Math.max(0, Math.min(100, x))); y = Math.round(Math.max(0, Math.min(100, y)));
    if (x === 50 && y === 50) delete z.poz; else z.poz = { x: x, y: y };
    var pkt = blok.querySelector('.cmsp-kadr-pkt'); pkt.style.left = x + '%'; pkt.style.top = y + '%';
    blok.querySelectorAll('.cmsp-kadr-ramka img').forEach(function (i) { i.style.objectPosition = x + '% ' + y + '%'; });
    var miniat = blok.parentNode.querySelector('.cmsp-zdj-pod img'); if (miniat) miniat.style.objectPosition = x + '% ' + y + '%';
    blok.querySelector('.cmsp-kadr-stan strong').textContent = x + '% od lewej, ' + y + '% od góry';
    if (kadrRaf) cancelAnimationFrame(kadrRaf);
    kadrRaf = requestAnimationFrame(function () { kadrRaf = null; if (F.onZmiana) F.onZmiana(k + '.poz', z.poz || null, false, 'change'); });
  }
  function kadrZPunktu(obraz, e) {
    var r = obraz.querySelector('img').getBoundingClientRect();
    ustawKadr(obraz, (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
  }
  var kadrCiagnij = null;
  doc.addEventListener('pointerdown', function (e) {
    var o = e.target.closest && e.target.closest('[data-kadr-obraz]'); if (!o) return;
    e.preventDefault(); kadrCiagnij = o; try { o.setPointerCapture(e.pointerId); } catch (er) { }
    kadrZPunktu(o, e);
  });
  doc.addEventListener('pointermove', function (e) { if (kadrCiagnij) { e.preventDefault(); kadrZPunktu(kadrCiagnij, e); } });
  doc.addEventListener('pointerup', function () { kadrCiagnij = null; });
  doc.addEventListener('pointercancel', function () { kadrCiagnij = null; });
  function forma(id, obj, pola, onZmiana) {
    FORMY[id] = { obj: obj, pola: pola, onZmiana: onZmiana };
    return '<div class="cmsp-forma" data-forma="' + id + '">' + pola.map(function (d) {
      if (d.naglowek) return '<h3 class="cmsp-podtytul">' + esc(d.naglowek) + '</h3>' + (d.opis ? '<p class="cmsp-pomoc">' + esc(d.opis) + '</p>' : '');
      if (d.gdy && !d.gdy(obj)) return '';
      return pole(d, obj);
    }).join('') + '</div>';
  }
  function zmiana(e) {
    var el = e.target;
    if (el.matches('[data-plik]') && e.type === 'change') { wgrajPlik(el); return; }
    if (!el.matches('[data-pole]')) return;
    var fe = el.closest('[data-forma]'); if (!fe) return;
    var F = FORMY[fe.getAttribute('data-forma')]; if (!F) return;
    var v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'number' || el.type === 'range') v = el.value === '' ? null : Number(el.value);
    else if (el.type === 'radio') { if (!el.checked) return; v = el.value; }
    else v = el.value;
    var sciezka = el.getAttribute('data-pole');
    setP(F.obj, sciezka, v);
    if (el.type === 'range') { var o = el.parentNode.querySelector('output'); if (o) o.textContent = v + '%'; }
    if (el.type === 'color') { var c = el.parentNode.querySelector('code'); if (c) c.textContent = v; }
    var zn = P.root.querySelector('[data-znaki-dla="' + el.id + '"]'); if (zn) zn.textContent = String(v).length + ' zn.';
    if (/\.src$/.test(sciezka)) { wymiaryZUrl(F, sciezka.replace(/\.src$/, ''), v, fe); }
    var przerysuj = F.pola.some(function (d) { return d.k === sciezka && d.przerysuj; });
    if (F.onZmiana) F.onZmiana(sciezka, v, przerysuj, e.type);
  }
  function wymiaryZUrl(F, k, src, fe) {
    var pod = fe.querySelector('[data-zdj="' + k + '"] .cmsp-zdj-pod');
    if (!src) return;
    var im = new Image();
    im.onload = function () {
      var z = getP(F.obj, k) || {};
      z.w = im.naturalWidth; z.h = im.naturalHeight; delete z.srcset; setP(F.obj, k, z);
      if (pod) pod.innerHTML = '<img src="' + esc(src) + '" alt="">';
    };
    im.src = src;
  }

  /* ---------- wgrywanie zdjęć (zmniejszenie w przeglądarce) ---------- */
  function zmniejsz(plik, maks, jakosc) {
    return new Promise(function (ok, nie) {
      var url = URL.createObjectURL(plik), im = new Image();
      im.onload = function () {
        var s = Math.min(1, maks / Math.max(im.naturalWidth, im.naturalHeight));
        var w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
        var c = doc.createElement('canvas'); c.width = w; c.height = h;
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok({ blob: b, w: w, h: h, canvas: c }) : nie(new Error('Nie udało się przetworzyć zdjęcia')); }, 'image/jpeg', jakosc || 0.84);
      };
      im.onerror = function () { URL.revokeObjectURL(url); nie(new Error('Tego pliku nie da się otworzyć jako zdjęcie (spróbuj JPG lub PNG).')); };
      im.src = url;
    });
  }
  function doDataUrl(blob) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(blob); }); }
  function wyslijZdjecie(blob) {
    return fetch(API + '/zdjecia', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'image/jpeg', 'X-CMS': '1' }, body: blob })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.blad || ('Błąd wgrywania (' + r.status + ')')); return j; }); });
  }
  function wgrajPlik(input) {
    var plik = input.files && input.files[0]; if (!plik) return;
    var fe = input.closest('[data-forma]'), F = FORMY[fe.getAttribute('data-forma')], k = input.getAttribute('data-plik');
    var box = input.closest('.cmsp-zdj'), st = box.querySelector('.cmsp-zdj-stan');
    if (plik.size > 25 * 1024 * 1024) { st.textContent = 'Plik jest za duży (maks. 25 MB).'; return; }
    st.textContent = 'Przygotowywanie zdjęcia…';
    var duze;
    zmniejsz(plik, P.demo ? 1200 : 1600, 0.84).then(function (d) {
      duze = d;
      if (P.demo) return doDataUrl(d.blob).then(function (u) { return { src: u, w: d.w, h: d.h }; });
      st.textContent = 'Wysyłanie na serwer…';
      return wyslijZdjecie(d.blob).then(function (r1) {
        if (Math.max(d.w, d.h) <= 900) return { src: r1.url, w: d.w, h: d.h };
        return zmniejsz(plik, 800, 0.8).then(function (m) { return wyslijZdjecie(m.blob); }).then(function (r2) {
          var sz = d.w >= d.h ? 800 : Math.round(800 * d.w / d.h);
          return { src: r1.url, w: d.w, h: d.h, srcset: r2.url + ' ' + sz + 'w, ' + r1.url + ' ' + d.w + 'w' };
        });
      });
    }).then(function (z) {
      var stare = getP(F.obj, k) || {};
      z.alt = stare.alt || '';
      setP(F.obj, k, z);
      box.querySelector('.cmsp-zdj-pod').innerHTML = '<img src="' + esc(z.src) + '" alt="">';
      var u = box.querySelector('[data-pole="' + k + '.src"]'); if (u) u.value = z.src.slice(0, 5) === 'data:' ? '(zdjęcie zapisane lokalnie)' : z.src;
      box.querySelector('[data-akcja="zdj-usun"]').disabled = false;
      var kb = box.querySelector('.cmsp-kadr'); if (kb) { kb.innerHTML = kadrHtml(z); kb.hidden = false; }
      st.textContent = 'Gotowe — zdjęcie ' + z.w + '×' + z.h + ' px.' + (z.alt ? '' : ' Dodaj jeszcze opis zdjęcia (alt).');
      if (F.onZmiana) F.onZmiana(k, z, false, 'change');
    }).catch(function (err) { st.textContent = err.message; if (/401/.test(err.message)) pokazLogowanie(); })
      .then(function () { input.value = ''; });
  }

  /* ================= EDYTOR STRONY (pola + podgląd + pasek zapisu) ================= */
  function edytorStrony(kont, k, pola, op) {
    op = op || {};
    P.szkic = Rn.clone(P.stan);
    var fid = 'f-' + P.strona;
    function onZm(sciezka, v, przerysuj) {
      if (przerysuj) rysuj();
      odswiezMini(k, P.szkic);
      pasek();
      ostrzezenia();
    }
    function rysuj() {
      var wnetrze = kont.querySelector('.cmsp-edytor-pola');
      wnetrze.innerHTML = forma(fid, P.szkic, pola(P.szkic), onZm);
      ostrzezenia();
    }
    function pasek() {
      var zm = JSON.stringify(P.szkic) !== JSON.stringify(P.stan);
      kont.querySelector('.cmsp-pasek-zapisu').hidden = !zm;
    }
    function ostrzezenia() {
      kont.querySelectorAll('[data-ostrz-dla]').forEach(function (o) {
        var inp = doc.getElementById(o.getAttribute('data-ostrz-dla')); if (!inp) return;
        var sc = inp.getAttribute('data-pole').replace(/\.ciemno$/, ''), tl = getP(P.szkic, sc);
        var slabo = tl && tl.typ !== 'kolor' && tl.tekst === 'jasny' && (+tl.ciemno || 0) < 35;
        o.hidden = !slabo;
        o.textContent = slabo ? 'Przy jasnym tekście na zdjęciu zalecane przyciemnienie co najmniej 35% — inaczej tekst może być nieczytelny (WCAG 4.5:1).' : '';
      });
    }
    kont.innerHTML = (op.bezPodgladu ? '' : kartaPodgladu(k, P.szkic)) + (op.przed || '') +
      '<section class="cmsp-karta"><div class="cmsp-edytor-pola"></div></section>' + (op.po || '') +
      '<div class="cmsp-pasek-zapisu" hidden><span>Masz niezapisane zmiany w tej sekcji.</span><div><button type="button" class="cmsp-btn cmsp-btn--jasny" data-akcja="cofnij">Cofnij zmiany</button><button type="button" class="cmsp-btn cmsp-btn--glowny" data-akcja="zapisz-strone">Zapisz</button></div></div>';
    rysuj(); skalujMini(kont);
    kont._zapisz = function () {
      var bledy = (op.waliduj && op.waliduj(P.szkic)) || '';
      if (bledy) { toast(bledy, 'blad'); return; }
      P.stan = Rn.clone(P.szkic);
      zastosuj({ toast: 'Zapisano zmiany. Są już na stronie.' });
      pasek();
      if (op.poZapisie) op.poZapisie();
    };
    kont._cofnij = function () { P.szkic = Rn.clone(P.stan); rysuj(); odswiezMini(k, P.szkic); pasek(); toast('Przywrócono poprzednią wersję.'); };
    kont._przerysuj = function () { rysuj(); odswiezMini(k, P.szkic); pasek(); };
  }

  /* pola wyglądu sekcji (układ pełnoekranowy) */
  function polaTla(k, s) {
    var p = 'sekcje.' + k + '.tlo', tl = getP(s, p) || {}, f = 'sekcje.' + k + '.tlo';
    var pola = [
      { naglowek: 'Wygląd sekcji (układ pełnoekranowy)', opis: 'Tło na cały ekran: zdjęcie, wideo albo jednolity kolor, z przyciemnieniem dla czytelności tekstu.' },
      { k: p + '.typ', typ: 'radio', et: 'Tło sekcji', opcje: [{ v: 'zdjecie', n: 'Zdjęcie' }, { v: 'wideo', n: 'Wideo' }, { v: 'kolor', n: 'Kolor' }], przerysuj: true, f: f }
    ];
    if (tl.typ === 'zdjecie' || tl.typ === 'wideo') pola.push({ k: p + '.obraz', typ: 'zdjecie', et: tl.typ === 'wideo' ? 'Zdjęcie zastępcze (telefon, wolne łącze, „ogranicz ruch”)' : 'Zdjęcie w tle', f: f });
    if (tl.typ === 'wideo') {
      pola.push({ k: p + '.wideo', typ: 'url', et: 'Adres pliku wideo (MP4, wyciszone, do ok. 15 MB)', ph: 'https://…/film.mp4', pomoc: 'Wideo odtwarza się wyciszone, w pętli, z przyciskiem pauzy. Na telefonie i przy wolnym łączu zamiast wideo pokazuje się plakat lub zdjęcie zastępcze.' });
      pola.push({ k: p + '.plakat', typ: 'zdjecie', et: 'Plakat wideo (pierwsza klatka)', bezAlt: true });
    }
    if (tl.typ !== 'kolor') pola.push({ k: p + '.ciemno', typ: 'suwak', et: 'Przyciemnienie / rozjaśnienie zdjęcia', min: 0, max: 85, krok: 5, f: f });
    pola.push({ k: p + '.kolor', typ: 'radio', et: tl.typ === 'kolor' ? 'Kolor tła' : 'Kolor tła (widoczny, zanim wczyta się zdjęcie)', f: f, przerysuj: true,
      opcje: [{ v: 'motyw:jasne', n: 'Tło główne (z motywu)' }, { v: 'motyw:tlo2', n: 'Tło drugie (z motywu)' }, { v: 'motyw:ciemne', n: 'Tło najciemniejsze (z motywu)' }, { v: 'wlasny', n: 'Własny kolor' }],
      pomoc: 'Kolory „z motywu” zmieniają się automatycznie po wybraniu innej kolorystyki strony.' });
    if (tl.kolor === 'wlasny') pola.push({ k: p + '.kolorWlasny', typ: 'kolor', et: 'Własny kolor tła', f: f });
    pola.push({ k: p + '.tekst', typ: 'radio', et: 'Kolor tekstu', opcje: [{ v: 'jasny', n: 'Jasny (na ciemnym tle)' }, { v: 'ciemny', n: 'Ciemny (na jasnym tle)' }], f: f, przerysuj: true });
    return pola;
  }
  function polaNaglowka(k, zWstepem) {
    var p = 'sekcje.' + k;
    var a = [
      { naglowek: 'Nagłówek sekcji' },
      { k: p + '.menu', typ: 'tekst', i18n: true, et: 'Nazwa w menu i przy kropkach nawigacji', max: 30, szer: 'pol' },
      { k: p + '.nadtytul', typ: 'tekst', i18n: true, et: 'Nadtytuł (mały napis nad nagłówkiem)', max: 60, f: p + '.nadtytul', szer: 'pol' },
      { k: p + '.naglowek', typ: 'tekst', i18n: true, et: 'Nagłówek sekcji (H2 — warto wpleść miasto lub rodzaj sesji)', pomoc: 'Puste pole = nagłówek znika ze strony, a treść przesuwa się w górę. Dla Google warto go jednak mieć.', max: 120, f: p + '.naglowek' }
    ];
    if (zWstepem) a.push({ k: p + '.wstep', typ: 'obszar', i18n: true, et: 'Wprowadzenie pod nagłówkiem', wiersze: 3, f: p + '.wstep' });
    return a;
  }

  /* ================= LISTY (kolekcje) ================= */
  /* cfg: { k: sekcja do podglądu, sciezka: 'kadra.lista', nazwa:'osobę', pola(fn), tytul(item), podsum(item), zdj(item), nowy(), czasowe?, waliduj(item) } */
  var LISTY = {};
  function lista(kont, cfg) {
    LISTY[cfg.id] = cfg;
    var el = doc.createElement('section'); el.className = 'cmsp-karta cmsp-lista'; el.setAttribute('data-lista', cfg.id);
    el.setAttribute('aria-label', cfg.etykieta);
    kont.appendChild(el);
    rysujListe(cfg.id);
  }
  function elementy(cfg) { return getP(P.stan, cfg.sciezka) || []; }
  function synchronizujSzkic(cfg) { if (P.szkic) setP(P.szkic, cfg.sciezka, Rn.clone(getP(P.stan, cfg.sciezka))); }
  function rysujListe(id) {
    var cfg = LISTY[id], el = P.root.querySelector('[data-lista="' + id + '"]'); if (!el) return;
    var lis = elementy(cfg), today = dzis();
    var filtrHtml = '';
    if (cfg.czasowe) {
      var licz = { wszystkie: lis.length, aktywna: 0, zaplanowana: 0, zakonczona: 0, wstrzymana: 0 };
      lis.forEach(function (w) { licz[Rn.status(w, today)]++; });
      var F = [['wszystkie', 'Wszystkie'], ['aktywna', 'Aktywne'], ['zaplanowana', 'Zaplanowane'], ['zakonczona', 'Zakończone'], ['wstrzymana', 'Wstrzymane']];
      filtrHtml = '<div class="cmsp-filtry" role="group" aria-label="Filtruj wpisy">' + F.map(function (f) {
        return '<button type="button" data-akcja="filtr" data-filtr="' + f[0] + '" aria-pressed="' + (P.filtr === f[0]) + '">' + f[1] + ' <span>' + licz[f[0]] + '</span></button>';
      }).join('') + '</div>';
    }
    var widoczne = lis.map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return !cfg.czasowe || P.filtr === 'wszystkie' || Rn.status(o.x, today) === P.filtr; });
    var wiersze = widoczne.map(function (o) {
      var x = o.x, i = o.i, z = cfg.zdj ? cfg.zdj(x) : null, ukr = cfg.czasowe ? x.wstrzymana : x.ukryta;
      var status = cfg.czasowe ? Rn.status(x, today) : (ukr ? 'ukryta' : 'widoczna');
      var plak = { aktywna: ['Aktywna', 'ziel'], zaplanowana: ['Zaplanowana', 'zolt'], zakonczona: ['Zakończona', 'szar'], wstrzymana: ['Wstrzymana', 'szar'], ukryta: ['Ukryta', 'szar'], widoczna: ['Widoczna', 'ziel'] }[status];
      return '<li class="cmsp-wiersz' + (ukr || status === 'zakonczona' ? ' cmsp-wiersz--ukryty' : '') + '" data-i="' + i + '">' +
        '<div class="cmsp-kolej"><button type="button" data-akcja="gora" aria-label="Przesuń wyżej"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" data-akcja="dol" aria-label="Przesuń niżej"' + (i === lis.length - 1 ? ' disabled' : '') + '>▼</button></div>' +
        '<div class="cmsp-min">' + (z && z.src ? '<img src="' + esc(z.src) + '" alt="" loading="lazy">' : '<span>' + (i + 1) + '</span>') + '</div>' +
        '<div class="cmsp-wiersz-t"><strong>' + esc(cfg.tytul(x) || '(bez tytułu)') + '</strong><small>' + esc(cfg.podsum ? cfg.podsum(x) : '') + '</small></div>' +
        '<span class="cmsp-plak cmsp-plak--' + plak[1] + '">' + plak[0] + '</span>' +
        '<div class="cmsp-wiersz-akcje">' +
        (cfg.bezUkrywania || (cfg.staly && cfg.staly(x)) ? '' : '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--jasny" data-akcja="ukryj">' + (cfg.czasowe ? (ukr ? 'Wznów' : 'Wstrzymaj') : (ukr ? 'Pokaż' : 'Ukryj')) + '</button>') +
        '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--jasny" data-akcja="duplikuj">Duplikuj</button>' +
        '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="edytuj">Edytuj</button>' +
        (cfg.staly && cfg.staly(x) ? '<span class="cmsp-plak cmsp-plak--szar" title="To pole jest potrzebne do odpowiedzi na wiadomość">Pole stałe</span>' : '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--usun" data-akcja="usun">Usuń</button>') + '</div></li>';
    }).join('');
    el.innerHTML = '<div class="cmsp-lista-g"><div><h2>' + esc(cfg.etykieta) + ' <span class="cmsp-licz">' + lis.length + '</span></h2>' + (cfg.opis ? '<p class="cmsp-pomoc">' + esc(cfg.opis) + '</p>' : '') + '</div>' +
      '<button type="button" class="cmsp-btn cmsp-btn--glowny" data-akcja="dodaj">+ Dodaj ' + esc(cfg.nazwa) + '</button></div>' + filtrHtml +
      (wiersze ? '<ul class="cmsp-wiersze">' + wiersze + '</ul>' : '<p class="cmsp-pusto">' + (lis.length ? 'Brak pozycji w tym filtrze.' : 'Brak pozycji. Kliknij „+ Dodaj ' + esc(cfg.nazwa) + '”, aby dodać pierwszą.') + '</p>');
  }
  function akcjaListy(btn, akcja) {
    var el = btn.closest('[data-lista]'), cfg = LISTY[el.getAttribute('data-lista')], lis = elementy(cfg);
    var w = btn.closest('[data-i]'), i = w ? +w.getAttribute('data-i') : -1;
    if (akcja === 'dodaj') { modalElementu(cfg, -1); return; }
    if (akcja === 'edytuj') { modalElementu(cfg, i); return; }
    if (akcja === 'filtr') { P.filtr = btn.getAttribute('data-filtr'); rysujListe(cfg.id); return; }
    if (akcja === 'usun') {
      if (!btn.classList.contains('cmsp-pewno')) {
        btn.classList.add('cmsp-pewno'); btn.textContent = 'Na pewno?';
        setTimeout(function () { if (btn.isConnected) { btn.classList.remove('cmsp-pewno'); btn.textContent = 'Usuń'; } }, 3500);
        return;
      }
      lis.splice(i, 1); setP(P.stan, cfg.sciezka, lis); po('Usunięto.'); return;
    }
    if (akcja === 'gora' && i > 0) { lis.splice(i - 1, 0, lis.splice(i, 1)[0]); setP(P.stan, cfg.sciezka, lis); po('Zmieniono kolejność.', i - 1); return; }
    if (akcja === 'dol' && i < lis.length - 1) { lis.splice(i + 1, 0, lis.splice(i, 1)[0]); setP(P.stan, cfg.sciezka, lis); po('Zmieniono kolejność.', i + 1); return; }
    if (akcja === 'ukryj') {
      if (cfg.czasowe) { lis[i].wstrzymana = !lis[i].wstrzymana; po(lis[i].wstrzymana ? 'Wstrzymano — wpis zniknął ze strony.' : 'Wznowiono wpis.'); }
      else { lis[i].ukryta = !lis[i].ukryta; po(lis[i].ukryta ? 'Ukryto — element nie jest widoczny na stronie.' : 'Element jest znowu widoczny na stronie.'); }
      return;
    }
    if (akcja === 'duplikuj') {
      var kop = Rn.clone(lis[i]); kop.id = uid(cfg.prefiks); delete kop.staly;
      ['tytul', 'imie', 'podpis', 'nazwa'].forEach(function (k) { if (kop[k] && kop[k].pl) kop[k].pl += ' (kopia)'; });
      if (cfg.czasowe) kop.wstrzymana = true; else kop.ukryta = true;
      lis.splice(i + 1, 0, kop); setP(P.stan, cfg.sciezka, lis);
      po('Zduplikowano. Kopia jest ' + (cfg.czasowe ? 'wstrzymana' : 'ukryta') + ' — popraw ją i włącz.'); return;
    }
    function po(msg, fokusI) {
      synchronizujSzkic(cfg); zastosuj({ toast: msg }); rysujListe(cfg.id); if (cfg.poZmianie) cfg.poZmianie();
      if (fokusI != null) { var b = P.root.querySelector('[data-lista="' + cfg.id + '"] [data-i="' + fokusI + '"] [data-akcja="' + akcja + '"]'); if (b && !b.disabled) b.focus(); }
    }
  }

  /* ---------- okno edycji elementu listy: formularz + podgląd na żywo ---------- */
  function modalElementu(cfg, i) {
    var nowy = i < 0, lis = elementy(cfg);
    var item = nowy ? cfg.nowy() : Rn.clone(lis[i]);
    var wroc = doc.activeElement;
    function stanZElementem() {
      var s = Rn.clone(P.stan), l = getP(s, cfg.sciezka) || [];
      var podg = Rn.clone(item); delete podg.ukryta; if (cfg.czasowe) { podg.wstrzymana = false; if (podg.od > dzis()) podg.od = dzis(); podg.do = ''; }
      if (nowy) { if (cfg.naKoniec) l.push(podg); else l.unshift(podg); } else l[i] = podg;
      setP(s, cfg.sciezka, l); if (cfg.przygotujPodglad) cfg.przygotujPodglad(s);
      return s;
    }
    var tlo = doc.createElement('div'); tlo.className = 'cmsp-modal-tlo';
    var fid = 'm-' + cfg.id;
    tlo.innerHTML = '<div class="cmsp-modal" role="dialog" aria-modal="true" aria-labelledby="cmsp-modal-t">' +
      '<div class="cmsp-modal-g"><h2 id="cmsp-modal-t">' + (nowy ? 'Dodaj ' : 'Edytuj ') + esc(cfg.nazwa) + '</h2><button type="button" class="cmsp-x" data-m="anuluj" aria-label="Zamknij okno">×</button></div>' +
      '<div class="cmsp-modal-c"><div class="cmsp-modal-forma"><p class="cmsp-blad-modal" role="alert" hidden></p><div class="cmsp-modal-pola"></div></div>' +
      '<details class="cmsp-modal-podglad" open><summary>Podgląd na żywo — sekcja „' + esc(NAZWY_SEK[cfg.k]) + '”</summary>' + (cfg.czasowe ? '<p class="cmsp-pomoc">W podglądzie wpis jest pokazany tak, jakby był aktywny.</p>' : '') + mini(cfg.k, stanZElementem()) + '</details></div>' +
      '<div class="cmsp-modal-d">' + (nowy || (cfg.staly && cfg.staly(item)) ? '' : '<button type="button" class="cmsp-btn cmsp-btn--usun" data-m="usun">Usuń</button>') +
      '<span class="cmsp-odstep"></span><button type="button" class="cmsp-btn cmsp-btn--jasny" data-m="anuluj">Anuluj</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--glowny" data-m="zapisz">' + (nowy ? 'Dodaj' : 'Zapisz zmiany') + '</button></div></div>';
    P.root.appendChild(tlo);
    var polaEl = tlo.querySelector('.cmsp-modal-pola');
    function onZm(sc, v, przerysuj) { if (przerysuj) rysujPola(); odswiezMini(cfg.k, stanZElementem()); }
    function rysujPola() { polaEl.innerHTML = forma(fid, item, cfg.pola(item), onZm); }
    rysujPola(); skalujMini(tlo);
    if (window.innerWidth < 900) tlo.querySelector('.cmsp-modal-podglad').open = false;
    tlo.querySelector('.cmsp-modal-podglad').addEventListener('toggle', function () { skalujMini(tlo); });
    function zamknij() { tlo.remove(); delete FORMY[fid]; if (wroc && wroc.isConnected) wroc.focus(); }
    tlo.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); zamknij(); } pulapka(e, tlo.querySelector('.cmsp-modal')); });
    tlo.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) { if (e.target === tlo) zamknij(); return; }
      var m = b.getAttribute('data-m');
      if (m === 'anuluj') zamknij();
      if (m === 'usun') {
        if (!b.classList.contains('cmsp-pewno')) { b.classList.add('cmsp-pewno'); b.textContent = 'Na pewno?'; setTimeout(function () { if (b.isConnected) { b.classList.remove('cmsp-pewno'); b.textContent = 'Usuń'; } }, 3500); return; }
        lis.splice(i, 1); setP(P.stan, cfg.sciezka, lis); synchronizujSzkic(cfg); zamknij(); zastosuj({ toast: 'Usunięto.' }); rysujListe(cfg.id); if (cfg.poZmianie) cfg.poZmianie();
      }
      if (m === 'zapisz') {
        var bl = cfg.waliduj ? cfg.waliduj(item) : '';
        var be = tlo.querySelector('.cmsp-blad-modal');
        if (bl) { be.textContent = bl; be.hidden = false; be.scrollIntoView({ block: 'nearest' }); return; }
        if (nowy) { if (cfg.naKoniec) lis.push(item); else lis.unshift(item); } else lis[i] = item;
        setP(P.stan, cfg.sciezka, lis); synchronizujSzkic(cfg);
        zamknij();
        if (cfg.czasowe && nowy) P.filtr = 'wszystkie';
        zastosuj({ toast: nowy ? (cfg.czasowe && Rn.status(item, dzis()) !== 'aktywna' ? 'Dodano. Wpis pojawi się na stronie ' + krotkaData(item.od) + '.' : 'Dodano. Zmiana jest już na stronie.') : 'Zapisano zmiany.' });
        rysujListe(cfg.id); if (cfg.poZmianie) cfg.poZmianie();
      }
    });
    var pierwszy = polaEl.querySelector('input:not([type=file]),textarea,select'); if (pierwszy) pierwszy.focus();
  }

  /* ================= PODSTRONY PANELU ================= */
  var RYSUJ = {};

  /* ---------- Pulpit ---------- */
  RYSUJ.pulpit = function (kont) {
    var s = P.stan, today = dzis(), h = new Date().getHours();
    var powitanie = h < 5 ? 'Dobry wieczór!' : h < 18 ? 'Dzień dobry!' : 'Dobry wieczór!';
    var lista = s.aktualnosci.lista || [];
    var akt = lista.filter(function (w) { return Rn.status(w, today) === 'aktywna'; }).length;
    var zap = lista.filter(function (w) { return Rn.status(w, today) === 'zaplanowana'; }).length;
    var zdj = Rn.widoczne(s.portfolio.elementy).length, wszZdj = (s.portfolio.elementy || []).length;
    var widSek = A.SEKCJE.filter(function (x) { return Rn.sekWidoczna(s, x.k, today); }).length;
    var kafle = [
      { idz: 'aktualnosci', l: akt, n: 'Aktualności na stronie', d: zap ? '+ ' + zap + ' zaplanowane' : 'brak zaplanowanych', kl: akt ? 'ziel' : '' },
      { idz: 'portfolio', l: zdj, n: 'Zdjęcia i filmy w portfolio', d: wszZdj > zdj ? (wszZdj - zdj) + ' ukryte' : 'wszystkie widoczne' },
      { idz: 'kadra', l: Rn.widoczne(s.kadra.lista).length, n: 'Osoby w „Kto fotografuje”', d: (s.kadra.lista || []).length + ' w panelu' },
      { idz: 'historia', l: Rn.widoczne(s.historia.rozdzialy).length, n: 'Etapy osi czasu', d: s.historia.wariant === 'opowiesc' ? 'układ: opowieść' : 'układ: oś czasu' },
      { idz: 'formularz', l: '✉', n: 'Formularz kontaktowy', d: 'adres, na który przychodzą wiadomości' },
      { idz: 'sekcje', l: widSek + '/8', n: 'Widoczne sekcje', d: 'pokaż / ukryj sekcje' }
    ];
    kont.innerHTML =
      '<section class="cmsp-karta cmsp-powitanie"><h2>' + powitanie + '</h2><p>Co dziś zmieniamy na stronie?</p><div class="cmsp-szybkie">' +
      '<button type="button" class="cmsp-btn cmsp-btn--glowny" data-akcja="szybko" data-cel="aktualnosci">+ Aktualność</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--obrys" data-akcja="szybko" data-cel="portfolio">+ Zdjęcie do portfolio</button>' +
      '<button type="button" class="cmsp-btn cmsp-btn--obrys" data-idz="start">Pierwszy ekran</button></div></section>' +
      '<div id="cmsp-pulpit-braki">' + kartaBrakow() + '</div>' +
      '<div class="cmsp-kafle">' + kafle.map(function (k) {
        return '<button type="button" class="cmsp-kafel' + (k.kl ? ' cmsp-kafel--' + k.kl : '') + '" data-idz="' + k.idz + '"><span class="cmsp-kafel-l"' + '' + '>' + k.l + '</span><span class="cmsp-kafel-n">' + esc(k.n) + '</span><small>' + esc(k.d) + '</small></button>';
      }).join('') + '</div>' +
      '<section class="cmsp-karta"><h2>Harmonogram aktualności</h2><p class="cmsp-pomoc">30 dni wstecz i 90 dni naprzód. Pionowa linia to dzisiaj.</p>' + gantt(lista, today) + '</section>' +
      '<section class="cmsp-karta"><h2>Najbliższe 45 dni</h2>' + najblizsze(lista, today) + '</section>' +
      '<section class="cmsp-karta"><h2>Sekcje strony</h2><div class="cmsp-sekcje-siatka">' + A.SEKCJE.map(function (x) {
        var wid = Rn.sekWidoczna(s, x.k, today);
        return '<div class="cmsp-sek-kafel">' + mini(x.k, s, { male: true }) + '<div class="cmsp-sek-kafel-d"><strong>' + esc(NAZWY_SEK[x.k]) + '</strong><span class="cmsp-plak cmsp-plak--' + (wid ? 'ziel' : 'szar') + '">' + (wid ? 'Widoczna' : 'Ukryta') + '</span></div>' +
          '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-idz="' + x.k + '">Edytuj tę sekcję</button></div>';
      }).join('') + '</div></section>';
    skalujMini(kont);
    sprawdzFormularzSerwera(function () { var b = kont.querySelector('#cmsp-pulpit-braki'); if (b && P.strona === 'pulpit') b.innerHTML = kartaBrakow(); });
  };
  function gantt(lista, today) {
    var od = plusDni(today, -30), dni = 120;
    var pozycje = lista.filter(function (w) { return w.od || w.do; });
    if (!pozycje.length) return '<p class="cmsp-pusto">Brak wpisów z datami.</p>';
    var proc = function (iso) { return Math.max(0, Math.min(100, roznicaDni(od, iso) / dni * 100)); };
    var mies = '';
    for (var d = 0; d <= dni; d++) { var iso = plusDni(od, d); if (iso.slice(8) === '01') mies += '<span class="cmsp-g-mies" style="left:' + (d / dni * 100) + '%">' + Rn.dataPL(iso, 'pl').split(' ')[1] + '</span>'; }
    var wiersze = pozycje.map(function (w) {
      var st = Rn.status(w, today), a = proc(w.od || od), b = w.do ? proc(plusDni(w.do, 1)) : 100;
      var poza = (w.do && w.do < od) || (w.od && w.od > plusDni(od, dni));
      return '<div class="cmsp-g-w"><span class="cmsp-g-n" title="' + esc(t(w.tytul, 'pl')) + '">' + esc(t(w.tytul, 'pl')) + '</span><div class="cmsp-g-tor"><span class="cmsp-g-dz" style="left:' + proc(today) + '%"></span>' +
        (poza ? '<span class="cmsp-g-poza">poza zakresem</span>' : '<span class="cmsp-g-pas cmsp-g-pas--' + st + (w.do ? '' : ' cmsp-g-pas--bez') + '" style="left:' + a + '%;width:' + Math.max(1.2, b - a) + '%" title="' + krotkaData(w.od) + ' – ' + (w.do ? krotkaData(w.do) : 'bez końca') + '"></span>') +
        '</div></div>';
    }).join('');
    return '<div class="cmsp-gantt" role="img" aria-label="Harmonogram wpisów: ' + pozycje.length + ' pozycji"><div class="cmsp-g-skala"><span class="cmsp-g-n"></span><div class="cmsp-g-tor">' + mies + '<span class="cmsp-g-dz" style="left:' + proc(today) + '%"><span>dziś</span></span></div></div>' + wiersze + '</div>' +
      '<ul class="cmsp-legenda"><li><span class="cmsp-g-pas--aktywna"></span>aktywne</li><li><span class="cmsp-g-pas--zaplanowana"></span>zaplanowane</li><li><span class="cmsp-g-pas--zakonczona"></span>zakończone / wstrzymane</li></ul>';
  }
  function najblizsze(lista, today) {
    var kon = plusDni(today, 45), zd = [];
    lista.forEach(function (w) {
      if (w.wstrzymana) return;
      var n = t(w.tytul, 'pl');
      if (w.od && w.od > today && w.od <= kon) zd.push({ d: w.od, t: 'pojawi się na stronie: „' + n + '”', k: 'zolt' });
      if (w.do && w.do >= today && w.do <= kon) zd.push({ d: plusDni(w.do, 1), t: 'zniknie ze strony: „' + n + '”', k: 'szar' });
    });
    zd.sort(function (a, b) { return a.d.localeCompare(b.d); });
    if (!zd.length) return '<p class="cmsp-pusto">W ciągu 45 dni nic nie pojawi się ani nie zniknie automatycznie.</p>';
    return '<ul class="cmsp-terminy">' + zd.map(function (z) { return '<li><span class="cmsp-plak cmsp-plak--' + z.k + '">' + krotkaData(z.d).slice(0, -5) + '</span>' + esc(z.t) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- Sekcje strony ---------- */
  RYSUJ.sekcje = function (kont) {
    var s = P.stan, today = dzis();
    var ord = A.kolejnosc(s), ruchome = ord.length - 1;
    kont.innerHTML = '<section class="cmsp-karta"><p class="cmsp-pomoc">Strzałkami ▲▼ zmienisz kolejność sekcji w menu strony i na samej stronie. Pierwszy ekran jest zawsze na początku.</p><ul class="cmsp-sekcje">' + ord.map(function (x, i) {
      var sek = s.sekcje[x.k], wid = Rn.sekWidoczna(s, x.k, today);
      var kol = x.k === 'start' ? '<div class="cmsp-kolej cmsp-kolej--pusta" aria-hidden="true"></div>'
        : '<div class="cmsp-kolej"><button type="button" data-akcja="sek-gora" data-k="' + x.k + '" aria-label="Przesuń wyżej: ' + esc(NAZWY_SEK[x.k]) + '"' + (i <= 1 ? ' disabled' : '') + '>▲</button><button type="button" data-akcja="sek-dol" data-k="' + x.k + '" aria-label="Przesuń niżej: ' + esc(NAZWY_SEK[x.k]) + '"' + (i >= ruchome ? ' disabled' : '') + '>▼</button></div>';
      var uw = sek.widoczna && !wid ? ' (włączona, ale pusta — brak widocznych elementów)' : '';
      return '<li class="cmsp-sek-w"><div class="cmsp-sek-w-g">' + kol + mini(x.k, s, { male: true }) +
        '<div class="cmsp-sek-w-t"><strong>' + esc(NAZWY_SEK[x.k]) + '</strong><span class="cmsp-plak cmsp-plak--' + (wid ? 'ziel' : 'szar') + '">' + (wid ? 'Widoczna' : 'Ukryta') + uw + '</span>' +
        (sek.staly ? '<small>Sekcja stała — zawsze widoczna.</small>' : '<label class="cmsp-przel"><input type="checkbox" data-akcja="sek-wid" data-k="' + x.k + '"' + (sek.widoczna ? ' checked' : '') + '><span class="cmsp-przel-s" aria-hidden="true"></span><span>Pokazuj na stronie</span></label>') + '</div>' +
        '<div class="cmsp-sek-w-a"><button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-idz="' + x.k + '">Edytuj tę sekcję</button>' +
        (x.k !== 'start' ? '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--jasny" data-akcja="sek-rozwin" aria-expanded="false" aria-controls="cmsp-sr-' + x.k + '">Tytuł i wprowadzenie</button>' : '') + '</div></div>' +
        (x.k !== 'start' ? '<div class="cmsp-sek-w-r" id="cmsp-sr-' + x.k + '" hidden></div>' : '') + '</li>';
    }).join('') + '</ul></section>';
    skalujMini(kont);
  };
  function rozwinSekcje(btn) {
    var li = btn.closest('.cmsp-sek-w'), r = li.querySelector('.cmsp-sek-w-r'), k = r.id.replace('cmsp-sr-', '');
    var otw = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!otw)); r.hidden = otw;
    if (otw) return;
    var obj = Rn.clone(P.stan);
    r.innerHTML = forma('sek-' + k, obj, polaNaglowka(k, k === 'kadra' || k === 'instagram'), function () { }) +
      '<div class="cmsp-rzad-przyc"><button type="button" class="cmsp-btn cmsp-btn--glowny cmsp-btn--maly" data-akcja="sek-zapisz" data-k="' + k + '">Zapisz</button></div>';
    r.querySelector('input,textarea').focus();
  }

  /* ---------- Aktualności ---------- */
  RYSUJ.aktualnosci = function (kont, op) {
    kont.innerHTML = kartaPodgladu('aktualnosci', P.stan);
    skalujMini(kont);
    lista(kont, {
      id: 'aktualnosci', k: 'aktualnosci', sciezka: 'aktualnosci.lista', etykieta: 'Wpisy', nazwa: 'aktualność', prefiks: 'a', czasowe: true,
      opis: 'Na stronie widać tylko aktywne wpisy (maks. 6 najnowszych). Sekcja i pozycja w menu chowają się same, gdy nic nie jest aktywne.',
      tytul: function (x) { return t(x.tytul, 'pl'); },
      podsum: function (x) { return 'pokazuj od ' + krotkaData(x.od) + ' do ' + (x.do ? krotkaData(x.do) : 'bez końca') + (x.naPasku ? ' · na górnym pasku' : ''); },
      zdj: function (x) { return x.zdjecie; },
      nowy: function () { var d = dzis(); return { id: uid('a'), tytul: { pl: '' }, tresc: { pl: '' }, data: d, od: d, do: plusDni(d, 14), wstrzymana: false, naPasku: false, zdjecie: null }; },
      pola: function (x) {
        var f = 'aktualnosci:' + x.id;
        return [
          { k: 'tytul', typ: 'tekst', i18n: true, et: 'Tytuł wpisu', wym: true, max: 110, f: f + ':tytul' },
          { k: 'tresc', typ: 'obszar', i18n: true, et: 'Treść', wiersze: 6, f: f + ':tresc', pomoc: 'Formatowanie: *kursywa*, **pogrubienie**, pusta linia = nowy akapit.' },
          { k: 'data', typ: 'data', et: 'Data wpisu (widoczna przy tytule)', szer: 'tr', f: f + ':data' },
          { k: 'od', typ: 'data', et: 'Pokazuj od', szer: 'tr', wym: true },
          { k: 'do', typ: 'data', et: 'Pokazuj do (puste = bez końca)', szer: 'tr' },
          { k: 'naPasku', typ: 'tak', et: 'Pokaż też na górnym pasku komunikatów' },
          { k: 'wstrzymana', typ: 'tak', et: 'Wstrzymaj (wpis nie pokazuje się na stronie)' },
          { k: 'zdjecie', typ: 'zdjecie', et: 'Zdjęcie (opcjonalnie)', f: f + ':zdjecie' }
        ];
      },
      waliduj: function (x) {
        if (!t(x.tytul, 'pl').trim()) return 'Proszę wpisać tytuł wpisu.';
        if (!x.od) return 'Proszę ustawić datę „Pokazuj od”.';
        if (x.do && x.do < x.od) return 'Data „Pokazuj do” nie może być wcześniejsza niż „Pokazuj od”.';
        return '';
      },
      poZmianie: function () { odswiezMini('aktualnosci', P.stan); }
    });
    if (op.dodaj) modalElementu(LISTY.aktualnosci, -1);
  };

  /* ---------- Pierwszy ekran ---------- */
  RYSUJ.start = function (kont) {
    edytorStrony(kont, 'start', function (s) {
      var opcje = A.SEKCJE.filter(function (x) { return x.k !== 'start'; }).map(function (x) { return { v: x.k, n: NAZWY_SEK[x.k] }; });
      return [
        { naglowek: 'Teksty pierwszego ekranu', opis: 'Nagłówek H1 strony składa się z imienia i nazwiska oraz podpisu — to najważniejszy tekst dla Google.' },
        { k: 'start.nazwa', typ: 'tekst', i18n: true, et: 'Imię i nazwisko (duży napis)', wym: true, max: 40, f: 'start.nazwa' },
        { k: 'start.rola', typ: 'tekst', i18n: true, et: 'Podpis — zawód i obszar (np. Fotograf · Zgorzelec i Dolny Śląsk)', max: 70, f: 'start.rola' },
        { k: 'start.motto', typ: 'tekst', i18n: true, et: 'Myśl przewodnia', max: 70, f: 'start.motto' },
        { k: 'start.wstep', typ: 'obszar', i18n: true, et: 'Krótkie wprowadzenie (1–2 zdania)', wiersze: 2, f: 'start.wstep' },
        { k: 'start.przycisk', typ: 'tekst', i18n: true, et: 'Napis na przycisku', max: 30, szer: 'pol', f: 'start.przycisk' },
        { k: 'start.przyciskCel', typ: 'wybor', et: 'Przycisk prowadzi do sekcji', opcje: opcje, szer: 'pol', f: 'start.przycisk' }
      ].concat(polaTla('start', s));
    }, { waliduj: function (s) { return t(s.start.nazwa, 'pl').trim() ? '' : 'Imię i nazwisko nie może być puste.'; } });
  };

  /* ---------- O mnie ---------- */
  RYSUJ.oMnie = function (kont) {
    edytorStrony(kont, 'oMnie', function (s) {
      return polaNaglowka('oMnie').concat([
        { naglowek: 'Treść' },
        { k: 'oMnie.lead', typ: 'obszar', i18n: true, et: 'Krótki tekst na ekranie (misja)', wiersze: 3, f: 'oMnie.lead', pomoc: 'W układzie pełnoekranowym na ekranie jest mało tekstu — dłuższy opis trafia do okna „Czytaj więcej”.' },
        { k: 'oMnie.tresc', typ: 'obszar', i18n: true, et: 'Pełny tekst w oknie „Czytaj więcej o mnie”', wiersze: 10, f: 'oMnie.tresc', pomoc: 'Formatowanie: *kursywa*, **pogrubienie**, pusta linia = nowy akapit.' },
        { k: 'oMnie.zdjecie', typ: 'zdjecie', et: 'Zdjęcie portretowe (pion, ok. 4:5)', f: 'oMnie.zdjecie' }
      ]).concat(polaTla('oMnie', s));
    });
    lista(kont, {
      id: 'wartosci', k: 'oMnie', sciezka: 'oMnie.wartosci', etykieta: 'Wartości', nazwa: 'wartość', prefiks: 'w',
      opis: 'Krótkie hasła z opisem — pokazują, czym kieruje się pracownia.',
      tytul: function (x) { return t(x.tytul, 'pl'); }, podsum: function (x) { return Rn.skrot(t(x.opis, 'pl'), 70); },
      nowy: function () { return { id: uid('w'), tytul: { pl: '' }, opis: { pl: '' } }; },
      pola: function (x) { return [{ k: 'tytul', typ: 'tekst', i18n: true, et: 'Wartość', wym: true, max: 50, f: 'oMnie:' + x.id + ':tytul' }, { k: 'opis', typ: 'obszar', i18n: true, et: 'Krótki opis', wiersze: 2, f: 'oMnie:' + x.id + ':opis' }]; },
      waliduj: function (x) { return t(x.tytul, 'pl').trim() ? '' : 'Proszę wpisać nazwę wartości.'; },
      poZmianie: function () { odswiezMini('oMnie', P.szkic || P.stan); }
    });
    lista(kont, {
      id: 'obszary', k: 'oMnie', sciezka: 'oMnie.obszary', etykieta: 'Rodzaje sesji („Fotografuję:”)', nazwa: 'rodzaj sesji', prefiks: 'o',
      tytul: function (x) { return t(x.nazwa, 'pl'); },
      nowy: function () { return { id: uid('o'), nazwa: { pl: '' } }; },
      pola: function () { return [{ k: 'nazwa', typ: 'tekst', i18n: true, et: 'Nazwa (np. Sesje rodzinne)', wym: true, max: 40, f: 'oMnie.obszary' }]; },
      waliduj: function (x) { return t(x.nazwa, 'pl').trim() ? '' : 'Proszę wpisać nazwę.'; },
      poZmianie: function () { odswiezMini('oMnie', P.szkic || P.stan); }
    });
  };

  /* ---------- Historia ---------- */
  RYSUJ.historia = function (kont) {
    edytorStrony(kont, 'historia', function (s) {
      var op = s.historia.wariant === 'opowiesc';
      var pola = [
        { naglowek: 'Układ sekcji', opis: 'Wybierz, jak ma wyglądać Historia. Można przełączać w dowolnej chwili — treści obu układów są zapamiętywane osobno.' },
        { k: 'historia.wariant', typ: 'radio', et: 'Układ', przerysuj: true, f: 'historia', opcje: [
          { v: 'os', n: 'Oś czasu — etapy (rok lub data, krótki opis, opis wydarzenia) przewijane w poziomie' },
          { v: 'opowiesc', n: 'Opowieść — jedno duże zdjęcie i historia obok' }] }
      ].concat(polaNaglowka('historia'));
      if (op) pola = pola.concat([
        { naglowek: 'Opowieść' },
        { k: 'historia.opowiesc.zdjecie', typ: 'zdjecie', et: 'Duże zdjęcie (najlepiej pionowe lub kwadratowe)', f: 'historia.opowiesc.zdjecie' },
        { k: 'historia.opowiesc.tresc', typ: 'obszar', i18n: true, et: 'Treść historii', wiersze: 10, f: 'historia.opowiesc.tresc',
          pomoc: 'Pusta linia = nowy akapit, *kursywa*, **pogrubienie**. Jeśli tekst nie zmieści się na ekranie, strona sama go skróci i doda przycisk „Czytaj całą historię”.' }
      ]);
      return pola.concat(polaTla('historia', s));
    });
    lista(kont, {
      id: 'rozdzialy', k: 'historia', sciezka: 'historia.rozdzialy', etykieta: 'Etapy osi czasu', nazwa: 'etap', prefiks: 'h',
      opis: 'Używane w układzie „Oś czasu”. Kolejność na liście = kolejność na osi (od lewej). Przy większej liczbie etapów oś przewija się w poziomie.',
      tytul: function (x) { return (t(x.rok, 'pl') || '—') + (t(x.tytul, 'pl') ? ' — ' + t(x.tytul, 'pl') : ''); }, podsum: function (x) { return Rn.skrot(t(x.tresc, 'pl'), 80); },
      zdj: function (x) { return x.tlo; },
      nowy: function () { return { id: uid('h'), rok: { pl: '' }, tytul: { pl: '' }, krotki: true, tresc: { pl: '' }, tlo: null }; },
      pola: function (x) {
        var f = 'historia:' + x.id;
        return [
          { k: 'rok', typ: 'tekst', i18n: true, et: 'Rok lub data (np. 2021, maj 2021, 12.06.2021, Dziś)', wym: true, max: 24, szer: 'pol', f: f + ':rok' },
          { k: 'krotki', typ: 'tak', et: 'Pokaż krótki opis', przerysuj: true, f: f + ':tytul' },
          { k: 'tytul', typ: 'tekst', i18n: true, et: 'Krótki opis (np. Własna działalność fotograficzna)', max: 80, f: f + ':tytul', gdy: function (o) { return o.krotki !== false; } },
          { k: 'tresc', typ: 'obszar', i18n: true, et: 'Co się wtedy wydarzyło', wiersze: 5, f: f + ':tresc', pomoc: 'Dłuższy tekst (ponad ok. 220 znaków) na osi jest skracany — całość otwiera się w okienku „Czytaj więcej”.' },
          { k: 'tlo', typ: 'zdjecie', et: 'Zdjęcie na karcie (opcjonalnie, poziome)', f: f + ':tlo' }
        ];
      },
      waliduj: function (x) {
        if (!t(x.rok, 'pl').trim()) return 'Proszę wpisać rok lub datę.';
        return t(x.tresc, 'pl').trim() || (x.krotki !== false && t(x.tytul, 'pl').trim()) ? '' : 'Proszę wpisać, co się wtedy wydarzyło.';
      },
      poZmianie: function () { odswiezMini('historia', P.szkic || P.stan); }
    });
  };

  /* ---------- Kto fotografuje (kadra) ---------- */
  RYSUJ.kadra = function (kont) {
    edytorStrony(kont, 'kadra', function (s) { return polaNaglowka('kadra', true).concat(polaTla('kadra', s)); });
    lista(kont, {
      id: 'kadra', k: 'kadra', sciezka: 'kadra.lista', etykieta: 'Osoby', nazwa: 'osobę', prefiks: 'k',
      tytul: function (x) { return t(x.imie, 'pl'); }, podsum: function (x) { return t(x.rola, 'pl'); }, zdj: function (x) { return x.zdjecie; },
      nowy: function () { return { id: uid('k'), imie: { pl: '' }, rola: { pl: '' }, opis: { pl: '' }, zdjecie: null, ukryta: false }; },
      pola: function (x) {
        var f = 'kadra:' + x.id;
        return [
          { k: 'imie', typ: 'tekst', i18n: true, et: 'Imię i nazwisko', wym: true, max: 60, f: f + ':imie' },
          { k: 'rola', typ: 'tekst', i18n: true, et: 'Rola (np. Drugi fotograf przy reportażach ślubnych)', max: 80, f: f + ':rola' },
          { k: 'opis', typ: 'obszar', i18n: true, et: 'Opis', wiersze: 5, f: f + ':opis' },
          { k: 'zdjecie', typ: 'zdjecie', et: 'Zdjęcie (pion, ok. 4:5)', f: f + ':zdjecie' }
        ];
      },
      waliduj: function (x) { return t(x.imie, 'pl').trim() ? '' : 'Proszę wpisać imię i nazwisko.'; },
      poZmianie: function () { odswiezMini('kadra', P.szkic || P.stan); }
    });
  };

  /* ---------- Portfolio ---------- */
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid('kat'); }
  RYSUJ.portfolio = function (kont, op) {
    edytorStrony(kont, 'portfolio', function (s) { return polaNaglowka('portfolio').concat(polaTla('portfolio', s)); });
    lista(kont, {
      id: 'portfolio', k: 'portfolio', sciezka: 'portfolio.elementy', etykieta: 'Zdjęcia i filmy', nazwa: 'zdjęcie lub film', prefiks: 'g',
      opis: 'Kolejność na liście = kolejność w sliderze. Zdjęcia dzieci publikuj tylko za zgodą rodziców (można użyć ujęć bez twarzy).',
      tytul: function (x) { return t(x.podpis, 'pl') || t(x.zdjecie && x.zdjecie.alt, 'pl'); },
      podsum: function (x) { var k = (P.stan.portfolio.kategorie || []).filter(function (c) { return c.id === x.kategoria; })[0]; return (x.typ === 'wideo' ? 'Wideo' : 'Zdjęcie') + ' · ' + (k ? t(k.nazwa, 'pl') : 'bez kategorii'); },
      zdj: function (x) { return x.zdjecie; },
      nowy: function () { return { id: uid('g'), typ: 'zdjecie', kategoria: ((P.stan.portfolio.kategorie || [])[0] || {}).id || '', podpis: { pl: '' }, zdjecie: null, wideo: '', ukryta: false }; },
      pola: function (x) {
        var f = 'portfolio:' + x.id, kat = (P.stan.portfolio.kategorie || []).map(function (c) { return { v: c.id, n: t(c.nazwa, 'pl') }; });
        var a = [
          { k: 'typ', typ: 'radio', et: 'Rodzaj', opcje: [{ v: 'zdjecie', n: 'Zdjęcie' }, { v: 'wideo', n: 'Wideo (YouTube lub MP4)' }], przerysuj: true },
          { k: 'zdjecie', typ: 'zdjecie', et: x.typ === 'wideo' ? 'Okładka wideo (zalecana)' : 'Zdjęcie', wym: x.typ !== 'wideo', f: f + ':zdjecie' }
        ];
        if (x.typ === 'wideo') a.push({ k: 'wideo', typ: 'url', et: 'Adres filmu (YouTube lub plik MP4)', wym: true, ph: 'https://www.youtube.com/watch?v=…', pomoc: 'Film z YouTube ładuje się dopiero po kliknięciu (tryb prywatności youtube-nocookie).' });
        a.push({ k: 'podpis', typ: 'tekst', i18n: true, et: 'Podpis pod zdjęciem', max: 90, f: f + ':podpis' });
        a.push({ k: 'kategoria', typ: 'wybor', et: 'Rodzaj sesji (filtr galerii)', opcje: [{ v: '', n: '— bez kategorii —' }].concat(kat) });
        return a;
      },
      waliduj: function (x) {
        if (x.typ === 'wideo') { if (!x.wideo || !/^https?:\/\//.test(x.wideo)) return 'Proszę podać adres filmu (zaczynający się od https://).'; return ''; }
        return x.zdjecie && x.zdjecie.src ? '' : 'Zdjęcie jest wymagane — wgraj je z dysku lub podaj adres.';
      },
      poZmianie: function () { odswiezMini('portfolio', P.szkic || P.stan); }
    });
    lista(kont, {
      id: 'kategorie', k: 'portfolio', sciezka: 'portfolio.kategorie', etykieta: 'Rodzaje sesji (filtry galerii)', nazwa: 'kategorię', prefiks: 'c', bezUkrywania: true,
      opis: 'Filtry nad galerią pokazują się tylko dla kategorii, które mają widoczne zdjęcia. Służą też jako lista wyboru w formularzu kontaktowym.',
      tytul: function (x) { return t(x.nazwa, 'pl'); }, podsum: function (x) { var n = (P.stan.portfolio.elementy || []).filter(function (e) { return e.kategoria === x.id; }).length; return n + ' w galerii'; },
      nowy: function () { return { id: '', nazwa: { pl: '' } }; },
      pola: function () { return [{ k: 'nazwa', typ: 'tekst', i18n: true, et: 'Nazwa (np. Chrzest)', wym: true, max: 30 }]; },
      waliduj: function (x) { if (!t(x.nazwa, 'pl').trim()) return 'Proszę wpisać nazwę kategorii.'; if (!x.id) x.id = slug(t(x.nazwa, 'pl')); return ''; },
      poZmianie: function () { odswiezMini('portfolio', P.szkic || P.stan); }
    });
    if (op.dodaj) modalElementu(LISTY.portfolio, -1);
  };

  /* ---------- Instagram ---------- */
  RYSUJ.instagram = function (kont) {
    var info = '<section class="cmsp-karta cmsp-info" id="cmsp-ig-stan"><p>Sprawdzanie połączenia z Instagramem…</p></section>';
    edytorStrony(kont, 'instagram', function (s) {
      var posty = s.instagram.posty !== false;
      var p = [
        { naglowek: 'Co pokazywać' },
        { k: 'instagram.posty', typ: 'tak', et: 'Pokazuj posty (zdjęcia) z Instagrama', przerysuj: true, f: 'instagram',
          pomoc: posty ? 'Wyłącz, jeśli konto nie jest profesjonalne — sekcja zamieni się w zaproszenie do odwiedzenia profilu.' : 'Wyłączone: sekcja zaprasza do odwiedzenia profilu — tekst, lista, okrągły znak z aparatem i karta profilu ze zdjęciami z Twojego portfolio. Kliknięcie w znak lub kartę otwiera Instagram.' },
        { k: 'kontakt.instagram', typ: 'url', et: 'Adres profilu na Instagramie', f: 'kontakt.instagram' }
      ];
      if (posty) p = p.concat([
        { k: 'instagram.tryb', typ: 'radio', et: 'Skąd brać zdjęcia', opcje: [{ v: 'auto', n: 'Automatycznie — najnowsze posty (wymaga konta profesjonalnego i tokenu)' }, { v: 'reczny', n: 'Ręcznie — wybrane zdjęcia z listy poniżej' }] },
        { k: 'instagram.liczba', typ: 'liczba', et: 'Liczba zdjęć', min: 3, max: 12, szer: 'tr' }
      ]);
      else p = p.concat([
        { naglowek: 'Zaproszenie do profilu' },
        { k: 'instagram.zaproszenie.tekst', typ: 'obszar', i18n: true, et: 'Tekst zachęty', wiersze: 3, f: 'instagram.zaproszenie.tekst', pomoc: 'Formatowanie: *kursywa* (kolor akcentu), **pogrubienie**.' },
        { k: 'instagram.zaproszenie.punkty', typ: 'obszar', i18n: true, et: 'Co znajdziesz na profilu — jeden punkt w linii (puste = bez listy)', wiersze: 3, f: 'instagram.zaproszenie.punkty' },
        { k: 'instagram.zaproszenie.karta', typ: 'tak', et: 'Karta profilu ze zdjęciami z portfolio (pierwsze 6 widocznych zdjęć z Portfolio)', f: 'instagram.zaproszenie.karta' }
      ]);
      return polaNaglowka('instagram', true).concat(p).concat(polaTla('instagram', s));
    }, { przed: info });
    lista(kont, {
      id: 'igr', k: 'instagram', sciezka: 'instagram.reczne', etykieta: 'Zdjęcia wybrane ręcznie', nazwa: 'zdjęcie', prefiks: 'i',
      opis: 'Używane w trybie „Ręcznie” oraz gdy automatyczne pobieranie nie jest skonfigurowane.',
      tytul: function (x) { return t(x.podpis, 'pl') || 'Zdjęcie z Instagrama'; }, podsum: function (x) { return x.link || ''; }, zdj: function (x) { return x.zdjecie; },
      nowy: function () { return { id: uid('i'), zdjecie: null, link: '', podpis: { pl: '' }, ukryta: false }; },
      pola: function () { return [{ k: 'zdjecie', typ: 'zdjecie', et: 'Zdjęcie (kwadrat)', wym: true }, { k: 'link', typ: 'url', et: 'Link do posta na Instagramie', ph: 'https://www.instagram.com/p/…' }, { k: 'podpis', typ: 'tekst', i18n: true, et: 'Krótki opis (dla czytników ekranu)', max: 90 }]; },
      waliduj: function (x) { return x.zdjecie && x.zdjecie.src ? '' : 'Zdjęcie jest wymagane.'; },
      przygotujPodglad: function (s) { s.instagram.tryb = 'reczny'; },
      poZmianie: function () { odswiezMini('instagram', P.szkic || P.stan); }
    });
    var box = kont.querySelector('#cmsp-ig-stan');
    if (P.stan.instagram.posty === false) { box.innerHTML = '<p><span class="cmsp-plak cmsp-plak--szar">Posty wyłączone</span> Sekcja zaprasza do odwiedzenia profilu na Instagramie. Lista „Zdjęcia wybrane ręcznie” poniżej jest używana tylko przy włączonych postach.</p>'; }
    else if (P.demo) { box.innerHTML = '<p><strong>Tryb demonstracyjny</strong> — automatyczne pobieranie zdjęć z Instagrama działa po wdrożeniu na serwer.</p>'; return; }
    api('GET', '/instagram?status=1').then(function (r) {
      box.innerHTML = r.skonfigurowany
        ? '<p><span class="cmsp-plak cmsp-plak--ziel">Połączono</span> Automatyczne pobieranie działa' + (r.posty ? ' — ostatnio pobrano ' + r.posty + ' postów' : '') + '. Token odnawia się sam.</p>'
        : '<p><span class="cmsp-plak cmsp-plak--zolt">Nie skonfigurowano</span> Aby zdjęcia pobierały się same, w Cloudflare dodaj zmienną <code>INSTAGRAM_TOKEN</code> (instrukcja w pliku README). Do tego czasu możesz dodać zdjęcia ręcznie poniżej.</p>';
    }).catch(function () { box.innerHTML = '<p>Nie udało się sprawdzić połączenia z Instagramem.</p>'; });
  };

  /* ---------- Kontakt i stopka ---------- */
  RYSUJ.kontakt = function (kont) {
    edytorStrony(kont, 'kontakt', function (s) {
      return polaNaglowka('kontakt').concat([
        { naglowek: 'Kontakt', opis: 'Zmiany od razu aktualizują wszystkie przyciski kontaktu, stopkę i link do Map Google.' },
        { k: 'kontakt.messenger', typ: 'url', et: 'Link do Messengera (np. https://m.me/nazwa.profilu)', f: 'kontakt.messenger', pomoc: 'Gdy puste — przycisk „Napisz na Messengerze” prowadzi do profilu na Facebooku.' },
        { k: 'kontakt.facebook', typ: 'url', et: 'Profil na Facebooku', szer: 'pol', f: 'kontakt.facebook' },
        { k: 'kontakt.instagram', typ: 'url', et: 'Profil na Instagramie', szer: 'pol', f: 'kontakt.instagram' },
        { k: 'kontakt.telefon', typ: 'tekst', et: 'Telefon', szer: 'pol', f: 'kontakt.telefon' },
        { k: 'kontakt.telefonWidoczny', typ: 'tak', et: 'Pokazuj telefon na stronie', szer: 'pol' },
        { k: 'kontakt.email', typ: 'email', et: 'E-mail', szer: 'pol', f: 'kontakt.email' },
        { k: 'kontakt.emailWidoczny', typ: 'tak', et: 'Pokazuj e-mail na stronie', szer: 'pol' },
        { naglowek: 'Formularz kontaktowy', opis: 'Adres e-mail, na który przychodzą wiadomości, i tekst nad formularzem ustawiasz w zakładce „Formularz kontaktowy”. Pola formularza — na dole tej strony.' },
        { naglowek: 'Obszar działania i Google' },
        { k: 'kontakt.obszar', typ: 'obszar', i18n: true, et: 'Opis obszaru działania', wiersze: 2, f: 'kontakt.obszar' },
        { k: 'kontakt.miasta', typ: 'tekst', et: 'Miasta (po przecinku — trafiają też do danych dla Google)', f: 'kontakt.miasta' },
        { k: 'kontakt.mapa', typ: 'tekst', et: 'Miejsce pokazywane na mapie', szer: 'pol' },
        { k: 'kontakt.profilGoogle', typ: 'url', et: 'Link do Profilu Firmy w Google (Mapy)', szer: 'pol', f: 'kontakt.profilGoogle', ph: '[LINK DO UZUPEŁNIENIA]' },
        { k: 'kontakt.opinieGoogle', typ: 'url', et: 'Link do opinii w Google', f: 'kontakt.opinieGoogle', ph: '[LINK DO UZUPEŁNIENIA]', pomoc: 'Gdy uzupełnione — w sekcji Kontakt pojawi się link „Opinie o mojej pracy w Google”.' },
        { naglowek: 'Dane działalności (stopka)' },
        { k: 'kontakt.nazwaRejestrowa', typ: 'tekst', et: 'Nazwa działalności', szer: 'pol' },
        { k: 'kontakt.nip', typ: 'tekst', et: 'NIP', szer: 'cw', ph: '[DO UZUPEŁNIENIA]' },
        { k: 'kontakt.regon', typ: 'tekst', et: 'REGON (opcjonalnie)', szer: 'cw' },
        { k: 'kontakt.krs', typ: 'tekst', et: 'KRS (jeśli dotyczy)', szer: 'cw', pomoc: 'Jednoosobowa działalność zwykle nie ma KRS — pole można zostawić puste.' },
        { k: 'stopka.haslo', typ: 'tekst', i18n: true, et: 'Hasło w stopce', max: 80, f: 'stopka.haslo' }
      ]).concat(polaTla('kontakt', s));
    }, {
      waliduj: function (s) {
        var k = s.kontakt;
        if (k.emailWidoczny && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k.email || '')) return 'Adres e-mail jest niepoprawny.';
        if (k.telefonWidoczny && !/\d{9}/.test(String(k.telefon).replace(/\D/g, ''))) return 'Numer telefonu jest niepoprawny (9 cyfr).';
        return '';
      }
    });
    listaPolFormularza(kont);
  };

  var TYPY_POLA = [{ v: 'tekst', n: 'Krótki tekst' }, { v: 'obszar', n: 'Dłuższy tekst (wiadomość)' }, { v: 'email', n: 'Adres e-mail' }, { v: 'telefon', n: 'Telefon' },
    { v: 'data', n: 'Data' }, { v: 'wybor', n: 'Lista wyboru' }, { v: 'tak', n: 'Pole do zaznaczenia (tak/nie)' }];
  function listaPolFormularza(kont) {
    lista(kont, {
      id: 'polaform', k: 'kontakt', sciezka: 'kontakt.pola', etykieta: 'Pola formularza', nazwa: 'pole', prefiks: 'p', naKoniec: true,
      opis: 'Pola w oknie „Formularz kontaktowy”. Kolejność na liście = kolejność w formularzu. Zgoda na przetwarzanie danych (RODO) jest dodawana zawsze, na końcu.',
      staly: function (x) { return !!x.staly; },
      tytul: function (x) { return t(x.etykieta, 'pl') || '(bez nazwy)'; },
      podsum: function (x) { var ty = TYPY_POLA.filter(function (q) { return q.v === x.typ; })[0]; return (ty ? ty.n : x.typ) + (x.wym ? ' · wymagane' : ' · opcjonalne') + (x.szer === 'pelna' || x.typ === 'obszar' ? ' · cała szerokość' : ' · pół szerokości'); },
      nowy: function () { return { id: '', typ: 'tekst', etykieta: { pl: '' }, wym: false, szer: 'pol', podpowiedz: { pl: '' }, zrodlo: 'wlasne', opcje: { pl: '' }, ukryta: false }; },
      pola: function (x) {
        var f = 'pole:' + (x.id || 'nowe');
        var a = [{ k: 'etykieta', typ: 'tekst', i18n: true, et: 'Nazwa pola (widoczna nad polem)', wym: true, max: 80, f: f }];
        if (x.staly) a.push({ naglowek: 'Pole stałe', opis: 'Imię i e-mail są potrzebne, żeby można było odpowiedzieć na wiadomość — można zmienić ich nazwę i szerokość, ale nie typ ani usunąć.' });
        else a.push({ k: 'typ', typ: 'wybor', et: 'Rodzaj pola', opcje: TYPY_POLA, przerysuj: true, f: f });
        if (x.typ === 'wybor') {
          a.push({ k: 'zrodlo', typ: 'radio', et: 'Opcje do wyboru', opcje: [{ v: 'kategorie', n: 'Rodzaje sesji z portfolio (+ „Inne”)' }, { v: 'wlasne', n: 'Własna lista' }], przerysuj: true, f: f });
          if (x.zrodlo !== 'kategorie') a.push({ k: 'opcje', typ: 'obszar', i18n: true, et: 'Własne opcje — każda w osobnej linii', wiersze: 5, wym: true, f: f });
        }
        if (x.typ !== 'tak' && x.typ !== 'wybor') a.push({ k: 'podpowiedz', typ: 'tekst', i18n: true, et: 'Podpowiedź w pustym polu (opcjonalnie)', max: 80, f: f });
        if (!x.staly || x.id === 'imie') a.push({ k: 'wym', typ: 'tak', et: 'Pole wymagane', f: f });
        if (x.typ !== 'obszar' && x.typ !== 'tak') a.push({ k: 'szer', typ: 'radio', et: 'Szerokość (na komputerze)', opcje: [{ v: 'pol', n: 'Pół szerokości' }, { v: 'pelna', n: 'Cała szerokość' }], f: f });
        return a;
      },
      waliduj: function (x) {
        if (!t(x.etykieta, 'pl').trim()) return 'Proszę wpisać nazwę pola.';
        if (x.typ === 'wybor' && x.zrodlo !== 'kategorie' && !String(t(x.opcje, 'pl')).trim()) return 'Proszę wpisać przynajmniej jedną opcję listy.';
        if (!x.id) {
          var baza = String(t(x.etykieta, 'pl')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'pole';
          var id = baza, n = 2, ist = (P.stan.kontakt.pola || []).map(function (p) { return p.id; });
          while (ist.indexOf(id) >= 0 || id === 'zgoda' || id === 'www') id = baza + '-' + (n++);
          x.id = id;
        }
        return '';
      },
      poZmianie: function () { odswiezMini('kontakt', P.szkic || P.stan); }
    });
  }

  /* ---------- Formularz kontaktowy: treść, pola, adres odbiorcy i skrzynka wysyłająca ---------- */
  RYSUJ.formularz = function (kont) {
    var karta = '<div id="cmsp-form-karty"><section class="cmsp-karta"><p class="cmsp-pusto">Wczytywanie…</p></section></div>';
    edytorStrony(kont, 'kontakt', function () {
      return [
        { naglowek: 'Formularz na stronie', opis: 'Wiadomości wysłane przez klientów formularzem na stronie trafiają na jeden adres e-mail (ustawiasz go wyżej). Zabezpieczenia formularza (sprawdzanie e-maila i telefonu, ochrona przed spamem i botami, limit wiadomości) działają zawsze.' },
        { k: 'kontakt.formularz', typ: 'tak', et: 'Pokazuj formularz kontaktowy na stronie' },
        { k: 'kontakt.zachetaFormularza', typ: 'obszar', i18n: true, et: 'Treść wstępna (tekst nad polami formularza)', wiersze: 3, f: 'kontakt.zachetaFormularza', pomoc: 'Formatowanie: *kursywa*, **pogrubienie**. Puste = bez tekstu wstępnego.' }
      ];
    }, { przed: karta });
    if (P.demo) { kont.querySelector('#cmsp-form-karty').innerHTML = '<section class="cmsp-karta"><p class="cmsp-pusto">Tryb demonstracyjny — adres odbiorcy ustawia się po wdrożeniu strony na serwer.</p></section>'; return; }
    rysujKartyFormularza(kont.querySelector('#cmsp-form-karty'));
  };
  function rysujKartyFormularza(box) {
    api('GET', '/formularz').then(function (d) {
      if (!d._ok) { box.innerHTML = '<section class="cmsp-karta"><p class="cmsp-pusto">' + esc(d.blad || 'Nie udało się wczytać ustawień.') + '</p></section>'; return; }
      var info = !d.email ? '' : d.serwer ? '<p class="cmsp-status cmsp-status--ziel" role="status">Wiadomości z formularza przychodzą na: <strong>' + esc(d.email) + '</strong></p>'
        : '<p class="cmsp-status cmsp-status--czer" role="status">Adres jest zapisany, ale wysyłka nie jest jeszcze włączona po stronie serwera (jednorazowe ustawienie wykonawcy strony). Do tego czasu formularz prosi klientów o kontakt przez Messengera.</p>';
      box.innerHTML = '<section class="cmsp-karta cmsp-waska"><h2>Adres, na który przychodzą wiadomości z formularza</h2>' + info +
        '<form id="cmsp-f-mail" novalidate><div class="cmsp-pole"><label class="cmsp-et" for="cmsp-mail">Twój adres e-mail</label>' +
        '<input id="cmsp-mail" type="email" autocomplete="email" value="' + esc(d.email || '') + '" required aria-describedby="cmsp-mail-p">' +
        '<p class="cmsp-pomoc" id="cmsp-mail-p">Możesz go zmienić w każdej chwili — kolejne wiadomości trafią już na nowy adres. Adres nie jest widoczny na stronie ani w jej kodzie. Na wiadomość odpowiadasz zwykłym „Odpowiedz” w swojej poczcie.</p></div>' +
        '<p class="cmsp-blad-modal" role="alert" hidden></p><button type="submit" class="cmsp-btn cmsp-btn--glowny">Zapisz adres</button></form></section>';
      var f = box.querySelector('#cmsp-f-mail'), bl = f.querySelector('.cmsp-blad-modal'), inp = f.querySelector('#cmsp-mail');
      f.onsubmit = function (e) {
        e.preventDefault(); bl.hidden = true;
        var v = inp.value.trim(), msg = v ? A.form.emailBlad(v) : 'Proszę wpisać adres e-mail.';
        if (msg) { bl.textContent = msg; bl.hidden = false; inp.focus(); return; }
        api('POST', '/formularz', { email: v }).then(function (r) {
          if (r._ok) { toast('Zapisano. Wiadomości z formularza będą przychodzić na ' + v + '.'); rysujKartyFormularza(box); }
          else { bl.textContent = r.blad || 'Nie udało się zapisać.'; bl.hidden = false; }
        });
      };
    }).catch(function () { box.innerHTML = '<section class="cmsp-karta"><p class="cmsp-pusto">Brak połączenia z serwerem.</p></section>'; });
  }

  /* ---------- Polityka prywatności ---------- */
  RYSUJ.polityka = function (kont) {
    edytorStrony(kont, 'polityka', function () {
      return [
        { naglowek: 'Administrator danych (punkt 1)', opis: 'Z tych pól i danych z zakładki Kontakt (nazwa działalności, NIP) składa się pierwszy punkt polityki. Puste pola widać na stronie jako „[DO UZUPEŁNIENIA]” i na liście „Do uzupełnienia”.' },
        { k: 'polityka.administrator', typ: 'tekst', et: 'Imię i nazwisko administratora danych', max: 80, szer: 'pol', f: 'polityka.administrator' },
        { k: 'kontakt.nip', typ: 'tekst', et: 'NIP (ten sam co w stopce)', max: 20, szer: 'pol', ph: '[DO UZUPEŁNIENIA]', f: 'polityka.administrator' },
        { k: 'polityka.adres', typ: 'tekst', et: 'Adres do korespondencji', max: 160, ph: 'np. ul. Przykładowa 1, 59-900 Zgorzelec', f: 'polityka.administrator' },
        { k: 'polityka.email', typ: 'email', et: 'E-mail w sprawach danych osobowych (widoczny publicznie)', szer: 'pol', f: 'polityka.administrator' },
        { naglowek: 'Wstęp' },
        { k: 'polityka.wstep', typ: 'obszar', i18n: true, et: 'Tekst pod tytułem', wiersze: 3, f: 'polityka.wstep' }
      ];
    }, {
      waliduj: function (s) {
        var p = s.polityka;
        if (p.email && A.form.emailBlad(p.email)) return 'E-mail w sprawach danych: ' + A.form.emailBlad(p.email);
        p.data = dzis();          // data ostatniej aktualizacji = dzień zapisu
        return '';
      }
    });
    lista(kont, {
      id: 'punkty', k: 'polityka', sciezka: 'polityka.punkty', etykieta: 'Punkty polityki (od punktu 2)', nazwa: 'punkt', prefiks: 'p', naKoniec: true,
      opis: 'Kolejność na liście = numeracja na stronie. Ukryty punkt nie jest pokazywany.',
      tytul: function (x) { return t(x.tytul, 'pl'); }, podsum: function (x) { return Rn.skrot(t(x.tresc, 'pl'), 90); },
      nowy: function () { return { id: uid('p'), tytul: { pl: '' }, tresc: { pl: '' } }; },
      pola: function (x) { return [
        { k: 'tytul', typ: 'tekst', i18n: true, et: 'Tytuł punktu', wym: true, max: 90, f: 'polityka:' + x.id },
        { k: 'tresc', typ: 'obszar', i18n: true, et: 'Treść', wiersze: 8, f: 'polityka:' + x.id, pomoc: 'Pusta linia = nowy akapit, **pogrubienie**, *kursywa*.' }
      ]; },
      waliduj: function (x) { return t(x.tytul, 'pl').trim() && t(x.tresc, 'pl').trim() ? '' : 'Uzupełnij tytuł i treść punktu.'; },
      poZmianie: function () { P.stan.polityka.data = dzis(); if (P.szkic) P.szkic.polityka.data = P.stan.polityka.data; odswiezMini('polityka', P.szkic || P.stan); }
    });
  };

  /* ---------- Do uzupełnienia: wykrywanie niewypełnionych miejsc ---------- */
  var ZNACZNIK_BRAKU = /\[(?:DO UZUPEŁNIENIA|LINK DO UZUPEŁNIENIA|DOMENA)[^\]]*\]/i;
  var STRONA_SCIEZKI = [
    [/^kontakt\.(pola|zachetaFormularza|formularz)/, 'formularz'], [/^sekcje\.([a-zA-Z]+)\./, '$1'], [/^(start|oMnie|historia|aktualnosci|kadra|portfolio|instagram|kontakt|polityka|seo)\b/, '$1'],
    [/^stopka\./, 'kontakt'], [/^ustawienia\./, 'wyglad']
  ];
  function stronaSciezki(p) {
    for (var i = 0; i < STRONA_SCIEZKI.length; i++) { var m = p.match(STRONA_SCIEZKI[i][0]); if (m) { var w = STRONA_SCIEZKI[i][1].replace('$1', m[1] || ''); return STRONY[w] ? w : null; } }
    return null;
  }
  function nazwaElementu(o) {
    if (!o || typeof o !== 'object') return '';
    return Rn.plain(t(o.tytul, 'pl') || t(o.imie, 'pl') || t(o.nazwa, 'pl') || t(o.etykieta, 'pl') || t(o.podpis, 'pl') || t(o.rok, 'pl') || '');
  }
  function znajdzBraki(s) {
    var wyn = [], today = dzis();
    function dodaj(b) { if (!wyn.some(function (x) { return x.klucz === b.klucz; })) wyn.push(b); }
    function przejdz(o, sc, ukryte, el, lista, idx) {
      if (o == null) return;
      if (typeof o === 'string') {
        if (/(^|\.)en$/.test(sc)) return;                       // wersja angielska wyłączona
        if (ZNACZNIK_BRAKU.test(o)) dodaj({ klucz: sc, waga: 'wazne', co: 'Tekst do uzupełnienia: „' + Rn.skrot(o.replace(/\s+/g, ' '), 90) + '”', sc: sc, ukryte: ukryte, el: el, lista: lista, idx: idx });
        return;
      }
      if (Array.isArray(o)) {
        o.forEach(function (x, i) {
          var uk = ukryte || !!(x && x.ukryta) || (sc === 'aktualnosci.lista' && x && ['aktywna', 'zaplanowana'].indexOf(Rn.status(x, today)) < 0);
          przejdz(x, sc + '.' + i, uk, nazwaElementu(x) || el, sc, i);
        });
        return;
      }
      if (typeof o !== 'object') return;
      if ('src' in o) {
        var src = String(o.src || '');
        if (/^assets\/img\//.test(src)) dodaj({ klucz: sc, waga: 'wazne', co: 'Zdjęcie zastępcze — wgraj prawdziwe zdjęcie' + (t(o.alt, 'pl') ? ' („' + Rn.skrot(t(o.alt, 'pl'), 60) + '”)' : ''), sc: sc, ukryte: ukryte, el: el, lista: lista, idx: idx, zdj: true });
        else if (src && !/\.tlo\.(obraz|plakat)$/.test(sc) && !Rn.plain(t(o.alt, 'pl'))) dodaj({ klucz: sc + ':alt', waga: 'zalecane', co: 'Brak opisu zdjęcia (alt) — ważny dla Google i osób niewidomych', sc: sc, ukryte: ukryte, el: el, lista: lista, idx: idx, zdj: true });
        return;
      }
      Object.keys(o).forEach(function (k) {
        if (sc === '' && (k === 'ustawienia' || k === '_app')) return;
        var nsc = sc ? sc + '.' + k : k, uk = ukryte;
        if (sc === 'sekcje' && o[k] && !Rn.sekWidoczna(s, k, today)) uk = true;
        if (/^(start|oMnie|historia|aktualnosci|kadra|portfolio|instagram)$/.test(k) && sc === '' && s.sekcje[k] && !Rn.sekWidoczna(s, k, today)) uk = true;
        if (/\.tlo$/.test(nsc) && o[k] && o[k].typ === 'kolor') return;                     // tło z kolorem — zdjęcie nieużywane
        if (nsc === 'historia.opowiesc' && s.historia.wariant !== 'opowiesc') uk = true;
        if (nsc === 'historia.rozdzialy' && s.historia.wariant === 'opowiesc') uk = true;
        if ((nsc === 'instagram.reczne') && (s.instagram.posty === false || s.instagram.tryb !== 'reczny')) uk = true;
        przejdz(o[k], nsc, uk, el, lista, idx);
      });
    }
    przejdz(s, '', false, '', null, null);
    var k = s.kontakt, p = s.polityka || {};
    if (!k.nip) dodaj({ klucz: 'kontakt.nip', waga: 'wazne', co: 'NIP działalności (stopka i polityka prywatności)', sc: 'kontakt.nip' });
    if (!p.adres) dodaj({ klucz: 'polityka.adres', waga: 'wazne', co: 'Adres do korespondencji w polityce prywatności', sc: 'polityka.adres' });
    if (!p.email) dodaj({ klucz: 'polityka.email', waga: 'wazne', co: 'E-mail w sprawach danych osobowych (polityka prywatności)', sc: 'polityka.email' });
    if (!t(s.seo.title, 'pl') || !t(s.seo.description, 'pl')) dodaj({ klucz: 'seo', waga: 'wazne', co: 'Tytuł lub opis strony dla Google', sc: 'seo.title' });
    if (Rn.sekWidoczna(s, 'instagram', today) && !k.instagram) dodaj({ klucz: 'kontakt.instagram', waga: 'wazne', co: 'Adres profilu na Instagramie (sekcja Instagram jest włączona)', sc: 'kontakt.instagram' });
    if (!k.messenger) dodaj({ klucz: 'kontakt.messenger', waga: 'zalecane', co: 'Link do Messengera (np. https://m.me/…) — teraz przycisk prowadzi do profilu na Facebooku', sc: 'kontakt.messenger' });
    if (!k.profilGoogle) dodaj({ klucz: 'kontakt.profilGoogle', waga: 'zalecane', co: 'Link do Profilu Firmy w Google (Mapy)', sc: 'kontakt.profilGoogle' });
    if (!k.opinieGoogle) dodaj({ klucz: 'kontakt.opinieGoogle', waga: 'zalecane', co: 'Link do opinii w Google', sc: 'kontakt.opinieGoogle' });
    if (/\[DOMENA\]/.test(A.DOMENA || '')) dodaj({ klucz: 'domena', waga: 'zalecane', co: 'Adres domeny (np. annaniedobitek.pl) — ustawia go wykonawca strony przy podłączaniu domeny; potrzebny m.in. dla Google', sc: '', bezPrzejscia: true });
    if (P.formularzBezAdresu && k.formularz) dodaj({ klucz: 'formularz', waga: 'wazne', co: 'Adres e-mail, na który mają przychodzić wiadomości z formularza', sc: 'kontakt.formularz', strona: 'formularz' });
    wyn.forEach(function (b) { b.strona = b.strona || stronaSciezki(b.sc || ''); });
    return wyn;
  }
  function sprawdzFormularzSerwera(poTym) {
    if (P.demo) { P.formularzBezAdresu = false; if (poTym) poTym(); return; }
    api('GET', '/formularz').then(function (d) { P.formularzBezAdresu = d._ok ? !d.email : false; odswiezLiczniki(); if (poTym) poTym(); }).catch(function () { if (poTym) poTym(); });
  }
  function wierszBraku(b, i) {
    var gdzie = b.strona ? STRONY[b.strona].n : 'Wykonawca strony';
    return '<li class="cmsp-brak cmsp-brak--' + b.waga + '"><div class="cmsp-brak-t"><strong>' + esc(b.co) + '</strong>' +
      '<small>' + esc(gdzie) + (b.el ? ' · ' + esc(Rn.skrot(b.el, 60)) : '') + (b.ukryte ? ' · niewidoczne na stronie' : '') + '</small></div>' +
      (b.strona && !b.bezPrzejscia ? '<button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="brak-idz" data-i="' + i + '">Uzupełnij →</button>' : '') + '</li>';
  }
  function kartaBrakow() {
    var lis = znajdzBraki(P.stan); P.ostatnieBraki = lis;
    var wid = lis.filter(function (x) { return !x.ukryte; }), w = wid.filter(function (x) { return x.waga === 'wazne'; });
    if (!wid.length) return '<section class="cmsp-karta cmsp-braki-ok"><h2>Wszystko uzupełnione ✓</h2><p class="cmsp-pomoc">Na widocznych częściach strony nie ma już miejsc do uzupełnienia.</p></section>';
    return '<section class="cmsp-karta"><h2>Do uzupełnienia <span class="cmsp-licz cmsp-licz--uwaga">' + wid.length + '</span></h2>' +
      '<p class="cmsp-pomoc">' + w.length + ' ważnych, ' + (wid.length - w.length) + ' zalecanych. Najważniejsze:</p><ul class="cmsp-braki">' +
      wid.slice(0, 5).map(function (b) { return wierszBraku(b, lis.indexOf(b)); }).join('') + '</ul>' +
      '<button type="button" class="cmsp-btn cmsp-btn--obrys" data-idz="braki">Zobacz całą listę →</button></section>';
  }
  RYSUJ.braki = function (kont) {
    function rysuj() {
      var lis = znajdzBraki(P.stan); P.ostatnieBraki = lis;
      var w = lis.filter(function (x) { return !x.ukryte && x.waga === 'wazne'; }), z = lis.filter(function (x) { return !x.ukryte && x.waga === 'zalecane'; }), u = lis.filter(function (x) { return x.ukryte; });
      function grupa(tyt, opis, el) { return el.length ? '<section class="cmsp-karta"><h2>' + esc(tyt) + ' <span class="cmsp-licz">' + el.length + '</span></h2><p class="cmsp-pomoc">' + esc(opis) + '</p><ul class="cmsp-braki">' + el.map(function (b) { return wierszBraku(b, lis.indexOf(b)); }).join('') + '</ul></section>' : ''; }
      kont.innerHTML = (!w.length && !z.length ? '<section class="cmsp-karta cmsp-braki-ok"><h2>Wszystko uzupełnione ✓</h2><p>Na widocznych częściach strony nie ma już tekstów „[DO UZUPEŁNIENIA]” ani zdjęć zastępczych.</p></section>' : '') +
        grupa('Ważne — widoczne na stronie', 'Te miejsca widzą odwiedzający (albo Google) — warto uzupełnić je przed pokazaniem strony klientom.', w) +
        grupa('Zalecane', 'Strona działa bez nich, ale uzupełnienie poprawi wygląd, wyniki w Google lub wygodę klientów.', z) +
        grupa('W ukrytych elementach', 'Tych elementów nie widać teraz na stronie (sekcja, pozycja lub układ są wyłączone) — uzupełnij je, zanim je włączysz.', u);
    }
    rysuj(); sprawdzFormularzSerwera(function () { if (P.strona === 'braki') rysuj(); });
  };
  function przejdzDoBraku(b) {
    if (!b || !b.strona) return;
    idz(b.strona);
    setTimeout(function () {
      var kont = P.root.querySelector('#cmsp-strona'); if (!kont) return;
      if (b.lista != null && b.idx != null) {
        var cfg = Object.keys(LISTY).map(function (k) { return LISTY[k]; }).filter(function (c) { return c.sciezka === b.lista && P.root.querySelector('[data-lista="' + c.id + '"]'); })[0];
        if (cfg) { modalElementu(cfg, b.idx); return; }
      }
      var sc = b.zdj ? b.sc : b.sc;
      var el = kont.querySelector('[data-zdj="' + sc + '"]') || kont.querySelector('[data-pole="' + sc + '"]') || kont.querySelector('[data-pole^="' + sc + '."]');
      if (!el) return;
      var pole = el.closest('.cmsp-pole') || el;
      pole.scrollIntoView({ block: 'center', behavior: 'smooth' });
      pole.classList.add('cmsp-szukane'); setTimeout(function () { pole.classList.remove('cmsp-szukane'); }, 2600);
      var f = el.matches('input,textarea,select') ? el : el.querySelector('input:not([type=file]),textarea,select'); if (f) f.focus({ preventScroll: true });
    }, 60);
  }

  /* ---------- Wygląd i efekty ---------- */
  RYSUJ.wyglad = function (kont) {
    edytorStrony(kont, 'oMnie', function () {
      return [
        { naglowek: 'Kolorystyka strony', opis: 'Wybierz motyw — podgląd zmienia się od razu, a na stronie po kliknięciu „Zapisz”.' },
        { k: 'ustawienia.motyw', typ: 'motyw', et: 'Motyw kolorystyczny' },
        { naglowek: 'Układ pełnoekranowy' },
        { k: 'ustawienia.kropki', typ: 'tak', et: 'Kropki nawigacji z boku ekranu (komputer)', pomoc: 'Na telefonie kropki są zawsze ukryte — działa menu „hamburger”.' },
        { k: 'ustawienia.animacje', typ: 'tak', et: 'Animacje (płynne pojawianie się treści, delikatne zbliżenie zdjęcia na pierwszym ekranie)', pomoc: 'Osoby z włączonym w systemie ustawieniem „ogranicz ruch” zawsze widzą stronę bez animacji.' },
        { naglowek: 'Tła sekcji', opis: 'Zdjęcie, wideo lub kolor tła, przyciemnienie i kolor tekstu ustawia się na podstronie każdej sekcji (np. Pierwszy ekran, O mnie, Kontakt).' }
      ];
    });
  };

  /* ---------- SEO ---------- */
  RYSUJ.seo = function (kont) {
    edytorStrony(kont, 'start', function () {
      return [
        { naglowek: 'Wynik w Google' },
        { k: 'seo.title', typ: 'tekst', i18n: true, et: 'Tytuł strony (title) — do ok. 60 znaków', max: 70, licznik: true, pomoc: 'Fraza główna na początku, nazwa firmy na końcu. Np. „Fotograf Zgorzelec i Dolny Śląsk | Anna Niedobitek Fotografia”.' },
        { k: 'seo.description', typ: 'obszar', i18n: true, et: 'Opis (meta description) — ok. 140–160 znaków', wiersze: 3, max: 170, licznik: true, pomoc: 'Co, dla kogo, gdzie + zaproszenie do kontaktu.' }
      ];
    }, { bezPodgladu: true, przed: '<section class="cmsp-karta cmsp-podglad"><div class="cmsp-podglad-g"><p>Ta zmiana dotyczy: <strong>wyniku w Google</strong> (tytuł karty przeglądarki i opis)</p></div><div class="cmsp-serp" id="cmsp-serp"></div><p class="cmsp-pomoc">Podgląd na żywo. Po zapisaniu tytuł, opis i dane strukturalne (JSON-LD) aktualizują się na stronie, a serwer wysyła je Google w gotowym HTML.</p></section>' });
    function serp() {
      var s = P.szkic || P.stan, el = kont.querySelector('#cmsp-serp'); if (!el) return;
      el.innerHTML = '<span class="cmsp-serp-url">' + esc(A.DOMENA.replace(/^https?:\/\//, '')) + '</span><span class="cmsp-serp-t">' + esc(t(s.seo.title, 'pl')) + '</span><span class="cmsp-serp-d">' + esc(Rn.skrot(t(s.seo.description, 'pl'), 160)) + '</span>';
    }
    serp(); kont.addEventListener('input', serp);
  };

  /* ---------- Wersje językowe ---------- */
  var ZNANE = [{ kod: 'en', nazwa: 'English' }, { kod: 'de', nazwa: 'Deutsch' }, { kod: 'cs', nazwa: 'Čeština' }, { kod: 'uk', nazwa: 'Українська' }];
  RYSUJ.jezyki = function (kont) {
    var jl = jezyki();
    var dostepne = ZNANE.filter(function (z) { return !jl.some(function (j) { return j.kod === z.kod; }); });
    kont.innerHTML = '<section class="cmsp-karta"><h2>Wersje językowe strony</h2>' +
      '<p class="cmsp-pomoc">Polski jest zawsze włączony. Wyłączona wersja znika ze strony (przełącznik języka, linki hreflang, mapa strony), ale jej treści zostają w panelu i wracają po ponownym włączeniu. Przełącznik języka chowa się, gdy włączony jest tylko jeden język.</p>' +
      '<ul class="cmsp-jez-lista">' + jl.map(function (j) {
        return '<li><span class="cmsp-jez">' + esc(j.kod.toUpperCase()) + '</span><strong>' + esc(j.nazwa) + '</strong>' +
          (j.staly ? '<span class="cmsp-plak cmsp-plak--ziel">Zawsze włączony</span>' :
            '<label class="cmsp-przel"><input type="checkbox" data-akcja="jez-wl" data-kod="' + esc(j.kod) + '"' + (j.wl ? ' checked' : '') + '><span class="cmsp-przel-s" aria-hidden="true"></span><span>' + (j.wl ? 'Włączona' : 'Wyłączona') + '</span></label>') + '</li>';
      }).join('') + '</ul>' +
      '<h3 class="cmsp-podtytul">Dodaj język</h3><div class="cmsp-rzad-przyc">' +
      '<label class="cmsp-sr" for="cmsp-nowy-jez">Wybierz język</label><select id="cmsp-nowy-jez">' + dostepne.map(function (z) { return '<option value="' + z.kod + '">' + esc(z.nazwa) + ' (' + z.kod.toUpperCase() + ')</option>'; }).join('') + '<option value="inny">Inny…</option></select>' +
      '<button type="button" class="cmsp-btn cmsp-btn--glowny" data-akcja="jez-dodaj">+ Dodaj język</button></div>' +
      '<p class="cmsp-pomoc">Nowy język jest dodawany jako wyłączony. Najpierw uzupełnij tłumaczenia (pola pojawią się obok polskich), potem go włącz. Teksty bez tłumaczenia pokazują się po polsku.</p></section>';
  };

  /* ---------- Hasło ---------- */
  function silaHasla(h) {
    var p = 0; if (h.length >= 10) p++; if (h.length >= 14) p++; if (/[a-ząćęłńóśźż]/.test(h) && /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(h)) p++; if (/\d/.test(h)) p++; if (/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(h)) p++;
    if (h.length < 10) p = Math.min(p, 1);
    return p;
  }
  RYSUJ.haslo = function (kont) {
    if (P.demo) { kont.innerHTML = '<section class="cmsp-karta"><p class="cmsp-pusto">Tryb demonstracyjny — zmiana hasła działa po wdrożeniu strony na serwer.</p></section>'; return; }
    kont.innerHTML = '<section class="cmsp-karta cmsp-waska"><h2>Zmiana hasła</h2><form id="cmsp-f-haslo" novalidate>' +
      '<div class="cmsp-pole"><label class="cmsp-et" for="cmsp-h1">Obecne hasło</label><input id="cmsp-h1" type="password" autocomplete="current-password" required></div>' +
      '<div class="cmsp-pole"><label class="cmsp-et" for="cmsp-h2">Nowe hasło (min. 10 znaków)</label><input id="cmsp-h2" type="password" autocomplete="new-password" minlength="10" required aria-describedby="cmsp-sila-t">' +
      '<div class="cmsp-sila" aria-hidden="true"><span></span></div><p class="cmsp-pomoc" id="cmsp-sila-t">Siła hasła: —</p></div>' +
      '<div class="cmsp-pole"><label class="cmsp-et" for="cmsp-h3">Powtórz nowe hasło</label><input id="cmsp-h3" type="password" autocomplete="new-password" required></div>' +
      '<p class="cmsp-blad-modal" role="alert" hidden></p><button type="submit" class="cmsp-btn cmsp-btn--glowny">Zmień hasło</button></form>' +
      '<p class="cmsp-pomoc">Po zmianie stare hasło przestaje działać od razu, a inne zalogowane urządzenia zostaną wylogowane.</p></section>';
    var f = kont.querySelector('form'), h2 = f.querySelector('#cmsp-h2'), bar = f.querySelector('.cmsp-sila span'), st = f.querySelector('#cmsp-sila-t'), bl = f.querySelector('.cmsp-blad-modal');
    var OP = ['bardzo słabe', 'słabe', 'średnie', 'dobre', 'silne', 'bardzo silne'];
    h2.addEventListener('input', function () { var p = silaHasla(h2.value); bar.style.width = (p / 5 * 100) + '%'; bar.className = 'cmsp-sila-' + p; st.textContent = 'Siła hasła: ' + (h2.value ? OP[p] : '—'); });
    f.onsubmit = function (e) {
      e.preventDefault(); bl.hidden = true;
      var a = f.querySelector('#cmsp-h1').value, b = h2.value, c = f.querySelector('#cmsp-h3').value, msg = '';
      if (!a) msg = 'Proszę wpisać obecne hasło.'; else if (b.length < 10) msg = 'Nowe hasło musi mieć co najmniej 10 znaków.'; else if (b !== c) msg = 'Powtórzone hasło jest inne niż nowe hasło.'; else if (a === b) msg = 'Nowe hasło musi różnić się od obecnego.'; else if (silaHasla(b) < 2) msg = 'Hasło jest za słabe — dodaj cyfry, wielkie litery lub znaki specjalne.';
      if (msg) { bl.textContent = msg; bl.hidden = false; return; }
      var btn = f.querySelector('[type=submit]'); btn.disabled = true;
      api('POST', '/haslo', { obecne: a, nowe: b }).then(function (r) {
        if (r._ok) { f.reset(); bar.style.width = '0'; st.textContent = 'Siła hasła: —'; toast('Hasło zostało zmienione. Od teraz obowiązuje nowe hasło.'); }
        else { bl.textContent = r._status === 401 ? 'Obecne hasło jest nieprawidłowe.' : (r.blad || 'Nie udało się zmienić hasła.'); bl.hidden = false; }
      }).catch(function () { bl.textContent = 'Brak połączenia z serwerem.'; bl.hidden = false; }).then(function () { btn.disabled = false; });
    };
  };

  /* ---------- Kopia zapasowa ---------- */
  RYSUJ.kopia = function (kont) {
    var eksport = JSON.stringify({ _app: 'anf-cms', _eksport: new Date().toISOString(), dane: P.stan }, null, 2);
    kont.innerHTML =
      '<section class="cmsp-karta"><h2>Eksport</h2><p class="cmsp-pomoc">Cała treść strony w jednym pliku. Zdjęcia wgrane do panelu są zapisane jako adresy (pozostają na serwerze).</p>' +
      '<label class="cmsp-sr" for="cmsp-eksport">Dane JSON</label><textarea id="cmsp-eksport" class="cmsp-kod" rows="8" readonly>' + esc(eksport) + '</textarea>' +
      '<div class="cmsp-rzad-przyc"><button type="button" class="cmsp-btn cmsp-btn--obrys" data-akcja="kop-schowek">Kopiuj do schowka</button><button type="button" class="cmsp-btn cmsp-btn--glowny" data-akcja="kop-pobierz">Pobierz plik .json</button></div></section>' +
      '<section class="cmsp-karta"><h2>Import</h2><p class="cmsp-pomoc">Wklej kopię lub wybierz plik. Przyjmowane są tylko kopie z tego panelu.</p>' +
      '<label class="cmsp-sr" for="cmsp-import">Wklej dane JSON</label><textarea id="cmsp-import" class="cmsp-kod" rows="5" placeholder="{ &quot;_app&quot;: &quot;anf-cms&quot;, … }"></textarea>' +
      '<div class="cmsp-rzad-przyc"><label class="cmsp-btn cmsp-btn--obrys cmsp-plik">Wybierz plik…<input type="file" accept="application/json,.json" id="cmsp-import-plik"></label><button type="button" class="cmsp-btn cmsp-btn--glowny" data-akcja="kop-import">Importuj</button></div></section>' +
      (P.demo ? '' : '<section class="cmsp-karta"><h2>Kopie automatyczne na serwerze</h2><p class="cmsp-pomoc">Serwer zachowuje poprzednią wersję treści (najwyżej co 10 minut, żeby nie zużywać dziennego limitu zapisów Cloudflare) — 10 ostatnich kopii.</p><div id="cmsp-kopie"><p class="cmsp-pusto">Wczytywanie…</p></div></section>') +
      '<section class="cmsp-karta cmsp-karta--ryzyko"><h2>Przywróć treści początkowe</h2><p class="cmsp-pomoc">Usuwa wszystkie zmiany wprowadzone w panelu i przywraca treść z projektu strony. Przed tym warto pobrać kopię.</p>' +
      '<button type="button" class="cmsp-btn cmsp-btn--usun" data-akcja="kop-reset">Przywróć treści początkowe</button></section>';
    kont.querySelector('#cmsp-import-plik').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { kont.querySelector('#cmsp-import').value = r.result; toast('Wczytano plik — kliknij „Importuj”.'); }; r.readAsText(f);
    });
    if (!P.demo) rysujKopie();
  };
  function rysujKopie() {
    var box = P.root.querySelector('#cmsp-kopie'); if (!box) return;
    api('GET', '/kopie').then(function (r) {
      var k = r.kopie || [];
      box.innerHTML = k.length ? '<ul class="cmsp-kopie">' + k.map(function (x) {
        var d = new Date(x.czas);
        return '<li><span>' + d.toLocaleDateString('pl-PL') + ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + '</span><small>' + Math.round((x.rozmiar || 0) / 1024) + ' kB</small><button type="button" class="cmsp-btn cmsp-btn--maly cmsp-btn--obrys" data-akcja="kop-przywroc" data-id="' + esc(x.id) + '">Przywróć</button></li>';
      }).join('') + '</ul>' : '<p class="cmsp-pusto">Brak kopii — pojawią się po pierwszych zapisach.</p>';
    }).catch(function () { box.innerHTML = '<p class="cmsp-pusto">Nie udało się wczytać listy kopii.</p>'; });
  }
  function importuj(tekst) {
    var d;
    try { d = JSON.parse(tekst); } catch (e) { toast('To nie jest poprawny plik JSON.', 'blad'); return; }
    if (!d || d._app !== 'anf-cms' || !d.dane || !d.dane.sekcje || !d.dane.start) { toast('To nie jest kopia z panelu tej strony.', 'blad'); return; }
    if (!window.confirm('Zastąpić obecną treść strony danymi z kopii (' + (d._eksport ? new Date(d._eksport).toLocaleString('pl-PL') : 'bez daty') + ')?')) return;
    P.stan = Rn.stan(d.dane); zastosuj({ toast: 'Zaimportowano kopię. Zmiany są już na stronie.' }); idz('kopia');
  }

  /* ================= OBSŁUGA KLIKNIĘĆ ================= */
  function klik(e) {
    var b = e.target.closest('button, [data-akcja], [data-idz]'); if (!b || !P.root.contains(b)) return;
    var a = b.getAttribute('data-akcja');
    if (b.closest('.cmsp-modal-tlo') && ['zdj-usun', 'kadr', 'kadr-srodek'].indexOf(a) < 0) return; // okno edycji ma własną obsługę
    if (b.hasAttribute('data-idz')) { idz(b.getAttribute('data-idz')); return; }
    if (!a) return;
    if (b.closest('[data-lista]') && ['dodaj', 'edytuj', 'usun', 'gora', 'dol', 'ukryj', 'duplikuj', 'filtr'].indexOf(a) >= 0) { akcjaListy(b, a); return; }
    switch (a) {
      case 'zobacz': zamknijPanel(); break;
      case 'pokaz': var k = b.getAttribute('data-sek'); if (k === 'polityka') { window.open('polityka-prywatnosci.html', '_blank', 'noopener'); break; } zamknijPanel(function () { if (!site.pokaz(k)) alert('Ta sekcja jest teraz ukryta na stronie.'); }); break;
      case 'wyloguj':
        if (!potwierdzPorzucenie()) return;
        api('POST', '/logout', {}).then(function () { P.zalogowany = false; site.oznaczZalogowany(false); P.szkic = null; zamknijPanel(); });
        break;
      case 'szybko': idz(b.getAttribute('data-cel'), { dodaj: true }); break;
      case 'zapisz-strone': P.root.querySelector('#cmsp-strona')._zapisz(); break;
      case 'brak-idz': przejdzDoBraku((P.ostatnieBraki || [])[+b.getAttribute('data-i')]); break;
      case 'ponow-zapis': b.disabled = true; b.textContent = 'Zapisywanie…'; P.toastPoZapisie = 'Zapisano zmiany. Są już na stronie.'; zaplanujZapis(); break;
      case 'cofnij': P.root.querySelector('#cmsp-strona')._cofnij(); break;
      case 'zdj-usun':
        var fe = b.closest('[data-forma]'), F = FORMY[fe.getAttribute('data-forma')], kk = b.getAttribute('data-k');
        setP(F.obj, kk, null);
        var box = b.closest('.cmsp-zdj'); box.querySelector('.cmsp-zdj-pod').innerHTML = '<span>Brak zdjęcia</span>'; box.querySelector('[data-pole="' + kk + '.src"]').value = ''; b.disabled = true;
        var kb2 = box.querySelector('.cmsp-kadr'); if (kb2) { kb2.hidden = true; kb2.innerHTML = ''; }
        if (F.onZmiana) F.onZmiana(kk, null, false, 'change');
        break;
      case 'kadr': case 'kadr-srodek':
        var kbl = b.closest('[data-kadr]'), fe3 = b.closest('[data-forma]'), F3 = fe3 && FORMY[fe3.getAttribute('data-forma')];
        var z3 = F3 && getP(F3.obj, kbl.getAttribute('data-kadr')), p3 = pozZdj(z3);
        if (a === 'kadr-srodek') ustawKadr(b, 50, 50); else ustawKadr(b, p3.x + (+b.getAttribute('data-dx')), p3.y + (+b.getAttribute('data-dy')));
        break;
      case 'sek-rozwin': rozwinSekcje(b); break;
      case 'sek-gora': case 'sek-dol':
        var kk2 = b.getAttribute('data-k'), lst = A.kolejnosc(P.stan).map(function (x) { return x.k; }).filter(function (k) { return k !== 'start'; });
        var ii = lst.indexOf(kk2), jj = ii + (a === 'sek-gora' ? -1 : 1);
        if (ii < 0 || jj < 0 || jj >= lst.length) return;
        lst.splice(jj, 0, lst.splice(ii, 1)[0]);
        P.stan.ustawienia.kolejnosc = lst;
        zastosuj({ toast: 'Zmieniono kolejność sekcji w menu i na stronie.' }); idz('sekcje', { bezFokusu: true });
        var nb = P.root.querySelector('[data-akcja="' + a + '"][data-k="' + kk2 + '"]'); if (nb && !nb.disabled) nb.focus();
        break;
      case 'sek-zapisz':
        var kz = b.getAttribute('data-k'), Fz = FORMY['sek-' + kz];
        ['menu', 'nadtytul', 'naglowek', 'wstep'].forEach(function (p) { if (Fz.obj.sekcje[kz][p] !== undefined) P.stan.sekcje[kz][p] = Rn.clone(Fz.obj.sekcje[kz][p]); });
        zastosuj({ toast: 'Zapisano zmiany.' }); idz('sekcje', { bezFokusu: true });
        break;
      case 'jez-dodaj':
        var sel = P.root.querySelector('#cmsp-nowy-jez'), kod = sel.value, nazwa;
        if (kod === 'inny') {
          kod = (window.prompt('Kod języka (2 litery, np. it):') || '').trim().toLowerCase();
          if (!/^[a-z]{2}$/.test(kod)) { if (kod) toast('Kod języka musi mieć 2 litery.', 'blad'); return; }
          nazwa = (window.prompt('Nazwa języka (np. Italiano):') || kod.toUpperCase()).trim();
        } else nazwa = (ZNANE.filter(function (z) { return z.kod === kod; })[0] || {}).nazwa;
        if (jezyki().some(function (j) { return j.kod === kod; })) { toast('Ten język już jest na liście.', 'blad'); return; }
        P.stan.ustawienia.jezyki.push({ kod: kod, nazwa: nazwa, wl: false });
        zastosuj({ toast: 'Dodano język (wyłączony). Uzupełnij tłumaczenia i włącz go.' }); idz('jezyki');
        break;
      case 'kop-schowek':
        var ta = P.root.querySelector('#cmsp-eksport');
        (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(function () { toast('Skopiowano do schowka.'); }, function () { ta.select(); doc.execCommand('copy'); toast('Skopiowano do schowka.'); });
        break;
      case 'kop-pobierz':
        var blob = new Blob([P.root.querySelector('#cmsp-eksport').value], { type: 'application/json' }), u = URL.createObjectURL(blob), l = doc.createElement('a');
        l.href = u; l.download = 'kopia-anna-niedobitek-fotografia-' + dzis() + '.json'; doc.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
        break;
      case 'kop-import': importuj(P.root.querySelector('#cmsp-import').value); break;
      case 'kop-przywroc':
        if (!window.confirm('Przywrócić tę wersję strony? Obecna wersja trafi do kopii.')) return;
        api('POST', '/kopie/przywroc', { id: b.getAttribute('data-id') }).then(function (r) {
          if (!r._ok) { toast(r.blad || 'Nie udało się przywrócić kopii.', 'blad'); return; }
          P.stan = Rn.stan(r.dane); site.renderuj(Rn.clone(P.stan)); odswiezLiczniki(); toast('Przywrócono kopię. Zmiany są już na stronie.'); wskaznik('ok', 'Zapisano ' + godzina()); rysujKopie();
        });
        break;
      case 'kop-reset':
        if (!b.classList.contains('cmsp-pewno')) { b.classList.add('cmsp-pewno'); b.textContent = 'Na pewno? Kliknij ponownie'; setTimeout(function () { if (b.isConnected) { b.classList.remove('cmsp-pewno'); b.textContent = 'Przywróć treści początkowe'; } }, 3500); return; }
        if (!window.confirm('Ostatnie potwierdzenie: usunąć wszystkie zmiany z panelu i przywrócić treści początkowe?')) return;
        P.stan = Rn.stan(); zastosuj({ toast: 'Przywrócono treści początkowe.' }); idz('kopia');
        break;
    }
  }
  /* przełączniki działające od razu (poza formularzami z „Zapisz”) */
  doc.addEventListener('change', function (e) {
    var el = e.target; if (!P.root || !P.root.contains(el)) return;
    var a = el.getAttribute('data-akcja');
    if (a === 'sek-wid') {
      P.stan.sekcje[el.getAttribute('data-k')].widoczna = el.checked;
      zastosuj({ toast: el.checked ? 'Sekcja jest widoczna na stronie.' : 'Sekcja została ukryta na stronie.' }); idz('sekcje', { bezFokusu: true });
      var z = P.root.querySelector('[data-akcja="sek-wid"][data-k="' + el.getAttribute('data-k') + '"]'); if (z) z.focus();
    }
    if (a === 'jez-wl') {
      var j = jezyki().filter(function (x) { return x.kod === el.getAttribute('data-kod'); })[0]; if (!j) return;
      j.wl = el.checked; zastosuj({ toast: el.checked ? 'Wersja ' + j.nazwa + ' jest włączona.' : 'Wersja ' + j.nazwa + ' jest wyłączona (treści zostają w panelu).' }); idz('jezyki', { bezFokusu: true });
    }
  });
  window.addEventListener('resize', function () { if (P.root) skalujMini(); });
  window.addEventListener('beforeunload', function (e) {
    if (P.otwarty && P.szkic && JSON.stringify(P.szkic) !== JSON.stringify(P.stan)) { e.preventDefault(); e.returnValue = ''; }
  });
})();
