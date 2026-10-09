# 一時的なサンプル写真

保存先: `/Users/rikuto/Desktop/PicPa/src/dev/samples/01.jpg` 〜 `09.jpg`。

OpenAIの組み込みimage_genツールで、新規の写真を9枚生成しました。書き出し用JPEGへ形式変換して同梱しています。実行時の外部画像通信はありません。

## 生成プロンプト

共通プロンプト（`{i}` は1〜9、`{subject}` は以下の順番の被写体）:

```text
Use case: photorealistic-natural. Asset type: local test photo for PicPa color collage, photo {i} of nine matching photos. Subject: {subject}. Square photo, natural editorial photography, realistic fine textures, soft daylight, calm minimal composition. Color palette: unified pale green and sage green; almost all the frame should stay in this color family with small cream highlights. No text, borders, collage, watermark, people or logos. One single photo.
```

1. close-up of soft sage green eucalyptus leaves with tiny dew drops
2. a pale matcha latte in a simple glass on a sage green linen tablecloth
3. a pale green ceramic vase with one eucalyptus branch against a sage wall
4. soft sunlight and leaf shadows on a pale green plaster wall
5. a neat pile of fresh green pears on a sage green cloth
6. a mint green bicycle leaning against a pale sage green wall
7. macro ripples in very pale green clear water
8. a folded pale sage linen cloth and a small green ceramic bowl
9. a pale green succulent in a sage ceramic pot on a pale green shelf

## テスト機能を削除する場合

1. Home.tsxからSamplePhotoButtonのimportと表示を削除。
2. AppContext.tsxからaddSamplePhotosの型、関数、Providerの値を削除。
3. src/devディレクトリとhome.cssのsample-tools / sample-buttonのスタイルを削除。

IndexedDBに追加済みのサンプル写真は、通常の写真と同じ独立したデータです。素材ファイルを削除しても保存済みの作品は表示できます。
