import { TaskRepository } from "../../ports/TaskRepository"
import { GetTaskById } from "./GetTaskById"

export class DeleteTask {
  private readonly getTaskById: GetTaskById

  constructor(private readonly tasks: TaskRepository) {
    this.getTaskById = new GetTaskById(tasks)
  }

  async execute(id: unknown): Promise<void> {
    const task = await this.getTaskById.execute(id)
    await this.tasks.delete(task.id)
  }
}
