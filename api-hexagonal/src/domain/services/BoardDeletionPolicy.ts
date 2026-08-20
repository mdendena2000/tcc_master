import { ConflictError } from "../errors"

/**
 * Serviço de domínio que implementa a RN04: um quadro não pode ser excluído
 * enquanto possuir tarefas com status todo ou in_progress.
 *
 * É uma função pura, sem dependência de infraestrutura (Figura 11 do TCC):
 * recebe a quantidade de tarefas ativas e decide. Quem obtém esse número é o
 * caso de uso, por meio de uma porta.
 *
 * No MVC equivalente esta regra vive dentro do BoardModel, misturada à
 * orquestração da persistência.
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
