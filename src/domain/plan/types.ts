export type SlotId = "breakfast" | "lunch" | "dinner" | "dessert";
export type RoundId = "r1" | "r2";

/** One meal in the timetable. `base` is the side served with a main that has no carb of its own. */
export type Cell = { r: string; base?: string };

export type Round = {
  id: RoundId;
  /** Day index (0 = Sunday) the round is cooked on. */
  cook: number;
  /** Day indexes the round feeds. */
  days: number[];
  mains: string[];
  sweets: string[];
  confirmed?: boolean;
  cooked?: boolean;
  cookPlan?: CookPlan;
};

export type CookStep = {
  title: string;
  detail: string;
  appliance: string;
  recipe: string;
  minutes: number | null;
  meanwhile: string | null;
};

/** `ordered` is false when the steps are each recipe in turn rather than a merged session. */
export type CookPlan = { minutes: number | null; steps: CookStep[]; storeTips: string[]; ordered: boolean };

export type Week = {
  rounds: Round[];
  /** Keyed "day|slot", e.g. "1|lunch". */
  cells: Record<string, Cell>;
  bought: Record<string, true>;
  prices: Record<string, number>;
};

export type Prefs = {
  never: string[];
  bases: string[];
  /** Set once the first-run setup is finished or skipped. */
  onboarded?: boolean;
  /** The getting-started checklist on Home was hidden. */
  checklistHidden?: boolean;
};
