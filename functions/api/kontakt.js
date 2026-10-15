// POST /api/kontakt — formularz kontaktowy (publiczny)
// Antyspam: ukryte pole-pułapka, minimalny czas wypełnienia, limit 5 wiadomości / godzinę z jednego IP,
// sprawdzenie nagłówka i pochodzenia żądania. Wiadomości trafiają do panelu (KV, 12 miesięcy),
// opcjonalnie także e-mailem przez Resend (RESEND_API_KEY + MAIL_DO).
import { json, blad, kv, losowe, limit, zwieksz, ip, zgodnyOrigin } from '../../lib/serwer.js';

const ROK = 365 * 24 * 3600;
const tnij = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

export async function onRequestPost({ request, env, waitUntil }) {
  if (request.headers.get('X-ANF') !== '1' || !zgodnyOrigin(request)) return blad('Nieprawidłowe żądanie.', 403);
  let b = {}; try { b = await request.json(); } catch { return blad('Nieprawidłowe dane.'); }
  // pułapki na boty: udajemy sukces, nic nie zapisujemy
  if (b.www) return json({ ok: true });
  if (!(+b.t > 2500)) return blad('Formularz został wysłany zbyt szybko. Proszę spróbować ponownie.');

  const d = {
    imie: tnij(b.imie, 120), email: tnij(b.email, 160), telefon: tnij(b.telefon, 40), termin: tnij(b.termin, 80),
    rodzaj: tnij(b.rodzaj, 60), wiadomosc: tnij(b.wiadomosc, 4000),
  };
  if (d.imie.length < 2) return blad('Proszę podać imię i nazwisko.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return blad('Proszę podać poprawny adres e-mail.');
  if (d.telefon && !/^[+\d][\d\s-]{6,}$/.test(d.telefon)) return blad('Numer telefonu jest niepoprawny.');
  if (d.wiadomosc.length < 10) return blad('Proszę wpisać wiadomość (co najmniej 10 znaków).');
  if (b.zgoda !== true) return blad('Do wysłania wiadomości potrzebna jest zgoda.');
  if ((d.wiadomosc.match(/https?:\/\//g) || []).length > 3) return blad('Wiadomość zawiera zbyt wiele linków.');

  try {
    const l = await limit(env, 'kontakt:' + ip(request), 5, 3600);
    if (l.przekroczony) return blad('Wysłano już kilka wiadomości. Proszę spróbować za ' + l.minut + ' min lub napisać przez Messengera.', 429);
    await zwieksz(env, l, 3600);
    const czas = new Date().toISOString(), id = Date.now().toString(36) + '-' + losowe(5);
    const wiad = { id, czas, ...d, przeczytana: false };
    await kv(env).put('msg:' + id, JSON.stringify(wiad), { expirationTtl: ROK, metadata: { czas, przeczytana: false } });
    if (env.RESEND_API_KEY && env.MAIL_DO) {
      const tresc = `Nowa wiadomość ze strony\n\nOd: ${d.imie} <${d.email}>\nTelefon: ${d.telefon || '—'}\nDotyczy: ${d.rodzaj || '—'}\nTermin: ${d.termin || '—'}\n\n${d.wiadomosc}`;
      waitUntil(fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_OD || 'Strona <onboarding@resend.dev>', to: [env.MAIL_DO], reply_to: d.email, subject: 'Wiadomość ze strony: ' + (d.rodzaj || d.imie), text: tresc }),
      }).catch(() => { }));
    }
    return json({ ok: true });
  } catch (e) { return blad('Nie udało się zapisać wiadomości. Proszę napisać przez Messengera.', 503); }
}
