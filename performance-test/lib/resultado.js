const fs = require("fs")
const path = require("path")

const DIRETORIO = path.join(__dirname, "..", "resultados")

/**
 * Grava as métricas de uma execução em JSON.
 *
 * Guarda apenas os valores agregados — a amostra bruta de latências, que tem
 * dezenas de milhares de pontos por cenário, já foi consumida no cálculo dos
 * percentis e não é persistida.
 */
function salvar(execucao, cenarios) {
  fs.mkdirSync(DIRETORIO, { recursive: true })

  const porta = new URL(execucao.url).port

  const quando = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")

  const arquivo = path.join(DIRETORIO, `${quando}_porta${porta}_${execucao.conexoes}c.json`)

  fs.writeFileSync(
    arquivo,
    JSON.stringify({ execucao, cenarios }, null, 2) + "\n"
  )

  return arquivo
}

module.exports = { salvar }
