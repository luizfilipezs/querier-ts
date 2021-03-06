import { PropertyOnly } from './utils/types';

export type QueryConditionsGroupNullable<T extends object> = {
  [P in keyof PropertyOnly<T>]?: T[P] extends object
    ? QueryConditionsGroupNullable<T[P]>
    : T[P] | ((value: T[P]) => boolean) | null;
};
