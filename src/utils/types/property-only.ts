import { NonFunctionKeys } from 'utility-types';

export type PropertyOnly<T extends object> = {
  [P in NonFunctionKeys<T>]: T[P]
};
