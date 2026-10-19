/*!
 * Anna Niedobitek Fotografia — RENDEROWANIE SEKCJI
 * ---------------------------------------------------------------
 * Czyste funkcje: dane (state) → HTML. Ten sam kod działa:
 *  1) w przeglądarce (strona i podgląd na żywo w panelu),
 *  2) w narzędziu  narzedzia/zbuduj.mjs  (treść zapisana w index.html — SEO),
 *  3) na serwerze Cloudflare (functions/index.js) — strona ze zmianami z panelu
 *     jest wysyłana jako gotowy HTML, widoczny dla Google bez JavaScriptu.
 */
(function (root) {
  'use strict';
  var A = root.ANF = root.ANF || {};

  /* ---------- Konfiguracja domeny: JEDYNE miejsce do podmiany ----------
   * Po zakupie domeny wpisz ją tutaj i uruchom: node narzedzia/zbuduj.mjs
   * (skrypt podmieni adres w index.html, sitemap.xml, robots.txt i podstronach). */
  var DOMENA = 'https://[DOMENA]';
  A.DOMENA = DOMENA;
  A.STREFA = 'Europe/Warsaw';

  /* Klucze sekcji w danych → identyfikatory (kotwice) na stronie */
  var SEKCJE = [
    { k: 'start', id: 'start', nazwa: 'Pierwszy ekran' },
    { k: 'oMnie', id: 'o-mnie', nazwa: 'O mnie' },
    { k: 'historia', id: 'historia', nazwa: 'Historia' },
    { k: 'aktualnosci', id: 'aktualnosci', nazwa: 'Aktualności' },
    { k: 'kadra', id: 'kto-fotografuje', nazwa: 'Kto fotografuje' },
    { k: 'portfolio', id: 'portfolio', nazwa: 'Portfolio (galeria)' },
    { k: 'instagram', id: 'instagram', nazwa: 'Instagram' },
    { k: 'kontakt', id: 'kontakt', nazwa: 'Kontakt' }
  ];
  A.SEKCJE = SEKCJE;

  /* Teksty interfejsu strony (nie edytowane w panelu). Nowe języki bez
   * tłumaczenia korzystają z polskich tekstów. */
  var UI = {
    pl: {
      menu: 'Menu', zamknij: 'Zamknij', czytaj: 'Czytaj więcej', czytajOMnie: 'Czytaj więcej o mnie',
      czytajWpis: 'Czytaj cały wpis', czytajOsoba: 'Więcej o', fotografuje: 'Fotografuję:',
      wszystkie: 'Wszystkie', poprzednie: 'Poprzednie zdjęcia', nastepne: 'Następne zdjęcia',
      powieksz: 'Powiększ zdjęcie', odtworz: 'Odtwórz wideo', filtruj: 'Filtruj portfolio według rodzaju sesji',
      slajd: 'slajd', z: 'z', przewin: 'Przewiń do następnej sekcji', pauza: 'Zatrzymaj wideo w tle', wznow: 'Wznów wideo w tle',
      obserwuj: 'Zobacz profil na Instagramie', igZobacz: 'Więcej kadrów na Instagramie', igWstep: 'Na Instagramie publikuję najświeższe kadry z sesji i reportaży.',
      messenger: 'Napisz na Messengerze', facebook: 'Profil na Facebooku', instagram: 'Profil na Instagramie',
      zadzwon: 'Zadzwoń', email: 'Napisz e-mail', opinie: 'Opinie o mojej pracy w Google', profil: 'Profil firmy w Mapach Google',
      obszar: 'Obszar działania', formularz: 'Formularz kontaktowy', mapa: 'Pokaż mapę obszaru działania',
      mapaInfo: 'Mapa Google wczyta się dopiero po kliknięciu.', otworzMapy: 'Otwórz w Mapach Google',
      dane: 'Dane działalności', nip: 'NIP', regon: 'REGON', krs: 'KRS', uzupelnij: '[DO UZUPEŁNIENIA]',
      polityka: 'Polityka prywatności', wroc: 'Wróć na stronę główną', panel: 'Panel administratora', prawa: 'Wszelkie prawa zastrzeżone. Zdjęcia chronione prawem autorskim.',
      pasek: 'Komunikaty', aktualnosci: 'Aktualności', jezyk: 'Język strony',
      f_imie: 'Imię i nazwisko', f_email: 'Adres e-mail', f_tel: 'Telefon (opcjonalnie)', f_rodzaj: 'Czego dotyczy wiadomość?',
      f_wybierz: 'Proszę wybrać…', f_inne: 'Inne', f_termin: 'Planowany termin (opcjonalnie)', f_wiad: 'Wiadomość',
      f_zgoda: 'Wyrażam zgodę na przetwarzanie moich danych w celu odpowiedzi na wiadomość. Szczegóły w',
      f_wyslij: 'Wyślij wiadomość', f_kraj: 'Kraj (numer kierunkowy)', autor: 'Strona stworzona przez', f_wym: 'pole wymagane', f_hp: 'Nie wypełniaj tego pola',
      sekcje: 'Sekcje strony', skip: 'Przejdź do treści', wartosci: 'Wartości', formOtworz: 'Napisz wiadomość', strona: 'Strona', formPod: 'Wiadomość prosto ze strony', f_opc: 'opcjonalnie', osPoprz: 'Wcześniej', osNast: 'Później', osLista: 'Oś czasu — przewiń w poziomie', czytajHist: 'Czytaj całą historię'
    },
    en: {
      menu: 'Menu', zamknij: 'Close', czytaj: 'Read more', czytajOMnie: 'Read more about me',
      czytajWpis: 'Read the full post', czytajOsoba: 'More about', fotografuje: 'I photograph:',
      wszystkie: 'All', poprzednie: 'Previous photo', nastepne: 'Next photo',
      powieksz: 'Enlarge photo', odtworz: 'Play video', filtruj: 'Filter portfolio by session type',
      slajd: 'slide', z: 'of', przewin: 'Scroll to next section', pauza: 'Pause background video', wznow: 'Resume background video',
      obserwuj: 'See the Instagram profile', igZobacz: 'More photos on Instagram', igWstep: 'On Instagram I share the latest frames from sessions and reportages.',
      messenger: 'Message on Messenger', facebook: 'Facebook profile', instagram: 'Instagram profile',
      zadzwon: 'Call', email: 'Send an e-mail', opinie: 'Reviews on Google', profil: 'Business profile on Google Maps',
      obszar: 'Service area', formularz: 'Contact form', mapa: 'Show service area map',
      mapaInfo: 'Google Maps loads only after you click.', otworzMapy: 'Open in Google Maps',
      dane: 'Business details', nip: 'VAT ID (NIP)', regon: 'REGON', krs: 'KRS', uzupelnij: '[TO BE COMPLETED]',
      polityka: 'Privacy policy', wroc: 'Back to the home page', panel: 'Admin panel', prawa: 'All rights reserved. Photos protected by copyright.',
      pasek: 'Announcements', aktualnosci: 'News', jezyk: 'Language',
      f_imie: 'Full name', f_email: 'E-mail address', f_tel: 'Phone (optional)', f_rodzaj: 'What is your message about?',
      f_wybierz: 'Please choose…', f_inne: 'Other', f_termin: 'Planned date (optional)', f_wiad: 'Message',
      f_zgoda: 'I agree to the processing of my data in order to reply to my message. Details in the',
      f_wyslij: 'Send message', f_kraj: 'Country (dialling code)', autor: 'Website created by', f_wym: 'required', f_hp: 'Leave this field empty',
      sekcje: 'Page sections', skip: 'Skip to content', wartosci: 'Values', formOtworz: 'Write a message', strona: 'Page', formPod: 'Send a message from this page', f_opc: 'optional', osPoprz: 'Earlier', osNast: 'Later', osLista: 'Timeline — scroll horizontally', czytajHist: 'Read the whole story'
    }
  };
  A.UI = UI;
  function ui(ctx, k) { var d = UI[ctx.lang] || UI.pl; return d[k] != null ? d[k] : UI.pl[k]; }

  /* ---------- Narzędzia ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(v, lang) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (lang && v[lang]) || v.pl || '';
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em class="akcent">$2</em>')
      .replace(/\n/g, '<br>');
  }
  function fmt(s) {
    s = String(s || '').trim();
    if (!s) return '';
    return s.split(/\n\s*\n/).map(function (p) { return '<p>' + inline(p.trim()) + '</p>'; }).join('');
  }
  function plain(s) { return String(s || '').replace(/\*\*?/g, '').replace(/\s+/g, ' ').trim(); }
  function skrot(s, n) { s = plain(s); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; }
  function bezpiecznyUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|#|\/|assets\/|\.\/)/i.test(u)) return u;
    return '';
  }
  function dzis(tz) {
    try { return new Intl.DateTimeFormat('sv-SE', { timeZone: tz || A.STREFA }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  var MIES = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  function dataPL(iso, lang) {
    if (!iso) return '';
    var p = iso.split('-');
    if (lang && lang !== 'pl') {
      try { return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { }
    }
    return (+p[2]) + ' ' + MIES[+p[1] - 1] + ' ' + p[0];
  }
  /* Status wpisu czasowego: aktywna / zaplanowana / zakonczona / wstrzymana */
  function status(w, today) {
    if (w.wstrzymana) return 'wstrzymana';
    if (w.od && w.od > today) return 'zaplanowana';
    if (w.do && w.do < today) return 'zakonczona';
    return 'aktywna';
  }
  function aktywneWpisy(s, today) {
    return (s.aktualnosci.lista || []).filter(function (w) { return status(w, today) === 'aktywna'; })
      .sort(function (a, b) { return (b.data || b.od || '').localeCompare(a.data || a.od || ''); });
  }
  function widoczne(lista) { return (lista || []).filter(function (x) { return !x.ukryta; }); }

  /* Scalanie danych zapisanych z początkowymi: obiekty łączone głęboko,
   * listy (tablice) należą do klientki i zastępują domyślne w całości. */
  function scal(def, zap) {
    if (zap === undefined) return clone(def);
    if (Array.isArray(def) || Array.isArray(zap)) return clone(zap);
    /* Zdjęcie (obiekt z „src”) to całość — nie wolno go łączyć z domyślnym, bo np. srcset
     * zdjęcia zastępczego „przykleiłby się” do nowo wgranego i przeglądarka pokazałaby stare.
     * null = zdjęcie usunięte w panelu (a nie „weź domyślne”). */
    if ((def && typeof def === 'object' && 'src' in def) || (zap && typeof zap === 'object' && 'src' in zap)) return clone(zap);
    if (def && typeof def === 'object' && zap && typeof zap === 'object') {
      var o = {}, k;
      for (k in def) o[k] = scal(def[k], zap[k]);
      for (k in zap) if (!(k in def)) o[k] = clone(zap[k]);
      return o;
    }
    return zap === null && def && typeof def === 'object' ? clone(def) : clone(zap);
  }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  function jezykiWl(s) { return (s.ustawienia.jezyki || []).filter(function (j) { return j.wl || j.staly; }); }
  function sekWidoczna(s, k, today) {
    var sek = s.sekcje[k];
    if (!sek || !sek.widoczna) return false;
    if (k === 'aktualnosci') return aktywneWpisy(s, today).length > 0;
    if (k === 'kadra') return widoczne(s.kadra.lista).length > 0;
    if (k === 'portfolio') return widoczne(s.portfolio.elementy).length > 0;
    if (k === 'historia') return widoczne(s.historia.rozdzialy).length > 0;
    return true;
  }
  function idSekcji(k) { for (var i = 0; i < SEKCJE.length; i++) if (SEKCJE[i].k === k) return SEKCJE[i].id; return k; }
  function linkJezyka(lang) { return lang === 'pl' ? '' : '?lang=' + encodeURIComponent(lang); }

  /* ---------- Obrazy i tła ---------- */
  function imgTag(o, op) {
    op = op || {};
    if (!o || !o.src) return '<div class="zast ' + (op.cls || '') + '" aria-hidden="true"></div>';
    var src = bezpiecznyUrl(o.src) || '';
    var a = ['<img src="' + esc(src) + '"'];
    if (o.srcset) a.push('srcset="' + esc(o.srcset) + '" sizes="' + esc(op.sizes || '100vw') + '"');
    a.push('alt="' + esc(op.decor ? '' : t(o.alt, op.lang)) + '"');
    if (o.w && o.h) a.push('width="' + (+o.w) + '" height="' + (+o.h) + '"');
    if (op.cls) a.push('class="' + op.cls + '"');
    /* punkt kadru ustawiony w panelu (fragment, który zostaje widoczny po przycięciu) */
    if (o.poz && isFinite(o.poz.x) && isFinite(o.poz.y) && (+o.poz.x !== 50 || +o.poz.y !== 50)) a.push('style="object-position:' + Math.max(0, Math.min(100, +o.poz.x)) + '% ' + Math.max(0, Math.min(100, +o.poz.y)) + '%"');
    if (op.priority) a.push('fetchpriority="high" decoding="async"'); else a.push('loading="lazy" decoding="async"');
    if (op.f) a.push('data-f="' + esc(op.f) + '"');
    a.push('onerror="this.classList.add(\'img-blad\')"');
    return a.join(' ') + '>';
  }
  /* Motywy kolorystyczne (przełączane w panelu → Wygląd i efekty) */
  var MOTYWY = [
    { id: 'bez', nazwa: 'Kremowy beż', opis: 'Ciepła kość słoniowa, mokka i karmel — miękko, rodzinnie.', tlo: '#FAF7F2', kolory: ['#FAF7F2', '#F2EBE3', '#7A5240', '#B88A6E', '#2B2622'] },
    { id: 'noc', nazwa: 'Nocna galeria', opis: 'Ciemna, kinowa strona: grafitowa czerń, kość słoniowa i złote akcenty. Zdjęcia świecą jak w galerii.', tlo: '#141210', kolory: ['#141210', '#1D1A17', '#C9A46A', '#EEE7DD', '#0B0A09'] },
    { id: 'terakota', nazwa: 'Biel i terakota', opis: 'Nowoczesny, magazynowy styl: czysta biel, czerń, terakota, proste kanty i wyraźne bezszeryfowe nagłówki.', tlo: '#FFFFFF', kolory: ['#FFFFFF', '#F3EFEA', '#B03F22', '#141414', '#F4B49C'] }
  ];
  A.MOTYWY = MOTYWY;
  function motyw(s) { var m = (s.ustawienia && s.ustawienia.motyw) || 'bez'; return MOTYWY.some(function (x) { return x.id === m; }) ? m : 'bez'; }
  /* Kolor tła sekcji: tokeny motywu (zmieniają się razem z motywem) albo własny kolor.
   * Dawne zapisy w HEX z pierwszej wersji strony są mapowane na tokeny. */
  var STARE_KOLORY = { '#f2ebe3': 'var(--bg2)', '#faf7f2': 'var(--bg)', '#2b2622': 'var(--ciemne)' };
  function kolorTla(k, wlasny) {
    k = String(k || '');
    if (!k || k === 'motyw:jasne') return 'var(--bg)';
    if (k === 'motyw:tlo2') return 'var(--bg2)';
    if (k === 'motyw:ciemne') return 'var(--ciemne)';
    if (k === 'wlasny') k = String(wlasny || '');
    if (STARE_KOLORY[k.toLowerCase()]) return STARE_KOLORY[k.toLowerCase()];
    return /^#[0-9a-f]{3,8}$/i.test(k) ? k : 'var(--bg)';
  }
  A.kolorTla = kolorTla;
  function ovStyle(tlo) {
    var c = Math.max(0, Math.min(90, +tlo.ciemno || 0)) / 100;
    var rgb = tlo.tekst === 'ciemny' ? 'var(--bg-rgb)' : 'var(--ciemne-rgb)';
    return '--sek-kolor:' + kolorTla(tlo.kolor, tlo.kolorWlasny) + ';--sek-ov:rgba(' + rgb + ',' + c.toFixed(2) + ')';
  }
  function tloHtml(tlo, ctx, op) {
    op = op || {};
    if (!tlo) return '';
    if (tlo.typ === 'zdjecie' && tlo.obraz && tlo.obraz.src) {
      return '<div class="sek-tlo" aria-hidden="' + (op.priority ? 'false' : 'true') + '">' +
        imgTag(tlo.obraz, { cls: 'sek-tlo-img', priority: op.priority, lang: ctx.lang, decor: !op.priority, f: op.f }) + '</div>';
    }
    if (tlo.typ === 'wideo' && tlo.wideo) {
      var pl = tlo.plakat && tlo.plakat.src ? tlo.plakat : tlo.obraz;
      return '<div class="sek-tlo sek-tlo--wideo">' +
        (pl && pl.src ? imgTag(pl, { cls: 'sek-tlo-img', priority: op.priority, lang: ctx.lang, decor: !op.priority }) : '') +
        '<video class="sek-tlo-wideo" muted loop playsinline preload="none" aria-hidden="true" data-src="' + esc(bezpiecznyUrl(tlo.wideo)) + '"' +
        (pl && pl.src ? ' poster="' + esc(pl.src) + '"' : '') + '></video></div>' +
        '<button type="button" class="wideo-pauza" aria-pressed="false" hidden data-l-pauza="' + esc(ui(ctx, 'pauza')) + '" data-l-wznow="' + esc(ui(ctx, 'wznow')) + '" aria-label="' + esc(ui(ctx, 'pauza')) + '"><span aria-hidden="true"></span></button>';
    }
    return '';
  }
  function otworzSekcje(k, s, ctx, extra, attrs) {
    var sek = s.sekcje[k], tlo = sek.tlo || {};
    var cls = 'sek sek--' + k + ' t-' + (tlo.tekst === 'jasny' ? 'jasny' : 'ciemny') + (tlo.typ !== 'kolor' ? ' sek--foto' : '') + (extra ? ' ' + extra : '');
    attrs = attrs || '';
    if (k !== 'start' && !t(sek.naglowek, ctx.lang)) attrs = attrs.replace(/aria-labelledby="[^"]*"/, 'aria-label="' + esc(t(sek.menu, ctx.lang) || k) + '"');
    return '<section id="' + idSekcji(k) + '" class="' + cls + '" data-ssr="' + k + '" data-sekcja="' + k + '" style="' + ovStyle(tlo) + '"' + attrs + '>';
  }
  function naglowek(k, s, ctx, idH) {
    var sek = s.sekcje[k], h = '';
    if (t(sek.nadtytul, ctx.lang)) h += '<p class="nadtytul" data-f="sekcje.' + k + '.nadtytul">' + inline(t(sek.nadtytul, ctx.lang)) + '</p>';
    if (t(sek.naglowek, ctx.lang)) h += '<h2 id="' + idH + '" data-f="sekcje.' + k + '.naglowek">' + inline(t(sek.naglowek, ctx.lang)) + '</h2>';
    if (t(sek.wstep, ctx.lang)) h += '<div class="sek-wstep" data-f="sekcje.' + k + '.wstep">' + fmt(t(sek.wstep, ctx.lang)) + '</div>';
    return h;
  }
  function pusta(k) { return '<section id="' + idSekcji(k) + '" data-ssr="' + k + '" data-sekcja="' + k + '" hidden></section>'; }
  function czytajWiecej(id, label, tytul) {
    return '<button type="button" class="link-wiecej" data-wiecej="' + id + '" aria-haspopup="dialog"' + (tytul ? ' data-tytul="' + esc(tytul) + '"' : '') + '>' + esc(label) + '<span aria-hidden="true"> →</span></button>';
  }

  /* ================= SEKCJE ================= */
  var R = {};

  R.start = function (s, ctx) {
    var d = s.start, L = ctx.lang, cel = idSekcji(d.przyciskCel || 'portfolio');
    return otworzSekcje('start', s, ctx, 'sek-hero', ' aria-labelledby="h1"') +
      tloHtml(s.sekcje.start.tlo, ctx, { priority: true, f: 'sekcje.start.tlo' }) +
      '<div class="sek-in hero-in">' +
      '<h1 id="h1" class="hero-h1"><span class="hero-nazwa" data-f="start.nazwa">' + esc(t(d.nazwa, L)) + '</span>' +
      (t(d.rola, L) ? '<span class="sr"> — </span><span class="hero-rola" data-f="start.rola">' + esc(t(d.rola, L)) + '</span>' : '') + '</h1>' +
      (t(d.motto, L) ? '<p class="hero-motto" data-f="start.motto">' + esc(t(d.motto, L)) + '</p>' : '') +
      (t(d.wstep, L) ? '<p class="hero-wstep" data-f="start.wstep">' + inline(t(d.wstep, L)) + '</p>' : '') +
      (t(d.przycisk, L) ? '<a class="btn btn--glowny" href="#' + cel + '" data-f="start.przycisk">' + esc(t(d.przycisk, L)) + '</a>' : '') +
      '</div>' +
      '<a class="hero-dalej" href="#' + ctx.nastepna + '" aria-label="' + esc(ui(ctx, 'przewin')) + '"><span aria-hidden="true"></span></a>' +
      '</section>';
  };

  R.oMnie = function (s, ctx) {
    if (!sekWidoczna(s, 'oMnie', ctx.today)) return pusta('oMnie');
    var d = s.oMnie, L = ctx.lang, sek = s.sekcje.oMnie;
    var wl = widoczne(d.wartosci);
    var war = wl.map(function (w) {
      return '<li class="wartosc" data-f="oMnie:' + esc(w.id) + '"><h3 data-f="oMnie:' + esc(w.id) + ':tytul">' + esc(t(w.tytul, L)) + '</h3>' +
        (t(w.opis, L) ? '<p data-f="oMnie:' + esc(w.id) + ':opis">' + inline(t(w.opis, L)) + '</p>' : '') + '</li>';
    }).join('');
    var warPopup = wl.length ? '<h3>' + esc(ui(ctx, 'wartosci')) + '</h3><ul class="okno-lista">' + wl.map(function (w) {
      return '<li><strong>' + esc(t(w.tytul, L)) + '</strong>' + (t(w.opis, L) ? ' — ' + inline(t(w.opis, L)) : '') + '</li>';
    }).join('') + '</ul>' : '';
    var obs = widoczne(d.obszary).map(function (o) { return '<li>' + esc(t(o.nazwa, L)) + '</li>'; }).join('');
    return otworzSekcje('oMnie', s, ctx, '', ' aria-labelledby="h-o-mnie"') +
      tloHtml(sek.tlo, ctx) +
      '<div class="sek-in omnie' + (d.zdjecie && d.zdjecie.src ? '' : ' omnie--bez-foto') + '">' +
      (d.zdjecie && d.zdjecie.src ? '<figure class="omnie-foto">' + imgTag(d.zdjecie, { lang: L, sizes: '(min-width: 900px) 34vw, 36vw', f: 'oMnie.zdjecie' }) + '</figure>' : '') +
      '<div class="omnie-tekst">' + naglowek('oMnie', s, ctx, 'h-o-mnie') +
      (t(d.lead, L) ? '<div class="lead" data-f="oMnie.lead">' + fmt(t(d.lead, L)) + '</div>' : '') +
      (obs ? '<div class="obszary" data-f="oMnie.obszary"><p class="obszary-tyt">' + esc(ui(ctx, 'fotografuje')) + '</p><ul>' + obs + '</ul></div>' : '') +
      (t(d.tresc, L) || warPopup ? czytajWiecej('omnie-wiecej', ui(ctx, 'czytajOMnie'), t(sek.menu, L)) : '') +
      (war ? '<ul class="wartosci">' + war + '</ul>' : '') +
      '</div></div>' +
      '<div class="rm" id="omnie-wiecej" data-f="oMnie.tresc">' + fmt(t(d.tresc, L)) + warPopup + '</div>' +
      '</section>';
  };

  /* tekst opowieści: dawne zapisy miały krótki tekst + osobny „pełny” — bierzemy dłuższy */
  function trescOpowiesci(o, L) {
    var a = t(o.tresc, L), b = t(o.wiecej, L);
    return plain(b).length > plain(a).length ? b : a;
  }
  A.trescOpowiesci = trescOpowiesci;
  R.historia = function (s, ctx) {
    if (!sekWidoczna(s, 'historia', ctx.today)) return pusta('historia');
    var L = ctx.lang, d = s.historia || {}, sek = s.sekcje.historia;
    var glowa = naglowek('historia', s, ctx, 'h-historia');
    /* Wariant 2: jedno duże zdjęcie i historia obok (bez roku).
     * Pusty nagłówek = tekst zaczyna się od samej góry. Gdy tekst nie zmieści się na ekranie,
     * site.js skraca go płynnie i pokazuje przycisk „Czytaj całą historię”. */
    if (d.wariant === 'opowiesc') {
      var o = d.opowiesc || {}, foto = o.zdjecie && o.zdjecie.src, tr = trescOpowiesci(o, L);
      return otworzSekcje('historia', s, ctx, 'sek--opowiesc', ' aria-labelledby="h-historia"') +
        tloHtml(sek.tlo, ctx) +
        '<div class="sek-in opowiesc' + (foto ? '' : ' opowiesc--bez-foto') + (glowa ? '' : ' opowiesc--bez-glowy') + '">' +
        (foto ? '<figure class="op-foto">' + imgTag(o.zdjecie, { lang: L, sizes: '(min-width: 900px) 46vw, 100vw', f: 'historia.opowiesc.zdjecie' }) + '</figure>' : '') +
        '<div class="op-tekst">' + glowa +
        (tr ? '<div class="op-tresc" data-f="historia.opowiesc.tresc">' + fmt(tr) + '</div>' +
          '<button type="button" class="link-wiecej op-wiecej" data-wiecej="historia-wiecej" aria-haspopup="dialog" data-tytul="' + esc(t(sek.naglowek, L) || t(sek.menu, L)) + '" hidden>' + esc(ui(ctx, 'czytajHist')) + '<span aria-hidden="true"> →</span></button>' : '') +
        '</div></div>' +
        (tr ? '<div class="rm" id="historia-wiecej">' + fmt(tr) + '</div>' : '') +
        '</section>';
    }
    /* Wariant 1 (domyślny): oś czasu przewijana w poziomie.
     * Etap: rok lub data, krótki opis (można wyłączyć) i opis tego, co się wtedy wydarzyło. */
    var el = widoczne(d.rozdzialy || []);
    var etapy = el.map(function (r, i) {
      var f = 'historia:' + r.id, tr = t(r.tresc, L), dl = plain(tr).length > 220, idw = 'hist-' + esc(r.id);
      var krotki = r.krotki !== false && t(r.tytul, L);
      return '<li class="os-el" data-f="' + esc(f) + '">' +
        '<p class="os-rok"' + (t(r.rok, L) ? ' data-f="' + esc(f) + ':rok"' : '') + '>' + (t(r.rok, L) ? esc(t(r.rok, L)) : String(i + 1).padStart(2, '0')) + '</p>' +
        '<span class="os-kropka" aria-hidden="true"></span>' +
        '<article class="os-karta">' +
        (r.tlo && r.tlo.src ? '<figure class="os-foto">' + imgTag(r.tlo, { lang: L, sizes: '(min-width: 900px) 420px, 80vw', f: f + ':tlo' }) + '</figure>' : '') +
        '<div class="os-tekst">' +
        (krotki ? '<h3 data-f="' + esc(f) + ':tytul">' + esc(t(r.tytul, L)) + '</h3>' : '') +
        (tr ? '<div class="os-opis" data-f="' + esc(f) + ':tresc">' + (dl ? '<p>' + esc(skrot(tr, 200)) + '</p>' : fmt(tr)) + '</div>' : '') +
        (dl ? czytajWiecej(idw, ui(ctx, 'czytaj'), (t(r.rok, L) ? t(r.rok, L) + ' — ' : '') + (t(r.tytul, L) || '')) : '') +
        '</div></article>' +
        (dl ? '<div class="rm" id="' + idw + '">' + fmt(tr) + '</div>' : '') +
        '</li>';
    }).join('');
    return otworzSekcje('historia', s, ctx, 'sek--os', ' aria-labelledby="h-historia"') +
      tloHtml(sek.tlo, ctx) +
      '<div class="sek-in historia-os">' +
      '<div class="os-glowa">' + (glowa ? '<div class="os-tyt">' + glowa + '</div>' : '') +
      (el.length > 1 ? '<div class="os-ster"><button type="button" class="moz-btn os-btn" data-os="-1" aria-label="' + esc(ui(ctx, 'osPoprz')) + '">←</button><button type="button" class="moz-btn os-btn" data-os="1" aria-label="' + esc(ui(ctx, 'osNast')) + '">→</button></div>' : '') +
      '</div>' +
      (etapy ? '<div class="os-okno"><ol class="os os--' + Math.min(el.length, 4) + '" tabindex="0" aria-label="' + esc(ui(ctx, 'osLista')) + '">' + etapy + '</ol></div><div class="os-postep" aria-hidden="true" hidden><span></span></div>' : '') +
      '</div></section>';
  };

  R.aktualnosci = function (s, ctx) {
    if (!sekWidoczna(s, 'aktualnosci', ctx.today)) return pusta('aktualnosci');
    var L = ctx.lang;
    var akt = aktywneWpisy(s, ctx.today).slice(0, 6);
    var wpisy = akt.map(function (w) {
      var id = 'wpis-' + esc(w.id), tr = t(w.tresc, L), dl = plain(tr).length > 130;
      return '<article class="wpis" id="' + id + '" data-f="aktualnosci:' + esc(w.id) + '">' +
        (w.zdjecie && w.zdjecie.src ? '<figure class="wpis-foto">' + imgTag(w.zdjecie, { lang: L, sizes: '(min-width: 900px) 30vw, 80vw', f: 'aktualnosci:' + w.id + ':zdjecie' }) + '</figure>' : '') +
        '<div class="wpis-tekst"><time datetime="' + esc(w.data || w.od) + '" data-f="aktualnosci:' + esc(w.id) + ':data">' + esc(dataPL(w.data || w.od, L)) + '</time>' +
        '<h3 data-f="aktualnosci:' + esc(w.id) + ':tytul">' + esc(t(w.tytul, L)) + '</h3>' +
        (dl ? '<p class="wpis-skrot" data-f="aktualnosci:' + esc(w.id) + ':tresc">' + esc(skrot(tr, 130)) + '</p>' + czytajWiecej(id + '-tresc', ui(ctx, 'czytajWpis'), t(w.tytul, L)) +
          '<div class="rm" id="' + id + '-tresc">' + fmt(tr) + '</div>'
          : (tr ? '<div class="wpis-tresc" data-f="aktualnosci:' + esc(w.id) + ':tresc">' + fmt(tr) + '</div>' : '')) +
        '</div></article>';
    }).join('');
    return otworzSekcje('aktualnosci', s, ctx, '', ' aria-labelledby="h-aktualnosci"') +
      tloHtml(s.sekcje.aktualnosci.tlo, ctx) +
      '<div class="sek-in">' + naglowek('aktualnosci', s, ctx, 'h-aktualnosci') +
      '<div class="wpisy wpisy--' + Math.min(akt.length, 3) + '" tabindex="-1">' + wpisy + '</div></div></section>';
  };

  R.kadra = function (s, ctx) {
    if (!sekWidoczna(s, 'kadra', ctx.today)) return pusta('kadra');
    var L = ctx.lang, lista = widoczne(s.kadra.lista);
    var os = lista.map(function (o) {
      var id = 'osoba-' + esc(o.id), op = t(o.opis, L), dl = plain(op).length > 170;
      return '<li class="osoba" data-f="kadra:' + esc(o.id) + '">' +
        (o.zdjecie && o.zdjecie.src ? '<figure class="osoba-foto">' + imgTag(o.zdjecie, { lang: L, sizes: '(min-width: 900px) 28vw, 34vw', f: 'kadra:' + o.id + ':zdjecie' }) + '</figure>' : '') +
        '<div class="osoba-tekst"><h3 data-f="kadra:' + esc(o.id) + ':imie">' + esc(t(o.imie, L)) + '</h3>' +
        (t(o.rola, L) ? '<p class="osoba-rola" data-f="kadra:' + esc(o.id) + ':rola">' + esc(t(o.rola, L)) + '</p>' : '') +
        (dl ? '<p data-f="kadra:' + esc(o.id) + ':opis">' + esc(skrot(op, 170)) + '</p>' + czytajWiecej(id + '-opis', ui(ctx, 'czytajOsoba') + ' ' + t(o.imie, L), t(o.imie, L)) + '<div class="rm" id="' + id + '-opis">' + fmt(op) + '</div>'
          : (op ? '<div data-f="kadra:' + esc(o.id) + ':opis">' + fmt(op) + '</div>' : '')) +
        '</div></li>';
    }).join('');
    return otworzSekcje('kadra', s, ctx, '', ' aria-labelledby="h-kadra"') +
      tloHtml(s.sekcje.kadra.tlo, ctx) +
      '<div class="sek-in">' + naglowek('kadra', s, ctx, 'h-kadra') +
      '<ul class="kadra kadra--' + Math.min(lista.length, 3) + '">' + os + '</ul></div></section>';
  };

  function ytId(u) {
    var m = String(u || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return m ? m[1] : '';
  }
  A.ytId = ytId;

  function proporcja(e) {
    var z = e.zdjecie;
    if (z && +z.w > 0 && +z.h > 0) return Math.max(0.4, Math.min(3, (+z.w) / (+z.h)));
    return e.typ === 'wideo' ? 16 / 9 : 1.5;
  }
  R.portfolio = function (s, ctx) {
    if (!sekWidoczna(s, 'portfolio', ctx.today)) return pusta('portfolio');
    var L = ctx.lang, el = widoczne(s.portfolio.elementy);
    var uzyte = {}; el.forEach(function (e) { uzyte[e.kategoria] = 1; });
    var kat = (s.portfolio.kategorie || []).filter(function (k) { return uzyte[k.id]; });
    var filtry = kat.length > 1 ? '<div class="filtry" role="group" aria-label="' + esc(ui(ctx, 'filtruj')) + '">' +
      '<button type="button" class="filtr" data-kat="*" aria-pressed="true">' + esc(ui(ctx, 'wszystkie')) + '</button>' +
      kat.map(function (k) { return '<button type="button" class="filtr" data-kat="' + esc(k.id) + '" aria-pressed="false">' + esc(t(k.nazwa, L)) + '</button>'; }).join('') + '</div>' : '';
    var kafle = el.map(function (e, i) {
      var pod = t(e.podpis, L), ar = proporcja(e).toFixed(4), media;
      if (e.typ === 'wideo' && e.wideo) {
        media = '<button type="button" class="slajd-wideo" data-wideo="' + esc(bezpiecznyUrl(e.wideo)) + '" aria-label="' + esc(ui(ctx, 'odtworz') + ': ' + pod) + '">' +
          imgTag(e.zdjecie, { lang: L, sizes: '(min-width: 900px) 40vw, 70vw', decor: true }) + '<span class="play" aria-hidden="true"></span></button>';
      } else {
        media = '<button type="button" class="slajd-pow" aria-label="' + esc(ui(ctx, 'powieksz') + ': ' + (pod || t(e.zdjecie && e.zdjecie.alt, L))) + '">' +
          imgTag(e.zdjecie, { lang: L, sizes: '(min-width: 900px) 40vw, 70vw', f: 'portfolio:' + e.id + ':zdjecie' }) + '</button>';
      }
      return '<figure class="kafel" data-kat="' + esc(e.kategoria) + '" data-ar="' + ar + '" style="--ar:' + ar + '" data-f="portfolio:' + esc(e.id) + '">' +
        media + (pod ? '<figcaption data-f="portfolio:' + esc(e.id) + ':podpis">' + esc(pod) + '</figcaption>' : '') + '</figure>';
    }).join('');
    return otworzSekcje('portfolio', s, ctx, '', ' aria-labelledby="h-portfolio"') +
      tloHtml(s.sekcje.portfolio.tlo, ctx) +
      '<div class="sek-in port">' +
      '<div class="port-glowa"><div class="port-tyt">' + naglowek('portfolio', s, ctx, 'h-portfolio') + '</div>' + filtry + '</div>' +
      '<div class="mozaika-okno" role="region" aria-label="' + esc(t(s.sekcje.portfolio.menu, L) || 'Portfolio') + '"><div class="mozaika">' + kafle + '</div></div>' +
      '<div class="mozaika-ster" hidden><button type="button" class="moz-btn" data-kier="-1" aria-label="' + esc(ui(ctx, 'poprzednie')) + '"><span aria-hidden="true">←</span></button>' +
      '<span class="moz-licznik" aria-live="polite"></span>' +
      '<button type="button" class="moz-btn" data-kier="1" aria-label="' + esc(ui(ctx, 'nastepne')) + '"><span aria-hidden="true">→</span></button></div>' +
      '</div></section>';
  };

  function igHandle(u) { var m = String(u || '').match(/instagram\.com\/([\w.]+)/); return m ? m[1] : ''; }
  R.instagram = function (s, ctx) {
    if (!sekWidoczna(s, 'instagram', ctx.today)) return pusta('instagram');
    var L = ctx.lang, d = s.instagram, k = s.kontakt, h = igHandle(k.instagram);
    if (d.posty === false) return igZaproszenie(s, ctx);
    var kafle = d.tryb === 'reczny' ? widoczne(d.reczne).slice(0, +d.liczba || 6).map(function (x) {
      return '<li><a href="' + esc(bezpiecznyUrl(x.link) || bezpiecznyUrl(k.instagram)) + '" target="_blank" rel="noopener">' +
        imgTag(x.zdjecie, { lang: L, sizes: '(min-width: 900px) 15vw, 45vw' }) + '<span class="sr">' + esc(t(x.podpis, L) || 'Instagram') + '</span></a></li>';
    }).join('') : '';
    return otworzSekcje('instagram', s, ctx, '', ' aria-labelledby="h-instagram"') +
      tloHtml(s.sekcje.instagram.tlo, ctx) +
      '<div class="sek-in">' + naglowek('instagram', s, ctx, 'h-instagram') +
      (t(s.sekcje.instagram.wstep, L) ? '' : '<p class="sek-wstep">' + esc(ui(ctx, 'igWstep')) + '</p>') +
      '<ul class="ig" data-ig-tryb="' + esc(d.tryb) + '" data-ig-liczba="' + (+d.liczba || 6) + '" data-ig-profil="' + esc(bezpiecznyUrl(k.instagram)) + '">' + kafle + '</ul>' +
      (k.instagram ? '<p class="ig-cta"><a class="btn btn--obrys" href="' + esc(bezpiecznyUrl(k.instagram)) + '" target="_blank" rel="noopener me">' + esc(ui(ctx, 'obserwuj')) + (h ? ' @' + esc(h) : '') + '</a></p>' : '') +
      '</div></section>';
  };

  /* Instagram bez pobierania postów: zaproszenie do odwiedzenia profilu.
   * Lewa kolumna — tekst, lista „co znajdziesz”, okrągły znak z aparatem + @nazwa (link do profilu).
   * Prawa — „karta profilu” z portretem i miniaturami zdjęć z portfolio (cała karta jest linkiem). */
  function igZaproszenie(s, ctx) {
    var L = ctx.lang, z = s.instagram.zaproszenie || {}, k = s.kontakt, url = bezpiecznyUrl(k.instagram), h = igHandle(k.instagram);
    var sek = s.sekcje.instagram;
    if (t(sek.naglowek, 'pl') === 'Najnowsze kadry z Instagrama') {   // dawny domyślny nagłówek nie pasuje do zaproszenia
      s = Object.assign({}, s, { sekcje: Object.assign({}, s.sekcje, { instagram: Object.assign({}, sek, { naglowek: { pl: 'Zajrzyj za kulisy moich sesji', en: 'Behind the scenes of my sessions' } }) }) });
    }
    var nowa = ' target="_blank" rel="noopener me"';
    var punkty = String(t(z.punkty, L) || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var zdj = widoczne(s.portfolio.elementy || []).filter(function (x) { return x.typ !== 'wideo' && x.zdjecie && x.zdjecie.src; }).slice(0, 6);
    var av = s.oMnie && s.oMnie.zdjecie;
    var logo = url ? '<a class="igz-logo" href="' + esc(url) + '"' + nowa + ' data-f="kontakt.instagram">' +
      '<span class="igz-logo-ik">' + ikona('aparat') + '</span>' +
      '<span class="igz-logo-t">' + (h ? '<span class="igz-handle">@' + esc(h) + '</span>' : '') + '<span class="igz-logo-pod">' + esc(ui(ctx, 'obserwuj')) + ' <span aria-hidden="true">→</span></span></span></a>' : '';
    var karta = z.karta !== false && url && zdj.length >= 3 ? '<a class="igk" href="' + esc(url) + '"' + nowa + ' aria-label="' + esc(ui(ctx, 'obserwuj') + (h ? ' @' + h : '')) + '" data-f="instagram.zaproszenie.karta">' +
      '<span class="igk-glowa">' + (av && av.src ? '<span class="igk-av">' + imgTag(av, { decor: true, sizes: '56px' }) + '</span>' : '') +
      '<span class="igk-dane"><strong>' + esc(h ? '@' + h : 'Instagram') + '</strong><small>' + esc(t(s.start.rola, L)) + '</small></span>' +
      '<span class="igk-ik">' + ikona('aparat') + '</span></span>' +
      '<span class="igk-siatka">' + zdj.slice(0, zdj.length >= 6 ? 6 : 3).map(function (x) { return '<span class="igk-kafel">' + imgTag(x.zdjecie, { decor: true, sizes: '(min-width: 900px) 140px, 30vw' }) + '</span>'; }).join('') + '</span>' +
      '<span class="igk-cta">' + esc(ui(ctx, 'igZobacz')) + ' <span aria-hidden="true">→</span></span></a>' : '';
    return otworzSekcje('instagram', s, ctx, 'sek--igz', ' aria-labelledby="h-instagram"') +
      tloHtml(sek.tlo, ctx) +
      '<div class="sek-in igz' + (karta ? '' : ' igz--bez-karty') + '"><div class="igz-tekst">' + naglowek('instagram', s, ctx, 'h-instagram') +
      (t(z.tekst, L) ? '<div class="igz-tresc" data-f="instagram.zaproszenie.tekst">' + fmt(t(z.tekst, L)) + '</div>' : '') +
      (punkty.length ? '<ul class="igz-punkty" data-f="instagram.zaproszenie.punkty">' + punkty.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>' : '') +
      logo + '</div>' + karta + '</div></section>';
  }

  function messengerUrl(k) { return bezpiecznyUrl(k.messenger) || bezpiecznyUrl(k.facebook); }
  A.messengerUrl = messengerUrl;
  function mapsUrl(k) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(k.mapa || 'Zgorzelec'); }

  /* Ikony kanałów kontaktu — proste, uniwersalne symbole (nie znaki towarowe serwisów) */
  var IK = {
    czat: '<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><circle cx="8" cy="11" r="1.2"/><circle cx="12" cy="11" r="1.2"/><circle cx="16" cy="11" r="1.2"/>',
    profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    aparat: '<path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',
    telefon: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    formularz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'
  };
  A.IKONY = IK;
  function ikona(n) { return '<svg class="kanal-ik-svg" viewBox="0 0 24 24" aria-hidden="true">' + IK[n] + '</svg>'; }
  function kanal(o) {
    var w = '<span class="kanal-ik">' + ikona(o.ik) + '</span><span class="kanal-t"><strong>' + esc(o.et) + '</strong>' + (o.pod ? '<small>' + esc(o.pod) + '</small>' : '') + '</span><span class="kanal-str" aria-hidden="true">→</span>';
    return '<li class="kanal' + (o.glowny ? ' kanal--glowny' : '') + '">' + (o.przycisk
      ? '<button type="button" class="kanal-a ' + o.przycisk + '" aria-haspopup="dialog"' + (o.f ? ' data-f="' + o.f + '"' : '') + '>' + w + '</button>'
      : '<a class="kanal-a" href="' + esc(o.href) + '"' + (o.zew ? ' target="_blank" rel="noopener' + (o.me ? ' me' : '') + '"' : '') + (o.f ? ' data-f="' + o.f + '"' : '') + '>' + w + '</a>') + '</li>';
  }

  /* Pole formularza zdefiniowane w panelu (Kontakt → Pola formularza) */
  /* ================= WALIDACJA FORMULARZA =================
   * Ten sam kod sprawdza dane w przeglądarce (od razu, przy wpisywaniu) i na serwerze
   * (functions/api/kontakt.js) — nie da się go obejść, wyłączając JavaScript. */
  /* Kraje: [kod ISO, nazwa, numer kierunkowy, min. cyfr, maks. cyfr, czy krajowe „0” na początku się pomija, przykład] */
  var KRAJE = [
    ['PL', 'Polska', '48', 9, 9, 0, '600 123 456'],
    ['DE', 'Niemcy', '49', 10, 11, 1, '1512 3456789'],
    ['CZ', 'Czechy', '420', 9, 9, 0, '601 123 456'],
    ['SK', 'Słowacja', '421', 9, 9, 1, '912 123 456'],
    ['UA', 'Ukraina', '380', 9, 9, 1, '50 123 4567'],
    ['LT', 'Litwa', '370', 8, 8, 0, '612 34567'],
    ['GB', 'Wielka Brytania', '44', 10, 10, 1, '7400 123456'],
    ['IE', 'Irlandia', '353', 9, 9, 1, '85 123 4567'],
    ['NL', 'Holandia', '31', 9, 9, 1, '6 12345678'],
    ['BE', 'Belgia', '32', 8, 9, 1, '470 12 34 56'],
    ['FR', 'Francja', '33', 9, 9, 1, '6 12 34 56 78'],
    ['ES', 'Hiszpania', '34', 9, 9, 0, '612 345 678'],
    ['IT', 'Włochy', '39', 9, 10, 0, '312 345 6789'],
    ['AT', 'Austria', '43', 10, 12, 1, '664 1234567'],
    ['CH', 'Szwajcaria', '41', 9, 9, 1, '78 123 45 67'],
    ['NO', 'Norwegia', '47', 8, 8, 0, '412 34 567'],
    ['SE', 'Szwecja', '46', 7, 9, 1, '70 123 45 67'],
    ['DK', 'Dania', '45', 8, 8, 0, '20 12 34 56'],
    ['US', 'USA i Kanada', '1', 10, 10, 0, '201 555 0123']
  ].map(function (k) { return { iso: k[0], nazwa: k[1], kod: k[2], min: k[3], max: k[4], zero: !!k[5], przyklad: k[6] }; });
  var KRAJ_INNY = { iso: 'XX', nazwa: 'Inny kraj', kod: '', min: 7, max: 15, zero: false, przyklad: '+421 912 123 456' };
  function kraj(iso) { return KRAJE.filter(function (k) { return k.iso === iso; })[0] || (iso === 'XX' ? KRAJ_INNY : KRAJE[0]); }
  function cyfr(n) { return n === 1 ? 'cyfrę' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'cyfry' : 'cyfr'; }
  function grupuj(d) {
    var w = { 7: [3, 4], 8: [4, 4], 9: [3, 3, 3], 10: [3, 3, 4], 11: [3, 4, 4], 12: [3, 3, 3, 3] }[d.length];
    if (!w) return d;
    var o = [], i = 0; w.forEach(function (n) { o.push(d.substr(i, n)); i += n; }); return o.join(' ');
  }
  /* Rozbiór numeru: iso = kraj wybrany na liście, numer = to, co wpisano.
   * Zwraca { ok, blad, wartosc ('+48 600 123 456'), iso, krajowy }. Wpisany „+49…” / „0049…” sam zmienia kraj. */
  function telefon(iso, numer) {
    var raw = String(numer == null ? '' : numer).trim(), k = kraj(iso);
    if (!raw) return { ok: true, pusty: true, iso: k.iso, wartosc: '' };
    if (/[^\d\s\-().+\/]/.test(raw)) return { ok: false, iso: k.iso, blad: 'Numer telefonu może zawierać tylko cyfry (dopuszczalne są spacje i myślniki).' };
    if (raw.indexOf('+') > 0 || (raw.match(/\+/g) || []).length > 1) return { ok: false, iso: k.iso, blad: 'Znak + może stać tylko na początku numeru.' };
    var d = raw.replace(/\D/g, ''), miedzy = /^\+|^00/.test(raw.replace(/\s/g, ''));
    if (miedzy) {
      if (/^00/.test(d)) d = d.slice(2);
      var znal = KRAJE.slice().sort(function (a, b) { return b.kod.length - a.kod.length; }).filter(function (x) { return d.indexOf(x.kod) === 0; })[0];
      if (znal) { k = znal; d = d.slice(k.kod.length); }
      else {
        if (d.length < 8 || d.length > 15) return { ok: false, iso: 'XX', blad: 'Numer międzynarodowy powinien mieć od 8 do 15 cyfr razem z numerem kierunkowym.' };
        return { ok: true, iso: 'XX', wartosc: '+' + d, krajowy: d };
      }
    } else if (k.iso === 'XX') {
      return { ok: false, iso: 'XX', blad: 'Dla innego kraju proszę wpisać numer z numerem kierunkowym, np. +421 912 123 456.' };
    } else if (d.indexOf(k.kod) === 0 && d.length - k.kod.length >= k.min && d.length - k.kod.length <= k.max && d.length > k.max) {
      d = d.slice(k.kod.length);   // ktoś wpisał „48 600 123 456” bez plusa
    }
    if (k.zero && d.charAt(0) === '0') d = d.slice(1);    // krajowe „0” (np. 0151… w Niemczech, 07… w Anglii)
    if (k.iso === 'PL' && d.charAt(0) === '0') return { ok: false, iso: k.iso, blad: 'Polski numer nie zaczyna się od 0 — proszę wpisać 9 cyfr, np. 600 123 456.' };
    var n = d.length, ile = k.min === k.max ? k.min + ' ' + cyfr(k.min) : 'od ' + k.min + ' do ' + k.max + ' cyfr';
    if (n < k.min || n > k.max) return { ok: false, iso: k.iso, blad: 'Numer telefonu (' + k.nazwa + ', +' + k.kod + ') powinien mieć ' + ile + ' — wpisano ' + n + ' ' + cyfr(n) + '.' };
    return { ok: true, iso: k.iso, wartosc: '+' + k.kod + ' ' + grupuj(d), krajowy: grupuj(d) };
  }
  function opisDlugosci(iso) { var k = kraj(iso); return k.iso === 'XX' ? 'numer z kierunkowym, np. +421 912 123 456' : (k.min === k.max ? k.min + ' ' + cyfr(k.min) : 'od ' + k.min + ' do ' + k.max + ' cyfr') + ', np. ' + k.przyklad; }
  function emailBlad(v) {
    v = String(v || '').trim();
    if (/\s/.test(v)) return 'Adres e-mail nie może zawierać spacji.';
    var at = (v.match(/@/g) || []).length;
    if (!at) return 'W adresie e-mail brakuje znaku @ (np. jan.kowalski@gmail.com).';
    if (at > 1) return 'Adres e-mail może zawierać tylko jeden znak @.';
    var cz = v.split('@'), lok = cz[0], dom = cz[1];
    if (!lok) return 'Przed znakiem @ brakuje nazwy skrzynki (np. jan.kowalski@…).';
    if (!dom) return 'Po znaku @ brakuje domeny (np. …@gmail.com).';
    if (/[^\x21-\x7e]/.test(v)) return 'Adres e-mail nie może zawierać polskich liter ani innych znaków specjalnych.';
    if (v.length > 254 || lok.length > 64) return 'Adres e-mail jest za długi.';
    if (!/^[A-Za-z0-9!#$%&'*+\/=?^_`{|}~.-]+$/.test(lok) || /^\.|\.$|\.\./.test(lok)) return 'Część przed znakiem @ zawiera niedozwolone znaki lub kropki w złym miejscu.';
    if (dom.indexOf('.') < 0) return 'Domena po znaku @ musi zawierać kropkę (np. gmail.com, wp.pl).';
    var et = dom.split('.');
    if (et.some(function (x) { return !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(x); })) return 'Domena po znaku @ jest niepoprawna (np. gmail.com, wp.pl).';
    if (!/^[A-Za-z]{2,24}$/.test(et[et.length - 1])) return 'Końcówka domeny jest niepoprawna (np. .pl, .com).';
    return '';
  }
  /* podpowiedź przy literówce w popularnej domenie: „gmial.com” → „gmail.com” (tylko podpowiedź, nie błąd) */
  var DOMENY = ['gmail.com', 'wp.pl', 'o2.pl', 'onet.pl', 'op.pl', 'interia.pl', 'poczta.onet.pl', 'gazeta.pl', 'tlen.pl', 'vp.pl', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'protonmail.com', 'gmx.de', 'web.de', 'seznam.cz'];
  function lev(a, b) {
    var m = [], i, j; for (i = 0; i <= b.length; i++) m[i] = [i];
    for (j = 0; j <= a.length; j++) m[0][j] = j;
    for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) m[i][j] = Math.min(m[i - 1][j - 1] + (b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1), m[i][j - 1] + 1, m[i - 1][j] + 1);
    return m[b.length][a.length];
  }
  function emailPodpowiedz(v) {
    v = String(v || '').trim(); if (emailBlad(v)) return '';
    var cz = v.split('@'), dom = cz[1].toLowerCase(); if (DOMENY.indexOf(dom) >= 0) return '';
    var naj = DOMENY.map(function (x) { return [x, lev(dom, x)]; }).sort(function (a, b) { return a[1] - b[1]; })[0];
    return naj && naj[1] <= 2 && naj[1] > 0 ? cz[0] + '@' + naj[0] : '';
  }
  /* Sprawdzenie jednej wartości według definicji pola z panelu. Zwraca '' albo komunikat. */
  function walidujPole(p, v, dzisISO, kat) {
    v = String(v == null ? '' : v).trim();
    if (!v) return p.wym ? (p.typ === 'tak' ? 'Proszę zaznaczyć to pole.' : p.typ === 'wybor' ? 'Proszę wybrać jedną z opcji.' : 'Proszę uzupełnić to pole.') : '';
    if (p.typ === 'email') return emailBlad(v);
    if (p.typ === 'telefon') { var r = telefon('PL', v); return r.ok ? '' : r.blad; }
    if (p.typ === 'data') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v + 'T00:00:00Z'))) return 'Proszę wybrać poprawną datę.';
      if (dzisISO && v < dzisISO) return 'Ta data już minęła — proszę wybrać dzisiejszą lub późniejszą.';
      if (dzisISO && +v.slice(0, 4) > +dzisISO.slice(0, 4) + 3) return 'Proszę wybrać datę w ciągu najbliższych 3 lat.';
      return '';
    }
    if (p.typ === 'liczba' && !/^-?\d+([.,]\d+)?$/.test(v)) return 'Proszę wpisać liczbę.';
    if (p.id === 'imie') {
      if (v.length < 2) return 'Proszę wpisać co najmniej 2 litery.';
      if (!/^[A-Za-zÀ-ɏͰ-ϿЀ-ӿ][A-Za-zÀ-ɏͰ-ϿЀ-ӿ\s'’.-]*$/.test(v)) return 'Imię może zawierać tylko litery, spacje, myślnik i apostrof.';
    }
    if (p.typ === 'obszar' && p.wym && v.length < 10) return 'Wiadomość jest bardzo krótka — proszę napisać choć kilka słów (min. 10 znaków).';
    if (v.length > (p.typ === 'obszar' ? 4000 : 300)) return 'Tekst jest za długi.';
    return '';
  }
  A.form = { KRAJE: KRAJE, KRAJ_INNY: KRAJ_INNY, kraj: kraj, telefon: telefon, opisDlugosci: opisDlugosci, emailBlad: emailBlad, emailPodpowiedz: emailPodpowiedz, walidujPole: walidujPole };

  var TYPY_POL = { tekst: 'text', email: 'email', telefon: 'tel', data: 'date', liczba: 'number' };
  var AUTO = { imie: 'name', email: 'email', telefon: 'tel' };
  function poleFormularza(p, ctx, kat) {
    var L = ctx.lang, id = 'f-' + esc(p.id), et = t(p.etykieta, L) || p.id, ph = t(p.podpowiedz, L);
    var lab = '<label for="' + id + '">' + esc(et) + ' <span class="wym">(' + esc(ui(ctx, p.wym ? 'f_wym' : 'f_opc')) + ')</span></label>';
    var wsp = ' name="' + esc(p.id) + '" data-typ="' + esc(p.typ) + '"' + (p.wym ? ' required' : '') + (ph ? ' placeholder="' + esc(ph) + '"' : '');
    var pelne = p.szer === 'pelna' || p.typ === 'obszar' || p.typ === 'tak';
    var ctl;
    if (p.typ === 'obszar') ctl = '<textarea id="' + id + '"' + wsp + ' rows="4" maxlength="4000"></textarea>';
    else if (p.typ === 'wybor') {
      var op = p.zrodlo === 'kategorie' ? (kat || []).map(function (c) { return t(c.nazwa, L); }).concat([ui(ctx, 'f_inne')])
        : String(t(p.opcje, L) || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
      ctl = '<select id="' + id + '"' + wsp + '><option value="">' + esc(ui(ctx, 'f_wybierz')) + '</option>' + op.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else if (p.typ === 'tak') {
      return '<div class="pole pole-zgoda pole--pelne" data-f="pole:' + esc(p.id) + '"><input type="checkbox" id="' + id + '"' + wsp + ' value="tak"><label for="' + id + '">' + esc(et) + (p.wym ? ' <span class="wym">(' + esc(ui(ctx, 'f_wym')) + ')</span>' : '') + '</label><p class="blad" id="' + id + '-b" hidden></p></div>';
    } else if (p.typ === 'telefon') {
      /* numer kierunkowy: natywna lista (wygodna na telefonie), na wierzchu widać tylko „PL +48” */
      var k0 = KRAJE[0];
      ctl = '<div class="tel"><div class="tel-kier"><span class="tel-kod" aria-hidden="true">' + k0.iso + ' +' + k0.kod + '</span>' +
        '<select id="' + id + '-kraj" class="tel-kraj" data-kraj-dla="' + id + '" aria-label="' + esc(ui(ctx, 'f_kraj')) + '">' +
        KRAJE.concat([KRAJ_INNY]).map(function (k) { return '<option value="' + k.iso + '"' + (k === k0 ? ' selected' : '') + '>' + esc(k.nazwa) + (k.kod ? ' (+' + k.kod + ')' : '') + '</option>'; }).join('') + '</select></div>' +
        '<input id="' + id + '" type="tel" inputmode="tel" autocomplete="tel-national"' + wsp.replace(' placeholder="' + esc(ph) + '"', '') + ' placeholder="' + esc(k0.przyklad) + '" maxlength="24" aria-describedby="' + id + '-p"></div>' +
        '<p class="pole-pod" id="' + id + '-p">' + esc(opisDlugosci('PL')) + '</p>';
    } else if (p.typ === 'email') {
      ctl = '<input id="' + id + '" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false"' + wsp + ' maxlength="254">' +
        '<p class="pole-pod podpow" id="' + id + '-h" hidden></p>';
    } else ctl = '<input id="' + id + '" type="' + (TYPY_POL[p.typ] || 'text') + '"' + wsp + (AUTO[p.id] ? ' autocomplete="' + AUTO[p.id] + '"' : '') + (p.typ === 'data' ? ' min="' + esc(ctx.today) + '"' : '') + ' maxlength="300">';
    return '<div class="pole' + (pelne ? ' pole--pelne' : '') + '" data-f="pole:' + esc(p.id) + '">' + lab + ctl + '<p class="blad" id="' + id + '-b" role="alert" hidden></p></div>';
  }
  A.poleFormularza = poleFormularza;

  R.kontakt = function (s, ctx) {
    var L = ctx.lang, k = s.kontakt, kat = s.portfolio.kategorie || [], h = igHandle(k.instagram);
    var tel = String(k.telefon || '').replace(/\D/g, '').replace(/^48(?=\d{9}$)/, '');
    var kan = kanal({ ik: 'czat', et: ui(ctx, 'messenger'), pod: 'Messenger', href: messengerUrl(k), zew: 1, glowny: 1, f: 'kontakt.messenger' });
    if (k.facebook) kan += kanal({ ik: 'profil', et: 'Facebook', pod: ui(ctx, 'facebook'), href: bezpiecznyUrl(k.facebook), zew: 1, me: 1, f: 'kontakt.facebook' });
    if (k.instagram) kan += kanal({ ik: 'aparat', et: 'Instagram', pod: h ? '@' + h : ui(ctx, 'instagram'), href: bezpiecznyUrl(k.instagram), zew: 1, me: 1, f: 'kontakt.instagram' });
    if (k.telefonWidoczny && k.telefon) kan += kanal({ ik: 'telefon', et: ui(ctx, 'zadzwon'), pod: k.telefon, href: 'tel:+48' + tel, f: 'kontakt.telefon' });
    if (k.emailWidoczny && k.email) kan += kanal({ ik: 'email', et: 'E-mail', pod: k.email, href: 'mailto:' + k.email, f: 'kontakt.email' });
    if (k.formularz) kan += kanal({ ik: 'formularz', et: ui(ctx, 'formularz'), pod: ui(ctx, 'formPod'), przycisk: 'form-otworz' });
    var polaHtml = widoczne(k.pola).map(function (p) { return poleFormularza(p, ctx, kat); }).join('');
    var form = k.formularz ? '<dialog class="okno okno-form" id="kontakt-form" aria-labelledby="h-formularz">' +
      '<div class="okno-glowa"><h3 id="h-formularz">' + esc(ui(ctx, 'formularz')) + '</h3><button type="button" class="zamknij" data-zamknij aria-label="' + esc(ui(ctx, 'zamknij')) + '">×</button></div>' +
      '<div class="okno-tresc">' + (t(k.zachetaFormularza, L) ? '<p class="form-zacheta" data-f="kontakt.zachetaFormularza">' + inline(t(k.zachetaFormularza, L)) + '</p>' : '') +
      '<form id="formularz" novalidate aria-labelledby="h-formularz">' + polaHtml +
      '<div class="pole pole-hp" aria-hidden="true"><label for="f-www">' + esc(ui(ctx, 'f_hp')) + '</label><input id="f-www" type="text" name="www" tabindex="-1" autocomplete="off"></div>' +
      '<div class="pole pole-zgoda pole--pelne"><input type="checkbox" id="f-zgoda" name="zgoda" required><label for="f-zgoda">' + esc(ui(ctx, 'f_zgoda')) + ' <a href="polityka-prywatnosci.html' + linkJezyka(L) + '">' + esc(ui(ctx, 'polityka').toLowerCase()) + '</a>.</label><p class="blad" id="f-zgoda-b" hidden></p></div>' +
      '<button type="submit" class="btn btn--glowny btn--pelny">' + esc(ui(ctx, 'f_wyslij')) + '</button>' +
      '<div class="form-status" role="status" aria-live="polite"></div>' +
      '</form></div></dialog>' : '';
    var obszar = (t(k.obszar, L) ? '<p data-f="kontakt.obszar">' + inline(t(k.obszar, L)) + '</p>' : '') +
      (k.miasta ? '<p class="miasta" data-f="kontakt.miasta">' + esc(k.miasta) + '</p>' : '');
    return otworzSekcje('kontakt', s, ctx, '', ' aria-labelledby="h-kontakt"') +
      tloHtml(s.sekcje.kontakt.tlo, ctx) +
      '<div class="sek-in kontakt"><div class="kontakt-info">' + naglowek('kontakt', s, ctx, 'h-kontakt') +
      '<ul class="kanaly">' + kan + '</ul></div>' +
      '<div class="kontakt-obszar">' + (obszar ? '<h3>' + esc(ui(ctx, 'obszar')) + '</h3>' + obszar : '') +
      '<p class="linki-male"><button type="button" class="link-mapa" data-mapa="' + esc(k.mapa || 'Zgorzelec') + '" aria-haspopup="dialog">' + esc(ui(ctx, 'mapa')) + '</button></p>' +
      '<p class="linki-male"><a href="' + esc(bezpiecznyUrl(k.profilGoogle) || mapsUrl(k)) + '" target="_blank" rel="noopener" data-f="kontakt.profilGoogle">' + esc(bezpiecznyUrl(k.profilGoogle) ? ui(ctx, 'profil') : ui(ctx, 'otworzMapy')) + '</a>' +
      (bezpiecznyUrl(k.opinieGoogle) ? '<span aria-hidden="true">·</span><a href="' + esc(bezpiecznyUrl(k.opinieGoogle)) + '" target="_blank" rel="noopener" data-f="kontakt.opinieGoogle">' + esc(ui(ctx, 'opinie')) + '</a>' : '') + '</p>' +
      '</div></div>' + form + '</section>';
  };

  /* ---------- Elementy wspólne ---------- */
  /* Kolejność sekcji (panel → Sekcje strony): pierwszy ekran zawsze na początku */
  function kolejnosc(s) {
    var mapa = {}; SEKCJE.forEach(function (x) { mapa[x.k] = x; });
    var ord = ((s.ustawienia && s.ustawienia.kolejnosc) || []).filter(function (k, i, a) { return mapa[k] && k !== 'start' && a.indexOf(k) === i; });
    SEKCJE.forEach(function (x) { if (x.k !== 'start' && ord.indexOf(x.k) < 0) ord.push(x.k); });
    return [mapa.start].concat(ord.map(function (k) { return mapa[k]; }));
  }
  A.kolejnosc = kolejnosc;
  function menuPozycje(s, ctx) {
    return kolejnosc(s).filter(function (x) { return x.k !== 'start' && sekWidoczna(s, x.k, ctx.today); });
  }
  R.nav = function (s, ctx) {
    return '<ul class="menu-lista" id="menu-lista" data-ssr="nav">' + menuPozycje(s, ctx).map(function (x) {
      return '<li><a href="#' + x.id + '">' + esc(t(s.sekcje[x.k].menu, ctx.lang)) + '</a></li>';
    }).join('') + '</ul>';
  };
  R.kropki = function (s, ctx) {
    var poz = [{ k: 'start', id: 'start' }].concat(menuPozycje(s, ctx));
    return '<nav class="kropki" data-ssr="kropki" aria-label="' + esc(ui(ctx, 'sekcje')) + '"' + (s.ustawienia.kropki ? '' : ' hidden') + '><ul>' + poz.map(function (x) {
      return '<li><a href="#' + x.id + '" data-kropka="' + x.id + '"><span class="sr">' + esc(t(s.sekcje[x.k].menu, ctx.lang)) + '</span><span class="kropka-et" aria-hidden="true">' + esc(t(s.sekcje[x.k].menu, ctx.lang)) + '</span></a></li>';
    }).join('') + '</ul></nav>';
  };
  R.jezyki = function (s, ctx) {
    var wl = jezykiWl(s);
    if (wl.length < 2) return '<div class="jezyki" data-ssr="jezyki" hidden></div>';
    return '<div class="jezyki" data-ssr="jezyki"><span class="sr">' + esc(ui(ctx, 'jezyk')) + ':</span><ul>' + wl.map(function (j) {
      return '<li><a href="./' + linkJezyka(j.kod) + '" hreflang="' + esc(j.kod) + '" lang="' + esc(j.kod) + '" data-jezyk="' + esc(j.kod) + '"' + (j.kod === ctx.lang ? ' aria-current="true"' : '') + '>' + esc(j.kod.toUpperCase()) + '</a></li>';
    }).join('') + '</ul></div>';
  };
  R.pasek = function (s, ctx) {
    var poz = aktywneWpisy(s, ctx.today).filter(function (w) { return w.naPasku; });
    if (!poz.length || !s.sekcje.aktualnosci.widoczna) return '<div class="pasek" data-ssr="pasek" hidden></div>';
    return '<div class="pasek" data-ssr="pasek" role="region" aria-label="' + esc(ui(ctx, 'pasek')) + '"><div class="pasek-in">' +
      '<ul class="pasek-lista">' + poz.map(function (w, i) {
        return '<li' + (i ? ' hidden' : '') + '><a href="#wpis-' + esc(w.id) + '"><strong>' + esc(t(w.tytul, ctx.lang)) + '</strong><span aria-hidden="true"> →</span></a></li>';
      }).join('') + '</ul>' + (poz.length > 1 ? '<span class="pasek-licznik" aria-hidden="true">1/' + poz.length + '</span>' : '') + '</div></div>';
  };
  /* Polityka prywatności (podstrona) — punkt 1 składa się z danych administratora, reszta z listy w panelu */
  R.polityka = function (s, ctx) {
    var L = ctx.lang, p = s.polityka || {}, k = s.kontakt, U = '[DO UZUPEŁNIENIA]';
    var admin = 'Administratorem danych osobowych jest ' + esc(p.administrator || U) + ', prowadząca działalność gospodarczą pod nazwą ' +
      esc(k.nazwaRejestrowa || 'Anna Niedobitek Fotografia') + ', NIP: ' + esc(k.nip || U) + ', adres do korespondencji: ' + esc(p.adres || U) +
      '. Kontakt w sprawach danych osobowych: przez formularz kontaktowy na stronie, Messengera lub e-mail ' +
      (p.email ? '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : U) + '.';
    var nr = 1;
    return '<article class="prose" data-ssr="polityka"><h1>' + esc(ui(ctx, 'polityka')) + '</h1>' +
      (t(p.wstep, L) ? '<div class="prose-lead" data-f="polityka.wstep">' + fmt(t(p.wstep, L)) + '</div>' : '') +
      '<h2>' + (nr++) + '. Administrator danych</h2><p data-f="polityka.administrator">' + admin + '</p>' +
      widoczne(p.punkty || []).map(function (x) {
        return '<section data-f="polityka:' + esc(x.id) + '"><h2>' + (nr++) + '. ' + esc(t(x.tytul, L)) + '</h2>' + fmt(t(x.tresc, L)) + '</section>';
      }).join('') +
      (p.data ? '<p class="prose-data">Ostatnia aktualizacja: ' + esc(dataPL(p.data, L)) + '</p>' : '') +
      '<p><a class="btn btn--obrys" href="./">← ' + esc(ui(ctx, 'wroc')) + '</a></p></article>';
  };
  R.stopka = function (s, ctx) {
    var L = ctx.lang, k = s.kontakt;
    var dane = '<li>' + esc(k.nazwaRejestrowa || t(s.start.nazwa, L)) + '</li>' +
      '<li>' + esc(ui(ctx, 'nip')) + ': ' + esc(k.nip || ui(ctx, 'uzupelnij')) + '</li>' +
      (k.regon ? '<li>' + esc(ui(ctx, 'regon')) + ': ' + esc(k.regon) + '</li>' : '') +
      (k.krs ? '<li>' + esc(ui(ctx, 'krs')) + ': ' + esc(k.krs) + '</li>' : '');
    var kont = '<li><a href="' + esc(messengerUrl(k)) + '" target="_blank" rel="noopener">Messenger</a></li>' +
      (k.facebook ? '<li><a href="' + esc(bezpiecznyUrl(k.facebook)) + '" target="_blank" rel="noopener me">Facebook</a></li>' : '') +
      (k.instagram ? '<li><a href="' + esc(bezpiecznyUrl(k.instagram)) + '" target="_blank" rel="noopener me">Instagram</a></li>' : '') +
      (k.telefonWidoczny && k.telefon ? '<li><a href="tel:+48' + esc(String(k.telefon).replace(/\D/g, '').replace(/^48(?=\d{9}$)/, '')) + '">' + esc(k.telefon) + '</a></li>' : '') +
      (k.emailWidoczny && k.email ? '<li><a href="mailto:' + esc(k.email) + '">' + esc(k.email) + '</a></li>' : '');
    return '<footer class="stopka" data-ssr="stopka"><div class="stopka-in">' +
      '<div class="stopka-marka"><p class="marka-tekst"><span>' + esc(t(s.start.nazwa, L)) + '</span> <em>Fotografia</em></p>' +
      (t(s.stopka.haslo, L) ? '<p class="stopka-haslo" data-f="stopka.haslo">' + esc(t(s.stopka.haslo, L)) + '</p>' : '') +
      '<p class="stopka-obszar">' + esc(t(s.start.rola, L)) + '<br>' + esc(k.miasta) + '</p></div>' +
      '<nav class="stopka-nav" aria-label="' + esc(ui(ctx, 'sekcje')) + '"><ul>' + menuPozycje(s, ctx).map(function (x) {
        return '<li><a href="#' + x.id + '">' + esc(t(s.sekcje[x.k].menu, L)) + '</a></li>';
      }).join('') + '</ul></nav>' +
      '<div class="stopka-kontakt"><ul>' + kont + '</ul></div>' +
      '<div class="stopka-dane"><p class="stopka-tyt">' + esc(ui(ctx, 'dane')) + '</p><ul>' + dane + '</ul></div>' +
      '</div><div class="stopka-dol"><p>© ' + (ctx.today || '').slice(0, 4) + ' ' + esc(k.nazwaRejestrowa || 'Anna Niedobitek Fotografia') + '. ' + esc(ui(ctx, 'prawa')) + '</p>' +
      '<ul><li><a href="polityka-prywatnosci.html' + linkJezyka(L) + '">' + esc(ui(ctx, 'polityka')) + '</a></li>' +
      '<li><a href="#panel" class="link-panel" data-panel>' + esc(ui(ctx, 'panel')) + '</a></li></ul></div>' +
      /* podpis wykonawcy strony — stały, celowo bez możliwości edycji w panelu */
      '<p class="stopka-autor"><a href="https://stronyaiwroclaw.pl/" target="_blank" rel="noopener" title="Strony AI Wrocław — strony, które budują wizerunek"><span>' + esc(ui(ctx, 'autor')) + '</span><span class="logo-sai" role="img" aria-label="Strony AI Wrocław (otwiera się w nowej karcie)"></span></a></p></footer>';
  };

  /* ---------- SEO: JSON-LD, title, description, hreflang ---------- */
  function abs(u) { if (!u) return ''; if (/^https?:/i.test(u)) return u; return DOMENA + '/' + String(u).replace(/^\.?\//, ''); }
  R.jsonld = function (s, ctx) {
    var L = ctx.lang, k = s.kontakt, sameAs = [k.facebook, k.instagram, k.profilGoogle].filter(function (x) { return bezpiecznyUrl(x) && /^https?:/.test(x); });
    var org = {
      '@type': 'ProfessionalService', '@id': DOMENA + '/#firma',
      name: k.nazwaRejestrowa || 'Anna Niedobitek Fotografia',
      description: t(s.seo.description, L), url: DOMENA + '/', image: DOMENA + '/assets/img/og-image.jpg',
      slogan: t(s.start.motto, L), foundingDate: '2021',
      founder: { '@id': DOMENA + '/#anna' },
      areaServed: [{ '@type': 'AdministrativeArea', name: 'Dolny Śląsk' }].concat(String(k.miasta || '').split(',').map(function (m) { return m.trim(); }).filter(Boolean).map(function (m) { return { '@type': 'City', name: m }; })),
      knowsAbout: widoczne(s.oMnie.obszary).map(function (o) { return t(o.nazwa, L); }),
      hasMap: bezpiecznyUrl(k.profilGoogle) || mapsUrl(k),
      sameAs: sameAs
    };
    if (k.telefonWidoczny && k.telefon) org.telephone = '+48 ' + k.telefon;
    if (k.emailWidoczny && k.email) org.email = k.email;
    if (k.nip) org.taxID = k.nip;
    if (k.regon) org.identifier = { '@type': 'PropertyValue', propertyID: 'REGON', value: k.regon };
    var anna = { '@type': 'Person', '@id': DOMENA + '/#anna', name: t(s.start.nazwa, L), jobTitle: 'Fotograf', worksFor: { '@id': DOMENA + '/#firma' }, sameAs: sameAs.slice(0, 2) };
    if (s.oMnie.zdjecie && s.oMnie.zdjecie.src) anna.image = abs(s.oMnie.zdjecie.src);
    var g = [org, anna, {
      '@type': 'WebSite', '@id': DOMENA + '/#strona', url: DOMENA + '/', name: 'Anna Niedobitek Fotografia',
      inLanguage: jezykiWl(s).map(function (j) { return j.kod; }), publisher: { '@id': DOMENA + '/#firma' }
    }, {
      '@type': 'WebPage', '@id': DOMENA + '/#strona-glowna', url: DOMENA + '/', name: t(s.seo.title, L), inLanguage: L,
      isPartOf: { '@id': DOMENA + '/#strona' }, about: { '@id': DOMENA + '/#firma' }, primaryImageOfPage: abs(s.sekcje.start.tlo.obraz && s.sekcje.start.tlo.obraz.src)
    }];
    if (s.sekcje.aktualnosci.widoczna) aktywneWpisy(s, ctx.today).slice(0, 6).forEach(function (w) {
      var a = { '@type': 'NewsArticle', headline: t(w.tytul, L).slice(0, 110), datePublished: w.data || w.od, url: DOMENA + '/#wpis-' + w.id, inLanguage: L,
        author: { '@id': DOMENA + '/#anna' }, publisher: { '@id': DOMENA + '/#firma' }, articleBody: plain(t(w.tresc, L)) };
      if (w.zdjecie && w.zdjecie.src) a.image = abs(w.zdjecie.src);
      g.push(a);
    });
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
  };
  R.hreflang = function (s) {
    var wl = jezykiWl(s);
    if (wl.length < 2) return '';
    return wl.map(function (j) { return '<link rel="alternate" hreflang="' + esc(j.kod) + '" href="' + DOMENA + '/' + linkJezyka(j.kod) + '">'; }).join('') +
      '<link rel="alternate" hreflang="x-default" href="' + DOMENA + '/">';
  };

  /* ---------- Całość ---------- */
  function ctxDla(s, op) {
    op = op || {};
    var today = op.today || dzis();
    var lang = op.lang || 'pl';
    if (!jezykiWl(s).some(function (j) { return j.kod === lang; })) lang = 'pl';
    var ctx = { lang: lang, today: today };
    var nast = kolejnosc(s).filter(function (x) { return x.k !== 'start' && sekWidoczna(s, x.k, today); })[0];
    ctx.nastepna = nast ? nast.id : 'kontakt';
    return ctx;
  }
  function sekcja(k, s, ctx) { return R[k](s, ctx); }

  /* Skrót danych — pozwala sprawdzić, czy HTML odpowiada aktualnym danym */
  function hash(str) { var h = 5381, i = str.length; while (i) h = (h * 33) ^ str.charCodeAt(--i); return (h >>> 0).toString(36); }
  function znacznik(s, ctx) { return ctx.today + '|' + ctx.lang + '|' + hash(JSON.stringify(s)); }

  A.R = R;
  A.render = {
    hash: hash, znacznik: znacznik,
    esc: esc, t: t, fmt: fmt, inline: inline, plain: plain, skrot: skrot, dzis: dzis, dataPL: dataPL,
    status: status, aktywneWpisy: aktywneWpisy, widoczne: widoczne, scal: scal, clone: clone,
    jezykiWl: jezykiWl, sekWidoczna: sekWidoczna, idSekcji: idSekcji, ctx: ctxDla, sekcja: sekcja,
    imgTag: imgTag, bezpiecznyUrl: bezpiecznyUrl, igHandle: igHandle, ui: ui,
    /* Wszystkie fragmenty strony sterowane danymi: klucz data-ssr → HTML */
    wszystko: function (s, op) {
      var ctx = ctxDla(s, op), out = {};
      SEKCJE.forEach(function (x) { out[x.k] = R[x.k](s, ctx); });
      out.sekcje = kolejnosc(s).map(function (x) { return out[x.k]; }).join('\n');
      out.motyw = motyw(s);
      out.motywTlo = MOTYWY.filter(function (m) { return m.id === out.motyw; })[0].tlo;
      ['nav', 'kropki', 'jezyki', 'pasek', 'stopka', 'polityka'].forEach(function (k) { out[k] = R[k](s, ctx); });
      out.jsonld = R.jsonld(s, ctx);
      out.hreflang = R.hreflang(s);
      out.title = t(s.seo.title, ctx.lang);
      out.description = t(s.seo.description, ctx.lang);
      out.znacznik = znacznik(s, ctx);
      var h = s.sekcje.start.tlo, hi = h && h.typ !== 'kolor' ? (h.typ === 'wideo' && h.plakat && h.plakat.src ? h.plakat : h.obraz) : null;
      out.heroImg = hi && hi.src ? hi : null;
      out.ctx = ctx;
      return out;
    },
    stan: function (zapisane) { return scal(A.DANE_POCZATKOWE, zapisane || undefined); }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
