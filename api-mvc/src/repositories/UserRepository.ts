import { pool } from "../database/pg"
import { User } from "../models/User"

const COLUMNS = "id, name, email, admin, created_at"

export class UserRepository {
  async create(user: User): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, admin, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [user.id, user.name, user.email, user.admin, user.created_at]
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

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM users WHERE id = $1", [id])
  }
}