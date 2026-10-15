# Anna Niedobitek Fotografia — strona wizerunkowa + panel administracyjny

Układ **pełnoekranowy (immersive)**, jedna strona (ONE_PAGE) + polityka prywatności + strona 404.
Czysty HTML/CSS/JS bez frameworków, hosting **Cloudflare Pages**, zapis panelu przez **Pages Functions + KV**.

```
public/                     ← to trafia na hosting (katalog wyjściowy)
  index.html                ← strona główna (treść w HTML — widoczna dla Google bez JS)
  polityka-prywatnosci.html, 404.html, robots.txt, sitemap.xml, site.webmanifest, _headers, _routes.json
  assets/js/dane.js         ← DANE POCZĄTKOWE (wszystkie treści w jednym obiekcie)
  assets/js/render.js       ← renderowanie sekcji (wspólne: przeglądarka, budowanie, serwer) + DOMENA
  assets/js/site.js         ← działanie strony (menu, kropki, slider, lightbox, formularz…)
  assets/js/cms.js          ← panel administratora (ładowany po kliknięciu kłódki)
  assets/css/site.css, cms.css, fonts/ (własne czcionki), img/ (zdjęcia zastępcze WebP), icons/
functions/                  ← API (Cloudflare Pages Functions) + renderowanie po stronie serwera
lib/serwer.js               ← hasła (PBKDF2), sesje, CSRF, limity, kopie
szablony/                   ← źródła HTML (z nich powstają pliki w public/)
narzedzia/                  ← zbuduj.mjs, hash-hasla.mjs, generuj-grafiki-zastepcze.py
```

---

## 1. Wdrożenie na Cloudflare Pages (ok. 15 minut)

Wymagane: konto Cloudflare (darmowe), Node.js 18+.

1. **Domena w jednym miejscu** — w `public/assets/js/render.js` zmień
   `var DOMENA = 'https://[DOMENA]';` na np. `'https://annaniedobitek.pl'`, potem:
   ```bash
   node narzedzia/zbuduj.mjs
   ```
   (skrypt podmieni adres w `index.html`, podstronach, `sitemap.xml`, `robots.txt`, JSON-LD i OG).
2. **Baza KV** (treści, zdjęcia z panelu, sesje, wiadomości):
   ```bash
   npx wrangler login
   npx wrangler kv namespace create TRESCI
   ```
   Skopiuj zwrócone `id` do `wrangler.toml` (w miejsce `WSTAW_ID_Z_KROKU_1`).
3. **Hasło do panelu** — wygeneruj hash (hasło nie jest nigdzie zapisywane):
   ```bash
   node narzedzia/hash-hasla.mjs
   ```
   Skrypt wypisze `ADMIN_PASSWORD_HASH=…` i `SESSION_SECRET=…`.
4. **Pierwsze wdrożenie i sekrety**:
   ```bash
   npx wrangler pages deploy
   npx wrangler pages secret put ADMIN_PASSWORD_HASH   # wklej wartość z kroku 3
   npx wrangler pages secret put SESSION_SECRET        # wklej wartość z kroku 3
   npx wrangler pages deploy                            # ponowne wdrożenie z sekretami
   ```
   Alternatywa przez przeglądarkę: repozytorium GitHub → Cloudflare → Workers & Pages → Create → Pages →
   Connect to Git, *Build output directory* = `public`, brak polecenia budowania. Potem w projekcie:
   **Settings → Bindings → Add → KV namespace** (nazwa zmiennej `TRESCI`) oraz
   **Settings → Variables and Secrets** (typ *Secret*) — `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.
   ⚠️ Wgrywanie folderu metodą „przeciągnij i upuść” w panelu Cloudflare **nie uruchamia** folderu `functions/` — strona zadziała, ale panel będzie w trybie demonstracyjnym.
5. **Własna domena**: projekt → *Custom domains* → *Set up a domain*.
6. Wejdź na stronę → kłódka w lewym dolnym rogu (lub link „Panel administratora” w stopce, albo adres `/#panel`) → zaloguj się → **Ustawienia → Hasło do panelu** i ustaw własne hasło.

### Opcjonalnie
| Zmienna (Secret) | Do czego |
|---|---|
| `INSTAGRAM_TOKEN` | automatyczne „Najnowsze zdjęcia z Instagrama”. Konto IG musi być **profesjonalne (twórca/firma)**. Token: [developers.facebook.com](https://developers.facebook.com) → aplikacja → *Instagram API with Instagram Login* → wygeneruj token dla konta. Serwer odnawia go sam co ~7 dni. Bez tokenu w panelu można dodać zdjęcia ręcznie. |
| `RESEND_API_KEY`, `MAIL_DO`, `MAIL_OD` | kopia każdej wiadomości z formularza na e-mail (np. `MAIL_DO=ania252@vp.pl`) przez [resend.com](https://resend.com). Bez tego wiadomości są w panelu → *Wiadomości*. |

### Test lokalny
```bash
cp .dev.vars.przyklad .dev.vars      # i wklej wartości z hash-hasla.mjs
npx wrangler pages dev public --kv TRESCI
```
Otwarcie `public/index.html` bezpośrednio z dysku uruchamia **tryb demonstracyjny** panelu (zapis w przeglądarce, żółty pasek).

---

## 2. Bezpieczeństwo panelu
- hasło tylko jako hash **PBKDF2-SHA256 z solą** (100 000 iteracji) po stronie serwera — nigdy w kodzie strony,
- sesja 8 h w ciasteczku **HttpOnly + Secure + SameSite=Strict**, podpisanym HMAC (`SESSION_SECRET`), przechowywana w KV,
- limit: 5 nieudanych logowań / 15 min z jednego IP (komunikat „Zbyt wiele prób”),
- zapis tylko z nagłówkiem `X-CMS: 1` i zgodnym `Origin` (CSRF),
- zmiana hasła unieważnia sesje na innych urządzeniach; stare hasło przestaje działać od razu,
- automatyczna kopia **10 ostatnich zapisów** (Panel → Kopia zapasowa → Przywróć),
- nagłówki bezpieczeństwa i CSP w `public/_headers`.

---

## 3. Co gdzie edytować w panelu
| Podstrona panelu | Sekcja strony |
|---|---|
| Pierwszy ekran | imię i nazwisko (H1), podpis, myśl przewodnia, przycisk, tło: zdjęcie / wideo / kolor + przyciemnienie |
| O mnie | misja, tekst „Czytaj więcej”, zdjęcie, rodzaje sesji, wartości |
| Historia | pełnoekranowe rozdziały (rok, tytuł, tekst, zdjęcie) |
| Aktualności | wpisy z datami „pokazuj od / do”, wstrzymanie, górny pasek komunikatów |
| Kto fotografuje | Anna + drugi fotograf (domyślnie ukryty — do uzupełnienia) |
| Portfolio | zdjęcia i filmy (YouTube/MP4), kolejność, kategorie (filtry) |
| Instagram | tryb automatyczny / ręczny |
| Kontakt i stopka | Kanały kontaktu pod sobą z ikonami (Messenger, Facebook, Instagram, telefon/e-mail — domyślnie ukryte, formularz w osobnym oknie), obszar, mapa, opinie Google, NIP, hasło w stopce |
| Ustawienia → Wygląd i efekty | **3 motywy kolorystyczne** (Kremowy beż, Szałwia i len, Grafit i złoto), kropki nawigacji, animacje |
| Sekcje strony | włączanie/wyłączanie sekcji, **kolejność sekcji w menu i na stronie** (▲▼), nagłówki |
| Kontakt → Pola formularza | **dodawanie, edycja, kolejność i ukrywanie pól formularza** (tekst, e-mail, telefon, data, lista wyboru, pole do zaznaczenia); imię i e-mail są stałe |
| Ustawienia | SEO (title/description), wersje językowe, hasło, kopia zapasowa |

Puste pola znikają ze strony (np. pusty nagłówek sekcji — treść przesuwa się w górę). Każda sekcja pilnuje, żeby mieścić się na jednym ekranie.

Formatowanie w tekstach: `*kursywa*` (kolor akcentu), `**pogrubienie**`, pusta linia = nowy akapit.

**Zdjęcia:** pliki w `public/assets/img/` to zastępcze tła opisane `[ZDJĘCIE: …]`. Najprościej podmienić je w panelu („Wgraj z dysku” — zdjęcie zmniejsza się automatycznie do 1600 px). Można też podmienić pliki 1:1 (te same nazwy i proporcje; wersje `-800`/`-1200` są dla telefonów).
Zdjęcia dzieci — tylko za zgodą rodziców (miejsca w galerii pozwalają użyć ujęć detali bez twarzy).

---

## 4. Uwagi projektowe (co dostosowano i dlaczego)
- **ONE_PAGE** — 5 sekcji z briefu (< 6), więc jedna strona z kotwicami + polityka prywatności i 404.
- **„Kadra” → „Kto fotografuje”** — fotograf pracuje sama; drugi fotograf przy ślubach jest w panelu jako ukryta pozycja do uzupełnienia (imię, opis, zdjęcie).
- **„KRS, NIP”** — jednoosobowa działalność zwykle nie ma KRS; w stopce jest NIP `[DO UZUPEŁNIENIA]`, pole KRS pojawi się, gdy zostanie wpisane.
- **Kontakt** — w briefie wybrano Messenger: główny przycisk to „Napisz na Messengerze” (do czasu podania linku m.me prowadzi do profilu FB). Telefon i e-mail z briefu dotyczyły projektu, więc są w panelu, ale domyślnie **ukryte** (włącznik „Pokazuj na stronie”).
- **Pierwszy ekran** — w układzie pełnoekranowym 1 przycisk („Zobacz portfolio”); kontakt jest w menu i na dolnym pasku na telefonie. Zamiast slidera w nagłówku — jedno duże zdjęcie lub wideo (zgodnie z regułami układu immersive).
- **Panel** — pominięto podstrony bez odpowiednika na stronie: promocje, cennik, usługi, rezerwacje, opinie, godziny otwarcia i dni specjalne, terminarz, drużyny, sponsorzy, dokumenty, nabór. Pulpit pokazuje aktualności (harmonogram Gantta, najbliższe 45 dni), portfolio, wiadomości i stan sekcji.
- **Panel ładuje się na żądanie** (kłódka/#panel), a nie przy każdym wejściu — odwiedzający nie pobierają ~70 kB kodu panelu (lepsze Core Web Vitals).
- **Renderowanie na serwerze** (`functions/_middleware.js`) — zmiany z panelu trafiają do HTML wysyłanego Google (title, opis, JSON-LD, treść), a nie tylko do JavaScriptu.
- **Instagram** — zdjęcia przechodzą przez serwer strony, więc odwiedzający nie łączą się z Meta (RODO); bez tokenu sekcja pokazuje przycisk do profilu.
- **Czcionki** hostowane lokalnie (Cormorant Garamond + Jost), bez Google Fonts — zgodnie z RODO.

---

## 5. Lista kontrolna SEO
| Element | Status |
|---|---|
| `lang="pl"`, semantyczny HTML5, 1 × H1 (z frazą „Fotograf · Zgorzelec”), logiczne H2/H3 | ✅ |
| Unikalne `title` i `description` na każdej stronie | ✅ (edytowalne w panelu → SEO) |
| Canonical, Open Graph, Twitter Card, obraz OG 1200×630 | ✅ (`og-image.jpg` — typograficzny, gotowy) |
| JSON-LD: `ProfessionalService` + `Person` + `WebSite` + `WebPage` + `NewsArticle`; `BreadcrumbList` na podstronie; bez ocen | ✅ |
| Treść w HTML bez JS, aktualizowana z panelu po stronie serwera | ✅ |
| Obrazy: alt, width/height, lazy, `fetchpriority="high"`, WebP, `srcset`, opisowe nazwy plików | ✅ |
| robots.txt, sitemap.xml (dynamiczna z językami), 404, favicony, manifest, theme-color | ✅ |
| Mobile-first, przyciski ≥ 44 px, tekst ≥ 16 px, brak przewijania poziomego przy 390 px | ✅ |
| Mapa Google i YouTube dopiero po kliknięciu | ✅ |
| Lighthouse (test lokalny): wydajność 99 (telefon) / 100 (komputer), dostępność 100, dobre praktyki 100, SEO 100 po wpisaniu domeny | ✅ |
| **Adres domeny** w `render.js` + `node narzedzia/zbuduj.mjs` | ⏳ do uzupełnienia |
| **Prawdziwe zdjęcia** (zamiast `[ZDJĘCIE: …]`) + opisy alt | ⏳ klientka |
| **Link do Profilu Firmy w Google** i **link do opinii** (Panel → Kontakt) | ⏳ `[LINK DO UZUPEŁNIENIA]` |
| **Link do Messengera** (`https://m.me/…`) | ⏳ |
| **NIP** (stopka, polityka prywatności), adres do korespondencji w polityce | ⏳ `[DO UZUPEŁNIENIA]` |
| Treść pierwszej aktualności, dane drugiego fotografa | ⏳ |
| Google Search Console — weryfikacja i sitemap | ⏳ po wdrożeniu |

### Google Search Console — krok po kroku
1. Wejdź na [search.google.com/search-console](https://search.google.com/search-console) → **Dodaj usługę**.
2. Wybierz **Domena** (zalecane) i wpisz `annaniedobitek.pl` (bez https). Google poda rekord **TXT**.
3. Dodaj rekord TXT w DNS domeny (Cloudflare → domena → DNS → Add record → TXT, nazwa `@`) → **Zweryfikuj**.
   *(Alternatywa: typ „Prefiks URL” + meta tag — w `szablony/index.html` jest zakomentowane miejsce `google-site-verification`; po wklejeniu kodu uruchom `node narzedzia/zbuduj.mjs`).*
4. Menu **Mapy witryn** → wpisz `sitemap.xml` → **Prześlij**.
5. **Sprawdzenie adresu URL** → wpisz adres strony głównej → **Poproś o zindeksowanie**.
6. Załóż/uzupełnij **Profil Firmy w Google** (obszar działania bez adresu, kategoria „Fotograf”), a link wklej w panelu.

### Google Analytics 4
Nie jest włączony (brak zgody na cookies). Zakomentowany kod z Consent Mode jest w `szablony/index.html` — włącz go dopiero razem z banerem zgody.

---

## 6. Propozycje dodatkowe (nie wdrożone — do decyzji)
1. **Wersja niemiecka (DE)** — działalność obejmuje Görlitz; panel ma już przełącznik języków, wystarczy dodać DE i tłumaczenia.
2. **FAQ** („Jak przygotować się do sesji?”, „Kiedy otrzymam zdjęcia?”) — z danymi `FAQPage` dla Google.
3. **„Jak wygląda współpraca”** — 3–4 kroki od kontaktu do odbioru zdjęć (bez cen).
4. **Opinie z Google na stronie** — po zebraniu opinii (wyłącznie prawdziwe, z linkiem do źródła).
5. **Wpisy-porady** w Aktualnościach (np. „Sesja noworodkowa — kiedy najlepiej?”) — budują ruch z Google.
6. **Monogram „AN”** użyty w faviconie można rozwinąć w prosty znak graficzny, jeśli klientka zechce.
