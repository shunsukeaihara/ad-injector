import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const name = 'adInjector';

export default {
  input: './src/index.ts',

  plugins: [
    // Allows node_modules resolution
    resolve({ extensions, browser: false }),
    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),
    // Compile TypeScript/JavaScript files
    babel({ extensions, include: ['src/**/*'], babelHelpers: 'bundled' }),
  ],

  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
    {
      file: pkg.browser,
      format: 'umd',
      name,
    },
  ],
};
