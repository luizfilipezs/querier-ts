/**
 * Determines if the given value is an object.
 * 
 * @param {any} value The value to check.
 * 
 * @returns {boolean} Validation result.
 */
export const isObject = (value: any): value is object => typeof value === 'object' && value !== null;
