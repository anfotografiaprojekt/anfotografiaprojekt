/**
 * Wspólny kod serwera (Cloudflare Pages Functions) — Anna Niedobitek Fotografia
 * Bezpieczeństwo: hasło jako hash PBKDF2-SHA256 z solą (100 000 iteracji — maksimum
 * obsługiwane przez Cloudflare Workers), sesja w ciasteczku HttpOnly + Secure +
 * SameSite=Strict podpisanym HMAC, limit nieudanych logowań, ochrona CSRF
 * (nagłówek X-CMS + sprawdzenie Origin).
 *
 * Zmienne środowiskowe (Cloudflare → Pages → Settings → Variables and Secrets):
 *   ADMIN_PASSWORD_HASH  – hash pierwszego hasła (narzedzia/hash-hasla.mjs)
 *   SESSION_SECRET       – długi losowy ciąg (ten sam skrypt go wygeneruje)
 *   INSTAGRAM_TOKEN      – (opcjonalnie) token Instagram API
 *   RESEND_API_KEY, MAIL_DO, MAIL_OD – (opcjonalnie) powiadomienia e-mail o wiadomościach
 * Powiązanie KV: TRESCI
 */

export const SESJA_SEK = 8 * 60 * 60;           // 8 godzin
export const ITERACJE = 100000;
const enc = new TextEncoder();

/* ---------- odpowiedzi ---------- */
export function json(dane, status = 200, naglowki = {}) {
  return new Response(JSON.stringify(dane), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...naglowki },
  });
}
export const blad = (tekst, status = 400, extra = {}) => json({ blad: tekst, ...extra }, status);

export function kv(env) {
  if (!env.TRESCI) throw new Error('Brak powiązania KV o nazwie TRESCI (Cloudflare → Pages → Settings → Bindings).');
  return env.TRESCI;
}

/* ---------- base64url ---------- */
export function b64u(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function zB64u(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4));
  const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
export const losowe = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));

function rowne(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

/* ---------- hasło: PBKDF2-SHA256 ---------- */
export async function hashHasla(haslo, solB64 = null, iteracje = ITERACJE) {
  const sol = solB64 ? zB64u(solB64) : crypto.getRandomValues(new Uint8Array(16));
  const klucz = await crypto.subtle.importKey('raw', enc.encode(haslo), 'PBKDF2', false, ['deriveBits']);
  const bity = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sol, iterations: iteracje }, klucz, 256);
  return `pbkdf2$${iteracje}$${b64u(sol)}$${b64u(bity)}`;
}
export async function sprawdzHaslo(haslo, zapisany) {
  if (!zapisany || typeof zapisany !== 'string') return false;
  const [alg, it, sol, hash] = zapisany.trim().split('$');
  if (alg !== 'pbkdf2' || !sol || !hash) return false;
  const nowy = await hashHasla(haslo, sol, Math.min(+it || ITERACJE, ITERACJE));
  return rowne(zB64u(nowy.split('$')[3]), zB64u(hash));
}
export async function aktualnyHash(env) {
  return (await kv(env).get('auth:haslo')) || env.ADMIN_PASSWORD_HASH || '';
}
async function wersjaAuth(env) { return +(await kv(env).get('auth:wersja')) || 0; }
export async function zwiekszWersjeAuth(env) { const v = (await wersjaAuth(env)) + 1; await kv(env).put('auth:wersja', String(v)); return v; }

/* ---------- sesje ---------- */
async function hmac(env, tekst) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('Ustaw zmienną SESSION_SECRET (min. 32 znaki).');
  const k = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(tekst)));
}
export function ciasteczka(request) {
  const out = {};
  (request.headers.get('Cookie') || '').split(/;\s*/).forEach((c) => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i)] = decodeURIComponent(c.slice(i + 1)); });
  return out;
}
export async function utworzSesje(env) {
  const token = losowe(32);
  await kv(env).put('sesja:' + token, JSON.stringify({ v: await wersjaAuth(env), od: Date.now() }), { expirationTtl: SESJA_SEK });
  const podpis = await hmac(env, token);
  return [
    `anf_sesja=${token}.${podpis}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESJA_SEK}`,
    `anf_zalogowany=1; Path=/; Secure; SameSite=Strict; Max-Age=${SESJA_SEK}`,
  ];
}
export const usunCiasteczka = [
  'anf_sesja=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  'anf_zalogowany=; Path=/; Secure; SameSite=Strict; Max-Age=0',
];
export async function sesja(request, env) {
  const c = ciasteczka(request).anf_sesja;
  if (!c || c.indexOf('.') < 0) return null;
  const [token, podpis] = c.split('.');
  let ok = false;
  try { ok = rowne(enc.encode(await hmac(env, token)), enc.encode(podpis)); } catch { return null; }
  if (!ok) return null;
  const d = await kv(env).get('sesja:' + token, 'json');
  if (!d || d.v !== (await wersjaAuth(env))) return null;
  return { token, ...d };
}

/* ---------- CSRF i dostęp ---------- */
export function zgodnyOrigin(request) {
  const o = request.headers.get('Origin');
  if (!o) return true; // część przeglądarek nie wysyła Origin dla tego samego źródła — chroni SameSite=Strict + nagłówek
  try { return new URL(o).host === new URL(request.url).host; } catch { return false; }
}
export function csrfOk(request) {
  return request.headers.get('X-CMS') === '1' && zgodnyOrigin(request);
}
/** Wymaga zalogowania; dla metod zmieniających dane — także ochrony CSRF. */
export async function wymagaj(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD' && !csrfOk(request)) return { odp: blad('Nieprawidłowe żądanie (CSRF).', 403) };
  let s;
  try { s = await sesja(request, env); } catch (e) { return { odp: blad(e.message, 503) }; }
  if (!s) return { odp: blad('Sesja wygasła — zaloguj się ponownie.', 401) };
  return { sesja: s };
}

/* ---------- limity (np. nieudane logowania) ---------- */
export const ip = (request) => request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0';
export async function limit(env, klucz, maks, oknoSek) {
  const k = 'rl:' + klucz, d = (await kv(env).get(k, 'json')) || { n: 0, od: Date.now() };
  return { przekroczony: d.n >= maks, pozostalo: Math.max(0, maks - d.n), minut: Math.ceil((d.od + oknoSek * 1000 - Date.now()) / 60000) || 1, d, k };
}
export async function zwieksz(env, l, oknoSek) {
  const d = { n: l.d.n + 1, od: l.d.n ? l.d.od : Date.now() };
  const ttl = Math.max(60, Math.ceil((d.od + oknoSek * 1000 - Date.now()) / 1000));
  await kv(env).put(l.k, JSON.stringify(d), { expirationTtl: ttl });
  return Math.max(0, l.pozostalo - 1);
}
export const wyzeruj = (env, l) => kv(env).delete(l.k);

/* ---------- treści strony i kopie ---------- */
export const KLUCZ_TRESCI = 'tresci';
export async function zapiszTresci(env, dane) {
  const K = kv(env), poprzednie = await K.get(KLUCZ_TRESCI);
  // Kopia zapasowa najwyżej co 10 minut — każdy zapis w KV liczy się do dziennego limitu
  // (plan darmowy Cloudflare: 1000 zapisów na dobę), a seria drobnych poprawek nie potrzebuje 10 kopii.
  const ostatnia = poprzednie ? ((await K.get('kopie:lista', 'json')) || [])[0] : null;
  if (poprzednie && !(ostatnia && Date.now() - Date.parse(ostatnia.czas) < 10 * 60 * 1000)) {
    const id = Date.now().toString(36) + '-' + losowe(4);
    await K.put('kopia:' + id, poprzednie);
    const lista = (await K.get('kopie:lista', 'json')) || [];
    lista.unshift({ id, czas: new Date().toISOString(), rozmiar: poprzednie.length });
    const nadmiar = lista.splice(10);
    await K.put('kopie:lista', JSON.stringify(lista));
    await Promise.all(nadmiar.map((x) => K.delete('kopia:' + x.id)));
  }
  const zapis = { dane, zapisano: new Date().toISOString() };
  await K.put(KLUCZ_TRESCI, JSON.stringify(zapis));
  return zapis;
}
export function poprawneDane(d) {
  return d && typeof d === 'object' && !Array.isArray(d) && d._app === 'anf-cms' && d.sekcje && d.start && d.kontakt;
}

/* Błąd zapisu w KV → zrozumiały komunikat (najczęściej wyczerpany dzienny limit planu darmowego) */
export function bladKV(e) {
  const m = String((e && e.message) || e || '');
  if (/limit|exceed|quota|429/i.test(m)) return blad('Cloudflare odrzucił zapis: wyczerpano dzienny limit zapisów w bazie KV (plan darmowy: 1000 zapisów na dobę). Limit odnawia się o północy czasu UTC (w Polsce o 1:00 zimą, o 2:00 latem) — wtedy kliknij „Spróbuj ponownie”. Stały, wysoki limit daje plan Workers Paid (ok. 5 USD/mies.).', 503, { limit: true });
  return blad('Nie udało się zapisać na serwerze (' + m.slice(0, 160) + '). Spróbuj ponownie za chwilę.', 503);
}
