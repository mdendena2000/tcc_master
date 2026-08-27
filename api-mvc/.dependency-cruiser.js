/**
 * Regras arquiteturais da versão MVC.
 *
 * As camadas são horizontais e o fluxo é Routes -> Controller -> Model -> Repository.
 * Não há fronteira formal isolando o domínio da infraestrutura:
 * os Models importam os repositórios concretos, e é isso que as métricas de
 * acoplamento medem.
 */
module.exports = {
  forbidden: [
    {
      name: "modelo-sem-controller",
      severity: "error",
      comment: "O fluxo desce: o Model não volta a chamar o Controller.",
      from: { path: "^src/models" },
      to: { path: "^src/(controllers|routes)" },
    },
    {
      name: "repositorio-sem-controller",
      severity: "error",
      comment: "O repositório é a camada mais baixa e não conhece a de cima.",
      from: { path: "^src/repositories" },
      to: { path: "^src/(controllers|routes|models)", pathNot: "^src/models/(User|Board|Task)\\.ts$" },
    },
    {
      name: "controller-sem-banco",
      severity: "error",
      comment:
        "O acesso a dados passa pelo Model; o Controller não fala direto com o banco.",
      from: { path: "^src/controllers" },
      to: { path: "^src/(database|repositories)" },
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
        pathNot: ["^src/app\\.ts$", "\\.d\\.ts$"],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // Mesma exclusão usada na versão Hexagonal, para comparação justa.
    exclude: { path: "\\.test\\.ts$" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    reporterOptions: {
      archi: { collapsePattern: "^src/[^/]+" },
    },
  },
}
