# PicPa app icon

採用デザイン: 虹色にマーブル状に混ざるバブル、山と湖、小屋、周囲の泡と星。ユーザー提供画像をbuilt-in image_genで角丸の正方形に整えました。

- picpa-icon-source.png: 角丸の編集元（角の外側は透過）。
- public/iconsの16/32/48/192/512px: 角の透過を維持。
- 180px: Appleホーム画面用。不透明背景に変換し、OSの角丸表示に対応。
- 1024px: 将来のネイティブアプリ用。不透明マスター。
- favicon.ico: 16/32/48px。

再出力: `python3 scripts/export-icons.py`（Pillow必要）。画像生成後はサイズ・フォーマット変換とApple用の透過背景補完のみ。イラストは再描画しません。

## Final prompt (built-in image_gen)

Use case: precise-object-edit, background-extraction. Edit target: the attached image. Extract its central rounded-square app icon and prepare it as a square PNG app icon. Remove the large purple rectangular outer backdrop and all exterior margins. The rounded square tile should fill the square canvas, with only genuinely transparent corner cutouts outside its rounded edges (corner radius about 20% of width). Preserve the original illustration as faithfully as possible: midnight navy to dark purple tile, luminous pastel pink/cyan/yellow/lavender marbled soap bubble, mountain lake landscape and tiny cabin inside, surrounding small bubbles and sparkles. Keep the landscape, color palette, soft illustrated texture, relative placement, and mood unchanged. Make the tile geometrically square (the input tile is slightly wide), without stretching the circular bubble. No new objects, no text, no mockup, no white border, no additional shadow. Produce one tightly framed square rounded-corner icon with true transparent corners.
