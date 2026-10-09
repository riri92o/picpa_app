"""Export icon sizes; Pillow is needed only for asset regeneration."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "assets/branding/picpa-icon-source.png").convert("RGBA")
if source.width != source.height:
    raise ValueError("App icon source must be square")
icons = root / "public/icons"
icons.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 180, 192, 512, 1024):
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    # Apple/native masters are opaque; favicon and web icons retain rounded corners.
    if size in (180, 1024):
        background = Image.new("RGBA", resized.size, "#10102f")
        background.alpha_composite(resized)
        resized = background.convert("RGB")
    resized.save(icons / f"picpa-icon-{size}.png", optimize=True)
source.resize((48, 48), Image.Resampling.LANCZOS).save(
    root / "public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)
print("Exported 7 PNG sizes and multi-size favicon.ico")
