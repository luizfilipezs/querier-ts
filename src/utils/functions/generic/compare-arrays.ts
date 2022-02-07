/**
 * Compares two arrays.
 * 
 * @param {any[]} a First array to compare.
 * @param {any[]} b Second array to compare.
 * 
 * @returns {boolean} Validation result.
 */
export const compareArrays = (a: any[], b: any[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);
