const { executar } = require("../lib/executar")

/**
 * Cenário: GET /users
 * Simula múltiplos clientes listando usuários simultaneamente.
 */
async function run(baseUrl, connections, duration) {
  return executar({
    url: `${baseUrl}/users`,
    connections,
    duration,
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
}

// Lê uma base já povoada: contra tabela vazia o cenário não mediria nada.
module.exports = { run, name: "GET /users", semearUsuarios: true }
