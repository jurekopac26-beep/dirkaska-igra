// Nicknames on the world board (docs/svetovna-lestvica.md, »Vzdevki«; README.md here, »Vzdevki«), checked when a player sets one (POST
// /v1/vzdevek). Its shape: 3 to 16 letters, digits, spaces, dots, dashes and underscores, a letter at least, no marks piled on a letter, no
// long number; the letters of one alphabet (Latin, Cyrillic or Greek: they have letters that look alike; a name in another script is not
// checked further), a Latin name's letters all ones that read as a–z. Not a link, not a name the board uses itself (»Voznik A1B2« of a
// hidden name, the keepers'). No rude word in it, also spelled around: digits for letters, letters doubled, spaces or dots between them,
// marks over them, Cyrillic or Greek letters for the Latin ones that look the same, words joined in capitals. The rude words: an open list
// in 16 languages (LDNOOBW, CC BY 4.0: the root README.md, »Zasluge«) and this server's own (Slovene, Croatian, Serbian, German, Italian,
// Russian), in besede.js as rot13 (not read by chance; .ignore keeps it out of searches). A rude name that gets through: three reports hide it, the
// keeper bans it (tools/lestvica-skrbnik.mjs).
import { cleanName } from './ovoj.js';
import { PODNIZI, BESEDE } from './besede.js';

export const MIN = 3, MAX = 16;
const rot13 = (w) => w.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0) - 84) % 26 + 97));
export const odkodiraj = (s) => s.split(/\s+/).filter(Boolean).map(rot13);   // (besede.js's lists as words; also the tests')

const tabela = (s) => { const m = {}; const a = s.split(' '); for (let i = 0; i < a.length; i += 2) m[a[i]] = a[i + 1] === '-' ? '' : a[i + 1]; return m; };
// Latin letters of their own (NFD does not split them) as a–z; the Cyrillic ones with a mark, before NFD takes it off
const POSEBNE = tabela('ß ss đ dj æ ae ø o ł l œ oe þ th ð d ı i ħ h ŧ t ŋ n ĸ k ſ s ŀ l ƒ f ɡ g ȷ j');
const PRED = tabela('й y ё e ї i ў u');
// Cyrillic and Greek as they are read (A) and as they look (B: the letters that look like a Latin one; the others as read)
const CIR_A = tabela('а a б b в v г g д d е e ж zh з z и i к k л l м m н n о o п p р r с s т t у u ф f х kh ц c ч ch ш sh щ shch ъ - ы y ь - э e ю yu я ya ј j љ lj њ nj ћ c ђ dj џ dz ѕ dz і i є e ґ g ӏ l');
const GR_A = tabela('α a β b γ g δ d ε e ζ z η i θ th ι i κ k λ l μ m ν n ξ x ο o π p ρ r σ s ς s τ t υ y φ f χ ch ψ ps ω o');
const CIR_B = tabela('а a в b е e к k м m н h о o п n р p с c т t у y х x ш w ь b ъ b і i ј j ѕ s ԁ d ӏ l ԛ q ԝ w');
const GR_B = tabela('α a β b ε e η n ι i κ k ν v ο o ρ p τ t υ u χ x ω w γ y');
const MAPA_A = { ...POSEBNE, ...CIR_A, ...GR_A }, MAPA_B = { ...MAPA_A, ...CIR_B, ...GR_B };
// digits for letters: none (a digit splits words), 1 as i, 1 as l
const LEET = tabela('0 o 1 i 3 e 4 a 5 s 7 t 8 b 9 g'), LEETS = [null, LEET, { ...LEET, 1: 'l' }];

const osnova = (s) => s.normalize('NFKC').toLowerCase().replace(/[йёїў]/g, c => PRED[c]).normalize('NFD').replace(/\p{M}/gu, '');
// a text's letters a–z (B: the other alphabets as they look; leet: digits as letters), anything else a space
export function crke(s, B, leet) {
  const m = B ? MAPA_B : MAPA_A; let o = '';
  for (const c of osnova(s)) o += m[c] ?? (leet && leet[c]) ?? (c >= 'a' && c <= 'z' ? c : ' ');
  return o;
}
// a list's word as the lists keep it: its letters, joined (a phrase as one word)
export const kljuc = (w) => crke(String(w), false, null).replace(/ /g, '');
// the ways a name is read: each of its words (also split at capitals) and all its letters joined, for both readings of the other
// alphabets and the three of digits
export function oblike(ime) {
  const camel = ime.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2'), out = [], seen = new Set();
  for (const B of [false, true]) for (const leet of LEETS) {
    const a = crke(ime, B, leet), b = camel === ime ? a : crke(camel, B, leet), k = a + '|' + b;
    if (seen.has(k)) continue; seen.add(k);
    out.push({ besede: [...new Set((a + ' ' + b).split(' ').filter(Boolean))], skupaj: a.replace(/ /g, '') });
  }
  return out;
}

// a word's letters with the runs of one letter counted ('fuuck': 'fuck', [1, 2, 1, 1]): a list's word matches a word with each run as long
// or longer, also with an s or more after it (the plural); the substrings' words as patterns (each letter once or more)
const zgosti = (w) => { let c = ''; const r = []; for (const ch of w) { if (c && c[c.length - 1] === ch) r[r.length - 1]++; else { c += ch; r.push(1); } } return { c, r }; };
function mapa(words) { const M = new Map(); for (const w of words) { const { c, r } = zgosti(w); if (!M.has(c)) M.set(c, []); M.get(c).push(r); } return M; }
const vzorec = (w) => { const { c, r } = zgosti(w); return new RegExp([...c].map((ch, i) => r[i] > 1 ? `${ch}{${r[i]},}` : `${ch}+`).join('')); };
function vMapi(M, t) {
  for (let w = t; w;) {
    const { c, r } = zgosti(w), e = M.get(c);
    if (e && e.some(k => k.every((n, i) => r[i] >= n))) return true;
    const s = w.replace(/s+$/, ''); if (s === w) return false; w = s;
  }
  return false;
}

// the names the board keeps for itself: words (a word of the name or all of it), parts of words, whole names
const ZASEDENO = ['admin', 'mod', 'moderator', 'support', 'podpora', 'sistem', 'system', 'staff', 'skrbnik'];
const ZASEDENO_DEL = ['administrator', 'moderator', 'official', 'uradn', 'realroadsatlas', 'apexracing', 'skrbnik'];
const ZASEDENO_IME = ['igralec', 'player', 'voznik', 'driver'];
const OZNAKA = /^(voznik|driver)\s*[#.-]?\s*([\w-]{4})$/i;   // (how the board shows a hidden name: »Voznik #A1B2«, its id's start in capitals)
// the whole name's letters and digits joined, as read and as it looks, and with digits read as letters (»Player 1« is not »player«)
function cela(ime) {
  const r = new Set();
  for (const B of [false, true]) {
    const m = B ? MAPA_B : MAPA_A; let o = '';
    for (const c of osnova(ime)) o += m[c] ?? c;
    r.add(o.replace(/[\s._-]/g, ''));
    for (const leet of LEETS.slice(1)) r.add(crke(ime, B, leet).replace(/ /g, ''));
  }
  return [...r];
}
let S = null;
const seznami = () => S || (S = { besede: mapa(odkodiraj(BESEDE)), podnizi: odkodiraj(PODNIZI).map(vzorec), zasedeno: mapa(ZASEDENO), zasedenoDel: ZASEDENO_DEL.map(vzorec) });

const OBLIKA = /^[\p{L}\p{M}\p{N} ._-]+$/u, CRKA = /\p{L}/u, ZNAKI = /\p{M}{3,}/u, STEVILO = /\p{N}{5,}/u;
const POVEZAVA = /(^|[^a-z])(www|https?)([^a-z]|$)|\.(com|net|org|info|io|gg|tv|ly|me|xyz|ru|de|si|hr|rs|ba|uk|eu|co|app|dev|link|club|live|online|site|store|shop|top|fun)([^a-z]|$)/i;
const PISAVE = ['Latin', 'Cyrillic', 'Greek'].map(s => ({ ima: new RegExp(`\\p{Script=${s}}`, 'u'), vse: new RegExp(`^(?:\\P{L}|\\p{Script=${s}})*$`, 'u') }));

// why a name cannot be one (null: it can): 'oblika' its shape, 'povezava' a link, 'zasedeno' the board's own, 'beseda' a rude word in it
export function razlog(v) {
  const ime = cleanName(v).normalize('NFC'), n = [...ime].length;
  if (n < MIN || n > MAX || !OBLIKA.test(ime) || !CRKA.test(ime) || ZNAKI.test(ime.normalize('NFD')) || STEVILO.test(ime)) return 'oblika';
  const p = PISAVE.filter(x => x.ima.test(ime));
  if (p.length > 1 || (p.length && !p[0].vse.test(ime))) return 'oblika';
  if (p[0] === PISAVE[0]) for (const c of osnova(ime)) if (CRKA.test(c) && !(c >= 'a' && c <= 'z') && !POSEBNE[c]) return 'oblika';
  if (POVEZAVA.test(ime) || POVEZAVA.test(crke(ime, true, null))) return 'povezava';
  const oz = OZNAKA.exec(ime);
  if ((oz && oz[2] === oz[2].toUpperCase()) || cela(ime).some(x => ZASEDENO_IME.includes(x))) return 'zasedeno';
  if (ime.replace(/[\s._-]/g, '').includes('1488')) return 'beseda';
  const L = seznami();
  for (const o of oblike(ime)) {
    const w = [...o.besede, o.skupaj];
    if (w.some(x => vMapi(L.zasedeno, x)) || L.zasedenoDel.some(re => re.test(o.skupaj))) return 'zasedeno';
    if (w.some(x => vMapi(L.besede, x)) || L.podnizi.some(re => re.test(o.skupaj))) return 'beseda';
  }
  return null;
}
// the name as kept (null: not allowed)
export function dovoljenoIme(v) { return razlog(v) ? null : cleanName(v).normalize('NFC'); }
