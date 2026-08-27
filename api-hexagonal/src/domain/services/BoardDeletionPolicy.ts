import { ConflictError } from "../errors"

/**
 * Serviço de domínio que implementa a RN04: um quadro não pode ser excluído
 * enquanto possuir tarefas com status todo ou in_progress.
 */
export const BoardDeletionPolicy = {
  ensureCanDelete(activeTaskCount: number): void {
    if (activeTaskCount > 0) {
      throw new ConflictError(
        "O quadro possui tarefas pendentes ou em andamento e não pode ser excluído"
      )
    }
  },
}
