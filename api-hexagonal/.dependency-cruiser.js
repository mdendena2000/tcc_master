/**
 * Regras arquiteturais da versão Hexagonal.
 *
 * O núcleo (domain + application) não pode depender de infrastructure: é essa
 * restrição que a análise verifica automaticamente.
 */
module.exports = {
  forbidden: [
    {
      name: "dominio-sem-infra",
      severity: "error",
      comment:
        "O domínio não pode conhecer detalhes de infraestrutura (banco, HTTP, frameworks).",
      from: { path: "^src/domain" },
      to: { path: "^src/infrastructure" },
    },
    {
      name: "dominio-sem-aplicacao",
      severity: "error",
      comment:
        "O domínio é o centro: não depende dos casos de uso que o orquestram.",
      from: { path: "^src/domain" },
      to: { path: "^src/application" },
    },
    {
      name: "casos-de-uso-sem-infra",
      severity: "error",
      comment:
        "Os casos de uso falam com o mundo externo apenas por meio das portas.",
      from: { path: "^src/application" },
      to: { path: "^src/infrastructure" },
    },
    {
      name: "nucleo-sem-express",
      severity: "error",
      comment: "Nenhum módulo do núcleo pode importar o framework HTTP.",
      from: { path: "^src/(domain|application)" },
      to: { dependencyTypes: ["npm"], path: "^(express|cors)$" },
    },
    {
      name: "nucleo-sem-driver-de-banco",
      severity: "error",
      comment: "Nenhum módulo do núcleo pode importar o driver do banco.",
      from: { path: "^src/(domain|application)" },
      to: { dependencyTypes: ["npm"], path: "^pg$" },
    },
    {
      name: "sem-ciclos",
      severity: "error",
      comment: "Dependências circulares dificultam testar módulos isoladamente.",
      from: {},
      to: { circular: true },
    },
    {
      name: "sem-orfaos",
      severity: "warn",
      comment: "Módulo que ninguém importa costuma ser código esquecido.",
      from: {
        orphan: true,
        pathNot: ["^src/main\\.ts$", "\\.d\\.ts$"],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // Testes e fakes ficam fora do grafo: as métricas descrevem o código da
    // aplicação, não o andaime que a exercita.
    exclude: { path: "\\.test\\.ts$|^src/test-support" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    reporterOptions: {
      archi: {
        collapsePattern:
          "^src/(domain/[^/]+|application/[^/]+|infrastructure/[^/]+)",
      },
    },
  },
}
