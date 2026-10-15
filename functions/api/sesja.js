// GET /api/sesja — czy przeglądarka ma ważną sesję panelu
import { json, sesja, usunCiasteczka } from '../../lib/serwer.js';

export async function onRequestGet({ request, env }) {
  let s = null; try { s = await sesja(request, env); } catch { }
  if (s) return json({ zalogowany: true });
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  usunCiasteczka.forEach((c) => h.append('Set-Cookie', c));
  return new Response('{"zalogowany":false}', { status: 200, headers: h });
}
