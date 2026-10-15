// GET /api/zdjecia/<id> — wyświetlanie zdjęć wgranych w panelu (z długim cache)
import { kv } from '../../../lib/serwer.js';

export async function onRequestGet({ params, env }) {
  const id = String(params.id || '');
  if (!/^[\w-]{8,64}$/.test(id)) return new Response('Nie znaleziono', { status: 404 });
  const { value, metadata } = await kv(env).getWithMetadata('zdj:' + id, { type: 'arrayBuffer', cacheTtl: 86400 });
  if (!value) return new Response('Nie znaleziono', { status: 404 });
  return new Response(value, {
    headers: {
      'Content-Type': (metadata && metadata.typ) || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
