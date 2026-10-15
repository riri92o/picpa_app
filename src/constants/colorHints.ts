export interface ColorHint {
  description: string;
  examples: readonly [string, string, string];
}

/** Familiar, photogenic subjects: food, plants, everyday scenes and gentle light. */
export const COLOR_HINTS: Record<string, ColorHint> = {
  red: {
    description: "少しくすみのある、やわらかな赤。",
    examples: ["いちごをのせたケーキ", "トマトのカプレーゼ", "夕焼けの空"],
  },
  vermilion: {
    description: "オレンジを含む、あたたかな赤。",
    examples: ["朝日に照らされた雲", "お皿に並べた柿", "散歩道の神社の鳥居"],
  },
  orange: {
    description: "明るく、やわらかなオレンジ。",
    examples: [
      "窓辺に置いたみかん",
      "オレンジの断面",
      "夕日が差すカフェのテーブル",
    ],
  },
  apricot: {
    description: "ベージュを少し含む、淡いオレンジ。",
    examples: [
      "クロワッサンとミルクティー",
      "マーマレードのトースト",
      "夕日を透かしたカーテン",
    ],
  },
  marigold: {
    description: "オレンジ寄りの、深みのある黄色。",
    examples: [
      "半熟卵をのせたトースト",
      "イチョウ並木",
      "グラスのオレンジジュース",
    ],
  },
  yellow: {
    description: "少し落ち着いた、やさしい黄色。",
    examples: [
      "レモンを浮かべた炭酸水",
      "窓辺に置いたバナナ",
      "道端のタンポポ",
    ],
  },
  lime: {
    description: "黄色を多く含む、明るい緑。",
    examples: ["お皿に並べたマスカット", "光を透かした新緑", "キウイの断面"],
  },
  grass: {
    description: "黄緑より少し穏やかな、若葉の緑。",
    examples: ["木漏れ日が差す芝生", "枝先に芽吹いた新芽", "窓辺のミント"],
  },
  "pale-green": {
    description: "白を混ぜたような、淡くやさしい緑。",
    examples: ["アイス抹茶ラテ", "小瓶に飾ったユーカリ", "ピスタチオのアイス"],
  },
  leaf: {
    description: "葉っぱを思わせる、穏やかな緑。",
    examples: ["朝露のついた葉", "窓辺の観葉植物", "公園の木漏れ日"],
  },
  forest: {
    description: "少し青みと影を含む、落ち着いた緑。",
    examples: ["木陰に広がるシダ", "並木道の緑", "光を透かした緑のガラス瓶"],
  },
  mint: {
    description: "青をほんのり含む、明るく淡い緑。",
    examples: [
      "チョコミントアイス",
      "バニラアイスが溶けたクリームソーダ",
      "窓辺に置いたラムネ瓶",
    ],
  },
  teal: {
    description: "青と緑のあいだの、落ち着いた色。",
    examples: ["光が透けるラムネ瓶", "木々を映した川面", "波が重なる浅い海"],
  },
  aqua: {
    description: "緑を少し含む、明るい水色。",
    examples: ["光が揺れるプールの水面", "窓辺のラムネ瓶", "晴れた日の浅瀬"],
  },
  sky: {
    description: "晴れた空のような、淡い青。",
    examples: ["白い雲と青空", "窓に映った空", "ソーダ味のアイス"],
  },
  blue: {
    description: "白を含んだ、やさしい青。",
    examples: ["光の当たるデニムの質感", "波打ち際の海", "青空を映すビルの窓"],
  },
  indigo: {
    description: "紫を少し含む、落ち着いた青。",
    examples: ["日没直後の空", "窓辺に置いたデニム", "夕方の街のシルエット"],
  },
  navy: {
    description: "灰色がかった、落ち着いた紺色。",
    examples: [
      "夜になる直前の空",
      "白い器と濃いデニム",
      "街灯が映る夕方の水面",
    ],
  },
  violet: {
    description: "少し青みのある、穏やかな紫。",
    examples: ["ブルーベリーのスムージー", "道端に咲くスミレ", "夕暮れの雲"],
  },
  lavender: {
    description: "白を含む、ふんわりとした薄紫。",
    examples: ["藤の花の房", "ブルーベリーのヨーグルト", "日没後の薄紫の雲"],
  },
  lilac: {
    description: "ピンクを少し含む、淡くくすんだ紫。",
    examples: [
      "あじさいの小さな花",
      "ブルーベリーを混ぜたミルク",
      "夕空に浮かぶ雲",
    ],
  },
  pink: {
    description: "白を混ぜたような、やさしいピンク。",
    examples: ["桜の枝", "グラスに注いだいちごミルク", "夕焼けに染まった雲"],
  },
  rose: {
    description: "赤みを含んだ、落ち着いたピンク。",
    examples: [
      "いちごジャムのトースト",
      "ベリーのタルト",
      "夕焼けを映したグラス",
    ],
  },
  coral: {
    description: "オレンジを含む、あたたかなピンク。",
    examples: [
      "グレープフルーツの断面",
      "サーモンのオープンサンド",
      "夕日を受けた花びら",
    ],
  },
  peach: {
    description: "オレンジとピンクのあいだの、淡い色。",
    examples: [
      "桃をのせたヨーグルト",
      "窓辺のミルクティー",
      "夕焼けのやわらかな雲",
    ],
  },
  beige: {
    description: "砂を思わせる、あたたかな薄茶色。",
    examples: ["カフェラテ", "焼き菓子と木のトレー", "リネンに差す光"],
  },
  ochre: {
    description: "黄色を含む、土のような茶色。",
    examples: ["焼き菓子の表面", "木のテーブルに差す午後の光", "秋の並木道"],
  },
  brown: {
    description: "灰色を少し含む、やわらかな茶色。",
    examples: [
      "ラテアートのカフェラテ",
      "チョコレートの焼き菓子",
      "木のテーブルと本",
    ],
  },
  slate: {
    description: "青と緑を少し含む、穏やかな灰色。",
    examples: [
      "雨上がりの石畳",
      "曇り空を映す水面",
      "窓辺のガラス瓶が落とす影",
    ],
  },
  gray: {
    description: "白と黒のあいだの、やさしい灰色。",
    examples: [
      "木漏れ日が落ちる石畳",
      "シルバーのアクセサリー",
      "やわらかな影の落ちる壁",
    ],
  },
  brick: {
    description: "茶色を含んだ、深みのある赤。",
    examples: [
      "レンガ道に差す夕日",
      "焼き色のついたアップルパイ",
      "秋のもみじ",
    ],
  },
  terracotta: {
    description: "赤とオレンジを含む、あたたかな土の色。",
    examples: [
      "草花を植えた素焼きの鉢",
      "シナモンを振った焼き菓子",
      "夕日に照らされたレンガ道",
    ],
  },
  rust: {
    description: "オレンジを含む、落ち着いた赤茶色。",
    examples: ["シナモンロール", "色づいた落ち葉", "革の手帳とコーヒー"],
  },
  amber: {
    description: "茶色を少し含む、琥珀のような黄橙色。",
    examples: [
      "日差しを透かした紅茶",
      "窓辺のはちみつの瓶",
      "夕日が映るグラス",
    ],
  },
  honey: {
    description: "はちみつを思わせる、やわらかな黄金色。",
    examples: [
      "はちみつをかけたパンケーキ",
      "午後の光と麦わら帽子",
      "光を透かしたアップルジュース",
    ],
  },
  cream: {
    description: "黄色をほんのり含む、あたたかな白。",
    examples: [
      "バニラアイス",
      "スコーンに添えたクリーム",
      "窓辺の生成りのカーテン",
    ],
  },
  white: {
    description: "明るく、色みの少ない白。",
    examples: [
      "泡の立つカプチーノ",
      "ふわっと広がる雲",
      "窓辺の白いマグカップ",
    ],
  },
  black: {
    description: "光をやさしく受ける、深い黒。",
    examples: [
      "ブラックコーヒーの水面",
      "モノクロの本と眼鏡",
      "夜の街のシルエット",
    ],
  },
};
