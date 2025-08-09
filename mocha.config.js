const config = {
  require: ['tsx/esm'],
  extensions: ['ts'],
  spec: 'tests/backend/**/*.test.ts',
  timeout: 10000,
  recursive: true,
  reporter: 'spec',
  exit: true,
  loader: 'tsx/esm'
};

module.exports = config;