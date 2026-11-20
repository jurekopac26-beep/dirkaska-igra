# Realizem, paket P · Poškodbe (16 sej)

Del `docs/realizem.md` (razdeljen po paketih 11. 11. 2026, ukrep 5 »Manj sklopov«, `docs/varcevanje.md`). Odločitve uporabnika, proge, postopek, pravna ocena, čas in vrsta so v `docs/realizem.md`.


Najboljše poškodbe so v igri že zdaj, a izklopljene (Nastavitve, Razbijanje). Paket jih vklopi in doda, kar se ob trku v resnici zgodi najprej.

**Privzeto samo videz** (izbira uporabnika): avto je zmečkan, vozi pa kot nepoškodovan. V Nastavitvah je izbira **Izklop / Samo videz / Vklop**:
- **Izklop:** brez poškodb.
- **Samo videz:** privzeto.
- **Vklop:** tudi vpliv na vožnjo.

**Začetek:** ko so na `main` #460 in #480 (avti) in deli iz garaže na vseh avtih po meniju #516. #322 je na `main` od 8. 11. Ocena začetka je ~16. 11. pri dveh računih oziroma ~22. 11. pri enem (linija za E).

**Vrstni red:** P1 → P4 → P2 → P5 → P3 → P6, **v enem pull requestu skupaj s Trki (#608)** (odločitev uporabnika 10. 11. 2026 ob ~23.30 prek Mateja, tabla #382); prej 4 pull requesti (P1, P4 + P2, P5 + P3, P6).

| Korak | Kaj | Samo videz (privzeto) | Vklop | Telefon | Seje |
|---|---|---|---|---|---|
| P1 Novi način poškodb privzeto | vklopijo se obstoječa stikala Razbijanja: gostejše telo z udrtinami, steklo, ki poči, odrgnjena barva, deli na cesti; namesto 11 stikal ena nastavitev podrobnosti (preproste / podrobne); drobci stekla in barve 1–3 cm | ves videz | enako | polno telo samo za igralca in 5 najbližjih avtov (predlog, ~+15 klicev); vsi razbiti avti s polnim telesom 221 → 283 klicev | 1 |
| P4 Sledi trkov in pravi delci | na avtu barva drugega avta ali siva odrgnina od zidu; na cesti drobni črni koščki plastike, drobci stekla, luske barve; iskre in brazde, ko podvozje drgne po tleh | ves videz | enako | +1–2 klica (vsi delci v enem nizu) | 1–2 |
| P2 Motor: para, pregrevanje, olje | para iz hladilnika pri 15–30 % poškodbe (zdaj dim šele nad 45 %), oljni dim in madeži | para in dim | še pregrevanje: motor izgublja moč in se ustavi | 0 (sistem dima) | 1–2 |
| P5 Steklo in luči | vetrobransko steklo poči v pajčevino in ostane; stranska in zadnja razpadejo v kocke; žaromet poči, luč ugasne ali sveti postrani | ves videz; steklo na cesti ne vzame oprijema | steklo na cesti vzame največ 5 % oprijema (zdaj 20 %, ko je vklopljeno Razbijanje) | 0 | 1 |
| P3 Kolesa in obese | zvita spona ali platišče, nagnjeno kolo, povešen vogal, iskre pod podvozjem | kolo je vidno zvito | avto vleče na stran, pri hitrosti trese | 0 | 1–2 |
| P6 Karoserija kot pri testih trkov | močan čelni trk skrajša prednji del za 0,4–0,7 m, pokrov se zloži v obrnjen V, pri trku z vogalom gre kolo nazaj, kabina ostane cela | skrajša se samo telo | enako | 0 | 2–3 |

P6 ima visoko tveganje (testi trkov, tekmeci in reference), zato je zadnji.

**Obremenitev telefona**, merjeno 8. 11. 2026 na Bathurstu, preden je šel na odločanje:
- dirkališče z 20 avti na štartu;
- nastavitve za telefon: 844 × 390, kakovost normalna, detajli avtov nizki, sence;
- »po trkih« pomeni šest udarcev na avto, povprečno 46 % poškodbe.

Nadaljnje meritve so na Spa.

| Način | Klici, nepoškodovani | Klici po trkih | Oglišča po trkih |
|---|---|---|---|
| Zdaj (privzeto) | 210 | 221 | 681 tisoč |
| Vse Razbijanje vklopljeno | 260 | 283 | 702 tisoč |
| Samo novo telo | 260 | 283 | 694 tisoč |
| Predlog P1: polno telo za igralca in 5 najbližjih (ocena) | ~225 | ~236 | ~690 tisoč |
| Meja proge (`CLAUDE.md`) | ~300 | ~300 | ~900 tisoč |

Čas sličice v brskalniku brez grafične kartice je preveč nemiren za sklepe. Pri 120 udarcih hkrati se prve sličice v obeh načinih zataknejo do ~1 s; to je treba preveriti na telefonu.

- **Datoteke:**
  - `js/render.js` (telo, steklo, para, delci, kolesa);
  - `js/core.js` (model poškodb, vpliv na vožnjo pri »Vklop«);
  - `js/game.js` (Nastavitve);
  - `js/lang.js` (prevodi).

  `js/world.js` ostane nespremenjen.
- **Tveganje:**
  - klici risanja pri polju razbitih avtov (283 od ~300);
  - vpliv na vožnjo pri »Vklop« spremeni čase krogov in teste voženj (privzeto ga ni);
  - začetek je odvisen od #460, #480 in #516.
