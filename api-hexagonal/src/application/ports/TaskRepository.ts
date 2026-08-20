import { Task } from "../../domain/entities/Task"
import { TaskStatus } from "../../domain/value-objects/TaskStatus"

/**
 * Porta secundária (outbound) de persistência de tarefas.
 *
 * Note que quem decide quais status contam como ativos é o domínio
 * (ACTIVE_STATUSES): o adaptador apenas executa a contagem que lhe é pedida.
 */
export interface TaskRepository {
  save(task: Task): Promise<void>
  findAll(boardId?: string): Promise<Task[]>
  findById(id: string): Promise<Task | null>
  findByTitleInBoard(boardId: string, title: string): Promise<Task | null>
  delete(id: string): Promise<void>
  countByBoardAndStatuses(
    boardId: string,
    statuses: readonly TaskStatus[]
  ): Promise<number>
}
