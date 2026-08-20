import { ValidationError } from "../errors"

/**
 * Value object Priority (Tabela 11 do TCC).
 */
export const TASK_PRIORITIES = ["low", "medium", "high"] as const

export type Priority = (typeof TASK_PRIORITIES)[number]

export const DEFAULT_PRIORITY: Priority = "medium"

export function requirePriority(value: unknown): Priority {
  if (typeof value !== "string" || !TASK_PRIORITIES.includes(value as Priority)) {
    throw new ValidationError(
      `O campo priority deve ser um dos valores: ${TASK_PRIORITIES.join(", ")}`
    )
  }
  return value as Priority
}

/** Aplica o padrão medium quando a prioridade não é informada. */
export function priorityOrDefault(value: unknown): Priority {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_PRIORITY
  }
  return requirePriority(value)
}
