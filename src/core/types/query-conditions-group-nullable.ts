import type { NonFunctionKeys } from '../../utils/types/non-function-keys';
import type { PropertyOnly } from '../../utils/types/property-only';
import type { NullableCondition } from './nullable-condition';

export type QueryConditionsGroupNullable<T extends object> =
  NonFunctionKeys<T> extends never
    ? never
    : {
        [P in keyof PropertyOnly<T>]?: T[P] extends object
          ? QueryConditionsGroupNullable<T[P]>
          : NullableCondition<T[P]>;
      };
