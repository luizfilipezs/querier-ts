/**
 * Returns the entries of an object.
 * 
 * @param {object} obj The object to retrieve entries.
 * 
 * @returns {[string, any]} The entries of the object.
 */
export const getEntries = <T extends object>(obj: T): [[keyof T, T[keyof T]]] => Object.entries(obj) as any;
