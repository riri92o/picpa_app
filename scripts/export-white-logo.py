"""Wrap the approved white logo in a display mask without redrawing its shapes."""
from pathlib import Path
import base64

root = Path(__file__).resolve().parents[1]
branding = root / "public" / "branding"
source = branding / "picpa-white-logo-source.png"
data = base64.b64encode(source.read_bytes()).decode("ascii")
# The attached image's white lettering and outline are far brighter than its
# navy field. The SVG mask removes the field while retaining antialiased edges.
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="664" height="330" viewBox="0 0 664 330">
  <title>PicPa</title>
  <defs><filter id="white" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .3173134 1.0674627 .1077612 0 -.3731343"/>
  </filter></defs>
  <image x="-180" y="-170" width="1024" height="683" href="data:image/png;base64,{data}" filter="url(#white)"/>
</svg>'''
(branding / "picpa-white-logo.svg").write_text(svg)
