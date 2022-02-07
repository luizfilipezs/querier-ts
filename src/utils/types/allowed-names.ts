import { FlagExcludedType } from '.';

/**
 * Gets the keys that are not flagged as 'never'.
 */
export type AllowedNames<Base, Type> = FlagExcludedType<Base, Type>[keyof Base];
