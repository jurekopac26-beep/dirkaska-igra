// Profil igralca, faza 1: makete menija za stran Odločitve (samo slike, igra jih ne naloži).
// node maketa-menija/profil/makete.mjs <izhodna mapa>  → <id>.png (960 × 600, DPR 2), nato v webp.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const OUT = resolve(process.argv[2] || 'makete-out');
mkdirSync(OUT, { recursive: true });
const A = (p) => 'file://' + ROOT + '/' + p;

const CSS = `
@font-face { font-family: M; font-style: italic; font-weight: 400 900; src: url(${A('fonts/roboto-italic-latin-ext.woff2')}); unicode-range: U+0100-02BA; }
@font-face { font-family: M; font-style: italic; font-weight: 400 900; src: url(${A('fonts/roboto-italic-latin.woff2')}); unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: M; font-style: normal; font-weight: 400 900; src: url(${A('fonts/roboto-normal-latin-ext.woff2')}); unicode-range: U+0100-02BA; }
@font-face { font-family: M; font-style: normal; font-weight: 400 900; src: url(${A('fonts/roboto-normal-latin.woff2')}); unicode-range: U+0000-00FF, U+2000-206F; }
:root { --navy1:#0b192b; --navy2:#08121f; --lbl:#9fb3d6; --muted:#9fb0c3; --dim:#5d6b82; --curb:#e63b2e; --chalk:#f6f6f1; --gold:#ffc629; --cyan:#3fd0ff; --lime:#8cf046; --orange:#ff8a3d; --silver:#dfe6f1; --bronze:#e39a5c; --line:rgba(160,185,230,.13); --edge:rgba(120,150,205,.22); }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 960px; height: 600px; overflow: hidden; font-family: M, Roboto, sans-serif; color: #fff; background: radial-gradient(90% 70% at 30% 30%, #122235, #05080d 75%); display: flex; align-items: center; gap: 34px; padding: 0 34px; }
.ph { width: 412px; height: 572px; flex: none; border-radius: 26px; overflow: hidden; position: relative; background: radial-gradient(120% 60% at 50% 28%, #16304d 0%, var(--navy1) 55%, var(--navy2) 100%); box-shadow: 0 0 0 3px #2a313c, 0 26px 70px rgba(0,0,0,.6); padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; }
.side { flex: 1; display: flex; flex-direction: column; gap: 14px; }
.side .n { font: 900 italic 15px/1 M; letter-spacing: .12em; color: var(--gold); }
.side h1 { font: 900 italic 34px/1.05 M; letter-spacing: -.5px; }
.side ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.side li { font: 500 17px/1.35 M; color: #dfe6f1; padding-left: 20px; position: relative; }
.side li::before { content: ''; position: absolute; left: 0; top: 9px; width: 9px; height: 9px; border-radius: 2px; background: var(--curb); }
.side .rec { align-self: flex-start; font: 800 italic 13px/1 M; letter-spacing: .08em; padding: 6px 10px; border-radius: 6px; background: var(--gold); color: #1b1b1b; }
.hd { display: flex; align-items: center; gap: 12px; }
.sq { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.08); border: 1.5px solid var(--edge); display: grid; place-items: center; flex: none; }
.sq::before { content: ''; width: 10px; height: 10px; border-left: 3px solid #fff; border-bottom: 3px solid #fff; transform: translateX(2px) rotate(45deg); }
.hd b { display: block; font: 900 italic 21px/1.1 M; } .hd small { display: block; font: 600 italic 12.5px/1.3 M; color: var(--lbl); }
.chip { display: inline-block; font: 800 italic 10.5px/1 M; letter-spacing: .06em; padding: 4px 7px; border-radius: 5px; background: rgba(255,255,255,.12); color: #dfe6f1; white-space: nowrap; }
.chip.g { background: var(--gold); color: #1b1b1b; } .chip.c { background: rgba(63,208,255,.18); color: var(--cyan); } .chip.l { background: rgba(140,240,70,.16); color: var(--lime); }
.card { background: linear-gradient(100deg, rgba(10,18,31,.96), rgba(22,40,66,.82)); border: 1.5px solid rgba(255,255,255,.14); border-radius: 14px; padding: 10px 12px; position: relative; overflow: hidden; }
.lbl { font: 800 italic 11px/1 M; letter-spacing: .1em; color: var(--lbl); text-transform: uppercase; }
.tabs { display: flex; gap: 6px; } .tabs span { flex: 1; text-align: center; font: 800 italic 12px/1 M; padding: 9px 0; border-radius: 9px; background: rgba(255,255,255,.06); color: var(--muted); }
.tabs span.on { background: var(--cyan); color: #04121d; }
.btn { display: flex; align-items: center; justify-content: center; gap: 8px; font: 900 italic 15px/1 M; padding: 14px; border-radius: 12px; background: var(--gold); color: #1b1b1b; box-shadow: 0 4px 0 #9a7300; }
.btn.s { background: rgba(255,255,255,.1); color: #fff; box-shadow: 0 4px 0 #1f232b; border: 1.5px solid var(--edge); }
.btn.r { background: var(--curb); color: #fff; box-shadow: 0 4px 0 #8c1212; }
.bar { height: 7px; border-radius: 4px; background: rgba(255,255,255,.1); overflow: hidden; } .bar i { display: block; height: 100%; background: var(--cyan); border-radius: 4px; }
.row { display: flex; align-items: center; gap: 10px; } .grow { flex: 1; min-width: 0; }
.big { font: 900 italic 30px/1 M; } .mid { font: 900 italic 19px/1.1 M; } .sm { font: 600 12px/1.3 M; color: var(--muted); }
.trk { border-radius: 10px; background-size: cover; background-position: center; }
.dim { position: absolute; inset: 0; background: rgba(3,6,12,.66); z-index: 5; display: grid; place-items: center; padding: 24px; }
.dlg { width: 100%; background: #101b2e; border: 1.5px solid var(--edge); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 20px 50px rgba(0,0,0,.6); }
`;

const TR = (id) => A('assets/tracks/' + id + '.webp');
const side = (n, title, pts, rec) => `<div class="side"><div class="n">MOŽNOST ${n}</div><h1>${title}</h1>${rec ? '<span class="rec">PRIPOROČENO</span>' : ''}<ul>${pts.map(p => '<li>' + p + '</li>').join('')}</ul></div>`;
const head = (t, s) => `<div class="hd"><span class="sq"></span><div><b>${t}</b><small>${s}</small></div></div>`;
const medal = (c, sym, got = true) => `<svg viewBox="0 0 40 40" width="40" height="40" style="flex:none;opacity:${got ? 1 : .35}"><circle cx="20" cy="20" r="17" fill="${got ? c : '#2b3546'}" stroke="${got ? '#00000055' : '#55627a'}" stroke-width="2"/><text x="20" y="26" text-anchor="middle" font-family="M" font-weight="900" font-style="italic" font-size="16" fill="${got ? '#1b1b1b' : '#8b97ab'}">${sym}</text></svg>`;

// ---------------------------------------------------------------- (a) dosežki
const ACH = [['Popotnik', 'Prevozi vse proge', 41, 104, '#ffc629', '★', false], ['Brez praske', 'Dirka brez trka', 1, 1, '#3fd0ff', '✓', true], ['Kralj Eifla', 'Zmaga v Nürburgu', 1, 1, '#ffc629', 'N', true],
  ['Alpski prelazi', 'Furka, Izoard, Bâlea', 2, 3, '#8cf046', 'A', false], ['Andi', 'Cusco, Los Caracoles', 0, 2, '#ff8a3d', 'A', false], ['Otoki Pacifika', 'Savusavu, Koror', 2, 2, '#3fd0ff', 'O', true]];
const optsA = [
  ['dosezki-1', `<div class="ph">${head('Dosežki', '14 od 40 odklenjenih')}<div class="tabs"><span class="on">Vse</span><span>Dirke</span><span>Proge</span><span>Svet</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${ACH.concat(ACH.slice(0, 3).map(a => [a[0] === 'Popotnik' ? 'Sever' : a[0] === 'Brez praske' ? 'Sto krogov' : 'Puščava', a[0] === 'Popotnik' ? 'Koli, Longyearbyen' : a[0] === 'Brez praske' ? '100 krogov' : 'Sakhir, Dadès', 0, 2, '#ff8a3d', '?', false])).map(a => `<div class="card" style="padding:10px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;${a[6] ? 'border-color:rgba(255,198,41,.5)' : ''}">${medal(a[4], a[5], a[6])}<b style="font:900 italic 12.5px/1.1 M">${a[0]}</b><span class="sm" style="font-size:10.5px">${a[1]}</span>${a[6] ? '<span class="chip g">✓</span>' : `<div class="bar" style="width:80%"><i style="width:${Math.round(a[2] / a[3] * 100)}%"></i></div>`}</div>`).join('')}</div></div>`,
    side(1, 'Mreža značk po skupinah', ['Značke v štirih zavihkih: vse, dirke, proge, svet', 'Zaklenjene so sive in pokažejo napredek', 'Imena samo zemljepisna (Alpe, Andi, Eifel) ali opisna'], true)],
  ['dosezki-2', `<div class="ph">${head('Dosežki', '14 od 40 · najbližje odklepu zgoraj')}${ACH.map(a => `<div class="card row">${medal(a[4], a[5], a[6])}<div class="grow"><div class="row"><b class="grow" style="font:900 italic 15px/1.1 M">${a[0]}</b><span class="chip ${a[6] ? 'g' : ''}">${a[6] ? 'ODKLENJENO' : a[2] + '/' + a[3]}</span></div><div class="sm" style="margin:3px 0 5px">${a[1]}</div>${a[6] ? '' : `<div class="bar"><i style="width:${Math.round(a[2] / a[3] * 100)}%"></i></div>`}</div></div>`).join('')}</div>`,
    side(2, 'Seznam z vrsticami napredka', ['Ena vrstica na dosežek, opis in števec', 'Najbližji odklepu so na vrhu', 'Preprosto, a daljše drsenje']) ],
  ['dosezki-3', `<div class="ph">${head('Dosežki po svetu', 'Proge in dosežki po celinah')}${[['Evropa', 'furka', 9, 34], ['Azija', 'hakone', 3, 22], ['Amerike', 'pikes', 4, 26], ['Afrika', 'dades', 1, 11], ['Oceanija', 'bathurst', 2, 11]].map(c => `<div class="card row" style="padding:0;height:80px"><div class="grow" style="padding:10px 12px"><b class="mid">${c[0]}</b><div class="sm" style="margin:4px 0 6px">${c[2]} dosežkov · proge ${Math.round(c[3] * .5)}/${c[3]}</div><div class="bar" style="width:150px"><i style="width:${Math.round(c[2] / c[3] * 160)}%"></i></div></div><div class="trk" style="width:150px;height:100%;border-radius:0;background-image:url(${TR(c[1])});-webkit-mask-image:linear-gradient(90deg,transparent,#000 40%)"></div></div>`).join('')}</div>`,
    side(3, 'Dosežki po celinah', ['Pet kartic celin s sliko proge', 'Dotik odpre značke te celine', 'Lepo za potovanje, dosežki dirk pa so skriti nižje']) ],
];

// ---------------------------------------------------------------- (b) statistika
const optsB = [
  ['statistika-1', `<div class="ph">${head('Statistika', 'Tvoje številke')}<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="card"><div class="lbl">Prevoženo</div><div class="big" style="margin-top:6px">1.284<small style="font-size:15px"> km</small></div></div><div class="card"><div class="lbl">Zmage</div><div class="big" style="margin-top:6px;color:var(--gold)">37<small style="font-size:15px;color:#fff"> / 112</small></div></div></div>
    <div class="card" style="padding:0;height:118px;display:flex;align-items:flex-end;background:linear-gradient(0deg,rgba(5,10,18,.92),rgba(5,10,18,.1) 70%),url(${TR('toskana')}) center/cover"><div style="padding:10px 12px"><div class="lbl" style="color:#fff">Najljubša proga</div><div class="mid">Toskana, Italija</div><div class="sm" style="color:#dfe6f1">23 dirk · najboljši krog 1:42,3</div></div></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[['Stopničke', '58'], ['Čas vožnje', '21 h'], ['Najvišja', '287 km/h'], ['Proge', '41/104'], ['Medalje', '19'], ['Najdaljši skok', '34 m']].map(c => `<div class="card" style="padding:8px 10px"><b style="font:900 italic 17px/1 M">${c[1]}</b><div class="sm" style="font-size:10.5px;margin-top:4px">${c[0]}</div></div>`).join('')}</div></div>`,
    side(1, 'Tri velike ploščice', ['Kilometri, zmage in najljubša proga na vrhu', 'Najljubša proga = največ dirk, s sliko proge', 'Ostale številke v manjši mreži pod njimi'], true)],
  ['statistika-2', `<div class="ph">${head('Profil', 'Voznik in številke')}<div class="card" style="padding:0;height:250px;background:linear-gradient(0deg,rgba(5,10,18,.95) 30%,rgba(5,10,18,.15)),url(${TR('furka')}) center/cover;display:flex;flex-direction:column;justify-content:flex-end"><div style="padding:14px"><span class="chip g">RAVEN 12</span><div class="big" style="margin:8px 0 2px">VOZNIK 1</div><div class="sm" style="color:#dfe6f1">Najljubša proga: Furka, Švica · 18 dirk</div><div class="row" style="margin-top:12px;gap:18px">${[['1.284 km', 'prevoženo'], ['37', 'zmag'], ['58', 'stopničk']].map(c => `<div><b class="mid">${c[0]}</b><div class="sm">${c[1]}</div></div>`).join('')}</div></div></div>
    ${[['Čas vožnje', '21 h 14 min'], ['Najvišja hitrost', '287 km/h'], ['Proge', '41 od 104'], ['Medalje', '7 zlatih · 8 srebrnih · 4 bronaste']].map(r => `<div class="row" style="padding:7px 4px;border-bottom:1px solid var(--line)"><span class="sm grow" style="font-size:13px">${r[0]}</span><b style="font:800 italic 14px/1 M">${r[1]}</b></div>`).join('')}</div>`,
    side(2, 'Kartica voznika', ['Velika kartica s sliko najljubše proge v ozadju', 'Ime voznika ostane »Voznik 1« ali po izbiri igralca', 'Ostalo v preprostem seznamu']) ],
  ['statistika-3', `<div class="ph">${head('Statistika', 'Zadnjih 8 tednov')}<div class="card"><div class="row"><div class="grow"><div class="lbl">Kilometri na teden</div><div class="mid" style="margin-top:4px">1.284 km skupaj</div></div><span class="chip c">+12 %</span></div><div class="row" style="align-items:flex-end;height:110px;gap:8px;margin-top:10px">${[30, 52, 41, 78, 64, 90, 58, 100].map((h, i) => `<div style="flex:1;height:${h}%;border-radius:5px 5px 2px 2px;background:${i === 7 ? 'var(--gold)' : 'rgba(63,208,255,.55)'}"></div>`).join('')}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="card"><div class="lbl">Zmage</div><div class="big" style="margin-top:6px">37</div><div class="sm">33 % dirk</div></div><div class="card"><div class="lbl">Najljubša proga</div><div class="mid" style="margin-top:6px">Toskana</div><div class="sm">Italija · 23 dirk</div></div></div>
    ${[['Stopničke', '58'], ['Čas vožnje', '21 h'], ['Proge', '41/104']].map(r => `<div class="row" style="padding:7px 4px;border-bottom:1px solid var(--line)"><span class="sm grow" style="font-size:13px">${r[0]}</span><b style="font:800 italic 14px/1 M">${r[1]}</b></div>`).join('')}</div>`,
    side(3, 'Graf po tednih', ['Stolpci kilometrov za zadnjih 8 tednov', 'Pod grafom zmage in najljubša proga', 'Potrebuje novo beleženje po tednih']) ],
];

// ---------------------------------------------------------------- (c) izvoz in uvoz
const fileRow = `<div class="card row"><svg viewBox="0 0 24 24" width="34" height="34" style="flex:none"><path d="M6 2h8l5 5v15H6z" fill="#dfe6f1"/><path d="M14 2v5h5" fill="#9fb3d6"/></svg><div class="grow"><b style="font:900 italic 14px/1.1 M">profil-2026-11-25.rra</b><div class="sm">41 prog · 37 zmag · 6 avtov · 48 KB</div></div></div>`;
const optsC = [
  ['izvoz-1', `<div class="ph">${head('Shranjena igra', 'Napredek v datoteko in nazaj')}<div class="card"><div class="lbl">Zadnji izvoz</div><div class="mid" style="margin-top:5px">pred 3 dnevi</div><div class="sm">Od takrat 6 dirk: izvozi znova</div></div>
    <div class="btn">⬇ IZVOZI V DATOTEKO</div><div class="btn s">⬆ UVOZI IZ DATOTEKE</div><div class="sm" style="text-align:center">Datoteko shrani v telefon ali pošlji sebi; z njo napredek preneseš na drugo napravo.</div>
    <div class="dim" style="top:auto;height:300px;background:linear-gradient(0deg,rgba(3,6,12,.9) 70%,transparent)"><div class="dlg"><b class="mid">Uvozim profil?</b>${fileRow}<div class="sm">Trenutni napredek se prej shrani v kopijo, zato ga lahko vrneš.</div><div class="row"><div class="btn s grow">PREKLIČI</div><div class="btn grow">UVOZI</div></div></div></div></div>`,
    side(1, 'Svoj zaslon v profilu', ['Dve veliki tipki: izvozi in uvozi', 'Pred uvozom okno z vsebino datoteke', 'Pred uvozom se trenutni napredek shrani v kopijo'], true)],
  ['izvoz-2', `<div class="ph">${head('Nastavitve', 'Igra')}${[['Jezik', 'Slovenščina'], ['Enote', 'km/h'], ['Zvok', '80 %'], ['Upravljanje', 'Tipke']].map(r => `<div class="row" style="padding:12px 4px;border-bottom:1px solid var(--line)"><span class="grow" style="font:600 15px/1 M">${r[0]}</span><span class="sm" style="font-size:14px">${r[1]} ›</span></div>`).join('')}
    <div class="lbl" style="margin-top:8px">Shranjena igra</div><div class="card" style="padding:0">${[['Izvozi v datoteko', 'zadnjič pred 3 dnevi'], ['Uvozi iz datoteke', 'zamenja trenutni napredek'], ['Varnostne kopije', '2 kopiji']].map((r, i) => `<div class="row" style="padding:13px 12px;${i ? 'border-top:1px solid var(--line)' : ''}"><div class="grow"><b style="font:800 italic 15px/1 M">${r[0]}</b><div class="sm" style="margin-top:3px">${r[1]}</div></div><span style="color:var(--cyan);font:900 18px M">›</span></div>`).join('')}</div></div>`,
    side(2, 'Vrstica v nastavitvah', ['Izvoz in uvoz kot razdelek »Shranjena igra«', 'Ne zavzame mesta v glavnem meniju', 'Težje najti za nove igralce']) ],
  ['izvoz-3', `<div class="ph" style="justify-content:flex-end;background:linear-gradient(0deg,rgba(8,18,31,.95) 35%,rgba(8,18,31,.1) 75%),url(${TR('koli')}) center/cover"><div class="card" style="border-color:rgba(255,198,41,.6)"><div class="row"><svg viewBox="0 0 24 24" width="30" height="30" style="flex:none"><path d="M6 2h8l5 5v15H6z" fill="#ffc629"/></svg><div class="grow"><b style="font:900 italic 15px/1.1 M">Shrani napredek v datoteko?</b><div class="sm">6 dirk od zadnjega izvoza</div></div></div><div class="row" style="margin-top:10px"><div class="btn s grow" style="padding:11px">KASNEJE</div><div class="btn grow" style="padding:11px">IZVOZI</div></div></div>
    <div class="btn r" style="font-size:20px;padding:18px">DIRKA</div><div class="row"><div class="btn s grow">KARIERA</div><div class="btn s grow">PROFIL</div></div></div>`,
    side(3, 'Opomnik na naslovnem zaslonu', ['Po 5 dirkah pasica »Shrani napredek v datoteko?«', '»Kasneje« jo skrije za 7 dni', 'Uvoz ostane v profilu ali nastavitvah']) ],
];

// ---------------------------------------------------------------- (d) varnostna kopija
const copy = (n, when, what, cur) => `<div class="card row" style="${cur ? 'border-color:rgba(63,208,255,.55)' : ''}"><div style="width:42px;height:42px;border-radius:10px;background:${cur ? 'rgba(63,208,255,.18)' : 'rgba(255,255,255,.08)'};display:grid;place-items:center;font:900 italic 19px M;color:${cur ? 'var(--cyan)' : '#dfe6f1'};flex:none">${n}</div><div class="grow"><b style="font:900 italic 15px/1.1 M">${when}</b><div class="sm" style="margin-top:3px">${what}</div></div><span class="chip ${cur ? 'c' : ''}" style="padding:7px 9px">OBNOVI</span></div>`;
const optsD = [
  ['kopija-1', `<div class="ph">${head('Varnostne kopije', 'Samodejno · zadnji dve')}<div class="card"><div class="row"><span class="chip l">VKLOPLJENO</span><span class="sm grow" style="text-align:right">po vsaki končani dirki</span></div><div class="sm" style="margin-top:8px;font-size:13px;color:#dfe6f1">Igra po vsaki dirki shrani kopijo napredka v telefon. Ob tretji se najstarejša izbriše.</div></div>
    ${copy(1, 'Danes ob 14.32', 'po dirki Furka, Švica · 41 prog · 37 zmag', true)}${copy(2, 'Danes ob 14.05', 'po dirki Toskana, Italija · 41 prog · 36 zmag')}
    <div class="dim" style="top:auto;height:220px;background:linear-gradient(0deg,rgba(3,6,12,.92) 70%,transparent)"><div class="dlg"><b class="mid">Obnovim kopijo 2?</b><div class="sm">Napredek se vrne na danes ob 14.05. Dirka na Furki se izgubi.</div><div class="row"><div class="btn s grow">PREKLIČI</div><div class="btn grow">OBNOVI</div></div></div></div></div>`,
    side(1, 'Po vsaki dirki', ['Kopija po vsaki končani dirki, hranita se zadnji dve', 'Ob obnovi okno, ki pove, kaj se izgubi', 'Najmanj izgube, a obe kopiji sta lahko iz istega dne'], true)],
  ['kopija-2', `<div class="ph">${head('Varnostne kopije', 'Samodejno · zadnji dve')}<div class="card"><div class="row"><span class="chip l">VKLOPLJENO</span><span class="sm grow" style="text-align:right">enkrat na dan</span></div><div class="sm" style="margin-top:8px;font-size:13px;color:#dfe6f1">Ob prvem zagonu dneva igra shrani kopijo. Hranita se zadnja dva dneva.</div></div>
    ${copy(1, 'Danes, 25. 11.', 'ob zagonu 9.12 · 41 prog · 35 zmag', true)}${copy(2, 'Včeraj, 24. 11.', 'ob zagonu 18.40 · 39 prog · 33 zmag')}<div class="sm" style="text-align:center;margin-top:6px">Kopija pred uvozom in obnovo ostane posebej.</div></div>`,
    side(2, 'Enkrat na dan', ['Kopija ob prvem zagonu dneva (kot zdaj), a samo dve', 'Kopiji iz dveh različnih dni', 'Izgubi se lahko cel dan dirk']) ],
  ['kopija-3', `<div class="ph">${head('Varnostne kopije', 'Pred velikimi spremembami')}<div class="card"><div class="sm" style="font-size:13px;color:#dfe6f1">Kopija se shrani pred nakupom avta, pred uvozom datoteke in pred začetkom novega prvenstva.</div></div>
    ${copy(1, 'Pred nakupom: LEV R', 'danes ob 14.32 · 48.200 kovancev', true)}${copy(2, 'Pred uvozom datoteke', 'včeraj ob 20.11 · 39 prog')}
    <div class="lbl" style="margin-top:6px">Kdaj</div>${['Nakup avta ali nadgradnje', 'Uvoz datoteke', 'Novo prvenstvo'].map(t => `<div class="row" style="padding:8px 4px;border-bottom:1px solid var(--line)"><span class="grow" style="font:600 14px M">${t}</span><span class="chip l">✓</span></div>`).join('')}</div>`,
    side(3, 'Pred velikimi spremembami', ['Kopija pred nakupom, uvozom in novim prvenstvom', 'Ime kopije pove, pred čim je nastala', 'Navadne dirke se ne shranjujejo posebej']) ],
];

// ---------------------------------------------------------------- (e) primerjava avtov
const CARS = { levr: ['LEV R', 'reli', 300, 1230, 'AWD'], gams: ['GAMS RH', 'reli', 330, 1260, 'AWD'], sokol: ['SOKOL R', 'športni', 250, 1260, 'FR'], orel: ['OREL GT3', 'dirkalni', 410, 1280, 'MR'], kuna: ['KUNA S', 'mali', 255, 1190, 'FF'] };
const kwt = (c) => Math.round(c[2] / c[3] * 1000);
const optsE = [
  ['primerjava-1', `<div class="ph">${head('Primerjava', 'Garaža · dva avta')}<div class="row" style="gap:8px">${[CARS.levr, CARS.orel].map((c, i) => `<div class="card grow" style="text-align:center;${i ? '' : 'border-color:rgba(63,208,255,.55)'}"><svg viewBox="0 0 120 44" width="100%" height="50"><path d="M8 34 L18 22 L42 16 L74 16 L96 24 L112 28 L112 34 Z" fill="${i ? '#e63b2e' : '#3fd0ff'}"/><circle cx="30" cy="35" r="7" fill="#1b2230" stroke="#9fb0c3" stroke-width="2"/><circle cx="92" cy="35" r="7" fill="#1b2230" stroke="#9fb0c3" stroke-width="2"/></svg><b style="font:900 italic 16px/1.1 M">${c[0]}</b><div class="sm">${c[1]}</div></div>`).join('')}</div>
    ${[['Moč', 'kW', 2, 450], ['Masa', 'kg', 3, 1500], ['Moč na tono', 'kW/t', -1, 340]].map(r => { const a = r[2] < 0 ? kwt(CARS.levr) : CARS.levr[r[2]], b = r[2] < 0 ? kwt(CARS.orel) : CARS.orel[r[2]]; return `<div class="card"><div class="row"><span class="lbl grow">${r[0]}</span></div><div class="row" style="margin-top:7px"><b style="font:900 italic 15px/1 M;width:70px;color:var(--cyan)">${a}</b><div class="bar grow" style="transform:scaleX(-1)"><i style="width:${a / r[3] * 100}%"></i></div><div class="bar grow"><i style="width:${b / r[3] * 100}%;background:var(--curb)"></i></div><b style="font:900 italic 15px/1 M;width:70px;text-align:right;color:#ff6a5e">${b}</b></div><div class="sm" style="text-align:center;margin-top:3px">${r[1]}</div></div>`; }).join('')}
    <div class="card row"><span class="lbl grow">Pogon</span><span class="chip c">AWD · vsa štiri</span><span class="chip" style="background:rgba(230,59,46,.25);color:#ff8a80">MR · zadaj, motor v sredini</span></div></div>`,
    side(1, 'Dva avta drug ob drugem', ['Izbrani avto levo, drugi desno', 'Moč, masa, moč na tono z vrsticami; pogon z besedo', 'Podatki iz garaže, fizika se ne spreminja'], true)],
  ['primerjava-2', `<div class="ph">${head('Primerjava', 'Vsi avti v garaži')}<div class="tabs"><span>Ime</span><span class="on">Moč ▾</span><span>Masa</span><span>Pogon</span></div>
    <div class="card" style="padding:4px 0">${[CARS.orel, CARS.gams, CARS.levr, CARS.kuna, CARS.sokol].map((c, i) => `<div class="row" style="padding:11px 12px;${i ? 'border-top:1px solid var(--line)' : ''};${c === CARS.levr ? 'background:rgba(63,208,255,.1)' : ''}"><div class="grow"><b style="font:900 italic 14px/1 M">${c[0]}</b><div class="sm" style="margin-top:2px">${c[1]}</div></div><b style="font:800 italic 14px M;width:62px;text-align:right">${c[2]} kW</b><span class="sm" style="width:66px;text-align:right;font-size:13px">${c[3]} kg</span><span class="chip" style="width:42px;text-align:center">${c[4]}</span></div>`).join('')}</div><div class="sm" style="text-align:center">Dotik stolpca razvrsti; dotik vrstice odpre avto.</div></div>`,
    side(2, 'Tabela vseh avtov', ['Vsi avti v garaži v eni tabeli', 'Razvrščanje po moči, masi ali pogonu', 'Hiter pregled, a brez slik avtov']) ],
  ['primerjava-3', `<div class="ph" style="justify-content:flex-end;background:radial-gradient(70% 40% at 50% 38%,#2a3f5f,#0b192b 70%)"><svg viewBox="0 0 240 90" width="100%" height="150" style="position:absolute;top:70px;left:0"><path d="M16 68 L36 44 L84 32 L148 32 L192 48 L224 56 L224 68 Z" fill="#3fd0ff"/><circle cx="60" cy="70" r="14" fill="#1b2230" stroke="#9fb0c3" stroke-width="3"/><circle cx="184" cy="70" r="14" fill="#1b2230" stroke="#9fb0c3" stroke-width="3"/></svg><div style="position:absolute;top:16px;left:14px;right:14px">${head('LEV R', 'reli · v garaži')}</div>
    <div class="card"><div class="lbl">Proti avtu, ki ga voziš zdaj (SOKOL R)</div>${[['Moč', '300 kW', '+50', 1], ['Masa', '1.230 kg', '−30', 1], ['Moč na tono', '244 kW/t', '+46', 1], ['Pogon', 'AWD', 'prej FR', 0]].map(r => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="grow" style="font:600 14px M">${r[0]}</span><b style="font:800 italic 14px M">${r[1]}</b><span class="chip ${r[3] ? 'l' : ''}" style="width:62px;text-align:center">${r[2]}</span></div>`).join('')}</div><div class="btn">VOZI TA AVTO</div></div>`,
    side(3, 'Razlike na kartici avta', ['Ob vsakem avtu razlika do avta, ki ga voziš', 'Zelena = več moči ali manj mase', 'En avto naenkrat, brez posebnega zaslona']) ],
];

// ---------------------------------------------------------------- (f) priporočen avto
const optsF = [
  ['priporocen-1', `<div class="ph">${head('Izberi avto', 'za Ouninpohja, Finska · makadam')}${[[CARS.levr, 1], [CARS.gams, 0], [CARS.sokol, 0], [CARS.kuna, 0]].map(([c, r]) => `<div class="card row" style="${r ? 'border:2px solid var(--gold)' : ''}"><svg viewBox="0 0 120 44" width="90" height="34" style="flex:none"><path d="M8 34 L18 22 L42 16 L74 16 L96 24 L112 28 L112 34 Z" fill="${r ? '#ffc629' : '#9fb0c3'}"/><circle cx="30" cy="35" r="7" fill="#1b2230"/><circle cx="92" cy="35" r="7" fill="#1b2230"/></svg><div class="grow"><b style="font:900 italic 15px/1.1 M">${c[0]}</b><div class="sm">${c[1]} · ${c[2]} kW · ${c[4]}</div></div>${r ? '<span class="chip g">ZA TO PROGO</span>' : ''}</div>`).join('')}<div class="card"><div class="sm" style="color:#dfe6f1;font-size:13px"><b style="color:var(--gold)">Zakaj LEV R?</b> Makadam in skoki: pogon na vsa štiri kolesa in reli vzmetenje.</div></div></div>`,
    side(1, 'Pri izbiri avta', ['Ko je proga izbrana, garaža označi avto »Za to progo«', 'Pod seznamom kratek razlog', 'Priporoča samo iz avtov, ki jih imaš'], true)],
  ['priporocen-2', `<div class="ph">${head('Izberi progo', 'Evropa · 34 prog')}${[['furka', 'Furka, Švica', 'asfalt · ozki ovinki', 'KUNA S', 'mali, lahek'], ['ouninpohja', 'Ouninpohja, Finska', 'makadam · skoki', 'LEV R', 'reli, AWD'], ['nring', 'Nürburg, Nemčija', 'asfalt · dolga in hitra', 'OREL GT3', 'dirkalni']].map((t, i) => `<div class="card" style="padding:0;${i === 1 ? 'border:2px solid var(--cyan)' : ''}"><div class="trk" style="height:92px;border-radius:0;background-image:linear-gradient(0deg,rgba(5,10,18,.9),transparent 70%),url(${TR(t[0])});display:flex;align-items:flex-end;padding:8px 12px"><div><b class="mid">${t[1]}</b><div class="sm" style="color:#dfe6f1">${t[2]}</div></div></div><div class="row" style="padding:8px 12px"><span class="chip g">PRIPOROČENO</span><b class="grow" style="font:900 italic 14px M">${t[3]}</b><span class="sm">${t[4]}</span></div></div>`).join('')}</div>`,
    side(2, 'Na kartici proge', ['Pod vsako progo vrstica »Priporočeno« z avtom', 'Kratek razlog: podlaga, ovinki, dolžina', 'Lahko tudi avto, ki ga še nimaš']) ],
  ['priporocen-3', `<div class="ph" style="justify-content:flex-end;background:linear-gradient(0deg,rgba(8,18,31,.97) 55%,rgba(8,18,31,.1)),url(${TR('ouninpohja')}) center/cover"><div style="position:absolute;top:16px;left:14px;right:14px">${head('Ouninpohja, Finska', 'Pred štartom')}</div><div class="lbl">Predlogi za to progo</div>${[['NAJBOLJŠI', CARS.levr, 'v garaži'], ['HITREJŠI', CARS.gams, 'kupi · 62.000'], ['LAŽJI', CARS.kuna, 'v garaži']].map((p, i) => `<div class="card row" style="${i ? '' : 'border:2px solid var(--gold)'}"><span class="chip ${i ? '' : 'g'}" style="width:76px;text-align:center">${p[0]}</span><div class="grow"><b style="font:900 italic 15px/1.1 M">${p[1][0]}</b><div class="sm">${p[1][1]} · ${p[1][4]}</div></div><span class="sm">${p[2]}</span></div>`).join('')}<div class="row"><div class="btn s grow">SVOJ AVTO</div><div class="btn r grow">ŠTART</div></div></div>`,
    side(3, 'Zaslon pred štartom', ['Trije predlogi: najboljši, hitrejši, lažji', 'Lahko tudi avto, ki ga še nimaš (nakup)', 'En korak več pred vsako dirko']) ],
];

const ALL = [...optsA, ...optsB, ...optsC, ...optsD, ...optsE, ...optsF];
const br = await chromium.launch();
const pg = await br.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 2 });
for (const [id, ph, sd] of ALL) {
  writeFileSync(OUT + '/_maketa.html', `<!doctype html><html lang="sl"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${ph}${sd}</body></html>`);
  await pg.goto('file://' + OUT + '/_maketa.html', { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: OUT + '/' + id + '.png' });
}
await br.close();
console.log(ALL.length + ' maket v ' + OUT);
