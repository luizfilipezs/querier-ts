/**
 * Determines if the given value is a number.
 * 
 * @param {any} value The value to check.
 * 
 * @returns {boolean} Validation result.
 */
export const isNumber = (value: any): value is number => typeof value === 'number';
