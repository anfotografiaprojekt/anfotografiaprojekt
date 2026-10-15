// POST /api/kopie/przywroc — przywraca wybraną kopię (obecna wersja trafia do kopii)
import { json, blad, kv, wymagaj, zapiszTresci, poprawneDane } from '../../../lib/serwer.js';

export async function onRequestPost({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  let body = {}; try { body = await request.json(); } catch { }
  const id = String(body.id || '');
  if (!/^[\w-]{4,40}$/.test(id)) return blad('Nieprawidłowy identyfikator kopii.');
  const kopia = await kv(env).get('kopia:' + id, 'json');
  if (!kopia || !poprawneDane(kopia.dane)) return blad('Nie znaleziono kopii.', 404);
  const z = await zapiszTresci(env, kopia.dane);
  return json({ ok: true, dane: kopia.dane, zapisano: z.zapisano });
}
