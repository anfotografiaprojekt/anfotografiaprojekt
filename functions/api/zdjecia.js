// POST /api/zdjecia — wgrywanie zdjęć z panelu (już zmniejszonych w przeglądarce do ok. 1600 px)
// Zdjęcie zapisuje się w KV (klucz zdj:<id>) i jest serwowane przez GET /api/zdjecia/<id>.
import { json, blad, kv, wymagaj, losowe } from '../../lib/serwer.js';

const MAKS = 6 * 1024 * 1024;
function typObrazu(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
  return null;
}

export async function onRequestPost({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return blad('Pusty plik.');
  if (buf.byteLength > MAKS) return blad('Zdjęcie jest za duże (maks. 6 MB po zmniejszeniu).', 413);
  const typ = typObrazu(new Uint8Array(buf, 0, 12));
  if (!typ) return blad('Dozwolone są tylko zdjęcia JPG, PNG lub WebP.', 415);
  const id = Date.now().toString(36) + losowe(9);
  await kv(env).put('zdj:' + id, buf, { metadata: { typ, rozmiar: buf.byteLength, czas: Date.now() } });
  return json({ ok: true, id, url: '/api/zdjecia/' + id });
}
