// Panel → Kontakt i dane → „Wiadomości e-mail”
// GET    /api/powiadomienia            — adres odbiorcy, stan konfiguracji, liczba starych wiadomości w KV
// POST   /api/powiadomienia {email}    — zapis adresu, na który przychodzą wiadomości z formularza
// POST   /api/powiadomienia {test:1}   — wysyłka wiadomości testowej
// DELETE /api/powiadomienia            — usunięcie wiadomości zapisanych przez poprzednią wersję strony (msg:*)
import '../../public/assets/js/dane.js';
import '../../public/assets/js/render.js';
import { json, blad, kv, wymagaj, limit, zwieksz, ip } from '../../lib/serwer.js';
import { KLUCZ_ODBIORCY, NADAWCA_DOMYSLNY, odbiorca, skonfigurowany, wyslijMail, mailZFormularza } from '../../lib/poczta.js';

async function stareKlucze(env) { try { return (await kv(env).list({ prefix: 'msg:', limit: 1000 })).keys.map((k) => k.name); } catch { return []; } }

export async function onRequestGet({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  return json({
    email: await odbiorca(env), zPanelu: !!(await kv(env).get(KLUCZ_ODBIORCY)),
    klucz: skonfigurowany(env), nadawca: env.MAIL_OD || NADAWCA_DOMYSLNY, wlasnaDomena: !!env.MAIL_OD,
    stare: (await stareKlucze(env)).length,
  });
}

export async function onRequestPost({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  let b = {}; try { b = await request.json(); } catch { }
  if (b.test) {
    const l = await limit(env, 'mailtest:' + ip(request), 5, 3600);
    if (l.przekroczony) return blad('Wysłano już kilka wiadomości testowych. Spróbuj za ' + l.minut + ' min.', 429);
    await zwieksz(env, l, 3600);
    const { html, tekst } = mailZFormularza({
      host: new URL(request.url).host, czas: new Date(),
      pola: [{ etykieta: 'Imię', wartosc: 'Wiadomość testowa' }, { etykieta: 'Treść', wartosc: 'Jeśli to czytasz, formularz kontaktowy na stronie jest poprawnie połączony z Twoją skrzynką.' }],
    });
    const r = await wyslijMail(env, { do: await odbiorca(env), temat: 'Test formularza ze strony', html, tekst });
    if (r.ok) return json({ ok: true });
    let pod = r.blad;
    if (r.status === 403 || /testing emails|own email|verify a domain/i.test(r.blad || '')) pod = 'Bez własnej domeny Resend wysyła wiadomości tylko na adres, na który założono konto Resend. Wpisz tutaj ten adres albo zweryfikuj domenę w Resend i ustaw zmienną MAIL_OD. (Resend: ' + r.blad + ')';
    if (r.status === 401) pod = 'Klucz RESEND_API_KEY jest nieprawidłowy — skopiuj go ponownie z panelu Resend.';
    return blad(pod, 502);
  }
  const e = String(b.email || '').trim();
  const msg = globalThis.ANF.form.emailBlad(e);
  if (!e || msg) return blad(msg || 'Proszę wpisać adres e-mail.');
  await kv(env).put(KLUCZ_ODBIORCY, e);
  return json({ ok: true, email: e });
}

export async function onRequestDelete({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const k = await stareKlucze(env);
  await Promise.all(k.map((x) => kv(env).delete(x)));
  return json({ ok: true, usunieto: k.length });
}
