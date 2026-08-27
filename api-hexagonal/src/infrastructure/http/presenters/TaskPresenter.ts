import { Task } from "../../../domain/entities/Task"

export const TaskPresenter = {
  toJSON(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      board_id: task.boardId,
      assignee_id: task.assigneeId,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    }
  },

  toJSONList(tasks: Task[]) {
    return tasks.map(TaskPresenter.toJSON)
  },
}
