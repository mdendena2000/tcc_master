/**
 * Testes de carga da API Hexagonal.
 *
 * Configuração fixa:
 *   API:      http://localhost:3001
 *   Conexões: 50
 *   Duração:  20 segundos por cenário
 *   Seed:     100 usuários
 *
 * Execução:
 *   node run.js
 */
const { prepararBanco, encerrar } = require("./lib/banco")
const { percentil, media } = require("./lib/percentis")
const { salvar } = require("./lib/resultado")

const CENARIOS = {
  "get-users": require("./scenarios/get-users"),
  "post-users": require("./scenarios/post-users"),
  mixed: require("./scenarios/mixed"),
}

// ─── Configuração fixa ────────────────────────────────────────────────────

const API_URL = "http://localhost:3001"
const CONEXOES = 50
const DURACAO = 20
const SEED = 100

const selecionados = Object.values(CENARIOS)

// ─── Métricas ─────────────────────────────────────────────────────────────

const ms = (n) => (n == null ? "N/A" : `${n.toFixed(2)} ms`)
const rps = (n) => (n == null ? "N/A" : `${n.toFixed(0)} req/s`)
const pct = (n) => (n == null ? "N/A" : `${(n * 100).toFixed(2)} %`)

/**
 * Throughput conta apenas respostas 2xx.
 *
 * Latência média e percentis são calculados a partir das
 * latências coletadas requisição a requisição.
 */
function calcularMetricas({ resultado, latencias }) {
  const ordenadas = [...latencias].sort((a, b) => a - b)

  const sucesso = resultado["2xx"] || 0
  const naoSucesso = resultado.non2xx || 0
  const conexao = resultado.errors || 0
  const duracao = resultado.duration || DURACAO

  const tentativas = sucesso + naoSucesso + conexao

  return {
    throughput: duracao ? sucesso / duracao : null,
    media: media(ordenadas),
    p50: percentil(ordenadas, 50),
    p95: percentil(ordenadas, 95),
    p99: percentil(ordenadas, 99),
    taxaErro: tentativas
      ? (naoSucesso + conexao) / tentativas
      : 0,
    sucesso,
    quatroxx: resultado["4xx"] || 0,
    cincoxx: resultado["5xx"] || 0,
    conexao,
    tentativas,
    amostras: ordenadas.length,
  }
}

function imprimir(nome, m) {
  const linha = "─".repeat(72)

  console.log(`\n${linha}\n ${nome}\n${linha}`)
  console.log(` Throughput   ${rps(m.throughput)}`)
  console.log(` Latência avg ${ms(m.media)}`)
  console.log(` p50          ${ms(m.p50)}`)
  console.log(` p95          ${ms(m.p95)}`)
  console.log(` p99          ${ms(m.p99)}`)
  console.log(` Taxa de erro ${pct(m.taxaErro)}`)
  console.log(` Requisições  ${m.tentativas}`)
  console.log(` 2xx          ${m.sucesso}`)
  console.log(` 4xx          ${m.quatroxx}`)
  console.log(` 5xx          ${m.cincoxx}`)
  console.log(` Timeout      ${m.conexao}`)
  console.log(` Amostras     ${m.amostras} latências medidas`)
  console.log(linha)
}

async function conferirDisponibilidade() {
  const http = require("http")

  await new Promise((resolve, reject) => {
    const req = http.get(`${API_URL}/users`, (res) => {
      res.resume()
      resolve()
    })

    req.setTimeout(
      3000,
      () => req.destroy(new Error("tempo esgotado"))
    )

    req.on("error", () =>
      reject(
        new Error(
          `API não respondeu em ${API_URL}. Suba-a antes de medir.`
        )
      )
    )
  })
}

async function main() {
  await conferirDisponibilidade()

  console.log("\nTestes de carga")
  console.log(`  API          : ${API_URL}`)
  console.log(`  Conexões     : ${CONEXOES}`)
  console.log(`  Duração      : ${DURACAO}s por cenário`)
  console.log(`  Base leitura : ${SEED} usuários`)

  const coletado = {}

  for (const cenario of selecionados) {
    console.log(`\n▶ ${cenario.name}`)

    // Aguarda requisições do cenário anterior terminarem.
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const registros = await prepararBanco(
      cenario.semearUsuarios ? SEED : 0
    )

    console.log(`  Base preparada: ${registros} usuários`)
    process.stdout.write("  Medindo... ")

    const resultado = await cenario.run(
      API_URL,
      CONEXOES,
      DURACAO
    )

    const metricas = calcularMetricas(resultado)

    console.log("concluído")

    imprimir(cenario.name, metricas)

    coletado[cenario.name] = metricas
  }

  const arquivo = salvar(
    {
      data: new Date().toISOString(),
      url: API_URL,
      conexoes: CONEXOES,
      duracao: DURACAO,
      seed: SEED,
    },
    coletado
  )

  console.log(`\nResultados em ${arquivo}`)
}

main()
  .catch((erro) => {
    console.error(
      "Falha ao executar os testes:",
      erro.message
    )

    process.exitCode = 1
  })
  .finally(encerrar)