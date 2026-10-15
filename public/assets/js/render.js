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
      obserwuj: 'Zobacz profil na Instagramie', igWstep: 'Na Instagramie publikuję najświeższe kadry z sesji i reportaży.',
      messenger: 'Napisz na Messengerze', facebook: 'Profil na Facebooku', instagram: 'Profil na Instagramie',
      zadzwon: 'Zadzwoń', email: 'Napisz e-mail', opinie: 'Opinie o mojej pracy w Google', profil: 'Profil firmy w Mapach Google',
      obszar: 'Obszar działania', formularz: 'Formularz kontaktowy', mapa: 'Pokaż mapę obszaru działania',
      mapaInfo: 'Mapa Google wczyta się dopiero po kliknięciu.', otworzMapy: 'Otwórz w Mapach Google',
      dane: 'Dane działalności', nip: 'NIP', regon: 'REGON', krs: 'KRS', uzupelnij: '[DO UZUPEŁNIENIA]',
      polityka: 'Polityka prywatności', panel: 'Panel administratora', prawa: 'Wszelkie prawa zastrzeżone. Zdjęcia chronione prawem autorskim.',
      pasek: 'Komunikaty', aktualnosci: 'Aktualności', jezyk: 'Język strony',
      f_imie: 'Imię i nazwisko', f_email: 'Adres e-mail', f_tel: 'Telefon (opcjonalnie)', f_rodzaj: 'Czego dotyczy wiadomość?',
      f_wybierz: 'Proszę wybrać…', f_inne: 'Inne', f_termin: 'Planowany termin (opcjonalnie)', f_wiad: 'Wiadomość',
      f_zgoda: 'Wyrażam zgodę na przetwarzanie moich danych w celu odpowiedzi na wiadomość. Szczegóły w',
      f_wyslij: 'Wyślij wiadomość', f_wym: 'pole wymagane', f_hp: 'Nie wypełniaj tego pola',
      sekcje: 'Sekcje strony', skip: 'Przejdź do treści', wartosci: 'Wartości', formOtworz: 'Napisz wiadomość', strona: 'Strona', formPod: 'Wiadomość prosto ze strony', f_opc: 'opcjonalnie'
    },
    en: {
      menu: 'Menu', zamknij: 'Close', czytaj: 'Read more', czytajOMnie: 'Read more about me',
      czytajWpis: 'Read the full post', czytajOsoba: 'More about', fotografuje: 'I photograph:',
      wszystkie: 'All', poprzednie: 'Previous photo', nastepne: 'Next photo',
      powieksz: 'Enlarge photo', odtworz: 'Play video', filtruj: 'Filter portfolio by session type',
      slajd: 'slide', z: 'of', przewin: 'Scroll to next section', pauza: 'Pause background video', wznow: 'Resume background video',
      obserwuj: 'See the Instagram profile', igWstep: 'On Instagram I share the latest frames from sessions and reportages.',
      messenger: 'Message on Messenger', facebook: 'Facebook profile', instagram: 'Instagram profile',
      zadzwon: 'Call', email: 'Send an e-mail', opinie: 'Reviews on Google', profil: 'Business profile on Google Maps',
      obszar: 'Service area', formularz: 'Contact form', mapa: 'Show service area map',
      mapaInfo: 'Google Maps loads only after you click.', otworzMapy: 'Open in Google Maps',
      dane: 'Business details', nip: 'VAT ID (NIP)', regon: 'REGON', krs: 'KRS', uzupelnij: '[TO BE COMPLETED]',
      polityka: 'Privacy policy', panel: 'Admin panel', prawa: 'All rights reserved. Photos protected by copyright.',
      pasek: 'Announcements', aktualnosci: 'News', jezyk: 'Language',
      f_imie: 'Full name', f_email: 'E-mail address', f_tel: 'Phone (optional)', f_rodzaj: 'What is your message about?',
      f_wybierz: 'Please choose…', f_inne: 'Other', f_termin: 'Planned date (optional)', f_wiad: 'Message',
      f_zgoda: 'I agree to the processing of my data in order to reply to my message. Details in the',
      f_wyslij: 'Send message', f_wym: 'required', f_hp: 'Leave this field empty',
      sekcje: 'Page sections', skip: 'Skip to content', wartosci: 'Values', formOtworz: 'Write a message', strona: 'Page', formPod: 'Send a message from this page', f_opc: 'optional'
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
    if (op.priority) a.push('fetchpriority="high" decoding="async"'); else a.push('loading="lazy" decoding="async"');
    if (op.f) a.push('data-f="' + esc(op.f) + '"');
    a.push('onerror="this.classList.add(\'img-blad\')"');
    return a.join(' ') + '>';
  }
  /* Motywy kolorystyczne (przełączane w panelu → Wygląd i efekty) */
  var MOTYWY = [
    { id: 'bez', nazwa: 'Kremowy beż', opis: 'Ciepła kość słoniowa, mokka i karmel — miękko, rodzinnie.', tlo: '#FAF7F2', kolory: ['#FAF7F2', '#F2EBE3', '#7A5240', '#B88A6E', '#2B2622'] },
    { id: 'szalwia', nazwa: 'Szałwia i len', opis: 'Naturalna zieleń szałwii i lniane tła — spokojnie, plenerowo.', tlo: '#F5F4EF', kolory: ['#F5F4EF', '#E6E9E0', '#4A5D4C', '#9DAF94', '#232822'] },
    { id: 'grafit', nazwa: 'Grafit i złoto', opis: 'Chłodna biel, grafit i matowe złoto — elegancko, ślubnie.', tlo: '#F7F6F3', kolory: ['#F7F6F3', '#ECE9E3', '#2F2D2A', '#B4955A', '#1E1D1B'] }
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
    var rgb = tlo.tekst === 'ciemny' ? '250,247,242' : '28,22,18';
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

  R.historia = function (s, ctx) {
    if (!sekWidoczna(s, 'historia', ctx.today)) return pusta('historia');
    var L = ctx.lang;
    var rozdz = widoczne(s.historia.rozdzialy).map(function (r, i) {
      var tl = { typ: r.tlo && r.tlo.src ? 'zdjecie' : 'kolor', obraz: r.tlo, kolor: r.kolor || 'motyw:ciemne', ciemno: r.ciemno == null ? 50 : r.ciemno, tekst: r.tekst || 'jasny' };
      return '<li class="rozdzial t-' + (tl.tekst === 'ciemny' ? 'ciemny' : 'jasny') + (tl.typ === 'zdjecie' ? ' sek--foto' : '') + '" style="' + ovStyle(tl) + '" data-f="historia:' + esc(r.id) + '">' +
        tloHtml(tl, ctx, { f: 'historia:' + r.id + ':tlo' }) +
        (i === 0 && (t(s.sekcje.historia.nadtytul, L) || t(s.sekcje.historia.naglowek, L)) ? '<div class="rozdzial-glowa">' + naglowek('historia', s, ctx, 'h-historia') + '</div>' : '') +
        '<div class="rozdzial-in">' + (t(r.rok, L) ? '<p class="rok" data-f="historia:' + esc(r.id) + ':rok">' + esc(t(r.rok, L)) + '</p>' : '') +
        (t(r.tytul, L) ? '<h3 data-f="historia:' + esc(r.id) + ':tytul">' + esc(t(r.tytul, L)) + '</h3>' : '') +
        (t(r.tresc, L) ? '<div class="rozdzial-tekst" data-f="historia:' + esc(r.id) + ':tresc">' + fmt(t(r.tresc, L)) + '</div>' : '') +
        '<p class="rozdzial-nr" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</p></div></li>';
    }).join('');
    return otworzSekcje('historia', s, ctx, '', ' aria-labelledby="h-historia"') +
      '<ol class="rozdzialy">' + rozdz + '</ol></section>';
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
    } else ctl = '<input id="' + id + '" type="' + (TYPY_POL[p.typ] || 'text') + '"' + wsp + (AUTO[p.id] ? ' autocomplete="' + AUTO[p.id] + '"' : '') + ' maxlength="300">';
    return '<div class="pole' + (pelne ? ' pole--pelne' : '') + '" data-f="pole:' + esc(p.id) + '">' + lab + ctl + '<p class="blad" id="' + id + '-b" hidden></p></div>';
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
      '<li><a href="#panel" class="link-panel" data-panel>' + esc(ui(ctx, 'panel')) + '</a></li></ul></div></footer>';
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
      ['nav', 'kropki', 'jezyki', 'pasek', 'stopka'].forEach(function (k) { out[k] = R[k](s, ctx); });
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
