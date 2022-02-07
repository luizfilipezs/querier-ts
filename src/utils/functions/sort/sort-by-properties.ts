import { sortByProperty } from '.';
import { GenericObject } from '../../types';

export function sortByProperties(...props: string[]) {
  return function (obj1: GenericObject, obj2: GenericObject) {
    const numberOfProperties = props.length;
    let result = 0;
    let i = 0;

    while (result === 0 && i < numberOfProperties) {
      result = sortByProperty(props[i])(obj1, obj2);
      i++;
    }

    return result;
  }
}
