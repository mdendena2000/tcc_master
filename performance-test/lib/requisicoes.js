const { randomUUID } = require("crypto")

/**
 * Requisição de criação de usuário para o autocannon.
 *
 * O corpo é montado a cada envio, e não uma vez só: as conexões percorrem o
 * array `requests` em paralelo pelo mesmo índice, então um corpo fixo faria
 * todas usarem o mesmo e-mail ao mesmo tempo e colidirem na RN01.
 *
 * O `setupRequest` precisa ficar dentro do item — no nível das opções do
 * autocannon ele é ignorado sem aviso.
 */
function criarUsuario() {
  const corpo = () =>
    JSON.stringify({
      name: "Usuário Teste",
      email: `${randomUUID()}@email.com`,
      password: "senha123",
      admin: false,
    })

  return {
    method: "POST",
    path: "/users",
    headers: { "content-type": "application/json" },
    body: corpo(),
    setupRequest: (req) => ({ ...req, body: corpo() }),
  }
}

module.exports = { criarUsuario }
