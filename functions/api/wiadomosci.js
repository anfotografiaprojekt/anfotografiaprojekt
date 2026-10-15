// GET    /api/wiadomosci        — lista wiadomości z formularza (panel)
// PATCH  /api/wiadomosci?id=…   — oznacz jako przeczytaną
// DELETE /api/wiadomosci?id=…   — usuń
import { json, blad, kv, wymagaj } from '../../lib/serwer.js';

const okId = (id) => /^[\w-]{6,40}$/.test(id || '');

export async function onRequestGet({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const K = kv(env), lista = await K.list({ prefix: 'msg:', limit: 1000 });
  const klucze = lista.keys.sort((a, b) => String((b.metadata || {}).czas).localeCompare(String((a.metadata || {}).czas))).slice(0, 200);
  const wiad = (await Promise.all(klucze.map((k) => K.get(k.name, 'json')))).filter(Boolean);
  return json({ wiadomosci: wiad });
}

export async function onRequestPatch({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const id = new URL(request.url).searchParams.get('id');
  if (!okId(id)) return blad('Nieprawidłowy identyfikator.');
  const K = kv(env), { value, metadata } = await K.getWithMetadata('msg:' + id, 'json');
  if (!value) return blad('Nie znaleziono wiadomości.', 404);
  value.przeczytana = true;
  const wygasa = Math.floor(new Date(value.czas).getTime() / 1000) + 365 * 24 * 3600;
  await K.put('msg:' + id, JSON.stringify(value), { expiration: Math.max(wygasa, Math.floor(Date.now() / 1000) + 3600), metadata: { ...(metadata || {}), przeczytana: true } });
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const id = new URL(request.url).searchParams.get('id');
  if (!okId(id)) return blad('Nieprawidłowy identyfikator.');
  await kv(env).delete('msg:' + id);
  return json({ ok: true });
}
