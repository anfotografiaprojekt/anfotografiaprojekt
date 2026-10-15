/*!
 * Anna Niedobitek Fotografia — DANE POCZĄTKOWE STRONY
 * ---------------------------------------------------------------
 * Jeden obiekt (state) z całą treścią edytowaną w panelu.
 * Panel zapisuje zmiany na serwerze (Cloudflare KV); przy starcie
 * zapisane dane są scalane z tymi wartościami, więc nowe pola dodane
 * tutaj nie znikają u klientki.
 *
 * Teksty wielojęzyczne mają postać { pl: '…', en: '…' }.
 * Formatowanie w tekstach: *kursywa* (kolor akcentu), **pogrubienie**,
 * pusta linia = nowy akapit.
 *
 * WAŻNE: po zmianie wartości w tym pliku uruchom  node narzedzia/zbuduj.mjs
 * (odświeża treść zapisaną w index.html — ważne dla SEO).
 */
(function (root) {
  'use strict';

  var img = function (name, w, h, alt, warianty) {
    var o = { src: 'assets/img/' + name + '.webp', w: w, h: h, alt: alt || '' };
    if (warianty && warianty.length) {
      o.srcset = warianty.map(function (s) { return 'assets/img/' + name + '-' + s + '.webp ' + s + 'w'; })
        .concat(['assets/img/' + name + '.webp ' + w + 'w']).join(', ');
    }
    return o;
  };
  var tlo = function (typ, obraz, ciemno, tekst, kolor) {
    return { typ: typ, obraz: obraz || null, wideo: '', plakat: null, kolor: kolor || '#F2EBE3', ciemno: ciemno, tekst: tekst };
  };

  var DANE = {
    _app: 'anf-cms',
    _wersja: 1,

    ustawienia: {
      jezyki: [
        { kod: 'pl', nazwa: 'Polski', wl: true, staly: true }
      ],
      kropki: true,      // kropki nawigacji z boku
      animacje: true     // animacje wejścia sekcji i przejścia slidera
    },

    seo: {
      title: { pl: 'Fotograf Zgorzelec i Dolny Śląsk | Anna Niedobitek Fotografia' },
      description: { pl: 'Naturalne sesje rodzinne, ciążowe, noworodkowe, wizerunkowe i reportaże ślubne na Dolnym Śląsku. Zgorzelec, Görlitz i okolice. Zapraszam do kontaktu.' }
    },

    /* Ustawienia wyglądu i nagłówki sekcji (układ pełnoekranowy) */
    sekcje: {
      start: {
        widoczna: true, staly: true, menu: { pl: 'Start' },
        tlo: tlo('zdjecie', img('fotograf-zgorzelec-sesja-plenerowa', 2400, 1600,
          'Naturalna sesja zdjęciowa w plenerze — fotograf Zgorzelec, Anna Niedobitek', [800, 1200, 1600]), 45, 'jasny')
      },
      oMnie: {
        widoczna: true, menu: { pl: 'O mnie' },
        nadtytul: { pl: 'O mnie' },
        naglowek: { pl: 'Fotograf z pasją — Zgorzelec i Dolny Śląsk' },
        tlo: tlo('kolor', img('o-mnie-praca-w-plenerze', 2000, 1333, 'Anna Niedobitek podczas sesji zdjęciowej w plenerze', [800, 1200]), 0, 'ciemny', '#F2EBE3')
      },
      historia: {
        widoczna: true, menu: { pl: 'Historia' },
        nadtytul: { pl: 'Moja historia' },
        naglowek: { pl: 'Od dziecięcej pasji do własnej pracowni' },
        tlo: tlo('kolor', null, 0, 'ciemny', '#FAF7F2')
      },
      aktualnosci: {
        widoczna: true, menu: { pl: 'Aktualności' },
        nadtytul: { pl: 'Aktualności' },
        naglowek: { pl: 'Co słychać w pracowni' },
        tlo: tlo('kolor', img('aktualnosci-tlo', 2000, 1333, '', [800, 1200]), 0, 'ciemny', '#FAF7F2')
      },
      kadra: {
        widoczna: true, menu: { pl: 'Kto fotografuje' },
        nadtytul: { pl: 'Kto fotografuje' },
        naglowek: { pl: 'Osoby, które stoją za aparatem' },
        wstep: { pl: 'Na co dzień pracuję samodzielnie. Przy większych reportażach ślubnych współpracuję z drugim fotografem, aby zapewnić pełniejszą dokumentację wydarzenia.' },
        tlo: tlo('kolor', img('kto-fotografuje-tlo', 2000, 1333, '', [800, 1200]), 0, 'ciemny', '#F2EBE3')
      },
      portfolio: {
        widoczna: true, menu: { pl: 'Portfolio' },
        nadtytul: { pl: 'Galeria zdjęć i wideo' },
        naglowek: { pl: 'Portfolio — sesje i reportaże z Dolnego Śląska' },
        tlo: tlo('kolor', null, 0, 'jasny', '#2B2622')
      },
      instagram: {
        widoczna: true, menu: { pl: 'Instagram' },
        nadtytul: { pl: 'Instagram' },
        naglowek: { pl: 'Najnowsze kadry z Instagrama' },
        tlo: tlo('kolor', img('instagram-tlo', 2000, 1333, '', [800, 1200]), 0, 'ciemny', '#FAF7F2')
      },
      kontakt: {
        widoczna: true, staly: true, menu: { pl: 'Kontakt' },
        nadtytul: { pl: 'Kontakt' },
        naglowek: { pl: 'Porozmawiajmy o Państwa sesji' },
        tlo: tlo('zdjecie', img('kontakt-fotograf-dolny-slask', 2000, 1333, 'Plener na Dolnym Śląsku o zachodzie słońca', [800, 1200]), 55, 'jasny')
      }
    },

    /* Pierwszy ekran */
    start: {
      nazwa: { pl: 'Anna Niedobitek' },
      rola: { pl: 'Fotograf · Zgorzelec i Dolny Śląsk' },
      motto: { pl: 'Z miłości do pięknych kadrów' },
      wstep: { pl: 'Naturalne zdjęcia, prawdziwe emocje i subtelny retusz — sesje oraz reportaże z ważnych chwil.' },
      przycisk: { pl: 'Zobacz portfolio' },
      przyciskCel: 'portfolio'
    },

    /* O mnie — historia, misja, wartości */
    oMnie: {
      lead: { pl: 'Moją misją jest zatrzymywanie w kadrach chwil, które mają znaczenie – zarówno tych wyjątkowych, jak i pozornie codziennych. Stawiam na *naturalność, prostotę i prawdziwe relacje*.' },
      tresc: { pl: 'Działam głównie na terenie Dolnego Śląska, realizując sesje zdjęciowe oraz reportaże z ważnych wydarzeń i uroczystości. Fotografuję rodziny, pary, kobiety, a także zajmuję się fotografią ślubną, rodzinną, ciążową, noworodkową i wizerunkową.\n\nNa co dzień pracuję samodzielnie, dbając o indywidualne podejście do każdej osoby i realizacji. Przy większych reportażach ślubnych współpracuję z drugim fotografem, aby zapewnić pełniejszą dokumentację wydarzenia. Swoją ofertę kieruję przede wszystkim do mieszkańców regionu – osób prywatnych, rodzin, par oraz lokalnych przedsiębiorców.\n\nWyróżnia mnie przede wszystkim pasja do fotografii, którą odkryłam już w dzieciństwie i która z czasem stała się moim sposobem na życie. W swojej pracy stawiam na naturalność, autentyczność i indywidualne podejście do każdej osoby. Zależy mi na uchwyceniu prawdziwych chwil, emocji i relacji, bez sztucznego pozowania i nadmiernej ingerencji w wygląd fotografowanych osób.\n\nStosuję subtelny, minimalistyczny retusz, dzięki czemu zdjęcia zachowują swój naturalny charakter. **Wierzę, że najpiękniejsze fotografie to te, które po latach pozwalają wrócić do wspomnień i przeżyć je na nowo.**' },
      zdjecie: img('anna-niedobitek-fotograf-portret', 1200, 1500, 'Anna Niedobitek — fotograf ze Zgorzelca, portret z aparatem', [600]),
      wartosci: [
        { id: 'w1', tytul: { pl: 'Zaufanie i uczciwość' }, opis: { pl: 'Jasne zasady współpracy i szczera rozmowa o tym, czego Państwo oczekują.' } },
        { id: 'w2', tytul: { pl: 'Doświadczenie i fachowość' }, opis: { pl: 'Własną działalność fotograficzną prowadzę od 2021 roku — sesje i reportaże w całym regionie.' } },
        { id: 'w3', tytul: { pl: 'Indywidualne podejście' }, opis: { pl: 'Każda sesja i każdy reportaż są inne, bo każda historia jest inna.' } },
        { id: 'w4', tytul: { pl: 'Rodzinna atmosfera' }, opis: { pl: 'Spokój, swoboda i bez sztucznego pozowania — tak powstają prawdziwe emocje.' } },
        { id: 'w5', tytul: { pl: 'Pasja' }, opis: { pl: 'Fotografię odkryłam w dzieciństwie — dziś jest moim sposobem na życie.' } }
      ],
      obszary: [
        { id: 'o1', nazwa: { pl: 'Fotografia ślubna' } },
        { id: 'o2', nazwa: { pl: 'Sesje rodzinne' } },
        { id: 'o3', nazwa: { pl: 'Sesje ciążowe' } },
        { id: 'o4', nazwa: { pl: 'Sesje noworodkowe' } },
        { id: 'o5', nazwa: { pl: 'Sesje par' } },
        { id: 'o6', nazwa: { pl: 'Sesje kobiece' } },
        { id: 'o7', nazwa: { pl: 'Sesje wizerunkowe' } },
        { id: 'o8', nazwa: { pl: 'Reportaże z uroczystości' } }
      ]
    },

    /* Historia — pełnoekranowe rozdziały */
    historia: {
      rozdzialy: [
        { id: 'h1', rok: { pl: 'Dzieciństwo' }, tytul: { pl: 'Pierwsze kadry' },
          tresc: { pl: 'Moja przygoda z fotografią rozpoczęła się już w dzieciństwie, kiedy odkryłam, jak wiele można opowiedzieć za pomocą zdjęć.' },
          tlo: img('historia-poczatki-pasja-od-dziecka', 2000, 1333, 'Pierwszy aparat — początek fotograficznej pasji', [800, 1200]), ciemno: 50, tekst: 'jasny' },
        { id: 'h2', rok: { pl: '2021' }, tytul: { pl: 'Własna działalność fotograficzna' },
          tresc: { pl: 'Z czasem pasja przerodziła się w sposób na życie i w 2021 roku rozpoczęłam prowadzenie własnej działalności fotograficznej.' },
          tlo: img('historia-2021-wlasna-dzialalnosc', 2000, 1333, 'Jedna z pierwszych realizacji Anny Niedobitek', [800, 1200]), ciemno: 50, tekst: 'jasny' },
        { id: 'h3', rok: { pl: 'Dziś' }, tytul: { pl: 'Zgorzelec, Görlitz i cały Dolny Śląsk' },
          tresc: { pl: 'Sesje realizuję w promieniu ok. 100 km od Zgorzelca — m.in. w Görlitz, Bolesławcu i Legnicy, a reportaże ślubne na terenie całego Dolnego Śląska, także we Wrocławiu.' },
          tlo: img('historia-dzis-dolny-slask', 2000, 1333, 'Sesja zdjęciowa w plenerze na Dolnym Śląsku', [800, 1200]), ciemno: 50, tekst: 'jasny' }
      ]
    },

    /* Aktualności (treści czasowe) — daty RRRR-MM-DD */
    aktualnosci: {
      lista: [
        { id: 'a1', tytul: { pl: 'Zapraszam na nową stronę' },
          tresc: { pl: 'Witam serdecznie na mojej nowej stronie internetowej. Znajdą tu Państwo moje portfolio, aktualności z pracowni oraz wygodny formularz kontaktowy.\n\n[DO UZUPEŁNIENIA — treść wpisu od Anny]' },
          data: '2026-10-15', od: '2026-10-15', do: '', wstrzymana: false, naPasku: false,
          zdjecie: img('aktualnosc-nowa-strona', 1200, 800, 'Nowa strona internetowa Anny Niedobitek Fotografia', [600]) }
      ]
    },

    /* Kadra — kto fotografuje */
    kadra: {
      lista: [
        { id: 'k1', imie: { pl: 'Anna Niedobitek' }, rola: { pl: 'Fotograf · założycielka pracowni' },
          opis: { pl: 'Fotografią zajmuję się od dziecka, a od 2021 roku prowadzę własną działalność. Realizuję sesje rodzinne, ciążowe, noworodkowe, kobiece, par i wizerunkowe oraz reportaże ślubne i z uroczystości. Stawiam na naturalność i subtelny retusz.' },
          zdjecie: img('anna-niedobitek-fotograf-portret', 1200, 1500, 'Anna Niedobitek — fotograf, portret', [600]), ukryta: false },
        { id: 'k2', imie: { pl: '[DO UZUPEŁNIENIA — imię i nazwisko]' }, rola: { pl: 'Drugi fotograf przy reportażach ślubnych' },
          opis: { pl: 'Przy większych reportażach ślubnych pracujemy we dwoje, aby zapewnić pełniejszą dokumentację wydarzenia. [DO UZUPEŁNIENIA — krótki opis]' },
          zdjecie: img('drugi-fotograf-reportaz-slubny', 1200, 1500, 'Drugi fotograf podczas reportażu ślubnego', [600]), ukryta: true }
      ]
    },

    /* Portfolio — galeria zdjęć i wideo */
    portfolio: {
      kategorie: [
        { id: 'slub', nazwa: { pl: 'Ślub' } },
        { id: 'rodzina', nazwa: { pl: 'Rodzina' } },
        { id: 'ciaza', nazwa: { pl: 'Ciąża' } },
        { id: 'noworodek', nazwa: { pl: 'Noworodki' } },
        { id: 'para', nazwa: { pl: 'Pary' } },
        { id: 'kobieca', nazwa: { pl: 'Kobieca' } },
        { id: 'wizerunkowa', nazwa: { pl: 'Wizerunkowa' } },
        { id: 'reportaz', nazwa: { pl: 'Reportaż' } }
      ],
      elementy: [
        { id: 'g1', typ: 'zdjecie', kategoria: 'slub', podpis: { pl: 'Reportaż ślubny — Dolny Śląsk' },
          zdjecie: img('reportaz-slubny-dolny-slask', 1800, 1200, 'Para młoda podczas reportażu ślubnego na Dolnym Śląsku', [800, 1200]), wideo: '' },
        { id: 'g2', typ: 'zdjecie', kategoria: 'rodzina', podpis: { pl: 'Sesja rodzinna w plenerze' },
          zdjecie: img('sesja-rodzinna-zgorzelec', 1800, 1200, 'Rodzina podczas naturalnej sesji w plenerze w okolicach Zgorzelca', [800, 1200]), wideo: '' },
        { id: 'g3', typ: 'zdjecie', kategoria: 'ciaza', podpis: { pl: 'Sesja ciążowa' },
          zdjecie: img('sesja-ciazowa-zgorzelec', 1800, 1200, 'Subtelny portret z sesji ciążowej', [800, 1200]), wideo: '' },
        { id: 'g4', typ: 'zdjecie', kategoria: 'noworodek', podpis: { pl: 'Sesja noworodkowa — detale' },
          zdjecie: img('sesja-noworodkowa-detale', 1800, 1200, 'Detale z sesji noworodkowej — dłonie i stópki dziecka', [800, 1200]), wideo: '' },
        { id: 'g5', typ: 'zdjecie', kategoria: 'para', podpis: { pl: 'Sesja pary' },
          zdjecie: img('sesja-narzeczenska-para', 1800, 1200, 'Para podczas sesji zdjęciowej w plenerze', [800, 1200]), wideo: '' },
        { id: 'g6', typ: 'zdjecie', kategoria: 'kobieca', podpis: { pl: 'Sesja kobieca' },
          zdjecie: img('sesja-kobieca-naturalny-portret', 1800, 1200, 'Naturalny portret kobiecy z minimalistycznym retuszem', [800, 1200]), wideo: '' },
        { id: 'g7', typ: 'zdjecie', kategoria: 'wizerunkowa', podpis: { pl: 'Sesja wizerunkowa' },
          zdjecie: img('sesja-wizerunkowa-przedsiebiorca', 1800, 1200, 'Sesja wizerunkowa lokalnego przedsiębiorcy', [800, 1200]), wideo: '' },
        { id: 'g8', typ: 'zdjecie', kategoria: 'reportaz', podpis: { pl: 'Reportaż z uroczystości' },
          zdjecie: img('reportaz-uroczystosc-rodzinna', 1800, 1200, 'Reportaż z uroczystości rodzinnej', [800, 1200]), wideo: '' }
      ]
    },

    /* Instagram */
    instagram: {
      tryb: 'auto',     // auto = najnowsze posty przez API serwera (wymaga INSTAGRAM_TOKEN), reczny = kafelki z panelu
      liczba: 6,
      reczne: []
    },

    /* Kontakt i dane organizacji */
    kontakt: {
      messenger: '',   // np. https://m.me/nazwa.profilu — puste = przycisk prowadzi na profil Facebook
      facebook: 'https://www.facebook.com/share/1QKuwyRSw4/',
      instagram: 'https://www.instagram.com/anna.n.fotografia/',
      telefon: '792 704 270', telefonWidoczny: false,
      email: 'ania252@vp.pl', emailWidoczny: false,
      obszar: { pl: 'Sesje w promieniu ok. 100 km od Zgorzelca, reportaże ślubne na terenie całego Dolnego Śląska.' },
      miasta: 'Zgorzelec, Görlitz, Bolesławiec, Legnica, Wrocław',
      opinieGoogle: '',   // [LINK DO UZUPEŁNIENIA] — link do opinii w Profilu Firmy w Google
      profilGoogle: '',   // [LINK DO UZUPEŁNIENIA] — link do Profilu Firmy w Google (Mapy)
      mapa: 'Zgorzelec',
      nazwaRejestrowa: 'Anna Niedobitek Fotografia',
      nip: '',            // [DO UZUPEŁNIENIA]
      regon: '',
      krs: '',            // jednoosobowa działalność — zwykle brak KRS (wpis w CEIDG)
      formularz: true,
      zachetaFormularza: { pl: 'Proszę opisać, jakiej sesji lub uroczystości dotyczy wiadomość. Odpowiem najszybciej, jak to możliwe.' }
    },

    stopka: {
      haslo: { pl: 'Z miłości do pięknych kadrów' }
    }
  };

  root.ANF = root.ANF || {};
  root.ANF.DANE_POCZATKOWE = DANE;
})(typeof globalThis !== 'undefined' ? globalThis : this);
