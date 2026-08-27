import { UserRepository } from "../../application/ports/UserRepository"
import { User } from "../../domain/entities/User"
import { pool } from "./pg"

const COLUMNS = "id, name, email, admin, password, created_at"

interface UserRow {
  id: string
  name: string
  email: string
  admin: boolean
  password: string
  created_at: Date
}

/** Adaptador de saída: implementação PostgreSQL da porta UserRepository. */
export class PgUserRepository implements UserRepository {
  async save(user: User): Promise<void> {
    await pool.query(
      `INSERT INTO users (id, name, email, admin, password, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             email = EXCLUDED.email,
             admin = EXCLUDED.admin,
             password = EXCLUDED.password`,
      [
        user.id,
        user.name,
        user.email,
        user.admin,
        user.passwordHash,
        user.createdAt,
      ]
    )
  }

  async findAll(): Promise<User[]> {
    const result = await pool.query<UserRow>(
      `SELECT ${COLUMNS} FROM users ORDER BY created_at DESC`
    )
    return result.rows.map(toEntity)
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE id = $1`,
      [id]
    )
    return result.rows[0] ? toEntity(result.rows[0]) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE email = $1`,
      [email]
    )
    return result.rows[0] ? toEntity(result.rows[0]) : null
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM users WHERE id = $1", [id])
  }
}

function toEntity(row: UserRow): User {
  return User.restore({
    id: row.id,
    name: row.name,
    email: row.email,
    admin: row.admin,
    passwordHash: row.password,
    createdAt: row.created_at,
  })
}
