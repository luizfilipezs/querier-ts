import { PropertyOnly } from '.';

/**
 * Represents a property of a class or interface.
 */
export type PropOf<T extends object> = keyof PropertyOnly<T>;
