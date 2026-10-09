/**
 * Next.js passes a repeated query key (`?q=a&q=b`) as an array. Read the
 * first value so page code can treat a search param as a plain string.
 */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
