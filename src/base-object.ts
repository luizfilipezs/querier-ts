import { PartialOfProperties } from './utils/types';

export abstract class BaseObject {
  constructor(init: PartialOfProperties<BaseObject> = {}) {
    this.setAttributes(init as Partial<this>);
  }

  setAttribute<K extends keyof this>(attribute: K, value: this[K]): void {
    this[attribute] = value;
  }

  setAttributes(attributes: PartialOfProperties<this>): void {
    Object.assign(this, attributes);
  }
}
