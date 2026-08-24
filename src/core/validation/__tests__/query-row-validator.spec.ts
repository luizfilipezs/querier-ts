import { QueryRowValidator } from '../query-row-validator';

describe('QueryRowValidator', () => {
  describe('callback condition', () => {
    it('should return true when callback returns true', () => {
      const row = { id: 1 };

      const result = QueryRowValidator.validate(row, () => true);

      expect(result).toBe(true);
    });

    it('should return false when callback returns false', () => {
      const row = { id: 1 };

      const result = QueryRowValidator.validate(row, () => false);

      expect(result).toBe(false);
    });
  });

  describe('primitive comparisons', () => {
    it('should validate equality for primitive values', () => {
      const row = { id: 1, name: 'Alice' };

      const result = QueryRowValidator.validate(row, {
        id: 1,
        name: 'Alice',
      });

      expect(result).toBe(true);
    });

    it('should return false when primitive values differ', () => {
      const row = { id: 1 };

      const result = QueryRowValidator.validate(row, {
        id: 2,
      });

      expect(result).toBe(false);
    });
  });

  describe('function conditions', () => {
    it('should validate using a function condition', () => {
      const row = { age: 30 };

      const result = QueryRowValidator.validate(row, {
        age: (value) => value > 18,
      });

      expect(result).toBe(true);
    });

    it('should return false when function condition fails', () => {
      const row = { age: 15 };

      const result = QueryRowValidator.validate(row, {
        age: (value) => value > 18,
      });

      expect(result).toBe(false);
    });
  });

  describe('array conditions', () => {
    it('should validate arrays using strict comparison', () => {
      const row = { tags: ['a', 'b'] };

      const result = QueryRowValidator.validate(row, {
        tags: ['a', 'b'],
      });

      expect(result).toBe(true);
    });

    it('should return false for arrays with different values', () => {
      const row = { tags: ['a', 'b'] };

      const result = QueryRowValidator.validate(row, {
        tags: ['a', 'c'],
      });

      expect(result).toBe(false);
    });

    it('should return false if condition is array but value is not', () => {
      const row = { tags: 'a,b' };

      const result = QueryRowValidator.validate(row as any, {
        tags: ['a', 'b'],
      });

      expect(result).toBe(false);
    });
  });

  describe('object conditions (nested validation)', () => {
    it('should validate nested objects recursively', () => {
      const row = {
        user: {
          name: 'John',
          age: 25,
        },
      };

      const result = QueryRowValidator.validate(row, {
        user: {
          name: 'John',
          age: (value) => value >= 18,
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when nested validation fails', () => {
      const row = {
        user: {
          name: 'John',
          age: 15,
        },
      };

      const result = QueryRowValidator.validate(row, {
        user: {
          age: (value) => value >= 18,
        },
      });

      expect(result).toBe(false);
    });

    it('should return false if condition is object but value is not', () => {
      const row = {
        user: 'John',
      };

      const result = QueryRowValidator.validate(row as any, {
        user: { name: 'John' },
      });

      expect(result).toBe(false);
    });
  });

  describe('ignoreNullValues behavior', () => {
    it('should ignore null conditions when ignoreNullValues is true', () => {
      const row = { name: 'Alice' };

      const result = QueryRowValidator.validate(
        row,
        {
          name: null,
        },
        { ignoreNullValues: true }
      );

      expect(result).toBe(true);
    });

    it('should ignore undefined conditions when ignoreNullValues is true', () => {
      const row = { name: 'Alice' };

      const result = QueryRowValidator.validate(
        row,
        {
          name: undefined,
        },
        { ignoreNullValues: true }
      );

      expect(result).toBe(true);
    });

    it('should NOT ignore null when ignoreNullValues is false', () => {
      const row = { name: 'Alice' };

      const result = QueryRowValidator.validate(
        row,
        {
          name: null,
        },
        { ignoreNullValues: false }
      );

      expect(result).toBe(false);
    });

    it('should ignore null and undefined in nested conditions when ignoreNullValues is true', () => {
      const row = { user: { name: 'Alice', age: 18 } };

      const result = QueryRowValidator.validate(
        row,
        {
          user: { name: null, age: undefined },
        },
        { ignoreNullValues: true }
      );

      expect(result).toBe(true);
    });

    it('should NOT ignore null and undefined in nested conditions when ignoreNullValues is false', () => {
      const row = { user: { name: 'Alice', age: 18 } };

      const result = QueryRowValidator.validate(
        row,
        {
          user: { name: null, age: undefined },
        },
        { ignoreNullValues: false }
      );

      expect(result).toBe(false);
    });

    it('should use default options (ignoreNullValues = false)', () => {
      const row = { name: 'Alice' };

      const result = QueryRowValidator.validate(row, {
        name: null,
      });

      expect(result).toBe(false);
    });
  });

  describe('multiple conditions', () => {
    it('should return true only if all conditions pass', () => {
      const row = {
        id: 1,
        active: true,
        roles: ['admin'],
      };

      const result = QueryRowValidator.validate(row, {
        id: 1,
        active: true,
        roles: ['admin'],
      });

      expect(result).toBe(true);
    });

    it('should return false if at least one condition fails', () => {
      const row = {
        id: 1,
        active: false,
      };

      const result = QueryRowValidator.validate(row, {
        id: 1,
        active: true,
      });

      expect(result).toBe(false);
    });
  });
});
