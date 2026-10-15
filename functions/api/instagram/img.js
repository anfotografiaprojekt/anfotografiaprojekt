// GET /api/instagram/img?id=… — pośrednik dla zdjęć z Instagrama (tylko posty z pamięci podręcznej;
// odwiedzający nie łączą się z serwerami Meta, a link do zdjęcia nie wygasa w przeglądarce)
import { pobierzPosty } from '../instagram.js';

export async function onRequestGet({ request, env, waitUntil }) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^\d{5,30}$/.test(id)) return new Response('Nie znaleziono', { status: 404 });
  const cache = caches.default, klucz = new Request(new URL('/api/instagram/img?id=' + id, request.url).toString());
  const z = await cache.match(klucz); if (z) return z;
  const posty = (await pobierzPosty(env)) || [];
  const p = posty.find((x) => x.id === id);
  if (!p) return new Response('Nie znaleziono', { status: 404 });
  const r = await fetch(p.src);
  if (!r.ok) return new Response('Błąd pobierania', { status: 502 });
  const odp = new Response(r.body, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
  waitUntil(cache.put(klucz, odp.clone()));
  return odp;
}
