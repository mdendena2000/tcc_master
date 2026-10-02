const fs = require("fs")
const path = require("path")

const DIRETORIO = path.join(__dirname, "..", "resultados")

/**
 * Abre um arquivo de resultados que é reescrito a cada medição.
 *
 * Gravar só no fim significa perder a coleta inteira se algo falhar na última
 * etapa — foi o que aconteceu numa execução de sete minutos. Enquanto a
 * coleta não termina, o arquivo fica marcado com `parcial: true`.
 *
 * Guarda apenas os valores agregados: a amostra bruta de latências, com
 * dezenas de milhares de pontos por cenário, já foi consumida no cálculo dos
 * percentis e não é persistida.
 */
function abrirIncremental(execucao) {
  fs.mkdirSync(DIRETORIO, { recursive: true })

  const quando = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")
  const arquivo = path.join(
    DIRETORIO,
    `${quando}_${execucao.rotulo}_${execucao.conexoes}c.json`
  )

  const gravar = (cenarios, parcial) =>
    fs.writeFileSync(
      arquivo,
      JSON.stringify({ execucao: { ...execucao, parcial }, cenarios }, null, 2) + "\n"
    )

  gravar({}, true)
  return { arquivo, gravar }
}

module.exports = { abrirIncremental }
