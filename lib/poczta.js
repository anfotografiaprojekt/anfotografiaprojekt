// Wysyłka wiadomości z formularza na stronie na adres ustawiony w panelu (Formularz kontaktowy).
// Panel niczego nie wysyła. Dalszą korespondencję prowadzi się już zwykłą pocztą — „Odpowiedz”
// trafia prosto do osoby, która wypełniła formularz (nagłówek Reply-To).
//
// Wysyłka przez SMTP skrzynki pocztowej — ustawia JEDNORAZOWO wykonawca strony w Cloudflare
// (projekt → Settings → Variables and Secrets): SMTP_HOST, SMTP_PORT (465 lub 587), SMTP_USER, SMTP_PASS (Secret).
//
// Adres odbiorcy (zmieniany w panelu) leży w KV pod kluczem „prywatne:email” — NIE jest częścią
// treści strony, więc nie trafia do kodu HTML ani do kopii zapasowych. Zapas: zmienna MAIL_DO.
import { connect } from 'cloudflare:sockets';
import { kv } from './serwer.js';

export const KLUCZ_ODBIORCY = 'prywatne:email';

export const escH = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function odbiorca(env) {
  let e = null; try { e = await kv(env).get(KLUCZ_ODBIORCY); } catch { }
  return (e || env.MAIL_DO || '').trim();
}
export function ustawieniaSmtp(env) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return { host: String(env.SMTP_HOST).trim(), port: +env.SMTP_PORT || 465, login: String(env.SMTP_USER).trim(), haslo: String(env.SMTP_PASS) };
}
export async function skonfigurowany(env) { return !!ustawieniaSmtp(env); }

/* ---------- klient SMTP ---------- */
const b64 = (s) => { const b = new TextEncoder().encode(s); let x = ''; for (let i = 0; i < b.length; i++) x += String.fromCharCode(b[i]); return btoa(x); };
const b64Linie = (s) => b64(s).replace(/.{1,76}/g, (m) => m + '\r\n');
const naglowek = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64(s) + '?=');
// nazwa nadawcy: ASCII ze znakami specjalnymi (np. „anfotografiaprojekt.pages.dev”) → w cudzysłowie
const nazwaNadawcy = (s) => (/^[\x20-\x7e]*$/.test(s) ? '"' + s.replace(/["\\]/g, '') + '"' : naglowek(s));
const czystyAdres = (a) => String(a || '').replace(/[\r\n<>"]/g, '').trim();

class Smtp {
  constructor(sock) { this.ustaw(sock); this.bufor = ''; }
  ustaw(sock) { this.sock = sock; this.w = sock.writable.getWriter(); this.r = sock.readable.getReader(); this.dek = new TextDecoder(); }
  async pisz(linia) { await this.w.write(new TextEncoder().encode(linia + '\r\n')); }
  async odpowiedz() {
    // odpowiedź może mieć wiele linii: „250-…” … „250 …”
    for (;;) {
      const m = this.bufor.match(/(?:^|\r\n)(\d{3}) [^\r\n]*\r\n/);
      if (m) {
        const koniec = m.index + m[0].length;
        const tekst = this.bufor.slice(0, koniec); this.bufor = this.bufor.slice(koniec);
        return { kod: +m[1], tekst: tekst.trim() };
      }
      const { value, done } = await this.r.read();
      if (done) throw new Error('Serwer poczty zamknął połączenie.');
      this.bufor += this.dek.decode(value, { stream: true });
    }
  }
  async polecenie(linia, oczekiwane, opis) {
    if (linia != null) await this.pisz(linia);
    const o = await this.odpowiedz();
    if (!oczekiwane.includes(o.kod)) { const e = new Error(opis + ' — serwer odpowiedział: ' + o.tekst.slice(0, 200)); e.kod = o.kod; e.etap = opis; throw e; }
    return o;
  }
  async zwolnij() { try { this.w.releaseLock(); this.r.releaseLock(); } catch { } }
}

/** Wysyła jedną wiadomość. cfg: { host, port, login, haslo }. Port 465 = SSL, 587 = STARTTLS. */
export async function smtpWyslij(cfg, { do: to, temat, html, tekst, odpowiedzDo, nadawcaNazwa }) {
  const lokalny = /^(127\.0\.0\.1|localhost)$/.test(cfg.host);       // tylko do testów lokalnych (bez TLS)
  const port = +cfg.port || 465;
  if (port === 25) throw Object.assign(new Error('Port 25 jest zablokowany w Cloudflare — użyj 465 (SSL) lub 587 (STARTTLS).'), { etap: 'połączenie' });
  const tryb = lokalny ? 'off' : port === 465 ? 'on' : 'starttls';
  const sock = connect({ hostname: cfg.host, port }, { secureTransport: tryb, allowHalfOpen: false });
  const s = new Smtp(sock);
  const ehlo = 'anfotografia.pages.dev';
  const czas = new Promise((_, nie) => setTimeout(() => nie(Object.assign(new Error('Serwer poczty nie odpowiada (przekroczony czas 20 s).'), { etap: 'połączenie' })), 20000));
  const praca = (async () => {
    await s.polecenie(null, [220], 'Połączenie z serwerem poczty');
    let e = await s.polecenie('EHLO ' + ehlo, [250], 'Powitanie (EHLO)');
    if (tryb === 'starttls') {
      await s.polecenie('STARTTLS', [220], 'Szyfrowanie (STARTTLS)');
      await s.zwolnij();
      s.ustaw(sock.startTls()); s.bufor = '';
      e = await s.polecenie('EHLO ' + ehlo, [250], 'Powitanie po szyfrowaniu');
    }
    if (/AUTH[ =][^\r\n]*PLAIN/i.test(e.tekst)) {
      await s.polecenie('AUTH PLAIN ' + b64('\u0000' + cfg.login + '\u0000' + cfg.haslo), [235], 'Logowanie do skrzynki');
    } else {
      await s.polecenie('AUTH LOGIN', [334], 'Logowanie do skrzynki');
      await s.polecenie(b64(cfg.login), [334], 'Logowanie do skrzynki');
      await s.polecenie(b64(cfg.haslo), [235], 'Logowanie do skrzynki');
    }
    const od = czystyAdres(cfg.login), dla = czystyAdres(to), rep = czystyAdres(odpowiedzDo);
    await s.polecenie('MAIL FROM:<' + od + '>', [250], 'Nadawca');
    await s.polecenie('RCPT TO:<' + dla + '>', [250, 251], 'Odbiorca');
    await s.polecenie('DATA', [354], 'Treść wiadomości');
    const granica = 'anf-' + crypto.randomUUID();
    const domena = od.split('@')[1] || 'localhost';
    const lit = [
      'From: ' + nazwaNadawcy(nadawcaNazwa || 'Formularz ze strony') + ' <' + od + '>',
      'To: <' + dla + '>',
      rep ? 'Reply-To: <' + rep + '>' : null,
      'Subject: ' + naglowek(temat),
      'Date: ' + new Date().toUTCString().replace('GMT', '+0000'),
      'Message-ID: <' + crypto.randomUUID() + '@' + domena + '>',
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="' + granica + '"',
      '',
      '--' + granica,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64Linie(tekst),
      '--' + granica,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64Linie(html),
      '--' + granica + '--',
    ].filter((x) => x !== null).join('\r\n');
    await s.pisz(lit + '\r\n.');            // base64 nigdy nie zaczyna linii od kropki
    await s.polecenie(null, [250], 'Wysłanie wiadomości');
    try { await s.pisz('QUIT'); } catch { }
  })();
  try { await Promise.race([praca, czas]); }
  finally { try { await sock.close(); } catch { } }
}

/** Zrozumiały komunikat dla panelu */
export function opisBledu(e) {
  const m = String((e && e.message) || e || ''), k = e && e.kod;
  if (k === 535 || k === 534 || /authentication|auth.*fail|username and password|invalid credentials/i.test(m))
    return 'Logowanie do skrzynki nie powiodło się — sprawdź adres i hasło. W Gmailu potrzebne jest „hasło do aplikacji” (nie zwykłe hasło), a w WP, o2, Onecie i Interii trzeba w ustawieniach poczty włączyć dostęp dla programów pocztowych (SMTP). (' + m.slice(0, 160) + ')';
  if (k === 550 || k === 553 || (e && e.etap === 'Odbiorca')) return 'Serwer poczty odrzucił adres odbiorcy. Sprawdź, czy jest poprawny. (' + m.slice(0, 160) + ')';
  if (/connect|network|refused|timed out|nie odpowiada|zamknął/i.test(m) || (e && e.etap && /Połączenie|połączenie/.test(e.etap)))
    return 'Nie udało się połączyć z serwerem poczty. Sprawdź adres serwera i port (465 = SSL, 587 = STARTTLS). (' + m.slice(0, 160) + ')';
  return m.slice(0, 300) || 'Nieznany błąd wysyłki.';
}

/** Wysyłka wiadomości z formularza (SMTP). Zwraca { ok, blad }. */
export async function wyslijMail(env, wiad) {
  const smtp = ustawieniaSmtp(env);
  if (!smtp) return { ok: false, blad: 'Wysyłka nie jest skonfigurowana (SMTP_HOST, SMTP_USER, SMTP_PASS w Cloudflare).' };
  const to = wiad.do || (await odbiorca(env));
  if (!to) return { ok: false, blad: 'Nie ustawiono adresu, na który mają przychodzić wiadomości.' };
  try {
    await smtpWyslij(smtp, { ...wiad, do: to });
    return { ok: true };
  } catch (e) { const b = opisBledu(e); console.error('Wysyłka:', b); return { ok: false, blad: b }; }
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
