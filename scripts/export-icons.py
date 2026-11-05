"""Export every app icon from the supplied artwork, with one shared center."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "assets/branding/picpa-icon-source.png").convert("RGB")
if source.size != (1254, 1254):
    raise ValueError("The approved icon source must be 1254 by 1254 pixels")
# The supplied bubble is centered at approximately (621.3, 614.5), rather
# than the canvas center (627, 627). Trim only the dark outer margin to a
# square centered at (621.5, 614.5); retain all lettering, film and reflections.
source = source.crop((7, 0, 1236, 1229))
icons = root / "public/icons"
icons.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 180, 192, 512, 1024):
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    # Keep a full opaque square; the OS supplies its own icon corner mask.
    resized.save(icons / f"picpa-icon-{size}.png", optimize=True)
source.save(
    root / "public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)
print("Exported 7 PNG sizes and multi-size favicon.ico")
