const { executar } = require("../lib/executar")
const { criarUsuario } = require("../lib/requisicoes")

/** Escrita pura: todas as conexões criando usuários. */
async function run(baseUrl, connections, duration) {
  return executar({
    url: baseUrl,
    connections,
    duration,
    requests: [criarUsuario()],
  })
}

// Parte de zero: o cenário mede inserções, não convivência com dados antigos.
module.exports = { run, name: "POST /users", semearUsuarios: false }
