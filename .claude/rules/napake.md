---
paths:
  - "js/napake.js"
  - "css/napake.css"
  - "docs/orodje-za-napake.md"
  - "tests/browser/napake*.test.mjs"
  - "tools/posnetek.mjs"
---

# Orodje za napake (`docs/orodje-za-napake.md`)

- Načrt, odločitve, sklopi in Stanje so v `docs/orodje-za-napake.md`. Vsak sklop je svoja seja in svoja veja (`orodje-za-napake/sklop-NN-<ime>`), en pull request na sklop oziroma na združen korak (sklop 17 jih ima lahko več); na `main` gre z vlakom (CLAUDE.md, Postopek). Ob koncu sklopa posodobi Stanje in uporabniku napiši kratek seznam za preizkus na telefonu.
- Sklopi 1–17 in 3b so končani. Sklopa 0 in 8 ostaneta odložena, dokler uporabnik ne reče drugače (sklop 8 tik pred objavo na Google Play, skupaj z izbrisom testnih prog). Veriga sklopov (»Vseh 17 sklopov začni sam«, Pospešitev 27. 10.) je opisana v načrtu; ustavi jo, če uporabnik reče »stop«.
- Orodje je samo v slovenščini: je v `js/napake.js`, gradi svoj DOM in ne uporablja `tr()`, da ga `tests/lang.test.js` ne zahteva v angleščini.
- Repozitorij je javen: slik napak, zapiskov uporabnika in seznama napak ne shranjuj vanj.
