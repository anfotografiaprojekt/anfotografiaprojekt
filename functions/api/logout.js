// POST /api/logout — wylogowanie (usuwa sesję z serwera i ciasteczka)
import { blad, kv, sesja, usunCiasteczka, csrfOk } from '../../lib/serwer.js';

export async function onRequestPost({ request, env }) {
  if (!csrfOk(request)) return blad('Nieprawidłowe żądanie.', 403);
  try { const s = await sesja(request, env); if (s) await kv(env).delete('sesja:' + s.token); } catch { }
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  usunCiasteczka.forEach((c) => h.append('Set-Cookie', c));
  return new Response('{"ok":true}', { status: 200, headers: h });
}
