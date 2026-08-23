import type { addPrefixToObject } from '../../utils/types/add-prefix-to-object';
import type { PropOf } from '../../utils/types/prop-of';
import type { PropertyOnly } from '../../utils/types/property-only';

export type OrderingColumn<T extends object> =
  PropOf<T> | keyof addPrefixToObject<PropertyOnly<T>, '-'>;
