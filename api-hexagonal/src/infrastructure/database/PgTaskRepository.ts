import { TaskRepository } from "../../application/ports/TaskRepository"
import { Task } from "../../domain/entities/Task"
import { Priority } from "../../domain/value-objects/Priority"
import { TaskStatus } from "../../domain/value-objects/TaskStatus"
import { pool } from "./pg"

const COLUMNS = `id, title, description, status, priority, board_id,
                 assignee_id, created_at, updated_at`

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  board_id: string
  assignee_id: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Adaptador de saída: implementação PostgreSQL da porta TaskRepository.
 *
 * Recebe do núcleo quais status devem ser contados; não decide quais são
 * "ativos" — essa é uma regra do domínio (RN04).
 */
export class PgTaskRepository implements TaskRepository {
  async save(task: Task): Promise<void> {
    await pool.query(
      `INSERT INTO tasks (id, title, description, status, priority, board_id,
                          assignee_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             assignee_id = EXCLUDED.assignee_id,
             updated_at = EXCLUDED.updated_at`,
      [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.boardId,
        task.assigneeId,
        task.createdAt,
        task.updatedAt,
      ]
    )
  }

  async findAll(boardId?: string): Promise<Task[]> {
    const result = boardId
      ? await pool.query<TaskRow>(
          `SELECT ${COLUMNS} FROM tasks WHERE board_id = $1 ORDER BY created_at DESC`,
          [boardId]
        )
      : await pool.query<TaskRow>(
          `SELECT ${COLUMNS} FROM tasks ORDER BY created_at DESC`
        )
    return result.rows.map(toEntity)
  }

  async findById(id: string): Promise<Task | null> {
    const result = await pool.query<TaskRow>(
      `SELECT ${COLUMNS} FROM tasks WHERE id = $1`,
      [id]
    )
    return result.rows[0] ? toEntity(result.rows[0]) : null
  }

  async findByTitleInBoard(boardId: string, title: string): Promise<Task | null> {
    const result = await pool.query<TaskRow>(
      `SELECT ${COLUMNS} FROM tasks WHERE board_id = $1 AND title = $2`,
      [boardId, title]
    )
    return result.rows[0] ? toEntity(result.rows[0]) : null
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM tasks WHERE id = $1", [id])
  }

  async countByBoardAndStatuses(
    boardId: string,
    statuses: readonly TaskStatus[]
  ): Promise<number> {
    const result = await pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM tasks
       WHERE board_id = $1 AND status = ANY($2::task_status[])`,
      [boardId, statuses]
    )
    return Number(result.rows[0].total)
  }
}

function toEntity(row: TaskRow): Task {
  return Task.restore({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    boardId: row.board_id,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}
