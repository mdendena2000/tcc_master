const { randomUUID } = require("crypto")
const { executar } = require("../lib/executar")

/** Corpo com e-mail novo a cada chamada, para não esbarrar na RN01. */
const corpo = () =>
  JSON.stringify({
    name: "Usuário Teste",
    email: `${randomUUID()}@email.com`,
    password: "senha123",
    admin: false,
  })

/**
 * Cenário: Misto (70% GET / 30% POST)
 * Executa duas instâncias de autocannon em paralelo com split de conexões.
 *
 * O throughput das duas é somado, e as latências são reunidas numa única
 * amostra — os percentis saem dessa amostra combinada. Calcular o percentil
 * de cada instância e depois combiná-los produziria um valor incorreto: o p95
 * de dois conjuntos não é uma função dos p95 de cada um.
 */
async function run(baseUrl, connections, duration) {
  const postConnections = Math.max(1, Math.round(connections * 0.3))
  const getConnections  = Math.max(1, connections - postConnections)

  const [leitura, escrita] = await Promise.all([
    executar({
      url: `${baseUrl}/users`,
      connections: getConnections,
      duration,
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
    executar({
      url: baseUrl,
      connections: postConnections,
      duration,
      requests: [
        {
          method: "POST",
          path: "/users",
          headers: { "content-type": "application/json" },
          body: corpo(),
          setupRequest: (req) => ({ ...req, body: corpo() }),
        },
      ],
    }),
  ])

  const somar = (campo) =>
    (leitura.resultado[campo] || 0) + (escrita.resultado[campo] || 0)

  return {
    resultado: {
      requests: {
        mean: (leitura.resultado.requests.mean || 0) +
              (escrita.resultado.requests.mean || 0),
      },
      // As duas instâncias rodam em paralelo pelo mesmo período, então a
      // duração da janela é a maior entre elas — não a soma.
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
// latência cresceria durante a própria execução e distorceria os percentis.
module.exports = { run, name: "Misto (70% GET / 30% POST)", semearUsuarios: true }
