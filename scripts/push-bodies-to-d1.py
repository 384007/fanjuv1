#!/usr/bin/env python3
"""Push article bodies to D1. Stores raw markdown (Worker converts on-the-fly)."""
import os, re, json, urllib.request, time, sys

TOKEN      = "cfut_q77hDOLZgoNFLFzjv3h2qtgVOMordmg76HIIOqoia8aac667"
ACCOUNT_ID = "e7406eaaafd4d38aa87b6b4d38428719"
DB_ID      = "58d63133-adeb-4efd-b9eb-a9b056271ca5"
READY_DIR  = "content/seo-ready"
BATCH      = 15
MIN_SCORE  = 90

def parse_fm(raw):
    m = re.match(r'^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)', raw)
    if not m: return {}, raw
    meta = {}
    for line in m.group(1).split('\n'):
        lm = re.match(r'^(\w+):\s*(.*)', line)
        if not lm: continue
        v = lm.group(2).strip()
        if len(v) >= 2 and v[0] in '"\'': v = v[1:-1]
        meta[lm.group(1)] = v
    return meta, m.group(2).strip()

def sq(s):
    return "'" + str(s or '').replace("'", "''") + "'"

def d1_run(stmts):
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/raw"
    data = json.dumps({"sql": ";\n".join(stmts)}).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            res = json.loads(r.read())
        return res.get('success', False), res.get('errors', [])
    except Exception as e:
        return False, [str(e)]

# Load — just read slug + raw body, no conversion
print("Loading articles...", flush=True)
arts = []
for fname in sorted(os.listdir(READY_DIR)):
    if not fname.endswith('.md'): continue
    raw = open(os.path.join(READY_DIR, fname), encoding='utf8').read()
    meta, body = parse_fm(raw)
    if meta.get('status') != 'ready' or int(meta.get('aiQualityScore','0') or 0) < MIN_SCORE: continue
    cp = meta.get('canonicalPath','').replace('"','')
    if '/city/' not in cp: continue
    arts.append((meta.get('slug','').replace('"',''), body))

total = len(arts)
print(f"{total} articles loaded. Pushing to D1 in batches of {BATCH}...\n", flush=True)

done = 0; errs = 0; t0 = time.time()

for i in range(0, total, BATCH):
    batch = arts[i:i+BATCH]
    stmts = [f"UPDATE articles SET body_html={sq(b)} WHERE slug={sq(s)}" for s, b in batch]
    ok, e = d1_run(stmts)
    if ok: done += len(batch)
    else:
        errs += len(batch)
        print(f"\nERR batch {i}: {e}", flush=True)

    elapsed = time.time() - t0
    rate = done / max(elapsed, 0.1)
    eta = int((total - done) / rate) if rate > 0 else 999
    pct = done * 100 // total
    bar = '█' * (pct // 4) + '░' * (25 - pct // 4)
    sys.stdout.write(f"\r[{bar}] {pct}% {done}/{total}  {rate:.0f}/s  ETA {eta}s   ")
    sys.stdout.flush()
    time.sleep(0.05)

print(f"\n\n✅ {done} ok, {errs} errors, {int(time.time()-t0)}s")
