#!/usr/bin/env python3
"""1億2千万分の1 — 生きた人生の記録を保存し、共有ページ（/l/<id>）とOGカード画像（/og/<id>.png）を返す小さなサーバー。
   nginx から 127.0.0.1:8095 へ /api/ /l/ /og/ を転送する。依存：Python 標準ライブラリ + Pillow。
"""
import json, os, re, secrets, sqlite3, time, html, io, threading, base64
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont

H = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(H, 'lives.db')
CACHE = os.path.join(H, 'ogcache')
FONT_SANS = os.path.join(H, 'fonts', 'NotoSansJP.ttf')
FONT_SERIF = os.path.join(H, 'fonts', 'ShipporiMincho-ExtraBold.ttf')
SITE = 'https://1injp.satoru.net'
OGV = '2'  # OG画像の見た目を変えたら上げる（キャッシュバスター）
PORT = int(os.environ.get('PORT', '8095'))
os.makedirs(CACHE, exist_ok=True)
lock = threading.Lock()


PHOTOS = os.path.join(H, 'photos')
os.makedirs(PHOTOS, exist_ok=True)


def db():
    c = sqlite3.connect(DB)
    c.execute('CREATE TABLE IF NOT EXISTS lives (id TEXT PRIMARY KEY, created INTEGER, ip TEXT, data TEXT)')
    if 'meta' not in [r[1] for r in c.execute('PRAGMA table_info(lives)')]:
        c.execute('ALTER TABLE lives ADD COLUMN meta TEXT')
    return c


with db() as c:
    pass

RATE = {}  # ip -> [時刻]


def esc(s):
    return html.escape(str(s if s is not None else ''), quote=True)


def clip(v, n):
    return str(v if v is not None else '')[:n]


COLOR = re.compile(r'^#[0-9a-fA-F]{3,8}$')


def clean(d):
    """受け取った記録を、決まった形と長さに整える（それ以外は捨てる）"""
    if not isinstance(d, dict):
        raise ValueError('bad')
    o = {}
    for k, n in [('sei', 12), ('mei', 12), ('seiY', 24), ('meiY', 24), ('pref', 8), ('city', 16), ('cause', 40), ('edu', 40), ('job', 40), ('epitaph', 200), ('lastWords', 100), ('classLabel', 30), ('summary', 1200), ('gift', 200)]:
        o[k] = clip(d.get(k), n)
    o['sex'] = 'F' if d.get('sex') == 'F' else 'M'
    for k in ['bornY', 'bornM', 'bornD', 'deathYear', 'deathAge', 'kids', 'grand']:
        try:
            o[k] = int(d.get(k) or 0)
        except Exception:
            o[k] = 0
    o['lines'] = [clip(x, 120) for x in (d.get('lines') or [])[:8]]
    o['stats'] = [[clip(a, 30), clip(b, 60)] for a, b in (d.get('stats') or [])[:24] if isinstance(a, str)]
    o['notes'] = [[int(a or 0), clip(t, 120)] for a, t in (d.get('notes') or [])[:20]]
    o['stars'] = [[int(a or 0), clip(t, 200)] for a, t in (d.get('stars') or [])[:40]]
    o['log'] = [[int(a or 0), clip(t, 240), clip(tone, 10), clip(c, 10)] for a, t, tone, c in (d.get('log') or [])[:2500]]
    sp = []
    for g in (d.get('sprites') or [])[:3]:
        rows = [[(x if isinstance(x, str) and COLOR.match(x) else '') for x in (r or [])[:24]] for r in (g.get('rows') or [])[:40]]
        sp.append({'age': int(g.get('age') or 0), 'rows': rows})
    o['sprites'] = sp
    rk = d.get('rank') if isinstance(d.get('rank'), dict) else {}
    o['rank'] = {k: num(rk.get(k), lo, hi) for k, lo, hi in RANK_FIELDS}
    o['lived'] = [clip(x, 8) for x in (d.get('lived') or [])[:47] if isinstance(x, str)]
    ll = d.get('birthLL')
    try:
        lat, lng = float(ll[0]), float(ll[1])
        o['birthLL'] = [round(lat, 4), round(lng, 4)] if 20 <= lat <= 46 and 122 <= lng <= 154 else None
    except Exception:
        o['birthLL'] = None
    ph = []
    for x in (d.get('photos') or [])[:20]:
        if not isinstance(x, dict):
            continue
        m = re.match(r'^data:image/png;base64,([A-Za-z0-9+/=]+)$', str(x.get('img') or ''))
        if not m or len(m.group(1)) > 60000:
            continue
        try:
            raw = base64.b64decode(m.group(1))
        except Exception:
            continue
        if raw[:8] != b'\x89PNG\r\n\x1a\n':
            continue
        ph.append({'age': num(x.get('age'), 0, 130), 't': clip(x.get('t'), 240), 'label': clip(x.get('label'), 40), 'raw': raw})
    o['photos'] = ph
    return o


RANK_FIELDS = [('income', 0, 100000), ('assets', -100000, 1000000), ('final', -100000, 1000000), ('prefs', 0, 47), ('jobs', 0, 60), ('marriages', 0, 10), ('divorces', 0, 10), ('hobbies', 0, 60), ('happy', 0, 100), ('stars', 0, 999), ('friends', 0, 1000), ('debt', 0, 1000000), ('arrests', 0, 50), ('sns', 0, 2_000_000_000)]


def num(v, lo, hi):
    try:
        return max(lo, min(hi, int(round(float(v)))))
    except Exception:
        return 0


def meta_of(d):
    """ランキング用の要約（大きな記録本体を読まずに並べられるように別に持つ）"""
    r = dict(d.get('rank') or {})
    r['remarry'] = max(0, r.get('marriages', 0) - 1)
    if not r.get('arrests'):
        r['arrests'] = sum(1 for e in d['log'] if '逮捕' in e[1] or '検挙' in e[1])
    r.update(age=d['deathAge'], kids=d['kids'], grand=d['grand'], clan=d['kids'] + d['grand'],
             trials=sum(1 for e in d['log'] if e[2] in ('bad', 'grave')),
             sei=d['sei'], mei=d['mei'], sex=d['sex'], pref=d['pref'], city=d['city'], bornY=d['bornY'], cause=d['cause'],
             sprite=d['sprites'][-1] if d.get('sprites') else None)
    return r


def get(id_):
    with db() as c:
        r = c.execute('SELECT data, created FROM lives WHERE id=?', (id_,)).fetchone()
    if not r:
        return None
    d = json.loads(r[0])
    d['_created'] = r[1]
    return d


def headline(d):
    return f"{d['bornY']}年、{d['pref']}{d['city']}に生まれ、{d['deathAge']}歳で亡くなりました（{d['cause']}）"


def sprite_svg(g, px=6):
    rows = g['rows']
    if not rows:
        return ''
    w = max(len(r) for r in rows)
    out = [f'<svg viewBox="0 0 {w} {len(rows)}" width="{w * px}" height="{len(rows) * px}" shape-rendering="crispEdges" aria-hidden="true">']
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c:
                out.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{esc(c)}"/>')
    out.append('</svg>')
    return ''.join(out)


TONE = {'good': '#3f7d4e', 'bad': '#b5651d', 'grave': '#4a4a4a', 'death': '#4a4a4a'}


def page(d, id_):
    name = f"{d['sei']} {d['mei']}"
    title = f"{name}の人生 — 1億2千万分の1"
    desc = headline(d) + '。' + ' '.join(d['lines'][1:4])
    url = f'{SITE}/l/{id_}'
    img = f'{SITE}/og/{id_}.png?v={OGV}-{d.get("_created", 0)}'
    sx = '男' if d['sex'] == 'M' else '女'
    sprites = ''.join(f'<figure>{sprite_svg(g)}<figcaption>{g["age"]}歳</figcaption></figure>' for g in d['sprites'])
    stats = ''.join(f'<div><small>{esc(a)}</small><b>{esc(b)}</b></div>' for a, b in d['stats'])
    # 年ごとにまとめた人生の記録
    years, cur = [], None
    for a, t, tone, c in d['log']:
        if c in ('chapter',):
            years.append(('chapter', t))
            continue
        if cur is None or cur[0] != a:
            cur = (a, [])
            years.append(('year', cur))
        cur[1].append((t, tone, c))
    photos = d.get('photos') or []
    ph_at = {}
    for i, x in enumerate(photos):
        ph_at.setdefault((x['age'], x['t']), i)

    def li(t, tone, c, a):
        i = ph_at.get((a, t))
        img = f'<a class="ph" href="/ph/{id_}-{i}.png" target="_blank"><img src="/ph/{id_}-{i}.png" width="180" height="76" alt="" loading="lazy"></a>' if i is not None else ''
        return f'<li class="{esc(tone)} {esc(c)}{" hasph" if img else ""}">{img}{esc(t)}</li>'
    # 新しい年から並べ、最初は5年分だけ。残りは「もっと見る」で開く
    secs = [v for kind, v in years if kind == 'year'][::-1]
    log_html = []
    for n, (a, items) in enumerate(secs):
        log_html.append(f'<section class="yr{" more" if n >= 5 else ""}"><h4>{d["bornY"] + a}年・{a}歳</h4><ul>' + ''.join(li(t, tone, c, a) for t, tone, c in reversed(items)) + '</ul></section>')
    if len(secs) > 5:
        log_html.append(f'<p class="morebox"><button type="button" id="logMore" onclick="var h=document.querySelectorAll(\'.yr.more\');for(var i=0;i<h.length&&i<10;i++)h[i].classList.remove(\'more\');var r=document.querySelectorAll(\'.yr.more\').length;if(!r)this.parentNode.remove();else this.textContent=\'もっと見る（残り\'+r+\'年分）\'">もっと見る（残り{len(secs) - 5}年分）</button> <button type="button" onclick="document.querySelectorAll(\'.yr.more\').forEach(function(e){{e.classList.remove(\'more\')}});this.parentNode.remove()">すべて表示</button></p>')
    stars = ''.join(f'<p><span class="muted">{a}歳</span>　{esc(t)}</p>' for a, t in d['stars'])
    notes = ''.join(f'<p><span class="muted">{a}歳</span>　「{esc(t)}」</p>' for a, t in d['notes'])
    album = ''.join(f'<figure{" class=\"more\"" if i >= 6 else ""}><a href="/ph/{id_}-{i}.png" target="_blank"><img src="/ph/{id_}-{i}.png" width="180" height="76" alt="{esc(x["label"] or x["t"])}" loading="lazy"></a><figcaption><b>{x["age"]}歳</b> {esc(x["t"])}</figcaption></figure>' for i, x in enumerate(photos))
    mp = ''
    ll = d.get('birthLL')
    if ll:
        lat, lng = ll
        bbox = f'{lng - 0.22:.4f},{lat - 0.13:.4f},{lng + 0.22:.4f},{lat + 0.13:.4f}'
        mp = (f'<h2>生まれた場所</h2><div class="osm"><iframe title="{esc(d["pref"])}{esc(d["city"])}の地図" loading="lazy" '
              f'src="https://www.openstreetmap.org/export/embed.html?bbox={bbox}&amp;layer=mapnik&amp;marker={lat},{lng}"></iframe></div>'
              f'<p class="small muted">{esc(d["pref"])}{esc(d["city"])}（市区町村の代表地点）　<a href="https://www.openstreetmap.org/?mlat={lat}&amp;mlon={lng}#map=12/{lat}/{lng}" target="_blank" rel="noopener">大きな地図で見る</a>　地図 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors</p>')
    lived = d.get('lived') or []
    if len(lived) > 1:
        mp += '<p class="lived"><span class="muted small">住んだ都道府県</span> ' + ' → '.join(f'<span>{esc(x)}</span>' for x in lived) + '</p>'
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="1億2千万分の1">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(desc)}"><meta name="twitter:image" content="{img}">
<link rel="canonical" href="{url}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Shippori+Mincho:wght@500;700;800&display=swap" rel="stylesheet">
<style>
:root{{--bg:#f6f2ea;--paper:#fffdf8;--ink:#1f1b16;--muted:#6d655a;--line:#e2dacb;--accent:#c0392b;--indigo:#2c4a7a;--tile:#e9e1d2}}
@media (prefers-color-scheme: dark){{:root{{--bg:#16130f;--paper:#1f1b16;--ink:#efe8dc;--muted:#a59b8c;--line:#3a332b;--tile:#2a251f}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans JP',sans-serif;line-height:1.7}}
a{{color:var(--accent)}}.wrap{{max-width:760px;margin:0 auto;padding:24px 16px 60px}}
.top{{display:flex;justify-content:space-between;align-items:center;font-family:'Shippori Mincho',serif;font-weight:800}}
.top a{{color:var(--ink);text-decoration:none}}.top a.cta{{color:#fff}}.eyebrow{{color:var(--accent);font-weight:700;font-size:13px;letter-spacing:.08em;margin:28px 0 4px}}
h1{{font-family:'Shippori Mincho',serif;font-size:40px;margin:0;line-height:1.3}}h1 rt{{font-size:12px;font-family:'Noto Sans JP';color:var(--muted);font-weight:400}}
.sx{{display:inline-block;font-size:14px;color:#fff;background:var(--indigo);border-radius:4px;padding:0 6px;vertical-align:middle;margin-left:8px;font-family:'Noto Sans JP'}}.sx.F{{background:#c0566e}}
.muted{{color:var(--muted)}}.epitaph{{font-family:'Shippori Mincho',serif;font-size:18px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 18px}}
.sprites{{display:flex;gap:18px;align-items:flex-end;margin:18px 0}}.sprites figure{{margin:0;text-align:center;font-size:12px;color:var(--muted)}}
.stats{{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}}.stats div{{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:10px 12px}}
.stats small{{display:block;color:var(--muted);font-size:12px}}.stats b{{font-size:16px}}
h2{{font-family:'Shippori Mincho',serif;margin:32px 0 10px;font-size:22px}}
.yr h4{{margin:16px 0 4px;font-size:13px;color:var(--muted)}}.yr ul{{margin:0;padding-left:18px}}.yr li{{margin:2px 0}}
.yr.more{{display:none}}.album figure.more{{display:none}}.morebox{{text-align:center;margin:18px 0}}.morebox button{{font:inherit;font-size:14px;border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;padding:8px 18px;cursor:pointer;margin:0 4px}}.morebox button:hover{{border-color:var(--accent);color:var(--accent)}}.yr li.good{{color:#3f7d4e}}.yr li.bad{{color:#b5651d}}.yr li.grave,.yr li.death{{font-weight:700}}
.chap{{font-family:'Shippori Mincho',serif;border-top:1px solid var(--line);padding-top:12px;margin-top:22px}}
.cta{{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;border-radius:999px;padding:12px 26px;font-weight:700;margin:22px 0}}
footer{{color:var(--muted);font-size:12px;margin-top:40px}}.small{{font-size:12px}}
.osm{{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--tile)}}.osm iframe{{display:block;width:100%;height:300px;border:0}}
.lived span{{display:inline-block;background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:0 10px;font-size:13px}}
.album{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}}@media (max-width:560px){{.album{{grid-template-columns:repeat(3,1fr)}}}}.album figure{{margin:0;background:var(--paper);border:1px solid var(--line);border-radius:10px;overflow:hidden}}
.album img,.yr li img{{display:block;width:100%;height:auto;image-rendering:pixelated;aspect-ratio:180/76}}.album figcaption{{padding:4px 6px 0;margin-bottom:5px;font-size:11px;line-height:1.4;height:calc(2.8em + 4px);overflow:hidden;box-sizing:border-box}}
.yr li.hasph{{list-style:none;margin:8px 0 8px -18px;display:flex;gap:12px;align-items:center}}.yr li .ph{{flex:none;width:144px;border:1px solid var(--line);border-radius:8px;overflow:hidden}}
@media (max-width:560px){{.yr li.hasph{{flex-direction:column;align-items:flex-start;gap:4px}}.yr li .ph{{width:100%;max-width:270px}}}}
</style></head><body><div class="wrap">
<div class="top"><a href="/">1億2千万<small>分の1</small></a><a class="cta" style="margin:0;padding:6px 16px;font-size:13px" href="/">自分も生まれてみる</a></div>
<p class="eyebrow">{d["bornY"]}年 — {d["deathYear"]}年</p>
<h1><ruby>{esc(d["sei"])}<rt>{esc(d["seiY"])}</rt></ruby> <ruby>{esc(d["mei"])}<rt>{esc(d["meiY"])}</rt></ruby><span class="sx {d["sex"]}">{sx}</span></h1>
<p class="muted">{esc(d["pref"])}{esc(d["city"])}生まれ{("・" + esc(d["classLabel"])) if d["classLabel"] else ""}</p>
<div class="sprites">{sprites}</div>
<p class="epitaph">{"<br>".join(esc(x) for x in d["lines"])}</p>
{f'<p class="muted">{esc(d["epitaph"])}</p>' if d["epitaph"] else ""}
<div class="stats">{stats}</div>
{mp}
{f'<h2>アルバム</h2><div class="album">{album}</div>' + (f'<p class="morebox"><button type="button" onclick="document.querySelectorAll(\'.album figure.more\').forEach(function(e){{e.classList.remove(\'more\')}});this.parentNode.remove()">アルバムをすべて見る（全{len(photos)}枚）</button></p>' if len(photos) > 6 else '') if album else ""}
{f'<h2>死亡記録</h2><p>{esc(d["summary"])}</p>' if d["summary"] else ""}
{f'<h2>覚えておく瞬間</h2>{stars}' if stars else ""}
{f'<h2>残した思い</h2>{notes}' if notes else ""}
<h2>人生の記録</h2><p class="small muted">新しい順に表示しています。</p>
{"".join(log_html)}
<p style="text-align:center"><a class="cta" href="/">あなたも、日本のどこかに生まれてみる</a></p>
<footer>この人生は、日本の統計にもとづいてランダムに生成された架空の人生です。実在の人物とは関係ありません。<br><a href="/">1億2千万分の1 — 日本に生まれる人生シミュレーション</a></footer>
</div></body></html>'''


def font(path, size, wght=None):
    f = ImageFont.truetype(path, size)
    if wght:
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
    return f


def og_png(d):
    W, Hh = 1200, 630
    im = Image.new('RGB', (W, Hh), '#f6f2ea')
    g = ImageDraw.Draw(im)
    g.rectangle([0, 0, W, 14], fill='#c0392b')
    serif = lambda s: font(FONT_SERIF, s)
    sans = lambda s, w=500: font(FONT_SANS, s, w)
    g.text((70, 70), '1億2千万分の1', font=serif(46), fill='#1f1b16')
    g.text((70, 132), '日本に生まれる人生シミュレーション', font=sans(22, 500), fill='#c0392b')
    # ドット絵（子ども・大人・最後）
    x = 70
    for sp in d['sprites'][:3]:
        rows = sp['rows']
        if not rows:
            continue
        px = 10
        hgt = len(rows) * px
        y0 = 560 - hgt
        for yy, r in enumerate(rows):
            for xx, c in enumerate(r):
                if c:
                    g.rectangle([x + xx * px, y0 + yy * px, x + xx * px + px - 1, y0 + yy * px + px - 1], fill=c)
        g.text((x + len(rows[0]) * px / 2, 572), f"{sp['age']}歳", font=sans(22), fill='#6d655a', anchor='mt')
        x += max(len(r) for r in rows) * px + 26
    # 文字
    tx = 600
    g.text((tx, 70), f"{d['bornY']}年 — {d['deathYear']}年", font=sans(30, 700), fill='#c0392b')
    yomi = f"{d['seiY']} {d['meiY']}".strip()
    if yomi:
        g.text((tx, 118), yomi, font=sans(24), fill='#6d655a')
    name = f"{d['sei']} {d['mei']}"
    size = 92 if len(name) <= 5 else 76
    g.text((tx, 150), name, font=serif(size), fill='#1f1b16')
    nb = g.textbbox((tx, 150), name, font=serif(size))
    sxw = '男' if d['sex'] == 'M' else '女'
    bx = nb[2] + 16
    g.rounded_rectangle([bx, 190, bx + 44, 234], 6, fill='#2c4a7a' if d['sex'] == 'M' else '#c0566e')
    g.text((bx + 22, 212), sxw, font=sans(28, 700), fill='#ffffff', anchor='mm')
    y = 280
    for t in [f"{d['pref']}{d['city']}生まれ", f"{d['deathAge']}歳で死去（{d['cause']}）"] + [s for s in [d['edu'], d['job']] if s and s != '—'][:2]:
        g.text((tx, y), t[:24], font=sans(32, 500), fill='#1f1b16' if y < 330 else '#4a4238')
        y += 50
    g.text((W - 48, Hh - 44), '1injp.satoru.net', font=sans(24, 500), fill='#6d655a', anchor='rs')
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    return b.getvalue()


def lives_page(pg):
    per = 40
    with db() as c:
        total = c.execute('SELECT COUNT(*) FROM lives').fetchone()[0]
        rows = c.execute('SELECT id, created, data FROM lives ORDER BY created DESC LIMIT ? OFFSET ?', (per, pg * per)).fetchall()
    items = []
    for id_, created, data in rows:
        d = json.loads(data)
        sp = d['sprites'][-1] if d.get('sprites') else None
        items.append(f'''<a class="card" href="/l/{id_}"><div class="sp">{sprite_svg(sp, 4) if sp else ''}</div><div class="tx">
<b><ruby>{esc(d['sei'])}<rt>{esc(d['seiY'])}</rt></ruby> <ruby>{esc(d['mei'])}<rt>{esc(d['meiY'])}</rt></ruby><span class="sx {d['sex']}">{'男' if d['sex'] == 'M' else '女'}</span></b>
<span class="m">{d['bornY']}年 {esc(d['pref'])}{esc(d['city'])}生まれ</span>
<span class="d">{d['deathAge']}歳で死去（{esc(d['cause'])}）</span>
<span class="m">{esc(d['edu'] if d['edu'] and d['edu'] != '—' else '')}{'・' if d['edu'] and d['job'] else ''}{esc(d['job'])}</span></div></a>''')
    pages = (total + per - 1) // per
    nav = ''
    if pages > 1:
        nav = '<nav class="pg">' + (f'<a href="/lives?p={pg - 1}">← 新しい人生</a>' if pg > 0 else '<span></span>') + f'<span>{pg + 1} / {pages}</span>' + (f'<a href="/lives?p={pg + 1}">前の人生 →</a>' if pg + 1 < pages else '<span></span>') + '</nav>'
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>みんなの人生 — 1億2千万分の1</title>
<meta name="description" content="1億2千万分の1で、みんなが生きた人生の一覧。">
<meta property="og:type" content="website"><meta property="og:site_name" content="1億2千万分の1"><meta property="og:title" content="みんなの人生 — 1億2千万分の1">
<meta property="og:description" content="日本のどこかに生まれ、統計どおりに生きた人生の記録。{total}人分。"><meta property="og:url" content="{SITE}/lives"><meta property="og:image" content="{SITE}/og.png?v={OGV}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Shippori+Mincho:wght@700;800&display=swap" rel="stylesheet">
<style>
:root{{--bg:#f6f2ea;--paper:#fffdf8;--ink:#1f1b16;--muted:#6d655a;--line:#e2dacb;--accent:#c0392b;--indigo:#2c4a7a}}
@media (prefers-color-scheme: dark){{:root{{--bg:#16130f;--paper:#1f1b16;--ink:#efe8dc;--muted:#a59b8c;--line:#3a332b}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans JP',sans-serif}}
.wrap{{max-width:980px;margin:0 auto;padding:24px 16px 60px}}.top{{display:flex;justify-content:space-between;align-items:center;font-family:'Shippori Mincho',serif;font-weight:800}}
.top a{{color:var(--ink);text-decoration:none}}.top a.cta{{color:#fff}}h1{{font-family:'Shippori Mincho',serif;font-size:32px;margin:26px 0 4px}}.muted{{color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:18px}}
.card{{display:flex;gap:14px;align-items:flex-end;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--ink);text-decoration:none}}
.card:hover{{border-color:var(--accent)}}.sp{{flex:none;width:56px;display:flex;justify-content:center}}.tx{{display:flex;flex-direction:column;gap:1px;min-width:0}}
.tx b{{font-family:'Shippori Mincho',serif;font-size:20px}}.tx rt{{font-size:9px;font-family:'Noto Sans JP';color:var(--muted);font-weight:400}}
.sx{{display:inline-block;font-size:11px;color:#fff;background:var(--indigo);border-radius:3px;padding:0 4px;margin-left:6px;vertical-align:middle;font-family:'Noto Sans JP'}}.sx.F{{background:#c0566e}}
.m{{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}.d{{font-size:14px;font-weight:500}}
.cta{{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;border-radius:999px;padding:6px 16px;font-size:13px;font-family:'Noto Sans JP';font-weight:700}}
.pg{{display:flex;justify-content:space-between;margin-top:24px}}.pg a{{color:var(--accent)}}
</style></head><body><div class="wrap">
<div class="top"><a href="/">1億2千万<small>分の1</small></a><a class="cta" href="/">自分も生まれてみる</a></div>
<p style="margin:14px 0 -14px"><a class="back" style="color:var(--muted);text-decoration:none;font-size:14px" href="/" onclick="if(document.referrer.indexOf(location.host)>-1&amp;&amp;history.length>1){{history.back();return false}}">← 戻る</a></p><h1>みんなの人生</h1><p class="muted">日本のどこかに生まれ、統計どおりに生きた{total}人の人生。新しい順です。</p><p><a href="/rank" style="color:var(--accent)">人生ランキングを見る →</a></p>
<div class="grid">{''.join(items) or '<p>まだありません。</p>'}</div>{nav}
</div></body></html>'''


def man(v):
    """万円の値を読みやすく"""
    if abs(v) >= 10000:
        return f'{v / 10000:.1f}億円'.replace('.0億', '億')
    return f'{v:,}万円'


def fnum(v):
    if v >= 100_000_000:
        return f'{v / 100_000_000:.1f}億'.replace('.0億', '億')
    if v >= 10000:
        return f'{v / 10000:.1f}万'.replace('.0万', '万')
    return f'{v:,}'


RANKS = [
    ('age', '長寿', '最も長く生きた人', lambda m: (f"{m['age']}歳", '')),
    ('clan', '子孫繁栄', '子と孫の合計', lambda m: (f"{m['clan']}人", f"子{m['kids']}・孫{m['grand']}")),
    ('assets', '大富豪', '人生で最も多かった資産', lambda m: (man(m.get('assets', 0)), '')),
    ('debt', '借金王', '人生で最も多かった借金・負債', lambda m: (man(m.get('debt', 0)), '')),
    ('income', '高年収', '最高年収', lambda m: (man(m.get('income', 0)), '')),
    ('final', '遺した財産', '亡くなったときの資産', lambda m: (man(m.get('final', 0)), '')),
    ('sns', 'インフルエンサー', 'SNSのフォロワー数（最多のとき）', lambda m: (fnum(m.get('sns', 0)) + '人', '')),
    ('friends', '友だちの輪', '親しい友人の数（最多のとき）', lambda m: (f"{m.get('friends', 0)}人", '')),
    ('prefs', '渡り鳥', '住んだ都道府県の数', lambda m: (f"{m.get('prefs', 0)}都道府県", '')),
    ('jobs', '転職の達人', '経験した仕事の数', lambda m: (f"{m.get('jobs', 0)}種類", '')),
    ('marriages', '恋多き人生', '結婚した回数', lambda m: (f"{m.get('marriages', 0)}回", '')),
    ('remarry', '再婚', '再婚した回数', lambda m: (f"{m.get('remarry', 0)}回", f"結婚{m.get('marriages', 0)}回・離婚{m.get('divorces', 0)}回")),
    ('hobbies', '多趣味', '趣味の数', lambda m: (f"{m.get('hobbies', 0)}個", '')),
    ('arrests', '逮捕王', '逮捕・検挙された回数', lambda m: (f"{m.get('arrests', 0)}回", '')),
    ('trials', '波乱万丈', 'つらい出来事の数', lambda m: (f"{m.get('trials', 0)}回", '')),
    ('happy', '幸せな最期', '最期の幸福度', lambda m: (f"{m.get('happy', 0)}", '')),
    ('young', '早死に', '若くして亡くなった人', lambda m: (f"{m['age']}歳", m.get('cause', ''))),
]
RANK = {k: (t, sub, f) for k, t, sub, f in RANKS}
_META = {'t': 0, 'M': []}
_OGC = {}


def all_meta():
    if time.time() - _META['t'] < 30:
        return _META['M']
    with db() as c:
        rows = c.execute('SELECT id, meta, data FROM lives').fetchall()
    M = []
    for id_, meta, data in rows:
        m = json.loads(meta) if meta else meta_of(json.loads(data))
        m['id'] = id_
        M.append(m)
    _META.update(t=time.time(), M=M)
    return M


def rank_top(M, key, n):
    if key == 'young':
        return sorted(M, key=lambda m: m['age'])[:n]
    return sorted([m for m in M if m.get(key, 0) > 0], key=lambda m: -m.get(key, 0))[:n]


def rank_li(key, top, start=0):
    fmt = RANK[key][2]
    out = []
    for i, m in enumerate(top):
        v, sub = fmt(m)
        out.append(f'''<li><a href="/l/{m['id']}"><span class="no">{start + i + 1}</span><span class="sp">{sprite_svg(m['sprite'], 2) if m.get('sprite') else ''}</span>
<span class="nm"><b>{esc(m['sei'])} {esc(m['mei'])}</b><span class="m">{m['bornY']}年 {esc(m['pref'])}{esc(m['city'])}生まれ</span></span><span class="v">{esc(v)}{f'<small>{esc(sub)}</small>' if sub else ''}</span></a></li>''')
    return ''.join(out)


RANK_CSS = """:root{--bg:#f6f2ea;--paper:#fffdf8;--ink:#1f1b16;--muted:#6d655a;--line:#e2dacb;--accent:#c0392b;--indigo:#2c4a7a;--gold:#b8892a}
@media (prefers-color-scheme: dark){:root{--bg:#16130f;--paper:#1f1b16;--ink:#efe8dc;--muted:#a59b8c;--line:#3a332b}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans JP',sans-serif}
.wrap{max-width:980px;margin:0 auto;padding:24px 16px 60px}.top{display:flex;justify-content:space-between;align-items:center;font-family:'Shippori Mincho',serif;font-weight:800}
.top a{color:var(--ink);text-decoration:none}.top a.cta{color:#fff}h1{font-family:'Shippori Mincho',serif;font-size:32px;margin:26px 0 4px}.muted,.m{color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0}.chips a{font-size:13px;color:var(--ink);text-decoration:none;background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:3px 12px}.chips a:hover,.chips a.on{border-color:var(--accent);color:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:18px}
.rk{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:14px 14px 8px}.rk h2{font-family:'Shippori Mincho',serif;font-size:22px;margin:0}.rk h2 a{color:var(--ink);text-decoration:none}.rk h2 a:hover{color:var(--accent)}
.rk>.m{font-size:12.5px;margin:0 0 8px}.more{display:block;text-align:right;font-size:13px;color:var(--accent);padding:8px 0 4px;border-top:1px solid var(--line)}
.rk ol{list-style:none;margin:0;padding:0}.rk li a{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--line);color:var(--ink);text-decoration:none}.rk li a:hover b{color:var(--accent)}
.no{flex:none;width:26px;text-align:center;font-weight:700;color:var(--muted)}.rk li:nth-child(1) .no{color:var(--gold);font-size:18px}
.sp{flex:none;width:30px;display:flex;justify-content:center}.sp svg{display:block}
.nm{flex:1;min-width:0;display:flex;flex-direction:column}.nm b{font-family:'Shippori Mincho',serif;font-size:16px}.nm .m{font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v{flex:none;font-weight:700;text-align:right;font-size:15px}.v small{display:block;font-weight:400;font-size:11px;color:var(--muted)}
.cta{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;border-radius:999px;padding:6px 16px;font-size:13px;font-family:'Noto Sans JP';font-weight:700}
.solo{max-width:640px;margin:18px auto 0}.backrow{margin:14px 0 -14px}.back{color:var(--muted);text-decoration:none;font-size:14px}.back:hover{color:var(--accent)}.links{margin-top:10px}.links a{color:var(--accent);margin-right:16px}"""


def rank_html(title, desc, path, og, body):
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} — 1億2千万分の1</title>
<meta name="description" content="{esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="1億2千万分の1"><meta property="og:title" content="{esc(title)} — 1億2千万分の1">
<meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{SITE}{path}"><meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{og}">
<link rel="canonical" href="{SITE}{path}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Shippori+Mincho:wght@700;800&display=swap" rel="stylesheet">
<style>{RANK_CSS}</style></head><body><div class="wrap">
<div class="top"><a href="/">1億2千万<small>分の1</small></a><a class="cta" href="/">自分も生まれてみる</a></div>
<p class="backrow"><a class="back" href="/" onclick="if(document.referrer.indexOf(location.host)>-1&amp;&amp;history.length>1){{history.back();return false}}">← 戻る</a></p>
{body}
</div></body></html>'''


def chips(on=None):
    return '<nav class="chips">' + f'<a href="/rank"{" class=on" if on is None else ""}>すべて</a>' + ''.join(f'<a href="/rank/{k}"{" class=on" if k == on else ""}>{t}</a>' for k, t, _, _ in RANKS) + '</nav>'


def rank_page(key=None):
    M = all_meta()
    total = len(M)
    ogv = f'{OGV}-{len(M)}'
    if key is None:
        secs = []
        for k, title, sub, fmt in RANKS:
            top = rank_top(M, k, 5)
            if top:
                secs.append(f'<section class="rk" id="{k}"><h2><a href="/rank/{k}">{title}</a></h2><p class="m">{sub}</p><ol>{rank_li(k, top)}</ol><a class="more" href="/rank/{k}">{title}ランキングを見る →</a></section>')
        body = f'<h1>人生ランキング</h1><p class="muted">みんなが生きた{total}人の人生から。</p>{chips()}<div class="grid">{"".join(secs) or "<p>まだありません。</p>"}</div><p class="links"><a href="/lives">みんなの人生 →</a><a href="/">トップへ戻る</a></p>'
        return rank_html('人生ランキング', f'1億2千万分の1で生きた{total}人の人生のランキング。長寿、子孫繁栄、大富豪、インフルエンサー、早死になど。', '/rank', f'{SITE}/og/rank.png?v={ogv}', body)
    title, sub, fmt = RANK[key]
    top = rank_top(M, key, 50)
    body = f'<h1>{title}ランキング</h1><p class="muted">{sub}。みんなが生きた{total}人の人生から。</p>{chips(key)}<section class="rk solo"><ol>{rank_li(key, top) or "<p>まだありません。</p>"}</ol></section><p class="links"><a href="/rank">人生ランキング →</a><a href="/lives">みんなの人生 →</a><a href="/">トップへ戻る</a></p>'
    lead = ''
    if top:
        v, _ = fmt(top[0])
        lead = f"1位は{top[0]['sei']} {top[0]['mei']}さん（{v}）。"
    return rank_html(f'{title}ランキング', f'{sub}のランキング。{lead}', f'/rank/{key}', f'{SITE}/og/rank-{key}.png?v={ogv}', body)


def draw_sprite(g, sp, x, ybottom, px):
    rows = (sp or {}).get('rows') or []
    if not rows:
        return 0
    y0 = ybottom - len(rows) * px
    for yy, r in enumerate(rows):
        for xx, c in enumerate(r):
            if c:
                g.rectangle([x + xx * px, y0 + yy * px, x + xx * px + px - 1, y0 + yy * px + px - 1], fill=c)
    return max(len(r) for r in rows) * px


def rank_og(key=None):
    M = all_meta()
    ck = (key, len(M))
    if ck in _OGC:
        return _OGC[ck]
    W, Hh = 1200, 630
    im = Image.new('RGB', (W, Hh), '#f6f2ea')
    g = ImageDraw.Draw(im)
    g.rectangle([0, 0, W, 14], fill='#c0392b')
    serif = lambda s: font(FONT_SERIF, s)
    sans = lambda s, w=500: font(FONT_SANS, s, w)
    g.text((70, 56), '1億2千万分の1', font=serif(34), fill='#1f1b16')
    medal = ['#b8892a', '#8d8d8d', '#a0663a']
    if key is None:
        g.text((70, 104), '人生ランキング', font=serif(88), fill='#1f1b16')
        g.text((74, 214), f'みんなが生きた{len(M)}人の人生から', font=sans(28), fill='#6d655a')
        picks = [k for k in ['age', 'clan', 'assets', 'sns', 'prefs', 'young'] if rank_top(M, k, 1)][:6]
        for i, k in enumerate(picks):
            m = rank_top(M, k, 1)[0]
            cx, cy = 70 + (i % 3) * 360, 290 + (i // 3) * 150
            g.rounded_rectangle([cx, cy, cx + 340, cy + 134], 14, fill='#fffdf8', outline='#e2dacb', width=2)
            draw_sprite(g, m.get('sprite'), cx + 18, cy + 118, 4)
            title, _, fmt = RANK[k]
            v, _ = fmt(m)
            g.text((cx + 130, cy + 18), title + ' 1位', font=sans(22, 700), fill='#c0392b')
            g.text((cx + 130, cy + 50), f"{m['sei']} {m['mei']}"[:8], font=serif(30), fill='#1f1b16')
            g.text((cx + 130, cy + 92), v[:12], font=sans(26, 700), fill='#1f1b16')
    else:
        title, sub, fmt = RANK[key]
        g.text((70, 104), f'{title}ランキング', font=serif(80 if len(title) <= 5 else 66), fill='#1f1b16')
        g.text((74, 210), sub, font=sans(28), fill='#6d655a')
        for i, m in enumerate(rank_top(M, key, 3)):
            y = 268 + i * 106
            g.rounded_rectangle([70, y, 1130, y + 94], 14, fill='#fffdf8', outline='#e2dacb', width=2)
            g.ellipse([92, y + 23, 140, y + 71], fill=medal[i])
            g.text((116, y + 47), str(i + 1), font=sans(28, 700), fill='#ffffff', anchor='mm')
            draw_sprite(g, m.get('sprite'), 170, y + 86, 3)
            g.text((250, y + 14), f"{m['sei']} {m['mei']}", font=serif(36), fill='#1f1b16')
            g.text((252, y + 60), f"{m['bornY']}年 {m['pref']}{m['city']}生まれ"[:26], font=sans(20), fill='#6d655a')
            v, s2 = fmt(m)
            g.text((1100, y + (30 if s2 else 47)), v, font=sans(40, 700), fill='#1f1b16', anchor='rm')
            if s2:
                g.text((1100, y + 70), s2[:16], font=sans(18), fill='#6d655a', anchor='rm')
    g.text((W - 48, Hh - 30), '1injp.satoru.net/rank', font=sans(24, 500), fill='#6d655a', anchor='rs')
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    if len(_OGC) > 100:
        _OGC.clear()
    _OGC[ck] = b.getvalue()
    return _OGC[ck]


class Handler(BaseHTTPRequestHandler):
    server_version = 'lifelog/1'

    def log_message(self, *a):
        pass

    def send(self, code, body, ctype='text/html; charset=utf-8', extra=None):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def ip(self):
        return self.headers.get('CF-Connecting-IP') or self.headers.get('X-Real-IP') or self.client_address[0]

    def do_POST(self):
        if self.path != '/api/life':
            return self.send(404, 'not found', 'text/plain')
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > 1_600_000:
            return self.send(413, '{"error":"too large"}', 'application/json')
        ip, now = self.ip(), time.time()
        with lock:
            q = [t for t in RATE.get(ip, []) if now - t < 3600]
            if len(q) >= 60:
                return self.send(429, '{"error":"too many"}', 'application/json')
            q.append(now)
            RATE[ip] = q
        try:
            d = clean(json.loads(self.rfile.read(n).decode('utf-8')))
        except Exception:
            return self.send(400, '{"error":"bad request"}', 'application/json')
        id_ = secrets.token_urlsafe(6).replace('-', 'x').replace('_', 'y')
        photos = d.pop('photos')
        d['photos'] = []
        for i, x in enumerate(photos):
            with open(os.path.join(PHOTOS, f'{id_}-{i}.png'), 'wb') as f:
                f.write(x.pop('raw'))
            d['photos'].append(x)
        with db() as c:
            c.execute('INSERT INTO lives (id, created, ip, data, meta) VALUES (?,?,?,?,?)', (id_, int(now), ip, json.dumps(d, ensure_ascii=False), json.dumps(meta_of(d), ensure_ascii=False)))
        return self.send(200, json.dumps({'id': id_, 'url': f'{SITE}/l/{id_}'}), 'application/json')

    def do_GET(self):
        m = re.match(r'^/l/([A-Za-z0-9]{6,12})/?$', self.path.split('?')[0])
        if m:
            d = get(m.group(1))
            if not d:
                return self.send(404, '<!doctype html><meta charset="utf-8"><p>この人生の記録は見つかりませんでした。<a href="/">トップへ</a></p>')
            return self.send(200, page(d, m.group(1)), extra={'Cache-Control': 'public, max-age=300'})
        m = re.match(r'^/lives/?(?:\?p=(\d+))?$', self.path)
        if m:
            return self.send(200, lives_page(min(10000, int(m.group(1) or 0))), extra={'Cache-Control': 'public, max-age=30'})
        m = re.match(r'^/rank(?:/([a-z]+))?/?$', self.path.split('?')[0])
        if m and (m.group(1) is None or m.group(1) in RANK):
            return self.send(200, rank_page(m.group(1)), extra={'Cache-Control': 'public, max-age=60'})
        m = re.match(r'^/og/rank(?:-([a-z]+))?\.png$', self.path.split('?')[0])
        if m and (m.group(1) is None or m.group(1) in RANK):
            return self.send(200, rank_og(m.group(1)), 'image/png', {'Cache-Control': 'public, max-age=600'})
        m = re.match(r'^/ph/([A-Za-z0-9]{6,12}-\d{1,2})\.png$', self.path.split('?')[0])
        if m:
            p = os.path.join(PHOTOS, m.group(1) + '.png')
            if not os.path.exists(p):
                return self.send(404, 'not found', 'text/plain')
            return self.send(200, open(p, 'rb').read(), 'image/png', {'Cache-Control': 'public, max-age=31536000, immutable'})
        m = re.match(r'^/og/([A-Za-z0-9]{6,12})\.png$', self.path.split('?')[0])
        if m:
            p = os.path.join(CACHE, f'{m.group(1)}-v{OGV}.png')
            if not os.path.exists(p):
                d = get(m.group(1))
                if not d:
                    return self.send(404, 'not found', 'text/plain')
                open(p, 'wb').write(og_png(d))
            return self.send(200, open(p, 'rb').read(), 'image/png', {'Cache-Control': 'public, max-age=86400'})
        return self.send(404, 'not found', 'text/plain')


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
