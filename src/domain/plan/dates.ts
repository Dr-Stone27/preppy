export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const today0 = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
export const sundayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);
export const dateLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** Weeks are stored under their Sunday. */
export const weekKey = (weekStart: Date) => `w-${ymd(weekStart)}`;
export const weekStartFromKey = (key: string) => {
  const [y, m, d] = key.slice(2).split("-").map(Number);
  return new Date(y, m - 1, d);
};
