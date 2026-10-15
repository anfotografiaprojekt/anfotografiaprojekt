// GET /sitemap.xml — mapa strony generowana z aktualnych danych (wersje językowe z panelu:
// wyłączony język znika z mapy i z linków hreflang)
import '../public/assets/js/dane.js';
import '../public/assets/js/render.js';

export async function onRequestGet({ request, env }) {
  const A = globalThis.ANF, Rn = A.render;
  let zap = null;
  try { zap = env.TRESCI ? await env.TRESCI.get('tresci', 'json', { cacheTtl: 60 }) : null; } catch { }
  const s = Rn.stan(zap && zap.dane);
  const baza = A.DOMENA.includes('[DOMENA]') ? new URL(request.url).origin : A.DOMENA;
  const jezyki = Rn.jezykiWl(s);
  const dzis = (zap && zap.zapisano ? zap.zapisano : new Date().toISOString()).slice(0, 10);
  const alt = jezyki.length > 1
    ? jezyki.map((j) => `    <xhtml:link rel="alternate" hreflang="${j.kod}" href="${baza}/${j.kod === 'pl' ? '' : '?lang=' + j.kod}"/>`).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${baza}/"/>\n`
    : '';
  const url = (loc, pr, cf) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${dzis}</lastmod>\n    <changefreq>${cf}</changefreq>\n    <priority>${pr}</priority>\n${alt}  </url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${jezyki.map((j) => url(baza + '/' + (j.kod === 'pl' ? '' : '?lang=' + j.kod), j.kod === 'pl' ? '1.0' : '0.8', 'weekly')).join('\n')}
  <url>\n    <loc>${baza}/polityka-prywatnosci</loc>\n    <changefreq>yearly</changefreq>\n    <priority>0.2</priority>\n  </url>
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
