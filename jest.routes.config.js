module.exports = {
  roots: ['<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts?)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    '^.+\\.(js?)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!uuid)/'],
};
