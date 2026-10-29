# Misija 13 (Lovec na tornado) med neizbrane (29. 10.): tabela izbora in časov, čas in žetoni, naslovnica, kamera 2/6,
# vrstni red in seznam neizbranih. Podatki in gradniki prosojnic so iz deck5.py. Uporaba: python3 deck6.py blobs6.json
import json, os, re, sys
G = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(G, '..', 'deck10', 'project'); S = os.path.join(P, 'slides')
BL = json.load(open(sys.argv[1]))
D5 = open(os.path.join(G, 'deck5.py'), encoding='utf-8').read()
exec(D5[D5.index('BG, FG, MUT'):D5.index('def rng')])          # barve, SEL, NEW, REST
REST[13] = SEL.pop(13)[0]

def rng(lst, i):
    lo = sum(int(v[i].split('–')[0]) for v in lst); hi = sum(int(v[i].split('–')[1]) for v in lst); return lo, hi
s_h, s_m = rng(SEL.values(), 2), rng(SEL.values(), 3)
n_h, n_m = rng(NEW.values(), 2), rng(NEW.values(), 3)
tot = (s_h[0] + n_h[0] + 10, s_h[1] + n_h[1] + 14)
real = (round(tot[0] * 0.7 / 5) * 5, round(tot[1] * 0.8 / 5) * 5)
play = (s_m[0] + n_m[0], s_m[1] + n_m[1])
def hh(v): return str(v // 60) + ',' + str(int(v % 60 / 6 + 0.5)) if v % 60 else str(v // 60)
# žetoni izbora sorazmerno z urami (24 misij 322–454 h je bilo 105–220 mio); skupaj še 10 novih (40–85) in sistem (3–7)
t_ex = (105 * s_h[0] / 322, 220 * s_h[1] / 454)
tok = tuple(round(v / 5) * 5 for v in t_ex)
tok_all = (round((t_ex[0] + 40 + 3) / 5) * 5, round((t_ex[1] + 85 + 7) / 5) * 5)
ns, na = len(SEL), len(SEL) + len(NEW)
print('izbor', ns, s_h, s_m, 'skupaj', na, tot, 'realno', real, 'igranje', play, 'žetoni', tok, tok_all)

dj = json.load(open(os.path.join(P, 'deck.json'), encoding='utf-8'))
o = [s for s in dj['order'] if s != 'm13']
ORDER = o[:o.index('ostale') + 1] + ['m%02d' % k for k in sorted(REST)]
assert sorted(ORDER) == sorted(dj['order'])
N = len(ORDER)
exec(D5[D5.index('def foot'):D5.index('sel = sorted(SEL.items())')])   # foot, H2, KICK, SEC, write, table
exec(D5[D5.index('def card'):D5.index("write('tabela2'")])             # card

sel = sorted(SEL.items())
write('tabela1', '\n'.join([
    SEC % ('tabela1', BG, FG, '112px 128px 150px', 'column', 28),
    H2 % (64, 'Tvoj izbor · %d misij' % ns),
    '<div style="display:flex;flex-direction:row;gap:32px">', table(sel[:12], 816), table(sel[12:], 816), '</div>',
    '<div style="background:%s;border-left:6px solid %s;padding:20px 28px"><p style="font-size:26px;line-height:1.4"><b>Skupaj %d–%d h izdelave.</b> Vseh %d misij se enkrat odigra v %d–%d minutah. Misija 6 ima zdaj promet (+2 h), 45 je prestavljena na Rivijero, 13 je med neizbranimi.</p></div>' % (CARD, ACC, s_h[0], s_h[1], ns, s_m[0], s_m[1]),
    foot('tabela1', 'izdelava: vozilo, igralni del in testi; igranje: ena vožnja misije'),
    '<aside>Tabela tvojega izbora: za vsako misijo proga, čas izdelave in koliko časa traja, ko jo igralec igra. Ure so groba ocena.</aside>',
    '</section>']))

write('tabela2', '\n'.join([
    SEC % ('tabela2', BG, FG, '112px 128px 150px', 'column', 28),
    H2 % (64, '10 novih misij · skupni čas'),
    '<div style="display:flex;flex-direction:row;gap:40px">', table(sorted(NEW.items()), 1004),
    '<div style="flex:1;display:flex;flex-direction:column;gap:16px">',
    card('Izbranih %d misij' % ns, '%d–%d h' % s_h), card('10 novih misij', '%d–%d h' % n_h), card('Sistem misij (enkrat)', '10–14 h'),
    card('Skupaj izdelava', '%d–%d h' % tot, True), '</div>', '</div>',
    '<div style="background:%s;border-left:6px solid %s;padding:20px 28px"><p style="font-size:24px;line-height:1.4">Realno <b>okoli %d–%d h</b>, ker se ogenj, voda, vrv in vozila med misijami ponavljajo (20–30 %% manj). Vseh %d misij se enkrat odigra v %d–%d minutah (%s–%s h). Žetoni: okoli %d–%d mio.</p></div>' % (CARD, ACC, real[0], real[1], na, play[0], play[1], hh(play[0]), hh(play[1]), tok_all[0], tok_all[1]),
    foot('tabela2', 'vse na progah, ki so že v igri'),
    '<aside>Nove misije so na progah, ki jih tvoj izbor še ne uporablja. Skupni čas vključuje sistem misij v boksih, ki ga narediš enkrat za vse.</aside>',
    '</section>']))

chips = ['<div style="background:%s;border-radius:12px;padding:14px 18px;display:flex;flex-direction:row;gap:12px"><p style="font-size:24px;font-weight:700;color:%s">%02d</p><p style="font-size:24px;line-height:1.3">%s</p></div>' % (BG, ACC, k, t) for k, t in sorted(REST.items())]
write('ostale', '\n'.join([SEC % ('ostale', CARD, FG, '128px 128px 160px', 'column', 36), H2 % (72, 'Neizbrane misije'),
    '<p style="font-size:30px;line-height:1.4;width:1500px">Teh %d misij nisi izbral. Ostajajo v predstavitvi kot rezerva, tu za tem, in jih lahko kadar koli dodaš nazaj. Zadnja dodana: 13 Lovec na tornado.</p>' % len(REST),
    '<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:14px">'] + chips + ['</div>',
    foot('ostale', 'rezerva; makete ostanejo'),
    '<aside>Nekatere proge teh misij zdaj uporabljajo nove misije (npr. Big Sur, Nürburg, Suzuka). Če katero od starih misij dodaš nazaj, si progo deli z novo.</aside>', '</section>']))

def edit(sid, pairs):
    f = os.path.join(S, sid + '.html'); h = open(f, encoding='utf-8').read()
    for pat, rep in pairs:
        h, n = re.subn(pat, rep, h); assert n, (sid, pat)
    open(f, 'w', encoding='utf-8').write(h)
edit('cas', [(r'Izbranih \d+ misij</td><td style="text-align:right">[^<]*</td><td style="text-align:right">[^<]*</td>',
              'Izbranih %d misij</td><td style="text-align:right">%d–%d h</td><td style="text-align:right">%d–%d mio</td>' % ((ns,) + s_h + tok)),
             (r'Izbranih \d+ misij s sistemom</td><td style="text-align:right;color:#F2A33A">[^<]*</td><td style="text-align:right;color:#F2A33A">[^<]*</td>',
              'Izbranih %d misij s sistemom</td><td style="text-align:right;color:#F2A33A">%d–%d h</td><td style="text-align:right;color:#F2A33A">%d–%d mio</td>' % ((na,) + tot + tok_all)),
             (r'okoli \d+–\d+ h\.', 'okoli %d–%d h.' % real)])
edit('cover', [(r'([Tt])voj izbor \d+ misij', r'\g<1>voj izbor %d misij' % ns)])
edit('kamera2', [(r'/_blob/[0-9a-f]{32}', '/_blob/' + BL['kamera2']), (r'alt="Šest telefonov', 'alt="Pet telefonov'),
                 (r'Misije 09–19\.', 'Misije 09–19, brez 13, ki je med neizbranimi.')])

for sid in ORDER:
    f = os.path.join(S, sid + '.html'); h = open(f, encoding='utf-8').read()
    h = re.sub(r'55 posebnih misij · \d+ / \d+', '55 posebnih misij · %d / %d' % (ORDER.index(sid) + 1, N), h)
    open(f, 'w', encoding='utf-8').write(h)
dj['order'] = ORDER
dj['sections']['s2']['description'] = 'Tvoj izbor: %d misij, s slikami, kako vržeš darilo in kako iščeš plavalca' % ns
json.dump(dj, open(os.path.join(P, 'deck.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('prosojnic:', N, '· m13 na mestu', ORDER.index('m13') + 1)
