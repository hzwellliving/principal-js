import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import pkg from './package.json'

export default [
  {
    input: pkg.source,
    external: ['util', 'debug'],
    output: {
      format: 'esm',
      file: pkg.module
    },
    plugins: [
      babel(),
      resolve(),
      commonjs()
    ]
  },
  {
    input: 'index.js',
    output: {
      format: 'cjs',
      file: pkg.main
    },
    external: ['util', 'debug'],
    plugins: [
      babel(),
      resolve(),
      commonjs()
    ]
  }
]
