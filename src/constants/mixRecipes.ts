export interface MixIngredient {
  hex: string;
  weight: number;
}
export type MixRecipe = readonly MixIngredient[];
const red = "#E47770",
  yellow = "#EDD16C",
  blue = "#82B5DE";
const white = "#F4F0E7",
  green = "#8AC292",
  brown = "#A48168";
const violet = "#AA87CC",
  black = "#6C727D";
const recipe = (...ingredients: [string, number][]): MixRecipe =>
  ingredients.map(([hex, weight]) => ({ hex, weight }));
/** Illustration recipes, not an RGB claim about physical pigment mixing.
 * Every daily color has its own ingredients; the saved palette result remains exact. */
export const MIX_RECIPES: Record<string, MixRecipe> = {
  red: recipe([red, 0.8], [yellow, 0.1], [white, 0.1]),
  vermilion: recipe([red, 0.65], [yellow, 0.3], [white, 0.05]),
  orange: recipe([red, 0.45], [yellow, 0.55]),
  apricot: recipe([red, 0.3], [yellow, 0.4], [white, 0.3]),
  marigold: recipe([yellow, 0.75], [red, 0.25]),
  yellow: recipe([yellow, 0.85], [white, 0.15]),
  lime: recipe([yellow, 0.65], [blue, 0.2], [white, 0.15]),
  grass: recipe([yellow, 0.5], [blue, 0.3], [white, 0.2]),
  "pale-green": recipe([yellow, 0.3], [blue, 0.25], [white, 0.45]),
  leaf: recipe([yellow, 0.45], [blue, 0.45], [white, 0.1]),
  forest: recipe([yellow, 0.35], [blue, 0.45], [black, 0.2]),
  mint: recipe([green, 0.4], [blue, 0.2], [white, 0.4]),
  teal: recipe([green, 0.5], [blue, 0.4], [white, 0.1]),
  aqua: recipe([blue, 0.55], [green, 0.2], [white, 0.25]),
  sky: recipe([blue, 0.65], [white, 0.35]),
  blue: recipe([blue, 0.8], [white, 0.2]),
  indigo: recipe([blue, 0.65], [red, 0.25], [white, 0.1]),
  navy: recipe([blue, 0.65], [black, 0.25], [white, 0.1]),
  violet: recipe([blue, 0.45], [red, 0.4], [white, 0.15]),
  lavender: recipe([blue, 0.25], [red, 0.25], [white, 0.5]),
  lilac: recipe([violet, 0.4], [red, 0.1], [white, 0.5]),
  pink: recipe([red, 0.4], [white, 0.6]),
  rose: recipe([red, 0.65], [blue, 0.15], [white, 0.2]),
  coral: recipe([red, 0.55], [yellow, 0.2], [white, 0.25]),
  peach: recipe([red, 0.3], [yellow, 0.2], [white, 0.5]),
  beige: recipe([yellow, 0.2], [brown, 0.25], [white, 0.55]),
  ochre: recipe([yellow, 0.55], [brown, 0.35], [white, 0.1]),
  brown: recipe([red, 0.3], [yellow, 0.3], [blue, 0.25], [white, 0.15]),
  slate: recipe([blue, 0.25], [black, 0.35], [white, 0.4]),
  gray: recipe([black, 0.4], [white, 0.6]),
  brick: recipe([red, 0.6], [brown, 0.3], [white, 0.1]),
  terracotta: recipe([red, 0.4], [yellow, 0.25], [brown, 0.2], [white, 0.15]),
  rust: recipe([red, 0.4], [yellow, 0.2], [brown, 0.4]),
  amber: recipe([yellow, 0.65], [red, 0.2], [brown, 0.15]),
  honey: recipe([yellow, 0.45], [brown, 0.15], [white, 0.4]),
  cream: recipe([yellow, 0.15], [white, 0.85]),
  white: recipe(["#FFFFFF", 0.85], ["#F3F4F2", 0.15]),
  black: recipe([black, 0.65], [blue, 0.2], [brown, 0.15]),
  crimson: recipe([red, 0.65], [blue, 0.2], [black, 0.15]),
  scarlet: recipe([red, 0.85], [yellow, 0.15]),
  ruby: recipe([red, 0.6], [blue, 0.3], [white, 0.1]),
  raspberry: recipe([red, 0.45], [blue, 0.3], [black, 0.15], [white, 0.1]),
  blush: recipe([red, 0.2], [violet, 0.1], [white, 0.7]),
  magenta: recipe([red, 0.55], [blue, 0.3], [white, 0.15]),
  mauve: recipe([violet, 0.35], [red, 0.2], [white, 0.35], [black, 0.1]),
  orchid: recipe([violet, 0.5], [red, 0.15], [white, 0.35]),
  amethyst: recipe([violet, 0.6], [blue, 0.2], [white, 0.2]),
  iris: recipe([blue, 0.5], [violet, 0.4], [white, 0.1]),
  plum: recipe([violet, 0.5], [red, 0.15], [black, 0.25], [white, 0.1]),
  periwinkle: recipe([blue, 0.4], [violet, 0.2], [white, 0.4]),
  cobalt: recipe([blue, 0.8], [black, 0.15], [white, 0.05]),
  cerulean: recipe([blue, 0.75], [green, 0.15], [white, 0.1]),
  ocean: recipe([blue, 0.65], [green, 0.15], [black, 0.2]),
  "ice-blue": recipe([blue, 0.2], [green, 0.05], [white, 0.75]),
  turquoise: recipe([blue, 0.45], [green, 0.45], [white, 0.1]),
  midnight: recipe([blue, 0.55], [black, 0.4], [violet, 0.05]),
  lemon: recipe([yellow, 0.6], [white, 0.4]),
  tangerine: recipe([red, 0.6], [yellow, 0.4]),
  gold: recipe([yellow, 0.6], [brown, 0.3], [white, 0.1]),
  pistachio: recipe([yellow, 0.35], [green, 0.2], [white, 0.45]),
  emerald: recipe([green, 0.6], [blue, 0.25], [black, 0.15]),
  seafoam: recipe([green, 0.25], [blue, 0.1], [white, 0.65]),
  silver: recipe([white, 0.8], [black, 0.15], [blue, 0.05]),
  charcoal: recipe([black, 0.7], [blue, 0.2], [white, 0.1]),
};
export function recipeForColor(colorId: string): MixRecipe {
  return MIX_RECIPES[colorId] ?? MIX_RECIPES["pale-green"];
}
export function ingredientForBubble(
  recipe: MixRecipe,
  index: number,
): MixIngredient {
  const total = recipe.reduce((sum, item) => sum + item.weight, 0);
  const position =
    ((index % 2) * 0.5 + Math.floor(index / 2) * 0.1 + 0.05) * total;
  let cumulative = 0;
  return (
    recipe.find((item) => {
      cumulative += item.weight;
      return cumulative >= position;
    }) ?? recipe[recipe.length - 1]
  );
}
