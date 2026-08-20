import { Task } from "../../../domain/entities/Task"
import { NotFoundError } from "../../../domain/errors"
import { TaskTitlePolicy } from "../../../domain/services/TaskTitlePolicy"
import { optionalUuid, requireText } from "../../../domain/validation"
import { TaskRepository } from "../../ports/TaskRepository"
import { UserRepository } from "../../ports/UserRepository"
import { GetTaskById } from "./GetTaskById"

interface UpdateTaskInput {
  title: unknown
  description?: unknown
  priority?: unknown
  assignee_id?: unknown
}

/**
 * Atualiza os campos editáveis de uma tarefa aplicando RN03 e RN05.
 *
 * As regras são verificadas antes de qualquer mutação, para não deixar a
 * entidade em estado inconsistente quando uma delas falha.
 */
export class UpdateTask {
  private readonly getTaskById: GetTaskById

  constructor(
    private readonly tasks: TaskRepository,
    private readonly users: UserRepository
  ) {
    this.getTaskById = new GetTaskById(tasks)
  }

  async execute(id: unknown, input: UpdateTaskInput): Promise<Task> {
    const task = await this.getTaskById.execute(id)

    const novoTitulo = requireText(input.title, "title", 3)
    const novoAssignee = optionalUuid(input.assignee_id, "assignee_id")

    // RN03
    if (novoAssignee && !(await this.users.findById(novoAssignee))) {
      throw new NotFoundError("Usuário responsável não encontrado")
    }

    // RN05
    const ocupante = await this.tasks.findByTitleInBoard(task.boardId, novoTitulo)
    TaskTitlePolicy.ensureTitleIsAvailable(ocupante?.id ?? null, task.id)

    task.updateDetails({
      title: novoTitulo,
      description: input.description,
      priority: input.priority,
      assigneeId: novoAssignee,
    })

    await this.tasks.save(task)
    return task
  }
}
