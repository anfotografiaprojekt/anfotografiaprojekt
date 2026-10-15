#!/usr/bin/env node
/**
 * Generuje hash pierwszego hasła do panelu (PBKDF2-SHA256, sól, 100 000 iteracji)
 * oraz losowy SESSION_SECRET. Hasło nie jest nigdzie zapisywane.
 *
 *   node narzedzia/hash-hasla.mjs
 *   (albo: node narzedzia/hash-hasla.mjs "MojeHaslo123!" — niezalecane, hasło zostaje w historii terminala)
 *
 * Wynik wklej w Cloudflare → Workers & Pages → (projekt) → Settings → Variables and Secrets
 * jako sekrety (typ „Secret”): ADMIN_PASSWORD_HASH i SESSION_SECRET.
 */
import { webcrypto as crypto } from 'node:crypto';
import readline from 'node:readline';

const b64u = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hash(haslo) {
  const sol = crypto.getRandomValues(new Uint8Array(16));
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(haslo), 'PBKDF2', false, ['deriveBits']);
  const bity = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sol, iterations: 100000 }, k, 256);
  return `pbkdf2$100000$${b64u(sol)}$${b64u(bity)}`;
}

function pytaj(pytanie) {
  return new Promise((ok) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = function (s) { if (s.includes(pytanie)) rl.output.write(s); else rl.output.write('*'); };
    rl.question(pytanie, (o) => { rl.close(); process.stdout.write('\n'); ok(o); });
  });
}

let haslo = process.argv[2];
if (!haslo) {
  haslo = await pytaj('Nowe hasło do panelu (min. 10 znaków): ');
  const p = await pytaj('Powtórz hasło: ');
  if (p !== haslo) { console.error('✗ Hasła się różnią.'); process.exit(1); }
}
if (!haslo || haslo.length < 10) { console.error('✗ Hasło musi mieć co najmniej 10 znaków.'); process.exit(1); }

console.log('\nADMIN_PASSWORD_HASH=' + await hash(haslo));
console.log('SESSION_SECRET=' + b64u(crypto.getRandomValues(new Uint8Array(48))));
console.log('\nWklej obie wartości w Cloudflare jako sekrety (Settings → Variables and Secrets → Add → typ Secret).');
