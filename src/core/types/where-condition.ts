import type { QueryConditionsGroupNullable } from './query-conditions-group-nullable';

export type WhereCondition<T extends object> =
  QueryConditionsGroupNullable<T> | ((row: T) => boolean);
