// POST /api/haslo — zmiana hasła (wymaga zalogowania i obecnego hasła)
// Nowy hash trafia do KV (auth:haslo) i od razu zastępuje ADMIN_PASSWORD_HASH.
// Wszystkie inne sesje zostają unieważnione; bieżąca dostaje nową.
import { blad, kv, wymagaj, aktualnyHash, sprawdzHaslo, hashHasla, zwiekszWersjeAuth, utworzSesje, limit, zwieksz, ip } from '../../lib/serwer.js';

export async function onRequestPost({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  let body = {}; try { body = await request.json(); } catch { }
  const { obecne, nowe } = body;
  if (typeof nowe !== 'string' || nowe.length < 10) return blad('Nowe hasło musi mieć co najmniej 10 znaków.');
  if (nowe.length > 200) return blad('Hasło jest za długie.');
  const l = await limit(env, 'haslo:' + ip(request), 5, 15 * 60);
  if (l.przekroczony) return blad('Zbyt wiele prób. Spróbuj za ' + l.minut + ' min.', 429);
  if (typeof obecne !== 'string' || !(await sprawdzHaslo(obecne, await aktualnyHash(env)))) {
    await zwieksz(env, l, 15 * 60);
    return blad('Obecne hasło jest nieprawidłowe.', 401);
  }
  await kv(env).put('auth:haslo', await hashHasla(nowe));
  await kv(env).delete('sesja:' + w.sesja.token);
  await zwiekszWersjeAuth(env);
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  (await utworzSesje(env)).forEach((c) => h.append('Set-Cookie', c));
  return new Response('{"ok":true}', { status: 200, headers: h });
}
