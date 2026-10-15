// GET /api/tresci — publiczny odczyt treści strony
// PUT /api/tresci — zapis (tylko po zalogowaniu, z ochroną CSRF)
import { json, blad, kv, wymagaj, zapiszTresci, poprawneDane, KLUCZ_TRESCI, bladKV } from '../../lib/serwer.js';

export async function onRequestGet({ env }) {
  try {
    const z = await kv(env).get(KLUCZ_TRESCI, { type: 'json', cacheTtl: 30 });   // najkrótszy czas pamięci podręcznej KV
    return json(z || { dane: null, zapisano: null }, 200, { 'Cache-Control': 'no-cache' });
  } catch (e) { return blad(e.message, 503); }
}

export async function onRequestPut({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const tekst = await request.text();
  if (tekst.length > 3 * 1024 * 1024) return blad('Za dużo danych (maks. 3 MB). Zdjęcia wgrywaj przyciskiem „Wgraj z dysku”.', 413);
  let body; try { body = JSON.parse(tekst); } catch { return blad('Nieprawidłowy JSON.'); }
  if (!poprawneDane(body && body.dane)) return blad('Dane nie pochodzą z panelu tej strony.');
  try {
    const z = await zapiszTresci(env, body.dane);
    return json({ ok: true, zapisano: z.zapisano });
  } catch (e) { return bladKV(e); }
}
