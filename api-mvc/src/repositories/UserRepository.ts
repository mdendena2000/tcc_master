import { pool } from "../database/pg"
import { User } from "../models/User"

/**
 * Camada de acesso a dados do recurso Users (Figura 10 do TCC).
 *
 * Classe concreta, sem interface: no MVC adotado neste trabalho o Model
 * depende diretamente desta implementação. A inversão dessa dependência por
 * meio de uma porta é característica exclusiva da versão Hexagonal
 * (Seção 4.9).
 */
export class UserRepository {
  async create(user: User): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, created_at`,
      [user.id, user.name, user.email, user.created_at]
    )
    return result.rows[0]
  }

  async findAll(): Promise<User[]> {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC"
    )
    return result.rows
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [id]
    )
    return result.rows[0] ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE email = $1",
      [email]
    )
    return result.rows[0] ?? null
  }

  async update(id: string, name: string, email: string): Promise<User> {
    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2 WHERE id = $3
       RETURNING id, name, email, created_at`,
      [name, email, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM users WHERE id = $1", [id])
  }
}