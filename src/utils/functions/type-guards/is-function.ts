/**
 * Determines if the given value is a function.
 * 
 * @param {any} value The value to check.
 * 
 * @returns {boolean} Validation result.
 */
export const isFunction = (value: any): value is (...args: any[]) => any => typeof value === 'function';
