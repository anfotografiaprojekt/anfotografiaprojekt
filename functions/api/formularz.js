// Panel → Kontakt i dane → „Formularz kontaktowy” (wymaga zalogowania; zapis z ochroną CSRF)
// Jedyna rzecz, którą panel tu zmienia: adres e-mail, na który przychodzą wiadomości z formularza na stronie.
// GET  /api/formularz          — zapisany adres + czy wysyłka jest włączona po stronie serwera
// POST /api/formularz {email}  — nowy adres (sprawdzany tak samo jak e-mail w formularzu)
// Panel NIE wysyła żadnych e-maili — wysyła je wyłącznie formularz na stronie (functions/api/kontakt.js).
import '../../public/assets/js/dane.js';
import '../../public/assets/js/render.js';
import { json, blad, kv, wymagaj, bladKV } from '../../lib/serwer.js';
import { KLUCZ_ODBIORCY, odbiorca, skonfigurowany } from '../../lib/poczta.js';

export async function onRequestGet({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  return json({ email: await odbiorca(env), serwer: await skonfigurowany(env) }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost({ request, env }) {
  const w = await wymagaj(request, env); if (w.odp) return w.odp;
  let b = {}; try { b = await request.json(); } catch { return blad('Nieprawidłowe dane.'); }
  const e = String(b.email || '').trim();
  const msg = globalThis.ANF.form.emailBlad(e);
  if (!e || msg) return blad(msg || 'Proszę wpisać adres e-mail.');
  try { await kv(env).put(KLUCZ_ODBIORCY, e); } catch (er) { return bladKV(er); }
  return json({ ok: true, email: e });
}
