/**
 * Coleta comparativa entre as duas implementações.
 *
 * Por padrão mede as duas APIs em sequência imediata dentro de cada cenário,
 * invertendo quem abre o par. Medir uma API inteira e depois a outra favorece
 * sistematicamente a segunda: cache do SO, buffers do PostgreSQL e o JIT do V8
 * chegam aquecidos. Esse viés já foi medido neste ambiente em até 51% — dez
 * vezes maior que a diferença entre as arquiteturas.
 *
 * Ambas as APIs precisam estar no ar; apenas uma recebe carga por vez.
 * O arquivo de resultados é reescrito a cada medição, então uma interrupção
 * no meio preserva o que já foi coletado.
 *
 *   node experimento.js
 *   node experimento.js --repeticoes 5 --duracao 20
 */
const { prepararBanco, encerrar } = require("./lib/banco")
const { calcularMetricas } = require("./lib/metricas")
const { abrirIncremental } = require("./lib/resultado")
const { consolidar, imprimir, avisarDispersao, METRICAS } = require("./lib/relatorio")

const CENARIOS = [
  require("./scenarios/get-users"),
  require("./scenarios/post-users"),
  require("./scenarios/mixed"),
]

const args = process.argv.slice(2)
const getArg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`)
  return i !== -1 ? args[i + 1] : padrao
}

const ALVOS = [
  { nome: "MVC", url: getArg("mvc", "http://localhost:3000") },
  { nome: "Hexagonal", url: getArg("hexagonal", "http://localhost:3001") },
]

const REPETICOES = Number(getArg("repeticoes", 3))
const CONEXOES = Number(getArg("conexoes", 50))
const DURACAO = Number(getArg("duracao", 20))
const SEED = Number(getArg("seed", 100))
const AQUECER = Number(getArg("aquecimento", 8))

/**
 * Ordem em que as medições são encadeadas dentro de cada repetição.
 *
 *   pareada    agrupa por cenário: as duas APIs medidas em sequência
 *   mvc        agrupa por API, MVC sempre primeiro
 *   hexagonal  agrupa por API, Hexagonal sempre primeiro
 *
 * A pareada aproxima as duas medições do mesmo cenário no tempo, então
 * variações da máquina (GC, cache, outro processo) atingem as duas de forma
 * parecida em vez de entrar só numa delas.
 *
 * Nas ordens fixas, quem mede por último herda o sistema aquecido pela outra
 * e leva vantagem sistemática. Elas existem para medir esse próprio viés, não
 * para concluir.
 */
const ORDENS = {
  // Para cada cenário, as duas APIs em sequência. Quem abre o par alterna
  // por repetição e por cenário, para nenhuma ficar sempre em vantagem.
  pareada: (alvos, cenarios, r) =>
    cenarios.flatMap((cenario, i) => {
      const dupla = (r + i) % 2 === 0 ? alvos : [...alvos].reverse()
      return dupla.map((alvo) => ({ alvo, cenario }))
    }),

  mvc: (alvos, cenarios) =>
    alvos.flatMap((alvo) => cenarios.map((cenario) => ({ alvo, cenario }))),

  hexagonal: (alvos, cenarios) =>
    [...alvos].reverse().flatMap((alvo) =>
      cenarios.map((cenario) => ({ alvo, cenario }))
    ),
}

const ORDEM = getArg("ordem", "pareada")

if (!ORDENS[ORDEM]) {
  console.error(
    `Ordem desconhecida: "${ORDEM}". Use uma de: ${Object.keys(ORDENS).join(", ")}.`
  )
  process.exit(1)
}

const CHAVES = [...METRICAS.map((m) => m[0]), "taxaErro"]

// Largura das colunas da tabela de progresso.
const COL = { arq: 11, endpoint: 28, num: 13, erro: 13 }

function cabecalho() {
  return (
    " " +
    "Arq.".padEnd(COL.arq) +
    "Endpoint".padEnd(COL.endpoint) +
    "Throughput".padStart(COL.num) +
    "Latência".padStart(COL.num) +
    "Requisições".padStart(COL.num) +
    "p50".padStart(COL.num) +
    "p95".padStart(COL.num) +
    "p99".padStart(COL.num) +
    "Erro".padStart(COL.erro)
  )
}

function linha(m) {
  return (
    `${m.throughput >= 100 ? m.throughput.toFixed(0) : m.throughput.toFixed(1)} req/s`.padStart(COL.num) +
    `${m.media.toFixed(1)} ms`.padStart(COL.num) +
    `${m.tentativas.toFixed(0)}`.padStart(COL.num) +
    `${m.p50.toFixed(1)} ms`.padStart(COL.num) +
    `${m.p95.toFixed(1)} ms`.padStart(COL.num) +
    `${m.p99.toFixed(1)} ms`.padStart(COL.num) +
    `${(m.taxaErro * 100).toFixed(2)} %`.padStart(COL.erro)
  )
}

function conferirDisponibilidade(url) {
  const http = require(url.startsWith("https") ? "https" : "http")
  return new Promise((resolve, reject) => {
    const req = http.get(`${url}/users`, (res) => {
      res.resume()
      resolve()
    })
    req.setTimeout(3000, () => req.destroy(new Error("tempo esgotado")))
    req.on("error", () =>
      reject(new Error(`API não respondeu em ${url}. Suba as duas antes de medir.`))
    )
  })
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

/** Descreve a sequência da primeira repetição, para conferência antes de rodar. */
function sequencia() {
  return ORDENS[ORDEM](ALVOS, CENARIOS, 0)
    .map((m) => `${m.alvo.nome[0]}·${m.cenario.name.split(" ")[0]}`)
    .join(" → ")
}

async function medirCenario(url, cenario) {
  // Espera a medição anterior drenar: requisições ainda em voo chegariam
  // depois do preparo e sujariam a contagem inicial deste cenário.
  await pausa(1000)
  await prepararBanco(cenario.semearUsuarios ? SEED : 0)
  return calcularMetricas(await cenario.run(url, CONEXOES, DURACAO), DURACAO)
}

/** Rodada curta e descartada, para o sistema sair do estado frio. */
async function aquecer() {

  process.stdout.write(`  Aquecendo (${AQUECER}s por API)... `)

  for (const alvo of ALVOS) {
    await prepararBanco(SEED)
    await CENARIOS[0].run(alvo.url, CONEXOES, AQUECER)
  }

  console.log("Pronto!")

}

async function main() {
  for (const alvo of ALVOS) await conferirDisponibilidade(alvo.url)

  console.log("\nExperimento comparativo")
  console.log(`  MVC          : ${ALVOS[0].url}`)
  console.log(`  Hexagonal    : ${ALVOS[1].url}`)
  console.log(`  Conexões     : ${CONEXOES}`)
  console.log(`  Duração      : ${DURACAO}s por cenário`)
  console.log(`  Base leitura : ${SEED} usuários`)
  console.log(`  Repetições   : ${REPETICOES}`)
  // console.log(`  Ordem        : ${ORDEM}${ORDEM === "pareada" ? "" : "  (ordem fixa: favorece quem mede por último)"}`)
  // console.log(`  Sequência    : ${sequencia()}`)

  const estimativa = Math.round(
    (REPETICOES * ALVOS.length * CENARIOS.length * (DURACAO + 1.5) + AQUECER * 2) / 60
  )
  console.log(`  Tempo estimado: ~${estimativa} min`)

  const { arquivo, gravar } = abrirIncremental({
    data: new Date().toISOString(),
    tipo: "experimento-comparativo",
    rotulo: "comparativo",
    alvos: ALVOS,
    conexoes: CONEXOES,
    duracao: DURACAO,
    seed: SEED,
    repeticoes: REPETICOES,
    ordem: ORDEM,
  })
  // console.log(`  Gravando em  : ${arquivo}\n`)

  await aquecer()

  // bruto[alvo][cenario][metrica] = [valor por repetição]
  const bruto = {}
  for (const alvo of ALVOS) {
    bruto[alvo.nome] = {}
    for (const c of CENARIOS) bruto[alvo.nome][c.name] = {}
  }

  for (let r = 0; r < REPETICOES; r++) {
    const plano = ORDENS[ORDEM](ALVOS, CENARIOS, r)
    console.log(`\nRepetição ${r + 1}/${REPETICOES}`)
    console.log(cabecalho())
    console.log(" " + "─".repeat(cabecalho().length - 1))

    for (const { alvo, cenario } of plano) {
      process.stdout.write(
        " " + alvo.nome.padEnd(COL.arq) + cenario.name.padEnd(COL.endpoint)
      )
      const m = await medirCenario(alvo.url, cenario)
      console.log(linha(m))

      for (const chave of CHAVES) {
        ; (bruto[alvo.nome][cenario.name][chave] ??= []).push(m[chave])
      }

      // Grava a cada medição: uma interrupção não perde o já coletado.
      gravar({ bruto, agregados: consolidar(bruto) }, true)
    }
  }

  const agregados = consolidar(bruto)
  gravar({ bruto, agregados }, false)

  console.log("\n\nANÁLISE CONCLUÍDA")
  imprimir(agregados, {
    alvos: ALVOS.map((a) => a.nome),
    cenarios: CENARIOS.map((c) => c.name),
  })
  // avisarDispersao(agregados)
  // console.log(`\nResultados em ${arquivo}\n`)
}

main()
  .catch((erro) => {
    console.error("Falha ao executar o experimento:", erro.message)
    process.exitCode = 1
  })
  .finally(encerrar)
