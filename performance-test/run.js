/**
 * Testes de carga das APIs do experimento.
 *
 * Mede uma API por vez — as duas simultâneas disputariam CPU e banco.
 *
 *   node run.js                                    api-mvc, na 3000
 *   node run.js --url http://localhost:3001        api-hexagonal
 *   node run.js --scenario get-users               um cenário só
 *   npm run bench:medium                           50 conexões
 */
const { prepararBanco, encerrar } = require("./lib/banco")
const { percentil, media } = require("./lib/percentis")
const { salvar } = require("./lib/resultado")

const CENARIOS = {
  "get-users": require("./scenarios/get-users"),
  "post-users": require("./scenarios/post-users"),
  mixed: require("./scenarios/mixed"),
}

// ─── Parâmetros ───────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`)
  return i !== -1 ? args[i + 1] : padrao
}

const API_URL = getArg("url", process.env.API_URL || "http://localhost:3000")
const CONEXOES = Number(getArg("connections", 10))
const DURACAO = Number(getArg("duration", 20))
const CENARIO = getArg("scenario", "all")

// Tamanho da base nos cenários de leitura. É parâmetro do experimento: use o
// mesmo valor nas duas implementações, senão a comparação perde sentido.
const SEED = Number(getArg("seed", 100))

const selecionados =
  CENARIO === "all" ? Object.values(CENARIOS) : [CENARIOS[CENARIO]]

if (selecionados.some((c) => !c)) {
  console.error(
    `Cenário desconhecido: "${CENARIO}". ` +
    `Use um de: ${Object.keys(CENARIOS).join(", ")} ou "all".`
  )
  process.exit(1)
}

// ─── Métricas ─────────────────────────────────────────────────────────────
const ms = (n) => (n == null ? "N/A" : `${n.toFixed(2)} ms`)
const rps = (n) => (n == null ? "N/A" : `${n.toFixed(0)} req/s`)
const pct = (n) => (n == null ? "N/A" : `${(n * 100).toFixed(2)} %`)

/**
 * Throughput conta apenas respostas 2xx — 4xx e 5xx são requisições
 * processadas, mas não com sucesso.
 *
 * Latência média e percentis saem das latências coletadas requisição a
 * requisição, porque o autocannon não expõe o p95.
 */
function calcularMetricas({ resultado, latencias }) {
  const ordenadas = [...latencias].sort((a, b) => a - b)

  const sucesso = resultado["2xx"] || 0
  const naoSucesso = resultado.non2xx || 0
  const conexao = resultado.errors || 0
  const duracao = resultado.duration || DURACAO

  // Timeouts já entram em `errors`; somá-los de novo contaria duas vezes.
  const tentativas = sucesso + naoSucesso + conexao

  return {
    throughput: duracao ? sucesso / duracao : null,
    media: media(ordenadas),
    p50: percentil(ordenadas, 50),
    p95: percentil(ordenadas, 95),
    p99: percentil(ordenadas, 99),
    taxaErro: tentativas ? (naoSucesso + conexao) / tentativas : 0,
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
  console.log(` Throughput   ${rps(m.throughput)}  (somente 2xx)`)
  console.log(` Latência avg ${ms(m.media)}`)
  console.log(` p50          ${ms(m.p50)}`)
  console.log(` p95          ${ms(m.p95)}`)
  console.log(` p99          ${ms(m.p99)}`)
  console.log(` Taxa de erro ${pct(m.taxaErro)}`)
  console.log(
    ` Requisições  ${m.tentativas} enviadas · ${m.sucesso} com sucesso · ` +
    `${m.quatroxx} 4xx · ${m.cincoxx} 5xx · ${m.conexao} de conexão`
  )
  console.log(` Amostras     ${m.amostras} latências medidas`)
  console.log(linha)
}

async function conferirDisponibilidade() {

  const http = require(API_URL.startsWith("https") ? "https" : "http")

  await new Promise((resolve, reject) => {
    const req = http.get(`${API_URL}/users`, (res) => {
      res.resume()
      resolve()
    })
    req.setTimeout(3000, () => req.destroy(new Error("tempo esgotado")))
    req.on("error", () =>
      reject(new Error(`API não respondeu em ${API_URL}. Suba-a antes de medir.`))
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

    // Espera o cenário anterior drenar: requisições ainda em voo chegariam
    // depois do preparo e sujariam a contagem inicial deste cenário.
    await new Promise((r) => setTimeout(r, 1000))

    const registros = await prepararBanco(cenario.semearUsuarios ? SEED : 0)
    console.log(`  Base preparada: ${registros} usuários`)
    process.stdout.write("  Medindo... ")

    const metricas = calcularMetricas(
      await cenario.run(API_URL, CONEXOES, DURACAO)
    )

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
    console.error("Falha ao executar os testes:", erro.message)
    process.exitCode = 1
  })
  .finally(encerrar)
