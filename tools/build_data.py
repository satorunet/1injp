#!/usr/bin/env python3
"""tools/src/*.json（収集した実データ）から data_real.js を生成する。
   python3 tools/build_data.py
"""
import json, os
H = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(H, 'src')
OUT = os.path.join(H, '..', 'data_real.js')

def load(name):
    p = os.path.join(SRC, name)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None

js = ['/* 自動生成: tools/build_data.py（手で編集しない） */', '(function (G) {', '  const D = G.JPDATA;']

# 名字：都道府県別 上位300（人数つき）＋全国上位100、読みは上位分のみ
sn, raw = load('surnames.json'), load('raw.json')
if sn:
    reading = {}
    for lst in [sn['national']] + list(sn['prefs'].values()):
        for k, y, c in lst:
            reading[k] = y
    # 読みのない名字は、辞書（pykakasi）で作った読みで補う（tools/src/surname_yomi.json）
    for k, y in (load('surname_yomi.json') or {}).items():
        if not reading.get(k): reading[k] = y
    prefs = {}
    for pref in sn['prefs']:
        src = raw.get(pref) if raw else None
        if src:
            prefs[pref] = [[k, reading.get(k, ''), c] for _, k, c in src[:300]]
        else:
            prefs[pref] = sn['prefs'][pref]
    js.append('  D.SURNAME_PREF = ' + json.dumps(prefs, ensure_ascii=False, separators=(',', ':')) + ';')
    js.append('  D.SURNAME_NAT = ' + json.dumps(sn['national'], ensure_ascii=False, separators=(',', ':')) + ';')

gv = load('given.json')
if gv:
    js.append('  D.GIVEN = ' + json.dumps(gv['baby'], ensure_ascii=False) + ';')
    js.append('  D.PARENT_GIVEN = ' + json.dumps(gv['parent'], ensure_ascii=False) + ';')
    js.append('  D.GRAND_GIVEN = ' + json.dumps(gv['grand'], ensure_ascii=False) + ';')

# 都道府県統計
ps = load('prefs.json')
if ps:
    js.append('  const PS = ' + json.dumps(ps, ensure_ascii=False, separators=(',', ':')) + ';')
    js.append('''  PS.forEach((s) => { const p = D.PREFS.find((x) => x.n === s.name); if (!p) return;
    if (s.births_2025 || s.births) p.b = s.births_2025 || s.births; if (s.pop) p.p = s.pop / 10000; if (s.univ) p.u = ['山梨県', '茨城県', '沖縄県'].includes(s.name) ? Math.round((s.univ + p.u) / 2) : s.univ;
    if (s.le_m) p.le_m = s.le_m; if (s.le_f) p.le_f = s.le_f; if (s.tfr) p.tfr = s.tfr;
    if (s.income_pc) p.incpc = s.income_pc; if (s.unemp != null) p.unemp = s.unemp;
    if (s.gen3 != null) p.gen3 = s.gen3; if (s.homeownership != null) p.own = s.homeownership;
    if (s.smoking_m != null) p.smk_m = s.smoking_m; if (s.smoking_f != null) p.smk_f = s.smoking_f;
    if (s.suicide_rate != null) p.sui = s.suicide_rate; if (s.unmarried_50_m != null) { p.um_m = s.unmarried_50_m; p.um_f = s.unmarried_50_f; }
    if (s.marriage_rate != null) p.mar = s.marriage_rate; if (s.divorce_rate != null) p.div = s.divorce_rate; });
  const avg = D.PREFS.reduce((a, p) => a + (p.incpc || 0) * p.p, 0) / D.PREFS.reduce((a, p) => a + (p.incpc ? p.p : 0), 0);
  if (avg) D.PREFS.forEach((p) => { if (p.incpc) p.i = Math.pow(p.incpc / avg, 0.55); });
  const g3 = D.PREFS.reduce((a, p) => a + (p.gen3 || 0) * p.p, 0) / D.PREFS.reduce((a, p) => a + (p.gen3 != null ? p.p : 0), 0);
  if (g3) D.PREFS.forEach((p) => { if (p.gen3 != null) p.g = p.gen3 / g3; });''')
nat = load('national.json')
if nat:
    js.append('  D.NATIONAL = ' + json.dumps(nat, ensure_ascii=False, separators=(',', ':')) + ';')
    js.append('''  const N = D.NATIONAL;
  D.BIRTHS_PER_YEAR = N.births.value; D.DEATHS_PER_YEAR = N.deaths.value;
  const T = N.life_table_single_age;
  const ext = (a) => a.concat([Math.max(a[a.length - 1] * 0.02, 0.5)]);
  D.LT_AGES = T.ages.concat([110]); D.LT = { M: ext(T.lx_m), F: ext(T.lx_f) };
  N.le_m = N.life_expectancy.m; N.le_f = N.life_expectancy.f; N.univ = N.univ_rate.univ_gakubu;''')

for name, key in [('schools.json', 'SCHOOLS'), ('jobs.json', 'JOBDATA'), ('inst.json', 'INST'), ('sanin.json', 'SANIN')]:
    d = load(name)
    if d:
        js.append(f'  D.{key} = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';')

src = load('sources_all.json')
if src:
    js.append('  D.SOURCES = ' + json.dumps(src, ensure_ascii=False) + ';')

js.append('})(typeof window !== "undefined" ? window : globalThis);')
open(OUT, 'w', encoding='utf-8').write('\n'.join(js) + '\n')
print('wrote', OUT, os.path.getsize(OUT), 'bytes')
