# Posodobi predstavitev (deck10/project): tvoj izbor 24 misij, 10 novih (46–55), kako vržeš / kako iščeš,
# kamera igralca (Blizu), tabela časov, neizbrane misije na koncu. Uporaba: python3 deck5.py blobs.json
import json, os, re, sys
G = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(G, '..', 'deck10', 'project'); S = os.path.join(P, 'slides')
BL = json.load(open(sys.argv[1]))
BG, FG, MUT, ACC, CARD = '#12161C', '#F3EFE6', '#B9C2CC', '#F2A33A', '#1B2230'

# misija: (ime, proga, izdelava h, igranje min)
SEL = {1: ('Požar na vrhu', 'Vršič, Slovenija', '14–20', '4–6'), 2: ('Zlata ura', 'Monte Carlo, Monako', '12–16', '3–4'),
       4: ('Vlečna služba', 'Pikes Peak, ZDA', '14–20', '6–8'), 6: ('Srce v hladilni torbi', 'Mulholland Highway, ZDA', '12–16', '6–8'),
       7: ('Cisterna', 'Sani Pass, Južna Afrika', '14–20', '7–9'), 8: ('Izgubljeni v gozdu', 'Ouninpohja, Finska', '12–18', '8–10'),
       9: ('Krilo vetrnice', 'Katu-Jaryk, Rusija', '16–22', '9–12'), 10: ('Pobegla čreda', 'Harju, Finska', '14–20', '4–6'),
       11: ('Ognjena reka', 'Mauna Kea, ZDA', '16–24', '3–4'), 13: ('Lovec na tornado', 'Detroit, ZDA', '16–24', '5–7'),
       17: ('Ledeni most', 'Trois-Rivières, Kanada', '12–18', '4–5'), 19: ('Pred plimo', 'Townsville, Avstralija', '12–16', '5–6'),
       23: ('Lovec na meteorite', 'Marrakesh, Maroko', '12–18', '7–9'), 26: ('Zadnji odstotek', 'Tianmen, Kitajska', '10–14', '6–8'),
       29: ('Božična noč', 'Štajerska, Avstrija', '12–16', '5–6'), 30: ('Ratrak', 'Mount Baldy, ZDA', '16–22', '6–8'),
       33: ('Odvoz snega', 'Montréal, Kanada', '14–18', '6–8'), 34: ('Mestni avtobus', 'Toronto, Kanada', '12–18', '10–13'),
       35: ('Reševalci na plaži', 'Newcastle, Avstralija', '16–22', '3–4'), 37: ('Poplava', 'Bang Saen, Tajska', '16–22', '8–10'),
       39: ('Konji v prikolici', 'Monterey, ZDA', '12–16', '6–8'), 40: ('Varnostni avto', 'Bathurst, Avstralija', '12–18', '4–5'),
       43: ('Vroče zavore', 'Rio do Rastro, Brazilija', '12–16', '4–5'), 45: ('Turistični vlakec', 'Riviera, Francija', '14–20', '6–8')}
NEW = {46: ('Požar v predoru', 'Uncompahgre, ZDA', '14–20', '5–7'), 47: ('Gozdni požar', 'Great Alpine Road, Avstralija', '16–22', '7–9'),
       48: ('Narasla reka', 'Longford, Avstralija', '14–20', '6–8'), 49: ('Zataknjeno kolo', 'Suzuka, Japonska', '12–18', '6–8'),
       50: ('Panji na pašo', 'Medvode, Slovenija', '10–14', '5–6'), 51: ('Dinozaver na tovornjaku', 'Crystal Palace, Anglija', '10–14', '6–8'),
       52: ('Hiša na tovornjaku', 'Big Sur, ZDA', '12–16', '8–10'), 53: ('Snežne verige', 'Los Caracoles, Čile', '12–16', '7–9'),
       54: ('Dirka tovornjakov', 'Nürburg, Nemčija', '12–16', '5–7'), 55: ('Medvedi na cesti', 'Beartooth, ZDA', '12–18', '4–6')}
REST = {3: 'Zasuti prelaz', 5: 'Vedro iz jezera', 12: 'Avtek na daljinca', 14: 'Sladoledar', 15: 'Na tirih', 16: 'Za balonom', 18: 'Kaskader',
        20: 'Fotosafari', 21: 'Zadnji trajekt', 22: 'Smetarski dan', 24: 'Žetev pred nevihto', 25: 'Spremljevalni avto', 27: 'Splavi čoln',
        28: 'Svetilnik v nevihti', 31: 'Dinozavrovo jajce', 32: 'Opičja tolpa', 36: 'Plaz', 38: 'Peščeni vihar', 41: 'Dirkalni taksi',
        42: 'Ogledalo za zvezde', 44: 'Skalni podor'}

def rng(lst, i):
    lo = sum(int(v[i].split('–')[0]) for v in lst); hi = sum(int(v[i].split('–')[1]) for v in lst); return lo, hi
s_h, s_m = rng(SEL.values(), 2), rng(SEL.values(), 3)
n_h, n_m = rng(NEW.values(), 2), rng(NEW.values(), 3)
tot = (s_h[0] + n_h[0] + 10, s_h[1] + n_h[1] + 14)
real = (round(tot[0] * 0.7 / 5) * 5, round(tot[1] * 0.8 / 5) * 5)
play = (s_m[0] + n_m[0], s_m[1] + n_m[1])
def hh(v): return str(v // 60) + ',' + str(int(v % 60 / 6 + 0.5)) if v % 60 else str(v // 60)
print('izbor', s_h, s_m, 'nove', n_h, n_m, 'skupaj', tot, 'realno', real, 'igranje', play)

ORDER = (['cover', 'tabela1', 'tabela2'] +
         ['m%02d' % k for k in (1, 2, 4, 6, 7, 8, 9, 10, 11, 13, 17, 19, 23, 26, 29)] + ['kako29'] +
         ['m%02d' % k for k in (30, 33, 34, 35)] + ['kako35'] + ['m%02d' % k for k in (37, 39, 40, 43, 45)] +
         ['izbor5'] + ['m%02d' % k for k in range(46, 56)] + ['kamera%d' % k for k in range(1, 7)] +
         ['cas', 'rezerva', 'gasilski', 'vzporedno', 'blender', 'ostale'] + ['m%02d' % k for k in sorted(REST)])
N = len(ORDER)
def foot(sid, tail=''):
    return '<p style="position:absolute;left:128px;bottom:64px;width:1664px;font-size:24px;color:%s">55 posebnih misij · %d / %d%s</p>' % (MUT, ORDER.index(sid) + 1, N, (' · ' + tail) if tail else '')
H2 = '<h2 style="font-family:\'Oswald\', sans-serif;font-size:%dpx;font-weight:600;line-height:1.1;text-transform:uppercase">%s</h2>'
KICK = '<p style="font-size:24px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:%s">%s</p>' % (ACC, '%s')
SEC = '<section id="%s" data-transition="fade" style="background:%s;color:%s;font-family:\'Public Sans\', sans-serif;padding:%s;display:flex;flex-direction:%s;gap:%dpx">'
def write(sid, html): open(os.path.join(S, sid + '.html'), 'w', encoding='utf-8').write(html + '\n')

# ---------------------------------------------------------------- tabeli
def table(rows, width, fs=20):
    th = lambda w, t, r=False: '<th style="width:%d%%;color:%s%s">%s</th>' % (w, ACC, ';text-align:right' if r else '', t)
    h = ['<table style="width:%dpx;font-family:\'Public Sans\', sans-serif;font-size:%dpx;color:%s;padding:6px 12px">' % (width, fs, FG),
         '<tr style="background:%s">%s%s%s%s%s</tr>' % (CARD, th(7, '#'), th(32, 'Misija'), th(33, 'Proga'), th(13, 'Izdelava', True), th(15, 'Igranje', True))]
    for j, (k, (t, tr, hr, mn)) in enumerate(rows):
        bg = ' style="background:#161B23"' if j % 2 else ''
        h.append('<tr%s><td style="color:%s">%02d</td><td>%s</td><td>%s</td><td style="text-align:right">%s h</td><td style="text-align:right">%s min</td></tr>' % (bg, ACC, k, t, tr, hr, mn))
    h.append('</table>'); return '\n'.join(h)

sel = sorted(SEL.items())
write('tabela1', '\n'.join([
    SEC % ('tabela1', BG, FG, '112px 128px 150px', 'column', 28),
    H2 % (64, 'Tvoj izbor · 24 misij'),
    '<div style="display:flex;flex-direction:row;gap:32px">', table(sel[:12], 816), table(sel[12:], 816), '</div>',
    '<div style="background:%s;border-left:6px solid %s;padding:20px 28px"><p style="font-size:26px;line-height:1.4"><b>Skupaj %d–%d h izdelave.</b> Vseh 24 misij se enkrat odigra v %d–%d minutah. Misija 6 ima zdaj promet (+2 h), 45 je prestavljena na Rivijero.</p></div>' % (CARD, ACC, s_h[0], s_h[1], s_m[0], s_m[1]),
    foot('tabela1', 'izdelava: vozilo, igralni del in testi; igranje: ena vožnja misije'),
    '<aside>Tabela tvojega izbora: za vsako misijo proga, čas izdelave in koliko časa traja, ko jo igralec igra. Ure so groba ocena.</aside>',
    '</section>']))

def card(lbl, val, big=False):
    if big: return '<div style="background:#3A2A12;border-radius:14px;padding:18px 24px"><p style="font-size:22px;color:%s">%s</p><p style="font-family:\'Oswald\', sans-serif;font-size:52px;font-weight:600;line-height:1.15;color:%s">%s</p></div>' % (ACC, lbl, ACC, val)
    return '<div style="background:%s;border-radius:14px;padding:16px 24px"><p style="font-size:22px;color:%s">%s</p><p style="font-family:\'Oswald\', sans-serif;font-size:40px;font-weight:600;line-height:1.15">%s</p></div>' % (CARD, MUT, lbl, val)
write('tabela2', '\n'.join([
    SEC % ('tabela2', BG, FG, '112px 128px 150px', 'column', 28),
    H2 % (64, '10 novih misij · skupni čas'),
    '<div style="display:flex;flex-direction:row;gap:40px">', table(sorted(NEW.items()), 1004),
    '<div style="flex:1;display:flex;flex-direction:column;gap:16px">',
    card('Izbranih 24 misij', '%d–%d h' % s_h), card('10 novih misij', '%d–%d h' % n_h), card('Sistem misij (enkrat)', '10–14 h'),
    card('Skupaj izdelava', '%d–%d h' % tot, True), '</div>', '</div>',
    '<div style="background:%s;border-left:6px solid %s;padding:20px 28px"><p style="font-size:24px;line-height:1.4">Realno <b>okoli %d–%d h</b>, ker se ogenj, voda, vrv in vozila med misijami ponavljajo (20–30 %% manj). Vseh 34 misij se enkrat odigra v %d–%d minutah (%s–%s h). Žetoni: okoli 145–315 mio.</p></div>' % (CARD, ACC, real[0], real[1], play[0], play[1], hh(play[0]), hh(play[1])),
    foot('tabela2', 'vse na progah, ki so že v igri'),
    '<aside>Nove misije so na progah, ki jih tvoj izbor še ne uporablja. Skupni čas vključuje sistem misij v boksih, ki ga narediš enkrat za vse.</aside>',
    '</section>']))

# ---------------------------------------------------------------- nove misije 46–55
TXT = {
 46: ('zadimljen predor, ujeti avti z utripalkami, gasilsko vozilo z dihalnimi aparati, ogenj globoko v predoru.',
      'V predoru na gorski cesti gori tovornjak. Dim je tako gost, da se vidijo le utripalke ujetih avtov.',
      'Zapelji v predor, naloži ujete ljudi in jih pripelji ven, nato pogasi goreči tovornjak, preden ti zmanjka zraka.',
      'Nov igralni del: vožnja v dimu, ko vidiš le nekaj metrov. Pomagajo utripalke avtov in svetleče oznake izhodov ob steni.',
      'Maketa: gasilsko vozilo pred portalom predora, iz katerega se vali dim, v notranjosti žari ogenj, ob cesti rešeni avti'),
 47: ('fronta ognja, ki se širi z vetrom, iskre, gasilska cisterna 4×4, polnjenje vode v jezercu, kenguruji.',
      'Veter žene ogenj po pobočju navzdol proti kmetiji. Cesta je zadnja ovira pred hišo.',
      'Gasi rob ognja ob cesti, da ne preskoči na drugo stran, in pravočasno natoči vodo v jezercu na kmetiji.',
      'Ogenj se širi po mreži celic, veter določa smer. Ko zmanjka vode, je treba do jezerca in nazaj, preden fronta napreduje.',
      'Maketa: gasilska cisterna na cesti gasi rob gozdnega požara, nad pobočjem dim, spodaj kmetija in jezerce'),
 48: ('narasla reka, lesen most, plavje in hlodi, visok reševalni tovornjak, opečni viadukt.',
      'Po dolgem deževju reka hitro narašča. Na kmetiji na drugem bregu čaka devet ljudi.',
      'Prepelji vse s kmetije čez lesen most, preden ga voda zalije. Ob mostu se nabira plavje.',
      'Voda naraste z vsako vožnjo. Igralec izbira med več ljudmi naenkrat in hitrejšimi vožnjami; plavje udarja ob most in ga trese.',
      'Maketa: oranžen reševalni tovornjak z ljudmi na lesenem mostu čez naraslo rjavo reko, hlodi ob mostu, v ozadju opečni viadukt'),
 49: ('veliko panoramsko kolo, avtolestev z dvižno lestvijo in košem, krmiljenje lestve, veter.',
      'Ob dirkališču je obstalo panoramsko kolo. V kabinah visoko nad tlemi čakajo ljudje.',
      'Postavi avtolestev, dvigni in iztegni lestev do kabin ter ljudi varno spravi na tla.',
      'Nov igralni del: lestev krmiliš z dvema drsnikoma (dvigni, iztegni). V vetru koš niha, zato je treba počakati na pravi trenutek.',
      'Maketa: rdeča avtolestev z dvignjeno lestvijo do kabine obstalega panoramskega kolesa v mraku'),
 50: ('prevozni čebelnjak s poslikanimi končnicami, mir čebel, makadamska cesta, kozolec, večerna luč.',
      'Lipa cveti. Čebelar mora zvečer, ko so vse čebele doma, prepeljati čebelnjak na pašo.',
      'Pripelji čebelnjak do lipe brez sunkov in lukenj, da čebele ostanejo mirne, preden se stemni.',
      'Mirna, slovenska misija. Merilnik miru pada ob vsakem sunku; če se čebele razjezijo, je misija izgubljena.',
      'Maketa: tovornjak s prevoznim čebelnjakom in pisanimi končnicami na makadamu med travniki, v ozadju vas in cerkev'),
 51: ('nizkopodni tovornjak s kipom stegozavra, nizek železniški most, veje nad cesto, parkirani avti.',
      'Kip dinozavra se po obnovi vrača v park. Ulice so ozke, nad njimi veje in železniški most.',
      'Pripelji dinozavra v park, ne da zadene veje ali most. Pred mostom spusti podvozje.',
      'Nova omejitev je višina: prikaz pokaže prostor do mostu in vej. Parkirani avti zožijo cesto, zato je treba voziti po sredini.',
      'Maketa: tovornjak s kipom stegozavra med vrstnimi hišami, pred njim železniški most z rumeno-črnim pasom'),
 52: ('širok tovor (cela hiša), spremljevalna avta, promet, ki čaka, betonski ločni most nad sotesko.',
      'Montažna hiša potuje po ozki obalni cesti. Široka je skoraj kot vsa cesta.',
      'Pripelji hišo do cilja brez praske. Spremljevalni avto ustavlja promet, most prevozi po sredini.',
      'Prikaz pokaže prostor na levi in desni strani tovora. Na ovinkih nad morjem tovor sega čez rob cestišča.',
      'Maketa: tovornjak z montažno hišo na obalni cesti nad morjem, pred njim spremljevalni avto in betonski ločni most'),
 53: ('avtobus s snežnimi verigami, nameščanje verig, serpentine na snegu, galerija proti plazovom, zapora prelaza.',
      'Sneži in prelaz bodo kmalu zaprli. Avtobus s 46 potniki mora čez.',
      'Pred klancem namesti verige, nato pripelji avtobus čez serpentine, preden prelaz zaprejo.',
      'Dva dela: najprej kratka igra nameščanja verig, nato vožnja. Brez verig avtobus na snegu drsi; tovornjak brez verig je že obstal počez čez cesto.',
      'Maketa: avtobus na zasneženih serpentinah s temnimi kolesnicami, zgoraj galerija proti plazovom, v ozadju gore'),
 54: ('dirkalni tovornjaki, hlajenje zavor z vodo, omejevalnik hitrosti na 160 km/h, tribuna.',
      'Dirka težkih dirkalnih tovornjakov. Zavore se pregrejejo hitreje kot pri avtih.',
      'Zmagaj v štirih krogih. Pred ovinki zaviraj zgodaj in zavore ohladi z vodo, dokler je je kaj v rezervoarju.',
      'Vsi tovornjaki imajo isto najvišjo hitrost (omejevalnik), zato se dirka odloči pri zaviranju in pri ohranjanju zavor.',
      'Maketa: šest pisanih dirkalnih tovornjakov v ovinku z rdeče-belimi robniki, za kolesi pršenje vode, za njimi tribuna'),
 55: ('medvedka z mladičema, zastoj turistov, terenec nadzornika z lučmi, megafon in hupa, visoka planota.',
      'Medvedka z mladičema je obstala sredi ceste. Turisti so ustavili in nekateri izstopili.',
      'Z megafonom pošlji turiste nazaj v avte, nato medvede s hupo počasi odženi s ceste in razženi zastoj.',
      'Prvič žival, ki je ne smeš preveč preplašiti: preblizu ali preglasno in medvedka postane nevarna.',
      'Maketa: zelen terenec nadzornika z lučmi za medvedko in mladičema na cesti, ob cesti stojijo turisti in avti'),
}
def mission(k, title, track, hours, mins, img, alt, novo, story, goal, aside):
    return '\n'.join([
        SEC % ('m%02d' % k, BG, FG, '128px 128px 160px', 'row', 56),
        '<div style="width:1100px;display:flex;flex-direction:column;gap:28px">',
        '<img src="/_blob/%s" alt="%s" style="width:1100px;height:619px;object-fit:cover;border-radius:12px">' % (img, alt),
        '<p style="font-size:26px;line-height:1.4;color:%s"><span style="color:%s">Novo:</span> %s</p>' % (MUT, ACC, novo), '</div>',
        '<div style="flex:1;display:flex;flex-direction:column;gap:24px">', KICK % ('%02d · %s' % (k, track)), H2 % (64, title),
        '<p style="font-size:28px;line-height:1.4;color:%s">%s</p>' % (MUT, story),
        '<div style="background:%s;border-left:6px solid %s;padding:24px 28px">' % (CARD, ACC), '<p style="font-size:26px;line-height:1.4">%s</p>' % goal, '</div>',
        '<div style="flex:1"></div>',
        '<p style="font-family:\'Oswald\', sans-serif;font-size:36px;font-weight:600;background:%s;color:%s;border-radius:12px;padding:8px 24px;align-self:start">%s h · %s min</p>' % (ACC, BG, hours, mins),
        '</div>', foot('m%02d' % k, 'maketa iz Blenderja'), '<aside>%s</aside>' % aside, '</section>'])
for k, (t, tr, hr, mn) in NEW.items():
    novo, story, goal, aside, alt = TXT[k]
    write('m%02d' % k, mission(k, t, tr, hr, mn, BL['m%02d' % k], alt, novo, story, goal, aside))

# popravljeni misiji 6 in 45
write('m06', mission(6, 'Srce v hladilni torbi', 'Mulholland Highway, ZDA', '12–16', '6–8', BL['m06'],
    'Maketa: ponoči policijski avto vodi športni avto, avti pred njima stojijo na robu z utripalkami, nasproti stojijo avti in tovornjak',
    'policijsko spremstvo, promet, ki zapelje na rob in ustavi, temperatura organa, mestne luči v dolini.',
    'Ponoči moraš čez hribe pripeljati srce za presaditev. Pred tabo vozi policija.',
    'Drži se policije, ki ti odpira pot skozi promet, in dostavi organ, dokler je dovolj hladen.',
    'Na cesti so samo avti in tovornjaki, brez pešcev in kolesarjev. Ko pripelje policija z lučmi, avti pred njo zapeljejo na desni rob in ustavijo; nasproti vozeči ustavijo na svojem robu.'))
write('m45', mission(45, 'Turistični vlakec', 'Riviera, Francija', '14–20', '6–8', BL['m45'],
    'Maketa: rdeč turistični vlakec z vagončki v ostrem ovinku nad promenado s palmami, plaža s senčniki in morje',
    'vlakec z vagončki, ki režejo ovinke, promenada s palmami, plaža s senčniki, razgledna točka nad morjem.',
    'Turistični vlakec vozi goste ob morju in po ozkem ovinku navzgor do razgledne točke.',
    'Pelji vlakec skozi ovinke tako, da noben vagonček ne zadene robnika, in ustavi ob razgledni točki.',
    'Misija je zdaj na progi Riviera: promenada ob morju in serpentina do razgleda. Vagončki v ovinku režejo notranjo stran, zato je treba zavijati široko.'))

# ---------------------------------------------------------------- kako vržeš, kako iščeš
def howto(sid, k, track, title, img, alt, note_lbl, note, steps, aside):
    st = ['<p style="font-size:26px;line-height:1.35"><span style="font-family:\'Oswald\', sans-serif;font-size:30px;font-weight:600;color:%s">%d</span>&nbsp; %s</p>' % (ACC, i + 1, s) for i, s in enumerate(steps)]
    return '\n'.join([
        SEC % (sid, BG, FG, '128px 128px 160px', 'row', 56),
        '<div style="width:1100px;display:flex;flex-direction:column;gap:28px">',
        '<img src="/_blob/%s" alt="%s" style="width:1100px;height:619px;object-fit:cover;border-radius:12px">' % (img, alt),
        '<p style="font-size:26px;line-height:1.4;color:%s"><span style="color:%s">%s</span> %s</p>' % (MUT, ACC, note_lbl, note), '</div>',
        '<div style="flex:1;display:flex;flex-direction:column;gap:20px">', KICK % ('%02d · %s' % (k, track)), H2 % (60, title)] + st +
        ['<div style="flex:1"></div>', '</div>', foot(sid, 'štiri slike iz misije, kot jih vidi igralec'), '<aside>%s</aside>' % aside, '</section>'])
write('kako29', howto('kako29', 29, 'Štajerska, Avstrija', 'Kako vržeš darilo', BL['kako29'],
    'Štiri slike: poltovornjak se približa hiši z lučkami, igralec drži gumb VRZI in pika pokaže pristanek, darilo leti po loku, zadetek v zlatem krogu',
    'Smer:', 'igra sama vrže proti hiši ob cesti, levo ali desno. Igralec določa samo moč.',
    ['Približaj se hiši z lučkami. Pred vrati sveti zlati krog.', 'Drži gumb VRZI. Dlje držiš, dlje leti; pika pokaže, kam bo darilo padlo.',
     'Ko je pika v krogu, spusti. Darilo poleti po loku, ti pa voziš naprej.', 'Darilo v krogu je zadetek: +1 darilo in točke. Zgrešeno ostane v snegu.'],
    'Met je preprost in deluje z eno roko: druga roka ostane na volanu. Pri večji hitrosti je treba spustiti prej, ker darilo nese naprej.'))
write('kako35', howto('kako35', 35, 'Newcastle, Avstralija', 'Kako iščeš plavalca', BL['kako35'],
    'Štiri slike: reševalec na stolpu pokaže krog iskanja na morju, štirikolesnik pri skuterju ob vodi, skuter v valovih najde plavalca, plavalec na saneh',
    'Čas teče:', 'moč plavalca pada, valovi ga odnašajo stran od obale.',
    ['Alarm: reševalec na stolpu pokaže smer. Rdeči krog na morju je mesto, kjer so plavalca nazadnje videli.',
     'S štirikolesnikom pelji po plaži do vode, najbližje krogu, in presedi na skuter.',
     'Plavalec se pokaže le na vrhu vala in zakliče. Znak klica pokaže smer, krog se vsakič zmanjša.',
     'Ustavi ob njem, ga potegni na reševalne sani in ga pripelji na obalo.'],
    'Iskanje ni naključno: krog, smer klica in valovi vodijo igralca. Kdor opazuje valove, najde plavalca hitreje.'))

# ---------------------------------------------------------------- izbor 10 novih
TAG = {46: 'dim in ujeti avti', 47: 'fronta ognja in veter', 48: 'most pred poplavo', 49: 'avtolestev do kabin', 50: 'mirna vožnja s čebelami',
       51: 'visok tovor pod mostom', 52: 'širok tovor na obali', 53: 'verige na snegu', 54: 'hlajenje zavor', 55: 'zastoj zaradi medvedov'}
cards = ['<div style="background:%s;border-radius:14px;padding:24px 20px;display:flex;flex-direction:column;gap:8px"><p style="font-size:24px;font-weight:700;color:%s">%d · %s h</p><h3 style="font-family:\'Oswald\', sans-serif;font-size:32px;font-weight:600;line-height:1.2">%s</h3><p style="font-size:24px;line-height:1.4;color:%s">%s</p><p style="font-size:24px;line-height:1.4;color:#8A96A3">%s</p></div>' % (CARD, ACC, k, NEW[k][2], NEW[k][0], MUT, NEW[k][1], TAG[k]) for k in NEW]
write('izbor5', '\n'.join([SEC % ('izbor5', BG, FG, '128px 128px 160px', 'column', 32), H2 % (72, 'Še 10 novih misij'),
    '<div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:20px">'] + cards + ['</div>',
    '<div style="background:%s;border-left:6px solid %s;padding:24px 32px">' % (CARD, ACC),
    '<p style="font-size:28px;line-height:1.4"><b>Skupaj %d–%d h.</b> Vse so na progah, ki jih tvoj izbor še ne uporablja: Uncompahgre, Great Alpine Road, Longford, Suzuka, Medvode, Crystal Palace, Big Sur, Los Caracoles, Nürburg in Beartooth.</p>' % n_h,
    '</div>', foot('izbor5', 'vse na progah, ki so že v igri; ure vključujejo vozilo, igralni del in teste'),
    '<aside>Deset novih misij: dva požara, poplava, reševanje s panoramskega kolesa, čebele, dinozaver, hiša na tovornjaku, snežne verige, dirka tovornjakov in medvedi.</aside>', '</section>']))

# ---------------------------------------------------------------- kamera igralca
RANGES = ['01–08', '09–19', '23–34', '35–45', '46–51', '52–55']
ASIDE_K = ['Kamera za avtom je pri nastavitvi Blizu visoko nad cesto, zato se vozilo vidi predvsem od zgoraj: streha, oblika in barva. Drobni napisi in detajli na boku se ne vidijo.',
           'Pri nastavitvi Srednje je kamera 27 % dlje, pri Daleč 55 % dlje; vozila so tam še manjša. Dolg tovor, kot je krilo vetrnice, sega pod spodnji rob zaslona.',
           'Ponoči so najbolj vidne luči: žarometi, utripalke, lučke na hišah in reflektorji ratraka. Te morajo biti v igri dovolj svetle.',
           'Pri vozilih s prikolico ali vagončki se vidi cel sestav, zato igralec dobro vidi, kako zadnji del reže ovinek.',
           'Pri čebelnjaku se od zgoraj vidi predvsem streha, pisane končnice pa le ob strani; v igri bi lahko pobarvali še streho. Plošče stegozavra se vidijo dobro.',
           'Pri širokem tovoru (hiša) se od zgoraj lepo vidi, koliko ceste zavzame, zato je misija dobro igrljiva s kamero za avtom.']
for n in range(6):
    sid = 'kamera%d' % (n + 1)
    write(sid, '\n'.join([SEC % (sid, BG, FG, '112px 128px 150px', 'column', 24),
        H2 % (64, 'Kamera igralca · Blizu · %d / 6' % (n + 1)),
        '<p style="font-size:26px;line-height:1.4;color:%s">Telefon pokonci, kamera za avtom, nastavitev Blizu: tako veliko je vozilo na zaslonu med vožnjo. Misije %s.</p>' % (MUT, RANGES[n]),
        '<img src="/_blob/%s" alt="Šest telefonov pokonci s pogledom igralca od zadaj in od zgoraj na vozila misij %s" style="width:1664px;height:600px;object-fit:contain">' % (BL[sid], RANGES[n]),
        foot(sid, 'kamera kot v igri: okoli 50 m od točke 13 m pred avtom, 50° navzdol, zorni kot 58°'),
        '<aside>%s</aside>' % ASIDE_K[n],
        '</section>']))

# ---------------------------------------------------------------- neizbrane
chips = ['<div style="background:%s;border-radius:12px;padding:14px 18px;display:flex;flex-direction:row;gap:12px"><p style="font-size:24px;font-weight:700;color:%s">%02d</p><p style="font-size:24px;line-height:1.3">%s</p></div>' % (BG, ACC, k, t) for k, t in sorted(REST.items())]
write('ostale', '\n'.join([SEC % ('ostale', CARD, FG, '128px 128px 160px', 'column', 36), H2 % (72, 'Neizbrane misije'),
    '<p style="font-size:30px;line-height:1.4;width:1500px">Teh 21 misij nisi izbral. Ostajajo v predstavitvi kot rezerva, tu za tem, in jih lahko kadar koli dodaš nazaj.</p>',
    '<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:14px">'] + chips + ['</div>',
    foot('ostale', 'rezerva; makete ostanejo'),
    '<aside>Nekatere proge teh misij zdaj uporabljajo nove misije (npr. Big Sur, Nürburg, Suzuka). Če katero od starih misij dodaš nazaj, si progo deli z novo.</aside>', '</section>']))

# ---------------------------------------------------------------- naslovnica, čas
cv = open(os.path.join(S, 'cover.html'), encoding='utf-8').read()
cv = cv.replace('Boksi ob cesti · predlog 5', 'Boksi ob cesti · predlog 6').replace('28. 10. 2026', '29. 10. 2026').replace('>45 posebnih misij</h1>', '>55 posebnih misij</h1>')
cv = re.sub(r'<p style="font-size:36px;line-height:1.4;color:#B9C2CC">[^<]*</p>', '<p style="font-size:36px;line-height:1.4;color:#B9C2CC">Tvoj izbor 24 misij, 10 novih, kako vržeš darilo in kako iščeš plavalca, vozila skozi kamero igralca in čas izdelave za vsako misijo.</p>', cv)
cv = re.sub(r'<aside>.*?</aside>', '<aside>Šesta verzija predloga: tvoj izbor 24 misij na začetku, 10 novih misij, kamera igralca pri nastavitvi Blizu in tabela časov. Neizbrane misije so na koncu.</aside>', cv, flags=re.S)
open(os.path.join(S, 'cover.html'), 'w', encoding='utf-8').write(cv)

cas = open(os.path.join(S, 'cas.html'), encoding='utf-8').read()
a = cas.index('<tr style="background:#161B23"><td>Prvih 10 misij</td>'); b = cas.index('</table>')
cas = cas[:a] + '\n'.join([
    '<tr style="background:#161B23"><td>Izbranih 24 misij</td><td style="text-align:right">%d–%d h</td><td style="text-align:right">105–220 mio</td></tr>' % s_h,
    '<tr><td>10 novih misij (46–55)</td><td style="text-align:right">%d–%d h</td><td style="text-align:right">40–85 mio</td></tr>' % n_h,
    '<tr style="background:#3A2A12"><td style="color:#F2A33A">Izbranih 34 misij s sistemom</td><td style="text-align:right;color:#F2A33A">%d–%d h</td><td style="text-align:right;color:#F2A33A">145–315 mio</td></tr>' % tot]) + '\n' + cas[b:]
cas = cas.replace('zato bo dela realno 20–30 % manj.', 'zato bo dela realno 20–30 %% manj: okoli %d–%d h.' % real)
open(os.path.join(S, 'cas.html'), 'w', encoding='utf-8').write(cas)

# ---------------------------------------------------------------- izbranim prosojnicam dodaj čas igranja
for k, (t, tr, hr, mn) in SEL.items():
    if k in (6, 45): continue
    f = os.path.join(S, 'm%02d.html' % k); h = open(f, encoding='utf-8').read()
    h2 = re.sub(r'align-self:start">(\d+–\d+ h)</p>', lambda m_: 'align-self:start">%s · %s min</p>' % (m_.group(1), mn), h)
    assert h2 != h, k
    open(f, 'w', encoding='utf-8').write(h2)

# ---------------------------------------------------------------- oštevilčenje in deck.json
for sid in ORDER:
    f = os.path.join(S, sid + '.html'); h = open(f, encoding='utf-8').read()
    h = re.sub(r'(45|55) posebnih misij · \d+ / \d+', '55 posebnih misij · %d / %d' % (ORDER.index(sid) + 1, N), h)
    open(f, 'w', encoding='utf-8').write(h)
for old in ('izbor', 'izbor2', 'izbor3', 'izbor4'):
    p = os.path.join(S, old + '.html')
    if os.path.exists(p): os.remove(p)
dj = json.load(open(os.path.join(P, 'deck.json')))
dj['title'] = '55 posebnih misij'; dj['order'] = ORDER
dj['sections'] = {'s1': {'description': 'Pregled: tvoj izbor in čas izdelave za vsako misijo', 'start': 'cover'},
                  's2': {'description': 'Tvoj izbor: 24 misij, s slikami, kako vržeš darilo in kako iščeš plavalca', 'start': 'm01'},
                  's7': {'description': 'Deset novih misij (46–55)', 'start': 'izbor5'},
                  's8': {'description': 'Vozila skozi kamero igralca pri nastavitvi Blizu', 'start': 'kamera1'},
                  's3': {'description': 'Čas, žetoni, gasilski avto, delo z drugim računom', 'start': 'cas'},
                  's9': {'description': 'Neizbrane misije v rezervi', 'start': 'ostale'}}
json.dump(dj, open(os.path.join(P, 'deck.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('prosojnic:', N)
