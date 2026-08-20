import { ConflictError } from "../errors"

/**
 * Serviço de domínio que implementa a RN05: não podem existir duas tarefas
 * com o mesmo título dentro do mesmo quadro.
 *
 * Função pura (Figura 11): recebe o identificador da tarefa que já ocupa o
 * título, se houver, e o da tarefa sendo editada. Quem consulta o
 * repositório é o caso de uso.
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
