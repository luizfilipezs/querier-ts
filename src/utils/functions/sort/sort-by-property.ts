import { GenericObject } from '../../types';

export function sortByProperty(property: string) {
  let sortOrder = 1;

  if (property.startsWith('-')) {
    sortOrder = -1;
    property = property.substring(1);
  }

  return function (a: GenericObject, b: GenericObject) {
    const result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}
