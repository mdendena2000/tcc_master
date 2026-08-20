import { randomUUID } from "crypto"
import { ConflictError } from "../errors"
import { optionalText, optionalUuid, requireText, requireUuid } from "../validation"
import { Priority, priorityOrDefault } from "../value-objects/Priority"
import { TaskStatus } from "../value-objects/TaskStatus"

const TITLE_MIN_LENGTH = 3

/**
 * Sequência permitida de transição de status (RN02):
 * todo -> in_progress -> done. Retrocessos e saltos não são permitidos.
 *
 * A tabela vive no domínio, junto da regra que a consome.
 */
const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: "in_progress",
  in_progress: "done",
  done: null,
}

interface TaskProps {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  boardId: string
  assigneeId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Entidade Task (Tabela 11 do TCC).
 *
 * É a entidade central do experimento: a RN02 está encapsulada no método
 * changeStatus(), executável e verificável sem servidor HTTP e sem banco de
 * dados (Seção 4.8).
 *
 * No MVC a mesma regra reside no TaskController, entre a leitura de req.body
 * e a montagem da resposta, dependendo diretamente do framework Express.
 */
export class Task {
  private constructor(
    public readonly id: string,
    private _title: string,
    private _description: string | null,
    private _status: TaskStatus,
    private _priority: Priority,
    public readonly boardId: string,
    private _assigneeId: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(input: {
    title: unknown
    description?: unknown
    priority?: unknown
    boardId: unknown
    assigneeId?: unknown
  }): Task {
    const agora = new Date()
    return new Task(
      randomUUID(),
      requireText(input.title, "title", TITLE_MIN_LENGTH),
      optionalText(input.description, "description"),
      "todo",
      priorityOrDefault(input.priority),
      requireUuid(input.boardId, "board_id"),
      optionalUuid(input.assigneeId, "assignee_id"),
      agora,
      agora
    )
  }

  static restore(props: TaskProps): Task {
    return new Task(
      props.id,
      props.title,
      props.description,
      props.status,
      props.priority,
      props.boardId,
      props.assigneeId,
      props.createdAt,
      props.updatedAt
    )
  }

  get title(): string {
    return this._title
  }
  get description(): string | null {
    return this._description
  }
  get status(): TaskStatus {
    return this._status
  }
  get priority(): Priority {
    return this._priority
  }
  get assigneeId(): string | null {
    return this._assigneeId
  }
  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * RN02: avança o status para o próximo da sequência.
   *
   * Recusa retrocessos, saltos de etapa e repetição do status atual.
   */
  changeStatus(novoStatus: TaskStatus): void {
    if (NEXT_STATUS[this._status] !== novoStatus) {
      throw new ConflictError(
        `Transição de status inválida: ${this._status} -> ${novoStatus}`
      )
    }
    this._status = novoStatus
    this.touch()
  }

  /** Atualização dos campos editáveis (PUT /tasks/:id). */
  updateDetails(input: {
    title: unknown
    description?: unknown
    priority?: unknown
    assigneeId?: unknown
  }): void {
    this._title = requireText(input.title, "title", TITLE_MIN_LENGTH)
    this._description = optionalText(input.description, "description")
    this._priority = priorityOrDefault(input.priority)
    this._assigneeId = optionalUuid(input.assigneeId, "assignee_id")
    this.touch()
  }

  private touch(): void {
    this._updatedAt = new Date()
  }
}
