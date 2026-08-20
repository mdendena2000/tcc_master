/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  // Seção 3.7.2a do TCC: a cobertura deve considerar todos os arquivos de
  // src/, e não apenas os exercitados pelos testes. A configuração é idêntica
  // à do api-mvc para garantir comparação justa entre as arquiteturas.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/test-support/**",
    "!src/main.ts",
    "!src/infrastructure/database/migrate.ts",
  ],
  coverageReporters: ["text", "json-summary", "lcov"],
}
