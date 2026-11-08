import data from "@/data/starter-library.json";

export type Where = "market" | "bokku" | "supermarket" | "any";
export type Stock = "have" | "low" | "out";
export type PantryItem = { id: string; name: string; group: string; where: Where; fresh: boolean };

export const WHERE: Record<Where, string> = {
  market: "Open market",
  bokku: "Bokku",
  supermarket: "Ebeano / Spar",
  any: "Anywhere",
};
export const WHERE_ORDER: Where[] = ["market", "bokku", "supermarket", "any"];

export const GROUPS = ["Protein", "Dairy", "Carbs", "Produce", "Fats & oils", "Baking", "Spices", "Sauces", "Other"];

const items = (data as unknown as { pantry: PantryItem[] }).pantry;
const byId = new Map(items.map((p) => [p.id, p]));

export const pantryItems = () => items;
export const pantryItem = (id: string) => byId.get(id);

export const stockOf = (statuses: Record<string, Stock>, id: string): Stock => statuses[id] ?? "out";

export const NEXT_STOCK: Record<Stock, Stock> = { have: "low", low: "out", out: "have" };
export const STOCK_LABEL: Record<Stock, string> = { have: "Have", low: "Low", out: "Out" };
