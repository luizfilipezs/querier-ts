import { PropertyOnly } from '.';

export type PartialOfProperties<T extends object> = Partial<PropertyOnly<T>>;
