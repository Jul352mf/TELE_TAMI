module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', module: 'commonjs' } }]
  },
  moduleFileExtensions: ['ts','tsx','js','jsx','json'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
