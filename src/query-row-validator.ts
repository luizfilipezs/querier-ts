import { BaseObject } from './base-object';
import { compareArrays, getEntries } from './utils/functions/generic';
import { QueryConditionsGroupNullable } from './query-conditions-group-nullable';
import { isFunction, isObject } from './utils/functions/type-guards';

/**
 * Validator configuration.
 */
interface QueryRowValidatorInitializer<T extends object> {
  conditionsObject: QueryConditionsGroupNullable<T>;
  ignoreNullValues: boolean;
}

/**
 * Condition to apply to a row column.
 */
type ColumnCondition<T extends object, P extends keyof T> = T[P] extends object
  ? QueryConditionsGroupNullable<T[P]> | undefined
  : T[P] | ((value: T[P]) => boolean) | null | undefined;

/**
 * Validates a row in the query.
 */
export class QueryRowValidator<T extends object> extends BaseObject {
  /**
   * Row to be validated.
   */
  private row!: T;

  /**
   * Conditions to be applied to the row.
   */
  private conditionsObject!: QueryConditionsGroupNullable<T>;

  /**
   * Indicates whether conditions with `null` and `undefined` values should be
   * skipped.
   */
  private ignoreNullValues!: boolean;

  /**
   * Initializes the validator.
   *
   * @param {T} row Row to validated.
   * @param {QueryRowValidatorInitializer<T>} config Validator configuration.
   */
  private constructor(row: T, config: QueryRowValidatorInitializer<T>) {
    super({ row, ...config });
  }

  /**
   * Validates a row.
   *
   * @param {T} row Row to validated.
   * @param {QueryRowValidatorInitializer<T>} config Validator configuration.
   */
  static validate<T extends object>(row: T, config: QueryRowValidatorInitializer<T>): boolean {
    return new QueryRowValidator(row, config).validate();
  }

  /**
   * Applies the validation to the row.
   *
   * @returns {boolean} `true` if the row is valid, `false` otherwise.
   */
  private validate(): boolean {
    return this.validateConditions();
  }

  /**
   * Validates every condition.
   *
   * @returns {boolean} Validation result.
   */
  private validateConditions(): boolean {
    const conditionsEntries = getEntries(this.conditionsObject);

    return conditionsEntries.every(([columnName, condition]) => this.validateColumnCondition(columnName, condition));
  }

  /**
   * Validate a condition to a specific column.
   *
   * @param {P} columnName Column name.
   * @param {ColumnCondition<T, P>} condition Condition to be validated.
   *
   * @returns {boolean} Validation result.
   */
  private validateColumnCondition<P extends keyof T>(columnName: P, condition: ColumnCondition<T, P>): boolean {
    if (this.ignoreNullValues && (condition === null || condition === undefined)) {
      return true;
    }

    const cellValue = this.row[columnName];

    if (isFunction(condition)) {
      return condition(cellValue);
    }

    if (Array.isArray(condition)) {
      return Array.isArray(cellValue) ? compareArrays(cellValue, condition) : false;
    }

    if (isObject(condition)) {
      return isObject(cellValue) ? this.validateInnerObject(cellValue, condition) : false;
    }

    return cellValue === condition;
  }

  /**
   * Validates an object inside the row.
   *
   * @param {object} obj Object to validated.
   * @param {QueryConditionsGroupNullable<O>} conditionsObject Conditions to be applied to the object.
   *
   * @returns {boolean} Validation result.
   */
  private validateInnerObject<O extends object>(obj: O, conditionsObject: QueryConditionsGroupNullable<O>): boolean {
    return QueryRowValidator.validate(obj, {
      conditionsObject: conditionsObject,
      ignoreNullValues: this.ignoreNullValues,
    });
  }
}
