/** "1 meal", "3 meals": a count with the word in the right number. */
export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "yam", "yam and plantain", "yam, plantain and rice" */
export const listWords = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
