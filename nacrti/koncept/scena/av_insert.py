# AV: makes my store copies concepts/_e_store2_av<k>.js (k 1..6) from a SNAPSHOT of AMA's version-2 store (scratchpad/av/base_store_am2.js =
# concepts/_e_store2_am2.js when this round started), first patched with agent LF's lift patch (P/out/lf/lift.patch, when P/out/lf/DONE
# exists; its lift design set to k), then my block (scratchpad/av/av_block.js, AV.v = k) just before "// <<<< XC BLOCKS"; frontRegal's call
# amaFronts -> avFronts (the gift hidden too).   python3 -I insert.py 1 2 3 4 5 6
import sys, re, os, subprocess, shutil
SD = '/tmp/claude-0/-home-user-dirkaska-igra/d198ab76-16fe-5fe4-9ec7-dde31bfe371f/scratchpad/av'
PP = '/tmp/claude-0/-home-user-dirkaska-igra/d198ab76-16fe-5fe4-9ec7-dde31bfe371f/scratchpad/proposals'
P = PP + '/concepts'
base = SD + '/base_store_am2.js'; patched = SD + '/base_store_am2_lf.js'; LFP = PP + '/out/lf/lift.patch'; use = os.path.exists(PP + '/out/lf/DONE') and os.path.exists(LFP) and not os.environ.get('NOLF')
if use:
    shutil.copy(base, patched); r = subprocess.run(['patch', '--no-backup-if-mismatch', '-s', patched, LFP], capture_output=True, text=True)
    if r.returncode != 0: print('LIFT PATCH FAILED', r.stdout, r.stderr); use = False
src = open(patched if use else base, encoding='utf8').read(); blk = open(SD + '/av_block.js', encoding='utf8').read()
for k in sys.argv[1:]:
    assert k in ('1', '2', '3', '4', '5', '6'), k
    S = src; B = blk.replace('__AVV__', k).replace('__AVLF__', 'true' if use else 'false')
    A1 = '// <<<< XC BLOCKS\n'; assert S.count(A1) == 1; S = S.replace(A1, B + A1)
    old = re.search(r'^  amaFronts\(S, out, o\);.*\n', S, re.M); assert old
    S = S[:old.start()] + '  avFronts(S, out, o);   // (AV: version ' + k + ' of round AV (AMA\'s chest top: car-painted models with liveries, the red push button, GT PACK gone, RACE locked under a dome; lift design ' + k + ' from LF\'s patch) instead of AMA\'s version 2; the daily gift hidden (AV block above, inside XC BLOCKS; AV.v 0: AMA\'s version 2 as before))\n' + S[old.end():]
    open(P + '/_e_store2_av' + k + '.js', 'w', encoding='utf8').write(S); print('ok', k, len(S), 'lift patch' if use else 'NO lift patch')
