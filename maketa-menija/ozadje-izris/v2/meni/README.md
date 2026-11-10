# Ozadje v meniju (maketa)

Kako bi ozadja v2 (Medvode, Slovenija) izgledala na naslovnem zaslonu igre: nov meni z `main`, telefon 412 × 915 pokonci in 915 × 412 ležeče (posnetki v dvojni ločljivosti). Igra ni spremenjena: `posnetki.mjs` ozadje doda samo v brskalniku za posnetek (danes je za prosojnim naslovom `#s-title` prizor igre).

| Posnetki | Kaj kažejo |
|---|---|
| `pregled-pokonci.webp`, `pregled-lezece.webp` | na eni sliki: današnji meni in ozadja 1, 2, 3, postavljena za meni (spodaj) |
| `meni-zdaj-pokonci.webp`, `meni-zdaj-lezece.webp` | današnji meni: za naslovom je prizor igre |
| `kot-je-pokonci.webp`, `kot-je-lezece.webp` | slike v2, kot so, čez cel zaslon (1, 2, 3): pokonci plošča z gumbi pokrije avto in tablo (vidno ostane samo nebo), ležeče pokrije tablo |
| `meni-1-alpe-pokonci.webp`, `meni-2-hribi-pokonci.webp`, `meni-3-vecer-pokonci.webp` | slika v2 pokonci čez vso širino zaslona, pomaknjena tako, da so kolesa avta tik nad ploščo (slika ni na novo izrisana) |
| `meni-1-alpe-lezece.webp`, `meni-2-hribi-lezece.webp`, `meni-3-vecer-lezece.webp` | nov izris z lastnim kadrom za meni (`medvode-<v>-meni-lezece.webp`, 1600 × 900): širši objektiv (60° namesto 46°) in kader premaknjen v desno, zato sta avto in tabla v levi polovici, levo od plošče |

## Ugotovitve

- Plošča menija pokonci pokrije spodnji dve tretjini zaslona, ležeče desno polovico. Ozadje mora imeti avto in tablo v delu, ki ostane viden: pokonci v zgornji tretjini, ležeče v levi polovici (pod napisom igre levo zgoraj).
- Pokonci zadostuje postavitev obstoječe slike (polna širina, odmik od vrha izračunan iz položaja plošče, ker so telefoni različno visoki); pod sliko je barva njenega spodnjega roba, ki jo pokrije plošča.
- Ležeče potrebuje lasten izris: prizori `medvode-1-alpe-meni`, `medvode-2-hribi-meni` in `medvode-3-vecer-meni` v `../../prizori.json` (kader `shift_x`, širši pas travnika, oblakov in jase brez gozda, da desni del za ploščo ni prazen). Gore so zaradi širšega objektiva nekoliko manjše.
- Ležeče meni zatemni levi rob zaslona (`.scrim`: od 55 % ob robu do nič pri 30 % širine), prav tam, kjer je zdaj avto; pri 3 (pozno popoldne) je avto zato precej temen. Če ozadje postane slika, je zatemnitev lahko ožja ali šibkejša.

## Kako zagnati

```sh
# ležeči izris za meni (iz maketa-menija/ozadje-izris; isto za 2-hribi z dem-hribi.npz in za 3-vecer)
venv/bin/python izris.py medvode-1-alpe-meni --orient lezece --dem /pot/dem-medvode.npz --car /pot/jastreb-d81f2a.json --samples 80 --tmp /pot/tmp --out v2/meni/medvode-1-alpe-meni
# posnetki menija: GAME_ROOT je kopija igre z main, ki ima node_modules s playwright
GAME_ROOT=/pot/igra node maketa-menija/ozadje-izris/v2/meni/posnetki.mjs /pot/png
venv/bin/python maketa-menija/ozadje-izris/v2/meni/pregled.py /pot/png
```

Viri in licence so enaki kot v `../README.md`.
