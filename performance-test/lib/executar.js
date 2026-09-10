const autocannon = require("autocannon")

/**
 * Executa o autocannon guardando a latência de cada resposta.
 *
 * O evento `response` entrega o tempo individual de cada requisição, que é o
 * insumo para calcular os percentis exigidos pelo trabalho.
 */
function executar(opcoes) {
  return new Promise((resolve, reject) => {
    const latencias = []

    const instancia = autocannon(opcoes, (erro, resultado) => {
      if (erro) return reject(erro)
      resolve({ resultado, latencias })
    })

    instancia.on("response", (_cliente, _status, _bytes, ms) => {
      latencias.push(ms)
    })
  })
}

module.exports = { executar }
