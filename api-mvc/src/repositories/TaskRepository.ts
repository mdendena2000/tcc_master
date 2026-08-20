import { pool } from "../database/pg"
import { Task, TaskPriority, TaskStatus } from "../models/Task"

const COLUMNS = `id, title, description, status, priority, board_id,
                 assignee_id, created_at, updated_at`

export interface TaskUpdateFields {
  title: string
  description: string | null
  priority: TaskPriority
  assignee_id: string | null
}

export class TaskRepository {
  async create(task: Task): Promise<Task> {
    const result = await pool.query(
      `INSERT INTO tasks (id, title, description, status, priority, board_id,
                          assignee_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${COLUMNS}`,
      [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.board_id,
        task.assignee_id,
        task.created_at,
        task.updated_at,
      ]
    )
    return result.rows[0]
  }

  async findAll(boardId?: string): Promise<Task[]> {
    if (boardId) {
      const result = await pool.query(
        `SELECT ${COLUMNS} FROM tasks WHERE board_id = $1 ORDER BY created_at DESC`,
        [boardId]
      )
      return result.rows
    }

    const result = await pool.query(
      `SELECT ${COLUMNS} FROM tasks ORDER BY created_at DESC`
    )
    return result.rows
  }

  async findById(id: string): Promise<Task | null> {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM tasks WHERE id = $1`,
      [id]
    )
    return result.rows[0] ?? null
  }

  async findByTitleInBoard(boardId: string, title: string): Promise<Task | null> {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM tasks WHERE board_id = $1 AND title = $2`,
      [boardId, title]
    )
    return result.rows[0] ?? null
  }

  async update(id: string, fields: TaskUpdateFields): Promise<Task> {
    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3, assignee_id = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING ${COLUMNS}`,
      [fields.title, fields.description, fields.priority, fields.assignee_id, id]
    )
    return result.rows[0]
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const result = await pool.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING ${COLUMNS}`,
      [status, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM tasks WHERE id = $1", [id])
  }
}