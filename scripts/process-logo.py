from pathlib import Path
from PIL import Image

src = Path(r"C:\Users\Admin\.cursor\projects\c-Users-Admin-Desktop-MK-Construction-Builders\assets\c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_93e37790f758c1baa49cb726cb1d9405_images_image-477ed70e-6a94-431f-9cbe-71156db67446.png")
out_dir = Path(r"C:\Users\Admin\Desktop\MK Construction & Builders\src\assets\brand")
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
w, h = img.size
pixels = img.load()

# Drop screenshot black bars and near-white to transparent.
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r < 18 and g < 18 and b < 18:
            pixels[x, y] = (0, 0, 0, 0)
        elif r > 248 and g > 248 and b > 248:
            pixels[x, y] = (255, 255, 255, 0)

# Bounding box of remaining artwork
bbox = img.getbbox()
if not bbox:
    raise SystemExit("empty image")
pad = 8
left, top, right, bottom = bbox
left = max(0, left - pad)
top = max(0, top - pad)
right = min(w, right + pad)
bottom = min(h, bottom + pad)
full = img.crop((left, top, right, bottom))

# Compact mark: crop the building (exclude wordmark at bottom ~18%)
fw, fh = full.size
mark = full.crop((0, 0, fw, int(fh * 0.695)))
# Tighten mark bbox
mb = mark.getbbox()
if mb:
    mark = mark.crop(mb)

full.save(out_dir / "logo-full.png", "PNG", optimize=True)
mark.save(out_dir / "logo-mark.png", "PNG", optimize=True)

# White-background versions for dark UI plates (keep original colors)
full_white = Image.new("RGBA", full.size, (255, 255, 255, 255))
full_white.alpha_composite(full)
full_white.convert("RGB").save(out_dir / "logo-full-light.png", "PNG", optimize=True)

mark_white = Image.new("RGBA", mark.size, (255, 255, 255, 255))
mark_white.alpha_composite(mark)
mark_white.convert("RGB").save(out_dir / "logo-mark-light.png", "PNG", optimize=True)

print("full", full.size, "mark", mark.size)
