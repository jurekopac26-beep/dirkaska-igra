export const meta = {
  name: 'boksi-sklop',
  description: 'Implement a batch of chosen pit features on one branch: feature by feature, full verify, two-lens adversarial review, fix',
  whenToUse: 'args: {key, wt, branch, base, features:[{id,title,spec,journal}]}',
  phases: [
    { title: 'Build', detail: 'one agent per feature, sequential on the same worktree, each commits' },
    { title: 'Verify', detail: 'full Node tests, pit browser tests, perf/golden, images' },
    { title: 'Review', detail: 'two adversarial lenses on the whole diff' },
    { title: 'Fix', detail: 'apply confirmed findings, re-test, commit' },
  ],
}
const A = args
const S = '/tmp/claude-0/-home-user-dirkaska-igra/209706bf-5f59-5533-bd3b-6cc5d3378162/scratchpad'
const WF = '/root/.claude/projects/-home-user-dirkaska-igra/209706bf-5f59-5533-bd3b-6cc5d3378162/subagents/workflows'
const COMMON = `You work in the git worktree ${A.wt} (branch ${A.branch}, created from ${A.base}). Work ONLY there: do not edit /home/user/dirkaska-igra or any other worktree under ${S} (other agents work in them). Commit locally on ${A.branch} with a short Slovenian message ending with the two lines
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ber3FYMuScsadL4xwRzmy
Never push, never open a PR, never rewrite history. node_modules in the worktree is an untracked symlink: never git add it (stage explicit paths only).
The project's CLAUDE.md (in the worktree) applies; key points: only the chase camera (plus the film camera in the pits from PR #145 on branch claude/boksi-kamera); phone budget ~300 draw calls / ~900k vertices per track and no increase on tracks the feature does not concern; only geographic names, no brands/logos/sponsors; test tracks (test: true: jezero, riviera, gora, gozd, toskana, grom) are ignored; Slovenian UI with English in js/lang.js; after any js/ or css/ change run \`node tools/stamp.js\`; README.md (pit section) and tests/README.md updated for what you add. Match the surrounding code's style, naming and comment density (the comments are English inside Slovenian-named code; read nearby code first).
In the pits the autopilot always drives the car from the pit entry to ~1 s before the circuit (PR #145); the player never drives manually in the pit lane.
The 13 real tracks with pits: spa, rbring, bathurst, cpalace, longford, rio, montreal, newcastle, toronto, detroit, bangsaen, townsville, troisrivieres (Montreal, Toronto and Townsville build their pits in their own world-*.js; Bathurst, Rio, Red Bull Ring, Crystal Palace in buildRbring; others in world.js pitLaneScenery). Another agent is building a new pit-lane junction (decel/accel lanes at the pit entry/exit, core.js surface + AI turn-in, the pit-lane builders) on another branch: keep your edits to those exact places minimal so the branches merge easily.
The machine is shared and overloaded (4 CPUs): run targeted tests only (Node: \`node tests/<name>.test.js\`; browser: \`GAME_ROOT=${A.wt} node tests/browser/<name>.test.mjs\`), not the whole browser suite. The golden references (tests/golden: sim, races, world, perf) must stay deterministic: no Math.random in anything that feeds the simulation (use the race's seeded rng / hashes). If your change intentionally changes a reference, regenerate it with the repo tools (\`npm run golden:update\`, \`PERF_ONLY=<tracks> node tests/browser/perf.test.mjs --update\`), never by hand, and check the diff only touches what you expect. Never skip, weaken or delete a test to get green; extend tests for what you add, following the existing style (tests/pits.test.js, tests/browser/pits.test.mjs etc.).
Earlier scouting notes with file:line references and design notes for each feature are in JSON journals (one {"type":"result",...} line per agent; find the entry whose features[].id is the feature's number; a "verify" entry may correct it): ${WF}/wf_8d17d756-ed0/journal.jsonl (2,3,5,6,7,8,10), ${WF}/wf_49b7dbb0-7ef/journal.jsonl (11,14,16,17,18,19), ${WF}/wf_b49a1eb3-174/journal.jsonl (24,26,27,29), ${WF}/wf_afa77190-d6d/journal.jsonl (34,35,36,37), ${WF}/wf_30a67bf3-c0f/journal.jsonl (43-48; may still be incomplete: scout yourself if missing). Treat them as hints, verify against the code.`
const BUILD = { type: 'object', properties: {
  id: { type: 'string' }, summary: { type: 'string', description: 'what you built, in 2-5 sentences' },
  decisions: { type: 'string', description: 'choices you made where the spec left room' },
  commits: { type: 'array', items: { type: 'string' } },
  tests_run: { type: 'array', items: { type: 'string', description: 'test file and result, e.g. "tests/pits.test.js OK 14/14"' } },
  refs_regenerated: { type: 'string' }, open_issues: { type: 'string' },
}, required: ['id', 'summary', 'decisions', 'commits', 'tests_run', 'refs_regenerated', 'open_issues'] }
const FIND = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, file: { type: 'string' }, line: { type: 'number' },
  what: { type: 'string' }, scenario: { type: 'string', description: 'concrete input/state that shows it' }, fix: { type: 'string' },
}, required: ['severity', 'file', 'what', 'scenario', 'fix'] } } }, required: ['findings'] }

phase('Build')
const done = []
for (const f of A.features) {
  if (f.done) { done.push({ id: f.id, summary: f.done, decisions: '', commits: [], tests_run: [], refs_regenerated: '', open_issues: '' }); continue }
  const resumeNote = f.resume ? `\n\nNOTE: an earlier attempt at this feature was cut off by a usage limit before it committed; its uncommitted changes are still in the worktree (see \`git status\` and \`git diff\`). Review them first: keep and finish what is right, revert what is wrong, delete debug files it left (e.g. tests/browser/_dbg*.mjs).` : ''
  const r = await agent(`${COMMON}\n\nYour task: implement proposal ${f.id} "${f.title}" end to end on this branch (code, English text, tests, README, stamp, references if needed), then commit.\n\nSpec (the user's choice; where it leaves room, take the default given and note your decision):\n${f.spec}\n\nAlready done on this branch before you (build on it, do not redo or break it): ${done.length ? done.map(d => `${d.id}: ${d.summary}`).join(' | ') : 'nothing yet'}.\n\nBefore you finish: the targeted tests for what you touched pass (list them with counts), \`node --check\` on changed js files, stamp done, committed. If something cannot be finished, commit what works and say what is missing in open_issues.${resumeNote}`, { label: `build:${f.id}`, phase: 'Build', schema: BUILD })
  done.push(r ? r : { id: f.id, summary: 'AGENT FAILED (no result)', decisions: '', commits: [], tests_run: [], refs_regenerated: '', open_issues: 'agent failed' })
}

phase('Verify')
const ver = await agent(`${COMMON}\n\nThe features ${A.features.map(f => f.id).join(', ')} were just implemented on this branch, one commit each (git log ${A.base}..HEAD). Your job: make the whole branch green and ready for a PR.\n1. \`npm run test:node\` (all Node tests) — fix real failures at their root (in the new code), regenerate references only where the change is intended.\n2. Browser tests touching the pits and the HUD: pits.test.mjs, hudcol.test.mjs, camtilt.test.mjs, lang.test.mjs, plus any test file the branch added or changed and any test whose subject the diff touches (grep tests/browser for the functions/elements changed).\n3. If render/world geometry changed: \`PERF_ONLY=spa,rbring,bathurst,cpalace,longford,rio,montreal,newcastle,toronto,detroit,bangsaen,townsville,troisrivieres node tests/browser/perf.test.mjs --update\` and check every pit track stays within ~300 calls / ~900k average vertices and that no non-pit track's reference changed; also \`npm run golden:update\` only if the world/sim references are meant to change — report exactly which reference files changed and why.\n4. Before/after images for the PR of what the player sees (chase camera, phone portrait 390x844, quality high, Bathurst, Avstralija and one more pit track), into ${S}/${A.key}/ as <feature>-<pred|po>.jpg and side-by-side <feature>-cmp.jpg; "pred" from the base ${A.base} (make a temporary detached worktree of it under ${S}/${A.key}-base with a node_modules symlink, remove it after), "po" from this worktree; use GAME_ROOT and tests/browser/lib.mjs; starting points for scripts: ${S}/kino.mjs, ${S}/kino4.mjs. Look at every image (Read it) and redo bad ones. For non-visual features (sound, vibration, logic) skip images.\nCommit fixes. Return a concise report: test results with counts, references changed, perf numbers per pit track (before -> after), image paths, anything still failing.`, { label: 'verify', phase: 'Verify' })

phase('Review')
const LENSES = [
  'correctness: bugs, crashes, wrong state across pause/resume, race restart, replay playback, photo mode, qualifying and the race weekend (#139), online races (net), rain and dry, electric cars, damage modes off/on, the three tracks with their own pit code, AI cars, determinism of the golden references (no Math.random/Date in simulation paths), performance per frame (allocations in hot loops)',
  'project rules and UX: CLAUDE.md (no brands/logos, only geographic names, budget and no increase on non-pit tracks, test tracks untouched, chase camera only, English in js/lang.js for every new Slovenian string, README/tests README updated, stamp run, tests not weakened or skipped), phone UX in portrait 390x844 and landscape 844x390 (HUD overlap with the existing HUD, readable text, not covering the car/road), settings respected (sound, vibrate, radio, comm, lang)',
]
const reviews = await parallel(LENSES.map((lens, i) => () => agent(`${COMMON}\n\nAdversarially review the whole branch diff \`git -C ${A.wt} diff ${A.base}..HEAD\` (features ${A.features.map(f => `${f.id} ${f.title}`).join('; ')}) through this lens: ${lens}.\nOnly report real problems you can point to in the code with a concrete scenario; open the code to confirm each one. Do not edit anything.`, { label: `review:${i + 1}`, phase: 'Review', schema: FIND })))
const findings = reviews.filter(Boolean).flatMap(r => r.findings)
log(`${findings.length} findings: ${findings.filter(f => f.severity === 'blocker').length} blocker, ${findings.filter(f => f.severity === 'major').length} major`)

phase('Fix')
const fix = findings.length ? await agent(`${COMMON}\n\nReviewers found these problems in the branch (git log ${A.base}..HEAD):\n${JSON.stringify(findings, null, 1)}\n\nFor each: verify it against the code; fix every confirmed blocker and major, and the minors that are plainly correct and cheap. Re-run the tests that cover what you changed (and \`npm run test:node\` if Core/game logic changed), stamp, commit. Return per finding: fixed / not a problem (why) / left (why), and the final test results.`, { label: 'fix', phase: 'Fix' }) : 'no findings'
return { key: A.key, branch: A.branch, built: done, verify: ver, findings, fix }