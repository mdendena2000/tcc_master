import { Task } from "../../../domain/entities/Task"
import { NotFoundError } from "../../../domain/errors"
import { requireUuid } from "../../../domain/validation"
import { TaskRepository } from "../../ports/TaskRepository"

export class GetTaskById {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(id: unknown): Promise<Task> {
    const task = await this.tasks.findById(requireUuid(id, "id"))
    if (!task) throw new NotFoundError("Tarefa não encontrada")
    return task
  }
}
