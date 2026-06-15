import { getRecordValues } from '../get-record-values';

describe('getRecordValues', () => {
  it('should return all values from an object', () => {
    const obj = {
      name: 'John',
      age: 30,
    };

    const result = getRecordValues(obj);

    expect(result).toEqual(['John', 30]);
  });

  it('should preserve property order', () => {
    const obj = {
      first: 1,
      second: 2,
      third: 3,
    };

    const result = getRecordValues(obj);

    expect(result).toEqual([1, 2, 3]);
  });

  it('should return an empty array for an empty object', () => {
    const result = getRecordValues({});

    expect(result).toEqual([]);
  });

  it('should return values of different types', () => {
    const date = new Date();

    const obj = {
      string: 'text',
      number: 123,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      date,
      array: [1, 2, 3],
    };

    const result = getRecordValues(obj);

    expect(result).toEqual([
      'text',
      123,
      true,
      null,
      undefined,
      date,
      [1, 2, 3],
    ]);
  });

  it('should return nested objects as values', () => {
    const nested = {
      id: 1,
    };

    const obj = {
      nested,
    };

    const result = getRecordValues(obj);

    expect(result).toEqual([nested]);
  });
});
