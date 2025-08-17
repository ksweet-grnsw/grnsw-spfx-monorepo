module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    
    // Handle SharePoint imports
    '@microsoft/sp-core-library': '<rootDir>/src/__mocks__/sp-core-library.js',
    '@microsoft/sp-webpart-base': '<rootDir>/src/__mocks__/sp-webpart-base.js',
    '@microsoft/sp-property-pane': '<rootDir>/src/__mocks__/sp-property-pane.js',
    '@microsoft/sp-http': '<rootDir>/src/__mocks__/sp-http.js',
    '@microsoft/sp-lodash-subset': '<rootDir>/src/__mocks__/sp-lodash-subset.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.module.scss.ts',
    '!src/**/index.ts',
    '!src/**/*.manifest.json',
    '!src/webparts/**/*WebPart.ts',
    '!src/__tests__/**',
    '!src/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testTimeout: 10000
};