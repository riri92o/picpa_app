export interface ColorHint {
  description: string;
  examples: readonly [string, string, string];
}

/** Curated for PicPa's actual swatches, including their soft, muted tones. */
export const COLOR_HINTS: Record<string, ColorHint> = {
  red: {
    description: "少しくすみのある、やわらかな赤。",
    examples: ["赤い花びら", "赤いマグカップ", "赤い布やニット"],
  },
  vermilion: {
    description: "オレンジを含む、あたたかな赤。",
    examples: ["朱塗りの器", "赤橙色の花", "熟した柿の皮"],
  },
  orange: {
    description: "明るく、やわらかなオレンジ。",
    examples: ["みかんの皮", "オレンジ色の花", "かぼちゃの果肉"],
  },
  apricot: {
    description: "ベージュを少し含む、淡いオレンジ。",
    examples: ["あんずの実", "淡いオレンジのバラ", "アプリコット色の布"],
  },
  marigold: {
    description: "オレンジ寄りの、深みのある黄色。",
    examples: ["山吹の花", "マリーゴールド", "からし色の小物"],
  },
  yellow: {
    description: "少し落ち着いた、やさしい黄色。",
    examples: ["黄色い花びら", "レモンの皮", "黄色い陶器"],
  },
  lime: {
    description: "黄色を多く含む、明るい緑。",
    examples: ["黄緑の若い葉", "青ぶどうの皮", "黄緑色の文房具"],
  },
  grass: {
    description: "黄緑より少し穏やかな、若葉の緑。",
    examples: ["やわらかな新芽", "若い芝生", "若草色の布"],
  },
  "pale-green": {
    description: "白を混ぜたような、淡くやさしい緑。",
    examples: ["ユーカリの葉", "淡い緑の陶器", "やわらかな緑の壁"],
  },
  leaf: {
    description: "葉っぱを思わせる、穏やかな緑。",
    examples: ["観葉植物の葉", "緑色のガラス瓶", "リーフグリーンの布"],
  },
  forest: {
    description: "少し青みと影を含む、落ち着いた緑。",
    examples: ["木陰の葉", "深緑の陶器", "深緑のかばん"],
  },
  mint: {
    description: "青をほんのり含む、明るく淡い緑。",
    examples: [
      "ミント色の自転車",
      "淡い青緑のタイル",
      "ミント色のお菓子の包み",
    ],
  },
  teal: {
    description: "青と緑のあいだの、落ち着いた色。",
    examples: ["青緑のガラス瓶", "青緑のタイル", "くすんだターコイズの布"],
  },
  aqua: {
    description: "緑を少し含む、明るい水色。",
    examples: ["明るい水色の器", "アクア色のタイル", "浅いプールの水面"],
  },
  sky: {
    description: "晴れた空のような、淡い青。",
    examples: ["晴れた日の空", "水色のシャツ", "空色のガラス"],
  },
  blue: {
    description: "白を含んだ、やさしい青。",
    examples: ["青いあじさい", "色の淡いデニム", "青い陶器"],
  },
  indigo: {
    description: "紫を少し含む、落ち着いた青。",
    examples: ["青紫のあじさい", "群青色の器", "青紫の布や表紙"],
  },
  navy: {
    description: "灰色がかった、落ち着いた紺色。",
    examples: ["色あせた紺の服", "くすんだ紺のかばん", "灰青色の器"],
  },
  violet: {
    description: "少し青みのある、穏やかな紫。",
    examples: ["紫の花びら", "紫色の布", "バイオレットの文房具"],
  },
  lavender: {
    description: "白を含む、ふんわりとした薄紫。",
    examples: ["ラベンダーの花", "薄紫の陶器", "ラベンダー色のハンカチ"],
  },
  lilac: {
    description: "ピンクを少し含む、淡くくすんだ紫。",
    examples: ["ライラックの花", "淡い藤色の布", "薄紫の紙やリボン"],
  },
  pink: {
    description: "白を混ぜたような、やさしいピンク。",
    examples: ["淡いピンクの花", "ピンクのマグカップ", "桜色の布"],
  },
  rose: {
    description: "赤みを含んだ、落ち着いたピンク。",
    examples: ["ローズ色のバラ", "くすみピンクの服", "ローズ色のリボン"],
  },
  coral: {
    description: "オレンジを含む、あたたかなピンク。",
    examples: ["コーラル色の花", "サーモンピンクの布", "珊瑚色の小物"],
  },
  peach: {
    description: "オレンジとピンクのあいだの、淡い色。",
    examples: ["桃の皮の淡い部分", "ピーチ色のバラ", "淡い桃色の布"],
  },
  beige: {
    description: "砂を思わせる、あたたかな薄茶色。",
    examples: ["生成りのリネン", "砂や小石", "ベージュの陶器"],
  },
  ochre: {
    description: "黄色を含む、土のような茶色。",
    examples: ["黄土色の土壁", "素焼きの器", "黄褐色の落ち葉"],
  },
  brown: {
    description: "灰色を少し含む、やわらかな茶色。",
    examples: ["木製の家具", "ブラウンの革小物", "クラフト紙"],
  },
  slate: {
    description: "青と緑を少し含む、穏やかな灰色。",
    examples: ["青灰色の石", "くすんだ青緑の器", "スレート色の布"],
  },
  gray: {
    description: "白と黒のあいだの、やさしい灰色。",
    examples: ["コンクリートの壁", "グレーのニット", "灰色の小石"],
  },
  brick: {
    description: "茶色を含んだ、深みのある赤。",
    examples: ["赤レンガの壁", "レンガ色の陶器", "赤茶色の落ち葉"],
  },
  terracotta: {
    description: "赤とオレンジを含む、あたたかな土の色。",
    examples: ["素焼きの植木鉢", "テラコッタのタイル", "赤茶色の器"],
  },
  rust: {
    description: "オレンジを含む、落ち着いた赤茶色。",
    examples: ["赤茶色の木の皮", "錆色の金属", "赤茶色の革小物"],
  },
  amber: {
    description: "茶色を少し含む、琥珀のような黄橙色。",
    examples: ["琥珀色のガラス瓶", "紅茶に光が透けた部分", "アンバー色の小物"],
  },
  honey: {
    description: "はちみつを思わせる、やわらかな黄金色。",
    examples: ["はちみつ", "麦わらの小物", "はちみつ色の陶器"],
  },
  cream: {
    description: "黄色をほんのり含む、あたたかな白。",
    examples: ["クリーム色の器", "アイボリーの布", "クリーム色の花びら"],
  },
  white: {
    description: "明るく、色みの少ない白。",
    examples: ["白い花びら", "白い陶器", "白いシャツ"],
  },
  black: {
    description: "光をやさしく受ける、深い黒。",
    examples: ["黒いマグカップ", "黒いかばん", "黒い布や靴"],
  },
};
