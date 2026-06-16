# Downloads a clean product photo for every catalog item from FREE keyless sources
# (Wikimedia Commons first, Openverse as fallback), strips the background, and
# composites onto pure white. Saves img/p/<id>_0.jpg and writes img/manifest.json.
# Reads img/queries.json = [{"id":1,"q":"cola bottle","produce":false}, ...]
import json, os, io, urllib.request, urllib.parse, concurrent.futures, threading
from PIL import Image
from rembg import remove, new_session

BASE = r"C:\Users\DELL\Desktop\g-mart\img"
PDIR = os.path.join(BASE, "p")
os.makedirs(PDIR, exist_ok=True)
UA = {"User-Agent": "GMartDemo/1.0 (educational portfolio demo)"}
SIZE, PAD = 640, 70

with open(os.path.join(BASE, "queries.json"), encoding="utf-8-sig") as f:
    QUERIES = json.load(f)

_session = new_session("u2netp")         # lighter/faster model (~2x); shared, GIL released during inference
_lock = threading.Lock()

def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def wikimedia(q):
    url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="
           + urllib.parse.quote(q) + "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime"
           + "&iiurlwidth=640&format=json")
    data = json.loads(fetch(url, 30))
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") in ("image/jpeg", "image/png") and ii.get("thumburl"):
            return ii["thumburl"]
    return None

def openverse(q):
    url = "https://api.openverse.org/v1/images/?q=" + urllib.parse.quote(q) + "&page_size=5&mature=false"
    data = json.loads(fetch(url, 30))
    for it in data.get("results", []):
        u = it.get("thumbnail") or it.get("url")
        if u:
            return u
    return None

def whiten(raw_bytes):
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    with _lock:
        cut = remove(img, session=_session)
    bb = cut.getbbox()
    if bb:
        cut = cut.crop(bb)
    cut.thumbnail((SIZE - 2 * PAD, SIZE - 2 * PAD), Image.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    canvas.paste(cut, ((SIZE - cut.width) // 2, (SIZE - cut.height) // 2), cut)
    return canvas

def process(item):
    pid, q = item["id"], item["q"]
    try:
        url = None
        try: url = wikimedia(q)
        except Exception: pass
        if not url:
            try: url = openverse(q)
            except Exception: pass
        if not url:
            return (pid, False, "no source")
        raw = fetch(url)
        if len(raw) < 1200:
            return (pid, False, "tiny")
        out = whiten(raw)
        out.save(os.path.join(PDIR, f"{pid}_0.jpg"), "JPEG", quality=88)
        return (pid, True, q)
    except Exception as e:
        return (pid, False, repr(e)[:60])

ok, fail = 0, 0
manifest = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
    for pid, good, info in ex.map(process, QUERIES):
        if good:
            ok += 1; manifest[str(pid)] = [f"img/p/{pid}_0.jpg"]
        else:
            fail += 1; manifest[str(pid)] = []
        if (ok + fail) % 20 == 0:
            print(f"... {ok+fail}/{len(QUERIES)}  ok={ok} fail={fail}")

with open(os.path.join(BASE, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f)
print(f"DONE  ok={ok}  fail={fail}  total={len(QUERIES)}")
