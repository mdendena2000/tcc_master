import { BoardRepository } from "../../application/ports/BoardRepository"
import { Board } from "../../domain/entities/Board"
import { pool } from "./pg"

const COLUMNS = "id, name, owner_id, created_at"

interface BoardRow {
  id: string
  name: string
  owner_id: string
  created_at: Date
}

/** Adaptador de saída: implementação PostgreSQL da porta BoardRepository. */
export class PgBoardRepository implements BoardRepository {
  async save(board: Board): Promise<void> {
    await pool.query(
      `INSERT INTO boards (id, name, owner_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [board.id, board.name, board.ownerId, board.createdAt]
    )
  }

  async findAll(): Promise<Board[]> {
    const result = await pool.query<BoardRow>(
      `SELECT ${COLUMNS} FROM boards ORDER BY created_at DESC`
    )
    return result.rows.map(toEntity)
  }

  async findById(id: string): Promise<Board | null> {
    const result = await pool.query<BoardRow>(
      `SELECT ${COLUMNS} FROM boards WHERE id = $1`,
      [id]
    )
    return result.rows[0] ? toEntity(result.rows[0]) : null
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM boards WHERE id = $1", [id])
  }
}

function toEntity(row: BoardRow): Board {
  return Board.restore({
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  })
}
