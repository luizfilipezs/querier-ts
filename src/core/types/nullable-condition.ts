export type NullableCondition<T> =
  T | ((value: T) => boolean) | null | undefined;
