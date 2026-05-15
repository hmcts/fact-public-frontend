module.exports = {
  roots: ['<rootDir>/src/test/unit'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts?)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    '^.+\\.(js?)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!uuid)/'],
  modulePathIgnorePatterns: ['<rootDir>/src/test/unit/mocks', '<rootDir>/src/test/unit/views/helpers'],
};
