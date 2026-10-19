// POST /api/kontakt — formularz kontaktowy (publiczny) → e-mail na prywatną skrzynkę
// Pola formularza pochodzą z panelu (Kontakt → Pola formularza). Serwer sprawdza je tą samą
// funkcją co przeglądarka (render.js → ANF.form): e-mail, telefon (długość numeru zależna
// od kraju), data, imię itd. Wiadomości NIE są przechowywane na serwerze — idą tylko e-mailem.
// Antyspam: ukryte pole-pułapka, minimalny czas wypełnienia, limit 5 wiadomości / godzinę z IP,
// sprawdzenie nagłówka i pochodzenia żądania, limit linków. Wysyłka: SMTP własnej skrzynki (lib/poczta.js).
import '../../public/assets/js/dane.js';
import '../../public/assets/js/render.js';
import { json, blad, kv, limit, zwieksz, ip, zgodnyOrigin } from '../../lib/serwer.js';
import { wyslijMail, mailZFormularza, odbiorca, skonfigurowany } from '../../lib/poczta.js';

const NIEDOSTEPNY = 'Formularz jest chwilowo niedostępny. Proszę napisać przez Messengera — odpowiem jak najszybciej.';

export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-ANF') !== '1' || !zgodnyOrigin(request)) return blad('Nieprawidłowe żądanie.', 403);
  let b = {}; try { b = await request.json(); } catch { return blad('Nieprawidłowe dane.'); }
  if (b.www) return json({ ok: true });                       // pułapka na boty: udajemy sukces
  if (!(+b.t > 2500)) return blad('Formularz został wysłany zbyt szybko. Proszę spróbować ponownie.');
  if (b.zgoda !== true) return blad('Do wysłania wiadomości potrzebna jest zgoda.');

  const A = globalThis.ANF, Rn = A.render, F = A.form;
  let zap = null; try { zap = await kv(env).get('tresci', 'json'); } catch { }
  const stan = Rn.stan(zap && zap.dane);
  const def = Rn.widoczne(stan.kontakt.pola || []);
  const wej = b.pola && typeof b.pola === 'object' ? b.pola : {};
  const dzis = Rn.dzis();
  const pola = [], bledy = {};
  for (const p of def) {
    let v = String(wej[p.id] == null ? '' : wej[p.id]).trim().slice(0, p.typ === 'obszar' ? 4000 : 300);
    const et = Rn.t(p.etykieta, 'pl') || p.id;
    const msg = F.walidujPole(p, v, dzis);
    if (msg) { bledy[p.id] = msg; continue; }
    if (!v) continue;
    if (p.typ === 'telefon') v = F.telefon('PL', v).wartosc;
    if (p.typ === 'tak') v = 'tak';
    if (p.typ === 'wybor') {
      const op = p.zrodlo === 'kategorie' ? (stan.portfolio.kategorie || []).map((c) => Rn.t(c.nazwa, 'pl')).concat(['Inne', 'Other'])
        : String(Rn.t(p.opcje, 'pl') || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
      if (op.indexOf(v) < 0) { bledy[p.id] = 'Proszę wybrać jedną z opcji z listy.'; continue; }
    }
    if (p.typ === 'data') v = v.split('-').reverse().join('.');
    pola.push({ id: p.id, typ: p.typ, etykieta: et, wartosc: v });
  }
  const pierwszy = Object.keys(bledy)[0];
  if (pierwszy) return blad(bledy[pierwszy], 400, { pole: pierwszy, bledy });
  if (!pola.length) return blad('Formularz jest pusty.');
  if ((pola.map((x) => x.wartosc).join(' ').match(/https?:\/\/|www\./g) || []).length > 3) return blad('Wiadomość zawiera zbyt wiele linków.');

  if (!(await skonfigurowany(env))) return blad(NIEDOSTEPNY, 503);
  const do_ = await odbiorca(env);
  if (!do_) return blad(NIEDOSTEPNY, 503);

  const l = await limit(env, 'kontakt:' + ip(request), 5, 3600);
  if (l.przekroczony) return blad('Wysłano już kilka wiadomości. Proszę spróbować za ' + l.minut + ' min lub napisać przez Messengera.', 429);

  const imie = (pola.find((x) => x.id === 'imie') || {}).wartosc || 'formularz';
  const email = (pola.find((x) => x.typ === 'email') || {}).wartosc || '';
  const rodzaj = (pola.find((x) => x.typ === 'wybor') || {}).wartosc || '';
  const host = new URL(request.url).host;                       // np. anfotografiaprojekt.pages.dev
  const { html, tekst } = mailZFormularza({ pola, host, czas: new Date() });
  const r = await wyslijMail(env, {
    do: do_, odpowiedzDo: email,
    nadawcaNazwa: host,
    temat: 'Wiadomość ze strony ' + host + ': ' + imie + (rodzaj ? ' — ' + rodzaj : ''),
    html, tekst,
  });
  if (!r.ok) return blad('Nie udało się wysłać wiadomości. Proszę spróbować za chwilę lub napisać przez Messengera.', 502);
  await zwieksz(env, l, 3600);
  return json({ ok: true });
}
