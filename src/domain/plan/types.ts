export type SlotId = "breakfast" | "lunch" | "dinner" | "dessert";
export type RoundId = "r1" | "r2" | "r3";

/** One meal in the timetable. `base` is the side served with a main that has no carb of its own. */
export type Cell = { r: string; base?: string };

export type Round = {
  id: RoundId;
  /** Day of the week the round is cooked on, counted from the week's first day (0..6). */
  cook: number;
  /** Days the round feeds, counted the same way. */
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
  /** Prices paid, from when the list had them. No longer shown or written. */
  prices?: Record<string, number>;
};

export type Prefs = {
  never: string[];
  bases: string[];
  /** Days of the week (0 = Sunday) this person cooks on, one to three of them. Missing means Sunday and Wednesday. */
  cookDays?: number[];
  /** Set once the first-run setup is finished or skipped. */
  onboarded?: boolean;
  /** The getting-started checklist on Home was hidden. */
  checklistHidden?: boolean;
};
