// GET /api/instagram?n=6 — najnowsze posty z Instagrama (Instagram API with Instagram login)
// Token: zmienna INSTAGRAM_TOKEN (konto profesjonalne/twórcy). Odświeżany automatycznie co ~7 dni
// i zapisywany w KV, więc nie wygasa po 60 dniach. Wyniki w pamięci podręcznej na 1 godzinę.
// Zdjęcia idą przez /api/instagram/img (serwer pośredniczy), więc odwiedzający nie łączą się z Meta.
import { json, kv } from '../../lib/serwer.js';

const GODZINA = 3600 * 1000, TYDZIEN = 7 * 24 * GODZINA;

async function token(env) {
  const K = kv(env), zap = await K.get('ig:token', 'json');
  let t = (zap && zap.t) || env.INSTAGRAM_TOKEN || '';
  if (!t) return '';
  if (!zap || Date.now() - zap.odswiezono > TYDZIEN) {
    try {
      const r = await fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(t));
      if (r.ok) { const j = await r.json(); if (j.access_token) t = j.access_token; }
    } catch { }
    await K.put('ig:token', JSON.stringify({ t, odswiezono: Date.now() }));
  }
  return t;
}

export async function pobierzPosty(env, wymus = false) {
  const K = kv(env), cache = await K.get('ig:cache', 'json');
  if (!wymus && cache && Date.now() - cache.czas < GODZINA) return cache.posty;
  const t = await token(env);
  if (!t) return null;
  try {
    const r = await fetch('https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=' + encodeURIComponent(t));
    if (!r.ok) return cache ? cache.posty : null;
    const j = await r.json();
    const posty = (j.data || []).map((p) => ({
      id: p.id, url: p.permalink, src: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
      alt: (p.caption || '').split('\n')[0].slice(0, 120), czas: p.timestamp,
    })).filter((p) => p.src);
    await K.put('ig:cache', JSON.stringify({ czas: Date.now(), posty }));
    return posty;
  } catch { return cache ? cache.posty : null; }
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  try {
    if (u.searchParams.get('status')) {
      const c = await kv(env).get('ig:cache', 'json');
      return json({ skonfigurowany: !!(env.INSTAGRAM_TOKEN || (await kv(env).get('ig:token'))), posty: c ? c.posty.length : 0 });
    }
    const n = Math.min(12, Math.max(1, +u.searchParams.get('n') || 6));
    const posty = await pobierzPosty(env);
    if (!posty) return json({ posty: [], skonfigurowany: false }, 200, { 'Cache-Control': 'public, max-age=300' });
    return json({
      posty: posty.slice(0, n).map((p) => ({ id: p.id, url: p.url, img: '/api/instagram/img?id=' + encodeURIComponent(p.id), alt: p.alt })),
    }, 200, { 'Cache-Control': 'public, max-age=900' });
  } catch { return json({ posty: [] }); }
}
