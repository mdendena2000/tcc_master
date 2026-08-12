import { pool } from "../database/pg"
import { Board } from "../models/Board"

/**
 * Camada de acesso a dados do recurso Boards (Figura 10 do TCC).
 *
 * Classe concreta, sem interface, seguindo a mesma decisão adotada no
 * UserRepository (Seção 4.9).
 */
export class BoardRepository {
  async create(board: Board): Promise<Board> {
    const result = await pool.query(
      `INSERT INTO boards (id, name, owner_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, owner_id, created_at`,
      [board.id, board.name, board.owner_id, board.created_at]
    )
    return result.rows[0]
  }

  async findAll(): Promise<Board[]> {
    const result = await pool.query(
      "SELECT id, name, owner_id, created_at FROM boards ORDER BY created_at DESC"
    )
    return result.rows
  }

  async findById(id: string): Promise<Board | null> {
    const result = await pool.query(
      "SELECT id, name, owner_id, created_at FROM boards WHERE id = $1",
      [id]
    )
    return result.rows[0] ?? null
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM boards WHERE id = $1", [id])
  }

  /**
   * Quantidade de tarefas do quadro ainda não concluídas, ou seja, com status
   * todo ou in_progress. Consulta usada para verificar a RN04 antes da
   * exclusão do quadro.
   */
  async countActiveTasks(boardId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) AS total FROM tasks
       WHERE board_id = $1 AND status IN ('todo', 'in_progress')`,
      [boardId]
    )
    return Number(result.rows[0].total)
  }
}