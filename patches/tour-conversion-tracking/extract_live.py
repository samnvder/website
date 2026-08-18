"""Extract each booking script's INNER JS from a saved LIVE page, insert the
tour_booked push, and write a paste-ready .js file.

Emits pure JavaScript only -- no <script> tags, no Thrive wrapper markup.
Live blocks are wrapped in Thrive's <code class="tve_js_placeholder"> element and
the closing line carries trailing layout divs; capturing those and pasting them
back would corrupt the page structure.
"""
import sys, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SNIP = open(os.path.join(HERE, "snippet.js"), encoding="utf-8").read().rstrip("\n").split("\n")
ANCHOR = "if(res.ok && res.data.success){"
OUT = os.path.join(HERE, "live-blocks")
os.makedirs(OUT, exist_ok=True)

path, slug = sys.argv[1], sys.argv[2]
src = open(path, encoding="utf-8", errors="replace").read()
lines = src.split("\n")

opens  = [i for i, l in enumerate(lines) if re.search(r"<script[ >]", l)]
closes = [i for i, l in enumerate(lines) if "</script>" in l]
hits   = [i for i, l in enumerate(lines) if "functions/v1/book-tour" in l and "fetch(" in l]

print(f"{slug}: {len(hits)} booking call site(s)")
for h in hits:
    s = max(o for o in opens if o < h)
    e = min(c for c in closes if c > h)
    body = lines[s:e + 1]
    # trim the partial first/last lines down to the script's inner JS
    body[0]  = body[0][body[0].index(">", body[0].index("<script")) + 1:]
    body[-1] = body[-1][:body[-1].index("</script>")]
    if not body[0].strip():  body = body[1:]
    if not body[-1].strip(): body = body[:-1]

    anchors = [i for i, l in enumerate(body) if ANCHOR in l]
    assert len(anchors) == 1, f"expected exactly 1 anchor, got {len(anchors)}"
    a = anchors[0]
    out = body[:a + 1] + SNIP + body[a + 1:]

    widget = "se-bk-floating" if "se-bk-floating" in "\n".join(body) else "se-cal"
    name = f"{slug}--{widget}.js"
    open(os.path.join(OUT, name), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"  -> live-blocks/{name}  (live lines {s+1}-{e+1}, {len(out)} lines out)")
