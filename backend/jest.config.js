module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/?(*.)+(spec|test).js"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "/Downloads/",
    "/AppData/",
    "/anaconda3/",
    "/.vscode/"
  ],
  collectCoverageFrom: [
    "services/*.js",
    "middleware/*.js",
    "repositories/*.js",
    "controllers/*.js",
    "models/*.js",
    "routes/*.js",
    "*.js",
    "!server.js",
    "!jest.config.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  verbose: true,
  moduleFileExtensions: ["js", "json", "node"],
  transform: {},
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
