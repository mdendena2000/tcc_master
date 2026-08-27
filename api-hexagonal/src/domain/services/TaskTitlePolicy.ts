import { ConflictError } from "../errors"

/**
 * Serviço de domínio que implementa a RN05: não podem existir duas tarefas
 * com o mesmo título dentro do mesmo quadro.
 */
export const TaskTitlePolicy = {
  ensureTitleIsAvailable(
    ocupanteId: string | null,
    tarefaAtualId?: string
  ): void {
    if (ocupanteId !== null && ocupanteId !== tarefaAtualId) {
      throw new ConflictError("Já existe uma tarefa com este título no quadro")
    }
  },
}
