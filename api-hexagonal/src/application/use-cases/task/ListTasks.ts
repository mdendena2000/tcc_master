import { Task } from "../../../domain/entities/Task"
import { requireUuid } from "../../../domain/validation"
import { TaskRepository } from "../../ports/TaskRepository"

/** Lista tarefas, opcionalmente filtrando por quadro (Tabela 14). */
export class ListTasks {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(boardId?: unknown): Promise<Task[]> {
    if (boardId === undefined || boardId === null || boardId === "") {
      return this.tasks.findAll()
    }
    return this.tasks.findAll(requireUuid(boardId, "board_id"))
  }
}
