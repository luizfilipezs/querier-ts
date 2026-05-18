import type { ArraySource } from './core/types/array-source';
import type { FilterWhereCondition } from './core/types/filter-where-condition';
import type { OrderingColumn } from './core/types/ordering-column';
import type { ValidationOptions } from './core/types/validation-options';
import type { WhereCondition } from './core/types/where-condition';
import {
  integer,
  min,
  validateNumbers,
} from './core/validation/decorators/number-validaton';
import { QueryRowValidator } from './core/validation/query-row-validator';
import { getObjectPropertyNames } from './utils/functions/generic/get-object-property-names';
import { sortByCallback } from './utils/functions/sort/sort-by-callback';
import { sortByProperties } from './utils/functions/sort/sort-by-properties';
import { isFunction } from './utils/functions/type-guards/is-function';
import type { KeysOfType } from './utils/types/keys-of-type';
import type { PropOf } from './utils/types/prop-of';

/**
 * A fluent, immutable-like query builder for in-memory collections.
 *
 * Provides a set of methods to filter, transform, group, aggregate and
 * retrieve data from an array of objects, inspired by database query APIs.
 *
 * All transformation methods (e.g. `select`, `map`) return a new `Query`
 * instance, preserving the original query state. Filtering and stateful
 * operations (e.g. `where`, `orderBy`, `skip`, `limit`) mutate the current instance.
 *
 * @typeParam T - The shape of the objects being queried.
 *
 * @example
 * ```ts
 * const results = Query.from(users)
 *   .where({
 *      active: true,
 *      email: (email) => email.endsWith('@example.com'),
 *    })
 *   .orderBy('-createdAt')
 *   .select('id', 'name')
 *   .skip(10)
 *   .limit(5)
 *   .all();
 * ```
 *
 * @example
 * ```ts
 * const total = Query.from(products)
 *   .where(p => p.category === 'books')
 *   .sum('price');
 * ```
 *
 * @example
 * ```ts
 * const grouped = Query.from(users)
 *   .groupBy('role');
 * // Map<Role, User[]>
 * ```
 *
 * @remarks
 * - All operations are performed in memory.
 * - Ordering is applied to the current dataset at the moment `orderBy` is called.
 * - `skip` and `limit` are only applied when retrieving results (`all`, `first`, etc.).
 */
export class Query<T extends object> {
  /**
   * Rows to be queried.
   */
  #rows: T[] = [];

  /**
   * Number of results to skip.
   */
  #startAt = 0;

  /**
   * Limit of results.
   */
  #limit: number | null = null;

  /**
   * Initializes the query.
   *
   * @param rows Rows to be queried.
   */
  private constructor(rows: T[]) {
    this.#rows = rows;
  }

  /**
   * Creates a new query based on the given data.
   *
   * @param rows Rows to be queried.
   *
   * @returns Query to the given rows.
   */
  static from<T extends object>(rows: ArraySource<T>): Query<T> {
    return new Query(Array.from(rows));
  }

  /**
   * Defines specific columns to be returned on the final results.
   *
   * @param columns Selected columns.
   *
   * @returns Current query.
   */
  select<TColumns extends PropOf<T>[]>(
    ...columns: TColumns
  ): Query<{ [P in TColumns[number]]: T[P] }> {
    type _Row = { [P in TColumns[number]]: T[P] };

    // extract selected columns
    const source = this.#rows;
    const rows: _Row[] = [];

    for (let i = 0; i < source.length; i++) {
      const result = {} as _Row;

      for (const column of columns) {
        result[column] = source[i]![column];
      }

      rows.push(result);
    }

    // create new query
    const query = new Query(rows);
    this.cloneStateInto(query);

    return query;
  }

  /**
   * Maps each row to a new object and returns a new query.
   *
   * @param callback Function to be called for each row.
   * @returns New query with the mapped rows.
   */
  map<TReturn extends object>(
    callback: (row: T, index: number) => TReturn
  ): Query<TReturn> {
    // map rows
    const source = this.#rows;
    const rows: TReturn[] = [];

    for (let i = 0; i < source.length; i++) {
      rows.push(callback(source[i]!, i));
    }

    // create new query
    const query = new Query(rows);
    this.cloneStateInto(query);

    return query;
  }

  /**
   * Removes duplicate rows based on a key.
   *
   * @param key Key to be used for comparison.
   * @returns Current query.
   */
  distinct<K extends PropOf<T>>(key: K): this;

  /**
   * Removes duplicate rows based on a function.
   *
   * @param fn Function to be used for comparison.
   * @returns Current query.
   */
  distinct<TValue>(fn: (row: T) => TValue): this;

  distinct<K extends PropOf<T>, TValue>(arg: K | ((row: T) => TValue)): this {
    const seen = new Set<unknown>();
    const result: T[] = [];

    const rows = this.#rows;
    const isFn = isFunction(arg);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const value = isFn ? arg(row) : row[arg];

      if (!seen.has(value)) {
        seen.add(value);
        result.push(row);
      }
    }

    this.#rows = result;

    return this;
  }

  /**
   * Applies conditions to the query.
   *
   * @param condition Filter to be applied to the query.
   *
   * If a callback function is provided, it must return a boolean value.
   *
   * If an object is provided, its properties must be attributes of `T` and their
   * corresponding values must be the expected values for the attributes or a
   * callback functions that return boolean values.
   *
   * @returns Current query.
   */
  where(condition: WhereCondition<T>): this {
    this.filterRows(condition);

    return this;
  }

  /**
   * Applies a set of conditions to the query ignoring `null` and `undefined`
   * values as conditions.
   *
   * @param condition An object where each property represents an attribute
   * to be validated. The values can be literal or callback functions that
   * return a boolean. If `null` or `undefined` is passed, that condition
   * will be skipped.
   *
   * @returns Current query.
   */
  filterWhere(condition: FilterWhereCondition<T>): this {
    this.filterRows(condition, { ignoreNullValues: true });

    return this;
  }

  /**
   * Adds ordering to the results.
   *
   * @param columns Ascending or descending columns. To mark a field as
   * descending, prefix it with `-`.
   *
   * @returns Current query.
   */
  orderBy(...columns: OrderingColumn<T>[]): this;

  /**
   * Adds ordering to the results.
   *
   * @param fn Function to map each row to a value.
   * @param order Sort order. Defaults to `asc`.
   *
   * @returns Current query.
   */
  orderBy<TReturn>(fn: (row: T) => TReturn, order?: 'asc' | 'desc'): this;

  orderBy(...arg: unknown[]): this {
    if (arg.length > 0) {
      this.#rows = this.#rows.sort(
        isFunction(arg[0])
          ? sortByCallback(arg[0], arg[1] === 'desc' ? -1 : 1)
          : sortByProperties(...(arg as OrderingColumn<T>[]))
      );
    }

    return this;
  }

  /**
   * Defines the number of rows to skip.
   *
   * @param numberOfRows Numbers of rows to skip. Only non negative integer numbers
   * are allowed.
   *
   * @returns Current query.
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
   * @param limit Limit of results. Only non negative integer numbers are allowed.
   *
   * @returns Current query.
   *
   * @throws {InvalidArgumentError} If the given limit is less than 0.
   */
  @validateNumbers
  limit(@integer @min(0) limit: number): this {
    this.#limit = limit;

    return this;
  }

  /**
   * Limits the number of rows per group.
   *
   * @param key Key to group by.
   * @param limit Maximum number of rows per group.
   *
   * @returns Current query.
   */
  limitPerGroup<K extends keyof T>(key: K, limit: number): this;

  /**
   * Limits the number of rows per group using a callback.
   *
   * @param fn Function to define the group key.
   * @param limit Maximum number of rows per group.
   *
   * @returns Current query.
   */
  limitPerGroup<TValue>(fn: (row: T) => TValue, limit: number): this;

  @validateNumbers
  limitPerGroup<K extends keyof T, TValue>(
    arg: K | ((row: T) => TValue),
    @integer @min(0) limit: number
  ): this {
    const counts = new Map<unknown, number>();
    const result: T[] = [];

    const rows = this.#rows;
    const isFn = isFunction(arg);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const group = isFn ? arg(row) : row[arg];
      const count = counts.get(group) ?? 0;

      if (count < limit) {
        result.push(row);
        counts.set(group, count + 1);
      }
    }

    this.#rows = result;

    return this;
  }

  /**
   * Keep the top N rows.
   *
   * @param limit Maximum number of rows per group.
   *
   * @returns Current query.
   */
  top(limit: number): this;

  /**
   * Keep the top N rows, optionally partitioned by a key or callback.
   *
   * @param limit Maximum number of rows per group (or globally if no partition is provided).
   * @param options Options to define partitioning and ordering.
   *
   * @returns Current query.
   */
  top<K extends keyof T>(
    limit: number,
    options: {
      partitionBy: K;
      orderBy?: OrderingColumn<T> | OrderingColumn<T>[];
    }
  ): this;

  /**
   * Keep the top N rows, optionally partitioned by a key or callback.
   *
   * @param limit Maximum number of rows per group (or globally if no partition is provided).
   * @param options Options to define partitioning and ordering.
   *
   * @returns Current query.
   */
  top<TValue>(
    limit: number,
    options: {
      partitionBy: (row: T) => TValue;
      orderBy?: OrderingColumn<T> | OrderingColumn<T>[];
    }
  ): this;

  @validateNumbers
  top<K extends keyof T, TValue>(
    @integer @min(0) limit: number,
    options?: {
      partitionBy?: K | ((row: T) => TValue);
      orderBy?: OrderingColumn<T> | OrderingColumn<T>[];
    }
  ): this {
    const rows = this.getLimitedRows();

    if (rows.length === 0) {
      return this;
    }

    const { partitionBy, orderBy } = options ?? {};

    if (orderBy) {
      const columns = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.#rows = rows.sort(sortByProperties(...columns));
    }

    // if no partition is provided, it's a simple global limit
    if (!partitionBy) {
      this.#rows = rows.slice(0, limit);
      return this;
    }

    const isFn = isFunction(partitionBy);
    const counts = new Map<unknown, number>();
    const result: T[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const group = isFn ? partitionBy(row) : row[partitionBy];
      const count = counts.get(group) ?? 0;

      if (count < limit) {
        result.push(row);
        counts.set(group, count + 1);
      }
    }

    this.#rows = result;

    return this;
  }

  /**
   * Returns all results.
   *
   * @returns All filtered rows.
   */
  all(): T[] {
    return this.getLimitedRows();
  }

  /**
   * Returns the first result.
   *
   * @returns The first result.
   */
  first(): T | null {
    const rows = this.getLimitedRows();

    return rows.length > 0 ? rows[0]! : null;
  }

  /**
   * Returns the last result.
   *
   * @returns The last result.
   */
  last(): T | null {
    const rows = this.getLimitedRows();

    return rows[rows.length - 1] ?? null;
  }

  /**
   * Returns the current number of rows.
   *
   * @return Filtered rows count.
   */
  count(): number {
    return this.getLimitedRows().length;
  }

  /**
   * Checks if there is at least one row compatible with the query.
   *
   * @returns Whether any row exists after filtering.
   */
  exists(): boolean {
    return this.count() > 0;
  }

  /**
   * Returns the value of the first (selected) column of the first row.
   *
   * @returns First value or `false`, if none row exists.
   */
  scalar(): T[PropOf<T>] | false {
    const firstObject = this.first();
    const firstColumn = this.getFirstColumn();

    return firstObject && firstColumn ? firstObject[firstColumn] : false;
  }

  /**
   * Returns the values from the first column for all rows.
   *
   * @returns An array containing the values of the first column for each row.
   */
  column(): T[PropOf<T>][];

  /**
   * Returns the values from a specific column for all rows.
   *
   * @param column The column whose values should be retrieved.
   *
   * @returns An array containing the values of the specified column for each row.
   */
  column<TColumn extends PropOf<T>>(column: TColumn): T[TColumn][];

  /**
   * Returns an array with the rows mapped by a callback.
   *
   * @param mapFn Callback to map the rows.
   * @returns An array containing the mapped rows.
   */
  column<TReturn>(mapFn: (row: T) => TReturn): TReturn[];

  /**
   * Internal implementation for retrieving column values.
   *
   * If no column is provided, the first available column is used.
   * Returns an empty array if there are no rows or no columns.
   */
  column(columnOrMapFn?: PropOf<T> | ((row: T) => unknown)): unknown[] {
    const source = this.getLimitedRows();
    const length = source.length;

    if (length === 0) {
      return [];
    }

    if (columnOrMapFn === undefined) {
      const firstColumn = this.getFirstColumn();

      if (!firstColumn) {
        return [];
      }

      columnOrMapFn = firstColumn;
    }

    const values: unknown[] = [];

    for (let i = 0; i < length; i++) {
      const row = source[i]!;

      values.push(
        isFunction(columnOrMapFn) ? columnOrMapFn(row) : row[columnOrMapFn]
      );
    }

    return values;
  }

  /**
   * Returns the values of the rows. If there are selected columns, only their
   * values will be returned.
   *
   * @returns Array with the values of all rows.
   */
  values(): T[PropOf<T>][][] {
    type _Values = T[PropOf<T>][];

    const source = this.getLimitedRows();
    const rows: _Values[] = [];

    for (let i = 0; i < source.length; i++) {
      rows.push(Object.values(source[i]!) as _Values);
    }

    return rows;
  }

  /**
   * Groups the results by a specific key.
   *
   * @param key Key to group by.
   *
   * @returns Grouped results.
   */
  groupBy<K extends keyof T>(key: K): Map<T[K], T[]>;

  /**
   * Groups the results by a specific key.
   *
   * @param key Key to group by.
   * @param mapKey Key to map each row to.
   *
   * @returns Grouped results.
   */
  groupBy<KGroup extends keyof T, KValue extends keyof T>(
    key: KGroup,
    mapKey: KValue
  ): Map<T[KGroup], T[KValue][]>;

  /**
   * Groups the results by a specific key.
   *
   * @param key Key to group by.
   * @param mapKey Key to map each row to.
   * @param aggregateFn Callback to aggregate each group.
   *
   * @returns Grouped results.
   */
  groupBy<KGroup extends keyof T, KValue extends keyof T, TAggregated>(
    key: KGroup,
    mapKey: KValue,
    aggregateFn: (values: T[KValue][], groupKey: T[KGroup]) => TAggregated
  ): Map<T[KGroup], TAggregated>;

  /**
   * Groups the results by a specific key.
   *
   * @param key Key to group by.
   * @param mapFn Callback to map each row to a new value.
   *
   * @returns Grouped results.
   */
  groupBy<K extends keyof T, TReturn>(
    key: K,
    mapFn: (row: T) => TReturn
  ): Map<T[K], TReturn[]>;

  /**
   * Groups the results by a specific key.
   *
   * @param key Key to group by.
   * @param mapFn Callback to map each row to a new value.
   * @param aggregateFn Callback to aggregate each group.
   *
   * @returns Grouped results.
   */
  groupBy<K extends keyof T, TMapped, TAggregated>(
    key: K,
    mapFn: (row: T) => TMapped,
    aggregateFn: (values: TMapped[], groupKey: T[K]) => TAggregated
  ): Map<T[K], TAggregated>;

  /**
   * Groups the results by a callback.
   *
   * @param groupFn Callback to group by.
   *
   * @returns Grouped results.
   */
  groupBy<TGrouper>(groupFn: (row: T) => TGrouper): Map<TGrouper, T[]>;

  /**
   * Groups the results by a callback.
   *
   * @param groupFn Callback to group by.
   * @param mapKey Key to map each row to.
   *
   * @returns Grouped results.
   */
  groupBy<TGrouper, KMapped extends keyof T>(
    groupFn: (row: T) => TGrouper,
    mapKey: KMapped
  ): Map<TGrouper, T[]>;

  /**
   * Groups the results by a callback.
   *
   * @param groupFn Callback to group by.
   * @param mapFn Callback to map each row to a new value.
   *
   * @returns Grouped results.
   */
  groupBy<TGrouper, TMapped>(
    groupFn: (row: T) => TGrouper,
    mapFn: (row: T) => TMapped
  ): Map<TGrouper, TMapped[]>;

  /**
   * Groups the results by a callback.
   *
   * @param groupFn Callback to group by.
   * @param mapKey Key to map each row to.
   * @param aggregateFn Callback to aggregate each group.
   *
   * @returns Grouped results.
   */
  groupBy<TGrouper, KMapped extends keyof T, TAggregated>(
    groupFn: (row: T) => TGrouper,
    mapKey: KMapped,
    aggregateFn: (values: T[KMapped][], groupKey: TGrouper) => TAggregated
  ): Map<TGrouper, TAggregated>;

  /**
   * Groups the results by a callback.
   *
   * @param groupFn Callback to group by.
   * @param mapFn Callback to map each row to a new value.
   * @param aggregateFn Callback to aggregate each group.
   *
   * @returns Grouped results.
   */
  groupBy<TGrouper, TMapped, TAggregated>(
    groupFn: (row: T) => TGrouper,
    mapFn: (row: T) => TMapped,
    aggregateFn: (values: TMapped[], groupKey: TGrouper) => TAggregated
  ): Map<TGrouper, TAggregated>;

  groupBy(
    groupArg: keyof T | ((row: T) => unknown),
    mapArg?: keyof T | ((row: T) => unknown),
    aggregateFn?: (values: unknown[], groupKey: unknown) => unknown
  ): Map<unknown, unknown> {
    const rows = this.getLimitedRows();
    const map = new Map<unknown, unknown[]>();
    const hasCallback = isFunction(groupArg);
    const hasMapCallback = isFunction(mapArg);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const key = hasCallback ? groupArg(row) : row[groupArg];
      const value = mapArg ? (hasMapCallback ? mapArg(row) : row[mapArg]) : row;

      if (map.has(key)) {
        map.get(key)!.push(value);
      } else {
        map.set(key, [value]);
      }
    }

    if (!aggregateFn) {
      return map;
    }

    const aggrMap = new Map<unknown, unknown>();

    for (const [key, values] of map) {
      aggrMap.set(key, aggregateFn(values, key));
    }

    return aggrMap;
  }

  /**
   * Returns the minimum value of a column.
   *
   * @param key Column to get the minimum value from.
   * @returns Minimum value or `null`, if no rows exist.
   */
  min<K extends KeysOfType<T, number>>(key: K): number | null;

  /**
   * Returns the minimum value of the mapped rows by a callback.
   *
   * @param callback Callback to map the rows.
   * @returns Minimum value or `null`, if no rows exist.
   */
  min(callback: (row: T) => number): number | null;

  min(arg: KeysOfType<T, number> | ((row: T) => number)): number | null {
    const source = this.getLimitedRows();
    const length = source.length;

    if (length === 0) {
      return null;
    }

    const values: number[] = [];
    const isFn = isFunction(arg);

    for (let i = 0; i < length; i++) {
      const row = source[i]!;
      values.push(isFn ? arg(row) : (row[arg] as number));
    }

    return Math.min(...values);
  }

  /**
   * Returns the maximum value of a column.
   *
   * @param key Column to get the maximum value from.
   * @returns Maximum value or `null`, if no rows exist.
   */
  max<K extends KeysOfType<T, number>>(key: K): number | null;

  /**
   * Returns the maximum value of the mapped rows by a callback.
   *
   * @param callback Callback to map the rows.
   * @returns Maximum value or `null`, if no rows exist.
   */
  max(callback: (row: T) => number): number | null;

  max(arg: KeysOfType<T, number> | ((row: T) => number)): number | null {
    const source = this.getLimitedRows();
    const length = source.length;

    if (length === 0) {
      return null;
    }

    const values: number[] = [];
    const isFn = isFunction(arg);

    for (let i = 0; i < length; i++) {
      const row = source[i]!;
      values.push(isFn ? arg(row) : (row[arg] as number));
    }

    return Math.max(...values);
  }

  /**
   * Returns the sum of the values of a column.
   *
   * @param key Column to get the sum from.
   * @returns Sum.
   */
  sum<K extends KeysOfType<T, number>>(key: K): number;

  /**
   * Returns the sum of the mapped rows by a callback.
   *
   * @param callback Callback to map the rows.
   * @returns Sum.
   */
  sum(callback: (row: T) => number): number;

  sum(arg: KeysOfType<T, number> | ((row: T) => number)): number {
    const source = this.getLimitedRows();
    const length = source.length;

    if (length === 0) {
      return 0;
    }

    const values: number[] = [];
    const isFn = isFunction(arg);

    for (let i = 0; i < length; i++) {
      const row = source[i]!;
      values.push(isFn ? arg(row) : (row[arg] as number));
    }

    return values.reduce((total, value) => total + value, 0);
  }

  /**
   * Returns the average of the values of a column.
   *
   * @param key Column to get the average from.
   * @returns Average or `null`, if no rows exist.
   */
  average<K extends KeysOfType<T, number>>(key: K): number | null;

  /**
   * Returns the average of the mapped rows by a callback.
   *
   * @param callback Callback to map the rows.
   * @returns Average or `null`, if no rows exist.
   */
  average(callback: (row: T) => number): number | null;

  average(arg: KeysOfType<T, number> | ((row: T) => number)): number | null {
    const count = this.count();

    if (count === 0) {
      return null;
    }

    const sum = isFunction(arg) ? this.sum(arg) : this.sum(arg);

    return sum / count;
  }

  /**
   * Filters the rows according to the given conditions.
   *
   * @param condition Object or callback function.
   */
  private filterRows(
    condition: WhereCondition<T>,
    options?: ValidationOptions
  ): void {
    const rows = this.#rows;
    const result: T[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;

      if (QueryRowValidator.validate(row, condition, options)) {
        result.push(row);
      }
    }

    this.#rows = result;
  }

  /**
   * Returns the first selected column or the first key of some row.
   *
   * @returns The first column or `null`, if none is selected  or there is no row.
   */
  private getFirstColumn(): PropOf<T> | null {
    const firstRow = this.first();

    if (!firstRow) {
      return null;
    }

    const columns = getObjectPropertyNames(firstRow);

    return columns[0] ?? null;
  }

  /**
   * Returns the rows that should be used in the final results.
   *
   * @returns Rows within the specified limit.
   */
  private getLimitedRows(): T[] {
    return this.#rows.slice(
      this.#startAt,
      this.#startAt + (this.#limit ?? this.#rows.length)
    );
  }

  /**
   * Copies the state of the current query into the given query.
   *
   * @param query Query to copy the state into.
   */
  private cloneStateInto<O extends object>(query: Query<O>): void {
    query.#startAt = this.#startAt;
    query.#limit = this.#limit;
  }
}
