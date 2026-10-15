// Wysyłka e-maili przez Resend (https://resend.com) — zwykłe wywołanie HTTPS, działa w Cloudflare Pages Functions.
// Konfiguracja (Cloudflare → projekt → Settings → Variables and Secrets):
//   RESEND_API_KEY  — klucz API z panelu Resend (typ: Secret)                     [wymagane]
//   MAIL_OD         — nadawca, np. "Formularz <formularz@twojadomena.pl>"          [opcjonalne]
//                     bez własnej domeny: domyślnie onboarding@resend.dev — wtedy Resend
//                     dostarcza pocztę TYLKO na adres, na który założono konto Resend.
//   MAIL_DO         — adres odbiorcy (zapasowy; zwykle ustawia się go w panelu)   [opcjonalne]
// Adres odbiorcy z panelu leży w KV pod kluczem „prywatne:email” — NIE jest częścią treści
// strony (tresci), więc nigdy nie trafia do kodu HTML ani do kopii zapasowych treści.
import { kv } from './serwer.js';

export const KLUCZ_ODBIORCY = 'prywatne:email';
export const NADAWCA_DOMYSLNY = 'Strona — formularz <onboarding@resend.dev>';

export async function odbiorca(env) {
  let e = null; try { e = await kv(env).get(KLUCZ_ODBIORCY); } catch { }
  return (e || env.MAIL_DO || '').trim();
}
export const skonfigurowany = (env) => !!env.RESEND_API_KEY;

export const escH = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Wysyła e-mail. Zwraca { ok, status, blad }. */
export async function wyslijMail(env, { do: to, temat, html, tekst, odpowiedzDo }) {
  if (!env.RESEND_API_KEY) return { ok: false, status: 0, blad: 'Brak klucza RESEND_API_KEY w ustawieniach Cloudflare.' };
  if (!to) return { ok: false, status: 0, blad: 'Nie ustawiono adresu, na który mają przychodzić wiadomości.' };
  let r;
  try {
    r = await fetch(env.RESEND_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_OD || NADAWCA_DOMYSLNY, to: [to], subject: temat, html, text: tekst, reply_to: odpowiedzDo || undefined }),
    });
  } catch (e) { return { ok: false, status: 0, blad: 'Brak połączenia z usługą pocztową (' + e.message + ').' }; }
  if (r.ok) return { ok: true, status: r.status };
  let j = {}; try { j = await r.json(); } catch { }
  const opis = j.message || j.error || ('HTTP ' + r.status);
  console.error('Resend:', r.status, opis);
  return { ok: false, status: r.status, blad: opis };
}

/** Czytelny e-mail z wiadomością z formularza (HTML + wersja tekstowa). */
export function mailZFormularza({ pola, host, czas }) {
  const kiedy = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'long', timeStyle: 'short' }).format(czas);
  const wiersz = (x) => {
    let w = escH(x.wartosc).replace(/\n/g, '<br>');
    if (x.typ === 'email') w = '<a href="mailto:' + escH(x.wartosc) + '" style="color:#7A5240">' + w + '</a>';
    if (x.typ === 'telefon') w = '<a href="tel:' + escH(x.wartosc.replace(/\s/g, '')) + '" style="color:#7A5240">' + w + '</a>';
    return '<tr><td style="padding:10px 14px;border-bottom:1px solid #EFE7DE;color:#5E544C;font-size:13px;width:34%;vertical-align:top">' + escH(x.etykieta) +
      '</td><td style="padding:10px 14px;border-bottom:1px solid #EFE7DE;color:#2B2622;font-size:15px;line-height:1.5">' + w + '</td></tr>';
  };
  const html = '<!doctype html><html lang="pl"><body style="margin:0;background:#F5EFE8;font-family:Segoe UI,Arial,sans-serif">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;padding:24px 10px"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;overflow:hidden">' +
    '<tr><td style="background:#2B2622;color:#FAF7F2;padding:20px 24px;font-size:18px">Nowa wiadomość ze strony<div style="font-size:13px;color:#CBBFB3;margin-top:4px">' + escH(kiedy) + ' · ' + escH(host) + '</div></td></tr>' +
    '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + pola.map(wiersz).join('') + '</table></td></tr>' +
    '<tr><td style="padding:16px 24px;color:#5E544C;font-size:13px;line-height:1.5">Aby odpowiedzieć, wystarczy kliknąć „Odpowiedz” — odpowiedź trafi na adres podany w formularzu.</td></tr>' +
    '</table></td></tr></table></body></html>';
  const tekst = 'Nowa wiadomość ze strony ' + host + ' (' + kiedy + ')\n\n' + pola.map((x) => x.etykieta + ':\n' + x.wartosc).join('\n\n') +
    '\n\n— Aby odpowiedzieć, kliknij „Odpowiedz”.';
  return { html, tekst };
}
