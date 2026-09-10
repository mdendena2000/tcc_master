/**
 * Script de análise de desempenho — API única
 *
 * Uso:
 *   node run.js                        → roda todos os cenários com carga padrão
 *   node run.js --connections 50       → define conexões simultâneas
 *   node run.js --duration 20          → define duração em segundos
 *   node run.js --scenario get-users --connections 10  --duration 20   → roda apenas um cenário
 *   node run.js --scenario post-users --connections 10  --duration 20   → roda apenas um cenário
 *   node run.js --scenario mixed --connections 10  --duration 20   → roda apenas um cenário
 *
 * npm run bench:light    # 10 conexões × 10s  → smoke test, verificação rápida
 * npm run bench:medium   # 50 conexões × 20s  → carga moderada, resultado mais estável
 * npm run bench:heavy    # 100 conexões × 30s → carga alta, expõe gargalos
 * 
*/
const { prepararBanco, encerrar } = require("./lib/banco")
const { percentil, media } = require("./lib/percentis")
const getUsers = require("./scenarios/get-users")
const postUsers = require("./scenarios/post-users")
const mixed = require("./scenarios/mixed")

// ─── Configuração via argumentos de linha de comando ───────────────────────
const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : fallback
}

const CONNECTIONS = Number(getArg("connections", 10))
const DURATION    = Number(getArg("duration", 10))
const SCENARIO    = getArg("scenario", "all")

// Volume da base usada nos cenários de leitura. É parâmetro do experimento:
// mantenha o mesmo valor ao medir as duas implementações, senão a comparação
// perde sentido.
const SEED        = Number(getArg("seed", 1000))

const API_URL = "http://localhost:3000"

const ALL_SCENARIOS = { "get-users": getUsers, "post-users": postUsers, mixed }
const scenarios =
  SCENARIO === "all"
    ? Object.values(ALL_SCENARIOS)
    : [ALL_SCENARIOS[SCENARIO]].filter(Boolean)

// ─── Utilitários ──────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? "N/A" : `${n.toFixed(2)} ms`)
const fmtRps = (n) => (n == null ? "N/A" : `${n.toFixed(0)} req/s`)
const fmtPct = (n) => (n == null ? "N/A" : `${(n * 100).toFixed(2)} %`)

/**
 * Monta as métricas do cenário.
 *
 * Throughput conta apenas respostas 2xx: o `requests.mean` do autocannon
 * inclui 4xx e 5xx, que são requisições processadas, mas não com sucesso.
 *
 * A taxa de erros reúne respostas fora da faixa 2xx e falhas de conexão. Os
 * timeouts já estão contabilizados em `errors` pelo autocannon, e por isso
 * não são somados de novo.
 *
 * Latência média e percentis saem das latências coletadas requisição a
 * requisição, porque o autocannon não expõe o p95.
 */
function extractMetrics({ resultado, latencias }) {
  const ordenadas = [...latencias].sort((a, b) => a - b)

  const sucesso    = resultado["2xx"]   || 0
  const naoSucesso = resultado.non2xx   || 0
  const conexao    = resultado.errors   || 0
  const duracao    = resultado.duration || DURATION

  // Requisições que chegaram a ser enviadas: as respondidas mais as que
  // falharam antes de obter resposta.
  const tentativas = sucesso + naoSucesso + conexao

  return {
    rps:        duracao ? sucesso / duracao : null,
    avg:        media(ordenadas),
    p50:        percentil(ordenadas, 50),
    p95:        percentil(ordenadas, 95),
    p99:        percentil(ordenadas, 99),
    taxaErro:   tentativas ? (naoSucesso + conexao) / tentativas : 0,
    sucesso,
    quatroxx:   resultado["4xx"] || 0,
    cincoxx:    resultado["5xx"] || 0,
    conexao,
    timeouts:   resultado.timeouts || 0,
    tentativas,
    amostras:   ordenadas.length,
  }
}

function printResult(title, metrics) {
  console.log(`\n${"─".repeat(72)}`)
  console.log(` ${title}`)
  console.log("─".repeat(72))
  console.log(` Throughput   ${fmtRps(metrics.rps)}  (somente 2xx)`)
  console.log(` Latência avg ${fmt(metrics.avg)}`)
  console.log(` p50          ${fmt(metrics.p50)}`)
  console.log(` p95          ${fmt(metrics.p95)}`)
  console.log(` p99          ${fmt(metrics.p99)}`)
  console.log(` Taxa de erro ${fmtPct(metrics.taxaErro)}`)
  console.log(
    ` Requisições  ${metrics.tentativas} enviadas · ` +
    `${metrics.sucesso} com sucesso · ` +
    `${metrics.quatroxx} 4xx · ${metrics.cincoxx} 5xx · ` +
    `${metrics.conexao} de conexão (${metrics.timeouts} timeouts)`
  )
  console.log(` Amostras     ${metrics.amostras} latências medidas`)
  console.log("─".repeat(72))
}

// ─── Execução ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗")
  console.log("║              Análise de Desempenho da API                    ║")
  console.log("╚══════════════════════════════════════════════════════════════╝")
  console.log(`\n  URL testada          : ${API_URL}`)
  console.log(`  Conexões simultâneas : ${CONNECTIONS}`)
  console.log(`  Duração por teste    : ${DURATION}s`)
  console.log(`  Cenários             : ${SCENARIO}`)
  console.log(`  Base para leitura    : ${SEED} usuários`)

  for (const scenario of scenarios) {

    console.log(`\n\n▶ Cenário: ${scenario.name}`)

    // Espera o cenário anterior drenar: requisições ainda em voo quando o
    // autocannon encerra chegariam ao servidor depois do preparo e sujariam
    // a contagem inicial deste cenário.
    await new Promise((r) => setTimeout(r, 1000))

    // Cada cenário parte do estado que declara, não do que o anterior deixou.
    const registros = await prepararBanco(scenario.semearUsuarios ? SEED : 0)
    console.log(`  Banco preparado: ${registros} usuários`)

    process.stdout.write(`  Testando... `)

    const metrics = extractMetrics(
      await scenario.run(API_URL, CONNECTIONS, DURATION)
    )

    console.log(
      `✓ ${fmtRps(metrics.rps)} | avg ${fmt(metrics.avg)} | ` +
      `erros ${fmtPct(metrics.taxaErro)}`
    )

    printResult(scenario.name, metrics)

  }

}

main()
  .catch((err) => {
    console.error("Erro ao executar testes:", err.message)
    process.exitCode = 1
  })
  .finally(encerrar)