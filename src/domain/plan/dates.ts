export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const today0 = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
export const sundayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
/** The most recent `startDay` (0 = Sunday) on or before this date. */
export const weekStartOf = (d: Date, startDay: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() - startDay + 7) % 7));
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);
export const dateLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** "Tue" or "Tuesday" for day `i` of the week that starts on `weekStart`. */
export const dayName = (weekStart: Date, i: number, full = false) => (full ? DAY_FULL : DAYS)[(weekStart.getDay() + i) % 7];

/** Weeks are stored under their first day: the first cook day (Sunday for weeks planned before cook days could be chosen). */
export const weekKey = (weekStart: Date) => `w-${ymd(weekStart)}`;
export const weekStartFromKey = (key: string) => {
  const [y, m, d] = key.slice(2).split("-").map(Number);
  return new Date(y, m - 1, d);
};
