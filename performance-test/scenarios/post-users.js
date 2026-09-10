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
 * Cenário: POST /users
 *
 * O corpo é gerado no momento do envio, via setupRequest. Pré-montar um array
 * de requisições não funciona aqui: cada conexão percorre esse array a partir
 * do início, então todas usam o mesmo e-mail ao mesmo tempo e colidem na RN01
 * — com N conexões, N-1 de cada N requisições falhariam.
 *
 * O setupRequest precisa estar dentro do item de `requests`; declarado no
 * nível das opções, é ignorado sem aviso.
 */
async function run(baseUrl, connections, duration) {
  return executar({
    url: baseUrl,
    connections,
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
  })
}

// Parte de zero: o cenário mede inserções, não convivência com dados antigos.
module.exports = { run, name: "POST /users", semearUsuarios: false }
