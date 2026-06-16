# Re-fetch nicer source photos for the weak products and re-cut them onto white.
import json, os, urllib.request, urllib.parse
from PIL import Image
from rembg import remove, new_session

BASE = r"C:\Users\DELL\Desktop\g-mart\img"
os.makedirs(os.path.join(BASE, "p"), exist_ok=True)
TARGETS = {7: "glass of milk"}
UA = {"User-Agent": "GMartDemo/1.0 (educational demo)"}

def commons(term):
    url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="
           + urllib.parse.quote(term)
           + "&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    pages = list(data.get("query", {}).get("pages", {}).values())
    pages.sort(key=lambda p: p.get("index", 99))
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") in ("image/jpeg", "image/png") and ii.get("thumburl"):
            return ii["thumburl"]
    return None

session = new_session("u2net")
SIZE, PAD = 600, 64
for pid, term in TARGETS.items():
    try:
        u = commons(term)
        if not u:
            print(pid, "no image"); continue
        ext = os.path.splitext(u.split("?")[0])[1].lower() or ".jpg"
        raw = os.path.join(BASE, f"{pid}_0{ext}")
        req = urllib.request.Request(u, headers=UA)
        with urllib.request.urlopen(req, timeout=40) as r, open(raw, "wb") as f:
            f.write(r.read())
        img = Image.open(raw).convert("RGBA")
        cut = remove(img, session=session)
        bb = cut.getbbox()
        if bb: cut = cut.crop(bb)
        cut.thumbnail((SIZE-2*PAD, SIZE-2*PAD), Image.LANCZOS)
        canvas = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
        canvas.paste(cut, ((SIZE-cut.width)//2, (SIZE-cut.height)//2), cut)
        canvas.save(os.path.join(BASE, "p", f"{pid}_0.jpg"), "JPEG", quality=88)
        print(pid, "OK", u.split("/")[-1])
    except Exception as e:
        print(pid, "FAIL", repr(e))
print("REFETCH DONE")
