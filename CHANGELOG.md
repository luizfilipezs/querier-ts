# Changelog

## v2.12.7

### Summary

- [x] Bug fixes
- [ ] Refactoring
- [ ] New features
- [ ] Breaking changes
- [ ] Chore

### Bug fixes

`filterWhere()` now correctly ignores `null` and `undefined` values in deep condition objects, ensuring these empty conditions are safely skipped during row evaluation.

This is the expected behavior:

```ts
const activeBrazilianUsers = Query.from(users)
  .filterWhere({
    isActive: true,
    address: {
      country: 'Brazil',
      city: null, // This condition will be skipped.
      state: undefined, // This one too.
    }
  })
  .all();
```

## v2.12.6

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [ ] New features
- [ ] Breaking changes
- [x] Chore

### Refactoring

- Consolidated the overloads of `distinct()`, `min()`, `max()`, `sum()`, and `average()` into a single signature per method.

### Chore

- Migrated the build process from `tsup` to `tsdown`.

## v2.12.5

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [ ] New features
- [ ] Breaking changes

### Refactoring

- Optimized internal loops by caching repeated values before iteration.
- Added an internal utility function to improve typing support.

## v2.12.4

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [ ] New features
- [ ] Breaking changes

### Refactoring

- Removed unused type.

## v2.12.3

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [ ] New features
- [ ] Breaking changes

### Refactoring

- Improved `map()` method performance by replacing `for...i` loop by `Array.map()` method.
- Simplified other parts of the code.

## v2.12.2

### Summary

- [ ] Bug fixes
- [ ] Refactoring
- [ ] New features
- [ ] Breaking changes
- [x] Docs

### Docs

- Updated `distinct()` method examples in README.

## v2.12.1

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [ ] New features
- [ ] Breaking changes

There are no new features or breaking changes in this release, only refactoring and documentation improvements.

## v2.12.0

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [x] New features
- [ ] Breaking changes

### New features

- Enabled `groupBy()` method to accept either a map function or key as second argument.

## v2.11.0

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [x] New features
- [ ] Breaking changes

### New features

- Enabled `column()` method to accept a map function as input.

### Refactoring

- Removed branching from methods with loops.

## v2.10.0

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [x] New features
- [ ] Breaking changes

### New features

- Added optional parameter `aggregateFn` to `groupBy()` method.

### Refactoring

- Removed redundant array spread operation from `constructor()` method, since `from()` method already does it.

## v2.9.1

### Summary

- [x] Documentation updates

### Documentation updates

- Updated `README.md` with new package name.

## v2.9.0

### Summary

- [ ] Bug fixes
- [x] Refactoring
- [x] New features
- [ ] Breaking changes

### New features

- Updated `Query.from()` method to accept `Array` and `Iterable` objects as input.

### Refactoring

- Simplified `orderBy()` inner implementation without changing behavior.

## v2.8.0

### Summary

- [ ] Bug fixes
- [ ] Code refactoring
- [x] New features
- [ ] Breaking changes

### New features

- Added row index as argument to `Query.map()` callback.

## v2.7.1

### Summary

- [x] Documentation updates
- [ ] Bug fixes
- [ ] Code refactoring
- [ ] New features
- [ ] Breaking changes

### Documentation updates

- Updated `README.md` documentation for `orderBy()` method with new overload and examples.

## v2.7.0

### Summary

- [ ] Bug fixes
- [ ] Code refactoring
- [x] New features
- [ ] Build and packaging updates
- [ ] Breaking changes

### New features

- Added new overload to `orderBy()` method, allowing to specify a function that returns the values to be sorted and the order to be applied.

## v2.6.0

### Summary

- [ ] Bug fixes
- [ ] Code refactoring
- [x] New features
- [ ] Build and packaging updates
- [ ] Breaking changes

### New features

- Added `limitPerGroup()` and `top()` methods to `Query`.

## v2.5.4

### Summary

- [ ] Bug fixes
- [x] Code refactoring
- [ ] New features
- [ ] Build and packaging updates
- [ ] Breaking changes

### Build and packaging updates

- Replaced pre-allocated arrays by static arrays for improved performance.

## v2.5.3

### Summary

- [ ] Bug fixes
- [x] Code refactoring
- [ ] New features
- [ ] Build and packaging updates
- [ ] Breaking changes

### Build and packaging updates

- Improved JSDoc for `column()` method.

## v2.5.2

### Summary

- [ ] Bug fixes
- [ ] Code refactoring
- [ ] New features
- [x] Build and packaging updates
- [ ] Breaking changes

### Build and packaging updates

- Removed `tsup` settings that could make debugging harder.
- Rebuilt `v2.5.1`, for `dist` was outdated.
- Added `build` script to `prepublishOnly` script, ensuring build before publishing.

## v2.5.1

### Summary

- [ ] Bug fixes
- [ ] Code refactoring
- [ ] New features
- [x] Build and packaging updates
- [ ] Breaking changes

### Build and packaging updates

- Updated target from `es2020` to `es2022`, improving performance and reducing bundle size.
- Added `pnpm-workspace.yaml` file with `allowBuilds` configuration.
- Updated development dependencies.

## v2.5.0

### Summary

- [ ] Bug fixes
- [x] Code refactoring
- [x] New features
- [x] Build and packaging updates
- [ ] Breaking changes

### New features

- Added `distinct()` method to `Query`.

### Code refactoring

- Improve conditions order in `column()` method.
- Added a new unit test for the `column()` method, covering no rows case.

### Build and packaging updates

- Updated development dependencies.

## v2.4.1

### Summary

- [ ] Bug fixes
- [x] Code refactoring
- [ ] New features
- [x] Compatibility improvements
- [ ] Breaking changes

### Code refactoring

- Removed redundant conditions and unecessary code.
- Optimized array iteration performance:
  - Pre-allocate arrays to avoid dynamic resizing.
  - Replace `Array.map()` and `for...of` with indexed `for` loops.
- Updated JSDoc for `Query`.

### Compatibility improvements

- Updated development dependencies.

## v2.4.0

### Changes

- [ ] Bug fixes
- [ ] Code refactoring
- [x] New features
- [x] Build improvements
- [ ] Breaking changes

### New Features

- Added `min()`, `max()`, `sum()`, and `average()` methods to `Query`.

### Build Improvements
- Improved build output by introducing separate ESM and CJS bundles.
- ESM files are now emitted to `dist/esm` and CJS files to `dist/cjs`.
- Updated package exports to provide better compatibility with modern bundlers and Node.js.
- Reduced bundle size through improved minification and build configuration.
- Refactored build pipeline using multiple `tsup` configurations.
- Ensured type declarations are emitted only once to avoid duplication.

## v2.3.1

- Optimized build process with [tsup](https://tsup.egoist.dev/), tree-shaking and minification.
- Removed `utility-types` from dependencies list.

## v2.3.0

### Features

- Added optional `mapFn` to `groupBy()` method to transform grouped values.

## v2.2.0

### Features

- Added an overload to `groupBy()` supporting both property keys and custom grouping functions.

### Improvements

- Internal code refactoring with no functional changes.
- Updated the build process to ignore test files.
- Updated `.npmignore` file contents.

## v2.1.1

- Rebuild v2.1.0, for `lib` was outdated.

## v2.1.0

- Added method `map()` to `Query`, intended for data projection, but more flexible and better suited for complex transformations.

## v2.0.2

This release includes minor internal refactoring. There are no new features or breaking changes.

## Improvementskv

- Performed micro-optimizations on array operations.

## v2.0.1

This release includes minor internal refactoring. There are no new features or breaking changes.

## Improvements

- Avoid repeated instantiation of `QueryRowValidator` during row validation by leveraging static members.
- Replace `Array.prototype.every()` with a `for...of` loop for improved performance.

## v2.0.0

### Changes

* Updated the `select()` method to return a new `Query` instance containing only the selected columns.
* Added a new `groupBy()` method, which returns a `Map` with results grouped by the specified column.
* Added an optional `column` parameter to the `column()` method, allowing you to specify which column's values should be returned.
* Updated the `orderBy()` method to sort query results immediately, restoring the behavior from previous versions.

### Other Improvements

* Replaced Jest with Vitest, improving test performance.
* Added test coverage reporting.
* Expanded the test suite to cover more execution paths.

## v1.0.2

Impacts:

### Production

- Code refactory: replaced legacy code with modern alternatives without modifying behavior.
- Removed `reflect-metadata` from dependencies list.

### Development

- Replaced `tslint` by `eslint`.
- Updated `tsconfig.json` with stricter options.

## v1.0.1

### Ensure rows immutability in `orderBy()`

`orderBy()` behavior was updated to register the ordering option and apply it only to the results instead of sorting the actual rows immediately.

Before:

```ts
const results = Query.from(users)
  .orderBy('-name') // rows would be sorted immediately
  // ...
```

One problem with the former approach is that it was not possible to override the sorting by calling `orderBy` a second time; instead, the rows would only be sorted again.

Now:

```ts
const results = Query.from(users)
  .orderBy('-name')
  .orderBy('name') // the overriden orderBy option is the only one applied,
                   // affecting only the final results
  // ...
```

The new approach ensures that the inner rows always remain the same, maintaining their original order.

It is also possible to clear the ordering now:

```ts
const results = Query.from(users)
  .orderBy('name')
  .orderBy() // no sorting logic will be applied to the rows
```

### Fix Jest configuration

Update match to include `__tests__/*.spec.ts` files only. The previous configuration enabled testing JS and TS type files too, causing errors.

### Other improvements

- Create a `.prettierignore` file.
- Update `.npmignore` file contents.

## v1.0.0

Updates:

- Dependencies updated.
- Code refactored keeping previous behavior.
- Unit tests created or reviewed to cover the whole codebase.
- Migrated from npm to pnpm.
- Prettier configuration updated and integrated with Visual Studio Code.

## v0.0.0

Create initial project.
