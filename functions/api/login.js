// POST /api/login — logowanie do panelu (limit: 5 nieudanych prób / 15 min z jednego adresu IP)
import { json, blad, aktualnyHash, sprawdzHaslo, utworzSesje, limit, zwieksz, wyzeruj, ip, zgodnyOrigin } from '../../lib/serwer.js';

const MAKS = 5, OKNO = 15 * 60;

export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-CMS') !== '1' || !zgodnyOrigin(request)) return blad('Nieprawidłowe żądanie.', 403);
  try {
    const hash = await aktualnyHash(env);
    if (!hash) return blad('Panel nie jest skonfigurowany: ustaw zmienną ADMIN_PASSWORD_HASH (instrukcja w README).', 503);
    if (!env.SESSION_SECRET) return blad('Panel nie jest skonfigurowany: ustaw zmienną SESSION_SECRET (instrukcja w README).', 503);
    const l = await limit(env, 'login:' + ip(request), MAKS, OKNO);
    if (l.przekroczony) return json({ blad: 'Zbyt wiele prób.', minut: l.minut }, 429, { 'Retry-After': String(l.minut * 60) });
    let body = {}; try { body = await request.json(); } catch { }
    const haslo = typeof body.haslo === 'string' ? body.haslo : '';
    if (haslo && haslo.length <= 200 && await sprawdzHaslo(haslo, hash)) {
      await wyzeruj(env, l);
      const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      (await utworzSesje(env)).forEach((c) => h.append('Set-Cookie', c));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: h });
    }
    const pozostalo = await zwieksz(env, l, OKNO);
    await new Promise((r) => setTimeout(r, 400)); // spowolnienie zgadywania
    return json({ blad: 'Nieprawidłowe hasło.', pozostalo }, 401);
  } catch (e) { return blad(e.message, 503); }
}
