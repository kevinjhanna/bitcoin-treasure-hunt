module.exports = function (wallaby) {
  process.env.NODE_ENV = "testing";
  process.env.WALLABY = "true";
  return {
    files: [
      'src/**/*.ts',
      '!src/test/**/*.ts'
    ],
    tests: [
      'src/test/**/*_test.ts',
    ],
    testFramework: 'mocha',
    debug: true,
    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({ module:1 }) // 1 for CommonJs
    },
    delays: {
      edit: 500,
      run: 500
    },
    env: {
      type: 'node',
      runner: 'node'
    }
  };
};
