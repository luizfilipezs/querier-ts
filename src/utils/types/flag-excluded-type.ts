/**
 * Transforms the type to flag all the undesired keys as 'never'.
 */
export type FlagExcludedType<Base, Type> = {
  [Key in keyof Base]: Base[Key] extends Type ? never : Key
};
