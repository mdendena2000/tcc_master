const { executar } = require("../lib/executar")
const { criarUsuario } = require("../lib/requisicoes")

const PROPORCAO_ESCRITA = 0.3

/**
 * Carga mista: duas instâncias do autocannon em paralelo, 70% das conexões
 * lendo e 30% escrevendo.
 *
 * As latências das duas viram uma amostra só, e é dela que saem os
 * percentis. Combinar os percentis de cada instância daria um valor errado:
 * o p95 de dois conjuntos não é função dos p95 de cada um.
 */
async function run(baseUrl, connections, duration) {
  const conexoesEscrita = Math.max(1, Math.round(connections * PROPORCAO_ESCRITA))
  const conexoesLeitura = Math.max(1, connections - conexoesEscrita)

  const [leitura, escrita] = await Promise.all([
    executar({
      url: `${baseUrl}/users`,
      connections: conexoesLeitura,
      duration,
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
    executar({
      url: baseUrl,
      connections: conexoesEscrita,
      duration,
      requests: [criarUsuario()],
    }),
  ])

  const somar = (campo) =>
    (leitura.resultado[campo] || 0) + (escrita.resultado[campo] || 0)

  return {
    resultado: {
      // Rodam em paralelo pelo mesmo período: a janela é a maior das duas,
      // não a soma.
      duration: Math.max(
        leitura.resultado.duration || 0,
        escrita.resultado.duration || 0
      ),
      "2xx":    somar("2xx"),
      "4xx":    somar("4xx"),
      "5xx":    somar("5xx"),
      non2xx:   somar("non2xx"),
      errors:   somar("errors"),
      timeouts: somar("timeouts"),
    },
    latencias: [...leitura.latencias, ...escrita.latencias],
  }
}

// Usa a mesma base do cenário de leitura. Começar vazio faria as primeiras
// leituras devolverem lista vazia e as últimas, milhares de registros — a
// latência cresceria durante a execução e distorceria os percentis.
module.exports = { run, name: "Misto (70% GET / 30% POST)", semearUsuarios: true }
