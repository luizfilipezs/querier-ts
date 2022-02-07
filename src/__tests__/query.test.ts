import { BaseObject } from '../base-object';
import { Query } from '../query';
import { PropertyOnly } from '../utils/types';
import { InvalidArgumentError } from '../errors';

describe('Query', () => {

  const today: Date = new Date();
  const yesterday: Date = new Date();
  const dayBeforeYesterday: Date = new Date();

  yesterday.setDate(today.getDate() - 1);
  dayBeforeYesterday.setDate(today.getDate() - 2);

  class User extends BaseObject {

    id!: string
    email!: string
    permissionsLevel!: number;
    permissions!: UserPermissions;
    isActive!: boolean;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(init: PropertyOnly<User>) {
      super(init);
    }

    isAdmin(): boolean {
      return this.permissionsLevel === 0;
    }

  }

  interface UserPermissions {
    rememberMe: boolean;
    sendNotifications: boolean;
  }

  const users: User[] = [
    new User({
      id: '1',
      email: 'abc@gmail.com',
      permissionsLevel: 1,
      permissions: {
        rememberMe: true,
        sendNotifications: false,
      },
      isActive: true,
      createdAt: yesterday,
      updatedAt: yesterday,
    }),
    new User({
      id: '2',
      email: 'ghi@gmail.com',
      permissionsLevel: 3,
      permissions: {
        rememberMe: true,
        sendNotifications: false,
      },
      isActive: false,
      createdAt: dayBeforeYesterday,
      updatedAt: dayBeforeYesterday,
    }),
    new User({
      id: '3',
      email: 'def@gmail.com',
      permissionsLevel: 0,
      permissions: {
        rememberMe: false,
        sendNotifications: true,
      },
      isActive: true,
      createdAt: today,
      updatedAt: today,
    }),
  ];

  const existentId = '1';
  const nonExistentId = 'non-existent-id';

  describe('first', () => {

    it('shoud return the first object', () => {
      const first = Query.from(users).first();
      const firstId = users[0].id;

      expect(first?.id).toEqual(firstId);
    });

    it('shoud return null', () => {
      const first = Query.from([]).first();

      expect(first).toBeNull();
    });

  });

  describe('last', () => {

    it('shoud return the last object', () => {
      const last = Query.from(users).last();
      const lastId = users[users.length - 1].id;

      expect(last?.id).toEqual(lastId);
    });

    it('shoud return null', () => {
      const last = Query.from([]).last();

      expect(last).toBeNull();
    });

  });

  describe('all', () => {

    it('shoud return all objects', () => {
      const all = Query.from(users).all();

      expect(all).toHaveLength(users.length);
    });

  });

  describe('where', () => {

    it('should handle an object with conditions corresponding to the fields', () => {
      const objects = Query.from(users)
        .where({
          id: (id) => +id >= 2,
          permissionsLevel: 0,
        })
        .all();

      expect(objects).toHaveLength(1);
    });

    it('should handle a callback function as a validator', () => {
      const objects = Query.from(users)
        .where(({ createdAt, updatedAt }) => (
          createdAt === updatedAt
        ))
        .all();

      expect(objects).toHaveLength(users.length);
    });

    it('should handle multiple conditions', () => {
      const objects = Query.from(users)
        .where({
          isActive: true,
        })
        .where((user) => (
          user.isAdmin()
        ))
        .all();

      expect(objects).toHaveLength(1);
    });

  });

  describe('filterWhere', () => {

    it('should return all objects', () => {
      const filteredObjects = Query.from(users)
        .filterWhere({
          id: null,
        })
        .all();

      expect(filteredObjects).toHaveLength(users.length);
    });

    it('should return filtered objects', () => {
      const filteredObjects = Query.from(users)
        .filterWhere({
          id: existentId,
        })
        .all();

      expect(filteredObjects).toHaveLength(1);
    });

  });

  describe('scalar', () => {

    const expectedValue = users[0].id;

    it('should return the first column value from the first row', () => {
      const value = Query.from(users).scalar();

      expect(value).toEqual(expectedValue);
    });

    it('should return the selected column value from the first row', () => {
      const value = Query.from(users)
        .select('id')
        .scalar();

      expect(value).toEqual(expectedValue);
    });

    it('should return the first selected column value from the first row', () => {
      const value = Query.from(users)
        .select(['id', 'email'])
        .scalar();

      expect(value).toEqual(expectedValue);
    });

    it('should return false', () => {
      const value = Query.from(users)
        .select('id')
        .where({
          id: nonExistentId,
        })
        .scalar();

      expect(value).toEqual(false);
    });

  });

  describe('column', () => {

    const ids = users.map(({ id }) => id);
    const emails = users.map(({ email }) => email);

    it('should return values from the first column', () => {
      const userIds = Query.from(users).column();

      expect(userIds).toEqual(ids);
    });

    it('should return values from the selected column', () => {
      const userEmails = Query.from(users)
        .select('email')
        .column();

      expect(userEmails).toEqual(emails);
    });

    it('should return values from the first selected column', () => {
      const value = Query.from(users)
        .select(['email', 'isActive'])
        .column();

      expect(value).toEqual(emails);
    });

  });

  describe('values', () => {

    it('should return the values of all columns', () => {
      const values = Query.from(users)
        .where({
          id: '1',
        })
        .values();

      expect(values).toEqual([
        [
          '1',
          'abc@gmail.com',
          1,
          {
            rememberMe: true,
            sendNotifications: false,
          },
          true,
          yesterday,
          yesterday
        ]
      ]);
    });

    it('should return the values of the selected columns', () => {
      const values = Query.from(users)
        .select(['email', 'isActive'])
        .values();

      expect(values).toEqual([
        ['abc@gmail.com', true],
        ['ghi@gmail.com', false],
        ['def@gmail.com', true]
      ]);
    });

  });

  describe('count', () => {

    it('should return the count of users', () => {
      const count = Query.from(users).count();

      expect(count).toEqual(users.length);
    });

    it('should return the count of filtered users', () => {
      const count = Query.from(users)
        .where({
          id: existentId,
        })
        .count();

      expect(count).toEqual(1);
    });

    it('should return 0', () => {
      const count = Query.from(users)
        .where({
          id: nonExistentId,
        })
        .count();

      expect(count).toEqual(0);
    });

  });

  describe('exists', () => {

    it('should return true', () => {
      const query = Query.from(users);
      const anyExists = query.exists();
      const filteredExists = query.where({ id: existentId }).exists();

      expect(anyExists).toEqual(true);
      expect(filteredExists).toEqual(true);
    });

    it('should return false', () => {
      const exists = Query.from(users)
        .where({
          id: nonExistentId,
        })
        .exists();

      expect(exists).toEqual(false);
    });

  });

  describe('orderBy', () => {

    describe('string', () => {

      it('should apply ascending order', () => {
        const emails = Query.from(users)
          .select('email')
          .orderBy('email')
          .column();

        expect(emails).toEqual([
          'abc@gmail.com',
          'def@gmail.com',
          'ghi@gmail.com'
        ]);
      });

      it('should apply descending order', () => {
        const emails = Query.from(users)
          .select('email')
          .orderBy('-email')
          .column();

        expect(emails).toEqual([
          'ghi@gmail.com',
          'def@gmail.com',
          'abc@gmail.com'
        ]);
      });

    });

    describe('number', () => {

      it('should apply ascending order', () => {
        const values = Query.from(users)
          .select('permissionsLevel')
          .orderBy('permissionsLevel')
          .column();

        expect(values).toEqual([0, 1, 3]);
      });

      it('should apply descending order', () => {
        const values = Query.from(users)
          .select('permissionsLevel')
          .orderBy('-permissionsLevel')
          .column();

        expect(values).toEqual([3, 1, 0]);
      });

    });

    describe('boolean', () => {

      it('should apply ascending order', () => {
        const values = Query.from(users)
          .select('isActive')
          .orderBy('isActive')
          .column();

        expect(values).toEqual([false, true, true]);
      });

      it('should apply descending order', () => {
        const values = Query.from(users)
          .select('isActive')
          .orderBy('-isActive')
          .column();

        expect(values).toEqual([true, true, false]);
      });

    });

    describe('Date', () => {

      it('shoud apply ascending order', () => {
        const userIds = Query.from(users)
          .select('id')
          .orderBy('createdAt')
          .column();

        expect(userIds).toEqual(['2', '1', '3']);
      });

      it('shoud apply descending order', () => {
        const userIds = Query.from(users)
          .select('id')
          .orderBy('-createdAt')
          .column();

        expect(userIds).toEqual(['3', '1', '2']);
      });

    });

    describe('string', () => {

      interface Foo {
        date: string;
      }

      describe('date strings', () => {

        describe('Y-m-d', () => {

          const objects: Foo[] = [
            { date: '2022-02-05'},
            { date: '2022-01-01'},
            { date: '2022-02-03'},
          ];

          it('should order ascending', () => {
            const dates = Query.from(objects)
              .orderBy('date')
              .column();

            expect(dates).toEqual([
              '2022-01-01',
              '2022-02-03',
              '2022-02-05'
            ]);
          });

          it('should order descending', () => {
            const dates = Query.from(objects)
              .orderBy('-date')
              .column();

            expect(dates).toEqual([
              '2022-02-05',
              '2022-02-03',
              '2022-01-01'
            ]);
          });
      
        });

      });

    });

    describe('multiple fields', () => {

      interface Coord {
        x: number;
        y: number;
      }

      const coords: Coord[] = [
        { x: 2, y: 2 },
        { x: 1, y: 4 },
        { x: 2, y: 3 },
        { x: 1, y: 1 },
        { x: 1, y: 3 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 2, y: 1 },
      ];

      it('should order by two fields ascending', () => {
        const orderedCoords = Query.from(coords)
          .orderBy('x', 'y')
          .all();

        const xValues = Query.from(orderedCoords)
          .select('x')
          .column();

        const yValues = Query.from(orderedCoords)
          .select('y')
          .column();

        expect(xValues).toEqual([1, 1, 1, 1, 2, 2, 2, 2]);
        expect(yValues).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
      });

      it('should order by one field ascending and another descending', () => {
        const orderedCoords = Query.from(coords)
          .orderBy('x', '-y')
          .all();

        const xValues = Query.from(orderedCoords)
          .select('x')
          .column();

        const yValues = Query.from(orderedCoords)
          .select('y')
          .column();

        expect(xValues).toEqual([1, 1, 1, 1, 2, 2, 2, 2]);
        expect(yValues).toEqual([4, 3, 2, 1, 4, 3, 2, 1]);
      });

    });

  });

  describe('limit', () => {

    describe('validate argument as a positive integer', () => {

      it('should throw InvalidArgumentError when passing an integer less than 0', () => {
        const argument = -1;

        expect(() => Query.from([]).limit(argument))
          .toThrow(new InvalidArgumentError({
            method: 'limit',
            param: 0,
            argument: argument,
            expected: 'equal or greater than 0',
          }));
      });

      it('should throw InvalidArgumentError when passing a float number', () => {
        const argument = 1.5;

        expect(() => Query.from([]).limit(argument))
          .toThrow(new InvalidArgumentError({
            method: 'limit',
            param: 0,
            argument: argument,
            expected: 'an integer',
          }));
      });

    });

    describe('should limit query when using method', () => {

      const defaultLimit = 2;
      const getQuery = (limit = defaultLimit) => Query.from(users).limit(limit);

      it('count()', () => {
        const numberOfObjects = getQuery().count();

        expect(numberOfObjects).toBeLessThanOrEqual(defaultLimit);
      });

      it('exists()', () => {
        expect(getQuery().exists()).toEqual(true);
        expect(getQuery(0).exists()).toEqual(false);
      });

      it('first()', () => {
        const first = getQuery().orderBy('-id').first();
        const emptyFirst = getQuery(0).first();

        expect(first?.id).toEqual('3');
        expect(emptyFirst).toBeNull();
      });

      it('last()', () => {
        const last = getQuery().last();
        const emptyLast = getQuery(0).last();

        expect(last?.id).toEqual('2');
        expect(emptyLast).toBeNull();
      });

      it('all()', () => {
        const numberOfObjects = getQuery().all().length;

        expect(numberOfObjects).toBeLessThanOrEqual(defaultLimit);
      });

      it('scalar()', () => {
        const firstValue = getQuery().orderBy('-id').scalar();
        const thirdUserId = users[2].id;

        expect(firstValue).toEqual(thirdUserId);
      });

      it('column()', () => {
        const ids = getQuery().column();
        const emptyIds = getQuery(0).column();

        expect(ids).toEqual(['1', '2']);
        expect(emptyIds).toHaveLength(0);
      });

      it('values()', () => {
        const values = getQuery().select('id').values();
        const emptyValues = getQuery(0).values();

        expect(values).toEqual([['1'], ['2']]);
        expect(emptyValues).toHaveLength(0);
      });

    });

  });

  describe('skip', () => {

    describe('validate argument as a non negative integer', () => {

      it('should throw InvalidArgumentError when passing an integer less than 0', () => {
        const numberOfRows = -1;

        expect(() => Query.from([]).skip(numberOfRows))
          .toThrow(new InvalidArgumentError({
            method: 'skip',
            param: 0,
            argument: numberOfRows,
            expected: 'equal or greater than 0',
          }));
      });

      it('should throw InvalidArgumentError when passing a float number', () => {
        const numberOfRows = 1.5;

        expect(() => Query.from([]).skip(numberOfRows))
          .toThrow(new InvalidArgumentError({
            method: 'skip',
            param: 0,
            argument: numberOfRows,
            expected: 'an integer',
          }));
      });

    });

    it('should not skip any result', () => {
      const numberOfObjects = Query.from(users)
        .skip(0)
        .count();

      expect(numberOfObjects).toEqual(users.length);
    });

    it('should skip the first result', () => {
      const numberOfRows = 1;
      const expectedNumberOfObjects = users.length - numberOfRows;
      const numberOfObjects = Query.from(users)
        .skip(numberOfRows)
        .count();

      expect(numberOfObjects).toEqual(expectedNumberOfObjects);
    });

    it('should skip and limit results', () => {
      const numberOfRows = 1;
      const firstId = Query.from(users)
        .select('id')
        .skip(numberOfRows)
        .limit(1)
        .scalar();

      expect(firstId).toEqual(users[numberOfRows].id);
    });

    it('should return none results', () => {
      const numberOfObjects = Query.from(users)
        .skip(users.length)
        .count();

      expect(numberOfObjects).toEqual(0);
    });

  });

  describe('recursive query', () => {

    it('should perform a recursive query and return results', () => {

      const lastUserToNotificate = Query.from(users)
        .where({
          isActive: true,
          permissions: {
            sendNotifications: true,
          },
        })
        .first();

      expect(lastUserToNotificate?.id).toEqual('3');

    });

    it('should perform a recursive query and return none results', () => {

      const inactiveUserWithEnabledNotifications = Query.from(users)
        .where({
          isActive: false,
          permissions: {
            sendNotifications: true,
          },
        })
        .first();

      expect(inactiveUserWithEnabledNotifications).toBeNull();

    });

    describe('deep recursive query', () => {

      interface Foo {
        bar: string;
        foo?: Foo;
      }

      const objects: Foo[] = [
        {
          bar: 'a',
        },
        {
          bar: 'a',
          foo: {
            bar: 'b',
            foo: {
              bar: 'c',
            },
          },
        },
      ];

      it('should return results', () => {
        const exists = Query.from(objects)
          .where({
            foo: {
              bar: 'b',
            },
          })
          .exists();

        expect(exists).toEqual(true);
      });

      it('should return none results', () => {
        const exists = Query.from(objects)
          .where({
            foo: {
              bar: 'b',
              foo: {
                bar: 'd',
              },
            },
          })
          .exists();

        expect(exists).toEqual(false);
      });

    });

  });

  describe('array comparison', () => {

    interface Foo {
      bar: string[];
    }

    const objects: Foo[] = [
      { bar: ['a', 'b'] },
    ];

    it('should compare two equal arrays', () => {
      const exists = Query.from(objects)
        .where({
          bar: ['a', 'b'],
        })
        .exists();

      expect(exists).toEqual(true);
    });

    it('should compare two arrays in different order', () => {
      const exists = Query.from(objects)
        .where({
          bar: ['b', 'a'],
        })
        .exists();

      expect(exists).toEqual(false);
    });

    it('should compare two diffrent arrays', () => {
      const exists = Query.from(objects)
        .where({
          bar: ['c', 'd'],
        })
        .exists();

      expect(exists).toEqual(false);
    });

  });

});
