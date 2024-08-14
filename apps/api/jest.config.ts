/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.redis-mock.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './src/public/tests',
  coverageReporters: ['html'],
  collectCoverageFrom: ['src/**/*.ts'],
  collectCoverage: true,
  verbose: true,
};
