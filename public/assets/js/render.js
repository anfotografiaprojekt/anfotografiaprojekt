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
      wszystkie: 'Wszystkie', poprzednie: 'Poprzednie zdjęcie', nastepne: 'Następne zdjęcie',
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
      sekcje: 'Sekcje strony', skip: 'Przejdź do treści'
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
      sekcje: 'Page sections', skip: 'Skip to content'
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
  function ovStyle(tlo) {
    var c = Math.max(0, Math.min(90, +tlo.ciemno || 0)) / 100;
    var rgb = tlo.tekst === 'ciemny' ? '250,247,242' : '28,22,18';
    var st = '--sek-kolor:' + esc(tlo.kolor || '#FAF7F2') + ';--sek-ov:rgba(' + rgb + ',' + c.toFixed(2) + ')';
    return st;
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
    return '<section id="' + idSekcji(k) + '" class="' + cls + '" data-ssr="' + k + '" data-sekcja="' + k + '" style="' + ovStyle(tlo) + '"' + (attrs || '') + '>';
  }
  function naglowek(k, s, ctx, idH) {
    var sek = s.sekcje[k], h = '';
    if (t(sek.nadtytul, ctx.lang)) h += '<p class="nadtytul" data-f="sekcje.' + k + '.nadtytul">' + inline(t(sek.nadtytul, ctx.lang)) + '</p>';
    h += '<h2 id="' + idH + '" data-f="sekcje.' + k + '.naglowek">' + inline(t(sek.naglowek, ctx.lang)) + '</h2>';
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
      '<span class="sr"> — </span><span class="hero-rola" data-f="start.rola">' + esc(t(d.rola, L)) + '</span></h1>' +
      '<p class="hero-motto" data-f="start.motto">' + esc(t(d.motto, L)) + '</p>' +
      (t(d.wstep, L) ? '<p class="hero-wstep" data-f="start.wstep">' + inline(t(d.wstep, L)) + '</p>' : '') +
      '<a class="btn btn--glowny" href="#' + cel + '" data-f="start.przycisk">' + esc(t(d.przycisk, L)) + '</a>' +
      '</div>' +
      '<a class="hero-dalej" href="#' + ctx.nastepna + '" aria-label="' + esc(ui(ctx, 'przewin')) + '"><span aria-hidden="true"></span></a>' +
      '</section>';
  };

  R.oMnie = function (s, ctx) {
    if (!sekWidoczna(s, 'oMnie', ctx.today)) return pusta('oMnie');
    var d = s.oMnie, L = ctx.lang, sek = s.sekcje.oMnie;
    var war = widoczne(d.wartosci).map(function (w) {
      return '<li class="wartosc" data-f="oMnie:' + esc(w.id) + '"><h3 data-f="oMnie:' + esc(w.id) + ':tytul">' + esc(t(w.tytul, L)) + '</h3>' +
        (t(w.opis, L) ? '<p data-f="oMnie:' + esc(w.id) + ':opis">' + inline(t(w.opis, L)) + '</p>' : '') + '</li>';
    }).join('');
    var obs = widoczne(d.obszary).map(function (o) { return '<li>' + esc(t(o.nazwa, L)) + '</li>'; }).join('');
    return otworzSekcje('oMnie', s, ctx, '', ' aria-labelledby="h-o-mnie"') +
      tloHtml(sek.tlo, ctx) +
      '<div class="sek-in omnie">' +
      '<figure class="omnie-foto">' + imgTag(d.zdjecie, { lang: L, sizes: '(min-width: 900px) 40vw, 90vw', f: 'oMnie.zdjecie' }) + '</figure>' +
      '<div class="omnie-tekst">' + naglowek('oMnie', s, ctx, 'h-o-mnie') +
      '<div class="lead" data-f="oMnie.lead">' + fmt(t(d.lead, L)) + '</div>' +
      (obs ? '<div class="obszary" data-f="oMnie.obszary"><p class="obszary-tyt">' + esc(ui(ctx, 'fotografuje')) + '</p><ul>' + obs + '</ul></div>' : '') +
      (t(d.tresc, L) ? czytajWiecej('omnie-wiecej', ui(ctx, 'czytajOMnie'), t(sek.menu, L)) : '') +
      (war ? '<ul class="wartosci">' + war + '</ul>' : '') +
      '</div></div>' +
      '<div class="rm" id="omnie-wiecej" data-f="oMnie.tresc">' + fmt(t(d.tresc, L)) + '</div>' +
      '</section>';
  };

  R.historia = function (s, ctx) {
    if (!sekWidoczna(s, 'historia', ctx.today)) return pusta('historia');
    var L = ctx.lang;
    var rozdz = widoczne(s.historia.rozdzialy).map(function (r, i) {
      var tl = { typ: r.tlo && r.tlo.src ? 'zdjecie' : 'kolor', obraz: r.tlo, kolor: r.kolor || '#2B2622', ciemno: r.ciemno == null ? 50 : r.ciemno, tekst: r.tekst || 'jasny' };
      return '<li class="rozdzial t-' + (tl.tekst === 'ciemny' ? 'ciemny' : 'jasny') + (tl.typ === 'zdjecie' ? ' sek--foto' : '') + '" style="' + ovStyle(tl) + '" data-f="historia:' + esc(r.id) + '">' +
        tloHtml(tl, ctx, { f: 'historia:' + r.id + ':tlo' }) +
        '<div class="rozdzial-in"><p class="rok" data-f="historia:' + esc(r.id) + ':rok">' + esc(t(r.rok, L)) + '</p>' +
        '<h3 data-f="historia:' + esc(r.id) + ':tytul">' + esc(t(r.tytul, L)) + '</h3>' +
        '<div class="rozdzial-tekst" data-f="historia:' + esc(r.id) + ':tresc">' + fmt(t(r.tresc, L)) + '</div>' +
        '<p class="rozdzial-nr" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</p></div></li>';
    }).join('');
    return otworzSekcje('historia', s, ctx, '', ' aria-labelledby="h-historia"') +
      '<div class="sek-in historia-intro">' + naglowek('historia', s, ctx, 'h-historia') + '</div>' +
      '<ol class="rozdzialy">' + rozdz + '</ol></section>';
  };

  R.aktualnosci = function (s, ctx) {
    if (!sekWidoczna(s, 'aktualnosci', ctx.today)) return pusta('aktualnosci');
    var L = ctx.lang;
    var akt = aktywneWpisy(s, ctx.today).slice(0, 6);
    var wpisy = akt.map(function (w) {
      var id = 'wpis-' + esc(w.id), tr = t(w.tresc, L), dl = plain(tr).length > 170;
      return '<article class="wpis" id="' + id + '" data-f="aktualnosci:' + esc(w.id) + '">' +
        (w.zdjecie && w.zdjecie.src ? '<figure class="wpis-foto">' + imgTag(w.zdjecie, { lang: L, sizes: '(min-width: 900px) 30vw, 90vw', f: 'aktualnosci:' + w.id + ':zdjecie' }) + '</figure>' : '') +
        '<div class="wpis-tekst"><time datetime="' + esc(w.data || w.od) + '" data-f="aktualnosci:' + esc(w.id) + ':data">' + esc(dataPL(w.data || w.od, L)) + '</time>' +
        '<h3 data-f="aktualnosci:' + esc(w.id) + ':tytul">' + esc(t(w.tytul, L)) + '</h3>' +
        (dl ? '<p class="wpis-skrot" data-f="aktualnosci:' + esc(w.id) + ':tresc">' + esc(skrot(tr, 170)) + '</p>' + czytajWiecej(id + '-tresc', ui(ctx, 'czytajWpis'), t(w.tytul, L)) +
          '<div class="rm" id="' + id + '-tresc">' + fmt(tr) + '</div>'
          : '<div class="wpis-tresc" data-f="aktualnosci:' + esc(w.id) + ':tresc">' + fmt(tr) + '</div>') +
        '</div></article>';
    }).join('');
    return otworzSekcje('aktualnosci', s, ctx, '', ' aria-labelledby="h-aktualnosci"') +
      tloHtml(s.sekcje.aktualnosci.tlo, ctx) +
      '<div class="sek-in">' + naglowek('aktualnosci', s, ctx, 'h-aktualnosci') +
      '<div class="wpisy wpisy--' + Math.min(akt.length, 3) + '">' + wpisy + '</div></div></section>';
  };

  R.kadra = function (s, ctx) {
    if (!sekWidoczna(s, 'kadra', ctx.today)) return pusta('kadra');
    var L = ctx.lang, lista = widoczne(s.kadra.lista);
    var os = lista.map(function (o) {
      var id = 'osoba-' + esc(o.id), op = t(o.opis, L), dl = plain(op).length > 220;
      return '<li class="osoba" data-f="kadra:' + esc(o.id) + '">' +
        '<figure class="osoba-foto">' + imgTag(o.zdjecie, { lang: L, sizes: '(min-width: 900px) 30vw, 80vw', f: 'kadra:' + o.id + ':zdjecie' }) + '</figure>' +
        '<div class="osoba-tekst"><h3 data-f="kadra:' + esc(o.id) + ':imie">' + esc(t(o.imie, L)) + '</h3>' +
        '<p class="osoba-rola" data-f="kadra:' + esc(o.id) + ':rola">' + esc(t(o.rola, L)) + '</p>' +
        (dl ? '<p data-f="kadra:' + esc(o.id) + ':opis">' + esc(skrot(op, 220)) + '</p>' + czytajWiecej(id + '-opis', ui(ctx, 'czytajOsoba') + ' ' + t(o.imie, L), t(o.imie, L)) + '<div class="rm" id="' + id + '-opis">' + fmt(op) + '</div>'
          : '<div data-f="kadra:' + esc(o.id) + ':opis">' + fmt(op) + '</div>') +
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

  R.portfolio = function (s, ctx) {
    if (!sekWidoczna(s, 'portfolio', ctx.today)) return pusta('portfolio');
    var L = ctx.lang, el = widoczne(s.portfolio.elementy), n = el.length;
    var uzyte = {}; el.forEach(function (e) { uzyte[e.kategoria] = 1; });
    var kat = (s.portfolio.kategorie || []).filter(function (k) { return uzyte[k.id]; });
    var filtry = kat.length > 1 ? '<div class="filtry" role="group" aria-label="' + esc(ui(ctx, 'filtruj')) + '">' +
      '<button type="button" class="filtr" data-kat="*" aria-pressed="true">' + esc(ui(ctx, 'wszystkie')) + '</button>' +
      kat.map(function (k) { return '<button type="button" class="filtr" data-kat="' + esc(k.id) + '" aria-pressed="false">' + esc(t(k.nazwa, L)) + '</button>'; }).join('') + '</div>' : '';
    var sl = el.map(function (e, i) {
      var pod = t(e.podpis, L), media;
      if (e.typ === 'wideo' && e.wideo) {
        media = '<button type="button" class="slajd-wideo" data-wideo="' + esc(bezpiecznyUrl(e.wideo)) + '" aria-label="' + esc(ui(ctx, 'odtworz') + ': ' + pod) + '">' +
          imgTag(e.zdjecie, { lang: L, sizes: '(min-width: 900px) 80vw, 100vw', decor: true }) + '<span class="play" aria-hidden="true"></span></button>';
      } else {
        media = '<button type="button" class="slajd-pow" data-idx="' + i + '" aria-label="' + esc(ui(ctx, 'powieksz') + ': ' + (pod || t(e.zdjecie && e.zdjecie.alt, L))) + '">' +
          imgTag(e.zdjecie, { lang: L, sizes: '(min-width: 900px) 80vw, 100vw', f: 'portfolio:' + e.id + ':zdjecie' }) + '</button>';
      }
      return '<figure class="slajd" data-kat="' + esc(e.kategoria) + '" data-f="portfolio:' + esc(e.id) + '" role="group" aria-roledescription="' + esc(ui(ctx, 'slajd')) + '" aria-label="' + (i + 1) + ' ' + esc(ui(ctx, 'z')) + ' ' + n + '">' +
        media + (pod ? '<figcaption data-f="portfolio:' + esc(e.id) + ':podpis">' + esc(pod) + '</figcaption>' : '') + '</figure>';
    }).join('');
    return otworzSekcje('portfolio', s, ctx, '', ' aria-labelledby="h-portfolio"') +
      tloHtml(s.sekcje.portfolio.tlo, ctx) +
      '<div class="sek-in port-glowa"><div class="port-tyt">' + naglowek('portfolio', s, ctx, 'h-portfolio') + '</div>' + filtry + '</div>' +
      '<div class="slider" role="region" aria-roledescription="karuzela" aria-labelledby="h-portfolio">' +
      '<div class="slider-tor" tabindex="0">' + sl + '</div>' +
      '<div class="slider-ster"><button type="button" class="slider-btn" data-kier="-1" aria-label="' + esc(ui(ctx, 'poprzednie')) + '"><span aria-hidden="true">←</span></button>' +
      '<span class="slider-licznik" aria-live="polite">1 / ' + n + '</span>' +
      '<button type="button" class="slider-btn" data-kier="1" aria-label="' + esc(ui(ctx, 'nastepne')) + '"><span aria-hidden="true">→</span></button></div>' +
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

  R.kontakt = function (s, ctx) {
    var L = ctx.lang, k = s.kontakt, kat = s.portfolio.kategorie || [];
    var ak = '<li><a class="btn btn--glowny" href="' + esc(messengerUrl(k)) + '" target="_blank" rel="noopener" data-f="kontakt.messenger"><svg class="ik" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2C6.4 2 2 6.1 2 11.4c0 3 1.5 5.6 3.8 7.3V22l3.5-1.9c.9.3 1.8.4 2.7.4 5.6 0 10-4.1 10-9.4S17.6 2 12 2zm1 12.6-2.6-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7L13 14.6z"/></svg>' + esc(ui(ctx, 'messenger')) + '</a></li>';
    if (k.facebook) ak += '<li><a class="btn btn--obrys" href="' + esc(bezpiecznyUrl(k.facebook)) + '" target="_blank" rel="noopener me" data-f="kontakt.facebook">' + esc(ui(ctx, 'facebook')) + '</a></li>';
    if (k.instagram) ak += '<li><a class="btn btn--obrys" href="' + esc(bezpiecznyUrl(k.instagram)) + '" target="_blank" rel="noopener me" data-f="kontakt.instagram">' + esc(ui(ctx, 'instagram')) + '</a></li>';
    if (k.telefonWidoczny && k.telefon) ak += '<li><a class="btn btn--obrys" href="tel:+48' + esc(String(k.telefon).replace(/\D/g, '').replace(/^48(?=\d{9}$)/, '')) + '" data-f="kontakt.telefon">' + esc(ui(ctx, 'zadzwon')) + ': ' + esc(k.telefon) + '</a></li>';
    if (k.emailWidoczny && k.email) ak += '<li><a class="btn btn--obrys" href="mailto:' + esc(k.email) + '" data-f="kontakt.email">' + esc(k.email) + '</a></li>';
    var opcje = kat.map(function (c) { return '<option value="' + esc(t(c.nazwa, 'pl')) + '">' + esc(t(c.nazwa, L)) + '</option>'; }).join('');
    var form = k.formularz ? '<div class="kontakt-form karta"><h3 id="h-formularz">' + esc(ui(ctx, 'formularz')) + '</h3>' +
      '<p class="form-zacheta" data-f="kontakt.zachetaFormularza">' + inline(t(k.zachetaFormularza, L)) + '</p>' +
      '<form id="formularz" novalidate aria-labelledby="h-formularz">' +
      '<div class="pole"><label for="f-imie">' + esc(ui(ctx, 'f_imie')) + ' <span class="wym">(' + esc(ui(ctx, 'f_wym')) + ')</span></label><input id="f-imie" type="text" name="imie" autocomplete="name" required maxlength="120"><p class="blad" id="f-imie-b" hidden></p></div>' +
      '<div class="pole"><label for="f-email">' + esc(ui(ctx, 'f_email')) + ' <span class="wym">(' + esc(ui(ctx, 'f_wym')) + ')</span></label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="160"><p class="blad" id="f-email-b" hidden></p></div>' +
      '<div class="pole-rzad"><div class="pole"><label for="f-tel">' + esc(ui(ctx, 'f_tel')) + '</label><input id="f-tel" name="telefon" type="tel" autocomplete="tel" maxlength="40"><p class="blad" id="f-tel-b" hidden></p></div>' +
      '<div class="pole"><label for="f-termin">' + esc(ui(ctx, 'f_termin')) + '</label><input id="f-termin" type="text" name="termin" maxlength="80"></div></div>' +
      '<div class="pole"><label for="f-rodzaj">' + esc(ui(ctx, 'f_rodzaj')) + '</label><select id="f-rodzaj" name="rodzaj"><option value="">' + esc(ui(ctx, 'f_wybierz')) + '</option>' + opcje + '<option value="Inne">' + esc(ui(ctx, 'f_inne')) + '</option></select></div>' +
      '<div class="pole"><label for="f-wiad">' + esc(ui(ctx, 'f_wiad')) + ' <span class="wym">(' + esc(ui(ctx, 'f_wym')) + ')</span></label><textarea id="f-wiad" name="wiadomosc" rows="4" required maxlength="4000"></textarea><p class="blad" id="f-wiad-b" hidden></p></div>' +
      '<div class="pole pole-hp" aria-hidden="true"><label for="f-www">' + esc(ui(ctx, 'f_hp')) + '</label><input id="f-www" type="text" name="www" tabindex="-1" autocomplete="off"></div>' +
      '<div class="pole pole-zgoda"><input type="checkbox" id="f-zgoda" name="zgoda" required><label for="f-zgoda">' + esc(ui(ctx, 'f_zgoda')) + ' <a href="polityka-prywatnosci.html' + linkJezyka(L) + '">' + esc(ui(ctx, 'polityka').toLowerCase()) + '</a>.</label><p class="blad" id="f-zgoda-b" hidden></p></div>' +
      '<button type="submit" class="btn btn--glowny btn--pelny">' + esc(ui(ctx, 'f_wyslij')) + '</button>' +
      '<div class="form-status" role="status" aria-live="polite"></div>' +
      '</form></div>' : '';
    return otworzSekcje('kontakt', s, ctx, '', ' aria-labelledby="h-kontakt"') +
      tloHtml(s.sekcje.kontakt.tlo, ctx) +
      '<div class="sek-in kontakt' + (form ? '' : ' kontakt--bez') + '"><div class="kontakt-info">' + naglowek('kontakt', s, ctx, 'h-kontakt') +
      '<ul class="akcje">' + ak + '</ul>' +
      '<h3>' + esc(ui(ctx, 'obszar')) + '</h3>' +
      '<p data-f="kontakt.obszar">' + inline(t(k.obszar, L)) + '</p>' +
      '<p class="miasta" data-f="kontakt.miasta">' + esc(k.miasta) + '</p>' +
      '<div class="mapa" data-mapa="' + esc(k.mapa || 'Zgorzelec') + '"><button type="button" class="mapa-btn"><span class="mapa-ik" aria-hidden="true"></span>' + esc(ui(ctx, 'mapa')) + '<small>' + esc(ui(ctx, 'mapaInfo')) + '</small></button></div>' +
      '<p class="linki-male"><a href="' + esc(bezpiecznyUrl(k.profilGoogle) || mapsUrl(k)) + '" target="_blank" rel="noopener" data-f="kontakt.profilGoogle">' + esc(bezpiecznyUrl(k.profilGoogle) ? ui(ctx, 'profil') : ui(ctx, 'otworzMapy')) + '</a>' +
      (bezpiecznyUrl(k.opinieGoogle) ? ' · <a href="' + esc(bezpiecznyUrl(k.opinieGoogle)) + '" target="_blank" rel="noopener" data-f="kontakt.opinieGoogle">' + esc(ui(ctx, 'opinie')) + '</a>' : '') + '</p>' +
      '</div>' + form + '</div></section>';
  };

  /* ---------- Elementy wspólne ---------- */
  function menuPozycje(s, ctx) {
    return SEKCJE.filter(function (x) { return x.k !== 'start' && sekWidoczna(s, x.k, ctx.today); });
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
      '<p class="stopka-haslo" data-f="stopka.haslo">' + esc(t(s.stopka.haslo, L)) + '</p>' +
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
    var nast = SEKCJE.filter(function (x) { return x.k !== 'start' && sekWidoczna(s, x.k, today); })[0];
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
