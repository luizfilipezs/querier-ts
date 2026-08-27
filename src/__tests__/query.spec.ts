import { expectType } from 'tsd';
import { InvalidArgumentError } from '../core/errors/invalid-argument-error';
import { Query } from '../query';

// MOCK DATA

interface Address {
  id: number;
  country: string;
  city: string;
  createdAt: number;
}

const addresses: Address[] = [
  { id: 1, country: 'Brazil', city: 'Brasília', createdAt: 1 },
  { id: 2, country: 'Brazil', city: 'São Paulo', createdAt: 2 },
  { id: 3, country: 'Brazil', city: 'Rio de Janeiro', createdAt: 3 },

  { id: 4, country: 'Chile', city: 'Santiago', createdAt: 1 },
  { id: 5, country: 'Chile', city: 'Valparaíso', createdAt: 2 },
  { id: 6, country: 'Chile', city: 'Concepción', createdAt: 3 },

  { id: 7, country: 'Argentina', city: 'Buenos Aires', createdAt: 1 },
  { id: 8, country: 'Argentina', city: 'Córdoba', createdAt: 2 },
];

interface UserPermissions {
  useCookies: boolean;
  sendNotifications: boolean;
}

class User {
  constructor(
    public id: number,
    public name: string,
    public permissions: UserPermissions,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public address: Address
  ) {}

  isAdmin(): boolean {
    return this.id === 1;
  }
}

const users: User[] = [
  new User(
    1,
    'John',
    { useCookies: true, sendNotifications: true },
    true,
    new Date('2023-01-01'),
    new Date('2023-01-10'),
    addresses[0]!
  ),
  new User(
    2,
    'Mary',
    { useCookies: false, sendNotifications: true },
    false,
    new Date('2023-02-01'),
    new Date('2023-02-10'),
    addresses[7]!
  ),
  new User(
    3,
    'Bob',
    { useCookies: true, sendNotifications: false },
    true,
    new Date('2023-03-01'),
    new Date('2023-03-10'),
    addresses[1]!
  ),
];

describe('Query', () => {
  describe('creation', () => {
    it('should create a query from array', () => {
      const query = Query.from(users);
      expect(query.all().length).toBe(3);
      expectType<Query<User>>(query);
    });

    it('should create a query from iterable (Set)', () => {
      const query = Query.from(new Set(users));
      expect(query.all().length).toBe(3);
      expectType<Query<User>>(query);
    });

    it('should create a query from valid iterable (Map.values())', () => {
      const query = Query.from(new Map(users.map((u) => [u.id, u])).values());
      expect(query.all().length).toBe(3);
      expectType<Query<User>>(query);
    });
  });

  describe('filtering', () => {
    describe('where()', () => {
      it('should filter using object conditions', () => {
        const result = Query.from(users).where({ isActive: true }).all();

        expect(result).toHaveLength(2);
        expect(result.every((u) => u.isActive)).toBe(true);
      });

      it('should filter using deep object conditions', () => {
        const result = Query.from(users)
          .where({ address: { country: 'Brazil' } })
          .all();

        expect(result).toHaveLength(2);
        expect(result.every((u) => u.address.country === 'Brazil')).toBe(true);
      });

      it('should filter using function condition', () => {
        const result = Query.from(users)
          .where((user) => user.isAdmin())
          .all();

        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(1);
      });

      it('should not allow unknown properties at development', () => {
        // @ts-expect-error
        const result = Query.from(users).where({ foo: 'bar' }).all();

        expect(result).toHaveLength(0);
      });

      it('should not allow empty object at development when type has no properties', () => {
        // @ts-expect-error
        const query = Query.from([{ fn: () => {} }]).where({});

        expectType<Query<{ fn: () => void }>>(query);
      });

      it('should combine multiple where calls', () => {
        const result = Query.from(users)
          .where({ isActive: true })
          .where((user) => user.permissions.useCookies)
          .all();

        expect(result).toHaveLength(2);
      });
    });

    describe('filterWhere()', () => {
      it('should ignore null conditions', () => {
        const result = Query.from(users)
          .filterWhere({
            isActive: null, // should be skipped
            id: 1,
          })
          .all();

        expect(result).toHaveLength(1);

        // avoid false positives
        const [firstRow] = result;

        expect(firstRow!.id).toBe(1);
        expect(firstRow!.isActive).not.toBeNull();
      });

      it('should ignore undefined conditions', () => {
        const result = Query.from(users)
          .filterWhere({
            isActive: undefined, // should be skipped
            id: 1,
          })
          .all();

        expect(result).toHaveLength(1);

        // avoid false positives
        const [firstRow] = result;

        expect(firstRow!.id).toBe(1);
        expect(firstRow!.isActive).not.toBeUndefined();
      });

      it('should work with deep conditions', () => {
        const result = Query.from(users)
          .filterWhere({
            address: {
              id: undefined, // should be skipped
              country: null, // should be skipped
              city: 'Brasília',
            },
          })
          .all();

        expect(result).toHaveLength(1);

        // avoid false positives
        const [firstRow] = result;

        expect(firstRow!.id).toBe(1);
        expect(firstRow!.address.city).toBe('Brasília');
        expect(firstRow!.address.id).not.toBeUndefined();
        expect(firstRow!.address.country).not.toBeNull();
      });

      it('should not allow unknown properties at development', () => {
        // @ts-expect-error
        const result = Query.from(users).filterWhere({ foo: 'bar' }).all();

        expect(result).toHaveLength(0);
      });

      it('should not allow empty object at development when type has no properties', () => {
        // @ts-expect-error
        const query = Query.from([{ fn: () => {} }]).filterWhere({});

        expectType<Query<{ fn: () => void }>>(query);
      });
    });

    describe('distinct()', () => {
      it('should return distinct values by key', () => {
        const result = Query.from(users)
          .select('isActive')
          .distinct('isActive')
          .all();

        expect(result).toEqual([{ isActive: true }, { isActive: false }]);
      });

      it('should return distinct values by callback', () => {
        const result = Query.from(users)
          .select('isActive')
          .distinct((user) => user.isActive)
          .all();

        expect(result).toEqual([{ isActive: true }, { isActive: false }]);
      });

      it('should preserve ordering', () => {
        const result = Query.from(users)
          .select('isActive')
          .orderBy('isActive')
          .distinct('isActive')
          .all();

        expect(result).toEqual([{ isActive: false }, { isActive: true }]);
      });
    });
  });

  describe('selection', () => {
    describe('select()', () => {
      it('should select a single column', () => {
        const result = Query.from(users).select('name').column();

        expect(result).toEqual(['John', 'Mary', 'Bob']);
      });

      it('should select multiple columns', () => {
        const result = Query.from(users).select('id', 'name').values();

        expect(result).toEqual([
          [1, 'John'],
          [2, 'Mary'],
          [3, 'Bob'],
        ]);
      });

      it('should return objects with only selected fields', () => {
        const result = Query.from(users).select('id', 'name').all();

        expect(result).toEqual([
          { id: 1, name: 'John' },
          { id: 2, name: 'Mary' },
          { id: 3, name: 'Bob' },
        ]);
      });

      it('should not include non-selected fields', () => {
        const result = Query.from(users).select('id').first();

        expect(result).toEqual({ id: 1 });
        expect((result as any).name).toBeUndefined();
      });

      it('should preserve ordering of the selected columns', () => {
        const ascOrderResult = Query.from(users)
          .orderBy('name')
          .select('name')
          .column();

        expect(ascOrderResult).toEqual(['Bob', 'John', 'Mary']);

        const descOrderResult = Query.from(users)
          .orderBy('-name')
          .select('name')
          .column();

        expect(descOrderResult).toEqual(['Mary', 'John', 'Bob']);
      });
    });
  });

  describe('mapping', () => {
    it('should map each row to a new object', () => {
      const result = Query.from(users).map((user) => ({
        id: user.id,
        name: user.name,
      }));

      expect(result.all()).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Mary' },
        { id: 3, name: 'Bob' },
      ]);
    });

    it('should provide correct index to callback', () => {
      const result = Query.from(users).map((user, index) => ({
        id: user.id,
        name: user.name,
        index,
      }));

      expect(result.all()).toEqual([
        { id: 1, name: 'John', index: 0 },
        { id: 2, name: 'Mary', index: 1 },
        { id: 3, name: 'Bob', index: 2 },
      ]);
    });
  });

  describe('ordering', () => {
    it('should order by ascending property', () => {
      const result = Query.from(users).select('name').orderBy('name').column();

      expect(result).toEqual(['Bob', 'John', 'Mary']);
    });

    it('should order by descending property', () => {
      const result = Query.from(users).select('id').orderBy('-id').column();

      expect(result).toEqual([3, 2, 1]);
    });

    it('should order by multiple properties', () => {
      const result = Query.from(users)
        .select('id', 'isActive')
        .orderBy('isActive', '-id')
        .column();

      expect(result).toEqual([2, 3, 1]);
    });

    it('should override ordering when chaining', () => {
      const result = Query.from(users)
        .select('id', 'isActive')
        .orderBy('-id')
        .orderBy('isActive')
        .column();

      expect(result).toEqual([2, 3, 1]);
    });

    it('should order by callback in ascending order by default', () => {
      const result = Query.from(users)
        .select('name')
        .orderBy((user) => user.name)
        .column();

      expect(result).toEqual(['Bob', 'John', 'Mary']);
    });

    it('should order by callback in ascending order when it is specified', () => {
      const result = Query.from(users)
        .select('name')
        .orderBy((user) => user.name)
        .column();

      expect(result).toEqual(['Bob', 'John', 'Mary']);
    });

    it('should order by callback in descending order when it is specified', () => {
      const result = Query.from(users)
        .select('name')
        .orderBy((user) => user.name, 'desc')
        .column();

      expect(result).toEqual(['Mary', 'John', 'Bob']);
    });

    it('should keep original order if no argument is specified', () => {
      const result = Query.from(users).select('name').orderBy().column();

      expect(result).toEqual(['John', 'Mary', 'Bob']);
    });
  });

  describe('grouping', () => {
    it('should group rows by a simple property', () => {
      const result = Query.from(users).groupBy('isActive');

      expect(result.get(true)).toHaveLength(2);
      expect(result.get(false)).toHaveLength(1);
    });

    it('should group rows by id', () => {
      const result = Query.from(users).groupBy('id');

      expect(result.get(1)?.[0]?.name).toBe('John');
      expect(result.get(2)?.[0]?.name).toBe('Mary');
      expect(result.get(3)?.[0]?.name).toBe('Bob');
    });

    it('should group rows after filtering', () => {
      const result = Query.from(users)
        .where({ isActive: true })
        .groupBy('isActive');

      expect(result.get(true)).toHaveLength(2);
      expect(result.get(false)).toBeUndefined();
    });

    it('should group rows after ordering', () => {
      const result = Query.from(users).orderBy('-id').groupBy('isActive');
      const activeUsers = result.get(true)!;

      expect(activeUsers[0]!.id).toBe(3);
      expect(activeUsers[1]!.id).toBe(1);
    });

    it('should group rows respecting skip and limit', () => {
      const result = Query.from(users)
        .orderBy('id')
        .skip(1)
        .limit(1)
        .groupBy('isActive');

      // only user with id 2 should be in the results
      expect(result.size).toBe(1);
      expect(result.get(false)).toHaveLength(1);
      expect(result.get(false)?.[0]?.id).toBe(2);
    });

    it('should return an empty map if no rows', () => {
      const result = Query.from(users).where({ id: 999 }).groupBy('id');

      expect(result.size).toBe(0);
    });

    it('should group by Date property', () => {
      const result = Query.from(users).groupBy('createdAt');

      expect(result.size).toBe(3);
    });

    it('shold group by key and map results by another key', () => {
      const result = Query.from(users).groupBy('isActive', 'id');

      expect(result.get(true)).toEqual([1, 3]);
      expect(result.get(false)).toEqual([2]);
    });

    it('should group by key, map results by another key and aggregate them', () => {
      const groupKeys: string[] = [];
      const result = Query.from(addresses).groupBy(
        'country',
        'city',
        (cities, groupKey) => {
          groupKeys.push(groupKey);
          return cities.length;
        }
      );

      expect(groupKeys).toEqual(['Brazil', 'Chile', 'Argentina']);
      expect(result.get('Brazil')).toEqual(3);
      expect(result.get('Chile')).toEqual(3);
      expect(result.get('Argentina')).toEqual(2);
    });

    it('should group by key and map results by callback', () => {
      const result = Query.from(users).groupBy('isActive', (user) => user.id);

      expect(result.get(true)).toEqual([1, 3]);
      expect(result.get(false)).toEqual([2]);
    });

    it('should group by key, map results and aggregate them', () => {
      const groupKeys: string[] = [];
      const result = Query.from(addresses).groupBy(
        'country',
        (address) => address,
        (addresses, groupKey) => {
          groupKeys.push(groupKey);
          return addresses.length;
        }
      );

      expect(groupKeys).toEqual(['Brazil', 'Chile', 'Argentina']);
      expect(result.get('Brazil')).toEqual(3);
      expect(result.get('Chile')).toEqual(3);
      expect(result.get('Argentina')).toEqual(2);
    });

    it('should group by callback', () => {
      const result = Query.from(users).groupBy((user) => user.isActive);

      expect(result.get(true)).toHaveLength(2);
      expect(result.get(false)).toHaveLength(1);
    });

    it('should group by callback and map results by key', () => {
      const result = Query.from(users).groupBy(
        (user) => user.permissions.sendNotifications,
        'id'
      );

      expect(result.get(true)).toEqual([1, 2]);
      expect(result.get(false)).toEqual([3]);
    });

    it('should group by callback and map results by callback', () => {
      const result = Query.from(users).groupBy(
        (user) => user.permissions.sendNotifications,
        (user) => user.id
      );

      expect(result.get(true)).toEqual([1, 2]);
      expect(result.get(false)).toEqual([3]);
    });

    it('should group by callback, map results by key and aggregate them', () => {
      const groupKeys: string[] = [];
      const result = Query.from(users).groupBy(
        (user) => user.address.country,
        'id',
        (ids, groupKey) => {
          groupKeys.push(groupKey);
          return ids.length;
        }
      );

      expect(groupKeys).toEqual(['Brazil', 'Argentina']);
      expect(result.get('Brazil')).toEqual(2);
      expect(result.get('Argentina')).toEqual(1);
    });

    it('should group by callback, map results by callback and aggregate them', () => {
      const groupKeys: string[] = [];
      const result = Query.from(users).groupBy(
        (user) => user.address.country,
        (user) => user.address,
        (values, groupKey) => {
          groupKeys.push(groupKey);
          return values.length;
        }
      );

      expect(groupKeys).toEqual(['Brazil', 'Argentina']);
      expect(result.get('Brazil')).toEqual(2);
      expect(result.get('Argentina')).toEqual(1);
    });
  });

  describe('pagination', () => {
    describe('skip()', () => {
      it('should skip rows', () => {
        const result = Query.from(users).select('id').skip(1).column();

        expect(result).toEqual([2, 3]);
      });

      it('should throw if skip is negative', () => {
        expect(() => Query.from(users).skip(-1)).toThrow(InvalidArgumentError);
      });
    });

    describe('limit()', () => {
      it('should limit rows', () => {
        const result = Query.from(users).select('id').limit(2).column();

        expect(result).toEqual([1, 2]);
      });

      it('should throw if limit is not an integer', () => {
        expect(() => Query.from(users).limit(1.5)).toThrow(
          InvalidArgumentError
        );
      });
    });

    describe('limitPerGroup()', () => {
      it('should limit rows per group using key', () => {
        const result = Query.from(addresses).limitPerGroup('country', 2).all();

        expect(result).toHaveLength(6);

        const grouped = Query.from(result).groupBy('country');

        expect(grouped.get('Brazil')).toHaveLength(2);
        expect(grouped.get('Chile')).toHaveLength(2);
        expect(grouped.get('Argentina')).toHaveLength(2);
      });

      it('should limit rows per group using callback', () => {
        const result = Query.from(addresses)
          .limitPerGroup((a) => a.country, 1)
          .all();

        expect(result).toHaveLength(3);

        const countries = result.map((r) => r.country);
        expect(new Set(countries).size).toBe(3);
      });

      it('should respect ordering before limiting', () => {
        const result = Query.from(addresses)
          .orderBy('-createdAt')
          .limitPerGroup('country', 1)
          .all();

        const grouped = Query.from(result).groupBy('country');

        expect(grouped.get('Brazil')?.[0]?.createdAt).toBe(3);
        expect(grouped.get('Chile')?.[0]?.createdAt).toBe(3);
        expect(grouped.get('Argentina')?.[0]?.createdAt).toBe(2);
      });

      it('should return empty array if no rows', () => {
        const result = Query.from<Address>([])
          .limitPerGroup('country', 2)
          .all();

        expect(result).toEqual([]);
      });

      it('should throw if limit is not an integer', () => {
        expect(() =>
          Query.from(addresses).limitPerGroup('country', 1.5)
        ).toThrow(InvalidArgumentError);
      });
    });

    describe('top()', () => {
      it('should return top N globally', () => {
        const result = Query.from(addresses).orderBy('-createdAt').top(3).all();

        expect(result).toHaveLength(3);
        expect(result[0]!.createdAt).toBeGreaterThanOrEqual(
          result[1]!.createdAt
        );
      });

      it('should return top N per group using key', () => {
        const result = Query.from(addresses)
          .top(2, {
            partitionBy: 'country',
            orderBy: '-createdAt',
          })
          .all();

        const grouped = Query.from(result).groupBy('country');

        expect(grouped.get('Brazil')).toHaveLength(2);
        expect(grouped.get('Chile')).toHaveLength(2);
        expect(grouped.get('Argentina')).toHaveLength(2);
      });

      it('should return top N per group using callback', () => {
        const result = Query.from(addresses)
          .top(1, {
            partitionBy: (a) => a.country,
            orderBy: '-createdAt',
          })
          .all();

        expect(result).toHaveLength(3);

        const grouped = Query.from(result).groupBy('country');

        expect(grouped.get('Brazil')?.[0]?.createdAt).toBe(3);
        expect(grouped.get('Chile')?.[0]?.createdAt).toBe(3);
        expect(grouped.get('Argentina')?.[0]?.createdAt).toBe(2);
      });

      it('should work with orderBy array', () => {
        const result = Query.from(addresses)
          .top(1, {
            partitionBy: (a) => a.country,
            orderBy: ['-createdAt'],
          })
          .all();

        expect(result).toHaveLength(3);

        const grouped = Query.from(result).groupBy('country');

        expect(grouped.get('Brazil')?.[0]?.createdAt).toBe(3);
        expect(grouped.get('Chile')?.[0]?.createdAt).toBe(3);
        expect(grouped.get('Argentina')?.[0]?.createdAt).toBe(2);
      });

      it('should work without orderBy (keep original order)', () => {
        const result = Query.from(addresses)
          .top(1, { partitionBy: 'country' })
          .all();

        expect(result).toEqual([
          addresses[0], // Brazil
          addresses[3], // Chile
          addresses[6], // Argentina
        ]);
      });

      it('should return empty if no rows', () => {
        const result = Query.from<Address>([]).top(2).all();

        expect(result).toEqual([]);
      });

      it('should throw if limit is not an integer', () => {
        expect(() => Query.from(addresses).top(1.5)).toThrow(
          InvalidArgumentError
        );
      });
    });

    describe('combined methods', () => {
      it('should combine skip and limit', () => {
        const result = Query.from(users).select('id').skip(1).limit(1).column();

        expect(result).toEqual([2]);
      });
    });
  });

  describe('result helpers', () => {
    it('count()', () => {
      expect(Query.from(users).count()).toBe(3);
    });

    it('exists()', () => {
      expect(Query.from(users).where({ id: 99 }).exists()).toBe(false);
    });

    it('first()', () => {
      expect(Query.from(users).first()?.id).toBe(1);
    });

    describe('last()', () => {
      it('should return the last object', () => {
        expect(Query.from(users).last()?.id).toBe(3);
      });

      it('should return null if no results', () => {
        expect(Query.from(users).where({ id: 99 }).last()).toBeNull();
      });
    });

    describe('scalar()', () => {
      it('should return the first cell', () => {
        const id = Query.from(users).select('id').scalar();

        expect(id).toBe(1);
      });

      it('should return false if no results', () => {
        const id = Query.from([]).scalar();

        expect(id).toBe(false);
      });
    });

    describe('column()', () => {
      it('should return an array of the first column values by default', () => {
        const result = Query.from(users).column();

        expect(result).toEqual([1, 2, 3]);
      });

      it('should return an array of the specified column values', () => {
        const result = Query.from(users).column('name');

        expect(result).toEqual(['John', 'Mary', 'Bob']);
      });

      it('should return an array of the mapped column values', () => {
        const result = Query.from(users).column((user) => user.name);

        expect(result).toEqual(['John', 'Mary', 'Bob']);
      });

      it('should preserve ordering', () => {
        const result = Query.from(users).orderBy('name').column('name');

        expect(result).toEqual(['Bob', 'John', 'Mary']);
      });

      it('should return empty array if objects have no properties', () => {
        const result = Query.from([{}]).column();

        expect(result).toEqual([]);
      });

      it('should return empty array if no rows', () => {
        const result = Query.from([]).column();

        expect(result).toEqual([]);
      });
    });

    describe('min()', () => {
      describe('with key', () => {
        it('should return the minimum value', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).min('value');

          expect(result).toBe(1);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).min('value');

          expect(result).toBe(-1);
        });

        it('should return null if no results', () => {
          const result = Query.from<User>([]).min('id');

          expect(result).toBeNull();
        });
      });

      describe('with callback', () => {
        it('should return the minimum value', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).min((row) => row.value);

          expect(result).toBe(1);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).min((row) => row.value);

          expect(result).toBe(-1);
        });

        it('should return null if no results', () => {
          const result = Query.from<User>([]).min((row) => row.id);

          expect(result).toBeNull();
        });
      });
    });

    describe('max()', () => {
      describe('with key', () => {
        it('should return the maximum value', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).max('value');

          expect(result).toBe(3);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).max('value');

          expect(result).toBe(3);
        });

        it('should return null if no results', () => {
          const result = Query.from<User>([]).max('id');

          expect(result).toBeNull();
        });
      });

      describe('with callback', () => {
        it('should return the maximum value', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).max((row) => row.value);

          expect(result).toBe(3);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).max((row) => row.value);

          expect(result).toBe(3);
        });

        it('should return null if no results', () => {
          const result = Query.from<User>([]).max((row) => row.id);

          expect(result).toBeNull();
        });
      });
    });

    describe('sum()', () => {
      describe('with key', () => {
        it('should return the sum', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).sum('value');

          expect(result).toBe(6);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).sum('value');

          expect(result).toBe(4);
        });

        it('should return zero if no results', () => {
          const result = Query.from<User>([]).sum('id');

          expect(result).toBe(0);
        });
      });

      describe('with callback', () => {
        it('should return the sum', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).sum((row) => row.value);

          expect(result).toBe(6);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).sum((row) => row.value);

          expect(result).toBe(4);
        });

        it('should return zero if no results', () => {
          const result = Query.from<User>([]).sum((row) => row.id);

          expect(result).toBe(0);
        });
      });
    });

    describe('average()', () => {
      describe('with key', () => {
        it('should return the average', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).average('value');

          expect(result).toBe(2);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).average('value');

          expect(result).toBeCloseTo(1.33);
        });

        it('should return null if no results', () => {
          const result = Query.from<User>([]).average('id');

          expect(result).toBeNull();
        });
      });

      describe('with callback', () => {
        it('should return the average', () => {
          const result = Query.from([
            { value: 3 },
            { value: 1 },
            { value: 2 },
          ]).average((row) => row.value);

          expect(result).toBe(2);
        });

        it('should work with negative values', () => {
          const result = Query.from([
            { value: 3 },
            { value: -1 },
            { value: 2 },
          ]).average((row) => row.value);

          expect(result).toBeCloseTo(1.33);
        });

        it('should return null if no results', () => {
          const result = Query.from<User>([]).average((row) => row.id);

          expect(result).toBeNull();
        });
      });
    });
  });
});
