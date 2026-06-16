# Removes the background from each downloaded photo and composites it onto a clean
# white square canvas (Amazon-style packshot). Updates img/manifest.json to point
# at the processed images. Falls back to the raw image if a single file fails.
import os, json
from PIL import Image
from rembg import remove, new_session

BASE = r"C:\Users\DELL\Desktop\g-mart\img"
PDIR = os.path.join(BASE, "p")
os.makedirs(PDIR, exist_ok=True)

with open(os.path.join(BASE, "manifest.json"), encoding="utf-8-sig") as f:
    man = json.load(f)

session = new_session("u2net")   # downloads the model on first run (~170 MB)
SIZE, PAD = 600, 64
out = {}
done = 0

for k, files in man.items():
    newfiles = []
    for rel in files:
        name = os.path.basename(rel)
        src = os.path.join(BASE, name)
        if not os.path.exists(src):
            continue
        try:
            img = Image.open(src).convert("RGBA")
            cut = remove(img, session=session)            # RGBA cut-out
            bbox = cut.getbbox()
            if bbox:
                cut = cut.crop(bbox)
            maxd = SIZE - 2 * PAD
            cut.thumbnail((maxd, maxd), Image.LANCZOS)
            canvas = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
            x = (SIZE - cut.width) // 2
            y = (SIZE - cut.height) // 2
            canvas.paste(cut, (x, y), cut)                # alpha as mask -> white bg
            outname = "p/" + os.path.splitext(name)[0] + ".jpg"
            canvas.save(os.path.join(BASE, outname), "JPEG", quality=88)
            newfiles.append("img/" + outname)
            done += 1
        except Exception as e:
            print("FAIL", name, repr(e))
            newfiles.append(rel)                          # keep raw on failure
    out[k] = newfiles

with open(os.path.join(BASE, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(out, f)

print("PROCESSED", done, "images on white background")
