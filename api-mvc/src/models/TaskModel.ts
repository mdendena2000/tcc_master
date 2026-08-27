import { randomUUID } from "crypto"
import { TaskRepository } from "../repositories/TaskRepository"
import { BoardRepository } from "../repositories/BoardRepository"
import { UserRepository } from "../repositories/UserRepository"
import { Task, TaskPriority, TASK_PRIORITIES } from "./Task"
import { ConflictError, NotFoundError } from "./errors"
import {
  validateEnum,
  validateOptionalText,
  validateOptionalUuid,
  validateText,
  validateUuid,
} from "./validators"

const TITLE_MIN_LENGTH = 3
const DEFAULT_PRIORITY: TaskPriority = "medium"

interface CreateTaskInput {
  title: unknown
  description?: unknown
  priority?: unknown
  board_id: unknown
  assignee_id?: unknown
}

interface UpdateTaskInput {
  title: unknown
  description?: unknown
  priority?: unknown
  assignee_id?: unknown
}

export class TaskModel {
  private repository = new TaskRepository()
  private boardRepository = new BoardRepository()
  private userRepository = new UserRepository()

  async create(input: CreateTaskInput): Promise<Task> {
    const title = validateText(input.title, "title", TITLE_MIN_LENGTH)
    const description = validateOptionalText(input.description, "description")
    const boardId = validateUuid(input.board_id, "board_id")
    const assigneeId = validateOptionalUuid(input.assignee_id, "assignee_id")
    const priority = this.resolvePriority(input.priority)

    if (!(await this.boardRepository.findById(boardId))) {
      throw new NotFoundError("Quadro não encontrado")
    }

    await this.ensureAssigneeExists(assigneeId)
    await this.ensureTitleIsUniqueInBoard(boardId, title)

    const now = new Date()
    return this.repository.create({
      id: randomUUID(),
      title,
      description,
      status: "todo",
      priority,
      board_id: boardId,
      assignee_id: assigneeId,
      created_at: now,
      updated_at: now,
    })
  }

  async findAll(boardId?: unknown): Promise<Task[]> {
    if (boardId === undefined || boardId === null || boardId === "") {
      return this.repository.findAll()
    }
    return this.repository.findAll(validateUuid(boardId, "board_id"))
  }

  async findById(id: string): Promise<Task> {
    const task = await this.repository.findById(validateUuid(id, "id"))
    if (!task) throw new NotFoundError("Tarefa não encontrada")
    return task
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const title = validateText(input.title, "title", TITLE_MIN_LENGTH)
    const description = validateOptionalText(input.description, "description")
    const assigneeId = validateOptionalUuid(input.assignee_id, "assignee_id")
    const priority = this.resolvePriority(input.priority)

    const task = await this.findById(id)

    await this.ensureAssigneeExists(assigneeId)
    await this.ensureTitleIsUniqueInBoard(task.board_id, title, task.id)

    return this.repository.update(task.id, {
      title,
      description,
      priority,
      assignee_id: assigneeId,
    })
  }

  async delete(id: string): Promise<void> {
    const task = await this.findById(id)
    await this.repository.delete(task.id)
  }

  /**
   * Persiste o novo status. A verificação da transição permitida (RN02) é
   * responsabilidade do TaskController.
   */
  async saveStatus(task: Task, status: Task["status"]): Promise<Task> {
    return this.repository.updateStatus(task.id, status)
  }

  private resolvePriority(priority: unknown): TaskPriority {
    if (priority === undefined || priority === null || priority === "") {
      return DEFAULT_PRIORITY
    }
    return validateEnum(priority, "priority", TASK_PRIORITIES)
  }

  private async ensureAssigneeExists(assigneeId: string | null): Promise<void> {
    if (!assigneeId) return
    if (!(await this.userRepository.findById(assigneeId))) {
      throw new NotFoundError("Usuário responsável não encontrado")
    }
  }

  private async ensureTitleIsUniqueInBoard(
    boardId: string,
    title: string,
    currentTaskId?: string
  ): Promise<void> {
    const existing = await this.repository.findByTitleInBoard(boardId, title)
    if (existing && existing.id !== currentTaskId) {
      throw new ConflictError("Já existe uma tarefa com este título no quadro")
    }
  }
}