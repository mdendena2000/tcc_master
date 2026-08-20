import { BoardDeletionPolicy } from "../../../domain/services/BoardDeletionPolicy"
import { ACTIVE_STATUSES } from "../../../domain/value-objects/TaskStatus"
import { BoardRepository } from "../../ports/BoardRepository"
import { TaskRepository } from "../../ports/TaskRepository"
import { GetBoardById } from "./GetBoardById"

/**
 * Exclui um quadro aplicando a RN04.
 *
 * O caso de uso apenas orquestra: obtém a contagem pela porta e delega a
 * decisão ao serviço de domínio BoardDeletionPolicy. A regra em si permanece
 * testável isoladamente, sem qualquer dublê.
 */
export class DeleteBoard {
  private readonly getBoardById: GetBoardById

  constructor(
    private readonly boards: BoardRepository,
    private readonly tasks: TaskRepository
  ) {
    this.getBoardById = new GetBoardById(boards)
  }

  async execute(id: unknown): Promise<void> {
    const board = await this.getBoardById.execute(id)

    const ativas = await this.tasks.countByBoardAndStatuses(
      board.id,
      ACTIVE_STATUSES
    )

    // RN04
    BoardDeletionPolicy.ensureCanDelete(ativas)

    await this.boards.delete(board.id)
  }
}
