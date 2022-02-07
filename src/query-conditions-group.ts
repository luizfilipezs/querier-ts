import { PropertyOnly } from './utils/types';

export type QueryConditionsGroup<T extends object> = {
  [P in keyof PropertyOnly<T>]?: T[P] extends object ? QueryConditionGroup<T[P]> : (T[P] | ((value: T[P]) => boolean));
};
