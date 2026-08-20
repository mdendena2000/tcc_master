import { Task } from "../../../domain/entities/Task"
import { requireTaskStatus } from "../../../domain/value-objects/TaskStatus"
import { TaskRepository } from "../../ports/TaskRepository"
import { GetTaskById } from "./GetTaskById"

/**
 * Aplica a RN02 (PATCH /tasks/:id/status).
 *
 * O caso de uso apenas orquestra: carrega a tarefa, delega a decisão à
 * entidade e persiste. A regra em si está em Task.changeStatus() e é
 * verificável sem passar por aqui.
 */
export class ChangeTaskStatus {
  private readonly getTaskById: GetTaskById

  constructor(private readonly tasks: TaskRepository) {
    this.getTaskById = new GetTaskById(tasks)
  }

  async execute(id: unknown, status: unknown): Promise<Task> {
    const novoStatus = requireTaskStatus(status)
    const task = await this.getTaskById.execute(id)

    // RN02 — decidida pela entidade
    task.changeStatus(novoStatus)

    await this.tasks.save(task)
    return task
  }
}
