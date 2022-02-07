/**
 * Represents a class.
 */
export type Type<T = any> = new (...args: any[]) => T;
