#!/usr/bin/env node
/**
 * Budowanie strony: wstawia do HTML treść wygenerowaną z danych początkowych
 * (widoczna dla Google bez JavaScriptu), krytyczny CSS, adres domeny i wersję plików.
 *
 *   node narzedzia/zbuduj.mjs
 *
 * Adres domeny ustawiasz w JEDNYM miejscu: public/assets/js/render.js → var DOMENA = '…'
 * Źródła HTML: szablony/*.html  →  wynik: public/*.html, public/sitemap.xml, public/robots.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// 1) Załaduj dane i renderer w izolowanym kontekście
const ctx = { console, Intl, Date, JSON, URLSearchParams };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(rd('public/assets/js/dane.js'), ctx, { filename: 'dane.js' });
vm.runInContext(rd('public/assets/js/render.js'), ctx, { filename: 'render.js' });
const A = ctx.ANF, Rn = A.render;
const DOMENA = A.DOMENA;
const dzis = Rn.dzis();
const stan = Rn.stan();
const out = Rn.wszystko(stan, { lang: 'pl', today: dzis });

// 2) CSS: minimalizacja + ścieżki czcionek względem strony
const cssZrodlo = rd('public/assets/css/site.css');
const minCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};:,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
const css = minCss(cssZrodlo);
const cssDla = (prefix) => css.replace(/url\(\.\.\/fonts\//g, `url(${prefix}assets/fonts/`);

// 3) Wersja plików (cache-busting)
const WERSJA = crypto.createHash('sha1')
  .update(['dane.js', 'render.js', 'site.js', 'cms.js'].map((f) => { try { return rd('public/assets/js/' + f); } catch { return ''; } }).join('') + cssZrodlo + (fs.existsSync(path.join(PUB, 'assets/css/cms.css')) ? rd('public/assets/css/cms.css') : ''))
  .digest('hex').slice(0, 10);

const escAttr = (s) => Rn.esc(s);
function zPrefiksem(html, prefix) {
  return html.replace(/href="#/g, `href="${prefix}#`).replace(/href="polityka-prywatnosci\.html/g, `href="${prefix}polityka-prywatnosci.html`);
}

function zbuduj(plik, { prefix = '', fontPrefix = '' } = {}) {
  let h = rd('szablony/' + plik);
  const mapa = {
    title: Rn.esc(out.title),
    description: escAttr(out.description),
    hreflang: out.hreflang,
    jsonld: out.jsonld,
    znacznik: escAttr(out.znacznik),
  };
  for (const k of ['start', 'oMnie', 'historia', 'aktualnosci', 'kadra', 'portfolio', 'instagram', 'kontakt', 'kropki', 'jezyki', 'pasek']) mapa[k] = out[k];
  mapa.nav = prefix ? zPrefiksem(out.nav, prefix).replace('data-ssr="nav"', `data-ssr="nav" data-prefix="${prefix}"`) : out.nav;
  mapa.stopka = prefix ? zPrefiksem(out.stopka, prefix).replace('data-ssr="stopka"', `data-ssr="stopka" data-prefix="${prefix}"`) : out.stopka;
  h = h.replace(/<!--SSR:(\w+)-->/g, (m, k) => (k in mapa ? mapa[k] : m));
  h = h.replace('/*!SSR:css*/', cssDla(fontPrefix));
  h = h.replaceAll('{{DOMENA}}', DOMENA).replaceAll('{{WERSJA}}', WERSJA).replaceAll('{{DATA}}', Rn.dataPL(dzis, 'pl'));
  fs.writeFileSync(path.join(PUB, plik), h);
  console.log('✓', plik, (Buffer.byteLength(h) / 1024).toFixed(1) + ' kB');
}

zbuduj('index.html');
zbuduj('polityka-prywatnosci.html', { prefix: './' });
zbuduj('404.html', { prefix: '/', fontPrefix: '/' });

// 4) sitemap.xml i robots.txt (wersja statyczna; na serwerze Cloudflare
//    /sitemap.xml generuje functions/sitemap.xml.js z uwzględnieniem języków)
fs.writeFileSync(path.join(PUB, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${DOMENA}/</loc><lastmod>${dzis}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${DOMENA}/polityka-prywatnosci</loc><lastmod>${dzis}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>
`);
fs.writeFileSync(path.join(PUB, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${DOMENA}/sitemap.xml
`);
console.log('✓ sitemap.xml, robots.txt  (domena: ' + DOMENA + ', wersja: ' + WERSJA + ')');
if (DOMENA.includes('[DOMENA]')) console.log('! Pamiętaj: wpisz domenę w public/assets/js/render.js (var DOMENA) i uruchom ponownie.');
