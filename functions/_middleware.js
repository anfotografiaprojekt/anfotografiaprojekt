// Renderowanie po stronie serwera (SSR) — Anna Niedobitek Fotografia
// Dla stron HTML podmienia fragmenty oznaczone data-ssr="…" na HTML wygenerowany z aktualnych
// danych z panelu (KV). Dzięki temu Google widzi zmiany z panelu bez wykonywania JavaScriptu,
// a odwiedzający nie widzą „mignięcia” starej treści. Przy błędzie wysyłany jest plik bez zmian.
import '../public/assets/js/dane.js';
import '../public/assets/js/render.js';

const POMIN = /^\/(api|assets)\//;
const STARY_ADRES = /^anfotografiaprojekt\.pages\.dev$/i;

function zPrefiksem(html, prefix) {
  return html.replace(/href="#/g, `href="${prefix}#`).replace(/href="polityka-prywatnosci\.html/g, `href="${prefix}polityka-prywatnosci.html`);
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  /* Stary adres próbny → docelowa domena (301). Podglądy wersji (xxx.anfotografiaprojekt.pages.dev) działają dalej. */
  if (STARY_ADRES.test(url.hostname) && (request.method === 'GET' || request.method === 'HEAD') && !url.pathname.startsWith('/api/')) {
    return Response.redirect(globalThis.ANF.DOMENA.replace(/\/$/, '') + url.pathname + url.search, 301);
  }
  if (request.method !== 'GET' || POMIN.test(url.pathname)) return next();
  const odp = await next();
  const ct = odp.headers.get('Content-Type') || '';
  if (!ct.includes('text/html') || (odp.status !== 200 && odp.status !== 404)) return odp;

  try {
    const A = globalThis.ANF, Rn = A.render;
    let zap = null;
    if (env.TRESCI) zap = await env.TRESCI.get('tresci', 'json', { cacheTtl: 30 });
    const stan = Rn.stan(zap && zap.dane);
    const lang = url.searchParams.get('lang') || 'pl';
    const out = Rn.wszystko(stan, { lang });
    const glowna = url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/index';
    const zamien = {
      element(el) {
        const k = el.getAttribute('data-ssr');
        if (k === 'title') { el.setInnerContent(out.title); return; }
        if (k === 'sekcje') { el.setInnerContent(out.sekcje, { html: true }); return; }
        if (k === 'theme') { el.setAttribute('content', out.motywTlo); return; }
        if (k === 'description' || k === 'og-description' || k === 'tw-description') { el.setAttribute('content', out.description); return; }
        if (k === 'og-title' || k === 'tw-title') { el.setAttribute('content', out.title); return; }
        if (k === 'jsonld') { el.setInnerContent(out.jsonld, { html: true }); return; }
        if (k === 'hreflang') { if (out.hreflang) el.after(out.hreflang, { html: true }); return; }
        if (k === 'preload-hero') {
          const h = out.heroImg;
          if (!h) { el.remove(); return; }
          el.setAttribute('href', h.src);
          if (h.srcset) el.setAttribute('imagesrcset', h.srcset); else el.removeAttribute('imagesrcset');
          return;
        }
        if (!(k in out) || typeof out[k] !== 'string') return;
        const prefix = el.getAttribute('data-prefix');
        let html = out[k];
        if (prefix) html = zPrefiksem(html, prefix).replace(`data-ssr="${k}"`, `data-ssr="${k}" data-prefix="${prefix}"`);
        el.replace(html, { html: true });
      },
    };
    let rw = new HTMLRewriter()
      .on('[data-ssr]', zamien)
      .on('html', { element(el) { el.setAttribute('lang', out.ctx.lang); el.setAttribute('data-motyw', out.motyw); } })
      .on('meta[name="anf-ssr"]', { element(el) { el.setAttribute('content', out.znacznik); } });
    if (glowna) {
      const stanJson = JSON.stringify(stan).replace(/</g, '\\u003c');
      rw = rw.on('head', { element(el) { el.append(`<script type="application/json" id="cms-state" data-zapisano="${String((zap && zap.zapisano) || '').replace(/[^\w:.\-]/g, '')}">${stanJson}</script>`, { html: true }); } });
    }
    const wynik = rw.transform(odp);
    const h = new Headers(wynik.headers);
    h.delete('Content-Length'); h.delete('ETag');
    h.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return new Response(wynik.body, { status: odp.status, headers: h });
  } catch (e) {
    return odp;
  }
}
