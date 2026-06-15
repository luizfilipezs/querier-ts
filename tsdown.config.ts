import { defineConfig } from 'tsdown';

export default defineConfig([
  // ESM build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist/esm',
    dts: true,
    minify: false,
    treeshake: true,
    sourcemap: false,
    target: 'es2022',
    platform: 'neutral',
    tsconfig: 'tsconfig.build.json',
  },

  // CJS build
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    outDir: 'dist/cjs',
    dts: false,
    minify: false,
    treeshake: true,
    sourcemap: false,
    target: 'es2022',
    platform: 'neutral',
    tsconfig: 'tsconfig.build.json',
  },
]);
