import { Task } from "../../../domain/entities/Task"
import { NotFoundError } from "../../../domain/errors"
import { TaskTitlePolicy } from "../../../domain/services/TaskTitlePolicy"
import { BoardRepository } from "../../ports/BoardRepository"
import { TaskRepository } from "../../ports/TaskRepository"
import { UserRepository } from "../../ports/UserRepository"

interface CreateTaskInput {
  title: unknown
  description?: unknown
  priority?: unknown
  board_id: unknown
  assignee_id?: unknown
}

/** Cria uma tarefa aplicando a RN03 e a RN05. */
export class CreateTask {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly boards: BoardRepository,
    private readonly users: UserRepository
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = Task.create({
      title: input.title,
      description: input.description,
      priority: input.priority,
      boardId: input.board_id,
      assigneeId: input.assignee_id,
    })

    if (!(await this.boards.findById(task.boardId))) {
      throw new NotFoundError("Quadro não encontrado")
    }

    // RN03
    if (task.assigneeId && !(await this.users.findById(task.assigneeId))) {
      throw new NotFoundError("Usuário responsável não encontrado")
    }

    // RN05
    const ocupante = await this.tasks.findByTitleInBoard(task.boardId, task.title)
    TaskTitlePolicy.ensureTitleIsAvailable(ocupante?.id ?? null)

    await this.tasks.save(task)
    return task
  }
}
