// POST /api/kontakt — formularz kontaktowy (publiczny)
// Pola formularza pochodzą z panelu (Kontakt → Pola formularza) — serwer sprawdza je według
// tej samej definicji: wymagane, typ (e-mail, telefon…), długość.
// Antyspam: ukryte pole-pułapka, minimalny czas wypełnienia, limit 5 wiadomości / godzinę z jednego IP,
// sprawdzenie nagłówka i pochodzenia żądania. Wiadomości trafiają do panelu (KV, 12 miesięcy),
// opcjonalnie także e-mailem przez Resend (RESEND_API_KEY + MAIL_DO).
import '../../public/assets/js/dane.js';
import '../../public/assets/js/render.js';
import { json, blad, kv, losowe, limit, zwieksz, ip, zgodnyOrigin } from '../../lib/serwer.js';

const ROK = 365 * 24 * 3600;
const tnij = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

export async function onRequestPost({ request, env, waitUntil }) {
  if (request.headers.get('X-ANF') !== '1' || !zgodnyOrigin(request)) return blad('Nieprawidłowe żądanie.', 403);
  let b = {}; try { b = await request.json(); } catch { return blad('Nieprawidłowe dane.'); }
  // pułapki na boty: udajemy sukces, nic nie zapisujemy
  if (b.www) return json({ ok: true });
  if (!(+b.t > 2500)) return blad('Formularz został wysłany zbyt szybko. Proszę spróbować ponownie.');
  if (b.zgoda !== true) return blad('Do wysłania wiadomości potrzebna jest zgoda.');

  const Rn = globalThis.ANF.render;
  let zap = null; try { zap = await kv(env).get('tresci', 'json'); } catch { }
  const stan = Rn.stan(zap && zap.dane);
  const def = Rn.widoczne(stan.kontakt.pola || []);
  const wej = b.pola && typeof b.pola === 'object' ? b.pola : {};
  const pola = [];
  for (const p of def) {
    const v = tnij(wej[p.id], p.typ === 'obszar' ? 4000 : 300);
    const et = Rn.t(p.etykieta, 'pl') || p.id;
    if (!v) { if (p.wym) return blad('Proszę uzupełnić pole: ' + et + '.'); continue; }
    if (p.typ === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return blad('Proszę podać poprawny adres e-mail.');
    if (p.typ === 'telefon' && !/^[+\d][\d\s-]{6,}$/.test(v)) return blad('Numer telefonu jest niepoprawny.');
    pola.push({ id: p.id, etykieta: et, wartosc: v });
  }
  if (!pola.length) return blad('Formularz jest pusty.');
  const calosc = pola.map((x) => x.wartosc).join(' ');
  if ((calosc.match(/https?:\/\//g) || []).length > 3) return blad('Wiadomość zawiera zbyt wiele linków.');
  const wart = (id) => (pola.find((x) => x.id === id) || {}).wartosc || '';

  try {
    const l = await limit(env, 'kontakt:' + ip(request), 5, 3600);
    if (l.przekroczony) return blad('Wysłano już kilka wiadomości. Proszę spróbować za ' + l.minut + ' min lub napisać przez Messengera.', 429);
    await zwieksz(env, l, 3600);
    const czas = new Date().toISOString(), id = Date.now().toString(36) + '-' + losowe(5);
    const wiad = { id, czas, imie: wart('imie'), email: wart('email'), pola, przeczytana: false };
    await kv(env).put('msg:' + id, JSON.stringify(wiad), { expirationTtl: ROK, metadata: { czas, przeczytana: false } });
    if (env.RESEND_API_KEY && env.MAIL_DO) {
      const tresc = 'Nowa wiadomość ze strony\n\n' + pola.map((x) => x.etykieta + ': ' + x.wartosc).join('\n');
      waitUntil(fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_OD || 'Strona <onboarding@resend.dev>', to: [env.MAIL_DO], reply_to: wiad.email || undefined, subject: 'Wiadomość ze strony: ' + (wiad.imie || 'formularz'), text: tresc }),
      }).catch(() => { }));
    }
    return json({ ok: true });
  } catch (e) { return blad('Nie udało się zapisać wiadomości. Proszę napisać przez Messengera.', 503); }
}
