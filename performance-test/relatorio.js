/**
 * Gera o relatório comparativo a partir de uma coleta já salva.
 *
 * Separar a apresentação da medição permite refazer tabelas, conferir
 * dispersão e inspecionar valores brutos sem repetir os minutos de carga.
 *
 *   node relatorio.js                              usa a coleta mais recente
 *   node relatorio.js resultados/<arquivo>.json
 *   node relatorio.js --bruto                      mostra cada repetição
 */
const fs = require("fs")
const path = require("path")
const { consolidar, imprimir, avisarDispersao, METRICAS } = require("./lib/relatorio")

const DIRETORIO = path.join(__dirname, "resultados")

const args = process.argv.slice(2)
const mostrarBruto = args.includes("--bruto")
const informado = args.find((a) => !a.startsWith("--"))

function coletaMaisRecente() {
  const arquivos = fs
    .readdirSync(DIRETORIO)
    .filter((f) => f.includes("comparativo") && f.endsWith(".json"))
    .sort()

  if (!arquivos.length) {
    throw new Error(
      "Nenhuma coleta comparativa em resultados/. Rode `node experimento.js` antes."
    )
  }
  return path.join(DIRETORIO, arquivos[arquivos.length - 1])
}

function imprimirBruto(bruto, alvos, cenarios) {
  console.log("\n\nVALORES POR REPETIÇÃO")
  for (const cenario of cenarios) {
    console.log(`\n ${cenario}`)
    for (const [chave, rotulo] of METRICAS) {
      console.log(`   ${rotulo}`)
      for (const alvo of alvos) {
        const v = bruto[alvo]?.[cenario]?.[chave] ?? []
        const casas = chave === "throughput" ? 0 : 1
        console.log(
          `     ${alvo.padEnd(10)} ${v.map((x) => x.toFixed(casas).padStart(8)).join(" · ")}`
        )
      }
    }
  }
}

function main() {
  const arquivo = informado || coletaMaisRecente()
  const dados = JSON.parse(fs.readFileSync(arquivo, "utf-8"))
  const { execucao, cenarios: conteudo } = dados

  if (!conteudo?.bruto) {
    throw new Error(`${arquivo} não é uma coleta do experimento comparativo.`)
  }

  const alvos = (execucao.alvos || []).map((a) => a.nome)
  const cenarios = Object.keys(conteudo.bruto[alvos[0]] || {})
  // Recalcula a partir do bruto em vez de usar os agregados gravados: o
  // bruto é o dado medido, o agregado é derivado dele, e uma correção no
  // cálculo precisa valer também para coletas antigas.
  const agregados = consolidar(conteudo.bruto)

  console.log(`\nRelatório comparativo`)
  console.log(`  Arquivo      : ${path.basename(arquivo)}`)
  console.log(`  Coletado em  : ${new Date(execucao.data).toLocaleString("pt-BR")}`)
  console.log(`  Conexões     : ${execucao.conexoes} · ${execucao.duracao}s · seed ${execucao.seed}`)

  const feitas = conteudo.bruto[alvos[0]]?.[cenarios[0]]?.throughput?.length ?? 0
  console.log(`  Repetições   : ${feitas} de ${execucao.repeticoes}`)

  if (execucao.parcial) {
    console.log(`\n  Coleta incompleta — o experimento não chegou ao fim.`)
  }

  console.log("\nRESULTADO CONSOLIDADO  (média ± desvio padrão)")
  imprimir(agregados, { alvos, cenarios })
  // avisarDispersao(agregados)

  if (mostrarBruto) imprimirBruto(conteudo.bruto, alvos, cenarios)
  console.log()
}

try {
  main()
} catch (erro) {
  console.error(erro.message)
  process.exitCode = 1
}
