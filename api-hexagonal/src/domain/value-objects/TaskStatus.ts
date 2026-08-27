import { ValidationError } from "../errors"

/**
 * Concentra o vocabulário de status do domínio, incluindo a definição do que
 * torna uma tarefa "ativa" — conhecimento exigido pela RN04 e que, portanto,
 * não pode residir em uma consulta SQL.
 */
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const ACTIVE_STATUSES: readonly TaskStatus[] = ["todo", "in_progress"]

export function requireTaskStatus(value: unknown): TaskStatus {
  if (typeof value !== "string" || !TASK_STATUSES.includes(value as TaskStatus)) {
    throw new ValidationError(
      `O campo status deve ser um dos valores: ${TASK_STATUSES.join(", ")}`
    )
  }
  return value as TaskStatus
}
