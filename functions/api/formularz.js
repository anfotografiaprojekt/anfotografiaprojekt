// Panel → Kontakt i dane → „Formularz kontaktowy” (wymaga zalogowania; zmiany z ochroną CSRF)
// GET    /api/formularz                    — adres odbiorcy, ustawienia skrzynki (bez hasła), stan
// POST   /api/formularz {email}            — adres, na który przychodzą wiadomości (można zmieniać w każdej chwili)
// POST   /api/formularz {smtp:{host,port,login,haslo}} — skrzynka, z której serwer wysyła wiadomości
// POST   /api/formularz {test:1}           — wiadomość testowa
// DELETE /api/formularz                    — usunięcie wiadomości zapisanych przez starszą wersję strony (msg:*)
import '../../public/assets/js/dane.js';
import '../../public/assets/js/render.js';
import { json, blad, kv, wymagaj, limit, zwieksz, ip, bladKV } from '../../lib/serwer.js';
import { KLUCZ_ODBIORCY, odbiorca, ustawieniaSmtp, zapiszSmtp, wyslijMail, mailZFormularza } from '../../lib/poczta.js';

async function stareKlucze(env) { try { return (await kv(env).list({ prefix: 'msg:', limit: 1000 })).keys.map((k) => k.name); } catch { return []; } }
const HOST = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export async function onRequestGet({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const c = await ustawieniaSmtp(env, false);
  return json({
    email: await odbiorca(env),
    smtp: c ? { host: c.host, port: c.port, login: c.login, maHaslo: c.maHaslo, zrodlo: c.zrodlo } : null,
    gotowe: !!(c && c.maHaslo && (await odbiorca(env))),
    stare: (await stareKlucze(env)).length,
  }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  let b = {}; try { b = await request.json(); } catch { return blad('Nieprawidłowe dane.'); }
  const F = globalThis.ANF.form;

  if (b.test) {
    const l = await limit(env, 'mailtest:' + ip(request), 5, 3600);
    if (l.przekroczony) return blad('Wysłano już kilka wiadomości testowych. Spróbuj za ' + l.minut + ' min.', 429);
    const { html, tekst } = mailZFormularza({
      host: new URL(request.url).host, czas: new Date(),
      pola: [{ etykieta: 'Imię', wartosc: 'Wiadomość testowa' }, { etykieta: 'Treść', wartosc: 'Jeśli to czytasz, formularz kontaktowy na stronie jest poprawnie połączony z Twoją skrzynką.' }],
    });
    const r = await wyslijMail(env, { temat: 'Test formularza ze strony', html, tekst });
    try { await zwieksz(env, l, 3600); } catch { }
    return r.ok ? json({ ok: true }) : blad(r.blad, 502);
  }

  if (b.smtp) {
    const host = String(b.smtp.host || '').trim().toLowerCase(), port = +b.smtp.port, login = String(b.smtp.login || '').trim();
    const haslo = typeof b.smtp.haslo === 'string' ? b.smtp.haslo : '';
    const lokalny = /^(127\.0\.0\.1|localhost)$/.test(host) && /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(new URL(request.url).host);
    if (!lokalny && !HOST.test(host)) return blad('Adres serwera poczty jest niepoprawny (np. smtp.gmail.com).');
    if (!lokalny && port !== 465 && port !== 587) return blad('Port musi być 465 (SSL) albo 587 (STARTTLS).');
    if (F.emailBlad(login)) return blad('Login do skrzynki: ' + F.emailBlad(login));
    if (haslo.length > 200) return blad('Hasło jest za długie.');
    const stare = await ustawieniaSmtp(env, false);
    if (!haslo && !(stare && stare.zrodlo === 'panel' && stare.maHaslo && stare.login === login && stare.host === host)) return blad('Proszę wpisać hasło do skrzynki.');
    try { await zapiszSmtp(env, { host, port, login, haslo }); } catch (e) { return bladKV(e); }
    return json({ ok: true });
  }

  const e = String(b.email || '').trim();
  const msg = F.emailBlad(e);
  if (!e || msg) return blad(msg || 'Proszę wpisać adres e-mail.');
  try { await kv(env).put(KLUCZ_ODBIORCY, e); } catch (er) { return bladKV(er); }
  return json({ ok: true, email: e });
}

export async function onRequestDelete({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const k = await stareKlucze(env);
  await Promise.all(k.map((x) => kv(env).delete(x)));
  return json({ ok: true, usunieto: k.length });
}
