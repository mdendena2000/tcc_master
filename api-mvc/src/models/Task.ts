export const TASK_STATUSES = ["todo", "in_progress", "done"] as const
export const TASK_PRIORITIES = ["low", "medium", "high"] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  board_id: string
  assignee_id: string | null
  created_at: Date
  updated_at: Date
}