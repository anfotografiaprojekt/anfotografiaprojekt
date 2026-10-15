"""Generuje zdjęcia zastępcze (WebP), favicony i obraz OG.

Zdjęcia zastępcze to neutralne, ciepłe tła z opisem [ZDJĘCIE: ...].
Przed publikacją podmień je na prawdziwe zdjęcia klientki — zachowaj
nazwy plików i proporcje (albo zmień width/height w panelu/HTML).

Uruchomienie:  python3 narzedzia/generuj-grafiki-zastepcze.py
"""
import io, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
IMG = os.path.join(ROOT, 'assets', 'img')
ICO = os.path.join(ROOT, 'assets', 'icons')
os.makedirs(IMG, exist_ok=True); os.makedirs(ICO, exist_ok=True)

def font(path_woff2, size):
    try:
        from fontTools.ttLib import TTFont
        ttf = path_woff2.replace('.woff2', '.ttf')
        if not os.path.exists(ttf):
            f = TTFont(path_woff2); f.flavor = None; f.save(ttf)
        return ImageFont.truetype(ttf, size)
    except Exception:
        return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', size)

FONTS = os.path.join(ROOT, 'assets', 'fonts')
TMP = os.environ.get('TMPFONT', '/tmp')
class Mixed:
    """Krój Cormorant jest podzielony na pliki latin / latin-ext — rysujemy znak po znaku."""
    def __init__(self, size, italic):
        import shutil
        from fontTools.ttLib import TTFont
        self.parts = []
        for sub in ('latin', 'latin-ext'):
            src = os.path.join(FONTS, 'cormorant-garamond-%s-wght-%s.woff2' % (sub, 'italic' if italic else 'normal'))
            dst = os.path.join(TMP, os.path.basename(src)); shutil.copy(src, dst)
            pf = font(dst, size)
            cmap = set(TTFont(dst.replace('.woff2', '.ttf')).getBestCmap().keys())
            self.parts.append((pf, cmap))
    def pick(self, ch):
        for pf, cmap in self.parts:
            if ord(ch) in cmap: return pf
        return self.parts[0][0]
    def length(self, d, txt):
        return sum(d.textlength(c, font=self.pick(c)) for c in txt)
    def draw(self, d, xy, txt, fill):
        x, y = xy
        for c in txt:
            f = self.pick(c); d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f)
def serif(size, italic=False):
    return Mixed(size, italic)
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

# Paleta marki
TONES = [
    ((214, 196, 178), (150, 118, 98)),
    ((226, 212, 196), (168, 140, 118)),
    ((198, 186, 170), (122, 104, 90)),
    ((232, 220, 205), (184, 150, 124)),
    ((205, 190, 168), (140, 112, 88)),
    ((219, 205, 193), (132, 120, 108)),
]

def placeholder(name, w, h, label, tone=0, sizes=None):
    a, b = TONES[tone % len(TONES)]
    img = Image.new('RGB', (w, h), a)
    d = ImageDraw.Draw(img)
    rnd = random.Random(name)
    # miękki gradient diagonalny + "bokeh" — sugeruje fotografię, nie udaje jej
    for y in range(h):
        t = y / h
        c = tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c)
    over = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(over)
    for _ in range(14):
        r = rnd.randint(int(min(w, h) * .05), int(min(w, h) * .28))
        x, y = rnd.randint(0, w), rnd.randint(0, h)
        od.ellipse([x - r, y - r, x + r, y + r], fill=(255, 248, 238, rnd.randint(18, 46)))
    over = over.filter(ImageFilter.GaussianBlur(min(w, h) * .03))
    img = Image.alpha_composite(img.convert('RGBA'), over).convert('RGB')
    d = ImageDraw.Draw(img)
    # opis
    fs = max(14, int(min(w, h) * .022))
    f = ImageFont.truetype(SANS, fs)
    text = '[ZDJĘCIE: %s]' % label
    lines, line = [], ''
    for word in text.split():
        test = (line + ' ' + word).strip()
        if d.textlength(test, font=f) > w * .72 and line:
            lines.append(line); line = word
        else:
            line = test
    lines.append(line)
    lh = fs * 1.45
    y0 = h * .9 - lh * len(lines)  # opis przy dolnej krawędzi — nie zasłania tekstów sekcji
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=f)
        d.text(((w - tw) / 2 + 1, y0 + i * lh + 1), ln, font=f, fill=(60, 48, 40)); d.text(((w - tw) / 2, y0 + i * lh), ln, font=f, fill=(255, 252, 247))
    out = os.path.join(IMG, name + '.webp')
    img.save(out, 'WEBP', quality=72, method=6)
    for s in (sizes or []):
        sm = img.resize((s, int(h * s / w)), Image.LANCZOS)
        sm.save(os.path.join(IMG, '%s-%d.webp' % (name, s)), 'WEBP', quality=70, method=6)
    print('ok', out)

P = [
    ('fotograf-zgorzelec-sesja-plenerowa', 2400, 1600, 'pierwszy ekran — najmocniejsze zdjęcie portfolio, np. para lub rodzina w plenerze, naturalne światło', 0, [800, 1200, 1600]),
    ('anna-niedobitek-fotograf-portret', 1200, 1500, 'portret Anny Niedobitek z aparatem', 1, [600]),
    ('o-mnie-praca-w-plenerze', 2000, 1333, 'Anna podczas sesji w plenerze — zdjęcie zza kulis (tło sekcji O mnie)', 2, [800, 1200]),
    ('historia-poczatki-pasja-od-dziecka', 2000, 1333, 'pierwszy aparat lub zdjęcie z dzieciństwa — początek pasji', 3, [800, 1200]),
    ('historia-2021-wlasna-dzialalnosc', 2000, 1333, 'jedna z pierwszych realizacji z 2021 roku', 4, [800, 1200]),
    ('historia-dzis-dolny-slask', 2000, 1333, 'reportaż lub sesja na Dolnym Śląsku — dzisiejsza praca', 5, [800, 1200]),
    ('aktualnosci-tlo', 2000, 1333, 'tło sekcji Aktualności — spokojny kadr, np. detal, kwiaty, światło', 1, [800, 1200]),
    ('aktualnosc-nowa-strona', 1200, 800, 'zdjęcie do wpisu o nowej stronie', 0, [600]),
    ('kto-fotografuje-tlo', 2000, 1333, 'tło sekcji Kto fotografuje — aparat, obiektyw lub praca przy reportażu', 2, [800, 1200]),
    ('drugi-fotograf-reportaz-slubny', 1200, 1500, 'drugi fotograf przy reportażu ślubnym — portret', 3, [600]),
    ('reportaz-slubny-dolny-slask', 1800, 1200, 'reportaż ślubny — emocje pary młodej', 0, [800, 1200]),
    ('sesja-rodzinna-zgorzelec', 1800, 1200, 'sesja rodzinna w plenerze', 1, [800, 1200]),
    ('sesja-ciazowa-zgorzelec', 1800, 1200, 'sesja ciążowa — subtelny portret', 2, [800, 1200]),
    ('sesja-noworodkowa-detale', 1800, 1200, 'sesja noworodkowa — detale: dłonie, stópki (bez twarzy, jeśli brak zgody rodziców)', 3, [800, 1200]),
    ('sesja-narzeczenska-para', 1800, 1200, 'sesja pary w plenerze', 4, [800, 1200]),
    ('sesja-kobieca-naturalny-portret', 1800, 1200, 'sesja kobieca — naturalny portret', 5, [800, 1200]),
    ('sesja-wizerunkowa-przedsiebiorca', 1800, 1200, 'sesja wizerunkowa lokalnego przedsiębiorcy', 0, [800, 1200]),
    ('reportaz-uroczystosc-rodzinna', 1800, 1200, 'reportaż z uroczystości rodzinnej (chrzest, komunia, jubileusz)', 1, [800, 1200]),
    ('instagram-tlo', 2000, 1333, 'tło sekcji Instagram — jasny, spokojny kadr', 4, [800, 1200]),
    ('kontakt-fotograf-dolny-slask', 2000, 1333, 'tło sekcji Kontakt — krajobraz Dolnego Śląska lub sesja o zachodzie słońca', 5, [800, 1200]),
]
for args in P:
    placeholder(*args)

# ---------- OG image 1200x630 (typograficzny, gotowy do użycia) ----------
og = Image.new('RGB', (1200, 630), (250, 247, 242))
d = ImageDraw.Draw(og)
d.rectangle([40, 40, 1160, 590], outline=(184, 138, 110), width=2)
f1 = serif(92); f2 = serif(46, italic=True); f3 = ImageFont.truetype(SANS, 24)
def center(txt, y, f, fill):
    if isinstance(f, Mixed):
        tw = f.length(d, txt); f.draw(d, ((1200 - tw) / 2, y), txt, fill)
    else:
        tw = d.textlength(txt, font=f); d.text(((1200 - tw) / 2, y), txt, font=f, fill=fill)
center('Anna Niedobitek', 170, f1, (43, 38, 34))
center('Fotografia', 275, f2, (122, 82, 64))
d.line([(560, 365), (640, 365)], fill=(184, 138, 110), width=2)
center('Z miłości do pięknych kadrów', 395, f2, (94, 84, 76))
center('ZGORZELEC · DOLNY ŚLĄSK', 500, f3, (122, 82, 64))
og.save(os.path.join(IMG, 'og-image.jpg'), 'JPEG', quality=86, optimize=True)

# ---------- Favicony ----------
def mono(size):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    dd = ImageDraw.Draw(im)
    dd.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * .22), fill=(122, 82, 64))
    f = serif(int(size * .58), italic=True).parts[0][0]
    t = 'AN'
    bb = dd.textbbox((0, 0), t, font=f)
    dd.text(((size - (bb[2] - bb[0])) / 2 - bb[0], (size - (bb[3] - bb[1])) / 2 - bb[1]), t, font=f, fill=(250, 247, 242))
    return im
mono(32).save(os.path.join(ICO, 'favicon-32.png'))
a = Image.new('RGB', (180, 180), (122, 82, 64)); a.paste(mono(180), (0, 0), mono(180)); a.save(os.path.join(ICO, 'apple-touch-icon.png'))
mono(192).save(os.path.join(ICO, 'icon-192.png'))
mono(512).save(os.path.join(ICO, 'icon-512.png'))
# maskable: tło pełne, znak w bezpiecznej strefie
m = Image.new('RGB', (512, 512), (122, 82, 64)); m.paste(mono(360).convert('RGB'), (76, 76)); m.save(os.path.join(ICO, 'icon-maskable-512.png'))
print('gotowe')
