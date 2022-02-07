# query-ts

A package that allows you to query data from an array of objects.

## Introduction

The following data will be used in the samples of this documentation:

```ts
interface UserPermissions {
  useCookies: boolean;
  sendNotifications: boolean;
}

class User {
  id: number;
  name: string;
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  isAdmin(): boolean {
    ...
  }
}

const users: User[] = [
  ...
];
```

## Query

A `Query` can be created this way:

```ts
const usersQuery = Query.from(users);
```

TypeScript will automatically assume that the query data type is `User`. You can make it explicit:

```ts
const usersQuery = Query.from<User>(users);
```

### Getting results

#### `all()`

Returns all results.

#### `first()`

Returns the first result.

#### `last()`

Returns the last result.

#### `count()`

Returns the number of results.

#### `exists()`

Returns a boolean indicating whether any results exist.

### Filtering data

#### `where()`

There are two types of parameters:

1. An object where each property represents an attribute to be validated.
2. A callback function that returns a boolean validating the object.

When the condition is an object, you can pass literal values or callback functions to each attribute that needs to be validated.

```ts
const activeGmailUsers = Query.from(users)
  .where({
    isActive: true,
    email: (email) => email.endsWith('@gmail.com'),
  })
  .where((user) => (
    !user.isAdmin()
  ))
  .all();
```

It also works on inner objects:

```ts
  .where({
    permissions: {
      sendNotifications: true,
    },
  })
```

#### `filterWhere()`

The diffrences of `filterWhere` is that it only accepts an object and it ignores conditions whose values are `null` or `undefined`.

```ts
let isActive: bool;

const filteredUsers = Query.from(users)
  .where({
    id: 1,
    isActive: isActive, // this condition will be skipped
  })
  .all();
```

>**Remember**: if you want to check if a value is really `null` or `undefined`, use `where()`.

### Selecting specific data

#### `select()`

This method can be combined with `scalar()`, `column()`, or `values()`.

Usage:

```ts
const userIds = Query.from(users)
  .select('id')
  .column();
```

#### `scalar()`

It returns the value of the first property of the first object.

```ts
const firstId = Query.from(users).scalar();
```

As mentioned above, it is possible to combine it with `select()` in order to get the value of another property.

```ts
const firstEmail = Query.from(users)
  .select('email')
  .scalar();
```

#### `column()`

It returns the values of the first property of all objects.

```ts
const ids = Query.from(users).column();
```

You can also use it with `select()`:

```ts
const emails = Query.from(users)
  .select('email')
  .column();
```

#### `column()`

It returns the values of all objects as arrays.

```ts
const emails = Query.from(users)
  .select(['id', 'email'])
  .values();
```

`emails` would be something like this:

```ts
[
  [1, 'john@icloud.com'],
  [2, 'mary@gmail.com']
]
```

### Ordering results

#### `orderBy()`

Sorts the results. You can pass multiple arguments.

```ts
  .orderBy('name', 'id')
```

In the example above, `name` will have more priority than `id`.

It is also possible to apply descending order:

```ts
const lastId = Query.from(users)
  .select('id')
  .orderBy('-id')
  .scalar();
```

### Limiting results

#### `limit()`

Can be used to set a limit of results.

```ts
  .limit(100)
```

>Passing a float or a negative number will throw an exception.

#### `skip()`

Skips the first results.

```ts
  .skip(5)
```

>Passing a float or a negative number will throw an exception.