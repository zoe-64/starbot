export type TransformRule = { regex: RegExp | string; replace: string };
export type TransformFilter = TransformRule | TransformRule[];

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
