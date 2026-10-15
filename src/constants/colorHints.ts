export interface ColorHint {
  description: string;
  examples: readonly [string, string, string];
}

/** Concrete places to look: familiar objects, food, streets and scenery. */
export const COLOR_HINTS: Record<string, ColorHint> = {
  red: {
    description: "少しくすみのある、やわらかな赤。",
    examples: ["いちごの表面", "街角の郵便ポスト", "夕焼けを映した窓"],
  },
  vermilion: {
    description: "オレンジを含む、あたたかな赤。",
    examples: ["神社の鳥居", "熟した柿の皮", "漆塗りのお椀の内側"],
  },
  orange: {
    description: "明るく、やわらかなオレンジ。",
    examples: ["みかんの皮", "切ったにんじん", "夕日に照らされたレンガ道"],
  },
  apricot: {
    description: "ベージュを少し含む、淡いオレンジ。",
    examples: [
      "びわの皮",
      "ミルクを混ぜたオレンジジュース",
      "夕日の当たる白い壁",
    ],
  },
  marigold: {
    description: "オレンジ寄りの、深みのある黄色。",
    examples: ["卵焼きの断面", "イチョウの落ち葉", "踏切の黄色い部分"],
  },
  yellow: {
    description: "少し落ち着いた、やさしい黄色。",
    examples: ["レモンの皮", "バナナの皮", "駅の点字ブロック"],
  },
  lime: {
    description: "黄色を多く含む、明るい緑。",
    examples: ["マスカットの皮", "切ったキャベツの内側", "日差しが透ける若葉"],
  },
  grass: {
    description: "黄緑より少し穏やかな、若葉の緑。",
    examples: ["春の芝生", "枝先の新芽", "さやから出したそら豆"],
  },
  "pale-green": {
    description: "白を混ぜたような、淡くやさしい緑。",
    examples: [
      "キャベツの外側の葉",
      "ユーカリの丸い葉",
      "雨どいの緑青が出た部分",
    ],
  },
  leaf: {
    description: "葉っぱを思わせる、穏やかな緑。",
    examples: ["街路樹の葉", "切ったピーマン", "公園の生け垣"],
  },
  forest: {
    description: "少し青みと影を含む、落ち着いた緑。",
    examples: ["木陰のツバキの葉", "苔の生えた石垣", "光が透けた緑のワイン瓶"],
  },
  mint: {
    description: "青をほんのり含む、明るく淡い緑。",
    examples: [
      "チョコミントアイス",
      "ラムネ菓子の緑の粒",
      "銅屋根にできた緑青",
    ],
  },
  teal: {
    description: "青と緑のあいだの、落ち着いた色。",
    examples: ["ラムネ瓶の厚い底", "緑青の出た銅の手すり", "橋の下の川面"],
  },
  aqua: {
    description: "緑を少し含む、明るい水色。",
    examples: ["浅いプールの水面", "ラムネのガラス瓶", "晴れた日の浅い海"],
  },
  sky: {
    description: "晴れた空のような、淡い青。",
    examples: ["晴れた日の空", "空を映したビルの窓", "ソーダ味のアイス"],
  },
  blue: {
    description: "白を含んだ、やさしい青。",
    examples: ["色あせたジーンズ", "晴れた日の海面", "歩道橋の青い手すり"],
  },
  indigo: {
    description: "紫を少し含む、落ち着いた青。",
    examples: ["日没直後の空", "使い込んだデニム", "夕方のビルに映る青紫の空"],
  },
  navy: {
    description: "灰色がかった、落ち着いた紺色。",
    examples: ["制服の紺の生地", "曇り空を映す窓", "青いトタン屋根の影"],
  },
  violet: {
    description: "少し青みのある、穏やかな紫。",
    examples: [
      "紫キャベツの切り口",
      "なすの皮に映った光",
      "夕方の空に浮かぶ雲",
    ],
  },
  lavender: {
    description: "白を含む、ふんわりとした薄紫。",
    examples: ["藤棚から下がる花", "ぶどうミルクのアイス", "日没後の薄紫の雲"],
  },
  lilac: {
    description: "ピンクを少し含む、淡くくすんだ紫。",
    examples: [
      "薄紫のあじさい",
      "ぶどう味のマカロン",
      "夕暮れに照らされた白い壁",
    ],
  },
  pink: {
    description: "白を混ぜたような、やさしいピンク。",
    examples: ["桜の花びら", "いちごミルク", "夕焼けに染まった雲"],
  },
  rose: {
    description: "赤みを含んだ、落ち着いたピンク。",
    examples: [
      "ハムの切り口",
      "紅しょうがの漬け汁",
      "夕日を受けた赤レンガの壁",
    ],
  },
  coral: {
    description: "オレンジを含む、あたたかなピンク。",
    examples: [
      "サーモンの切り身",
      "ピンクグレープフルーツの果肉",
      "夕日を受けた白いマンション",
    ],
  },
  peach: {
    description: "オレンジとピンクのあいだの、淡い色。",
    examples: [
      "桃の果肉",
      "夕焼けに染まった雲の縁",
      "集合住宅のピンクベージュの外壁",
    ],
  },
  beige: {
    description: "砂を思わせる、あたたかな薄茶色。",
    examples: ["段ボール箱の表面", "公園の砂地", "塗装されていない木の机"],
  },
  ochre: {
    description: "黄色を含む、土のような茶色。",
    examples: ["乾いた土の道", "古い家の土壁", "秋のケヤキの落ち葉"],
  },
  brown: {
    description: "灰色を少し含む、やわらかな茶色。",
    examples: ["木製の公園のベンチ", "段ボール箱の切り口", "街路樹の乾いた幹"],
  },
  slate: {
    description: "青と緑を少し含む、穏やかな灰色。",
    examples: [
      "雨にぬれたコンクリート",
      "曇り空を映したビルの窓",
      "古いトタン屋根",
    ],
  },
  gray: {
    description: "白と黒のあいだの、やさしい灰色。",
    examples: ["コンクリートの壁", "歩道の石畳", "曇った空の雲"],
  },
  brick: {
    description: "茶色を含んだ、深みのある赤。",
    examples: ["赤レンガの建物", "屋根の赤い瓦", "乾いた紅葉の落ち葉"],
  },
  terracotta: {
    description: "赤とオレンジを含む、あたたかな土の色。",
    examples: ["ベランダの素焼きの植木鉢", "赤土の道", "洋風の家の瓦屋根"],
  },
  rust: {
    description: "オレンジを含む、落ち着いた赤茶色。",
    examples: ["さびた鉄のフェンス", "松の木の皮", "乾いた茶色の落ち葉"],
  },
  amber: {
    description: "茶色を少し含む、琥珀のような黄橙色。",
    examples: [
      "茶色の薬瓶に光が透けた部分",
      "窓際の紅茶",
      "夕日を映した窓ガラス",
    ],
  },
  honey: {
    description: "はちみつを思わせる、やわらかな黄金色。",
    examples: ["瓶に入ったはちみつ", "麦わら帽子", "日差しを受けた枯れ草"],
  },
  cream: {
    description: "黄色をほんのり含む、あたたかな白。",
    examples: ["バニラアイス", "食パンの内側", "古い本の紙"],
  },
  white: {
    description: "明るく、色みの少ない白。",
    examples: ["綿雲", "白いごはん", "白いタイルの外壁"],
  },
  black: {
    description: "光をやさしく受ける、深い黒。",
    examples: ["自転車のタイヤ", "黒い革靴", "建物の黒い鉄製フェンス"],
  },
};
