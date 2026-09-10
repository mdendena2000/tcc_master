const path = require("path")
const { Pool } = require("pg")

/**
 * Preparo do estado do banco entre cenários.
 *
 * Cada cenário parte de um estado conhecido: sem isso, a ordem de execução
 * mudaria os resultados, e a API medida em segundo lugar enfrentaria um banco
 * maior que a primeira.
 *
 * As credenciais vêm do .env do api-mvc, já que as duas implementações
 * apontam para o mesmo banco. Variáveis já definidas no ambiente têm
 * precedência.
 */
require("dotenv").config({ path: path.join(__dirname, "..", "..", "api-mvc", ".env") })

let pool

function conectar() {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    })
  }
  return pool
}

/**
 * Zera as tabelas e, se pedido, insere `usuarios` registros.
 *
 * A carga é feita por SQL, não pela API: popular via POST levaria minutos,
 * calcularia o hash de cada senha e mediria a aplicação durante o preparo.
 *
 * Os usuários semeados têm um hash inválido de propósito — servem para
 * leitura e nunca autenticam.
 */
async function prepararBanco(usuarios) {
  const cliente = conectar()

  await cliente.query("TRUNCATE users CASCADE")

  if (usuarios > 0) {
    await cliente.query(
      `INSERT INTO users (id, name, email, admin, password, created_at)
       SELECT gen_random_uuid(), 'Seed ' || i, 'seed-' || i || '@email.com',
              false, 'seed:seed', NOW()
       FROM generate_series(1, $1) i`,
      [usuarios]
    )
  }

  const { rows } = await cliente.query("SELECT count(*)::int AS total FROM users")
  return rows[0].total
}

async function encerrar() {
  if (pool) await pool.end()
}

module.exports = { prepararBanco, encerrar }
