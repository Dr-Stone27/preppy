/** "1 meal", "3 meals": a count with the word in the right number. */
export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
