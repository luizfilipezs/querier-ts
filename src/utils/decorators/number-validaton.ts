import 'reflect-metadata';
import { InvalidArgumentError } from '../../errors';
import { isNumber } from '../functions/type-guards';

const minMetadataKey = Symbol('min');
const maxMetadataKey = Symbol('max');
const integerMetadataKey = Symbol('integer');

interface ParameterConfig {
  value?: number;
  index: number;
}

/**
 * Sets a minimal value to be used as argument to the given parameter.
 * 
 * @param {number} value Minimal value to set.
 * 
 * @returns Decorator function.
 */
export function min(value: number) {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    const minParameters: ParameterConfig[] = Reflect.getOwnMetadata(minMetadataKey, target, propertyKey) || [];
  
    minParameters.push({
      value,
      index: parameterIndex,
    });
  
    Reflect.defineMetadata(minMetadataKey, minParameters, target, propertyKey);
  }
}

/**
 * Sets a maximum value to be used as argument to the given parameter.
 * 
 * @param {number} value Maximal value to set.
 * 
 * @returns Decorator function.
 */
export function max(value: number) {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    const maxParameters: ParameterConfig[] = Reflect.getOwnMetadata(maxMetadataKey, target, propertyKey) || [];
  
    maxParameters.push({
      value,
      index: parameterIndex,
    });
  
    Reflect.defineMetadata(maxMetadataKey, maxParameters, target, propertyKey);
  }
}

/**
 * Marks the given parameter as an integer.
 * 
 * @param {Object} target Class to which the parameter belongs.
 * @param {string} propertyKey Method name.
 * @param {number} parameterIndex Parameter index.
 */
export function integer(target: object, propertyKey: string | symbol, parameterIndex: number) {
  const integerParameters: ParameterConfig[] = Reflect.getOwnMetadata(integerMetadataKey, target, propertyKey) || [];

  integerParameters.push({
    index: parameterIndex,
  });

  Reflect.defineMetadata(integerMetadataKey, integerParameters, target, propertyKey);
}

/**
 * Validates the property decorators `integer`, `min`, and `max`, throwing and error
 * when the arguments passed to the parameters decorated by them are invalid.
 * 
 * @param {any} target Class to which the method belongs.
 * @param {string} propertyName Method name.
 * @param {TypedPropertyDescriptor<any>} descriptor Descriptor object.
 * 
 * @throws {InvalidArgumentError} If an argument is invalid.
 */
export function validateNumbers(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
  const method = descriptor.value!;

  descriptor.value = function () {
    const minParams: ParameterConfig[] = Reflect.getOwnMetadata(minMetadataKey, target, propertyName) || [];
    const maxParams: ParameterConfig[] = Reflect.getOwnMetadata(maxMetadataKey, target, propertyName) || [];
    const integerParams: ParameterConfig[] = Reflect.getOwnMetadata(integerMetadataKey, target, propertyName) || [];

    checkMinParams(propertyName, minParams, arguments);
    checkMaxParams(propertyName, maxParams, arguments);
    checkIntegerParams(propertyName, integerParams, arguments);

    return method.apply(this, arguments);
  };
}

function checkMinParams(methodName: string, params: ParameterConfig[], actualArguments: IArguments) {
  for (const parameter of params) {
    const actualValue = actualArguments[parameter.index];
    const minValue = parameter.value!;

    if (!isNumber(actualValue) || actualValue < minValue) {
      throw new InvalidArgumentError({
        method: methodName,
        param: parameter.index,
        argument: actualValue,
        expected: `equal or greater than ${minValue}`,
      });
    }
  }
}

function checkMaxParams(methodName: string, params: ParameterConfig[], actualArguments: IArguments) {
  for (const parameter of params) {
    const actualValue = actualArguments[parameter.index];
    const maxValue = parameter.value!;

    if (!isNumber(actualValue) || actualValue > maxValue) {
      throw new InvalidArgumentError({
        method: methodName,
        param: parameter.index,
        argument: actualValue,
        expected: `equal or less than ${maxValue}`,
      });
    }
  }
}

function checkIntegerParams(methodName: string, params: ParameterConfig[], actualArguments: IArguments) {
  for (const { index } of params) {
    const actualValue = actualArguments[index];

    if (!Number.isSafeInteger(actualValue)) {
      throw new InvalidArgumentError({
        method: methodName,
        param: index,
        argument: actualValue,
        expected: 'an integer',
      });
    }
  }
}
