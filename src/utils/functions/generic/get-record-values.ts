import type { PropOf } from '../../types/prop-of';

export const getRecordValues = <T extends object>(obj: T): T[PropOf<T>][] =>
  Object.values(obj) as T[PropOf<T>][];
