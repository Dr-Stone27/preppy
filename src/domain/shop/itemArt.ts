/**
 * The picture for a shopping or pantry item: Microsoft's Fluent Emoji (3D), MIT licence, served from /items.
 * Rules run in order and the first match wins, so the specific comes before the general
 * ("tomato paste" is a tin before it is a tomato; "garlic powder" is garlic, not a jar).
 * Items with no picture of their own take a jar or a bottle by how they're kept, then a picture for their group.
 */
const RULES: [RegExp, string][] = [
  // tins and cartons first
  [/tomato paste|tinned|canned|condensed|evaporated/, "canned_food"],
  [/lemon|lime/, "lemon"],
  [/juice/, "beverage_box"],
  [/broth|stock\b/, "pot_of_food"],
  // fresh produce
  [/chocolate|cocoa/, "chocolate_bar"],
  [/scotch bonnet|rodo|chil+i|cayenne|paprika|gochugaru|kashmiri|cameroon pepper|suya|yaji|sriracha|peri peri/, "hot_pepper"],
  [/tatashe|bell pepper/, "bell_pepper"],
  [/tomato/, "tomato"],
  [/spring onion|scallion/, "leafy_green"],
  [/onion/, "onion"],
  [/garlic/, "garlic"],
  [/ginger/, "ginger_root"],
  [/carrot/, "carrot"],
  [/cucumber/, "cucumber"],
  [/peas\b|pea pod/, "pea_pod"],
  [/mixed vegetables|broccoli/, "broccoli"],
  [/cabbage|spinach|ugu|watercress|lettuce|kale|scent lea/, "leafy_green"],
  [/coriander|parsley|thyme|rosemary|oregano|basil|bay lea|italian seasoning|mint|herb/, "herb"],
  [/pineapple/, "pineapple"],
  [/plantain|banana/, "banana"],
  [/sweet potato|\byam\b/, "roasted_sweet_potato"],
  [/potato(?!.*starch)/, "potato"],
  [/\bcorn\b|sweetcorn/, "ear_of_corn"],
  // ground spices and seasonings that aren't named after a picture above
  [/flour|starch|seasoning|spice|powder|peppercorn|five-spice/, "jar"],
  // protein
  [/crayfish|shrimp|prawn/, "shrimp"],
  [/chicken|turkey|gizzard|wing|drumstick/, "poultry_leg"],
  [/beef|goat|mutton|lamb|steak|mince|meat/, "cut_of_meat"],
  [/egg/, "egg"],
  [/beans|lentil|iru|locust/, "beans"],
  [/peanut butter/, "jar"],
  [/peanut|groundnut/, "peanuts"],
  [/cashew|nut\b|nuts/, "chestnut"],
  [/makhana|popcorn/, "popcorn"],
  [/skewer/, "oden"],
  // dairy
  [/butter/, "butter"],
  [/cheese|provolone|mozzarella|parmesan/, "cheese_wedge"],
  [/yog(h)?urt/, "bowl_with_spoon"],
  [/milk/, "glass_of_milk"],
  // carbs
  [/rice(?! vinegar)/, "cooked_rice"],
  [/spaghetti|macaroni|pasta/, "spaghetti"],
  [/noodle/, "steaming_bowl"],
  [/bread|toast/, "bread"],
  [/garri|semo|\bpap\b|ogi|oats|cornflakes|cereal|egusi/, "bowl_with_spoon"],
  // sweet things
  [/honey/, "honey_pot"],
  // oils and liquids
  [/olive oil/, "olive"],
  [/mayonnaise|mustard|gochujang/, "jar"],
  [/oil|spray|vinegar|sauce|wine|extract|ketchup|soy\b/, "pouring_liquid"],
  [/^salt$|\bsalt\b/, "salt"],
];

const BY_GROUP: Record<string, string> = {
  Produce: "leafy_green",
  Protein: "cut_of_meat",
  Dairy: "glass_of_milk",
  Carbs: "cooked_rice",
  "Fats & oils": "pouring_liquid",
  Sauces: "pouring_liquid",
};

/** Some pictures need a colour change: tatashe is a red pepper, and the only pepper picture is green. */
const TINT: [RegExp, string][] = [[/tatashe|red bell|bell peppers$/, "hue-rotate(-95deg) saturate(1.4)"]];

export function itemArt(name: string, group = ""): { src: string; filter?: string } {
  const n = name.toLowerCase();
  const file = RULES.find(([re]) => re.test(n))?.[1] ?? BY_GROUP[group] ?? "jar";
  const filter = file === "bell_pepper" && !/green/.test(n) ? TINT.find(([re]) => re.test(n))?.[1] : undefined;
  return { src: `/items/${file}.png`, filter };
}

/** Every picture the rules can name, for the build script that copies them in. */
export const ITEM_ART_FILES = [...new Set([...RULES.map(([, f]) => f), ...Object.values(BY_GROUP), "jar"])];
