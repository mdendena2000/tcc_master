import { pool } from "../database/pg"
import { User } from "../models/User"

/**
 * Colunas devolvidas nas consultas comuns.
 *
 * password é deliberadamente omitido: como o Controller serializa o objeto
 * do Model diretamente em JSON, incluir a coluna aqui exporia o hash nas
 * respostas da API. A senha só é lida pela consulta de autenticação.
 */
const COLUMNS = "id, name, email, admin, created_at"

export class UserRepository {
  async create(user: User, passwordHash: string): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, admin, password, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [user.id, user.name, user.email, user.admin, passwordHash, user.created_at]
    )
    return result.rows[0]
  }

  async findAll(): Promise<User[]> {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM users ORDER BY created_at DESC`
    )
    return result.rows
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM users WHERE id = $1`,
      [id]
    )
    return result.rows[0] ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM users WHERE email = $1`,
      [email]
    )
    return result.rows[0] ?? null
  }

  async findPasswordHashByEmail(email: string): Promise<string | null> {
    const result = await pool.query(
      "SELECT password FROM users WHERE email = $1",
      [email]
    )
    return result.rows[0]?.password ?? null
  }

  async update(
    id: string,
    name: string,
    email: string,
    admin: boolean
  ): Promise<User> {
    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2, admin = $3 WHERE id = $4
       RETURNING ${COLUMNS}`,
      [name, email, admin, id]
    )
    return result.rows[0]
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      passwordHash,
      id,
    ])
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM users WHERE id = $1", [id])
  }
}
