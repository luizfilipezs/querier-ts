import { sortByProperties } from './utils/functions/sort';
import { isFunction } from './utils/functions/type-guards';
import { addPrefixToObject, PropertyOnly, PropOf } from './utils/types';
import { QueryRowValidator } from './query-row-validator';
import { QueryConditionsGroup } from './query-conditions-group';
import { QueryConditionsGroupNullable } from './query-conditions-group-nullable';
import { integer, min, validateNumbers } from './utils/decorators/number-validaton';

/**
 * Allows filtering data from an array of objects.
 * 
 * @example
 * ```ts
 * interface User {
 *   id: string;
 *   email: string;
 *   isActive: boolean;
 *   createdAt: string;
 *   updatedAt: string;
 * }
 * 
 * const users: User[] = [];
 * 
 * // Filtering objects
 * 
 * const activeGmailUsers = Query.from(users)
 *   .where({
 *     isActive: true,
 *     email: (email) => email.endsWith('@gmail.com'),
 *   })
 *   .all();
 * 
 * // Selecting specific data
 * 
 * const userEmails = Query.from(users)
 *   .select('email')
 *   .column();
 * 
 * const lastUserId = Query.from(users)
 *   .select('id')
 *   .orderBy('-createdAt')
 *   .scalar();
 * 
 * // Checking information
 * 
 * const userExists = Query.from(users)
 *   .where({
 *     id: 'some-id',
 *   })
 *   .exists();
 * 
 * const numberOfUsers = Query.from(users).count();
 * ```
 */
export class Query<T extends object> {

  /**
   * Rows to be queried.
   */
  #rows: T[] = [];

  /**
   * Selected columns.
   */
  #columns: PropOf<T>[] = [];

  /**
   * Number of results to skip.
   */
  #startAt = 0;

  /**
   * Limit of results.
   */
  #limit?: number;

  /**
   * Indicates whether conditions with `null` and `undefined` values should be
   * skipped.
   */
  private ignoreNullValues: boolean = false;

  /**
   * Initializes the query.
   * 
   * @param {T[]} rows Rows to be queried.
   */
  private constructor(rows: T[]) {
    this.#rows = [...rows];
  }

  /**
   * Creates a new query based on the given data.
   * 
   * @param {T[]} rows Rows to be queried.
   * 
   * @returns {Query<T>} Query to the given rows.
   */
  static from<T extends object>(rows: T[]): Query<T> {
    return new Query(rows);
  }

  /**
   * Defines specific columns to be returned on the final results.
   * 
   * @param {PropOf<T> | PropOf<T>[]} columns Selected columns.
   * 
   * @returns {this} Current query. 
   */
  select(columns: PropOf<T> | PropOf<T>[]): this {
    this.#columns = Array.isArray(columns) ? columns : [columns];

    return this;
  }

  /**
   * Applies conditions to the query.
   * 
   * @param {QueryConditionsGroup<T> | ((obj: T) => boolean)} condition Filter to
   * be applied to the query.
   * 
   * If a callback function is provided, it must return a boolean value.
   * 
   * If an object is provided, its properties must be attributes of `T` and their
   * corresponding values must be the expected values for the attributes or a
   * callback functions that return boolean values.
   * 
   * @returns {this} Current query.
   */
  where(condition: QueryConditionsGroup<T> | ((obj: T) => boolean)): this {
    this.filterRows(condition);

    return this;
  }

  /**
   * Applies a set of conditions to the query ignoring `null` and `undefined`
   * values as conditions.
   * 
   * @param {QueryConditionsGroupNullable<T>} condition An object where each
   * property represents an attribute to be validated. The values can be
   * literal or callback functions that return a boolean. If `null` or `undefined`
   * is passed, that condition will be skipped.
   * 
   * @returns {this} Current query.
   */
  filterWhere(condition: QueryConditionsGroupNullable<T>): this {
    this.ignoreNullValues = true;
    this.filterRows(condition);
    this.ignoreNullValues = false;

    return this;
  }

  /**
   * Adds ordering to the results.
   * 
   * @param {(PropOf<T> | keyof addPrefixToObject<PropertyOnly<T>, '-'>)[]} columns
   * Ascending or descending columns. To mark a field as descending, use `-` before
   * its name.
   * 
   * @returns {this} Current query.
   */
  orderBy(...columns: (PropOf<T> | keyof addPrefixToObject<PropertyOnly<T>, '-'>)[]): this {
    this.#rows.sort(sortByProperties(...columns as string[]));

    return this;
  }

  /**
   * Returns the current number of rows.
   * 
   * @return {number}
   */
  count(): number {
    return this.getLimitedRows().length;
  }

  /**
   * Checks if there is at least one row compatible with the query.
   * 
   * @returns {boolean} Boolean indicating whether any row exists.
   */
  exists(): boolean {
    return this.count() > 0;
  }

  /**
   * Returns the first result.
   * 
   * @returns {T}
   */
  first(): T | null {
    const rows = this.getLimitedRows();

    return rows.length ? rows[0] : null;
  }

  /**
   * Returns the last result.
   * 
   * @returns {T}
   */
  last(): T | null {
    const rows = this.getLimitedRows();

    return rows[this.count() - 1] ?? null;
  }

  /**
   * Returns all results.
   * 
   * @returns {T[]}
   */
  all(): T[] {
    return this.getLimitedRows();
  }

  /**
   * Returns the value of the first (selected) column of the first row.
   * 
   * @returns {T[Promise<T>]|false} First value or `false`, if none row exists.
   */
  scalar(): T[PropOf<T>] | false {
    const firstObject = this.first();
    const firstColumn = this.getFirstColumn();

    return firstObject && firstColumn ?
      firstObject[firstColumn] ?? false :
      false;
  }

  /**
   * Returns the values of the first (selected) column of all rows.
   * 
   * @returns {T[Promise<T>][]} Values from the first (selected) column.
   */
  column(): T[PropOf<T>][] {
    const firstColumn = this.getFirstColumn();

    if (!firstColumn) {
      return [];
    }

    return this.getLimitedRows().map((row) => row[firstColumn]);
  }

  /**
   * Returns the values of the rows. If there are selected columns, only their
   * values will be returned.
   * 
   * @returns {T[PropOf<T>][][]} Array with the values of all rows.
   */
  values(): T[PropOf<T>][][] {
    return this.getLimitedRows()
      .map(
        (row) => this.#columns.length ? this.#columns.map((column) => row[column]) : Object.values(row)
      );
  }

  /**
   * Defines the number of rows to skip.
   * 
   * @param {number} numberOfRows Numbers of rows to skip. Only non negative integer numbers
   * are allowed.
   * 
   * @returns {this} Current query.
   * 
   * @throws {InvalidArgumentError} If the given number is less than 0.
   */
  @validateNumbers
  skip(@integer @min(0) numberOfRows: number): this {
    this.#startAt = numberOfRows;

    return this;
  }

  /**
   * Defines a limit for the number of results.
   * 
   * @param {number} limit Limit of results. Only non negative integer numbers are allowed.
   * 
   * @returns {this} Current query.
   * 
   * @throws {InvalidArgumentError} If the given limit is less than 0.
   */
  @validateNumbers
  limit(@integer @min(0) limit: number): this {
    this.#limit = limit;

    return this;
  }

  /**
   * Returns the rows that should be used in the final results.
   * 
   * @returns {T[]} Rows within the specified limit.
   */
  private getLimitedRows(): T[] {
    return this.#rows.slice(this.#startAt).slice(0, this.#limit);
  }

  /**
   * Returns the first selected column or the first key of some row.
   * 
   * @returns {Promise<T>|null} The first column or `null`, if none is selected
   * or there is no row.
   */
  private getFirstColumn(): PropOf<T> | null {
    if (this.#columns.length) {
      return this.#columns[0];
    }

    const firstObject = this.first();

    return firstObject ?
      Object.keys(firstObject)[0] as PropOf<T> :
      null;
  }

  /**
   * Filters the rows according to the given conditions.
   * 
   * @param {QueryConditionsGroupNullable<T> | ((obj: T) => boolean)} condition
   * Object or callback function.
   */
  private filterRows(condition: QueryConditionsGroupNullable<T> | ((obj: T) => boolean)): void {
    const isCallbackValidator = isFunction(condition);

    this.#rows = this.#rows.filter((row) => (
      isCallbackValidator ? condition(row) : this.validateRow(row, condition)
    ));
  }

  /**
   * Validates a row based on the given conditions object.
   * 
   * @param {T} row Row to validate.
   * @param {QueryConditionsGroupNullable<T>} condition Conditions object.
   * 
   * @returns {boolean} Validation result.
   */
  private validateRow(row: T, condition: QueryConditionsGroupNullable<T>): boolean {
    return QueryRowValidator.validate(row, {
      conditionsObject: condition,
      ignoreNullValues: this.ignoreNullValues,
    });
  }

}
