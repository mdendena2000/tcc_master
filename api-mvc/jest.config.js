/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  // Seção 3.7.2a do TCC: a cobertura deve considerar todos os arquivos de
  // src/, e não apenas os exercitados pelos testes. Sem isso, camadas sem
  // testes (controllers, rotas) ficariam de fora e inflariam o resultado.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/app.ts",
    "!src/database/migrate.ts",
  ],
  coverageReporters: ["text", "json-summary", "lcov"],
}
