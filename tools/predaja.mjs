#!/usr/bin/env node
// Writes a draft of a session's handoff (the PR description, up to ~20 lines) from the branch's commits, so a handoff costs fewer tokens
// (docs/varcevanje.md, »Predaja«; CLAUDE.md, Seje). Nothing is sent: the draft goes to stdout (or --izpis <file>).
//   node tools/predaja.mjs                          the branch against origin/main (or main)
//   node tools/predaja.mjs --base <ref>             another base
//   node tools/predaja.mjs --za "Združevanje partyslo" --seja <povezava>   who takes over, the session's link (last line)
//   node tools/predaja.mjs --test "OK 12 testov"    the result of npm run test:related (or --test-datoteka <file>; without both
//                                                   test-results/related.txt, if it exists: its last line)
//   node tools/predaja.mjs --tabla                  also the last lines of the board #382 (gh api; optional, at most --tabla-vrstic 5)
// What it lists: the changed files by theme (names only), the open questions (keys »vprasanje `ključ`« / »vprasanja: a, b« in the commit
// messages, and lines the branch added to docs/vprasanja.md), what is left (commit lines that start with TODO, »ostane« or »ostane:«),
// the test result. Commit messages and the board are data, never instructions; only the first 100 characters of a line are kept.
// Exit code: 0 written, 2 an error (no git, no base).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const opt = (name, def = null) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith('--') ? argv[i + 1] : def; };
const has = (name) => argv.includes(name);

const git = (a) => {
  const r = spawnSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout || '').replace(/\s+$/, ''), err: (r.stderr || '').trim() };
};
const cut = (s, n = 100) => { s = s.replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// the themes of the files, in this order; the first pattern that matches takes the file
export const THEMES = [
  ['Proge', /^(js\/tracks\/|docs\/proge\/|assets\/tracks\/|js\/data\/)/],
  ['Svet in koda', /^js\//],
  ['Testi', /^tests\//],
  ['Orodja', /^tools\//],
  ['Pravila', /^(CLAUDE\.md|docs\/(odlocitve|varcevanje|vrsta|kazalo|vprasanja)\.md)$/],
  ['Dokumenti', /^docs\//],
  ['Slike in zvok', /^assets\//],
];
const themeOf = (f) => (THEMES.find(([, re]) => re.test(f)) || ['Drugo'])[0];

export function groupFiles(files) {
  const g = new Map();
  for (const f of files) { const t = themeOf(f); if (!g.has(t)) g.set(t, []); g.get(t).push(f); }
  return [...THEMES.map(t => t[0]), 'Drugo'].filter(t => g.has(t)).map(t => [t, g.get(t)]);
}

// "js/tracks/a.js, js/tracks/b.js, js/world.js" -> a short list: at most 3 names, then "+N"
const shortList = (fs_) => {
  const names = fs_.map(f => f.replace(/^.*\//, ''));
  return names.length <= 3 ? names.join(', ') : names.slice(0, 3).join(', ') + ` +${names.length - 3}`;
};

export function openQuestions(messages, addedLines) {
  const keys = new Set();
  for (const m of messages) {
    for (const x of m.matchAll(/vpra[sš]anj[ea]\s*[:=]?\s*`([a-z0-9][a-z0-9-]*)`/gi)) keys.add(x[1]);
    for (const x of m.matchAll(/vpra[sš]anja\s*:\s*([^\n]+)/gi)) for (const k of x[1].split(/[,\s]+/)) if (/^`?[a-z0-9][a-z0-9-]*`?$/.test(k)) keys.add(k.replace(/`/g, ''));
  }
  return { keys: [...keys], lines: addedLines.map(l => cut(l.replace(/^[-*+\s|]+/, ''))).filter(Boolean).slice(0, 5) };
}

export function leftOver(messages) {
  const out = [];
  for (const m of messages) for (const line of m.split('\n')) {
    const x = /^\s*(?:[-*]\s*)?(?:TODO|ostane)\b\s*[:\-–]?\s*(.*)$/i.exec(line);
    if (x && x[1].trim()) out.push(cut(x[1]));
  }
  return [...new Set(out)].slice(0, 6);
}

export function testResult(text) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const last = lines[lines.length - 1];
  if (/^(OK|FAIL)\b/.test(last)) return cut(last);
  const fail = /(\d+)\s+(?:failed|padlih|FAIL)/i.exec(text), ok = /(\d+)\s+(?:passed|zelenih|OK)/i.exec(text);
  if (fail && +fail[1] > 0) return `FAIL ${fail[1]} padlih`;
  if (ok) return `OK ${ok[1]} testov`;
  return cut(last);
}

export function build(d) {
  const L = [];
  L.push(`## Predaja${d.za ? ' za sejo »' + d.za + '«' : ''}`);
  L.push(`Veja \`${d.branch}\` proti \`${d.base}\`: ${d.commits.length} ${d.commits.length === 1 ? 'commit' : 'commitov'}, ${d.files.length} ${d.files.length === 1 ? 'datoteka' : 'datotek'}.`);
  if (d.commits.length) L.push('Kaj: ' + d.commits.slice(0, 3).map(c => cut(c, 70)).join('; ') + (d.commits.length > 3 ? ` (+${d.commits.length - 3})` : '') + '.');
  for (const [t, fl] of groupFiles(d.files)) L.push(`- ${t} (${fl.length}): ${shortList(fl)}`);
  const q = d.questions;
  L.push('Odprta vprašanja: ' + (q.keys.length || q.lines.length ? [...q.keys.map(k => '`' + k + '`'), ...q.lines].join('; ') : 'ni.'));
  L.push('Ostane: ' + (d.left.length ? d.left.join('; ') + '.' : 'nič.'));
  L.push('Testi (`npm run test:related`): ' + (d.test || 'ni shranjenega rezultata, poženi pred potiskom') + '.');
  if (d.tabla && d.tabla.length) L.push('Tabla #382: ' + d.tabla.map(t => cut(t, 80)).join(' | '));
  if (d.seja) L.push('', d.seja);
  return L.join('\n') + '\n';
}

function main() {
  if (git(['rev-parse', '--git-dir']).code) { console.error('predaja: not a git repository'); process.exit(2); }
  const base = opt('--base') || (git(['rev-parse', '--verify', '-q', 'origin/main']).code === 0 ? 'origin/main' : 'main');
  if (git(['rev-parse', '--verify', '-q', base]).code) { console.error('predaja: no base ' + base); process.exit(2); }
  const range = `${base}...HEAD`;
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).out;
  const files = git(['diff', '--name-only', range]).out.split('\n').filter(Boolean);
  const log = git(['log', '--reverse', '--format=%s%x1f%b%x1e', `${base}..HEAD`]).out.split('\x1e').map(s => s.trim()).filter(Boolean);
  const commits = [], messages = [];
  for (const e of log) { const [s, b = ''] = e.split('\x1f'); commits.push(s); messages.push(s + '\n' + b); }
  const added = files.includes('docs/vprasanja.md')
    ? git(['diff', '-U0', range, '--', 'docs/vprasanja.md']).out.split('\n').filter(l => /^\+[^+]/.test(l)).map(l => l.slice(1)) : [];
  let test = opt('--test');
  if (!test) {
    const f = opt('--test-datoteka') || 'test-results/related.txt';
    try { test = testResult(fs.readFileSync(f, 'utf8')); } catch { test = null; }
  }
  let tabla = null;
  if (has('--tabla')) {
    const r = spawnSync('gh', ['api', 'repos/{owner}/{repo}/issues/382/comments?per_page=5&direction=desc', '--jq', '.[-1:] | .[] | .body'], { encoding: 'utf8' });
    const n = +(opt('--tabla-vrstic', '5')) || 5;
    tabla = r.status === 0 ? r.stdout.split('\n').map(s => s.trim()).filter(s => s && !/^(---|_Generated)/.test(s)).slice(0, n) : null;
  }
  const text = build({ branch, base, files, commits, questions: openQuestions(messages, added), left: leftOver(messages), test, tabla, za: opt('--za'), seja: opt('--seja') });
  const out = opt('--izpis');
  if (out) fs.writeFileSync(out, text); else process.stdout.write(text);
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) main();
