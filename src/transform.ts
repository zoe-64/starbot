export type TransformRule = { regex: RegExp | string; replace: string };
export type TransformFilter = TransformRule | TransformRule[];
export const filters: TransformFilter[] = [
  [{ regex: /sl|\'/g, replace: "" }],
  // replacement
  [
    { regex: /girl/g, replace: "gawi" },
    { regex: /water/g, replace: "wawa" },
    { regex: /the/g, replace: "da" },
  ],

  // letter drops
  [
    { regex: /(nt)$/g, replace: "n" },
    { regex: /(ter)$/g, replace: "te" },
    { regex: /(ing)$/g, replace: "in" },
    { regex: /(ve)$/g, replace: "v" },
  ],

  { regex: /(er)$|(et)$/g, replace: "ie" },
  [
    { regex: /th(?=[ri])/g, replace: "f" },
    { regex: /th/g, replace: "d" },
  ],
  [
    { regex: /^l/g, replace: "w" },
    { regex: /llo/g, replace: "wo" },
    { regex: /ll/g, replace: "wl" },
    { regex: /ri|l|r/g, replace: "w" },
  ],
  { regex: /time|tim/g, replace: "im" },
  { regex: /sh/g, replace: "ss" },
  { regex: /s(?!\b)/g, replace: "sh" },
  { regex: /good/g, replace: "gud" },
];

/**
 * Transforms words based on a set of transformation filters.
 * @param input The input string.
 * @param filters An array of transformation filters to apply.
 * @returns The transformed string.
 */
export function transformWords(
  input: string,
  filters: TransformFilter[]
): string {
  return filters.reduce((text, filter) => {
    if (Array.isArray(filter)) {
      // Apply transformations in sequence
      return filter.reduce(
        (tempText, { regex, replace }) =>
          tempText.replace(new RegExp(regex, "g"), replace),
        text
      );
    } else {
      // Apply single transformation
      return text.replace(new RegExp(filter.regex, "g"), filter.replace);
    }
  }, input);
}
