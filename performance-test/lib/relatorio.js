const { agregar } = require("./metricas")

const METRICAS = [
  ["throughput", "throughput (req/s)"],
  ["media", "latência média (ms)"],
  ["p50", "p50 (ms)"],
  ["p95", "p95 (ms)"],
  ["p99", "p99 (ms)"],
]

/** bruto[alvo][cenario][metrica] = [valores] → média, desvio e CV. */
function consolidar(bruto) {
  const saida = {}
  for (const alvo of Object.keys(bruto)) {
    saida[alvo] = {}
    for (const cenario of Object.keys(bruto[alvo])) {
      saida[alvo][cenario] = {}
      for (const chave of Object.keys(bruto[alvo][cenario])) {
        saida[alvo][cenario][chave] = agregar(bruto[alvo][cenario][chave])
      }
    }
  }
  return saida
}

/**
 * Throughput sem casa decimal quando é alto, com uma casa quando é baixo.
 *
 * No GET, com ~1200 req/s, a decimal é ruído. No POST, com ~32 req/s, ela é
 * resolução: sem ela, 32,07 e 32,44 saem ambos como "32" e a coluna de
 * diferença parece contradizer a tabela.
 */
const formatar = (chave, v) =>
  v == null ? "—" : chave !== "throughput" ? v.toFixed(1) : v >= 100 ? v.toFixed(0) : v.toFixed(1)

/**
 * Diferença percentual do segundo alvo em relação ao primeiro.
 *
 * O sinal indica direção, não qualidade: num throughput o `+` é ganho, numa
 * latência é perda. Se a diferença é grande o bastante para significar algo,
 * quem responde é o desvio padrão ao lado.
 */
function diferenca(a, b) {
  if (a.media == null || b.media == null) return "—"

  const pct = ((b.media - a.media) / a.media) * 100

  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`

}

function imprimir(agregados, { alvos, cenarios }) {
  const [a, b] = alvos

  for (const cenario of cenarios) {

    const linha = "─".repeat(76)

    console.log(`\n${linha}\n ${cenario}\n${linha}`)

    console.log(` ${"métrica".padEnd(20)}${a.padStart(18)}${b.padStart(18)}${"Dif. H vs M".padStart(16)}`)

    for (const [chave, rotulo] of METRICAS) {

      const x = agregados[a][cenario][chave]
      const y = agregados[b][cenario][chave]

      const celula = (c) => c.media == null ? "—" : `${formatar(chave, c.media)} ± ${formatar(chave, c.desvio)}`

      console.log(` ${rotulo.padEnd(20)}${celula(x).padStart(18)}${celula(y).padStart(18)}` + `${diferenca(x, y).padStart(16)}`)

    }

    const erro = (alvo) => ((agregados[alvo][cenario].taxaErro?.media ?? 0) * 100).toFixed(2)

    console.log(` ${"taxa de erro (%)".padEnd(20)}${erro(a).padStart(18)}${erro(b).padStart(18)}`)

  }
}

/**
 * Sinaliza cenários cuja dispersão é alta demais para sustentar conclusão.
 *
 * Olha todas as métricas, não só o throughput: os percentis costumam ser bem
 * mais instáveis que ele, e checar apenas o throughput deixava passar
 * cenários com CV de 35% no p99.
 */
function avisarDispersao(agregados, limite = 0.15) {
  const suspeitos = []

  for (const alvo of Object.keys(agregados)) {
    for (const cenario of Object.keys(agregados[alvo])) {
      let pior = null

      for (const [chave, rotulo] of METRICAS) {
        const cv = agregados[alvo][cenario][chave]?.cv
        if (cv != null && (pior === null || cv > pior.cv)) pior = { cv, rotulo }
      }

      if (pior && pior.cv > limite) suspeitos.push({ alvo, cenario, ...pior })
    }
  }

  if (suspeitos.length) {
    console.log("\n  Dispersão alta — resultados não conclusivos:")
    for (const s of suspeitos) {
      console.log(
        `    ${s.alvo} · ${s.cenario}: CV de ${(s.cv * 100).toFixed(0)}% em ${s.rotulo}`
      )
    }
    console.log("    Repita a medição com a máquina ociosa ou aumente --repeticoes.")
  }
}

module.exports = { consolidar, imprimir, avisarDispersao, METRICAS }
