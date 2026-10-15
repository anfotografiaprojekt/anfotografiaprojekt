// GET /api/kopie — lista 10 ostatnich automatycznych kopii (tworzonych przy każdym zapisie)
import { json, kv, wymagaj } from '../../lib/serwer.js';

export async function onRequestGet({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  return json({ kopie: (await kv(env).get('kopie:lista', 'json')) || [] });
}
