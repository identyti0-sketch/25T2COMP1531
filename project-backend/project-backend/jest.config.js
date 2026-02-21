module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,
  forceCoverageMatch: ['**/*.ts'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
};
